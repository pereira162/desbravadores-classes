const express = require('express');
const cors = require('cors');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { db, dbContextMiddleware, initDatabase, loadCardsMetadata, recordAudit } = require('./db');
const {
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
  checkProgressPermission,
} = require('./auth');
const {
  getSmtpConfig,
  sendVerificationEmail,
  sendLeaderInviteEmail,
  sendPasswordResetEmail,
  sendTestSmtpEmail,
  verifyGoogleIdToken,
} = require('./mailer');

initDatabase();

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(dbContextMiddleware);

// Static files for official logos and downloaded PDFs
const DATA_DIR = path.resolve(__dirname, '../../data');
app.use('/data', express.static(DATA_DIR));

function generateSixDigitCode() {
  return String(crypto.randomInt(100000, 999999));
}

// Helper to format user row
function formatUser(row) {
  if (!row) return null;
  let assignedClasses = [];
  try {
    assignedClasses = JSON.parse(row.assigned_classes_json || '[]');
  } catch {
    assignedClasses = [];
  }
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    unit_id: row.unit_id,
    assigned_classes: assignedClasses,
    active: Boolean(row.active),
    is_demo: Boolean(row.is_demo),
    email_verified: row.email_verified === undefined ? true : Boolean(row.email_verified),
    invite_status: row.invite_status || 'ACTIVE',
    avatar_url: row.avatar_url || null,
    last_login_at: row.last_login_at,
    created_at: row.created_at,
  };
}

// Auth Middleware
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const payload = verifyToken(token);
  if (!payload || !payload.id) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada. Faça login novamente.' });
  }
  const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.id);
  if (!userRow || !userRow.active) {
    return res.status(401).json({ error: 'Usuário inativo ou não encontrado.' });
  }
  req.user = formatUser(userRow);
  next();
}

// ============================================================================
// 1. AUTHENTICATION, ONBOARDING, GOOGLE SIGN-IN & EMAIL RECOVERY ROUTES
// ============================================================================
app.get('/api/auth/demo-accounts', (req, res) => {
  const settings = db.prepare('SELECT * FROM club_settings WHERE id = 1').get() || {};
  const demoEnabled = settings.demo_mode_enabled === undefined ? true : Boolean(settings.demo_mode_enabled);

  const rows = demoEnabled
    ? db
        .prepare(
          `SELECT u.id, u.name, u.email, u.role, u.unit_id, u.assigned_classes_json, u.is_demo, un.name as unit_name
           FROM users u
           LEFT JOIN units un ON un.id = u.unit_id
           WHERE u.active = 1 AND u.is_demo = 1
           ORDER BY CASE u.role
             WHEN 'ADMIN' THEN 1
             WHEN 'DIRETOR' THEN 2
             WHEN 'SECRETARIO' THEN 3
             WHEN 'INSTRUTOR' THEN 4
             WHEN 'CONSELHEIRO' THEN 5
             ELSE 6 END, u.name ASC`
        )
        .all()
    : [];

  const realDirectorsCount = db
    .prepare("SELECT COUNT(*) as c FROM users WHERE is_demo = 0 AND role IN ('DIRETOR', 'ADMIN') AND active = 1")
    .get().c;

  const smtpCfg = getSmtpConfig(settings);

  res.json({
    club_name: settings.club_name || 'Clube de Desbravadores',
    setup_completed: Boolean(settings.setup_completed || realDirectorsCount > 0),
    demo_mode_enabled: demoEnabled,
    smtp_configured: smtpCfg.isConfigured,
    google_client_id: settings.google_client_id || process.env.GOOGLE_CLIENT_ID || '',
    accounts: rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      unit_id: r.unit_id,
      unit_name: r.unit_name,
      assigned_classes: JSON.parse(r.assigned_classes_json || '[]'),
    })),
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Informe e-mail e senha.' });
  }
  const row = db
    .prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)')
    .get(String(email).trim());

  if (!row || !verifyPassword(String(password), row.password_hash)) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  }
  if (!row.active) {
    return res.status(403).json({ error: 'Esta conta de líder está desativada.' });
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(now, row.id);

  const user = formatUser({ ...row, last_login_at: now });
  const token = createToken({ id: user.id, email: user.email, role: user.role });

  res.json({ token, user });
});

// Login ou Ativação de Convite com Conta Google (Google Identity Services)
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential, invite_token } = req.body || {};
    const settings = db.prepare('SELECT * FROM club_settings WHERE id = 1').get() || {};
    const expectedClientId = settings.google_client_id || process.env.GOOGLE_CLIENT_ID || '';

    const googleUser = await verifyGoogleIdToken(credential, expectedClientId);
    const now = new Date().toISOString();

    let row = null;
    if (invite_token) {
      row = db.prepare('SELECT * FROM users WHERE invite_token = ?').get(String(invite_token).trim());
    }
    if (!row) {
      row = db
        .prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)')
        .get(googleUser.email);
    }

    if (!row) {
      return res.status(403).json({
        error: `O e-mail Google (${googleUser.email}) ainda não foi convidado pela Diretoria do Clube. Peça um convite ao Diretor ou use o Primeiro Acesso do Diretor.`,
      });
    }
    if (!row.active) {
      return res.status(403).json({ error: 'Esta conta de líder está desativada.' });
    }

    db.prepare(`
      UPDATE users
      SET google_sub = ?, avatar_url = ?, email_verified = 1, invite_status = 'ACTIVE', invite_token = NULL, last_login_at = ?
      WHERE id = ?
    `).run(googleUser.googleSub, googleUser.picture, now, row.id);

    const updatedRow = db.prepare('SELECT * FROM users WHERE id = ?').get(row.id);
    const user = formatUser(updatedRow);
    const token = createToken({ id: user.id, email: user.email, role: user.role });

    res.json({ token, user });
  } catch (err) {
    res.status(401).json({ error: err.message || 'Falha na autenticação com o Google.' });
  }
});

// Primeiro Acesso: Criação da Conta Oficial do Diretor do Clube + Configuração Opcional de Gmail SMTP
app.post('/api/auth/setup-director', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      club_name,
      club_region,
      smtp_user,
      smtp_pass,
      google_client_id,
      disable_demo_accounts = false,
    } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Informe seu nome completo, e-mail real e senha.' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const existing = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(cleanEmail);
    const now = new Date().toISOString();
    const verificationCode = generateSixDigitCode();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const prevSettings = db.prepare('SELECT * FROM club_settings WHERE id = 1').get() || {};
    const finalClubName = club_name ? String(club_name).trim() : prevSettings.club_name;
    const finalClubRegion = club_region ? String(club_region).trim() : prevSettings.club_region;
    const finalSmtpUser = smtp_user !== undefined ? String(smtp_user).trim() : prevSettings.smtp_user;
    const finalSmtpPass =
      smtp_pass !== undefined ? String(smtp_pass).replace(/\s+/g, '') : prevSettings.smtp_pass;
    const finalGoogleClientId =
      google_client_id !== undefined ? String(google_client_id).trim() : prevSettings.google_client_id;

    let userId = existing ? existing.id : `usr-dir-${Date.now().toString(36)}`;
    const pwdHash = hashPassword(String(password));

    db.exec('BEGIN');
    try {
      db.prepare(`
        UPDATE club_settings
        SET club_name = ?, club_region = ?, smtp_user = ?, smtp_pass = ?, smtp_from_name = ?,
            google_client_id = ?, demo_mode_enabled = ?, setup_completed = 1, updated_at = ?
        WHERE id = 1
      `).run(
        finalClubName,
        finalClubRegion,
        finalSmtpUser,
        finalSmtpPass,
        finalClubName,
        finalGoogleClientId,
        disable_demo_accounts ? 0 : 1,
        now
      );

      if (disable_demo_accounts) {
        db.prepare('UPDATE users SET active = 0 WHERE is_demo = 1').run();
      }

      if (existing) {
        db.prepare(`
          UPDATE users
          SET name = ?, password_hash = ?, role = 'DIRETOR', assigned_classes_json = '["*"]',
              active = 1, is_demo = 0, verification_code = ?, verification_expires_at = ?, last_login_at = ?
          WHERE id = ?
        `).run(String(name).trim(), pwdHash, verificationCode, expiresAt, now, userId);
      } else {
        db.prepare(`
          INSERT INTO users (
            id, name, email, password_hash, role, unit_id, assigned_classes_json,
            active, is_demo, email_verified, invite_status, verification_code, verification_expires_at,
            last_login_at, created_at
          ) VALUES (?, ?, ?, ?, 'DIRETOR', NULL, '["*"]', 1, 0, 0, 'PENDING_VERIFICATION', ?, ?, ?, ?)
        `).run(userId, String(name).trim(), cleanEmail, pwdHash, verificationCode, expiresAt, now, now);
      }

      recordAudit({
        user: { id: userId, name: String(name).trim(), role: 'DIRETOR' },
        action: 'DIRECTOR_INITIAL_SETUP',
        entityType: 'USER',
        entityId: userId,
        summary: `Diretor(a) "${name}" (${cleanEmail}) configurou o acesso oficial do clube "${finalClubName}".`,
        newState: { email: cleanEmail, club_name: finalClubName, disable_demo_accounts },
        createdAt: now,
      });

      db.exec('COMMIT');
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }

    const updatedSettings = db.prepare('SELECT * FROM club_settings WHERE id = 1').get();
    let emailResult = { sent: false, reason: 'SMTP_NOT_CONFIGURED' };
    try {
      emailResult = await sendVerificationEmail({
        clubSettings: updatedSettings,
        toEmail: cleanEmail,
        toName: String(name).trim(),
        verificationCode,
      });
    } catch (mailErr) {
      emailResult = { sent: false, reason: mailErr.message };
    }

    // Se o SMTP ainda não foi configurado, marca como verificado automaticamente para não bloquear o Diretor
    if (!emailResult.sent) {
      db.prepare("UPDATE users SET email_verified = 1, invite_status = 'ACTIVE' WHERE id = ?").run(userId);
    }

    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const user = formatUser(userRow);
    const token = createToken({ id: user.id, email: user.email, role: user.role });

    res.json({
      success: true,
      token,
      user,
      email_sent: emailResult.sent,
      email_notice: emailResult.sent
        ? `Enviamos um código de confirmação de 6 dígitos para ${cleanEmail}.`
        : 'Sua conta de Diretor foi criada e ativada! Configure o Gmail + Senha de App na aba "Líderes & Clube" para disparar e-mails reais.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Erro ao configurar conta do Diretor.' });
  }
});

// Confirmação de E-mail com Código de 6 dígitos
app.post('/api/auth/verify-email', (req, res) => {
  const { email, code } = req.body || {};
  if (!email || !code) {
    return res.status(400).json({ error: 'Informe o e-mail e o código de 6 dígitos.' });
  }
  const row = db
    .prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)')
    .get(String(email).trim());

  if (!row) {
    return res.status(404).json({ error: 'Conta não encontrada.' });
  }
  if (String(row.verification_code || '').trim() !== String(code).trim()) {
    return res.status(400).json({ error: 'Código de verificação inválido.' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE users
    SET email_verified = 1, invite_status = 'ACTIVE', verification_code = NULL, last_login_at = ?
    WHERE id = ?
  `).run(now, row.id);

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(row.id);
  const user = formatUser(updated);
  const token = createToken({ id: user.id, email: user.email, role: user.role });

  res.json({ success: true, token, user });
});

// Consulta pública de Token de Convite (?invite=TOKEN)
app.get('/api/auth/invite-info', (req, res) => {
  const token = String(req.query.token || '').trim();
  if (!token) {
    return res.status(400).json({ error: 'Token de convite não informado.' });
  }
  const row = db
    .prepare(
      `SELECT u.*, un.name as unit_name
       FROM users u
       LEFT JOIN units un ON un.id = u.unit_id
       WHERE u.invite_token = ?`
    )
    .get(token);

  if (!row) {
    return res.status(404).json({ error: 'Convite inválido, já utilizado ou expirado.' });
  }

  const settings = db.prepare('SELECT * FROM club_settings WHERE id = 1').get() || {};
  res.json({
    invite: {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      unit_name: row.unit_name || null,
      assigned_classes: JSON.parse(row.assigned_classes_json || '[]'),
      club_name: settings.club_name || 'Clube de Desbravadores',
    },
  });
});

// Aceitar Convite e Definir Senha Pessoal
app.post('/api/auth/accept-invite', (req, res) => {
  const { token, password, name } = req.body || {};
  if (!token || !password) {
    return res.status(400).json({ error: 'Informe o token de convite e sua nova senha.' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'Sua senha deve ter no mínimo 6 caracteres.' });
  }

  const row = db
    .prepare('SELECT * FROM users WHERE invite_token = ?')
    .get(String(token).trim());

  if (!row) {
    return res.status(404).json({ error: 'Convite não encontrado ou já ativado.' });
  }

  const now = new Date().toISOString();
  const pwdHash = hashPassword(String(password));
  const finalName = name ? String(name).trim() : row.name;

  db.prepare(`
    UPDATE users
    SET name = ?, password_hash = ?, active = 1, email_verified = 1,
        invite_status = 'ACTIVE', invite_token = NULL, last_login_at = ?
    WHERE id = ?
  `).run(finalName, pwdHash, now, row.id);

  recordAudit({
    user: { id: row.id, name: finalName, role: row.role },
    action: 'LEADER_INVITE_ACCEPTED',
    entityType: 'USER',
    entityId: row.id,
    summary: `Líder "${finalName}" (${row.email}) aceitou o convite e ativou sua conta (${row.role}).`,
    createdAt: now,
  });

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(row.id);
  const user = formatUser(updated);
  const jwtToken = createToken({ id: user.id, email: user.email, role: user.role });

  res.json({ success: true, token: jwtToken, user });
});

// Solicitar Recuperação de Senha por E-mail ("Esqueci minha senha")
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Informe seu endereço de e-mail.' });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const row = db
      .prepare('SELECT * FROM users WHERE LOWER(email) = ? AND active = 1')
      .get(cleanEmail);

    if (!row) {
      return res.status(404).json({
        error: 'Não encontramos nenhum líder ativo cadastrado com este endereço de e-mail.',
      });
    }

    const resetCode = generateSixDigitCode();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    db.prepare(`
      UPDATE users
      SET reset_code = ?, reset_expires_at = ?
      WHERE id = ?
    `).run(resetCode, expiresAt, row.id);

    const settings = db.prepare('SELECT * FROM club_settings WHERE id = 1').get() || {};
    const mailRes = await sendPasswordResetEmail({
      clubSettings: settings,
      toEmail: row.email,
      toName: row.name,
      resetCode,
    });

    if (!mailRes.sent) {
      return res.status(400).json({
        error:
          'O servidor de envio de e-mail (SMTP Gmail) ainda não foi configurado pelo Diretor do Clube. Peça ao Diretor para redefinir sua senha ou configurar o SMTP.',
      });
    }

    res.json({
      success: true,
      message: `Enviamos um código de 6 dígitos para ${row.email}. Verifique sua caixa de entrada!`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Erro ao enviar e-mail de recuperação.' });
  }
});

// Redefinir Senha usando o Código de 6 dígitos recebido por E-mail
app.post('/api/auth/reset-password', (req, res) => {
  const { email, code, new_password } = req.body || {};
  if (!email || !code || !new_password) {
    return res.status(400).json({ error: 'Informe seu e-mail, o código de 6 dígitos e a nova senha.' });
  }
  if (String(new_password).length < 6) {
    return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' });
  }

  const row = db
    .prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)')
    .get(String(email).trim());

  if (!row || !row.reset_code) {
    return res.status(400).json({ error: 'Solicitação de recuperação inválida ou expirada.' });
  }
  if (String(row.reset_code).trim() !== String(code).trim()) {
    return res.status(400).json({ error: 'Código de recuperação incorreto.' });
  }
  if (row.reset_expires_at && new Date(row.reset_expires_at) < new Date()) {
    return res.status(400).json({ error: 'Este código expirou. Solicite um novo código.' });
  }

  const now = new Date().toISOString();
  const pwdHash = hashPassword(String(new_password));

  db.prepare(`
    UPDATE users
    SET password_hash = ?, reset_code = NULL, reset_expires_at = NULL, email_verified = 1,
        invite_status = 'ACTIVE', last_login_at = ?
    WHERE id = ?
  `).run(pwdHash, now, row.id);

  recordAudit({
    user: { id: row.id, name: row.name, role: row.role },
    action: 'PASSWORD_RESET',
    entityType: 'USER',
    entityId: row.id,
    summary: `Líder "${row.name}" (${row.email}) redefiniu sua senha via código de e-mail.`,
    createdAt: now,
  });

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(row.id);
  const user = formatUser(updated);
  const token = createToken({ id: user.id, email: user.email, role: user.role });

  res.json({ success: true, token, user });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// ============================================================================
// 2. BOOTSTRAP & FULL DATA QUERY
// ============================================================================
const cardsMeta = loadCardsMetadata();

app.get('/api/bootstrap', requireAuth, (req, res) => {
  const clubSettings = db.prepare('SELECT * FROM club_settings WHERE id = 1').get();

  const classes = db
    .prepare('SELECT * FROM classes_catalog ORDER BY display_order ASC')
    .all();

  const rawRequirements = db
    .prepare('SELECT * FROM requirements_catalog ORDER BY display_order ASC')
    .all();

  const requirements = rawRequirements.map((r) => ({
    id: r.id,
    class_slug: r.class_slug,
    base_class_slug: r.base_class_slug,
    class_type: r.class_type,
    section_code: r.section_code,
    section_name: r.section_name,
    code: r.code,
    title: r.title,
    description: r.description,
    category: r.category,
    execution_context: r.execution_context,
    tags: JSON.parse(r.tags_json || '[]'),
    equivalence_group: r.equivalence_group,
    selection_rule: r.selection_rule,
    sub_items: JSON.parse(r.sub_items_json || '[]'),
    book_info: r.book_info_json ? JSON.parse(r.book_info_json) : null,
    display_order: r.display_order,
  }));

  const units = db.prepare('SELECT * FROM units ORDER BY name ASC').all();

  const rawPathfinders = db
    .prepare(
      `SELECT p.*, u.name as unit_name, u.color_hex as unit_color
       FROM pathfinders p
       LEFT JOIN units u ON u.id = p.unit_id
       ORDER BY p.name ASC`
    )
    .all();

  const enrollments = db
    .prepare(
      `SELECT ce.*, cc.name as class_name, cc.class_type, cc.color_hex, cc.min_age, cc.base_slug
       FROM class_enrollments ce
       JOIN classes_catalog cc ON cc.slug = ce.class_slug
       ORDER BY cc.display_order ASC`
    )
    .all();

  const enrollmentsByPathfinder = {};
  for (const enr of enrollments) {
    if (!enrollmentsByPathfinder[enr.pathfinder_id]) {
      enrollmentsByPathfinder[enr.pathfinder_id] = [];
    }
    enrollmentsByPathfinder[enr.pathfinder_id].push(enr);
  }

  const pathfinders = rawPathfinders.map((p) => ({
    ...p,
    active: Boolean(p.active),
    enrollments: enrollmentsByPathfinder[p.id] || [],
  }));

  const rawProgress = db.prepare('SELECT * FROM progress_records').all();
  const progressRecords = rawProgress.map((pr) => ({
    ...pr,
    completed_sub_items: JSON.parse(pr.completed_sub_items_json || '[]'),
  }));

  const rawEvents = db
    .prepare('SELECT * FROM activity_events ORDER BY scheduled_date DESC, created_at DESC')
    .all();
  const eventReqs = db.prepare('SELECT * FROM activity_event_requirements').all();
  const eventAtts = db.prepare('SELECT * FROM activity_event_attendees').all();

  const reqsByEvent = {};
  for (const er of eventReqs) {
    if (!reqsByEvent[er.event_id]) reqsByEvent[er.event_id] = [];
    reqsByEvent[er.event_id].push(er.requirement_id);
  }
  const attsByEvent = {};
  for (const ea of eventAtts) {
    if (!attsByEvent[ea.event_id]) attsByEvent[ea.event_id] = [];
    if (ea.attended) attsByEvent[ea.event_id].push(ea.pathfinder_id);
  }

  const events = rawEvents.map((ev) => ({
    ...ev,
    requirement_ids: reqsByEvent[ev.id] || [],
    attendee_ids: attsByEvent[ev.id] || [],
  }));

  const rawLeaders = db
    .prepare(
      `SELECT u.*, un.name as unit_name
       FROM users u
       LEFT JOIN units un ON un.id = u.unit_id
       ORDER BY u.is_demo ASC, u.name ASC`
    )
    .all();

  const smtpCfg = getSmtpConfig(clubSettings);
  const leaders = rawLeaders.map((l) => ({
    ...formatUser(l),
    unit_name: l.unit_name || null,
    invite_url: l.invite_token
      ? `${smtpCfg.frontendUrl}/?invite=${encodeURIComponent(l.invite_token)}`
      : null,
  }));

  const recentLogs = db
    .prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 120')
    .all()
    .map((log) => ({
      ...log,
      reverted: Boolean(log.reverted),
      previous_state: log.previous_state_json ? JSON.parse(log.previous_state_json) : null,
      new_state: log.new_state_json ? JSON.parse(log.new_state_json) : null,
    }));

  res.json({
    clubSettings: {
      ...clubSettings,
      smtp_pass: '', // never expose raw secret in bootstrap
      smtp_configured: smtpCfg.isConfigured,
      smtp_pass_configured: Boolean(clubSettings.smtp_pass),
      allow_counselor_direct_approval: Boolean(clubSettings.allow_counselor_direct_approval),
      demo_mode_enabled:
        clubSettings.demo_mode_enabled === undefined
          ? true
          : Boolean(clubSettings.demo_mode_enabled),
    },
    catalog: {
      categories: cardsMeta.categories,
      contextTags: cardsMeta.context_tags,
      equivalenceGroups: cardsMeta.equivalence_groups,
      classes,
      requirements,
    },
    units,
    pathfinders,
    progressRecords,
    events,
    leaders,
    auditLogs: recentLogs,
  });
});

// ============================================================================
// 3. INDIVIDUAL PROGRESS & SUB-ITEMS UPDATE
// ============================================================================
app.post('/api/progress/update', requireAuth, (req, res) => {
  const {
    pathfinder_id,
    requirement_id,
    status,
    completed_sub_items,
    notes,
    completed_at,
  } = req.body || {};

  if (!pathfinder_id || !requirement_id || !status) {
    return res.status(400).json({ error: 'Parâmetros obrigatórios ausentes.' });
  }

  const pf = db.prepare('SELECT * FROM pathfinders WHERE id = ?').get(pathfinder_id);
  const reqItem = db.prepare('SELECT * FROM requirements_catalog WHERE id = ?').get(requirement_id);
  const clubSettings = db.prepare('SELECT * FROM club_settings WHERE id = 1').get();

  if (!pf || !reqItem) {
    return res.status(404).json({ error: 'Desbravador ou requisito não encontrado.' });
  }

  const perm = checkProgressPermission(req.user, pf, reqItem.class_slug, status, clubSettings);
  if (!perm.allowed) {
    return res.status(403).json({ error: perm.reason });
  }

  const effectiveStatus = perm.effectiveStatus;
  const existing = db
    .prepare('SELECT * FROM progress_records WHERE pathfinder_id = ? AND requirement_id = ?')
    .get(pathfinder_id, requirement_id);

  const subItemsCatalog = JSON.parse(reqItem.sub_items_json || '[]');
  let finalSubItems = Array.isArray(completed_sub_items)
    ? completed_sub_items
    : existing
    ? JSON.parse(existing.completed_sub_items_json || '[]')
    : [];

  // Auto-sync sub-items if status changed to CONCLUIDO/APROVADO and no explicit partial list was sent
  if (
    (effectiveStatus === 'CONCLUIDO' || effectiveStatus === 'APROVADO') &&
    !Array.isArray(completed_sub_items) &&
    subItemsCatalog.length > 0
  ) {
    finalSubItems = subItemsCatalog.map((s) => s.code);
  } else if (effectiveStatus === 'PENDENTE' && !Array.isArray(completed_sub_items)) {
    finalSubItems = [];
  }

  const now = new Date().toISOString();
  const todayDate = completed_at || now.slice(0, 10);
  const finalNotes = notes !== undefined ? String(notes) : existing ? existing.notes : '';

  const prevState = existing
    ? {
        status: existing.status,
        completed_sub_items: JSON.parse(existing.completed_sub_items_json || '[]'),
        notes: existing.notes || '',
        completed_at: existing.completed_at,
        marked_by_user_id: existing.marked_by_user_id,
        marked_by_name: existing.marked_by_name,
        approved_by_user_id: existing.approved_by_user_id,
        approved_by_name: existing.approved_by_name,
      }
    : {
        status: 'PENDENTE',
        completed_sub_items: [],
        notes: '',
        completed_at: null,
      };

  const markedByUserId =
    effectiveStatus === 'PENDENTE' ? null : existing?.marked_by_user_id || req.user.id;
  const markedByName =
    effectiveStatus === 'PENDENTE' ? null : existing?.marked_by_name || req.user.name;
  const approvedByUserId = effectiveStatus === 'APROVADO' ? req.user.id : null;
  const approvedByName = effectiveStatus === 'APROVADO' ? req.user.name : null;
  const finalCompletedAt =
    effectiveStatus === 'PENDENTE' ? null : existing?.completed_at || todayDate;

  db.exec('BEGIN');
  try {
    const recordId = existing ? existing.id : crypto.randomUUID();
    db.prepare(`
      INSERT INTO progress_records (
        id, pathfinder_id, requirement_id, status, completed_sub_items_json,
        notes, completed_at, marked_by_user_id, marked_by_name,
        approved_by_user_id, approved_by_name, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(pathfinder_id, requirement_id) DO UPDATE SET
        status = excluded.status,
        completed_sub_items_json = excluded.completed_sub_items_json,
        notes = excluded.notes,
        completed_at = excluded.completed_at,
        marked_by_user_id = excluded.marked_by_user_id,
        marked_by_name = excluded.marked_by_name,
        approved_by_user_id = excluded.approved_by_user_id,
        approved_by_name = excluded.approved_by_name,
        updated_at = excluded.updated_at
    `).run(
      recordId,
      pathfinder_id,
      requirement_id,
      effectiveStatus,
      JSON.stringify(finalSubItems),
      finalNotes,
      finalCompletedAt,
      markedByUserId,
      markedByName,
      approvedByUserId,
      approvedByName,
      now
    );

    const newState = {
      status: effectiveStatus,
      completed_sub_items: finalSubItems,
      notes: finalNotes,
      completed_at: finalCompletedAt,
      marked_by_user_id: markedByUserId,
      marked_by_name: markedByName,
      approved_by_user_id: approvedByUserId,
      approved_by_name: approvedByName,
    };

    recordAudit({
      user: req.user,
      action: 'STATUS_CHANGE',
      entityType: 'PROGRESS_RECORD',
      entityId: `${pathfinder_id}:${requirement_id}`,
      summary: `${req.user.name} alterou ${reqItem.code} (${reqItem.title}) de "${pf.name}" de ${prevState.status} para ${effectiveStatus}.`,
      previousState: { pathfinder_id, requirement_id, ...prevState },
      newState: { pathfinder_id, requirement_id, ...newState },
      createdAt: now,
    });

    db.exec('COMMIT');

    res.json({
      success: true,
      downgradedNotice: perm.downgradedNotice || null,
      record: {
        id: recordId,
        pathfinder_id,
        requirement_id,
        ...newState,
        updated_at: now,
      },
    });
  } catch (err) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 4. BULK PROGRESS APPROVAL / BATCH ACTION
// ============================================================================
app.post('/api/progress/bulk', requireAuth, (req, res) => {
  const {
    pathfinder_ids,
    requirement_ids,
    status = 'APROVADO',
    notes = '',
    completed_at,
    reason_label = 'Assinatura em Lote',
  } = req.body || {};

  if (
    !Array.isArray(pathfinder_ids) ||
    pathfinder_ids.length === 0 ||
    !Array.isArray(requirement_ids) ||
    requirement_ids.length === 0
  ) {
    return res.status(400).json({ error: 'Selecione ao menos um desbravador e um requisito.' });
  }

  const clubSettings = db.prepare('SELECT * FROM club_settings WHERE id = 1').get();
  const now = new Date().toISOString();
  const dateStr = completed_at || now.slice(0, 10);
  const batchId = `batch-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

  let updatedCount = 0;
  let skippedPermissions = 0;

  db.exec('BEGIN');
  try {
    for (const pfId of pathfinder_ids) {
      const pf = db.prepare('SELECT * FROM pathfinders WHERE id = ?').get(pfId);
      if (!pf) continue;

      for (const reqId of requirement_ids) {
        const reqItem = db.prepare('SELECT * FROM requirements_catalog WHERE id = ?').get(reqId);
        if (!reqItem) continue;

        const perm = checkProgressPermission(req.user, pf, reqItem.class_slug, status, clubSettings);
        if (!perm.allowed) {
          skippedPermissions++;
          continue;
        }

        const effectiveStatus = perm.effectiveStatus;
        const existing = db
          .prepare('SELECT * FROM progress_records WHERE pathfinder_id = ? AND requirement_id = ?')
          .get(pfId, reqId);

        const prevState = existing
          ? {
              status: existing.status,
              completed_sub_items: JSON.parse(existing.completed_sub_items_json || '[]'),
              notes: existing.notes || '',
              completed_at: existing.completed_at,
              marked_by_user_id: existing.marked_by_user_id,
              marked_by_name: existing.marked_by_name,
              approved_by_user_id: existing.approved_by_user_id,
              approved_by_name: existing.approved_by_name,
            }
          : {
              status: 'PENDENTE',
              completed_sub_items: [],
              notes: '',
              completed_at: null,
            };

        const subItemsCatalog = JSON.parse(reqItem.sub_items_json || '[]');
        const allSubCodes =
          effectiveStatus === 'PENDENTE' ? [] : subItemsCatalog.map((s) => s.code);
        const finalNotes = notes ? String(notes) : existing?.notes || '';
        const recordId = existing ? existing.id : crypto.randomUUID();

        const markedByUserId =
          effectiveStatus === 'PENDENTE' ? null : existing?.marked_by_user_id || req.user.id;
        const markedByName =
          effectiveStatus === 'PENDENTE' ? null : existing?.marked_by_name || req.user.name;
        const approvedByUserId = effectiveStatus === 'APROVADO' ? req.user.id : null;
        const approvedByName = effectiveStatus === 'APROVADO' ? req.user.name : null;

        db.prepare(`
          INSERT INTO progress_records (
            id, pathfinder_id, requirement_id, status, completed_sub_items_json,
            notes, completed_at, marked_by_user_id, marked_by_name,
            approved_by_user_id, approved_by_name, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(pathfinder_id, requirement_id) DO UPDATE SET
            status = excluded.status,
            completed_sub_items_json = excluded.completed_sub_items_json,
            notes = excluded.notes,
            completed_at = excluded.completed_at,
            marked_by_user_id = excluded.marked_by_user_id,
            marked_by_name = excluded.marked_by_name,
            approved_by_user_id = excluded.approved_by_user_id,
            approved_by_name = excluded.approved_by_name,
            updated_at = excluded.updated_at
        `).run(
          recordId,
          pfId,
          reqId,
          effectiveStatus,
          JSON.stringify(allSubCodes),
          finalNotes,
          effectiveStatus === 'PENDENTE' ? null : dateStr,
          markedByUserId,
          markedByName,
          approvedByUserId,
          approvedByName,
          now
        );

        recordAudit({
          user: req.user,
          action: 'BULK_PROGRESS_UPDATE',
          entityType: 'PROGRESS_RECORD',
          entityId: `${pfId}:${reqId}`,
          batchId,
          summary: `[${reason_label}] ${req.user.name} marcou ${reqItem.code} (${reqItem.title}) para "${pf.name}" como ${effectiveStatus}.`,
          previousState: { pathfinder_id: pfId, requirement_id: reqId, ...prevState },
          newState: {
            pathfinder_id: pfId,
            requirement_id: reqId,
            status: effectiveStatus,
            completed_sub_items: allSubCodes,
            notes: finalNotes,
            completed_at: effectiveStatus === 'PENDENTE' ? null : dateStr,
          },
          createdAt: now,
        });

        updatedCount++;
      }
    }
    db.exec('COMMIT');
    res.json({
      success: true,
      batch_id: batchId,
      updated_count: updatedCount,
      skipped_permissions: skippedPermissions,
    });
  } catch (err) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 5. PATHFINDERS & CLASS ENROLLMENTS (INCLUDING CLASSES AGRUPADAS)
// ============================================================================
app.post('/api/pathfinders', requireAuth, (req, res) => {
  if (!['ADMIN', 'DIRETOR', 'SECRETARIO'].includes(req.user.role)) {
    return res
      .status(403)
      .json({ error: 'Apenas Diretor, Admin ou Secretário(a) podem cadastrar desbravadores.' });
  }

  const {
    name,
    birth_date,
    gender = 'M',
    unit_id = null,
    notes = '',
    class_slugs = [],
    use_grouped_classes = false,
  } = req.body || {};

  if (!name || !birth_date) {
    return res.status(400).json({ error: 'Nome e data de nascimento são obrigatórios.' });
  }

  const now = new Date().toISOString();
  const pfId = `dbv-${Date.now().toString(36)}-${crypto.randomBytes(2).toString('hex')}`;

  // Calculate grouped classes by age if requested
  let finalClassSlugs = Array.isArray(class_slugs) ? [...class_slugs] : [];
  if (use_grouped_classes) {
    const birthYear = parseInt(String(birth_date).slice(0, 4), 10) || 2016;
    const age = Math.max(10, Math.min(16, 2026 - birthYear));
    const allClasses = db
      .prepare('SELECT slug, min_age, class_type FROM classes_catalog WHERE min_age <= ?')
      .all(age);
    for (const c of allClasses) {
      if (c.class_type === 'REGULAR' && !finalClassSlugs.includes(c.slug)) {
        finalClassSlugs.push(c.slug);
      }
    }
  }

  db.exec('BEGIN');
  try {
    db.prepare(`
      INSERT INTO pathfinders (id, name, birth_date, gender, unit_id, notes, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `).run(pfId, String(name).trim(), birth_date, gender, unit_id || null, notes, now);

    const insertEnr = db.prepare(`
      INSERT OR IGNORE INTO class_enrollments (id, pathfinder_id, class_slug, year, is_grouped_card, status, enrolled_at)
      VALUES (?, ?, ?, 2026, ?, 'EM_ANDAMENTO', ?)
    `);
    for (const slug of finalClassSlugs) {
      insertEnr.run(crypto.randomUUID(), pfId, slug, use_grouped_classes ? 1 : 0, now);
    }

    recordAudit({
      user: req.user,
      action: 'PATHFINDER_CREATE',
      entityType: 'PATHFINDER',
      entityId: pfId,
      summary: `${req.user.name} cadastrou o(a) desbravador(a) "${name}" nas classes: ${finalClassSlugs.join(', ') || 'nenhuma'}.`,
      previousState: null,
      newState: { id: pfId, name, birth_date, gender, unit_id, classes: finalClassSlugs },
      createdAt: now,
    });

    db.exec('COMMIT');
    res.json({ success: true, id: pfId });
  } catch (err) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/pathfinders/:id', requireAuth, (req, res) => {
  if (!['ADMIN', 'DIRETOR', 'SECRETARIO'].includes(req.user.role)) {
    return res
      .status(403)
      .json({ error: 'Apenas Diretor, Admin ou Secretário(a) podem editar dados cadastrais.' });
  }

  const pfId = req.params.id;
  const existing = db.prepare('SELECT * FROM pathfinders WHERE id = ?').get(pfId);
  if (!existing) {
    return res.status(404).json({ error: 'Desbravador não encontrado.' });
  }

  const {
    name = existing.name,
    birth_date = existing.birth_date,
    gender = existing.gender,
    unit_id = existing.unit_id,
    notes = existing.notes,
    active = Boolean(existing.active),
    class_slugs,
  } = req.body || {};

  const now = new Date().toISOString();
  const prevEnrollments = db
    .prepare('SELECT class_slug FROM class_enrollments WHERE pathfinder_id = ?')
    .all(pfId)
    .map((r) => r.class_slug);

  db.exec('BEGIN');
  try {
    db.prepare(`
      UPDATE pathfinders
      SET name = ?, birth_date = ?, gender = ?, unit_id = ?, notes = ?, active = ?
      WHERE id = ?
    `).run(
      String(name).trim(),
      birth_date,
      gender,
      unit_id || null,
      notes,
      active ? 1 : 0,
      pfId
    );

    if (Array.isArray(class_slugs)) {
      db.prepare('DELETE FROM class_enrollments WHERE pathfinder_id = ?').run(pfId);
      const insertEnr = db.prepare(`
        INSERT INTO class_enrollments (id, pathfinder_id, class_slug, year, is_grouped_card, status, enrolled_at)
        VALUES (?, ?, ?, 2026, 0, 'EM_ANDAMENTO', ?)
      `);
      for (const slug of class_slugs) {
        insertEnr.run(crypto.randomUUID(), pfId, slug, now);
      }
    }

    recordAudit({
      user: req.user,
      action: 'PATHFINDER_UPDATE',
      entityType: 'PATHFINDER',
      entityId: pfId,
      summary: `${req.user.name} atualizou o cadastro/matrículas de "${name}".`,
      previousState: { ...existing, classes: prevEnrollments },
      newState: {
        name,
        birth_date,
        gender,
        unit_id,
        notes,
        active,
        classes: Array.isArray(class_slugs) ? class_slugs : prevEnrollments,
      },
      createdAt: now,
    });

    db.exec('COMMIT');
    res.json({ success: true });
  } catch (err) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/pathfinders/:id', requireAuth, (req, res) => {
  if (!['ADMIN', 'DIRETOR', 'SECRETARIO'].includes(req.user.role)) {
    return res
      .status(403)
      .json({ error: 'Apenas Diretor, Admin ou Secretário(a) podem excluir desbravadores.' });
  }
  const pfId = req.params.id;
  const existing = db.prepare('SELECT * FROM pathfinders WHERE id = ?').get(pfId);
  if (!existing) {
    return res.status(404).json({ error: 'Desbravador não encontrado.' });
  }

  db.prepare('DELETE FROM pathfinders WHERE id = ?').run(pfId);

  recordAudit({
    user: req.user,
    action: 'PATHFINDER_DELETE',
    entityType: 'PATHFINDER',
    entityId: pfId,
    summary: `${req.user.name} excluiu o cadastro do(a) desbravador(a) "${existing.name}".`,
    previousState: existing,
    newState: null,
  });

  res.json({ success: true });
});

// ============================================================================
// 6. UNITS MANAGEMENT
// ============================================================================
app.post('/api/units', requireAuth, (req, res) => {
  if (!['ADMIN', 'DIRETOR', 'SECRETARIO'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Sem permissão para criar unidades.' });
  }
  const { name, gender = 'MASCULINO', counselor_description = '', color_hex = '#0284c7' } =
    req.body || {};
  if (!name) return res.status(400).json({ error: 'Nome da unidade é obrigatório.' });

  const id = `unit-${Date.now().toString(36)}`;
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO units (id, name, gender, counselor_description, color_hex, active, created_at)
    VALUES (?, ?, ?, ?, ?, 1, ?)
  `).run(id, String(name).trim(), gender, counselor_description, color_hex, now);

  recordAudit({
    user: req.user,
    action: 'UNIT_CREATE',
    entityType: 'UNIT',
    entityId: id,
    summary: `${req.user.name} criou a unidade "${name}".`,
    newState: { id, name, gender, counselor_description, color_hex },
    createdAt: now,
  });

  res.json({ success: true, id });
});

app.put('/api/units/:id', requireAuth, (req, res) => {
  if (!['ADMIN', 'DIRETOR', 'SECRETARIO'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Sem permissão para editar unidades.' });
  }
  const unitId = req.params.id;
  const existing = db.prepare('SELECT * FROM units WHERE id = ?').get(unitId);
  if (!existing) return res.status(404).json({ error: 'Unidade não encontrada.' });

  const {
    name = existing.name,
    gender = existing.gender,
    counselor_description = existing.counselor_description,
    color_hex = existing.color_hex,
  } = req.body || {};

  db.prepare(`
    UPDATE units
    SET name = ?, gender = ?, counselor_description = ?, color_hex = ?
    WHERE id = ?
  `).run(String(name).trim(), gender, counselor_description, color_hex, unitId);

  recordAudit({
    user: req.user,
    action: 'UNIT_UPDATE',
    entityType: 'UNIT',
    entityId: unitId,
    summary: `${req.user.name} atualizou a unidade "${name}".`,
    previousState: existing,
    newState: { name, gender, counselor_description, color_hex },
  });

  res.json({ success: true });
});

app.delete('/api/units/:id', requireAuth, (req, res) => {
  if (!['ADMIN', 'DIRETOR', 'SECRETARIO'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Sem permissão para excluir unidades.' });
  }
  const unitId = req.params.id;
  const existing = db.prepare('SELECT * FROM units WHERE id = ?').get(unitId);
  if (!existing) return res.status(404).json({ error: 'Unidade não encontrada.' });

  db.prepare('DELETE FROM units WHERE id = ?').run(unitId);

  recordAudit({
    user: req.user,
    action: 'UNIT_DELETE',
    entityType: 'UNIT',
    entityId: unitId,
    summary: `${req.user.name} excluiu a unidade "${existing.name}".`,
    previousState: existing,
    newState: null,
  });

  res.json({ success: true });
});

// ============================================================================
// 7. EVENTS & BULK ACTIVITY EXECUTION
// ============================================================================
app.post('/api/events', requireAuth, (req, res) => {
  if (req.user.role === 'CONSELHEIRO') {
    return res
      .status(403)
      .json({ error: 'Apenas Diretores, Secretários e Instrutores podem criar eventos do clube.' });
  }

  const {
    title,
    description = '',
    event_type = 'ACAMPAMENTO',
    location = '',
    scheduled_date,
    notes = '',
    requirement_ids = [],
    attendee_ids = [],
  } = req.body || {};

  if (!title || !scheduled_date) {
    return res.status(400).json({ error: 'Título e data do evento são obrigatórios.' });
  }

  const id = `evt-${Date.now().toString(36)}-${crypto.randomBytes(2).toString('hex')}`;
  const now = new Date().toISOString();

  db.exec('BEGIN');
  try {
    db.prepare(`
      INSERT INTO activity_events (
        id, title, description, event_type, location, scheduled_date, status,
        notes, created_by_user_id, created_by_name, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'PLANEJADO', ?, ?, ?, ?)
    `).run(
      id,
      String(title).trim(),
      description,
      event_type,
      location,
      scheduled_date,
      notes,
      req.user.id,
      req.user.name,
      now
    );

    const insReq = db.prepare(
      'INSERT OR IGNORE INTO activity_event_requirements (event_id, requirement_id) VALUES (?, ?)'
    );
    for (const rid of requirement_ids) insReq.run(id, rid);

    const insAtt = db.prepare(
      'INSERT OR IGNORE INTO activity_event_attendees (event_id, pathfinder_id, attended) VALUES (?, ?, 1)'
    );
    for (const pid of attendee_ids) insAtt.run(id, pid);

    recordAudit({
      user: req.user,
      action: 'EVENT_CREATE',
      entityType: 'ACTIVITY_EVENT',
      entityId: id,
      summary: `${req.user.name} planejou o evento "${title}" para ${scheduled_date} com ${requirement_ids.length} requisito(s).`,
      newState: { id, title, scheduled_date, requirement_ids, attendee_ids },
      createdAt: now,
    });

    db.exec('COMMIT');
    res.json({ success: true, id });
  } catch (err) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/events/:id/execute', requireAuth, (req, res) => {
  if (req.user.role === 'CONSELHEIRO') {
    return res
      .status(403)
      .json({ error: 'Apenas Diretores, Secretários e Instrutores podem aprovar eventos em lote.' });
  }

  const eventId = req.params.id;
  const ev = db.prepare('SELECT * FROM activity_events WHERE id = ?').get(eventId);
  if (!ev) return res.status(404).json({ error: 'Evento não encontrado.' });

  const {
    requirement_ids,
    attendee_ids,
    target_status = 'APROVADO',
    notes = '',
  } = req.body || {};

  const finalReqs = Array.isArray(requirement_ids)
    ? requirement_ids
    : db
        .prepare('SELECT requirement_id FROM activity_event_requirements WHERE event_id = ?')
        .all(eventId)
        .map((r) => r.requirement_id);

  const finalAttendees = Array.isArray(attendee_ids)
    ? attendee_ids
    : db
        .prepare(
          'SELECT pathfinder_id FROM activity_event_attendees WHERE event_id = ? AND attended = 1'
        )
        .all(eventId)
        .map((a) => a.pathfinder_id);

  if (finalReqs.length === 0 || finalAttendees.length === 0) {
    return res
      .status(400)
      .json({ error: 'O evento precisa ter ao menos 1 requisito e 1 desbravador participante.' });
  }

  const now = new Date().toISOString();
  const batchId = `batch-evt-${eventId}-${Date.now().toString(36)}`;
  const evidenceNote = notes || `Cumprido no evento: ${ev.title} (${ev.scheduled_date})`;

  let updatedRecords = 0;

  db.exec('BEGIN');
  try {
    // Sync event requirements and attendees
    db.prepare('DELETE FROM activity_event_requirements WHERE event_id = ?').run(eventId);
    db.prepare('DELETE FROM activity_event_attendees WHERE event_id = ?').run(eventId);

    const insReq = db.prepare(
      'INSERT OR IGNORE INTO activity_event_requirements (event_id, requirement_id) VALUES (?, ?)'
    );
    for (const rid of finalReqs) insReq.run(eventId, rid);

    const insAtt = db.prepare(
      'INSERT OR IGNORE INTO activity_event_attendees (event_id, pathfinder_id, attended) VALUES (?, ?, 1)'
    );
    for (const pid of finalAttendees) insAtt.run(eventId, pid);

    for (const pid of finalAttendees) {
      const pf = db.prepare('SELECT * FROM pathfinders WHERE id = ?').get(pid);
      if (!pf) continue;

      // Only update requirements that belong to a class this pathfinder is enrolled in (or if only 1 class selected, update directly)
      const pfClasses = db
        .prepare('SELECT class_slug FROM class_enrollments WHERE pathfinder_id = ?')
        .all(pid)
        .map((e) => e.class_slug);

      for (const rid of finalReqs) {
        const reqItem = db.prepare('SELECT * FROM requirements_catalog WHERE id = ?').get(rid);
        if (!reqItem) continue;

        // If pathfinder is enrolled in classes, match the requirement's class_slug to their enrolled classes
        // unless the event has only 1 requirement or pathfinder has no enrollment restriction
        if (pfClasses.length > 0 && finalReqs.length > 1 && !pfClasses.includes(reqItem.class_slug)) {
          continue;
        }

        const existing = db
          .prepare('SELECT * FROM progress_records WHERE pathfinder_id = ? AND requirement_id = ?')
          .get(pid, rid);

        const prevState = existing
          ? {
              status: existing.status,
              completed_sub_items: JSON.parse(existing.completed_sub_items_json || '[]'),
              notes: existing.notes || '',
              completed_at: existing.completed_at,
            }
          : { status: 'PENDENTE', completed_sub_items: [], notes: '', completed_at: null };

        const subItemsCatalog = JSON.parse(reqItem.sub_items_json || '[]');
        const allSubCodes = subItemsCatalog.map((s) => s.code);
        const recId = existing ? existing.id : crypto.randomUUID();

        db.prepare(`
          INSERT INTO progress_records (
            id, pathfinder_id, requirement_id, status, completed_sub_items_json,
            notes, completed_at, marked_by_user_id, marked_by_name,
            approved_by_user_id, approved_by_name, event_id, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(pathfinder_id, requirement_id) DO UPDATE SET
            status = excluded.status,
            completed_sub_items_json = excluded.completed_sub_items_json,
            notes = excluded.notes,
            completed_at = excluded.completed_at,
            marked_by_user_id = excluded.marked_by_user_id,
            marked_by_name = excluded.marked_by_name,
            approved_by_user_id = excluded.approved_by_user_id,
            approved_by_name = excluded.approved_by_name,
            event_id = excluded.event_id,
            updated_at = excluded.updated_at
        `).run(
          recId,
          pid,
          rid,
          target_status,
          JSON.stringify(allSubCodes),
          evidenceNote,
          ev.scheduled_date,
          req.user.id,
          req.user.name,
          target_status === 'APROVADO' ? req.user.id : null,
          target_status === 'APROVADO' ? req.user.name : null,
          eventId,
          now
        );

        recordAudit({
          user: req.user,
          action: 'BULK_EVENT_APPROVE',
          entityType: 'PROGRESS_RECORD',
          entityId: `${pid}:${rid}`,
          batchId,
          summary: `[Evento: ${ev.title}] ${req.user.name} marcou ${reqItem.code} (${reqItem.title}) para "${pf.name}" como ${target_status}.`,
          previousState: { pathfinder_id: pid, requirement_id: rid, ...prevState },
          newState: {
            pathfinder_id: pid,
            requirement_id: rid,
            status: target_status,
            completed_sub_items: allSubCodes,
            notes: evidenceNote,
            completed_at: ev.scheduled_date,
          },
          createdAt: now,
        });

        updatedRecords++;
      }
    }

    db.prepare(`
      UPDATE activity_events
      SET status = 'REALIZADO', executed_at = ?, batch_id = ?
      WHERE id = ?
    `).run(now, batchId, eventId);

    db.exec('COMMIT');
    res.json({ success: true, batch_id: batchId, updated_records: updatedRecords });
  } catch (err) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/events/:id', requireAuth, (req, res) => {
  if (!['ADMIN', 'DIRETOR', 'SECRETARIO'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Sem permissão para excluir eventos.' });
  }
  const eventId = req.params.id;
  const existing = db.prepare('SELECT * FROM activity_events WHERE id = ?').get(eventId);
  if (!existing) return res.status(404).json({ error: 'Evento não encontrado.' });

  db.prepare('DELETE FROM activity_events WHERE id = ?').run(eventId);

  recordAudit({
    user: req.user,
    action: 'EVENT_DELETE',
    entityType: 'ACTIVITY_EVENT',
    entityId: eventId,
    summary: `${req.user.name} excluiu o evento "${existing.title}".`,
    previousState: existing,
    newState: null,
  });

  res.json({ success: true });
});

// ============================================================================
// 8. LEADERS (USERS, RBAC & EMAIL INVITATIONS) MANAGEMENT
// ============================================================================
const ROLE_LABELS_PT = {
  ADMIN: 'Administrador',
  DIRETOR: 'Diretor(a) do Clube',
  SECRETARIO: 'Secretário(a) do Clube',
  INSTRUTOR: 'Instrutor(a) de Classe',
  CONSELHEIRO: 'Conselheiro(a) de Unidade',
};

app.post('/api/leaders', requireAuth, async (req, res) => {
  if (!['ADMIN', 'DIRETOR'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Apenas o Diretor ou Admin pode cadastrar novos líderes.' });
  }

  try {
    const {
      name,
      email,
      password,
      role = 'INSTRUTOR',
      unit_id = null,
      assigned_classes = [],
      send_invite = true,
    } = req.body || {};

    if (!name || !email) {
      return res.status(400).json({ error: 'Nome e e-mail do líder são obrigatórios.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const exists = db
      .prepare('SELECT id FROM users WHERE LOWER(email) = ?')
      .get(cleanEmail);
    if (exists) {
      return res.status(400).json({ error: 'Já existe um líder cadastrado com este e-mail.' });
    }

    const id = `usr-${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const initialPass = password && String(password).trim() ? String(password).trim() : crypto.randomBytes(12).toString('hex');
    const pwdHash = hashPassword(initialPass);
    const inviteToken = `inv-${crypto.randomUUID()}`;
    const inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const inviteStatus = send_invite ? 'PENDING_INVITE' : 'ACTIVE';

    db.prepare(`
      INSERT INTO users (
        id, name, email, password_hash, role, unit_id, assigned_classes_json,
        active, is_demo, email_verified, invite_status, invite_token, invite_expires_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?, ?, ?)
    `).run(
      id,
      String(name).trim(),
      cleanEmail,
      pwdHash,
      role,
      unit_id || null,
      JSON.stringify(assigned_classes || []),
      send_invite ? 0 : 1,
      inviteStatus,
      inviteToken,
      inviteExpires,
      now
    );

    const clubSettings = db.prepare('SELECT * FROM club_settings WHERE id = 1').get() || {};
    let unitName = null;
    if (unit_id) {
      const uRow = db.prepare('SELECT name FROM units WHERE id = ?').get(unit_id);
      if (uRow) unitName = uRow.name;
    }

    const scopeDescription =
      role === 'CONSELHEIRO'
        ? `Unidade: ${unitName || 'Geral'}`
        : role === 'INSTRUTOR'
        ? `Classes: ${(assigned_classes || []).join(', ') || 'Todas'}`
        : 'Acesso Geral do Clube';

    let mailResult = { sent: false, inviteUrl: `${getSmtpConfig(clubSettings).frontendUrl}/?invite=${inviteToken}` };
    if (send_invite) {
      try {
        mailResult = await sendLeaderInviteEmail({
          clubSettings,
          toEmail: cleanEmail,
          toName: String(name).trim(),
          roleLabel: ROLE_LABELS_PT[role] || role,
          scopeDescription,
          invitedByName: req.user.name,
          inviteToken,
        });
      } catch (mailErr) {
        mailResult.error = mailErr.message;
      }
    }

    recordAudit({
      user: req.user,
      action: 'LEADER_CREATE',
      entityType: 'USER',
      entityId: id,
      summary: `${req.user.name} cadastrou/convidou o líder "${name}" (${cleanEmail} — ${role}). E-mail enviado: ${mailResult.sent ? 'Sim' : 'Link gerado'}.`,
      newState: { id, name, email: cleanEmail, role, unit_id, assigned_classes },
      createdAt: now,
    });

    res.json({
      success: true,
      id,
      email_sent: mailResult.sent,
      invite_url: mailResult.inviteUrl,
      email_error: mailResult.error || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Erro ao cadastrar líder.' });
  }
});

// Disparar ou Reenviar Convite por E-mail para um Líder
app.post('/api/leaders/:id/send-invite', requireAuth, async (req, res) => {
  if (!['ADMIN', 'DIRETOR'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Apenas o Diretor ou Admin pode enviar convites.' });
  }

  try {
    const targetId = req.params.id;
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
    if (!row) return res.status(404).json({ error: 'Líder não encontrado.' });

    const inviteToken = row.invite_token || `inv-${crypto.randomUUID()}`;
    const inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      UPDATE users
      SET invite_token = ?, invite_expires_at = ?, invite_status = CASE WHEN invite_status = 'ACTIVE' THEN 'ACTIVE' ELSE 'PENDING_INVITE' END
      WHERE id = ?
    `).run(inviteToken, inviteExpires, targetId);

    const clubSettings = db.prepare('SELECT * FROM club_settings WHERE id = 1').get() || {};
    let unitName = null;
    if (row.unit_id) {
      const uRow = db.prepare('SELECT name FROM units WHERE id = ?').get(row.unit_id);
      if (uRow) unitName = uRow.name;
    }
    const classesList = JSON.parse(row.assigned_classes_json || '[]');
    const scopeDescription =
      row.role === 'CONSELHEIRO'
        ? `Unidade: ${unitName || 'Geral'}`
        : row.role === 'INSTRUTOR'
        ? `Classes: ${classesList.join(', ') || 'Todas'}`
        : 'Acesso Geral do Clube';

    const mailResult = await sendLeaderInviteEmail({
      clubSettings,
      toEmail: row.email,
      toName: row.name,
      roleLabel: ROLE_LABELS_PT[row.role] || row.role,
      scopeDescription,
      invitedByName: req.user.name,
      inviteToken,
    });

    res.json({
      success: true,
      email_sent: mailResult.sent,
      invite_url: mailResult.inviteUrl,
      message: mailResult.sent
        ? `Convite enviado por e-mail para ${row.email}!`
        : `Link de convite gerado! (Configure o Gmail SMTP nas Configurações do Clube para envio direto por e-mail).`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Falha ao enviar convite.' });
  }
});

app.put('/api/leaders/:id', requireAuth, (req, res) => {
  if (!['ADMIN', 'DIRETOR'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Apenas o Diretor ou Admin pode editar permissões de líderes.' });
  }

  const targetId = req.params.id;
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
  if (!existing) return res.status(404).json({ error: 'Líder não encontrado.' });

  const {
    name = existing.name,
    email = existing.email,
    role = existing.role,
    unit_id = existing.unit_id,
    assigned_classes,
    active = Boolean(existing.active),
    new_password,
  } = req.body || {};

  const finalClasses = Array.isArray(assigned_classes)
    ? assigned_classes
    : JSON.parse(existing.assigned_classes_json || '[]');
  const pwdHash = new_password ? hashPassword(String(new_password)) : existing.password_hash;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE users
    SET name = ?, email = ?, password_hash = ?, role = ?, unit_id = ?, assigned_classes_json = ?, active = ?
    WHERE id = ?
  `).run(
    String(name).trim(),
    String(email).trim().toLowerCase(),
    pwdHash,
    role,
    unit_id || null,
    JSON.stringify(finalClasses),
    active ? 1 : 0,
    targetId
  );

  recordAudit({
    user: req.user,
    action: 'USER_PERMISSION_CHANGE',
    entityType: 'USER',
    entityId: targetId,
    summary: `${req.user.name} atualizou o perfil/permissões de "${name}" (${role}).`,
    previousState: formatUser(existing),
    newState: { name, email, role, unit_id, assigned_classes: finalClasses, active },
    createdAt: now,
  });

  res.json({ success: true });
});

app.delete('/api/leaders/:id', requireAuth, (req, res) => {
  if (!['ADMIN', 'DIRETOR'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Apenas o Diretor ou Admin pode excluir contas de líderes.' });
  }
  const targetId = req.params.id;
  if (targetId === req.user.id) {
    return res.status(400).json({ error: 'Você não pode excluir sua própria conta logada.' });
  }
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
  if (!existing) return res.status(404).json({ error: 'Líder não encontrado.' });

  db.prepare('DELETE FROM users WHERE id = ?').run(targetId);

  recordAudit({
    user: req.user,
    action: 'LEADER_DELETE',
    entityType: 'USER',
    entityId: targetId,
    summary: `${req.user.name} removeu a conta do líder "${existing.name}" (${existing.email}).`,
    previousState: formatUser(existing),
    newState: null,
  });

  res.json({ success: true });
});

// ============================================================================
// 9. CLUB SETTINGS, GMAIL SMTP & GOOGLE OAUTH CONFIGURATION
// ============================================================================
app.put('/api/settings', requireAuth, (req, res) => {
  if (!['ADMIN', 'DIRETOR'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Apenas o Diretor ou Admin pode alterar configurações do clube.' });
  }

  const prev = db.prepare('SELECT * FROM club_settings WHERE id = 1').get();
  const {
    club_name = prev.club_name,
    club_region = prev.club_region,
    current_year = prev.current_year,
    investiture_date = prev.investiture_date,
    allow_counselor_direct_approval = Boolean(prev.allow_counselor_direct_approval),
    demo_mode_enabled = prev.demo_mode_enabled === undefined ? true : Boolean(prev.demo_mode_enabled),
    smtp_host = prev.smtp_host || 'smtp.gmail.com',
    smtp_port = prev.smtp_port || 465,
    smtp_user = prev.smtp_user || '',
    smtp_pass,
    smtp_from_name = prev.smtp_from_name || club_name,
    google_client_id = prev.google_client_id || '',
    frontend_url = prev.frontend_url || 'https://pereira162.github.io/desbravadores-classes',
  } = req.body || {};

  // Preserva a senha de app anterior se o campo vier em branco
  const finalSmtpPass =
    smtp_pass !== undefined && String(smtp_pass).trim() !== ''
      ? String(smtp_pass).replace(/\s+/g, '')
      : prev.smtp_pass || '';

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE club_settings
    SET club_name = ?, club_region = ?, current_year = ?, investiture_date = ?,
        allow_counselor_direct_approval = ?, demo_mode_enabled = ?,
        smtp_host = ?, smtp_port = ?, smtp_secure = ?, smtp_user = ?, smtp_pass = ?,
        smtp_from_name = ?, google_client_id = ?, frontend_url = ?, updated_at = ?
    WHERE id = 1
  `).run(
    club_name,
    club_region,
    Number(current_year),
    investiture_date,
    allow_counselor_direct_approval ? 1 : 0,
    demo_mode_enabled ? 1 : 0,
    String(smtp_host).trim(),
    Number(smtp_port || 465),
    Number(smtp_port || 465) === 465 ? 1 : 0,
    String(smtp_user).trim(),
    finalSmtpPass,
    String(smtp_from_name || club_name).trim(),
    String(google_client_id).trim(),
    String(frontend_url).trim(),
    now
  );

  recordAudit({
    user: req.user,
    action: 'SETTINGS_UPDATE',
    entityType: 'CLUB_SETTINGS',
    entityId: '1',
    summary: `${req.user.name} atualizou as configurações do clube (SMTP: ${smtp_user || 'não definido'}, Modo Demo: ${demo_mode_enabled ? 'Ativo' : 'Oculto'}).`,
    previousState: { ...prev, smtp_pass: '***' },
    newState: {
      club_name,
      club_region,
      current_year,
      investiture_date,
      allow_counselor_direct_approval,
      demo_mode_enabled,
      smtp_user,
      google_client_id,
    },
    createdAt: now,
  });

  res.json({ success: true });
});

app.post('/api/settings/test-smtp', requireAuth, async (req, res) => {
  if (!['ADMIN', 'DIRETOR'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Apenas o Diretor pode testar o servidor de e-mail.' });
  }
  try {
    const prev = db.prepare('SELECT * FROM club_settings WHERE id = 1').get() || {};
    const {
      smtp_host = prev.smtp_host || 'smtp.gmail.com',
      smtp_port = prev.smtp_port || 465,
      smtp_user = prev.smtp_user || '',
      smtp_pass,
      to_email = req.user.email,
    } = req.body || {};

    const finalPass =
      smtp_pass && String(smtp_pass).trim() !== ''
        ? String(smtp_pass).replace(/\s+/g, '')
        : prev.smtp_pass || '';

    const tempSettings = {
      ...prev,
      smtp_host: String(smtp_host).trim(),
      smtp_port: Number(smtp_port || 465),
      smtp_secure: Number(smtp_port || 465) === 465,
      smtp_user: String(smtp_user).trim(),
      smtp_pass: finalPass,
    };

    await sendTestSmtpEmail({
      clubSettings: tempSettings,
      toEmail: String(to_email || smtp_user).trim(),
    });

    // Se funcionou, já salva as credenciais no banco!
    db.prepare(`
      UPDATE club_settings
      SET smtp_host = ?, smtp_port = ?, smtp_secure = ?, smtp_user = ?, smtp_pass = ?, updated_at = ?
      WHERE id = 1
    `).run(
      tempSettings.smtp_host,
      tempSettings.smtp_port,
      tempSettings.smtp_secure ? 1 : 0,
      tempSettings.smtp_user,
      tempSettings.smtp_pass,
      new Date().toISOString()
    );

    res.json({
      success: true,
      message: `E-mail de teste enviado com sucesso para ${to_email || smtp_user}! Credenciais SMTP salvas.`,
    });
  } catch (err) {
    res.status(400).json({
      error: `Falha no envio SMTP: ${err.message}. Verifique se o e-mail Gmail está correto e se você usou uma Senha de App de 16 caracteres do Google.`,
    });
  }
});

// ============================================================================
// 10. AUDIT LOGS & REVERT ACTION / BATCH
// ============================================================================
app.post('/api/audit/:id/revert', requireAuth, (req, res) => {
  if (!['ADMIN', 'DIRETOR'].includes(req.user.role)) {
    return res
      .status(403)
      .json({ error: 'Apenas o Diretor ou Admin tem permissão para reverter ações no histórico de auditoria.' });
  }

  const logId = req.params.id;
  const revertBatch = Boolean(req.body?.revert_batch);
  const targetLog = db.prepare('SELECT * FROM audit_logs WHERE id = ?').get(logId);

  if (!targetLog) {
    return res.status(404).json({ error: 'Registro de log não encontrado.' });
  }
  if (targetLog.reverted) {
    return res.status(400).json({ error: 'Esta ação já foi revertida anteriormente.' });
  }

  const logsToRevert =
    revertBatch && targetLog.batch_id
      ? db
          .prepare('SELECT * FROM audit_logs WHERE batch_id = ? AND reverted = 0')
          .all(targetLog.batch_id)
      : [targetLog];

  const now = new Date().toISOString();
  let revertedCount = 0;

  db.exec('BEGIN');
  try {
    for (const lg of logsToRevert) {
      if (lg.entity_type === 'PROGRESS_RECORD' && lg.previous_state_json) {
        const prev = JSON.parse(lg.previous_state_json);
        const [pfId, reqId] = lg.entity_id.split(':');
        if (pfId && reqId) {
          db.prepare(`
            INSERT INTO progress_records (
              id, pathfinder_id, requirement_id, status, completed_sub_items_json,
              notes, completed_at, marked_by_user_id, marked_by_name,
              approved_by_user_id, approved_by_name, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(pathfinder_id, requirement_id) DO UPDATE SET
              status = excluded.status,
              completed_sub_items_json = excluded.completed_sub_items_json,
              notes = excluded.notes,
              completed_at = excluded.completed_at,
              marked_by_user_id = excluded.marked_by_user_id,
              marked_by_name = excluded.marked_by_name,
              approved_by_user_id = excluded.approved_by_user_id,
              approved_by_name = excluded.approved_by_name,
              updated_at = excluded.updated_at
          `).run(
            crypto.randomUUID(),
            pfId,
            reqId,
            prev.status || 'PENDENTE',
            JSON.stringify(prev.completed_sub_items || []),
            prev.notes || '',
            prev.completed_at || null,
            prev.marked_by_user_id || null,
            prev.marked_by_name || null,
            prev.approved_by_user_id || null,
            prev.approved_by_name || null,
            now
          );
          revertedCount++;
        }
      }

      db.prepare(`
        UPDATE audit_logs
        SET reverted = 1, reverted_at = ?, reverted_by_name = ?
        WHERE id = ?
      `).run(now, req.user.name, lg.id);
    }

    recordAudit({
      user: req.user,
      action: 'REVERT_ACTION',
      entityType: targetLog.entity_type,
      entityId: targetLog.entity_id,
      batchId: targetLog.batch_id,
      summary: `${req.user.name} reverteu ${revertedCount} alteração(ões) referente a: "${targetLog.summary}".`,
      previousState: { reverted_log_id: targetLog.id, batch_id: targetLog.batch_id },
      newState: { reverted_count: revertedCount },
      createdAt: now,
    });

    db.exec('COMMIT');
    res.json({ success: true, reverted_count: revertedCount });
  } catch (err) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 11. SERVE PRODUCTION FRONTEND (OR VITE IN DEV)
// ============================================================================
const DIST_DIR = path.resolve(__dirname, '../../dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/data')) return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

const PORT = process.env.PORT || 3333;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SGC Classes Desbravadores] Servidor de produção rodando em http://localhost:${PORT}`);
});

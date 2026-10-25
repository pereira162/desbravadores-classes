const nodemailer = require('nodemailer');

function getSmtpConfig(clubSettings = {}) {
  const host = clubSettings.smtp_host || process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(clubSettings.smtp_port || process.env.SMTP_PORT || 465);
  const secure =
    clubSettings.smtp_secure !== undefined
      ? Boolean(clubSettings.smtp_secure)
      : port === 465;
  const user = (clubSettings.smtp_user || process.env.SMTP_USER || '').trim();
  const pass = (clubSettings.smtp_pass || process.env.SMTP_PASS || '').replace(/\s+/g, '');
  const fromName =
    clubSettings.smtp_from_name ||
    clubSettings.club_name ||
    'SGC Classes — Clube de Desbravadores';
  const frontendUrl = (
    clubSettings.frontend_url ||
    process.env.FRONTEND_URL ||
    'https://pereira162.github.io/desbravadores-classes'
  ).replace(/\/$/, '');

  return {
    host,
    port,
    secure,
    user,
    pass,
    fromName,
    frontendUrl,
    isConfigured: Boolean(user && pass),
  };
}

function createTransporter(clubSettings = {}) {
  const cfg = getSmtpConfig(clubSettings);
  if (!cfg.isConfigured) {
    return { transporter: null, cfg };
  }
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: {
      user: cfg.user,
      pass: cfg.pass,
    },
  });
  return { transporter, cfg };
}

function buildHtmlTemplate({ clubName, badge, title, bodyHtml, ctaLabel, ctaUrl, codeBox, footerNote }) {
  return `
  <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; padding: 32px 16px; color: #0f172a;">
    <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08);">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px 28px; color: #ffffff;">
        <div style="display: inline-block; background: rgba(245, 158, 11, 0.2); border: 1px solid rgba(245, 158, 11, 0.4); color: #fcd34d; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 10px; border-radius: 999px; margin-bottom: 10px;">
          ${badge || 'Clube de Desbravadores • DSA'}
        </div>
        <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff;">
          ${clubName || 'Gestão de Classes dos Desbravadores'}
        </h1>
      </div>

      <div style="padding: 28px;">
        <h2 style="margin: 0 0 14px 0; font-size: 18px; font-weight: 800; color: #0f172a;">
          ${title}
        </h2>
        <div style="font-size: 14px; line-height: 1.6; color: #334155;">
          ${bodyHtml}
        </div>

        ${
          codeBox
            ? `<div style="margin: 22px 0; padding: 16px; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; text-align: center;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">
                  Código de Segurança
                </div>
                <div style="font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #0f172a; font-family: monospace;">
                  ${codeBox}
                </div>
              </div>`
            : ''
        }

        ${
          ctaLabel && ctaUrl
            ? `<div style="margin: 26px 0 18px 0; text-align: center;">
                <a href="${ctaUrl}" style="display: inline-block; background: #d97706; color: #ffffff; font-weight: 700; font-size: 14px; text-decoration: none; padding: 13px 26px; border-radius: 12px;">
                  ${ctaLabel}
                </a>
              </div>
              <div style="font-size: 11px; color: #64748b; word-break: break-all; text-align: center;">
                Ou acesse diretamente: <a href="${ctaUrl}" style="color: #4f46e5;">${ctaUrl}</a>
              </div>`
            : ''
        }
      </div>

      <div style="background: #f8fafc; padding: 16px 28px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
        ${footerNote || 'E-mail automático enviado pelo Sistema de Gestão de Classes do Clube de Desbravadores.'}
      </div>
    </div>
  </div>`;
}

async function sendVerificationEmail({ clubSettings, toEmail, toName, verificationCode }) {
  const { transporter, cfg } = createTransporter(clubSettings);
  if (!transporter) {
    return {
      sent: false,
      reason: 'SMTP_NOT_CONFIGURED',
    };
  }

  const verifyUrl = `${cfg.frontendUrl}/?verify_email=${encodeURIComponent(toEmail)}&code=${encodeURIComponent(verificationCode)}`;
  const html = buildHtmlTemplate({
    clubName: clubSettings.club_name,
    badge: 'Confirmação de Conta Oficial',
    title: `Olá, ${toName}! Confirme seu e-mail`,
    bodyHtml: `
      <p>Sua conta de liderança no <strong>${clubSettings.club_name || 'Clube de Desbravadores'}</strong> foi iniciada.</p>
      <p>Utilize o código de 6 dígitos abaixo na tela do sistema ou clique no botão para confirmar seu endereço de e-mail:</p>
    `,
    codeBox: verificationCode,
    ctaLabel: 'Confirmar Meu E-mail Agora',
    ctaUrl: verifyUrl,
  });

  await transporter.sendMail({
    from: `"${cfg.fromName}" <${cfg.user}>`,
    to: toEmail,
    subject: `[${clubSettings.club_name || 'Desbravadores'}] Código de confirmação: ${verificationCode}`,
    html,
  });

  return { sent: true };
}

async function sendLeaderInviteEmail({
  clubSettings,
  toEmail,
  toName,
  roleLabel,
  scopeDescription,
  invitedByName,
  inviteToken,
}) {
  const { transporter, cfg } = createTransporter(clubSettings);
  const inviteUrl = `${cfg.frontendUrl}/?invite=${encodeURIComponent(inviteToken)}`;

  if (!transporter) {
    return {
      sent: false,
      reason: 'SMTP_NOT_CONFIGURED',
      inviteUrl,
    };
  }

  const html = buildHtmlTemplate({
    clubName: clubSettings.club_name,
    badge: 'Convite Oficial da Diretoria',
    title: `Você foi convidado(a) para a liderança do Clube!`,
    bodyHtml: `
      <p>Olá, <strong>${toName}</strong>!</p>
      <p><strong>${invitedByName}</strong> cadastrou você no sistema de organização dos cartões de classes do <strong>${clubSettings.club_name}</strong>.</p>
      <ul style="background: #f8fafc; padding: 14px 18px 14px 34px; border-radius: 10px; border: 1px solid #e2e8f0;">
        <li><strong>Função atribuída:</strong> ${roleLabel}</li>
        ${scopeDescription ? `<li><strong>Escopo de atuação:</strong> ${scopeDescription}</li>` : ''}
        <li><strong>E-mail de login:</strong> ${toEmail}</li>
      </ul>
      <p>Clique no botão abaixo para definir sua senha pessoal (ou entrar com sua conta Google) e acessar o painel:</p>
    `,
    ctaLabel: 'Aceitar Convite e Criar Minha Senha',
    ctaUrl: inviteUrl,
  });

  await transporter.sendMail({
    from: `"${cfg.fromName}" <${cfg.user}>`,
    to: toEmail,
    subject: `Convite de Liderança — ${clubSettings.club_name || 'Clube de Desbravadores'}`,
    html,
  });

  return { sent: true, inviteUrl };
}

async function sendPasswordResetEmail({ clubSettings, toEmail, toName, resetCode }) {
  const { transporter, cfg } = createTransporter(clubSettings);
  const resetUrl = `${cfg.frontendUrl}/?reset_email=${encodeURIComponent(toEmail)}&code=${encodeURIComponent(resetCode)}`;

  if (!transporter) {
    return {
      sent: false,
      reason: 'SMTP_NOT_CONFIGURED',
      resetUrl,
    };
  }

  const html = buildHtmlTemplate({
    clubName: clubSettings.club_name,
    badge: 'Recuperação de Senha',
    title: `Redefinição de senha solicitada`,
    bodyHtml: `
      <p>Olá, <strong>${toName}</strong>!</p>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta (<strong>${toEmail}</strong>).</p>
      <p>Informe o código de 6 dígitos abaixo na tela de recuperação ou clique no botão para escolher uma nova senha (válido por 30 minutos):</p>
    `,
    codeBox: resetCode,
    ctaLabel: 'Redefinir Minha Senha',
    ctaUrl: resetUrl,
  });

  await transporter.sendMail({
    from: `"${cfg.fromName}" <${cfg.user}>`,
    to: toEmail,
    subject: `[Recuperação de Senha] Código: ${resetCode} — ${clubSettings.club_name || 'Desbravadores'}`,
    html,
  });

  return { sent: true, resetUrl };
}

async function sendTestSmtpEmail({ clubSettings, toEmail }) {
  const { transporter, cfg } = createTransporter(clubSettings);
  if (!transporter) {
    throw new Error('Preencha o e-mail remetente (Gmail) e a Senha de App de 16 caracteres.');
  }

  await transporter.verify();

  const html = buildHtmlTemplate({
    clubName: clubSettings.club_name,
    badge: 'Teste de Conexão SMTP',
    title: 'Envio de e-mail configurado com sucesso!',
    bodyHtml: `
      <p>Parabéns! O servidor do <strong>${clubSettings.club_name}</strong> está conectado ao SMTP (<strong>${cfg.user}</strong>) e pronto para enviar:</p>
      <ul>
        <li>Convites por e-mail para Secretários, Instrutores e Conselheiros;</li>
        <li>Códigos de verificação de e-mail;</li>
        <li>Links e códigos de recuperação de senha.</li>
      </ul>
    `,
    ctaLabel: 'Abrir Sistema do Clube',
    ctaUrl: cfg.frontendUrl,
  });

  await transporter.sendMail({
    from: `"${cfg.fromName}" <${cfg.user}>`,
    to: toEmail,
    subject: `✓ Teste de E-mail Concluído — ${clubSettings.club_name}`,
    html,
  });

  return { sent: true };
}

async function verifyGoogleIdToken(credential, expectedClientId) {
  if (!credential) {
    throw new Error('Token do Google ausente.');
  }
  const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Token do Google inválido ou expirado.');
  }
  const payload = await res.json();
  if (expectedClientId && payload.aud !== expectedClientId) {
    throw new Error('O Client ID do token Google não corresponde ao configurado no clube.');
  }
  if (payload.email_verified !== 'true' && payload.email_verified !== true) {
    throw new Error('Sua conta Google não possui um e-mail verificado.');
  }
  return {
    googleSub: payload.sub,
    email: String(payload.email || '').toLowerCase(),
    name: payload.name || payload.email,
    picture: payload.picture || null,
  };
}

async function sendPathfinderInviteEmail({
  clubSettings,
  toEmail,
  toName,
  unitName,
  classesList,
  invitedByName,
  inviteToken,
}) {
  const { transporter, cfg } = createTransporter(clubSettings);
  const inviteUrl = `${cfg.frontendUrl}/?invite=${encodeURIComponent(inviteToken)}`;

  if (!transporter || !toEmail) {
    return {
      sent: false,
      reason: !toEmail ? 'NO_EMAIL' : 'SMTP_NOT_CONFIGURED',
      inviteUrl,
    };
  }

  const html = buildHtmlTemplate({
    clubName: clubSettings.club_name,
    badge: 'Cartão Virtual do Desbravador',
    title: `Seu Cartão de Classes está pronto!`,
    bodyHtml: `
      <p>Olá, <strong>${toName}</strong>! Maranata!</p>
      <p>A diretoria do <strong>${clubSettings.club_name || 'Clube de Desbravadores'}</strong> (${invitedByName}) liberou o seu acesso individual ao <strong>Cartão Virtual de Classes</strong>.</p>
      <ul style="background: #f8fafc; padding: 14px 18px 14px 34px; border-radius: 10px; border: 1px solid #e2e8f0;">
        ${unitName ? `<li><strong>Unidade:</strong> ${unitName}</li>` : ''}
        ${classesList ? `<li><strong>Classe(s):</strong> ${classesList}</li>` : ''}
      </ul>
      <p>Com a sua conta você poderá acompanhar o que já concluiu, ver o que falta para a sua investidura, marcar os requisitos realizados, informar quando e como fez e anexar fotos das suas atividades!</p>
      <p>Clique no botão abaixo para criar sua conta (com Google ou com seu e-mail e senha):</p>
    `,
    ctaLabel: 'Criar Minha Conta de Desbravador',
    ctaUrl: inviteUrl,
  });

  await transporter.sendMail({
    from: `"${cfg.fromName}" <${cfg.user}>`,
    to: toEmail,
    subject: `Convite do Desbravador: Acesse seu Cartão de Classes — ${clubSettings.club_name || 'Desbravadores'}`,
    html,
  });

  return { sent: true, inviteUrl };
}

module.exports = {
  getSmtpConfig,
  sendVerificationEmail,
  sendLeaderInviteEmail,
  sendPathfinderInviteEmail,
  sendPasswordResetEmail,
  sendTestSmtpEmail,
  verifyGoogleIdToken,
};


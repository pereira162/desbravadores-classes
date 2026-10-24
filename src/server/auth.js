const crypto = require('node:crypto');

const SECRET_KEY = process.env.JWT_SECRET || 'dbv-gestao-classes-secret-key-production-2026-dsa';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, key] = storedHash.split(':');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(derived, 'hex'));
}

function createToken(payload) {
  const data = {
    ...payload,
    iat: Date.now(),
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 dias
  };
  const base64Payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(base64Payload)
    .digest('base64url');
  return `${base64Payload}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [base64Payload, signature] = token.split('.');
  const expectedSig = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(base64Payload)
    .digest('base64url');
  if (signature !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(base64Payload, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Verifica se o líder tem permissão para alterar o progresso de um desbravador em determinada classe/requisito.
 */
function checkProgressPermission(user, pathfinder, classSlug, requestedStatus, clubSettings) {
  if (!user || !user.active) {
    return { allowed: false, reason: 'Usuário não autenticado ou inativo.' };
  }

  // Diretor, Admin e Secretário têm permissão global
  if (['ADMIN', 'DIRETOR', 'SECRETARIO'].includes(user.role)) {
    return { allowed: true, effectiveStatus: requestedStatus };
  }

  const baseClassSlug = (classSlug || '').replace('-avancado', '');

  if (user.role === 'INSTRUTOR') {
    const assigned = Array.isArray(user.assigned_classes) ? user.assigned_classes : [];
    const hasClassScope =
      assigned.length === 0 ||
      assigned.includes('*') ||
      assigned.includes(classSlug) ||
      assigned.includes(baseClassSlug);

    if (!hasClassScope) {
      return {
        allowed: false,
        reason: `Como Instrutor, seu escopo está vinculado apenas à(s) classe(s): ${assigned.join(', ')}.`,
      };
    }
    return { allowed: true, effectiveStatus: requestedStatus };
  }

  if (user.role === 'CONSELHEIRO') {
    if (user.unit_id && pathfinder && pathfinder.unit_id && user.unit_id !== pathfinder.unit_id) {
      return {
        allowed: false,
        reason: 'Como Conselheiro, você só pode atualizar requisitos dos desbravadores da sua própria Unidade.',
      };
    }
    const allowDirectApproval = clubSettings && Number(clubSettings.allow_counselor_direct_approval) === 1;
    if (requestedStatus === 'APROVADO' && !allowDirectApproval) {
      return {
        allowed: true,
        effectiveStatus: 'CONCLUIDO',
        downgradedNotice:
          'Marcado como CONCLUÍDO (aguardando conferência/assinatura final do Instrutor ou Diretor).',
      };
    }
    return { allowed: true, effectiveStatus: requestedStatus };
  }

  return { allowed: false, reason: 'Perfil de usuário sem permissão para esta operação.' };
}

module.exports = {
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
  checkProgressPermission,
};

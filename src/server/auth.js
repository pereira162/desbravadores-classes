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

function parseJsonSafe(raw, fallback) {
  if (!raw) return fallback;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function getUserPermissions(user) {
  if (!user) return {};
  const perms = parseJsonSafe(user.permissions || user.permissions_json, {});
  if (['ADMIN', 'GESTOR', 'DIRETOR'].includes(user.role)) {
    return {
      can_manage_pathfinders: true,
      can_manage_units: true,
      can_manage_events: true,
      can_approve_all: true,
      can_view_all_units: true,
      can_view_all_classes: true,
      can_edit_equivalences: true,
      ...perms,
    };
  }
  if (user.role === 'SECRETARIO') {
    return {
      can_manage_pathfinders: true,
      can_manage_units: true,
      can_manage_events: true,
      can_view_all_units: true,
      can_view_all_classes: true,
      ...perms,
    };
  }
  return perms || {};
}

function getUserAssignedClasses(user) {
  if (!user) return [];
  return parseJsonSafe(user.assigned_classes || user.assigned_classes_json, []);
}

function getUserAssignedUnits(user) {
  if (!user) return [];
  const arr = parseJsonSafe(user.assigned_units || user.assigned_units_json, []);
  const set = new Set(Array.isArray(arr) ? arr : []);
  if (user.unit_id) set.add(user.unit_id);
  return Array.from(set);
}

function getUserAssignedPathfinders(user) {
  if (!user) return [];
  const arr = parseJsonSafe(user.assigned_pathfinders || user.assigned_pathfinders_json, []);
  return Array.isArray(arr) ? arr : [];
}

/**
 * Verifica se um usuário tem permissão para visualizar/gerenciar determinada classe.
 */
function hasClassAccess(user, classSlug) {
  if (!user) return false;
  const perms = getUserPermissions(user);
  if (
    ['ADMIN', 'GESTOR', 'DIRETOR', 'SECRETARIO'].includes(user.role) ||
    perms.can_view_all_classes ||
    perms.can_approve_all
  ) {
    return true;
  }
  const assigned = getUserAssignedClasses(user);
  if (assigned.includes('*')) return true;
  if (!classSlug) return assigned.length > 0;
  const baseClassSlug = String(classSlug).replace('-avancado', '');
  return (
    assigned.includes(classSlug) ||
    assigned.includes(baseClassSlug) ||
    assigned.includes(`${baseClassSlug}-avancado`)
  );
}

/**
 * Verifica se um usuário tem permissão para visualizar/gerenciar determinada unidade.
 */
function hasUnitAccess(user, unitId) {
  if (!user) return false;
  const perms = getUserPermissions(user);
  if (
    ['ADMIN', 'GESTOR', 'DIRETOR', 'SECRETARIO'].includes(user.role) ||
    perms.can_view_all_units ||
    perms.can_approve_all
  ) {
    return true;
  }
  const units = getUserAssignedUnits(user);
  if (units.includes('*')) return true;
  if (!unitId) return true;
  if (user.role === 'CONSELHEIRO') {
    return units.includes(unitId);
  }
  return true;
}

/**
 * Verifica se o líder ou desbravador tem permissão para alterar o progresso de um desbravador em determinada classe/requisito.
 */
function checkProgressPermission(user, pathfinder, classSlug, requestedStatus, clubSettings) {
  if (!user || !user.active) {
    return { allowed: false, reason: 'Usuário não autenticado ou inativo.' };
  }

  const perms = getUserPermissions(user);

  // Gestor, Diretor, Admin, Secretário ou líder com permissão global de aprovação
  if (
    ['ADMIN', 'GESTOR', 'DIRETOR', 'SECRETARIO'].includes(user.role) ||
    perms.can_approve_all
  ) {
    return { allowed: true, effectiveStatus: requestedStatus };
  }

  // Desbravador: pode marcar e enviar evidências/anexos apenas para o seu próprio cartão
  if (user.role === 'DESBRAVADOR') {
    if (!user.pathfinder_id || !pathfinder || user.pathfinder_id !== pathfinder.id) {
      return {
        allowed: false,
        reason: 'Como Desbravador(a), você só pode atualizar e enviar atividades do seu próprio Cartão de Classes.',
      };
    }
    if (requestedStatus === 'APROVADO') {
      return {
        allowed: true,
        effectiveStatus: 'CONCLUIDO',
        downgradedNotice:
          'Sua atividade e anexos foram enviados para avaliação da Diretoria / Instrutor!',
      };
    }
    return { allowed: true, effectiveStatus: requestedStatus };
  }

  const baseClassSlug = (classSlug || '').replace('-avancado', '');

  if (user.role === 'INSTRUTOR') {
    const assigned = getUserAssignedClasses(user);
    const hasClassScope =
      perms.can_view_all_classes ||
      assigned.includes('*') ||
      assigned.includes(classSlug) ||
      assigned.includes(baseClassSlug) ||
      assigned.includes(`${baseClassSlug}-avancado`);

    if (!hasClassScope) {
      return {
        allowed: false,
        reason: `Como Instrutor, seu escopo está vinculado apenas à(s) classe(s): ${assigned.join(', ') || 'nenhuma'}.`,
      };
    }

    const assignedPfs = getUserAssignedPathfinders(user);
    if (
      assignedPfs.length > 0 &&
      !assignedPfs.includes('*') &&
      pathfinder &&
      !assignedPfs.includes(pathfinder.id) &&
      !perms.can_view_all_classes
    ) {
      return {
        allowed: false,
        reason: 'Este desbravador está distribuído para outro instrutor desta classe.',
      };
    }

    return { allowed: true, effectiveStatus: requestedStatus };
  }

  if (user.role === 'CONSELHEIRO') {
    const allowedUnits = getUserAssignedUnits(user);
    if (
      !perms.can_view_all_units &&
      allowedUnits.length > 0 &&
      pathfinder &&
      pathfinder.unit_id &&
      !allowedUnits.includes(pathfinder.unit_id)
    ) {
      return {
        allowed: false,
        reason: 'Como Conselheiro, você só pode atualizar requisitos dos desbravadores da sua própria Unidade.',
      };
    }
    const allowDirectApproval =
      (clubSettings && Number(clubSettings.allow_counselor_direct_approval) === 1) ||
      perms.can_approve_all;
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
  getUserPermissions,
  getUserAssignedClasses,
  getUserAssignedUnits,
  getUserAssignedPathfinders,
  hasClassAccess,
  hasUnitAccess,
};

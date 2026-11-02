const fs = require('fs');
const path = require('path');
const { recordAudit } = require('./db');

const UNIFICATIONS_FILE = path.resolve(__dirname, '../../data/unificacoes_oficiais.json');

let cachedOfficialCatalog = null;
function loadOfficialCatalog() {
  if (!cachedOfficialCatalog) {
    try {
      const raw = fs.readFileSync(UNIFICATIONS_FILE, 'utf8');
      cachedOfficialCatalog = JSON.parse(raw);
    } catch (err) {
      console.error('[UNIFICATIONS] Erro ao carregar unificacoes_oficiais.json:', err);
      cachedOfficialCatalog = { metadata: {}, unifications: [], isolated: [], biblePairs: [], anchorEvents: [], strategicSpecialties: [] };
    }
  }
  return cachedOfficialCatalog;
}

/**
 * Retorna as unificações efetivas combinando o catálogo oficial com os overrides de club_settings
 */
function getEffectiveUnifications(targetDb) {
  const official = loadOfficialCatalog();
  const settings = targetDb.prepare('SELECT equivalences_override_json FROM club_settings WHERE id = 1').get();
  let overrides = { groups: {}, reqMap: {}, scenario: 'strict' };

  try {
    if (settings?.equivalences_override_json) {
      const parsed = JSON.parse(settings.equivalences_override_json);
      overrides = {
        groups: parsed.groups || {},
        reqMap: parsed.reqMap || {},
        scenario: parsed.scenario || 'strict',
      };
    }
  } catch {}

  const unificationsMap = {};
  for (const u of official.unifications) {
    unificationsMap[u.code] = { ...u, requirementIds: [...(u.requirementIds || [])] };
  }

  // Aplica overrides aos grupos
  for (const [code, overrideData] of Object.entries(overrides.groups)) {
    if (!overrideData) continue;
    if (overrideData.deleted) {
      if (unificationsMap[code]) {
        unificationsMap[code].enabled = false;
      } else {
        delete unificationsMap[code];
      }
    } else if (unificationsMap[code]) {
      unificationsMap[code] = {
        ...unificationsMap[code],
        ...overrideData,
        requirementIds: overrideData.requirementIds || unificationsMap[code].requirementIds,
      };
    } else {
      // Grupo customizado criado pelo usuário
      unificationsMap[code] = {
        id: code,
        code,
        title: overrideData.title || code,
        fullTitle: overrideData.fullTitle || overrideData.title || code,
        levelText: overrideData.levelText || 'Customizado',
        levels: overrideData.levels || ['N1'],
        ruleCode: overrideData.ruleCode || 'AUTO_EQUAL',
        scenario: overrideData.scenario || 'custom',
        category: overrideData.category || 'GERAIS',
        systemRule: overrideData.systemRule || 'Unificação personalizada criada pelo usuário.',
        pedagogicalDetails: overrideData.pedagogicalDetails || '',
        requirementsCount: (overrideData.requirementIds || []).length,
        requirementIds: overrideData.requirementIds || [],
        specialties: overrideData.specialties || [],
        hierarchicalScale: overrideData.hierarchicalScale || null,
        enabled: overrideData.enabled !== false,
        isCustom: true,
      };
    }
  }

  // Se houver reqMap overrides (requisitos associados ou desassociados manualmente)
  for (const [reqId, assignedCode] of Object.entries(overrides.reqMap)) {
    // Remove reqId de qualquer grupo atual
    for (const u of Object.values(unificationsMap)) {
      const idx = u.requirementIds.indexOf(reqId);
      if (idx !== -1) {
        u.requirementIds.splice(idx, 1);
        u.requirementsCount = u.requirementIds.length;
      }
    }
    // Adiciona ao novo grupo se informado
    if (assignedCode && unificationsMap[assignedCode]) {
      if (!unificationsMap[assignedCode].requirementIds.includes(reqId)) {
        unificationsMap[assignedCode].requirementIds.push(reqId);
        unificationsMap[assignedCode].requirementsCount = unificationsMap[assignedCode].requirementIds.length;
      }
    }
  }

  const unificationsList = Object.values(unificationsMap);

  return {
    metadata: official.metadata,
    scenario: overrides.scenario,
    unifications: unificationsList,
    isolated: official.isolated,
    biblePairs: official.biblePairs,
    anchorEvents: official.anchorEvents,
    strategicSpecialties: official.strategicSpecialties,
    rawOverrides: overrides,
  };
}

/**
 * Calcula recomendações de aprovação por absorção (hierárquica, especialidade ou equivalência)
 * para um ou todos os desbravadores.
 */
function computeAbsorptionRecommendations(targetDb, filterPathfinderId = null) {
  const { unifications, scenario } = getEffectiveUnifications(targetDb);
  const activeUnifs = unifications.filter((u) => u.enabled !== false);

  // Busca catálogo de requisitos com dados da classe
  const reqs = targetDb.prepare(`
    SELECT r.id, r.code, r.title, r.description, r.class_slug, r.base_class_slug, r.category,
           c.name as class_name, c.color_hex as class_color
    FROM requirements_catalog r
    JOIN classes_catalog c ON c.slug = r.class_slug
  `).all();

  const reqById = {};
  for (const r of reqs) {
    reqById[r.id] = r;
  }

  // Busca desbravadores
  let pfQuery = `
    SELECT p.id, p.name, p.birth_date, p.unit_id, u.name as unit_name
    FROM pathfinders p
    LEFT JOIN units u ON u.id = p.unit_id
    WHERE p.active = 1
  `;
  const pfParams = [];
  if (filterPathfinderId) {
    pfQuery += ' AND p.id = ?';
    pfParams.push(filterPathfinderId);
  }
  pfQuery += ' ORDER BY p.name ASC';

  const pfs = targetDb.prepare(pfQuery).all(...pfParams);
  const enrollments = targetDb.prepare('SELECT pathfinder_id, class_slug FROM class_enrollments').all();
  const progress = targetDb.prepare('SELECT pathfinder_id, requirement_id, status FROM progress_records').all();

  const enrolledMap = {};
  for (const e of enrollments) {
    if (!enrolledMap[e.pathfinder_id]) enrolledMap[e.pathfinder_id] = new Set();
    enrolledMap[e.pathfinder_id].add(e.class_slug);
  }

  const progMap = {};
  for (const p of progress) {
    progMap[`${p.pathfinder_id}:${p.requirement_id}`] = p.status;
  }

  const recommendations = [];

  for (const pf of pfs) {
    const pfClasses = enrolledMap[pf.id] || new Set();
    // Idade calculada do desbravador se houver birth_date
    let pfAge = null;
    if (pf.birth_date) {
      const birth = new Date(pf.birth_date);
      const now = new Date();
      pfAge = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) pfAge--;
    }

    for (const u of activeUnifs) {
      const reqIdsInGroup = u.requirementIds || [];
      if (reqIdsInGroup.length === 0) continue;

      // 1. REGRAS HIERÁRQUICAS (HIERARCHICAL_SCALE / Nível 2)
      if (u.ruleCode === 'HIERARCHICAL_SCALE' && u.hierarchicalScale && u.hierarchicalScale.length > 0) {
        // Encontra o item de maior rank já concluído pelo desbravador
        const completedScaleItems = u.hierarchicalScale.filter((item) => {
          const st = progMap[`${pf.id}:${item.id}`];
          return st === 'APROVADO' || st === 'CONCLUIDO';
        });

        // Caso especial U-01 (Idade): se a idade for >= idade do requisito, pode aprovar
        if (u.code === 'U-01' && pfAge !== null) {
          for (const item of u.hierarchicalScale) {
            const reqAge = item.rank + 9; // rank 1=10 anos, rank 6=15 anos
            const targetReq = reqById[item.id];
            if (!targetReq) continue;
            // Se o desbravador está matriculado nesta classe e o requisito está pendente
            const st = progMap[`${pf.id}:${item.id}`] || 'PENDENTE';
            if (pfClasses.has(targetReq.class_slug) && (st === 'PENDENTE' || st === 'EM_ANDAMENTO') && pfAge >= reqAge) {
              recommendations.push({
                id: `${pf.id}:${u.code}:${item.id}:age`,
                pathfinderId: pf.id,
                pathfinderName: pf.name,
                unitId: pf.unit_id,
                unitName: pf.unit_name || 'Sem Unidade',
                unificationCode: u.code,
                unificationTitle: u.title,
                ruleType: 'HIERARCHICAL_SCALE',
                ruleLabel: 'Idade Mínima Confirmada',
                reason: `O desbravador tem ${pfAge} anos, atendendo à idade mínima de ${reqAge} anos para a classe ${targetReq.class_name}.`,
                sourceRequirementId: null,
                sourceRequirementCode: `Idade: ${pfAge} anos`,
                sourceRequirementTitle: `${pfAge} anos de idade`,
                sourceClassName: 'Cadastro do Desbravador',
                targetRequirementId: item.id,
                targetRequirementCode: targetReq.code,
                targetRequirementTitle: targetReq.title,
                targetClassSlug: targetReq.class_slug,
                targetClassName: targetReq.class_name,
                targetClassColor: targetReq.class_color,
              });
            }
          }
        }

        if (completedScaleItems.length > 0) {
          // Maior rank alcançado
          completedScaleItems.sort((a, b) => (b.rank || 0) - (a.rank || 0));
          const topCompleted = completedScaleItems[0];
          const topRank = topCompleted.rank || 0;
          const sourceReq = reqById[topCompleted.id];

          // Verifica itens da escala com rank MENOR que estão pendentes e em classes matriculadas
          for (const lowerItem of u.hierarchicalScale) {
            if ((lowerItem.rank || 0) < topRank) {
              const targetReq = reqById[lowerItem.id];
              if (!targetReq) continue;
              if (!pfClasses.has(targetReq.class_slug)) continue;

              const targetStatus = progMap[`${pf.id}:${lowerItem.id}`] || 'PENDENTE';
              if (targetStatus === 'PENDENTE' || targetStatus === 'EM_ANDAMENTO') {
                recommendations.push({
                  id: `${pf.id}:${u.code}:${lowerItem.id}:scale`,
                  pathfinderId: pf.id,
                  pathfinderName: pf.name,
                  unitId: pf.unit_id,
                  unitName: pf.unit_name || 'Sem Unidade',
                  unificationCode: u.code,
                  unificationTitle: u.title,
                  ruleType: 'HIERARCHICAL_SCALE',
                  ruleLabel: 'Absorção Hierárquica Descendente',
                  reason: `Cumpriu a meta superior "${topCompleted.label}" (${sourceReq ? sourceReq.class_name : ''}), englobando "${lowerItem.label}".`,
                  sourceRequirementId: topCompleted.id,
                  sourceRequirementCode: sourceReq ? sourceReq.code : '',
                  sourceRequirementTitle: sourceReq ? sourceReq.title : topCompleted.label,
                  sourceClassName: sourceReq ? sourceReq.class_name : '',
                  targetRequirementId: lowerItem.id,
                  targetRequirementCode: targetReq.code,
                  targetRequirementTitle: targetReq.title,
                  targetClassSlug: targetReq.class_slug,
                  targetClassName: targetReq.class_name,
                  targetClassColor: targetReq.class_color,
                });
              }
            }
          }
        }
      }

      // 2. REGRAS DE ABSORÇÃO POR ESPECIALIDADE (SPECIALTY_ABSORPTION / Nível 3)
      if (u.ruleCode === 'SPECIALTY_ABSORPTION') {
        // Encontra se algum requisito que é a própria especialidade obrigatória foi concluído
        const doneReqs = reqIdsInGroup.filter((rId) => {
          const st = progMap[`${pf.id}:${rId}`];
          return st === 'APROVADO' || st === 'CONCLUIDO';
        });

        if (doneReqs.length > 0) {
          const sourceReq = reqById[doneReqs[0]];
          for (const targetId of reqIdsInGroup) {
            if (doneReqs.includes(targetId)) continue;
            const targetReq = reqById[targetId];
            if (!targetReq) continue;
            if (!pfClasses.has(targetReq.class_slug)) continue;

            const targetStatus = progMap[`${pf.id}:${targetId}`] || 'PENDENTE';
            if (targetStatus === 'PENDENTE' || targetStatus === 'EM_ANDAMENTO') {
              recommendations.push({
                id: `${pf.id}:${u.code}:${targetId}:spec`,
                pathfinderId: pf.id,
                pathfinderName: pf.name,
                unitId: pf.unit_id,
                unitName: pf.unit_name || 'Sem Unidade',
                unificationCode: u.code,
                unificationTitle: u.title,
                ruleType: 'SPECIALTY_ABSORPTION',
                ruleLabel: 'Absorção por Especialidade / Prática',
                reason: `Completou "${sourceReq ? sourceReq.title : ''}" (${sourceReq ? sourceReq.class_name : ''}), absorvendo o requisito de "${targetReq.class_name}".`,
                sourceRequirementId: sourceReq ? sourceReq.id : null,
                sourceRequirementCode: sourceReq ? sourceReq.code : '',
                sourceRequirementTitle: sourceReq ? sourceReq.title : '',
                sourceClassName: sourceReq ? sourceReq.class_name : '',
                targetRequirementId: targetReq.id,
                targetRequirementCode: targetReq.code,
                targetRequirementTitle: targetReq.title,
                targetClassSlug: targetReq.class_slug,
                targetClassName: targetReq.class_name,
                targetClassColor: targetReq.class_color,
              });
            }
          }
        }
      }

      // 3. REGRAS DE EQUIVALÊNCIA DIRETA 100% IGUAL (AUTO_EQUAL / Nível 1)
      if (u.ruleCode === 'AUTO_EQUAL') {
        const doneReqs = reqIdsInGroup.filter((rId) => {
          const st = progMap[`${pf.id}:${rId}`];
          return st === 'APROVADO' || st === 'CONCLUIDO';
        });

        if (doneReqs.length > 0) {
          const sourceReq = reqById[doneReqs[0]];
          for (const targetId of reqIdsInGroup) {
            if (doneReqs.includes(targetId)) continue;
            const targetReq = reqById[targetId];
            if (!targetReq) continue;
            if (!pfClasses.has(targetReq.class_slug)) continue;

            const targetStatus = progMap[`${pf.id}:${targetId}`] || 'PENDENTE';
            if (targetStatus === 'PENDENTE' || targetStatus === 'EM_ANDAMENTO') {
              recommendations.push({
                id: `${pf.id}:${u.code}:${targetId}:equal`,
                pathfinderId: pf.id,
                pathfinderName: pf.name,
                unitId: pf.unit_id,
                unitName: pf.unit_name || 'Sem Unidade',
                unificationCode: u.code,
                unificationTitle: u.title,
                ruleType: 'AUTO_EQUAL',
                ruleLabel: 'Equivalência Direta (100% Igual)',
                reason: `Aprovado em "${sourceReq ? sourceReq.class_name : ''}" (${sourceReq ? sourceReq.code : ''}), replica automaticamente em "${targetReq.class_name}".`,
                sourceRequirementId: sourceReq ? sourceReq.id : null,
                sourceRequirementCode: sourceReq ? sourceReq.code : '',
                sourceRequirementTitle: sourceReq ? sourceReq.title : '',
                sourceClassName: sourceReq ? sourceReq.class_name : '',
                targetRequirementId: targetReq.id,
                targetRequirementCode: targetReq.code,
                targetRequirementTitle: targetReq.title,
                targetClassSlug: targetReq.class_slug,
                targetClassName: targetReq.class_name,
                targetClassColor: targetReq.class_color,
              });
            }
          }
        }
      }
    }
  }

  return recommendations;
}

/**
 * Aplica um lote de recomendações de absorção aprovando os requisitos pendentes
 */
function applyAbsorptionApprovals(targetDb, approvals, user) {
  if (!Array.isArray(approvals) || approvals.length === 0) {
    return { success: true, count: 0 };
  }

  const now = new Date().toISOString();
  const upsertProgress = targetDb.prepare(`
    INSERT INTO progress_records (
      id, pathfinder_id, requirement_id, status, completed_sub_items_json,
      notes, completed_at, marked_by_user_id, marked_by_name,
      approved_by_user_id, approved_by_name, updated_at
    ) VALUES (?, ?, ?, 'APROVADO', '[]', ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(pathfinder_id, requirement_id) DO UPDATE SET
      status = 'APROVADO',
      completed_at = COALESCE(progress_records.completed_at, excluded.completed_at),
      approved_by_user_id = excluded.approved_by_user_id,
      approved_by_name = excluded.approved_by_name,
      notes = excluded.notes,
      updated_at = excluded.updated_at
  `);

  const insertAudit = targetDb.prepare(`
    INSERT INTO audit_logs (
      id, user_id, user_name, user_role, action, entity_type, entity_id, batch_id,
      summary, previous_state_json, new_state_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  const batchId = `abs-${Date.now()}`;
  targetDb.exec('BEGIN TRANSACTION');
  try {
    for (const app of approvals) {
      const { pathfinderId, targetRequirementId, ruleLabel, unificationCode, sourceRequirementCode, sourceClassName } = app;
      if (!pathfinderId || !targetRequirementId) continue;

      const recordId = `rec_${pathfinderId}_${targetRequirementId}`;
      const note = `Aprovado por ${ruleLabel || 'absorção'} (${unificationCode || 'Regra de Unificação'}${
        sourceClassName ? ` via ${sourceClassName} ${sourceRequirementCode || ''}` : ''
      })`;

      const actorId = user ? user.id : 'system';
      const actorName = user ? user.name : 'Sistema';

      upsertProgress.run(
        recordId,
        pathfinderId,
        targetRequirementId,
        note,
        now,
        actorId,
        actorName,
        actorId,
        actorName,
        now
      );
      count++;
    }

    if (count > 0) {
      const actorId = user ? user.id : 'system';
      const actorName = user ? user.name : 'Sistema';
      const actorRole = user ? user.role : 'DIRETOR';
      const auditId = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      insertAudit.run(
        auditId,
        actorId,
        actorName,
        actorRole,
        'ABSORPTION_APPROVAL_BATCH',
        'REQUIREMENT_PROGRESS',
        batchId,
        batchId,
        `${actorName} aprovou ${count} requisito(s) por absorção/unificação inteligente DSA.`,
        null,
        JSON.stringify({ count, approvalsCount: approvals.length }),
        now
      );
    }

    targetDb.exec('COMMIT');
  } catch (err) {
    targetDb.exec('ROLLBACK');
    throw err;
  }

  return { success: true, count };
}

/**
 * Atualiza ou cria uma unificação
 */
function updateUnification(targetDb, code, data, user) {
  const cleanCode = String(code).trim().toUpperCase();
  const { rawOverrides } = getEffectiveUnifications(targetDb);

  const prevReqs = targetDb
    .prepare('SELECT id FROM requirements_catalog WHERE equivalence_group = ?')
    .all(cleanCode)
    .map((r) => r.id);

  const newReqIds = Array.isArray(data.requirementIds) ? data.requirementIds : [];

  // Remove dos requisitos desmarcados
  for (const prevId of prevReqs) {
    if (!newReqIds.includes(prevId)) {
      rawOverrides.reqMap[prevId] = '';
      targetDb.prepare("UPDATE requirements_catalog SET equivalence_group = '' WHERE id = ?").run(prevId);
    }
  }

  // Atribui aos novos requisitos
  const updReq = targetDb.prepare('UPDATE requirements_catalog SET equivalence_group = ? WHERE id = ?');
  for (const rId of newReqIds) {
    rawOverrides.reqMap[rId] = cleanCode;
    updReq.run(cleanCode, rId);
  }

  rawOverrides.groups[cleanCode] = {
    code: cleanCode,
    title: String(data.title || cleanCode).trim(),
    description: String(data.description || '').trim(),
    levelText: data.levelText,
    levels: data.levels,
    ruleCode: data.ruleCode || 'AUTO_EQUAL',
    scenario: data.scenario || 'strict',
    enabled: data.enabled !== false,
    requirementIds: newReqIds,
    isCustom: !!data.isCustom,
  };

  const now = new Date().toISOString();
  targetDb.prepare('UPDATE club_settings SET equivalences_override_json = ?, updated_at = ? WHERE id = 1').run(
    JSON.stringify(rawOverrides),
    now
  );

  recordAudit({
    user,
    action: 'UNIFICATION_UPDATE',
    entityType: 'UNIFICATION_GROUP',
    entityId: cleanCode,
    summary: `${user.name} atualizou a unificação "${data.title || cleanCode}" (${cleanCode}).`,
    newState: { code: cleanCode, ...data },
    createdAt: now,
  });

  return { success: true, code: cleanCode };
}

/**
 * Reseta unificações para o padrão oficial da DSA
 */
function resetUnifications(targetDb, user) {
  const official = loadOfficialCatalog();

  // Limpa todos os equivalence_group na tabela e recarrega do oficial
  targetDb.exec('BEGIN TRANSACTION');
  try {
    targetDb.prepare("UPDATE requirements_catalog SET equivalence_group = ''").run();
    const updReq = targetDb.prepare('UPDATE requirements_catalog SET equivalence_group = ? WHERE id = ?');

    for (const u of official.unifications) {
      for (const rId of (u.requirementIds || [])) {
        updReq.run(u.code, rId);
      }
    }

    const resetOverrides = { groups: {}, reqMap: {}, scenario: 'strict' };
    const now = new Date().toISOString();
    targetDb.prepare('UPDATE club_settings SET equivalences_override_json = ?, updated_at = ? WHERE id = 1').run(
      JSON.stringify(resetOverrides),
      now
    );
    targetDb.exec('COMMIT');
  } catch (err) {
    targetDb.exec('ROLLBACK');
    throw err;
  }

  recordAudit({
    user,
    action: 'UNIFICATIONS_RESET',
    entityType: 'UNIFICATION_CATALOG',
    entityId: 'official-dsa',
    summary: `${user.name} restaurou todas as unificações para o padrão oficial da DSA (40 Atividades).`,
    newState: { scenario: 'strict' },
    createdAt: new Date().toISOString(),
  });

  return { success: true };
}

module.exports = {
  loadOfficialCatalog,
  getEffectiveUnifications,
  computeAbsorptionRecommendations,
  applyAbsorptionApprovals,
  updateUnification,
  resetUnifications,
};

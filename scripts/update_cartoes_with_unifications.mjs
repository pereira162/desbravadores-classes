import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cartoesPath = path.resolve(__dirname, '../data/cartoes-classes.json');
const unifPath = path.resolve(__dirname, '../data/unificacoes_oficiais.json');

const cartoes = JSON.parse(fs.readFileSync(cartoesPath, 'utf8'));
const unif = JSON.parse(fs.readFileSync(unifPath, 'utf8'));

// Map requirement id -> unification code
const reqToUnif = {};
for (const u of unif.unifications) {
  for (const rId of u.requirementIds) {
    reqToUnif[rId] = u.code;
  }
}

// Transform unifications into equivalence_groups format
const newEquivalenceGroups = unif.unifications.map(u => ({
  id: u.code,
  code: u.code,
  title: u.title,
  fullTitle: u.fullTitle,
  description: u.pedagogicalDetails,
  systemRule: u.systemRule,
  levelText: u.levelText,
  levels: u.levels,
  ruleCode: u.ruleCode,
  scenario: u.scenario,
  category: u.category,
  specialties: u.specialties || [],
  hierarchicalScale: u.hierarchicalScale || null,
  requirementsCount: u.requirementsCount,
  requirementIds: u.requirementIds
}));

cartoes.equivalence_groups = newEquivalenceGroups;

let updatedCount = 0;
let isolatedCount = 0;

for (const cls of cartoes.classes) {
  for (const r of (cls.regular_requirements || [])) {
    const unifCode = reqToUnif[r.id];
    if (unifCode) {
      r.equivalence_group = unifCode;
      updatedCount++;
    } else {
      r.equivalence_group = '';
      isolatedCount++;
    }
  }
  for (const r of (cls.advanced_requirements || [])) {
    const unifCode = reqToUnif[r.id];
    if (unifCode) {
      r.equivalence_group = unifCode;
      updatedCount++;
    } else {
      r.equivalence_group = '';
      isolatedCount++;
    }
  }
}

fs.writeFileSync(cartoesPath, JSON.stringify(cartoes, null, 2), 'utf8');

console.log(`Sucesso!`);
console.log(`- Grupos de unificação atualizados no catálogo: ${newEquivalenceGroups.length}`);
console.log(`- Requisitos unificados atualizados: ${updatedCount}`);
console.log(`- Requisitos isolados / exclusivos mantidos: ${isolatedCount}`);

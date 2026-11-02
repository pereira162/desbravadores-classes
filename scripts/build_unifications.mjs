import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const markdownPath = '/config/unificacoes_requisitos_desbravadores.md';
const content = fs.readFileSync(markdownPath, 'utf8');

// Load cartoes-classes.json to cross-reference requirement IDs
const cartoesPath = path.resolve(__dirname, '../data/cartoes-classes.json');
const cartoesData = JSON.parse(fs.readFileSync(cartoesPath, 'utf8'));

// Build map: 1-indexed number -> requirement object
const reqList = [];
for (const cls of cartoesData.classes) {
  for (const r of (cls.regular_requirements || [])) {
    reqList.push({
      num: reqList.length + 1,
      id: r.id,
      code: r.code,
      class_slug: cls.slug,
      class_name: cls.name,
      is_advanced: false,
      title: r.title,
      description: r.description
    });
  }
  for (const r of (cls.advanced_requirements || [])) {
    reqList.push({
      num: reqList.length + 1,
      id: r.id,
      code: r.code,
      class_slug: cls.advanced_slug,
      class_name: cls.advanced_name,
      is_advanced: true,
      title: r.title,
      description: r.description
    });
  }
}

const reqByNum = new Map(reqList.map(r => [r.num, r]));
const reqById = new Map(reqList.map(r => [r.id, r]));

// 1. Parse U-01 to U-40
const unifRegex = /### (U-\d+): ([^\n]+)\n([\s\S]*?)(?=(?:### U-\d+:|## 4\.|$))/g;
let match;
const unifications = [];

while ((match = unifRegex.exec(content)) !== null) {
  const code = match[1];
  const fullTitle = match[2].trim();
  const body = match[3];

  const levelMatch = body.match(/\* \*\*Classificação Técnica:\*\* ([^\n]+)/);
  const ruleMatch = body.match(/\* \*\*Regra para o Sistema \/ Calendário:\*\* ([^\n]+)/);
  const pedMatch = body.match(/\* \*\*Detalhamento Pedagógico:\*\* ([^\n]+)/);

  // Extract clean title (remove '— *Unificado (X em 1)*')
  const cleanTitle = fullTitle.replace(/—\s*\*Unificado[^*]*\*/i, '').trim();

  // Determine technical levels
  const levelText = levelMatch ? levelMatch[1].trim() : '';
  const levels = [];
  if (levelText.includes('Nível 1')) levels.push('N1');
  if (levelText.includes('Nível 2')) levels.push('N2');
  if (levelText.includes('Nível 3')) levels.push('N3');
  if (levelText.includes('Nível 4')) levels.push('N4');

  let primaryRule = 'AUTO_EQUAL';
  if (levelText.includes('AUTO_EQUAL')) primaryRule = 'AUTO_EQUAL';
  else if (levelText.includes('HIERARCHICAL_SCALE')) primaryRule = 'HIERARCHICAL_SCALE';
  else if (levelText.includes('SPECIALTY_ABSORPTION')) primaryRule = 'SPECIALTY_ABSORPTION';
  else if (levelText.includes('SHARED_EVENT')) primaryRule = 'SHARED_EVENT';

  // Parse requirement IDs
  const reqMatches = [...body.matchAll(/\* \*\*\(ID (\d+)\) ([^—]+) — ([^:]+):?\*\* ([^\n]+)/g)];
  const mappedReqs = reqMatches.map(m => {
    const num = parseInt(m[1], 10);
    const original = reqByNum.get(num);
    return {
      num,
      id: original ? original.id : `REQ_${num}`,
      code: original ? original.code : '',
      class_name: m[2].trim(),
      class_slug: original ? original.class_slug : '',
      section_info: m[3].trim(),
      text: m[4].trim()
    };
  });

  // Extract mentioned specialties
  const specMatches = [...new Set([...body.matchAll(/\b([A-Z]{2}(?:-[A-Z]+)?-\d{3})\b/g)].map(m => m[1]))];

  // Specific Hierarchical scales
  let hierarchicalScale = null;
  if (code === 'U-01') {
    hierarchicalScale = [
      { num: 177, id: 'GUIA_I_1', label: '15 anos (Guia)', rank: 6 },
      { num: 141, id: 'EXCURSIONISTA_I_1', label: '14 anos (Excursionista)', rank: 5 },
      { num: 107, id: 'PIONEIRO_I_1', label: '13 anos (Pioneiro)', rank: 4 },
      { num: 73, id: 'PESQUISADOR_I_1', label: '12 anos (Pesquisador)', rank: 3 },
      { num: 35, id: 'COMPANHEIRO_I_1', label: '11 anos (Companheiro)', rank: 2 },
      { num: 1, id: 'AMIGO_I_1', label: '10 anos (Amigo)', rank: 1 }
    ];
  } else if (code === 'U-04') {
    hierarchicalScale = [
      { num: 180, id: 'GUIA_I_4', label: 'Resumo de 1 página (Guia)', rank: 4 },
      { num: 144, id: 'EXCURSIONISTA_I_4', label: 'Resumo de 1 página (Excursionista)', rank: 4 },
      { num: 110, id: 'PIONEIRO_I_4', label: 'Resumo de 1 página (Pioneiro)', rank: 4 },
      { num: 76, id: 'PESQUISADOR_I_4', label: 'Resumo de 2 parágrafos (Pesquisador)', rank: 3 },
      { num: 38, id: 'COMPANHEIRO_I_4', label: 'Resumo de 1 parágrafo (Companheiro)', rank: 2 },
      { num: 4, id: 'AMIGO_I_4', label: 'Leitura do livro (Amigo)', rank: 1 }
    ];
  } else if (code === 'U-12') {
    hierarchicalScale = [
      { num: 186, id: 'GUIA_II_5', label: 'Resumir e contar 3 histórias de pioneiros (Guia)', rank: 2 },
      { num: 97, id: 'PESQUISADOR_AVANCADO_AV_2', label: 'História de J. N. Andrews ou pioneiro nacional (Pesquisador Av.)', rank: 1 }
    ];
  } else if (code === 'U-15') {
    hierarchicalScale = [
      { num: 206, id: 'GUIA_AVANCADO_AV_4', label: 'Escrever 1 pág/palestra de como influenciar amigos (Guia Av.)', rank: 3 },
      { num: 205, id: 'GUIA_AVANCADO_AV_3', label: 'Trazer 2 amigos para 2 reuniões da igreja (Guia Av.)', rank: 3 },
      { num: 116, id: 'PIONEIRO_II_5', label: 'Convidar 3 ou mais pessoas para Classe Bíblica/PG (Pioneiro)', rank: 3 },
      { num: 28, id: 'AMIGO_AVANCADO_AV_3', label: 'Levar 2 amigos não adventistas à ES ou Clube (Amigo Av.)', rank: 2 },
      { num: 152, id: 'EXCURSIONISTA_III_1', label: 'Convidar 1 amigo para atividade social (Excursionista)', rank: 1 },
      { num: 98, id: 'PESQUISADOR_AVANCADO_AV_3', label: 'Convidar 1 pessoa para Clube/Classe Bíblica/PG (Pesquisador Av.)', rank: 1 }
    ];
  } else if (code === 'U-16') {
    hierarchicalScale = [
      { num: 153, id: 'EXCURSIONISTA_III_2', label: 'Projeto comunitário do planejamento à execução (Excursionista)', rank: 3 },
      { num: 132, id: 'PIONEIRO_AVANCADO_AV_2', label: 'Bom Samaritano e auxílio prático a 3+ pessoas (Pioneiro Av.)', rank: 3 },
      { num: 188, id: 'GUIA_III_1', label: 'Organizar visita a doente ou adotar família carente (Guia)', rank: 2 },
      { num: 45, id: 'COMPANHEIRO_III_1', label: 'Planejar e dedicar 2h servindo a comunidade (Companheiro)', rank: 2 },
      { num: 10, id: 'AMIGO_III_1', label: 'Dedicar 2h ajudando alguém (visita, alimento, ecológico) (Amigo)', rank: 2 },
      { num: 63, id: 'COMPANHEIRO_AVANCADO_AV_3', label: 'Atividade missionária/comunitária com um amigo (Companheiro Av.)', rank: 2 },
      { num: 83, id: 'PESQUISADOR_III_1', label: 'Conhecer projetos comunitários e participar de um (Pesquisador)', rank: 1 },
      { num: 119, id: 'PIONEIRO_III_2', label: 'Trabalhar em projeto comunitário da igreja/escola (Pioneiro)', rank: 1 },
      { num: 46, id: 'COMPANHEIRO_III_2', label: 'Participar de projeto que beneficiará comunidade (Companheiro)', rank: 1 }
    ];
  } else if (code === 'U-30') {
    hierarchicalScale = [
      { num: 159, id: 'EXCURSIONISTA_VI_2', label: 'Participar de 2 programas de departamentos da igreja (Excursionista)', rank: 2 },
      { num: 124, id: 'PIONEIRO_VI_2', label: 'Participar de 1 atividade social da igreja (Pioneiro)', rank: 1 }
    ];
  } else if (code === 'U-34') {
    hierarchicalScale = [
      { num: 163, id: 'EXCURSIONISTA_VIII_1', label: 'Caminhada de 20 km com pernoite e anotações (Excursionista)', distanceKm: 20, rank: 4 },
      { num: 100, id: 'PESQUISADOR_AVANCADO_AV_5', label: 'Caminhada de 10 km com lista de equipamentos (Pesquisador Av.)', distanceKm: 10, rank: 3 },
      { num: 133, id: 'PIONEIRO_AVANCADO_AV_3', label: 'Caminhar 10 km com relatório (Pioneiro Av.)', distanceKm: 10, rank: 3 },
      { num: 65, id: 'COMPANHEIRO_AVANCADO_AV_5', label: 'Caminhada de 6 km com relatório (Companheiro Av.)', distanceKm: 6, rank: 2 },
      { num: 17, id: 'AMIGO_VI_1', label: 'Planejamento e execução de caminhada de 5 km (Amigo)', distanceKm: 5, rank: 1 },
      { num: 23, id: 'AMIGO_VIII_3', label: '10 regras de caminhada e conduta perdido (Amigo)', rank: 0 },
      { num: 174, id: 'EXCURSIONISTA_AVANCADO_AV_9', label: 'Técnicas para percorrer trilhas em diferentes terrenos (Excursionista Av.)', rank: 0 },
      { num: 71, id: 'COMPANHEIRO_AVANCADO_AV_11', label: 'Especialidade de Excursionismo pedestre com mochila (Companheiro Av.)', rank: 0 }
    ];
  } else if (code === 'U-37') {
    hierarchicalScale = [
      { num: 199, id: 'GUIA_VIII_2', label: 'Planejar, preparar e cozinhar 3 refeições ao ar livre (Guia)', meals: 3, rank: 3 },
      { num: 92, id: 'PESQUISADOR_VIII_1', label: '6 segredos de acampamento + planejar e cozinhar 2 refeições (Pesquisador)', meals: 2, rank: 2 },
      { num: 69, id: 'COMPANHEIRO_AVANCADO_AV_9', label: 'Preparar 1 refeição em fogueira durante acampamento (Companheiro Av.)', meals: 1, rank: 1 }
    ];
  }

  unifications.push({
    id: code,
    code,
    title: cleanTitle,
    fullTitle,
    levelText,
    levels,
    ruleCode: primaryRule,
    scenario: 'strict',
    category: getCategoryForUnification(code),
    systemRule: ruleMatch ? ruleMatch[1].trim() : '',
    pedagogicalDetails: pedMatch ? pedMatch[1].trim() : '',
    requirementsCount: mappedReqs.length,
    requirementIds: mappedReqs.map(r => r.id),
    requirementNums: mappedReqs.map(r => r.num),
    requirements: mappedReqs,
    specialties: specMatches,
    hierarchicalScale,
    enabled: true
  });
}

function getCategoryForUnification(code) {
  const num = parseInt(code.replace('U-', ''), 10);
  if (num <= 5) return 'GERAIS';
  if (num <= 13) return 'ESPIRITUAL';
  if (num <= 18) return 'SERVICO';
  if (num <= 22) return 'RELACIONAMENTOS';
  if (num <= 26) return 'SAUDE';
  if (num <= 31) return 'LIDERANCA';
  if (num <= 33) return 'NATUREZA';
  if (num <= 38) return 'ACAMPAMENTO';
  return 'ESPECIALIDADES';
}

// 2. Parse Section 4: 35 Isolated Requirements
const lines = content.split('\n');
const isolated = [];
let inSec4 = false;
for (const line of lines) {
  if (line.includes('## 4. Os 35 Requisitos Individuais')) inSec4 = true;
  if (line.includes('## 5. Cruzamento Fino')) inSec4 = false;
  if (inSec4 && line.includes('| `ID ')) {
    const parts = line.split('|').map(s => s.trim()).filter(Boolean);
    if (parts.length >= 5) {
      const idNum = parseInt(parts[0].replace(/`|ID|\s/g, ''), 10);
      const original = reqByNum.get(idNum);
      isolated.push({
        num: idNum,
        id: original ? original.id : `REQ_${idNum}`,
        code: original ? original.code : '',
        className: parts[1],
        requirement: parts[2],
        description: parts[3],
        rule: parts[4]
      });
    }
  }
}

// 3. Parse Section 5: 22 Fine Crossings (Bible pairs)
const biblePairs = [];
let inSec5 = false;
for (const line of lines) {
  if (line.includes('## 5. Cruzamento Fino')) inSec5 = true;
  if (line.includes('## 6. Calendário Prático')) inSec5 = false;
  if (inSec5 && line.startsWith('| **') && !line.includes('Verso / Personagem')) {
    const parts = line.split('|').map(s => s.trim()).filter(Boolean);
    if (parts.length >= 3) {
      biblePairs.push({
        theme: parts[0],
        bibleChapter: parts[1],
        connectionType: parts[2]
      });
    }
  }
}

// 4. Parse Section 6: 9 Anchor Events
const anchorEvents = [];
const eventMatches = [...content.matchAll(/(\d+)\.\s+\*\*(E\d+)\s+[—–-]\s+([^*:]+):?\*\*([\s\S]*?)(?=(?:\d+\.\s+\*\*E\d+|$|## 7\.))/g)];
for (const m of eventMatches) {
  anchorEvents.push({
    order: parseInt(m[1], 10),
    code: m[2],
    title: m[3].trim(),
    body: m[4].trim()
  });
}

// 5. Strategic Specialties (Table 2)
const strategicSpecialties = [
  { code: 'HM-031', name: 'Modelagem em Gesso', area: 'HM', unifies: 'Artes Manuais (AM/CO/PE IX.1) + 3 moldes de pegadas (PE-AV 7)' },
  { code: 'HM-055', name: 'Biscuit', area: 'HM', unifies: 'Artes Manuais (AM/CO/PE IX.1) + 3 moldes de pegadas (PE-AV 7)' },
  { code: 'HM-007', name: 'Letreiros e Cartazes', area: 'HM', unifies: 'Artes Manuais (AM/CO/PE IX.1) + Cartaz drogas (CO-AV 6c) + Série cartazes salvação (PE II.4c)' },
  { code: 'AP-046', name: 'Código Semafórico', area: 'AP', unifies: 'Atividades Profissionais (PI IX.1b, GU IX.1d) + Código (PE-AV 10) + 35 letras/min (PI-AV 7b)' },
  { code: 'AP-047', name: 'Código Morse', area: 'AP', unifies: 'Atividades Profissionais (PI IX.1b, GU IX.1d) + Código Morse lanterna (PE-AV 10b)' },
  { code: 'AM-014', name: 'Língua de Sinais', area: 'AM', unifies: 'Eletiva Missionárias (AM-AV 9a, CO-AV 12c, PE-AV 11c, PI IX.1a, EX IX.1a) + Libras (PE-AV 10c, PI-AV 7d)' },
  { code: 'AM-034', name: 'Braile', area: 'AM', unifies: 'Eletiva Missionárias + Salmo 23 em Braille (PI-AV 7e) + Alfabeto Braille (PE-AV 10d)' },
  { code: 'EN-043', name: 'Plantas Silvestres Comestíveis', area: 'EN', unifies: 'Estudo da Natureza livre (PI VII.2, EX VII.2) + 10 plantas comestíveis (PI-AV 7a) + Plantas silvestres vs tóxicas (EX-AV 7)' },
  { code: 'EN-017', name: 'Fósseis', area: 'EN', unifies: 'Estudo da Natureza (PI VII.2) + Dilúvio e fossilização (PI VII.1)' },
  { code: 'EN-008', name: 'Mariposas e Borboletas', area: 'EN', unifies: 'Estudo da Natureza (EX VII.2) + Nicodemos e metamorfose (EX VII.1) + 25 borboletas/mariposas (PI-AV 9d)' },
  { code: 'EN-069', name: 'Animais Peçonhentos', area: 'EN', unifies: 'Estudo da Natureza (EX VII.2) + Procedimentos em ferimentos por animais peçonhentos (EX-AV 8)' },
  { code: 'CS-040', name: 'Remédios da Natureza', area: 'CS', unifies: 'Eletiva Ciência e Saúde (CO-AV 12b, PE-AV 11b, EX IX.1c, GU IX.1b) + 8 Remédios (GU V.1) + Estilo de vida (PI V.2)' },
  { code: 'CS-008', name: 'Nutrição', area: 'CS', unifies: 'Eletiva Saúde ou GU V.2d + Princípios dieta saudável (AM V.3) + Cardápio vegetariano 3 dias (PE-AV 9)' },
  { code: 'AM-043', name: 'Pioneiros Adventistas', area: 'AM', unifies: 'Eletiva Missionárias + J. N. Andrews (PE-AV 2) + 3 histórias de pioneiros (GU II.5)' },
  { code: 'AM-023', name: 'Santuário', area: 'AM', unifies: 'Eletiva Missionárias + Serviço do Santuário no AT (GU II.4)' }
];

const compiledCatalog = {
  metadata: {
    title: 'Catálogo Unificado Oficial de Classes dos Desbravadores (DSA)',
    version: '2026.2',
    source: '/config/unificacoes_requisitos_desbravadores.md',
    total_requirements: 212,
    total_unifications: unifications.length,
    total_unified_requirements: unifications.reduce((sum, u) => sum + u.requirementsCount, 0),
    total_isolated_requirements: isolated.length,
    scenarios: {
      strict: {
        total_units: 75,
        effort_reduction_percentage: 64.6,
        unifications_count: 40
      },
      integrated: {
        total_units: 55,
        effort_reduction_percentage: 74.1,
        unifications_count: 41
      }
    }
  },
  unifications,
  isolated,
  biblePairs,
  anchorEvents,
  strategicSpecialties
};

// Write to JSON
const outputPathJson = path.resolve(__dirname, '../data/unificacoes_oficiais.json');
fs.writeFileSync(outputPathJson, JSON.stringify(compiledCatalog, null, 2), 'utf8');

// Write to shared JS module for both server and client
const outputPathJs = path.resolve(__dirname, '../src/shared/unificationsCatalog.js');
fs.mkdirSync(path.dirname(outputPathJs), { recursive: true });

const jsContent = `/**
 * Catálogo Oficial de Unificações de Classes dos Desbravadores (DSA)
 * Gerado automaticamente com base em /config/unificacoes_requisitos_desbravadores.md
 */

export const unificationsCatalog = ${JSON.stringify(compiledCatalog, null, 2)};

export default unificationsCatalog;
`;

fs.writeFileSync(outputPathJs, jsContent, 'utf8');

console.log('SUCCESS!');
console.log('Total unifications:', unifications.length);
console.log('Total isolated:', isolated.length);
console.log('Total bible pairs:', biblePairs.length);
console.log('Total anchor events:', anchorEvents.length);
console.log('Output JSON:', outputPathJson);
console.log('Output JS:', outputPathJs);

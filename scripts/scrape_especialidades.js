/**
 * Script de Scraping Completo de Especialidades e Mestrados dos Desbravadores
 * Fonte: MDA Wiki (https://mda.wiki.br) via /config/todas_especialidades.json
 * Destino:
 *  - /config/Documentos/Projetos/desbravadores/gestao-classes/data/especialidades_requisitos_completos.json
 *  - /config/Documentos/Projetos/desbravadores/gestao-classes/src/client/data/especialidades_requisitos_completos.json
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Configurações e caminhos
const CONCURRENCY = 8;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const CHECKPOINT_INTERVAL = 25;

const SOURCE_PATH = '/config/todas_especialidades.json';
const OUTPUT_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'especialidades_requisitos_completos.json');
const CHECKPOINT_FILE = path.join(OUTPUT_DIR, '.checkpoint_especialidades.json');
const CLIENT_DATA_DIR = path.join(__dirname, '..', 'src', 'client', 'data');
const CLIENT_OUTPUT_FILE = path.join(CLIENT_DATA_DIR, 'especialidades_requisitos_completos.json');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8'
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanReqText(text) {
  let cleaned = cleanText(text);
  // Remove prefixos como "1. ", "1 - ", "1) "
  cleaned = cleaned.replace(/^\d+\s*[-.)]\s*/, '');
  return cleaned;
}

function cleanSubitemText(text) {
  let cleaned = cleanText(text);
  // Remove prefixos como "a) ", "a. ", "a - ", "(a) ", "(1) "
  cleaned = cleaned.replace(/^(\(?[a-z0-9]+\)?[.\-\)]\s*)/i, '');
  return cleaned;
}

function getSubitemLabel(index) {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  if (index < 26) return letters[index];
  const first = letters[Math.floor(index / 26) - 1];
  const second = letters[index % 26];
  return first + second;
}

/**
 * Extrai metadados do topo da página da especialidade/mestrado
 */
function extractMetadata(container, $) {
  const meta = {
    areaCodigo: null,
    codigoNumero: null,
    nivel: null,
    anoCriacao: null,
    instituicaoOrigem: null,
    emblemaUrl: null,
    badgeUrl: null
  };

  const table = container.find('table.templ_especialidade_dbv');
  if (!table.length) return meta;

  const rows = table.find('tr');
  if (rows.length >= 2) {
    const headerRow = rows.eq(0);
    const valueRow = rows.eq(1);

    // Imagens do topo (emblema à esquerda e insígnia à direita)
    const imgs = headerRow.find('img');
    if (imgs.length >= 1) {
      meta.emblemaUrl = imgs.eq(0).attr('src') || null;
    }
    if (imgs.length >= 2) {
      meta.badgeUrl = imgs.eq(1).attr('src') || null;
    }

    const headers = [];
    headerRow.find('td').each((_, td) => {
      if (!$(td).attr('rowspan')) {
        headers.push($(td).text().trim());
      }
    });

    const values = [];
    valueRow.find('td').each((_, td) => {
      values.push($(td).text().trim());
    });

    headers.forEach((h, idx) => {
      const val = values[idx];
      if (!val) return;
      const norm = h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (norm.includes('area')) {
        meta.areaCodigo = val;
      } else if (norm.includes('cod')) {
        meta.codigoNumero = val;
      } else if (norm.includes('nivel')) {
        meta.nivel = parseInt(val, 10) || val;
      } else if (norm.includes('ano')) {
        meta.anoCriacao = parseInt(val, 10) || val;
      } else if (norm.includes('instituicao') || norm.includes('origem')) {
        meta.instituicaoOrigem = val;
      }
    });
  }

  return meta;
}

/**
 * Extrai lista ordenada de requisitos e sub-itens
 */
function extractRequirements(container, $) {
  const requirements = [];
  let currentReqNum = 1;

  // Procura listas de nível raiz dentro do container
  const rootLists = container.find('ol, ul').filter((_, el) => {
    return $(el).parent('ol, ul').length === 0;
  });

  if (rootLists.length > 0) {
    rootLists.each((_, listEl) => {
      const isSubListByStyle = /lower-alpha|lower-roman/i.test($(listEl).attr('style') || '');
      const children = $(listEl).children();
      let currentReq = requirements.length > 0 ? requirements[requirements.length - 1] : null;

      // Se for uma lista raiz marcada como sublista (devido a HTML quebrado da wiki),
      // anexa à última requisição se existir
      if (isSubListByStyle && currentReq) {
        children.each((subIdx, subLi) => {
          const subText = cleanSubitemText($(subLi).text());
          if (subText) {
            currentReq.itens.push({
              item: getSubitemLabel(currentReq.itens.length),
              texto: subText
            });
          }
        });
        return;
      }

      children.each((_, child) => {
        const tagName = child.tagName.toLowerCase();

        if (tagName === 'li') {
          const li = $(child);
          const innerLists = li.children('ol, ul');
          const subItems = [];

          innerLists.each((_, inList) => {
            $(inList).children('li').each((subIdx, subLi) => {
              const subText = cleanSubitemText($(subLi).text());
              if (subText) {
                subItems.push({
                  item: getSubitemLabel(subItems.length),
                  texto: subText
                });
              }
            });
          });

          const clone = li.clone();
          clone.children('ol, ul').remove();
          const mainText = cleanReqText(clone.text());

          if (mainText) {
            currentReq = {
              numero: currentReqNum++,
              texto: mainText,
              itens: subItems
            };
            requirements.push(currentReq);
          }
        } else if (tagName === 'ol' || tagName === 'ul') {
          // Padrão do MediaWiki: sublistas como irmãos diretos da <li> anterior dentro do <ol>
          if (currentReq) {
            $(child).children('li').each((_, subLi) => {
              const subText = cleanSubitemText($(subLi).text());
              if (subText) {
                currentReq.itens.push({
                  item: getSubitemLabel(currentReq.itens.length),
                  texto: subText
                });
              }
            });
          }
        }
      });
    });
  } else {
    // Fallback: se não houver <ol> ou <ul>, verifica se há parágrafos com marcadores numéricos
    container.find('p').each((_, p) => {
      const pText = cleanText($(p).text());
      const match = pText.match(/^(\d+)[\.\-\)]\s+(.*)/);
      if (match) {
        requirements.push({
          numero: parseInt(match[1], 10),
          texto: cleanReqText(match[2]),
          itens: []
        });
      }
    });
  }

  return requirements;
}

/**
 * Executa fetch com retries e backoff exponencial
 */
async function fetchWithRetry(url, retries = MAX_RETRIES) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      const response = await fetch(encodeURI(url), {
        headers: HEADERS,
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const html = await response.text();
      return html;
    } catch (err) {
      attempt++;
      if (attempt >= retries) {
        throw err;
      }
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }
}

/**
 * Função principal de execução
 */
async function main() {
  console.log('================================================================');
  console.log('   Iniciando Scraping Oficial de Especialidades e Mestrados     ');
  console.log('================================================================');

  if (!fs.existsSync(SOURCE_PATH)) {
    console.error(`Erro: Arquivo fonte não encontrado em ${SOURCE_PATH}`);
    process.exit(1);
  }

  const rawSource = JSON.parse(fs.readFileSync(SOURCE_PATH, 'utf8'));
  const allItems = [];

  for (const area in rawSource.catalogo) {
    for (const item of rawSource.catalogo[area].items) {
      allItems.push({
        ...item,
        areaCatalogo: area
      });
    }
  }

  console.log(`Fonte carregada: ${allItems.length} itens a processar.`);

  // Carrega checkpoint se existir
  const processedMap = new Map();
  if (fs.existsSync(CHECKPOINT_FILE)) {
    try {
      const saved = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
      if (Array.isArray(saved)) {
        saved.forEach((item) => {
          if (item && item.code) processedMap.set(item.code, item);
        });
        console.log(`Checkpoint encontrado! ${processedMap.size} itens já processados carregados.`);
      }
    } catch (e) {
      console.warn('Aviso: Falha ao ler checkpoint anterior, iniciando do zero.');
    }
  }

  const itemsToProcess = allItems.filter((it) => !processedMap.has(it.code));
  console.log(`Itens pendentes para raspagem: ${itemsToProcess.length}`);

  let totalProcessed = processedMap.size;
  let successCount = 0;
  let failCount = 0;

  // Processamento concorrente com pool de tamanho fixo
  let currentIndex = 0;
  async function worker(workerId) {
    while (currentIndex < itemsToProcess.length) {
      const idx = currentIndex++;
      const item = itemsToProcess[idx];

      let scrapedData = null;
      try {
        const html = await fetchWithRetry(item.url);
        const $ = cheerio.load(html);
        const container = $('.page_print .text-justify').length
          ? $('.page_print .text-justify')
          : $('#content .text-justify').length
          ? $('#content .text-justify')
          : $('#content').length
          ? $('#content')
          : $('body');

        const metadados = extractMetadata(container, $);
        const requisitos = extractRequirements(container, $);

        scrapedData = {
          code: item.code,
          codeArea: item.codeArea,
          area: item.area,
          areaCatalogo: item.areaCatalogo,
          name: item.name,
          url: item.url,
          img: item.img,
          isMestrado: item.area === 'Mestrados' || item.code.startsWith('ME-'),
          metadados,
          totalRequisitos: requisitos.length,
          requisitos
        };

        processedMap.set(item.code, scrapedData);
        successCount++;
      } catch (err) {
        console.error(`[Worker ${workerId}] Falha em [${item.code}] ${item.name}: ${err.message}`);
        failCount++;
        // Salva com erro para não travar
        scrapedData = {
          code: item.code,
          codeArea: item.codeArea,
          area: item.area,
          areaCatalogo: item.areaCatalogo,
          name: item.name,
          url: item.url,
          img: item.img,
          isMestrado: item.area === 'Mestrados' || item.code.startsWith('ME-'),
          erro: err.message,
          totalRequisitos: 0,
          requisitos: []
        };
        processedMap.set(item.code, scrapedData);
      }

      totalProcessed++;

      // Checkpoint a cada CHECKPOINT_INTERVAL itens
      if (totalProcessed % CHECKPOINT_INTERVAL === 0 || totalProcessed === allItems.length) {
        const currentList = Array.from(processedMap.values());
        fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(currentList, null, 2), 'utf8');
        const pct = ((totalProcessed / allItems.length) * 100).toFixed(1);
        console.log(`[Progresso ${totalProcessed}/${allItems.length} (${pct}%)] - Último: [${item.code}] ${item.name} (${scrapedData.totalRequisitos} reqs)`);
      }
    }
  }

  const workers = [];
  const activeConcurrency = Math.min(CONCURRENCY, itemsToProcess.length || 1);
  for (let i = 0; i < activeConcurrency; i++) {
    workers.push(worker(i + 1));
  }

  await Promise.all(workers);

  console.log('\nFinalizando consolidação dos dados estruturados...');

  // Ordena os itens finais na mesma ordem do arquivo original
  const finalEspecialidades = [];
  const catalogoAgrupado = {};
  let totalRequisitosGlobal = 0;
  const resumoPorArea = {};

  for (const item of allItems) {
    const data = processedMap.get(item.code) || {
      ...item,
      totalRequisitos: 0,
      requisitos: []
    };
    finalEspecialidades.push(data);
    totalRequisitosGlobal += (data.requisitos ? data.requisitos.length : 0);

    const areaName = data.areaCatalogo || data.area;
    if (!catalogoAgrupado[areaName]) {
      catalogoAgrupado[areaName] = {
        codeArea: data.codeArea,
        count: 0,
        totalRequisitos: 0,
        items: []
      };
      resumoPorArea[areaName] = {
        especialidades: 0,
        requisitos: 0
      };
    }
    catalogoAgrupado[areaName].count++;
    catalogoAgrupado[areaName].totalRequisitos += (data.requisitos ? data.requisitos.length : 0);
    catalogoAgrupado[areaName].items.push(data);

    resumoPorArea[areaName].especialidades++;
    resumoPorArea[areaName].requisitos += (data.requisitos ? data.requisitos.length : 0);
  }

  const payloadFinal = {
    metadata: {
      titulo: 'Catálogo Oficial de Especialidades e Mestrados dos Desbravadores',
      subtitulo: 'Requisitos completos estruturados para o SGC Classes',
      versao: '2026.1',
      fonte: 'MDA Wiki (https://mda.wiki.br)',
      geradoEm: new Date().toISOString(),
      totalItens: finalEspecialidades.length,
      totalEspecialidades: finalEspecialidades.filter((e) => !e.isMestrado).length,
      totalMestrados: finalEspecialidades.filter((e) => e.isMestrado).length,
      totalRequisitos: totalRequisitosGlobal,
      resumoPorArea
    },
    catalogo: catalogoAgrupado,
    especialidades: finalEspecialidades
  };

  // Garante que os diretórios existam
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  if (!fs.existsSync(CLIENT_DATA_DIR)) {
    fs.mkdirSync(CLIENT_DATA_DIR, { recursive: true });
  }

  // Salva no destino oficial em data/
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payloadFinal, null, 2), 'utf8');
  console.log(`\n✔ Arquivo salvo com sucesso em: ${OUTPUT_FILE}`);

  // Copia para src/client/data/
  fs.writeFileSync(CLIENT_OUTPUT_FILE, JSON.stringify(payloadFinal, null, 2), 'utf8');
  console.log(`✔ Cópia salva com sucesso em: ${CLIENT_OUTPUT_FILE}`);

  // Remove checkpoint temporário após sucesso total
  if (fs.existsSync(CHECKPOINT_FILE)) {
    fs.unlinkSync(CHECKPOINT_FILE);
    console.log(`✔ Checkpoint temporário removido.`);
  }

  console.log('\n================================================================');
  console.log('                    RELATÓRIO DE CONCLUSÃO                      ');
  console.log('================================================================');
  console.log(`Total de Itens Processados:   ${finalEspecialidades.length}`);
  console.log(`- Especialidades:             ${payloadFinal.metadata.totalEspecialidades}`);
  console.log(`- Mestrados:                  ${payloadFinal.metadata.totalMestrados}`);
  console.log(`Total de Requisitos Extraídos:${totalRequisitosGlobal}`);
  console.log(`Sucessos com Requisitos > 0:  ${finalEspecialidades.filter(e => e.totalRequisitos > 0).length}`);
  console.log(`Itens com 0 Requisitos:       ${finalEspecialidades.filter(e => e.totalRequisitos === 0).length}`);
  console.log('================================================================\n');
}

main().catch((err) => {
  console.error('Erro fatal durante execução:', err);
  process.exit(1);
});

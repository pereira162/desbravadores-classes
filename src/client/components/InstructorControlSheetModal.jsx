import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  FileDown,
  Printer,
  ChevronDown,
  Layers,
  Sparkles,
  Award,
  Users,
} from 'lucide-react';
import { exportElementToPdf, generatePdfFilename } from '../utils/pdfExport';
import { getAssetUrl } from '../api';

const BASE_CLASSES = [
  { baseSlug: 'amigo', label: 'Amigo & Amigo da Natureza', age: 10, color: '#0072BC' },
  { baseSlug: 'companheiro', label: 'Companheiro & Companheiro de Excursionismo', age: 11, color: '#D9272E' },
  { baseSlug: 'pesquisador', label: 'Pesquisador & Pesquisador de Campo e Bosque', age: 12, color: '#008C44' },
  { baseSlug: 'pioneiro', label: 'Pioneiro & Pioneiro de Novas Fronteiras', age: 13, color: '#6D6E71' },
  { baseSlug: 'excursionista', label: 'Excursionista & Excursionista na Mata', age: 14, color: '#7A297B' },
  { baseSlug: 'guia', label: 'Guia & Guia de Exploração', age: 15, color: '#E8B400' },
];

export default function InstructorControlSheetModal({
  isOpen,
  onClose,
  initialBaseSlug = 'amigo',
  catalog,
  pathfinders,
  units,
  progressMap,
  classesMap,
  settings,
}) {
  const [currentBaseSlug, setCurrentBaseSlug] = useState(initialBaseSlug || 'amigo');
  const [unitFilter, setUnitFilter] = useState('ALL');
  const [exporting, setExporting] = useState(false);
  const sheetRef = useRef(null);

  const currentClassCfg = BASE_CLASSES.find((c) => c.baseSlug === currentBaseSlug) || BASE_CLASSES[0];
  const regularClass = (catalog?.classes || []).find(
    (c) => c.base_slug === currentBaseSlug && c.type === 'REGULAR'
  );
  const advancedClass = (catalog?.classes || []).find(
    (c) => c.base_slug === currentBaseSlug && c.type === 'AVANCADA'
  );

  // Desbravadores matriculados nesta classe (até 8 colunas para caber perfeitamente na folha)
  const enrolledPathfinders = useMemo(() => {
    if (!pathfinders) return [];
    const list = pathfinders.filter((pf) => {
      if (!pf.active) return false;
      if (unitFilter !== 'ALL' && pf.unit_id !== unitFilter) return false;
      const slugs = (pf.enrollments || []).map((e) => e.class_slug);
      return (
        (regularClass && slugs.includes(regularClass.slug)) ||
        (advancedClass && slugs.includes(advancedClass.slug))
      );
    });
    // Se tiver mais de 8, pega os primeiros 8 para esta folha impressa
    return list.slice(0, 8);
  }, [pathfinders, unitFilter, regularClass, advancedClass]);

  // Cria 8 colunas preenchidas com desbravadores reais ou espaços em branco para o instrutor preencher
  const columnsCount = 8;
  const columnsData = useMemo(() => {
    const cols = [];
    for (let i = 0; i < columnsCount; i++) {
      cols.push(enrolledPathfinders[i] || null);
    }
    return cols;
  }, [enrolledPathfinders]);

  // Requisitos da classe
  const classRequirements = useMemo(() => {
    return (catalog?.requirements || []).filter(
      (r) => r.base_class_slug === currentBaseSlug
    );
  }, [catalog?.requirements, currentBaseSlug]);

  // Agrupamento por seção
  const groupedSections = useMemo(() => {
    const groups = [];
    let currentKey = null;
    for (const req of classRequirements) {
      const key = `${req.class_type}::${req.section}`;
      if (key !== currentKey) {
        currentKey = key;
        groups.push({
          key,
          classType: req.class_type,
          className: classesMap?.[req.class_slug]?.name || req.class_slug,
          section: req.section,
          items: [],
        });
      }
      groups[groups.length - 1].items.push(req);
    }
    return groups;
  }, [classRequirements, classesMap]);

  const handleDownloadPdf = async () => {
    if (!sheetRef.current) return;
    setExporting(true);
    try {
      const unitObj = (units || []).find((u) => u.id === unitFilter);
      const unitLabel = unitObj ? unitObj.name : 'geral';
      await exportElementToPdf(sheetRef.current, {
        filenamePrefix: `controle_instrutor_${currentBaseSlug}_${unitLabel}`,
        orientation: 'portrait',
        singlePage: true, // Garante que caiba estritamente em 1 página única A4
        scale: 2.2,
        marginMm: 4,
      });
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Não foi possível gerar o PDF. Tente novamente.');
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Barra de Controles do Topo (Não impressa) */}
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-3 text-white flex flex-wrap items-center justify-between gap-3 shadow-2xl no-print">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
              Controle Oficial do Instrutor (1 Página A4)
            </span>
            <h3 className="text-base font-extrabold flex items-center gap-2">
              <span>{currentClassCfg.label}</span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={currentBaseSlug}
              onChange={(e) => setCurrentBaseSlug(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-none"
            >
              {BASE_CLASSES.map((bc) => (
                <option key={bc.baseSlug} value={bc.baseSlug}>
                  {bc.label} ({bc.age} anos)
                </option>
              ))}
            </select>

            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-none"
            >
              <option value="ALL">Todas as Unidades</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={exporting}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            {exporting ? 'Gerando PDF 1 Página...' : 'Baixar PDF Oficial'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Conteúdo da Folha A4 (Renderização Idêntica ao PDF) */}
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-2xl p-4 sm:p-6 overflow-x-auto max-h-[85vh]">
        <div
          ref={sheetRef}
          id="instructor-control-sheet"
          className="bg-white text-slate-950 p-4 font-sans text-xs select-none"
          style={{ width: '820px', minHeight: '1120px', margin: '0 auto' }}
        >
          {/* Cabeçalho Oficial do Clube e da Classe */}
          <div className="border-b-2 border-slate-900 pb-3 mb-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={getAssetUrl(`/data/cartoes-oficiais/logos/logo_${currentBaseSlug}.png`)}
                alt={currentClassCfg.label}
                className="w-14 h-14 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                  MINISTÉRIO DOS DESBRAVADORES • DIVISÃO SUL-AMERICANA
                </div>
                <h1 className="text-lg font-black uppercase text-slate-950 leading-tight">
                  CONTROLE DO INSTRUTOR — {regularClass?.name || currentClassCfg.label}
                  {advancedClass ? ` & ${advancedClass.name}` : ''}
                </h1>
                <div className="text-[11px] font-bold text-slate-700">
                  Faixa Etária: {currentClassCfg.age} anos • Currículo Oficial DSA 2026
                </div>
              </div>
            </div>

            <div className="text-right text-[11px] font-bold space-y-1">
              <div>
                <span className="text-slate-500 font-semibold">Clube:</span>{' '}
                <span className="border-b border-dotted border-slate-800 px-2 py-0.5 inline-block min-w-[150px]">
                  {settings?.club_name || 'Clube de Desbravadores'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold">Unidade:</span>{' '}
                <span className="border-b border-dotted border-slate-800 px-2 py-0.5 inline-block min-w-[150px]">
                  {units.find((u) => u.id === unitFilter)?.name || 'Geral'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold">Instrutor:</span>{' '}
                <span className="border-b border-dotted border-slate-800 px-2 py-0.5 inline-block min-w-[150px]">
                  &nbsp;
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold">Ano de Atividades:</span>{' '}
                <span className="font-extrabold text-slate-900">2026</span>
              </div>
            </div>
          </div>

          {/* Livro e Nota Oficial da Classe */}
          {regularClass?.book_info && (
            <div className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 mb-2 flex items-center justify-between text-[10px] text-slate-700">
              <span>
                <strong>Livro Oficial da Classe:</strong> {regularClass.book_info.pdf_2018_book}
              </span>
              <span>
                <strong>Curso de Leitura Oficial 2026:</strong> {regularClass.book_info.current_dsa_book}
              </span>
            </div>
          )}

          {/* Tabela de Requisitos e Colunas dos Desbravadores */}
          <table className="w-full border-collapse border border-slate-400 text-[10px]">
            <thead>
              <tr className="bg-slate-200 border-b border-slate-400 text-slate-900">
                <th className="border border-slate-400 px-1 py-1 text-center w-10 font-extrabold">
                  CÓD
                </th>
                <th className="border border-slate-400 px-2 py-1 text-left font-extrabold w-[340px]">
                  REQUISITOS OFICIAIS DA CLASSE
                </th>
                {columnsData.map((pf, idx) => (
                  <th
                    key={idx}
                    className="border border-slate-400 px-1 py-1 text-center w-12 font-extrabold align-bottom bg-slate-100"
                  >
                    <div className="writing-mode-vertical transform -rotate-180 h-24 mx-auto flex items-center justify-end text-[10px] font-bold text-slate-800">
                      {pf ? pf.name.split(' ').slice(0, 2).join(' ') : `Desbravador ${idx + 1}`}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {groupedSections.map((group) => (
                <React.Fragment key={group.key}>
                  {/* Linha da Seção */}
                  <tr className="bg-slate-300 font-black text-slate-900 border-y border-slate-400">
                    <td
                      colSpan={columnsCount + 2}
                      className="px-2 py-0.5 text-[10px] tracking-wider uppercase font-black"
                    >
                      {group.section} {group.classType === 'AVANCADA' ? '(CLASSE AVANÇADA)' : ''}
                    </td>
                  </tr>

                  {group.items.map((req) => {
                    const subCount = req.subitems?.length || 0;
                    return (
                      <tr key={req.id} className="border-b border-slate-300 hover:bg-slate-50">
                        {/* Código */}
                        <td className="border border-slate-400 px-1 py-0.5 text-center font-bold text-slate-900 align-middle">
                          {req.code}
                        </td>

                        {/* Texto do Requisito */}
                        <td className="border border-slate-400 px-1.5 py-0.5 align-middle leading-tight">
                          <span className="font-semibold text-slate-900">{req.title}</span>
                          {subCount > 0 && (
                            <span className="text-[9px] text-slate-500 ml-1">
                              ({req.subitems.map((s) => s.key).join(', ')})
                            </span>
                          )}
                        </td>

                        {/* Células de cada Desbravador */}
                        {columnsData.map((pf, colIdx) => {
                          if (!pf) {
                            // Espaço vazio para preenchimento manual do instrutor
                            return (
                              <td
                                key={colIdx}
                                className="border border-slate-400 p-0.5 text-center align-middle"
                              >
                                <span className="inline-block w-3.5 h-3.5 rounded-full border border-slate-400 bg-white" />
                              </td>
                            );
                          }

                          const pr = progressMap[`${pf.id}:${req.id}`];
                          const st = pr?.status || 'PENDENTE';

                          return (
                            <td
                              key={colIdx}
                              className="border border-slate-400 p-0.5 text-center align-middle"
                            >
                              {st === 'APROVADO' ? (
                                <span className="text-emerald-700 font-black text-[10px]">
                                  ✓
                                </span>
                              ) : st === 'CONCLUIDO' ? (
                                <span className="text-teal-700 font-bold text-[9px]">
                                  Feito
                                </span>
                              ) : st === 'EM_ANDAMENTO' ? (
                                <span className="text-amber-700 font-bold text-[9px]">
                                  Andam.
                                </span>
                              ) : (
                                /* Círculo Vazio para o instrutor preencher à mão ao imprimir */
                                <span
                                  className="inline-block w-3.5 h-3.5 rounded-full border border-slate-400 bg-white"
                                  title="Pendente"
                                />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {/* Rodapé Oficial com Vistos de Avaliação */}
          <div className="mt-4 pt-3 border-t border-slate-400 flex items-center justify-between text-[10px] text-slate-800">
            <div className="text-center w-52">
              <div className="border-b border-slate-600 mb-1 h-5"></div>
              <div className="font-bold">Assinatura do Instrutor(a)</div>
            </div>

            <div className="text-center w-52">
              <div className="border-b border-slate-600 mb-1 h-5"></div>
              <div className="font-bold">Assinatura do Diretor(a) do Clube</div>
            </div>

            <div className="text-center w-52">
              <div className="border-b border-slate-600 mb-1 h-5"></div>
              <div className="font-bold">Regional / Distrital</div>
            </div>
          </div>

          <div className="mt-2 text-center text-[9px] text-slate-500">
            SGC Classes — Sistema Oficial de Gestão de Classes dos Desbravadores • Divisão Sul-Americana (DSA)
          </div>
        </div>
      </div>
    </div>
  );
}

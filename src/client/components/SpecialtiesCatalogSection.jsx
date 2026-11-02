import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  Search,
  ExternalLink,
  ChevronRight,
  Shield,
  Layers,
  Calendar,
  Sparkles,
  BookOpen,
  X,
  CheckCircle2,
  Filter,
} from 'lucide-react';

const AREA_COLORS = {
  ADRA: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  'Artes e Habilidades Manuais': 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
  'Atividades Agrícolas': 'bg-lime-100 text-lime-800 border-lime-300 dark:bg-lime-950/60 dark:text-lime-300 dark:border-lime-800',
  'Atividades Missionárias e Comunitárias': 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
  'Ensinos Bíblicos': 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
  'Atividades Profissionais': 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  'Atividades Recreativas': 'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
  'Ciência e Saúde': 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
  'Estudos da Natureza': 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
  'Habilidades Domésticas': 'bg-yellow-100 text-yellow-900 border-yellow-300 dark:bg-yellow-950/60 dark:text-yellow-300 dark:border-yellow-800',
  Mestrados: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
};

// Especialidades estratégicas que conectam diretamente com as classes
const STRATEGIC_SPECIALTY_CODES = new Set([
  'HM-031', 'HM-055', 'HM-007', 'AP-046', 'AP-047', 'AM-014', 'AM-034',
  'EN-043', 'EN-017', 'EN-008', 'EN-069', 'CS-040', 'CS-008', 'AM-043',
  'AM-023', 'AM-013', 'AR-047', 'AR-002', 'CS-003', 'CS-012', 'AR-021',
  'AR-101', 'AR-020', 'AR-056', 'AR-051', 'AR-024', 'HD-006'
]);

export default function SpecialtiesCatalogSection() {
  const [catalogData, setCatalogData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);

  // Carregamento assíncrono leve sob demanda
  useEffect(() => {
    let isMounted = true;
    import('../data/especialidades_requisitos_completos.json')
      .then((mod) => {
        if (isMounted) {
          setCatalogData(mod.default || mod);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Erro ao carregar catálogo de especialidades:', err);
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const specialtiesList = useMemo(() => {
    if (!catalogData?.especialidades) return [];
    return catalogData.especialidades;
  }, [catalogData]);

  const areasList = useMemo(() => {
    if (!catalogData?.metadata?.resumoPorArea) return [];
    return Object.keys(catalogData.metadata.resumoPorArea);
  }, [catalogData]);

  const filteredSpecialties = useMemo(() => {
    return specialtiesList.filter((spec) => {
      if (selectedArea !== 'ALL' && spec.areaCatalogo !== selectedArea && spec.area !== selectedArea) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = spec.code?.toLowerCase().includes(q);
        const matchName = spec.name?.toLowerCase().includes(q);
        const matchReq = (spec.requisitos || []).some(
          (r) =>
            r.texto?.toLowerCase().includes(q) ||
            (r.itens || []).some((it) => it.texto?.toLowerCase().includes(q))
        );
        if (!matchCode && !matchName && !matchReq) return false;
      }
      return true;
    });
  }, [specialtiesList, selectedArea, searchQuery]);

  if (loading) {
    return (
      <div className="p-12 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Carregando catálogo com 599 especialidades e 5.196 requisitos oficiais...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo do Catálogo */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 rounded-2xl border border-amber-500/20 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shadow">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                Catálogo Oficial de Especialidades & Mestrados dos Desbravadores (DSA)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {catalogData?.metadata?.totalEspecialidades || 583} Especialidades • {catalogData?.metadata?.totalMestrados || 16} Mestrados • {catalogData?.metadata?.totalRequisitos || 5196} Requisitos Extraídos
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
            Atualização 2026 • 100% Completo
          </span>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Campo de Busca */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar especialidade por nome, código (ex: CS-003, HM-031) ou requisito..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Seletor de Área */}
        <select
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
          className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold shrink-0"
        >
          <option value="ALL">Todas as Áreas ({specialtiesList.length})</option>
          {areasList.map((area) => {
            const count = catalogData?.metadata?.resumoPorArea?.[area]?.especialidades || 0;
            return (
              <option key={area} value={area}>
                {area} ({count})
              </option>
            );
          })}
        </select>
      </div>

      {/* Grade de Especialidades */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[550px] overflow-y-auto pr-1">
        {filteredSpecialties.map((spec) => {
          const isStrategic = STRATEGIC_SPECIALTY_CODES.has(spec.code);
          const areaClass = AREA_COLORS[spec.areaCatalogo] || AREA_COLORS[spec.area] || 'bg-slate-100 text-slate-800 border-slate-300';

          return (
            <div
              key={spec.code}
              onClick={() => setSelectedSpecialty(spec)}
              className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-3.5 group"
            >
              {/* Insígnia da Especialidade */}
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                {spec.img ? (
                  <img
                    src={spec.img}
                    alt={spec.name}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <Award className="w-6 h-6 text-slate-400" />
                )}
              </div>

              {/* Informações */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                    {spec.code}
                  </span>
                  {isStrategic && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-300">
                      Unifica Classes
                    </span>
                  )}
                </div>
                <h5 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {spec.name}
                </h5>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border truncate max-w-[130px] ${areaClass}`}>
                    {spec.areaCatalogo || spec.area}
                  </span>
                  <span>{spec.totalRequisitos} reqs</span>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors shrink-0" />
            </div>
          );
        })}
      </div>

      {filteredSpecialties.length === 0 && (
        <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Nenhuma especialidade encontrada com os filtros selecionados.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedArea('ALL');
            }}
            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
          >
            Limpar filtros de busca
          </button>
        </div>
      )}

      {/* Modal de Detalhes da Especialidade com Requisitos Completos */}
      {selectedSpecialty && (
        <SpecialtyDetailModal
          specialty={selectedSpecialty}
          onClose={() => setSelectedSpecialty(null)}
        />
      )}
    </div>
  );
}

/**
 * Modal Detalhado com Requisitos Oficiais Completos da Especialidade
 */
function SpecialtyDetailModal({ specialty, onClose }) {
  const isStrategic = STRATEGIC_SPECIALTY_CODES.has(specialty.code);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header da Especialidade */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-start justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 p-2 flex items-center justify-center shrink-0 border border-white/20">
              {specialty.img ? (
                <img
                  src={specialty.img}
                  alt={specialty.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Award className="w-8 h-8 text-amber-400" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                  {specialty.code}
                </span>
                <span className="text-xs font-bold text-slate-300">
                  {specialty.areaCatalogo || specialty.area}
                </span>
                {isStrategic && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-black bg-purple-600 text-white shadow-sm">
                    ✦ Unifica Requisitos de Classes
                  </span>
                )}
              </div>
              <h3 className="font-black text-lg sm:text-xl text-white">
                {specialty.name}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadados Oficiais */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
          {specialty.metadados?.anoCriacao && (
            <div>
              <strong>Ano de Criação:</strong> {specialty.metadados.anoCriacao}
            </div>
          )}
          {specialty.metadados?.nivel && (
            <div>
              <strong>Nível de Dificuldade:</strong> {specialty.metadados.nivel}
            </div>
          )}
          {specialty.metadados?.instituicaoOrigem && (
            <div>
              <strong>Origem:</strong> {specialty.metadados.instituicaoOrigem}
            </div>
          )}
          <div>
            <strong>Total de Requisitos:</strong> {specialty.totalRequisitos}
          </div>
        </div>

        {/* Lista Ordenada de Requisitos Oficiais */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-500" />
            Requisitos Oficiais da Divisão Sul-Americana:
          </h4>

          <div className="space-y-3">
            {(specialty.requisitos || []).map((req) => (
              <div
                key={req.numero}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2"
              >
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-300 font-black text-xs flex items-center justify-center shrink-0 border border-amber-500/30">
                    {req.numero}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    {req.texto}
                  </div>
                </div>

                {/* Subitens aninhados (a, b, c...) */}
                {req.itens && req.itens.length > 0 && (
                  <div className="pl-10 space-y-1.5 pt-1 border-l-2 border-amber-400/50 ml-3.5">
                    {req.itens.map((it, itIdx) => (
                      <div key={itIdx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                        <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0">
                          ({it.item})
                        </span>
                        <span>{it.texto}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé com Link Externo */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <a
            href={specialty.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline"
          >
            Ver página oficial no MDA Wiki <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 hover:opacity-90 transition-opacity"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

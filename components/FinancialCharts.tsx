
import React, { useState } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis
} from 'recharts';
import { FinancialAnalysis } from '../types';
import FinancialAIChat from './FinancialAIChat';

interface Props {
  data: FinancialAnalysis;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const InfoTooltip: React.FC<{ text: string }> = ({ text }) => (
  <div className="group relative inline-block ml-1">
    <i className="fas fa-circle-info text-[10px] text-slate-300 hover:text-blue-500 cursor-help transition-colors"></i>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg shadow-xl z-50 leading-tight">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
    </div>
  </div>
);

const EditableNote: React.FC<{ sectionId: string; notes: Record<string, string>; onSave: (id: string, val: string) => void }> = ({ sectionId, notes, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(notes[sectionId] || '');

  const handleSave = () => {
    onSave(sectionId, text);
    setIsEditing(false);
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-50">
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <i className="fas fa-pen-nib text-blue-500"></i> Notas do Contador
        </label>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 no-print"
          >
            {text ? 'Editar Nota' : '+ Adicionar Nota'}
          </button>
        )}
      </div>
      
      {isEditing ? (
        <div className="space-y-2 no-print">
          <textarea 
            className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            rows={3}
            placeholder="Digite suas observações técnicas aqui..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsEditing(false)} className="px-3 py-1 text-[10px] font-bold text-slate-400">Cancelar</button>
            <button onClick={handleSave} className="px-3 py-1 text-[10px] font-bold bg-blue-600 text-white rounded-lg">Salvar Nota</button>
          </div>
        </div>
      ) : (
        text && (
          <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 italic text-xs text-slate-600 leading-relaxed relative">
            <p>"{text}"</p>
          </div>
        )
      )}
    </div>
  );
};

const FinancialCharts: React.FC<Props> = ({ data }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>(data.chartNotes || {});

  const handleSaveNote = (sectionId: string, val: string) => {
    const updatedNotes = { ...notes, [sectionId]: val };
    setNotes(updatedNotes);
    data.chartNotes = updatedNotes;
  };

  const formatCurrency = (val: number | undefined) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const formatPercent = (val: number | undefined) => 
    `${((val || 0) * 100).toFixed(1)}%`;

  const currentDRE = data.dre[0] || {};

  const anatomySteps = [
    { label: 'Receita Bruta', value: currentDRE.receita, color: 'text-blue-600', barColor: 'bg-blue-600', tooltip: 'Total de vendas de produtos ou serviços antes de impostos e deduções.' },
    { label: 'Lucro Bruto', value: currentDRE.lucroBruto, color: 'text-blue-500', barColor: 'bg-blue-400', tooltip: 'Receita líquida menos o custo dos produtos vendidos ou serviços prestados.' },
    { label: 'EBITDA', value: currentDRE.ebitda, color: 'text-indigo-600', barColor: 'bg-indigo-600', tooltip: 'Lucro antes de juros, impostos, depreciação e amortização. Mede a geração de caixa operacional.' },
    { label: 'LAJIR (EBIT)', value: currentDRE.lajir || currentDRE.ebitda * 0.9, color: 'text-indigo-500', barColor: 'bg-indigo-400', tooltip: 'Lucro operacional antes dos resultados financeiros e impostos.' },
    { label: 'LAIR (EBT)', value: currentDRE.lair || currentDRE.lucroLiquido * 1.3, color: 'text-emerald-600', barColor: 'bg-emerald-600', tooltip: 'Lucro antes da provisão para imposto de renda e contribuição social.' },
    { label: 'Lucro Líquido', value: currentDRE.lucroLiquido, color: 'text-emerald-500', barColor: 'bg-emerald-400', tooltip: 'Resultado final disponível aos sócios após todas as despesas e impostos.' },
  ];

  const radarData = [
    { subject: 'M. Bruta', A: (data.kpis.margemBruta || 0) * 100, fullMark: 100 },
    { subject: 'M. Líq.', A: (data.kpis.margemLiquida || 0) * 100, fullMark: 100 },
    { subject: 'M. Oper.', A: (data.kpis.margemOperacional || 0) * 100, fullMark: 100 },
    { subject: 'M. EBITDA', A: (data.kpis.margemEbitda || 0) * 100, fullMark: 100 },
    { subject: 'Eficiência', A: 100 - (data.kpis.eficienciaOperacional || 0) * 100, fullMark: 100 },
  ];

  const handleShareWhatsApp = async () => {
    setIsExporting(true);
    const element = document.getElementById('dashboard-content');
    if (!element) return;
    const opt = {
      margin: 10,
      filename: `Relatorio_${data.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    try {
      // @ts-ignore
      const pdfBlob = await html2pdf().from(element).set(opt).output('blob');
      const message = encodeURIComponent(`Olá! Segue a análise financeira gerada.`);
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = opt.filename;
      a.click();
      window.open(`https://wa.me/?text=${message}`, '_blank');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm no-print">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <i className="fas fa-chart-pie"></i>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Dashboard Executivo</h2>
            <p className="text-xs text-slate-400 font-medium">Relatório Estruturado de Performance</p>
          </div>
        </div>
        <button 
          onClick={handleShareWhatsApp}
          disabled={isExporting}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
        >
          {isExporting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fab fa-whatsapp"></i>}
          {isExporting ? 'Gerando...' : 'Compartilhar WhatsApp'}
        </button>
      </div>

      <div id="dashboard-content" className="space-y-8 bg-slate-50 p-4 rounded-3xl">
        {/* IDENTIFICAÇÃO */}
        <div className="hidden block print:flex justify-between items-center mb-10 border-b pb-6">
           <h1 className="text-2xl font-black text-slate-900">Relatório FinanzaViz AI</h1>
           <div className="text-right">
             <p className="text-xs font-bold">Data: {new Date().toLocaleDateString()}</p>
             <p className="text-[10px] text-slate-400">ID: {data.id}</p>
           </div>
        </div>

        {/* 1. ANATOMIA DO RESULTADO */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm break-inside-avoid">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
              <i className="fas fa-layer-group"></i>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">1. Anatomia do Resultado</h3>
              <p className="text-xs text-slate-400">Fluxo da Receita ao Lucro Líquido</p>
            </div>
          </div>
          <div className="space-y-4">
            {anatomySteps.map((step, idx) => {
              const percentage = step.value && currentDRE.receita ? (step.value / currentDRE.receita) * 100 : 0;
              return (
                <div key={idx} className="group flex items-center gap-6">
                  <div className="w-40 flex-shrink-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">
                      {step.label}
                      <InfoTooltip text={step.tooltip} />
                    </p>
                    <p className={`text-sm font-bold ${step.color}`}>{formatCurrency(step.value)}</p>
                  </div>
                  <div className="flex-1 h-12 bg-slate-50 rounded-xl relative overflow-hidden flex items-center px-4">
                    <div className={`h-8 ${step.barColor} rounded-lg shadow-sm flex items-center justify-end pr-3 transition-all duration-700`} style={{ width: `${Math.max(percentage, 3)}%` }}>
                      {percentage > 12 && <span className="text-[10px] font-black text-white/90">{percentage.toFixed(1)}%</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <EditableNote sectionId="anatomy" notes={notes} onSave={handleSaveNote} />
        </div>

        {/* --- ANÁLISE PATRIMONIAL (Balanço) --- */}
        {data.balanco && data.balanco.liquidez && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm break-inside-avoid">
            <div className="flex items-center gap-3 mb-10 border-b pb-6">
              <div className="w-12 h-12 bg-indigo-900 rounded-2xl flex items-center justify-center text-white">
                <i className="fas fa-building-columns"></i>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">2. Análise de Balanço Patrimonial</h3>
                <p className="text-xs text-slate-400">Indicadores de Solvência e Estrutura</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Liquidez */}
              {data.balanco.liquidez && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-indigo-500 pl-3">Liquidez</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs p-2 bg-slate-50 rounded-lg">
                      <span>Corrente <InfoTooltip text="Capacidade de pagar obrigações de curto prazo (Ativo Circulante / Passivo Circulante)." /></span>
                      <span className="font-bold">{data.balanco.liquidez.corrente?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between text-xs p-2 bg-slate-50 rounded-lg">
                      <span>Seca <InfoTooltip text="Capacidade de pagamento excluindo estoques, sendo mais conservadora." /></span>
                      <span className="font-bold">{data.balanco.liquidez.seca?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between text-xs p-2 bg-slate-50 rounded-lg">
                      <span>Imediata <InfoTooltip text="Disponibilidade imediata (caixa e bancos) frente ao passivo circulante." /></span>
                      <span className="font-bold">{data.balanco.liquidez.imediata?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Endividamento */}
              {data.balanco.endividamento && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-rose-500 pl-3">Endividamento</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs p-2 bg-slate-50 rounded-lg">
                      <span>End. Geral <InfoTooltip text="Percentual do ativo total financiado por capital de terceiros." /></span>
                      <span className="font-bold">{formatPercent(data.balanco.endividamento.geral)}</span>
                    </div>
                    <div className="flex justify-between text-xs p-2 bg-slate-50 rounded-lg">
                      <span>Dívida/PL <InfoTooltip text="Relação entre capital de terceiros e capital próprio. Mede dependência financeira." /></span>
                      <span className="font-bold">{data.balanco.endividamento.dividaPatrimonio?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between text-xs p-2 bg-rose-50 rounded-lg text-rose-700">
                      <span>Dívida Líquida <InfoTooltip text="Endividamento total bruto subtraído das disponibilidades de caixa." /></span>
                      <span className="font-bold">{formatCurrency(data.balanco.endividamento.dividaLiquida)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Estrutura de Capital */}
              {data.balanco.estrutura && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-emerald-500 pl-3">Estrutura de Capital</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs p-2 bg-slate-50 rounded-lg">
                      <span>Cap. Giro Líquido <InfoTooltip text="Recurso excedente do ativo circulante após pagar obrigações de curto prazo." /></span>
                      <span className="font-bold">{formatCurrency(data.balanco.estrutura.cgl)}</span>
                    </div>
                    <div className="flex justify-between text-xs p-2 bg-slate-50 rounded-lg">
                      <span>Necess. Cap. Giro <InfoTooltip text="Recursos necessários para financiar o ciclo operacional (contas a receber + estoques - fornecedores)." /></span>
                      <span className="font-bold">{formatCurrency(data.balanco.estrutura.ncg)}</span>
                    </div>
                    <div className={`flex justify-between text-xs p-2 rounded-lg font-bold ${data.balanco.estrutura.saldoTesouraria >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      <span>Tesouraria <InfoTooltip text="Diferença entre CGL e NCG. Indica se há folga ou aperto financeiro no caixa." /></span>
                      <span>{formatCurrency(data.balanco.estrutura.saldoTesouraria)}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Eficiência e Giro */}
              {data.balanco.eficiencia && (
                 <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-blue-500 pl-3">Eficiência (Giro)</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs p-2 bg-slate-50 rounded-lg">
                      <span>Giro do Ativo <InfoTooltip text="Mede quantas vezes a receita líquida 'girou' o investimento total da empresa." /></span>
                      <span className="font-bold">{data.balanco.eficiencia.giroAtivo?.toFixed(2) || '0.00'}x</span>
                    </div>
                    <div className="flex justify-between text-xs p-2 bg-slate-50 rounded-lg">
                      <span>Imobilização PL <InfoTooltip text="Quanto do capital próprio está retido em ativos permanentes (não circulantes)." /></span>
                      <span className="font-bold">{formatPercent(data.balanco.eficiencia.imobilizacaoPL)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Solvência */}
              {data.balanco.solvencia && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-amber-500 pl-3">Solvência</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs p-2 bg-slate-50 rounded-lg">
                      <span>Alavancagem <InfoTooltip text="Capacidade da empresa de usar dívidas para potencializar o retorno sobre o capital próprio." /></span>
                      <span className="font-bold">{data.balanco.solvencia.alavancagemFinanceira?.toFixed(2) || '0.00'}x</span>
                    </div>
                    <div className="flex justify-between text-xs p-2 bg-slate-50 rounded-lg">
                      <span>Cobertura Cap. Próprio <InfoTooltip text="Mede o percentual do ativo total que é financiado pelos próprios sócios." /></span>
                      <span className="font-bold">{formatPercent(data.balanco.solvencia.coberturaCapitalProprio)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <EditableNote sectionId="balance-sheet" notes={notes} onSave={handleSaveNote} />
          </div>
        )}

        {/* 3. DESPESAS E OPERACIONAL */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 break-inside-avoid">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">
              3. Eficiência Operacional
              <InfoTooltip text="Analisa o impacto das despesas de suporte sobre o faturamento." />
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Comerciais / Adm <InfoTooltip text="Peso das despesas de vendas e administrativas sobre a receita." /></p>
                <p className="text-lg font-black text-slate-700">{formatPercent(data.kpis.despesasComerciaisPerc)} / {formatPercent(data.kpis.despesasAdmPerc)}</p>
              </div>
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <p className="text-[9px] font-bold text-indigo-400 uppercase mb-1">Índice Eficiência <InfoTooltip text="Relação entre despesas operacionais e receita bruta. Quanto menor, melhor." /></p>
                <p className="text-lg font-black text-indigo-700">{formatPercent(data.kpis.eficienciaOperacional)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">
              4. Geração de Valor
              <InfoTooltip text="Métricas de lucro antes dos efeitos financeiros e tributários." />
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <span className="text-xs font-bold text-slate-500">EBITDA / Margem <InfoTooltip text="Capacidade operacional pura de gerar caixa sobre as vendas." /></span>
                <span className="text-xs font-black text-slate-700">{formatCurrency(currentDRE.ebitda)} | {formatPercent(data.kpis.margemEbitda)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                <span className="text-xs font-bold text-blue-500 uppercase">Alavancagem Op. <InfoTooltip text="Mede o risco operacional: o impacto de uma variação na receita sobre o lucro operacional." /></span>
                <span className="text-xs font-black text-blue-700">{data.kpis.alavancagemOperacional?.toFixed(2)}x</span>
              </div>
            </div>
          </div>
        </div>

        {/* GRÁFICOS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 break-inside-avoid">
          <div className="bg-white p-8 rounded-3xl border shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-6 uppercase tracking-widest">Mix de Resultados</h3>
            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.composition || []} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{COLORS.map((color, index) => <Cell key={`cell-${index}`} fill={color} />)}</Pie><Tooltip formatter={(value: number) => formatCurrency(value)} /></PieChart></ResponsiveContainer></div>
          </div>
          <div className="bg-white p-8 rounded-3xl border shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-6 uppercase tracking-widest">Radar de Score</h3>
            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}><PolarGrid stroke="#f1f5f9" /><PolarAngleAxis dataKey="subject" fontSize={10} stroke="#94a3b8" /><Radar name="Empresa" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} /></RadarChart></ResponsiveContainer></div>
          </div>
          <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl">
            <h3 className="text-sm font-bold mb-6 flex items-center gap-2"><i className="fas fa-landmark text-blue-400"></i> PLANEJAMENTO TRIBUTÁRIO</h3>
            <div className="space-y-4">{data.taxAnalysis?.map((topic, idx) => (<div key={idx} className="flex gap-3 text-xs leading-relaxed border-l-2 border-blue-400 pl-4 py-1"><p>{topic}</p></div>))}</div>
          </div>
        </div>

        {/* INSIGHTS */}
        <div className="bg-white p-8 rounded-3xl border shadow-sm break-inside-avoid">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Insights & Recomendações</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              {data.insights.map((i, idx) => (<div key={idx} className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-600 flex gap-3 border border-slate-100"><i className="fas fa-lightbulb text-amber-500 mt-1"></i><p>{i}</p></div>))}
            </div>
            <div className="space-y-3">
              {data.recommendations.map((r, idx) => (<div key={idx} className="p-4 bg-emerald-50 rounded-2xl text-xs text-slate-700 border border-emerald-100 flex gap-3"><i className="fas fa-check-circle text-emerald-500 mt-1"></i><p>{r}</p></div>))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 no-print">
        <div className="lg:col-span-3">
          <FinancialAIChat data={data} />
        </div>
      </div>
    </div>
  );
};

export default FinancialCharts;

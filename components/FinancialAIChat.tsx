
import React, { useState, useEffect, useRef } from 'react';
import { FinancialAnalysis } from '../types';
import { createFinancialChat } from '../services/geminiService';

interface Props {
  data: FinancialAnalysis;
}

// Função simples para formatar markdown básico (negrito, listas e quebras de linha)
const formatMarkdown = (text: string) => {
  return text.split('\n').map((line, i) => {
    // Listas
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      return <li key={i} className="ml-4 mb-1 list-disc">{line.trim().substring(2)}</li>;
    }
    // Negrito simples
    const parts = line.split(/(\*\*.*?\*\*)/g);
    const content = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} className="font-black text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    return <p key={i} className="mb-2 last:mb-0 min-h-[1em]">{content}</p>;
  });
};

const FinancialAIChat: React.FC<Props> = ({ data }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: 'Olá! Analisei os dados de faturamento e custos. Estou pronto para responder perguntas complexas sobre **margens**, **burn rate** ou **planejamento tributário**. Como posso ajudar?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current = createFinancialChat(data);
  }, [data]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const result = await chatRef.current.sendMessage({ message: userMessage });
      setMessages(prev => [...prev, { role: 'model', text: result.text || "Desculpe, não consegui processar sua pergunta agora." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Houve um erro na comunicação com a IA. Tente novamente." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    "Análise profunda do Burn Rate",
    "Simular redução de 10% nos custos",
    "Impacto tributário do CNAE",
    "Ponto de equilíbrio detalhado"
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col h-[650px] overflow-hidden">
      <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <i className="fas fa-robot text-white text-sm"></i>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 tracking-tight">Especialista Gemini 3 Pro</h3>
            <div className="flex items-center gap-1.5">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Thinking Mode Active</p>
            </div>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-slate-50/30">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] shadow-sm ${
              msg.role === 'user' 
              ? 'bg-indigo-600 text-white p-4 rounded-2xl rounded-tr-none' 
              : 'bg-white text-slate-700 p-5 rounded-2xl rounded-tl-none border border-slate-200'
            }`}>
              <div className={`text-[13px] leading-relaxed ${msg.role === 'model' ? 'space-y-1' : ''}`}>
                {msg.role === 'model' ? formatMarkdown(msg.text) : msg.text}
              </div>
              <div className={`text-[9px] mt-2 opacity-50 font-bold uppercase ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                {msg.role === 'user' ? 'Você' : 'Analista IA'}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-5 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm min-w-[200px]">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processando Raciocínio...</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 w-1/3 animate-[progress_2s_infinite_linear]"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-5 border-t border-slate-100 bg-white">
        <div className="flex flex-wrap gap-2 mb-4">
          {suggestions.map((s, i) => (
            <button 
              key={i} 
              onClick={() => setInput(s)}
              className="text-[10px] font-bold text-slate-500 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 px-3 py-1.5 rounded-xl transition-all border border-slate-100 hover:border-indigo-100"
            >
              {s}
            </button>
          ))}
        </div>
        <form onSubmit={handleSendMessage} className="relative group">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua dúvida financeira..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 pr-14 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-300"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2.5 top-2.5 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-100 active:scale-95"
          >
            <i className="fas fa-arrow-up text-sm"></i>
          </button>
        </form>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}} />
    </div>
  );
};

export default FinancialAIChat;

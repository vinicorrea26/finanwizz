import React, { useState, useEffect } from 'react';
import { analyzeFinancialDocuments } from './services/geminiService';
import { FinancialAnalysis, User, Client } from './types';
import FinancialCharts from './components/FinancialCharts';
import { GoogleGenAI } from "@google/genai";

const INITIAL_CLIENTS: Client[] = [
  { id: '1', razaoSocial: 'Tecnologia Inovadora LTDA', nomeFantasia: 'Tech Inovadora', cnpj: '12.345.678/0001-90', cnae: '6201-5/01', lastAnalysisDate: '2024-05-15' },
];

type ViewState = 'clients' | 'upload' | 'dashboard' | 'register';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [activeClient, setActiveClient] = useState<Client | null>(null);
  const [view, setView] = useState<ViewState>('clients');
  
  const [dreFiles, setDreFiles] = useState<File[]>([]);
  const [bpFiles, setBpFiles] = useState<File[]>([]);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<FinancialAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bgImage, setBgImage] = useState<string>('');
  
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);

  const [registerForm, setRegisterForm] = useState({
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    cnae: ''
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('accounting_user');
    const savedClients = localStorage.getItem('accounting_clients');
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedClients) setClients(JSON.parse(savedClients));

    // Gerar background para login usando Nano Banana (gemini-2.5-flash-image)
    const generateBg = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: 'A sophisticated, minimalist and modern corporate background for a financial analysis software. Abstract 3D charts, clean glass surfaces, blue and dark slate tones, professional office atmosphere, cinematic lighting, 4k resolution.' }]
          }
        });
        
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            setBgImage(`data:image/png;base64,${part.inlineData.data}`);
            break;
          }
        }
      } catch (e) {
        console.error("Failed to generate background image", e);
      }
    };
    
    if (!savedUser) generateBg();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.email === 'teste@gmail.com' && loginForm.password === '123456') {
      const userData: User = { name: 'Alexy Divino', email: loginForm.email, officeName: 'Divino Consultoria Financeira' };
      setUser(userData);
      localStorage.setItem('accounting_user', JSON.stringify(userData));
    } else {
      setLoginError('E-mail ou senha incorretos.');
    }
  };

  const handleRegisterClient = (e: React.FormEvent) => {
    e.preventDefault();
    const newClient: Client = {
      id: Math.random().toString(36).substr(2, 9),
      ...registerForm
    };
    const updatedClients = [...clients, newClient];
    setClients(updatedClients);
    localStorage.setItem('accounting_clients', JSON.stringify(updatedClients));
    setRegisterForm({ razaoSocial: '', nomeFantasia: '', cnpj: '', cnae: '' });
    setView('clients');
  };

  const startAnalysis = async () => {
    if ((dreFiles.length === 0 && bpFiles.length === 0) || !activeClient) return;
    
    setIsAnalyzing(true);
    setError(null);
    try {
      const analysis = await analyzeFinancialDocuments(dreFiles, bpFiles, activeClient);
      const enrichedResult: FinancialAnalysis = {
        ...analysis,
        id: Math.random().toString(36).substr(2, 9),
        clientId: activeClient.id,
        date: new Date().toISOString()
      };
      setResult(enrichedResult);
      setView('dashboard');
    } catch (err) {
      console.error(err);
      setError("Falha no processamento. Verifique a qualidade dos arquivos.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!user) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center transition-all duration-1000"
        style={{ 
          backgroundImage: bgImage ? `linear-gradient(rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.8)), url(${bgImage})` : 'none',
          backgroundColor: '#0f172a'
        }}
      >
        <div className="bg-white/95 backdrop-blur-md w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20">
          <div className="bg-blue-600/90 p-10 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <i className="fas fa-network-wired text-9xl -translate-x-10 -translate-y-10 rotate-12"></i>
            </div>
            <h1 className="text-3xl font-black tracking-tighter mb-1">FinanzaViz AI</h1>
            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest opacity-80">Alexy Divino Enterprise</p>
          </div>
          <form onSubmit={handleLogin} className="p-10 space-y-5">
            {loginError && <div className="text-rose-600 text-[10px] font-black uppercase text-center bg-rose-50 py-2 rounded-lg">{loginError}</div>}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
              <input type="email" required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" placeholder="ex: alexy@divino.com" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
              <input type="password" required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" placeholder="••••••••" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 mt-4">
              Acessar Ecossistema
            </button>
            <p className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Sua inteligência financeira começa aqui.</p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-slate-900 text-slate-400 hidden lg:flex flex-col fixed h-full border-r border-slate-800">
        <div className="p-6 border-b border-slate-800 font-bold text-white flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <i className="fas fa-bolt text-xs"></i>
          </div>
          FinanzaViz AI
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <button onClick={() => setView('clients')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${view === 'clients' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}><i className="fas fa-users"></i> Clientes</button>
          <button onClick={() => setView('register')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${view === 'register' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}><i className="fas fa-plus"></i> Nova Empresa</button>
        </nav>
        <div className="p-6 text-[10px] font-bold opacity-40 uppercase tracking-widest text-center">
          Powered by Gemini 3 Flash
        </div>
      </aside>

      <main className="flex-1 lg:ml-64">
        <header className="bg-white border-b h-16 flex items-center px-8 justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md border border-emerald-200 uppercase tracking-tighter">Ultra-Fast Engine Active</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-800">{user.name}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase">{user.officeName}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">{user.name[0]}</div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {error && <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold flex items-center gap-2"><i className="fas fa-circle-exclamation"></i> {error}</div>}
          
          {view === 'clients' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clients.map(c => (
                <div key={c.id} className="group bg-white p-6 rounded-3xl border border-slate-200 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-50 cursor-pointer transition-all" onClick={() => {setActiveClient(c); setView('upload'); setDreFiles([]); setBpFiles([]);}}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                      <i className="fas fa-building text-slate-400 group-hover:text-blue-500"></i>
                    </div>
                    <span className="text-[10px] font-bold text-slate-300">ID: {c.id}</span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm mb-1">{c.nomeFantasia}</h3>
                  <p className="text-[10px] text-slate-400 font-medium uppercase">{c.razaoSocial}</p>
                  <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-400">CNPJ: {c.cnpj}</span>
                    <i className="fas fa-arrow-right text-slate-200 group-hover:text-blue-400 transition-all group-hover:translate-x-1"></i>
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === 'upload' && activeClient && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <i className="fas fa-rocket text-8xl -rotate-45"></i>
                </div>
                
                <div className="mb-10">
                  <h2 className="text-2xl font-black text-slate-900 mb-2">Processamento de {activeClient.nomeFantasia}</h2>
                  <p className="text-xs text-slate-400 font-medium">Arquivos enviados serão processados pela engine de latência ultra-baixa.</p>
                </div>
                
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <i className="fas fa-file-invoice-dollar text-blue-500"></i> DRE / Fluxo de Caixa (Obrigatório)
                    </label>
                    <div className="border-2 border-dashed border-slate-100 rounded-3xl p-8 text-center hover:bg-slate-50 hover:border-blue-200 relative cursor-pointer group transition-all">
                      <input type="file" multiple accept=".pdf,.xlsx,.xls,image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files && setDreFiles(Array.from(e.target.files))} />
                      <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <i className="fas fa-cloud-upload-alt text-slate-300 group-hover:text-blue-500 transition-colors"></i>
                      </div>
                      <span className="text-xs font-bold text-slate-500 block">
                        {dreFiles.length > 0 ? `${dreFiles.length} Arquivos Selecionados` : 'Arraste ou clique para selecionar'}
                      </span>
                      <p className="text-[9px] text-slate-300 mt-2">Suporta PDF, Imagens e Excel</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <i className="fas fa-scale-balanced text-emerald-500"></i> Balanço Patrimonial (Opcional)
                    </label>
                    <div className="border-2 border-dashed border-slate-100 rounded-3xl p-8 text-center hover:bg-slate-50 hover:border-emerald-200 relative cursor-pointer group transition-all">
                      <input type="file" multiple accept=".pdf,.xlsx,.xls,image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files && setBpFiles(Array.from(e.target.files))} />
                      <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <i className="fas fa-file-shield text-slate-300 group-hover:text-emerald-500 transition-colors"></i>
                      </div>
                      <span className="text-xs font-bold text-slate-500 block">
                        {bpFiles.length > 0 ? `${bpFiles.length} Arquivos de Balanço` : 'Anexar Balanço para Análise de Liquidez'}
                      </span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={startAnalysis} 
                  disabled={isAnalyzing || (dreFiles.length === 0 && bpFiles.length === 0)} 
                  className={`mt-12 w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl ${isAnalyzing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-black shadow-slate-200'}`}
                >
                  {isAnalyzing ? (
                    <span className="flex items-center justify-center gap-2">
                      <i className="fas fa-bolt fa-pulse text-yellow-400"></i>
                      Processando em Alta Velocidade...
                    </span>
                  ) : 'Iniciar Análise Instantânea'}
                </button>
              </div>
            </div>
          )}

          {view === 'dashboard' && result && (
            <FinancialCharts data={result} />
          )}

          {view === 'register' && (
            <div className="max-w-xl mx-auto bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h2 className="text-xl font-black text-slate-900 mb-8">Cadastrar Nova Empresa</h2>
              <form onSubmit={handleRegisterClient} className="space-y-5">
                {[
                  { label: 'Razão Social', key: 'razaoSocial' },
                  { label: 'Nome Fantasia', key: 'nomeFantasia' },
                  { label: 'CNPJ', key: 'cnpj' },
                  { label: 'CNAE Principal', key: 'cnae' }
                ].map((f, i) => (
                  <div key={i} className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{f.label}</label>
                    <input type="text" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" value={(registerForm as any)[f.key]} onChange={e => setRegisterForm({...registerForm, [f.key]: e.target.value})} />
                  </div>
                ))}
                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold mt-6 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">Registrar Cliente</button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;

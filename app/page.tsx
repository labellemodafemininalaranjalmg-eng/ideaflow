'use client';

import { useState, useEffect } from 'react';
import { Trash2, Search, Plus, Moon, Sun, Type, Calendar as CalendarIcon } from 'lucide-react';

interface Nota {
  id: number;
  titulo: string;
  conteudo: string;
  data: string;
}

export default function Home() {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [idNotaAtiva, setIdNotaAtiva] = useState<number | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [busca, setBusca] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [podeEditar, setPodeEditar] = useState(false);

  useEffect(() => {
    const dados = localStorage.getItem('@ideaflow:notas');
    if (dados) setNotas(JSON.parse(dados));
  }, []);

  useEffect(() => {
    localStorage.setItem('@ideaflow:notas', JSON.stringify(notas));
  }, [notas]);

  const mostrarMensagem = (texto: string) => {
    setMensagem(texto);
    setTimeout(() => setMensagem(''), 2000);
  };

  const salvarNota = () => {
    if (!titulo.trim() || !conteudo.trim()) return;
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    if (idNotaAtiva) {
      setNotas(notas.map(n => n.id === idNotaAtiva ? { ...n, titulo, conteudo, data: dataAtual } : n));
      setIdNotaAtiva(null);
      setPodeEditar(false);
      mostrarMensagem("Atualizado! ✨");
    } else {
      const nova: Nota = { id: Date.now(), titulo, conteudo, data: dataAtual };
      setNotas([nova, ...notas]);
      mostrarMensagem("Salvo! 🚀");
    }
    setTitulo('');
    setConteudo('');
  };

  const excluirNota = (id: number) => {
    setNotas(notas.filter(n => n.id !== id));
    mostrarMensagem("Removido. 🗑️");
  };

  const notasFiltradas = notas.filter(n => 
    n.titulo.toLowerCase().includes(busca.toLowerCase()) || 
    n.conteudo.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <main className={`flex h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* FEEDBACK */}
      {mensagem && (
        <div className="fixed bottom-10 right-10 z-50 bg-blue-600 text-white px-6 py-3 rounded-xl shadow-xl">
          {mensagem}
        </div>
      )}

      {/* SIDEBAR */}
      <aside className={`w-64 border-r flex flex-col ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-blue-500">IdeaFlow</h1>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 hover:bg-slate-700 rounded-lg">
              {darkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-slate-500" />}
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Buscar..."
              className={`w-full pl-9 pr-4 py-2 rounded-lg outline-none text-sm ${darkMode ? 'bg-slate-700 text-white' : 'bg-slate-100'}`}
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-6">
          {notasFiltradas.map((nota) => (
<div 
  key={nota.id} 
  onClick={() => { 
    setTitulo(nota.titulo); 
    setConteudo(nota.conteudo); 
    setIdNotaAtiva(nota.id); 
    setPodeEditar(false); // <--- Adicione esta linha aqui
  }}
  className={`group p-4 mb-1 rounded-xl cursor-pointer relative transition-all ${
    idNotaAtiva === nota.id 
      ? (darkMode ? 'bg-slate-700 border-l-4 border-blue-500' : 'bg-blue-50 border-l-4 border-blue-500') 
      : 'hover:bg-slate-700/10'
  }`}
>              <p className="font-medium truncate pr-6">{nota.titulo}</p>
              <div className="flex items-center gap-2 mt-1 opacity-60 text-[10px] font-bold uppercase tracking-wider">
                <CalendarIcon size={10} />
                <span>{nota.data}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); excluirNota(nota.id); }}
                className="absolute right-4 top-5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </aside>

{/* EDITOR */}
      <section className={`flex-1 flex flex-col overflow-hidden ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
        
        {/* BARRA DE FERRAMENTAS - TAMANHO DA FONTE E BOTÃO DE EDIÇÃO */}
        <div className={`flex items-center justify-between px-8 py-3 border-b ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-1 p-1 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
              {[
                { label: 'P', size: 14 },
                { label: 'M', size: 18 },
                { label: 'G', size: 24 }
              ].map((nivel) => (
                <button
                  key={nivel.label}
                  onClick={() => setFontSize(nivel.size)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    fontSize === nivel.size 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : (darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-white')
                  }`}
                >
                  {nivel.label}
                </button>
              ))}
            </div>
            <Type size={16} className="text-slate-400" />
            
            {/* BOTÃO DE EDITAR - POSIÇÃO E ESTILO MANTIDOS */}
            {idNotaAtiva && (
              <button
                onClick={() => setPodeEditar(!podeEditar)}
                className={`ml-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  podeEditar 
                    ? 'bg-green-500 text-white' 
                    : (darkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500')
                }`}
              >
                {podeEditar ? 'Edição Liberada' : 'Somente Leitura'}
              </button>
            )}
          </div>
        </div>

        {/* ÁREA DE CONTEÚDO CENTRALIZADA COM BORDAS REINTRODUZIDAS */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-10 py-12 flex flex-col min-h-full">
            <input 
              type="text" 
              placeholder="Título" 
              readOnly={!podeEditar && !!idNotaAtiva}
              className={`text-4xl font-extrabold outline-none mb-8 p-3 rounded-lg border-2 transition-all w-full
                ${darkMode 
                  ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-700 focus:border-blue-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-200 focus:border-blue-400'
                }
                ${(!podeEditar && idNotaAtiva) ? 'cursor-default border-transparent bg-transparent' : ''}`}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />

            <textarea 
              placeholder="O que você está pensando?..." 
              readOnly={!podeEditar && !!idNotaAtiva}
              style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }}
              className={`flex-1 outline-none resize-none p-6 rounded-xl border-2 transition-all w-full
                ${darkMode 
                  ? 'bg-slate-800/50 border-slate-700 text-slate-300 placeholder:text-slate-800 focus:border-blue-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 placeholder:text-slate-300 focus:border-blue-400'
                }
                ${(!podeEditar && idNotaAtiva) ? 'cursor-default border-transparent bg-transparent' : ''}`}
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
            />

            {/* RODAPÉ DE AÇÕES - MANTIDO */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end items-center gap-6">
              <button 
                onClick={() => { setTitulo(''); setConteudo(''); setIdNotaAtiva(null); setPodeEditar(true); }} 
                className="text-sm font-semibold text-slate-400 hover:text-red-500 transition-colors"
              >
                Descartar
              </button>
              <button 
                onClick={salvarNota} 
                className="bg-blue-600 text-white px-10 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
              >
                {idNotaAtiva ? 'Atualizar' : 'Salvar Ideia'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Trash2,
  Search,
  Moon,
  Sun,
  Calendar as CalendarIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Highlighter,
  PenLine,
  BookOpen,
  Plus
} from 'lucide-react';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';

interface Nota {
  id: number;
  titulo: string;
  conteudo: string;
  data: string;
}

const storage = {
  get: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  },
  set: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('Erro ao salvar: LocalStorage cheio (provavelmente imagens grandes).', e);
    }
  },
};

const STORAGE_KEY = '@ideaflow:notas';

export default function Home() {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [titulo, setTitulo] = useState('');
  const [idNotaAtiva, setIdNotaAtiva] = useState<number | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [busca, setBusca] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [podeEditar, setPodeEditar] = useState(true);
  const [carregado, setCarregado] = useState(false);

  const editorRef = useRef<any>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg shadow-md max-w-full h-auto',
        },
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    immediatelyRender: false,
    content: '',
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[400px] prose dark:prose-invert max-w-none p-4',
      },
      // Suporte para Colar Imagem
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items ?? []);
        for (const item of items) {
          if (item.type.indexOf('image') === 0) {
            const file = item.getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = (e) => {
                const src = e.target?.result as string;
                editorRef.current?.chain().focus().setImage({ src }).run();
              };
              reader.readAsDataURL(file);
              return true; 
            }
          }
        }
        return false;
      },
      // Suporte para Arrastar e Soltar Imagem
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const src = e.target?.result as string;
              editorRef.current?.chain().focus().setImage({ src }).run();
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Carregamento inicial
  useEffect(() => {
    const salvas = storage.get(STORAGE_KEY);
    if (salvas) {
      try {
        setNotas(JSON.parse(salvas));
      } catch (e) {
        console.error(e);
      }
    }
    setCarregado(true);
  }, []);

  // Persistência automática
  useEffect(() => {
    if (carregado) {
      storage.set(STORAGE_KEY, JSON.stringify(notas));
    }
  }, [notas, carregado]);

  // Sincroniza estado de edição
  useEffect(() => {
    if (editor) {
      editor.setEditable(podeEditar);
    }
  }, [podeEditar, editor]);

  const mostrarMensagem = useCallback((texto: string) => {
    setMensagem(texto);
    setTimeout(() => setMensagem(''), 2000);
  }, []);

  const salvarNota = useCallback(() => {
    if (!editor) return;
    const htmlConteudo = editor.getHTML();
    if (!titulo.trim() || htmlConteudo === '<p></p>') {
      mostrarMensagem('Preencha título e conteúdo! ⚠️');
      return;
    }
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    if (idNotaAtiva) {
      setNotas(prev => prev.map(n =>
        n.id === idNotaAtiva ? { ...n, titulo, conteudo: htmlConteudo, data: dataAtual } : n
      ));
      mostrarMensagem('Atualizado! ✨');
    } else {
      const nova: Nota = { id: Date.now(), titulo, conteudo: htmlConteudo, data: dataAtual };
      setNotas(prev => [nova, ...prev]);
      setIdNotaAtiva(nova.id);
      mostrarMensagem('Salvo! 🚀');
    }
  }, [editor, titulo, idNotaAtiva, mostrarMensagem]);

  const excluirNota = useCallback((id: number) => {
    if (!window.confirm('Excluir permanentemente?')) return;
    setNotas(prev => prev.filter(n => n.id !== id));
    if (idNotaAtiva === id) limparEditor();
    mostrarMensagem('Removido. 🗑️');
  }, [idNotaAtiva, mostrarMensagem]);

  const limparEditor = () => {
    setTitulo('');
    editor?.commands.setContent('');
    setIdNotaAtiva(null);
    setPodeEditar(true);
  };

  const addImage = () => {
    const url = window.prompt('Cole a URL da imagem:');
    if (url) editor?.chain().focus().setImage({ src: url }).run();
  };

  const notasFiltradas = notas.filter(n =>
    n.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    n.conteudo.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <main className={`flex h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {mensagem && (
        <div className="fixed bottom-10 right-10 z-50 bg-blue-600 text-white px-6 py-3 rounded-xl shadow-xl animate-bounce">
          {mensagem}
        </div>
      )}

      {/* SIDEBAR */}
      <aside className={`w-64 border-r flex flex-col ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-black text-blue-500 tracking-tighter italic">IdeaFlow</h1>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 hover:bg-slate-700/20 rounded-lg">
              {darkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-slate-500" />}
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar ideias..."
              className={`w-full pl-9 pr-4 py-2 rounded-lg outline-none text-sm ${darkMode ? 'bg-slate-700 text-white' : 'bg-slate-100'}`}
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-6">
          <button 
            onClick={limparEditor}
            className="w-full mb-4 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl hover:border-blue-500 hover:text-blue-500 transition-all text-xs font-bold uppercase"
          >
            <Plus size={14} /> Nova Nota
          </button>
          
          {notasFiltradas.map((nota) => (
            <div
              key={nota.id}
              onClick={() => {
                setTitulo(nota.titulo);
                editor?.commands.setContent(nota.conteudo);
                setIdNotaAtiva(nota.id);
                setPodeEditar(true); // Permite editar ao clicar
              }}
              className={`group p-4 mb-2 rounded-xl cursor-pointer relative transition-all ${
                idNotaAtiva === nota.id 
                ? (darkMode ? 'bg-slate-700 border-l-4 border-blue-500' : 'bg-blue-50 border-l-4 border-blue-500')
                : 'hover:bg-slate-700/10'
              }`}
            >
              <p className="font-bold truncate pr-6 text-sm">{nota.titulo}</p>
              <div className="flex items-center gap-2 mt-1 opacity-50 text-[10px]">
                <CalendarIcon size={10} />
                <span>{nota.data}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); excluirNota(nota.id); }}
                className="absolute right-4 top-5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* EDITOR AREA */}
      <section className="flex-1 flex flex-col overflow-hidden">
        <div className={`flex items-center justify-between px-8 py-3 border-b ${darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}`}>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3 }).run()} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500" title="Tabela"><TableIcon size={18} /></button>
            <button onClick={addImage} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500" title="Imagem"><ImageIcon size={18} /></button>
            
            <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2" />
            
            <button onClick={() => editor?.chain().focus().setColor('#ef4444').run()} className="p-2 hover:bg-red-50 rounded-lg text-red-500"><Highlighter size={18} /></button>
            <button onClick={() => editor?.chain().focus().setColor(darkMode ? '#f1f5f9' : '#0f172a').run()} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><Highlighter size={18} /></button>

            <div className={`flex items-center gap-1 p-1 rounded-xl ml-4 ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
              {[14, 18, 24].map((size) => (
                <button key={size} onClick={() => setFontSize(size)} className={`px-3 py-1 rounded-lg text-xs font-bold ${fontSize === size ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>
                  {size === 14 ? 'P' : size === 18 ? 'M' : 'G'}
                </button>
              ))}
            </div>

            {idNotaAtiva && (
              <button 
                onClick={() => setPodeEditar(!podeEditar)}
                className={`ml-4 flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${podeEditar ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}`}
              >
                {podeEditar ? <><PenLine size={12} /> Editando</> : <><BookOpen size={12} /> Leitura</>}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10">
          <div className="max-w-3xl mx-auto">
            <input
              type="text"
              placeholder="Título da ideia..."
              className={`text-4xl font-black outline-none mb-6 w-full bg-transparent ${darkMode ? 'text-white placeholder:text-slate-800' : 'text-slate-900 placeholder:text-slate-200'}`}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              disabled={!podeEditar}
            />
            <div style={{ fontSize: `${fontSize}px` }} className={`min-h-[500px] transition-all ${!podeEditar ? 'opacity-80' : ''}`}>
              <EditorContent editor={editor} />
            </div>
            
            <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-4">
              <button onClick={salvarNota} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-xl transition-all transform active:scale-95">
                {idNotaAtiva ? 'Atualizar Nota' : 'Salvar Ideia'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
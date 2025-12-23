import { useEffect, useState } from 'react';
import './globals.css';

// Importação dos componentes que criamos
import Layout from './components/Layout';
import DatabaseCard from './components/DatabaseCard';
import DataTable from './components/DataTable';

// Importação do cliente Supabase corrigido para Vite
import { supabase } from './lib/supabaseClient';

function App() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'online' | 'offline' | 'loading'>('loading');

  // Função para buscar dados do Supabase
  const fetchData = async () => {
    setLoading(true);
    setDbStatus('loading');
    
    try {
      // Substitua 'profiles' pelo nome da sua tabela real no Supabase
      const { data: records, error } = await supabase
        .from('profiles') 
        .select('*')
        .limit(10);

      if (error) throw error;

      setData(records || []);
      setDbStatus('online');
    } catch (error) {
      console.error('Erro na conexão com Nexus:', error);
      setDbStatus('offline');
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados ao iniciar o app
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Layout>
      <div className="flex flex-col gap-8">
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Painel de Controle Nexus</h1>
            <p className="text-slate-400 text-sm">Gerencie suas conexões e registros criptografados.</p>
          </div>
          
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            Sincronizar Banco
          </button>
        </div>

        {/* Grade de Conteúdo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Coluna Lateral: Status e Infos */}
          <div className="flex flex-col gap-6">
            <DatabaseCard status={dbStatus} tableName="profiles" />
            
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">Segurança do App</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Exportação de código desativada
                </li>
                <li className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Conexão ponta-a-ponta com Supabase
                </li>
                <li className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Variáveis de ambiente protegidas
                </li>
              </ul>
            </div>
          </div>

          {/* Coluna Principal: Tabela de Dados */}
          <div className="lg:col-span-2">
            <DataTable data={data} loading={loading} />
          </div>

        </div>
      </div>
    </Layout>
  );
}

export default App;

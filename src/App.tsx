import { useEffect, useState } from 'react';
import './globals.css';

// IMPORTAÇÕES CORRIGIDAS: 
// Como App.tsx está em 'src/', e os componentes em 'src/components/',
// o caminho correto é './components/...'
import Layout from './components/Layout';
import DatabaseCard from './components/DatabaseCard';
import DataTable from './components/DataTable';

// Como supabaseClient.js está em 'lib/', que está na raiz (fora de src),
// precisamos subir um nível (../) para encontrá-lo.
import { supabase } from '../lib/supabaseClient';

function App() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'online' | 'offline' | 'loading'>('loading');

  const fetchData = async () => {
    setLoading(true);
    setDbStatus('loading');
    try {
      // Tenta buscar da tabela 'profiles' (certifique-se que ela existe no seu Supabase)
      const { data: records, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(10);

      if (error) throw error;

      setData(records || []);
      setDbStatus('online');
    } catch (error) {
      console.error('Erro Nexus:', error);
      setDbStatus('offline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Layout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Painel de Controle Nexus</h1>
            <p className="text-slate-400 text-sm">Monitoramento em tempo real do banco de dados.</p>
          </div>
          
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-blue-500/20"
          >
            Sincronizar Banco
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="flex flex-col gap-6">
            <DatabaseCard status={dbStatus} tableName="profiles" />
          </div>

          <div className="lg:col-span-2">
            <DataTable data={data} loading={loading} />
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default App;

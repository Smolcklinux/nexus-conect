import { useEffect, useState } from 'react';
import './globals.css';

// Importações com caminhos corrigidos (subindo um nível para sair de src)
import Layout from './components/Layout';
import DatabaseCard from './components/DatabaseCard';
import DataTable from './components/DataTable';
import { supabase } from '../lib/supabaseClient';

function App() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'online' | 'offline' | 'loading'>('loading');

  const fetchData = async () => {
    setLoading(true);
    setDbStatus('loading');
    try {
      const { data: records, error } = await supabase.from('profiles').select('*').limit(10);
      if (error) throw error;
      setData(records || []);
      setDbStatus('online');
    } catch (error) {
      setDbStatus('offline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <Layout>
      <div className="flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Nexus Dashboard</h1>
          <button onClick={fetchData} className="px-4 py-2 bg-blue-600 rounded-lg text-sm">Sincronizar</button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <DatabaseCard status={dbStatus} />
          <div className="lg:col-span-2">
            <DataTable data={data} loading={loading} />
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default App;

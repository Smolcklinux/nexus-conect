import React from 'react';
import { FileText, alertCircle, CheckCircle2, Clock } from 'lucide-react';

interface DataItem {
  id: string | number;
  created_at?: string;
  name?: string;
  email?: string;
  status?: string;
  [key: string]: any; // Permite outras colunas dinâmicas
}

interface DataTableProps {
  data: DataItem[];
  loading: boolean;
}

const DataTable: React.FC<DataTableProps> = ({ data, loading }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <div>
          <h3 className="font-semibold text-xl text-white">Registros do Nexus</h3>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Sincronização Ativa</p>
        </div>
        <FileText className="text-slate-700" size={24} />
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm animate-pulse">Consultando Supabase...</p>
          </div>
        ) : data.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead className="text-xs text-slate-500 bg-slate-950/50 uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">ID / Identificador</th>
                <th className="px-6 py-4 font-medium">Nome / Descrição</th>
                <th className="px-6 py-4 font-medium">Data de Registro</th>
                <th className="px-6 py-4 font-medium text-center">Status Nexus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-blue-500/5 transition-colors group">
                  <td className="px-6 py-4 font-mono text-xs text-blue-400">
                    {item.id.toString().substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-200">
                      {item.name || item.full_name || item.email || "Registro Sincronizado"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Clock size={12} />
                      {item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <span className="flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-500 text-[10px] rounded border border-green-500/20 font-bold">
                        <CheckCircle2 size={10} /> PROTEGIDO
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <alertCircle className="text-slate-800" size={40} />
            <p className="text-slate-500 text-sm">Nenhum dado encontrado nesta tabela.</p>
          </div>
        )}
      </div>
      
      <div className="p-4 bg-slate-950/30 border-t border-slate-800">
        <p className="text-[10px] text-slate-600 text-center uppercase tracking-tighter">
          Acesso Restrito • Monitoramento Criptografado Nexus
        </p>
      </div>
    </div>
  );
};

export default DataTable;

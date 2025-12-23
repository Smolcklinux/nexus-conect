import React from 'react';
import { Database, ShieldCheck, Activity, Server } from 'lucide-react';

interface DatabaseCardProps {
  status: 'online' | 'offline' | 'loading';
  tableName?: string;
}

const DatabaseCard: React.FC<DatabaseCardProps> = ({ status, tableName = "profiles" }) => {
  const isOnline = status === 'online';
  const isLoading = status === 'loading';

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl transition-all hover:border-blue-500/50">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
          <Database className="text-blue-500" size={20} /> 
          Banco de Dados
        </h3>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
          isOnline ? 'bg-green-500/10 text-green-500' : 
          isLoading ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            isOnline ? 'bg-green-500 animate-pulse' : 
            isLoading ? 'bg-yellow-500 animate-bounce' : 'bg-red-500'
          }`} />
          {status}
        </div>
      </div>

      <div className="space-y-4">
        {/* Provedor */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <Server size={14} />
            <span>Provedor:</span>
          </div>
          <span className="font-mono text-blue-400">Supabase</span>
        </div>

        {/* Tabela Ativa */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <Activity size={14} />
            <span>Tabela:</span>
          </div>
          <span className="text-slate-200">{tableName}</span>
        </div>

        {/* Segurança */}
        <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck size={14} />
            <span>Segurança:</span>
          </div>
          <span className="text-green-500 font-medium">SSL Ativo</span>
        </div>
      </div>

      {/* Informativo de Proteção de Código */}
      <div className="mt-6 p-3 bg-blue-600/10 border border-blue-500/20 rounded-lg">
        <p className="text-[11px] text-blue-300 leading-relaxed text-center">
          O código fonte do Nexus Conect está protegido. 
          As funções de download local foram desativadas por segurança.
        </p>
      </div>
    </div>
  );
};

export default DatabaseCard;

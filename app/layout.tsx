import React from 'react';
import { Server, Shield, User } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-950 text-white">
      {/* Navbar com Efeito de Vidro */}
      <header className="glass-effect sticky top-0 z-50 h-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Server className="text-white" size={18} />
            </div>
            <span className="text-xl font-bold tracking-tight">
              NEXUS <span className="text-blue-500">CONECT</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#" className="hover:text-blue-400 transition-colors">Dashboard</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Segurança</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Logs</a>
          </nav>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-xs font-bold text-white">Admin Nexus</span>
              <span className="text-[10px] text-green-500 flex items-center gap-1">
                <Shield size={10} /> Autenticado
              </span>
            </div>
            <div className="w-10 h-10 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center">
              <User size={20} className="text-slate-400" />
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-6 py-8 animate-fade-in">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-900 bg-slate-950 text-center">
        <p className="text-slate-600 text-xs tracking-widest uppercase">
          Nexus Conect &copy; 2025 • Sistema de Monitoramento Criptografado
        </p>
        <div className="mt-2 flex justify-center gap-4 text-[10px] text-slate-700">
          <span>PROTOCOLO V4.2</span>
          <span>•</span>
          <span>SISTEMA PROTEGIDO</span>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

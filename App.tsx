"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function NexusConect() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Função para buscar dados do Supabase
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: posts, error } = await supabase
        .from('seus_dados') // Substitua pelo nome da sua tabela
        .select('*');

      if (error) throw error;
      setData(posts);
    } catch (error) {
      console.error('Erro ao conectar com o banco:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-bold mb-6">Nexus Conect</h1>
      
      <div className="w-full max-w-2xl bg-gray-800 p-6 rounded-lg shadow-xl">
        <h2 className="text-xl mb-4">Conexão com Banco de Dados</h2>
        
        {loading ? (
          <p>Carregando dados...</p>
        ) : (
          <ul className="space-y-2">
            {data.map((item: any) => (
              <li key={item.id} className="p-2 border-b border-gray-700">
                {item.nome || 'Item sem nome'}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* A seção de download foi removida daqui 
          para garantir que o usuário não baixe o código fonte.
      */}
      
      <footer className="mt-8 text-gray-500 text-sm">
        Nexus Conect &copy; 2025 - Sistema de Conexão Segura
      </footer>
    </div>
  );
}

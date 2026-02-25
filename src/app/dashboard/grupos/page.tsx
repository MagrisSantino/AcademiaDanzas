"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Pencil, Search, Trash2, UsersRound } from "lucide-react";
import Link from "next/link";

export default function GruposPage() {
  const [grupos, setGrupos] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => { fetchGrupos(); }, []);

  const fetchGrupos = async () => {
    const { data } = await supabase.from("grupos").select("*").order("nombre");
    if (data) setGrupos(data);
  };

  const handleEliminar = async (id: string, nombre: string) => {
    if (window.confirm(`¿Estás segura de que querés eliminar el grupo ${nombre}?`)) {
      const { error } = await supabase.from("grupos").delete().eq("id", id);
      if (!error) setGrupos(grupos.filter(g => g.id !== id));
      else alert("Error: " + error.message);
    }
  };

  const filtrados = grupos.filter(g => g.nombre.toLowerCase().includes(busqueda.toLowerCase()) || g.profesora.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-black text-brand-dark flex items-center gap-3">
          <UsersRound className="text-brand-fuchsia" size={32} /> Grupos de Danza
        </h1>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input type="text" placeholder="Buscar grupo o profe..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="pl-10 p-2 w-full border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-fuchsia"/>
          </div>
          <Link href="/dashboard/grupos/nuevo" className="bg-brand-fuchsia text-brand-light px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-transform hover:scale-105 w-full sm:w-auto">
            <Plus size={20} /> Crear Grupo
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtrados.length === 0 ? (
          <p className="text-gray-500 col-span-full">No hay grupos registrados todavía.</p>
        ) : (
          filtrados.map(g => (
            <div key={g.id} className="bg-white rounded-xl shadow-sm border border-brand-pink p-6 hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-brand-pink text-brand-fuchsia font-black px-4 py-1 rounded-bl-xl text-sm">
                {g.alumnas_ids?.length || 0} Alumnas
              </div>
              <h2 className="text-xl font-black text-brand-dark mb-1">{g.nombre}</h2>
              <p className="text-gray-600 font-medium mb-6">Profe: <span className="text-brand-fuchsia">{g.profesora}</span></p>
              
              <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                <Link href={`/dashboard/grupos/editar/${g.id}`} className="text-brand-dark font-bold hover:text-brand-fuchsia flex items-center gap-2 text-sm transition-colors">
                  <Pencil size={16} /> Editar Lista
                </Link>
                <button onClick={() => handleEliminar(g.id, g.nombre)} className="text-red-400 hover:text-red-600 transition-colors p-1">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
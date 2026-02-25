"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Search, ClipboardCheck, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ListaGruposAsistencia() {
  const [grupos, setGrupos] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    const fetchGrupos = async () => {
      const { data } = await supabase.from("grupos").select("*").order("nombre");
      if (data) setGrupos(data);
    };
    fetchGrupos();
  }, []);

  const filtrados = grupos.filter(g => g.nombre.toLowerCase().includes(busqueda.toLowerCase()) || g.profesora.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-black text-brand-dark flex items-center gap-3">
          <ClipboardCheck className="text-brand-fuchsia" size={32} /> Tomar Asistencia
        </h1>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input type="text" placeholder="Buscar grupo o profe..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="pl-10 p-2 w-full border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-fuchsia"/>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtrados.length === 0 ? (
          <p className="text-gray-500">No hay grupos disponibles.</p>
        ) : (
          filtrados.map(g => (
            <Link key={g.id} href={`/dashboard/asistencia/${g.id}`} className="bg-white rounded-xl shadow-sm border border-brand-pink p-5 hover:shadow-md transition-all flex justify-between items-center group">
              <div>
                <h2 className="text-xl font-black text-brand-dark mb-1 group-hover:text-brand-fuchsia transition-colors">{g.nombre}</h2>
                <p className="text-sm text-gray-500 font-bold">Profe: {g.profesora}</p>
                <p className="text-xs text-brand-fuchsia font-bold mt-2 bg-brand-pink/30 inline-block px-2 py-1 rounded-md">{g.alumnas_ids?.length || 0} alumnas inscriptas</p>
              </div>
              <ChevronRight className="text-gray-300 group-hover:text-brand-fuchsia transition-colors" size={28} />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
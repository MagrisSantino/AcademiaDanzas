"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Search, Users } from "lucide-react";
import Link from "next/link";

export default function NuevoGrupoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [alumnas, setAlumnas] = useState<any[]>([]);
  const [busquedaAlumnas, setBusquedaAlumnas] = useState("");
  
  const [nombre, setNombre] = useState("");
  const [profesora, setProfesora] = useState("");
  const [alumnasSeleccionadas, setAlumnasSeleccionadas] = useState<string[]>([]);

  useEffect(() => {
    const fetchAlumnas = async () => {
      const { data } = await supabase.from("alumnas").select("id, nombre").eq("activa", true).order("nombre");
      if (data) setAlumnas(data);
    };
    fetchAlumnas();
  }, []);

  const toggleAlumna = (id: string) => {
    setAlumnasSeleccionadas(prev => 
      prev.includes(id) ? prev.filter(aId => aId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("grupos").insert([{
      nombre,
      profesora,
      alumnas_ids: alumnasSeleccionadas
    }]);

    setLoading(false);
    if (!error) router.push("/dashboard/grupos");
    else alert("Error al guardar: " + error.message);
  };

  const alumnasFiltradas = alumnas.filter(a => a.nombre.toLowerCase().includes(busquedaAlumnas.toLowerCase()));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/grupos" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <h1 className="text-3xl font-black text-brand-dark">Crear Grupo</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-brand-pink space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nombre de la Danza / Grupo *</label>
            <input type="text" required value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Tap Avanzado" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-fuchsia outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nombre de la Profesora *</label>
            <input type="text" required value={profesora} onChange={e => setProfesora(e.target.value)} placeholder="Ej: Profe Pía" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-fuchsia outline-none" />
          </div>
        </div>

        {/* CHECKLIST DE ALUMNAS */}
        <div className="mt-8">
          <div className="flex justify-between items-end mb-3">
            <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
              <Users size={18} className="text-brand-fuchsia"/> Seleccionar Alumnas del Grupo
            </label>
            <span className="text-xs font-bold text-brand-fuchsia bg-brand-pink px-2 py-1 rounded-full">
              {alumnasSeleccionadas.length} seleccionadas
            </span>
          </div>
          
          <div className="border border-gray-200 rounded-xl bg-gray-50 overflow-hidden">
            <div className="p-3 border-b border-gray-200 bg-white relative">
              <Search className="absolute left-6 top-5 text-gray-400" size={18} />
              <input type="text" placeholder="Buscar alumna en la lista..." value={busquedaAlumnas} onChange={e => setBusquedaAlumnas(e.target.value)} className="w-full pl-10 p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-fuchsia text-sm" />
            </div>
            
            <div className="p-2 max-h-72 overflow-y-auto space-y-1">
              {alumnasFiltradas.length === 0 ? (
                <p className="text-center text-gray-500 py-4 text-sm">No se encontraron alumnas.</p>
              ) : (
                alumnasFiltradas.map(a => (
                  <label key={a.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${alumnasSeleccionadas.includes(a.id) ? 'bg-brand-pink/30 border-brand-pink' : 'bg-white border-transparent hover:bg-gray-100'}`}>
                    <input type="checkbox" checked={alumnasSeleccionadas.includes(a.id)} onChange={() => toggleAlumna(a.id)} className="w-5 h-5 accent-brand-fuchsia cursor-pointer" />
                    <span className={`text-sm ${alumnasSeleccionadas.includes(a.id) ? 'font-bold text-brand-dark' : 'text-gray-700'}`}>{a.nombre}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100">
          <button type="submit" disabled={loading} className="w-full bg-brand-dark text-brand-light font-bold py-3 rounded-lg hover:bg-gray-800 transition-colors flex justify-center items-center gap-2">
            <Save size={20} /> {loading ? 'Guardando...' : 'Crear Grupo'}
          </button>
        </div>
      </form>
    </div>
  );
}
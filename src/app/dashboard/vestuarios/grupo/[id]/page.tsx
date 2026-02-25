"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Plus, Shirt, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function GrupoVestuariosPage() {
  const params = useParams();
  const grupoId = params.id as string;
  const [grupo, setGrupo] = useState<any>(null);
  const [vestuarios, setVestuarios] = useState<any[]>([]);
  
  // Formulario rápido
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nombre, setNombre] = useState("");
  const [monto, setMonto] = useState("");

  const fetchDatos = async () => {
    const { data: gData } = await supabase.from("grupos").select("*").eq("id", grupoId).single();
    if (gData) setGrupo(gData);
    const { data: vData } = await supabase.from("vestuarios").select("*").eq("grupo_id", grupoId).order("created_at", { ascending: false });
    if (vData) setVestuarios(vData);
  };

  useEffect(() => { fetchDatos(); }, [grupoId]);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("vestuarios").insert([{ grupo_id: grupoId, nombre, monto: parseFloat(monto) }]);
    if (!error) {
      setNombre(""); setMonto(""); setMostrarForm(false); fetchDatos();
    } else alert(error.message);
  };

  if (!grupo) return <p>Cargando...</p>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-brand-pink">
        <Link href="/dashboard/vestuarios" className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"><ArrowLeft size={24} className="text-gray-700" /></Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-brand-dark leading-tight">{grupo.nombre}</h1>
          <p className="text-sm font-bold text-gray-500">Gestión de Vestuarios del grupo</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="font-bold text-lg text-brand-dark">Vestuarios Asignados</h2>
        <button onClick={() => setMostrarForm(!mostrarForm)} className="bg-brand-dark text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors">
          <Plus size={18} /> Nuevo Vestuario
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={handleCrear} className="bg-brand-pink/20 p-5 rounded-xl border border-brand-pink flex flex-col sm:flex-row gap-4 items-end animate-fade-in-up">
          <div className="w-full">
            <label className="block text-xs font-bold text-gray-600 mb-1">Nombre del Traje/Vestuario</label>
            <input type="text" required value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Traje Árabe Gala" className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-fuchsia" />
          </div>
          <div className="w-full sm:w-48">
            <label className="block text-xs font-bold text-gray-600 mb-1">Costo por Alumna ($)</label>
            <input type="number" required value={monto} onChange={e => setMonto(e.target.value)} placeholder="Ej: 45000" className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-fuchsia" />
          </div>
          <button type="submit" className="w-full sm:w-auto bg-brand-fuchsia text-white font-bold py-2 px-6 rounded-lg hover:opacity-90 transition-opacity">Crear</button>
        </form>
      )}

      <div className="space-y-3">
        {vestuarios.length === 0 ? <p className="text-gray-500 text-center py-8">No hay vestuarios creados para este grupo.</p> : vestuarios.map(v => (
          <Link key={v.id} href={`/dashboard/vestuarios/detalle/${v.id}`} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-brand-fuchsia transition-all flex justify-between items-center group">
            <div className="flex items-center gap-4">
              <div className="bg-brand-pink/30 p-3 rounded-full text-brand-fuchsia"><Shirt size={24}/></div>
              <div>
                <h3 className="font-black text-brand-dark text-lg group-hover:text-brand-fuchsia transition-colors">{v.nombre}</h3>
                <p className="text-sm font-bold text-gray-500">Costo total: ${v.monto.toLocaleString('es-AR')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-brand-dark font-bold text-sm">
              Ver Pagos <ChevronRight className="text-gray-300 group-hover:text-brand-fuchsia transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
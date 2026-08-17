"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Ticket } from "lucide-react";
import Link from "next/link";
import { TOTAL_BUTACAS } from "@/lib/teatro";

export default function NuevoFestivalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [lugar, setLugar] = useState("");
  const [precio, setPrecio] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.from("festivales").insert([{
      nombre: nombre.trim(),
      fecha: fecha || null,
      lugar: lugar.trim() || null,
      precio_entrada: precio === "" ? 0 : parseFloat(precio),
      observaciones: observaciones.trim() || null,
    }]).select("id").single();

    setLoading(false);
    if (error) { alert("Error al guardar: " + error.message); return; }
    router.push(`/dashboard/festivales/${data.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/festivales" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-brand-dark">Crear Festival</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-brand-pink space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="sm:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-1">Nombre del Festival *</label>
            <input type="text" required value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Festival de Fin de Año 2026" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-fuchsia outline-none" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Fecha</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-fuchsia outline-none" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Lugar</label>
            <input type="text" value={lugar} onChange={e => setLugar(e.target.value)} placeholder="Ej: Teatro Municipal" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-fuchsia outline-none" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Precio de la entrada *</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400 font-bold">$</span>
              <input type="number" required min="0" step="any" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="0" className="w-full pl-8 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-fuchsia outline-none" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Todas las butacas valen lo mismo. Si después lo cambiás, las entradas ya vendidas mantienen el precio con el que se vendieron.</p>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-1">Observaciones</label>
            <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} rows={2} placeholder="Anotaciones internas del festival" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-fuchsia outline-none resize-none" />
          </div>
        </div>

        <div className="bg-brand-pink/30 border border-brand-pink rounded-xl p-4 flex items-start gap-3">
          <Ticket size={20} className="text-brand-fuchsia shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700">
            El mapa del teatro se arma solo: <b>{TOTAL_BUTACAS} butacas</b> (Pullman F-1 a F-7 + Palcos VIP F-A y F-B).
            Vas a poder vender desde el mapa apenas guardes.
          </p>
        </div>

        <div className="pt-6 border-t border-gray-100">
          <button type="submit" disabled={loading} className="w-full bg-brand-dark text-brand-light font-bold py-3 rounded-lg hover:bg-gray-800 transition-colors flex justify-center items-center gap-2 disabled:opacity-60">
            <Save size={20} /> {loading ? "Guardando..." : "Crear Festival"}
          </button>
        </div>
      </form>
    </div>
  );
}

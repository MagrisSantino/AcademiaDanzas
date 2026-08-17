"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function EditarFestivalPage() {
  const router = useRouter();
  const params = useParams();
  const festivalId = params.id as string;

  const [cargando, setCargando] = useState(true);
  const [loading, setLoading] = useState(false);
  const [vendidas, setVendidas] = useState(0);

  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [lugar, setLugar] = useState("");
  const [precio, setPrecio] = useState("");
  const [observaciones, setObservaciones] = useState("");

  useEffect(() => {
    const fetchDatos = async () => {
      const { data, error } = await supabase.from("festivales").select("*").eq("id", festivalId).single();
      if (error || !data) { alert("No se encontró el festival."); router.push("/dashboard/festivales"); return; }
      setNombre(data.nombre || "");
      setFecha(data.fecha || "");
      setLugar(data.lugar || "");
      setPrecio(data.precio_entrada?.toString() || "");
      setObservaciones(data.observaciones || "");

      const { count } = await supabase.from("festival_entradas")
        .select("id", { count: "exact", head: true })
        .eq("festival_id", festivalId).eq("estado", "vendida");
      setVendidas(count || 0);
      setCargando(false);
    };
    fetchDatos();
  }, [festivalId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("festivales").update({
      nombre: nombre.trim(),
      fecha: fecha || null,
      lugar: lugar.trim() || null,
      precio_entrada: precio === "" ? 0 : parseFloat(precio),
      observaciones: observaciones.trim() || null,
    }).eq("id", festivalId);

    setLoading(false);
    if (error) { alert("Error al guardar: " + error.message); return; }
    router.push(`/dashboard/festivales/${festivalId}`);
  };

  if (cargando) return <p className="text-gray-400">Cargando festival...</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/festivales/${festivalId}`} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-brand-dark">Editar Festival</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-brand-pink space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="sm:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-1">Nombre del Festival *</label>
            <input type="text" required value={nombre} onChange={e => setNombre(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-fuchsia outline-none" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Fecha</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-fuchsia outline-none" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Lugar</label>
            <input type="text" value={lugar} onChange={e => setLugar(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-fuchsia outline-none" />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-1">Precio de la entrada *</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400 font-bold">$</span>
              <input type="number" required min="0" step="any" value={precio} onChange={e => setPrecio(e.target.value)} className="w-full pl-8 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-fuchsia outline-none" />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-1">Observaciones</label>
            <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} rows={2} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-fuchsia outline-none resize-none" />
          </div>
        </div>

        {vendidas > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Ya hay <b>{vendidas} entradas vendidas</b>. Si cambiás el precio, esas entradas
              <b> conservan el precio con el que se vendieron</b>: el precio nuevo solo se aplica a las próximas.
            </p>
          </div>
        )}

        <div className="pt-6 border-t border-gray-100">
          <button type="submit" disabled={loading} className="w-full bg-brand-dark text-brand-light font-bold py-3 rounded-lg hover:bg-gray-800 transition-colors flex justify-center items-center gap-2 disabled:opacity-60">
            <Save size={20} /> {loading ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}

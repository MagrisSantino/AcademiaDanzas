// src/app/dashboard/pagos/nuevo/page.tsx
"use client";
import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

function FormularioPago() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const alumnaUrl = searchParams.get("alumna_id") || "";
  const mesUrl = searchParams.get("mes") || "Marzo";
  const anioUrl = searchParams.get("anio") || new Date().getFullYear().toString();

  const [loading, setLoading] = useState(false);
  const [alumnas, setAlumnas] = useState<any[]>([]);
  const [pagoIdExistente, setPagoIdExistente] = useState<string | null>(null);
  const [danzas, setDanzas] = useState<string[]>([]);
  const [observaciones, setObservaciones] = useState("");
  const danzasDisponibles = ["Jazz", "Árabe", "Tap", "Iniciación", "Preparatorio", "Street"];
  
  const [formData, setFormData] = useState({
    alumna_id: alumnaUrl,
    monto: "", // Lo que paga hoy
    monto_total_cuota: "", // Lo que vale la cuota total
    fecha_pago: new Date().toISOString().split('T')[0],
    medio_pago: "Efectivo",
    condicion: "Pagado",
    mes: mesUrl,
    anio: anioUrl,
  });

  useEffect(() => {
    const fetchDatos = async () => {
      const { data: aData } = await supabase.from("alumnas").select("id, nombre").eq("activa", true).order("nombre");
      if (aData) setAlumnas(aData);

      if (alumnaUrl && mesUrl && anioUrl) {
        const { data: pExist } = await supabase.from("pagos").select("*").eq("alumna_id", alumnaUrl).eq("mes", mesUrl).eq("anio", parseInt(anioUrl)).single();
        if (pExist) {
          setPagoIdExistente(pExist.id);
          setFormData({
            alumna_id: pExist.alumna_id,
            monto: pExist.monto.toString(),
            monto_total_cuota: pExist.monto_total_cuota?.toString() || pExist.monto.toString(),
            fecha_pago: pExist.fecha_pago,
            medio_pago: pExist.medio_pago,
            condicion: pExist.condicion,
            mes: pExist.mes,
            anio: pExist.anio.toString(),
          });
          setDanzas(pExist.danzas || []);
          setObservaciones(pExist.observaciones || "");
        }
      }
    };
    fetchDatos();
  }, [alumnaUrl, mesUrl, anioUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const mTotal = formData.condicion === "Pagado" ? parseFloat(formData.monto) : parseFloat(formData.monto_total_cuota || "0");

    const payload = {
      alumna_id: formData.alumna_id,
      monto: parseFloat(formData.monto),
      monto_total_cuota: mTotal,
      fecha_pago: formData.fecha_pago,
      medio_pago: formData.medio_pago,
      condicion: formData.condicion,
      mes: formData.mes,
      anio: parseInt(formData.anio),
      danzas: danzas,
      observaciones: observaciones
    };

    const { error } = pagoIdExistente 
      ? await supabase.from("pagos").update(payload).eq("id", pagoIdExistente)
      : await supabase.from("pagos").insert([payload]);

    setLoading(false);
    if (!error) router.push("/dashboard/pagos");
    else alert("Error: " + error.message);
  };

  const saldo = (parseFloat(formData.monto_total_cuota) || 0) - (parseFloat(formData.monto) || 0);

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl border border-brand-pink space-y-6 shadow-sm">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Alumna</label>
        <select disabled={!!pagoIdExistente} value={formData.alumna_id} onChange={e => setFormData({...formData, alumna_id: e.target.value})} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-brand-fuchsia">
          <option value="">Seleccionar...</option>
          {alumnas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Condición</label>
          <select value={formData.condicion} onChange={e => setFormData({...formData, condicion: e.target.value})} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-brand-fuchsia">
            <option value="Pagado">Pagado (Total)</option>
            <option value="Parcial">Pago Parcial</option>
            <option value="No pagado">No pagado</option>
            <option value="No asistió">No asistió</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Monto que entrega hoy ($)</label>
          <input type="number" value={formData.monto} onChange={e => setFormData({...formData, monto: e.target.value})} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-brand-fuchsia" />
        </div>
      </div>

      {formData.condicion === "Parcial" && (
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-yellow-800 mb-1">Costo Total de la Cuota ($)</label>
              <input type="number" value={formData.monto_total_cuota} onChange={e => setFormData({...formData, monto_total_cuota: e.target.value})} className="w-full p-2 border border-yellow-300 rounded outline-none" />
            </div>
            <div>
              <p className="text-sm font-bold text-yellow-800 mb-1">Saldo Pendiente</p>
              <p className="text-2xl font-black text-red-600">${saldo > 0 ? saldo : 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* ... (Danzas y Observaciones igual que antes) ... */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-3">Danzas del mes</label>
        <div className="flex flex-wrap gap-2">
          {danzasDisponibles.map(d => (
            <button key={d} type="button" onClick={() => setDanzas(prev => prev.includes(d) ? prev.filter(i => i !== d) : [...prev, d])} className={`px-4 py-1 rounded-full border text-sm font-bold transition-colors ${danzas.includes(d) ? 'bg-brand-fuchsia text-white border-brand-fuchsia' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>{d}</button>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t">
        <button type="submit" disabled={loading} className="w-full bg-brand-dark text-brand-light font-bold py-3 rounded-lg flex justify-center items-center gap-2 hover:opacity-90">
          <Save size={20}/> {loading ? 'Guardando...' : 'Confirmar Registro'}
        </button>
      </div>
    </form>
  );
}

export default function NuevoPagoPage() { 
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/pagos" className="p-2 hover:bg-gray-200 rounded-full">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-3xl font-black text-brand-dark">Cargar Pago</h1>
      </div>
      <Suspense>
        <FormularioPago />
      </Suspense>
    </div>
  ); 
}
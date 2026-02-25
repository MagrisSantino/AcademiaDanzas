"use client";
import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, CheckCircle, Plus } from "lucide-react";
import Link from "next/link";

function FormularioPagoVestuario() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vestuarioId = searchParams.get("vestuario_id");
  const alumnaId = searchParams.get("alumna_id");

  const [loading, setLoading] = useState(false);
  const [vestuario, setVestuario] = useState<any>(null);
  const [alumna, setAlumna] = useState<any>(null);
  const [pagoIdExistente, setPagoIdExistente] = useState<string | null>(null);
  
  const [nuevaEntrega, setNuevaEntrega] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [formData, setFormData] = useState({
    monto: "0",
    condicion: "Pendiente",
    fecha_pago: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchDatos = async () => {
      if (!vestuarioId || !alumnaId) return;
      const { data: vData } = await supabase.from("vestuarios").select("*").eq("id", vestuarioId).single();
      const { data: aData } = await supabase.from("alumnas").select("id, nombre").eq("id", alumnaId).single();
      if (vData) setVestuario(vData);
      if (aData) setAlumna(aData);

      const { data: pExist } = await supabase.from("pagos_vestuarios").select("*").eq("vestuario_id", vestuarioId).eq("alumna_id", alumnaId).single();
      if (pExist) {
        setPagoIdExistente(pExist.id);
        setFormData({ monto: pExist.monto.toString(), condicion: pExist.condicion, fecha_pago: pExist.fecha_pago || new Date().toISOString().split('T')[0] });
        setObservaciones(pExist.observaciones || "");
      }
    };
    fetchDatos();
  }, [vestuarioId, alumnaId]);

  if (!vestuario || !alumna) return <p>Cargando...</p>;

  const saldo = Number(vestuario.monto) - Number(formData.monto);

  const handleSumarEntrega = () => {
    const montoActual = parseFloat(formData.monto) || 0;
    const entrega = parseFloat(nuevaEntrega) || 0;
    if (entrega > 0) {
      const nuevoMonto = montoActual + entrega;
      setFormData({ ...formData, monto: nuevoMonto.toString(), condicion: "Parcial" });
      setNuevaEntrega(""); 
      const nota = observaciones ? `${observaciones}\n[${new Date().toLocaleDateString('es-AR')}] Nueva entrega: $${entrega}` : `[${new Date().toLocaleDateString('es-AR')}] Nueva entrega: $${entrega}`;
      setObservaciones(nota);
    }
  };

  const handleCompletarPago = () => {
    const saldoRestante = saldo;
    setFormData({ ...formData, monto: vestuario.monto.toString(), condicion: "Pagado" });
    const nota = observaciones ? `${observaciones}\n[${new Date().toLocaleDateString('es-AR')}] Pago total completado (entregó $${saldoRestante})` : `[${new Date().toLocaleDateString('es-AR')}] Pago total completado`;
    setObservaciones(nota);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Ajuste automático de condición
    let condFinal = formData.condicion;
    if (Number(formData.monto) >= Number(vestuario.monto)) condFinal = "Pagado";
    else if (Number(formData.monto) > 0 && Number(formData.monto) < Number(vestuario.monto)) condFinal = "Parcial";
    else condFinal = "Pendiente";

    const payload = { vestuario_id: vestuarioId, alumna_id: alumnaId, monto: parseFloat(formData.monto), condicion: condFinal, observaciones, fecha_pago: formData.fecha_pago };

    const { error } = pagoIdExistente 
      ? await supabase.from("pagos_vestuarios").update(payload).eq("id", pagoIdExistente)
      : await supabase.from("pagos_vestuarios").insert([payload]);

    setLoading(false);
    if (!error) router.push(`/dashboard/vestuarios/detalle/${vestuarioId}`);
    else alert("Error: " + error.message);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl border border-brand-pink space-y-6 shadow-sm">
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
        <h2 className="text-xl font-black text-brand-dark">{alumna.nombre}</h2>
        <p className="text-brand-fuchsia font-bold">{vestuario.nombre}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-bold text-gray-500">Costo Total del Vestuario</p>
          <p className="text-2xl font-black text-brand-dark">${vestuario.monto.toLocaleString('es-AR')}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-sm font-bold text-red-800">Saldo Pendiente</p>
          <p className="text-2xl font-black text-red-600">${saldo > 0 ? saldo.toLocaleString('es-AR') : 0}</p>
        </div>
      </div>

      {saldo > 0 && (
        <div className="p-4 md:p-5 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm font-bold text-yellow-800 mb-3 uppercase tracking-wide">Registrar nueva entrega de dinero</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex gap-2">
              <input type="number" placeholder="Monto que entrega ($)" value={nuevaEntrega} onChange={e => setNuevaEntrega(e.target.value)} className="w-full p-3 border border-yellow-300 rounded-lg outline-none focus:ring-2 focus:ring-yellow-500 font-bold" />
              <button type="button" onClick={handleSumarEntrega} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-4 rounded-lg transition-colors flex items-center gap-1"><Plus size={18} /> Sumar</button>
            </div>
            <button type="button" onClick={handleCompletarPago} className="bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-3 sm:py-2 rounded-lg transition-colors flex items-center justify-center gap-2"><CheckCircle size={18} /> Completar Todo</button>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Total Abonado a la fecha ($)</label>
        <input type="number" value={formData.monto} onChange={e => setFormData({...formData, monto: e.target.value})} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-brand-fuchsia" />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Historial / Observaciones</label>
        <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-brand-fuchsia min-h-[100px]" placeholder="Anotaciones adicionales..." />
      </div>

      <div className="pt-4 border-t">
        <button type="submit" disabled={loading} className="w-full bg-brand-dark text-brand-light font-bold py-4 rounded-xl flex justify-center items-center gap-2 hover:opacity-90 transition-opacity">
          <Save size={20}/> {loading ? 'Guardando...' : 'Confirmar Pago'}
        </button>
      </div>
    </form>
  );
}

export default function PagoVestuarioPage() { 
  const router = useRouter();
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"><ArrowLeft size={24} className="text-gray-700"/></button>
        <h1 className="text-2xl sm:text-3xl font-black text-brand-dark">Cobrar Vestuario</h1>
      </div>
      <Suspense fallback={<p>Cargando...</p>}><FormularioPagoVestuario /></Suspense>
    </div>
  ); 
}
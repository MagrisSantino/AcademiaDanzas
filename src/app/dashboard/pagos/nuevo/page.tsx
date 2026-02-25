// src/app/dashboard/pagos/nuevo/page.tsx
"use client";
import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, CheckCircle, Plus } from "lucide-react";
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
  
  const [nuevaEntrega, setNuevaEntrega] = useState("");

  const [formData, setFormData] = useState({
    alumna_id: alumnaUrl,
    monto: "", 
    monto_total_cuota: "", 
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

  const saldo = (parseFloat(formData.monto_total_cuota) || 0) - (parseFloat(formData.monto) || 0);

  const handleSumarEntrega = () => {
    const montoActual = parseFloat(formData.monto) || 0;
    const entrega = parseFloat(nuevaEntrega) || 0;
    
    if (entrega > 0) {
      const nuevoMonto = montoActual + entrega;
      setFormData({ ...formData, monto: nuevoMonto.toString() });
      setNuevaEntrega(""); 
      
      const fechaHoy = new Date().toLocaleDateString('es-AR');
      const notaAgergada = observaciones 
        ? `${observaciones}\n[${fechaHoy}] Nueva entrega: $${entrega}` 
        : `[${fechaHoy}] Nueva entrega: $${entrega}`;
      setObservaciones(notaAgergada);
    }
  };

  const handleCompletarPago = () => {
    const saldoRestante = saldo;
    setFormData({ 
      ...formData, 
      monto: formData.monto_total_cuota, 
      condicion: "Pagado" 
    });
    
    const fechaHoy = new Date().toLocaleDateString('es-AR');
    const notaAgergada = observaciones 
      ? `${observaciones}\n[${fechaHoy}] Pago completado (entregó los $${saldoRestante} restantes)` 
      : `[${fechaHoy}] Pago completado (entregó los $${saldoRestante} restantes)`;
    setObservaciones(notaAgergada);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Si no asistió, guardamos todo en $0 para no afectar estadísticas
    const isNoAsistio = formData.condicion === "No asistió";
    const montoFinal = isNoAsistio ? 0 : (parseFloat(formData.monto) || 0);
    const mTotal = isNoAsistio ? 0 : (formData.condicion === "Pagado" ? montoFinal : parseFloat(formData.monto_total_cuota || "0"));

    const payload = {
      alumna_id: formData.alumna_id,
      monto: montoFinal,
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

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl border border-brand-pink space-y-6 shadow-sm">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Alumna</label>
        <select disabled={!!pagoIdExistente} value={formData.alumna_id} onChange={e => setFormData({...formData, alumna_id: e.target.value})} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-brand-fuchsia">
          <option value="">Seleccionar...</option>
          {alumnas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </select>
      </div>

      <div className={`grid grid-cols-1 ${formData.condicion !== 'No asistió' ? 'md:grid-cols-2' : ''} gap-4`}>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Condición</label>
          <select value={formData.condicion} onChange={e => setFormData({...formData, condicion: e.target.value})} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-brand-fuchsia">
            <option value="Pagado">Pagado (Total)</option>
            <option value="Parcial">Pago Parcial</option>
            <option value="No pagado">No pagado</option>
            <option value="No asistió">No asistió</option>
          </select>
        </div>
        
        {/* Solo mostramos el input de monto si la condición NO es "No asistió" */}
        {formData.condicion !== "No asistió" && (
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              {formData.condicion === "Parcial" && pagoIdExistente ? 'Total abonado hasta ahora ($)' : 'Monto que entrega hoy ($)'}
            </label>
            <input type="number" value={formData.monto} onChange={e => setFormData({...formData, monto: e.target.value})} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-brand-fuchsia" />
          </div>
        )}
      </div>

      {formData.condicion === "Parcial" && (
        <div className="p-4 md:p-5 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-yellow-800 mb-1">Costo Total de la Cuota ($)</label>
              <input type="number" value={formData.monto_total_cuota} onChange={e => setFormData({...formData, monto_total_cuota: e.target.value})} className="w-full p-2 border border-yellow-300 bg-white rounded outline-none focus:ring-2 focus:ring-yellow-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-yellow-800 mb-1">Saldo Pendiente</p>
              <p className="text-2xl font-black text-red-600">${saldo > 0 ? saldo : 0}</p>
            </div>
          </div>

          {pagoIdExistente && saldo > 0 && (
            <div className="mt-4 pt-4 border-t border-yellow-200">
              <p className="text-xs font-bold text-yellow-800 mb-2 uppercase tracking-wide">Añadir nueva entrega</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex gap-2">
                  <input
                    type="number"
                    placeholder="Monto ($)"
                    value={nuevaEntrega}
                    onChange={e => setNuevaEntrega(e.target.value)}
                    className="w-full p-2 border border-yellow-300 rounded-lg outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  <button
                    type="button"
                    onClick={handleSumarEntrega}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus size={18} /> Sumar
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleCompletarPago}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} /> Completar Total
                </button>
              </div>
              <p className="text-xs text-yellow-700 mt-2">* Recordá hacer clic en "Confirmar Registro" abajo de todo para guardar.</p>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-3">Danzas del mes</label>
        <div className="flex flex-wrap gap-2">
          {danzasDisponibles.map(d => (
            <button key={d} type="button" onClick={() => setDanzas(prev => prev.includes(d) ? prev.filter(i => i !== d) : [...prev, d])} className={`px-4 py-1 rounded-full border text-sm font-bold transition-colors ${danzas.includes(d) ? 'bg-brand-fuchsia text-white border-brand-fuchsia' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>{d}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Observaciones / Notas</label>
        <textarea
          value={observaciones}
          onChange={e => setObservaciones(e.target.value)}
          className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-brand-fuchsia min-h-[80px]"
          placeholder="Anotaciones adicionales o registro de entregas..."
        />
      </div>

      <div className="pt-4 border-t">
        <button type="submit" disabled={loading} className="w-full bg-brand-dark text-brand-light font-bold py-3 rounded-lg flex justify-center items-center gap-2 hover:opacity-90 transition-opacity">
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
        <Link href="/dashboard/pagos" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-3xl font-black text-brand-dark">Cargar Pago</h1>
      </div>
      <Suspense fallback={<p>Cargando...</p>}>
        <FormularioPago />
      </Suspense>
    </div>
  ); 
}
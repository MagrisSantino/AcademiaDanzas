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
  
  // NUEVO: Guardamos el ID del pago si ya existe para actualizarlo
  const [pagoIdExistente, setPagoIdExistente] = useState<string | null>(null);

  const [danzas, setDanzas] = useState<string[]>([]);
  const [observaciones, setObservaciones] = useState("");
  const danzasDisponibles = ["Jazz", "Árabe", "Tap", "Iniciación", "Preparatorio", "Street"];
  
  const [formData, setFormData] = useState({
    alumna_id: alumnaUrl,
    monto: "",
    fecha_pago: new Date().toISOString().split('T')[0],
    medio_pago: "Efectivo",
    condicion: "Pagado",
    mes: mesUrl,
    anio: anioUrl,
  });

  const mesesActivos = ["Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre"];

  useEffect(() => {
    const fetchDatosIniciales = async () => {
      // 1. Traer lista de alumnas
      const { data: alumnasData } = await supabase.from("alumnas").select("id, nombre").eq("activa", true).order("nombre");
      if (alumnasData) setAlumnas(alumnasData);

      // 2. Si venimos con una alumna y mes seleccionados, buscamos si ya existe un pago
      if (alumnaUrl && mesUrl && anioUrl) {
        const { data: pagoExistente } = await supabase
          .from("pagos")
          .select("*")
          .eq("alumna_id", alumnaUrl)
          .eq("mes", mesUrl)
          .eq("anio", parseInt(anioUrl))
          .single(); // Trae 1 solo registro

        if (pagoExistente) {
          setPagoIdExistente(pagoExistente.id);
          setFormData({
            alumna_id: pagoExistente.alumna_id,
            monto: pagoExistente.monto.toString(),
            fecha_pago: pagoExistente.fecha_pago,
            medio_pago: pagoExistente.medio_pago,
            condicion: pagoExistente.condicion,
            mes: pagoExistente.mes,
            anio: pagoExistente.anio.toString(),
          });
          setDanzas(pagoExistente.danzas || []);
          setObservaciones(pagoExistente.observaciones || "");
        }
      }
    };
    fetchDatosIniciales();
  }, [alumnaUrl, mesUrl, anioUrl]);

  const handleDanzaToggle = (danza: string) => {
    setDanzas(prev => prev.includes(danza) ? prev.filter(d => d !== danza) : [...prev, danza]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      alumna_id: formData.alumna_id,
      monto: parseFloat(formData.monto),
      fecha_pago: formData.fecha_pago,
      medio_pago: formData.medio_pago,
      condicion: formData.condicion,
      mes: formData.mes,
      anio: parseInt(formData.anio),
      danzas: danzas,
      observaciones: observaciones
    };

    let error;

    if (pagoIdExistente) {
      // Si ya existía, lo ACTUALIZAMOS (Update)
      const { error: updateError } = await supabase.from("pagos").update(payload).eq("id", pagoIdExistente);
      error = updateError;
    } else {
      // Si no existía, lo CREAMOS (Insert)
      const { error: insertError } = await supabase.from("pagos").insert([payload]);
      error = insertError;
    }

    setLoading(false);

    if (!error) {
      router.push("/dashboard/pagos");
    } else {
      alert("Error al guardar el pago: " + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-brand-pink space-y-6">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Alumna *</label>
        <select 
          required
          value={formData.alumna_id}
          onChange={e => setFormData({...formData, alumna_id: e.target.value})}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-fuchsia outline-none disabled:bg-gray-100"
          disabled={!!pagoIdExistente} // Si estamos editando, no dejamos cambiar la alumna
        >
          <option value="" disabled>Seleccionar alumna...</option>
          {alumnas.map(a => (
            <option key={a.id} value={a.id}>{a.nombre}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Monto ($) *</label>
          <input 
            type="number" required
            value={formData.monto}
            onChange={e => setFormData({...formData, monto: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-fuchsia outline-none"
            placeholder="Ej: 35000"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Fecha del Movimiento</label>
          <input 
            type="date" required
            value={formData.fecha_pago}
            onChange={e => setFormData({...formData, fecha_pago: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-fuchsia outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Mes que Abona</label>
          <select 
            value={formData.mes}
            onChange={e => setFormData({...formData, mes: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-fuchsia outline-none"
            disabled={!!pagoIdExistente}
          >
            {mesesActivos.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Año</label>
          <input 
            type="number" required
            value={formData.anio}
            onChange={e => setFormData({...formData, anio: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-fuchsia outline-none"
            disabled={!!pagoIdExistente}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Medio de Pago</label>
          <select 
            value={formData.medio_pago}
            onChange={e => setFormData({...formData, medio_pago: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-fuchsia outline-none"
          >
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Condición</label>
          <select 
            value={formData.condicion}
            onChange={e => setFormData({...formData, condicion: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-fuchsia outline-none"
          >
            <option value="Pagado">Pagado</option>
            <option value="Parcial">Parcial</option>
            <option value="No pagado">No pagado</option>
            <option value="No asistió">No asistió</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-3">Danzas que cursa este mes</label>
        <div className="flex flex-wrap gap-3">
          {danzasDisponibles.map(danza => (
            <button
              key={danza}
              type="button"
              onClick={() => handleDanzaToggle(danza)}
              className={`px-4 py-2 rounded-full font-semibold text-sm border transition-colors ${
                danzas.includes(danza) 
                  ? 'bg-brand-fuchsia text-white border-brand-fuchsia' 
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-brand-fuchsia'
              }`}
            >
              {danza}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Observaciones / Notas (Opcional)</label>
        <input 
          type="text" 
          value={observaciones}
          onChange={e => setObservaciones(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-fuchsia outline-none"
          placeholder="Ej: Abonó junto a su hermana..."
        />
      </div>

      <div className="pt-4 border-t border-gray-100">
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-brand-dark text-brand-light font-bold py-3 rounded-lg hover:bg-gray-800 transition-colors flex justify-center items-center gap-2"
        >
          <Save size={20} />
          {loading ? 'Guardando...' : (pagoIdExistente ? 'Actualizar Pago' : 'Guardar Pago')}
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
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <h1 className="text-3xl font-black text-brand-dark">Registrar / Editar Pago</h1>
      </div>
      <Suspense fallback={<div className="text-center p-8">Cargando formulario...</div>}>
        <FormularioPago />
      </Suspense>
    </div>
  );
}
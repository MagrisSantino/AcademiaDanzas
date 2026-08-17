"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Pencil, Search, Trash2, Ticket, Calendar, MapPin, ChevronRight, AlertTriangle, X } from "lucide-react";
import Link from "next/link";
import { TOTAL_BUTACAS } from "@/lib/teatro";

const formatearFecha = (fecha: string | null) => {
  if (!fecha) return "Sin fecha";
  const [a, m, d] = fecha.split("-");
  return `${d}/${m}/${a}`;
};

const pesos = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

export default function FestivalesPage() {
  const [festivales, setFestivales] = useState<any[]>([]);
  const [entradas, setEntradas] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);

  // Borrado: pide escribir el nombre, porque se lleva todas las entradas
  const [aBorrar, setABorrar] = useState<any>(null);
  const [nombreEscrito, setNombreEscrito] = useState("");
  const [borrando, setBorrando] = useState(false);

  useEffect(() => { fetchDatos(); }, []);

  const fetchDatos = async () => {
    setLoading(true);
    const { data: fData, error: fError } = await supabase.from("festivales").select("*").order("fecha", { ascending: false });
    const { data: eData, error: eError } = await supabase.from("festival_entradas").select("festival_id, estado, monto_pagado, precio");
    if (fError || eError) { alert("Error al cargar festivales: " + (fError?.message || eError?.message)); setLoading(false); return; }
    if (fData) setFestivales(fData);
    if (eData) setEntradas(eData);
    setLoading(false);
  };

  const resumenDe = (festivalId: string) => {
    const propias = entradas.filter(e => e.festival_id === festivalId);
    const vendidas = propias.filter(e => e.estado === "vendida");
    return {
      total: propias.length,
      vendidas: vendidas.length,
      bloqueadas: propias.filter(e => e.estado === "bloqueada").length,
      cobrado: vendidas.reduce((s, e) => s + Number(e.monto_pagado || 0), 0),
    };
  };

  const eliminar = async () => {
    if (!aBorrar) return;
    setBorrando(true);
    // La base borra las entradas junto con el festival (una sola
    // operacion), asi no puede quedar a medias.
    const { error } = await supabase.from("festivales").delete().eq("id", aBorrar.id);
    setBorrando(false);
    if (error) { alert("Error al eliminar: " + error.message); return; }
    setFestivales(festivales.filter(f => f.id !== aBorrar.id));
    setEntradas(entradas.filter(e => e.festival_id !== aBorrar.id));
    setABorrar(null);
    setNombreEscrito("");
  };

  const filtrados = festivales.filter(f =>
    f.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (f.lugar || "").toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-black text-brand-dark flex items-center gap-3">
          <Ticket className="text-brand-fuchsia" size={32} /> Festivales
        </h1>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input type="text" placeholder="Buscar festival..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="pl-10 p-2 w-full border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-fuchsia" />
          </div>
          <Link href="/dashboard/festivales/nuevo" className="bg-brand-fuchsia text-brand-light px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-transform hover:scale-105 w-full sm:w-auto">
            <Plus size={20} /> Crear Festival
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-gray-400 col-span-full">Cargando festivales...</p>
        ) : filtrados.length === 0 ? (
          <p className="text-gray-500 col-span-full">No hay festivales registrados todavía.</p>
        ) : (
          filtrados.map(f => {
            const r = resumenDe(f.id);
            const ocupadas = r.vendidas + r.bloqueadas;
            return (
              <div key={f.id} className="bg-white rounded-xl shadow-sm border border-brand-pink p-6 hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-brand-pink text-brand-fuchsia font-black px-4 py-1 rounded-bl-xl text-sm">
                  {r.vendidas} Vendidas
                </div>

                <h2 className="text-xl font-black text-brand-dark mb-1 pr-24">{f.nombre}</h2>

                <p className="text-gray-600 font-medium text-sm flex items-center gap-2">
                  <Calendar size={14} className="text-brand-fuchsia" /> {formatearFecha(f.fecha)}
                </p>
                {f.lugar && (
                  <p className="text-gray-600 font-medium text-sm flex items-center gap-2 mt-1">
                    <MapPin size={14} className="text-brand-fuchsia" /> {f.lugar}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 mt-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-[11px] text-gray-500 font-bold uppercase">Entrada</p>
                    <p className="font-black text-brand-dark">{pesos(Number(f.precio_entrada || 0))}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-[11px] text-gray-500 font-bold uppercase">Cobrado</p>
                    <p className="font-black text-green-600">{pesos(r.cobrado)}</p>
                  </div>
                </div>

                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mb-1">
                  <div className="bg-brand-fuchsia h-full rounded-full transition-all" style={{ width: `${Math.min(100, (ocupadas / TOTAL_BUTACAS) * 100)}%` }} />
                </div>
                <p className="text-[11px] text-gray-500 mb-4">
                  {ocupadas} de {TOTAL_BUTACAS} butacas ocupadas
                  {r.bloqueadas > 0 && <span className="text-gray-400"> ({r.bloqueadas} bloqueadas)</span>}
                </p>

                <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                  <Link href={`/dashboard/festivales/${f.id}`} className="text-brand-dark font-bold hover:text-brand-fuchsia flex items-center gap-1 text-sm transition-colors">
                    Gestionar entradas <ChevronRight size={16} />
                  </Link>
                  <div className="flex items-center gap-1">
                    <Link href={`/dashboard/festivales/editar/${f.id}`} className="text-gray-400 hover:text-brand-fuchsia transition-colors p-1">
                      <Pencil size={18} />
                    </Link>
                    <button onClick={() => { setABorrar({ ...f, resumen: r }); setNombreEscrito(""); }} className="text-red-400 hover:text-red-600 transition-colors p-1" title="Eliminar festival">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ---------- Eliminar festival ---------- */}
      {aBorrar && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setABorrar(null)}>
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-black text-red-600 flex items-center gap-2"><AlertTriangle size={20} /> Eliminar festival</h3>
              <button onClick={() => setABorrar(null)} className="p-1 text-gray-400 hover:text-brand-dark"><X size={22} /></button>
            </div>

            <div className="p-4 sm:p-5">
              <p className="font-black text-brand-dark text-lg mb-1">{aBorrar.nombre}</p>
              <p className="text-sm text-gray-500 mb-4">{formatearFecha(aBorrar.fecha)}</p>

              {aBorrar.resumen.total > 0 ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 space-y-1 text-sm text-red-800">
                  <p className="font-bold">Se va a borrar también:</p>
                  <p>· {aBorrar.resumen.vendidas} entradas vendidas</p>
                  {aBorrar.resumen.bloqueadas > 0 && <p>· {aBorrar.resumen.bloqueadas} butacas bloqueadas</p>}
                  <p>· {pesos(aBorrar.resumen.cobrado)} de recaudación registrada</p>
                  <p className="font-black pt-1">Esto no se puede deshacer.</p>
                </div>
              ) : (
                <p className="text-sm text-gray-600 mb-4">Este festival todavía no tiene ninguna entrada registrada.</p>
              )}

              {aBorrar.resumen.total > 0 ? (
                <>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Para confirmar, escribí el nombre del festival:
                  </label>
                  <input
                    type="text" autoFocus value={nombreEscrito}
                    onChange={e => setNombreEscrito(e.target.value)}
                    placeholder={aBorrar.nombre}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 outline-none mb-4"
                  />
                  <button
                    onClick={eliminar}
                    disabled={borrando || nombreEscrito.trim() !== aBorrar.nombre.trim()}
                    className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    <Trash2 size={18} /> {borrando ? "Eliminando..." : "Eliminar festival y todas sus entradas"}
                  </button>
                </>
              ) : (
                <button onClick={eliminar} disabled={borrando} className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                  <Trash2 size={18} /> {borrando ? "Eliminando..." : "Eliminar festival"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

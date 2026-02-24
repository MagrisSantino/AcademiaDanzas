// src/app/dashboard/estadisticas/page.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Wallet, Landmark, TrendingUp, Calendar } from "lucide-react";

export default function EstadisticasPage() {
  const mesesActivos = ["Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre"];
  const [mesFiltro, setMesFiltro] = useState("Todos");
  const [anioFiltro, setAnioFiltro] = useState(new Date().getFullYear().toString());
  const [stats, setStats] = useState({ efectivo: 0, transferencia: 0, total: 0 });

  useEffect(() => { fetchStats(); }, [mesFiltro, anioFiltro]);

  const fetchStats = async () => {
    let query = supabase.from("pagos").select("monto, medio_pago").eq("anio", parseInt(anioFiltro));
    if (mesFiltro !== "Todos") query = query.eq("mes", mesFiltro);
    const { data } = await query;
    if (data) {
      const ef = data.filter(p => p.medio_pago === 'Efectivo').reduce((acc, curr) => acc + Number(curr.monto), 0);
      const tr = data.filter(p => p.medio_pago === 'Transferencia').reduce((acc, curr) => acc + Number(curr.monto), 0);
      setStats({ efectivo: ef, transferencia: tr, total: ef + tr });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-black text-brand-dark uppercase tracking-tighter">Estadísticas</h1>

      <div className="bg-white p-4 rounded-xl border border-brand-pink shadow-sm flex flex-col sm:flex-row gap-4 sm:items-end">
        <div className="w-full sm:w-auto">
          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Periodo</label>
          <select value={mesFiltro} onChange={e => setMesFiltro(e.target.value)} className="p-3 sm:p-2 w-full border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-fuchsia min-w-[150px]">
            <option value="Todos">Todo el año</option>
            {mesesActivos.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="w-full sm:w-auto">
          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Año</label>
          <input type="number" value={anioFiltro} onChange={e => setAnioFiltro(e.target.value)} className="p-3 sm:p-2 w-full border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-fuchsia sm:w-24"/>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-6 md:p-8 rounded-2xl border-l-8 border-green-500 shadow-sm">
          <div className="flex justify-between items-start mb-2 md:mb-4">
            <p className="font-bold text-gray-500 text-sm md:text-base">EFECTIVO</p>
            <Wallet className="text-green-500" />
          </div>
          <p className="text-2xl md:text-3xl font-black text-brand-dark">${stats.efectivo.toLocaleString('es-AR')}</p>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl border-l-8 border-blue-500 shadow-sm">
          <div className="flex justify-between items-start mb-2 md:mb-4">
            <p className="font-bold text-gray-500 text-sm md:text-base">TRANSFERENCIA</p>
            <Landmark className="text-blue-500" />
          </div>
          <p className="text-2xl md:text-3xl font-black text-brand-dark">${stats.transferencia.toLocaleString('es-AR')}</p>
        </div>

        <div className="bg-brand-fuchsia p-6 md:p-8 rounded-2xl shadow-lg">
          <div className="flex justify-between items-start mb-2 md:mb-4 text-brand-dark">
            <p className="font-bold opacity-80 text-sm md:text-base">TOTAL INGRESOS</p>
            <TrendingUp />
          </div>
          <p className="text-2xl md:text-3xl font-black text-brand-dark">${stats.total.toLocaleString('es-AR')}</p>
        </div>
      </div>
    </div>
  );
}
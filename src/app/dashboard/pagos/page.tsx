// src/app/dashboard/pagos/page.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, CheckCircle, XCircle, Percent, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PagosPage() {
  const router = useRouter();
  const mesesActivos = ["Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre"];
  const mesesReales = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  
  const [mesFiltro, setMesFiltro] = useState(mesesActivos.includes(mesesReales[new Date().getMonth()]) ? mesesReales[new Date().getMonth()] : "Marzo");
  const [anioFiltro, setAnioFiltro] = useState(new Date().getFullYear().toString());
  const [busqueda, setBusqueda] = useState("");
  const [filas, setFilas] = useState<any[]>([]);
  const [abonaron, setAbonaron] = useState(0);
  const [noAbonaron, setNoAbonaron] = useState(0);

  useEffect(() => { fetchDatos(); }, [mesFiltro, anioFiltro]);

  const fetchDatos = async () => {
    const { data: aData } = await supabase.from("alumnas").select("*").eq("activa", true).order("nombre");
    const { data: pData } = await supabase.from("pagos").select("*").eq("mes", mesFiltro).eq("anio", parseInt(anioFiltro));
    if (aData) {
      let calcAbonaron = 0; let calcNoAbonaron = 0;
      const mesIdx = mesesReales.indexOf(mesFiltro);
      const hoy = new Date();
      const dueDate = new Date(parseInt(anioFiltro), mesIdx, 15, 23, 59, 59);

      const combinados = aData.filter(a => new Date(a.fecha_inicio) <= new Date(parseInt(anioFiltro), mesIdx, 31)).map(a => {
        const p = pData?.find(p => p.alumna_id === a.id);
        if (p && (p.condicion === 'Pagado' || p.condicion === 'No asistió')) calcAbonaron++;
        else if ((!p || p?.condicion === 'No pagado' || p?.condicion === 'Parcial') && hoy > dueDate) calcNoAbonaron++;
        return { alumna: a, pago: p || null };
      });
      setFilas(combinados); setAbonaron(calcAbonaron); setNoAbonaron(calcNoAbonaron);
    }
  };

  const handleEliminarPago = async (e: React.MouseEvent, pagoId: string, nombreAlumna: string) => {
    e.stopPropagation(); 
    const confirmar = window.confirm(`¿Eliminar pago de ${nombreAlumna}?`);
    if (confirmar) {
      const { error } = await supabase.from("pagos").delete().eq("id", pagoId);
      if (!error) fetchDatos();
    }
  };

  const filasFiltradas = filas.filter(f => f.alumna.nombre.toLowerCase().includes(busqueda.toLowerCase()));
  const totalMes = abonaron + noAbonaron;
  const porcentaje = totalMes > 0 ? Math.round((abonaron / totalMes) * 100) : 0;

  const getRowStyle = (p: any) => {
    if (p) {
      if (p.condicion === 'Pagado') return "bg-green-100 hover:bg-green-200 text-green-900";
      if (p.condicion === 'No asistió') return "bg-blue-100 hover:bg-blue-200 text-blue-900";
      if (p.condicion === 'Parcial') return "bg-yellow-100 hover:bg-yellow-200 text-yellow-900";
      if (p.condicion === 'No pagado') return "bg-red-100 hover:bg-red-200 text-red-900";
    }
    if (new Date() > new Date(parseInt(anioFiltro), mesesReales.indexOf(mesFiltro), 15, 23, 59, 59)) return "bg-red-100 hover:bg-red-200 text-red-900"; 
    return "bg-white hover:bg-gray-50"; 
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-black text-brand-dark uppercase tracking-tighter">Control de Pagos</h1>
        <Link href={`/dashboard/pagos/nuevo?mes=${mesFiltro}&anio=${anioFiltro}`} className="bg-brand-fuchsia text-brand-light px-4 py-3 sm:py-2 rounded-lg font-bold flex items-center justify-center gap-2 w-full sm:w-auto">
          <Plus size={20} /> Registrar Pago
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-xl border border-brand-pink shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-full"><CheckCircle size={24}/></div>
          <div><p className="text-xs font-bold text-gray-500 uppercase">Abonaron</p><p className="text-xl md:text-2xl font-black">{abonaron}</p></div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-xl border border-brand-pink shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-full"><XCircle size={24}/></div>
          <div><p className="text-xs font-bold text-gray-500 uppercase">Pendientes</p><p className="text-xl md:text-2xl font-black">{noAbonaron}</p></div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-xl border border-brand-pink shadow-sm flex items-center gap-4">
          <div className="p-3 bg-brand-pink text-brand-fuchsia rounded-full"><Percent size={24}/></div>
          <div><p className="text-xs font-bold text-gray-500 uppercase">Cumplimiento</p><p className="text-xl md:text-2xl font-black">{porcentaje}%</p></div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-brand-pink shadow-sm flex flex-col md:flex-row gap-4 md:items-end">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input type="text" placeholder="Buscar alumna..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="pl-10 p-2 w-full border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-fuchsia"/>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <select value={mesFiltro} onChange={e => setMesFiltro(e.target.value)} className="p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-fuchsia flex-1 md:w-[140px]">
            {mesesActivos.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <input type="number" value={anioFiltro} onChange={e => setAnioFiltro(e.target.value)} className="p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-fuchsia w-24"/>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-brand-pink shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-brand-pink/30 text-brand-dark border-b border-brand-pink">
                <th className="p-4 font-bold w-16">Acciones</th>
                <th className="p-4 font-bold">Alumna</th>
                <th className="p-4 font-bold">Danzas</th>
                <th className="p-4 font-bold">Estado</th>
                <th className="p-4 font-bold">Abonó</th>
                <th className="p-4 font-bold text-red-600">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {filasFiltradas.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">No hay alumnas registradas.</td></tr>
              ) : (
                filasFiltradas.map(f => {
                  const saldo = (f.pago?.monto_total_cuota || 0) - (f.pago?.monto || 0);
                  return (
                    <tr key={f.alumna.id} onDoubleClick={() => router.push(`/dashboard/pagos/nuevo?alumna_id=${f.alumna.id}&mes=${mesFiltro}&anio=${anioFiltro}`)} className={`border-b cursor-pointer transition-colors ${getRowStyle(f.pago)}`}>
                      <td className="p-4">
                        {f.pago ? <button onClick={(e) => handleEliminarPago(e, f.pago.id, f.alumna.nombre)} className="text-red-400 hover:text-red-700 p-1"><Trash2 size={20} /></button> : <span className="text-gray-300 ml-2">-</span>}
                      </td>
                      <td className="p-4 font-bold">{f.alumna.nombre}</td>
                      <td className="p-4 text-sm opacity-80">{f.pago?.danzas?.join(", ") || "-"}</td>
                      <td className="p-4 font-bold text-xs uppercase">{f.pago ? f.pago.condicion : "Pendiente"}</td>
                      <td className="p-4 font-black">{f.pago ? `$${f.pago.monto}` : "-"}</td>
                      <td className="p-4 font-black text-red-600">{saldo > 0 ? `$${saldo}` : "-"}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
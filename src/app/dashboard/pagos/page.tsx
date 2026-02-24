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

  useEffect(() => {
    fetchDatos();
  }, [mesFiltro, anioFiltro]);

  const fetchDatos = async () => {
    const { data: alumnasData } = await supabase.from("alumnas").select("*").eq("activa", true).order("nombre");
    const { data: pagosData } = await supabase.from("pagos").select("*").eq("mes", mesFiltro).eq("anio", parseInt(anioFiltro));

    if (alumnasData) {
      let calcAbonaron = 0;
      let calcNoAbonaron = 0;

      const mesIndexReal = mesesReales.indexOf(mesFiltro);
      const hoy = new Date();
      const dueDate = new Date(parseInt(anioFiltro), mesIndexReal, 15, 23, 59, 59);

      const combinados = alumnasData
        .filter(alumna => {
          const inicio = new Date(alumna.fecha_inicio);
          return inicio <= new Date(parseInt(anioFiltro), mesIndexReal, 31);
        })
        .map(alumna => {
          const pagoEncontrado = pagosData?.find(p => p.alumna_id === alumna.id);
          
          if (pagoEncontrado && (pagoEncontrado.condicion === 'Pagado' || pagoEncontrado.condicion === 'No asistió')) {
            calcAbonaron++;
          } else if ((!pagoEncontrado || pagoEncontrado?.condicion === 'No pagado' || pagoEncontrado?.condicion === 'Parcial') && hoy > dueDate) {
            calcNoAbonaron++;
          }

          return { alumna, pago: pagoEncontrado || null };
        });

      setFilas(combinados);
      setAbonaron(calcAbonaron);
      setNoAbonaron(calcNoAbonaron);
    }
  };

  // Función para ELIMINAR un pago
  const handleEliminarPago = async (e: React.MouseEvent, pagoId: string, nombreAlumna: string) => {
    e.stopPropagation(); // Evita que se active el doble clic de la fila al apretar el botón
    
    const confirmar = window.confirm(`¿Estás segura de que querés ELIMINAR el registro de pago de ${nombreAlumna} para este mes?`);
    
    if (confirmar) {
      const { error } = await supabase.from("pagos").delete().eq("id", pagoId);
      
      if (error) {
        alert("Error al eliminar el pago: " + error.message);
      } else {
        fetchDatos(); // Recargamos los datos para que desaparezca
      }
    }
  };

  const filasFiltradas = filas.filter(f => f.alumna.nombre.toLowerCase().includes(busqueda.toLowerCase()));
  const totalAlumnasMes = abonaron + noAbonaron;
  const porcentaje = totalAlumnasMes > 0 ? Math.round((abonaron / totalAlumnasMes) * 100) : 0;

  const getRowStyle = (pago: any) => {
    if (pago) {
      if (pago.condicion === 'Pagado') return "bg-green-100 hover:bg-green-200 text-green-900 border-green-200";
      if (pago.condicion === 'No asistió') return "bg-blue-100 hover:bg-blue-200 text-blue-900 border-blue-200";
      if (pago.condicion === 'Parcial') return "bg-yellow-100 hover:bg-yellow-200 text-yellow-900 border-yellow-200";
      if (pago.condicion === 'No pagado') return "bg-red-100 hover:bg-red-200 text-red-900 border-red-200";
    }
    const mesIndexReal = mesesReales.indexOf(mesFiltro);
    if (new Date() > new Date(parseInt(anioFiltro), mesIndexReal, 15, 23, 59, 59)) return "bg-red-100 hover:bg-red-200 text-red-900 border-red-200"; 
    return "bg-white hover:bg-gray-50 border-gray-100"; 
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-brand-dark uppercase tracking-tighter">Control de Pagos</h1>
        <Link href={`/dashboard/pagos/nuevo?mes=${mesFiltro}&anio=${anioFiltro}`} className="bg-brand-fuchsia text-brand-light px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Plus size={20} /> Registrar Pago
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-brand-pink shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-full"><CheckCircle size={24}/></div>
          <div><p className="text-xs font-bold text-gray-500 uppercase">Abonaron (100%)</p><p className="text-2xl font-black text-brand-dark">{abonaron}</p></div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-brand-pink shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-full"><XCircle size={24}/></div>
          <div><p className="text-xs font-bold text-gray-500 uppercase">Pendientes / Parcial</p><p className="text-2xl font-black text-brand-dark">{noAbonaron}</p></div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-brand-pink shadow-sm flex items-center gap-4">
          <div className="p-3 bg-brand-pink text-brand-fuchsia rounded-full"><Percent size={24}/></div>
          <div><p className="text-xs font-bold text-gray-500 uppercase">Cumplimiento</p><p className="text-2xl font-black text-brand-dark">{porcentaje}%</p></div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-brand-pink shadow-sm flex gap-4 items-end">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar alumna..." 
            value={busqueda} 
            onChange={e => setBusqueda(e.target.value)} 
            className="pl-10 p-2 w-full border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-fuchsia"
          />
        </div>
        <select value={mesFiltro} onChange={e => setMesFiltro(e.target.value)} className="p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-fuchsia min-w-[140px]">
          {mesesActivos.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <input type="number" value={anioFiltro} onChange={e => setAnioFiltro(e.target.value)} className="p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-fuchsia w-24"/>
      </div>

      <div className="bg-white rounded-xl border border-brand-pink shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
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
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No hay alumnas registradas para este periodo.</td>
                </tr>
              ) : (
                filasFiltradas.map(f => {
                  const saldo = (f.pago?.monto_total_cuota || 0) - (f.pago?.monto || 0);
                  return (
                    <tr 
                      key={f.alumna.id} 
                      onDoubleClick={() => router.push(`/dashboard/pagos/nuevo?alumna_id=${f.alumna.id}&mes=${mesFiltro}&anio=${anioFiltro}`)} 
                      className={`border-b cursor-pointer transition-colors ${getRowStyle(f.pago)}`}
                      title={f.pago?.observaciones ? `Nota: ${f.pago.observaciones}` : "Doble clic para cobrar/editar"}
                    >
                      <td className="p-4">
                        {f.pago ? (
                          <button 
                            onClick={(e) => handleEliminarPago(e, f.pago.id, f.alumna.nombre)}
                            title="Eliminar este pago"
                            className="text-red-400 hover:text-red-700 transition-colors p-1 rounded-md hover:bg-red-50"
                          >
                            <Trash2 size={20} />
                          </button>
                        ) : (
                          <span className="text-gray-300 ml-2">-</span>
                        )}
                      </td>
                      <td className="p-4 font-bold">{f.alumna.nombre}</td>
                      <td className="p-4 text-sm opacity-80">{f.pago?.danzas?.join(", ") || "-"}</td>
                      <td className="p-4 font-bold text-sm uppercase">{f.pago ? f.pago.condicion : "Pendiente"}</td>
                      <td className="p-4 font-black">{f.pago ? `$${f.pago.monto}` : "-"}</td>
                      <td className="p-4 font-black text-red-600">{saldo > 0 ? `$${saldo}` : "-"}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-gray-50 text-xs text-gray-500 border-t border-gray-100 flex justify-between">
          <span>* Doble clic en cualquier fila para registrar/editar pago.</span>
          <span>* El saldo se calcula si la condición es "Parcial".</span>
        </div>
      </div>
    </div>
  );
}
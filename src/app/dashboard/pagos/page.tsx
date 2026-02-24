// src/app/dashboard/pagos/page.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PagosPage() {
  const router = useRouter();
  
  // Los meses que realmente usa la academia
  const mesesActivos = ["Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre"];
  // Referencia interna para que Javascript calcule bien las fechas
  const mesesReales = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  
  // Calculamos el mes actual. Si estamos en Enero, Febrero o Diciembre, mostramos Marzo por defecto.
  const mesActualNombre = mesesReales[new Date().getMonth()];
  const mesPorDefecto = mesesActivos.includes(mesActualNombre) ? mesActualNombre : "Marzo";

  const [mesFiltro, setMesFiltro] = useState(mesPorDefecto);
  const [anioFiltro, setAnioFiltro] = useState(new Date().getFullYear().toString());
  
  const [filas, setFilas] = useState<any[]>([]);

  useEffect(() => {
    fetchDatos();
  }, [mesFiltro, anioFiltro]);

  const fetchDatos = async () => {
    const { data: alumnasData } = await supabase
      .from("alumnas")
      .select("*")
      .eq("activa", true)
      .order("nombre", { ascending: true });

    const { data: pagosData } = await supabase
      .from("pagos")
      .select("*")
      .eq("mes", mesFiltro)
      .eq("anio", parseInt(anioFiltro));

    if (alumnasData) {
      const combinados = alumnasData.map(alumna => {
        const pagoEncontrado = pagosData?.find(p => p.alumna_id === alumna.id);
        return { alumna, pago: pagoEncontrado || null };
      });
      setFilas(combinados);
    }
  };

  const handleDoubleClick = (alumnaId: string) => {
    router.push(`/dashboard/pagos/nuevo?alumna_id=${alumnaId}&mes=${mesFiltro}&anio=${anioFiltro}`);
  };

  const getRowStyle = (pago: any) => {
    if (pago) {
      if (pago.condicion === 'Pagado') return "bg-green-100 hover:bg-green-200 text-green-900 border-green-200";
      if (pago.condicion === 'No asistió') return "bg-blue-100 hover:bg-blue-200 text-blue-900 border-blue-200";
      if (pago.condicion === 'Parcial') return "bg-yellow-100 hover:bg-yellow-200 text-yellow-900 border-yellow-200";
      if (pago.condicion === 'No pagado') return "bg-red-100 hover:bg-red-200 text-red-900 border-red-200";
    }
    
    // Usamos mesesReales para saber el índice real en el calendario y calcular el día 15
    const mesIndexReal = mesesReales.indexOf(mesFiltro);
    const dueDate = new Date(parseInt(anioFiltro), mesIndexReal, 15, 23, 59, 59);
    const hoy = new Date();
    
    if (hoy > dueDate) {
      return "bg-red-100 hover:bg-red-200 text-red-900 border-red-200"; 
    }
    
    return "bg-white hover:bg-gray-50 border-gray-100"; 
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-brand-dark">Control de Pagos</h1>
        <Link 
          href={`/dashboard/pagos/nuevo?mes=${mesFiltro}&anio=${anioFiltro}`} 
          className="bg-brand-fuchsia text-brand-light px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus size={20} />
          Registrar Pago
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-brand-pink flex gap-4 items-end">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Mes</label>
          <select 
            value={mesFiltro}
            onChange={(e) => setMesFiltro(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-fuchsia outline-none min-w-[150px]"
          >
            {mesesActivos.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Año</label>
          <input 
            type="number" 
            value={anioFiltro}
            onChange={(e) => setAnioFiltro(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-fuchsia outline-none w-24"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-brand-pink overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-pink/30 text-brand-dark border-b border-brand-pink">
                <th className="p-4 font-bold">Alumna</th>
                <th className="p-4 font-bold">Danzas del Mes</th>
                <th className="p-4 font-bold">Estado Pago</th>
                <th className="p-4 font-bold">Monto</th>
                <th className="p-4 font-bold">Fecha / Medio</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => (
                <tr 
                  key={fila.alumna.id} 
                  onDoubleClick={() => handleDoubleClick(fila.alumna.id)}
                  className={`border-b cursor-pointer transition-colors ${getRowStyle(fila.pago)}`}
                  title={fila.pago?.observaciones ? `Nota: ${fila.pago.observaciones}` : "Doble clic para registrar/editar pago"}
                >
                  <td className="p-4 font-bold">{fila.alumna.nombre}</td>
                  <td className="p-4 opacity-80">
                    {fila.pago?.danzas?.length > 0 ? fila.pago.danzas.join(", ") : '-'}
                  </td>
                  <td className="p-4 font-bold">
                    {fila.pago ? fila.pago.condicion : 'Pendiente'}
                  </td>
                  <td className="p-4 font-bold">
                    {fila.pago ? `$${fila.pago.monto}` : '-'}
                  </td>
                  <td className="p-4 opacity-80">
                    {fila.pago ? `${new Date(fila.pago.fecha_pago).toLocaleDateString("es-AR")} (${fila.pago.medio_pago})` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-gray-50 text-xs text-gray-500 border-t border-gray-100 flex justify-between">
          <span>* Doble clic en cualquier fila para registrar el pago de esa alumna.</span>
          <span>* Posicioná el mouse sobre la fila para ver observaciones.</span>
        </div>
      </div>
    </div>
  );
}
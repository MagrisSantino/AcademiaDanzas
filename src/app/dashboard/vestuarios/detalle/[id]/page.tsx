"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";

export default function DetalleVestuarioPage() {
  const params = useParams();
  const vestuarioId = params.id as string;
  
  const [vestuario, setVestuario] = useState<any>(null);
  const [grupo, setGrupo] = useState<any>(null);
  const [filas, setFilas] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    const fetchDatos = async () => {
      const { data: vData } = await supabase.from("vestuarios").select("*").eq("id", vestuarioId).single();
      if (!vData) return;
      setVestuario(vData);

      const { data: gData } = await supabase.from("grupos").select("*").eq("id", vData.grupo_id).single();
      setGrupo(gData);

      if (gData && gData.alumnas_ids?.length > 0) {
        const { data: aData } = await supabase.from("alumnas").select("id, nombre").in("id", gData.alumnas_ids).order("nombre");
        const { data: pData } = await supabase.from("pagos_vestuarios").select("*").eq("vestuario_id", vestuarioId);

        if (aData) {
          const combinados = aData.map(a => {
            const p = pData?.find(p => p.alumna_id === a.id);
            const abonado = p ? Number(p.monto) : 0;
            const saldo = Number(vData.monto) - abonado;
            const condicion = p ? p.condicion : 'Pendiente';
            return { alumna: a, pago: p, abonado, saldo, condicion };
          });
          setFilas(combinados);
        }
      }
    };
    fetchDatos();
  }, [vestuarioId]);

  const filtradas = filas.filter(f => f.alumna.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  if (!vestuario) return <p>Cargando...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-brand-pink">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/vestuarios/grupo/${vestuario.grupo_id}`} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"><ArrowLeft size={24} className="text-gray-700" /></Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-brand-dark">{vestuario.nombre}</h1>
            <p className="text-sm font-bold text-gray-500">Grupo: {grupo?.nombre} | Valor: ${vestuario.monto.toLocaleString('es-AR')}</p>
          </div>
        </div>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input type="text" placeholder="Buscar alumna..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="pl-10 p-2 w-full border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-fuchsia"/>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 text-sm">
                <th className="p-4 font-bold">Alumna</th>
                <th className="p-4 font-bold">Estado</th>
                <th className="p-4 font-bold">Abonado</th>
                <th className="p-4 font-bold text-red-500">Saldo</th>
                <th className="p-4 font-bold">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-gray-500">No hay alumnas asignadas.</td></tr> : filtradas.map(f => (
                <tr key={f.alumna.id} className="border-b border-gray-100 hover:bg-brand-pink/10 transition-colors">
                  <td className="p-4 font-bold text-brand-dark">{f.alumna.nombre}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${f.condicion === 'Pagado' ? 'bg-green-100 text-green-700' : f.condicion === 'Parcial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{f.condicion}</span>
                  </td>
                  <td className="p-4 font-bold text-gray-600">${f.abonado}</td>
                  <td className="p-4 font-black text-red-500">${f.saldo > 0 ? f.saldo : 0}</td>
                  <td className="p-4">
                    <Link href={`/dashboard/vestuarios/pago?vestuario_id=${vestuario.id}&alumna_id=${f.alumna.id}`} className="bg-brand-dark text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-brand-fuchsia transition-colors">
                      {f.saldo > 0 ? 'Cobrar' : 'Ver Detalles'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
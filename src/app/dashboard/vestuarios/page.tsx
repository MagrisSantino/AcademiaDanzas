// src/app/dashboard/vestuarios/page.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Shirt, Search, ChevronRight, ArrowLeft, CheckCircle, Receipt } from "lucide-react";
import Link from "next/link";

export default function VestuariosPage() {
  const [tab, setTab] = useState<'grupos' | 'alumnas'>('grupos');
  const [loadingGeneral, setLoadingGeneral] = useState(false);
  
  // Estados de datos
  const [grupos, setGrupos] = useState<any[]>([]);
  const [cuentas, setCuentas] = useState<any[]>([]);
  
  // Estados de UI
  const [busqueda, setBusqueda] = useState("");
  const [alumnaSeleccionada, setAlumnaSeleccionada] = useState<any>(null);

  const fetchData = async () => {
    // Traemos todo de una vez para armar la cuenta corriente global
    const { data: gData } = await supabase.from("grupos").select("*").order("nombre");
    const { data: aData } = await supabase.from("alumnas").select("*").eq("activa", true).order("nombre");
    const { data: vData } = await supabase.from("vestuarios").select("*");
    const { data: pData } = await supabase.from("pagos_vestuarios").select("*");

    if (gData) setGrupos(gData);

    if (aData && gData && vData) {
      const cuentasCalculadas = aData.map(alumna => {
        // Encontrar grupos de esta alumna
        const misGrupos = gData.filter(g => g.alumnas_ids?.includes(alumna.id));
        // Encontrar vestuarios de esos grupos
        const misVestuarios = vData.filter(v => misGrupos.some(g => g.id === v.grupo_id));

        let totalCosto = 0;
        let totalAbonado = 0;
        let detalles: any[] = [];

        misVestuarios.forEach(v => {
          const grupo = misGrupos.find(g => g.id === v.grupo_id);
          const pago = pData?.find(p => p.vestuario_id === v.id && p.alumna_id === alumna.id);
          const costo = Number(v.monto);
          const abonado = pago ? Number(pago.monto) : 0;
          const saldo = costo - abonado;

          totalCosto += costo;
          totalAbonado += abonado;

          detalles.push({ vestuario: v, grupo, pago, saldo, costo, abonado });
        });

        const saldoTotal = totalCosto - totalAbonado;
        
        let condicion = "Pendiente";
        if (saldoTotal <= 0) condicion = "Pagado";
        else if (totalAbonado > 0) condicion = "Parcial";

        const nombresTrajes = misVestuarios.map(v => v.nombre).join(", ");

        return { alumna, totalCosto, totalAbonado, saldoTotal, condicion, detalles, nombresTrajes };
      }).filter(c => c.detalles.length > 0); // Filtramos para mostrar solo a las nenas que tienen vestuarios asignados

      setCuentas(cuentasCalculadas);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLiquidarTodo = async () => {
    const confirmar = window.confirm(`¿Confirmás el cobro total de $${alumnaSeleccionada.saldoTotal} a ${alumnaSeleccionada.alumna.nombre}?\n\nSe registrará el pago completo de todos sus vestuarios pendientes.`);
    if (!confirmar) return;

    setLoadingGeneral(true);
    const fechaHoy = new Date().toISOString().split('T')[0];
    const nota = `[${new Date().toLocaleDateString('es-AR')}] Pago unificado de saldo restante.`;

    for (const det of alumnaSeleccionada.detalles) {
      if (det.saldo > 0) {
        const payload = {
          vestuario_id: det.vestuario.id,
          alumna_id: alumnaSeleccionada.alumna.id,
          monto: det.costo,
          condicion: "Pagado",
          fecha_pago: fechaHoy,
          observaciones: det.pago?.observaciones ? `${det.pago.observaciones}\n${nota}` : nota
        };

        if (det.pago) {
          await supabase.from("pagos_vestuarios").update(payload).eq("id", det.pago.id);
        } else {
          await supabase.from("pagos_vestuarios").insert([payload]);
        }
      }
    }

    await fetchData(); // Recargamos los datos
    setLoadingGeneral(false);
    setAlumnaSeleccionada(null); // Volvemos a la tabla general
    alert("¡Todos los pagos fueron registrados con éxito!");
  };

  const cuentasFiltradas = cuentas.filter(c => c.alumna.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  const getRowStyle = (condicion: string) => {
    if (condicion === 'Pagado') return "bg-green-100/50 hover:bg-green-100 text-green-900 border-green-200";
    if (condicion === 'Parcial') return "bg-yellow-100/50 hover:bg-yellow-100 text-yellow-900 border-yellow-200";
    return "bg-red-100/50 hover:bg-red-100 text-red-900 border-red-200"; 
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-black text-brand-dark flex items-center gap-3">
        <Shirt className="text-brand-fuchsia" size={32} /> Gestión de Vestuarios
      </h1>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button onClick={() => {setTab('grupos'); setAlumnaSeleccionada(null);}} className={`pb-3 font-bold text-sm sm:text-base transition-colors ${tab === 'grupos' ? 'text-brand-fuchsia border-b-2 border-brand-fuchsia' : 'text-gray-500 hover:text-gray-700'}`}>Vista por Grupos</button>
        <button onClick={() => setTab('alumnas')} className={`pb-3 font-bold text-sm sm:text-base transition-colors ${tab === 'alumnas' ? 'text-brand-fuchsia border-b-2 border-brand-fuchsia' : 'text-gray-500 hover:text-gray-700'}`}>Cuenta Corriente (Alumnas)</button>
      </div>

      {tab === 'grupos' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {grupos.map(g => (
            <Link key={g.id} href={`/dashboard/vestuarios/grupo/${g.id}`} className="bg-white rounded-xl shadow-sm border border-brand-pink p-5 hover:shadow-md transition-all flex justify-between items-center group">
              <div>
                <h2 className="text-xl font-black text-brand-dark mb-1 group-hover:text-brand-fuchsia transition-colors">{g.nombre}</h2>
                <p className="text-sm text-gray-500 font-bold">Profe: {g.profesora}</p>
              </div>
              <ChevronRight className="text-gray-300 group-hover:text-brand-fuchsia transition-colors" size={28} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {!alumnaSeleccionada ? (
            <>
              {/* TABLA GENERAL DE CUENTA CORRIENTE */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input type="text" placeholder="Buscar alumna..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="pl-10 p-2 w-full border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-fuchsia"/>
              </div>

              <div className="bg-white rounded-xl border border-brand-pink shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-brand-pink/30 text-brand-dark border-b border-brand-pink">
                        <th className="p-4 font-bold">Alumna</th>
                        <th className="p-4 font-bold">Trajes Asignados</th>
                        <th className="p-4 font-bold">Estado</th>
                        <th className="p-4 font-bold">Total a Pagar</th>
                        <th className="p-4 font-bold text-red-600">Saldo Deudor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cuentasFiltradas.length === 0 ? (
                        <tr><td colSpan={5} className="p-8 text-center text-gray-500">No hay alumnas con vestuarios asignados.</td></tr>
                      ) : (
                        cuentasFiltradas.map((c, i) => (
                          <tr 
                            key={i} 
                            onClick={() => setAlumnaSeleccionada(c)}
                            className={`border-b cursor-pointer transition-colors ${getRowStyle(c.condicion)}`}
                            title="Tocar para ver desglose y cobrar"
                          >
                            <td className="p-4 font-black">{c.alumna.nombre}</td>
                            <td className="p-4 text-sm opacity-80">{c.detalles.length} trajes <span className="text-xs">({c.nombresTrajes})</span></td>
                            <td className="p-4 font-bold text-xs uppercase">{c.condicion}</td>
                            <td className="p-4 font-bold">${c.totalCosto.toLocaleString('es-AR')}</td>
                            <td className={`p-4 font-black ${c.saldoTotal > 0 ? 'text-red-600' : 'text-green-600'}`}>${c.saldoTotal > 0 ? c.saldoTotal.toLocaleString('es-AR') : '0'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="p-3 bg-gray-50 text-xs text-gray-500 border-t border-gray-100">
                  * Toca cualquier fila para ver el desglose de los trajes y realizar cobros.
                </div>
              </div>
            </>
          ) : (
            <>
              {/* DETALLE DE LA ALUMNA SELECCIONADA */}
              <div className="bg-white p-6 rounded-xl border border-brand-pink shadow-sm space-y-6">
                
                {/* Header del detalle */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setAlumnaSeleccionada(null)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"><ArrowLeft size={24} className="text-gray-700" /></button>
                    <div>
                      <h2 className="text-2xl font-black text-brand-dark">{alumnaSeleccionada.alumna.nombre}</h2>
                      <p className="text-gray-500 font-bold text-sm">Desglose de Vestuarios</p>
                    </div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-center sm:text-right flex items-center gap-6 justify-between sm:justify-end">
                    <div>
                      <p className="text-red-800 text-xs font-bold uppercase tracking-wide">Deuda Total Pendiente</p>
                      <p className="text-3xl font-black text-red-600">${alumnaSeleccionada.saldoTotal.toLocaleString('es-AR')}</p>
                    </div>
                  </div>
                </div>

                {/* Botón Mágico: Liquidar Todo */}
                {alumnaSeleccionada.saldoTotal > 0 && (
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3 text-green-800">
                      <CheckCircle size={24} />
                      <p className="text-sm font-bold">Podés saldar todos los vestuarios juntos con un solo clic.</p>
                    </div>
                    <button 
                      onClick={handleLiquidarTodo}
                      disabled={loadingGeneral}
                      className="w-full sm:w-auto bg-green-500 text-white font-black px-6 py-3 rounded-xl hover:bg-green-600 transition-colors shadow-md disabled:opacity-50"
                    >
                      {loadingGeneral ? 'Procesando...' : 'Liquidar Saldo Completo'}
                    </button>
                  </div>
                )}

                {/* Lista individual de trajes */}
                <div className="space-y-3">
                  <h3 className="font-bold text-brand-dark mb-2">Cobros individuales por traje:</h3>
                  {alumnaSeleccionada.detalles.map((d: any, i: number) => (
                    <div key={i} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <p className="font-black text-brand-dark text-lg">{d.vestuario.nombre} <span className="text-sm font-bold text-gray-500 ml-2">({d.grupo.nombre})</span></p>
                        <p className="text-sm text-gray-600 mt-1 font-medium">Costo: ${d.costo.toLocaleString('es-AR')} | Abonado hasta hoy: ${d.abonado.toLocaleString('es-AR')}</p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                        <p className={`font-black text-lg ${d.saldo > 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {d.saldo > 0 ? `Debe: $${d.saldo.toLocaleString('es-AR')}` : 'PAGADO'}
                        </p>
                        <Link href={`/dashboard/vestuarios/pago?vestuario_id=${d.vestuario.id}&alumna_id=${alumnaSeleccionada.alumna.id}`} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors text-white shadow-sm ${d.saldo > 0 ? 'bg-brand-fuchsia hover:bg-brand-fuchsia/90' : 'bg-gray-800 hover:bg-black'}`}>
                          {d.saldo > 0 ? 'Cobrar' : <><Receipt size={16}/> Ver Recibo</>}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
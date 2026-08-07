"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Search, Pencil, Trash2, UserMinus, Save, X, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function DetalleVestuarioPage() {
  const router = useRouter();
  const params = useParams();
  const vestuarioId = params.id as string;

  const [vestuario, setVestuario] = useState<any>(null);
  const [grupo, setGrupo] = useState<any>(null);
  const [filas, setFilas] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  // Edición del vestuario
  const [editando, setEditando] = useState(false);
  const [editNombre, setEditNombre] = useState("");
  const [editMonto, setEditMonto] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Panel de exclusiones
  const [panelExcluir, setPanelExcluir] = useState(false);
  const [excluidas, setExcluidas] = useState<string[]>([]);

  const fetchDatos = async () => {
    setCargando(true);
    const { data: vData } = await supabase.from("vestuarios").select("*").eq("id", vestuarioId).single();
    if (!vData) { setCargando(false); return; }
    setVestuario(vData);
    setEditNombre(vData.nombre);
    setEditMonto(vData.monto?.toString() || "");
    setExcluidas(vData.excluidas_ids || []);

    const { data: gData } = await supabase.from("grupos").select("*").eq("id", vData.grupo_id).single();
    setGrupo(gData);

    const { data: pData } = await supabase.from("pagos_vestuarios").select("*").eq("vestuario_id", vestuarioId);

    // Además de las alumnas del grupo, traemos a cualquiera que tenga un cobro
    // registrado en este vestuario aunque la hayan sacado del grupo o dado de
    // baja. Si no, su plata quedaba invisible.
    const idsGrupo: string[] = gData?.alumnas_ids || [];
    const idsConPago: string[] = (pData || []).map(p => p.alumna_id);
    const idsRelevantes = Array.from(new Set([...idsGrupo, ...idsConPago]));

    if (idsRelevantes.length === 0) { setFilas([]); setCargando(false); return; }

    const { data: aData } = await supabase.from("alumnas").select("id, nombre, activa").in("id", idsRelevantes).order("nombre");

    if (aData) {
      const combinados = aData.map(a => {
        const p = pData?.find(p => p.alumna_id === a.id);
        const abonado = p ? Number(p.monto) : 0;
        const saldo = Number(vData.monto) - abonado;
        return {
          alumna: a,
          pago: p,
          abonado,
          saldo,
          condicion: p ? p.condicion : 'Pendiente',
          excluida: (vData.excluidas_ids || []).includes(a.id),
          fueraDelGrupo: !idsGrupo.includes(a.id),
        };
      });
      setFilas(combinados);
    }
    setCargando(false);
  };

  useEffect(() => { fetchDatos(); }, [vestuarioId]);

  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    const montoNuevo = parseFloat(editMonto);
    if (!editNombre.trim()) { alert("El vestuario necesita un nombre."); return; }
    if (isNaN(montoNuevo) || montoNuevo < 0) { alert("Poné un costo válido."); return; }

    // Cambiar el costo recalcula los saldos de todas las que ya pagaron.
    const conPago = filas.filter(f => f.pago).length;
    if (montoNuevo !== Number(vestuario.monto) && conPago > 0) {
      const seguir = window.confirm(`Vas a cambiar el costo de $${Number(vestuario.monto).toLocaleString('es-AR')} a $${montoNuevo.toLocaleString('es-AR')}.\n\nHay ${conPago} alumna(s) con cobros registrados en este vestuario. Los montos que ya pagaron NO se tocan, pero los saldos se recalculan con el costo nuevo.\n\n¿Continuar?`);
      if (!seguir) return;
    }

    setGuardando(true);
    const { error } = await supabase.from("vestuarios")
      .update({ nombre: editNombre.trim(), monto: montoNuevo })
      .eq("id", vestuarioId);
    setGuardando(false);

    if (error) { alert("Error al guardar: " + error.message); return; }
    setEditando(false);
    fetchDatos();
  };

  const handleEliminarVestuario = async () => {
    // No se puede borrar un vestuario con cobros: se perdería el registro de la plata.
    const { count, error: errorConteo } = await supabase
      .from("pagos_vestuarios")
      .select("id", { count: "exact", head: true })
      .eq("vestuario_id", vestuarioId);

    if (errorConteo) {
      alert("No se pudo verificar si tiene cobros, así que no se borró nada.\n\nProbá de nuevo en un momento.");
      return;
    }

    if (count && count > 0) {
      alert(`"${vestuario.nombre}" tiene ${count} cobro(s) registrados.\n\nNo se puede eliminar porque se perdería el registro de esa plata.\n\nSi el vestuario ya no va, podés dejarlo como está o excluir a todas las alumnas.`);
      return;
    }

    const confirmar = window.confirm(`¿Eliminar el vestuario "${vestuario.nombre}"?\n\nNo tiene ningún cobro registrado, así que no se pierde plata.\n\nEsta acción no se puede deshacer.`);
    if (!confirmar) return;

    const { error } = await supabase.from("vestuarios").delete().eq("id", vestuarioId);
    if (error) { alert("Error: " + error.message); return; }
    router.push(`/dashboard/vestuarios/grupo/${vestuario.grupo_id}`);
  };

  const toggleExcluida = (id: string) => {
    setExcluidas(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleGuardarExclusiones = async () => {
    // Si excluimos a alguien que ya pagó, avisamos: el pago no se borra, pero
    // deja de figurar en la cuenta del vestuario.
    const excluidasConPago = filas.filter(f => excluidas.includes(f.alumna.id) && f.abonado > 0);
    if (excluidasConPago.length > 0) {
      const nombres = excluidasConPago.map(f => `- ${f.alumna.nombre} ($${f.abonado.toLocaleString('es-AR')})`).join("\n");
      const seguir = window.confirm(`Estás excluyendo alumnas que ya tienen plata cobrada en este vestuario:\n\n${nombres}\n\nEl cobro NO se borra, queda guardado. Pero deja de contar en este vestuario.\n\n¿Continuar?`);
      if (!seguir) return;
    }

    setGuardando(true);
    const { error } = await supabase.from("vestuarios")
      .update({ excluidas_ids: excluidas })
      .eq("id", vestuarioId);
    setGuardando(false);

    if (error) { alert("Error al guardar: " + error.message); return; }
    setPanelExcluir(false);
    fetchDatos();
  };

  if (cargando) return <p className="p-10 font-bold text-gray-500">Cargando vestuario...</p>;
  if (!vestuario) return <p className="p-10 font-bold text-gray-500">No se encontró el vestuario.</p>;

  const activas = filas.filter(f => !f.excluida);
  const excluidasFilas = filas.filter(f => f.excluida);
  const filtradas = activas.filter(f => f.alumna.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  const totalEsperado = activas.length * Number(vestuario.monto);
  const totalCobrado = activas.reduce((acc, f) => acc + f.abonado, 0);

  // Para el panel: las del grupo más las que ya tienen cobro
  const candidatas = filas;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-brand-pink space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/vestuarios/grupo/${vestuario.grupo_id}`} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"><ArrowLeft size={24} className="text-gray-700" /></Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-brand-dark">{vestuario.nombre}</h1>
              <p className="text-sm font-bold text-gray-500">Grupo: {grupo?.nombre} | Valor: ${Number(vestuario.monto).toLocaleString('es-AR')}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setEditando(!editando); setPanelExcluir(false); }} className="flex items-center gap-2 text-sm font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors">
              <Pencil size={16} /> Editar
            </button>
            <button onClick={() => { setPanelExcluir(!panelExcluir); setEditando(false); }} className="flex items-center gap-2 text-sm font-bold bg-brand-pink/40 hover:bg-brand-pink text-brand-dark px-3 py-2 rounded-lg transition-colors">
              <UserMinus size={16} /> Excluir alumnas
            </button>
            <button onClick={handleEliminarVestuario} className="flex items-center gap-2 text-sm font-bold bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Formulario de edición */}
        {editando && (
          <form onSubmit={handleGuardarEdicion} className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row gap-4 items-end">
            <div className="w-full">
              <label className="block text-xs font-bold text-gray-600 mb-1">Nombre del Vestuario</label>
              <input type="text" required value={editNombre} onChange={e => setEditNombre(e.target.value)} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-fuchsia" />
            </div>
            <div className="w-full sm:w-48">
              <label className="block text-xs font-bold text-gray-600 mb-1">Costo por Alumna ($)</label>
              <input type="number" min="0" required value={editMonto} onChange={e => setEditMonto(e.target.value)} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-fuchsia" />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button type="submit" disabled={guardando} className="flex-1 bg-brand-dark text-white font-bold py-2 px-5 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                <Save size={16} /> {guardando ? 'Guardando...' : 'Guardar'}
              </button>
              <button type="button" onClick={() => { setEditando(false); setEditNombre(vestuario.nombre); setEditMonto(vestuario.monto?.toString() || ""); }} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"><X size={16} /></button>
            </div>
          </form>
        )}

        {/* Panel de exclusiones */}
        {panelExcluir && (
          <div className="bg-brand-pink/10 p-4 rounded-xl border border-brand-pink space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm font-bold text-brand-dark">Marcá las alumnas que <span className="underline">no</span> bailan esta coreografía</p>
              <span className="text-xs font-bold text-brand-fuchsia bg-white px-2 py-1 rounded-full border border-brand-pink">{excluidas.length} excluidas</span>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 max-h-72 overflow-y-auto p-2 space-y-1">
              {candidatas.length === 0 ? (
                <p className="text-center text-gray-500 py-4 text-sm">Este grupo no tiene alumnas asignadas.</p>
              ) : candidatas.map(f => (
                <label key={f.alumna.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${excluidas.includes(f.alumna.id) ? 'bg-red-50 border-red-200' : 'bg-white border-transparent hover:bg-gray-50'}`}>
                  <input type="checkbox" checked={excluidas.includes(f.alumna.id)} onChange={() => toggleExcluida(f.alumna.id)} className="w-5 h-5 accent-brand-fuchsia cursor-pointer" />
                  <span className={`text-sm flex-1 ${excluidas.includes(f.alumna.id) ? 'font-bold text-red-700 line-through' : 'text-gray-700'}`}>{f.alumna.nombre}</span>
                  {f.abonado > 0 && <span className="text-[10px] font-black uppercase bg-green-100 text-green-700 px-2 py-1 rounded-md">Ya pagó ${f.abonado.toLocaleString('es-AR')}</span>}
                  {!f.alumna.activa && <span className="text-[10px] font-black uppercase bg-gray-200 text-gray-600 px-2 py-1 rounded-md">Baja</span>}
                </label>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={handleGuardarExclusiones} disabled={guardando} className="bg-brand-fuchsia text-white font-bold py-2 px-6 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50">
                <Save size={16} /> {guardando ? 'Guardando...' : 'Guardar exclusiones'}
              </button>
              <button onClick={() => { setPanelExcluir(false); setExcluidas(vestuario.excluidas_ids || []); }} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">Cancelar</button>
            </div>
          </div>
        )}
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-brand-pink shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase">Bailan</p>
          <p className="text-2xl font-black text-brand-dark">{activas.length}{excluidasFilas.length > 0 && <span className="text-sm font-bold text-gray-400 ml-2">({excluidasFilas.length} excluidas)</span>}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-brand-pink shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase">Total a recaudar</p>
          <p className="text-2xl font-black text-brand-dark">${totalEsperado.toLocaleString('es-AR')}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-brand-pink shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase">Cobrado</p>
          <p className="text-2xl font-black text-green-600">${totalCobrado.toLocaleString('es-AR')}</p>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        <input type="text" placeholder="Buscar alumna..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="pl-10 p-2 w-full border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-fuchsia"/>
      </div>

      {/* Tabla */}
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
              {filtradas.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-gray-500">No hay alumnas que bailen esta coreografía.</td></tr> : filtradas.map(f => (
                <tr key={f.alumna.id} className="border-b border-gray-100 hover:bg-brand-pink/10 transition-colors">
                  <td className="p-4 font-bold text-brand-dark">
                    {f.alumna.nombre}
                    {!f.alumna.activa && <span className="ml-2 px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-gray-200 text-gray-600 align-middle">Baja</span>}
                    {f.fueraDelGrupo && <span className="ml-2 px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-orange-100 text-orange-700 align-middle">Fuera del grupo</span>}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${f.condicion === 'Pagado' ? 'bg-green-100 text-green-700' : f.condicion === 'Parcial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{f.condicion}</span>
                  </td>
                  <td className="p-4 font-bold text-gray-600">${f.abonado.toLocaleString('es-AR')}</td>
                  <td className="p-4 font-black text-red-500">${f.saldo > 0 ? f.saldo.toLocaleString('es-AR') : 0}</td>
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

      {/* Excluidas: se listan aparte para que no se pierdan de vista si tienen plata */}
      {excluidasFilas.length > 0 && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2">
          <p className="text-sm font-bold text-gray-600 flex items-center gap-2"><UserMinus size={16} /> No bailan esta coreografía ({excluidasFilas.length})</p>
          <div className="flex flex-wrap gap-2">
            {excluidasFilas.map(f => (
              <span key={f.alumna.id} className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-600 flex items-center gap-2">
                {f.alumna.nombre}
                {f.abonado > 0 && (
                  <span className="text-[10px] font-black uppercase bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md flex items-center gap-1">
                    <AlertTriangle size={11} /> tiene ${f.abonado.toLocaleString('es-AR')} cobrados
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

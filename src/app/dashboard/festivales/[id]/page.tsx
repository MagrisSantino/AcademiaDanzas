"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Papa from "papaparse";
import {
  ArrowLeft, Ticket, Search, X, Printer, Download, Lock, Unlock, Pencil,
  Check, Ban, ZoomIn, ZoomOut, Calendar, MapPin, AlertTriangle, Armchair,
} from "lucide-react";
import MapaTeatro from "@/components/MapaTeatro";
import {
  TOTAL_BUTACAS, claveButaca, sectorDeFila, compararButacas, metricasMapa, TAM_MIN, TAM_MAX,
} from "@/lib/teatro";

const pesos = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

const formatearFecha = (fecha: string | null) => {
  if (!fecha) return "Sin fecha";
  const [a, m, d] = fecha.split("-");
  return `${d}/${m}/${a}`;
};

type Tab = "vender" | "vendidas" | "recaudacion";

export default function FestivalPage() {
  const params = useParams();
  const router = useRouter();
  const festivalId = params.id as string;

  const [cargando, setCargando] = useState(true);
  const [festival, setFestival] = useState<any>(null);
  const [entradas, setEntradas] = useState<any[]>([]);
  const [alumnas, setAlumnas] = useState<any[]>([]);
  const [tab, setTab] = useState<Tab>("vender");

  // Selección en el mapa
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<null | "venta" | "bloqueo">(null);
  const [detalle, setDetalle] = useState<any>(null);
  const [guardando, setGuardando] = useState(false);

  // Formulario de venta
  const [alumnaId, setAlumnaId] = useState("");
  const [busquedaAlumna, setBusquedaAlumna] = useState("");
  const [pagado, setPagado] = useState(true);
  const [observacion, setObservacion] = useState("");
  const [motivo, setMotivo] = useState("");

  // Listado
  const [filtro, setFiltro] = useState<"todas" | "impagas" | "pagadas" | "anuladas">("todas");
  const [busqueda, setBusqueda] = useState("");

  // Zoom del mapa
  const [tam, setTam] = useState(22);
  const zoomManual = useRef(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchTodo(); }, [festivalId]);

  // El mapa arranca del tamaño más grande que entre en pantalla.
  // Si la usuaria toca el zoom, dejamos de auto-ajustar.
  useEffect(() => {
    const el = contenedorRef.current;
    if (!el) return;
    const ajustar = () => {
      if (zoomManual.current) return;
      const disponible = el.clientWidth - 8;
      if (disponible <= 0) return;
      let mejor = TAM_MIN;
      for (let t = TAM_MIN; t <= TAM_MAX; t++) {
        if (metricasMapa(t).anchoTotal <= disponible) mejor = t;
      }
      setTam(mejor);
    };
    ajustar();
    const ro = new ResizeObserver(ajustar);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cargando]);

  const fetchTodo = async () => {
    setCargando(true);
    const { data: fData, error: fError } = await supabase.from("festivales").select("*").eq("id", festivalId).single();
    if (fError || !fData) { alert("No se encontró el festival."); router.push("/dashboard/festivales"); return; }

    const { data: eData, error: eError } = await supabase.from("festival_entradas").select("*").eq("festival_id", festivalId);
    const { data: aData, error: aError } = await supabase.from("alumnas").select("id, nombre, activa").order("nombre");
    if (eError || aError) { alert("Error al cargar datos: " + (eError?.message || aError?.message)); setCargando(false); return; }

    setFestival(fData);
    setEntradas(eData || []);
    setAlumnas(aData || []);
    setCargando(false);
  };

  const nombresAlumnas = useMemo(
    () => new Map(alumnas.map(a => [a.id, a.nombre])),
    [alumnas]
  );

  const nombreDe = (id: string | null) => (id ? nombresAlumnas.get(id) || "Alumna eliminada" : "—");

  /** Butacas que hoy están ocupadas (vendidas o bloqueadas). */
  const ocupadas = useMemo(() => {
    const m = new Map<string, any>();
    entradas.forEach(e => {
      if (e.estado !== "anulada") m.set(claveButaca(e.fila, e.butaca), e);
    });
    return m;
  }, [entradas]);

  const precioActual = Number(festival?.precio_entrada || 0);
  const totalSeleccion = seleccionadas.size * precioActual;

  const clickButaca = (fila: string, butaca: number) => {
    const clave = claveButaca(fila, butaca);
    const ocupada = ocupadas.get(clave);
    if (ocupada) { setDetalle(ocupada); return; }
    setSeleccionadas(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(clave)) nuevo.delete(clave); else nuevo.add(clave);
      return nuevo;
    });
  };

  const listaSeleccion = useMemo(
    () => [...seleccionadas]
      .map(k => { const [fila, b] = k.split("|"); return { fila, butaca: parseInt(b, 10) }; })
      .sort(compararButacas),
    [seleccionadas]
  );

  const limpiarFormulario = () => {
    setSeleccionadas(new Set());
    setAlumnaId("");
    setBusquedaAlumna("");
    setObservacion("");
    setMotivo("");
    setPagado(true);
    setModal(null);
  };

  const registrarVenta = async () => {
    if (!alumnaId) { alert("Elegí la alumna a la que se le asigna la entrada."); return; }
    if (seleccionadas.size === 0) return;

    setGuardando(true);
    const ventaId = crypto.randomUUID();
    const filas = listaSeleccion.map(b => ({
      festival_id: festivalId,
      fila: b.fila,
      butaca: b.butaca,
      sector: sectorDeFila(b.fila),
      estado: "vendida",
      alumna_id: alumnaId,
      pagado,
      // Guardamos el precio del momento: si después cambia el precio del
      // festival, esta venta sigue valiendo lo que se cobró.
      precio: precioActual,
      observacion: observacion.trim() || null,
      venta_id: ventaId,
    }));

    const { error } = await supabase.from("festival_entradas").insert(filas);
    setGuardando(false);

    if (error) {
      if (error.code === "23505") alert("Ojo: alguna de esas butacas se acaba de ocupar. No se registró nada. Actualizo el mapa.");
      else alert("Error al registrar la venta: " + error.message);
      await fetchTodo();
      return;
    }
    limpiarFormulario();
    await fetchTodo();
  };

  const bloquearButacas = async () => {
    if (seleccionadas.size === 0) return;
    setGuardando(true);
    const filas = listaSeleccion.map(b => ({
      festival_id: festivalId,
      fila: b.fila,
      butaca: b.butaca,
      sector: sectorDeFila(b.fila),
      estado: "bloqueada",
      alumna_id: null,
      pagado: false,
      precio: 0,
      motivo: motivo.trim() || null,
    }));

    const { error } = await supabase.from("festival_entradas").insert(filas);
    setGuardando(false);

    if (error) {
      if (error.code === "23505") alert("Ojo: alguna de esas butacas se acaba de ocupar. No se bloqueó nada.");
      else alert("Error al bloquear: " + error.message);
      await fetchTodo();
      return;
    }
    limpiarFormulario();
    await fetchTodo();
  };

  const cambiarPago = async (ids: string[], valor: boolean) => {
    const { error } = await supabase.from("festival_entradas").update({ pagado: valor }).in("id", ids);
    if (error) { alert("Error: " + error.message); return; }
    setEntradas(prev => prev.map(e => (ids.includes(e.id) ? { ...e, pagado: valor } : e)));
    setDetalle((prev: any) => (prev && ids.includes(prev.id) ? { ...prev, pagado: valor } : prev));
  };

  /** Anular no borra: libera la butaca pero deja el registro para siempre. */
  const anular = async (ids: string[], texto: string) => {
    if (!window.confirm(texto)) return;
    const { error } = await supabase.from("festival_entradas").update({ estado: "anulada" }).in("id", ids);
    if (error) { alert("Error al anular: " + error.message); return; }
    setEntradas(prev => prev.map(e => (ids.includes(e.id) ? { ...e, estado: "anulada" } : e)));
    setDetalle(null);
  };

  /** Desbloquear sí borra la fila: un bloqueo no tiene plata ni historia detrás. */
  const desbloquear = async (id: string) => {
    if (!window.confirm("¿Liberar esta butaca bloqueada?")) return;
    const { error } = await supabase.from("festival_entradas").delete().eq("id", id);
    if (error) { alert("Error: " + error.message); return; }
    setEntradas(prev => prev.filter(e => e.id !== id));
    setDetalle(null);
  };

  // ----------------------------------------------------------------
  // Agrupado por venta (una venta puede tener varias butacas)
  // ----------------------------------------------------------------
  const ventas = useMemo(() => {
    const grupos = new Map<string, any[]>();
    entradas.filter(e => e.estado !== "bloqueada").forEach(e => {
      const clave = e.venta_id || e.id;
      if (!grupos.has(clave)) grupos.set(clave, []);
      grupos.get(clave)!.push(e);
    });

    return [...grupos.entries()].map(([id, items]) => {
      const vigentes = items.filter(i => i.estado === "vendida");
      return {
        id,
        alumna_id: items[0].alumna_id,
        observacion: items[0].observacion,
        fecha: items[0].created_at,
        items: [...items].sort(compararButacas),
        vigentes,
        anuladas: items.filter(i => i.estado === "anulada"),
        total: vigentes.reduce((s, i) => s + Number(i.precio || 0), 0),
        cobrado: vigentes.filter(i => i.pagado).reduce((s, i) => s + Number(i.precio || 0), 0),
        todasPagadas: vigentes.length > 0 && vigentes.every(i => i.pagado),
        sinVigentes: vigentes.length === 0,
      };
    }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [entradas]);

  const bloqueadas = useMemo(
    () => entradas.filter(e => e.estado === "bloqueada").sort(compararButacas),
    [entradas]
  );

  const ventasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return ventas.filter(v => {
      if (filtro === "anuladas" && !v.sinVigentes) return false;
      if (filtro === "pagadas" && (v.sinVigentes || !v.todasPagadas)) return false;
      if (filtro === "impagas" && (v.sinVigentes || v.cobrado >= v.total)) return false;
      if (filtro === "todas" && v.sinVigentes) return false;
      if (!q) return true;
      const nombre = nombreDe(v.alumna_id).toLowerCase();
      const butacas = v.items.map(i => `${i.fila} ${i.butaca} ${i.fila}-${i.butaca}`).join(" ").toLowerCase();
      return nombre.includes(q) || butacas.includes(q) || (v.observacion || "").toLowerCase().includes(q);
    });
  }, [ventas, filtro, busqueda, nombresAlumnas]);

  // ----------------------------------------------------------------
  // Recaudación
  // ----------------------------------------------------------------
  const resumen = useMemo(() => {
    const vendidas = entradas.filter(e => e.estado === "vendida");
    const cobrado = vendidas.filter(e => e.pagado).reduce((s, e) => s + Number(e.precio || 0), 0);
    const total = vendidas.reduce((s, e) => s + Number(e.precio || 0), 0);
    return {
      vendidas: vendidas.length,
      bloqueadas: bloqueadas.length,
      anuladas: entradas.filter(e => e.estado === "anulada").length,
      libres: TOTAL_BUTACAS - vendidas.length - bloqueadas.length,
      cobrado,
      total,
      aCobrar: total - cobrado,
    };
  }, [entradas, bloqueadas]);

  const ranking = useMemo(() => {
    const porAlumna = new Map<string, { nombre: string; butacas: number; total: number; cobrado: number }>();
    entradas.filter(e => e.estado === "vendida").forEach(e => {
      const clave = e.alumna_id || "sin";
      if (!porAlumna.has(clave)) porAlumna.set(clave, { nombre: nombreDe(e.alumna_id), butacas: 0, total: 0, cobrado: 0 });
      const r = porAlumna.get(clave)!;
      r.butacas += 1;
      r.total += Number(e.precio || 0);
      if (e.pagado) r.cobrado += Number(e.precio || 0);
    });
    return [...porAlumna.values()]
      .map(r => ({ ...r, adeuda: r.total - r.cobrado }))
      .sort((a, b) => b.adeuda - a.adeuda || b.total - a.total || a.nombre.localeCompare(b.nombre));
  }, [entradas, nombresAlumnas]);

  const exportarCSV = () => {
    const filas = [...entradas].sort(compararButacas).map(e => ({
      Fila: e.fila,
      Butaca: e.butaca,
      Sector: e.sector,
      Estado: e.estado,
      Alumna: e.estado === "bloqueada" ? "" : nombreDe(e.alumna_id),
      Precio: Number(e.precio || 0),
      Pagado: e.estado === "vendida" ? (e.pagado ? "SI" : "NO") : "",
      Observacion: e.observacion || "",
      Motivo: e.motivo || "",
      Registrada: new Date(e.created_at).toLocaleString("es-AR"),
    }));
    const csv = Papa.unparse(filas, { delimiter: ";" });
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `entradas-${(festival?.nombre || "festival").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const alumnasFiltradas = useMemo(() => {
    const q = busquedaAlumna.trim().toLowerCase();
    return alumnas.filter(a => a.nombre.toLowerCase().includes(q));
  }, [alumnas, busquedaAlumna]);

  if (cargando) return <p className="text-gray-400">Cargando festival...</p>;

  const tabs: { id: Tab; texto: string }[] = [
    { id: "vender", texto: "Vender entradas" },
    { id: "vendidas", texto: "Entradas vendidas" },
    { id: "recaudacion", texto: "Recaudación" },
  ];

  return (
    <div className="space-y-6">
      {/* ---------- Encabezado ---------- */}
      <div className="print:hidden">
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/dashboard/festivales" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-dark flex items-center gap-3">
            <Ticket className="text-brand-fuchsia" size={30} /> {festival.nombre}
          </h1>
          <Link href={`/dashboard/festivales/editar/${festivalId}`} className="text-gray-400 hover:text-brand-fuchsia p-1" title="Editar festival">
            <Pencil size={18} />
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-gray-600 font-medium mt-2 ml-1">
          <span className="flex items-center gap-1.5"><Calendar size={14} className="text-brand-fuchsia" /> {formatearFecha(festival.fecha)}</span>
          {festival.lugar && <span className="flex items-center gap-1.5"><MapPin size={14} className="text-brand-fuchsia" /> {festival.lugar}</span>}
          <span className="flex items-center gap-1.5"><Ticket size={14} className="text-brand-fuchsia" /> Entrada {pesos(precioActual)}</span>
        </div>
      </div>

      {/* ---------- Pestañas ---------- */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto print:hidden">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 font-bold text-sm whitespace-nowrap border-b-4 transition-colors ${
              tab === t.id ? "border-brand-fuchsia text-brand-fuchsia" : "border-transparent text-gray-500 hover:text-brand-dark"
            }`}
          >
            {t.texto}
          </button>
        ))}
      </div>

      <div ref={contenedorRef}>
        {/* ================= VENDER ENTRADAS ================= */}
        {tab === "vender" && (
          <div className="space-y-4">
            {/* Referencias + zoom */}
            <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-600">
                <span className="flex items-center gap-1.5"><i className="w-4 h-4 rounded-t-md rounded-b-[2px] border-2 bg-white border-gray-300 inline-block" /> Libre</span>
                <span className="flex items-center gap-1.5"><i className="w-4 h-4 rounded-t-md rounded-b-[2px] border-2 bg-green-500 border-green-700 inline-block" /> Seleccionada</span>
                <span className="flex items-center gap-1.5"><i className="w-4 h-4 rounded-t-md rounded-b-[2px] border-2 bg-gray-700 border-gray-800 inline-block" /> Ocupada</span>
                <span className="text-gray-400 font-medium">{resumen.libres} libres de {TOTAL_BUTACAS}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { zoomManual.current = true; setTam(t => Math.max(TAM_MIN, t - 2)); }} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100" title="Achicar"><ZoomOut size={16} /></button>
                <button onClick={() => { zoomManual.current = true; setTam(t => Math.min(TAM_MAX, t + 2)); }} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100" title="Agrandar"><ZoomIn size={16} /></button>
                <button onClick={() => window.print()} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center gap-2 text-sm font-bold" title="Imprimir mapa">
                  <Printer size={16} /> <span className="hidden sm:inline">Imprimir mapa</span>
                </button>
              </div>
            </div>

            {/* Título solo para el papel */}
            <div className="hidden print:block mb-3">
              <p className="text-lg font-black">{festival.nombre}</p>
              <p className="text-xs">{formatearFecha(festival.fecha)}{festival.lugar ? ` · ${festival.lugar}` : ""} · {resumen.vendidas + resumen.bloqueadas} de {TOTAL_BUTACAS} butacas ocupadas</p>
            </div>

            <div className="bg-white border border-brand-pink rounded-xl p-3 sm:p-5 overflow-x-auto print:border-0 print:p-0">
              <div className="flex justify-center min-w-min">
                <MapaTeatro
                  ocupadas={ocupadas}
                  seleccionadas={seleccionadas}
                  onButaca={clickButaca}
                  tam={tam}
                  tituloOcupada={(e) =>
                    e.estado === "bloqueada"
                      ? `${e.fila} · Butaca ${e.butaca} · Bloqueada${e.motivo ? ` (${e.motivo})` : ""}`
                      : `${e.fila} · Butaca ${e.butaca} · ${nombreDe(e.alumna_id)} · ${e.pagado ? "Pagada" : "IMPAGA"}`
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= ENTRADAS VENDIDAS ================= */}
        {tab === "vendidas" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="flex gap-2 flex-wrap">
                {([
                  ["todas", "Todas"],
                  ["impagas", "Impagas"],
                  ["pagadas", "Pagadas"],
                  ["anuladas", "Anuladas"],
                ] as const).map(([id, texto]) => (
                  <button key={id} onClick={() => setFiltro(id)} className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors ${filtro === id ? "bg-brand-fuchsia text-white border-brand-fuchsia" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}>
                    {texto}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input type="text" placeholder="Buscar alumna o butaca..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="pl-10 p-2 w-full border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-fuchsia" />
                </div>
                <button onClick={exportarCSV} className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center gap-2 text-sm font-bold whitespace-nowrap">
                  <Download size={16} /> <span className="hidden sm:inline">CSV</span>
                </button>
              </div>
            </div>

            {ventasFiltradas.length === 0 ? (
              <p className="text-gray-500 py-8 text-center">No hay ventas para mostrar.</p>
            ) : (
              <div className="space-y-3">
                {ventasFiltradas.map(v => (
                  <div key={v.id} className={`bg-white border rounded-xl p-4 ${v.sinVigentes ? "border-gray-200 opacity-70" : "border-brand-pink"}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-black text-brand-dark flex items-center gap-2 flex-wrap">
                          {nombreDe(v.alumna_id)}
                          {v.sinVigentes && <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">ANULADA</span>}
                          {!v.sinVigentes && v.todasPagadas && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">PAGADA</span>}
                          {!v.sinVigentes && !v.todasPagadas && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">IMPAGA</span>}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {v.items.map(i => (
                            <span key={i.id} className={`text-xs font-bold px-2 py-1 rounded-md border flex items-center gap-1 ${i.estado === "anulada" ? "bg-gray-100 text-gray-400 border-gray-200 line-through" : i.pagado ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                              <Armchair size={12} /> {i.fila} · {i.butaca}
                            </span>
                          ))}
                        </div>
                        {v.observacion && <p className="text-sm text-gray-500 mt-2 italic">“{v.observacion}”</p>}
                        <p className="text-[11px] text-gray-400 mt-1">{new Date(v.fecha).toLocaleString("es-AR")}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-black text-lg text-brand-dark">{pesos(v.total)}</p>
                        {!v.sinVigentes && !v.todasPagadas && <p className="text-xs text-red-500 font-bold">Debe {pesos(v.total - v.cobrado)}</p>}
                        {!v.sinVigentes && (
                          <div className="flex gap-2 justify-end mt-2">
                            <button
                              onClick={() => cambiarPago(v.vigentes.map(i => i.id), !v.todasPagadas)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${v.todasPagadas ? "border-gray-300 text-gray-600 hover:bg-gray-100" : "bg-green-600 text-white border-green-600 hover:bg-green-700"}`}
                            >
                              {v.todasPagadas ? "Marcar impaga" : "Marcar pagada"}
                            </button>
                            <button
                              onClick={() => anular(v.vigentes.map(i => i.id), `¿Anular la venta de ${v.vigentes.length} butaca(s) de ${nombreDe(v.alumna_id)}?\n\nLas butacas quedan libres y la venta queda registrada como ANULADA.`)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                            >
                              Anular
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {bloqueadas.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="font-black text-gray-700 flex items-center gap-2 mb-3"><Lock size={16} /> Butacas bloqueadas ({bloqueadas.length})</p>
                <div className="flex flex-wrap gap-2">
                  {bloqueadas.map(b => (
                    <button key={b.id} onClick={() => setDetalle(b)} title={b.motivo || "Sin motivo"} className="text-xs font-bold px-2 py-1 rounded-md border bg-white border-gray-300 text-gray-600 hover:border-brand-fuchsia flex items-center gap-1">
                      <Armchair size={12} /> {b.fila} · {b.butaca}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">En el mapa se ven igual que las vendidas. No suman a la recaudación.</p>
              </div>
            )}
          </div>
        )}

        {/* ================= RECAUDACIÓN ================= */}
        {tab === "recaudacion" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-brand-pink rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 uppercase">Cobrado</p>
                <p className="text-2xl font-black text-green-600">{pesos(resumen.cobrado)}</p>
              </div>
              <div className="bg-white border border-brand-pink rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 uppercase">A cobrar</p>
                <p className="text-2xl font-black text-red-500">{pesos(resumen.aCobrar)}</p>
              </div>
              <div className="bg-white border border-brand-pink rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 uppercase">Total vendido</p>
                <p className="text-2xl font-black text-brand-dark">{pesos(resumen.total)}</p>
              </div>
              <div className="bg-white border border-brand-pink rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 uppercase">Entradas</p>
                <p className="text-2xl font-black text-brand-fuchsia">{resumen.vendidas}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <p className="text-xs font-bold text-gray-500 uppercase">Libres</p>
                <p className="text-xl font-black text-gray-700">{resumen.libres}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <p className="text-xs font-bold text-gray-500 uppercase">Bloqueadas</p>
                <p className="text-xl font-black text-gray-700">{resumen.bloqueadas}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <p className="text-xs font-bold text-gray-500 uppercase">Anuladas</p>
                <p className="text-xl font-black text-gray-700">{resumen.anuladas}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <p className="text-xs font-bold text-gray-500 uppercase">Capacidad</p>
                <p className="text-xl font-black text-gray-700">{TOTAL_BUTACAS}</p>
              </div>
            </div>

            <div className="bg-white border border-brand-pink rounded-xl overflow-hidden">
              <p className="font-black text-brand-dark p-4 border-b border-gray-100">Entradas por alumna</p>
              {ranking.length === 0 ? (
                <p className="text-gray-500 p-6 text-center">Todavía no se vendió ninguna entrada.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <tr>
                        <th className="text-left p-3 font-bold">Alumna</th>
                        <th className="text-center p-3 font-bold">Butacas</th>
                        <th className="text-right p-3 font-bold">Total</th>
                        <th className="text-right p-3 font-bold">Cobrado</th>
                        <th className="text-right p-3 font-bold">Debe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ranking.map(r => (
                        <tr key={r.nombre} className="border-t border-gray-100">
                          <td className="p-3 font-bold text-brand-dark">{r.nombre}</td>
                          <td className="p-3 text-center">{r.butacas}</td>
                          <td className="p-3 text-right">{pesos(r.total)}</td>
                          <td className="p-3 text-right text-green-600">{pesos(r.cobrado)}</td>
                          <td className={`p-3 text-right font-bold ${r.adeuda > 0 ? "text-red-500" : "text-gray-300"}`}>{pesos(r.adeuda)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ---------- Barra de selección ---------- */}
      {tab === "vender" && seleccionadas.size > 0 && (
        <div className="sticky bottom-0 -mx-4 md:-mx-6 lg:-mx-10 px-4 md:px-6 lg:px-10 py-3 bg-white border-t-2 border-brand-fuchsia shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-20 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-black text-brand-dark">
                {seleccionadas.size} butaca{seleccionadas.size > 1 ? "s" : ""} · <span className="text-brand-fuchsia">{pesos(totalSeleccion)}</span>
              </p>
              <p className="text-xs text-gray-500 truncate max-w-[60vw]">
                {listaSeleccion.map(b => `${b.fila}-${b.butaca}`).join(", ")}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setSeleccionadas(new Set())} className="px-3 py-2 rounded-lg border border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-100">Limpiar</button>
              <button onClick={() => setModal("bloqueo")} className="px-3 py-2 rounded-lg border border-gray-400 text-gray-700 font-bold text-sm hover:bg-gray-100 flex items-center gap-2"><Lock size={16} /> Bloquear</button>
              <button onClick={() => setModal("venta")} className="px-4 py-2 rounded-lg bg-brand-fuchsia text-white font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2"><Ticket size={16} /> Vender</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Modal: registrar venta ---------- */}
      {modal === "venta" && (
        <Modal titulo="Registrar venta" onCerrar={() => setModal(null)}>
          <div className="bg-brand-pink/30 border border-brand-pink rounded-xl p-3 mb-4">
            <p className="text-sm font-bold text-brand-dark mb-1">{seleccionadas.size} butaca{seleccionadas.size > 1 ? "s" : ""}</p>
            <p className="text-xs text-gray-600">{listaSeleccion.map(b => `${b.fila}-${b.butaca}`).join(", ")}</p>
            <p className="text-lg font-black text-brand-fuchsia mt-2">{pesos(totalSeleccion)}</p>
          </div>

          <label className="block text-sm font-bold text-gray-700 mb-1">Alumna *</label>
          <div className="border border-gray-200 rounded-xl bg-gray-50 overflow-hidden mb-4">
            <div className="p-2 border-b border-gray-200 bg-white relative">
              <Search className="absolute left-5 top-4 text-gray-400" size={16} />
              <input type="text" placeholder="Buscar alumna..." value={busquedaAlumna} onChange={e => setBusquedaAlumna(e.target.value)} className="w-full pl-9 p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-fuchsia text-sm" />
            </div>
            <div className="p-2 max-h-56 overflow-y-auto space-y-1">
              {alumnasFiltradas.length === 0 ? (
                <p className="text-center text-gray-500 py-4 text-sm">No se encontraron alumnas.</p>
              ) : alumnasFiltradas.map(a => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAlumnaId(a.id)}
                  className={`w-full text-left flex items-center justify-between gap-2 p-2.5 rounded-lg border transition-colors ${alumnaId === a.id ? "bg-brand-pink/40 border-brand-pink font-bold text-brand-dark" : "bg-white border-transparent hover:bg-gray-100 text-gray-700"}`}
                >
                  <span className="text-sm truncate">{a.nombre}</span>
                  {a.activa === false && <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full shrink-0">baja</span>}
                </button>
              ))}
            </div>
          </div>

          <label className="block text-sm font-bold text-gray-700 mb-1">Observación</label>
          <input type="text" value={observacion} onChange={e => setObservacion(e.target.value)} placeholder="Ej: las retira la abuela" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-fuchsia outline-none mb-4" />

          <div className="grid grid-cols-2 gap-2 mb-5">
            <button type="button" onClick={() => setPagado(true)} className={`p-3 rounded-xl border-2 font-bold text-sm transition-colors ${pagado ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}>Pagó (efectivo)</button>
            <button type="button" onClick={() => setPagado(false)} className={`p-3 rounded-xl border-2 font-bold text-sm transition-colors ${!pagado ? "bg-amber-500 text-white border-amber-500" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}>Queda debiendo</button>
          </div>

          <button onClick={registrarVenta} disabled={guardando || !alumnaId} className="w-full bg-brand-dark text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            <Check size={18} /> {guardando ? "Registrando..." : "Registrar venta"}
          </button>
        </Modal>
      )}

      {/* ---------- Modal: bloquear ---------- */}
      {modal === "bloqueo" && (
        <Modal titulo="Bloquear butacas" onCerrar={() => setModal(null)}>
          <div className="bg-gray-100 border border-gray-200 rounded-xl p-3 mb-4">
            <p className="text-sm font-bold text-gray-700 mb-1">{seleccionadas.size} butaca{seleccionadas.size > 1 ? "s" : ""}</p>
            <p className="text-xs text-gray-600">{listaSeleccion.map(b => `${b.fila}-${b.butaca}`).join(", ")}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex gap-2">
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">En el mapa se van a ver <b>exactamente igual que las vendidas</b>. No cuentan como venta ni suman plata.</p>
          </div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Motivo (interno)</label>
          <input type="text" value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Ej: reservadas para la familia Pérez" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-fuchsia outline-none mb-5" />
          <button onClick={bloquearButacas} disabled={guardando} className="w-full bg-gray-700 text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            <Lock size={18} /> {guardando ? "Bloqueando..." : "Bloquear butacas"}
          </button>
        </Modal>
      )}

      {/* ---------- Modal: detalle de butaca ocupada ---------- */}
      {detalle && (
        <Modal titulo={`Butaca ${detalle.fila} · ${detalle.butaca}`} onCerrar={() => setDetalle(null)}>
          {detalle.estado === "bloqueada" ? (
            <>
              <div className="bg-gray-100 rounded-xl p-4 mb-4">
                <p className="font-black text-gray-700 flex items-center gap-2"><Lock size={16} /> Bloqueada</p>
                {detalle.motivo && <p className="text-sm text-gray-600 mt-1">{detalle.motivo}</p>}
                <p className="text-[11px] text-gray-400 mt-2">{new Date(detalle.created_at).toLocaleString("es-AR")}</p>
              </div>
              <button onClick={() => desbloquear(detalle.id)} className="w-full border-2 border-gray-300 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                <Unlock size={18} /> Liberar butaca
              </button>
            </>
          ) : (
            <>
              <div className="bg-brand-pink/30 border border-brand-pink rounded-xl p-4 mb-4 space-y-1">
                <p className="font-black text-brand-dark text-lg">{nombreDe(detalle.alumna_id)}</p>
                <p className="text-sm text-gray-700">{pesos(Number(detalle.precio || 0))} · {detalle.pagado ? <span className="text-green-600 font-bold">Pagada</span> : <span className="text-red-500 font-bold">IMPAGA</span>}</p>
                {detalle.observacion && <p className="text-sm text-gray-600 italic">“{detalle.observacion}”</p>}
                <p className="text-[11px] text-gray-400">{new Date(detalle.created_at).toLocaleString("es-AR")}</p>
              </div>

              <div className="space-y-2">
                <button onClick={() => cambiarPago([detalle.id], !detalle.pagado)} className={`w-full font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${detalle.pagado ? "border-2 border-gray-300 text-gray-700 hover:bg-gray-100" : "bg-green-600 text-white hover:bg-green-700"}`}>
                  <Check size={18} /> {detalle.pagado ? "Marcar como impaga" : "Marcar como pagada"}
                </button>
                <button onClick={() => anular([detalle.id], `¿Anular la butaca ${detalle.fila}-${detalle.butaca}?\n\nQueda libre para volver a venderla y el registro se guarda como ANULADA.`)} className="w-full border-2 border-red-200 text-red-500 font-bold py-3 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                  <Ban size={18} /> Anular esta butaca
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

function Modal({ titulo, children, onCerrar }: { titulo: string; children: React.ReactNode; onCerrar: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 print:hidden" onClick={onCerrar}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="font-black text-brand-dark">{titulo}</h3>
          <button onClick={onCerrar} className="p-1 text-gray-400 hover:text-brand-dark"><X size={22} /></button>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}

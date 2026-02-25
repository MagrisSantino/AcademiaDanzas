"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Check, X, Calendar as CalendarIcon, UsersRound } from "lucide-react";
import Link from "next/link";

export default function TomarAsistenciaPage() {
  const router = useRouter();
  const params = useParams();
  const grupoId = params.id as string;

  // Calculamos la fecha de hoy en formato YYYY-MM-DD para el input default
  const tzoffset = (new Date()).getTimezoneOffset() * 60000;
  const hoyStr = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];

  const [loading, setLoading] = useState(false);
  const [grupo, setGrupo] = useState<any>(null);
  const [alumnas, setAlumnas] = useState<any[]>([]);
  const [fecha, setFecha] = useState(hoyStr);
  const [presentes, setPresentes] = useState<string[]>([]);
  const [registroId, setRegistroId] = useState<string | null>(null);

  // Cargar el grupo y las alumnas
  useEffect(() => {
    const fetchGrupoYAlumnas = async () => {
      const { data: gData } = await supabase.from("grupos").select("*").eq("id", grupoId).single();
      if (gData) {
        setGrupo(gData);
        if (gData.alumnas_ids && gData.alumnas_ids.length > 0) {
          const { data: aData } = await supabase.from("alumnas").select("id, nombre").in("id", gData.alumnas_ids).order("nombre");
          if (aData) setAlumnas(aData);
        }
      }
    };
    fetchGrupoYAlumnas();
  }, [grupoId]);

  // Cargar la asistencia de la fecha seleccionada
  useEffect(() => {
    const fetchAsistencia = async () => {
      const { data } = await supabase.from("asistencia").select("*").eq("grupo_id", grupoId).eq("fecha", fecha).single();
      if (data) {
        setRegistroId(data.id);
        setPresentes(data.presentes_ids || []);
      } else {
        setRegistroId(null);
        setPresentes([]); // Limpiamos si no hay registro para ese día
      }
    };
    if (grupoId && fecha) fetchAsistencia();
  }, [grupoId, fecha]);

  const toggleAsistencia = (alumnaId: string) => {
    setPresentes(prev => prev.includes(alumnaId) ? prev.filter(id => id !== alumnaId) : [...prev, alumnaId]);
  };

  const marcarTodas = () => setPresentes(alumnas.map(a => a.id));
  const desmarcarTodas = () => setPresentes([]);

  const handleSubmit = async () => {
    setLoading(true);
    const payload = { grupo_id: grupoId, fecha, presentes_ids: presentes };

    let errorObj;
    if (registroId) {
      const { error } = await supabase.from("asistencia").update(payload).eq("id", registroId);
      errorObj = error;
    } else {
      const { error } = await supabase.from("asistencia").insert([payload]);
      errorObj = error;
    }

    setLoading(false);
    if (!errorObj) {
      alert("¡Asistencia guardada correctamente!");
      router.push("/dashboard/asistencia");
    } else {
      alert("Error al guardar: " + errorObj.message);
    }
  };

  if (!grupo) return <p className="p-10 font-bold text-gray-500">Cargando grupo...</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 md:pb-6"> {/* pb-24 da espacio para el botón pegajoso en celular */}
      
      {/* Header */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-brand-pink">
        <Link href="/dashboard/asistencia" className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-700" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-brand-dark leading-tight">{grupo.nombre}</h1>
          <p className="text-sm font-bold text-brand-fuchsia">Prof. {grupo.profesora}</p>
        </div>
      </div>

      {/* Selector de Fecha */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
        <div className="flex items-center gap-2">
          <CalendarIcon className="text-brand-fuchsia" size={20} />
          <span className="font-bold text-gray-700">Fecha de la clase:</span>
        </div>
        <input 
          type="date" 
          value={fecha} 
          onChange={(e) => setFecha(e.target.value)} 
          className="p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-fuchsia w-full sm:w-auto font-bold text-brand-dark"
        />
      </div>

      {/* Lista de Alumnas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <span className="font-bold text-gray-600 flex items-center gap-2">
            <UsersRound size={18} /> {alumnas.length} Alumnas Inscriptas
          </span>
          <div className="flex gap-2">
            <button onClick={marcarTodas} className="flex-1 sm:flex-none text-xs font-bold bg-green-100 text-green-700 px-3 py-2 rounded-lg hover:bg-green-200 transition-colors">Todo Presente</button>
            <button onClick={desmarcarTodas} className="flex-1 sm:flex-none text-xs font-bold bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors">Limpiar</button>
          </div>
        </div>

        <div className="p-2 sm:p-4 space-y-2">
          {alumnas.length === 0 ? (
            <p className="text-center text-gray-500 py-6">Este grupo no tiene alumnas asignadas todavía.</p>
          ) : (
            alumnas.map(a => {
              const estaPresente = presentes.includes(a.id);
              return (
                <div key={a.id} className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-colors">
                  <span className={`font-bold text-sm sm:text-base ${estaPresente ? 'text-brand-dark' : 'text-gray-500'}`}>{a.nombre}</span>
                  
                  <div className="flex gap-2">
                    {/* Botón Ausente */}
                    <button 
                      onClick={() => { if(estaPresente) toggleAsistencia(a.id); }}
                      className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-all ${!estaPresente ? 'bg-red-500 text-white shadow-md scale-105' : 'bg-gray-100 text-gray-400 opacity-50'}`}
                    >
                      <X size={20} strokeWidth={3} />
                    </button>
                    {/* Botón Presente */}
                    <button 
                      onClick={() => { if(!estaPresente) toggleAsistencia(a.id); }}
                      className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-all ${estaPresente ? 'bg-green-500 text-white shadow-md scale-105' : 'bg-gray-100 text-gray-400 opacity-50'}`}
                    >
                      <Check size={20} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Botón Flotante para Celulares (y normal en PC) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)] md:static md:bg-transparent md:border-none md:p-0 md:shadow-none z-20">
        <button 
          onClick={handleSubmit} 
          disabled={loading || alumnas.length === 0} 
          className="w-full max-w-2xl mx-auto bg-brand-fuchsia text-brand-light font-black text-lg py-4 rounded-xl hover:bg-brand-fuchsia/90 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
        >
          <Save size={24}/> {loading ? 'Guardando...' : 'GUARDAR ASISTENCIA'}
        </button>
      </div>

    </div>
  );
}
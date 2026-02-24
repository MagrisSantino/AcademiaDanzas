// src/app/dashboard/alumnas/page.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Pencil, Search, Trash2 } from "lucide-react";
import Link from "next/link";

export default function AlumnasPage() {
  const [alumnas, setAlumnas] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    fetchAlumnas();
  }, []);

  const fetchAlumnas = async () => {
    const { data } = await supabase.from("alumnas").select("*").order("nombre", { ascending: true });
    if (data) setAlumnas(data);
  };

  const handleEliminar = async (id: string, nombre: string) => {
    // Confirmación antes de borrar
    const confirmar = window.confirm(
      `¿Estás segura de que querés eliminar a ${nombre}?\n\nNota: Si la alumna ya tiene pagos registrados, el sistema no te dejará borrarla para proteger las estadísticas. En ese caso, editala y pasala a estado "Baja".`
    );

    if (confirmar) {
      const { error } = await supabase.from("alumnas").delete().eq("id", id);
      
      if (error) {
        alert("No se pudo eliminar la alumna. Es probable que tenga pagos asociados. \n\nError: " + error.message);
      } else {
        // Actualizamos la lista sacando a la alumna borrada
        setAlumnas(alumnas.filter(a => a.id !== id));
      }
    }
  };

  const filtradas = alumnas.filter(a => a.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-brand-dark">Gestión de Alumnas</h1>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre..." 
              value={busqueda} 
              onChange={e => setBusqueda(e.target.value)} 
              className="pl-10 p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-fuchsia"
            />
          </div>
          <Link href="/dashboard/alumnas/nueva" className="bg-brand-fuchsia text-brand-light px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-transform hover:scale-105">
            <Plus size={20} /> Nueva Alumna
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-brand-pink overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-brand-pink/30 text-brand-dark border-b border-brand-pink font-bold">
              <th className="p-4">Acciones</th>
              <th className="p-4">Nombre</th>
              <th className="p-4">Teléfono</th>
              <th className="p-4">Inicio</th>
              <th className="p-4">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map(a => (
              <tr key={a.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${!a.activa && 'opacity-50'}`}>
                <td className="p-4 flex gap-4 items-center">
                  <Link href={`/dashboard/alumnas/editar/${a.id}`} title="Editar Alumna" className="text-brand-fuchsia hover:text-brand-dark transition-colors">
                    <Pencil size={20} />
                  </Link>
                  <button 
                    onClick={() => handleEliminar(a.id, a.nombre)} 
                    title="Eliminar Alumna"
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </td>
                <td className="p-4 font-bold text-brand-dark">{a.nombre}</td>
                <td className="p-4 text-gray-600 text-sm">{a.telefono || "-"}</td>
                <td className="p-4 text-gray-600 text-sm">{new Date(a.fecha_inicio).toLocaleDateString("es-AR", { timeZone: "UTC" })}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${a.activa ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {a.activa ? 'Activa' : 'Baja'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
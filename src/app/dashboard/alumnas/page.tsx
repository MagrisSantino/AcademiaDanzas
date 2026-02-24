// src/app/dashboard/alumnas/page.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Pencil, Search } from "lucide-react";
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

  const filtradas = alumnas.filter(a => a.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-brand-dark">Gestión de Alumnas</h1>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input type="text" placeholder="Buscar por nombre..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="pl-10 p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-fuchsia"/>
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
                <td className="p-4">
                  <Link href={`/dashboard/alumnas/editar/${a.id}`} className="text-brand-fuchsia hover:text-brand-dark"><Pencil size={20} /></Link>
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
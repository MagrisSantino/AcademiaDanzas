// src/app/dashboard/alumnas/page.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function AlumnasPage() {
  const [alumnas, setAlumnas] = useState<any[]>([]);

  useEffect(() => {
    fetchAlumnas();
  }, []);

  const fetchAlumnas = async () => {
    const { data, error } = await supabase
      .from("alumnas")
      .select("*")
      .order("nombre", { ascending: true });
      
    if (!error && data) {
      setAlumnas(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-brand-dark">Gestión de Alumnas</h1>
        <Link 
          href="/dashboard/alumnas/nueva" 
          className="bg-brand-fuchsia text-brand-light px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus size={20} />
          Nueva Alumna
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-brand-pink overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-pink/30 text-brand-dark border-b border-brand-pink">
                <th className="p-4 font-bold">Nombre</th>
                <th className="p-4 font-bold">DNI</th>
                <th className="p-4 font-bold">Dirección</th>
                <th className="p-4 font-bold">Teléfono</th>
                <th className="p-4 font-bold">Fecha Inicio</th>
                <th className="p-4 font-bold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {alumnas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No hay alumnas registradas todavía.
                  </td>
                </tr>
              ) : (
                alumnas.map((alumna) => (
                  <tr key={alumna.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 font-medium text-brand-dark">{alumna.nombre}</td>
                    <td className="p-4 text-gray-600">{alumna.dni || "-"}</td>
                    <td className="p-4 text-gray-600">{alumna.direccion || "-"}</td>
                    <td className="p-4 text-gray-600">{alumna.telefono || "-"}</td>
                    <td className="p-4 text-gray-600">
                      {alumna.fecha_inicio ? new Date(alumna.fecha_inicio).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "-"}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${alumna.activa ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {alumna.activa ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
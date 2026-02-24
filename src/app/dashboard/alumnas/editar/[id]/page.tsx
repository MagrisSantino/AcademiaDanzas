// src/app/dashboard/alumnas/editar/[id]/page.tsx
"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function EditarAlumnaPage() {
  const router = useRouter();
  const params = useParams();
  const alumnaId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    dni: "",
    direccion: "",
    telefono: "",
    fecha_inicio: "",
    activa: true
  });

  useEffect(() => {
    const fetchAlumna = async () => {
      const { data } = await supabase.from("alumnas").select("*").eq("id", alumnaId).single();
      if (data) {
        setFormData({
          nombre: data.nombre,
          dni: data.dni || "",
          direccion: data.direccion || "",
          telefono: data.telefono || "",
          fecha_inicio: data.fecha_inicio,
          activa: data.activa
        });
      }
    };
    fetchAlumna();
  }, [alumnaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("alumnas").update([{
      nombre: formData.nombre,
      dni: formData.dni,
      direccion: formData.direccion,
      telefono: formData.telefono,
      fecha_inicio: formData.fecha_inicio,
      activa: formData.activa
    }]).eq("id", alumnaId);

    setLoading(false);

    if (!error) {
      router.push("/dashboard/alumnas");
    } else {
      alert("Error al actualizar: " + error.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/alumnas" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <h1 className="text-3xl font-black text-brand-dark">Editar Alumna</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-brand-pink space-y-6">
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo *</label>
            <input 
              type="text" required
              value={formData.nombre}
              onChange={e => setFormData({...formData, nombre: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-fuchsia outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">DNI</label>
              <input 
                type="text" 
                value={formData.dni}
                onChange={e => setFormData({...formData, dni: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-fuchsia outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Teléfono</label>
              <input 
                type="text" 
                value={formData.telefono}
                onChange={e => setFormData({...formData, telefono: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-fuchsia outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Dirección</label>
            <input 
              type="text" 
              value={formData.direccion}
              onChange={e => setFormData({...formData, direccion: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-fuchsia outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Fecha de Inicio</label>
              <input 
                type="date" required
                value={formData.fecha_inicio}
                onChange={e => setFormData({...formData, fecha_inicio: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-fuchsia outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Estado de la Alumna</label>
              <select 
                value={formData.activa.toString()}
                onChange={e => setFormData({...formData, activa: e.target.value === 'true'})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-fuchsia outline-none"
              >
                <option value="true">Activa (Cursa actualmente)</option>
                <option value="false">Inactiva / Baja</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand-dark text-brand-light font-bold py-3 rounded-lg hover:bg-gray-800 transition-colors flex justify-center items-center gap-2"
          >
            <Save size={20} />
            {loading ? 'Guardando...' : 'Actualizar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
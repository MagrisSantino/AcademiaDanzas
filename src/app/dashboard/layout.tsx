// src/app/dashboard/layout.tsx
"use client";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import { Users, DollarSign, LogOut, BarChart3, Menu, X, UsersRound, ClipboardCheck } from "lucide-react";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [verificando, setVerificando] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    const verificarSesion = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push("/"); 
      else setVerificando(false); 
    };
    verificarSesion();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (verificando) return <div className="h-screen flex items-center justify-center bg-gray-50 text-brand-fuchsia font-bold text-xl">Cargando panel...</div>;

  return (
    <div className="flex h-screen bg-gray-50 flex-col md:flex-row overflow-hidden">
      <div className="md:hidden bg-[#FFDBF8] p-4 flex justify-between items-center shadow-md z-30 relative">
        <img src="/logo.png" alt="Lorena La Marca" className="h-10 object-contain" />
        <button onClick={() => setMenuAbierto(!menuAbierto)} className="text-brand-dark p-2">
          {menuAbierto ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {menuAbierto && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setMenuAbierto(false)} />}

      <aside className={`fixed md:static inset-y-0 left-0 w-64 bg-[#FFDBF8] text-brand-dark flex flex-col shadow-2xl z-30 transform transition-transform duration-300 ease-in-out ${menuAbierto ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 h-full`}>
        <div className="p-8 hidden md:flex justify-center">
          <img src="/logo.png" alt="Lorena La Marca" className="w-48 h-auto block transition-transform hover:scale-105" style={{ maxHeight: '120px', objectFit: 'contain' }} />
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4 md:mt-0 overflow-y-auto">
          <Link href="/dashboard/alumnas" onClick={() => setMenuAbierto(false)} className={`flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${pathname.includes('/alumnas') ? 'bg-brand-dark text-brand-fuchsia scale-105 shadow-lg' : 'hover:bg-black/10'}`}>
            <Users size={20} /> Gestión Alumnas
          </Link>
          
          <Link href="/dashboard/grupos" onClick={() => setMenuAbierto(false)} className={`flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${pathname.includes('/grupos') ? 'bg-brand-dark text-brand-fuchsia scale-105 shadow-lg' : 'hover:bg-black/10'}`}>
            <UsersRound size={20} /> Grupos de Danza
          </Link>

          {/* NUEVO LINK DE ASISTENCIA */}
          <Link href="/dashboard/asistencia" onClick={() => setMenuAbierto(false)} className={`flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${pathname.includes('/asistencia') ? 'bg-brand-dark text-brand-fuchsia scale-105 shadow-lg' : 'hover:bg-black/10'}`}>
            <ClipboardCheck size={20} /> Asistencia
          </Link>

          <Link href="/dashboard/pagos" onClick={() => setMenuAbierto(false)} className={`flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${pathname.includes('/pagos') ? 'bg-brand-dark text-brand-fuchsia scale-105 shadow-lg' : 'hover:bg-black/10'}`}>
            <DollarSign size={20} /> Control de Pagos
          </Link>
          
          <Link href="/dashboard/estadisticas" onClick={() => setMenuAbierto(false)} className={`flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${pathname.includes('/estadisticas') ? 'bg-brand-dark text-brand-fuchsia scale-105 shadow-lg' : 'hover:bg-black/10'}`}>
            <BarChart3 size={20} /> Estadísticas
          </Link>
        </nav>

        <div className="p-4 border-t border-black/10 mt-auto">
          <button onClick={handleLogout} className="flex items-center gap-3 p-3 w-full rounded-xl font-bold hover:bg-black/10 transition-colors">
            <LogOut size={20} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-10 bg-[#fdfdfd] w-full relative">
        {children}
      </main>
    </div>
  );
}
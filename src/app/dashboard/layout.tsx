// src/app/dashboard/layout.tsx
"use client";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import { Users, DollarSign, LogOut, BarChart3 } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-brand-fuchsia text-brand-dark flex flex-col shadow-2xl z-10">
        <div className="p-8">
          <h2 className="text-3xl font-black tracking-tighter bg-brand-dark text-brand-fuchsia px-3 py-1 rounded inline-block">
            LORENA
          </h2>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <Link href="/dashboard/alumnas" className={`flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${pathname.includes('/alumnas') ? 'bg-brand-dark text-brand-fuchsia scale-105' : 'hover:bg-black/10'}`}>
            <Users size={20} /> Gestión Alumnas
          </Link>
          <Link href="/dashboard/pagos" className={`flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${pathname.includes('/pagos') ? 'bg-brand-dark text-brand-fuchsia scale-105' : 'hover:bg-black/10'}`}>
            <DollarSign size={20} /> Control de Pagos
          </Link>
          <Link href="/dashboard/estadisticas" className={`flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${pathname.includes('/estadisticas') ? 'bg-brand-dark text-brand-fuchsia scale-105' : 'hover:bg-black/10'}`}>
            <BarChart3 size={20} /> Estadísticas
          </Link>
        </nav>

        <div className="p-4 border-t border-black/10">
          <button onClick={handleLogout} className="flex items-center gap-3 p-3 w-full rounded-xl font-bold hover:bg-black/10 transition-colors">
            <LogOut size={20} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-10 bg-[#fdfdfd]">
        {children}
      </main>
    </div>
  );
}
// src/app/dashboard/layout.tsx
"use client";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import { Users, DollarSign, LogOut } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Fucsia */}
      <aside className="w-64 bg-brand-fuchsia text-brand-dark flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-black tracking-tighter bg-brand-light text-brand-fuchsia px-2 py-1 rounded inline-block">
            LORENA
          </h2>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link 
            href="/dashboard/alumnas" 
            className={`flex items-center gap-3 p-3 rounded-lg font-bold transition-colors ${pathname.includes('/alumnas') ? 'bg-brand-dark text-brand-fuchsia' : 'hover:bg-black/10'}`}
          >
            <Users size={20} />
            Gestión Alumnas
          </Link>
          <Link 
            href="/dashboard/pagos" 
            className={`flex items-center gap-3 p-3 rounded-lg font-bold transition-colors ${pathname.includes('/pagos') ? 'bg-brand-dark text-brand-fuchsia' : 'hover:bg-black/10'}`}
          >
            <DollarSign size={20} />
            Control de Pagos
          </Link>
        </nav>

        <div className="p-4">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 w-full rounded-lg font-bold hover:bg-black/10 transition-colors"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
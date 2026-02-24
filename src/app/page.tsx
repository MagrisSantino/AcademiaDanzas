// src/app/page.tsx
"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image"; 

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError("Credenciales inválidas. Verifique email y contraseña.");
      } else {
        router.push("/dashboard/alumnas");
      }
    } catch (err) {
      setError("Ocurrió un error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      
      {/* --- FONDO EN HD SIN DESENFOQUE --- */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/bg-login2.jpg" 
          alt="Fondo Academia" 
          fill
          quality={100} // <-- ESTO OBLIGA A CARGARLA EN HD REAL
          className="object-cover scale-105" 
          priority
        />
        {/* Capa oscura superpuesta SIN el backdrop-blur */}
        <div className="absolute inset-0 bg-black/40" /> 
      </div>

      {/* --- CAJA DE LOGIN EFECTO CRISTAL (Glassmorphism) --- */}
      <div className="relative z-10 w-full max-w-md p-8 mx-4">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8 animate-fade-in-up">
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-lg">
              Academia de Danzas
            </h1>
            <p className="text-brand-pink/90 mt-2 font-medium">
              Lorena La Marca
            </p>
          </div>
          
          {error && (
            <div className="mb-6 bg-red-500/80 border border-red-500/50 backdrop-blur-md text-white px-4 py-3 rounded-lg text-sm text-center shadow-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/90 ml-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-brand-fuchsia/50 focus:ring-2 focus:ring-brand-fuchsia/20 text-white placeholder:text-white/50 transition-all"
                placeholder="ejemplo@email.com"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/90 ml-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-brand-fuchsia/50 focus:ring-2 focus:ring-brand-fuchsia/20 text-white placeholder:text-white/50 transition-all"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-fuchsia hover:bg-brand-fuchsia/90 text-white font-black py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-brand-fuchsia/30 flex justify-center items-center mt-8"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Ingresando...
                </span>
              ) : (
                "INGRESAR AL SISTEMA"
              )}
            </button>
          </form>
        </div>
        
        <p className="text-center text-white/60 text-xs mt-8 drop-shadow-md">
          © {new Date().getFullYear()} Sistema de Gestión Privado
        </p>
      </div>
    </div>
  );
}
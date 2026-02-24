// src/app/page.tsx
"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true); // Bloqueamos el botón y mostramos que está cargando
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError("Error: " + error.message); // Mostramos el error exacto
      } else {
        router.push("/dashboard/alumnas");
      }
    } catch (err) {
      setError("Ocurrió un error inesperado al conectar.");
      console.error(err);
    } finally {
      setLoading(false); // Liberamos el botón
    }
  };

  return (
    <div className="min-h-screen bg-brand-pink flex items-center justify-center">
      <div className="bg-brand-light p-8 rounded-xl shadow-xl w-full max-w-md">
        
        {/* Aquí también podrías poner tu logo si lo deseas */}
        <h1 className="text-3xl font-bold text-center text-brand-fuchsia mb-6">
          Academia de Danzas
        </h1>
        
        {/* Cartel de error con mejor contraste */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-fuchsia"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-fuchsia"
              required
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-fuchsia text-white font-black py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex justify-center items-center"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
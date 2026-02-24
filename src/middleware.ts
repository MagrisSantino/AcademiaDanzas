// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Supabase guarda una cookie que empieza con "sb-" cuando estás logueado
  const hasAuthCookie = request.cookies.getAll().some(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'));

  // Si intenta entrar al dashboard y NO hay cookie, lo pateamos al login
  if (!hasAuthCookie && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

// Esto le dice a Next.js en qué rutas debe ejecutarse esta seguridad
export const config = {
  matcher: '/dashboard/:path*',
}
-- ============================================================
-- FESTIVALES - Venta de entradas numeradas
-- Ejecutar en Supabase > SQL Editor
--
-- Crea DOS tablas NUEVAS (festivales y festival_entradas).
-- No toca ni una sola tabla de las que ya existen.
-- Es seguro ejecutarlo mas de una vez.
-- ============================================================


-- ------------------------------------------------------------
-- PASO 1 - Cabecera del festival
-- Un festival = una funcion, con un precio unico de entrada.
-- ------------------------------------------------------------
create table if not exists public.festivales (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  fecha date,
  lugar text,
  precio_entrada numeric(12,2) not null default 0,
  observaciones text,
  created_at timestamptz not null default now()
);


-- ------------------------------------------------------------
-- PASO 2 - Una fila por butaca ocupada
--
-- estado:
--   'vendida'   -> venta real, siempre con alumna asignada
--   'bloqueada' -> reservada / no vendible. En el mapa se ve igual
--                  que una vendida, pero no cuenta como venta.
--   'anulada'   -> la butaca vuelve a estar libre, pero el registro
--                  queda para siempre (no se pierde nada).
--
-- El tipo de alumna_id se copia del tipo real de alumnas.id, para
-- que la clave foranea no falle sea uuid o bigint.
-- ------------------------------------------------------------
do $$
declare
  tipo_id_alumna text;
begin
  if to_regclass('public.festival_entradas') is not null then
    raise notice 'La tabla festival_entradas ya existia. No se hizo nada.';
    return;
  end if;

  select format_type(a.atttypid, a.atttypmod) into tipo_id_alumna
  from pg_attribute a
  where a.attrelid = 'public.alumnas'::regclass
    and a.attname = 'id'
    and a.attnum > 0;

  execute format($f$
    create table public.festival_entradas (
      id uuid primary key default gen_random_uuid(),
      festival_id uuid not null references public.festivales(id) on delete restrict,
      fila text not null,
      butaca integer not null,
      sector text not null default 'pullman',
      estado text not null default 'vendida',
      alumna_id %s references public.alumnas(id) on delete restrict,
      pagado boolean not null default false,
      precio numeric(12,2) not null default 0,
      observacion text,
      motivo text,
      venta_id uuid,
      created_at timestamptz not null default now(),
      constraint festival_entradas_estado_ck
        check (estado in ('vendida','bloqueada','anulada')),
      constraint festival_entradas_alumna_ck
        check (estado <> 'vendida' or alumna_id is not null)
    )$f$, tipo_id_alumna);

  raise notice 'OK: tabla festival_entradas creada.';
end $$;


-- ------------------------------------------------------------
-- PASO 3 - EL CANDADO MAS IMPORTANTE
-- Una misma butaca no puede quedar ocupada dos veces en el mismo
-- festival. Las anuladas quedan fuera del indice: por eso anular
-- una venta libera la butaca sin borrar el registro.
-- ------------------------------------------------------------
create unique index if not exists festival_entradas_butaca_uniq
  on public.festival_entradas (festival_id, fila, butaca)
  where estado <> 'anulada';


-- ------------------------------------------------------------
-- PASO 4 - Indices de consulta
-- ------------------------------------------------------------
create index if not exists festival_entradas_festival_idx
  on public.festival_entradas (festival_id);

create index if not exists festival_entradas_alumna_idx
  on public.festival_entradas (alumna_id);


-- ------------------------------------------------------------
-- Listo. Borrar una alumna con entradas ya es imposible (RESTRICT)
-- y borrar un festival con entradas tambien.
-- ------------------------------------------------------------

-- ============================================================
-- PROTECCIÓN DE DATOS - Academia Web
-- Ejecutar en Supabase > SQL Editor
--
-- Este script NO borra ni modifica ningún dato existente.
-- Solo agrega candados para que no se puedan perder datos.
-- Es seguro ejecutarlo más de una vez.
-- ============================================================


-- ------------------------------------------------------------
-- PASO 0 (opcional): ver si ya hay duplicados dados de alta
-- Corré esto solo y mirá el resultado antes de seguir.
-- Si devuelve 0 filas, está todo limpio.
-- ------------------------------------------------------------
-- select alumna_id, mes, anio, count(*)
-- from public.pagos group by 1,2,3 having count(*) > 1;


-- ------------------------------------------------------------
-- PASO 1 — EL MÁS IMPORTANTE
-- Hoy pagos.alumna_id está en CASCADE: borrar una alumna
-- borra TODOS sus pagos históricos sin aviso.
-- Lo pasamos a RESTRICT: la base rechaza el borrado si tiene pagos.
-- ------------------------------------------------------------
do $$
declare
  nombre_constraint text;
begin
  select tc.constraint_name into nombre_constraint
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu
    on tc.constraint_name = kcu.constraint_name
   and tc.table_schema = kcu.table_schema
  where tc.table_schema = 'public'
    and tc.table_name = 'pagos'
    and tc.constraint_type = 'FOREIGN KEY'
    and kcu.column_name = 'alumna_id'
  limit 1;

  if nombre_constraint is not null then
    execute format('alter table public.pagos drop constraint %I', nombre_constraint);
  end if;

  alter table public.pagos
    add constraint pagos_alumna_id_fkey
    foreign key (alumna_id) references public.alumnas(id)
    on delete restrict;

  raise notice 'OK: borrar una alumna con pagos ahora es imposible.';
end $$;


-- ------------------------------------------------------------
-- PASO 2 — Evitar pagos duplicados de la misma alumna/mes/año
-- Si ya existen duplicados, NO crea el índice y te avisa.
-- ------------------------------------------------------------
do $$
declare
  duplicados int;
begin
  select count(*) into duplicados from (
    select alumna_id, mes, anio
    from public.pagos
    group by 1,2,3 having count(*) > 1
  ) d;

  if duplicados > 0 then
    raise notice 'ATENCION: hay % combinaciones de pagos duplicadas. NO se creo el candado. Revisalas con la consulta del PASO 0 y despues volve a correr este script.', duplicados;
  else
    create unique index if not exists pagos_alumna_mes_anio_uniq
      on public.pagos (alumna_id, mes, anio);
    raise notice 'OK: ya no se pueden crear pagos duplicados.';
  end if;
end $$;


-- ------------------------------------------------------------
-- PASO 3 — Mismo candado para asistencia (un registro por grupo/fecha)
-- ------------------------------------------------------------
do $$
declare
  duplicados int;
begin
  select count(*) into duplicados from (
    select grupo_id, fecha
    from public.asistencia
    group by 1,2 having count(*) > 1
  ) d;

  if duplicados > 0 then
    raise notice 'ATENCION: hay % fechas de asistencia duplicadas. NO se creo el candado.', duplicados;
  else
    create unique index if not exists asistencia_grupo_fecha_uniq
      on public.asistencia (grupo_id, fecha);
    raise notice 'OK: asistencia protegida contra duplicados.';
  end if;
end $$;


-- ------------------------------------------------------------
-- PASO 4 — Mismo candado para pagos de vestuarios
-- ------------------------------------------------------------
do $$
declare
  duplicados int;
begin
  select count(*) into duplicados from (
    select vestuario_id, alumna_id
    from public.pagos_vestuarios
    group by 1,2 having count(*) > 1
  ) d;

  if duplicados > 0 then
    raise notice 'ATENCION: hay % pagos de vestuario duplicados. NO se creo el candado.', duplicados;
  else
    create unique index if not exists pagos_vestuarios_vestuario_alumna_uniq
      on public.pagos_vestuarios (vestuario_id, alumna_id);
    raise notice 'OK: pagos de vestuarios protegidos contra duplicados.';
  end if;
end $$;

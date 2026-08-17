-- ============================================================
-- FESTIVALES v2 - Pagos parciales + poder borrar un festival
-- Ejecutar en Supabase > SQL Editor
--
-- No borra ningun dato: la plata ya cobrada se pasa a la columna
-- nueva antes de tocar nada.
-- Es seguro ejecutarlo mas de una vez.
-- ============================================================


-- ------------------------------------------------------------
-- PASO 1 - Pago parcial
--
-- Antes cada butaca era "pagada si / no". Ahora guarda CUANTO se
-- pago (monto_pagado), asi se puede cobrar una parte y el resto
-- despues.
--
-- 'pagado' sigue existiendo pero pasa a ser una columna CALCULADA:
-- la base la deduce sola de monto_pagado y precio. Asi es imposible
-- que queden en desacuerdo.
-- ------------------------------------------------------------
do $$
begin
  if to_regclass('public.festival_entradas') is null then
    raise exception 'Falta la tabla festival_entradas. Corre primero SUPABASE_FESTIVALES.sql';
  end if;

  -- 1.a  columna nueva con la plata cobrada de cada butaca
  if not exists (
    select 1 from pg_attribute
    where attrelid = to_regclass('public.festival_entradas')
      and attname = 'monto_pagado' and attnum > 0 and not attisdropped
  ) then
    alter table public.festival_entradas
      add column monto_pagado numeric(12,2) not null default 0;

    -- Lo que estaba marcado como pagado queda cobrado por completo
    update public.festival_entradas set monto_pagado = precio where pagado;

    raise notice 'OK: columna monto_pagado creada con la plata que ya estaba cobrada.';
  else
    raise notice 'La columna monto_pagado ya existia. No se toco.';
  end if;

  -- 1.b  'pagado' pasa a calcularse sola
  if exists (
    select 1 from pg_attribute
    where attrelid = to_regclass('public.festival_entradas')
      and attname = 'pagado' and attnum > 0 and not attisdropped
      and attgenerated = ''
  ) then
    alter table public.festival_entradas drop column pagado;
    alter table public.festival_entradas
      add column pagado boolean
      generated always as (estado = 'vendida' and monto_pagado >= precio) stored;

    raise notice 'OK: pagado ahora lo calcula la base sola.';
  else
    raise notice 'pagado ya era una columna calculada. No se toco.';
  end if;

  -- 1.c  candado: nunca se puede cobrar de menos que 0 ni de mas que el precio
  if not exists (
    select 1 from pg_constraint
    where conrelid = to_regclass('public.festival_entradas')
      and conname = 'festival_entradas_monto_ck'
  ) then
    alter table public.festival_entradas
      add constraint festival_entradas_monto_ck
      check (monto_pagado >= 0 and monto_pagado <= precio);

    raise notice 'OK: no se puede cobrar mas que el precio de la butaca.';
  end if;
end $$;


-- ------------------------------------------------------------
-- PASO 2 - Borrar un festival borra sus entradas
--
-- Antes la base rechazaba borrar un festival con entradas.
-- Ahora borra el festival y todas sus entradas de una sola vez
-- (una sola operacion: o se borra todo o no se borra nada).
--
-- OJO: esto SI borra datos. La app pide escribir el nombre del
-- festival para confirmar antes de hacerlo.
--
-- La proteccion de alumnas NO cambia: seguis sin poder borrar una
-- alumna que tenga entradas.
-- ------------------------------------------------------------
do $$
declare
  nombre_fk text;
begin
  select conname into nombre_fk
  from pg_constraint
  where conrelid = to_regclass('public.festival_entradas')
    and confrelid = to_regclass('public.festivales')
    and contype = 'f'
  limit 1;

  if nombre_fk is not null then
    execute format('alter table public.festival_entradas drop constraint %I', nombre_fk);
  end if;

  alter table public.festival_entradas
    add constraint festival_entradas_festival_id_fkey
    foreign key (festival_id) references public.festivales(id)
    on delete cascade;

  raise notice 'OK: borrar un festival ahora borra sus entradas.';
end $$;

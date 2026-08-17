-- ============================================================
-- VERIFICAR que el modulo Festival quedo bien instalado
-- Ejecutar en Supabase > SQL Editor
--
-- Es SOLO DE LECTURA: no crea, no modifica y no borra nada.
-- Tienen que dar todos OK.
-- ============================================================

select 'Tabla festivales' as control,
       case when to_regclass('public.festivales') is not null
            then 'OK' else 'FALTA - correr SUPABASE_FESTIVALES.sql' end as resultado

union all
select 'Tabla festival_entradas',
       case when to_regclass('public.festival_entradas') is not null
            then 'OK' else 'FALTA - correr SUPABASE_FESTIVALES.sql' end

union all
select 'Candado: una butaca no se vende dos veces',
       case when exists (
              select 1 from pg_indexes
              where schemaname = 'public'
                and indexname = 'festival_entradas_butaca_uniq'
            ) then 'OK' else 'FALTA - el indice unico no se creo' end

union all
select 'No se puede borrar una alumna con entradas',
       case when exists (
              select 1 from pg_constraint
              where conrelid = to_regclass('public.festival_entradas')
                and confrelid = to_regclass('public.alumnas')
                and contype = 'f' and confdeltype = 'r'
            ) then 'OK' else 'FALTA - la clave foranea no quedo en RESTRICT' end

union all
select 'Borrar un festival borra sus entradas',
       case when exists (
              select 1 from pg_constraint
              where conrelid = to_regclass('public.festival_entradas')
                and confrelid = to_regclass('public.festivales')
                and contype = 'f' and confdeltype = 'c'
            ) then 'OK' else 'FALTA - correr SUPABASE_FESTIVALES_PAGOS_Y_BORRADO.sql' end

union all
select 'Pago parcial (columna monto_pagado)',
       case when exists (
              select 1 from pg_attribute
              where attrelid = to_regclass('public.festival_entradas')
                and attname = 'monto_pagado' and attnum > 0 and not attisdropped
            ) then 'OK' else 'FALTA - correr SUPABASE_FESTIVALES_PAGOS_Y_BORRADO.sql' end

union all
select 'pagado lo calcula la base sola',
       case when exists (
              select 1 from pg_attribute
              where attrelid = to_regclass('public.festival_entradas')
                and attname = 'pagado' and attnum > 0 and not attisdropped
                and attgenerated = 's'
            ) then 'OK' else 'FALTA - correr SUPABASE_FESTIVALES_PAGOS_Y_BORRADO.sql' end

union all
select 'No se puede cobrar mas que el precio',
       case when exists (
              select 1 from pg_constraint
              where conrelid = to_regclass('public.festival_entradas')
                and conname = 'festival_entradas_monto_ck'
            ) then 'OK' else 'FALTA' end

union all
select 'Solo se aceptan estados validos',
       case when exists (
              select 1 from pg_constraint
              where conrelid = to_regclass('public.festival_entradas')
                and conname = 'festival_entradas_estado_ck'
            ) then 'OK' else 'FALTA' end

union all
select 'Toda venta tiene alumna asignada',
       case when exists (
              select 1 from pg_constraint
              where conrelid = to_regclass('public.festival_entradas')
                and conname = 'festival_entradas_alumna_ck'
            ) then 'OK' else 'FALTA' end

union all
select 'RLS apagado (igual que el resto del sistema)',
       case when (
              select bool_and(not relrowsecurity) from pg_class
              where oid in (to_regclass('public.festivales'),
                            to_regclass('public.festival_entradas'))
            ) then 'OK'
            else 'ATENCION: RLS activado. La app no va a poder leer ni escribir.' end

union all
select 'Columnas de festival_entradas',
       case when (
              select count(*) from information_schema.columns
              where table_schema = 'public' and table_name = 'festival_entradas'
                and column_name in ('id','festival_id','fila','butaca','sector','estado',
                                    'alumna_id','pagado','monto_pagado','precio',
                                    'observacion','motivo','venta_id','created_at')
            ) = 14 then 'OK' else 'FALTA alguna columna' end;

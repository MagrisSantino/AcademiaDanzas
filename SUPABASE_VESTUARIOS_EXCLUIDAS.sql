-- ============================================================
-- Vestuarios: alumnas excluidas de una coreografía
-- Ejecutar en Supabase > SQL Editor
--
-- Agrega una columna nueva vacía. No toca ningún dato existente.
-- Los vestuarios que ya existen quedan con todas las alumnas
-- incluidas, igual que hasta ahora.
-- Es seguro ejecutarlo más de una vez.
-- ============================================================

do $$
declare
  tipo_columna text;
begin
  -- Usamos el mismo tipo que grupos.alumnas_ids para mantener consistencia
  select format_type(a.atttypid, a.atttypmod) into tipo_columna
  from pg_attribute a
  where a.attrelid = 'public.grupos'::regclass
    and a.attname = 'alumnas_ids'
    and a.attnum > 0;

  if exists (
    select 1 from pg_attribute
    where attrelid = 'public.vestuarios'::regclass
      and attname = 'excluidas_ids'
      and attnum > 0
  ) then
    raise notice 'La columna excluidas_ids ya existia. No se hizo nada.';
  else
    execute format(
      'alter table public.vestuarios add column excluidas_ids %s not null default ''{}''',
      coalesce(tipo_columna, 'text[]')
    );
    raise notice 'OK: columna excluidas_ids creada como %.', coalesce(tipo_columna, 'text[]');
  end if;
end $$;


-- Control: tiene que devolver 1 fila con la columna excluidas_ids
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'vestuarios'
  and column_name = 'excluidas_ids';

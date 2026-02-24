import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import Papa from 'papaparse';

// PONÉ TUS CLAVES ACÁ
const supabase = createClient('https://jamnfisifpnuzqwpfayn.supabase.co', 'sb_publishable_zxCE4BII4khoaqg_Gf9GlQ_IrJw2XCW');

const leerCSV = (ruta) => {
  const file = fs.readFileSync(ruta, 'utf8');
  return Papa.parse(file, { header: true, skipEmptyLines: true }).data;
};

async function migrar() {
  console.log("Iniciando migración...");

  // 1. MIGRAR ALUMNAS
  console.log("Migrando alumnas...");
  const alumnasCSV = leerCSV('./data/Alumnas.csv');
  
  for (const fila of alumnasCSV) {
    if (!fila.Nombre) continue;
    
    // Formatear fecha (si viene como DD/MM/YYYY a YYYY-MM-DD)
    let fecha = new Date().toISOString().split('T')[0];
    if (fila['Fecha Inicio']) {
        const partes = fila['Fecha Inicio'].split('/');
        if(partes.length === 3) fecha = `${partes[2]}-${partes[1]}-${partes[0]}`;
        else fecha = fila['Fecha Inicio']; // Por si ya viene en formato correcto
    }

    await supabase.from('alumnas').insert([{
      nombre: fila.Nombre,
      dni: fila.DNI || null,
      direccion: fila['Dirección '] || null,
      telefono: fila.Teléfono || null,
      fecha_inicio: fecha,
      activa: true
    }]);
  }

  // 2. OBTENER IDS DE ALUMNAS CREADAS PARA VINCULAR PAGOS
  const { data: alumnasBD } = await supabase.from('alumnas').select('id, nombre');
  
  // 3. MIGRAR PAGOS MES A MES
  const meses = ['Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  
  for (const mes of meses) {
    if (fs.existsSync(`./data/${mes}.csv`)) {
      console.log(`Migrando pagos de ${mes}...`);
      const pagosCSV = leerCSV(`./data/${mes}.csv`);
      
      for (const fila of pagosCSV) {
        // Buscar el ID de la alumna por su nombre exacto
        const alumnaKey = fila.Alumna || fila.Alumnab || fila.D || fila.ff || fila['Columna 1']; // Por las inconsistencias de los encabezados en los CSV
        if (!alumnaKey) continue;

        const alumna = alumnasBD.find(a => a.nombre.trim() === alumnaKey.trim());
        if (!alumna) continue;

        // Convertir las danzas separadas por coma en un array
        const danzasArray = fila.Danzas ? fila.Danzas.split(',').map(d => d.trim()) : [];

        // Si hay monto o está pagado/no asistió, lo registramos
        if (fila.Condición) {
            let fechaPago = new Date().toISOString().split('T')[0];
            if (fila['Fecha de pago']) {
                const p = fila['Fecha de pago'].split('/');
                if(p.length === 3) fechaPago = `${p[2]}-${p[1]}-${p[0]}`;
                else fechaPago = fila['Fecha de pago'];
            }

            await supabase.from('pagos').insert([{
              alumna_id: alumna.id,
              monto: parseFloat(fila.Monto || 0),
              fecha_pago: fechaPago,
              medio_pago: fila['Medio de pago'] || 'Efectivo',
              condicion: fila.Condición,
              mes: mes,
              anio: 2025,
              danzas: danzasArray
            }]);
        }
      }
    }
  }

  console.log("¡Migración completada con éxito!");
}

migrar();
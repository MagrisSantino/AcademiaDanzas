// src/lib/teatro.ts
//
// Distribucion de butacas del teatro, copiada del plano
// "PULLMAN NUMERADO nuevo 29 nov.pdf".
//
// El escenario va ABAJO. Las filas se dibujan de arriba hacia abajo:
// F-7 (la mas alta, contra la pared del fondo) ... F-1, y despues los
// palcos VIP en diagonal (F-B y F-A) que flanquean el hueco central.
//
// Cada fila tiene 3 bloques separados por pasillos:
//   izquierda = pares de mayor a menor  (34 -> 16)
//   centro    = pares 14 -> 2 y despues impares 1 -> 15
//   derecha   = impares 17 -> 35
//
// SLOTS_* es el ancho en butacas que ocupa cada bloque en el dibujo.
// Sirve para que F-7, que tiene menos butacas, quede alineada con el
// resto tal como en el plano (las escaleras le comen el lugar de al
// lado del bloque del centro).

export type SectorTeatro = "pullman" | "vip";

export type BloqueTeatro = {
  butacas: number[];
  /** Ancho del hueco donde vive el bloque, medido en butacas. */
  slots: number;
  /** Hacia que lado se pega el bloque si sobra lugar. */
  align: "start" | "center" | "end";
};

export type FilaTeatro = {
  fila: string;
  sector: SectorTeatro;
  bloques: BloqueTeatro[];
};

export const SLOTS_IZQ = 10;
export const SLOTS_CENTRO = 15;
export const SLOTS_DER = 10;

/** Las seis filas completas del pullman: 35 butacas cada una. */
const filaCompleta = (fila: string): FilaTeatro => ({
  fila,
  sector: "pullman",
  bloques: [
    { butacas: [34, 32, 30, 28, 26, 24, 22, 20, 18, 16], slots: SLOTS_IZQ, align: "end" },
    { butacas: [14, 12, 10, 8, 6, 4, 2, 1, 3, 5, 7, 9, 11, 13, 15], slots: SLOTS_CENTRO, align: "center" },
    { butacas: [17, 19, 21, 23, 25, 27, 29, 31, 33, 35], slots: SLOTS_DER, align: "start" },
  ],
});

/**
 * Fila del fondo. Es mas corta porque las dos escaleras de acceso la
 * parten: no existen las butacas 6 ni 7.
 */
const FILA_7: FilaTeatro = {
  fila: "F-7",
  sector: "pullman",
  bloques: [
    { butacas: [22, 20, 18, 16, 14, 12, 10, 8], slots: SLOTS_IZQ, align: "start" },
    { butacas: [4, 2, 1, 3, 5], slots: SLOTS_CENTRO, align: "center" },
    { butacas: [9, 11, 13, 15, 17, 19, 21, 23], slots: SLOTS_DER, align: "end" },
  ],
};

/** De arriba (fondo) hacia abajo (escenario). */
export const FILAS_PULLMAN: FilaTeatro[] = [
  FILA_7,
  filaCompleta("F-6"),
  filaCompleta("F-5"),
  filaCompleta("F-4"),
  filaCompleta("F-3"),
  filaCompleta("F-2"),
  filaCompleta("F-1"),
];

/**
 * Palcos VIP en diagonal, en las dos esquinas de adelante.
 * Cada palco es una sola fila partida en dos: los pares quedan del
 * lado izquierdo y los impares del derecho, con el hueco del pullman
 * en el medio. F-A es el que esta mas cerca del escenario.
 */
export const PALCOS_VIP: FilaTeatro[] = [
  {
    fila: "F-B",
    sector: "vip",
    bloques: [
      { butacas: [8, 6, 4, 2], slots: 4, align: "end" },
      { butacas: [1, 3, 5, 7], slots: 4, align: "start" },
    ],
  },
  {
    fila: "F-A",
    sector: "vip",
    bloques: [
      { butacas: [10, 8, 6, 4, 2], slots: 5, align: "end" },
      { butacas: [1, 3, 5, 7, 9], slots: 5, align: "start" },
    ],
  },
];

export const TODAS_LAS_FILAS: FilaTeatro[] = [...FILAS_PULLMAN, ...PALCOS_VIP];

/**
 * Medidas del dibujo para un tamaño de butaca dado. Vive acá para que
 * el mapa y el auto-zoom de la pantalla usen exactamente el mismo cálculo.
 */
export const metricasMapa = (tam: number) => {
  const gap = Math.max(2, Math.round(tam * 0.14));
  const pasillo = Math.max(14, Math.round(tam * 1.1));
  const anchoEtiqueta = Math.max(30, Math.round(tam * 1.7));
  const anchoBloque = (slots: number) => slots * (tam + gap) - gap;
  const anchoFila =
    anchoBloque(SLOTS_IZQ) + pasillo + anchoBloque(SLOTS_CENTRO) + pasillo + anchoBloque(SLOTS_DER);
  return {
    gap,
    pasillo,
    anchoEtiqueta,
    anchoBloque,
    fuente: Math.max(7, Math.round(tam * 0.42)),
    anchoTotal: anchoEtiqueta * 2 + anchoFila + gap * 2,
  };
};

export const TAM_MIN = 12;
export const TAM_MAX = 34;

/** Cuantas butacas tiene el teatro en total (hoy: 249). */
export const TOTAL_BUTACAS = TODAS_LAS_FILAS.reduce(
  (total, f) => total + f.bloques.reduce((sub, b) => sub + b.butacas.length, 0),
  0
);

const SECTOR_POR_FILA: Record<string, SectorTeatro> = Object.fromEntries(
  TODAS_LAS_FILAS.map((f) => [f.fila, f.sector])
);

export const sectorDeFila = (fila: string): SectorTeatro => SECTOR_POR_FILA[fila] ?? "pullman";

/** Clave unica de una butaca dentro de un festival. */
export const claveButaca = (fila: string, butaca: number | string) => `${fila}|${butaca}`;

/** Orden de lectura del mapa, para ordenar listados de butacas. */
const ORDEN_FILAS: Record<string, number> = Object.fromEntries(
  TODAS_LAS_FILAS.map((f, i) => [f.fila, i])
);

export const compararButacas = (
  a: { fila: string; butaca: number },
  b: { fila: string; butaca: number }
) => {
  const da = (ORDEN_FILAS[a.fila] ?? 99) - (ORDEN_FILAS[b.fila] ?? 99);
  return da !== 0 ? da : a.butaca - b.butaca;
};

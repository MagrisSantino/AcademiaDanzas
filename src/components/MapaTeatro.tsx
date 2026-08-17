"use client";
import { FILAS_PULLMAN, PALCOS_VIP, claveButaca, metricasMapa, type BloqueTeatro, type FilaTeatro } from "@/lib/teatro";

type Props = {
  /** clave "F-1|5" -> registro de la entrada que ocupa la butaca */
  ocupadas: Map<string, any>;
  /** claves de las butacas que el usuario esta seleccionando ahora */
  seleccionadas: Set<string>;
  onButaca: (fila: string, butaca: number) => void;
  /** texto del tooltip para las butacas ocupadas */
  tituloOcupada?: (entrada: any) => string;
  /** tamaño de cada butaca en px */
  tam: number;
};

export default function MapaTeatro({ ocupadas, seleccionadas, onButaca, tituloOcupada, tam }: Props) {
  const { gap, pasillo, anchoEtiqueta, fuente, anchoBloque, anchoTotal } = metricasMapa(tam);

  const Butaca = ({ fila, n }: { fila: string; n: number }) => {
    const clave = claveButaca(fila, n);
    const ocupada = ocupadas.get(clave);
    const elegida = seleccionadas.has(clave);

    // Vendida y bloqueada se ven EXACTAMENTE igual: para el que compra,
    // una butaca bloqueada es una butaca que ya no esta disponible.
    const estilo = ocupada
      ? "bg-gray-700 border-gray-800 text-gray-200 hover:border-gray-900"
      : elegida
        ? "bg-green-500 border-green-700 text-white shadow-md"
        : "bg-white border-gray-300 text-gray-600 hover:border-brand-fuchsia hover:bg-brand-pink/50";

    return (
      <button
        type="button"
        onClick={() => onButaca(fila, n)}
        title={ocupada ? (tituloOcupada?.(ocupada) ?? `${fila} · ${n} · Ocupada`) : `${fila} · Butaca ${n} · Libre`}
        aria-label={`Fila ${fila} butaca ${n}`}
        className={`shrink-0 rounded-t-lg rounded-b-[3px] border-2 font-bold leading-none flex items-center justify-center transition-colors ${estilo}`}
        style={{ width: tam, height: tam, fontSize: fuente }}
      >
        {n}
      </button>
    );
  };

  const Bloque = ({ fila, bloque }: { fila: string; bloque: BloqueTeatro }) => (
    <div
      className="flex"
      style={{
        width: anchoBloque(bloque.slots),
        gap,
        justifyContent: bloque.align === "start" ? "flex-start" : bloque.align === "end" ? "flex-end" : "center",
      }}
    >
      {bloque.butacas.map(n => <Butaca key={n} fila={fila} n={n} />)}
    </div>
  );

  const Etiqueta = ({ texto }: { texto: string }) => (
    <div
      className="shrink-0 text-center font-black text-gray-400"
      style={{ width: anchoEtiqueta, fontSize: Math.max(9, Math.round(tam * 0.45)) }}
    >
      {texto}
    </div>
  );

  const FilaPullman = ({ f }: { f: FilaTeatro }) => (
    <div className="flex items-center" style={{ gap }}>
      <Etiqueta texto={f.fila} />
      <div className="flex items-center" style={{ gap: pasillo }}>
        {f.bloques.map((b, i) => <Bloque key={i} fila={f.fila} bloque={b} />)}
      </div>
      <Etiqueta texto={f.fila} />
    </div>
  );

  /** Palcos VIP: van en diagonal en las dos esquinas de adelante. */
  const FilaPalco = ({ f }: { f: FilaTeatro }) => {
    const [izq, der] = f.bloques;
    return (
      <div className="flex items-center justify-between" style={{ width: anchoTotal }}>
        <div className="flex items-center origin-bottom-right" style={{ gap, transform: "rotate(-9deg)" }}>
          <Etiqueta texto={f.fila} />
          <Bloque fila={f.fila} bloque={izq} />
        </div>
        <div className="flex items-center origin-bottom-left" style={{ gap, transform: "rotate(9deg)" }}>
          <Bloque fila={f.fila} bloque={der} />
          <Etiqueta texto={f.fila} />
        </div>
      </div>
    );
  };

  return (
    <div className="inline-flex flex-col items-center" style={{ width: anchoTotal, gap: Math.round(tam * 0.42) }}>
      {/* Fondo de sala */}
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300">Fondo · Escaleras</p>

      {FILAS_PULLMAN.map(f => <FilaPullman key={f.fila} f={f} />)}

      {/* Palcos VIP en las esquinas, con el hueco del pullman en el medio */}
      <div className="flex flex-col w-full" style={{ gap: Math.round(tam * 0.5), marginTop: Math.round(tam * 0.5) }}>
        {PALCOS_VIP.map(f => <FilaPalco key={f.fila} f={f} />)}
      </div>

      {/* Escenario */}
      <div
        className="w-full mt-4 rounded-t-[40px] bg-gradient-to-b from-gray-800 to-gray-900 text-white font-black tracking-[0.35em] uppercase text-center py-3 shadow-inner"
        style={{ fontSize: Math.max(10, Math.round(tam * 0.5)) }}
      >
        Escenario
      </div>
    </div>
  );
}

import React, { useState } from "react";

const format = (v) => Number(v).toFixed(3);

const MixedStrategies = ({ gameData, onBack }) => {
  const [hover, setHover] = useState(false);

  if (!gameData || !gameData.matrix) {
    return (
      <div style={container}>
        <h2 style={title}>Estrategias mixtas</h2>
        <p style={text}>No hay datos disponibles.</p>
        <button onClick={onBack} style={button}>Volver</button>
      </div>
    );
  }

  const { matrix, rowNames, colNames } = gameData;

  if (matrix.length !== 2 || matrix[0].length !== 2) {
    return (
      <div style={container}>
        <h2 style={title}>Estrategias mixtas</h2>
        <p style={text}>Este método solo aplica para matrices 2x2.</p>
        <button onClick={onBack} style={button}>Volver</button>
      </div>
    );
  }

  const a = Number(matrix[0][0]);
  const b = Number(matrix[0][1]);
  const c = Number(matrix[1][0]);
  const d = Number(matrix[1][1]);

  const denominator = a - b - c + d;

  if (denominator === 0) {
    return (
      <div style={container}>
        <h2 style={title}>Estrategias mixtas</h2>
        <p style={text}>
          No se puede calcular porque el sistema es degenerado (denominador = 0).
          Esto significa que no hay un equilibrio mixto único.
        </p>
        <button onClick={onBack} style={button}>Volver</button>
      </div>
    );
  }

  const p = (d - c) / denominator;
  const q = (d - b) / denominator;
  const value = (a * d - b * c) / denominator;

  const analysisText = `
Equilibrio de Nash:

${rowNames?.[0] || "Fila 1"}: ${(p * 100).toFixed(1)}%
${rowNames?.[1] || "Fila 2"}: ${((1 - p) * 100).toFixed(1)}%

${colNames?.[0] || "Columna 1"}: ${(q * 100).toFixed(1)}%
${colNames?.[1] || "Columna 2"}: ${((1 - q) * 100).toFixed(1)}%

Valor del juego: ${value.toFixed(2)}
`;

  const interpretValue =
    value === 0
      ? "Juego equilibrado: ninguno de los jugadores tiene ventaja."
      : value > 0
      ? "El juego favorece al jugador de filas."
      : "El juego favorece al jugador de columnas.";

  return (
    <div style={container}>
      <h2 style={title}>Método de Estrategias Mixtas</h2>

      {/* MATRIZ PRO */}
      <div style={matrixCard}>
        <h3 style={matrixTitle}>Matriz del juego</h3>

        <div style={matrixGrid}>
          <div></div>
          <div style={matrixHeader}>{colNames?.[0]}</div>
          <div style={matrixHeader}>{colNames?.[1]}</div>

          <div style={matrixHeader}>{rowNames?.[0]}</div>
          <div style={cell}>{a}</div>
          <div style={cell}>{b}</div>

          <div style={matrixHeader}>{rowNames?.[1]}</div>
          <div style={cell}>{c}</div>
          <div style={cell}>{d}</div>
        </div>
      </div>

      {/* EXPLICACIÓN */}
      <div style={box}>
        <h3>Interpretación del juego</h3>
        <p style={text}>
          El equilibrio de Nash ocurre cuando ambos jugadores dejan de ser predecibles
          y mezclan sus estrategias para evitar ser explotados.
        </p>

        <p style={text}>
          {interpretValue}
        </p>
      </div>

      {/* PASOS */}
      <div style={box}>
        <h3>Paso 2: Igualación de ganancias</h3>
        <p style={equation}>{a}q + {b}(1-q) = {c}q + {d}(1-q)</p>
        <p style={equation}>{a}p + {c}(1-p) = {b}p + {d}(1-p)</p>
      </div>

      <div style={box}>
        <h3>Paso 3: Probabilidades</h3>
        <p style={equation}>p = {format(p)}</p>
        <p style={equation}>q = {format(q)}</p>
      </div>

      <div style={box}>
        <h3>Paso 4: Estrategias óptimas</h3>
        <p><b>{rowNames?.[0]}</b>: {format(p)}</p>
        <p><b>{rowNames?.[1]}</b>: {format(1 - p)}</p>
        <p><b>{colNames?.[0]}</b>: {format(q)}</p>
        <p><b>{colNames?.[1]}</b>: {format(1 - q)}</p>
      </div>

      <div style={box}>
        <h3>Paso 5: Valor del juego</h3>
        <p style={valueBox}>V = {format(value)}</p>
        <p style={text}>{interpretValue}</p>
      </div>

      {/* GRÁFICA */}
      <div style={box}>
        <h3>Paso 6: Representación gráfica</h3>
        <MixedChart
          a={a} b={b} c={c} d={d}
          q={q}
          value={value}
          rowNames={rowNames}
          colNames={colNames}
          p={p}
          hover={hover}
          setHover={setHover}
          analysisText={analysisText}
        />
      </div>

      <button onClick={onBack} style={button}>Volver</button>
    </div>
  );
};

export default MixedStrategies;

/* ========================= */
/*        GRAFICA            */
/* ========================= */

const MixedChart = ({
  a, b, c, d, q, value,
  rowNames, colNames,
  p,
  hover,
  setHover,
  analysisText
}) => {

  const width = 700;
  const height = 350;

  const margin = { top: 20, right: 20, bottom: 40, left: 50 };

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const toX = (x) => margin.left + x * innerWidth;

  const yValues = [a, b, c, d];
  const yMin = Math.min(...yValues) - 1;
  const yMax = Math.max(...yValues) + 1;

  const toY = (y) =>
    margin.top + ((yMax - y) / (yMax - yMin)) * innerHeight;

  const yRow1 = (x) => a * x + b * (1 - x);
  const yRow2 = (x) => c * x + d * (1 - x);

  const color = Math.abs(0.5 - p) < 0.1 ? "#16a34a" : "#f59e0b";

  return (
    <div style={{ position: "relative" }}>

      {hover && (
        <div style={tooltip}>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
            {analysisText}
          </pre>
        </div>
      )}

      <svg viewBox={`0 0 ${width} ${height}`} style={svgStyle}>

        <line x1={margin.left} y1={margin.top} x2={margin.left} y2={height - margin.bottom} stroke="#000" />
        <line x1={margin.left} y1={height - margin.bottom} x2={width - margin.right} y2={height - margin.bottom} stroke="#000" />

        <line x1={toX(0)} y1={toY(yRow1(0))} x2={toX(1)} y2={toY(yRow1(1))} stroke="#2563eb" strokeWidth="3" />
        <line x1={toX(0)} y1={toY(yRow2(0))} x2={toX(1)} y2={toY(yRow2(1))} stroke="#dc2626" strokeWidth="3" />

        <circle
          cx={toX(q)}
          cy={toY(value)}
          r="8"
          fill={color}
          stroke="#0f172a"
          strokeWidth="2"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          <animate attributeName="r" values="7;10;7" dur="1.5s" repeatCount="indefinite" />
        </circle>

        <text x={toX(q)} y={toY(value) - 14} textAnchor="middle" fontSize="12" fill="#16a34a">
          Equilibrio de Nash
        </text>

        <text x={toX(q)} y={height - 10} textAnchor="middle">
          q = {q.toFixed(2)}
        </text>

        <text x={toX(q) + 10} y={toY(value) - 10}>
          V = {value.toFixed(2)}
        </text>

      </svg>
    </div>
  );
};

/* ========================= */
/*         ESTILOS          */
/* ========================= */

const container = { padding: 24, background: "#f6f8fc", borderRadius: 12 };
const title = { fontSize: 26, fontWeight: 800 };
const text = { color: "#334155" };
const box = { background: "#fff", padding: 14, borderRadius: 10, marginTop: 10 };
const equation = { fontFamily: "monospace", color: "#1d4ed8" };
const valueBox = { fontSize: 18, fontWeight: 700 };
const button = { padding: 10, background: "#2563eb", color: "#fff", border: 0, borderRadius: 8 };

const matrixCard = {
  background: "#fff",
  padding: 16,
  borderRadius: 12,
  border: "1px solid #e5e7eb"
};

const matrixTitle = { fontSize: 16, fontWeight: 700, marginBottom: 10 };

const matrixGrid = {
  display: "grid",
  gridTemplateColumns: "120px 1fr 1fr",
  gap: 6
};

const matrixHeader = {
  background: "#0f172a",
  color: "#fff",
  padding: 8,
  borderRadius: 6,
  textAlign: "center"
};

const cell = {
  background: "#f1f5f9",
  padding: 10,
  textAlign: "center",
  borderRadius: 6,
  fontWeight: 700
};

const svgStyle = {
  width: "100%",
  background: "#fff",
  borderRadius: 8
};

const tooltip = {
  position: "absolute",
  top: 10,
  right: 10,
  background: "#111827",
  color: "#fff",
  padding: 10,
  borderRadius: 8,
  fontSize: 12,
  width: 260,
  boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
};
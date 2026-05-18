import React from "react";
import {
  Chart as ChartJS,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from "chart.js";
import { Line } from "react-chartjs-2";
import { toFiniteNumber } from "../utils/validation";

ChartJS.register(LineElement, LinearScale, PointElement, Tooltip, Legend);

const Step6 = ({ data, next, prev }) => {
  const { alternatives, payoff } = data;

  const invalidPayoff = !Array.isArray(alternatives) || !Array.isArray(payoff) || alternatives.length === 0 || payoff.some((row) => !Array.isArray(row) || row.length < 2 || row.some((value) => !Number.isFinite(toFiniteNumber(value, NaN))));

  if (invalidPayoff) {
    return <div>⚠ Revisa la matriz de pagos. Se requieren dos valores numéricos finitos por alternativa.</div>;
  }

  const colors = ["#007BFF", "#28a745", "#dc3545", "#ffc107"];

  // Generar funciones lineales: VE = intercept + slope*p
  const linearFunctions = alternatives.map((alternative, i) => {
    const favorable = toFiniteNumber(payoff[i][0], 0);
    const unfavorable = toFiniteNumber(payoff[i][1], 0);

    return {
      name: alternative,
      slope: favorable - unfavorable,
      intercept: unfavorable
    };
  });

  // Eje X (probabilidad del estado favorable)
  const probabilityLabels = [];
  for (let p = 0; p <= 1; p += 0.02) {
    probabilityLabels.push(parseFloat(p.toFixed(4)));
  }

  // Líneas de valor esperado
  const datasets = linearFunctions.map((f, i) => ({
    label: f.name,
    data: probabilityLabels.map(p => ({
      x: p,
      y: f.intercept + f.slope * p
    })),
    borderColor: colors[i % colors.length],
    borderWidth: 2,
    pointRadius: 0,
    tension: 0.2
  }));

  // Calcular intersecciones (con control de errores)
  const intersectionPoints = [];

  for (let i = 0; i < linearFunctions.length; i++) {
    for (let j = i + 1; j < linearFunctions.length; j++) {
      const f1 = linearFunctions[i];
      const f2 = linearFunctions[j];

      const denom = f1.slope - f2.slope;

      // evitar división por cero
      if (Math.abs(denom) < 1e-9) continue;

      const p = (f2.intercept - f1.intercept) / denom;

      if (p >= 0 && p <= 1) {
        const y = f1.intercept + f1.slope * p;

        intersectionPoints.push({
          x: parseFloat(p.toFixed(4)),
          y: parseFloat(y.toFixed(4))
        });
      }
    }
  }

  const cutPointsDataset = {
    label: "Puntos de corte",
    data: intersectionPoints,
    backgroundColor: "#000",
    borderColor: "#000",
    pointRadius: 6,
    showLine: false,
    type: "scatter"
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context) {
            return `VE: ${context.parsed.y.toFixed(4)}`;
          },
          afterBody: function (context) {
            const p = context[0].parsed.x;

            const veValues = linearFunctions.map(
              f => f.intercept + f.slope * p
            );

            const maxVE = Math.max(...veValues);
            const bestIndex = veValues.findIndex(
              v => Math.abs(v - maxVE) < 1e-6
            );

            return `Mejor: ${linearFunctions[bestIndex].name}`;
          }
        }
      }
    },
    scales: {
      x: {
        type: "linear",
        position: "bottom",
        title: {
          display: true,
          text: "p (Probabilidad del estado favorable)"
        }
      },
      y: {
        title: {
          display: true,
          text: "Valor esperado (VE)"
        }
      }
    }
  };

  return (
    <div style={container}>
      <h1>Gráfica de valor esperado</h1>

      <div style={card}>
        <h2>Gráfico interactivo</h2>
        <Line
          data={{ datasets: [...datasets, cutPointsDataset] }}
          options={chartOptions}
        />
      </div>

      <div style={card}>
        <h2>Interpretación de la gráfica</h2>

        <div style={interpretationBox}>
          <h3>Líneas lineales</h3>
          <p>
            Cada línea representa el valor esperado de una alternativa como función de <strong>p</strong>.
            Una pendiente positiva indica que la alternativa mejora cuando aumenta la probabilidad del estado favorable.
          </p>
        </div>

        <div style={interpretationBox}>
          <h3>Puntos de corte</h3>
          <p>
            Los puntos negros indican dónde dos alternativas tienen el mismo valor esperado.
            Estos son los umbrales donde cambia la mejor decisión.
          </p>
        </div>

        <div style={interpretationBox}>
          <h3>Región óptima</h3>
          <p>
            Para cada valor de p, la mejor alternativa es la que tiene la línea más alta.
            Puedes pasar el cursor sobre el gráfico para identificarla.
          </p>
        </div>

        <div
          style={{
            ...interpretationBox,
            background: "#f0f7ff",
            padding: "15px",
            borderRadius: "8px"
          }}
        >
          <h3>Consejo de decisión</h3>
          <p>
            Si tienes una estimación de <strong>p</strong>, elige la alternativa cuya línea esté más arriba en ese punto.
          </p>
        </div>
      </div>

      <div style={buttons}>
        <button onClick={prev} style={btnSecondary}>← Volver</button>
        <button onClick={next} style={btnPrimary}>Continuar →</button>
      </div>
    </div>
  );
};

export default Step6;

// ESTILOS

const container = {
  display: "flex",
  flexDirection: "column",
  gap: "20px"
};

const card = {
  background: "#fff",
  padding: "25px",
  borderRadius: "12px",
  boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
};

const interpretationBox = {
  marginBottom: "15px",
  paddingBottom: "15px",
  borderBottom: "1px solid #eee"
};

const buttons = {
  display: "flex",
  justifyContent: "space-between",
  gap: "10px"
};

const btnPrimary = {
  padding: "10px 20px",
  background: "#007BFF",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600"
};

const btnSecondary = {
  padding: "10px 20px",
  background: "#ccc",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px"
};
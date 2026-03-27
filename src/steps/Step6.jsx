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

ChartJS.register(LineElement, LinearScale, PointElement, Tooltip, Legend);

const Step6 = ({ data, next, prev }) => {
  const { alternatives, payoff } = data;

  const colors = ["#007BFF", "#28a745", "#dc3545", "#ffc107"];

  //  Generar funciones lineales: VE = intercept + slope*p
  const linearFunctions = alternatives.map((alternative, i) => {
    const payoffFavorableState = payoff[i][0];
    const payoffUnfavorableState = payoff[i][1];

    return {
      name: alternative,
      slope: payoffFavorableState - payoffUnfavorableState,
      intercept: payoffUnfavorableState
    };
  });

  //  Eje X (probabilidad del estado favorable)
  const probabilityLabels = [];
  for (let p = 0; p <= 1; p += 0.02) {
    probabilityLabels.push(parseFloat(p.toFixed(2)));
  }

  //  Datasets (LÍNEAS de valor esperado)
  const datasets = linearFunctions.map((f, i) => ({
    label: f.name,
    data: probabilityLabels.map(p => ({
      x: p,
      y: f.intercept + f.slope * p
    })),
    borderColor: colors[i],
    borderWidth: 2,
    pointRadius: 0,
    tension: 0.2
  }));

  //  Calcular intersecciones
  const intersectionPoints = [];

  for (let i = 0; i < linearFunctions.length; i++) {
    for (let j = i + 1; j < linearFunctions.length; j++) {
      const f1 = linearFunctions[i];
      const f2 = linearFunctions[j];

      const intersectionProbability = (f2.intercept - f1.intercept) / (f1.slope - f2.slope);

      if (intersectionProbability >= 0 && intersectionProbability <= 1) {
        const intersectionValue = f1.intercept + f1.slope * intersectionProbability;

        intersectionPoints.push({
          x: parseFloat(intersectionProbability.toFixed(3)),
          y: parseFloat(intersectionValue.toFixed(2))
        });
      }
    }
  }

  //  Dataset de puntos de corte
  const cutPointsDataset = {
    label: "Puntos de corte",
    data: intersectionPoints,
    backgroundColor: "#000",
    borderColor: "#000",
    pointRadius: 6,
    showLine: false,
    type: "scatter"
  };

  // Opciones del gráfico
  const chartOptions = {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            return `VE: ${context.parsed.y.toFixed(2)}`;
          },
          afterBody: function(context) {
            const probabilityValue = context[0].parsed.x;

            const veValues = linearFunctions.map(f => f.intercept + f.slope * probabilityValue);
            const maxVE = Math.max(...veValues);
            const bestAlternativeIndex = veValues.indexOf(maxVE);

            return `Mejor: ${linearFunctions[bestAlternativeIndex].name}`;
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
          text: "p (Probabilidad del Estado Favorable)"
        }
      },
      y: {
        title: {
          display: true,
          text: "Valor Esperado (VE)"
        }
      }
    }
  };

  return (
    <div style={container}>
      <h1>Gráfica de Valor Esperado</h1>

      {/* Gráfico interactivo con Chart.js */}
      <div style={card}>
        <h2>Gráfico Interactivo</h2>
        <Line data={{ datasets: [...datasets, cutPointsDataset] }} options={chartOptions} />
      </div>

      {/*  Interpretación */}
      <div style={card}>
        <h2>Interpretación de la Gráfica</h2>

        <div style={interpretationBox}>
          <h3>Líneas Lineales</h3>
          <p>
            Cada línea representa el valor esperado de una alternativa como función de <strong>p</strong>.
            La pendiente positiva significa que la alternativa mejora con mayor probabilidad del estado favorable.
          </p>
        </div>

        <div style={interpretationBox}>
          <h3>Puntos de Corte (Intersecciones)</h3>
          <p>
            Los puntos negros indican dónde dos alternativas tienen el mismo valor esperado.
            Esto marca los "umbrales de decisión" donde cambia cuál es la mejor alternativa.
          </p>
        </div>

        <div style={interpretationBox}>
          <h3>Región Óptima</h3>
          <p>
            Para cada valor de p, la alternativa óptima es la que tiene la línea más alta.
            Hover sobre el gráfico para ver cuál es la mejor alternativa en cada punto.
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
          <h3>Consejo de Decisión</h3>
          <p>
            Si tienes confianza en tu estimación de <strong>p</strong>, elige la alternativa
            cuya línea esté más arriba en ese valor de p.
          </p>
        </div>
      </div>

      {/* BOTONES */}
      <div style={buttons}>
        <button onClick={prev} style={btnSecondary}>← Volver</button>
        <button onClick={next} style={btnPrimary}>Continuar →</button>
      </div>
    </div>
  );
};

export default Step6;

//////////////////////////////////////////////////

//  ESTILOS

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
  borderRadius: "6px",  cursor: "pointer",
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
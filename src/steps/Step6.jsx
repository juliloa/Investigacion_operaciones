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

  // 🧠 funciones lineales
  const functions = alternatives.map((alt, i) => {
    const a = payoff[i][0];
    const b = payoff[i][1];

    return {
      name: alt,
      m: a - b,
      b
    };
  });

  // 📊 eje X (probabilidad)
  const labels = [];
  for (let p = 0; p <= 1; p += 0.02) {
    labels.push(parseFloat(p.toFixed(2)));
  }

  // 📈 datasets (LÍNEAS)
  const datasets = functions.map((f, i) => ({
    label: f.name,
    data: labels.map(p => ({
      x: p,
      y: f.b + f.m * p
    })),
    borderColor: colors[i],
    borderWidth: 2,
    pointRadius: 0, // 👈 ocultamos puntos de línea
    tension: 0.2
  }));

  // 🧠 INTERSECCIONES
  const intersections = [];

  for (let i = 0; i < functions.length; i++) {
    for (let j = i + 1; j < functions.length; j++) {
      const f1 = functions[i];
      const f2 = functions[j];

      const p = (f2.b - f1.b) / (f1.m - f2.m);

      if (p >= 0 && p <= 1) {
        const y = f1.b + f1.m * p;

        intersections.push({
          x: parseFloat(p.toFixed(3)),
          y: parseFloat(y.toFixed(2))
        });
      }
    }
  }

  // 🔵 PUNTOS DE CORTE
  const pointsDataset = {
    label: "Puntos de corte",
    data: intersections,
    backgroundColor: "#000",
    borderColor: "#000",
    pointRadius: 6,
    showLine: false,
    type: "scatter"
  };

  // ⚙️ OPCIONES
  const options = {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            return `VE: ${context.parsed.y.toFixed(2)}`;
          },
          afterBody: function(context) {
            const p = context[0].parsed.x;

            const values = functions.map(f => f.b + f.m * p);
            const max = Math.max(...values);
            const bestIndex = values.indexOf(max);

            return `Mejor: ${functions[bestIndex].name}`;
          }
        }
      }
    },
    scales: {
      x: {
        type: "linear",
        min: 0,
        max: 1,
        title: {
          display: true,
          text: "Probabilidad (p)"
        }
      },
      y: {
        title: {
          display: true,
          text: "Valor Esperado"
        }
      }
    }
  };

  return (
    <div style={container}>
      <h1>Gráfica de Sensibilidad (Pro)</h1>

      <div style={card}>
        <Line
          data={{
            datasets: [...datasets, pointsDataset]
          }}
          options={options}
        />
      </div>

      {/* 📍 PUNTOS DE CORTE */}
      <div style={card}>
        <h2>Puntos de corte</h2>

        {intersections.length > 0 ? (
          intersections.map((pt, i) => (
            <p key={i}>
              p = <strong>{pt.x}</strong> → VE = <strong>{pt.y}</strong>
            </p>
          ))
        ) : (
          <p>No hay intersecciones en el rango.</p>
        )}
      </div>

      {/* 🧠 EXPLICACIÓN */}
      <div style={card}>
        <h2>Interpretación</h2>

        <p>
          Cada línea representa una alternativa con su valor esperado.
        </p>

        <p>
          Los puntos de corte indican dónde una alternativa deja de ser mejor y otra la supera.
        </p>

        <p>
          La alternativa óptima es la que tiene el mayor valor en cada región del eje.
        </p>
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

// 🎨 ESTILOS

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

const buttons = {
  display: "flex",
  justifyContent: "space-between"
};

const btnPrimary = {
  padding: "10px 20px",
  background: "#007BFF",
  color: "#fff",
  border: "none",
  borderRadius: "6px"
};

const btnSecondary = {
  padding: "10px 20px",
  background: "#ccc",
  border: "none",
  borderRadius: "6px"
};
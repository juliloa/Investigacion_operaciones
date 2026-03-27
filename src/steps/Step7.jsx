import React from "react";

const Step7 = ({ data, next, prev }) => {

  // 🔴 Valores del problema (puedes hacerlos dinámicos luego)
  const P_alta = data.probabilities[0]; // ej: 0.7
  const P_baja = data.probabilities[1]; // ej: 0.3

  const P_fav_alta = 0.9;
  const P_fav_baja = 0.25;

  // 🧠 Cálculos
  const VP = P_alta * P_fav_alta;
  const FN = P_alta * (1 - P_fav_alta);

  const FP = P_baja * P_fav_baja;
  const VN = P_baja * (1 - P_fav_baja);

  // 📊 métricas
  const precision = VP / (VP + FP);
  const recall = VP / (VP + FN);

  return (
    <div style={container}>
      <h1>Matriz de Confusión</h1>

      {/* 📊 MATRIZ */}
      <div style={card}>
        <table style={table}>
          <thead>
            <tr>
              <th></th>
              <th>Predicho Favorable</th>
              <th>Predicho Desfavorable</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td><strong>Real Alta</strong></td>
              <td>{VP.toFixed(3)}</td>
              <td>{FN.toFixed(3)}</td>
            </tr>

            <tr>
              <td><strong>Real Baja</strong></td>
              <td>{FP.toFixed(3)}</td>
              <td>{VN.toFixed(3)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 📈 MÉTRICAS */}
      <div style={card}>
        <h2>Métricas</h2>

        <p><strong>Precisión:</strong> {precision.toFixed(3)}</p>
        <p><strong>Recall:</strong> {recall.toFixed(3)}</p>
      </div>

      {/* 🧠 EXPLICACIÓN */}
      <div style={card}>
        <h2>Interpretación</h2>

        <p>
          El estudio de mercado intenta predecir si la demanda será alta o baja.
        </p>

        <p>
          Un <strong>verdadero positivo</strong> ocurre cuando el estudio predice
          alta demanda y realmente ocurre.
        </p>

        <p>
          Un <strong>falso positivo</strong> es cuando el estudio predice alta
          demanda, pero en realidad es baja.
        </p>

        <p>
          La precisión indica qué tan confiables son las predicciones favorables.
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

export default Step7;

//////////////////////////////////////////////////

// 🎨 estilos

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

const table = {
  width: "100%",
  textAlign: "center",
  borderCollapse: "collapse"
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
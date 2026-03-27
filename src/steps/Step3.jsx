import React from "react";

const Step3 = ({ data, next, prev }) => {
  const { alternatives, payoff } = data;

  // 🧠 Generar funciones de valor esperado
  const sensitivityAnalysis = alternatives.map((alternative, i) => {
    const payoffFavorableState = payoff[i][0]; // estado favorable
    const payoffUnfavorableState = payoff[i][1]; // estado desfavorable

    // Forma expandida: VE = a*p + b*(1 - p)
    const expandedForm = `${payoffFavorableState}p + ${payoffUnfavorableState}(1 - p)`;

    // Forma simplificada: VE = b + (a - b)p
    const slope = payoffFavorableState - payoffUnfavorableState;
    const simplifiedForm = `${payoffUnfavorableState} + ${slope}p`;

    return {
      name: alternative,
      expandedForm,
      simplifiedForm,
      slope
    };
  });

  // 🧠 Encontrar la alternativa con mayor pendiente
  const bestSlope = Math.max(...sensitivityAnalysis.map(f => f.slope));

  return (
    <div style={container}>
      <h1>📈 Análisis de Sensibilidad</h1>

      <div style={card}>
        <p style={{ color: "#666", fontSize: "15px", marginBottom: "20px" }}>
          Sea <strong>p</strong> la probabilidad del estado favorable.
          Entonces <strong>(1 - p)</strong> es la probabilidad del estado desfavorable.
        </p>

        <p style={{ background: "#f5f5f5", padding: "12px", borderRadius: "6px", fontFamily: "monospace", fontSize: "14px" }}>
          Valor Esperado: VE(p) = b + (m)p, donde m es la pendiente
        </p>
      </div>

      {/* ANÁLISIS POR ALTERNATIVA */}
      <div style={card}>
        <h2>📊 Análisis por Alternativa</h2>

        {sensitivityAnalysis.map((analysis, i) => (
          <div key={i} style={block}>
            
            <h3 style={{ color: "#185fa5" }}>{analysis.name}</h3>

            <div style={functionBox}>
              <p style={functionLabel}>
                <strong>Función expandida:</strong>
              </p>
              <p style={functionFormula}>
                VE = {analysis.expandedForm}
              </p>
            </div>

            <div style={functionBox}>
              <p style={functionLabel}>
                <strong>Forma simplificada:</strong>
              </p>
              <p style={functionFormula}>
                VE = {analysis.simplifiedForm}
              </p>
            </div>

            <div style={functionBox}>
              <p style={functionLabel}>
                <strong>Pendiente (m):</strong> {analysis.slope}
              </p>
              <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
                Indica el cambio en VE por cada aumento unitario en p
              </p>
            </div>

            {analysis.slope === bestSlope && (
              <p style={{ background: "#d4edda", color: "#155724", padding: "10px", borderRadius: "6px", marginTop: "10px", fontWeight: "600" }}>
                ⭐ <strong>Mejor pendiente:</strong> Esta alternativa crece más rápido → mejor en escenarios más favorables
              </p>
            )}

            {analysis.slope !== bestSlope && (
              <p style={{ background: "#fff3cd", color: "#856404", padding: "10px", borderRadius: "6px", marginTop: "10px" }}>
                Menor crecimiento frente al aumento de p
              </p>
            )}

          </div>
        ))}
      </div>

      {/* 🧠 INTERPRETACIÓN */}
      <div style={card}>
        <h2>🧠 Interpretación del Análisis</h2>

        <div style={interpretationBlock}>
          <h3>Sensibilidad a la Probabilidad</h3>
          <p>
            La pendiente indica qué tan sensible es cada alternativa frente al cambio
            en la probabilidad del estado favorable.
          </p>
        </div>

        <div style={interpretationBlock}>
          <h3>Estrategia según Confianza</h3>
          <p>
            <strong>Pendiente positiva alta:</strong> Buena alternativa cuando crees que el estado favorable es probable.
          </p>
          <p>
            <strong>Pendiente baja o negativa:</strong> Buena alternativa cuando crees que el estado desfavorable es probable.
          </p>
        </div>

        <div style={interpretationBlock}>
          <h3>Punto de Indiferencia</h3>
          <p>
            En Análisis Gráfico (siguiente paso), veremos dónde se intersectan estas líneas,
            es decir, en qué valores de p cada alternativa es óptima.
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

export default Step3;

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

const block = {
  borderBottom: "1px solid #eee",
  paddingBottom: "15px",
  marginBottom: "15px"
};

const functionBox = {
  background: "#f9f9f9",
  padding: "12px",
  borderRadius: "6px",
  marginBottom: "10px",
  borderLeft: "3px solid #185fa5"
};

const functionLabel = {
  fontSize: "13px",
  color: "#666",
  margin: "0 0 6px 0"
};

const functionFormula = {
  fontSize: "14px",
  fontFamily: "monospace",
  background: "#fff",
  padding: "8px",
  borderRadius: "4px",
  margin: "0"
};

const interpretationBlock = {
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
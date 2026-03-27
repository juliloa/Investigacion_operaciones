import React from "react";

const Step5 = ({ data, next, prev }) => {
  const { alternatives, payoff } = data;

  // 🧠 Generar funciones lineales de Valor Esperado: VE = intercept + slope*p
  const linearFunctions = alternatives.map((alternative, i) => {
    const payoffFavorableState = payoff[i][0];
    const payoffUnfavorableState = payoff[i][1];

    return {
      name: alternative,
      payoffFavorableState,
      payoffUnfavorableState,
      slope: payoffFavorableState - payoffUnfavorableState // m
    };
  });

  // 🧠 Calcular puntos de corte (intersecciones)
  const intersectionPoints = [];

  for (let i = 0; i < linearFunctions.length; i++) {
    for (let j = i + 1; j < linearFunctions.length; j++) {
      const f1 = linearFunctions[i];
      const f2 = linearFunctions[j];

      // Resolver: payoff_u1 + slope1*p = payoff_u2 + slope2*p
      const intersectionProbability = (f2.payoffUnfavorableState - f1.payoffUnfavorableState) / (f1.slope - f2.slope);

      intersectionPoints.push({
        f1,
        f2,
        p: intersectionProbability
      });
    }
  }

  return (
    <div style={container}>
      <h1>📐 Análisis Gráfico - Puntos de Corte</h1>

      {/* 🧠 ECUACIONES */}
      <div style={card}>
        <h2>Funciones Lineales de Valor Esperado</h2>

        {linearFunctions.map((f, i) => (
          <div key={i} style={functionBlock}>
            <strong style={{ fontSize: "15px" }}>{f.name}</strong>
            <p style={formularStyle}>
              VE = {f.payoffUnfavorableState} + {f.slope}p
            </p>
            <p style={{ fontSize: "12px", color: "#666" }}>
              Intercept: {f.payoffUnfavorableState} | Pendiente: {f.slope}
            </p>
          </div>
        ))}
      </div>

      {/* 📐 PUNTOS DE CORTE */}
      <div style={card}>
        <h2>Puntos de Corte (Intersecciones)</h2>

        {intersectionPoints.length > 0 ? (
          intersectionPoints.map((intersection, i) => (
            <div key={i} style={intersectionBlock}>
              
              <h3>{intersection.f1.name} vs {intersection.f2.name}</h3>

              <p style={formulaBox}>
                {intersection.f1.payoffUnfavorableState} + {intersection.f1.slope}p = {intersection.f2.payoffUnfavorableState} + {intersection.f2.slope}p
              </p>

              <p style={formulaBox}>
                {intersection.f1.slope}p - {intersection.f2.slope}p = {intersection.f2.payoffUnfavorableState} - {intersection.f1.payoffUnfavorableState}
              </p>

              <p style={formulaBox}>
                p({intersection.f1.slope - intersection.f2.slope}) = {intersection.f2.payoffUnfavorableState - intersection.f1.payoffUnfavorableState}
              </p>

              <p style={{ ...formulaBox, background: "#d4edda", color: "#155724", fontWeight: "bold" }}>
                p = {intersection.p.toFixed(3)}
              </p>

            </div>
          ))
        ) : (
          <p style={{ color: "#c62828" }}>No hay intersecciones entre las alternativas</p>
        )}
      </div>

      {/* 🧠 INTERPRETACIÓN */}
      <div style={card}>
        <h2>🧠 Interpretación</h2>

        <div style={interpretationBox}>
          <h3>¿Qué son los Puntos de Corte?</h3>
          <p>
            Los puntos de corte indican los valores de <strong>p</strong> donde dos alternativas
            ofrecen el <strong>mismo valor esperado</strong>.
          </p>
        </div>

        <div style={interpretationBox}>
          <h3>¿Para qué sirven?</h3>
          <p>
            Estos puntos dividen el rango de probabilidades [0, 1] en regiones donde
            una alternativa es claramente mejor que las demás.
          </p>
        </div>

        <div style={interpretationBox}>
          <h3>📌 Próximo Paso</h3>
          <p>
            En el siguiente paso, visualizaremos gráficamente estas funciones lineales
            para identificar visualmente cuál es la mejor alternativa para cada nivel de confianza en el estado favorable.
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

export default Step5;

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

const functionBlock = {
  background: "#f9f9f9",
  padding: "12px",
  borderRadius: "6px",
  marginBottom: "12px",
  borderLeft: "3px solid #185fa5"
};

const formularStyle = {
  fontFamily: "monospace",
  fontSize: "14px",
  background: "#fff",
  padding: "8px",
  borderRadius: "4px",
  margin: "8px 0 0 0"
};

const intersectionBlock = {
  borderBottom: "1px solid #eee",
  paddingBottom: "15px",
  marginBottom: "15px"
};

const formulaBox = {
  fontFamily: "monospace",
  fontSize: "13px",
  background: "#f5f5f5",
  padding: "10px",
  borderRadius: "4px",
  margin: "8px 0"
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
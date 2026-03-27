import React from "react";

const Step3 = ({ data, next, prev }) => {
  const { alternatives, payoff } = data;

  // 🧠 Generar funciones
  const functions = alternatives.map((alt, i) => {
    const a = payoff[i][0]; // estado 1
    const b = payoff[i][1]; // estado 2

    // Forma expandida
    const expanded = `${a}p + ${b}(1 - p)`;

    // Forma simplificada: b + (a - b)p
    const simplifiedA = a - b;
    const simplified = `${b} + ${simplifiedA}p`;

    return {
      name: alt,
      expanded,
      simplified,
      slope: simplifiedA
    };
  });

  // 🧠 Encontrar mejor pendiente
  const bestSlope = Math.max(...functions.map(f => f.slope));

  return (
    <div style={container}>
      <h1>Análisis de Sensibilidad</h1>

      <div style={card}>
        <p>
          Sea <strong>p</strong> la probabilidad del estado favorable.
          Entonces (1 - p) es el estado desfavorable.
        </p>

        {functions.map((f, i) => (
          <div key={i} style={block}>
            
            <h3>{f.name}</h3>

            <p>
              <strong>Función:</strong> VE = {f.expanded}
            </p>

            <p>
              <strong>Simplificación:</strong> VE = {f.simplified}
            </p>

            <p>
              <strong>Pendiente:</strong> {f.slope}
            </p>

            <p style={{ color: f.slope === bestSlope ? "green" : "black" }}>
              {f.slope === bestSlope
                ? "Esta alternativa crece más rápido → mejor en escenarios favorables."
                : "Menor crecimiento frente al aumento de p."}
            </p>

          </div>
        ))}
      </div>

      {/* 🧠 ANÁLISIS GENERAL */}
      <div style={card}>
        <h2>Interpretación</h2>

        <p>
          La pendiente indica qué tan sensible es cada alternativa frente al cambio
          en la probabilidad del estado favorable.
        </p>

        <p>
          A mayor pendiente, mayor beneficio cuando el escenario favorable es más probable.
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
  paddingBottom: "10px",
  marginBottom: "10px"
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
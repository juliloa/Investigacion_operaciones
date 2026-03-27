import React from "react";

const Step2 = ({ data, next, prev }) => {
  const { alternatives, states, probabilities, payoff } = data;

  const ROOT_X = 50;
  const ROOT_Y = 200;

  const ALT_X = 220;
  const STATE_X = 420;

  return (
    <div style={container}>
      <h1>Árbol de Decisión</h1>

      <div style={card}>
        <svg viewBox="0 0 800 400" style={{ width: "100%" }}>

          {/* ───── 1. LÍNEAS (PRIMERO, PARA QUE QUEDEN DEBAJO) ───── */}
          {alternatives.map((alt, i) => {
            const y = 120 + i * 80;

            return (
              <g key={`lines-${i}`}>
                {/* raíz → alternativa */}
                <line
                  x1={ROOT_X}
                  y1={ROOT_Y}
                  x2={ALT_X}
                  y2={y}
                  stroke="#aaa"
                />

                {/* alternativa → estados */}
                {states.map((_, j) => {
                  const yState = y + (j - states.length / 2) * 30;

                  return (
                    <line
                      key={j}
                      x1={ALT_X}
                      y1={y}
                      x2={STATE_X}
                      y2={yState}
                      stroke="#ccc"
                      strokeWidth="1"
                    />
                  );
                })}
              </g>
            );
          })}

          {/* ───── 2. NODO RAÍZ ───── */}
          <circle cx={ROOT_X} cy={ROOT_Y} r="20" fill="#185fa5" />
          <text
            x={ROOT_X}
            y={ROOT_Y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#fff"
            fontSize="10"
            fontWeight="600"
          >
            A
          </text>

          {/* ───── 3. NODOS DE ALTERNATIVAS ───── */}
          {alternatives.map((alt, i) => {
            const y = 120 + i * 80;

            return (
              <g key={`alts-${i}`}>
                <circle cx={ALT_X} cy={y} r="14" fill="#0f6e56" />

                <text
                  x={ALT_X}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#fff"
                  fontSize="9"
                  fontWeight="600"
                >
                  {alt}
                </text>
              </g>
            );
          })}

          {/* ───── 4. ESTADOS + PAYOFF ───── */}
          {alternatives.map((alt, i) => {
            const y = 120 + i * 80;

            return states.map((state, j) => {
              const yState = y + (j - states.length / 2) * 30;

              return (
                <g key={`state-${i}-${j}`}>
                  {/* estado */}
                  <text
                    x={STATE_X}
                    y={yState - 6}
                    fontSize="10"
                    fill="#333"
                  >
                    {state}
                  </text>

                  {/* probabilidad */}
                  <text
                    x={STATE_X}
                    y={yState + 8}
                    fontSize="9"
                    fill="#888"
                  >
                    P = {probabilities[j]}
                  </text>

                  {/* payoff */}
                  <text
                    x={STATE_X + 80}
                    y={yState}
                    fontSize="10"
                    fill="#555"
                  >
                    {payoff[i][j]}
                  </text>
                </g>
              );
            });
          })}

        </svg>
      </div>

      {/* BOTONES */}
      <div style={buttons}>
        <button onClick={prev} style={btnSecondary}>← Volver</button>
        <button onClick={next} style={btnPrimary}>Continuar →</button>
      </div>
    </div>
  );
};

export default Step2;

//////////////////////////////////////////////////

//  ESTILOS

const container = {
  display: "flex",
  flexDirection: "column",
  gap: "20px"
};

const card = {
  background: "#fff",
  padding: "24px",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  overflowX: "auto"
};

const buttons = {
  display: "flex",
  justifyContent: "space-between"
};

const btnPrimary = {
  padding: "10px 20px",
  background: "#185fa5",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer"
};

const btnSecondary = {
  padding: "10px 20px",
  background: "#ccc",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer"
};
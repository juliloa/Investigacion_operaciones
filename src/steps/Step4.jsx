import React from "react";

const Step4 = ({ data, next, prev }) => {
  const { alternatives, states, probabilities, payoff } = data;

  // 🧠 Calcular valores esperados
  const results = alternatives.map((alt, i) => {
    const calc = states.map((_, j) => payoff[i][j] * probabilities[j]);
    const total = calc.reduce((a, b) => a + b, 0);

    return { name: alt, calc, total };
  });

  // 🏆 Mejor alternativa
  const best = Math.max(...results.map(r => r.total));

  return (
    <div style={container}>
      <h1>Árbol de Decisión con Valores</h1>

      <div style={card}>

        {/* ───── ÁRBOL (SVG LIMPIO) ───── */}
        <svg viewBox="0 0 900 400" style={{ width: "100%" }}>

          {alternatives.map((alt, i) => {
            const y = 120 + i * 90;

            return (
              <g key={i}>

                {/* Líneas desde raíz */}
                <line x1="80" y1="200" x2="220" y2={y} stroke="#aaa" />

                {/* Nodo alternativa */}
                <circle cx="220" cy={y} r="14" fill="#0f6e56" />
                <text
                  x="220"
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#fff"
                  fontSize="10"
                >
                  {alt}
                </text>

                {/* Estados */}
                {states.map((state, j) => {
                  const yState = y + (j - states.length / 2) * 30;

                  return (
                    <g key={j}>
                      <line
                        x1="220"
                        y1={y}
                        x2="400"
                        y2={yState}
                        stroke="#ccc"
                      />

                      <text x="400" y={yState - 5} fontSize="10">
                        {state}
                      </text>

                      <text x="400" y={yState + 10} fontSize="9">
                        P = {probabilities[j]}
                      </text>

                      <text x="550" y={yState} fontSize="10">
                        {payoff[i][j]} × {probabilities[j]} ={" "}
                        {results[i].calc[j].toFixed(2)}
                      </text>
                    </g>
                  );
                })}

                {/* RESULTADO */}
                <g>
                  <rect
                    x="650"
                    y={y - 20}
                    width="180"
                    height="45"
                    rx="6"
                    fill={results[i].total === best ? "#0f6e56" : "#f1f1f1"}
                    stroke="#ccc"
                  />

                  {/* VE */}
                  <text
                    x="740"
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="11"
                    fill={results[i].total === best ? "#fff" : "#333"}
                    fontWeight="600"
                  >
                    VE = {results[i].total.toFixed(2)}
                  </text>

                  {/* ⭐ Mejor (separado) */}
                  {results[i].total === best && (
                    <text
                      x="740"
                      y={y + 16}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#fff"
                      fontWeight="600"
                    >
                      ⭐ Mejor
                    </text>
                  )}
                </g>

              </g>
            );
          })}

          {/* Nodo raíz */}
          <circle cx="80" cy="200" r="18" fill="#185fa5" />
          <text
            x="80"
            y="200"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#fff"
            fontSize="10"
            fontWeight="600"
          >
            A
          </text>

        </svg>
      </div>

      {/* 🧠 PASO A PASO COMPLETO */}
      <div style={card}>
        <h2>🔢 Paso a paso del cálculo</h2>

        {alternatives.map((alt, i) => (
          <div key={i} style={{ marginBottom: "20px" }}>
            <h3>{alt}</h3>

            {states.map((state, j) => (
              <p key={j}>
                {state}: {payoff[i][j]} × {probabilities[j]} ={" "}
                <strong>{results[i].calc[j].toFixed(2)}</strong>
              </p>
            ))}

            <p>
              <strong>
                Total VE = {results[i].calc.map(x => x.toFixed(2)).join(" + ")} ={" "}
                {results[i].total.toFixed(2)}
              </strong>
            </p>
          </div>
        ))}
      </div>

      {/* 🧠 RESULTADO FINAL */}
      <div style={card}>
        <h2>📊 Resultados finales</h2>

        {results.map((r, i) => (
          <p key={i}>
            {r.name}: VE = <strong>{r.total.toFixed(2)}</strong>
          </p>
        ))}

        <h3>
          🏆 Mejor alternativa:{" "}
          {results.find(r => r.total === best)?.name} (
          {best.toFixed(2)})
        </h3>
      </div>

      {/* 🧠 INTERPRETACIÓN */}
      <div style={card}>
        <h2>Interpretación</h2>

        <p>
          El valor esperado representa el beneficio promedio considerando las probabilidades de cada estado.
        </p>

        <p>
          Se calcula multiplicando cada resultado por su probabilidad y sumando todos los valores.
        </p>

        <p>
          La mejor alternativa es la que tiene el mayor valor esperado.
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

export default Step4;

//////////////////////////////////////////////////

// 🎨 ESTILOS

const container = {
  display: "flex",
  flexDirection: "column",
  gap: "20px"
};

const card = {
  background: "#fff",
  padding: "24px",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
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
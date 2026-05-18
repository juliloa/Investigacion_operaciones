import React from "react";
import { isProbability, toFiniteNumber } from "../utils/validation";

const Step4 = ({ data, next, prev }) => {
  const { alternatives, states, probabilities, payoff } = data;

  if (
    !alternatives?.length ||
    !states?.length ||
    !probabilities?.length ||
    !payoff?.length
  ) {
    return <div>Datos incompletos</div>;
  }

  const invalidProbability = probabilities.some((value) => !isProbability(value));
  const invalidPayoff = payoff.some(
    (row) => !Array.isArray(row) || row.length !== states.length || row.some((value) => !Number.isFinite(toFiniteNumber(value, NaN)))
  );

  if (invalidProbability || invalidPayoff) {
    return <div>⚠ Revisa las probabilidades y la matriz de pagos. No se permiten valores vacíos, negativos o no numéricos.</div>;
  }

  // Validación importante
  const probSum = probabilities.reduce((a, b) => a + toFiniteNumber(b, 0), 0);
  const validProb = Math.abs(probSum - 1) < 1e-6;

  // Cálculo
  const results = alternatives.map((alt, i) => {
    const calc = states.map((_, j) => payoff[i][j] * probabilities[j]);
    const total = calc.reduce((a, b) => a + b, 0);

    return { name: alt, calc, total };
  });

  const best = Math.max(...results.map(r => r.total));

  return (
    <div style={container}>
      <h1>Árbol de Decisión con Valores</h1>

      {!validProb && (
        <div style={{ color: "red", fontSize: "13px" }}>
          ⚠ Las probabilidades no suman 1
        </div>
      )}

      <div style={card}>
        <svg viewBox="0 0 900 400" style={{ width: "100%" }}>

          {alternatives.map((alt, i) => {
            const y = 120 + i * 90;

            return (
              <g key={i}>

                <line x1="80" y1="200" x2="220" y2={y} stroke="#aaa" />

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

                {states.map((state, j) => {
                  // ✔️ centrado real
                  const offset = (j - (states.length - 1) / 2) * 30;
                  const yState = y + offset;

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
                        {results[i].calc[j].toFixed(4)}
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
                    fill={Math.abs(results[i].total - best) < 1e-6 ? "#0f6e56" : "#f1f1f1"}
                    stroke="#ccc"
                  />

                  <text
                    x="740"
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="11"
                    fill={Math.abs(results[i].total - best) < 1e-6 ? "#fff" : "#333"}
                    fontWeight="600"
                  >
                    VE = {results[i].total.toFixed(4)}
                  </text>

                  {Math.abs(results[i].total - best) < 1e-6 && (
                    <text
                      x="740"
                      y={y + 16}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#fff"
                      fontWeight="600"
                    >
                      Mejor
                    </text>
                  )}
                </g>

              </g>
            );
          })}

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

      <div style={card}>
        <h2>Paso a paso del cálculo</h2>

        {alternatives.map((alt, i) => (
          <div key={i} style={{ marginBottom: "20px" }}>
            <h3>{alt}</h3>

            {states.map((state, j) => (
              <p key={j}>
                {state}: {payoff[i][j]} × {probabilities[j]} ={" "}
                <strong>{results[i].calc[j].toFixed(4)}</strong>
              </p>
            ))}

            <p>
              <strong>
                Total VE = {results[i].calc.map(x => x.toFixed(4)).join(" + ")} ={" "}
                {results[i].total.toFixed(4)}
              </strong>
            </p>
          </div>
        ))}
      </div>

      <div style={card}>
        <h2>Resultados finales</h2>

        {results.map((r, i) => (
          <p key={i}>
            {r.name}: VE = <strong>{r.total.toFixed(4)}</strong>
          </p>
        ))}

        <h3>
          Mejor alternativa:{" "}
          {results.find(r => Math.abs(r.total - best) < 1e-6)?.name} (
          {best.toFixed(4)})
        </h3>
      </div>

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

      <div style={buttons}>
        <button onClick={prev} style={btnSecondary}>← Volver</button>
        <button onClick={next} style={btnPrimary}>Continuar →</button>
      </div>
    </div>
  );
};

// ESTILOS

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

export default Step4;
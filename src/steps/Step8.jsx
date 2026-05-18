import React from "react";
import { isProbability, toFiniteNumber } from "../utils/validation";

const Step8 = ({ data, next, prev }) => {
  const { alternatives, payoff, probabilities } = data || {};

  if (
    !data ||
    !Array.isArray(alternatives) ||
    !Array.isArray(payoff) ||
    !Array.isArray(probabilities) ||
    probabilities.length < 2
  ) {
    return <p>Datos incompletos</p>;
  }

  const invalidProbability = probabilities.slice(0, 2).some((value) => !isProbability(value));
  const invalidPayoff = payoff.some((row) => !Array.isArray(row) || row.length < 2 || row.some((value) => !Number.isFinite(toFiniteNumber(value, NaN))));
  const invalidStudy = !isProbability(data.studyConfig?.favorableDetectionRate ?? 0.9) || !isProbability(data.studyConfig?.unfavorableFalsePositiveRate ?? 0.25);

  if (invalidProbability || invalidPayoff || invalidStudy) {
    return <p>⚠ Revisa probabilidades, estudio de mercado y pagos. No se permiten valores negativos, mayores que 1 o no numéricos.</p>;
  }

  const safeDiv = (a, b) => (b === 0 ? 0 : a / b);

  const P_alta = toFiniteNumber(probabilities[0], 0);
  const P_baja = toFiniteNumber(probabilities[1], 0);

  const studyConfig = data.studyConfig || {
    favorableDetectionRate: 0.9,
    unfavorableFalsePositiveRate: 0.25
  };

  const P_fav_alta = studyConfig.favorableDetectionRate ?? 0.9;
  const P_fav_baja = studyConfig.unfavorableFalsePositiveRate ?? 0.25;

  const P_fav = P_alta * P_fav_alta + P_baja * P_fav_baja;
  const P_desf = 1 - P_fav;

  const P_alta_fav = safeDiv(P_alta * P_fav_alta, P_fav);
  const P_baja_fav = safeDiv(P_baja * P_fav_baja, P_fav);
  const P_alta_desf = safeDiv(P_alta * (1 - P_fav_alta), P_desf);
  const P_baja_desf = safeDiv(P_baja * (1 - P_fav_baja), P_desf);

  const EV_no = alternatives.map((_, i) =>
    (payoff[i]?.[0] ?? 0) * P_alta +
    (payoff[i]?.[1] ?? 0) * P_baja
  );

  const EV_fav = alternatives.map((_, i) =>
    (payoff[i]?.[0] ?? 0) * P_alta_fav +
    (payoff[i]?.[1] ?? 0) * P_baja_fav
  );

  const EV_desf = alternatives.map((_, i) =>
    (payoff[i]?.[0] ?? 0) * P_alta_desf +
    (payoff[i]?.[1] ?? 0) * P_baja_desf
  );

  const bestFavIdx = EV_fav.indexOf(Math.max(...EV_fav));
  const bestDesfIdx = EV_desf.indexOf(Math.max(...EV_desf));
  const bestNoIdx = EV_no.indexOf(Math.max(...EV_no));

  const altOffsets = [-52, 0, 52];

  const datasets = [
    { evs: EV_fav, probs: [P_alta_fav, P_baja_fav], baseY: 120 },
    { evs: EV_desf, probs: [P_alta_desf, P_baja_desf], baseY: 290 },
    { evs: EV_no, probs: [P_alta, P_baja], baseY: 458 }
  ];

  const bestIdxs = [bestFavIdx, bestDesfIdx, bestNoIdx];

  return (
    <div style={container}>
      <h1 style={title}>Árbol de decisión con estudio de mercado</h1>

      <div style={card}>
        <svg viewBox="0 0 900 560" style={{ width: "100%" }}>

          {/* Nodo raíz */}
          <rect x="30" y="240" width="90" height="44" rx="6" fill="#185fa5" />
          <text x="75" y="262" textAnchor="middle" fill="#fff">Decisión</text>

          {/* Primer nivel */}
          {[
            { y: 120, label: `F (${P_fav.toFixed(4)})` },
            { y: 290, label: `U (${P_desf.toFixed(4)})` },
            { y: 458, label: "Sin estudio" }
          ].map((node, i) => (
            <g key={i}>
              <line x1="120" y1="262" x2="190" y2={node.y} stroke="#888" />
              <circle cx="190" cy={node.y} r="20" fill="#666" />
              <text x="190" y={node.y} textAnchor="middle" fill="#fff" fontSize="10">
                {node.label}
              </text>
            </g>
          ))}

          {/* Alternativas */}
          {datasets.map((ds, di) => {
            return alternatives.map((alt, ai) => {
              const y = ds.baseY + altOffsets[ai];
              const isBest = ai === bestIdxs[di];

              return (
                <g key={`${di}-${ai}`}>
                  <line x1="210" y1={ds.baseY} x2="350" y2={y} stroke="#aaa" />
                  <circle cx="350" cy={y} r="12" fill="#185fa5" />
                  <text x="350" y={y} textAnchor="middle" fill="#fff" fontSize="9">
                    {alt}
                  </text>

                  <rect
                    x="520"
                    y={y - 12}
                    width="120"
                    height="24"
                    fill={isBest ? "#0f6e56" : "#eee"}
                  />

                  <text x="580" y={y} textAnchor="middle" fontSize="10">
                    EV = {ds.evs[ai].toFixed(4)}
                  </text>
                </g>
              );
            });
          })}

        </svg>
      </div>

      <div style={card}>
        <h2>Cálculo paso a paso</h2>

        <p>P(F) = {P_fav.toFixed(4)}</p>
        <p>P(U) = {P_desf.toFixed(4)}</p>

        <p>P(Alta | F) = {P_alta_fav.toFixed(4)}</p>
        <p>P(Baja | F) = {P_baja_fav.toFixed(4)}</p>

        <p>P(Alta | U) = {P_alta_desf.toFixed(4)}</p>
        <p>P(Baja | U) = {P_baja_desf.toFixed(4)}</p>
      </div>

      <div style={buttons}>
        <button onClick={prev} style={btnSecondary}>← Volver</button>
        <button onClick={next} style={btnPrimary}>Continuar →</button>
      </div>
    </div>
  );
};

export default Step8;


const container = { display: "flex", flexDirection: "column", gap: "20px" };

const title = { margin: "0 0 4px", fontSize: "20px", fontWeight: "700", color: "#1a1a2e" };

const card = {
  background: "#fff",
  padding: "24px",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  overflowX: "auto",
};

const buttons = { display: "flex", justifyContent: "space-between" };

const btnPrimary = {
  padding: "10px 24px",
  background: "#185fa5",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
};

const btnSecondary = {
  padding: "10px 24px",
  background: "#e0e0e0",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
};

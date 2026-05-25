import React, { useState } from "react";
import { isProbability, toFiniteNumber, formatNumber } from "../utils/validation";

const Step8 = ({ data, next, prev }) => {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [pinnedNode, setPinnedNode] = useState(null);
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
    { label: "Favorable", evs: EV_fav, probs: [P_alta_fav, P_baja_fav], baseY: 120, p: P_fav },
    { label: "Desfavorable", evs: EV_desf, probs: [P_alta_desf, P_baja_desf], baseY: 290, p: P_desf },
    { label: "Sin estudio", evs: EV_no, probs: [P_alta, P_baja], baseY: 458, p: null }
  ];

  const bestIdxs = [bestFavIdx, bestDesfIdx, bestNoIdx];

  const activeNode = pinnedNode || hoveredNode;
  const tooltipLeft = activeNode ? `calc(${(activeNode.x / 900) * 100}% + 10px)` : "0px";
  const tooltipTop = activeNode ? `calc(${(activeNode.y / 560) * 100}% - 10px)` : "0px";

  return (
    <div style={container}>
      <h1 style={title}>Árbol de decisión con estudio de mercado</h1>

      <div style={card}>
        <div style={{ position: "relative" }}>
          <svg
            viewBox="0 0 900 560"
            style={{ width: "100%" }}
            onClick={() => setPinnedNode(null)}
          >

          {/* Nodo raíz */}
          <g
            onMouseEnter={() => setHoveredNode({
              title: "Decision",
              lines: ["Aqui se elige entre estudiar o no estudiar."],
              x: 75,
              y: 262
            })}
            onMouseLeave={() => setHoveredNode(null)}
            onClick={(e) => {
              e.stopPropagation();
              setPinnedNode({
                title: "Decision",
                lines: ["Aqui se elige entre estudiar o no estudiar."],
                x: 75,
                y: 262
              });
            }}
            style={{ cursor: "pointer" }}
          >
            <rect x="30" y="240" width="90" height="44" rx="6" fill="#185fa5" />
            <text x="75" y="262" textAnchor="middle" fill="#fff">Decisión</text>
          </g>

          {/* Primer nivel */}
          {[
            { y: 120, label: `F (${formatNumber(P_fav)})` },
            { y: 290, label: `U (${formatNumber(P_desf)})` },
            { y: 458, label: "Sin estudio" }
          ].map((node, i) => (
            <g key={i}>
              <line x1="120" y1="262" x2="190" y2={node.y} stroke="#888" />
              <g
                onMouseEnter={() => setHoveredNode({
                  title: "Resultado",
                  lines: [
                    `Rama: ${node.label}`,
                    i === 2 ? "No se usa estudio." : "Se usa el resultado del estudio.",
                    i !== 2 ? `Probabilidad: ${formatNumber(i === 0 ? P_fav : P_desf)}` : ""
                  ].filter(Boolean),
                  x: 190,
                  y: node.y
                })}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setPinnedNode({
                    title: "Resultado",
                    lines: [
                      `Rama: ${node.label}`,
                      i === 2 ? "No se usa estudio." : "Se usa el resultado del estudio.",
                      i !== 2 ? `Probabilidad: ${formatNumber(i === 0 ? P_fav : P_desf)}` : ""
                    ].filter(Boolean),
                    x: 190,
                    y: node.y
                  });
                }}
                style={{ cursor: "pointer" }}
              >
                <circle cx="190" cy={node.y} r="20" fill="#666" />
                <text x="190" y={node.y} textAnchor="middle" fill="#fff" fontSize="10">
                  {node.label}
                </text>
              </g>
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
                  <g
                    onMouseEnter={() => setHoveredNode({
                      title: `Alternativa ${alt}`,
                      lines: [
                        `Escenario: ${ds.label}`,
                        `Valor esperado: ${formatNumber(ds.evs[ai])}`,
                        isBest ? "Es la mejor opcion en este escenario." : "",
                        ds.p !== null ? `Probabilidad del escenario: ${formatNumber(ds.p)}` : ""
                      ].filter(Boolean),
                      x: 350,
                      y
                    })}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPinnedNode({
                        title: `Alternativa ${alt}`,
                        lines: [
                          `Escenario: ${ds.label}`,
                          `Valor esperado: ${formatNumber(ds.evs[ai])}`,
                          isBest ? "Es la mejor opcion en este escenario." : "",
                          ds.p !== null ? `Probabilidad del escenario: ${formatNumber(ds.p)}` : ""
                        ].filter(Boolean),
                        x: 350,
                        y
                      });
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <circle cx="350" cy={y} r="12" fill="#185fa5" />
                    <text x="350" y={y} textAnchor="middle" fill="#fff" fontSize="9">
                      {alt}
                    </text>
                  </g>

                  <rect
                    x="520"
                    y={y - 12}
                    width="120"
                    height="24"
                    fill={isBest ? "#0f6e56" : "#eee"}
                  />

                  <text x="580" y={y} textAnchor="middle" fontSize="10">
                    EV = {formatNumber(ds.evs[ai])}
                  </text>
                </g>
              );
            });
          })}

          </svg>

          {activeNode && (
            <div style={{ ...tooltipBox, left: tooltipLeft, top: tooltipTop }}>
              <div style={tooltipHeader}>{activeNode.title}</div>
              {activeNode.lines.map((line, idx) => (
                <div key={idx} style={tooltipLine}>{line}</div>
              ))}
              <div style={{ ...tooltipLine, marginTop: 6, color: "#6b7280" }}>
                Haz clic para fijar. Clic fuera para cerrar.
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={card}>
        <h2>Cálculo paso a paso</h2>

        <p>P(F) = {formatNumber(P_fav)}</p>
        <p>P(U) = {formatNumber(P_desf)}</p>

        <p>P(Alta | F) = {formatNumber(P_alta_fav)}</p>
        <p>P(Baja | F) = {formatNumber(P_baja_fav)}</p>

        <p>P(Alta | U) = {formatNumber(P_alta_desf)}</p>
        <p>P(Baja | U) = {formatNumber(P_baja_desf)}</p>
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

const tooltipBox = {
  position: "absolute",
  maxWidth: 260,
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  padding: "10px 12px",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.15)",
  zIndex: 10
};

const tooltipHeader = {
  fontSize: 12,
  fontWeight: 700,
  color: "#1e293b",
  marginBottom: 6
};

const tooltipLine = {
  fontSize: 12,
  color: "#334155",
  lineHeight: 1.4
};

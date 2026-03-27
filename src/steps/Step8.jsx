import React from "react";

const Step8 = ({ data, next, prev }) => {
  const { alternatives, payoff, probabilities } = data || {};

  if (
    !data ||
    !Array.isArray(alternatives) ||
    !Array.isArray(payoff) ||
    !Array.isArray(probabilities)
  ) {
    return <p>Cargando datos...</p>;
  }

  const safeDiv = (a, b) => (b === 0 ? 0 : a / b);

  const P_alta = probabilities[0] ?? 0;
  const P_baja = probabilities[1] ?? 0;

  const studyConfig = data.studyConfig || {
    favorableDetectionRate: 0.9,
    unfavorableFalsePositiveRate: 0.25
  };

  const P_fav_alta = studyConfig.favorableDetectionRate ?? 0.9;
  const P_fav_baja = studyConfig.unfavorableFalsePositiveRate ?? 0.25;

  const P_fav  = P_alta * P_fav_alta + P_baja * P_fav_baja;
  const P_desf = 1 - P_fav;

  const P_alta_fav  = safeDiv(P_alta * P_fav_alta,       P_fav);
  const P_baja_fav  = safeDiv(P_baja * P_fav_baja,       P_fav);
  const P_alta_desf = safeDiv(P_alta * (1 - P_fav_alta), P_desf);
  const P_baja_desf = safeDiv(P_baja * (1 - P_fav_baja), P_desf);

  const EV_no   = alternatives.map((_, i) => (payoff[i]?.[0] ?? 0) * P_alta  + (payoff[i]?.[1] ?? 0) * P_baja);
  const EV_fav  = alternatives.map((_, i) => (payoff[i]?.[0] ?? 0) * P_alta_fav  + (payoff[i]?.[1] ?? 0) * P_baja_fav);
  const EV_desf = alternatives.map((_, i) => (payoff[i]?.[0] ?? 0) * P_alta_desf + (payoff[i]?.[1] ?? 0) * P_baja_desf);

  const bestFavIdx  = EV_fav.indexOf(Math.max(...EV_fav));
  const bestDesfIdx = EV_desf.indexOf(Math.max(...EV_desf));
  const bestNoIdx   = EV_no.indexOf(Math.max(...EV_no));

  // ─────────────────────────────────────────────
  // Layout del árbol (todas las medidas en px del viewBox 900×560)
  // ─────────────────────────────────────────────
  const ROOT_X = 30, ROOT_Y = 240, ROOT_W = 90, ROOT_H = 44;

  // Nodos azar de primer nivel
  const CHANCE1 = [
    { id: "fav",  label: `F  p=${P_fav.toFixed(3)}`,  cy: 120, color: "#0f6e56", textColor: "#e1f5ee" },
    { id: "desf", label: `U  p=${P_desf.toFixed(3)}`, cy: 290, color: "#993c1d", textColor: "#faece7" },
    { id: "sin",  label: "Sin estudio",                cy: 458, color: "#5f5e5a", textColor: "#f1efe8" },
  ];
  const C1_X = 190, C1_R = 22;

  // Nodos azar de segundo nivel (alternativas)
  const C2_X = 370, C2_R = 14;
  const ALT_COLORS = ["#185fa5", "#0f6e56", "#3b6d11"];
  const ALT_TEXT   = ["#e6f1fb", "#e1f5ee", "#eaf3de"];

  // Resultados (EVs)
  const EV_X = 540;
  const BEST_X = 740;

  // Distribuir alternativas alrededor de cada nodo de primer nivel
  const altOffsets = [-52, 0, 52];

  const datasets = [
    { evs: EV_fav,  probs: [P_alta_fav.toFixed(3), P_baja_fav.toFixed(3)],   baseY: 120 },
    { evs: EV_desf, probs: [P_alta_desf.toFixed(3), P_baja_desf.toFixed(3)], baseY: 290 },
    { evs: EV_no,   probs: [P_alta.toFixed(3), P_baja.toFixed(3)],            baseY: 458 },
  ];

  const bestIdxs = [bestFavIdx, bestDesfIdx, bestNoIdx];

  return (
    <div style={container}>
      <h1 style={title}>Árbol de Decisión con Estudio de Mercado</h1>

      {/* ─── ÁRBOL SVG ─── */}
      <div style={card}>
        <svg
          viewBox="0 0 900 560"
          style={{ width: "100%", fontFamily: "inherit" }}
        >
          {/* ── Nodo raíz ── */}
          <rect x={ROOT_X} y={ROOT_Y} width={ROOT_W} height={ROOT_H} rx="6"
                fill="#185fa5" stroke="#0c447c" strokeWidth="1.5"/>
          <text x={ROOT_X + ROOT_W / 2} y={ROOT_Y + ROOT_H / 2}
                textAnchor="middle" dominantBaseline="central"
                fill="#e6f1fb" fontSize="13" fontWeight="600">Decisión</text>

          {/* ── Ramas de primer nivel ── */}
          {CHANCE1.map((c1) => {
            const fromX = ROOT_X + ROOT_W;
            const fromY = ROOT_Y + ROOT_H / 2;
            return (
              <g key={c1.id}>
                {/* Línea raíz → nodo azar */}
                <path d={`M${fromX},${fromY} L${C1_X - C1_R},${c1.cy}`}
                      stroke="#888" strokeWidth="1.4" fill="none"/>
                {/* Nodo azar (círculo) */}
                <circle cx={C1_X} cy={c1.cy} r={C1_R}
                        fill={c1.color} stroke={c1.color} strokeWidth="1"/>
                <text x={C1_X} y={c1.cy} textAnchor="middle"
                      dominantBaseline="central" fill={c1.textColor}
                      fontSize="10" fontWeight="600">
                  {c1.id === "fav" ? "F" : c1.id === "desf" ? "U" : "S"}
                </text>
                {/* Etiqueta probabilidad */}
                <text x={C1_X - 50} y={(fromY + c1.cy) / 2 - 6}
                      textAnchor="middle" fill="#888" fontSize="10">
                  {c1.id === "fav" ? `F  ${P_fav.toFixed(3)}` :
                   c1.id === "desf" ? `U  ${P_desf.toFixed(3)}` : "Sin estudio"}
                </text>
              </g>
            );
          })}

          {/* ── Ramas de segundo nivel: alternativas ── */}
          {datasets.map((ds, di) => {
            const c1y = CHANCE1[di].cy;
            return alternatives.map((alt, ai) => {
              const altY = c1y + altOffsets[ai];
              // Payoffs
              const p0 = payoff[ai]?.[0] ?? 0;
              const p1 = payoff[ai]?.[1] ?? 0;
              const isBest = ai === bestIdxs[di];
              return (
                <g key={`${di}-${ai}`}>
                  {/* Línea nodo azar → alt */}
                  <path d={`M${C1_X + C1_R},${c1y} L${C2_X - C2_R},${altY}`}
                        stroke="#aaa" strokeWidth="1" fill="none"/>
                  {/* Nodo azar alternativa (círculo pequeño) */}
                  <circle cx={C2_X} cy={altY} r={C2_R}
                          fill={ALT_COLORS[ai]} stroke={ALT_COLORS[ai]} strokeWidth="0.8"/>
                  <text x={C2_X} y={altY} textAnchor="middle"
                        dominantBaseline="central" fill={ALT_TEXT[ai]} fontSize="9" fontWeight="600">
                    {alt}
                  </text>

                  {/* Líneas payoff (2 sub-ramas: S1 y S2) */}
                  {[p0, p1].map((pv, pi) => {
                    const pyY = altY - 20 + pi * 40;
                    return (
                      <g key={pi}>
                        <path d={`M${C2_X + C2_R},${altY} L${EV_X - 4},${pyY}`}
                              stroke="#ccc" strokeWidth="0.8" fill="none"/>
                        {/* prob label */}
                        <text x={C2_X + 42} y={pyY - 5}
                              textAnchor="middle" fill="#aaa" fontSize="9">
                          S{pi + 1} {ds.probs[pi]}
                        </text>
                        {/* payoff value */}
                        <text x={EV_X + 2} y={pyY + 4}
                              fill="#555" fontSize="10" fontWeight="500">
                          {pv}
                        </text>
                      </g>
                    );
                  })}

                  {/* Caja EV */}
                  <rect x={EV_X + 28} y={altY - 14} width={130} height={28}
                        rx="5"
                        fill={isBest ? "#0f6e56" : "#f1efe8"}
                        stroke={isBest ? "#085041" : "#d3d1c7"} strokeWidth="0.8"/>
                  <text x={EV_X + 93} y={altY + 1} textAnchor="middle"
                        dominantBaseline="central"
                        fill={isBest ? "#e1f5ee" : "#444"}
                        fontSize="11" fontWeight={isBest ? "700" : "500"}>
                    EV={ds.evs[ai].toFixed(2)}  {isBest ? "★" : ""}
                  </text>

                  {/* Flecha hacia caja EV */}
                  <path d={`M${EV_X + 24},${altY} L${EV_X + 27},${altY}`}
                        stroke="#aaa" strokeWidth="0.8" fill="none"/>
                </g>
              );
            });
          })}

          {/* ── Resumen mejores EVs por rama ── */}
          {[
            { label: `Mejor: ${alternatives[bestFavIdx]}`,  y: 58,  ev: EV_fav[bestFavIdx] },
            { label: `Mejor: ${alternatives[bestDesfIdx]}`, y: 228, ev: EV_desf[bestDesfIdx] },
            { label: `Mejor: ${alternatives[bestNoIdx]}`,   y: 396, ev: EV_no[bestNoIdx] },
          ].map((r, i) => (
            <g key={i}>
              <rect x={BEST_X - 10} y={r.y} width={148} height={32} rx="6"
                    fill="#ba7517" stroke="#854f0b" strokeWidth="0.8"/>
              <text x={BEST_X + 64} y={r.y + 10} textAnchor="middle"
                    fill="#faeeda" fontSize="10" fontWeight="600">{r.label}</text>
              <text x={BEST_X + 64} y={r.y + 24} textAnchor="middle"
                    fill="#fac775" fontSize="10">EV = {r.ev.toFixed(2)}</text>
            </g>
          ))}

          {/* ── Leyenda ── */}
          <rect x="30" y="520" width="12" height="12" rx="2" fill="#185fa5"/>
          <text x="48" y="531" fill="#888" fontSize="10">Nodo decisión</text>
          <circle cx="148" cy="526" r="7" fill="#5f5e5a"/>
          <text x="160" y="531" fill="#888" fontSize="10">Nodo azar (1er nivel)</text>
          <circle cx="310" cy="526" r="7" fill="#185fa5"/>
          <text x="322" y="531" fill="#888" fontSize="10">Nodo azar (alternativa)</text>
          <rect x="440" y="519" width="12" height="14" rx="2" fill="#0f6e56"/>
          <text x="458" y="531" fill="#888" fontSize="10">Mejor EV por rama</text>
          <rect x="566" y="519" width="12" height="14" rx="2" fill="#ba7517"/>
          <text x="584" y="531" fill="#888" fontSize="10">Resumen decisión</text>
        </svg>
      </div>

      {/* ─── PASO A PASO ─── */}
      <div style={card}>
        <h2 style={sectionTitle}>Cálculos paso a paso</h2>

        <div style={stepGrid}>
          <div style={stepBox("#e6f1fb")}>
            <h3 style={{ margin: "0 0 8px", color: "#185fa5" }}>1. Probabilidades</h3>
            <p style={formula}>P(F) = {P_alta}×0.9 + {P_baja}×0.25 = <strong>{P_fav.toFixed(4)}</strong></p>
            <p style={formula}>P(U) = 1 − P(F) = <strong>{P_desf.toFixed(4)}</strong></p>
          </div>

          <div style={stepBox("#e1f5ee")}>
            <h3 style={{ margin: "0 0 8px", color: "#0f6e56" }}>2. Teorema de Bayes</h3>
            <p style={formula}>P(Alta|F) = {P_alta_fav.toFixed(4)}</p>
            <p style={formula}>P(Baja|F) = {P_baja_fav.toFixed(4)}</p>
            <p style={formula}>P(Alta|U) = {P_alta_desf.toFixed(4)}</p>
            <p style={formula}>P(Baja|U) = {P_baja_desf.toFixed(4)}</p>
          </div>

          <div style={stepBox("#eaf3de")}>
            <h3 style={{ margin: "0 0 8px", color: "#3b6d11" }}>3. EV Favorable</h3>
            {alternatives.map((alt, i) => (
              <p key={i} style={{ ...formula, fontWeight: i === bestFavIdx ? "700" : "400" }}>
                {alt}: {EV_fav[i].toFixed(2)} {i === bestFavIdx ? "★" : ""}
              </p>
            ))}
          </div>

          <div style={stepBox("#faece7")}>
            <h3 style={{ margin: "0 0 8px", color: "#993c1d" }}>4. EV Desfavorable</h3>
            {alternatives.map((alt, i) => (
              <p key={i} style={{ ...formula, fontWeight: i === bestDesfIdx ? "700" : "400" }}>
                {alt}: {EV_desf[i].toFixed(2)} {i === bestDesfIdx ? "★" : ""}
              </p>
            ))}
          </div>

          <div style={stepBox("#faeeda")}>
            <h3 style={{ margin: "0 0 8px", color: "#854f0b" }}>5. EV Sin estudio</h3>
            {alternatives.map((alt, i) => (
              <p key={i} style={{ ...formula, fontWeight: i === bestNoIdx ? "700" : "400" }}>
                {alt}: {EV_no[i].toFixed(2)} {i === bestNoIdx ? "★" : ""}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* ─── BOTONES ─── */}
      <div style={buttons}>
        <button onClick={prev} style={btnSecondary}>← Volver</button>
        <button onClick={next} style={btnPrimary}>Continuar →</button>
      </div>
    </div>
  );
};

export default Step8;

// ─── Estilos ───────────────────────────────────
const container = { display: "flex", flexDirection: "column", gap: "20px" };

const title = { margin: "0 0 4px", fontSize: "20px", fontWeight: "700", color: "#1a1a2e" };

const card = {
  background: "#fff",
  padding: "24px",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  overflowX: "auto",
};

const sectionTitle = { margin: "0 0 16px", fontSize: "16px", fontWeight: "600", color: "#333" };

const stepGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  gap: "12px",
};

const stepBox = (bg) => ({
  background: bg,
  padding: "14px",
  borderRadius: "8px",
  fontSize: "13px",
  lineHeight: "1.6",
});

const formula = { margin: "4px 0", fontSize: "12px", color: "#333" };

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
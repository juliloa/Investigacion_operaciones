import React, { useState } from "react";

const playerColors = ["#2563eb", "#dc2626", "#16a34a", "#9333ea", "#ea580c", "#0891b2"];
const playerBg     = ["#eff6ff", "#fef2f2", "#f0fdf4", "#faf5ff", "#fff7ed", "#ecfeff"];

const getVal = (cell, k) => parseFloat(cell?.[k]) || 0;

const isNashCell = (matrix, r, c, n) => {
  const cell = matrix[r][c];
  for (let k = 0; k < n; k++) {
    const my = getVal(cell, k);
    if (k === 0) {
      for (let i = 0; i < matrix.length; i++)
        if (getVal(matrix[i][c], k) > my) return false;
    } else if (k === 1) {
      for (let j = 0; j < matrix[r].length; j++)
        if (getVal(matrix[r][j], k) > my) return false;
    } else {
      for (let i = 0; i < matrix.length; i++)
        for (let j = 0; j < matrix[i].length; j++)
          if (getVal(matrix[i][j], k) > my) return false;
    }
  }
  return true;
};

// ── CÁLCULO ENEM ─────────────────────────────────────────────────────────────
// Para matriz NxM: resuelve sistema lineal igualando utilidades
// Retorna { steps, probabilities } para cada jugador
const calcMixedStrategy = (matrix, playerIdx, numRows, numCols) => {
  // playerIdx=0 → encontrar q (prob J2 sobre columnas) igualando utilidades de J1 por filas
  // playerIdx=1 → encontrar p (prob J1 sobre filas) igualando utilidades de J2 por columnas

  if (playerIdx === 0) {
    // Caso 2x2: igualar fila 0 vs fila 1
    if (numCols === 2) {
      const a = getVal(matrix[0][0], 0); // J1, fila0, col0
      const b = getVal(matrix[0][1], 0); // J1, fila0, col1
      const c = getVal(matrix[1][0], 0); // J1, fila1, col0
      const d = getVal(matrix[1][1], 0); // J1, fila1, col1
      // aq + b(1-q) = cq + d(1-q)
      // (a-b)q + b = (c-d)q + d
      // q(a-b-c+d) = d-b
      const denom = a - b - c + d;
      if (denom === 0) return null;
      const q = (d - b) / denom;
      return {
        varName: "q",
        equation: `${a}q + ${b}(1-q) = ${c}q + ${d}(1-q)`,
        simplified: `${a - b}q + ${b} = ${c - d}q + ${d}`,
        steps: [
          `Igualar utilidad de J1 en fila 1 vs fila 2:`,
          `${a}q + ${b}(1-q) = ${c}q + ${d}(1-q)`,
          `${a}q + ${b} - ${b}q = ${c}q + ${d} - ${d}q`,
          `${a - b}q + ${b} = ${c - d}q + ${d}`,
          `${a - b - (c - d)}q = ${d - b}`,
          `q = ${d - b} / ${denom} = ${q.toFixed(4)}`
        ],
        prob: q,
        complement: 1 - q,
        valid: q >= 0 && q <= 1
      };
    }

    // Caso NxM general: para cada par de filas consecutivas
    const results = [];
    for (let r = 0; r < numRows - 1; r++) {
      const rowSteps = [];
      const coeffs = Array(numCols).fill(0);
      for (let j = 0; j < numCols; j++) {
        coeffs[j] = getVal(matrix[r][j], 0) - getVal(matrix[r + 1][j], 0);
      }
      rowSteps.push(`Igualar fila ${r + 1} con fila ${r + 2}: ` +
        coeffs.map((c, j) => `${c >= 0 ? "+" : ""}${c}·q${j + 1}`).join(" ") + " = 0"
      );
      results.push({ pair: [r, r + 1], coeffs, steps: rowSteps });
    }
    return { general: true, results, varName: "q" };
  }

  if (playerIdx === 1) {
    if (numRows === 2) {
      const a = getVal(matrix[0][0], 1);
      const b = getVal(matrix[1][0], 1);
      const c = getVal(matrix[0][1], 1);
      const d = getVal(matrix[1][1], 1);
      // ap + b(1-p) = cp + d(1-p)
      const denom = a - b - c + d;
      if (denom === 0) return null;
      const p = (d - b) / denom;
      return {
        varName: "p",
        equation: `${a}p + ${b}(1-p) = ${c}p + ${d}(1-p)`,
        steps: [
          `Igualar utilidad de J2 en columna 1 vs columna 2:`,
          `${a}p + ${b}(1-p) = ${c}p + ${d}(1-p)`,
          `${a}p + ${b} - ${b}p = ${c}p + ${d} - ${d}p`,
          `${a - b}p + ${b} = ${c - d}p + ${d}`,
          `${a - b - (c - d)}p = ${d - b}`,
          `p = ${d - b} / ${denom} = ${p.toFixed(4)}`
        ],
        prob: p,
        complement: 1 - p,
        valid: p >= 0 && p <= 1
      };
    }

    const results = [];
    for (let j = 0; j < numCols - 1; j++) {
      const coeffs = Array(numRows).fill(0);
      for (let r = 0; r < numRows; r++) {
        coeffs[r] = getVal(matrix[r][j], 1) - getVal(matrix[r][j + 1], 1);
      }
      results.push({
        pair: [j, j + 1],
        coeffs,
        steps: [`Igualar col ${j + 1} con col ${j + 2}: ` +
          coeffs.map((c, r) => `${c >= 0 ? "+" : ""}${c}·p${r + 1}`).join(" ") + " = 0"
        ]
      });
    }
    return { general: true, results, varName: "p" };
  }
  return null;
};

// ── TABS ─────────────────────────────────────────────────────────────────────
const TABS = ["Matriz", "Análisis", "Conclusiones"];

const NashAnalysis = ({ nashData, onBack }) => {
  const [activeTab, setActiveTab] = useState(0);

  if (!nashData) return (
    <div style={s.container}>
      <p style={{ color: "#6b7280" }}>No hay datos. Regresa a la matriz e ingresa los valores.</p>
      <button style={s.backBtn} onClick={onBack}>← Volver</button>
    </div>
  );

  const { matrix, rowNames, colNames, rowGroup, colGroup, numPlayers } = nashData;
  const numRows = matrix.length;
  const numCols = colNames.length;

  // ── Nash cells ────────────────────────────────────────────────
  const nashCells = [];
  for (let i = 0; i < numRows; i++)
    for (let j = 0; j < numCols; j++)
      if (isNashCell(matrix, i, j, numPlayers))
        nashCells.push({ i, j, values: matrix[i][j].map(v => parseFloat(v)) });

  const isNash = (i, j) => nashCells.some(c => c.i === i && c.j === j);
  const hasENEP = nashCells.length > 0;

  // ── Máximos por jugador ───────────────────────────────────────
  // Para cada jugador k: máximo en cada columna (fila) y fila (columna)
  const colMax = (k) => colNames.map((_, j) =>
    Math.max(...matrix.map(row => getVal(row[j], k)))
  );
  const rowMax = (k) => matrix.map(row =>
    Math.max(...row.map(cell => getVal(cell, k)))
  );

  const isColMax = (i, j, k) => getVal(matrix[i][j], k) === colMax(k)[j];
  const isRowMax = (i, j, k) => getVal(matrix[i][j], k) === rowMax(k)[i];

  // ── ENEM cálculo ──────────────────────────────────────────────
  const mixedJ2 = !hasENEP ? calcMixedStrategy(matrix, 0, numRows, numCols) : null;
  const mixedJ1 = !hasENEP ? calcMixedStrategy(matrix, 1, numRows, numCols) : null;

  // ── Render tabs ───────────────────────────────────────────────
  const renderTab = () => {
    switch (activeTab) {
      case 0: return <TabMatrix />;
      case 1: return <TabAnalysis />;
      case 2: return <TabConclusions />;
      default: return null;
    }
  };

  // ── TAB 1: MATRIZ ─────────────────────────────────────────────
  const TabMatrix = () => (
    <div>
      {/* Badge ENEP / ENEM */}
      <div style={{ marginBottom: "16px" }}>
        <span style={hasENEP ? s.badgeENEP : s.badgeENEM}>
          {hasENEP ? "✓ ENEP — Equilibrio en Estrategias Puras" : "✗ ENEM — Se requieren Estrategias Mixtas"}
        </span>
      </div>

      {/* Leyenda círculos */}
      <div style={s.legendRow}>
        {Array.from({ length: numPlayers }, (_, k) => (
          <div key={k} style={s.legendItem}>
            <div style={{ ...s.circle, background: playerColors[k], width: 14, height: 14 }} />
            <span style={{ fontSize: 12, color: "#374151" }}>
              Máx J{k + 1} {k === 0 ? `(${rowGroup})` : k === 1 ? `(${colGroup})` : ""}
            </span>
          </div>
        ))}
        <div style={s.legendItem}>
          <div style={{ width: 14, height: 14, borderRadius: 3, border: "2px solid #16a34a", background: "#d1fae5" }} />
          <span style={{ fontSize: 12, color: "#374151" }}>Equilibrio Nash</span>
        </div>
      </div>

      {/* TABLA */}
      <div style={s.tableContainer}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.corner}></th>
              <th colSpan={numCols} style={s.groupHeader}>{colGroup}</th>
            </tr>
            <tr>
              <th style={s.groupSide}>{rowGroup}</th>
              {colNames.map((col, j) => (
                <th key={j} style={s.header}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <th style={s.rowHeader}>{rowNames[i]}</th>
                {row.map((cell, j) => (
                  <td key={j} style={{
                    ...s.cell,
                    background: isNash(i, j) ? "#d1fae5" : "#fff",
                    border: isNash(i, j) ? "2px solid #16a34a" : "1px solid #f1f5f9",
                    position: "relative"
                  }}>
                    <div style={s.cellInner}>
                      {cell.map((val, k) => {
                        const v = parseFloat(val);
                        // círculo si es máx de columna (J1) o máx de fila (J2)
                        const highlight = (k === 0 && isColMax(i, j, k)) ||
                                          (k === 1 && isRowMax(i, j, k)) ||
                                          (k >= 2 && isColMax(i, j, k));
                        return (
                          <div key={k} style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                            {highlight && (
                              <div style={{
                                position: "absolute",
                                width: 32, height: 32, borderRadius: "50%",
                                border: `2px solid ${playerColors[k]}`,
                                background: playerBg[k],
                                top: "50%", left: "50%",
                                transform: "translate(-50%, -50%)",
                                zIndex: 0
                              }} />
                            )}
                            <span style={{
                              position: "relative", zIndex: 1,
                              fontSize: 14, fontWeight: highlight ? 700 : 400,
                              color: highlight ? playerColors[k] : "#374151",
                              minWidth: 28, textAlign: "center", padding: "4px"
                            }}>
                              {v}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Lista equilibrios */}
      {hasENEP && (
        <div style={s.card}>
          <p style={s.cardTitle}>Equilibrios encontrados</p>
          {nashCells.map((c, idx) => (
            <div key={idx} style={s.nashItem}>
              <strong>E{idx + 1}:</strong>
              <span>({rowNames[c.i]}, {colNames[c.j]})</span>
              {c.values.map((v, k) => (
                <span key={k} style={{ ...s.chip, background: playerBg[k], color: playerColors[k], border: `1px solid ${playerColors[k]}33` }}>
                  J{k + 1}: {v}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── TAB 2: ANÁLISIS ───────────────────────────────────────────
  const TabAnalysis = () => (
    <div>
      {hasENEP ? <AnalysisENEP /> : <AnalysisENEM />}
    </div>
  );

  // ENEP: verificación de mejor respuesta
  const AnalysisENEP = () => (
    <div>
      <p style={s.sectionLabel}>Verificación de mejor respuesta por equilibrio</p>
      {nashCells.map((nc, idx) => (
        <div key={idx} style={s.card}>
          <p style={s.cardTitle}>Equilibrio E{idx + 1}: ({rowNames[nc.i]}, {colNames[nc.j]})</p>

          {/* J1: fija columna nc.j, compara filas */}
          <div style={s.playerBlock}>
            <div style={{ ...s.playerTag, background: playerBg[0], color: playerColors[0], border: `1px solid ${playerColors[0]}33` }}>
              J1 — {rowGroup}
            </div>
            <p style={s.stepText}>Fijando columna <strong>{colNames[nc.j]}</strong>, comparar pagos de J1:</p>
            {matrix.map((row, i) => {
              const v = getVal(row[nc.j], 0);
              const isBest = i === nc.i;
              return (
                <div key={i} style={{ ...s.stepRow, background: isBest ? "#eff6ff" : "transparent" }}>
                  <span style={{ fontSize: 13, color: "#374151", minWidth: 120 }}>{rowNames[i]}</span>
                  <span style={{ fontSize: 13, fontWeight: isBest ? 700 : 400, color: isBest ? playerColors[0] : "#6b7280" }}>
                    {v} {isBest ? "← máximo ✓" : ""}
                  </span>
                </div>
              );
            })}
            <p style={s.conclusionText}>
              J1 no puede mejorar cambiando de fila → <strong>mejor respuesta confirmada</strong>
            </p>
          </div>

          {/* J2: fija fila nc.i, compara columnas */}
          {numPlayers >= 2 && (
            <div style={s.playerBlock}>
              <div style={{ ...s.playerTag, background: playerBg[1], color: playerColors[1], border: `1px solid ${playerColors[1]}33` }}>
                J2 — {colGroup}
              </div>
              <p style={s.stepText}>Fijando fila <strong>{rowNames[nc.i]}</strong>, comparar pagos de J2:</p>
              {colNames.map((col, j) => {
                const v = getVal(matrix[nc.i][j], 1);
                const isBest = j === nc.j;
                return (
                  <div key={j} style={{ ...s.stepRow, background: isBest ? "#fef2f2" : "transparent" }}>
                    <span style={{ fontSize: 13, color: "#374151", minWidth: 120 }}>{col}</span>
                    <span style={{ fontSize: 13, fontWeight: isBest ? 700 : 400, color: isBest ? playerColors[1] : "#6b7280" }}>
                      {v} {isBest ? "← máximo ✓" : ""}
                    </span>
                  </div>
                );
              })}
              <p style={s.conclusionText}>
                J2 no puede mejorar cambiando de columna → <strong>mejor respuesta confirmada</strong>
              </p>
            </div>
          )}

          <div style={s.verifyBox}>
            ∴ Ningún jugador mejora desviándose unilateralmente → Es Equilibrio de Nash ✓
          </div>
        </div>
      ))}
    </div>
  );

  // ENEM: cálculo de estrategias mixtas
  const AnalysisENEM = () => (
    <div>
      <p style={s.sectionLabel}>Cálculo de estrategias mixtas</p>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
        No existe equilibrio en estrategias puras. Se calculan las probabilidades con las que
        cada jugador hace indiferente al otro.
      </p>

      {/* Para J2: encontrar q */}
      <div style={s.card}>
        <div style={{ ...s.playerTag, background: playerBg[1], color: playerColors[1], border: `1px solid ${playerColors[1]}33`, marginBottom: 12 }}>
          Encontrar q — probabilidad de J2 ({colGroup})
        </div>
        <p style={s.stepText}>
          Igualamos las utilidades esperadas de J1 entre sus estrategias para encontrar
          la probabilidad <strong>q</strong> con la que J2 juega cada columna:
        </p>

        {mixedJ2 && !mixedJ2.general && (
          <div>
            {mixedJ2.steps.map((step, i) => (
              <div key={i} style={{ ...s.stepRow, fontFamily: "monospace", fontSize: 13, padding: "5px 10px" }}>
                {i === 0 ? <strong>{step}</strong> : step}
              </div>
            ))}
            <div style={{
              ...s.verifyBox,
              background: mixedJ2.valid ? "#eff6ff" : "#fef2f2",
              borderColor: mixedJ2.valid ? "#2563eb" : "#dc2626",
              color: mixedJ2.valid ? "#1d4ed8" : "#dc2626"
            }}>
              {mixedJ2.valid
                ? `q = ${mixedJ2.prob.toFixed(4)}   |   1 - q = ${mixedJ2.complement.toFixed(4)}`
                : "q fuera de rango [0,1] — revisar matriz"
              }
            </div>
          </div>
        )}

        {mixedJ2?.general && (
          <div>
            <p style={{ fontSize: 13, color: "#374151", marginBottom: 8 }}>
              Matriz {numRows}×{numCols} — sistema de ecuaciones:
            </p>
            {mixedJ2.results.map((r, i) => (
              <div key={i} style={{ ...s.stepRow, fontFamily: "monospace", fontSize: 13, padding: "5px 10px" }}>
                {r.steps[0]}
              </div>
            ))}
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
              Resolver el sistema con la restricción q1 + q2 + ... + qn = 1
            </p>
          </div>
        )}

        {!mixedJ2 && (
          <p style={{ fontSize: 13, color: "#dc2626" }}>No se pudo calcular — denominador cero.</p>
        )}
      </div>

      {/* Para J1: encontrar p */}
      <div style={s.card}>
        <div style={{ ...s.playerTag, background: playerBg[0], color: playerColors[0], border: `1px solid ${playerColors[0]}33`, marginBottom: 12 }}>
          Encontrar p — probabilidad de J1 ({rowGroup})
        </div>
        <p style={s.stepText}>
          Igualamos las utilidades esperadas de J2 entre sus estrategias para encontrar
          la probabilidad <strong>p</strong> con la que J1 juega cada fila:
        </p>

        {mixedJ1 && !mixedJ1.general && (
          <div>
            {mixedJ1.steps.map((step, i) => (
              <div key={i} style={{ ...s.stepRow, fontFamily: "monospace", fontSize: 13, padding: "5px 10px" }}>
                {i === 0 ? <strong>{step}</strong> : step}
              </div>
            ))}
            <div style={{
              ...s.verifyBox,
              background: mixedJ1.valid ? "#eff6ff" : "#fef2f2",
              borderColor: mixedJ1.valid ? "#2563eb" : "#dc2626",
              color: mixedJ1.valid ? "#1d4ed8" : "#dc2626"
            }}>
              {mixedJ1.valid
                ? `p = ${mixedJ1.prob.toFixed(4)}   |   1 - p = ${mixedJ1.complement.toFixed(4)}`
                : "p fuera de rango [0,1] — revisar matriz"
              }
            </div>
          </div>
        )}

        {mixedJ1?.general && (
          <div>
            <p style={{ fontSize: 13, color: "#374151", marginBottom: 8 }}>
              Matriz {numRows}×{numCols} — sistema de ecuaciones:
            </p>
            {mixedJ1.results.map((r, i) => (
              <div key={i} style={{ ...s.stepRow, fontFamily: "monospace", fontSize: 13, padding: "5px 10px" }}>
                {r.steps[0]}
              </div>
            ))}
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
              Resolver el sistema con la restricción p1 + p2 + ... + pm = 1
            </p>
          </div>
        )}

        {!mixedJ1 && (
          <p style={{ fontSize: 13, color: "#dc2626" }}>No se pudo calcular — denominador cero.</p>
        )}
      </div>

      {/* Resultado final ENEM */}
      {mixedJ2 && mixedJ1 && !mixedJ2.general && !mixedJ1.general && mixedJ2.valid && mixedJ1.valid && (
        <div style={{ ...s.verifyBox, fontSize: 15, fontWeight: 600 }}>
          Equilibrio de Nash mixto: (p = {mixedJ1.prob.toFixed(4)}, q = {mixedJ2.prob.toFixed(4)})
        </div>
      )}
    </div>
  );

  // ── TAB 3: CONCLUSIONES ───────────────────────────────────────
  const TabConclusions = () => (
    <div>
      <p style={s.sectionLabel}>Conclusiones y recomendaciones</p>

      {/* Tipo de equilibrio */}
      <div style={s.card}>
        <p style={s.cardTitle}>Tipo de equilibrio</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <span style={hasENEP ? s.badgeENEP : s.badgeENEM}>
            {hasENEP ? "ENEP" : "ENEM"}
          </span>
          <span style={{ fontSize: 13, color: "#374151", alignSelf: "center" }}>
            {hasENEP
              ? `Se encontraron ${nashCells.length} equilibrio${nashCells.length > 1 ? "s" : ""} en estrategias puras.`
              : "No existe equilibrio en estrategias puras. Se requiere mezcla aleatoria."}
          </span>
        </div>
        <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
          {hasENEP
            ? "Un equilibrio en estrategias puras significa que existe al menos una combinación de estrategias donde ningún jugador tiene incentivo a cambiar unilateralmente su decisión."
            : "Un equilibrio en estrategias mixtas implica que cada jugador debe aleatorizar entre sus estrategias con probabilidades específicas para que el otro sea indiferente entre las suyas."
          }
        </p>
      </div>

      {/* Por jugador */}
      {Array.from({ length: numPlayers }, (_, k) => {
        const label = k === 0 ? rowGroup : k === 1 ? colGroup : `Jugador ${k + 1}`;
        const controlled = k === 0 ? "filas" : k === 1 ? "columnas" : "estrategias globales";

        let recommendation = "";
        if (hasENEP) {
          const bestStrategies = [...new Set(nashCells.map(c => k === 0 ? rowNames[c.i] : colNames[c.j]))];
          recommendation = `Estrategia${bestStrategies.length > 1 ? "s" : ""} óptima${bestStrategies.length > 1 ? "s" : ""}: ${bestStrategies.join(", ")}.`;
        } else {
          if (k === 0 && mixedJ1 && !mixedJ1.general && mixedJ1.valid) {
            recommendation = `Jugar ${rowNames[0]} con probabilidad p = ${mixedJ1.prob.toFixed(3)} y ${rowNames[1]} con probabilidad 1-p = ${mixedJ1.complement.toFixed(3)}.`;
          } else if (k === 1 && mixedJ2 && !mixedJ2.general && mixedJ2.valid) {
            recommendation = `Jugar ${colNames[0]} con probabilidad q = ${mixedJ2.prob.toFixed(3)} y ${colNames[1]} con probabilidad 1-q = ${mixedJ2.complement.toFixed(3)}.`;
          } else {
            recommendation = "Resolver el sistema de ecuaciones para obtener las probabilidades óptimas.";
          }
        }

        return (
          <div key={k} style={s.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: playerColors[k] }} />
              <p style={{ ...s.cardTitle, margin: 0 }}>J{k + 1} — {label}</p>
            </div>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>
              Controla las <strong>{controlled}</strong> de la matriz.
            </p>
            <div style={{ ...s.verifyBox, background: playerBg[k], borderColor: playerColors[k] + "44", color: playerColors[k] }}>
              {recommendation}
            </div>
          </div>
        );
      })}

      {/* Recomendación general */}
      <div style={{ ...s.card, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
        <p style={s.cardTitle}>Recomendación general</p>
        <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>
          {hasENEP && nashCells.length === 1
            ? `Existe un único equilibrio de Nash estable en (${rowNames[nashCells[0].i]}, ${colNames[nashCells[0].j]}). Esta es la solución racional predecible del juego — ambos jugadores convergerán a esta combinación bajo racionalidad común.`
            : hasENEP && nashCells.length > 1
            ? `Existen múltiples equilibrios de Nash. En juegos de suma cero esto implica equivalencia e intercambiabilidad — todos los equilibrios proporcionan las mismas utilidades. Cualquiera de ellos es igualmente válido.`
            : `Al no existir equilibrio puro, la solución requiere estrategias mixtas. Cada jugador debe aleatorizar para evitar ser explotado por el otro. Las probabilidades calculadas garantizan que ningún jugador pueda mejorar cambiando su distribución.`
          }
        </p>
      </div>
    </div>
  );

  return (
    <div style={s.container}>
      <h2 style={s.title}>Análisis — Equilibrio de Nash</h2>

      {/* TABS */}
      <div style={s.tabRow}>
        {TABS.map((tab, i) => (
          <button
            key={i}
            style={{ ...s.tab, ...(activeTab === i ? s.tabActive : {}) }}
            onClick={() => setActiveTab(i)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={s.tabContent}>
        {renderTab()}
      </div>

      <button style={s.backBtn} onClick={onBack}>← Volver a Matriz</button>
    </div>
  );
};

export default NashAnalysis;

// ── ESTILOS ───────────────────────────────────────────────────────────────────
const s = {
  container:    { padding: "30px", background: "#f4f6fb", fontFamily: "Inter, sans-serif", minHeight: "100vh" },
  title:        { fontSize: "24px", fontWeight: "800", marginBottom: "20px" },

  tabRow:       { display: "flex", gap: "4px", marginBottom: "20px", background: "#fff", padding: "4px", borderRadius: "12px", border: "1px solid #e5e7eb", width: "fit-content" },
  tab:          { padding: "8px 20px", borderRadius: "9px", border: "none", background: "transparent", cursor: "pointer", fontSize: "13px", fontWeight: "500", color: "#6b7280", transition: "all 0.18s" },
  tabActive:    { background: "#0f172a", color: "#fff" },
  tabContent:   { marginBottom: "20px" },

  badgeENEP:    { display: "inline-block", padding: "6px 14px", borderRadius: "20px", background: "#d1fae5", color: "#065f46", fontWeight: "700", fontSize: "13px" },
  badgeENEM:    { display: "inline-block", padding: "6px 14px", borderRadius: "20px", background: "#fee2e2", color: "#7f1d1d", fontWeight: "700", fontSize: "13px" },

  legendRow:    { display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "14px", alignItems: "center" },
  legendItem:   { display: "flex", alignItems: "center", gap: "6px" },
  circle:       { borderRadius: "50%", opacity: 0.85 },

  tableContainer: { borderRadius: "14px", overflow: "auto", boxShadow: "0 4px 16px rgba(0,0,0,0.07)", background: "#fff", marginBottom: "16px" },
  table:          { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
  corner:         { background: "#0f172a", padding: "12px" },
  groupHeader:    { background: "#0f172a", color: "#fff", padding: "12px", textAlign: "center", fontWeight: "700" },
  groupSide:      { background: "#0f172a", color: "#fff", textAlign: "center", padding: "10px", fontWeight: "700" },
  header:         { background: "#f1f5f9", padding: "10px", textAlign: "center", fontWeight: "700" },
  rowHeader:      { background: "#f8fafc", padding: "10px 14px", fontWeight: "700", minWidth: "130px" },
  cell:           { textAlign: "center", padding: "10px 8px" },
  cellInner:      { display: "flex", gap: "6px", justifyContent: "center", alignItems: "center" },

  card:         { background: "#fff", borderRadius: "12px", padding: "16px 18px", marginBottom: "14px", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
  cardTitle:    { fontSize: "14px", fontWeight: "700", color: "#111827", marginBottom: "10px", margin: "0 0 10px 0" },
  sectionLabel: { fontSize: "13px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" },

  playerBlock:  { marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid #f1f5f9" },
  playerTag:    { display: "inline-block", padding: "3px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", marginBottom: "8px" },
  stepText:     { fontSize: "13px", color: "#374151", marginBottom: "8px" },
  stepRow:      { display: "flex", gap: "16px", padding: "4px 8px", borderRadius: "6px", marginBottom: "2px" },
  conclusionText: { fontSize: "12px", color: "#6b7280", marginTop: "8px", fontStyle: "italic" },
  verifyBox:    { marginTop: "12px", padding: "10px 14px", borderRadius: "8px", border: "1px solid #bfdbfe", background: "#eff6ff", color: "#1d4ed8", fontSize: "13px", fontWeight: "500" },

  nashItem:     { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px", fontSize: "14px" },
  chip:         { padding: "2px 9px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" },

  backBtn:      { padding: "10px 16px", background: "#6b7280", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600" },
};
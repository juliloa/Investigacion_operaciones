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
const calcMixedStrategy = (matrix, playerIdx, rowNames, colNames) => {
  const numRows = matrix.length;
  const numCols = colNames.length;

  if (playerIdx === 0) {
    // Encontrar q — igualar utilidades de J1 entre filas
    // Para cada fila: expresión algebraica en función de q (2 columnas) o q1..qn
    if (numCols === 2) {
      const a = getVal(matrix[0][0], 0);
      const b = getVal(matrix[0][1], 0);
      const c = getVal(matrix[1][0], 0);
      const d = getVal(matrix[1][1], 0);

      // Expresiones algebraicas por fila
      const exprRow0 = `${a}q + ${b}(1-q)`;
      const exprRow1 = `${c}q + ${d}(1-q)`;

      // Simplificado: (a-b)q + b  vs  (c-d)q + d
      const coef0 = a - b;
      const coef1 = c - d;
      const simplRow0 = `${coef0 >= 0 ? "" : ""}${coef0}q + ${b}`;
      const simplRow1 = `${coef1 >= 0 ? "" : ""}${coef1}q + ${d}`;

      const denom = a - b - c + d;
      if (denom === 0) return null;
      const q = (d - b) / denom;

      return {
        varName: "q",
        rows: rowNames.slice(0, 2).map((name, i) => ({
          name,
          expr: i === 0 ? exprRow0 : exprRow1,
          simplified: i === 0 ? simplRow0 : simplRow1,
          vals: i === 0 ? [a, b] : [c, d]
        })),
        equalStep: `${exprRow0} = ${exprRow1}`,
        simplStep: `${simplRow0} = ${simplRow1}`,
        solveStep: `${coef0 - coef1}q = ${d - b}`,
        prob: q,
        complement: 1 - q,
        valid: q >= 0 && q <= 1
      };
    }

    // NxM general
    const results = [];
    for (let r = 0; r < numRows - 1; r++) {
      const terms = colNames.map((col, j) => {
        const v0 = getVal(matrix[r][j], 0);
        const v1 = getVal(matrix[r + 1][j], 0);
        return { col, v0, v1, diff: v0 - v1 };
      });
      results.push({
        pair: [rowNames[r], rowNames[r + 1]],
        expr0: terms.map((t, j) => `${t.v0}·q${j + 1}`).join(" + "),
        expr1: terms.map((t, j) => `${t.v1}·q${j + 1}`).join(" + "),
        diffExpr: terms.map((t, j) => `${t.diff >= 0 ? "+" : ""}${t.diff}·q${j + 1}`).join(" ") + " = 0"
      });
    }
    return { general: true, results, varName: "q" };
  }

  if (playerIdx === 1) {
    // Encontrar p — igualar utilidades de J2 entre columnas
    if (numRows === 2) {
      const a = getVal(matrix[0][0], 1);
      const b = getVal(matrix[1][0], 1);
      const c = getVal(matrix[0][1], 1);
      const d = getVal(matrix[1][1], 1);

      const exprCol0 = `${a}p + ${b}(1-p)`;
      const exprCol1 = `${c}p + ${d}(1-p)`;

      const coef0 = a - b;
      const coef1 = c - d;
      const simplCol0 = `${coef0}p + ${b}`;
      const simplCol1 = `${coef1}p + ${d}`;

      const denom = a - b - c + d;
      if (denom === 0) return null;
      const p = (d - b) / denom;

      return {
        varName: "p",
        cols: colNames.slice(0, 2).map((name, j) => ({
          name,
          expr: j === 0 ? exprCol0 : exprCol1,
          simplified: j === 0 ? simplCol0 : simplCol1,
          vals: j === 0 ? [a, b] : [c, d]
        })),
        equalStep: `${exprCol0} = ${exprCol1}`,
        simplStep: `${simplCol0} = ${simplCol1}`,
        solveStep: `${coef0 - coef1}p = ${d - b}`,
        prob: p,
        complement: 1 - p,
        valid: p >= 0 && p <= 1
      };
    }

    // NxM general
    const results = [];
    for (let j = 0; j < numCols - 1; j++) {
      const terms = rowNames.map((row, i) => {
        const v0 = getVal(matrix[i][j], 1);
        const v1 = getVal(matrix[i][j + 1], 1);
        return { row, v0, v1, diff: v0 - v1 };
      });
      results.push({
        pair: [colNames[j], colNames[j + 1]],
        expr0: terms.map((t, i) => `${t.v0}·p${i + 1}`).join(" + "),
        expr1: terms.map((t, i) => `${t.v1}·p${i + 1}`).join(" + "),
        diffExpr: terms.map((t, i) => `${t.diff >= 0 ? "+" : ""}${t.diff}·p${i + 1}`).join(" ") + " = 0"
      });
    }
    return { general: true, results, varName: "p" };
  }
  return null;
};

// Cálculo de utilidad esperada para cada jugador dado p y q (solo para 2 jugadores)
const calcExpectedUtility = (matrix, playerIdx, p, q, numRows, numCols) => {
  // Utilidad esperada de J1 con probabilidades q de J2
  if (playerIdx === 0 && q !== null) {
    return matrix.map((row, i) => {
      const eu = row.reduce((sum, cell, j) => {
        const prob = j === 0 ? q : (1 - q); // solo 2 columnas por ahora
        return sum + getVal(cell, 0) * prob;
      }, 0);
      return { label: `Fila ${i + 1}`, eu: eu.toFixed(4) };
    });
  }
  // Utilidad esperada de J2 con probabilidades p de J1
  if (playerIdx === 1 && p !== null) {
    return colNames => colNames.map((_, j) => {
      const eu = matrix.reduce((sum, row, i) => {
        const prob = i === 0 ? p : (1 - p);
        return sum + getVal(row[j], 1) * prob;
      }, 0);
      return { label: `Col ${j + 1}`, eu: eu.toFixed(4) };
    });
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
const mixedJ2 = !hasENEP ? calcMixedStrategy(matrix, 0, rowNames, colNames) : null;
const mixedJ1 = !hasENEP ? calcMixedStrategy(matrix, 1, rowNames, colNames) : null;

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
  const AnalysisENEM = () => {
  const renderMixed = (mixed, playerColor, playerBgColor, jugador, controla) => {
    if (!mixed) return (
      <div style={s.card}>
        <p style={{ fontSize: 13, color: "#dc2626" }}>No se pudo calcular — denominador cero.</p>
      </div>
    );

    if (mixed.general) return (
      <div style={s.card}>
        <div style={{ ...s.playerTag, background: playerBgColor, color: playerColor, border: `1px solid ${playerColor}33`, marginBottom: 12 }}>
          Encontrar {mixed.varName} — {jugador}
        </div>
        <p style={s.stepText}>Matriz {numRows}×{numCols} — sistema de ecuaciones ({controla}):</p>
        {mixed.results.map((r, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
              Igualar {r.pair[0]} con {r.pair[1]}:
            </p>
            <div style={stepBox}>{r.expr0} = {r.expr1}</div>
            <div style={stepBox}>{r.diffExpr}</div>
          </div>
        ))}
        <p style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
          Resolver con la restricción {mixed.varName}1 + {mixed.varName}2 + ... = 1
        </p>
      </div>
    );

    // Caso 2x2 — paso a paso algebraico
    const items = mixed.rows || mixed.cols;
    return (
      <div style={s.card}>
        <div style={{ ...s.playerTag, background: playerBgColor, color: playerColor, border: `1px solid ${playerColor}33`, marginBottom: 12 }}>
          Encontrar {mixed.varName} — utilidad de {jugador} ({controla})
        </div>

        {/* Paso 1: Expresiones por estrategia */}
        <p style={stepLabel}>Paso 1 — Expresar utilidad esperada por estrategia</p>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "#6b7280", minWidth: 80 }}>{item.name}:</span>
            <code style={codeStyle}>{item.expr}</code>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>→</span>
            <code style={codeStyle}>{item.simplified}</code>
          </div>
        ))}

        {/* Paso 2: Igualar */}
        <p style={{ ...stepLabel, marginTop: 14 }}>Paso 2 — Igualar utilidades</p>
        <div style={stepBox}>{mixed.equalStep}</div>

        {/* Paso 3: Simplificar */}
        <p style={{ ...stepLabel, marginTop: 10 }}>Paso 3 — Simplificar</p>
        <div style={stepBox}>{mixed.simplStep}</div>

        {/* Paso 4: Despejar */}
        <p style={{ ...stepLabel, marginTop: 10 }}>Paso 4 — Despejar {mixed.varName}</p>
        <div style={stepBox}>{mixed.solveStep}</div>

        {/* Resultado */}
        <div style={{
          ...s.verifyBox,
          marginTop: 12,
          background: mixed.valid ? playerBgColor : "#fef2f2",
          borderColor: mixed.valid ? playerColor + "66" : "#dc2626",
          color: mixed.valid ? playerColor : "#dc2626",
          fontSize: 15,
          fontWeight: 700,
          fontFamily: "monospace"
        }}>
          {mixed.valid
            ? `${mixed.varName} = ${mixed.prob.toFixed(4)}     1-${mixed.varName} = ${mixed.complement.toFixed(4)}`
            : `${mixed.varName} fuera de rango [0,1] — revisar matriz`
          }
        </div>
      </div>
    );
  };

  return (
    <div>
      <p style={s.sectionLabel}>Cálculo de estrategias mixtas</p>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
        No existe equilibrio en estrategias puras. Se calculan las probabilidades con las que
        cada jugador hace indiferente al otro entre sus estrategias.
      </p>

      {/* J1 — encontrar q */}
      {renderMixed(mixedJ2, playerColors[1], playerBg[1], colGroup, "columnas de J2")}

      {/* J2 — encontrar p */}
      {renderMixed(mixedJ1, playerColors[0], playerBg[0], rowGroup, "filas de J1")}

      {/* Resultado final */}
      {mixedJ2 && mixedJ1 && !mixedJ2.general && !mixedJ1.general && mixedJ2.valid && mixedJ1.valid && (
        <div style={{ ...s.verifyBox, fontSize: 14, fontWeight: 600, background: "#eff6ff", borderColor: "#2563eb", color: "#1d4ed8" }}>
          Equilibrio de Nash mixto → J1: ({mixedJ1.prob.toFixed(3)}, {mixedJ1.complement.toFixed(3)}) | J2: ({mixedJ2.prob.toFixed(3)}, {mixedJ2.complement.toFixed(3)})
        </div>
      )}
    </div>
  );
};

// Estilos auxiliares para AnalysisENEM — agrégalos fuera del componente
const stepLabel = {
  fontSize: 11,
  fontWeight: 600,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 6,
  marginTop: 0
};

const stepBox = {
  fontFamily: "monospace",
  fontSize: 13,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  padding: "7px 12px",
  marginBottom: 4,
  color: "#374151"
};

const codeStyle = {
  fontFamily: "monospace",
  fontSize: 13,
  background: "#f1f5f9",
  borderRadius: 5,
  padding: "3px 8px",
  color: "#374151"
};

  // ── TAB 3: CONCLUSIONES ───────────────────────────────────────
  const TabConclusions = () => {
  // Utilidades esperadas en equilibrio mixto
  const euJ1 = !hasENEP && mixedJ1 && !mixedJ1.general && mixedJ1.valid
    ? colNames.map((_, j) => {
        const eu = matrix.reduce((sum, row, i) => {
          const prob = i === 0 ? mixedJ1.prob : (1 - mixedJ1.prob);
          return sum + getVal(row[j], 0) * prob;
        }, 0);
        return { label: colNames[j], eu };
      })
    : null;

  const euJ2 = !hasENEP && mixedJ2 && !mixedJ2.general && mixedJ2.valid
    ? matrix.map((row, i) => {
        const eu = row.reduce((sum, cell, j) => {
          const prob = j === 0 ? mixedJ2.prob : (1 - mixedJ2.prob);
          return sum + getVal(cell, 1) * prob;
        }, 0);
        return { label: rowNames[i], eu };
      })
    : null;

  return (
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
            ? "Existe al menos una combinación de estrategias donde ningún jugador tiene incentivo a cambiar unilateralmente su decisión."
            : "Cada jugador debe aleatorizar entre sus estrategias con probabilidades específicas para que el otro sea indiferente entre las suyas."
          }
        </p>
      </div>

      {/* Por jugador */}
      {Array.from({ length: numPlayers }, (_, k) => {
        const label = k === 0 ? rowGroup : k === 1 ? colGroup : `Jugador ${k + 1}`;
        const controlled = k === 0 ? "filas" : k === 1 ? "columnas" : "estrategias globales";

        let recommendation = "";
        let perfil = null;

        if (hasENEP) {
          const bestStrategies = [...new Set(nashCells.map(c => k === 0 ? rowNames[c.i] : colNames[c.j]))];
          recommendation = `Estrategia${bestStrategies.length > 1 ? "s" : ""} óptima${bestStrategies.length > 1 ? "s" : ""}: ${bestStrategies.join(", ")}.`;
        } else {
          if (k === 0 && mixedJ1 && !mixedJ1.general && mixedJ1.valid) {
            recommendation = `Jugar ${rowNames[0]} con p = ${mixedJ1.prob.toFixed(3)} y ${rowNames[1] || "fila 2"} con 1-p = ${mixedJ1.complement.toFixed(3)}.`;
            perfil = {
              probs: [
                { label: rowNames[0], prob: mixedJ1.prob },
                { label: rowNames[1] || "Fila 2", prob: mixedJ1.complement }
              ],
              eu: euJ1
            };
          } else if (k === 1 && mixedJ2 && !mixedJ2.general && mixedJ2.valid) {
            recommendation = `Jugar ${colNames[0]} con q = ${mixedJ2.prob.toFixed(3)} y ${colNames[1] || "col 2"} con 1-q = ${mixedJ2.complement.toFixed(3)}.`;
            perfil = {
              probs: [
                { label: colNames[0], prob: mixedJ2.prob },
                { label: colNames[1] || "Col 2", prob: mixedJ2.complement }
              ],
              eu: euJ2
            };
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
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
              Controla las <strong>{controlled}</strong> de la matriz.
            </p>

            {/* Recomendación */}
            <div style={{ ...s.verifyBox, background: playerBg[k], borderColor: playerColors[k] + "44", color: playerColors[k], marginBottom: perfil ? 12 : 0 }}>
              {recommendation}
            </div>

            {/* Perfil de equilibrio — solo ENEM */}
            {perfil && (
              <>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginTop: 12, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Perfil de equilibrio
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  {perfil.probs.map((pr, idx) => (
                    <div key={idx} style={{
                      background: playerBg[k], border: `1px solid ${playerColors[k]}33`,
                      borderRadius: 10, padding: "8px 14px", textAlign: "center"
                    }}>
                      <div style={{ fontSize: 11, color: playerColors[k], fontWeight: 600, marginBottom: 2 }}>{pr.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: playerColors[k] }}>
                        {pr.prob.toFixed(3)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Utilidad esperada por estrategia */}
                {perfil.eu && (
                  <>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Utilidad esperada en equilibrio
                    </p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                      {perfil.eu.map((e, idx) => (
                        <div key={idx} style={{
                          background: "#f8fafc", border: "1px solid #e2e8f0",
                          borderRadius: 8, padding: "6px 12px",
                          fontSize: 13, color: "#374151"
                        }}>
                          <span style={{ color: "#6b7280", marginRight: 6 }}>{e.label}:</span>
                          <strong>{parseFloat(e.eu).toFixed(3)}</strong>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>
                      En equilibrio mixto, la utilidad esperada es igual en todas las estrategias — el jugador rival es indiferente.
                    </p>
                  </>
                )}
              </>
            )}
          </div>
        );
      })}

      {/* Perfil completo del juego — solo ENEM */}
      {!hasENEP && mixedJ1 && mixedJ2 && !mixedJ1.general && !mixedJ2.general && mixedJ1.valid && mixedJ2.valid && (
        <div style={{ ...s.card, border: "1px solid #bfdbfe", background: "#eff6ff" }}>
          <p style={{ ...s.cardTitle, color: "#1d4ed8" }}>Perfil de equilibrio del juego</p>
          <p style={{ fontSize: 13, color: "#1e40af", marginBottom: 10 }}>
            El equilibrio de Nash en estrategias mixtas es:
          </p>
          <div style={{ fontFamily: "monospace", fontSize: 14, color: "#1d4ed8", background: "#dbeafe", borderRadius: 8, padding: "10px 14px", marginBottom: 10 }}>
            J1: ({rowNames[0]} = {mixedJ1.prob.toFixed(3)}, {rowNames[1] || "fila 2"} = {mixedJ1.complement.toFixed(3)})
            {"  |  "}
            J2: ({colNames[0]} = {mixedJ2.prob.toFixed(3)}, {colNames[1] || "col 2"} = {mixedJ2.complement.toFixed(3)})
          </div>
          <p style={{ fontSize: 12, color: "#3b82f6", fontStyle: "italic" }}>
            Ningún jugador puede mejorar su utilidad esperada desviándose unilateralmente de este perfil.
          </p>
        </div>
      )}

      {/* Recomendación general */}
      <div style={{ ...s.card, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
        <p style={s.cardTitle}>Recomendación general</p>
        <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>
          {hasENEP && nashCells.length === 1
            ? `Existe un único equilibrio de Nash estable en (${rowNames[nashCells[0].i]}, ${colNames[nashCells[0].j]}). Esta es la solución racional predecible del juego — ambos jugadores convergerán a esta combinación bajo racionalidad común.`
            : hasENEP && nashCells.length > 1
            ? `Existen múltiples equilibrios de Nash. En juegos de suma cero esto implica equivalencia e intercambiabilidad — todos los equilibrios proporcionan las mismas utilidades. Cualquiera de ellos es igualmente válido.`
            : `Al no existir equilibrio puro, la solución requiere estrategias mixtas. Cada jugador debe aleatorizar para evitar ser explotado. Las probabilidades calculadas garantizan que ningún jugador pueda mejorar cambiando su distribución.`
          }
        </p>
      </div>
    </div>
  );
};

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
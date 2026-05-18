import React, { useState } from "react";
import { isFiniteNumber, toFiniteNumber } from "../../utils/validation";

const playerColors = ["#2563eb", "#dc2626", "#16a34a", "#9333ea", "#ea580c", "#0891b2"];
const playerBg     = ["#eff6ff", "#fef2f2", "#f0fdf4", "#faf5ff", "#fff7ed", "#ecfeff"];

const getVal = (cell, k) => toFiniteNumber(cell?.[k], NaN);

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

// Calculo ENEM
// Para matriz NxM: resuelve sistema lineal igualando resultados
const calcMixedStrategy = (matrix, playerIdx, rowNames, colNames) => {
  const numRows = matrix.length;
  const numCols = colNames.length;

  if (playerIdx === 0) {
    if (numCols === 2) {
      const a = getVal(matrix[0][0], 0);
      const b = getVal(matrix[0][1], 0);
      const c = getVal(matrix[1][0], 0);
      const d = getVal(matrix[1][1], 0);

      const exprRow0 = `${a}q + ${b}(1-q)`;
      const exprRow1 = `${c}q + ${d}(1-q)`;

      const coef0 = a - b;
      const coef1 = c - d;
      const simplRow0 = `${coef0}q + ${b}`;
      const simplRow1 = `${coef1}q + ${d}`;

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
        expr0: terms.map((t, j) => `${t.v0}*q${j + 1}`).join(" + "),
        expr1: terms.map((t, j) => `${t.v1}*q${j + 1}`).join(" + "),
        diffExpr: terms.map((t, j) => `${t.diff >= 0 ? "+" : ""}${t.diff}*q${j + 1}`).join(" ") + " = 0"
      });
    }
    return { general: true, results, varName: "q" };
  }

  if (playerIdx === 1) {
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
        expr0: terms.map((t, i) => `${t.v0}*p${i + 1}`).join(" + "),
        expr1: terms.map((t, i) => `${t.v1}*p${i + 1}`).join(" + "),
        diffExpr: terms.map((t, i) => `${t.diff >= 0 ? "+" : ""}${t.diff}*p${i + 1}`).join(" ") + " = 0"
      });
    }
    return { general: true, results, varName: "p" };
  }
  return null;
};

const TABS = ["Matriz", "Explicacion", "Conclusiones"];

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

const NashAnalysis = ({ nashData, onBack }) => {
  const [activeTab, setActiveTab] = useState(0);

  if (!nashData) return (
    <div style={s.container}>
      <p style={{ color: "#6b7280" }}>No hay datos. Regresa a la matriz e ingresa los valores.</p>
      <button style={s.backBtn} onClick={onBack}>Volver</button>
    </div>
  );

  const { matrix, rowNames, colNames, rowGroup, colGroup, numPlayers } = nashData;
  const numRows = matrix.length;
  const numCols = colNames.length;
  const matrixHasInvalidValue = matrix.some((row) => row.some((cell) => cell.some((value) => !isFiniteNumber(toFiniteNumber(value, NaN)))));
  const analysisBlocked = matrixHasInvalidValue;

  if (analysisBlocked) {
    return (
      <div style={s.container}>
        <p style={{ color: "#991b1b" }}>⚠ El análisis de Nash requiere una matriz completa con números finitos en todas las celdas.</p>
        <button style={s.backBtn} onClick={onBack}>Volver</button>
      </div>
    );
  }

  // Celdas Nash
  const nashCells = [];
  for (let i = 0; i < numRows; i++)
    for (let j = 0; j < numCols; j++)
      if (isNashCell(matrix, i, j, numPlayers))
        nashCells.push({ i, j, values: matrix[i][j].map(v => toFiniteNumber(v, NaN)) });

  const isNash = (i, j) => nashCells.some(c => c.i === i && c.j === j);
  const hasENEP = nashCells.length > 0;

  const uniqueMaxIndexInColumn = (k, j) => {
    const values = matrix.map((row) => getVal(row[j], k));
    if (values.some((v) => !Number.isFinite(v))) return null;
    const maxVal = Math.max(...values);
    const count = values.filter((v) => v === maxVal).length;
    if (count !== 1) return null;
    return values.findIndex((v) => v === maxVal);
  };

  const uniqueMaxIndexInRow = (k, i) => {
    const values = matrix[i].map((cell) => getVal(cell, k));
    if (values.some((v) => !Number.isFinite(v))) return null;
    const maxVal = Math.max(...values);
    const count = values.filter((v) => v === maxVal).length;
    if (count !== 1) return null;
    return values.findIndex((v) => v === maxVal);
  };

  const colBestIndexByPlayer = Array.from({ length: numPlayers }, (_, k) =>
    colNames.map((_, j) => uniqueMaxIndexInColumn(k, j))
  );
  const rowBestIndexByPlayer = Array.from({ length: numPlayers }, (_, k) =>
    matrix.map((_, i) => uniqueMaxIndexInRow(k, i))
  );

  const isColMax = (i, j, k) => colBestIndexByPlayer[k]?.[j] === i;
  const isRowMax = (i, j, k) => rowBestIndexByPlayer[k]?.[i] === j;

  const hasTieAny = colBestIndexByPlayer.some((cols) => cols.some((idx) => idx === null)) ||
    rowBestIndexByPlayer.some((rows) => rows.some((idx) => idx === null));

  const getColumnValues = (j, k) => matrix.map((row) => getVal(row[j], k));
  const getRowValues = (i, k) => matrix[i].map((cell) => getVal(cell, k));

  // Calculo ENEM
  const mixedJ2 = !hasENEP ? calcMixedStrategy(matrix, 0, rowNames, colNames) : null;
  const mixedJ1 = !hasENEP ? calcMixedStrategy(matrix, 1, rowNames, colNames) : null;

  const renderTab = () => {
    switch (activeTab) {
      case 0: return <TabMatrix />;
      case 1: return <TabAnalysis />;
      case 2: return <TabConclusions />;
      default: return null;
    }
  };

  // TAB 1: MATRIZ
  const TabMatrix = () => (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <span style={hasENEP ? s.badgeENEP : s.badgeENEM}>
          {hasENEP ? "ENEP - Hay una respuesta clara" : "ENEM - Hay que mezclar estrategias"}
        </span>
      </div>

      <div style={s.legendRow}>
        {Array.from({ length: numPlayers }, (_, k) => (
          <div key={k} style={s.legendItem}>
            <div style={{ ...s.circle, background: playerColors[k], width: 14, height: 14 }} />
            <span style={{ fontSize: 12, color: "#374151" }}>
              Mejor opcion de J{k + 1} {k === 0 ? `(${rowGroup})` : k === 1 ? `(${colGroup})` : ""}
            </span>
          </div>
        ))}
        <div style={s.legendItem}>
          <div style={{ width: 14, height: 14, borderRadius: 3, border: "2px solid #16a34a", background: "#d1fae5" }} />
          <span style={{ fontSize: 12, color: "#374151" }}>Punto donde ambos coinciden</span>
        </div>
        {hasTieAny && (
          <div style={s.legendItem}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>Si hay empate, no se marca un maximo.</span>
          </div>
        )}
      </div>


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

      {hasENEP && (
        <div style={s.card}>
          <p style={s.cardTitle}>Puntos donde ambos coinciden</p>
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

      <div style={s.card}>
        <p style={s.cardTitle}>Explicacion del resultado</p>
        <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, marginTop: 6 }}>
          1) Para J1: en cada columna se marca el numero mas alto porque es la mejor opcion de J1 en esa columna.
        </p>
        <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, marginTop: 6 }}>
          2) Para J2: en cada fila se marca el numero mas alto porque es la mejor opcion de J2 en esa fila.
        </p>
        <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, marginTop: 6 }}>
          3) Cuando ambos numeros marcados caen en la misma celda, esa celda se pinta de verde.
        </p>
        <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, marginTop: 6 }}>
          {hasENEP
            ? "Como existe al menos una celda verde, decimos que hay ENEP."
            : "Como no hay celdas verdes, decimos que hay ENEM y se necesita mezclar opciones."}
        </p>
        <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, marginTop: 6 }}>
          {hasENEP
            ? "ENEP significa que hay una respuesta clara donde ninguno gana mas si cambia solo. Es decir: si uno cambia y el otro no, no mejora el resultado."
            : "ENEM significa que no hay un punto fijo y por eso se deben mezclar opciones."}
        </p>
        {hasTieAny && (
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
            Si hay empate en una fila o columna, no se marca ninguna porque no hay una mejor opcion unica.
          </p>
        )}
      </div>
    </div>
  );

  // TAB 2: ANALISIS
  const TabAnalysis = () => (
    <div>
      <div style={{ ...s.card, background: "#f8fafc", border: "1px solid #e5e7eb" }}>
        <p style={s.cardTitle}>Guia visual rapida</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 220px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: 12 }}>
            <p style={{ margin: 0, fontSize: 12, color: "#1e3a8a", fontWeight: 700 }}>Paso 1</p>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "#1e3a8a" }}>
              En cada columna, encerramos el numero mas alto de J1.
            </p>
          </div>
          <div style={{ flex: "1 1 220px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: 12 }}>
            <p style={{ margin: 0, fontSize: 12, color: "#7f1d1d", fontWeight: 700 }}>Paso 2</p>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "#7f1d1d" }}>
              En cada fila, encerramos el numero mas alto de J2.
            </p>
          </div>
          <div style={{ flex: "1 1 220px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: 12 }}>
            <p style={{ margin: 0, fontSize: 12, color: "#14532d", fontWeight: 700 }}>Paso 3</p>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "#14532d" }}>
              Si ambos quedan en la misma celda, se pinta en verde.
            </p>
          </div>
        </div>
      </div>
      <div style={{ ...s.card, background: "#fff", border: "1px solid #e5e7eb" }}>
        <p style={s.cardTitle}>Ejemplo rapido</p>
        {hasENEP && nashCells.length > 0 ? (
          <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.6 }}>
            En la celda ({rowNames[nashCells[0].i]}, {colNames[nashCells[0].j]}) coinciden ambos. Por eso se marca en verde y hay ENEP.
          </p>
        ) : (
          <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.6 }}>
            No hay ninguna celda donde ambos coincidan. Por eso no hay ENEP y se usa mezcla de opciones.
          </p>
        )}
      </div>
      {hasTieAny && (
        <div style={{ ...s.card, background: "#fff7ed", border: "1px solid #fdba74" }}>
          <p style={s.cardTitle}>Empates detectados</p>
          <p style={{ fontSize: 13, color: "#7c2d12", margin: 0 }}>
            Hay empates en algunos maximos, por eso no se marca una mejor opcion en esas filas o columnas.
          </p>
        </div>
      )}
      {hasENEP ? <AnalysisENEP /> : <AnalysisENEM />}
    </div>
  );

  // ENEP: verificacion de mejor respuesta
  const AnalysisENEP = () => (
    <div>
      <p style={s.sectionLabel}>Paso a paso</p>
      {nashCells.map((nc, idx) => (
        <div key={idx} style={s.card}>
          <p style={s.cardTitle}>Equilibrio E{idx + 1}: ({rowNames[nc.i]}, {colNames[nc.j]})</p>

          <div style={s.playerBlock}>
            <div style={{ ...s.playerTag, background: playerBg[0], color: playerColors[0], border: `1px solid ${playerColors[0]}33` }}>
              J1 - {rowGroup}
            </div>
            <p style={s.stepText}>Si J1 se queda en la columna <strong>{colNames[nc.j]}</strong>, comparamos que fila le conviene mas:</p>
            {matrix.map((row, i) => {
              const v = getVal(row[nc.j], 0);
              const isBest = i === nc.i;
              return (
                <div key={i} style={{ ...s.stepRow, background: isBest ? "#eff6ff" : "transparent" }}>
                  <span style={{ fontSize: 13, color: "#374151", minWidth: 120 }}>{rowNames[i]}</span>
                  <span style={{ fontSize: 13, fontWeight: isBest ? 700 : 400, color: isBest ? playerColors[0] : "#6b7280" }}>
                    {v} {isBest ? "- es la mejor opcion" : ""}
                  </span>
                </div>
              );
            })}
            <p style={s.conclusionText}>
              J1 no gana mas cambiando de fila. Se queda donde esta.
            </p>
          </div>

          {numPlayers >= 2 && (
            <div style={s.playerBlock}>
              <div style={{ ...s.playerTag, background: playerBg[1], color: playerColors[1], border: `1px solid ${playerColors[1]}33` }}>
                J2 - {colGroup}
              </div>
              <p style={s.stepText}>Si J2 se queda en la fila <strong>{rowNames[nc.i]}</strong>, comparamos que columna le conviene mas:</p>
              {colNames.map((col, j) => {
                const v = getVal(matrix[nc.i][j], 1);
                const isBest = j === nc.j;
                return (
                  <div key={j} style={{ ...s.stepRow, background: isBest ? "#fef2f2" : "transparent" }}>
                    <span style={{ fontSize: 13, color: "#374151", minWidth: 120 }}>{col}</span>
                    <span style={{ fontSize: 13, fontWeight: isBest ? 700 : 400, color: isBest ? playerColors[1] : "#6b7280" }}>
                      {v} {isBest ? "- es la mejor opcion" : ""}
                    </span>
                  </div>
                );
              })}
              <p style={s.conclusionText}>
                J2 no gana mas cambiando de columna. Se queda donde esta.
              </p>
            </div>
          )}

          <div style={s.verifyBox}>
            Nadie mejora si se mueve solo. Por eso este punto es estable.
          </div>
        </div>
      ))}
    </div>
  );

  // ENEM: calculo de estrategias mixtas
  const AnalysisENEM = () => {
    const renderMixed = (mixed, playerColor, playerBgColor, jugador, controla) => {
      if (!mixed) return (
        <div style={s.card}>
          <p style={{ fontSize: 13, color: "#dc2626" }}>No se pudo calcular con estos datos. Revisa los valores.</p>
        </div>
      );

      if (mixed.general) return (
        <div style={s.card}>
          <div style={{ ...s.playerTag, background: playerBgColor, color: playerColor, border: `1px solid ${playerColor}33`, marginBottom: 12 }}>
            Encontrar {mixed.varName} - {jugador}
          </div>
          <p style={s.stepText}>Para una matriz {numRows}x{numCols}, armamos las ecuaciones ({controla}):</p>
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
            Al final, las probabilidades deben sumar 1.
          </p>
        </div>
      );

      const items = mixed.rows || mixed.cols;
      const optionNames = mixed.varName === "q" ? colNames : rowNames;
      const primaryOption = optionNames[0] || "Opcion 1";
      const secondaryOption = optionNames[1] || "Opcion 2";
      return (
        <div style={s.card}>
          <div style={{ ...s.playerTag, background: playerBgColor, color: playerColor, border: `1px solid ${playerColor}33`, marginBottom: 12 }}>
            Encontrar {mixed.varName} - probabilidades de {jugador} ({controla})
          </div>

          <p style={stepLabel}>Paso 1 - Escribir que gana cada opcion</p>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "#6b7280", minWidth: 80 }}>{item.name}:</span>
              <code style={codeStyle}>{item.expr}</code>
              <span style={{ fontSize: 12, color: "#9ca3af" }}>simplifica a</span>
              <code style={codeStyle}>{item.simplified}</code>
            </div>
          ))}

          <p style={{ ...stepLabel, marginTop: 14 }}>Paso 2 - Igualar para que nadie tenga ventaja</p>
          <div style={stepBox}>{mixed.equalStep}</div>

          <p style={{ ...stepLabel, marginTop: 10 }}>Paso 3 - Simplificar la cuenta</p>
          <div style={stepBox}>{mixed.simplStep}</div>

          <p style={{ ...stepLabel, marginTop: 10 }}>Paso 4 - Resolver la probabilidad</p>
          <div style={stepBox}>{mixed.solveStep}</div>

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
              : `${mixed.varName} queda fuera de 0 a 1. Revisa los datos.`
            }
          </div>

          {mixed.valid && (
            <div style={{ marginTop: 10, fontSize: 13, color: "#374151" }}>
              Usa <strong>{primaryOption}</strong> con {mixed.prob.toFixed(4)} y <strong>{secondaryOption}</strong> con {mixed.complement.toFixed(4)}.
            </div>
          )}
        </div>
      );
    };

    return (
      <div>
        <p style={s.sectionLabel}>Cuando no hay un punto claro</p>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
          No hay un lugar fijo donde ambos se queden. Entonces cada jugador mezcla sus opciones con probabilidades.
        </p>

        <div style={{ ...s.card, background: "#f8fafc", border: "1px solid #e5e7eb" }}>
          <p style={s.cardTitle}>Guia rapida</p>
          <p style={{ fontSize: 13, color: "#374151", marginBottom: 6 }}>
            1) Buscamos probabilidades para que el rival no tenga una opcion claramente mejor.
          </p>
          <p style={{ fontSize: 13, color: "#374151", marginBottom: 6 }}>
            2) Igualamos las ganancias de sus opciones.
          </p>
          <p style={{ fontSize: 13, color: "#374151", marginBottom: 0 }}>
            3) Resolvemos y obtenemos la mezcla recomendada.
          </p>
        </div>

        {renderMixed(mixedJ2, playerColors[1], playerBg[1], colGroup, "columnas de J2")}
        {renderMixed(mixedJ1, playerColors[0], playerBg[0], rowGroup, "filas de J1")}

        {mixedJ2 && mixedJ1 && !mixedJ2.general && !mixedJ1.general && mixedJ2.valid && mixedJ1.valid && (
          <div style={{ ...s.verifyBox, fontSize: 14, fontWeight: 600, background: "#eff6ff", borderColor: "#2563eb", color: "#1d4ed8" }}>
            Mezcla recomendada: J1 usa ({mixedJ1.prob.toFixed(4)}, {mixedJ1.complement.toFixed(4)}) y J2 usa ({mixedJ2.prob.toFixed(4)}, {mixedJ2.complement.toFixed(4)})
          </div>
        )}
      </div>
    );
  };

  // TAB 3: CONCLUSIONES
  const TabConclusions = () => {
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
        <p style={s.sectionLabel}>Conclusiones claras</p>

        <div style={s.card}>
          <p style={s.cardTitle}>Tipo de resultado</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
            <span style={hasENEP ? s.badgeENEP : s.badgeENEM}>
              {hasENEP ? "ENEP" : "ENEM"}
            </span>
            <span style={{ fontSize: 13, color: "#374151", alignSelf: "center" }}>
              {hasENEP
                ? `Se encontraron ${nashCells.length} punto${nashCells.length > 1 ? "s" : ""} donde ambos se quedan.`
                : "No hay un punto fijo. Hay que mezclar decisiones con probabilidades."}
            </span>
          </div>
          <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
            {hasENEP
              ? "Hay al menos una combinacion donde, si uno cambia y el otro no, no mejora el resultado."
              : "Nadie tiene una opcion claramente mejor todo el tiempo, por eso conviene alternar entre opciones con probabilidades."
            }
          </p>
        </div>

        {Array.from({ length: numPlayers }, (_, k) => {
          const label = k === 0 ? rowGroup : k === 1 ? colGroup : `Jugador ${k + 1}`;
          const controlled = k === 0 ? "filas" : k === 1 ? "columnas" : "decisiones del jugador";

          let recommendation = "";
          let perfil = null;

          if (hasENEP) {
            const bestStrategies = [...new Set(nashCells.map(c => k === 0 ? rowNames[c.i] : colNames[c.j]))];
            recommendation = `Opciones recomendadas: ${bestStrategies.join(", ")}.`;
          } else {
            if (k === 0 && mixedJ1 && !mixedJ1.general && mixedJ1.valid) {
              recommendation = `Usa ${rowNames[0]} con ${mixedJ1.prob.toFixed(4)} y ${rowNames[1] || "fila 2"} con ${mixedJ1.complement.toFixed(4)}.`;
              perfil = {
                probs: [
                  { label: rowNames[0], prob: mixedJ1.prob },
                  { label: rowNames[1] || "Fila 2", prob: mixedJ1.complement }
                ],
                eu: euJ1
              };
            } else if (k === 1 && mixedJ2 && !mixedJ2.general && mixedJ2.valid) {
              recommendation = `Usa ${colNames[0]} con ${mixedJ2.prob.toFixed(4)} y ${colNames[1] || "col 2"} con ${mixedJ2.complement.toFixed(4)}.`;
              perfil = {
                probs: [
                  { label: colNames[0], prob: mixedJ2.prob },
                  { label: colNames[1] || "Col 2", prob: mixedJ2.complement }
                ],
                eu: euJ2
              };
            } else {
              recommendation = "Necesitas resolver las probabilidades antes de dar una recomendacion.";
            }
          }

          return (
            <div key={k} style={s.card}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: playerColors[k] }} />
                <p style={{ ...s.cardTitle, margin: 0 }}>J{k + 1} - {label}</p>
              </div>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
                Controla las <strong>{controlled}</strong> en la tabla.
              </p>

              <div style={{ ...s.verifyBox, background: playerBg[k], borderColor: playerColors[k] + "44", color: playerColors[k], marginBottom: perfil ? 12 : 0 }}>
                {recommendation}
              </div>

              <p style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                {hasENEP
                  ? "Sugerencia: elige una de estas opciones y mantenla cuando el otro no cambie. Es la forma mas estable."
                  : "Sugerencia: no te quedes siempre con una sola opcion, alterna segun las probabilidades."}
              </p>

              <p style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                {hasENEP
                  ? "Si el otro jugador cambia, revisa estos mismos puntos porque son los que mejor te protegen."
                  : "Si el otro jugador se vuelve predecible, puedes ajustar y ganar mas."}
              </p>

              {hasENEP && nashCells.length > 0 && (
                <p style={{ fontSize: 12, color: "#475569", marginTop: 6 }}>
                  {k === 0 ? (() => {
                    const c = nashCells[0];
                    const values = getColumnValues(c.j, 0);
                    const maxVal = Math.max(...values);
                    return `Ejemplo: si J2 usa ${colNames[c.j]}, a J1 le conviene ${rowNames[c.i]} porque ${maxVal} es el numero mas alto de esa columna.`;
                  })() : (() => {
                    const c = nashCells[0];
                    const values = getRowValues(c.i, 1);
                    const maxVal = Math.max(...values);
                    return `Ejemplo: si J1 usa ${rowNames[c.i]}, a J2 le conviene ${colNames[c.j]} porque ${maxVal} es el numero mas alto de esa fila.`;
                  })()}
                </p>
              )}

              {perfil && (
                <>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginTop: 12, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Probabilidades recomendadas
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                    {perfil.probs.map((pr, idx) => (
                      <div key={idx} style={{
                        background: playerBg[k], border: `1px solid ${playerColors[k]}33`,
                        borderRadius: 10, padding: "8px 14px", textAlign: "center"
                      }}>
                        <div style={{ fontSize: 11, color: playerColors[k], fontWeight: 600, marginBottom: 2 }}>{pr.label}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: playerColors[k] }}>
                          {pr.prob.toFixed(4)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {perfil.eu && (
                    <>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Ganancia promedio
                      </p>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                        {perfil.eu.map((e, idx) => (
                          <div key={idx} style={{
                            background: "#f8fafc", border: "1px solid #e2e8f0",
                            borderRadius: 8, padding: "6px 12px",
                            fontSize: 13, color: "#374151"
                          }}>
                            <span style={{ color: "#6b7280", marginRight: 6 }}>{e.label}:</span>
                            <strong>{parseFloat(e.eu).toFixed(4)}</strong>
                          </div>
                        ))}
                      </div>
                      <p style={{ fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>
                        En este punto, al rival le da lo mismo que opcion elija.
                      </p>
                    </>
                  )}
                </>
              )}
            </div>
          );
        })}

        {!hasENEP && mixedJ1 && mixedJ2 && !mixedJ1.general && !mixedJ2.general && mixedJ1.valid && mixedJ2.valid && (
          <div style={{ ...s.card, border: "1px solid #bfdbfe", background: "#eff6ff" }}>
            <p style={{ ...s.cardTitle, color: "#1d4ed8" }}>Resumen del juego</p>
            <p style={{ fontSize: 13, color: "#1e40af", marginBottom: 10 }}>
              Las probabilidades finales quedan asi:
            </p>
            <div style={{ fontFamily: "monospace", fontSize: 14, color: "#1d4ed8", background: "#dbeafe", borderRadius: 8, padding: "10px 14px", marginBottom: 10 }}>
              J1: ({rowNames[0]} = {mixedJ1.prob.toFixed(4)}, {rowNames[1] || "fila 2"} = {mixedJ1.complement.toFixed(4)})
              {"  |  "}
              J2: ({colNames[0]} = {mixedJ2.prob.toFixed(4)}, {colNames[1] || "col 2"} = {mixedJ2.complement.toFixed(4)})
            </div>
            <p style={{ fontSize: 12, color: "#3b82f6", fontStyle: "italic" }}>
              Si alguien se sale de esta mezcla, el otro puede responder y ganar mas.
            </p>
          </div>
        )}

        <div style={{ ...s.card, background: "#f1f5f9", border: "1px solid #cbd5f5", boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)" }}>
          <p style={s.cardTitle}>Recomendacion general</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <span style={{ background: "#e2e8f0", color: "#1f2937", padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, whiteSpace: "normal", lineHeight: 1.3 }}>
              {hasENEP ? "Hay punto estable" : "No hay punto estable"}
            </span>
            <span style={{ background: "#e2e8f0", color: "#1f2937", padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, whiteSpace: "normal", lineHeight: 1.3 }}>
              {hasENEP && nashCells.length > 1 ? "Varios puntos" : "Un solo punto"}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
            <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, boxShadow: "0 6px 14px rgba(15, 23, 42, 0.06)", minHeight: 120 }}>
              <p style={{ margin: 0, fontSize: 12, color: "#1e40af", fontWeight: 800, letterSpacing: "0.04em", whiteSpace: "normal", lineHeight: 1.2, wordBreak: "break-word" }}>Que hacer</p>
              <p style={{ margin: "8px 0 0", fontSize: 14, color: "#0f172a", lineHeight: 1.6, wordBreak: "break-word", whiteSpace: "normal" }}>
                {hasENEP && nashCells.length === 1
                  ? `Usa (${rowNames[nashCells[0].i]}, ${colNames[nashCells[0].j]}) como decision principal.`
                  : hasENEP && nashCells.length > 1
                  ? "Elige el punto que mas te convenga segun tu objetivo."
                  : "Usa la mezcla de probabilidades y no te quedes con una sola opcion."}
              </p>
              <p style={{ margin: "8px 0 0", fontSize: 12, color: "#475569" }}>
                {hasENEP && nashCells.length > 0
                  ? `Ejemplo: si eliges (${rowNames[nashCells[0].i]}, ${colNames[nashCells[0].j]}), ambos quedan en el punto estable.`
                  : "Ejemplo: alterna tus opciones para no volverte predecible."}
              </p>
            </div>
            <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, boxShadow: "0 6px 14px rgba(15, 23, 42, 0.06)", minHeight: 120 }}>
              <p style={{ margin: 0, fontSize: 12, color: "#0f766e", fontWeight: 800, letterSpacing: "0.04em", whiteSpace: "normal", lineHeight: 1.2, wordBreak: "break-word" }}>Por que</p>
              <p style={{ margin: "8px 0 0", fontSize: 14, color: "#0f172a", lineHeight: 1.6, wordBreak: "break-word", whiteSpace: "normal" }}>
                {hasENEP
                  ? "Es la opcion mas estable: si el otro no cambia, tu tampoco pierdes." 
                  : "Si siempre repites una sola opcion, el otro puede aprovecharse."}
              </p>
              <p style={{ margin: "8px 0 0", fontSize: 12, color: "#475569" }}>
                {hasENEP
                  ? "Ejemplo: si el otro mantiene su decision, tu resultado no empeora."
                  : "Ejemplo: si repites siempre lo mismo, el otro puede ajustarse y ganar mas."}
              </p>
            </div>
            <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, boxShadow: "0 6px 14px rgba(15, 23, 42, 0.06)", minHeight: 120 }}>
              <p style={{ margin: 0, fontSize: 12, color: "#b45309", fontWeight: 800, letterSpacing: "0.04em", whiteSpace: "normal", lineHeight: 1.2, wordBreak: "break-word" }}>Que evitar</p>
              <p style={{ margin: "8px 0 0", fontSize: 14, color: "#0f172a", lineHeight: 1.6, wordBreak: "break-word", whiteSpace: "normal" }}>
                {hasENEP
                  ? "Evita cambiar sin necesidad si el otro jugador no cambia."
                  : "Evita jugar siempre la misma opcion. Eso te vuelve predecible."}
              </p>
              <p style={{ margin: "8px 0 0", fontSize: 12, color: "#475569" }}>
                {hasENEP
                  ? "Ejemplo: no cambies a otra opcion si ya estas en el punto estable."
                  : "Ejemplo: no repitas siempre la misma jugada."}
              </p>
            </div>
          </div>
          <div style={{ marginTop: 12, background: "#e0f2fe", border: "1px dashed #7dd3fc", borderRadius: 12, padding: 12 }}>
            <p style={{ margin: 0, fontSize: 13, color: "#0c4a6e", wordBreak: "break-word" }}>
              {hasENEP && nashCells.length > 0
                ? `Ejemplo final: J1 usa ${rowNames[nashCells[0].i]} y J2 usa ${colNames[nashCells[0].j]}. Los valores son J1=${nashCells[0].values[0]} y J2=${nashCells[0].values[1]}. Si J1 cambia solo, su valor no sube; si J2 cambia solo, tampoco mejora.`
                : "Ejemplo final: si uno siempre repite lo mismo, el otro puede elegir la respuesta que mas le conviene y sacar ventaja."}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={s.container}>
      <h2 style={s.title}>Explicacion - Equilibrio de Nash</h2>

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

      <button style={s.backBtn} onClick={onBack}>Volver a la Matriz</button>
    </div>
  );
};

export default NashAnalysis;

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
  table:        { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
  corner:       { background: "#0f172a", padding: "12px" },
  groupHeader:  { background: "#0f172a", color: "#fff", padding: "12px", textAlign: "center", fontWeight: "700" },
  groupSide:    { background: "#0f172a", color: "#fff", textAlign: "center", padding: "10px", fontWeight: "700" },
  header:       { background: "#f1f5f9", padding: "10px", textAlign: "center", fontWeight: "700" },
  rowHeader:    { background: "#f8fafc", padding: "10px 14px", fontWeight: "700", minWidth: "130px" },
  cell:         { textAlign: "center", padding: "10px 8px" },
  cellInner:    { display: "flex", gap: "6px", justifyContent: "center", alignItems: "center" },
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
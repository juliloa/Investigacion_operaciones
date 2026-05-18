import React from "react";
import { isFiniteNumber, toFiniteNumber } from "../../utils/validation";

const isNashCell = (matrix, r, c, n) => {
  const getVal = (cell, k) => toFiniteNumber(cell?.[k], NaN);
  const cell = matrix[r][c];
  if (!cell || cell.some((value) => !isFiniteNumber(toFiniteNumber(value, NaN)))) {
    return false;
  }
  for (let k = 0; k < n; k++) {
    const myPayoff = getVal(cell, k);
    if (!Number.isFinite(myPayoff)) return false;
    if (k === 0) {
      for (let i = 0; i < matrix.length; i++)
        if (getVal(matrix[i][c], k) > myPayoff) return false;
    } else if (k === 1) {
      for (let j = 0; j < matrix[r].length; j++)
        if (getVal(matrix[r][j], k) > myPayoff) return false;
    } else {
      for (let i = 0; i < matrix.length; i++)
        for (let j = 0; j < matrix[i].length; j++)
          if (getVal(matrix[i][j], k) > myPayoff) return false;
    }
  }
  return true;
};

const playerColors = ["#2563eb","#dc2626","#16a34a","#9333ea","#ea580c","#0891b2"];

const NashEquilibrium = ({ nashData, setNashData, onBack, onGoAnalysis }) => {

  const { numPlayers, matrix, rowNames, colNames, rowGroup, colGroup } = nashData;
  const numRows = matrix.length;
  const numCols = colNames.length;
  const [showBestResponses, setShowBestResponses] = React.useState(true);

  // Helper para actualizar nashData parcialmente
  const update = (patch) => setNashData(prev => ({ ...prev, ...patch }));

  // ── Jugadores ────────────────────────────────────────────────
  const addPlayer = () => {
    update({
      numPlayers: numPlayers + 1,
      matrix: matrix.map(row => row.map(cell => [...cell, ""]))
    });
  };
  const removePlayer = () => {
    if (numPlayers <= 2) return;
    update({
      numPlayers: numPlayers - 1,
      matrix: matrix.map(row => row.map(cell => cell.slice(0, -1)))
    });
  };

  // ── Filas ────────────────────────────────────────────────────
  const addRow = () => update({
    matrix: [...matrix, Array(numCols).fill(null).map(() => Array(numPlayers).fill(""))],
    rowNames: [...rowNames, `Estrategia ${rowNames.length + 1}`]
  });
  const removeRow = () => {
    if (numRows <= 1) return;
    update({ matrix: matrix.slice(0, -1), rowNames: rowNames.slice(0, -1) });
  };

  // ── Columnas ─────────────────────────────────────────────────
  const addColumn = () => update({
    matrix: matrix.map(row => [...row, Array(numPlayers).fill("")]),
    colNames: [...colNames, `Estrategia ${colNames.length + 1}`]
  });
  const removeColumn = () => {
    if (numCols <= 1) return;
    update({ matrix: matrix.map(row => row.slice(0, -1)), colNames: colNames.slice(0, -1) });
  };

  // ── Edición celda ─────────────────────────────────────────────
  const handleCell = (i, j, k, value) => {
    const next = matrix.map(r => r.map(c => [...c]));
    next[i][j][k] = value;
    update({ matrix: next });
  };

  // ── Análisis ──────────────────────────────────────────────────
  const getVal = (cell, k) => toFiniteNumber(cell?.[k], NaN);

  const allFilled = matrix.every(row => row.every(cell => cell.every(v => v !== "" && Number.isFinite(toFiniteNumber(v, NaN)))));
  const analysisBlocked = !allFilled;

  const nashCells = [];
  if (allFilled) {
    for (let i = 0; i < numRows; i++)
      for (let j = 0; j < numCols; j++)
        if (isNashCell(matrix, i, j, numPlayers))
          nashCells.push({ i, j, values: matrix[i][j].map(v => toFiniteNumber(v, NaN)) });
  }

  const getNashIndex = (i, j) => {
    const idx = nashCells.findIndex(c => c.i === i && c.j === j);
    return idx >= 0 ? idx + 1 : null;
  };

  const isNash = (i, j) => nashCells.some(c => c.i === i && c.j === j);

  const colMaxJ1 = colNames.map((_, j) =>
    allFilled ? Math.max(...matrix.map(row => getVal(row[j], 0))) : null
  );
  const rowMaxJ2 = matrix.map(row =>
    allFilled ? Math.max(...row.map(cell => getVal(cell, 1))) : null
  );

  const bestRowForColJ1 = colNames.map((_, j) => {
    if (!allFilled) return null;
    const values = matrix.map((row) => getVal(row[j], 0));
    if (values.some((v) => !Number.isFinite(v))) return null;
    const maxVal = Math.max(...values);
    const count = values.filter((v) => v === maxVal).length;
    if (count !== 1) return null;
    return values.findIndex((v) => v === maxVal);
  });

  const bestColForRowJ2 = matrix.map((row) => {
    if (!allFilled) return null;
    const values = row.map((cell) => getVal(cell, 1));
    if (values.some((v) => !Number.isFinite(v))) return null;
    const maxVal = Math.max(...values);
    const count = values.filter((v) => v === maxVal).length;
    if (count !== 1) return null;
    return values.findIndex((v) => v === maxVal);
  });

  const isBestResponseJ1 = (i, j) => {
    if (!allFilled) return false;
    return bestRowForColJ1[j] === i;
  };

  const isBestResponseJ2 = (i, j) => {
    if (!allFilled) return false;
    return bestColForRowJ2[i] === j;
  };

  return (
    <div style={s.container}>
      <h2 style={s.title}>Equilibrio de Nash</h2>

      {/* GUÍA */}
      <div style={{ ...s.guideCard, borderLeft: "4px solid #3b82f6" }}>
        <h3 style={s.guideTitle}>¿Cómo funciona esto?</h3>
        <p style={s.guideText}>Esta herramienta busca la <strong>mejor jugada</strong> para todos. Llena la tabla con lo que gana cada jugador en cada caso.</p>
        <ul style={{ margin: "5px 0", paddingLeft: "20px", fontSize: "13px", color: "#1e293b", lineHeight: "1.5" }}>
            <li><strong>J1 (Filas):</strong> Trata de elegir la fila que le dé el número más alto.</li>
            <li><strong>J2 (Columnas):</strong> Trata de elegir la columna que le dé el número más alto.</li>
            <li><strong>ENEP:</strong> Significa que encontramos una jugada perfecta donde nadie quiere cambiar de decisión.</li>
            <li><strong>ENEM:</strong> Significa que no hay una jugada perfecta, así que los jugadores tendrán que <em>mezclar</em> sus decisiones (jugar al azar con ciertas probabilidades).</li>
        </ul>
        {analysisBlocked && (
          <div style={{ marginTop: "10px", padding: "8px", background: "#fef2f2", color: "#b91c1c", borderRadius: "6px", fontWeight: 600, fontSize: "13px" }}>
            ⚠ Faltan datos. Llena todas las celdas con números para poder analizar.
          </div>
        )}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
          {Array.from({ length: numPlayers }, (_, k) => (
            <span key={k} style={{ ...s.legendChip, background: playerColors[k] + "18", border: `1px solid ${playerColors[k]}44`, color: playerColors[k] }}>
              J{k + 1}{k === 0 ? ` — ${rowGroup}` : k === 1 ? ` — ${colGroup}` : ""}
            </span>
          ))}
        </div>
      </div>

      {/* CONTROLES */}
      <div style={s.controlsRow}>
        {[
          { label: "Filas",     onAdd: addRow,    onRemove: removeRow,    disabled: numRows <= 1 },
          { label: "Columnas",  onAdd: addColumn, onRemove: removeColumn, disabled: numCols <= 1 },
          { label: "Jugadores", onAdd: addPlayer, onRemove: removePlayer, disabled: numPlayers <= 2 },
        ].map(({ label, onAdd, onRemove, disabled }) => (
          <div key={label} style={s.controlGroup}>
            <span style={s.controlLabel}>{label}</span>
            <button style={s.btn} onClick={onAdd}>＋</button>
            <button style={{ ...s.btn, opacity: disabled ? 0.4 : 1 }} onClick={onRemove}>－</button>
          </div>
        ))}
      </div>

      {/* LEYENDA Y TOGGLE */}
      {allFilled && (
        <div style={s.analysisControls}>
          <button 
            style={{ ...s.toggleBtn, background: showBestResponses ? "#2563eb" : "#9ca3af" }}
            onClick={() => setShowBestResponses(!showBestResponses)}
          >
            {showBestResponses ? "Mostrar" : "Ocultar"} mejores opciones
          </button>
          {showBestResponses && (
            <div style={s.legendRow}>
              <span style={{ ...s.legendItem, borderLeft: "4px solid #3b82f6" }}>J1 mejor opcion (circulo azul)</span>
              <span style={{ ...s.legendItem, borderLeft: "4px solid #ef4444" }}>J2 mejor opcion (circulo rojo)</span>
              <span style={{ ...s.legendItem, borderLeft: "4px solid #059669" }}>Equilibrio Nash (verde)</span>
            </div>
          )}
        </div>
      )}

      {/* TABLA */}
      <div style={s.tableContainer}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.corner}></th>
              <th colSpan={numCols} style={s.groupHeader}>
                <input value={colGroup} onChange={e => update({ colGroup: e.target.value })} style={s.groupInput} />
              </th>
              <th style={s.totalHeader}>Máx J2</th>
            </tr>
            <tr>
              <th style={s.groupSide}>
                <input value={rowGroup} onChange={e => update({ rowGroup: e.target.value })} style={s.groupInputSide} />
              </th>
              {colNames.map((col, j) => (
                <th key={j} style={s.header}>
                  <input value={col} onChange={e => { const n = [...colNames]; n[j] = e.target.value; update({ colNames: n }); }} style={s.headerInput} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <th style={s.rowHeader}>
                  <input value={rowNames[i]} onChange={e => { const n = [...rowNames]; n[i] = e.target.value; update({ rowNames: n }); }} style={s.headerInput} />
                </th>
                {row.map((cell, j) => {
                  const nashIdx = getNashIndex(i, j);
                  const isBR_J1 = showBestResponses && isBestResponseJ1(i, j);
                  const isBR_J2 = showBestResponses && isBestResponseJ2(i, j);
                  const isNashCell = isNash(i, j);
                  
                  let bgColor = "#fff";
                  let borderColor = "1px solid #f1f5f9";
                  let shadowStyle = "none";
                  
                  if (isNashCell) {
                    bgColor = "linear-gradient(135deg, #d1fae5 0%, #c7f0d8 100%)";
                    borderColor = "4px solid #059669";
                    shadowStyle = "0 0 0 3px rgba(5, 150, 105, 0.15), inset 0 0 8px rgba(5, 150, 105, 0.1)";
                  } else if (isBR_J1 && isBR_J2) {
                    bgColor = "linear-gradient(135deg, #dbeafe 0%, #e0f2fe 50%, #fee2e2 50%, #fecaca 100%)";
                  } else if (isBR_J1) {
                    bgColor = "#e0e7ff";
                  } else if (isBR_J2) {
                    bgColor = "#fee2e2";
                  }
                  
                  return (
                    <td key={j} style={{ 
                      ...s.cell, 
                      border: borderColor,
                      boxShadow: shadowStyle,
                      position: "relative",
                      background: bgColor
                    }}>
                      {nashIdx && <span style={s.equilibriumBadge}>E{nashIdx}</span>}
                      <div style={s.cellInner}>
                        {cell.map((val, k) => {
                          const showRing = (k === 0 && isBR_J1) || (k === 1 && isBR_J2);
                          const ringColor = k === 0 ? "#3b82f6" : "#ef4444";
                          return (
                            <div key={k} style={s.inputWrap}>
                              {showRing && (
                                <span
                                  style={{
                                    ...s.bestResponseRing,
                                    borderColor: ringColor,
                                    background: "transparent",
                                    boxShadow: "none"
                                  }}
                                />
                              )}
                              <input
                                type="number"
                                value={val}
                                onChange={e => handleCell(i, j, k, e.target.value)}
                                style={{ ...s.cellInput, borderColor: isNashCell ? "#059669" : playerColors[k] + "66", color: playerColors[k] }}
                                placeholder="0"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  );
                })}
                <td style={s.totalCell}>{allFilled ? rowMaxJ2[i] : "—"}</td>
              </tr>
            ))}
            <tr>
              <th style={s.totalHeader}>Máx J1</th>
              {colMaxJ1.map((v, j) => (
                <td key={j} style={s.totalCell}>{allFilled ? v : "—"}</td>
              ))}
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* RESULTADOS */}
      <div style={s.resultBox}>
        {!allFilled ? (
          <p style={{ color: "#6b7280", fontSize: "14px" }}>Completa todos los valores para ver el análisis.</p>
        ) : (
          <>
            {/* EXPLICACIÓN PASO A PASO */}
            <div style={s.stepExplanation}>
              <h4 style={s.stepTitle}>Analisis paso a paso</h4>
              
              <div style={{ ...s.stepItem, borderLeft: "4px solid #2563eb", paddingLeft: 12, background: "#eff6ff", borderRadius: 8, padding: "12px" }}>
                <span style={{ ...s.stepNumber, background: "#2563eb" }}>1</span>
                <div style={s.stepContent}>
                  <strong style={{ color: "#2563eb", fontSize: "14px" }}>La jugada maestra de {rowGroup} (J1):</strong>
                  <p style={{ ...s.stepText, color: "#1e3a8a" }}>J1 se pregunta: <em>"Si J2 elige una columna específica, ¿cuál es mi mejor fila?"</em>. Encerramos esos números ganadores en un círculo azul.</p>
                  <div style={s.stepExample}>
                    {colNames.map((col, j) => (
                      <span key={j} style={{ ...s.exampleChip, background: "#dbeafe", color: "#1e3a8a" }}>
                        {bestRowForColJ1[j] === null
                          ? `Si juegan ${col}: ¡Empate!`
                          : `Si juegan ${col}: La mejor es ${rowNames[bestRowForColJ1[j]]} (Gana ${colMaxJ1[j]})`}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ ...s.stepItem, borderLeft: "4px solid #dc2626", paddingLeft: 12, background: "#fef2f2", borderRadius: 8, padding: "12px" }}>
                <span style={{ ...s.stepNumber, background: "#dc2626" }}>2</span>
                <div style={s.stepContent}>
                  <strong style={{ color: "#dc2626", fontSize: "14px" }}>La jugada maestra de {colGroup} (J2):</strong>
                  <p style={{ ...s.stepText, color: "#7f1d1d" }}>J2 hace lo mismo: <em>"Si J1 elige una fila específica, ¿cuál es mi mejor columna?"</em>. Encerramos esos números en un círculo rojo.</p>
                  <div style={s.stepExample}>
                    {rowNames.map((row, i) => (
                      <span key={i} style={{ ...s.exampleChip, background: "#fee2e2", color: "#7f1d1d" }}>
                        {bestColForRowJ2[i] === null
                          ? `Si juegan ${row}: ¡Empate!`
                          : `Si juegan ${row}: La mejor es ${colNames[bestColForRowJ2[i]]} (Gana ${rowMaxJ2[i]})`}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ ...s.stepItem, borderLeft: "4px solid #16a34a", paddingLeft: 12, background: "#f0fdf4", borderRadius: 8, padding: "12px" }}>
                <span style={{ ...s.stepNumber, background: "#16a34a" }}>3</span>
                <div style={s.stepContent}>
                  <strong style={{ color: "#16a34a", fontSize: "14px" }}>El Choque Perfecto (Equilibrio de Nash):</strong>
                  <p style={{ ...s.stepText, color: "#14532d" }}>Si en una misma celda coinciden el círculo azul y el círculo rojo, <strong>¡tenemos un Equilibrio!</strong> Esa celda se pinta de verde porque ninguno de los dos querrá cambiar su jugada si llegan ahí.</p>
                </div>
              </div>
            </div>

            {/* RESULTADOS */}
            {nashCells.length > 0 ? (
              <>
                <div style={s.resultTypeBox_ENEP}>
                  <p style={s.tagENEP}>✓ ENEP — Equilibrio en Estrategias Puras</p>
                  <p style={{ fontSize: "14px", color: "#374151", marginBottom: "10px" }}>
                    Se encontraron <strong>{nashCells.length}</strong> equilibrio{nashCells.length > 1 ? "s" : ""} donde ambos jugadores juegan su mejor estrategia:
                  </p>
                  {nashCells.map((c, idx) => (
                    <div key={idx} style={s.nashItem}>
                      <strong>E{idx + 1}:</strong>
                      <span style={{ fontSize: "14px" }}>({rowNames[c.i]}, {colNames[c.j]})</span>
                      {c.values.map((v, k) => (
                        <span key={k} style={{ ...s.payoffChip, background: playerColors[k] + "18", color: playerColors[k], border: `1px solid ${playerColors[k]}33` }}>
                          J{k + 1}: {v}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div style={s.resultTypeBox_ENEM}>
                  <p style={s.tagENEM}>✗ ENEM — ¡No hay un acuerdo directo!</p>
                  <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "10px", lineHeight: "1.5" }}>
                    No hay ninguna celda verde. Esto significa que si uno hace una jugada, el otro la contrarresta, y si el otro la contrarresta, el primero vuelve a cambiar... un ciclo infinito.
                  </p>
                  <div style={{ background: "#fef2f2", padding: "10px", borderRadius: "8px", borderLeft: "3px solid #dc2626" }}>
                    <p style={{ margin: 0, fontSize: "13px", color: "#991b1b", fontWeight: 600 }}>¿La solución?</p>
                    <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#7f1d1d", lineHeight: "1.4" }}>
                      Tienen que usar <strong>Estrategias Mixtas</strong>. Es decir, tirar una moneda o dados para jugar al azar y confundir al rival. Entra al "Análisis Completo" para calcular los porcentajes exactos.
                    </p>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
          <button style={s.backBtn} onClick={onBack}>← Volver</button>
          {allFilled && (
            <button style={s.analysisBtn} onClick={onGoAnalysis}>Ver análisis completo →</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NashEquilibrium;

const s = {
  container:    { padding: "30px", background: "#f4f6fb", fontFamily: "Inter, sans-serif", minHeight: "100vh" },
  title:        { fontSize: "24px", fontWeight: "800", marginBottom: "20px" },
  guideCard:    { background: "#f7fbff", border: "1px solid #cfe1f2", borderRadius: "12px", padding: "14px", marginBottom: "16px" },
  guideTitle:   { margin: "0 0 8px 0", color: "#133a5a", fontSize: "18px", fontWeight: "600" },
  guideText:    { margin: "5px 0", color: "#24445d", lineHeight: "1.45", fontSize: "13px" },
  legendChip:   { padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
  controlsRow:  { display: "flex", gap: "16px", marginBottom: "15px", flexWrap: "wrap", alignItems: "center" },
  controlGroup: { display: "flex", alignItems: "center", gap: "6px", background: "#fff", padding: "6px 12px", borderRadius: "10px", border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
  controlLabel: { fontSize: "12px", fontWeight: "600", color: "#374151", marginRight: "4px" },
  btn:          { padding: "5px 12px", borderRadius: "8px", border: "none", background: "#111827", color: "#fff", cursor: "pointer", fontWeight: "700", fontSize: "16px", lineHeight: 1 },
  tableContainer: { borderRadius: "14px", overflow: "auto", boxShadow: "0 10px 25px rgba(0,0,0,0.08)", background: "#fff" },
  table:        { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
  corner:       { background: "#0f172a" },
  groupHeader:  { background: "#0f172a", color: "#fff", padding: "12px", textAlign: "center" },
  groupSide:    { background: "#0f172a", color: "#fff", textAlign: "center", padding: "8px" },
  groupInput:   { background: "transparent", border: "none", color: "#fff", textAlign: "center", fontWeight: "700", outline: "none", width: "100%" },
  groupInputSide: { background: "transparent", border: "none", color: "#fff", textAlign: "center", fontWeight: "700", outline: "none", width: "100%" },
  header:       { background: "#f1f5f9", padding: "10px", textAlign: "center", fontWeight: "700" },
  headerInput:  { border: "none", background: "transparent", textAlign: "center", fontWeight: "700", outline: "none", width: "100%" },
  rowHeader:    { background: "#f8fafc", padding: "10px", fontWeight: "700", minWidth: "140px" },
  cell:         { textAlign: "center", padding: "8px 6px", borderBottom: "1px solid #f1f5f9" },
  cellInner:    { display: "flex", gap: "4px", justifyContent: "center", alignItems: "center" },
  inputWrap:    { position: "relative", display: "grid", placeItems: "center", width: "44px", height: "28px" },
  bestResponseRing: { position: "absolute", inset: 0, margin: "auto", width: "32px", height: "32px", borderRadius: "50%", border: "2px solid transparent", background: "transparent", pointerEvents: "none", zIndex: 3 },
  cellInput:    { width: "44px", height: "28px", padding: 0, textAlign: "center", borderRadius: "6px", border: "1.5px solid #ccc", fontSize: "13px", fontWeight: "600", outline: "none", background: "#fafafa", position: "relative", zIndex: 1 },
  equilibriumBadge: { position: "absolute", top: "-8px", right: "-8px", background: "#059669", color: "#fff", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "800", boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)" },
  analysisControls: { marginBottom: "16px", padding: "12px", background: "#f0f9ff", borderRadius: "10px", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" },
  toggleBtn:    { padding: "8px 16px", borderRadius: "8px", border: "none", color: "#fff", fontWeight: "600", cursor: "pointer", fontSize: "14px", transition: "background 200ms" },
  legendRow:    { display: "flex", gap: "16px", flexWrap: "wrap" },
  legendItem:   { fontSize: "13px", fontWeight: "600", color: "#374151", paddingLeft: "12px" },
  totalHeader:  { background: "#0f172a", color: "#fff", padding: "10px", textAlign: "center", fontWeight: "700", whiteSpace: "nowrap" },
  totalCell:    { background: "#e2e8f0", textAlign: "center", fontWeight: "700", padding: "8px" },
  resultBox:    { marginTop: "16px", background: "#fff", padding: "18px", borderRadius: "12px", boxShadow: "0 6px 15px rgba(0,0,0,0.06)" },
  tagENEP:      { color: "#16a34a", fontWeight: "700", fontSize: "15px", marginBottom: "8px" },
  tagENEM:      { color: "#dc2626", fontWeight: "700", fontSize: "15px", marginBottom: "8px" },
  nashItem:     { fontSize: "14px", margin: "6px 0", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" },
  payoffChip:   { padding: "2px 9px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" },
  stepExplanation: { background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "16px", marginBottom: "16px" },
  stepTitle:    { margin: "0 0 12px 0", color: "#111827", fontSize: "16px", fontWeight: "700" },
  stepItem:     { display: "flex", gap: "12px", marginBottom: "14px", alignItems: "flex-start" },
  stepNumber:   { background: "#2563eb", color: "#fff", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px", flexShrink: 0 },
  stepContent:  { flex: 1 },
  stepText:     { fontSize: "13px", color: "#6b7280", margin: "4px 0 8px 0", lineHeight: "1.4" },
  stepExample:  { display: "flex", gap: "8px", flexWrap: "wrap" },
  exampleChip:  { background: "#e0e7ff", color: "#1e40af", padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: "600" },
  resultTypeBox_ENEP: { background: "#f0fdf4", border: "2px solid #16a34a", borderRadius: "10px", padding: "14px", marginBottom: "12px" },
  resultTypeBox_ENEM: { background: "#fef2f2", border: "2px solid #dc2626", borderRadius: "10px", padding: "14px", marginBottom: "12px" },
  backBtn:      { padding: "10px 16px", background: "#6b7280", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600" },
  analysisBtn:  { padding: "10px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600" },
};
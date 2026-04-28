import React from "react";

const isNashCell = (matrix, r, c, n) => {
  const getVal = (cell, k) => parseFloat(cell[k]) || 0;
  const cell = matrix[r][c];
  for (let k = 0; k < n; k++) {
    const myPayoff = getVal(cell, k);
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
  const getVal = (cell, k) => parseFloat(cell[k]) || 0;

  const allFilled = matrix.every(row => row.every(cell => cell.every(v => v !== "")));

  const nashCells = [];
  if (allFilled) {
    for (let i = 0; i < numRows; i++)
      for (let j = 0; j < numCols; j++)
        if (isNashCell(matrix, i, j, numPlayers))
          nashCells.push({ i, j, values: matrix[i][j].map(v => parseFloat(v)) });
  }

  const isNash = (i, j) => nashCells.some(c => c.i === i && c.j === j);

  const colMaxJ1 = colNames.map((_, j) =>
    Math.max(...matrix.map(row => getVal(row[j], 0)))
  );
  const rowMaxJ2 = matrix.map(row =>
    Math.max(...row.map(cell => getVal(cell, 1)))
  );

  return (
    <div style={s.container}>
      <h2 style={s.title}>Equilibrio de Nash</h2>

      {/* GUÍA */}
      <div style={s.guideCard}>
        <h3 style={s.guideTitle}>Guia de uso — Equilibrio de Nash</h3>
        <p style={s.guideText}>Cada celda contiene un valor por jugador. Ingresa los pagos directamente en cada casilla.</p>
        <p style={s.guideText}><strong>J1</strong> controla filas · <strong>J2</strong> controla columnas · <strong>J3+</strong> best-response global.</p>
        <p style={s.guideText}><strong>ENEP</strong> = Estrategias Puras · <strong>ENEM</strong> = requiere mixtas.</p>
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
                {row.map((cell, j) => (
                  <td key={j} style={{ ...s.cell, background: isNash(i, j) ? "#d1fae5" : "#fff" }}>
                    <div style={s.cellInner}>
                      {cell.map((val, k) => (
                        <input
                          key={k}
                          type="number"
                          value={val}
                          onChange={e => handleCell(i, j, k, e.target.value)}
                          style={{ ...s.cellInput, borderColor: isNash(i, j) ? "#22c55e" : playerColors[k] + "66", color: playerColors[k] }}
                          placeholder="0"
                        />
                      ))}
                    </div>
                  </td>
                ))}
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
        ) : nashCells.length > 0 ? (
          <>
            <p style={s.tagENEP}>✓ ENEP — Equilibrio en Estrategias Puras</p>
            <p style={{ fontSize: "14px", color: "#374151", marginBottom: "10px" }}>
              Se encontraron <strong>{nashCells.length}</strong> equilibrio{nashCells.length > 1 ? "s" : ""}:
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
          </>
        ) : (
          <>
            <p style={s.tagENEM}>✗ ENEM — No existe equilibrio en estrategias puras</p>
            <p style={{ fontSize: "13px", color: "#6b7280" }}>Este juego requiere análisis de estrategias mixtas.</p>
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
  cellInput:    { width: "44px", padding: "5px 4px", textAlign: "center", borderRadius: "6px", border: "1.5px solid #ccc", fontSize: "13px", fontWeight: "600", outline: "none", background: "#fafafa" },
  totalHeader:  { background: "#0f172a", color: "#fff", padding: "10px", textAlign: "center", fontWeight: "700", whiteSpace: "nowrap" },
  totalCell:    { background: "#e2e8f0", textAlign: "center", fontWeight: "700", padding: "8px" },
  resultBox:    { marginTop: "16px", background: "#fff", padding: "18px", borderRadius: "12px", boxShadow: "0 6px 15px rgba(0,0,0,0.06)" },
  tagENEP:      { color: "#16a34a", fontWeight: "700", fontSize: "15px", marginBottom: "8px" },
  tagENEM:      { color: "#dc2626", fontWeight: "700", fontSize: "15px", marginBottom: "8px" },
  nashItem:     { fontSize: "14px", margin: "6px 0", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" },
  payoffChip:   { padding: "2px 9px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" },
  backBtn:      { padding: "10px 16px", background: "#6b7280", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600" },
  analysisBtn:  { padding: "10px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600" },
};
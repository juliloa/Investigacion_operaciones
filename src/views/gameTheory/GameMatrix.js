import React, { useState } from "react";

const GameTheoryScreen = () => {
  const createMatrix = (r, c) =>
    Array(r).fill().map(() => Array(c).fill(""));

  const [matrix, setMatrix] = useState(createMatrix(2, 2));

  const [rowGroup, setRowGroup] = useState("Estrategias");
  const [colGroup, setColGroup] = useState("Estrategias");

  const [rowNames, setRowNames] = useState(["Estrategia 1", "Estrategia 2"]);
  const [colNames, setColNames] = useState(["Estrategia 1", "Estrategia 2"]);

  // ➕ FILA
  const addRow = () => {
    setMatrix([...matrix, Array(colNames.length).fill("")]);
    setRowNames([...rowNames, `Estrategia ${rowNames.length + 1}`]);
  };

  const removeRow = () => {
    if (matrix.length <= 1) return;
    setMatrix(matrix.slice(0, -1));
    setRowNames(rowNames.slice(0, -1));
  };

  // ➕ COLUMNA
  const addColumn = () => {
    const newMatrix = matrix.map(row => [...row, ""]);
    setMatrix(newMatrix);
    setColNames([...colNames, `Estrategia ${colNames.length + 1}`]);
  };

  const removeColumn = () => {
    if (colNames.length <= 1) return;
    const newMatrix = matrix.map(row => row.slice(0, -1));
    setMatrix(newMatrix);
    setColNames(colNames.slice(0, -1));
  };

  const handleChange = (i, j, value) => {
    const newMatrix = [...matrix];
    newMatrix[i][j] = value;
    setMatrix(newMatrix);
  };

  // 🧠 MIN FILA
  const getRowTotals = () =>
    matrix.map(row =>
      Math.min(...row.map(v => parseFloat(v) || 0))
    );

  // 🧠 MAX COLUMNA
  const getColTotals = () =>
    colNames.map((_, j) => {
      const column = matrix.map(row => parseFloat(row[j]) || 0);
      return Math.max(...column);
    });

  const rowTotals = getRowTotals();
  const colTotals = getColTotals();

  const maximin = Math.max(...rowTotals);
  const minimax = Math.min(...colTotals);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🎮 Teoría de Juegos</h2>

      {/* CONTROLES */}
      <div style={styles.controls}>
        <button style={styles.btn} onClick={addRow}>➕ Fila</button>
        <button style={styles.btn} onClick={removeRow}>➖ Fila</button>
        <button style={styles.btn} onClick={addColumn}>➕ Columna</button>
        <button style={styles.btn} onClick={removeColumn}>➖ Columna</button>
      </div>

      {/* TABLA */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            {/* GRUPO SUPERIOR */}
            <tr>
              <th style={styles.corner}></th>

              <th colSpan={colNames.length} style={styles.groupHeader}>
                <input
                  value={colGroup}
                  onChange={(e) => setColGroup(e.target.value)}
                  style={styles.groupInput}
                />
              </th>

              <th style={styles.totalHeader}>Total</th>
            </tr>

            {/* ENCABEZADOS */}
            <tr>
              <th style={styles.groupSide}>
                <input
                  value={rowGroup}
                  onChange={(e) => setRowGroup(e.target.value)}
                  style={styles.groupInputSide}
                />
              </th>

              {colNames.map((col, j) => (
                <th key={j} style={styles.header}>
                  <input
                    value={col}
                    onChange={(e) => {
                      const newCols = [...colNames];
                      newCols[j] = e.target.value;
                      setColNames(newCols);
                    }}
                    style={styles.headerInput}
                  />
                </th>
              ))}

              <th style={styles.totalHeader}>Total</th>
            </tr>
          </thead>

          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <th style={styles.rowHeader}>
                  <input
                    value={rowNames[i]}
                    onChange={(e) => {
                      const newRows = [...rowNames];
                      newRows[i] = e.target.value;
                      setRowNames(newRows);
                    }}
                    style={styles.headerInput}
                  />
                </th>

                {row.map((cell, j) => (
                  <td key={j} style={styles.cell}>
                    <input
                      type="number"
                      value={cell}
                      onChange={(e) =>
                        handleChange(i, j, e.target.value)
                      }
                      style={styles.input}
                    />
                  </td>
                ))}

                <td style={styles.totalCell}>{rowTotals[i]}</td>
              </tr>
            ))}

            {/* TOTAL */}
            <tr>
              <th style={styles.totalHeader}>Total</th>

              {colTotals.map((t, i) => (
                <td key={i} style={styles.totalCell}>
                  {t}
                </td>
              ))}

              <td style={styles.totalCell}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* RESULTADO */}
      <div style={styles.resultBox}>
        <p><b>Maximin:</b> {maximin}</p>
        <p><b>Minimax:</b> {minimax}</p>

        {maximin === minimax ? (
          <p style={styles.success}>✅ Punto silla encontrado</p>
        ) : (
          <p style={styles.error}>❌ No hay punto silla</p>
        )}
      </div>
    </div>
  );
};

export default GameTheoryScreen;

//////////////////////////////////////////////////
// 🎨 ESTILOS PREMIUM

const styles = {
  container: {
    padding: "30px",
    background: "#f4f6fb",
    fontFamily: "Inter, sans-serif"
  },

  title: {
    fontSize: "24px",
    fontWeight: "800",
    marginBottom: "20px",
    color: "#111"
  },

  controls: {
    display: "flex",
    gap: "10px",
    marginBottom: "15px"
  },

  btn: {
    padding: "9px 14px",
    borderRadius: "10px",
    border: "none",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600"
  },

  tableContainer: {
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    background: "#fff"
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "15px"
  },

  groupHeader: {
    background: "#0f172a",
    color: "#fff",
    padding: "14px",
    textAlign: "center",
    fontWeight: "700"
  },

  groupSide: {
    background: "#0f172a",
    color: "#fff",
    textAlign: "center",
    fontWeight: "700"
  },

  groupInput: {
    background: "transparent",
    border: "none",
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: "16px",
    outline: "none",
    width: "100%"
  },

  groupInputSide: {
    background: "transparent",
    border: "none",
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: "14px",
    outline: "none",
    width: "100%"
  },

  header: {
    background: "#f1f5f9",
    padding: "12px",
    textAlign: "center",
    fontWeight: "700",
    color: "#111"
  },

  headerInput: {
    border: "none",
    background: "transparent",
    textAlign: "center",
    fontWeight: "700",
    color: "#111",
    fontSize: "14px",
    outline: "none",
    width: "100%"
  },

  rowHeader: {
    background: "#f8fafc",
    padding: "12px",
    fontWeight: "700",
    color: "#111"
  },

  cell: {
    textAlign: "center",
    padding: "6px"
  },

  input: {
    width: "70px",
    padding: "6px",
    textAlign: "center",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontWeight: "600"
  },

  totalHeader: {
    background: "#111827",
    color: "#fff",
    padding: "12px",
    textAlign: "center",
    fontWeight: "700"
  },

  totalCell: {
    background: "#f3f4f6",
    textAlign: "center",
    fontWeight: "700"
  },

  corner: {
    background: "#0f172a"
  },

  resultBox: {
    marginTop: "20px",
    background: "#fff",
    padding: "18px",
    borderRadius: "12px",
    boxShadow: "0 6px 15px rgba(0,0,0,0.06)"
  },

  success: {
    color: "#22c55e",
    fontWeight: "700"
  },

  error: {
    color: "#ef4444",
    fontWeight: "700"
  }
};
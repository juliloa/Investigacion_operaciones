import React, { useState } from "react";

const GameTheoryScreen = ({ setStep, setGameMatrix }) => {

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

  // 🧠 CÁLCULOS
  const rowMin = matrix.map(row =>
    Math.min(...row.map(v => parseFloat(v) || 0))
  );

  const colMax = colNames.map((_, j) => {
    const column = matrix.map(row => parseFloat(row[j]) || 0);
    return Math.max(...column);
  });

  const maximin = Math.max(...rowMin);
  const minimax = Math.min(...colMax);

  const hasSaddlePoint = maximin === minimax;

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
            <tr>
              <th style={styles.corner}></th>

              <th colSpan={colNames.length} style={styles.groupHeader}>
                <input
                  value={colGroup}
                  onChange={(e) => setColGroup(e.target.value)}
                  style={styles.groupInput}
                />
              </th>

              <th style={styles.totalHeader}>Mínimo de fila</th>
            </tr>

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

              <th style={styles.totalHeader}>Máximo de columna</th>
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

                <td style={styles.totalCell}>{rowMin[i]}</td>
              </tr>
            ))}

            {/* FILA FINAL */}
            <tr>
              <th style={styles.totalHeader}>Máximo de columna</th>

              {colMax.map((t, i) => (
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

        {hasSaddlePoint ? (
          <p style={styles.success}>✅ Punto silla encontrado</p>
        ) : (
          <>
            <p style={styles.error}>❌ No hay punto silla</p>

            <button
              style={styles.analysisBtn}
              onClick={() => {
                setGameMatrix(matrix);
                setStep(101);
              }}
            >
              🔍 Minimizar
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default GameTheoryScreen;

//////////////////////////////////////////////////
// 🎨 ESTILOS

const styles = {
  container: {
    padding: "30px",
    background: "#f4f6fb",
    fontFamily: "Inter, sans-serif"
  },

  title: {
    fontSize: "24px",
    fontWeight: "800",
    marginBottom: "20px"
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
    fontSize: "14px"
  },

  groupHeader: {
    background: "#0f172a",
    color: "#fff",
    padding: "12px",
    textAlign: "center"
  },

  groupSide: {
    background: "#0f172a",
    color: "#fff",
    textAlign: "center"
  },

  groupInput: {
    background: "transparent",
    border: "none",
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    outline: "none",
    width: "100%"
  },

  groupInputSide: {
    background: "transparent",
    border: "none",
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    outline: "none",
    width: "100%"
  },

  header: {
    background: "#f1f5f9",
    padding: "10px",
    textAlign: "center",
    fontWeight: "700"
  },

  headerInput: {
    border: "none",
    background: "transparent",
    textAlign: "center",
    fontWeight: "700",
    outline: "none",
    width: "100%"
  },

  rowHeader: {
    background: "#f8fafc",
    padding: "10px",
    fontWeight: "700"
  },

  cell: {
    textAlign: "center",
    padding: "5px"
  },

  input: {
    width: "60px",
    padding: "5px",
    textAlign: "center",
    borderRadius: "6px",
    border: "1px solid #ccc"
  },

  totalHeader: {
    background: "#0f172a",
    color: "#fff",
    padding: "10px",
    textAlign: "center",
    fontWeight: "700"
  },

  totalCell: {
    background: "#e2e8f0",
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
  },

  analysisBtn: {
    marginTop: "10px",
    padding: "10px 16px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600"
  }
};
import React, { useState } from "react";

const GameTheoryScreen = ({ setStep, gameData, setGameData }) => {

  const createMatrix = (r, c) =>
    Array(r).fill().map(() => Array(c).fill(""));

  const [matrix, setMatrix] = useState(
    gameData?.matrix || createMatrix(2, 2)
  );

  const [rowGroup, setRowGroup] = useState(gameData?.rowGroup || "Estrategias");
  const [colGroup, setColGroup] = useState(gameData?.colGroup || "Estrategias");

  const [rowNames, setRowNames] = useState(
    gameData?.rowNames || ["Estrategia 1", "Estrategia 2"]
  );
  const [colNames, setColNames] = useState(
    gameData?.colNames || ["Estrategia 1", "Estrategia 2"]
  );

  const persistGameData = ({
    nextMatrix = matrix,
    nextRowNames = rowNames,
    nextColNames = colNames,
    nextRowGroup = rowGroup,
    nextColGroup = colGroup
  } = {}) => {
    setGameData({
      matrix: nextMatrix.map((row) => [...row]),
      rowNames: [...nextRowNames],
      colNames: [...nextColNames],
      rowGroup: nextRowGroup,
      colGroup: nextColGroup
    });
  };

  //  FILA
  const addRow = () => {
    const nextMatrix = [...matrix, Array(colNames.length).fill("")];
    const nextRowNames = [...rowNames, `Estrategia ${rowNames.length + 1}`];

    setMatrix(nextMatrix);
    setRowNames(nextRowNames);
    persistGameData({ nextMatrix, nextRowNames });
  };

  const removeRow = () => {
    if (matrix.length <= 1) return;
    const nextMatrix = matrix.slice(0, -1);
    const nextRowNames = rowNames.slice(0, -1);

    setMatrix(nextMatrix);
    setRowNames(nextRowNames);
    persistGameData({ nextMatrix, nextRowNames });
  };

  //  COLUMNA
  const addColumn = () => {
    const nextMatrix = matrix.map(row => [...row, ""]);
    const nextColNames = [...colNames, `Estrategia ${colNames.length + 1}`];

    setMatrix(nextMatrix);
    setColNames(nextColNames);
    persistGameData({ nextMatrix, nextColNames });
  };

  const removeColumn = () => {
    if (colNames.length <= 1) return;
    const nextMatrix = matrix.map(row => row.slice(0, -1));
    const nextColNames = colNames.slice(0, -1);

    setMatrix(nextMatrix);
    setColNames(nextColNames);
    persistGameData({ nextMatrix, nextColNames });
  };

  const handleChange = (i, j, value) => {
    const nextMatrix = [...matrix];
    nextMatrix[i][j] = value;
    setMatrix(nextMatrix);
    persistGameData({ nextMatrix });
  };

  //  CÁLCULOS
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
      <h2 style={styles.title}>Teoría de Juegos</h2>

      {/* CONTROLES */}
      <div style={styles.controls}>
        <button style={styles.btn} onClick={addRow}>Agregar fila</button>
        <button style={styles.btn} onClick={removeRow}>Eliminar fila</button>
        <button style={styles.btn} onClick={addColumn}>Agregar columna</button>
        <button style={styles.btn} onClick={removeColumn}>Eliminar columna</button>
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
                  onChange={(e) => {
                    const nextColGroup = e.target.value;
                    setColGroup(nextColGroup);
                    persistGameData({ nextColGroup });
                  }}
                  style={styles.groupInput}
                />
              </th>

              <th style={styles.totalHeader}>Mínimo de fila</th>
            </tr>

            <tr>
              <th style={styles.groupSide}>
                <input
                  value={rowGroup}
                  onChange={(e) => {
                    const nextRowGroup = e.target.value;
                    setRowGroup(nextRowGroup);
                    persistGameData({ nextRowGroup });
                  }}
                  style={styles.groupInputSide}
                />
              </th>

              {colNames.map((col, j) => (
                <th key={j} style={styles.header}>
                  <input
                    value={col}
                    onChange={(e) => {
                      const nextColNames = [...colNames];
                      nextColNames[j] = e.target.value;
                      setColNames(nextColNames);
                      persistGameData({ nextColNames });
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
                      const nextRowNames = [...rowNames];
                      nextRowNames[i] = e.target.value;
                      setRowNames(nextRowNames);
                      persistGameData({ nextRowNames });
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
          <p style={styles.success}>Punto silla encontrado</p>
        ) : (
          <p style={styles.error}>No hay punto silla</p>
        )}

        <button
          style={styles.analysisBtn}
          onClick={() => {
            persistGameData();
            setStep(101);
          }}
        >
          Ver analisis completo
        </button>
      </div>
    </div>
  );
};

export default GameTheoryScreen;

//////////////////////////////////////////////////
//  ESTILOS

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
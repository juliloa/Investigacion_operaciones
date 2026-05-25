import React, { useState } from "react";
import { isFiniteNumber, toFiniteNumber } from "../../utils/validation";

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

  // FILA
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

  // COLUMNA
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

  // CÁLCULOS
  const normalizedMatrix = matrix.map((row) => row.map((value) => toFiniteNumber(value, null)));
  const matrixHasInvalidValue = normalizedMatrix.some((row) => row.some((value) => !isFiniteNumber(value)));
  const matrixShapeValid = normalizedMatrix.length > 0 && normalizedMatrix.every((row) => Array.isArray(row) && row.length === colNames.length);

  const rowMin = normalizedMatrix.map((row) => (
    row.every(isFiniteNumber) ? Math.min(...row) : null
  ));

  const colMax = colNames.map((_, j) => {
    const column = normalizedMatrix.map((row) => row[j]);
    return column.every(isFiniteNumber) ? Math.max(...column) : null;
  });

  const maximin = rowMin.every(isFiniteNumber) ? Math.max(...rowMin) : null;
  const minimax = colMax.every(isFiniteNumber) ? Math.min(...colMax) : null;

  const hasSaddlePoint = maximin !== null && minimax !== null && maximin === minimax;
  const analysisBlocked = matrixHasInvalidValue || !matrixShapeValid;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Teoría de Juegos</h2>

      <div style={{ ...styles.guideCard, borderLeft: "4px solid #3b82f6" }}>
        <h3 style={styles.guideTitle}>Juegos de Suma Cero (Lo que uno gana, el otro lo pierde)</h3>
        <p style={styles.guideText}>
          En este juego, los números representan la ganancia del jugador de las <strong>filas</strong>. El jugador de las columnas es su rival (si la fila gana 5, la columna pierde 5).
        </p>
        <ul style={{ margin: "5px 0", paddingLeft: "20px", fontSize: "13px", color: "#1e293b", lineHeight: "1.5" }}>
            <li><strong>Jugador de Filas:</strong> Busca el número MÁS ALTO (maximizar su ganancia).</li>
            <li><strong>Jugador de Columnas:</strong> Busca el número MÁS BAJO (minimizar su pérdida).</li>
            <li><strong>Punto Silla:</strong> Es un equilibrio perfecto. Si se encuentra, el juego termina ahí porque ninguno se arriesgará a cambiar su jugada.</li>
        </ul>
        {analysisBlocked && (
          <div style={{ marginTop: "10px", padding: "8px", background: "#fef2f2", color: "#b91c1c", borderRadius: "6px", fontWeight: 600, fontSize: "13px" }}>
            ⚠ Faltan datos. Llena todas las celdas con números para poder analizar.
          </div>
        )}
      </div>

      {/* CONTROLES */}
      <div style={styles.controls}>
        <button style={styles.btn} onClick={addRow}>Agregar fila</button>
        <button style={styles.btn} onClick={removeRow}>Eliminar fila</button>
        <button style={styles.btn} onClick={addColumn}>Agregar columna</button>
        <button style={styles.btn} onClick={removeColumn}>Eliminar columna</button>
      </div>

      {/* TABLA COMPLETA */}
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
                      onChange={(e) => handleChange(i, j, e.target.value)}
                      style={styles.input}
                    />
                  </td>
                ))}

                <td style={styles.totalCell}>{rowMin[i]}</td>
              </tr>
            ))}

            <tr>
              <th style={styles.totalHeader}>Máximo de columna</th>

              {colMax.map((t, i) => (
                <td key={i} style={styles.totalCell}>
                  {t}
                </td>
              ))}

              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* RESULTADOS */}
      <div style={styles.resultBox}>
        <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", color: "#0f172a" }}>Análisis Rápido</h3>
        <div style={{ display: "flex", gap: "20px", marginBottom: "16px", flexWrap: "wrap" }}>
          <div style={{ background: "#f8fafc", padding: "10px 15px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>Maximin (Lo mejor de lo peor para las Filas)</p>
            <p style={{ margin: "4px 0 0 0", fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>{maximin !== null ? maximin : "-"}</p>
          </div>
          <div style={{ background: "#f8fafc", padding: "10px 15px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>Minimax (El mal menor para las Columnas)</p>
            <p style={{ margin: "4px 0 0 0", fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>{minimax !== null ? minimax : "-"}</p>
          </div>
        </div>

        {hasSaddlePoint ? (
          <div style={{ background: "#f0fdf4", borderLeft: "4px solid #22c55e", padding: "12px", borderRadius: "6px", marginBottom: "16px" }}>
            <p style={{ margin: 0, color: "#14532d", fontWeight: "700", fontSize: "14px" }}>¡Punto Silla Encontrado!</p>
            <p style={{ margin: "4px 0 0 0", color: "#166534", fontSize: "13px" }}>Ambos jugadores llegaron a un acuerdo estable. El juego se resuelve sin tener que eliminar opciones ni usar probabilidades.</p>
          </div>
        ) : (
          <div style={{ background: "#fef2f2", borderLeft: "4px solid #ef4444", padding: "12px", borderRadius: "6px", marginBottom: "16px" }}>
            <p style={{ margin: 0, color: "#7f1d1d", fontWeight: "700", fontSize: "14px" }}>No hay Punto Silla</p>
            <p style={{ margin: "4px 0 0 0", color: "#991b1b", fontSize: "13px" }}>No hay un acuerdo directo. Necesitas entrar al <strong>Análisis Completo</strong> para eliminar las peores jugadas y buscar una solución.</p>
          </div>
        )}

        <button
          style={styles.analysisBtn}
          disabled={analysisBlocked}
          aria-disabled={analysisBlocked}
          onClick={() => {
            persistGameData();
            setStep(101);
          }}
        >
          Ver analisis completo
        </button>

        <button
          style={{ ...styles.analysisBtn, marginLeft: "10px", background: "#0f5e9c" }}
          disabled={analysisBlocked}
          aria-disabled={analysisBlocked}
          onClick={() => {
            setStep(103);
          }}
        >
          Equilibrio de Nash
        </button>
      </div>
    </div>
  );
};

export default GameTheoryScreen;

//////////////////////////////////////////////////
// ESTILOS

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
  guideCard: {
    background: "#f7fbff",
    border: "1px solid #cfe1f2",
    borderRadius: "12px",
    padding: "14px",
    marginBottom: "16px"
  },
  guideTitle: {
    margin: "0 0 8px 0",
    color: "#133a5a",
    fontSize: "18px"
  },
  guideText: {
    margin: "5px 0",
    color: "#24445d",
    lineHeight: "1.45",
    fontSize: "13px"
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
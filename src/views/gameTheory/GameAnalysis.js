import React from "react";
import { analyzeGame } from "./gameTheoryUtils";

const formatNumber = (value) => Number(value).toFixed(2);

const asSet = (items) => new Set(items || []);

const getKeptNames = (before, removed) => {
  const removedSet = asSet(removed);
  return (before || []).filter((name) => !removedSet.has(name));
};

const MatrixTable = ({
  matrix,
  rowNames,
  colNames,
  title,
  highlights = {},
  removedRows = [],
  removedCols = [],
  keptRows = [],
  keptCols = [],
  highlightPhase = "none",
  highlightDelayMs = 0
}) => {
  if (!matrix.length || !matrix[0]?.length) {
    return (
      <div style={panel}>
        <h3 style={panelTitle}>{title}</h3>
        <p style={muted}>No hay datos para mostrar.</p>
      </div>
    );
  }

  const removedRowSet = asSet(removedRows);
  const removedColSet = asSet(removedCols);
  const keptRowSet = asSet(keptRows);
  const keptColSet = asSet(keptCols);

  return (
    <div style={panel}>
      <h3 style={panelTitle}>{title}</h3>
      <div style={tableWrap}>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}></th>
              {colNames.map((name, index) => (
                <th
                  key={index}
                  style={{
                    ...th,
                    ...(removedColSet.has(name) ? removedHeader : {}),
                    ...(keptColSet.has(name) ? keptHeader : {}),
                    ...(highlightPhase === "removed" && removedColSet.has(name)
                      ? { animation: `cellExit 360ms ease ${highlightDelayMs}ms both` }
                      : {}),
                    ...(highlightPhase === "kept" && keptColSet.has(name)
                      ? { animation: `cellEnter 360ms ease ${highlightDelayMs}ms both` }
                      : {})
                  }}
                >
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <th
                  style={{
                    ...rowHeader,
                    ...(removedRowSet.has(rowNames[rowIndex]) ? removedHeader : {}),
                    ...(keptRowSet.has(rowNames[rowIndex]) ? keptHeader : {}),
                    ...(highlightPhase === "removed" && removedRowSet.has(rowNames[rowIndex])
                      ? { animation: `cellExit 360ms ease ${highlightDelayMs}ms both` }
                      : {}),
                    ...(highlightPhase === "kept" && keptRowSet.has(rowNames[rowIndex])
                      ? { animation: `cellEnter 360ms ease ${highlightDelayMs}ms both` }
                      : {})
                  }}
                >
                  {rowNames[rowIndex]}
                </th>
                {row.map((value, colIndex) => {
                  const cellKey = `${rowIndex}-${colIndex}`;
                  const cellHighlight = highlights[cellKey] ? highlightedCell : {};
                  const rowName = rowNames[rowIndex];
                  const colName = colNames[colIndex];

                  const removedCell =
                    removedRowSet.has(rowName) || removedColSet.has(colName)
                      ? removedCellStyle
                      : {};
                  const keptCell =
                    keptRowSet.has(rowName) || keptColSet.has(colName)
                      ? keptCellStyle
                      : {};

                  const phaseAnimation =
                    highlightPhase === "removed" && (removedRowSet.has(rowName) || removedColSet.has(colName))
                      ? { animation: `cellExit 360ms ease ${highlightDelayMs}ms both` }
                      : highlightPhase === "kept" && (keptRowSet.has(rowName) || keptColSet.has(colName))
                        ? { animation: `cellEnter 360ms ease ${highlightDelayMs}ms both` }
                        : {};

                  return (
                    <td key={colIndex} style={{ ...td, ...removedCell, ...keptCell, ...phaseAnimation, ...cellHighlight }}>
                      {formatNumber(value)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CriteriaDetail = ({ criteria, rowNames, colNames }) => (
  <div style={criteriaBox}>
    <p style={criteriaText}>
      Minimos por fila: {rowNames.map((name, i) => `${name}: ${formatNumber(criteria.rowMin[i])}`).join(" | ")}
    </p>
    <p style={criteriaText}>
      Maximos por columna: {colNames.map((name, i) => `${name}: ${formatNumber(criteria.colMax[i])}`).join(" | ")}
    </p>
    <p style={criteriaText}>
      Maximin = <strong>{formatNumber(criteria.maximin)}</strong> | Minimax = <strong>{formatNumber(criteria.minimax)}</strong>
    </p>
  </div>
);

const ReductionFlow = ({ labelRemoved, removed, kept, axisLabel }) => {
  if (!removed.length) return null;

  return (
    <div style={flowBox}>
      <div style={flowTitle}>{labelRemoved}</div>
      <div style={flowContent}>
        <div style={flowSide}>
          {removed.map((name) => (
            <span key={name} style={removedChip}>{name}</span>
          ))}
        </div>
        <span style={flowArrow}>→</span>
        <div style={flowSide}>
          {kept.map((name) => (
            <span key={name} style={keptChip}>{name}</span>
          ))}
        </div>
      </div>
      <p style={flowHint}>
        Se retiran {axisLabel} en rojo y permanecen en verde para la siguiente iteracion.
      </p>
    </div>
  );
};

const SaddleGraph = ({ rowNames, colNames, saddleKeys }) => {
  const width = 780;
  const height = 280;
  const leftX = 120;
  const rightX = 660;
  const topPad = 40;

  const rowStep = rowNames.length > 1 ? (height - topPad * 2) / (rowNames.length - 1) : 0;
  const colStep = colNames.length > 1 ? (height - topPad * 2) / (colNames.length - 1) : 0;

  const rowY = rowNames.map((_, i) => topPad + rowStep * i);
  const colY = colNames.map((_, j) => topPad + colStep * j);

  return (
    <div style={panel}>
      <h3 style={panelTitle}>Grafica del punto silla</h3>
      <svg viewBox={`0 0 ${width} ${height}`} style={saddleSvg} role="img" aria-label="Relacion de estrategias en punto silla">
        <rect x="0" y="0" width={width} height={height} fill="#ffffff" />

        <text x={leftX - 40} y={24} style={graphTitle}>Filas</text>
        <text x={rightX + 16} y={24} style={graphTitle}>Columnas</text>

        {rowNames.map((name, i) => (
          <g key={`row-${name}`}>
            <circle cx={leftX} cy={rowY[i]} r="11" fill="#2563eb" />
            <text x={leftX - 16} y={rowY[i] + 4} textAnchor="end" style={nodeLabel}>{name}</text>
          </g>
        ))}

        {colNames.map((name, j) => (
          <g key={`col-${name}`}>
            <circle cx={rightX} cy={colY[j]} r="11" fill="#0891b2" />
            <text x={rightX + 16} y={colY[j] + 4} style={nodeLabel}>{name}</text>
          </g>
        ))}

        {Object.keys(saddleKeys).map((key) => {
          const [rowIndex, colIndex] = key.split("-").map((v) => Number(v));
          return (
            <g key={`edge-${key}`}>
              <line
                x1={leftX + 12}
                y1={rowY[rowIndex]}
                x2={rightX - 12}
                y2={colY[colIndex]}
                stroke="#16a34a"
                strokeWidth="3"
              />
              <circle cx={(leftX + rightX) / 2} cy={(rowY[rowIndex] + colY[colIndex]) / 2} r="6" fill="#16a34a" />
            </g>
          );
        })}
      </svg>

      <p style={graphHint}>
        Cada linea verde conecta una fila y una columna que forman punto silla.
      </p>
    </div>
  );
};

const StepCard = ({ step, index }) => {
  const isRows = step.action === "rows-maximin";
  const isCols = step.action === "cols-minimax";
  const isTerminal = step.action === "saddle-found" || step.action === "no-more-eliminations";

  const removedRows = isRows ? step.removed : [];
  const removedCols = isCols ? step.removed : [];
  const comparedRows = isRows && step.comparedWith ? [step.comparedWith] : [];
  const comparedCols = isCols && step.comparedWith ? [step.comparedWith] : [];
  const keptRows = isRows ? getKeptNames(step.rowNamesBefore, removedRows) : [];
  const keptCols = isCols ? getKeptNames(step.colNamesBefore, removedCols) : [];
  const attemptedLabel = step.attemptedAxis === "row" ? "fila" : "columna";
  const usedLabel = step.usedAxis === "row" ? "fila" : step.usedAxis === "col" ? "columna" : "ninguna";

  return (
    <div
      style={{
        ...stepCard,
        animation: `fadeSlideIn 360ms ease ${index * 70}ms both`
      }}
    >
      <div style={stepHeader}>
        <span style={stepTag}>Paso {index + 1}</span>
        <strong style={stepTitle}>
          {isRows && "Eliminacion por maximin (filas)"}
          {isCols && "Eliminacion por minimax (columnas)"}
          {isTerminal && "Cierre del proceso"}
        </strong>
      </div>

      <p style={stepText}>{step.reason}</p>

      {(isRows || isCols) && (
        <p style={stepHint}>
          Se intento primero por <strong>{attemptedLabel}</strong> y se aplico por <strong>{usedLabel}</strong>
          {step.usedFallback ? " (con cambio de criterio en esta iteracion)." : "."}
        </p>
      )}

      {(isRows || isCols) && step.comparedWith && step.comparison && (
        <p style={stepText}>
          Comparacion: <strong>{step.removed[0]}</strong> (valor {formatNumber(step.comparison.removedMetric)}) frente a
          <strong> {step.comparedWith}</strong> (valor {formatNumber(step.comparison.comparedMetric)}), con
          {step.comparison.axis === "row" ? " maximin " : " minimax "}
          objetivo = <strong>{formatNumber(step.comparison.criteriaMetric)}</strong>.
        </p>
      )}

      {(isRows || isCols) && (
        <p style={stepText}>
          Se elimino: <strong>{step.removed.join(", ")}</strong>
        </p>
      )}

      <ReductionFlow
        labelRemoved={isRows ? "Flujo de eliminacion de filas" : "Flujo de eliminacion de columnas"}
        removed={isRows ? removedRows : removedCols}
        kept={isRows ? keptRows : keptCols}
        axisLabel={isRows ? "filas" : "columnas"}
      />

      <MatrixTable
        matrix={step.matrixBefore}
        rowNames={step.rowNamesBefore}
        colNames={step.colNamesBefore}
        title="Matriz antes del paso"
        removedRows={removedRows}
        removedCols={removedCols}
        keptRows={comparedRows}
        keptCols={comparedCols}
        highlightPhase="removed"
        highlightDelayMs={index * 60}
      />

      <CriteriaDetail
        criteria={step.criteriaBefore}
        rowNames={step.rowNamesBefore}
        colNames={step.colNamesBefore}
      />

      <MatrixTable
        matrix={step.matrixAfter}
        rowNames={step.rowNamesAfter}
        colNames={step.colNamesAfter}
        title="Matriz despues del paso"
        keptRows={isRows ? step.rowNamesAfter : []}
        keptCols={isCols ? step.colNamesAfter : []}
        highlightPhase="kept"
        highlightDelayMs={index * 60 + 120}
      />

      <CriteriaDetail
        criteria={step.criteriaAfter}
        rowNames={step.rowNamesAfter}
        colNames={step.colNamesAfter}
      />

      <p style={stepHint}>
        Estrategias disponibles: filas [{step.rowNamesAfter.join(", ")}] y columnas [{step.colNamesAfter.join(", ")}].
      </p>
    </div>
  );
};

const GameAnalysis = ({ matrix, onBack, onOpenAlgebraic }) => {
  if (!matrix) {
    return (
      <div style={container}>
        <h2 style={title}>Analisis del juego</h2>
        <p style={muted}>
          No hay una matriz cargada para analizar. Regresa al paso de datos de Teoria de Juegos.
        </p>
        <button onClick={onBack} style={buttonPrimary}>Volver a Datos</button>
      </div>
    );
  }

  const result = analyzeGame(matrix);
  const {
    originalMatrix,
    rowNames,
    colNames,
    reducedMatrix,
    reducedRowNames,
    reducedColNames,
    eliminationSteps,
    maximin,
    minimax,
    hasSaddle,
    reducedCriteria
  } = result;

  const hasInitialSaddle = hasSaddle;

  const saddlePoints = {};
  const matrixForSaddle = hasInitialSaddle ? originalMatrix : reducedMatrix;
  const criteriaForSaddle = hasInitialSaddle
    ? { rowMin: result.rowMin, colMax: result.colMax, maximin, minimax }
    : reducedCriteria;

  if (criteriaForSaddle.maximin === criteriaForSaddle.minimax && matrixForSaddle.length && matrixForSaddle[0]?.length) {
    matrixForSaddle.forEach((row, i) => {
      row.forEach((value, j) => {
        const isSaddleValue = value === criteriaForSaddle.maximin && value === criteriaForSaddle.minimax;
        const rowMatches = criteriaForSaddle.rowMin[i] === criteriaForSaddle.maximin;
        const colMatches = criteriaForSaddle.colMax[j] === criteriaForSaddle.minimax;
        if (isSaddleValue && rowMatches && colMatches) {
          saddlePoints[`${i}-${j}`] = true;
        }
      });
    });
  }

  if (hasInitialSaddle) {
    return (
      <div style={container}>
        <style>{animationStyles}</style>
        <h2 style={title}>Analisis por punto silla</h2>

        <div style={infoBox}>
          <p style={infoText}>
            Se detecto punto silla en la matriz original, por lo tanto no se realiza reduccion.
          </p>
          <p style={infoText}>
            La grafica siguiente marca la celda de equilibrio en estrategias puras.
          </p>
        </div>

        <div style={metricsGrid}>
          <div style={metricCard}>
            <p style={metricLabel}>Maximin</p>
            <p style={metricValue}>{formatNumber(maximin)}</p>
          </div>
          <div style={metricCard}>
            <p style={metricLabel}>Minimax</p>
            <p style={metricValue}>{formatNumber(minimax)}</p>
          </div>
          <div style={metricCard}>
            <p style={metricLabel}>Punto silla</p>
            <p style={metricValue}>Si</p>
          </div>
        </div>

        <MatrixTable
          matrix={originalMatrix}
          rowNames={rowNames}
          colNames={colNames}
          title="Matriz con punto silla"
          highlights={saddlePoints}
        />

        <SaddleGraph
          rowNames={rowNames}
          colNames={colNames}
          saddleKeys={saddlePoints}
        />

        <div style={panel}>
          <h3 style={panelTitle}>Conclusiones</h3>
          <p style={conclusionItem}>
            Existe equilibrio en estrategias puras porque Maximin = Minimax = {formatNumber(maximin)}.
          </p>
          <p style={conclusionItem}>
            No se aplica eliminacion sucesiva cuando el punto silla ya aparece en la matriz original.
          </p>
        </div>

        <div style={actions}>
          <button onClick={onBack} style={buttonSecondary}>Volver a Datos</button>
        </div>
      </div>
    );
  }

  return (
    <div style={container}>
      <style>{animationStyles}</style>
      <h2 style={title}>Analisis por eliminacion sucesiva</h2>

      <div style={infoBox}>
        <p style={infoText}>
          Si no hay punto silla, se aplica el criterio pedido: eliminar filas fuera del maximin y columnas fuera del minimax.
        </p>
        <p style={infoText}>
          En cada paso se muestran calculos, matriz derivada y estrategias que permanecen activas.
        </p>
      </div>

      <div style={metricsGrid}>
        <div style={metricCard}>
          <p style={metricLabel}>Maximin original</p>
          <p style={metricValue}>{formatNumber(maximin)}</p>
        </div>
        <div style={metricCard}>
          <p style={metricLabel}>Minimax original</p>
          <p style={metricValue}>{formatNumber(minimax)}</p>
        </div>
        <div style={metricCard}>
          <p style={metricLabel}>Punto silla inicial</p>
          <p style={metricValue}>{hasSaddle ? "Si" : "No"}</p>
        </div>
        <div style={metricCard}>
          <p style={metricLabel}>Pasos registrados</p>
          <p style={metricValue}>{eliminationSteps.length}</p>
        </div>
      </div>

      <MatrixTable
        matrix={originalMatrix}
        rowNames={rowNames}
        colNames={colNames}
        title="Matriz original"
      />

      <div style={panel}>
        <h3 style={panelTitle}>Desarrollo paso a paso</h3>
        {eliminationSteps.length === 0 ? (
          <p style={muted}>No hubo eliminaciones ni cierres de proceso.</p>
        ) : (
          eliminationSteps.map((step, index) => (
            <StepCard key={index} step={step} index={index} />
          ))
        )}
      </div>

      <MatrixTable
        matrix={reducedMatrix}
        rowNames={reducedRowNames}
        colNames={reducedColNames}
        title="Matriz final de la reduccion"
        highlights={saddlePoints}
      />

      <div style={panel}>
        <h3 style={panelTitle}>Conclusiones del analisis</h3>
        <p style={conclusionItem}>
          Estrategias finales de filas: <strong>{reducedRowNames.join(", ") || "Ninguna"}</strong>.
        </p>
        <p style={conclusionItem}>
          Estrategias finales de columnas: <strong>{reducedColNames.join(", ") || "Ninguna"}</strong>.
        </p>
        <p style={conclusionItem}>
          En la matriz final: Maximin = {formatNumber(reducedCriteria.maximin)} y Minimax = {formatNumber(reducedCriteria.minimax)}.
        </p>
        <p style={conclusionItem}>
          {reducedCriteria.hasSaddle
            ? "Se encontro punto silla en la matriz final (las celdas resaltadas muestran ese equilibrio en puras)."
            : "No se encontro punto silla en la matriz final con el proceso de reduccion actual."}
        </p>
      </div>

      <div style={actions}>
        <button onClick={onBack} style={buttonSecondary}>Volver a Datos</button>
        <button onClick={onOpenAlgebraic} style={buttonPrimary}>Ir a Metodo algebraico</button>
      </div>
    </div>
  );
};

export default GameAnalysis;

const container = {
  padding: "24px",
  background: "#f5f7fb",
  borderRadius: "12px",
  display: "flex",
  flexDirection: "column",
  gap: "16px"
};

const title = {
  margin: 0,
  color: "#12263a",
  fontSize: "28px"
};

const infoBox = {
  background: "#eaf2fb",
  border: "1px solid #c8dcef",
  borderRadius: "10px",
  padding: "14px"
};

const infoText = {
  margin: "4px 0",
  color: "#1f415d"
};

const metricsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "10px"
};

const metricCard = {
  background: "#fff",
  borderRadius: "10px",
  border: "1px solid #dbe7f3",
  padding: "10px"
};

const metricLabel = {
  margin: 0,
  color: "#4e6b84",
  fontSize: "12px",
  textTransform: "uppercase"
};

const metricValue = {
  margin: "6px 0 0 0",
  fontSize: "24px",
  color: "#123b5f",
  fontWeight: 700
};

const panel = {
  background: "#fff",
  borderRadius: "10px",
  border: "1px solid #dbe7f3",
  padding: "14px"
};

const panelTitle = {
  marginTop: 0,
  color: "#12324a"
};

const tableWrap = {
  overflowX: "auto"
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "420px"
};

const th = {
  padding: "10px",
  border: "1px solid #dbe7f3",
  background: "#f2f7fc",
  textAlign: "center"
};

const rowHeader = {
  padding: "10px",
  border: "1px solid #dbe7f3",
  background: "#f9fbff",
  textAlign: "left"
};

const td = {
  padding: "10px",
  border: "1px solid #dbe7f3",
  textAlign: "center"
};

const highlightedCell = {
  background: "#dcfce7",
  border: "2px solid #16a34a",
  fontWeight: 700,
  color: "#14532d"
};

const removedHeader = {
  background: "#fca5a5",
  color: "#7f1d1d",
  textDecoration: "line-through"
};

const keptHeader = {
  background: "#86efac",
  color: "#14532d",
  fontWeight: 700
};

const removedCellStyle = {
  background: "#fecaca",
  color: "#7f1d1d"
};

const keptCellStyle = {
  background: "#dcfce7",
  color: "#14532d"
};

const criteriaBox = {
  background: "#f8fbff",
  border: "1px dashed #b9d3ea",
  borderRadius: "8px",
  padding: "10px",
  marginBottom: "10px"
};

const criteriaText = {
  margin: "4px 0",
  color: "#264760",
  lineHeight: "1.4"
};

const stepCard = {
  marginBottom: "12px",
  border: "1px solid #dbe7f3",
  borderRadius: "10px",
  padding: "12px",
  background: "#fbfdff"
};

const stepHeader = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginBottom: "8px"
};

const stepTag = {
  background: "#d7e7f8",
  color: "#1a4568",
  borderRadius: "999px",
  padding: "2px 10px",
  fontSize: "12px",
  fontWeight: 600
};

const stepTitle = {
  color: "#12324a"
};

const stepText = {
  margin: "0 0 6px 0",
  color: "#1f415d",
  lineHeight: "1.45"
};

const stepHint = {
  margin: 0,
  color: "#5f7c96",
  fontSize: "14px"
};

const flowBox = {
  marginBottom: "10px",
  background: "#f8fbff",
  border: "1px dashed #bfd8ee",
  borderRadius: "8px",
  padding: "10px"
};

const flowTitle = {
  color: "#12324a",
  fontWeight: 700,
  marginBottom: "8px"
};

const flowContent = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap"
};

const flowSide = {
  display: "flex",
  gap: "6px",
  flexWrap: "wrap"
};

const removedChip = {
  background: "#fca5a5",
  color: "#7f1d1d",
  border: "1px solid #ef4444",
  padding: "3px 8px",
  borderRadius: "999px",
  fontSize: "12px",
  textDecoration: "line-through"
};

const keptChip = {
  background: "#86efac",
  color: "#14532d",
  border: "1px solid #22c55e",
  padding: "3px 8px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 700
};

const flowArrow = {
  color: "#0f5e9c",
  fontWeight: 700,
  fontSize: "18px"
};

const flowHint = {
  margin: "8px 0 0 0",
  color: "#4e6b84",
  fontSize: "13px"
};

const saddleSvg = {
  width: "100%",
  border: "1px solid #dbe7f3",
  borderRadius: "10px",
  background: "#ffffff"
};

const graphTitle = {
  fill: "#1f415d",
  fontSize: "13px",
  fontWeight: 700
};

const nodeLabel = {
  fill: "#12324a",
  fontSize: "12px",
  fontWeight: 600
};

const graphHint = {
  margin: "8px 0 0 0",
  color: "#5f7c96",
  lineHeight: "1.45"
};

const animationStyles = `
  @keyframes fadeSlideIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes cellExit {
    from {
      opacity: 1;
      transform: scale(1);
      filter: saturate(100%);
    }
    to {
      opacity: 0.82;
      transform: scale(0.985);
      filter: saturate(75%);
    }
  }

  @keyframes cellEnter {
    from {
      opacity: 0.82;
      transform: scale(0.985);
      filter: saturate(75%);
    }
    to {
      opacity: 1;
      transform: scale(1);
      filter: saturate(100%);
    }
  }
`;

const conclusionItem = {
  margin: "8px 0",
  color: "#264760",
  lineHeight: "1.5"
};

const muted = {
  color: "#5f7c96",
  lineHeight: "1.5"
};

const actions = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  justifyContent: "flex-start"
};

const buttonPrimary = {
  padding: "10px 16px",
  border: "none",
  borderRadius: "8px",
  background: "#0f5e9c",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 600
};

const buttonSecondary = {
  ...buttonPrimary,
  background: "#1f4f78"
};

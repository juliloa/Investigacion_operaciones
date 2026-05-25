import React from "react";
import { formatNumber } from "../utils/validation";

const EquilibriumMatrix = ({ matrix, rowNames, colNames, rowMin, colMax, saddleCells = {} }) => {
  const cols = colNames.length;
  const rows = rowNames.length;
  const cellWidth = 98;
  const cellHeight = 58;
  const labelWidth = 118;
  const labelHeight = 34;
  const width = labelWidth + cols * cellWidth + 20;
  const height = labelHeight + rows * cellHeight + 20;

  const saddleKeySet = new Set(Object.keys(saddleCells));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Matriz de equilibrio" style={{ width: "100%" }}>
      <rect x="0" y="0" width={width} height={height} fill="#ffffff" />

      {colNames.map((name, colIndex) => (
        <text
          key={name}
          x={labelWidth + colIndex * cellWidth + cellWidth / 2}
          y="20"
          textAnchor="middle"
          style={{ fill: "#0f172a", fontSize: "12px", fontWeight: 700 }}
        >
          {name}
        </text>
      ))}

      {rowNames.map((name, rowIndex) => (
        <text key={name} x="12" y={labelHeight + rowIndex * cellHeight + cellHeight / 2 + 4} style={{ fill: "#0f172a", fontSize: "12px", fontWeight: 700 }}>
          {name}
        </text>
      ))}

      {matrix.map((row, rowIndex) =>
        row.map((value, colIndex) => {
          const x = labelWidth + colIndex * cellWidth;
          const y = labelHeight + rowIndex * cellHeight;
          const isRowMin = rowMin && value === rowMin[rowIndex];
          const isColMax = colMax && value === colMax[colIndex];
          const isSaddle = saddleKeySet.has(`${rowIndex}-${colIndex}`);

          return (
            <g key={`${rowIndex}-${colIndex}`}>
              <rect x={x} y={y} width={cellWidth - 8} height={cellHeight - 8} rx="8" fill="#f8fbff" stroke="#dbe7f3" />

              {isRowMin && !isSaddle && (
                <circle cx={x + cellWidth / 2 - 2} cy={y + cellHeight / 2 - 1} r="14" fill="rgba(245, 158, 11, 0.12)" stroke="#f59e0b" strokeWidth="2.5" />
              )}

              {isColMax && !isSaddle && (
                <circle cx={x + cellWidth / 2 - 2} cy={y + cellHeight / 2 - 1} r="12" fill="rgba(37, 99, 235, 0.12)" stroke="#2563eb" strokeWidth="2.5" />
              )}

              {isSaddle && (
                <circle cx={x + cellWidth / 2 - 2} cy={y + cellHeight / 2 - 1} r="15" fill="rgba(22, 163, 74, 0.14)" stroke="#16a34a" strokeWidth="3" />
              )}

              <text x={x + cellWidth / 2 - 2} y={y + cellHeight / 2 + 4} textAnchor="middle" style={{ fill: "#12324a", fontSize: "13px", fontWeight: 700 }}>
                {formatNumber(value)}
              </text>
            </g>
          );
        })
      )}
    </svg>
  );
};

export default EquilibriumMatrix;

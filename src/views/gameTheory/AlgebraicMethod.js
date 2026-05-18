import React, { useState } from "react";
import { analyzeGame } from "./gameTheoryUtils";

const COLORS = ["#1d4ed8", "#dc2626", "#059669", "#7c3aed", "#ea580c", "#0891b2"];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const format = (value) => Number(value).toFixed(4);

const projectMatrixToColumns = (matrix, sourceColNames, targetColNames) => {
  if (!Array.isArray(matrix) || !matrix.length || !Array.isArray(sourceColNames)) {
    return { ok: false, reason: "No hay matriz base para proyectar columnas." };
  }

  const indexes = targetColNames.map((targetName) =>
    sourceColNames.findIndex((name) => name === targetName)
  );

  if (indexes.some((idx) => idx < 0)) {
    return {
      ok: false,
      reason: "No fue posible mapear todas las columnas finales dentro de la matriz original."
    };
  }

  const projected = matrix.map((row) => indexes.map((idx) => Number(row[idx])));
  return { ok: true, matrix: projected };
};

const buildAlgebraicData = (matrix, rowNames) => {
  if (!matrix.length || matrix[0]?.length !== 2) {
    return {
      isApplicable: false,
      reason:
        "El metodo algebraico grafico requiere una matriz final con exactamente 2 columnas para modelar y = a*p + b*(1-p)."
    };
  }

  const lines = matrix.map((row, index) => {
    const a = Number(row[0]);
    const b = Number(row[1]);
    const m = a - b;
    const c = b;

    return {
      name: rowNames[index],
      a,
      b,
      m,
      c,
      yAt0: b,
      yAt1: a,
      color: COLORS[index % COLORS.length]
    };
  });

  const intersections = [];
  for (let i = 0; i < lines.length; i += 1) {
    for (let j = i + 1; j < lines.length; j += 1) {
      const l1 = lines[i];
      const l2 = lines[j];
      const denominator = l1.m - l2.m;
      if (Math.abs(denominator) < 1e-9) continue;

      const x = (l2.c - l1.c) / denominator;
      if (x < -1e-9 || x > 1 + 1e-9) continue;

      const xClamped = clamp(x, 0, 1);
      const y = l1.m * xClamped + l1.c;

      intersections.push({
        x: xClamped,
        y,
        pair: [l1.name, l2.name]
      });
    }
  }

  const candidatesY = [
    ...lines.flatMap((line) => [line.yAt0, line.yAt1]),
    ...intersections.map((point) => point.y)
  ];

  const yMinRaw = Math.min(...candidatesY);
  const yMaxRaw = Math.max(...candidatesY);
  const ySpan = Math.max(1, yMaxRaw - yMinRaw);
  const yMin = yMinRaw - ySpan * 0.1;
  const yMax = yMaxRaw + ySpan * 0.1;

  const breakpoints = [0, 1, ...intersections.map((point) => point.x)]
    .sort((a, b) => a - b)
    .filter((value, index, arr) => index === 0 || Math.abs(value - arr[index - 1]) > 1e-6);

  const strategyIntervals = [];
  for (let i = 0; i < breakpoints.length - 1; i += 1) {
    const left = breakpoints[i];
    const right = breakpoints[i + 1];
    const mid = (left + right) / 2;

    const values = lines.map((line) => ({
      name: line.name,
      y: line.m * mid + line.c
    }));

    const maxValue = Math.max(...values.map((v) => v.y));
    const winners = values.filter((v) => Math.abs(v.y - maxValue) < 1e-6).map((v) => v.name);

    strategyIntervals.push({
      left,
      right,
      winners,
      value: maxValue
    });
  }

  const enrichedIntersections = intersections.map((point) => {
    const breakpointIndex = breakpoints.findIndex((value) => Math.abs(value - point.x) < 1e-6);
    const leftInterval = breakpointIndex > 0 ? strategyIntervals[breakpointIndex - 1] : null;
    const rightInterval = breakpointIndex >= 0 ? strategyIntervals[breakpointIndex] : null;

    return {
      ...point,
      leftWinners: leftInterval?.winners || [],
      rightWinners: rightInterval?.winners || [],
      leftValue: leftInterval?.value ?? null,
      rightValue: rightInterval?.value ?? null
    };
  });

  return {
    isApplicable: true,
    lines,
    intersections: enrichedIntersections,
    yMin,
    yMax,
    strategyIntervals
  };
};

const AlgebraicChart = ({ lines, intersections, yMin, yMax, strategyIntervals = [] }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const width = 820;
  const height = 420;
  const margin = { top: 24, right: 24, bottom: 56, left: 68 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const toX = (p) => margin.left + p * innerWidth;
  const toY = (y) => margin.top + ((yMax - y) / (yMax - yMin)) * innerHeight;

  const yTicks = 6;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) =>
    yMin + ((yMax - yMin) * i) / yTicks
  );

  const activePoint = hoveredPoint
    ? {
        ...hoveredPoint,
        lineValues: lines.map((line) => ({
          name: line.name,
          color: line.color,
          value: line.m * hoveredPoint.x + line.c
        }))
      }
    : null;

  const activeIndex = activePoint
    ? intersections.findIndex((point) => Math.abs(point.x - activePoint.x) < 1e-6 && Math.abs(point.y - activePoint.y) < 1e-6)
    : -1;

  const activeInterval = activePoint && activeIndex >= 0 && strategyIntervals.length
    ? {
        left: strategyIntervals[Math.max(0, activeIndex - 1)] || null,
        right: strategyIntervals[Math.min(strategyIntervals.length - 1, activeIndex)] || null
      }
    : null;

  const winnerLabel = activeInterval?.right?.winners?.length
    ? activeInterval.right.winners.join(" o ")
    : activePoint?.lineValues?.length
      ? activePoint.lineValues.reduce((best, current) => (current.value > best.value ? current : best), activePoint.lineValues[0])?.name
      : null;

  const tooltipLeft = activePoint ? Math.min(Math.max(toX(activePoint.x) + 14, 12), width - 286) : 0;
  const tooltipTop = activePoint ? Math.min(Math.max(toY(activePoint.y) - 18, 12), height - 184) : 0;

  return (
    <div style={chartWrap}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={svgStyle}
        role="img"
        aria-label="Grafico metodo algebraico"
        onMouseLeave={() => setHoveredPoint(null)}
      >
        <rect x="0" y="0" width={width} height={height} fill="#ffffff" />

        {yTickValues.map((tick, index) => (
          <g key={`yt-${index}`}>
            <line
              x1={margin.left}
              y1={toY(tick)}
              x2={width - margin.right}
              y2={toY(tick)}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
            <text x={margin.left - 8} y={toY(tick) + 4} textAnchor="end" style={axisLabel}>
              {format(tick)}
            </text>
          </g>
        ))}

        <line x1={margin.left} y1={margin.top} x2={margin.left} y2={height - margin.bottom} stroke="#0f172a" strokeWidth="1.6" />
        <line x1={margin.left} y1={height - margin.bottom} x2={width - margin.right} y2={height - margin.bottom} stroke="#0f172a" strokeWidth="1.6" />

        {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
          <g key={`xt-${tick}`}>
            <line
              x1={toX(tick)}
              y1={height - margin.bottom}
              x2={toX(tick)}
              y2={height - margin.bottom + 6}
              stroke="#0f172a"
              strokeWidth="1"
            />
            <text x={toX(tick)} y={height - margin.bottom + 22} textAnchor="middle" style={axisLabel}>
              {tick.toFixed(4)}
            </text>
          </g>
        ))}

        {lines.map((line) => (
          <g key={line.name}>
            <line
              x1={toX(0)}
              y1={toY(line.yAt0)}
              x2={toX(1)}
              y2={toY(line.yAt1)}
              stroke={line.color}
              strokeWidth="2.8"
            />
            <circle cx={toX(0)} cy={toY(line.yAt0)} r="4" fill={line.color} />
            <circle cx={toX(1)} cy={toY(line.yAt1)} r="4" fill={line.color} />
          </g>
        ))}

        {intersections.map((point, index) => (
          <g
            key={`in-${index}`}
            onMouseEnter={() => setHoveredPoint(point)}
            onMouseMove={() => setHoveredPoint(point)}
            onMouseLeave={() => setHoveredPoint(null)}
            style={{ cursor: "pointer" }}
          >
            {/* Línea punteada desde p hacia la intersección */}
            <line
              x1={toX(point.x)}
              y1={height - margin.bottom}
              x2={toX(point.x)}
              y2={toY(point.y)}
              stroke="#6b7280"
              strokeWidth="1.2"
              strokeDasharray="4,4"
            />
            {/* Línea punteada desde (1-p) hacia la intersección */}
            <line
              x1={toX(1 - point.x)}
              y1={height - margin.bottom}
              x2={toX(point.x)}
              y2={toY(point.y)}
              stroke="#6b7280"
              strokeWidth="1.2"
              strokeDasharray="4,4"
            />
            <circle cx={toX(point.x)} cy={toY(point.y)} r="8" fill="transparent" />
            <circle cx={toX(point.x)} cy={toY(point.y)} r="5" fill="#111827" />
          </g>
        ))}

        <text x={width / 2} y={height - 12} textAnchor="middle" style={axisTitle}>
          p (probabilidad de la primera columna) | (1-p) para la segunda columna
        </text>
        <text
          x="18"
          y={height / 2}
          textAnchor="middle"
          transform={`rotate(-90, 18, ${height / 2})`}
          style={axisTitle}
        >
          Valor esperado para cada estrategia de fila
        </text>
      </svg>

      {activePoint && (
        <div style={{ ...tooltipBox, left: tooltipLeft, top: tooltipTop }}>
          <div style={tooltipHeader}>Punto de cruce</div>
          <div style={tooltipLine}><strong>p:</strong> {format(activePoint.x)}</div>
          <div style={tooltipLine}><strong>1-p:</strong> {format(1 - activePoint.x)}</div>
          <div style={tooltipLine}><strong>Valor:</strong> {format(activePoint.y)}</div>

          <div style={tooltipSectionTitle}>Ganancias</div>
          {activePoint.lineValues.map((item) => (
            <div key={item.name} style={tooltipLine}>
              <span style={{ color: item.color, fontWeight: 700 }}>{item.name}:</span> {format(item.value)}
            </div>
          ))}

          <div style={tooltipSectionTitle}>Conclusión</div>
          <div style={tooltipLine}>
            {activePoint.leftWinners?.length && activePoint.rightWinners?.length && activePoint.leftWinners.join(", ") !== activePoint.rightWinners.join(", ")
              ? `En este cruce cambian las mejores respuestas: a la izquierda conviene ${activePoint.leftWinners.join(" o ")} y a la derecha ${activePoint.rightWinners.join(" o ")}.`
              : `En este punto se igualan las utilidades de ${activePoint.pair.join(" y ")}.`}
          </div>

          <div style={tooltipSectionTitle}>Recomendación</div>
          <div style={tooltipLine}>
            {winnerLabel
              ? `La estrategia dominante en este punto es ${winnerLabel}.`
              : "Revisar la envolvente superior para definir la mejor respuesta."}
          </div>
        </div>
      )}
    </div>
  );
};

const StrategyLegend = ({ lines, title }) => {
  if (!lines?.length) return null;

  return (
    <div style={legendWrap}>
      <p style={legendTitle}>{title}</p>
      <div style={legendItems}>
        {lines.map((line) => (
          <div key={line.name} style={legendItem}>
            <span style={{ ...legendDot, background: line.color }} />
            <span style={legendLabel}>{line.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const SingleCellChart = ({ value, rowName, colName }) => (
  <svg viewBox="0 0 720 220" style={svgStyle} role="img" aria-label="Resultado puntual 1x1">
    <rect x="0" y="0" width="720" height="220" fill="#ffffff" />
    <line x1="80" y1="170" x2="640" y2="170" stroke="#0f172a" strokeWidth="1.6" />
    <line x1="120" y1="36" x2="120" y2="170" stroke="#0f172a" strokeWidth="1.6" />

    <circle cx="400" cy="90" r="10" fill="#16a34a" />
    <text x="400" y="72" textAnchor="middle" style={axisTitle}>({rowName}, {colName})</text>
    <text x="400" y="112" textAnchor="middle" style={pointLabel}>Valor = {format(value)}</text>

    <text x="360" y="200" textAnchor="middle" style={axisLabel}>Estrategia unica</text>
    <text
      x="30"
      y="112"
      textAnchor="middle"
      transform="rotate(-90, 30, 112)"
      style={axisLabel}
    >
      Valor del juego
    </text>
  </svg>
);

const AlgebraicMethod = ({ gameData, onBack, onGoData }) => {
  if (!gameData?.matrix?.length || !gameData?.matrix?.[0]?.length) {
    return (
      <div style={container}>
        <h2 style={title}>Metodo algebraico</h2>
        <p style={muted}>No hay una matriz cargada para aplicar el metodo.</p>
        <button onClick={onGoData} style={buttonPrimary}>Ir a datos del juego</button>
      </div>
    );
  }

  const analysis = analyzeGame(gameData);
  const algebraicFinal = buildAlgebraicData(analysis.reducedMatrix, analysis.reducedRowNames);

  const fullProjection = projectMatrixToColumns(
    analysis.originalMatrix,
    analysis.colNames,
    analysis.reducedColNames
  );

  const algebraicComplete = fullProjection.ok
    ? buildAlgebraicData(fullProjection.matrix, analysis.rowNames)
    : {
        isApplicable: false,
        reason: fullProjection.reason
      };

  const isSingleCell =
    analysis.reducedMatrix.length === 1 && analysis.reducedMatrix[0]?.length === 1;
  const singleValue = isSingleCell ? Number(analysis.reducedMatrix[0][0]) : 0;

  return (
    <div style={container}>
      <h2 style={title}>Metodo algebraico</h2>

      <div style={panel}>
        <h3 style={panelTitle}>Matriz final de la reduccion</h3>
        <p style={text}>
          Se toma la matriz reducida del analisis sucesivo para construir las ecuaciones lineales por estrategia de filas.
        </p>

        <div style={matrixWrap}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}></th>
                {analysis.reducedColNames.map((colName, index) => (
                  <th key={index} style={th}>{colName}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {analysis.reducedMatrix.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <th style={rowHeader}>{analysis.reducedRowNames[rowIndex]}</th>
                  {row.map((value, colIndex) => (
                    <td key={colIndex} style={td}>{format(value)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isSingleCell && (
        <>
          <div style={panel}>
            <h3 style={panelTitle}>Grafica para matriz final 1x1</h3>
            <p style={text}>
              Como la reduccion termino en una sola celda, no hace falta resolver ecuaciones en p.
              El resultado es puntual y se muestra en la grafica siguiente.
            </p>
            <SingleCellChart
              value={singleValue}
              rowName={analysis.reducedRowNames[0]}
              colName={analysis.reducedColNames[0]}
            />
          </div>

          <div style={panel}>
            <h3 style={panelTitle}>Conclusiones y Analisis</h3>
            <p style={text}>
              <strong>Resultado deterministico:</strong> estrategia de fila {analysis.reducedRowNames[0]} contra estrategia de columna {analysis.reducedColNames[0]}.
            </p>
            <p style={text}>
              <strong>Valor del juego:</strong> {format(singleValue)}.
            </p>
            <p style={text}>
              <strong>Analisis:</strong> Como existe un punto silla en la matriz reducida (1x1), 
              el equilibrio se alcanza con estrategias puras. No hace falta otro método 
              porque ambos jugadores tienen una unica opcion optima.
            </p>
          </div>
        </>
      )}

      {!isSingleCell && !algebraicFinal.isApplicable && (
        <div style={panel}>
          <h3 style={panelTitle}>Ecuaciones y grafica</h3>
          <p style={muted}>{algebraicFinal.reason}</p>
          <p style={muted}>
            Para esta formulacion lineal, si: deben quedar exactamente 2 columnas para usar y = a*p + b*(1-p).
            Con 3 o mas columnas se requiere un metodo grafico/general distinto (programacion lineal o envolvente por pares).
          </p>
        </div>
      )}

      {!isSingleCell && algebraicFinal.isApplicable && (
        <>
          <div style={panel}>
            <h3 style={panelTitle}>Ecuaciones del metodo algebraico</h3>
            {algebraicFinal.lines.map((line, index) => (
              <p key={index} style={equation}>
                <span style={{ ...dot, background: line.color }} />
                {line.name}: y = {format(line.a)}p + {format(line.b)}(1-p) = {format(line.m)}p + {format(line.c)}
              </p>
            ))}
          </div>

          {/* Comparación de matrices */}
          <div style={panel}>
            <h3 style={panelTitle}>Comparacion: Matriz Original vs Matriz Reducida</h3>
            
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              {/* Matriz original */}
              <div style={{ flex: 1, minWidth: "300px" }}>
                <h4 style={{ ...subTitle, color: "#dc2626" }}>Matriz Original (todas las estrategias)</h4>
                <div style={matrixWrap}>
                  <table style={table}>
                    <thead>
                      <tr>
                        <th style={th}></th>
                        {analysis.colNames.map((colName, index) => (
                          <th key={index} style={{...th, background: "#fef2f2"}}>{colName}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.originalMatrix.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          <th style={{...rowHeader, background: "#fef2f2"}}>{analysis.rowNames[rowIndex]}</th>
                          {row.map((value, colIndex) => (
                            <td key={colIndex} style={{...td, background: rowIndex >= analysis.reducedMatrix.length ? "#fef2f2" : "#ffffff"}}>
                              {format(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p style={{...text, fontSize: "12px", color: "#dc2626"}}>
                  * Las estrategias en rojo fueron eliminadas por dominancia
                </p>
              </div>

              {/* Matriz reducida */}
              <div style={{ flex: 1, minWidth: "300px" }}>
                <h4 style={{ ...subTitle, color: "#059669" }}>Matriz Reducida (estrategias sobrevivientes)</h4>
                <div style={matrixWrap}>
                  <table style={table}>
                    <thead>
                      <tr>
                        <th style={th}></th>
                        {analysis.reducedColNames.map((colName, index) => (
                          <th key={index} style={{...th, background: "#ecfdf5"}}>{colName}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.reducedMatrix.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          <th style={{...rowHeader, background: "#ecfdf5"}}>{analysis.reducedRowNames[rowIndex]}</th>
                          {row.map((value, colIndex) => (
                            <td key={colIndex} style={{...td, background: "#ecfdf5"}}>
                              {format(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p style={{...text, fontSize: "12px", color: "#059669"}}>
                  * Estas estrategias sobrevivieron a la eliminacion por dominancia
                </p>
              </div>
            </div>

            <p style={text}>
              <strong>Diferencia clave:</strong> La matriz original tiene {analysis.originalMatrix.length} filas y {analysis.colNames.length} columnas.
              La matriz reducida tiene {analysis.reducedMatrix.length} filas y {analysis.reducedColNames.length} columnas.
              Las estrategias eliminadas ({analysis.rowNames.length - analysis.reducedMatrix.length} filas) no afectan el resultado del juego.
            </p>
          </div>

          <div style={panel}>
            <h3 style={panelTitle}>Grafica completa (todas las estrategias de la matriz original)</h3>

            {algebraicComplete.isApplicable ? (
              <>
                <p style={text}>
                  Esta grafica incluye <strong>TODAS</strong> las estrategias de fila de la matriz original 
                  proyectadas sobre las dos columnas finales [{analysis.reducedColNames.join(", ")}].
                  Las estrategias eliminadas se muestran en <span style={{color: "#dc2626"}}>rojo</span> en la tabla de arriba.
                  Muestra el comportamiento de cada estrategia a lo largo de todo el rango de probabilidades.
                </p>
                <AlgebraicChart
                  lines={algebraicComplete.lines}
                  intersections={algebraicComplete.intersections}
                  yMin={algebraicComplete.yMin}
                  yMax={algebraicComplete.yMax}
                  strategyIntervals={algebraicComplete.strategyIntervals}
                />
                
                {/* Análisis de la gráfica completa */}
                {algebraicComplete.strategyIntervals.length > 0 && (
                  <div style={listBlock}>
                    <p style={text}><strong>Analisis de la grafica completa (todas las estrategias):</strong></p>
                    <p style={text}>
                      La linea superior (envolvente) representa la mejor estrategia de filas para cada valor de p.
                      Los puntos donde las líneas se cruzan marcan cambios de estrategia en el análisis.
                    </p>
                    {algebraicComplete.strategyIntervals.map((interval, index) => (
                      <p key={index} style={text}>
                        - En p ∈ [{format(interval.left)}, {format(interval.right)}] 
                        (primera columna: {format(interval.left*100)}%-{format(interval.right*100)}%, 
                        segunda columna: {format((1-interval.right)*100)}%-{format((1-interval.left)*100)}%):
                        estrategia optima = <strong>{interval.winners.join(" o ")}</strong>, valor = {format(interval.value)}
                      </p>
                    ))}
                  </div>
                )}
                
                <StrategyLegend
                  lines={algebraicComplete.lines}
                  title="Leyenda de colores (grafica completa - todas las estrategias)"
                />
              </>
            ) : (
              <p style={muted}>{algebraicComplete.reason}</p>
            )}
          </div>

          <div style={panel}>
            <h3 style={panelTitle}>Grafica de la matriz final reducida (solo estrategias sobrevivientes)</h3>
            <p style={text}>
              Esta grafica muestra <strong>SOLO las estrategias que sobrevivieron</strong> a la eliminacion por dominancia:
              [{analysis.reducedRowNames.join(", ")}] vs [{analysis.reducedColNames.join(", ")}].
            </p>
            <AlgebraicChart
              lines={algebraicFinal.lines}
              intersections={algebraicFinal.intersections}
              yMin={algebraicFinal.yMin}
              yMax={algebraicFinal.yMax}
              strategyIntervals={algebraicFinal.strategyIntervals}
            />
            <StrategyLegend
              lines={algebraicFinal.lines}
              title="Leyenda de colores (matriz final reducida)"
            />

            {algebraicFinal.intersections.length === 0 && (
              <p style={muted}>No hay intersecciones internas en [0, 1]. Una estrategia domina en todo el rango.</p>
            )}

            {algebraicFinal.intersections.length > 0 && (
              <div style={listBlock}>
                <p style={text}><strong>Puntos de corte en matriz reducida:</strong></p>
                {algebraicFinal.intersections.map((point, index) => (
                  <p key={index} style={text}>
                    - Cruce {index + 1}: {point.pair[0]} con {point.pair[1]} en p = {point.x.toFixed(4)} ({format(point.x*100)}%) 
                    y 1-p = {format(1-point.x)} ({format((1-point.x)*100)}%), valor = {point.y.toFixed(4)}.
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Análisis comparativo */}
          <div style={panel}>
            <h3 style={panelTitle}>Analisis Comparativo: Grafica Completa vs Grafica Reducida</h3>
            
            <div style={{ display: "flex", gap: "20px", marginBottom: "15px" }}>
              <div style={{ flex: 1, padding: "12px", background: "#fef2f2", borderRadius: "8px", border: "1px solid #fecaca" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#dc2626" }}>Grafica Completa</h4>
                <ul style={{ margin: 0, paddingLeft: "18px", color: "#24445d" }}>
                  <li>Incluye TODAS las {analysis.originalMatrix.length} estrategias de fila</li>
                  <li>Muestra estrategias eliminadas (no afectan el resultado)</li>
                  <li>Mas lineas = mas informacion visual</li>
                  <li>Intersections: {algebraicComplete.intersections.length}</li>
                </ul>
              </div>
              
              <div style={{ flex: 1, padding: "12px", background: "#ecfdf5", borderRadius: "8px", border: "1px solid #a7f3d0" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#059669" }}>Grafica Reducida</h4>
                <ul style={{ margin: 0, paddingLeft: "18px", color: "#24445d" }}>
                  <li>Solo {analysis.reducedMatrix.length} estrategias sobrevivientes</li>
                  <li>Mas facil de interpretar</li>
                  <li>Focus en las estrategias relevantes</li>
                  <li>Intersections: {algebraicFinal.intersections.length}</li>
                </ul>
              </div>
            </div>

            <p style={text}>
              <strong>Conclusion:</strong> Ambas graficas llegan al mismo resultado de equilibrio. 
              La grafica completa muestra todas las estrategias (incluyendo las eliminadas), 
              mientras que la grafica reducida se enfoca solo en las que importan para el analisis final.
              Los puntos de equilibrio son identicos en ambas.
            </p>
          </div>

          <div style={panel}>
            <h3 style={panelTitle}>Conclusiones y Analisis del Equilibrio</h3>
            
            {algebraicFinal.strategyIntervals.length === 0 && (
              <p style={text}>
                No hay intervalos internos para comparar estrategias (solo extremos p = 0 o p = 1).
                Una estrategia domina en todo el rango de probabilidad.
              </p>
            )}

            {/* Análisis de intervalos y equilibrio */}
            {algebraicFinal.strategyIntervals.length > 0 && (
              <>
                <p style={text}>
                  <strong>Analisis de intervalos de equilibrio:</strong>
                </p>
                {algebraicFinal.strategyIntervals.map((interval, index) => (
                  <p key={index} style={text}>
                    - Para p en [{interval.left.toFixed(4)}, {interval.right.toFixed(4)}] 
                    (es decir, probabilidad de la primera columna entre {format(interval.left*100)}% y {format(interval.right*100)}%),
                    la mejor estrategia de filas es <strong>{interval.winners.join(" o ")}</strong> 
                    con valor esperado aproximado de {interval.value.toFixed(4)}.
                  </p>
                ))}
              </>
            )}

            {/* Análisis de los puntos de corte */}
            {algebraicFinal.intersections.length > 0 && (
              <div style={listBlock}>
                <p style={text}><strong>Puntos de corte (donde cambia la estrategia optima):</strong></p>
                {algebraicFinal.intersections.map((point, index) => (
                  <p key={index} style={text}>
                    - Cruce {index + 1} entre {point.pair[0]} y {point.pair[1]}:<br/>
                    &nbsp;&nbsp;p = {point.x.toFixed(4)} ({format(point.x*100)}% para primera columna)<br/>
                    &nbsp;&nbsp;1-p = {format(1 - point.x)} ({format((1-point.x)*100)}% para segunda columna)<br/>
                    &nbsp;&nbsp;Valor del juego en este punto: {point.y.toFixed(4)}
                  </p>
                ))}
              </div>
            )}

            {/* Recomendación de equilibrio */}
            <p style={text}>
              <strong>Recomendacion de equilibrio:</strong> La estrategia optima depende del valor de p (probabilidad de usar la primera columna).
              Si el jugador de columnas elige p = 0.7 (70% probabilidad primera columna), entonces 1-p = 0.3 (30% probabilidad segunda columna).
              El jugador de filas debe elegir la estrategia que maximice su pago esperado segun el intervalo donde caiga p.
            </p>

            <p style={text}>
              <strong>Resumen del equilibrio:</strong> La decision final se apoya en la envolvente superior de rectas: 
              en cada rango de p se elige la estrategia que maximiza el pago esperado. 
              El equilibrio se interpreta a partir de los puntos donde las rectas se cruzan.
              Si p = {algebraicFinal.intersections[0]?.x.toFixed(4) || "N/A"}, entonces el valor del juego es {algebraicFinal.intersections[0]?.y.toFixed(4) || "N/A"}.
            </p>

            {/* Tabla resumen de equilibrio */}
            <div style={listBlock}>
              <p style={text}><strong>Tabla resumen del equilibrio:</strong></p>
              <table style={{...table, width: "100%", marginTop: "10px"}}>
                <thead>
                  <tr>
                    <th style={{...th, textAlign: "left"}}>Intervalo de p</th>
                    <th style={{...th, textAlign: "left"}}>Prob. 1ra columna</th>
                    <th style={{...th, textAlign: "left"}}>Prob. 2da columna</th>
                    <th style={{...th, textAlign: "left"}}>Estrategia optima (filas)</th>
                    <th style={{...th, textAlign: "left"}}>Valor esperado</th>
                  </tr>
                </thead>
                <tbody>
                  {algebraicFinal.strategyIntervals.map((interval, index) => (
                    <tr key={index}>
                      <td style={td}>[{format(interval.left)}, {format(interval.right)}]</td>
                      <td style={td}>{format(interval.left*100)}% - {format(interval.right*100)}%</td>
                      <td style={td}>{format((1-interval.right)*100)}% - {format((1-interval.left)*100)}%</td>
                      <td style={td}><strong>{interval.winners.join(", ")}</strong></td>
                      <td style={td}>{format(interval.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div style={actions}>
        <button onClick={onBack} style={buttonSecondary}>Volver a analisis</button>
        <button onClick={onGoData} style={buttonPrimary}>Volver a datos</button>
      </div>
    </div>
  );
};

export default AlgebraicMethod;

const container = {
  padding: "24px",
  background: "#f6f8fc",
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

const panel = {
  background: "#ffffff",
  border: "1px solid #dbe7f3",
  borderRadius: "10px",
  padding: "14px"
};

const panelTitle = {
  marginTop: 0,
  color: "#12324a"
};

const subTitle = {
  margin: "10px 0 8px 0",
  fontSize: "16px",
  fontWeight: 600
};

const matrixWrap = {
  overflowX: "auto"
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "360px"
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

const text = {
  margin: "6px 0",
  color: "#24445d",
  lineHeight: "1.5"
};

const muted = {
  margin: "6px 0",
  color: "#5f7c96",
  lineHeight: "1.5"
};

const equation = {
  margin: "8px 0",
  color: "#1d3950",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  lineHeight: "1.45"
};

const dot = {
  width: "12px",
  height: "12px",
  borderRadius: "50%",
  display: "inline-block",
  flexShrink: 0
};

const chartWrap = {
  position: "relative"
};

const svgStyle = {
  width: "100%",
  border: "1px solid #dbe7f3",
  borderRadius: "8px",
  background: "#ffffff"
};

const tooltipBox = {
  position: "absolute",
  width: "270px",
  padding: "12px 14px",
  borderRadius: "10px",
  background: "rgba(15, 23, 42, 0.95)",
  color: "#fff",
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.22)",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  pointerEvents: "none",
  zIndex: 5
};

const tooltipHeader = {
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.03em",
  textTransform: "uppercase",
  marginBottom: "8px"
};

const tooltipLine = {
  fontSize: "12px",
  lineHeight: 1.45,
  marginBottom: "4px"
};

const tooltipSectionTitle = {
  marginTop: "8px",
  marginBottom: "4px",
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#cbd5e1",
  fontWeight: 700
};

const axisLabel = {
  fill: "#334155",
  fontSize: "12px"
};

const axisTitle = {
  fill: "#0f172a",
  fontSize: "13px",
  fontWeight: 600
};

const pointLabel = {
  fill: "#0f172a",
  fontSize: "11px",
  fontWeight: 600
};

const listBlock = {
  marginTop: "10px"
};

const legendWrap = {
  marginTop: "10px",
  background: "#f8fbff",
  border: "1px dashed #bfd8ee",
  borderRadius: "8px",
  padding: "10px"
};

const legendTitle = {
  margin: "0 0 8px 0",
  color: "#12324a",
  fontWeight: 700
};

const legendItems = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px 14px"
};

const legendItem = {
  display: "flex",
  alignItems: "center",
  gap: "6px"
};

const legendDot = {
  width: "12px",
  height: "12px",
  borderRadius: "50%",
  border: "1px solid #1f2937",
  display: "inline-block"
};

const legendLabel = {
  color: "#1f415d",
  fontSize: "13px",
  fontWeight: 600
};

const actions = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap"
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


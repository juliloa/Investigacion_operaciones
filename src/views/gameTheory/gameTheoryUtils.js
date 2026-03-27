const toNumber = (cell) => {
  if (typeof cell === "number") return cell;
  if (typeof cell === "string") {
    const parsed = parseFloat(cell);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (cell && typeof cell === "object" && "value" in cell) {
    const parsed = parseFloat(cell.value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const cloneMatrix = (matrix) => matrix.map((row) => [...row]);

const buildDefaultNames = (prefix, length) =>
  Array.from({ length }, (_, i) => `${prefix} ${i + 1}`);

const getRowMin = (matrix) => matrix.map((row) => Math.min(...row));
const getColMax = (matrix) =>
  matrix[0].map((_, colIndex) =>
    Math.max(...matrix.map((row) => row[colIndex]))
  );

const evaluateCriteria = (matrix) => {
  if (matrix.length === 0 || matrix[0]?.length === 0) {
    return {
      rowMin: [],
      colMax: [],
      maximin: 0,
      minimax: 0,
      hasSaddle: false
    };
  }

  const rowMin = getRowMin(matrix);
  const colMax = getColMax(matrix);
  const maximin = Math.max(...rowMin);
  const minimax = Math.min(...colMax);

  return {
    rowMin,
    colMax,
    maximin,
    minimax,
    hasSaddle: maximin === minimax
  };
};

const pickRowToRemove = (criteria) => {
  const candidates = criteria.rowMin
    .map((value, index) => ({ index, value }))
    .filter((item) => item.value < criteria.maximin);

  if (!candidates.length) return null;

  candidates.sort((a, b) => a.value - b.value || a.index - b.index);
  return candidates[0].index;
};

const pickColToRemove = (criteria) => {
  const candidates = criteria.colMax
    .map((value, index) => ({ index, value }))
    .filter((item) => item.value > criteria.minimax);

  if (!candidates.length) return null;

  candidates.sort((a, b) => b.value - a.value || a.index - b.index);
  return candidates[0].index;
};

const pickReferenceRow = (criteria, removedIndex) => {
  const bestRows = criteria.rowMin
    .map((value, index) => ({ value, index }))
    .filter((item) => item.value === criteria.maximin)
    .sort((a, b) => a.index - b.index);

  if (!bestRows.length) return null;
  if (bestRows[0].index !== removedIndex) return bestRows[0].index;
  return bestRows[1]?.index ?? null;
};

const pickReferenceCol = (criteria, removedIndex) => {
  const bestCols = criteria.colMax
    .map((value, index) => ({ value, index }))
    .filter((item) => item.value === criteria.minimax)
    .sort((a, b) => a.index - b.index);

  if (!bestCols.length) return null;
  if (bestCols[0].index !== removedIndex) return bestCols[0].index;
  return bestCols[1]?.index ?? null;
};

const removeSingleRow = (matrix, rowNames, indexToRemove) => {
  if (indexToRemove === null || matrix.length <= 1) {
    return {
      removedName: null,
      remainingMatrix: cloneMatrix(matrix),
      remainingRowNames: [...rowNames]
    };
  }

  const remainingMatrix = matrix
    .filter((_, rowIndex) => rowIndex !== indexToRemove)
    .map((row) => [...row]);
  const remainingRowNames = rowNames.filter((_, rowIndex) => rowIndex !== indexToRemove);

  return {
    removedName: rowNames[indexToRemove],
    remainingMatrix,
    remainingRowNames
  };
};

const removeSingleCol = (matrix, colNames, indexToRemove) => {
  if (indexToRemove === null || (matrix[0]?.length || 0) <= 1) {
    return {
      removedName: null,
      remainingMatrix: cloneMatrix(matrix),
      remainingColNames: [...colNames]
    };
  }

  const remainingMatrix = matrix.map((row) =>
    row.filter((_, colIndex) => colIndex !== indexToRemove)
  );
  const remainingColNames = colNames.filter((_, colIndex) => colIndex !== indexToRemove);

  return {
    removedName: colNames[indexToRemove],
    remainingMatrix,
    remainingColNames
  };
};

const attemptElimination = (axis, matrix, rowNames, colNames, criteriaBefore) => {
  if (axis === "row") {
    const rowIndex = pickRowToRemove(criteriaBefore);
    if (rowIndex === null) {
      return {
        canEliminate: false,
        action: "rows-maximin",
        removed: [],
        comparedWith: null,
        comparison: null
      };
    }

      const referenceIndex = pickReferenceRow(criteriaBefore, rowIndex);
      const removedValue = criteriaBefore.rowMin[rowIndex];
      const comparedValue =
        referenceIndex !== null ? criteriaBefore.rowMin[referenceIndex] : criteriaBefore.maximin;

    const { removedName, remainingMatrix, remainingRowNames } = removeSingleRow(
      matrix,
      rowNames,
      rowIndex
    );

    return {
      canEliminate: Boolean(removedName),
      action: "rows-maximin",
      removed: removedName ? [removedName] : [],
      matrixAfter: remainingMatrix,
      rowNamesAfter: remainingRowNames,
      colNamesAfter: [...colNames],
      reason:
        "Se elimina una fila por maximin: se retira la fila con minimo estrictamente menor al maximin actual.",
      comparedWith: referenceIndex !== null ? rowNames[referenceIndex] : null,
      comparison: {
        axis: "row",
        removedMetric: removedValue,
        comparedMetric: comparedValue,
        criteriaMetric: criteriaBefore.maximin
      }
    };
  }

  const colIndex = pickColToRemove(criteriaBefore);
  if (colIndex === null) {
    return {
      canEliminate: false,
      action: "cols-minimax",
      removed: [],
      comparedWith: null,
      comparison: null
    };
  }

  const referenceIndex = pickReferenceCol(criteriaBefore, colIndex);
  const removedValue = criteriaBefore.colMax[colIndex];
  const comparedValue =
    referenceIndex !== null ? criteriaBefore.colMax[referenceIndex] : criteriaBefore.minimax;

  const { removedName, remainingMatrix, remainingColNames } = removeSingleCol(
    matrix,
    colNames,
    colIndex
  );

  return {
    canEliminate: Boolean(removedName),
    action: "cols-minimax",
    removed: removedName ? [removedName] : [],
    matrixAfter: remainingMatrix,
    rowNamesAfter: [...rowNames],
    colNamesAfter: remainingColNames,
    reason:
      "Se elimina una columna por minimax: se retira la columna con maximo estrictamente mayor al minimax actual.",
    comparedWith: referenceIndex !== null ? colNames[referenceIndex] : null,
    comparison: {
      axis: "col",
      removedMetric: removedValue,
      comparedMetric: comparedValue,
      criteriaMetric: criteriaBefore.minimax
    }
  };
};

const reduceBySuccessiveCriteria = (matrix, rowNames, colNames) => {
  let currentMatrix = cloneMatrix(matrix);
  let currentRowNames = [...rowNames];
  let currentColNames = [...colNames];
  let preferredAxis = "col";
  const eliminationSteps = [];

  while (true) {
    const criteriaBefore = evaluateCriteria(currentMatrix);

    if (criteriaBefore.hasSaddle) {
      eliminationSteps.push({
        action: "saddle-found",
        reason: "Se encontro punto silla, se detiene la eliminacion.",
        matrixBefore: cloneMatrix(currentMatrix),
        matrixAfter: cloneMatrix(currentMatrix),
        rowNamesBefore: [...currentRowNames],
        rowNamesAfter: [...currentRowNames],
        colNamesBefore: [...currentColNames],
        colNamesAfter: [...currentColNames],
        criteriaBefore,
        criteriaAfter: criteriaBefore,
        removed: []
      });
      break;
    }

    const fallbackAxis = preferredAxis === "row" ? "col" : "row";
    const preferredAttempt = attemptElimination(
      preferredAxis,
      currentMatrix,
      currentRowNames,
      currentColNames,
      criteriaBefore
    );

    let chosenAttempt = preferredAttempt;
    let usedFallback = false;

    if (!preferredAttempt.canEliminate) {
      const fallbackAttempt = attemptElimination(
        fallbackAxis,
        currentMatrix,
        currentRowNames,
        currentColNames,
        criteriaBefore
      );

      if (fallbackAttempt.canEliminate) {
        chosenAttempt = fallbackAttempt;
        usedFallback = true;
      }
    }

    if (!chosenAttempt.canEliminate) {
      const finalCriteria = evaluateCriteria(currentMatrix);
      eliminationSteps.push({
        action: "no-more-eliminations",
        reason:
          "No hay mas eliminaciones posibles ni por filas (maximin) ni por columnas (minimax).",
        matrixBefore: cloneMatrix(currentMatrix),
        matrixAfter: cloneMatrix(currentMatrix),
        rowNamesBefore: [...currentRowNames],
        rowNamesAfter: [...currentRowNames],
        colNamesBefore: [...currentColNames],
        colNamesAfter: [...currentColNames],
        criteriaBefore: finalCriteria,
        criteriaAfter: finalCriteria,
        removed: [],
        attemptedAxis: preferredAxis,
        usedAxis: null,
        usedFallback: false,
        comparedWith: null,
        comparison: null
      });
      break;
    }

    const criteriaAfter = evaluateCriteria(chosenAttempt.matrixAfter);
    const axisLabel = chosenAttempt.action === "rows-maximin" ? "fila" : "columna";
    const preferredLabel = preferredAxis === "row" ? "fila" : "columna";

    eliminationSteps.push({
      action: chosenAttempt.action,
      reason: usedFallback
        ? `Se intento primero por ${preferredLabel}, pero no hubo eliminacion. Se cambio a ${axisLabel} y se elimino ${chosenAttempt.removed.join(", ")}.`
        : chosenAttempt.reason,
      matrixBefore: cloneMatrix(currentMatrix),
      matrixAfter: cloneMatrix(chosenAttempt.matrixAfter),
      rowNamesBefore: [...currentRowNames],
      rowNamesAfter: [...chosenAttempt.rowNamesAfter],
      colNamesBefore: [...currentColNames],
      colNamesAfter: [...chosenAttempt.colNamesAfter],
      criteriaBefore,
      criteriaAfter,
      removed: [...chosenAttempt.removed],
      attemptedAxis: preferredAxis,
      usedAxis: chosenAttempt.action === "rows-maximin" ? "row" : "col",
      usedFallback,
      comparedWith: chosenAttempt.comparedWith,
      comparison: chosenAttempt.comparison
    });

    currentMatrix = chosenAttempt.matrixAfter;
    currentRowNames = chosenAttempt.rowNamesAfter;
    currentColNames = chosenAttempt.colNamesAfter;
    preferredAxis = chosenAttempt.action === "rows-maximin" ? "col" : "row";
  }

  return {
    reducedMatrix: currentMatrix,
    reducedRowNames: currentRowNames,
    reducedColNames: currentColNames,
    eliminationSteps
  };
};

export const analyzeGame = (input) => {
  const payload = Array.isArray(input) ? { matrix: input } : input || {};

  const rawMatrix = Array.isArray(payload.matrix) ? payload.matrix : [];
  const numeric = rawMatrix.map((row) =>
    (Array.isArray(row) ? row : []).map((cell) => toNumber(cell))
  );

  const rowNames =
    Array.isArray(payload.rowNames) && payload.rowNames.length === numeric.length
      ? [...payload.rowNames]
      : buildDefaultNames("Estrategia Fila", numeric.length);

  const colCount = numeric[0]?.length || 0;
  const colNames =
    Array.isArray(payload.colNames) && payload.colNames.length === colCount
      ? [...payload.colNames]
      : buildDefaultNames("Estrategia Columna", colCount);

  if (numeric.length === 0 || numeric[0]?.length === 0) {
    return {
      rowNames,
      colNames,
      originalMatrix: numeric,
      rowMin: [],
      colMax: [],
      maximin: 0,
      minimax: 0,
      hasSaddle: false,
      reducedMatrix: [],
      reducedRowNames: [],
      reducedColNames: [],
      eliminationSteps: [],
      reducedCriteria: {
        rowMin: [],
        colMax: [],
        maximin: 0,
        minimax: 0,
        hasSaddle: false
      }
    };
  }

  const originalCriteria = evaluateCriteria(numeric);

  if (originalCriteria.hasSaddle) {
    return {
      rowNames,
      colNames,
      originalMatrix: numeric,
      rowMin: originalCriteria.rowMin,
      colMax: originalCriteria.colMax,
      maximin: originalCriteria.maximin,
      minimax: originalCriteria.minimax,
      hasSaddle: true,
      reducedMatrix: cloneMatrix(numeric),
      reducedRowNames: [...rowNames],
      reducedColNames: [...colNames],
      eliminationSteps: [],
      reducedCriteria: originalCriteria
    };
  }

  const {
    reducedMatrix,
    reducedRowNames,
    reducedColNames,
    eliminationSteps
  } = reduceBySuccessiveCriteria(numeric, rowNames, colNames);

  const reducedCriteria = evaluateCriteria(reducedMatrix);

  return {
    rowNames,
    colNames,
    originalMatrix: numeric,
    rowMin: originalCriteria.rowMin,
    colMax: originalCriteria.colMax,
    maximin: originalCriteria.maximin,
    minimax: originalCriteria.minimax,
    hasSaddle: originalCriteria.hasSaddle,
    reducedMatrix,
    reducedRowNames,
    reducedColNames,
    eliminationSteps,
    reducedCriteria
  };
};
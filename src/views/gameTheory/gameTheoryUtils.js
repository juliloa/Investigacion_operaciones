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

const rowDominates = (matrix, dominatorIndex, dominatedIndex) => {
  const dominator = matrix[dominatorIndex];
  const dominated = matrix[dominatedIndex];

  const allGreaterOrEqual = dominator.every((value, i) => value >= dominated[i]);
  const atLeastOneGreater = dominator.some((value, i) => value > dominated[i]);

  return allGreaterOrEqual && atLeastOneGreater;
};

const colDominates = (matrix, dominatorIndex, dominatedIndex) => {
  const allLowerOrEqual = matrix.every(
    (row) => row[dominatorIndex] <= row[dominatedIndex]
  );
  const atLeastOneLower = matrix.some(
    (row) => row[dominatorIndex] < row[dominatedIndex]
  );

  return allLowerOrEqual && atLeastOneLower;
};

const findDominatedRowPair = (matrix) => {
  for (let dominated = 0; dominated < matrix.length; dominated += 1) {
    for (let dominator = 0; dominator < matrix.length; dominator += 1) {
      if (dominator === dominated) continue;
      if (rowDominates(matrix, dominator, dominated)) {
        return { dominatedIndex: dominated, dominatorIndex: dominator };
      }
    }
  }
  return null;
};

const findDominatedColPair = (matrix) => {
  const colCount = matrix[0]?.length || 0;
  for (let dominated = 0; dominated < colCount; dominated += 1) {
    for (let dominator = 0; dominator < colCount; dominator += 1) {
      if (dominator === dominated) continue;
      if (colDominates(matrix, dominator, dominated)) {
        return { dominatedIndex: dominated, dominatorIndex: dominator };
      }
    }
  }
  return null;
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
    const pair = findDominatedRowPair(matrix);
    if (!pair) {
      return {
        canEliminate: false,
        action: "rows-maximin",
        removed: [],
        comparedWith: null,
        comparison: null
      };
    }

    const rowIndex = pair.dominatedIndex;
    const referenceIndex = pair.dominatorIndex;

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
        "Se elimina una fila por dominancia estricta: la fila que queda es mayor o igual en todos los elementos y estrictamente mayor en al menos uno.",
      comparedWith: referenceIndex !== null ? rowNames[referenceIndex] : null,
      comparison: {
        axis: "row",
        removedVector: [...matrix[rowIndex]],
        comparedVector: [...matrix[referenceIndex]]
      }
    };
  }

  const pair = findDominatedColPair(matrix);
  if (!pair) {
    return {
      canEliminate: false,
      action: "cols-minimax",
      removed: [],
      comparedWith: null,
      comparison: null
    };
  }

  const colIndex = pair.dominatedIndex;
  const referenceIndex = pair.dominatorIndex;

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
      "Se elimina una columna por dominancia estricta: la columna que queda es menor o igual en todos los elementos y estrictamente menor en al menos uno.",
    comparedWith: referenceIndex !== null ? colNames[referenceIndex] : null,
    comparison: {
      axis: "col",
      removedVector: matrix.map((row) => row[colIndex]),
      comparedVector: matrix.map((row) => row[referenceIndex])
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
          "No hay mas eliminaciones posibles por dominancia estricta ni en filas ni en columnas.",
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
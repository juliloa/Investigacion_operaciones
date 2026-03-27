export const analyzeGame = (matrix) => {
  const numeric = matrix.map(row =>
    row.map(cell => parseFloat(cell.value))
  );

  const rowMin = numeric.map(row => Math.min(...row));
  const colMax = numeric[0].map((_, colIndex) =>
    Math.max(...numeric.map(row => row[colIndex]))
  );

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
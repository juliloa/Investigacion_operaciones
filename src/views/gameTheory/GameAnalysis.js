import React from "react";
import { analyzeGame } from "./gameTheoryUtils";

const GameAnalysis = ({ matrix, onBack }) => {
  if (!matrix) return null;

  const result = analyzeGame(matrix);

  return (
    <div style={{ padding: "20px" }}>
      <h2>📊 Análisis</h2>

      <p><b>Maximin:</b> {result.maximin}</p>
      <p><b>Minimax:</b> {result.minimax}</p>

      {result.hasSaddle ? (
        <p style={{ color: "green" }}>
          ✅ Hay punto silla (equilibrio)
        </p>
      ) : (
        <p style={{ color: "red" }}>
          ❌ No hay punto silla → aplicar mini-max
        </p>
      )}

      <button onClick={onBack}>⬅ Volver</button>
    </div>
  );
};

export default GameAnalysis;
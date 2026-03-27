import React from "react";

const AnalysisScreen = ({ matrix, setStep }) => {
  return (
    <div style={styles.container}>
      <h2>📊 Análisis del Juego</h2>

      <p>Matriz recibida para análisis:</p>
      {matrix && (
        <pre>{JSON.stringify(matrix, null, 2)}</pre>
      )}

      <p>Aquí implementaremos el análisis cuando no hay punto silla (minimax mixto).</p>

      <button onClick={() => setStep(10)} style={styles.btn}>
        ← Volver a Datos
      </button>
    </div>
  );
};

export default AnalysisScreen;

const styles = {
  container: {
    padding: "30px",
    fontFamily: "Inter, sans-serif"
  },
  btn: {
    padding: "10px 20px",
    background: "#007BFF",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  }
};
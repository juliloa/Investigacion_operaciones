import React from "react";

const PoissonAnalysis = ({ poissonData, onBack }) => {
  return (
    <div style={{ padding: "30px", fontFamily: "Inter, sans-serif", background: "#f4f6fb", minHeight: "100vh" }}>
      <h2 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "20px" }}>
        Análisis — Distribución de Poisson
      </h2>
      <p style={{ color: "#6b7280", fontSize: "14px" }}>
        Módulo en construcción...
      </p>
      <button
        onClick={onBack}
        style={{ marginTop: "20px", padding: "10px 16px", background: "#6b7280", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600" }}
      >
        ← Volver
      </button>
    </div>
  );
};

export default PoissonAnalysis;
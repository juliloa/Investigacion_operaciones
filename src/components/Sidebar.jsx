import React from "react";

const Sidebar = ({ currentStep, setStep }) => {
  const steps = [
    "1. Datos",
    "2. Árbol",
    "3. Sensibilidad",
    "4. Árbol con valores",
    "5. Análisis gráfico",
    "6. Gráfica",
    "7. Matriz",
    "8. Árbol con estudio",
    "9. Decisión",
    "10. Evaluación final"
  ];

  return (
    <div style={sidebar}>
      <h2 style={title}>Decisión</h2>

      <div style={list}>
        {steps.map((step, index) => (
          <div
            key={index}
            onClick={() => setStep(index)}
            style={{
              ...item,
              ...(currentStep === index ? activeItem : {})
            }}
          >
            {step}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;

//////////////////////////////////////////////////

// 🎨 ESTILOS ELEGANTES Y CONSISTENTES

const sidebar = {
  width: "230px",
  height: "100vh",
  background: "#ffffff",
  padding: "16px",
  borderRight: "1px solid #e5e5e5",
  position: "fixed",
  left: 0,
  top: 0,
  fontFamily: "Inter, Arial, sans-serif",
  display: "flex",
  flexDirection: "column"
};

const title = {
  fontSize: "18px",
  fontWeight: "600",
  marginBottom: "16px",
  color: "#111"
};

const list = {
  display: "flex",
  flexDirection: "column",
  gap: "6px"
};

const item = {
  padding: "8px 10px",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "13px",
  color: "#333",
  transition: "all 0.2s ease",
  border: "1px solid transparent"
};

const activeItem = {
  background: "#111",
  color: "#fff",
  border: "1px solid #111"
};
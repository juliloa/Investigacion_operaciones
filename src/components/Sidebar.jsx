import React, { useState } from "react";

const Sidebar = ({ currentStep, setStep }) => {
  const [openMenu, setOpenMenu] = useState(null);

  const decisionSteps = [
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

  const gameTheorySteps = [
    "1. Datos",

  ];

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const renderSteps = (steps, baseIndex) => {
    return steps.map((step, index) => {
      const stepIndex = baseIndex + index;
      return (
        <div
          key={stepIndex}
          onClick={() => setStep(stepIndex)}
          style={{
            ...item,
            ...(currentStep === stepIndex ? activeItem : {})
          }}
        >
          {step}
        </div>
      );
    });
  };

  return (
    <div style={sidebar}>
      <h2 style={title}>Sistema</h2>

      <div style={menuContainer}>
        {/* MENÚ DECISIÓN */}
        <div style={menuHeader} onClick={() => toggleMenu("decision")}>
          🧠 Decisión
        </div>

        {openMenu === "decision" && (
          <div style={list}>
            {renderSteps(decisionSteps, 0)}
          </div>
        )}

        {/* MENÚ TEORÍA DEL JUEGO */}
        <div style={menuHeader} onClick={() => toggleMenu("game")}>
          🎮 Teoría del Juego
        </div>

        {openMenu === "game" && (
          <div style={list}>
            {renderSteps(gameTheorySteps, 100)}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;

//////////////////////////////////////////////////

// 🎨 ESTILOS

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

const menuContainer = {
  display: "flex",
  flexDirection: "column",
  gap: "12px"
};

const menuHeader = {
  padding: "10px",
  borderRadius: "6px",
  background: "#f5f5f5",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "14px",
  color: "#111",
  border: "1px solid #e5e5e5"
};

const list = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  paddingLeft: "10px"
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
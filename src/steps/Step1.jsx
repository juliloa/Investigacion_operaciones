import React from "react";
import EditableMatrix from "../components/EditableMatrix";

const Step1 = ({ data, setData, next }) => {
  const { alternatives, states, probabilities, payoff } = data;

  //  ACTUALIZAR NOMBRES
  const updateAlternative = (i, value) => {
    const newAlt = [...alternatives];
    newAlt[i] = value;
    setData({ ...data, alternatives: newAlt });
  };

  const updateState = (i, value) => {
    const newStates = [...states];
    newStates[i] = value;
    setData({ ...data, states: newStates });
  };

  //  PROBABILIDADES
  const updateProbability = (i, value) => {
    const newProb = [...probabilities];
    newProb[i] = Number(value);
    setData({ ...data, probabilities: newProb });
  };

  //  PAYOFF
  const updatePayoff = (i, j, value) => {
    const newPayoff = [...payoff];
    newPayoff[i][j] = Number(value);
    setData({ ...data, payoff: newPayoff });
  };

  //  AGREGAR ALTERNATIVA
  const addAlternative = () => {
    setData({
      ...data,
      alternatives: [...alternatives, "Nueva alternativa"],
      payoff: [...payoff, Array(states.length).fill(0)]
    });
  };

  //  ELIMINAR ALTERNATIVA
  const removeAlternative = (i) => {
    setData({
      ...data,
      alternatives: alternatives.filter((_, idx) => idx !== i),
      payoff: payoff.filter((_, idx) => idx !== i)
    });
  };

  //  AGREGAR ESTADO
  const addState = () => {
    setData({
      ...data,
      states: [...states, "Nuevo estado"],
      probabilities: [...probabilities, 0],
      payoff: payoff.map(row => [...row, 0])
    });
  };

  //  ELIMINAR ESTADO
  const removeState = (i) => {
    setData({
      ...data,
      states: states.filter((_, idx) => idx !== i),
      probabilities: probabilities.filter((_, idx) => idx !== i),
      payoff: payoff.map(row => row.filter((_, idx) => idx !== i))
    });
  };

  const totalProb = probabilities.reduce((a, b) => a + b, 0);
  const isValid = totalProb === 1;

  return (
    <div style={container}>
      <h2 style={title}>Configuración del Problema</h2>

      <div style={guideCard}>
        <h2 style={sectionTitle}>Guia de uso - Modulo Decision</h2>
        <p style={guideText}>
          Este modulo resuelve decisiones bajo incertidumbre. Trabaja en orden del paso 1 al 10.
          Si cambias datos base, revisa nuevamente los pasos posteriores para mantener coherencia.
        </p>
        <p style={guideText}><strong>Paso 1:</strong> Define alternativas, estados, probabilidades y matriz de pagos.</p>
        <p style={guideText}><strong>Paso 2:</strong> Revisa el arbol base de decisiones.</p>
        <p style={guideText}><strong>Paso 3:</strong> Analiza sensibilidad para ver como cambia el resultado con p.</p>
        <p style={guideText}><strong>Paso 4:</strong> Valida el calculo de valor esperado sobre el arbol.</p>
        <p style={guideText}><strong>Paso 5 y 6:</strong> Interpreta puntos de corte y grafica de valor esperado.</p>
        <p style={guideText}><strong>Paso 7 y 8:</strong> Configura estudio de mercado e integra su efecto al arbol.</p>
        <p style={guideText}><strong>Paso 9:</strong> Compara formalmente con estudio vs sin estudio.</p>
        <p style={guideText}><strong>Paso 10:</strong> Consolida conclusiones y exporta reporte PDF.</p>
      </div>

      <div style={controls}>
        <button style={btn} onClick={addAlternative}>Agregar alternativa</button>
        <button style={btn} onClick={() => removeAlternative(alternatives.length - 1)}>Eliminar alternativa</button>
        <button style={btn} onClick={addState}>Agregar estado</button>
        <button style={btn} onClick={() => removeState(states.length - 1)}>Eliminar estado</button>
      </div>

      {/* ALTERNATIVAS */}
      <div style={card}>
        <h2 style={sectionTitle}>Alternativas</h2>

        {alternatives.map((alt, i) => (
          <div key={i} style={row}>
            <input
              value={alt}
              onChange={(e) => updateAlternative(i, e.target.value)}
              style={input}
            />
            <button style={deleteBtn} onClick={() => removeAlternative(i)}>✕</button>
          </div>
        ))}

      </div>

      {/* ESTADOS */}
      <div style={card}>
        <h2 style={sectionTitle}>Estados de Naturaleza</h2>

        {states.map((s, i) => (
          <div key={i} style={row}>
            <input
              value={s}
              onChange={(e) => updateState(i, e.target.value)}
              style={input}
            />

            <input
              type="number"
              value={probabilities[i]}
              onChange={(e) => updateProbability(i, e.target.value)}
              style={probInput}
            />

            <button style={deleteBtn} onClick={() => removeState(i)}>✕</button>
          </div>
        ))}

        <p style={{ color: isValid ? "#2e7d32" : "#c62828", fontSize: "14px" }}>
          Suma probabilidades: {totalProb}
        </p>
      </div>

      {/* MATRIZ */}
      <div style={card}>
        <h2 style={sectionTitle}>Matriz de Pagos</h2>

        <EditableMatrix
          matrix={payoff}
          rowNames={alternatives}
          colNames={states}
          onChangeCell={(i, j, value) => updatePayoff(i, j, value)}
          onChangeRowName={(i, value) => updateAlternative(i, value)}
          onChangeColName={(j, value) => updateState(j, value)}
        />
      </div>

      {/* BOTÓN */}
      <div style={resultBox}>
        <p><b>Suma probabilidades:</b> {totalProb}</p>
        <p><b>Estados:</b> {states.length}</p>

        <button
          onClick={next}
          disabled={!isValid}
          style={{
            ...analysisBtn,
            background: isValid ? "#2563eb" : "#999"
          }}
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

export default Step1;

//////////////////////////////////////////////////

//  ESTILO ELEGANTE Y COMPACTO

const container = {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
  fontFamily: "Inter, sans-serif",
  padding: "30px",
  background: "#f4f6fb"
};

const title = {
  fontSize: "24px",
  fontWeight: "800",
  marginBottom: "20px"
};

const sectionTitle = {
  fontSize: "18px",
  fontWeight: "600",
  marginBottom: "10px",
  color: "#133a5a"
};

const card = {
  background: "#fff",
  padding: "18px",
  borderRadius: "12px",
  border: "1px solid #e5e5e5",
  boxShadow: "0 6px 15px rgba(0,0,0,0.06)"
};

const guideCard = {
  ...card,
  border: "1px solid #cfe1f2",
  background: "#f7fbff"
};

const guideText = {
  margin: "6px 0",
  color: "#24445d",
  lineHeight: "1.45",
  fontSize: "13px"
};

const controls = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap"
};

const row = {
  display: "flex",
  gap: "8px",
  marginBottom: "8px",
  alignItems: "center"
};

const input = {
  padding: "6px 8px",
  borderRadius: "6px",
  border: "1px solid #ddd",
  flex: 1,
  fontSize: "13px"
};

const probInput = {
  width: "65px",
  padding: "6px",
  borderRadius: "6px",
  border: "1px solid #ddd",
  fontSize: "13px",
  textAlign: "center"
};

const deleteBtn = {
  padding: "6px 8px",
  borderRadius: "6px",
  border: "none",
  background: "#f5f5f5",
  cursor: "pointer"
};

const btn = {
  padding: "9px 14px",
  borderRadius: "10px",
  border: "none",
  background: "#111827",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 600
};

const resultBox = {
  marginTop: "20px",
  background: "#fff",
  padding: "18px",
  borderRadius: "12px",
  boxShadow: "0 6px 15px rgba(0,0,0,0.06)"
};

const analysisBtn = {
  marginTop: "10px",
  padding: "10px 16px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "600"
};

// TABLA MÁS COMPACTA
// (table styles moved to `EditableMatrix` component)
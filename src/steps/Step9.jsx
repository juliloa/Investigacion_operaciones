import React from "react";

const Step9 = ({ data, next, prev }) => {
  const { alternatives, payoff, probabilities } = data;
  const safeDiv = (a, b) => (b === 0 ? 0 : a / b);

  const P_alta = probabilities[0];
  const P_baja = probabilities[1];

  const studyConfig = data.studyConfig || {
    favorableDetectionRate: 0.9,
    unfavorableFalsePositiveRate: 0.25
  };
  const P_fav_alta = studyConfig.favorableDetectionRate ?? 0.9;
  const P_fav_baja = studyConfig.unfavorableFalsePositiveRate ?? 0.25;

  // 🧠 SIN ESTUDIO
  const VE_no_estudio = alternatives.map((alt, i) => {
    return payoff[i][0] * P_alta + payoff[i][1] * P_baja;
  });

  const bestNoStudy = Math.max(...VE_no_estudio);
  const bestAltNoStudy =
    alternatives[VE_no_estudio.indexOf(bestNoStudy)];

  // 🧠 CON ESTUDIO

  // Probabilidades
  const P_fav = P_alta * P_fav_alta + P_baja * P_fav_baja;
  const P_desf = 1 - P_fav;

  // Bayes
  const P_alta_fav = safeDiv(P_alta * P_fav_alta, P_fav);
  const P_baja_fav = safeDiv(P_baja * P_fav_baja, P_fav);

  const P_alta_desf = safeDiv(P_alta * (1 - P_fav_alta), P_desf);
  const P_baja_desf = safeDiv(P_baja * (1 - P_fav_baja), P_desf);

  // VE por escenario
  const VE_fav = alternatives.map((alt, i) => {
    return payoff[i][0] * P_alta_fav + payoff[i][1] * P_baja_fav;
  });

  const VE_desf = alternatives.map((alt, i) => {
    return payoff[i][0] * P_alta_desf + payoff[i][1] * P_baja_desf;
  });

  // Mejores por escenario
  const bestFav = Math.max(...VE_fav);
  const bestDesf = Math.max(...VE_desf);

  // VE total con estudio
  const VE_con_estudio =
    bestFav * P_fav + bestDesf * P_desf;

  return (
    <div style={container}>
      <h1>Mejor Decisión</h1>

      {/* SIN ESTUDIO */}
      <div style={card}>
        <h2>Sin Estudio</h2>

        {alternatives.map((alt, i) => (
          <p key={i}>
            {alt}: {VE_no_estudio[i].toFixed(2)}
          </p>
        ))}

        <strong>
          Mejor: {bestAltNoStudy} ({bestNoStudy.toFixed(2)})
        </strong>
      </div>

      {/* CON ESTUDIO */}
      <div style={card}>
        <h2>Con Estudio</h2>

        <p>Escenario Favorable → VE = {bestFav.toFixed(2)}</p>
        <p>Escenario Desfavorable → VE = {bestDesf.toFixed(2)}</p>

        <strong>
          VE total con estudio = {VE_con_estudio.toFixed(2)}
        </strong>
      </div>

      {/* 🧠 COMPARACIÓN */}
      <div style={card}>
        <h2>Conclusión</h2>

        {VE_con_estudio > bestNoStudy ? (
          <p style={{ color: "green" }}>
            ✔ Conviene realizar el estudio de mercado, ya que mejora el valor esperado.
          </p>
        ) : (
          <p style={{ color: "red" }}>
            ✖ No conviene realizar el estudio de mercado, no aporta mejora.
          </p>
        )}
      </div>

      {/* BOTONES */}
      <div style={buttons}>
        <button onClick={prev} style={btnSecondary}>← Volver</button>
        <button onClick={next} style={btnPrimary}>Continuar →</button>
      </div>
    </div>
  );
};

export default Step9;

// estilos
const container = {
  display: "flex",
  flexDirection: "column",
  gap: "20px"
};

const card = {
  background: "#fff",
  padding: "25px",
  borderRadius: "12px",
  boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
};

const buttons = {
  display: "flex",
  justifyContent: "space-between"
};

const btnPrimary = {
  padding: "10px 20px",
  background: "#007BFF",
  color: "#fff",
  border: "none",
  borderRadius: "6px"
};

const btnSecondary = {
  padding: "10px 20px",
  background: "#ccc",
  border: "none",
  borderRadius: "6px"
};
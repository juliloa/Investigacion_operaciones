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

  // SIN ESTUDIO
  const VE_no_estudio = alternatives.map((alt, i) => {
    return payoff[i][0] * P_alta + payoff[i][1] * P_baja;
  });

  const bestNoStudy = Math.max(...VE_no_estudio);
  const bestAltNoStudy =
    alternatives[VE_no_estudio.indexOf(bestNoStudy)];

  // CON ESTUDIO
  const P_fav = P_alta * P_fav_alta + P_baja * P_fav_baja;
  const P_desf = 1 - P_fav;

  const P_alta_fav = safeDiv(P_alta * P_fav_alta, P_fav);
  const P_baja_fav = safeDiv(P_baja * P_fav_baja, P_fav);

  const P_alta_desf = safeDiv(P_alta * (1 - P_fav_alta), P_desf);
  const P_baja_desf = safeDiv(P_baja * (1 - P_fav_alta), P_desf);

  const VE_fav = alternatives.map((alt, i) => {
    return payoff[i][0] * P_alta_fav + payoff[i][1] * P_baja_fav;
  });

  const VE_desf = alternatives.map((alt, i) => {
    return payoff[i][0] * P_alta_desf + payoff[i][1] * P_baja_desf;
  });

  const bestFav = Math.max(...VE_fav);
  const bestDesf = Math.max(...VE_desf);

  const VE_con_estudio =
    bestFav * P_fav + bestDesf * P_desf;

  return (
    <div style={container}>
      <h1 style={title}>Mejor Decisión</h1>

      {/* SIN ESTUDIO */}
      <div style={card}>
        <h2 style={subtitle}>Sin Estudio</h2>

        {alternatives.map((alt, i) => (
          <p key={i} style={item}>
            <strong>{alt}:</strong> {VE_no_estudio[i].toFixed(2)}
          </p>
        ))}

        <div style={resultBox}>
          <strong>
            Mejor: {bestAltNoStudy} ({bestNoStudy.toFixed(2)})
          </strong>
        </div>
      </div>

      {/* CON ESTUDIO */}
      <div style={card}>
        <h2 style={subtitle}>Con Estudio</h2>

        <p style={item}>Escenario Favorable → VE = {bestFav.toFixed(2)}</p>
        <p style={item}>Escenario Desfavorable → VE = {bestDesf.toFixed(2)}</p>

        <div style={resultBox}>
          <strong>
            VE total con estudio = {VE_con_estudio.toFixed(2)}
          </strong>
        </div>
      </div>

      {/* CONCLUSIÓN */}
      <div style={card}>
        <h2 style={subtitle}>Conclusión</h2>

        {VE_con_estudio > bestNoStudy ? (
          <p style={{ ...message, color: "#28a745" }}>
            ✔ Conviene realizar el estudio de mercado, ya que mejora el valor esperado.
          </p>
        ) : (
          <p style={{ ...message, color: "#dc3545" }}>
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

//////////////////////////////////////////////////

// ESTILOS MEJORADOS

const container = {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
  fontFamily: "Arial, sans-serif"
};

const title = {
  textAlign: "center",
  color: "#1a1a1a"
};

const subtitle = {
  marginBottom: "10px",
  color: "#333"
};

const card = {
  background: "#ffffff",
  padding: "25px",
  borderRadius: "14px",
  boxShadow: "0 6px 16px rgba(0,0,0,0.08)"
};

const item = {
  margin: "6px 0",
  padding: "6px 10px",
  background: "#f8f9fa",
  borderRadius: "6px"
};

const resultBox = {
  marginTop: "10px",
  padding: "12px",
  background: "#e8f4ff",
  borderRadius: "8px",
  border: "1px solid #cce5ff"
};

const message = {
  padding: "12px",
  borderRadius: "8px",
  fontWeight: "600",
  background: "#f8f9fa"
};

const buttons = {
  display: "flex",
  justifyContent: "space-between",
  gap: "10px"
};

const btnPrimary = {
  padding: "10px 20px",
  background: "#007BFF",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600"
};

const btnSecondary = {
  padding: "10px 20px",
  background: "#e0e0e0",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer"
};
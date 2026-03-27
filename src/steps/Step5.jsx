import React from "react";

const Step5 = ({ data, next, prev }) => {
  const { alternatives, payoff } = data;

  // 🧠 Generar funciones: VE = b + m*p
  const functions = alternatives.map((alt, i) => {
    const a = payoff[i][0];
    const b = payoff[i][1];

    return {
      name: alt,
      a,
      b,
      m: a - b // pendiente
    };
  });

  // 🧠 Calcular puntos de corte
  const intersections = [];

  for (let i = 0; i < functions.length; i++) {
    for (let j = i + 1; j < functions.length; j++) {
      const f1 = functions[i];
      const f2 = functions[j];

      // Resolver: b1 + m1p = b2 + m2p
      const p = (f2.b - f1.b) / (f1.m - f2.m);

      intersections.push({
        f1,
        f2,
        p
      });
    }
  }

  return (
    <div style={container}>
      <h1>Análisis Gráfico</h1>

      {/* 🧠 ECUACIONES */}
      <div style={card}>
        <h2>Funciones de Valor Esperado</h2>

        {functions.map((f, i) => (
          <div key={i} style={block}>
            <strong>{f.name}</strong>
            <p>
              VE = {f.b} + {f.m}p
            </p>
          </div>
        ))}
      </div>

      {/* 📐 DESARROLLO */}
      <div style={card}>
        <h2>Puntos de Corte</h2>

        {intersections.map((inter, i) => (
          <div key={i} style={block}>
            
            <h3>{inter.f1.name} vs {inter.f2.name}</h3>

            <p>
              {inter.f1.b} + {inter.f1.m}p = {inter.f2.b} + {inter.f2.m}p
            </p>

            <p>
              {inter.f1.m}p - {inter.f2.m}p = {inter.f2.b} - {inter.f1.b}
            </p>

            <p>
              p({inter.f1.m - inter.f2.m}) = {inter.f2.b - inter.f1.b}
            </p>

            <p>
              p = {(inter.f2.b - inter.f1.b)} / ({inter.f1.m - inter.f2.m})
            </p>

            <strong>
              p = {inter.p.toFixed(3)}
            </strong>

          </div>
        ))}
      </div>

      {/* 🧠 INTERPRETACIÓN */}
      <div style={card}>
        <h2>Interpretación</h2>

        <p>
          Los puntos de corte indican los valores de p donde dos alternativas
          ofrecen el mismo valor esperado.
        </p>

        <p>
          Estos puntos dividen el rango de probabilidades en regiones donde
          una alternativa es mejor que las demás.
        </p>
      </div>

      {/* BOTONES */}
      <div style={buttons}>
        <button onClick={prev} style={btnSecondary}>← Volver</button>
        <button onClick={next} style={btnPrimary}>Continuar →</button>
      </div>
    </div>
  );
};

export default Step5;

//////////////////////////////////////////////////

// 🎨 ESTILOS

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

const block = {
  borderBottom: "1px solid #eee",
  paddingBottom: "10px",
  marginBottom: "10px"
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
import React from "react";

const style = `
:root {
  --accent: #4f7fe8;
  --accent-light: #eef3fd;
  --accent-mid: #c5d8f9;
  --text-primary: #1c2333;
  --text-secondary: #5a6478;
  --bg: #f5f8ff;
  --surface: #ffffff;
  --border: #dde4f4;
  --success: #d4edda;
}

.step5-container {
  font-family: 'Outfit', sans-serif;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 10px rgba(79,127,232,0.05);
}

.card-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.function-block {
  background: var(--accent-light);
  padding: 12px;
  border-radius: 10px;
  border-left: 3px solid var(--accent);
  margin-bottom: 10px;
}

.function-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.formula {
  font-family: monospace;
  background: var(--surface);
  padding: 8px;
  border-radius: 6px;
  border: 1px solid var(--border);
  margin-top: 6px;
  font-size: 13px;
}

.meta {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 6px;
}

.intersection-block {
  border-bottom: 1px solid var(--border);
  padding-bottom: 12px;
  margin-bottom: 12px;
}

.intersection-title {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--accent);
}

.equation {
  font-family: monospace;
  background: var(--accent-light);
  padding: 8px;
  border-radius: 8px;
  font-size: 13px;
  margin-top: 6px;
  border: 1px solid var(--border);
}

.result {
  font-family: monospace;
  background: var(--success);
  padding: 10px;
  border-radius: 8px;
  font-weight: 600;
  color: #155724;
  margin-top: 8px;
}

.empty {
  color: #c62828;
  font-size: 13px;
}

.interpretation {
  border-bottom: 1px solid var(--border);
  padding-bottom: 12px;
  margin-bottom: 12px;
}

.interpretation h3 {
  font-size: 13.5px;
  margin-bottom: 6px;
  color: var(--text-primary);
}

.text {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.45;
}

.buttons {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.btn {
  padding: 10px 14px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  font-size: 13px;
}

.btn-primary {
  background: var(--accent);
  color: #fff;
}

.btn-secondary {
  background: #e4e7ee;
  color: var(--text-primary);
}
`;

const Step5 = ({ data, next, prev }) => {
  const { alternatives, payoff } = data;

  const linearFunctions = alternatives.map((alternative, i) => {
    const a = payoff[i][0];
    const b = payoff[i][1];

    return {
      name: alternative,
      intercept: b,
      slope: a - b
    };
  });

  const intersectionPoints = [];

  for (let i = 0; i < linearFunctions.length; i++) {
    for (let j = i + 1; j < linearFunctions.length; j++) {
      const f1 = linearFunctions[i];
      const f2 = linearFunctions[j];

      const p =
        (f2.intercept - f1.intercept) / (f1.slope - f2.slope);

      intersectionPoints.push({ f1, f2, p });
    }
  }

  return (
    <>
      <style>{style}</style>

      <div className="step5-container">

        {/* FUNCIONES */}
        <div className="card">
          <div className="card-title">Funciones lineales</div>

          {linearFunctions.map((f, i) => (
            <div key={i} className="function-block">

              <div className="function-name">{f.name}</div>

              <div className="formula">
                VE = {f.intercept} + {f.slope}p
              </div>

              <div className="meta">
                Intercept: {f.intercept} | Pendiente: {f.slope}
              </div>

            </div>
          ))}
        </div>

        {/* INTERSECCIONES */}
        <div className="card">
          <div className="card-title">Puntos de corte</div>

          {intersectionPoints.length > 0 ? (
            intersectionPoints.map((it, i) => (
              <div key={i} className="intersection-block">

                <div className="intersection-title">
                  {it.f1.name} vs {it.f2.name}
                </div>

                <div className="equation">
                  {it.f1.intercept} + {it.f1.slope}p =
                  {it.f2.intercept} + {it.f2.slope}p
                </div>

                <div className="equation">
                  {it.f1.slope}p - {it.f2.slope}p =
                  {it.f2.intercept} - {it.f1.intercept}
                </div>

                <div className="equation">
                  p({it.f1.slope - it.f2.slope}) =
                  {it.f2.intercept - it.f1.intercept}
                </div>

                <div className="result">
                  p = {it.p.toFixed(3)}
                </div>

              </div>
            ))
          ) : (
            <p className="empty">
              No hay intersecciones entre las alternativas
            </p>
          )}
        </div>

        {/* INTERPRETACIÓN */}
        <div className="card">
          <div className="card-title">Interpretación</div>

          <div className="interpretation">
            <h3>Punto de corte</h3>
            <p className="text">
              Es el valor de p donde dos alternativas tienen el mismo valor esperado.
            </p>
          </div>

          <div className="interpretation">
            <h3>Utilidad</h3>
            <p className="text">
              Permite identificar en qué rango de p cada alternativa es mejor.
            </p>
          </div>

          <div className="interpretation">
            <h3>Siguiente paso</h3>
            <p className="text">
              En la gráfica veremos visualmente estas intersecciones.
            </p>
          </div>
        </div>

        {/* BOTONES */}
        <div className="buttons">
          <button className="btn btn-secondary" onClick={prev}>
            ← Volver
          </button>

          <button className="btn btn-primary" onClick={next}>
            Continuar →
          </button>
        </div>

      </div>
    </>
  );
};

export default Step5;
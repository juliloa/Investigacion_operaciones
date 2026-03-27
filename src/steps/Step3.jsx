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
  --warning: #fff3cd;
}

.step3-container {
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

.text {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.45;
}

.formula {
  font-family: monospace;
  background: var(--accent-light);
  padding: 10px;
  border-radius: 8px;
  font-size: 13px;
  border: 1px solid var(--border);
}

.block {
  border-bottom: 1px solid var(--border);
  padding-bottom: 12px;
  margin-bottom: 12px;
}

.function-box {
  background: var(--accent-light);
  padding: 10px;
  border-radius: 8px;
  margin-top: 8px;
  border-left: 3px solid var(--accent);
}

.function-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 5px;
}

.function-value {
  font-family: monospace;
  background: var(--surface);
  padding: 6px;
  border-radius: 6px;
  font-size: 13px;
  border: 1px solid var(--border);
}

.badge-success {
  background: var(--success);
  color: #155724;
  padding: 10px;
  border-radius: 8px;
  margin-top: 10px;
  font-weight: 500;
  font-size: 13px;
}

.badge-warning {
  background: var(--warning);
  color: #856404;
  padding: 10px;
  border-radius: 8px;
  margin-top: 10px;
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
  transition: 0.2s;
}

.btn-primary {
  background: var(--accent);
  color: #fff;
}

.btn-secondary {
  background: #e4e7ee;
  color: var(--text-primary);
}

.btn:hover {
  transform: translateY(-1px);
}
`;

const Step3 = ({ data, next, prev }) => {
  const { alternatives, payoff } = data;

  const sensitivityAnalysis = alternatives.map((alternative, i) => {
    const a = payoff[i][0];
    const b = payoff[i][1];

    const expandedForm = `${a}p + ${b}(1 - p)`;
    const slope = a - b;
    const simplifiedForm = `${b} + ${slope}p`;

    return { name: alternative, expandedForm, simplifiedForm, slope };
  });

  const bestSlope = Math.max(...sensitivityAnalysis.map(f => f.slope));

  return (
    <>
      <style>{style}</style>

      <div className="step3-container">

        <div className="card">
          <div className="card-title">Análisis de Sensibilidad</div>

          <p className="text">
            Sea <strong>p</strong> la probabilidad del estado favorable.
            Entonces <strong>(1 - p)</strong> representa el estado desfavorable.
          </p>

          <div className="formula">
            Valor Esperado: VE(p) = b + (m)p
          </div>
        </div>

        {/* ANÁLISIS */}
        <div className="card">
          <div className="card-title">Por alternativa</div>

          {sensitivityAnalysis.map((analysis, i) => (
            <div key={i} className="block">

              <h3 className="text" style={{ color: "var(--accent)", fontWeight: 500 }}>
                {analysis.name}
              </h3>

              <div className="function-box">
                <div className="function-label">Forma expandida</div>
                <div className="function-value">
                  VE = {analysis.expandedForm}
                </div>
              </div>

              <div className="function-box">
                <div className="function-label">Forma simplificada</div>
                <div className="function-value">
                  VE = {analysis.simplifiedForm}
                </div>
              </div>

              <div className="function-box">
                <div className="function-label">
                  Pendiente (m): {analysis.slope}
                </div>
                <div className="text" style={{ fontSize: "12px" }}>
                  Indica cuánto cambia el valor esperado cuando cambia p
                </div>
              </div>

              {analysis.slope === bestSlope ? (
                <div className="badge-success">
                  ✔ Mejor pendiente: crece más rápido → mejor si p aumenta
                </div>
              ) : (
                <div className="badge-warning">
                  Menor crecimiento frente al aumento de p
                </div>
              )}

            </div>
          ))}
        </div>

        {/* INTERPRETACIÓN */}
        <div className="card">
          <div className="card-title">Interpretación</div>

          <div className="interpretation">
            <h3>Sensibilidad</h3>
            <p className="text">
              La pendiente muestra qué tan sensible es una alternativa al cambio en p.
            </p>
          </div>

          <div className="interpretation">
            <h3>Estrategia</h3>
            <p className="text">
              <strong>Pendiente alta:</strong> mejor si el estado favorable es probable.
            </p>
            <p className="text">
              <strong>Pendiente baja:</strong> mejor si el estado desfavorable es probable.
            </p>
          </div>

          <div className="interpretation">
            <h3>Punto de corte</h3>
            <p className="text">
              En el siguiente paso se verán las intersecciones entre alternativas.
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

export default Step3;
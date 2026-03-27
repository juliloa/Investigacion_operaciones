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
}

.step1-container {
  font-family: 'Outfit', sans-serif;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 10px;
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 10px rgba(79,127,232,0.05);
}

.card-header {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.guide {
  background: var(--accent-light);
  border: 1px solid var(--accent-mid);
}

.guide p {
  font-size: 12.5px;
  color: var(--text-secondary);
  line-height: 1.45;
  margin: 5px 0;
}

.row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}

.input {
  flex: 1;
  padding: 7px 9px;
  border-radius: 8px;
  border: 1px solid var(--border);
  font-size: 13px;
}

.input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-light);
}

.small-input {
  width: 70px;
  text-align: center;
}

.btn {
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
}

.btn:hover {
  border-color: var(--accent);
  background: var(--accent-light);
}

.btn-danger {
  background: #fff;
  border: 1px solid #f2dede;
}

.btn-danger:hover {
  background: #ffecec;
  border-color: #ffbcbc;
}

.btn-primary {
  padding: 12px;
  border-radius: 10px;
  border: none;
  background: var(--accent);
  color: #fff;
  cursor: pointer;
  font-weight: 500;
  transition: 0.2s;
}

.btn-primary:disabled {
  background: #9aa3b5;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  margin-top: 10px;
}

.table th {
  background: var(--accent-light);
  border: 1px solid var(--border);
  padding: 6px;
  font-weight: 500;
}

.table td {
  border: 1px solid var(--border);
  padding: 5px;
  text-align: center;
}

.matrix-input {
  width: 55px;
  padding: 4px;
  border-radius: 6px;
  border: 1px solid var(--border);
  text-align: center;
}
`;

const Step1 = ({ data, setData, next }) => {
  const { alternatives, states, probabilities, payoff } = data;

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

  const updateProbability = (i, value) => {
    const newProb = [...probabilities];
    newProb[i] = Number(value);
    setData({ ...data, probabilities: newProb });
  };

  const updatePayoff = (i, j, value) => {
    const newPayoff = [...payoff];
    newPayoff[i][j] = Number(value);
    setData({ ...data, payoff: newPayoff });
  };

  const addAlternative = () => {
    setData({
      ...data,
      alternatives: [...alternatives, "Nueva alternativa"],
      payoff: [...payoff, Array(states.length).fill(0)]
    });
  };

  const removeAlternative = (i) => {
    setData({
      ...data,
      alternatives: alternatives.filter((_, idx) => idx !== i),
      payoff: payoff.filter((_, idx) => idx !== i)
    });
  };

  const addState = () => {
    setData({
      ...data,
      states: [...states, "Nuevo estado"],
      probabilities: [...probabilities, 0],
      payoff: payoff.map(row => [...row, 0])
    });
  };

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
    <>
      <style>{style}</style>

      <div className="step1-container">

        {/* GUÍA */}
        <div className="card guide">
          <div className="card-header">Guía del módulo</div>
          <p>Define alternativas, estados, probabilidades y matriz de pagos.</p>
          <p>Trabaja en orden desde el paso 1 hasta el 10.</p>
          <p>Si cambias datos, revisa los pasos posteriores.</p>
        </div>

        {/* ALTERNATIVAS */}
        <div className="card">
          <div className="card-header">Alternativas</div>

          {alternatives.map((alt, i) => (
            <div key={i} className="row">
              <input
                className="input"
                value={alt}
                onChange={(e) => updateAlternative(i, e.target.value)}
              />
              <button className="btn btn-danger" onClick={() => removeAlternative(i)}>✕</button>
            </div>
          ))}

          <button className="btn" onClick={addAlternative}>
            + Añadir alternativa
          </button>
        </div>

        {/* ESTADOS */}
        <div className="card">
          <div className="card-header">Estados</div>

          {states.map((s, i) => (
            <div key={i} className="row">
              <input
                className="input"
                value={s}
                onChange={(e) => updateState(i, e.target.value)}
              />

              <input
                type="number"
                className="input small-input"
                value={probabilities[i]}
                onChange={(e) => updateProbability(i, e.target.value)}
              />

              <button className="btn btn-danger" onClick={() => removeState(i)}>✕</button>
            </div>
          ))}

          <button className="btn" onClick={addState}>
            + Añadir estado
          </button>

          <p style={{ color: isValid ? "green" : "red", fontSize: "13px" }}>
            Probabilidad total: {totalProb}
          </p>
        </div>

        {/* MATRIZ */}
        <div className="card">
          <div className="card-header">Matriz de pagos</div>

          <table className="table">
            <thead>
              <tr>
                <th></th>
                {states.map((s, i) => (
                  <th key={i}>{s}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {alternatives.map((alt, i) => (
                <tr key={i}>
                  <td>{alt}</td>

                  {states.map((_, j) => (
                    <td key={j}>
                      <input
                        className="matrix-input"
                        type="number"
                        value={payoff[i][j]}
                        onChange={(e) =>
                          updatePayoff(i, j, e.target.value)
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* BOTÓN */}
        <button
          className="btn-primary"
          onClick={next}
          disabled={!isValid}
        >
          Continuar
        </button>

      </div>
    </>
  );
};

export default Step1;
import React from "react";

const clamp01 = (value) => {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
};

const safeDiv = (a, b) => (b === 0 ? 0 : a / b);

const Step7 = ({ data, setData, next, prev }) => {
  const probabilityFavorableState = data.probabilities?.[0] ?? 0;
  const probabilityUnfavorableState = data.probabilities?.[1] ?? 0;

  const studyConfig = data.studyConfig || {
    favorableDetectionRate: 0.9,
    unfavorableFalsePositiveRate: 0.25
  };

  const favorableDetectionRate = studyConfig.favorableDetectionRate ?? 0.9;
  const unfavorableFalsePositiveRate =
    studyConfig.unfavorableFalsePositiveRate ?? 0.25;

  const updateStudyConfig = (field, rawValue) => {
    const parsedValue = clamp01(Number(rawValue));

    setData({
      ...data,
      studyConfig: {
        ...studyConfig,
        [field]: parsedValue
      }
    });
  };

  const truePositive = probabilityFavorableState * favorableDetectionRate;
  const falseNegative = probabilityFavorableState * (1 - favorableDetectionRate);
  const falsePositive =
    probabilityUnfavorableState * unfavorableFalsePositiveRate;
  const trueNegative =
    probabilityUnfavorableState * (1 - unfavorableFalsePositiveRate);

  const precision = safeDiv(truePositive, truePositive + falsePositive);
  const recall = safeDiv(truePositive, truePositive + falseNegative);
  const accuracy = safeDiv(
    truePositive + trueNegative,
    truePositive + falsePositive + trueNegative + falseNegative
  );
  const specificity = safeDiv(trueNegative, trueNegative + falsePositive);

  return (
    <div style={container}>
      <h1 style={title}>Matriz de confusion y calidad del estudio</h1>

      <div style={card}>
        <h2 style={cardTitle}>Parametros del estudio</h2>
        <p style={mutedText}>
          Estos parametros se guardan y se usan en los pasos 8, 9 y en el informe PDF final.
        </p>

        <div style={parameterGrid}>
          <div style={parameterItem}>
            <label style={labelStyle}>P(Resultado favorable | Estado favorable)</label>
            <div style={inputRow}>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={favorableDetectionRate}
                onChange={(e) =>
                  updateStudyConfig("favorableDetectionRate", e.target.value)
                }
                style={inputStyle}
              />
              <span style={chip}>{(favorableDetectionRate * 100).toFixed(1)}%</span>
            </div>
          </div>

          <div style={parameterItem}>
            <label style={labelStyle}>P(Resultado favorable | Estado desfavorable)</label>
            <div style={inputRow}>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={unfavorableFalsePositiveRate}
                onChange={(e) =>
                  updateStudyConfig("unfavorableFalsePositiveRate", e.target.value)
                }
                style={inputStyle}
              />
              <span style={chip}>
                {(unfavorableFalsePositiveRate * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={card}>
        <h2 style={cardTitle}>Matriz de confusion</h2>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}></th>
              <th style={th}>Predice favorable</th>
              <th style={th}>Predice desfavorable</th>
              <th style={th}>Total real</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdRowHeader}>Real favorable</td>
              <td style={{ ...td, ...tdGood }}>TP: {truePositive.toFixed(4)}</td>
              <td style={{ ...td, ...tdBad }}>FN: {falseNegative.toFixed(4)}</td>
              <td style={td}>{probabilityFavorableState.toFixed(4)}</td>
            </tr>
            <tr>
              <td style={tdRowHeader}>Real desfavorable</td>
              <td style={{ ...td, ...tdBad }}>FP: {falsePositive.toFixed(4)}</td>
              <td style={{ ...td, ...tdGood }}>TN: {trueNegative.toFixed(4)}</td>
              <td style={td}>{probabilityUnfavorableState.toFixed(4)}</td>
            </tr>
            <tr>
              <td style={tdRowHeader}>Total predicho</td>
              <td style={td}>{(truePositive + falsePositive).toFixed(4)}</td>
              <td style={td}>{(falseNegative + trueNegative).toFixed(4)}</td>
              <td style={td}>1.0000</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={card}>
        <h2 style={cardTitle}>Metricas clave</h2>
        <div style={metricsGrid}>
          <MetricCard
            label="Precision"
            value={`${(precision * 100).toFixed(1)}%`}
            detail="TP / (TP + FP)"
          />
          <MetricCard
            label="Recall"
            value={`${(recall * 100).toFixed(1)}%`}
            detail="TP / (TP + FN)"
          />
          <MetricCard
            label="Exactitud"
            value={`${(accuracy * 100).toFixed(1)}%`}
            detail="(TP + TN) / Total"
          />
          <MetricCard
            label="Especificidad"
            value={`${(specificity * 100).toFixed(1)}%`}
            detail="TN / (TN + FP)"
          />
        </div>
      </div>

      <div style={card}>
        <h2 style={cardTitle}>Lectura ejecutiva</h2>
        <p style={summaryText}>
          Si tu objetivo es evitar falsos positivos, prioriza la especificidad. Si tu objetivo es capturar
          oportunidades favorables, prioriza recall. Estos mismos resultados se integran automaticamente al PDF final.
        </p>
      </div>

      <div style={buttons}>
        <button onClick={prev} style={btnSecondary}>Volver</button>
        <button onClick={next} style={btnPrimary}>Continuar</button>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, detail }) => (
  <div style={metricCard}>
    <p style={metricLabel}>{label}</p>
    <p style={metricValue}>{value}</p>
    <p style={metricDetail}>{detail}</p>
  </div>
);

export default Step7;

const container = {
  display: "flex",
  flexDirection: "column",
  gap: "18px"
};

const title = {
  margin: 0,
  fontSize: "28px",
  color: "#12263a"
};

const card = {
  background: "#ffffff",
  padding: "22px",
  borderRadius: "14px",
  border: "1px solid #e5edf5",
  boxShadow: "0 8px 24px rgba(17, 38, 58, 0.08)"
};

const cardTitle = {
  margin: "0 0 10px 0",
  color: "#12324a"
};

const mutedText = {
  marginTop: 0,
  color: "#547085",
  fontSize: "14px"
};

const parameterGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "12px"
};

const parameterItem = {
  background: "#f4f8fc",
  border: "1px solid #d9e6f2",
  borderRadius: "10px",
  padding: "12px"
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontSize: "13px",
  fontWeight: 600,
  color: "#1e3f58"
};

const inputRow = {
  display: "flex",
  alignItems: "center",
  gap: "10px"
};

const inputStyle = {
  width: "110px",
  padding: "8px 10px",
  borderRadius: "8px",
  border: "1px solid #b9cddd",
  fontSize: "14px"
};

const chip = {
  padding: "6px 10px",
  borderRadius: "999px",
  background: "#e8f3ff",
  color: "#1f4f78",
  fontWeight: 600,
  fontSize: "12px"
};

const table = {
  width: "100%",
  borderCollapse: "collapse"
};

const th = {
  textAlign: "center",
  padding: "10px 8px",
  background: "#f2f7fc",
  border: "1px solid #d9e6f2",
  fontSize: "13px",
  color: "#29465d"
};

const td = {
  textAlign: "center",
  padding: "10px 8px",
  border: "1px solid #d9e6f2",
  fontSize: "13px"
};

const tdRowHeader = {
  ...td,
  textAlign: "left",
  fontWeight: 700,
  color: "#2b4458",
  background: "#f7fbff"
};

const tdGood = {
  background: "#e8f7ef",
  color: "#1b6a44",
  fontWeight: 700
};

const tdBad = {
  background: "#fdebec",
  color: "#8f2332",
  fontWeight: 700
};

const metricsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "10px"
};

const metricCard = {
  background: "linear-gradient(180deg, #f8fbff 0%, #eef6ff 100%)",
  border: "1px solid #d8e8fa",
  borderRadius: "10px",
  padding: "12px"
};

const metricLabel = {
  margin: 0,
  fontSize: "12px",
  color: "#4b6780",
  textTransform: "uppercase",
  letterSpacing: "0.4px"
};

const metricValue = {
  margin: "6px 0",
  fontSize: "28px",
  color: "#113a5e",
  fontWeight: 700
};

const metricDetail = {
  margin: 0,
  fontSize: "12px",
  color: "#6b8195"
};

const summaryText = {
  margin: 0,
  lineHeight: "1.55",
  color: "#29465d"
};

const buttons = {
  display: "flex",
  justifyContent: "space-between"
};

const btnPrimary = {
  padding: "11px 20px",
  background: "#0f5e9c",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 600
};

const btnSecondary = {
  padding: "11px 20px",
  background: "#dde6ef",
  color: "#1f364a",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 600
};
import React from "react";
import { formatNumber } from "../utils/validation";

const clamp01 = (value) => {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
};

const safeDiv = (a, b) => (b === 0 ? 0 : a / b);

const Step7 = ({ data, setData, next, prev }) => {
  const probabilityFavorableState = data.probabilities?.[0] ?? 0;
  const probabilityUnfavorableState = data.probabilities?.[1] ?? 0;

  // ⚠️ validación mínima real (esto te faltaba)
  if (!data.probabilities || data.probabilities.length < 2) {
    return <div>Se requieren al menos 2 estados (favorable y desfavorable)</div>;
  }

  const studyConfig = data.studyConfig || {
    favorableDetectionRate: 0.9,
    unfavorableFalsePositiveRate: 0.25
  };

  const favorableDetectionRate = clamp01(studyConfig.favorableDetectionRate ?? 0.9);
  const unfavorableFalsePositiveRate = clamp01(
    studyConfig.unfavorableFalsePositiveRate ?? 0.25
  );

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

  // MATRIZ DE PAGO (probabilidades del estudio)
  const truePositive = probabilityFavorableState * favorableDetectionRate;
  const falseNegative = probabilityFavorableState * (1 - favorableDetectionRate);
  const falsePositive =
    probabilityUnfavorableState * unfavorableFalsePositiveRate;
  const trueNegative =
    probabilityUnfavorableState * (1 - unfavorableFalsePositiveRate);

  // MÉTRICAS
  const precision = safeDiv(truePositive, truePositive + falsePositive);
  const recall = safeDiv(truePositive, truePositive + falseNegative);
  const accuracy = safeDiv(
    truePositive + trueNegative,
    truePositive + falsePositive + trueNegative + falseNegative
  );
  const specificity = safeDiv(trueNegative, trueNegative + falsePositive);

  return (
    <div style={container}>
      <h1 style={title}>Matriz de pago y calidad del estudio</h1>

      <div style={card}>
        <h2 style={cardTitle}>Parámetros del estudio</h2>
        <p style={mutedText}>
          Estos parámetros se guardan y se usan en los pasos 8, 9 y en el informe PDF final.
        </p>

        <div style={parameterGrid}>
          <div style={parameterItem}>
            <label style={labelStyle}>
              P(Resultado favorable | Estado favorable)
            </label>
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
              <span style={chip}>
                {formatNumber(favorableDetectionRate * 100)}%
              </span>
            </div>
          </div>

          <div style={parameterItem}>
            <label style={labelStyle}>
              P(Resultado favorable | Estado desfavorable)
            </label>
            <div style={inputRow}>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={unfavorableFalsePositiveRate}
                onChange={(e) =>
                  updateStudyConfig(
                    "unfavorableFalsePositiveRate",
                    e.target.value
                  )
                }
                style={inputStyle}
              />
              <span style={chip}>
                {formatNumber(unfavorableFalsePositiveRate * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={card}>
        <h2 style={cardTitle}>Matriz de pago del estudio</h2>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}></th>
              <th style={th}>Resultado favorable</th>
              <th style={th}>Resultado desfavorable</th>
              <th style={th}>Total del estado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdRowHeader}>Estado favorable real</td>
              <td style={{ ...td, ...tdGood }}>
                Acierto favorable: {formatNumber(truePositive)}
              </td>
              <td style={{ ...td, ...tdBad }}>
                Error favorable: {formatNumber(falseNegative)}
              </td>
              <td style={td}>
                {formatNumber(probabilityFavorableState)}
              </td>
            </tr>
            <tr>
              <td style={tdRowHeader}>Estado desfavorable real</td>
              <td style={{ ...td, ...tdBad }}>
                Falso favorable: {formatNumber(falsePositive)}
              </td>
              <td style={{ ...td, ...tdGood }}>
                Acierto desfavorable: {formatNumber(trueNegative)}
              </td>
              <td style={td}>
                {formatNumber(probabilityUnfavorableState)}
              </td>
            </tr>
            <tr>
              <td style={tdRowHeader}>Total del resultado</td>
              <td style={td}>
                {formatNumber(truePositive + falsePositive)}
              </td>
              <td style={td}>
                {formatNumber(falseNegative + trueNegative)}
              </td>
              <td style={td}>{formatNumber(1)}</td>
            </tr>
          </tbody>
        </table>
        <div style={matrixNote}>
          <p style={matrixNoteText}>
            Cada valor es una probabilidad. Por ejemplo, "Acierto favorable" es la parte de los casos favorables
            que el estudio marca como favorables. "Falso favorable" es cuando el estudio dice favorable, pero en
            realidad es desfavorable. Los totales muestran cuánto pesa cada estado y cada resultado.
          </p>
        </div>
      </div>

      <div style={card}>
        <h2 style={cardTitle}>Métricas clave</h2>
        <div style={metricsGrid}>
          <MetricCard
            label="Precisión"
            value={`${formatNumber(precision * 100)}%`}
            detail="TP / (TP + FP)"
          />
          <MetricCard
            label="Recall"
            value={`${formatNumber(recall * 100)}%`}
            detail="TP / (TP + FN)"
          />
          <MetricCard
            label="Exactitud"
            value={`${formatNumber(accuracy * 100)}%`}
            detail="(TP + TN) / Total"
          />
          <MetricCard
            label="Especificidad"
            value={`${formatNumber(specificity * 100)}%`}
            detail="TN / (TN + FP)"
          />
        </div>
      </div>

      <div style={card}>
        <h2 style={cardTitle}>Lectura ejecutiva</h2>
        <p style={summaryText}>
          Si tu objetivo es evitar falsos positivos, prioriza la especificidad.
          Si tu objetivo es capturar oportunidades favorables, prioriza el recall.
        </p>
      </div>

      <div style={buttons}>
        <button onClick={prev} style={btnSecondary}>
          Volver
        </button>
        <button onClick={next} style={btnPrimary}>
          Continuar
        </button>
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

const matrixNote = {
  marginTop: "12px",
  background: "#f8fafc",
  border: "1px dashed #cbd5f5",
  borderRadius: "10px",
  padding: "10px 12px"
};

const matrixNoteText = {
  margin: 0,
  fontSize: "13px",
  color: "#334155",
  lineHeight: 1.6
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

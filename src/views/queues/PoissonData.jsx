import React from "react";

const MODES = [
  { key: "exact",      label: "P(x = n)",  desc: "Exacta" },
  { key: "greater",    label: "P(x > n)",  desc: "Mayor que" },
  { key: "less_eq",    label: "P(x ≤ n)",  desc: "Menor o igual" },
  { key: "less",       label: "P(x < n)",  desc: "Menor que" },
  { key: "greater_eq", label: "P(x ≥ n)",  desc: "Mayor o igual" },
];

const factorial = (n) => n <= 1 ? 1 : n * factorial(n - 1);

const pxSingle = (lambda, x) =>
  (Math.pow(lambda, x) * Math.pow(Math.E, -lambda)) / factorial(x);

// Acepta decimales y fracciones como "1/1500"
const parseP = (val) => {
  const str = String(val).trim();
  if (str.includes("/")) {
    const [a, b] = str.split("/");
    const den = parseFloat(b);
    return den !== 0 ? parseFloat(a) / den : NaN;
  }
  return parseFloat(str);
};

// Devuelve los términos de la suma según el modo
const buildTerms = (lambda, x, mode) => {
  if (mode === "exact") {
    return { terms: [{ i: x, v: pxSingle(lambda, x) }], result: pxSingle(lambda, x), formula: `P(x=${x})` };
  }
  if (mode === "greater") {
    // P(x>x) = 1 - sum(0..x)
    const terms = Array.from({ length: x + 1 }, (_, i) => ({ i, v: pxSingle(lambda, i) }));
    const sum = terms.reduce((a, t) => a + t.v, 0);
    return { terms, result: 1 - sum, formula: `P(x>${x}) = 1 − (P₀ + P₁ + ... + P${x})` };
  }
  if (mode === "less_eq") {
    const terms = Array.from({ length: x + 1 }, (_, i) => ({ i, v: pxSingle(lambda, i) }));
    const sum = terms.reduce((a, t) => a + t.v, 0);
    return { terms, result: sum, formula: `P(x≤${x}) = P₀ + P₁ + ... + P${x}` };
  }
  if (mode === "less") {
    const terms = Array.from({ length: x }, (_, i) => ({ i, v: pxSingle(lambda, i) }));
    const sum = terms.reduce((a, t) => a + t.v, 0);
    return { terms, result: sum, formula: `P(x<${x}) = P₀ + P₁ + ... + P${x - 1}` };
  }
  if (mode === "greater_eq") {
    const terms = Array.from({ length: x }, (_, i) => ({ i, v: pxSingle(lambda, i) }));
    const sum = terms.reduce((a, t) => a + t.v, 0);
    return { terms, result: 1 - sum, formula: `P(x≥${x}) = 1 − (P₀ + P₁ + ... + P${x - 1})` };
  }
};

const PoissonData = ({ poissonData, setPoissonData, onNext }) => {
  const update    = (patch) => setPoissonData(prev => ({ ...prev, ...patch }));
  const updateR3  = (patch) => setPoissonData(prev => ({ ...prev, ruleOf3: { ...prev.ruleOf3, ...patch } }));
  const updateNP  = (patch) => setPoissonData(prev => ({ ...prev, npInput: { ...prev.npInput, ...patch } }));

  const { inputMode, mode, x, ruleOf3 = {}, npInput = {} } = poissonData;

  // ── λ según modo ──────────────────────────────────────────────
  const lambdaR3 = (ruleOf3.eventsIn && ruleOf3.timeIn && ruleOf3.timeFor && parseFloat(ruleOf3.timeIn) !== 0)
    ? (parseFloat(ruleOf3.eventsIn) * parseFloat(ruleOf3.timeFor)) / parseFloat(ruleOf3.timeIn)
    : null;

  const pParsed  = npInput.p ? parseP(npInput.p) : NaN;
  const lambdaNP = (npInput.n && !isNaN(pParsed))
    ? parseFloat(npInput.n) * pParsed
    : null;

  const lambdaFinal = inputMode === "r3" ? lambdaR3 : lambdaNP;
  const xNum = parseInt(x);
  const canContinue = lambdaFinal !== null && lambdaFinal > 0 && x !== "" && !isNaN(xNum) && xNum >= 0;

  // ── Términos y resultado ──────────────────────────────────────
  const computed = canContinue ? buildTerms(lambdaFinal, xNum, mode) : null;
  const needsComplement = mode === "greater" || mode === "greater_eq";

  const modeLabel = (m, xv) => {
    if (m === "exact")      return `P(x = ${xv})`;
    if (m === "greater")    return `P(x > ${xv})`;
    if (m === "less_eq")    return `P(x ≤ ${xv})`;
    if (m === "less")       return `P(x < ${xv})`;
    if (m === "greater_eq") return `P(x ≥ ${xv})`;
  };

  return (
    <div style={s.container}>
      <h2 style={s.title}>Distribución de Poisson</h2>

      {/* GUÍA */}
      <div style={s.guideCard}>
        <h3 style={s.guideTitle}>Guia de uso — Poisson</h3>
        <p style={s.guideText}>
          Modela la probabilidad de que ocurran <strong>x</strong> eventos en un período,
          dado que la tasa promedio es <strong>λ</strong>.
        </p>
        <p style={s.guideText}>
          <strong>Fórmula:</strong>&nbsp;
          <code style={s.code}>Px = (λˣ · e^(−λ)) / x!</code>
          &nbsp;·&nbsp;
          <code style={s.code}>e = 2.71828</code>
        </p>
      </div>

      {/* MODO ENTRADA */}
      <div style={s.card}>
        <p style={s.cardTitle}>¿Cómo obtienes λ?</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            style={{ ...s.toggleBtn, ...(inputMode === "r3" ? s.toggleActive : {}) }}
            onClick={() => update({ inputMode: "r3" })}
          >
            <span style={{ fontSize: 14, fontWeight: 700 }}>Regla de 3</span>
            <span style={{ fontSize: 11, opacity: 0.8 }}>Me dan tasa en otro tiempo</span>
          </button>
          <button
            style={{ ...s.toggleBtn, ...(inputMode === "np" ? s.toggleActive : {}) }}
            onClick={() => update({ inputMode: "np" })}
          >
            <span style={{ fontSize: 14, fontWeight: 700 }}>λ = n · p</span>
            <span style={{ fontSize: 11, opacity: 0.8 }}>Me dan población y probabilidad</span>
          </button>
        </div>
      </div>

      {/* REGLA DE 3 */}
      {inputMode === "r3" && (
        <div style={s.card}>
          <p style={s.cardTitle}>Regla de 3</p>
          <p style={s.guideText}>Ejemplo: "llegan 40 personas en 60 min, ¿cuántas en 20 min?"</p>
          <div style={s.r3Row}>
            <div style={s.r3Block}>
              <div style={s.r3BlockTitle}>Dato conocido</div>
              <div style={s.r3Inputs}>
                <div style={s.r3Field}>
                  <label style={s.label}>Cantidad</label>
                  <input type="number" value={ruleOf3.eventsIn || ""} onChange={e => updateR3({ eventsIn: e.target.value })} style={s.inputSm} placeholder="ej: 40" />
                </div>
                <span style={s.r3In}>en</span>
                <div style={s.r3Field}>
                  <label style={s.label}>Tiempo</label>
                  <input type="number" value={ruleOf3.timeIn || ""} onChange={e => updateR3({ timeIn: e.target.value })} style={s.inputSm} placeholder="ej: 60" />
                </div>
                <div style={s.r3Field}>
                  <label style={s.label}>Unidad</label>
                  <select value={ruleOf3.unit || "min"} onChange={e => updateR3({ unit: e.target.value })} style={s.select}>
                    <option value="min">min</option>
                    <option value="hora">hora</option>
                    <option value="seg">seg</option>
                    <option value="día">día</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={s.r3Arrow}>→</div>

            <div style={s.r3Block}>
              <div style={s.r3BlockTitle}>Tiempo de la pregunta</div>
              <div style={s.r3Inputs}>
                <div style={s.r3Field}>
                  <label style={s.label}>¿En cuántos {ruleOf3.unit || "min"}?</label>
                  <input type="number" value={ruleOf3.timeFor || ""} onChange={e => updateR3({ timeFor: e.target.value })} style={s.inputSm} placeholder="ej: 20" />
                </div>
              </div>
            </div>

            {lambdaR3 !== null && (
              <>
                <div style={s.r3Arrow}>=</div>
                <div style={s.r3Result}>
                  <div style={{ fontSize: 11, color: "#2563eb", fontWeight: 600, marginBottom: 2 }}>λ</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#1d4ed8", lineHeight: 1 }}>{lambdaR3.toFixed(2)}</div>
                  <div style={{ fontSize: 10, color: "#6b7280", marginTop: 4 }}>{ruleOf3.eventsIn} × {ruleOf3.timeFor} / {ruleOf3.timeIn}</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* n · p */}
      {inputMode === "np" && (
        <div style={s.card}>
          <p style={s.cardTitle}>λ = n · p</p>
          <p style={s.guideText}>
            Ejemplo: "1500 vuelos, probabilidad de retraso = 1/1500" → λ = 10
          </p>
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>n (población / total)</label>
              <input
                type="number"
                value={npInput.n || ""}
                onChange={e => updateNP({ n: e.target.value })}
                style={s.input}
                placeholder="ej: 1500"
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>p (probabilidad) — acepta fracción ej: 1/1500</label>
              <input
                type="text"
                value={npInput.p || ""}
                onChange={e => updateNP({ p: e.target.value })}
                style={s.input}
                placeholder="ej: 1/1500 ó 0.00067"
              />
            </div>
          </div>
          {lambdaNP !== null && (
            <div style={s.lambdaBox}>
              λ = {npInput.n} × {npInput.p} = <strong>{lambdaNP.toFixed(4)}</strong>
            </div>
          )}
        </div>
      )}

      {/* TIPO + X */}
      <div style={s.card}>
        <p style={s.cardTitle}>¿Qué probabilidad calcular?</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {MODES.map(m => (
            <button
              key={m.key}
              style={{ ...s.modeBtn, ...(mode === m.key ? s.modeBtnActive : {}) }}
              onClick={() => update({ mode: m.key })}
            >
              <span style={{ fontSize: 13, fontWeight: 700 }}>{m.label}</span>
              <span style={{ fontSize: 11, opacity: 0.75 }}>{m.desc}</span>
            </button>
          ))}
        </div>
        <div style={s.field}>
          <label style={s.label}>Valor de x</label>
          <input
            type="number"
            value={x}
            onChange={e => update({ x: e.target.value })}
            style={{ ...s.input, maxWidth: 160 }}
            placeholder="ej: 2"
            min="0"
          />
        </div>
      </div>

      {/* RESUMEN DETALLADO */}
      {canContinue && computed && (
        <div style={s.summaryCard}>
          <p style={s.summaryTitle}>¿Qué se va a calcular?</p>

          {/* Qué probabilidad */}
          <div style={s.summaryRow}>
            <span style={s.summaryKey}>Probabilidad:</span>
            <span style={s.summaryBig}>{modeLabel(mode, xNum)}</span>
          </div>
          <div style={s.summaryRow}>
            <span style={s.summaryKey}>λ =</span>
            <span style={s.summaryBig}>{lambdaFinal.toFixed(4)}</span>
          </div>

          {/* Fórmula expandida */}
          <div style={s.formulaBox}>
            <p style={s.formulaLabel}>Fórmula aplicada:</p>
            <code style={s.formulaText}>{computed.formula}</code>

            {/* Términos individuales */}
            <div style={{ marginTop: 10 }}>
              {needsComplement && (
                <div style={s.formulaLine}>= 1 −  [</div>
              )}
              {computed.terms.map((t, idx) => (
                <div key={idx} style={s.formulaTerm}>
                  <span style={{ color: "#6b7280", minWidth: 20 }}>P{t.i} =</span>
                  <code style={s.termCode}>
                    {lambdaFinal.toFixed(2)}^{t.i} · e^(−{lambdaFinal.toFixed(2)}) / {t.i}!
                  </code>
                  <span style={{ color: "#374151" }}>= {t.v.toFixed(6)}</span>
                  {idx < computed.terms.length - 1 && <span style={{ color: "#9ca3af" }}>+</span>}
                </div>
              ))}
              {needsComplement && (
                <div style={s.formulaLine}>]</div>
              )}
            </div>
          </div>

          {/* Resultado */}
          <div style={s.resultFinal}>
            <span style={{ fontSize: 14, color: "#1d4ed8" }}>{modeLabel(mode, xNum)} =</span>
            <span style={{ fontSize: 28, fontWeight: 800, color: "#1d4ed8", marginLeft: 12 }}>
              {computed.result.toFixed(4)}
            </span>
          </div>

          <button style={s.continueBtn} onClick={onNext}>
            Ver análisis completo →
          </button>
        </div>
      )}

      {!canContinue && (
        <div style={{ ...s.summaryCard, background: "#f9fafb", border: "1px dashed #d1d5db" }}>
          <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>
            Completa todos los campos para ver el resumen y continuar.
          </p>
        </div>
      )}
    </div>
  );
};

export default PoissonData;

// ── ESTILOS ───────────────────────────────────────────────────────
const s = {
  container:    { padding: "30px", background: "#f4f6fb", fontFamily: "Inter, sans-serif", minHeight: "100vh" },
  title:        { fontSize: "24px", fontWeight: "800", marginBottom: "20px" },
  guideCard:    { background: "#f7fbff", border: "1px solid #cfe1f2", borderRadius: "12px", padding: "14px", marginBottom: "16px" },
  guideTitle:   { margin: "0 0 8px 0", color: "#133a5a", fontSize: "18px", fontWeight: "600" },
  guideText:    { margin: "5px 0", color: "#24445d", lineHeight: "1.45", fontSize: "13px" },
  code:         { fontFamily: "monospace", background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, fontSize: 13 },

  card:         { background: "#fff", borderRadius: "12px", padding: "16px 18px", marginBottom: "14px", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
  cardTitle:    { fontSize: "14px", fontWeight: "700", color: "#111827", margin: "0 0 12px 0" },

  toggleBtn:    { display: "flex", flexDirection: "column", gap: 3, padding: "10px 18px", borderRadius: "10px", border: "1.5px solid #e5e7eb", background: "#f9fafb", cursor: "pointer", minWidth: 160 },
  toggleActive: { border: "1.5px solid #2563eb", background: "#eff6ff", color: "#1d4ed8" },
  modeBtn:      { display: "flex", flexDirection: "column", gap: 2, padding: "8px 14px", borderRadius: "8px", border: "1.5px solid #e5e7eb", background: "#f9fafb", cursor: "pointer" },
  modeBtnActive:{ border: "1.5px solid #2563eb", background: "#eff6ff", color: "#1d4ed8" },

  row:          { display: "flex", gap: "14px", flexWrap: "wrap" },
  field:        { display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 140 },
  label:        { fontSize: "12px", fontWeight: "600", color: "#374151" },
  input:        { padding: "8px 10px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box" },
  inputSm:      { padding: "8px 10px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", width: "80px", textAlign: "center" },
  select:       { padding: "8px 10px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", background: "#fff" },
  lambdaBox:    { marginTop: "12px", padding: "8px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", fontSize: "13px", color: "#15803d" },

  r3Row:        { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 12 },
  r3Block:      { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "12px 16px" },
  r3BlockTitle: { fontSize: "11px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 },
  r3Inputs:     { display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" },
  r3Field:      { display: "flex", flexDirection: "column", gap: 4 },
  r3In:         { fontSize: "13px", color: "#6b7280", paddingBottom: 8 },
  r3Arrow:      { fontSize: "22px", color: "#2563eb", fontWeight: "700" },
  r3Result:     { background: "#eff6ff", border: "2px solid #2563eb", borderRadius: "12px", padding: "12px 20px", textAlign: "center" },

  // Resumen detallado
  summaryCard:  { background: "#fff", borderRadius: "12px", padding: "20px 22px", marginBottom: "14px", border: "1px solid #bfdbfe", boxShadow: "0 2px 12px rgba(37,99,235,0.08)" },
  summaryTitle: { fontSize: "15px", fontWeight: "700", color: "#1d4ed8", margin: "0 0 14px 0" },
  summaryRow:   { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
  summaryKey:   { fontSize: "13px", color: "#6b7280", fontWeight: "600", minWidth: 110 },
  summaryBig:   { fontSize: "18px", fontWeight: "800", color: "#111827" },

  formulaBox:   { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px 16px", margin: "12px 0" },
  formulaLabel: { fontSize: "11px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px 0" },
  formulaText:  { fontSize: "13px", fontFamily: "monospace", color: "#374151", display: "block", marginBottom: 10 },
  formulaLine:  { fontSize: "13px", fontFamily: "monospace", color: "#374151", padding: "2px 0" },
  formulaTerm:  { display: "flex", alignItems: "center", gap: 10, padding: "4px 0", flexWrap: "wrap" },
  termCode:     { fontFamily: "monospace", fontSize: "12px", background: "#f1f5f9", padding: "2px 8px", borderRadius: 4, color: "#374151" },

  resultFinal:  { display: "flex", alignItems: "center", background: "#eff6ff", border: "1.5px solid #2563eb", borderRadius: "10px", padding: "12px 18px", margin: "14px 0" },
  continueBtn:  { padding: "10px 24px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "600", fontSize: "14px", cursor: "pointer", width: "100%" },
};
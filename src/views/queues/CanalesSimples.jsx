import React from "react";
import { toFiniteNumber } from "../../utils/validation";

const MODOS_POISSON = [
    { key: "exact", label: "P(x = n)", desc: "Exacta" },
    { key: "greater", label: "P(x > n)", desc: "Mayor que" },
    { key: "greater_eq", label: "P(x ≥ n)", desc: "Mayor o igual" },
    { key: "less_eq", label: "P(x ≤ n)", desc: "Menor o igual" },
    { key: "less", label: "P(x < n)", desc: "Menor que" },
];

const UNIT_FACTORS = {
    seg: 1,
    min: 60,
    hora: 3600,
    día: 86400,
};

// Convierte tasa a unidad destino
const convertRate = (cantidad, tiempo, fromUnit, toUnit) => {
    const qty = toFiniteNumber(cantidad, null);
    const duration = toFiniteNumber(tiempo, null);
    if (!Number.isFinite(qty) || !Number.isFinite(duration) || qty < 0 || duration <= 0) return null;
    const ratePerSec = qty / (duration * UNIT_FACTORS[fromUnit]);
    return ratePerSec * UNIT_FACTORS[toUnit];
};

const CanalesSimples = ({ data, setData, onNext }) => {
    const update = (patch) => setData(prev => ({ ...prev, ...patch }));
    const updateL = (patch) => setData(prev => ({ ...prev, llegadas: { ...prev.llegadas, ...patch } }));
    const updateS = (patch) => setData(prev => ({ ...prev, servicio: { ...prev.servicio, ...patch } }));
    const updateC = (patch) => setData(prev => ({ ...prev, calcular: { ...prev.calcular, ...patch } }));
    const updatePnC = (patch) => setData(prev => ({ ...prev, pnCondicion: { ...prev.pnCondicion, ...patch } }));

    const {
        llegadas,
        servicio,
        calcular,
        x,
        modoPoisson,
        t,
        unidadBase,
        pnCondicion = {}
    } = data;

    const pnModo = pnCondicion.modo || "greater_eq";
    const xValue = toFiniteNumber(x, NaN);
    const tValue = toFiniteNumber(t, NaN);
    const pnValue = toFiniteNumber(pnCondicion.valor, NaN);

    // ── Detectar diferencia de unidades ──────────────────────────
    const unidadesDiferentes = llegadas.unidad !== servicio.unidad &&
        llegadas.cantidad && servicio.cantidad;

    // Unidad base efectiva
    const uBase = unidadBase || servicio.unidad;

    // λ y μ convertidos a uBase
    const lambda = convertRate(llegadas.cantidad, llegadas.tiempo, llegadas.unidad, uBase);
    const mu = convertRate(servicio.cantidad, servicio.tiempo, servicio.unidad, uBase);
    const rho = (lambda && mu) ? lambda / mu : null;

    // λ y μ en sus unidades originales (para mostrar)
    const lambdaOrig = llegadas.cantidad && llegadas.tiempo
        ? parseFloat(llegadas.cantidad) / parseFloat(llegadas.tiempo) : null;
    const muOrig = servicio.cantidad && servicio.tiempo
        ? parseFloat(servicio.cantidad) / parseFloat(servicio.tiempo) : null;

    const invalidX = calcular.poisson && (!Number.isInteger(xValue) || xValue < 0);
    const invalidT = calcular.exponencial && (!Number.isFinite(tValue) || tValue < 0);
    const invalidPn = calcular.mm1 && (!Number.isInteger(pnValue) || pnValue < 0);
    const validationMessage = invalidX
        ? "x debe ser un número entero no negativo para Poisson."
        : invalidT
            ? "t debe ser un número no negativo para la distribución exponencial."
            : invalidPn
                ? "Pn requiere un valor entero no negativo."
                : "";

    const canContinue = lambda !== null && lambda > 0 &&
        mu !== null && mu > 0 &&
        (!unidadesDiferentes || unidadBase !== null) &&
        (calcular.poisson || calcular.exponencial || calcular.mm1) &&
        (!calcular.mm1 || (rho !== null && rho < 1)) &&
        (!calcular.poisson || !invalidX) &&
        (!calcular.exponencial || !invalidT) &&
        (!calcular.mm1 || !invalidPn) &&
        validationMessage === "";

    return (
        <div style={s.container}>
            <h2 style={s.title}>Canal Simple — M/M/1</h2>

            {/* GUÍA */}
            <div style={s.guideCard}>
                <h3 style={s.guideTitle}>¿Qué es un canal simple M/M/1?</h3>
                <p style={s.guideText}>
                    Modela un sistema con <strong>un solo servidor</strong>, donde los clientes
                    llegan según una distribución de <strong>Poisson</strong> y el tiempo de
                    servicio sigue una distribución <strong>Exponencial</strong>.
                </p>
                <div style={s.defGrid}>
                    {[
                        {
                            sym: "λ", bg: "#eff6ff", color: "#2563eb", name: "Tasa de llegadas (lambda)",
                            desc: "Promedio de clientes que llegan por unidad de tiempo. Sigue distribución Poisson — llegadas aleatorias e independientes.", ej: "0.75 clientes/min"
                        },
                        {
                            sym: "μ", bg: "#fef2f2", color: "#dc2626", name: "Tasa de servicio (mu)",
                            desc: "Promedio de clientes que el servidor atiende por unidad de tiempo. Los tiempos de servicio siguen distribución Exponencial.", ej: "1 cliente/min"
                        },
                        {
                            sym: "ρ", bg: "#f0fdf4", color: "#16a34a", name: "Utilización del servidor (rho)",
                            desc: "ρ = λ/μ. Fracción del tiempo que el servidor está ocupado. Debe ser < 1 para que el sistema sea estable.", ej: "ρ = 0.75 → ocupado 75%"
                        },
                    ].map(({ sym, bg, color, name, desc, ej }) => (
                        <div key={sym} style={s.defCard}>
                            <div style={{ ...s.defSymbol, background: bg, color }}>{sym}</div>
                            <div>
                                <div style={s.defName}>{name}</div>
                                <div style={s.defDesc}>{desc}<br /><em>Ej: {ej}</em></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── LLEGADAS ── */}
            <div style={s.card}>
                <p style={s.cardTitle}><span style={{ color: "#2563eb" }}>λ</span> — Tasa de llegadas</p>
                <p style={s.guideText}>Ingresa cuántos clientes llegan y en qué período. La app calculará λ automáticamente.</p>
                <div style={s.inputRow}>
                    <div style={s.field}>
                        <label style={s.label}>¿Cuántos clientes llegan?</label>
                        <input type="number" value={llegadas.cantidad} onChange={e => updateL({ cantidad: e.target.value })} style={s.input} placeholder="ej: 45" />
                    </div>
                    <div style={s.fieldSm}>
                        <label style={s.label}>En cuántos</label>
                        <input type="number" value={llegadas.tiempo} onChange={e => updateL({ tiempo: e.target.value })} style={s.inputSm} placeholder="ej: 60" />
                    </div>
                    <div style={s.fieldSm}>
                        <label style={s.label}>Unidad</label>
                        <select value={llegadas.unidad} onChange={e => updateL({ unidad: e.target.value })} style={s.select}>
                            <option value="seg">seg</option>
                            <option value="min">min</option>
                            <option value="hora">hora</option>
                            <option value="día">día</option>
                        </select>
                    </div>
                </div>
                {lambdaOrig !== null && (
                    <div style={s.resultInline}>
                        <span style={{ color: "#2563eb", fontWeight: 700 }}>λ =</span>
                        <span style={s.resultNum}>{lambdaOrig.toFixed(4)}</span>
                        <span style={s.resultUnit}>clientes/{llegadas.unidad}</span>
                        <span style={s.resultFormula}>({llegadas.cantidad} ÷ {llegadas.tiempo} {llegadas.unidad})</span>
                    </div>
                )}
            </div>

            {/* ── SERVICIO ── */}
            <div style={s.card}>
                <p style={s.cardTitle}><span style={{ color: "#dc2626" }}>μ</span> — Tasa de servicio</p>
                <p style={s.guideText}>Ingresa cuántos clientes puede atender el servidor y en qué período.</p>
                <div style={s.inputRow}>
                    <div style={s.field}>
                        <label style={s.label}>¿Cuántos clientes puede atender?</label>
                        <input type="number" value={servicio.cantidad} onChange={e => updateS({ cantidad: e.target.value })} style={s.input} placeholder="ej: 60" />
                    </div>
                    <div style={s.fieldSm}>
                        <label style={s.label}>En cuántos</label>
                        <input type="number" value={servicio.tiempo} onChange={e => updateS({ tiempo: e.target.value })} style={s.inputSm} placeholder="ej: 60" />
                    </div>
                    <div style={s.fieldSm}>
                        <label style={s.label}>Unidad</label>
                        <select value={servicio.unidad} onChange={e => updateS({ unidad: e.target.value })} style={s.select}>
                            <option value="seg">seg</option>
                            <option value="min">min</option>
                            <option value="hora">hora</option>
                            <option value="día">día</option>
                        </select>
                    </div>
                </div>
                {muOrig !== null && (
                    <div style={{ ...s.resultInline, borderColor: "#fecaca", background: "#fef2f2" }}>
                        <span style={{ color: "#dc2626", fontWeight: 700 }}>μ =</span>
                        <span style={{ ...s.resultNum, color: "#dc2626" }}>{muOrig.toFixed(4)}</span>
                        <span style={s.resultUnit}>clientes/{servicio.unidad}</span>
                        <span style={s.resultFormula}>({servicio.cantidad} ÷ {servicio.tiempo} {servicio.unidad})</span>
                    </div>
                )}
            </div>

            {/* ── CONVERSIÓN DE UNIDADES ── */}
            {unidadesDiferentes && (
                <div style={s.convCard}>
                    <p style={s.convTitle}>⚠ Unidades diferentes detectadas</p>
                    <p style={s.guideText}>
                        λ está en <strong>{llegadas.unidad}</strong> y μ en <strong>{servicio.unidad}</strong>.
                        Selecciona la unidad de tiempo en la que quieres trabajar:
                    </p>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                        {[llegadas.unidad, servicio.unidad].filter((v, i, a) => a.indexOf(v) === i).map(u => {
                            const lConv = convertRate(llegadas.cantidad, llegadas.tiempo, llegadas.unidad, u);
                            const mConv = convertRate(servicio.cantidad, servicio.tiempo, servicio.unidad, u);
                            return (
                                <button
                                    key={u}
                                    style={{ ...s.convBtn, ...(unidadBase === u ? s.convBtnActive : {}) }}
                                    onClick={() => update({ unidadBase: u })}
                                >
                                    <span style={{ fontSize: 13, fontWeight: 700 }}>Trabajar en {u}</span>
                                    <span style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>
                                        λ = {lConv?.toFixed(4)} clientes/{u}
                                    </span>
                                    <span style={{ fontSize: 11, color: "#6b7280" }}>
                                        μ = {mConv?.toFixed(4)} clientes/{u}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Mostrar conversión elegida */}
                    {unidadBase && (
                        <div style={s.convResult}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: "#16a34a", marginBottom: 8 }}>
                                ✓ Trabajando en {unidadBase}:
                            </p>
                            <div style={{ fontFamily: "monospace", fontSize: 12, color: "#374151" }}>
                                <div>λ: {llegadas.cantidad}/{llegadas.tiempo}{llegadas.unidad} → {lambda?.toFixed(4)} clientes/{unidadBase}</div>
                                <div>μ: {servicio.cantidad}/{servicio.tiempo}{servicio.unidad} → {mu?.toFixed(4)} clientes/{unidadBase}</div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ρ */}
            {lambda && mu && (!unidadesDiferentes || unidadBase) && (
                <div style={{
                    ...s.resultInline,
                    borderColor: rho < 1 ? "#bbf7d0" : "#fecaca",
                    background: rho < 1 ? "#f0fdf4" : "#fef2f2",
                }}>
                    <span style={{ color: rho < 1 ? "#16a34a" : "#dc2626", fontWeight: 700 }}>ρ = λ/μ =</span>
                    <span style={{ ...s.resultNum, color: rho < 1 ? "#15803d" : "#dc2626" }}>{rho?.toFixed(4)}</span>
                    <span style={s.resultUnit}>
                        {rho < 1 ? "✓ Sistema estable" : "✗ Sistema inestable — aumenta μ o reduce λ"}
                    </span>
                </div>
            )}

            {/* ── QUÉ CALCULAR ── */}
            <div style={s.card}>
                <p style={s.cardTitle}>¿Qué quieres calcular?</p>
                <div style={s.checkGrid}>
                    {[
                        {
                            key: "poisson", title: "Distribución de Poisson", formula: "Px = (λˣ · e^(−λ)) / x!",
                            desc: "Probabilidad de que lleguen exactamente x clientes en un período.",
                            when: "Cuando preguntan: ¿cuál es la probabilidad de que lleguen x clientes?"
                        },
                        {
                            key: "exponencial", title: "Distribución Exponencial", formula: "P(T ≤ t) = 1 − e^(−μt)",
                            desc: "Probabilidad de que un cliente sea atendido en a lo sumo t unidades de tiempo.",
                            when: "Cuando preguntan: ¿cuál es la probabilidad de que el servicio tome menos de t minutos?"
                        },
                        {
                            key: "mm1", title: "Sistema completo M/M/1", formula: "P₀, Lq, L, Wq, W, Pw, Pn",
                            desc: "Las 7 métricas operativas del sistema.",
                            when: "Cuando necesitas caracterizar el sistema completo — tiempos, clientes en cola, utilización."
                        },
                    ].map(({ key, title, formula, desc, when }) => (
                        <div
                            key={key}
                            style={{ ...s.checkCard, ...(calcular[key] ? s.checkActive : {}) }}
                            onClick={() => updateC({ [key]: !calcular[key] })}
                        >
                            <div style={s.checkHeader}>
                                <div style={{ ...s.checkbox, background: calcular[key] ? "#2563eb" : "#fff", border: `2px solid ${calcular[key] ? "#2563eb" : "#d1d5db"}` }}>
                                    {calcular[key] ? "✓" : ""}
                                </div>
                                <span style={s.checkTitle}>{title}</span>
                            </div>
                            <code style={s.checkFormula}>{formula}</code>
                            <p style={s.checkDesc}>{desc}</p>
                            <p style={s.checkWhen}><strong>Cuándo usarlo:</strong> {when}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── PARÁMETROS ADICIONALES ── */}
            {(calcular.poisson || calcular.exponencial || calcular.mm1) && (
                <div style={s.card}>
                    <p style={s.cardTitle}>Parámetros adicionales</p>

                    {/* Poisson */}
                    {calcular.poisson && (
                        <div style={s.paramBlock}>
                            <p style={s.paramTitle}>Para Poisson — P(x)</p>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                                {MODOS_POISSON.map(m => (
                                    <button
                                        key={m.key}
                                        style={{ ...s.modeBtn, ...(modoPoisson === m.key ? s.modeBtnActive : {}) }}
                                        onClick={() => update({ modoPoisson: m.key })}
                                    >
                                        <span style={{ fontSize: 12, fontWeight: 700 }}>{m.label}</span>
                                        <span style={{ fontSize: 10, opacity: 0.75 }}>{m.desc}</span>
                                    </button>
                                ))}
                            </div>
                            <div style={s.field}>
                                <label style={s.label}>Valor de x (número de clientes)</label>
                                <input type="number" value={x} onChange={e => update({ x: e.target.value })}
                                    style={{ ...s.inputSm, width: 120 }} placeholder="ej: 2" min="0" />
                            </div>
                        </div>
                    )}

                    {/* Exponencial */}
                    {calcular.exponencial && (
                        <div style={s.paramBlock}>
                            <p style={s.paramTitle}>Para Exponencial — P(T ≤ t)</p>
                            <div style={s.field}>
                                <label style={s.label}>Valor de t — tiempo límite ({uBase})</label>
                                <input type="number" value={t} onChange={e => update({ t: e.target.value })}
                                    style={{ ...s.inputSm, width: 120 }} placeholder="ej: 1" min="0" step="0.1" />
                            </div>
                        </div>
                    )}

                    {/* M/M/1 Pn */}
                    {calcular.mm1 && (
                        <div style={s.paramBlock}>
                            {/* Condición Pn */}
                            <div style={{ marginTop: 14 }}>
                                <p style={{ ...s.paramTitle, marginBottom: 8 }}>Condición adicional sobre Pn</p>
                                <p style={s.guideText}>
                                    Calcula la probabilidad de que haya una cantidad específica de clientes
                                    en el sistema. Igual que Poisson pero sobre n.
                                </p>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10, marginTop: 8 }}>
                                    {MODOS_POISSON.map(m => (
                                        <button
                                            key={m.key}
                                            style={{ ...s.modeBtn, ...(pnModo === m.key ? s.modeBtnActive : {}) }}
                                            onClick={() => updatePnC({ modo: m.key })}
                                        >
                                            <span style={{ fontSize: 12, fontWeight: 700 }}>{m.label}</span>
                                            <span style={{ fontSize: 10, opacity: 0.75 }}>{m.desc}</span>
                                        </button>
                                    ))}
                                </div>
                                <div style={s.field}>
                                    <label style={s.label}>Valor de n para la condición</label>
                                    <input type="number" value={pnCondicion.valor}
                                        onChange={e => updatePnC({ valor: e.target.value })}
                                        style={{ ...s.inputSm, width: 120 }} placeholder="ej: 3" min="0" />
                                </div>
                                {pnCondicion.valor && (
                                    <p style={{ ...s.guideText, marginTop: 8, fontFamily: "monospace", color: "#2563eb" }}>
                                        Se calculará: P(n {
                                            pnCondicion.modo === "exact" ? "=" :
                                                pnCondicion.modo === "greater" ? ">" :
                                                    pnCondicion.modo === "greater_eq" ? "≥" :
                                                        pnCondicion.modo === "less_eq" ? "≤" : "<"
                                        } {pnCondicion.valor})
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── RESUMEN ── */}
            <div style={s.summaryCard}>
                <p style={s.cardTitle}>Resumen</p>
                <div style={s.summaryGrid}>
                    {[
                        {
                            label: "λ", val: lambda?.toFixed(4) ?? "—", color: "#2563eb",
                            sub: unidadBase ? `en ${unidadBase}` : `en ${llegadas.unidad}`
                        },
                        {
                            label: "μ", val: mu?.toFixed(4) ?? "—", color: "#dc2626",
                            sub: unidadBase ? `en ${unidadBase}` : `en ${servicio.unidad}`
                        },
                        {
                            label: "ρ", val: rho?.toFixed(4) ?? "—",
                            color: rho < 1 ? "#16a34a" : "#dc2626", sub: "λ/μ"
                        },
                        { label: "x", val: calcular.poisson ? (x || "—") : "N/A", color: "#374151", sub: "Poisson" },
                        { label: "t", val: calcular.exponencial ? (t || "—") : "N/A", color: "#374151", sub: "Exponencial" },
                    ].map(({ label, val, color, sub }) => (
                        <div key={label} style={s.summaryItem}>
                            <span style={s.summaryLabel}>{label}</span>
                            <span style={{ ...s.summaryVal, color }}>{val}</span>
                            <span style={{ fontSize: 10, color: "#9ca3af" }}>{sub}</span>
                        </div>
                    ))}
                </div>

                {calcular.mm1 && rho >= 1 && (
                    <div style={s.errorBox}>
                        ⚠ Para M/M/1 se requiere ρ &lt; 1. Actualmente ρ = {rho?.toFixed(4)}.
                    </div>
                )}
                {validationMessage && (
                    <div style={s.errorBox}>
                        ⚠ {validationMessage}
                    </div>
                )}

                <button
                    style={{
                        ...s.continueBtn, background: canContinue ? "#2563eb" : "#9ca3af",
                        cursor: canContinue ? "pointer" : "not-allowed", marginTop: 14
                    }}
                    disabled={!canContinue}
                    onClick={onNext}
                >
                    Ver análisis →
                </button>
            </div>
        </div>
    );
};

export default CanalesSimples;

const s = {
    container: { padding: "30px", background: "#f4f6fb", fontFamily: "Inter, sans-serif", minHeight: "100vh" },
    title: { fontSize: "24px", fontWeight: "800", marginBottom: "20px" },
    guideCard: { background: "#f7fbff", border: "1px solid #cfe1f2", borderRadius: "12px", padding: "16px 18px", marginBottom: "16px" },
    guideTitle: { margin: "0 0 10px 0", color: "#133a5a", fontSize: "18px", fontWeight: "600" },
    guideText: { margin: "5px 0", color: "#24445d", lineHeight: "1.45", fontSize: "13px" },
    defGrid: { display: "flex", gap: 10, flexWrap: "wrap", margin: "12px 0 4px 0" },
    defCard: { display: "flex", gap: 12, flex: 1, minWidth: 200, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px" },
    defSymbol: { width: 38, height: 38, borderRadius: "50%", fontSize: 18, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    defName: { fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 4 },
    defDesc: { fontSize: 12, color: "#6b7280", lineHeight: 1.5 },
    card: { background: "#fff", borderRadius: "12px", padding: "16px 18px", marginBottom: "14px", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
    cardTitle: { fontSize: "14px", fontWeight: "700", color: "#111827", margin: "0 0 10px 0" },
    inputRow: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" },
    field: { display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 160 },
    fieldSm: { display: "flex", flexDirection: "column", gap: 5 },
    label: { fontSize: "12px", fontWeight: "600", color: "#374151" },
    input: { padding: "8px 10px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box" },
    inputSm: { padding: "8px 10px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", textAlign: "center" },
    select: { padding: "8px 10px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", background: "#fff" },
    resultInline: { display: "flex", alignItems: "center", gap: 8, marginTop: 12, padding: "10px 14px", borderRadius: 10, border: "1px solid #bfdbfe", background: "#eff6ff", flexWrap: "wrap" },
    resultNum: { fontSize: 22, fontWeight: 800, color: "#1d4ed8" },
    resultUnit: { fontSize: 12, color: "#6b7280" },
    resultFormula: { fontSize: 11, color: "#9ca3af", fontFamily: "monospace" },
    // Conversión
    convCard: { background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: "12px", padding: "16px 18px", marginBottom: "14px" },
    convTitle: { fontSize: "14px", fontWeight: "700", color: "#92400e", margin: "0 0 8px 0" },
    convBtn: { display: "flex", flexDirection: "column", padding: "12px 16px", borderRadius: "10px", border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer", minWidth: 160, gap: 2 },
    convBtnActive: { border: "1.5px solid #16a34a", background: "#f0fdf4" },
    convResult: { marginTop: 12, padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8 },
    // Checks
    checkGrid: { display: "flex", flexDirection: "column", gap: 10 },
    checkCard: { padding: "14px 16px", borderRadius: "10px", border: "1.5px solid #e5e7eb", background: "#f9fafb", cursor: "pointer" },
    checkActive: { border: "1.5px solid #2563eb", background: "#eff6ff" },
    checkHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 6 },
    checkbox: { width: 20, height: 20, borderRadius: 5, color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    checkTitle: { fontSize: 14, fontWeight: 700, color: "#111827" },
    checkFormula: { display: "block", fontFamily: "monospace", fontSize: 12, background: "#f1f5f9", padding: "3px 8px", borderRadius: 4, marginBottom: 6, color: "#374151" },
    checkDesc: { fontSize: 12, color: "#374151", margin: "0 0 4px 0", lineHeight: 1.5 },
    checkWhen: { fontSize: 11, color: "#6b7280", margin: 0 },
    paramBlock: { marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #f1f5f9" },
    paramTitle: { fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10 },
    modeBtn: { display: "flex", flexDirection: "column", gap: 2, padding: "6px 12px", borderRadius: "8px", border: "1.5px solid #e5e7eb", background: "#f9fafb", cursor: "pointer" },
    modeBtnActive: { border: "1.5px solid #2563eb", background: "#eff6ff", color: "#1d4ed8" },
    summaryCard: { background: "#fff", borderRadius: "12px", padding: "18px", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
    summaryGrid: { display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 14 },
    summaryItem: { display: "flex", flexDirection: "column", gap: 2 },
    summaryLabel: { fontSize: "11px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" },
    summaryVal: { fontSize: "20px", fontWeight: "700" },
    errorBox: { padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", fontSize: "13px", color: "#dc2626", marginBottom: 8 },
    continueBtn: { padding: "11px 24px", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "600", fontSize: "14px", width: "100%" },
};
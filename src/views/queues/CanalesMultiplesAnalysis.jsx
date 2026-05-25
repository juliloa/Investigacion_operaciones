import React, { useEffect, useState } from "react";
import { toFiniteNumber, formatNumber } from "../../utils/validation";

// ── UNIT CONVERSION ────────────────────────────────────────────────
const UNIT_FACTORS = {
    seg: 1,
    min: 60,
    hora: 3600,
    día: 86400,
};

const convertRate = (cantidad, tiempo, fromUnit, toUnit) => {
    const qty = toFiniteNumber(cantidad, null);
    const duration = toFiniteNumber(tiempo, null);
    if (!Number.isFinite(qty) || !Number.isFinite(duration) || qty < 0 || duration <= 0) return null;
    const ratePerSec = qty / (duration * UNIT_FACTORS[fromUnit]);
    return ratePerSec * UNIT_FACTORS[toUnit];
};

// ── HELPERS ───────────────────────────────────────────────────────
const factorial = (n) => {
    // Validación: rechazar valores inválidos
    if (n === null || n === undefined || isNaN(n)) return 1;
    if (n < 0) return 1; // Factorial no definido para negativos
    if (n > 100) return Infinity; // Prevenir stack overflow
    if (Math.floor(n) !== n) return 1; // Solo enteros
    
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
        if (!isFinite(result)) return Infinity; // Overflow detection
    }
    return result;
};

const pxSingle = (λ, x) => {
    if (λ === null || λ === undefined || !isFinite(λ)) return 0;
    if (x === null || x === undefined || !isFinite(x)) return 0;
    return (Math.pow(λ, x) * Math.pow(Math.E, -λ)) / factorial(Math.floor(x));
};

// ── M/M/k CALCULATIONS ─────────────────────────────────────────────
const calculateMMk = (λ, μ, k) => {
    // Validar inputs
    if (!λ || !isFinite(λ) || !μ || !isFinite(μ) || !k || !isFinite(k)) {
        return null;
    }
    if (λ <= 0 || μ <= 0 || k <= 0 || Math.floor(k) !== k) {
        return null;
    }

    const ρ = λ / μ;
    const ak = ρ / k;

    if (ak >= 1 || ak <= 0) {
        return null; // Sistema inestable
    }

    // Calcular P₀ (Erlang C denominator part)
    let sumPart = 0;
    for (let n = 0; n < k; n++) {
        const term = Math.pow(ρ, n) / factorial(n);
        if (!isFinite(term)) return null;
        sumPart += term;
    }

    const factK = factorial(k);
    if (!isFinite(factK)) return null;

    const erlangPart = Math.pow(ρ, k) / (factK * (1 - ak));
    if (!isFinite(erlangPart)) return null;

    const P0 = 1 / (sumPart + erlangPart);
    if (!isFinite(P0) || P0 <= 0 || P0 > 1) return null;

    // Pw (Erlang C probability)
    const Pw = (Math.pow(ρ, k) / (factK * (1 - ak))) * P0;
    if (!isFinite(Pw) || Pw < 0 || Pw > 1) return null;

    // Lq
    const Lq = (Math.pow(ρ, k + 1) / (factK * k * Math.pow(1 - ak, 2))) * P0;
    if (!isFinite(Lq) || Lq < 0) return null;

    // L
    const L = Lq + ρ;
    if (!isFinite(L) || L < 0) return null;

    // Wq
    const Wq = Lq / λ;
    if (!isFinite(Wq) || Wq < 0) return null;

    // W
    const W = Wq + 1 / μ;
    if (!isFinite(W) || W < 0) return null;

    return { P0, Pw, Lq, L, Wq, W, ρ, ak };
};

const CanalesMultiplesAnalysis = ({ data, onBack }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [hoveredRow, setHoveredRow] = useState(null);

    const formatProbability = (value) => `${formatNumber(value)} (${formatNumber(Number(value) * 100)}%)`;

    const safeData = data || {};
    const { llegadas = {}, servicio = {}, x = "", modoPoisson = "exact", t = "", numServidores = 2, unidadBase, pnCondicion = {} } = safeData;

    // Tabs dinámicos
    const tabs = ["Poisson", "Exponencial", "M/M/k", "Comparación", "Conclusiones"];

    useEffect(() => {
        if (activeTab >= tabs.length) {
            setActiveTab(0);
        }
    }, [activeTab, tabs.length]);

    const activeTabName = tabs[activeTab] || tabs[0];

    // ── Calcular λ y μ con conversión de unidades ───────────────────
    const uBase = unidadBase || servicio.unidad || "min";
    const λ = convertRate(llegadas.cantidad, llegadas.tiempo, llegadas.unidad, uBase);
    const μ = convertRate(servicio.cantidad, servicio.tiempo, servicio.unidad, uBase);
    const xValue = toFiniteNumber(x, NaN);
    const tValue = toFiniteNumber(t, NaN);
    const pnValue = toFiniteNumber(pnCondicion.valor, NaN);

    const invalidX = (!Number.isInteger(xValue) || xValue < 0);
    const invalidT = (!Number.isFinite(tValue) || tValue < 0);
    const invalidPn = (!Number.isInteger(pnValue) || pnValue < 0);

    if (invalidX || invalidT || invalidPn) {
        return (
            <div style={s.container}>
                <p style={{ color: "#991b1b" }}>⚠ Revisa los parámetros de Poisson, Exponencial o Pn. No se permiten valores negativos ni no enteros donde corresponde.</p>
                <button style={s.backBtn} onClick={onBack}>← Volver</button>
            </div>
        );
    }
    
    // Validar que λ y μ sean números válidos
    if (!isFinite(λ) || !isFinite(μ) || λ <= 0 || μ <= 0) {
        return (
            <div style={s.container}>
                <p style={{ color: "#991b1b" }}>⚠ Error: Datos incompletos. λ o μ no son válidos.</p>
                <button style={s.backBtn} onClick={onBack}>← Volver</button>
            </div>
        );
    }
    
    const ρ = λ / μ;
    const k = numServidores || 2;
    
    // Validar k
    if (!isFinite(k) || k <= 0 || Math.floor(k) !== k) {
        return (
            <div style={s.container}>
                <p style={{ color: "#991b1b" }}>⚠ Error: Número de servidores (k) no es válido.</p>
                <button style={s.backBtn} onClick={onBack}>← Volver</button>
            </div>
        );
    }

    // Validar estabilidad M/M/1: λ < μ
    if (λ >= μ) {
        return (
            <div style={s.container}>
                <p style={{ color: "#991b1b" }}>⚠ Error: Sistema M/M/1 inestable. La tasa de llegada (λ) debe ser menor que la tasa de servicio (μ).</p>
                <button style={s.backBtn} onClick={onBack}>← Volver</button>
            </div>
        );
    }

    // M/M/1 (para comparación)
    const P0_mm1 = 1 - ρ;
    const Lq_mm1 = (λ * λ) / (μ * (μ - λ));
    const L_mm1 = Lq_mm1 + ρ;
    const Wq_mm1 = Lq_mm1 / λ;
    const W_mm1 = Wq_mm1 + 1 / μ;
    const Pw_mm1 = ρ;

    // M/M/k
    const mmkResults = calculateMMk(λ, μ, k);

    // Función para calcular mejora porcentual
    const calcImprovement = (mm1Val, mmkVal) => {
        if (mm1Val === 0) return 0;
        return ((mm1Val - mmkVal) / mm1Val) * 100;
    };

    // Poisson
    const xNum = Number.isInteger(xValue) ? xValue : 0;
    const tNum = Number.isFinite(tValue) ? tValue : 0;

    const buildPoisson = () => {
        const terms = modoPoisson === "exact" ? [xNum]
            : modoPoisson === "greater" ? Array.from({ length: xNum + 1 }, (_, i) => i)
                : modoPoisson === "greater_eq" ? Array.from({ length: xNum }, (_, i) => i)
                    : modoPoisson === "less_eq" ? Array.from({ length: xNum + 1 }, (_, i) => i)
                        : Array.from({ length: xNum }, (_, i) => i);

        const complement = modoPoisson === "greater" || modoPoisson === "greater_eq";
        const termVals = terms.map(i => ({ i, v: pxSingle(λ, i) }));
        const sumTerms = termVals.reduce((a, t) => a + t.v, 0);
        const result = complement ? 1 - sumTerms : sumTerms;
        return { termVals, sumTerms, result, complement };
    };

    const expResult = 1 - Math.pow(Math.E, -μ * tNum);

    // Pn condition
    const pnModo = pnCondicion.modo || "greater_eq";
    const pnValor = Number.isInteger(pnValue) ? pnValue : 0;

    const buildPnMMk = () => {
        const terms = pnModo === "exact" ? [pnValor]
            : pnModo === "greater" ? Array.from({ length: pnValor + 1 }, (_, i) => i)
                : pnModo === "greater_eq" ? Array.from({ length: pnValor }, (_, i) => i)
                    : pnModo === "less_eq" ? Array.from({ length: pnValor + 1 }, (_, i) => i)
                        : Array.from({ length: pnValor }, (_, i) => i);

        const complement = pnModo === "greater" || pnModo === "greater_eq";
        const termVals = terms.map(i => {
            let v;
            if (i <= k) {
                v = (Math.pow(ρ, i) / factorial(i)) * mmkResults.P0;
            } else {
                v = (Math.pow(ρ, i) / (factorial(k) * Math.pow(k, i - k))) * mmkResults.P0;
            }
            return { i, v };
        });

        const sumTerms = termVals.reduce((a, t) => a + t.v, 0);
        const result = complement ? 1 - sumTerms : sumTerms;

        const label =
            pnModo === "exact" ? `P(n = ${pnValor})`
                : pnModo === "greater" ? `P(n > ${pnValor})`
                    : pnModo === "greater_eq" ? `P(n ≥ ${pnValor})`
                        : pnModo === "less_eq" ? `P(n ≤ ${pnValor})`
                            : `P(n < ${pnValor})`;

        return { termVals, sumTerms, result, complement, label };
    };

    const pnCondMMk = buildPnMMk();

    if (!data) return (
        <div style={s.container}>
            <p style={{ color: "#6b7280" }}>Sin datos. Regresa e ingresa los valores.</p>
            <button style={s.backBtn} onClick={onBack}>← Volver</button>
        </div>
    );

    // ── COMPARACIÓN TABLE ────────────────────────────────────────
    const ComparisonTable = () => (
        <div>
            <p style={s.sectionLabel}>¿Qué pasa si abro más cajas? (M/M/1 vs M/M/k)</p>
            <div style={s.explainBox}>
                <p style={s.explainTitle}>Cómo leer esta tabla</p>
                <p style={s.explainText}>
                    Compara tu negocio con <strong>1 sola caja</strong> (M/M/1) vs <strong>{k} cajas</strong> (M/M/{k}). Los números te dicen si la gente espera más o menos.
                </p>
                <ul style={{ ...s.explainText, paddingLeft: 20, margin: "8px 0" }}>
                    <li><strong>Flecha verde (↓ o ↑):</strong> ¡Buena noticia! Ese indicador mejoró al abrir más cajas.</li>
                    <li><strong>Flecha roja:</strong> Ese indicador empeoró o no cambió lo suficiente.</li>
                </ul>
            </div>
            <div style={s.card}>
                {(() => {
                    const items = [
                        { name: "P₀", mm1: P0_mm1, mmk: mmkResults.P0, unit: "", isProb: true, higherIsBetter: true, desc: "¿El local está vacío?", when: "Mientras más alto, más descansa el cajero. Si es muy bajo, el cajero está estresado.", color: "#2563eb" },
                        { name: "Pw", mm1: Pw_mm1, mmk: mmkResults.Pw, unit: "", isProb: true, higherIsBetter: false, desc: "¿Tendré que esperar?", when: "Probabilidad de que al llegar te toque hacer fila. Menos es mejor.", color: "#16a34a" },
                        { name: "Lq", mm1: Lq_mm1, mmk: mmkResults.Lq, unit: "clientes", isProb: false, higherIsBetter: false, desc: "Gente en la fila", when: "Promedio de personas paradas esperando. Menos es mejor.", color: "#7c3aed" },
                        { name: "L", mm1: L_mm1, mmk: mmkResults.L, unit: "clientes", isProb: false, higherIsBetter: false, desc: "Gente total en el local", when: "Todas las cabezas dentro del sistema (fila + siendo atendidos).", color: "#0891b2" },
                        { name: "Wq", mm1: Wq_mm1, mmk: mmkResults.Wq, unit: "u.t.", isProb: false, higherIsBetter: false, desc: "Tiempo haciendo fila", when: "Minutos/horas esperando antes de ser atendido. Menos es mejor.", color: "#ea580c" },
                        { name: "W", mm1: W_mm1, mmk: mmkResults.W, unit: "u.t.", isProb: false, higherIsBetter: false, desc: "Tiempo total (fila + atención)", when: "Experiencia completa del cliente, desde que llega hasta que sale.", color: "#be185d" },
                    ];

                    return (
                        <>
                            <table style={s.table}>
                    <thead>
                        <tr style={s.tableHeaderRow}>
                            <th style={s.tableHeader}>Métrica</th>
                            <th style={s.tableHeader}>M/M/1 (1 servidor)</th>
                            <th style={s.tableHeader}>M/M/{k} ({k} servidores)</th>
                            <th style={s.tableHeader}>Cambio (M/M/k − M/M/1)</th>
                            <th style={s.tableHeader}>% Cambio (mejora relativa vs M/M/1)</th>
                        </tr>
                    </thead>
                    <tbody>
                            {items.map(({ name, mm1, mmk, isProb, higherIsBetter, color }, idx) => {
                                const isImprovement = higherIsBetter ? mmk > mm1 : mmk < mm1;
                                const valueIncreased = mmk > mm1;
                                const displayMm1 = isProb ? formatProbability(mm1) : formatNumber(mm1);
                                const displayMmk = isProb ? formatProbability(mmk) : formatNumber(mmk);
                                const changeAbs = formatNumber(Math.abs(mmk - mm1));
                                const percentImprovement = calcImprovement(mm1, mmk);

                                return (
                                    <tr
                                        key={name}
                                        style={{
                                            ...s.tableRow,
                                            ...(hoveredRow === idx ? { background: color + "12" } : {}),
                                        }}
                                        onMouseEnter={() => setHoveredRow(idx)}
                                    >
                                        <td style={{ ...s.tableCell, fontWeight: 700 }}>{name}</td>
                                        <td style={{ ...s.tableCell, color: color }}>{displayMm1}</td>
                                        <td style={{ ...s.tableCell, color: color, fontWeight: 600 }}>{displayMmk}</td>
                                        <td style={{ ...s.tableCell, color: isImprovement ? "#10b981" : "#ef4444" }}>
                                            {valueIncreased ? "↑" : "↓"} {changeAbs}
                                        </td>
                                        <td style={{ ...s.tableCell, color: isImprovement ? "#10b981" : "#ef4444", fontWeight: 700 }}>
                                            {isImprovement ? "Mejora: " : "Empeora: "}{formatNumber(Math.abs(percentImprovement))}%
                                        </td>
                                    </tr>
                                );
                            })}
                    </tbody>
                </table>

                            {/* Tooltip hover similar to CanalesSimpleAnalysis */}
                            {hoveredRow !== null && items[hoveredRow] && (() => {
                                const it = items[hoveredRow];
                                const isImprovement = it.higherIsBetter ? it.mmk > it.mm1 : it.mmk < it.mm1;
                                const conclusion = isImprovement ? "Mejora: la métrica mejora con M/M/k." : "No es una mejora: revisar capacidad o parámetros.";
                                const recommendation = isImprovement ? "Mantener configuración y monitorizar en picos." : "Considerar aumentar servidores o mejorar servicio.";
                                return (
                                    <div style={{ ...s.tooltip, borderColor: it.color }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                            <span style={{ ...s.tooltipBadge, background: it.color + "18", color: it.color, border: `1px solid ${it.color}33` }}>
                                                {it.name}
                                            </span>
                                            <span style={s.tooltipTitle}>{it.desc}</span>
                                        </div>
                                        <p style={s.tooltipText}><strong>¿Qué es?</strong> {it.desc}</p>
                                        <p style={s.tooltipText}><strong>¿Cuándo usarlo?</strong> {it.when}</p>
                                        <p style={{ ...s.tooltipText, marginTop: 6 }}><strong>Conclusión:</strong> {conclusion}</p>
                                        <p style={{ ...s.tooltipText, color: "#1d4ed8", marginTop: 6 }}><strong>Recomendación:</strong> {recommendation}</p>
                                        <div style={s.tooltipFormula}>
                                            <code style={{ fontSize: 12 }}>{it.name} — M/M/1: {formatNumber(it.mm1)} → M/M/{k}: {formatNumber(it.mmk)}</code>
                                        </div>
                                    </div>
                                );
                            })()}
                        </>
                    );
                })()}

                {/* Click panel removed: details are now available via hover tooltip */}
            </div>

            {/* Resumen de mejoras */}
            <div style={s.card}>
                <p style={s.cardTitle}>¿Valió la pena abrir más cajas?</p>
                <div style={s.summaryGrid}>
                    {[
                        {
                            label: "Clientes en cola",
                            mm1: formatNumber(Lq_mm1),
                            mmk: formatNumber(mmkResults.Lq),
                            reduction: formatNumber((Lq_mm1 - mmkResults.Lq) / Lq_mm1 * 100),
                            color: "#7c3aed"
                        },
                        {
                            label: "Tiempo en cola",
                            mm1: formatNumber(Wq_mm1),
                            mmk: formatNumber(mmkResults.Wq),
                            reduction: formatNumber((Wq_mm1 - mmkResults.Wq) / Wq_mm1 * 100),
                            color: "#ea580c"
                        },
                        {
                            label: "Probabilidad de espera",
                            mm1: formatProbability(Pw_mm1),
                            mmk: formatProbability(mmkResults.Pw),
                            reduction: formatNumber((Pw_mm1 - mmkResults.Pw) / Pw_mm1 * 100),
                            color: "#16a34a"
                        },
                    ].map((metric, idx) => {
                        const reductionVal = parseFloat(metric.reduction);
                        const isImprovement = reductionVal > 0;
                        const conclusionText = isImprovement
                            ? `¡Sí! Al abrir ${k} cajas, este indicador mejoró notablemente.`
                            : `No mejoró. Puede que ${k} servidores no sean suficientes o que el problema esté en otro lado.`;
                        const recommendationText = isImprovement
                            ? `Mantener ${k} servidores y monitorear en horarios de mayor demanda.`
                            : `Considerar más cajeros o hacer el servicio más rápido por persona.`;
                        return (
                            <div key={idx} style={{ ...s.summaryMetricCard, borderTop: `3px solid ${metric.color}` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: metric.color }}>{metric.label}</div>
                                        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>M/M/1 → M/M/{k}</div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontSize: 12, color: "#6b7280" }}>Cambio</div>
                                        <div style={{ fontWeight: 800, fontSize: 18, color: isImprovement ? "#16a34a" : "#dc2626", marginTop: 6 }}>
                                            {isImprovement ? "Mejora: " : "Empeora: "}{formatNumber(Math.abs(reductionVal))}%
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                                    <div>
                                        <div style={{ fontSize: 12, color: "#6b7280" }}>M/M/1</div>
                                        <div style={{ fontSize: 18, fontWeight: 800, color: metric.color, marginTop: 6 }}>{metric.mm1}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 12, color: "#6b7280" }}>M/M/{k}</div>
                                        <div style={{ fontSize: 18, fontWeight: 800, color: metric.color, marginTop: 6 }}>{metric.mmk}</div>
                                    </div>
                                </div>

                                <div style={{ marginTop: 10, fontSize: 12, color: "#374151" }}>
                                    <strong>Conclusión:</strong> {conclusionText}
                                </div>
                                <div style={{ marginTop: 6, fontSize: 12, color: "#1d4ed8" }}>
                                    <strong>Recomendación:</strong> {recommendationText}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    // ── TAB POISSON ───────────────────────────────────────────────
    const TabPoisson = () => {
        const poisson = buildPoisson();
        return (
            <div>
                <p style={s.sectionLabel}>Distribución de Poisson (Llegadas)</p>
                <div style={s.card}>
                    <p style={s.cardTitle}>Fórmula</p>
                    <div style={s.formulaBox}>
                        <code>P(x) = (λˣ · e^(-λ)) / x!</code>
                    </div>
                    <div style={{ ...s.formulaBox, background: "#f0fdf4", borderColor: "#bbf7d0" }}>
                        <code>P(x) = ({formatNumber(λ)}ˣ · e^(-{formatNumber(λ)})) / x!</code>
                    </div>
                </div>

                <div style={s.card}>
                    <p style={s.cardTitle}>Términos calculados</p>
                    <div style={s.termGrid}>
                        {poisson.termVals.map(({ i, v }) => (
                            <div key={i} style={s.termCard}>
                                <div style={s.termLabel}>P(x = {i})</div>
                                <div style={s.termValue}>{formatNumber(v)}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={s.card}>
                    <p style={s.cardTitle}>Resultado</p>
                    <div style={s.resultBox}>
                        <span style={{ fontSize: 14, color: "#6b7280" }}>P(x {modoPoisson === "exact" ? "=" : modoPoisson === "greater" ? ">" : modoPoisson === "greater_eq" ? "≥" : modoPoisson === "less_eq" ? "≤" : "<"} {xNum}) =</span>
                        <span style={{ fontSize: 28, fontWeight: 800, color: "#2563eb", margin: "8px 0" }}>{formatNumber(poisson.result)}</span>
                        <span style={{ fontSize: 12, color: "#6b7280" }}>({formatNumber(poisson.result * 100)}%)</span>
                    </div>
                </div>
            </div>
        );
    };

    // ── TAB EXPONENCIAL ────────────────────────────────────────────
    const TabExponencial = () => (
        <div>
            <p style={s.sectionLabel}>Distribución Exponencial (Servicio)</p>
            <div style={s.card}>
                <p style={s.cardTitle}>Fórmula</p>
                <div style={s.formulaBox}>
                    <code>P(T ≤ t) = 1 - e^(-μ·t)</code>
                </div>
                <div style={{ ...s.formulaBox, background: "#f0fdf4", borderColor: "#bbf7d0" }}>
                    <code>P(T ≤ {tNum}) = 1 - e^(-{formatNumber(μ)}·{tNum}) = {formatNumber(expResult)}</code>
                </div>
            </div>

            <div style={s.card}>
                <p style={s.cardTitle}>Resultado</p>
                <div style={s.resultBox}>
                    <span style={{ fontSize: 14, color: "#6b7280" }}>P(T ≤ {tNum}) =</span>
                    <span style={{ fontSize: 28, fontWeight: 800, color: "#2563eb", margin: "8px 0" }}>{formatNumber(expResult)}</span>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>({formatNumber(expResult * 100)}%)</span>
                </div>
            </div>

            <div style={s.card}>
                <p style={s.cardTitle}>Interpretación</p>
                <p style={s.guideText}>
                    La probabilidad de que un cliente sea atendido en a lo sumo {tNum} unidades de tiempo es <strong>{formatNumber(expResult * 100)}%</strong>.
                </p>
            </div>
        </div>
    );

    // ── TAB M/M/k ──────────────────────────────────────────────────
    const TabMMk = () => (
        <div>
            <p style={s.sectionLabel}>Sistema M/M/{k} — Métricas Erlang C</p>

            {/* P₀ */}
            <div style={s.card}>
                <p style={s.cardTitle}>P₀ — Probabilidad de sistema vacío (Erlang C)</p>
                <p style={s.guideText}>
                    Calculada mediante la fórmula Erlang C. Es la base para todas las demás métricas.
                </p>
                <div style={s.formulaBox}>
                    <code>P₀ = 1 / [Σ(ρⁿ/n!) para n=0..{k-1} + (ρᵏ/(k!·(1-ρ/k)))]</code>
                </div>
                <div style={s.resultBox}>
                    <span style={{ fontSize: 14, color: "#6b7280" }}>P₀ =</span>
                    <span style={{ fontSize: 28, fontWeight: 800, color: "#2563eb", margin: "8px 0" }}>{formatNumber(mmkResults.P0)}</span>
                </div>
                <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 13, color: "#374151" }}><strong>Conclusión:</strong> P₀ = {formatNumber(mmkResults.P0)} indica la probabilidad de que no haya nadie en el sistema.</div>
                    <div style={{ fontSize: 13, color: "#1d4ed8", marginTop: 6 }}><strong>Recomendación:</strong> Si P₀ es bajo, el sistema está casi siempre ocupado; considera aumentar servidores o capacidad.</div>
                </div>
            </div>

            {/* Pw */}
            <div style={s.card}>
                <p style={s.cardTitle}>Pw — Probabilidad de esperar (Erlang C)</p>
                <p style={s.guideText}>
                    Probabilidad de que un cliente deba esperar en la cola.
                </p>
                <div style={s.formulaBox}>
                    <code>Pw = [(ρᵏ/k!)/(1-ρ/k)] × P₀</code>
                </div>
                <div style={s.resultBox}>
                    <span style={{ fontSize: 14, color: "#6b7280" }}>Pw = {formatNumber(mmkResults.Pw * 100)}%</span>
                    <span style={{ fontSize: 28, fontWeight: 800, color: "#2563eb", margin: "8px 0" }}>{formatNumber(mmkResults.Pw)}</span>
                </div>
                <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 13, color: "#374151" }}><strong>Conclusión:</strong> Pw = {formatNumber(mmkResults.Pw * 100)}% de clientes esperarán al llegar.</div>
                    <div style={{ fontSize: 13, color: "#1d4ed8", marginTop: 6 }}><strong>Recomendación:</strong> Si Pw supera el umbral aceptable (ej. 10–20%), valora añadir servidores o mejorar el servicio.</div>
                </div>
            </div>

            {/* Lq y L */}
            <div style={s.card}>
                <p style={s.cardTitle}>Lq — Clientes promedio en cola</p>
                <div style={s.formulaBox}>
                    <code>Lq = (ρᵏ⁺¹/(k!·(1-ρ/k)²)) × P₀</code>
                </div>
                <div style={s.resultBox}>
                    <span style={{ fontSize: 14, color: "#6b7280" }}>Lq =</span>
                    <span style={{ fontSize: 28, fontWeight: 800, color: "#7c3aed", margin: "8px 0" }}>{formatNumber(mmkResults.Lq)}</span>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>clientes</span>
                </div>
                <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 13, color: "#374151" }}><strong>Conclusión:</strong> En promedio hay {formatNumber(mmkResults.Lq)} clientes esperando en la cola.</div>
                    <div style={{ fontSize: 13, color: "#1d4ed8", marginTop: 6 }}><strong>Recomendación:</strong> Si Lq es mayor que el umbral de tolerancia del negocio, reducir la carga o aumentar servidores.</div>
                </div>
            </div>

            <div style={s.card}>
                <p style={s.cardTitle}>L — Clientes promedio en sistema</p>
                <div style={s.formulaBox}>
                    <code>L = Lq + ρ</code>
                </div>
                <div style={s.resultBox}>
                    <span style={{ fontSize: 14, color: "#6b7280" }}>L = {formatNumber(mmkResults.Lq)} + {formatNumber(ρ)} =</span>
                    <span style={{ fontSize: 28, fontWeight: 800, color: "#0891b2", margin: "8px 0" }}>{formatNumber(mmkResults.L)}</span>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>clientes</span>
                </div>
                <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 13, color: "#374151" }}><strong>Conclusión:</strong> El sistema mantiene en promedio {formatNumber(mmkResults.L)} clientes en total.</div>
                    <div style={{ fontSize: 13, color: "#1d4ed8", marginTop: 6 }}><strong>Recomendación:</strong> Revisar el dimensionamiento si L crece en picos y afecta el servicio.</div>
                </div>
            </div>

            {/* Wq y W */}
            <div style={s.card}>
                <p style={s.cardTitle}>Wq — Tiempo promedio en cola</p>
                <div style={s.formulaBox}>
                    <code>Wq = Lq / λ</code>
                </div>
                <div style={s.resultBox}>
                    <span style={{ fontSize: 14, color: "#6b7280" }}>Wq = {formatNumber(mmkResults.Lq)} / {formatNumber(λ)} =</span>
                    <span style={{ fontSize: 28, fontWeight: 800, color: "#ea580c", margin: "8px 0" }}>{formatNumber(mmkResults.Wq)}</span>
                </div>
                <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 13, color: "#374151" }}><strong>Conclusión:</strong> El tiempo promedio en cola es {formatNumber(mmkResults.Wq)} unidades de tiempo.</div>
                    <div style={{ fontSize: 13, color: "#1d4ed8", marginTop: 6 }}><strong>Recomendación:</strong> Si Wq impacta la experiencia, priorizar medidas para reducir la cola (más servidores o servicio más rápido).</div>
                </div>
            </div>

            <div style={s.card}>
                <p style={s.cardTitle}>W — Tiempo promedio en sistema</p>
                <div style={s.formulaBox}>
                    <code>W = Wq + 1/μ</code>
                </div>
                <div style={s.resultBox}>
                    <span style={{ fontSize: 14, color: "#6b7280" }}>W = {formatNumber(mmkResults.Wq)} + {formatNumber(1 / μ)} =</span>
                    <span style={{ fontSize: 28, fontWeight: 800, color: "#be185d", margin: "8px 0" }}>{formatNumber(mmkResults.W)}</span>
                </div>
                <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 13, color: "#374151" }}><strong>Conclusión:</strong> El tiempo total por cliente en el sistema es {formatNumber(mmkResults.W)} unidades de tiempo.</div>
                    <div style={{ fontSize: 13, color: "#1d4ed8", marginTop: 6 }}><strong>Recomendación:</strong> Mejorar servicio o capacidad si W excede los límites de SLA definidos.</div>
                </div>
            </div>

            {/* Pn distribution */}
            {pnValor > 0 && (
                <div style={s.card}>
                    <p style={s.cardTitle}>Distribución Pn (Condicional)</p>
                    <p style={s.guideText}>
                        Para M/M/k, Pn tiene dos fórmulas dependiendo si n ≤ k o n &gt; k.
                    </p>
                    <div style={s.formulaBox}>
                        <code>Si n ≤ k: Pn = (ρⁿ/n!) × P₀</code>
                        <br />
                        <code>Si n &gt; k: Pn = (ρⁿ/(k!·kⁿ⁻ᵏ)) × P₀</code>
                    </div>

                    <p style={{ ...s.cardTitle, marginTop: 12 }}>Términos: {pnCondMMk.label}</p>
                    <div style={s.termGrid}>
                        {pnCondMMk.termVals.map(({ i, v }) => (
                            <div key={i} style={s.termCard}>
                                <div style={s.termLabel}>P(n = {i})</div>
                                <div style={s.termValue}>{formatNumber(v)}</div>
                                {i < k && <div style={{ fontSize: 10, color: "#6b7280" }}>n ≤ k</div>}
                                {i >= k && <div style={{ fontSize: 10, color: "#6b7280" }}>n &gt; k</div>}
                            </div>
                        ))}
                    </div>

                    <div style={s.resultBox}>
                        <span style={{ fontSize: 14, color: "#6b7280" }}>{pnCondMMk.label} =</span>
                        <span style={{ fontSize: 28, fontWeight: 800, color: "#2563eb", margin: "8px 0" }}>{formatNumber(pnCondMMk.result)}</span>
                        <span style={{ fontSize: 12, color: "#6b7280" }}>({formatNumber(pnCondMMk.result * 100)}%)</span>
                    </div>
                </div>
            )}
        </div>
    );

    // ── TAB CONCLUSIONES ───────────────────────────────────────────
    const TabConclusiones = () => {
        if (!mmkResults) {
            return (
                <div style={s.card}>
                    <p style={s.cardTitle}>No se puede mostrar la conclusión</p>
                    <p style={s.guideText}>
                        Los datos actuales no generan un sistema estable para M/M/k. Revisa λ, μ y k.
                    </p>
                </div>
            );
        }

        const lqReduction = ((Lq_mm1 - mmkResults.Lq) / Lq_mm1) * 100;
        const wqReduction = ((Wq_mm1 - mmkResults.Wq) / Wq_mm1) * 100;
        const pwReduction = ((Pw_mm1 - mmkResults.Pw) / Pw_mm1) * 100;

        // Sanity check: asegurar que los valores son válidos
        const safeReductions = {
            lq: isFinite(lqReduction) ? lqReduction : 0,
            wq: isFinite(wqReduction) ? wqReduction : 0,
            pw: isFinite(pwReduction) ? pwReduction : 0,
        };

        return (
            <div>
                <p style={s.sectionLabel}>Conclusiones y Recomendaciones</p>

                <div style={s.explainBox}>
                    <p style={s.explainTitle}>Interpretación rápida</p>
                    <p style={s.explainText}>
                        Si los servidores aumentan, lo normal es que bajen la fila de espera, el tiempo de espera y la probabilidad de que una persona tenga que hacer cola.
                    </p>
                    <p style={s.explainText}>
                        En este caso, el sistema con {k} servidores reduce Lq de {formatNumber(Lq_mm1)} a {formatNumber(mmkResults.Lq)}, Wq de {formatNumber(Wq_mm1)} a {formatNumber(mmkResults.Wq)} y Pw de {formatProbability(Pw_mm1)} a {formatProbability(mmkResults.Pw)}.
                    </p>
                </div>

                <div style={s.card}>
                    <p style={s.cardTitle}>Qué significa el cambio</p>
                    <div style={s.conclusionGrid}>
                        <div style={s.conclusionCard}>
                            <div style={s.conclusionIcon}></div>
                            <div style={s.conclusionTitle}>Clientes esperando</div>
                            <div style={s.conclusionValue}>{formatNumber(safeReductions.lq)}%</div>
                            <div style={s.conclusionText}>
                                La fila promedio baja de {formatNumber(Lq_mm1)} a {formatNumber(mmkResults.Lq)}.
                            </div>
                        </div>

                        <div style={s.conclusionCard}>
                            <div style={s.conclusionIcon}></div>
                            <div style={s.conclusionTitle}>Tiempo de espera</div>
                            <div style={s.conclusionValue}>{formatNumber(safeReductions.wq)}%</div>
                            <div style={s.conclusionText}>
                                Cada cliente espera menos tiempo: baja de {formatNumber(Wq_mm1)} a {formatNumber(mmkResults.Wq)}.
                            </div>
                        </div>

                        <div style={s.conclusionCard}>
                            <div style={s.conclusionIcon}></div>
                            <div style={s.conclusionTitle}>Probabilidad de fila</div>
                            <div style={s.conclusionValue}>{formatNumber(safeReductions.pw)}%</div>
                            <div style={s.conclusionText}>
                                La probabilidad de tener que esperar cambia de {formatProbability(Pw_mm1)} a {formatProbability(mmkResults.Pw)}.
                            </div>
                        </div>
                    </div>
                </div>

                <div style={s.card}>
                    <p style={s.cardTitle}>Recomendación práctica</p>
                    {safeReductions.lq > 50 ? (
                        <div style={{ ...s.recommendationBox, borderColor: "#bbf7d0", background: "#f0fdf4", color: "#15803d" }}>
                            <strong>Conviene hacerlo:</strong> agregar los {k - 1} servidores extra reduce muchísimo la espera y hace el sistema mucho más ágil.
                        </div>
                    ) : safeReductions.lq > 20 ? (
                        <div style={{ ...s.recommendationBox, borderColor: "#fcd34d", background: "#fffbeb", color: "#92400e" }}>
                            <strong>Puede convenir:</strong> hay mejora, pero conviene revisar si el ahorro de tiempo compensa el costo de mantener más servidores.
                        </div>
                    ) : (
                        <div style={{ ...s.recommendationBox, borderColor: "#fecaca", background: "#fef2f2", color: "#991b1b" }}>
                            <strong>No parece necesario:</strong> la mejora es pequeña, así que quizá no justifique el costo adicional.
                        </div>
                    )}

                    <div style={{ marginTop: 16, padding: "12px", background: "#f9fafb", borderRadius: 8, borderLeft: "4px solid #2563eb" }}>
                        <p style={{ margin: "0 0 8px 0", fontWeight: 600 }}>Resumen fácil de entender:</p>
                        <ul style={{ margin: "8px 0 0 0", paddingLeft: 20, fontSize: 12, color: "#374151", lineHeight: 1.6 }}>
                            <li>M/M/1: hay menos costo, pero la gente espera más tiempo.</li>
                            <li>M/M/{k}: hay más costo operativo, pero la atención es más rápida.</li>
                            <li>Si la fila y el tiempo bajan mucho, normalmente sí vale la pena agregar servidores.</li>
                        </ul>
                    </div>
                </div>

                <div style={s.card}>
                    <p style={s.cardTitle}>Qué cambia exactamente (en palabras sencillas)</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
                        
                        {/* Personas esperando */}
                        <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#7c3aed" }}></div>
                                <span style={{ fontWeight: 700, color: "#1e293b" }}>Personas esperando</span>
                            </div>
                            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 12px 0", lineHeight: 1.4 }}>
                                La cantidad promedio de personas que están atascadas en la fila.
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: "8px 12px", borderRadius: "6px", border: "1px solid #f1f5f9" }}>
                                    <span style={{ fontSize: 13, color: "#64748b" }}>Con 1 servidor</span>
                                    <span style={{ fontWeight: 600, color: "#475569" }}>{formatNumber(Lq_mm1)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f0fdf4", padding: "8px 12px", borderRadius: "6px", border: "1px solid #bbf7d0" }}>
                                    <span style={{ fontSize: 13, color: "#166534", fontWeight: 600 }}>Con {k} servidores</span>
                                    <span style={{ fontWeight: 800, color: "#16a34a", fontSize: 16 }}>{formatNumber(mmkResults.Lq)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Tiempo de espera */}
                        <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ea580c" }}></div>
                                <span style={{ fontWeight: 700, color: "#1e293b" }}>Tiempo de espera</span>
                            </div>
                            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 12px 0", lineHeight: 1.4 }}>
                                Lo que demora una persona desde que llega hasta que la atienden.
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: "8px 12px", borderRadius: "6px", border: "1px solid #f1f5f9" }}>
                                    <span style={{ fontSize: 13, color: "#64748b" }}>Con 1 servidor</span>
                                    <span style={{ fontWeight: 600, color: "#475569" }}>{formatNumber(Wq_mm1)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f0fdf4", padding: "8px 12px", borderRadius: "6px", border: "1px solid #bbf7d0" }}>
                                    <span style={{ fontSize: 13, color: "#166534", fontWeight: 600 }}>Con {k} servidores</span>
                                    <span style={{ fontWeight: 800, color: "#16a34a", fontSize: 16 }}>{formatNumber(mmkResults.Wq)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Probabilidad de hacer fila */}
                        <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb" }}></div>
                                <span style={{ fontWeight: 700, color: "#1e293b" }}>Probabilidad de fila</span>
                            </div>
                            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 12px 0", lineHeight: 1.4 }}>
                                La posibilidad de que alguien llegue y le toque esperar su turno.
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: "8px 12px", borderRadius: "6px", border: "1px solid #f1f5f9" }}>
                                    <span style={{ fontSize: 13, color: "#64748b" }}>Con 1 servidor</span>
                                    <span style={{ fontWeight: 600, color: "#475569" }}>{formatNumber(Pw_mm1 * 100)}%</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f0fdf4", padding: "8px 12px", borderRadius: "6px", border: "1px solid #bbf7d0" }}>
                                    <span style={{ fontSize: 13, color: "#166534", fontWeight: 600 }}>Con {k} servidores</span>
                                    <span style={{ fontWeight: 800, color: "#16a34a", fontSize: 16 }}>{formatNumber(mmkResults.Pw * 100)}%</span>
                                </div>
                            </div>
                        </div>
                        
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={s.container}>
            <h2 style={s.title}>Análisis M/M/{k} — Canales Múltiples</h2>

            {/* Tabs */}
            <div style={s.tabContainer}>
                {tabs.map((tab, idx) => (
                    <button
                        key={idx}
                        style={{ ...s.tabBtn, ...(activeTab === idx ? s.tabBtnActive : {}) }}
                        onClick={() => setActiveTab(idx)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div style={{ marginTop: 20 }}>
                {activeTabName === "Poisson" && <TabPoisson />}
                {activeTabName === "Exponencial" && <TabExponencial />}
                {activeTabName === "M/M/k" && (mmkResults ? <TabMMk /> : (
                    <div style={s.card}>
                        <p style={s.cardTitle}>No se pudo calcular el sistema</p>
                        <p style={s.guideText}>
                            Revisa que la llegada de clientes no sea mayor que la capacidad total de servicio.
                            Si la demanda supera al sistema, los resultados dejan de ser confiables.
                        </p>
                    </div>
                ))}
                {activeTabName === "Comparación" && (
                    mmkResults ? <ComparisonTable /> : (
                        <div style={s.card}>
                            <p style={s.cardTitle}>Comparación no disponible</p>
                            <p style={s.guideText}>
                                No hay resultados válidos para comparar. Asegúrate de ingresar tasas positivas y un sistema estable.
                            </p>
                        </div>
                    )
                )}
                {activeTabName === "Conclusiones" && <TabConclusiones />}
            </div>

            <button style={s.backBtn} onClick={onBack}>← Volver</button>
        </div>
    );
};

export default CanalesMultiplesAnalysis;

// ── STYLES ────────────────────────────────────────────────────────
const s = {
    container: { padding: "30px", background: "#f4f6fb", fontFamily: "Inter, sans-serif", minHeight: "100vh" },
    title: { fontSize: "24px", fontWeight: "800", marginBottom: "20px" },
    sectionLabel: { fontSize: "14px", fontWeight: "700", color: "#111827", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" },
    explainBox: { padding: "12px 14px", marginBottom: "14px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px" },
    explainTitle: { margin: "0 0 6px 0", fontSize: "13px", fontWeight: 700, color: "#1d4ed8" },
    explainText: { margin: "4px 0", color: "#1e3a8a", lineHeight: 1.5, fontSize: "13px" },
    card: { background: "#fff", borderRadius: "12px", padding: "16px 18px", marginBottom: "14px", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
    cardTitle: { fontSize: "14px", fontWeight: "700", color: "#111827", margin: "0 0 10px 0" },
    guideText: { margin: "5px 0", color: "#24445d", lineHeight: "1.45", fontSize: "13px" },
    formulaBox: { display: "block", fontFamily: "monospace", fontSize: "12px", background: "#f1f5f9", padding: "10px 12px", borderRadius: 6, marginBottom: 6, color: "#374151", border: "1px solid #cbd5e1" },
    resultBox: { display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 16px", background: "#f7fbff", border: "1px solid #bfdbfe", borderRadius: 8, marginTop: 8 },
    resultCard: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 14px", boxShadow: "0 2px 8px rgba(15,23,42,0.06)" },
    tabContainer: { display: "flex", gap: 8, borderBottom: "1px solid #e5e7eb", overflowX: "auto", paddingBottom: 8, background: "#fff", padding: "12px 0", borderRadius: 8, marginBottom: 16 },
    tabBtn: { padding: "10px 16px", borderRadius: "8px", border: "1.5px solid transparent", background: "#f9fafb", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#6b7280", whiteSpace: "nowrap" },
    tabBtnActive: { border: "1.5px solid #2563eb", background: "#eff6ff", color: "#2563eb" },
    backBtn: { marginTop: 20, padding: "10px 16px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontWeight: 600, color: "#374151" },
    table: { width: "100%", borderCollapse: "collapse" },
    tableHeaderRow: { background: "#f3f4f6" },
    tableHeader: { padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: 700, color: "#374151", borderBottom: "2px solid #e5e7eb" },
    tableRow: { borderBottom: "1px solid #e5e7eb", cursor: "pointer", transition: "0.2s" },
    tableCell: { padding: "12px", fontSize: "13px", color: "#6b7280" },
    metricCard: { display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 16px", background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb", gap: 6, flex: 1, minWidth: 150 },
    metricIcon: { fontSize: 24 },
    metricName: { fontSize: 12, fontWeight: 600, color: "#374151" },
    metricComparison: { fontSize: 13, display: "flex", gap: 6, alignItems: "center" },
    metricReduction: { fontSize: 14 },
    termGrid: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 },
    termCard: { display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 12px", background: "#f9fafb", borderRadius: 6, border: "1px solid #e5e7eb", gap: 4, minWidth: 80 },
    termLabel: { fontSize: 11, fontWeight: 600, color: "#374151" },
    termValue: { fontSize: 13, fontWeight: 700, color: "#2563eb" },
    conclusionGrid: { display: "flex", gap: 12, flexWrap: "wrap" },
    conclusionCard: { display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 16px", background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0", gap: 6, flex: 1, minWidth: 150 },
    conclusionIcon: { fontSize: 28 },
    conclusionTitle: { fontSize: 13, fontWeight: 700, color: "#065f46" },
    conclusionValue: { fontSize: 20, fontWeight: 800, color: "#10b981" },
    conclusionText: { fontSize: 11, color: "#065f46", textAlign: "center", lineHeight: 1.4 },
    recommendationBox: { padding: "12px 14px", borderRadius: 8, border: "1px solid #fcd34d", borderLeft: "4px solid #fcd34d" },
    summaryTable: { width: "100%", borderCollapse: "collapse" },
    summaryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, alignItems: "stretch" },
    summaryMetricCard: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14, boxShadow: "0 2px 10px rgba(15,23,42,0.05)", minHeight: 210 },
    tooltip: { marginTop: 12, background: "#fff", border: "2px solid", borderRadius: "12px", padding: "16px 18px", boxShadow: "0 8px 24px rgba(0,0,0,0.10)" },
    tooltipBadge: { fontWeight: 800, fontSize: 16, padding: "3px 12px", borderRadius: "20px" },
    tooltipTitle: { fontSize: 14, fontWeight: 700, color: "#111827" },
    tooltipText: { fontSize: 13, color: "#374151", margin: "6px 0", lineHeight: 1.5 },
    tooltipFormula: { fontFamily: "monospace", background: "#f8fafc", borderRadius: 8, padding: "8px 12px", fontSize: 12 },
};

import React, { useEffect, useState } from "react";

// ── UNIT CONVERSION ────────────────────────────────────────────────
const UNIT_FACTORS = {
    seg: 1,
    min: 60,
    hora: 3600,
    día: 86400,
};

const convertRate = (cantidad, tiempo, fromUnit, toUnit) => {
    if (!cantidad || !tiempo || parseFloat(tiempo) === 0) return null;
    const ratePerSec = parseFloat(cantidad) / (parseFloat(tiempo) * UNIT_FACTORS[fromUnit]);
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

    const safeData = data || {};
    const { llegadas = {}, servicio = {}, calcular = {}, x = "", modoPoisson = "exact", t = "", numServidores = 2, unidadBase, pnCondicion = {} } = safeData;

    // Tabs dinámicos
    const tabs = [];
    if (calcular.poisson) tabs.push("Poisson");
    if (calcular.exponencial) tabs.push("Exponencial");
    if (calcular.mmk) tabs.push("M/M/k");
    tabs.push("Comparación");
    tabs.push("Conclusiones");

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
    const xNum = parseInt(x) || 0;
    const tNum = parseFloat(t) || 0;

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
    const pnValor = parseInt(pnCondicion.valor) || 0;

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
            <p style={s.sectionLabel}>Análisis Comparativo: M/M/1 vs M/M/k</p>
            <div style={s.card}>
                <table style={s.table}>
                    <thead>
                        <tr style={s.tableHeaderRow}>
                            <th style={s.tableHeader}>Métrica</th>
                            <th style={s.tableHeader}>M/M/1 (1 servidor)</th>
                            <th style={s.tableHeader}>M/M/{k} ({k} servidores)</th>
                            <th style={s.tableHeader}>Mejora</th>
                            <th style={s.tableHeader}>% Mejora</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            { name: "P₀", mm1: P0_mm1, mmk: mmkResults.P0, unit: "" },
                            { name: "Pw", mm1: Pw_mm1, mmk: mmkResults.Pw, unit: "" },
                            { name: "Lq", mm1: Lq_mm1, mmk: mmkResults.Lq, unit: "clientes" },
                            { name: "L", mm1: L_mm1, mmk: mmkResults.L, unit: "clientes" },
                            { name: "Wq", mm1: Wq_mm1, mmk: mmkResults.Wq, unit: "u.t." },
                            { name: "W", mm1: W_mm1, mmk: mmkResults.W, unit: "u.t." },
                        ].map(({ name, mm1, mmk, unit }, idx) => {
                            const improvement = mm1 - mmk;
                            const percentImprovement = calcImprovement(mm1, mmk);
                            const isBetter = mmk < mm1; // Para cola/tiempo: menor es mejor

                            return (
                                <tr
                                    key={name}
                                    style={{
                                        ...s.tableRow,
                                        ...(hoveredRow === idx ? { background: "#f0fdf4" } : {}),
                                    }}
                                    onMouseEnter={() => setHoveredRow(idx)}
                                    onMouseLeave={() => setHoveredRow(null)}
                                >
                                    <td style={{ ...s.tableCell, fontWeight: 700 }}>{name}</td>
                                    <td style={{ ...s.tableCell, color: "#374151" }}>{mm1.toFixed(4)}</td>
                                    <td style={{ ...s.tableCell, color: isBetter ? "#16a34a" : "#dc2626", fontWeight: 600 }}>{mmk.toFixed(4)}</td>
                                    <td style={{ ...s.tableCell, color: isBetter ? "#16a34a" : "#dc2626" }}>
                                        {isBetter ? "↓" : "↑"} {Math.abs(improvement).toFixed(4)}
                                    </td>
                                    <td style={{ ...s.tableCell, color: isBetter ? "#16a34a" : "#dc2626", fontWeight: 700 }}>
                                        {isBetter ? "+" : ""}{percentImprovement.toFixed(1)}%
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Resumen de mejoras */}
            <div style={s.card}>
                <p style={s.cardTitle}>Resumen de Mejoras</p>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    {[
                        {
                            label: "Clientes en cola",
                            mm1: Lq_mm1.toFixed(4),
                            mmk: mmkResults.Lq.toFixed(4),
                            reduction: ((Lq_mm1 - mmkResults.Lq) / Lq_mm1 * 100).toFixed(1),
                            icon: ""
                        },
                        {
                            label: "Tiempo en cola",
                            mm1: Wq_mm1.toFixed(4),
                            mmk: mmkResults.Wq.toFixed(4),
                            reduction: ((Wq_mm1 - mmkResults.Wq) / Wq_mm1 * 100).toFixed(1),
                            icon: ""
                        },
                        {
                            label: "Probabilidad de espera",
                            mm1: (Pw_mm1 * 100).toFixed(1),
                            mmk: (mmkResults.Pw * 100).toFixed(1),
                            reduction: ((Pw_mm1 - mmkResults.Pw) / Pw_mm1 * 100).toFixed(1),
                            icon: ""
                        },
                    ].map((metric, idx) => (
                        <div key={idx} style={s.metricCard}>
                            <div style={s.metricIcon}>{metric.icon}</div>
                            <div style={s.metricName}>{metric.label}</div>
                            <div style={s.metricComparison}>
                                <span style={{ color: "#dc2626" }}>{metric.mm1}</span>
                                <span style={{ color: "#6b7280", fontSize: 12 }}>→</span>
                                <span style={{ color: "#16a34a", fontWeight: 700 }}>{metric.mmk}</span>
                            </div>
                            <div style={{ ...s.metricReduction, color: "#16a34a", fontWeight: 700 }}>
                                -{metric.reduction}%
                            </div>
                        </div>
                    ))}
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
                        <code>P(x) = ({λ.toFixed(4)}ˣ · e^(-{λ.toFixed(4)})) / x!</code>
                    </div>
                </div>

                <div style={s.card}>
                    <p style={s.cardTitle}>Términos calculados</p>
                    <div style={s.termGrid}>
                        {poisson.termVals.map(({ i, v }) => (
                            <div key={i} style={s.termCard}>
                                <div style={s.termLabel}>P(x = {i})</div>
                                <div style={s.termValue}>{v.toFixed(6)}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={s.card}>
                    <p style={s.cardTitle}>Resultado</p>
                    <div style={s.resultBox}>
                        <span style={{ fontSize: 14, color: "#6b7280" }}>P(x {modoPoisson === "exact" ? "=" : modoPoisson === "greater" ? ">" : modoPoisson === "greater_eq" ? "≥" : modoPoisson === "less_eq" ? "≤" : "<"} {xNum}) =</span>
                        <span style={{ fontSize: 28, fontWeight: 800, color: "#2563eb", margin: "8px 0" }}>{poisson.result.toFixed(6)}</span>
                        <span style={{ fontSize: 12, color: "#6b7280" }}>({(poisson.result * 100).toFixed(3)}%)</span>
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
                    <code>P(T ≤ {tNum}) = 1 - e^(-{μ.toFixed(4)}·{tNum}) = {expResult.toFixed(6)}</code>
                </div>
            </div>

            <div style={s.card}>
                <p style={s.cardTitle}>Interpretación</p>
                <p style={s.guideText}>
                    La probabilidad de que un cliente sea atendido en a lo sumo {tNum} unidades de tiempo es <strong>{(expResult * 100).toFixed(2)}%</strong>.
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
                    <span style={{ fontSize: 28, fontWeight: 800, color: "#2563eb", margin: "8px 0" }}>{mmkResults.P0.toFixed(6)}</span>
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
                    <span style={{ fontSize: 14, color: "#6b7280" }}>Pw = {(mmkResults.Pw * 100).toFixed(2)}%</span>
                    <span style={{ fontSize: 28, fontWeight: 800, color: "#2563eb", margin: "8px 0" }}>{mmkResults.Pw.toFixed(6)}</span>
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
                    <span style={{ fontSize: 28, fontWeight: 800, color: "#7c3aed", margin: "8px 0" }}>{mmkResults.Lq.toFixed(4)}</span>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>clientes</span>
                </div>
            </div>

            <div style={s.card}>
                <p style={s.cardTitle}>L — Clientes promedio en sistema</p>
                <div style={s.formulaBox}>
                    <code>L = Lq + ρ</code>
                </div>
                <div style={s.resultBox}>
                    <span style={{ fontSize: 14, color: "#6b7280" }}>L = {mmkResults.Lq.toFixed(4)} + {ρ.toFixed(4)} =</span>
                    <span style={{ fontSize: 28, fontWeight: 800, color: "#0891b2", margin: "8px 0" }}>{mmkResults.L.toFixed(4)}</span>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>clientes</span>
                </div>
            </div>

            {/* Wq y W */}
            <div style={s.card}>
                <p style={s.cardTitle}>Wq — Tiempo promedio en cola</p>
                <div style={s.formulaBox}>
                    <code>Wq = Lq / λ</code>
                </div>
                <div style={s.resultBox}>
                    <span style={{ fontSize: 14, color: "#6b7280" }}>Wq = {mmkResults.Lq.toFixed(4)} / {λ.toFixed(4)} =</span>
                    <span style={{ fontSize: 28, fontWeight: 800, color: "#ea580c", margin: "8px 0" }}>{mmkResults.Wq.toFixed(4)}</span>
                </div>
            </div>

            <div style={s.card}>
                <p style={s.cardTitle}>W — Tiempo promedio en sistema</p>
                <div style={s.formulaBox}>
                    <code>W = Wq + 1/μ</code>
                </div>
                <div style={s.resultBox}>
                    <span style={{ fontSize: 14, color: "#6b7280" }}>W = {mmkResults.Wq.toFixed(4)} + {(1 / μ).toFixed(4)} =</span>
                    <span style={{ fontSize: 28, fontWeight: 800, color: "#be185d", margin: "8px 0" }}>{mmkResults.W.toFixed(4)}</span>
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
                                <div style={s.termValue}>{v.toFixed(6)}</div>
                                {i < k && <div style={{ fontSize: 10, color: "#6b7280" }}>n ≤ k</div>}
                                {i >= k && <div style={{ fontSize: 10, color: "#6b7280" }}>n &gt; k</div>}
                            </div>
                        ))}
                    </div>

                    <div style={s.resultBox}>
                        <span style={{ fontSize: 14, color: "#6b7280" }}>{pnCondMMk.label} =</span>
                        <span style={{ fontSize: 28, fontWeight: 800, color: "#2563eb", margin: "8px 0" }}>{pnCondMMk.result.toFixed(6)}</span>
                        <span style={{ fontSize: 12, color: "#6b7280" }}>({(pnCondMMk.result * 100).toFixed(3)}%)</span>
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

        return (
            <div>
                <p style={s.sectionLabel}>Conclusiones y Recomendaciones</p>

                <div style={s.card}>
                    <p style={s.cardTitle}>📊 Análisis del Impacto</p>
                    <div style={s.conclusionGrid}>
                        <div style={s.conclusionCard}>
                            <div style={s.conclusionIcon}>📉</div>
                            <div style={s.conclusionTitle}>Reducción de Cola</div>
                            <div style={s.conclusionValue}>{lqReduction.toFixed(1)}%</div>
                            <div style={s.conclusionText}>
                                Agregar {k - 1} servidor{k - 1 !== 1 ? "es" : ""} reduce la cola promedio en {lqReduction.toFixed(1)}%.
                            </div>
                        </div>

                        <div style={s.conclusionCard}>
                            <div style={s.conclusionIcon}>⏱️</div>
                            <div style={s.conclusionTitle}>Reducción de Tiempo</div>
                            <div style={s.conclusionValue}>{wqReduction.toFixed(1)}%</div>
                            <div style={s.conclusionText}>
                                El tiempo de espera se reduce en {wqReduction.toFixed(1)}%, mejorando significativamente la experiencia.
                            </div>
                        </div>

                        <div style={s.conclusionCard}>
                            <div style={s.conclusionIcon}>🎯</div>
                            <div style={s.conclusionTitle}>Menores Esperas</div>
                            <div style={s.conclusionValue}>{pwReduction.toFixed(1)}%</div>
                            <div style={s.conclusionText}>
                                Probabilidad de espera cae {pwReduction.toFixed(1)}%, más clientes son atendidos inmediatamente.
                            </div>
                        </div>
                    </div>
                </div>

                <div style={s.card}>
                    <p style={s.cardTitle}>💡 Recomendaciones</p>
                    {lqReduction > 50 ? (
                        <div style={{ ...s.recommendationBox, borderColor: "#bbf7d0", background: "#f0fdf4", color: "#15803d" }}>
                            <strong>✓ Altamente recomendable:</strong> La mejora es muy significativa ({lqReduction.toFixed(1)}%). Implementar {k} servidores maximiza eficiencia y satisfacción del cliente.
                        </div>
                    ) : lqReduction > 20 ? (
                        <div style={{ ...s.recommendationBox, borderColor: "#fcd34d", background: "#fffbeb", color: "#92400e" }}>
                            <strong>⚠ Moderadamente beneficioso:</strong> Mejora del {lqReduction.toFixed(1)}%. Considerar si el costo es justificable.
                        </div>
                    ) : (
                        <div style={{ ...s.recommendationBox, borderColor: "#fecaca", background: "#fef2f2", color: "#991b1b" }}>
                            <strong>✗ Marginal:</strong> Mejora baja ({lqReduction.toFixed(1)}%). Implementación probablemente no justificada.
                        </div>
                    )}

                    <div style={{ marginTop: 16, padding: "12px", background: "#f9fafb", borderRadius: 8, borderLeft: "4px solid #2563eb" }}>
                        <p style={{ margin: "0 0 8px 0", fontWeight: 600 }}>📌 Análisis de costos-beneficios:</p>
                        <ul style={{ margin: "8px 0 0 0", paddingLeft: 20, fontSize: 12, color: "#374151", lineHeight: 1.6 }}>
                            <li>M/M/1: 1 servidor, menor costo operativo pero mayor insatisfacción (Pw = {(Pw_mm1 * 100).toFixed(1)}%)</li>
                            <li>M/M/{k}: {k} servidores, mayor costo pero Pw = {(mmkResults.Pw * 100).toFixed(1)}% (mejora del {pwReduction.toFixed(1)}%)</li>
                            <li>Umbral típico: Si Pw &gt; 70%, normalmente se recomienda aumentar servidores</li>
                        </ul>
                    </div>
                </div>

                <div style={s.card}>
                    <p style={s.cardTitle}>🎯 Métricas Clave Comparadas</p>
                    <table style={s.summaryTable}>
                        <tbody>
                            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                                <td style={{ padding: "10px", fontWeight: 600 }}>Sistema</td>
                                <td style={{ padding: "10px", color: "#2563eb" }}>M/M/1</td>
                                <td style={{ padding: "10px", color: "#16a34a" }}>M/M/{k}</td>
                            </tr>
                            <tr style={{ borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
                                <td style={{ padding: "10px" }}>Clientes en cola (Lq)</td>
                                <td style={{ padding: "10px" }}>{Lq_mm1.toFixed(4)}</td>
                                <td style={{ padding: "10px", fontWeight: 600 }}>{mmkResults.Lq.toFixed(4)}</td>
                            </tr>
                            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                                <td style={{ padding: "10px" }}>Tiempo en cola (Wq)</td>
                                <td style={{ padding: "10px" }}>{Wq_mm1.toFixed(4)} u.t.</td>
                                <td style={{ padding: "10px", fontWeight: 600 }}>{mmkResults.Wq.toFixed(4)} u.t.</td>
                            </tr>
                            <tr style={{ background: "#f9fafb" }}>
                                <td style={{ padding: "10px" }}>Probabilidad de espera (Pw)</td>
                                <td style={{ padding: "10px" }}>{(Pw_mm1 * 100).toFixed(1)}%</td>
                                <td style={{ padding: "10px", fontWeight: 600 }}>{(mmkResults.Pw * 100).toFixed(1)}%</td>
                            </tr>
                        </tbody>
                    </table>
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
                {activeTabName === "Poisson" && calcular.poisson && <TabPoisson />}
                {activeTabName === "Exponencial" && calcular.exponencial && <TabExponencial />}
                {activeTabName === "M/M/k" && calcular.mmk && (mmkResults ? <TabMMk /> : (
                    <div style={s.card}>
                        <p style={s.cardTitle}>No se pudo calcular M/M/k</p>
                        <p style={s.guideText}>
                            Revisa que λ/kμ sea menor que 1 y que los datos estén completos.
                        </p>
                    </div>
                ))}
                {activeTabName === "Comparación" && (
                    mmkResults ? <ComparisonTable /> : (
                        <div style={s.card}>
                            <p style={s.cardTitle}>Comparación no disponible</p>
                            <p style={s.guideText}>
                                No hay resultados válidos de M/M/k para comparar.
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
    card: { background: "#fff", borderRadius: "12px", padding: "16px 18px", marginBottom: "14px", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
    cardTitle: { fontSize: "14px", fontWeight: "700", color: "#111827", margin: "0 0 10px 0" },
    guideText: { margin: "5px 0", color: "#24445d", lineHeight: "1.45", fontSize: "13px" },
    formulaBox: { display: "block", fontFamily: "monospace", fontSize: "12px", background: "#f1f5f9", padding: "10px 12px", borderRadius: 6, marginBottom: 6, color: "#374151", border: "1px solid #cbd5e1" },
    resultBox: { display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 16px", background: "#f7fbff", border: "1px solid #bfdbfe", borderRadius: 8, marginTop: 8 },
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
    conclusionTitle: { fontSize: 13, fontWeight: 700, color: "#15803d" },
    conclusionValue: { fontSize: 20, fontWeight: 800, color: "#16a34a" },
    conclusionText: { fontSize: 11, color: "#166534", textAlign: "center", lineHeight: 1.4 },
    recommendationBox: { padding: "12px 14px", borderRadius: 8, border: "1px solid #fcd34d", borderLeft: "4px solid #fcd34d" },
    summaryTable: { width: "100%", borderCollapse: "collapse" },
};

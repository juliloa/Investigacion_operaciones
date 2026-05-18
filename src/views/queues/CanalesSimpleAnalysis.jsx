import React, { useState } from "react";
import { toFiniteNumber } from "../../utils/validation";

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

const MM1_STEPS = [
    {
        key: "P0", label: "P₀", name: "Probabilidad de sistema vacío",
        formula: (λ, μ) => `P₀ = 1 - λ/μ = 1 - ${λ.toFixed(4)}/${μ.toFixed(4)}`,
        calc: (λ, μ) => 1 - λ / μ,
        unit: "", color: "#2563eb",
        desc: "Probabilidad de que no haya ningún cliente en el sistema en un momento dado.",
        when: "Útil para saber qué tan disponible está el servidor.",
        conclusion: (v) => v > 0.5
            ? `El sistema está vacío el ${(v * 100).toFixed(1)}% del tiempo — buen nivel de disponibilidad.`
            : `El sistema está vacío solo el ${(v * 100).toFixed(1)}% del tiempo — servidor muy ocupado.`,
    },
    {
        key: "Lq", label: "Lq", name: "Clientes promedio en cola",
        formula: (λ, μ) => `Lq = λ² / μ(μ-λ) = ${λ.toFixed(4)}² / ${μ.toFixed(4)}(${μ.toFixed(4)}-${λ.toFixed(4)})`,
        calc: (λ, μ) => (λ * λ) / (μ * (μ - λ)),
        unit: "clientes", color: "#7c3aed",
        desc: "Número promedio de clientes esperando en la cola (sin contar al que está siendo atendido).",
        when: "Indica qué tan larga está la fila de espera.",
        conclusion: (v) => `En promedio hay ${v.toFixed(4)} clientes esperando en la cola.`,
    },
    {
        key: "L", label: "L", name: "Clientes promedio en sistema",
        formula: (λ, μ) => {
            const Lq = (λ * λ) / (μ * (μ - λ));
            return `L = Lq + λ/μ = ${Lq.toFixed(4)} + ${(λ / μ).toFixed(4)}`;
        },
        calc: (λ, μ) => (λ * λ) / (μ * (μ - λ)) + λ / μ,
        unit: "clientes", color: "#0891b2",
        desc: "Número promedio de clientes en todo el sistema (en cola + siendo atendidos).",
        when: "Indica el tamaño total del sistema en operación normal.",
        conclusion: (v) => `El sistema tiene en promedio ${v.toFixed(4)} clientes en total.`,
    },
    {
        key: "Wq", label: "Wq", name: "Tiempo promedio en cola",
        formula: (λ, μ) => {
            const Lq = (λ * λ) / (μ * (μ - λ));
            return `Wq = Lq/λ = ${Lq.toFixed(4)}/${λ.toFixed(4)}`;
        },
        calc: (λ, μ) => (λ * λ) / (μ * (μ - λ)) / λ,
        unit: "unidad de tiempo", color: "#ea580c",
        desc: "Tiempo promedio que un cliente espera en la cola antes de ser atendido.",
        when: "Clave para evaluar la experiencia del cliente — tiempo de espera puro.",
        conclusion: (v) => `Cada cliente espera en promedio ${v.toFixed(4)} unidades de tiempo en cola.`,
    },
    {
        key: "W", label: "W", name: "Tiempo promedio en sistema",
        formula: (λ, μ) => {
            const Lq = (λ * λ) / (μ * (μ - λ));
            const Wq = Lq / λ;
            return `W = Wq + 1/μ = ${Wq.toFixed(4)} + ${(1 / μ).toFixed(4)}`;
        },
        calc: (λ, μ) => (λ * λ) / (μ * (μ - λ)) / λ + 1 / μ,
        unit: "unidad de tiempo", color: "#be185d",
        desc: "Tiempo total promedio que un cliente pasa en el sistema (espera + servicio).",
        when: "Tiempo de espera + tiempo de atención. Lo que siente el cliente de principio a fin.",
        conclusion: (v) => `El tiempo total por cliente en el sistema es ${v.toFixed(4)} unidades de tiempo.`,
    },
    {
        key: "Pw", label: "Pw", name: "Probabilidad de esperar",
        formula: (λ, μ) => `Pw = λ/μ = ${λ.toFixed(4)}/${μ.toFixed(4)}`,
        calc: (λ, μ) => λ / μ,
        unit: "", color: "#16a34a",
        desc: "Probabilidad de que un cliente que llega encuentre el servidor ocupado y tenga que esperar.",
        when: "Igual a ρ. Si es alto, la mayoría de clientes esperan.",
        conclusion: (v) => `El ${(v * 100).toFixed(1)}% de los clientes tendrán que esperar al llegar.`,
    },
];

const CanalesSimpleAnalysis = ({ data, onBack }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [hoveredRow, setHoveredRow] = useState(null);

    if (!data) return (
        <div style={s.container}>
            <p style={{ color: "#6b7280" }}>Sin datos. Regresa e ingresa los valores.</p>
            <button style={s.backBtn} onClick={onBack}>← Volver</button>
        </div>
    );

    const { llegadas, servicio, calcular, x, modoPoisson, t } = data;
    const pnCondicion = data.pnCondicion || {};

    // ── Calcular λ y μ ────────────────────────────────────────────
    const llegadasCantidad = toFiniteNumber(llegadas.cantidad, NaN);
    const llegadasTiempo = toFiniteNumber(llegadas.tiempo, NaN);
    const servicioCantidad = toFiniteNumber(servicio.cantidad, NaN);
    const servicioTiempo = toFiniteNumber(servicio.tiempo, NaN);
    const λ = llegadasCantidad / llegadasTiempo;
    const μ = servicioCantidad / servicioTiempo;
    
    // Validar que λ y μ sean números válidos
    if (!isFinite(λ) || !isFinite(μ) || λ <= 0 || μ <= 0) {
        return (
            <div style={s.container}>
                <p style={{ color: "#991b1b" }}>⚠ Error: Datos incompletos. λ o μ no son válidos.</p>
                <button style={s.backBtn} onClick={onBack}>← Volver</button>
            </div>
        );
    }

    if (λ >= μ) {
        return (
            <div style={s.container}>
                <p style={{ color: "#991b1b" }}>⚠ Error: el sistema M/M/1 es inestable cuando λ ≥ μ.</p>
                <p style={{ color: "#6b7280" }}>Ajusta los datos para que la tasa de servicio sea mayor que la tasa de llegadas.</p>
                <button style={s.backBtn} onClick={onBack}>← Volver</button>
            </div>
        );
    }
    
    const ρ = λ / μ;
    const xValue = toFiniteNumber(x, NaN);
    const tValue = toFiniteNumber(t, NaN);
    const pnValue = toFiniteNumber(pnCondicion.valor, NaN);
    const invalidX = calcular.poisson && (!Number.isInteger(xValue) || xValue < 0);
    const invalidT = calcular.exponencial && (!Number.isFinite(tValue) || tValue < 0);
    const invalidPn = calcular.mm1 && (!Number.isInteger(pnValue) || pnValue < 0);

    if (invalidX || invalidT || invalidPn) {
        return (
            <div style={s.container}>
                <p style={{ color: "#991b1b" }}>⚠ Revisa x, t y Pn: no se permiten negativos ni decimales donde se requiere un entero.</p>
                <button style={s.backBtn} onClick={onBack}>← Volver</button>
            </div>
        );
    }

    const xNum = Number.isInteger(xValue) ? xValue : 0;
    const tNum = Number.isFinite(tValue) ? tValue : 0;

    // ── Poisson ───────────────────────────────────────────────────
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

    const modeLabel = () => {
        if (modoPoisson === "exact") return `P(x = ${xNum})`;
        if (modoPoisson === "greater") return `P(x > ${xNum})`;
        if (modoPoisson === "less_eq") return `P(x ≤ ${xNum})`;
        if (modoPoisson === "less") return `P(x < ${xNum})`;
        if (modoPoisson === "greater_eq") return `P(x ≥ ${xNum})`;
    };

    // ── Exponencial ───────────────────────────────────────────────
    const expResult = 1 - Math.pow(Math.E, -μ * tNum);

    // ── M/M/1 ─────────────────────────────────────────────────────
    const metrics = MM1_STEPS.map(step => ({ ...step, value: step.calc(λ, μ) }));
    const P0 = 1 - ρ;

    // Agrega esto antes del return de TabMM1, después de pnValues:
    const pnModo = pnCondicion.modo || "greater_eq";
    const pnValor = Number.isInteger(pnValue) ? pnValue : 0;

    const buildPnCondicion = () => {
        const terms =
            pnModo === "exact" ? [pnValor]
                : pnModo === "greater" ? Array.from({ length: pnValor + 1 }, (_, i) => i)
                    : pnModo === "greater_eq" ? Array.from({ length: pnValor }, (_, i) => i)
                        : pnModo === "less_eq" ? Array.from({ length: pnValor + 1 }, (_, i) => i)
                            : Array.from({ length: pnValor }, (_, i) => i);

        const complement = pnModo === "greater" || pnModo === "greater_eq";
        const termVals = terms.map(i => ({ i, v: Math.pow(ρ, i) * P0 }));
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

    const pnCond = buildPnCondicion();

    // ── Tabs dinámicos ────────────────────────────────────────────
    const tabs = [];
    if (calcular.poisson) tabs.push("Poisson");
    if (calcular.exponencial) tabs.push("Exponencial");
    if (calcular.mm1) tabs.push("M/M/1");
    tabs.push("Conclusiones");

    const poisson = calcular.poisson ? buildPoisson() : null;

    // ── TAB POISSON ───────────────────────────────────────────────
    const TabPoisson = () => (
        <div>
            <p style={s.sectionLabel}>Distribución de Poisson</p>

            {/* Cómo se calculó λ */}
            <div style={s.card}>
                <p style={s.cardTitle}>Cálculo de λ</p>
                <div style={s.r3Visual}>
                    <div style={s.r3Block}>
                        <div style={s.r3BlockTitle}>Dato del problema</div>
                        <div style={s.r3BigNum}>{llegadas.cantidad}</div>
                        <div style={s.r3Sub}>clientes en {llegadas.tiempo} {llegadas.unidad}</div>
                    </div>
                    <div style={{ fontSize: 22, color: "#2563eb", fontWeight: 700 }}>÷</div>
                    <div style={s.r3Block}>
                        <div style={s.r3BlockTitle}>Período</div>
                        <div style={s.r3BigNum}>{llegadas.tiempo}</div>
                        <div style={s.r3Sub}>{llegadas.unidad}</div>
                    </div>
                    <div style={{ fontSize: 22, color: "#2563eb", fontWeight: 700 }}>→</div>
                    <div style={{ ...s.r3Block, background: "#eff6ff", border: "2px solid #2563eb" }}>
                        <div style={{ ...s.r3BlockTitle, color: "#2563eb" }}>λ</div>
                        <div style={{ ...s.r3BigNum, color: "#1d4ed8" }}>{λ.toFixed(4)}</div>
                        <div style={s.r3Sub}>clientes/{llegadas.unidad}</div>
                    </div>
                </div>
                <div style={s.formulaBox}>
                    <code style={s.formulaCode}>λ = {llegadas.cantidad} ÷ {llegadas.tiempo} = {λ.toFixed(4)} clientes/{llegadas.unidad}</code>
                </div>
            </div>

            {/* Fórmula y cálculo */}
            <div style={s.card}>
                <p style={s.cardTitle}>Fórmula aplicada</p>
                <div style={s.formulaBox}>
                    <code style={s.formulaCode}>Px = (λˣ · e^(−λ)) / x!</code>
                </div>

                {/* Estrategia */}
                {modoPoisson !== "exact" && (
                    <div style={{ ...s.formulaBox, background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                        <code style={s.formulaCode}>
                            {modoPoisson === "greater" && `P(x > ${xNum}) = 1 − (P₀ + P₁ + ... + P${xNum})`}
                            {modoPoisson === "greater_eq" && `P(x ≥ ${xNum}) = 1 − (P₀ + P₁ + ... + P${xNum - 1})`}
                            {modoPoisson === "less_eq" && `P(x ≤ ${xNum}) = P₀ + P₁ + ... + P${xNum}`}
                            {modoPoisson === "less" && `P(x < ${xNum}) = P₀ + P₁ + ... + P${xNum - 1}`}
                        </code>
                    </div>
                )}

                {/* Términos paso a paso */}
                {poisson.termVals.map(({ i, v }) => (
                    <div key={i} style={s.termRow}>
                        <div style={s.termHeader}>
                            <span style={s.termTitle}>P(x = {i})</span>
                            <span style={s.termBadge}>{v.toFixed(6)}</span>
                        </div>
                        <div style={s.termSteps}>
                            {[
                                `λˣ = ${λ.toFixed(4)}^${i} = ${Math.pow(λ, i).toFixed(6)}`,
                                `e^(−λ) = e^(−${λ.toFixed(4)}) = ${Math.pow(Math.E, -λ).toFixed(6)}`,
                                `x! = ${i}! = ${factorial(i)}`,
                                `P${i} = ${Math.pow(λ, i).toFixed(6)} × ${Math.pow(Math.E, -λ).toFixed(6)} / ${factorial(i)} = ${v.toFixed(6)}`,
                            ].map((step, idx) => (
                                <div key={idx} style={s.step}>
                                    <span style={s.stepNum}>{idx + 1}</span>
                                    <code style={s.stepCode}>{step}</code>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Suma si es acumulado */}
                {modoPoisson !== "exact" && (
                    <div style={s.sumBox}>
                        <span style={{ fontSize: 13, color: "#374151", fontFamily: "monospace" }}>
                            Suma = {poisson.termVals.map(({ i, v }) => `P${i}(${v.toFixed(4)})`).join(" + ")} = {poisson.sumTerms.toFixed(6)}
                        </span>
                        {poisson.complement && (
                            <span style={{ fontSize: 13, color: "#374151", fontFamily: "monospace", display: "block", marginTop: 4 }}>
                                1 − {poisson.sumTerms.toFixed(6)} = {poisson.result.toFixed(6)}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Resultado */}
            <div style={s.resultCard}>
                <div style={{ fontSize: 14, color: "#1d4ed8", marginBottom: 6 }}>Resultado</div>
                <div style={{ fontSize: 15, fontFamily: "monospace", marginBottom: 8, color: "#374151" }}>
                    {modeLabel()} =
                </div>
                <div style={{ fontSize: 42, fontWeight: 900, color: "#1d4ed8" }}>
                    {poisson.result.toFixed(4)}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                    ({(poisson.result * 100).toFixed(2)}%)
                </div>
            </div>
        </div>
    );

    // ── TAB EXPONENCIAL ───────────────────────────────────────────
    const TabExponencial = () => (
        <div>
            <p style={s.sectionLabel}>Distribución Exponencial — Tiempo de servicio</p>

            {/* Qué es */}
            <div style={s.card}>
                <p style={s.cardTitle}>¿Qué modela la distribución exponencial?</p>
                <p style={s.guideText}>
                    Modela el tiempo que tarda el servidor en atender a un cliente.
                    A diferencia de Poisson (que cuenta llegadas), la exponencial modela
                    <strong> tiempos continuos</strong> — cuánto dura el servicio.
                </p>
                <p style={s.guideText}>
                    <strong>Cuándo usarla:</strong> cuando preguntan "¿cuál es la probabilidad
                    de que un cliente sea atendido en a lo sumo t minutos?"
                </p>
                <div style={s.formulaBox}>
                    <code style={s.formulaCode}>P(T ≤ t) = 1 − e^(−μt)</code>
                </div>
            </div>

            {/* Cálculo de μ */}
            <div style={s.card}>
                <p style={s.cardTitle}>Cálculo de μ</p>
                <div style={s.r3Visual}>
                    <div style={s.r3Block}>
                        <div style={s.r3BlockTitle}>Capacidad</div>
                        <div style={s.r3BigNum}>{servicio.cantidad}</div>
                        <div style={s.r3Sub}>clientes en {servicio.tiempo} {servicio.unidad}</div>
                    </div>
                    <div style={{ fontSize: 22, color: "#dc2626", fontWeight: 700 }}>÷</div>
                    <div style={s.r3Block}>
                        <div style={s.r3BlockTitle}>Período</div>
                        <div style={s.r3BigNum}>{servicio.tiempo}</div>
                        <div style={s.r3Sub}>{servicio.unidad}</div>
                    </div>
                    <div style={{ fontSize: 22, color: "#dc2626", fontWeight: 700 }}>→</div>
                    <div style={{ ...s.r3Block, background: "#fef2f2", border: "2px solid #dc2626" }}>
                        <div style={{ ...s.r3BlockTitle, color: "#dc2626" }}>μ</div>
                        <div style={{ ...s.r3BigNum, color: "#dc2626" }}>{μ.toFixed(4)}</div>
                        <div style={s.r3Sub}>clientes/{servicio.unidad}</div>
                    </div>
                </div>
                <div style={s.formulaBox}>
                    <code style={s.formulaCode}>μ = {servicio.cantidad} ÷ {servicio.tiempo} = {μ.toFixed(4)} clientes/{servicio.unidad}</code>
                </div>
            </div>

            {/* Paso a paso */}
            <div style={s.card}>
                <p style={s.cardTitle}>Cálculo paso a paso — P(T ≤ {tNum})</p>
                {[
                    { n: 1, text: `Identificar μ = ${μ.toFixed(4)} y t = ${tNum}` },
                    { n: 2, text: `Calcular μ × t = ${μ.toFixed(4)} × ${tNum} = ${(μ * tNum).toFixed(6)}` },
                    { n: 3, text: `Calcular e^(−μt) = e^(−${(μ * tNum).toFixed(6)}) = ${Math.pow(Math.E, -μ * tNum).toFixed(6)}` },
                    { n: 4, text: `P(T ≤ ${tNum}) = 1 − ${Math.pow(Math.E, -μ * tNum).toFixed(6)} = ${expResult.toFixed(6)}` },
                ].map(({ n: num, text }) => (
                    <div key={num} style={s.step}>
                        <span style={s.stepNum}>{num}</span>
                        <code style={s.stepCode}>{text}</code>
                    </div>
                ))}
            </div>

            {/* Resultado */}
            <div style={{ ...s.resultCard, borderColor: "#dc2626" }}>
                <div style={{ fontSize: 14, color: "#dc2626", marginBottom: 6 }}>Resultado</div>
                <div style={{ fontSize: 15, fontFamily: "monospace", marginBottom: 8, color: "#374151" }}>
                    P(T ≤ {tNum}) =
                </div>
                <div style={{ fontSize: 42, fontWeight: 900, color: "#dc2626" }}>
                    {expResult.toFixed(4)}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                    ({(expResult * 100).toFixed(2)}%)
                </div>
            </div>
        </div>
    );

    // ── TAB M/M/1 ─────────────────────────────────────────────────
    const TabMM1 = () => (
        <div>
            <p style={s.sectionLabel}>Sistema M/M/1 — 7 métricas operativas</p>
            <p style={{ ...s.guideText, marginBottom: 14 }}>
                Pasa el mouse sobre cada fila para ver la explicación detallada.
            </p>

            <div style={s.paramsRow}>
                {[
                    { label: "λ", val: λ.toFixed(4), color: "#2563eb" },
                    { label: "μ", val: μ.toFixed(4), color: "#dc2626" },
                    { label: "ρ = λ/μ", val: ρ.toFixed(4), color: ρ < 1 ? "#16a34a" : "#dc2626" },
                ].map(({ label, val, color }) => (
                    <div key={label} style={s.paramChip}>
                        <span style={s.paramLabel}>{label}</span>
                        <span style={{ ...s.paramVal, color }}>{val}</span>
                    </div>
                ))}
            </div>

            <div style={s.tableWrap}>
                <table style={s.table}>
                    <thead>
                        <tr>
                            <th style={s.th}>#</th>
                            <th style={s.th}>Métrica</th>
                            <th style={s.th}>Fórmula aplicada</th>
                            <th style={s.th}>Valor</th>
                            <th style={s.th}>Unidad</th>
                        </tr>
                    </thead>
                    <tbody>
                        {metrics.map((m, idx) => (
                            <tr
                                key={m.key}
                                style={{
                                    background: hoveredRow === idx ? "#eff6ff" : idx % 2 === 0 ? "#fff" : "#f8fafc",
                                    cursor: "pointer", transition: "background 0.15s",
                                    borderBottom: "1px solid #f1f5f9"
                                }}
                                onMouseEnter={() => setHoveredRow(idx)}
                                onMouseLeave={() => setHoveredRow(null)}
                            >
                                <td style={s.td}>{idx + 1}</td>
                                <td style={{ ...s.td, fontWeight: 600, color: m.color }}>{m.label} — {m.name}</td>
                                <td style={{ ...s.td, fontFamily: "monospace", fontSize: 11, color: "#6b7280" }}>
                                    {m.formula(λ, μ)}
                                </td>
                                <td style={{ ...s.td, fontWeight: 800, color: m.color, fontSize: 16 }}>
                                    {m.value.toFixed(4)}
                                </td>
                                <td style={{ ...s.td, color: "#9ca3af", fontSize: 11 }}>{m.unit || "—"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Tooltip hover */}
            {hoveredRow !== null && (
                <div style={{ ...s.tooltip, borderColor: metrics[hoveredRow].color }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <span style={{ ...s.tooltipBadge, background: metrics[hoveredRow].color + "18", color: metrics[hoveredRow].color, border: `1px solid ${metrics[hoveredRow].color}33` }}>
                            {metrics[hoveredRow].label}
                        </span>
                        <span style={s.tooltipTitle}>{metrics[hoveredRow].name}</span>
                    </div>
                    <p style={s.tooltipText}><strong>¿Qué es?</strong> {metrics[hoveredRow].desc}</p>
                    <p style={s.tooltipText}><strong>¿Cuándo usarlo?</strong> {metrics[hoveredRow].when}</p>
                    <div style={s.tooltipFormula}>
                        <code style={{ fontSize: 12 }}>{metrics[hoveredRow].formula(λ, μ)} = {metrics[hoveredRow].value.toFixed(4)}</code>
                    </div>
                    <p style={{ ...s.tooltipText, color: "#16a34a", marginTop: 8 }}>
                        <strong>Conclusión:</strong> {metrics[hoveredRow].conclusion(metrics[hoveredRow].value)}
                    </p>
                </div>
            )}

            {/* Pn */}
            <div style={{ ...s.card, marginTop: 16 }}>
                <p style={s.cardTitle}>Distribución Pn — P(n clientes en sistema)</p>
                <p style={{ ...s.guideText, marginBottom: 12 }}>
                    <strong>Fórmula:</strong> Pn = ρⁿ · P₀
                    &nbsp;|&nbsp; <strong>P₀ =</strong> {P0.toFixed(4)}
                    &nbsp;|&nbsp; <strong>ρ =</strong> {ρ.toFixed(4)}
                </p>

                {/* Tarjetas individuales según condición seleccionada */}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
                    {pnCond.termVals.map(({ i, v }) => (
                        <div key={i} style={s.pnCard}>
                            <div style={s.pnLabel}>P{i}</div>
                            <div style={s.pnVal}>{v.toFixed(4)}</div>
                            <div style={s.pnPct}>{(v * 100).toFixed(2)}%</div>
                        </div>
                    ))}
                </div>

                {/* Condición adicional */}
                {pnCond && (
                    <div style={s.pnCondCard}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 10 }}>
                            Condición: {pnCond.label}
                        </p>

                        {/* Estrategia */}
                        <div style={s.formulaBox}>
                            <code style={s.formulaCode}>
                                {pnModo === "greater" && `P(n > ${pnValor}) = 1 − (${pnCond.termVals.map(t => `P${t.i}`).join(" + ")})`}
                                {pnModo === "greater_eq" && `P(n ≥ ${pnValor}) = 1 − (${pnCond.termVals.map(t => `P${t.i}`).join(" + ")})`}
                                {pnModo === "less_eq" && `P(n ≤ ${pnValor}) = ${pnCond.termVals.map(t => `P${t.i}`).join(" + ")}`}
                                {pnModo === "less" && `P(n < ${pnValor}) = ${pnCond.termVals.map(t => `P${t.i}`).join(" + ")}`}
                                {pnModo === "exact" && `P(n = ${pnValor}) = P${pnValor}`}
                            </code>
                        </div>

                        {/* Términos */}
                        {pnCond.termVals.map(({ i, v }) => (
                            <div key={i} style={s.step}>
                                <span style={s.stepNum}>P{i}</span>
                                <code style={s.stepCode}>
                                    ρ^{i} · P₀ = {ρ.toFixed(4)}^{i} × {P0.toFixed(4)} = {v.toFixed(6)}
                                </code>
                            </div>
                        ))}

                        {/* Suma */}
                        <div style={{ ...s.formulaBox, marginTop: 10 }}>
                            <code style={s.formulaCode}>
                                Suma = {pnCond.termVals.map(t => t.v.toFixed(4)).join(" + ")} = {pnCond.sumTerms.toFixed(6)}
                            </code>
                            {pnCond.complement && (
                                <code style={{ ...s.formulaCode, marginTop: 4 }}>
                                    1 − {pnCond.sumTerms.toFixed(6)} = {pnCond.result.toFixed(6)}
                                </code>
                            )}
                        </div>

                        {/* Resultado destacado */}
                        <div style={s.pnResultado}>
                            <span style={{ fontSize: 14, color: "#1d4ed8" }}>{pnCond.label} =</span>
                            <span style={{ fontSize: 36, fontWeight: 900, color: "#1d4ed8", marginLeft: 12 }}>
                                {pnCond.result.toFixed(4)}
                            </span>
                            <span style={{ fontSize: 13, color: "#6b7280", marginLeft: 12 }}>
                                ({(pnCond.result * 100).toFixed(2)}%)
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    // ── TAB CONCLUSIONES ──────────────────────────────────────────
    const TabConclusiones = () => {
        const Lq = metrics.find(m => m.key === "Lq")?.value;
        const Wq = metrics.find(m => m.key === "Wq")?.value;
        const loadPercent = (ρ * 100).toFixed(1);
        const systemState = ρ < 0.5 ? "subutilizado" : ρ < 0.8 ? "en operación normal" : "bajo alta carga";
        const conclusionText = ρ < 0.5
            ? `El sistema está ${systemState} y tiene capacidad disponible.`
            : ρ < 0.8
                ? `El sistema está ${systemState} y funciona de forma aceptable.`
                : `El sistema está ${systemState} y ya muestra riesgo de espera.`;
        const recommendationText = ρ < 0.5
            ? "Se puede mantener la configuración actual o reasignar capacidad a otras tareas."
            : ρ < 0.8
                ? "Conviene monitorear los picos de demanda para evitar saturación futura."
                : "Conviene revisar el modelo M/M/k o aumentar la capacidad de servicio.";

        return (
            <div>
                <p style={s.sectionLabel}>Conclusiones y recomendaciones</p>

                {/* Semáforo */}
                {calcular.mm1 && (
                    <div style={s.card}>
                        <p style={s.cardTitle}>Estado del sistema</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            <div style={{
                                width: 60, height: 60, borderRadius: "50%",
                                background: ρ < 0.5 ? "#22c55e" : ρ < 0.8 ? "#f59e0b" : "#ef4444",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 13, fontWeight: 800, color: "#fff"
                            }}>
                                {(ρ * 100).toFixed(0)}%
                            </div>
                            <div>
                                <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>
                                    {ρ < 0.5 ? "Sistema subutilizado" : ρ < 0.8 ? "Sistema en operación normal" : "Sistema bajo alta carga"}
                                </p>
                                <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0 0" }}>
                                    ρ = {ρ.toFixed(4)} — el servidor está ocupado el {(ρ * 100).toFixed(1)}% del tiempo
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Resultados resumen */}
                <div style={s.card}>
                    <p style={s.cardTitle}>Resumen de resultados</p>
                    {calcular.poisson && poisson && (
                        <div style={s.conclusionRow}>
                            <span style={{ ...s.conclusionLabel, color: "#2563eb" }}>Poisson</span>
                            <span style={s.conclusionText}>
                                {modeLabel()} = <strong>{poisson.result.toFixed(4)}</strong>
                                {" "}({(poisson.result * 100).toFixed(2)}%)
                            </span>
                        </div>
                    )}
                    {calcular.exponencial && (
                        <div style={s.conclusionRow}>
                            <span style={{ ...s.conclusionLabel, color: "#dc2626" }}>Exponencial</span>
                            <span style={s.conclusionText}>
                                P(T ≤ {tNum}) = <strong>{expResult.toFixed(4)}</strong>
                                {" "}({(expResult * 100).toFixed(2)}%)
                            </span>
                        </div>
                    )}
                    {calcular.mm1 && metrics.map(m => (
                        <div key={m.key} style={s.conclusionRow}>
                            <span style={{ ...s.conclusionLabel, color: m.color }}>{m.label}</span>
                            <span style={s.conclusionText}>{m.conclusion(m.value)}</span>
                            <span style={{ fontWeight: 800, color: m.color, marginLeft: "auto", flexShrink: 0 }}>
                                {m.value.toFixed(4)}
                            </span>
                        </div>
                    ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                    <div style={s.card}>
                        <p style={s.cardTitle}>Conclusión</p>
                        <p style={{ ...s.guideText, marginTop: 0 }}>
                            Con una utilización de {loadPercent}%, el sistema está {systemState}.
                        </p>
                        <p style={{ ...s.guideText, marginBottom: 0 }}>
                            {conclusionText}
                        </p>
                    </div>

                    <div style={s.card}>
                        <p style={s.cardTitle}>Recomendación</p>
                        <p style={{ ...s.guideText, marginTop: 0, marginBottom: 0 }}>
                            {recommendationText}
                        </p>
                    </div>
                </div>

                {/* Recomendación */}
                <div style={{ ...s.card, background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                    <p style={{ ...s.cardTitle, color: "#1d4ed8" }}>Recomendación general</p>
                    <p style={{ fontSize: 13, color: "#1e40af", lineHeight: 1.7 }}>
                        {calcular.mm1 && ρ >= 0.8
                            ? `Con una utilización del ${(ρ * 100).toFixed(1)}%, el sistema está bajo alta carga. 
                 Se recomienda evaluar el modelo de Canales Múltiples (M/M/k) para reducir 
                 el tiempo de espera promedio de ${Wq?.toFixed(4)} unidades de tiempo.`
                            : calcular.mm1 && ρ >= 0.5
                                ? `El sistema opera con normalidad (ρ = ${ρ.toFixed(4)}). 
                 Monitorear en horas pico para evitar que Lq = ${Lq?.toFixed(4)} clientes 
                 genere insatisfacción.`
                                : calcular.mm1
                                    ? `Con solo ${(ρ * 100).toFixed(1)}% de utilización, el servidor tiene capacidad ociosa. 
                 Podría evaluarse reducir la tasa de servicio o reasignar recursos.`
                                    : `Revisa los resultados de Poisson y Exponencial para tomar decisiones 
                 sobre el dimensionamiento del sistema.`
                        }
                    </p>
                </div>
            </div>
        );
    };

    const tabComponents = {
        "Poisson": <TabPoisson />,
        "Exponencial": <TabExponencial />,
        "M/M/1": <TabMM1 />,
        "Conclusiones": <TabConclusiones />,
    };

    return (
        <div style={s.container}>
            <h2 style={s.title}>Análisis — Canal Simple M/M/1</h2>

            <div style={s.tabRow}>
                {tabs.map((tab, i) => (
                    <button
                        key={tab}
                        style={{ ...s.tab, ...(activeTab === i ? s.tabActive : {}) }}
                        onClick={() => setActiveTab(i)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div style={{ marginBottom: 20 }}>
                {tabComponents[tabs[activeTab]]}
            </div>

            <button style={s.backBtn} onClick={onBack}>← Volver a datos</button>
        </div>
    );
};

export default CanalesSimpleAnalysis;

const s = {
    container: { padding: "30px", background: "#f4f6fb", fontFamily: "Inter, sans-serif", minHeight: "100vh" },
    title: { fontSize: "24px", fontWeight: "800", marginBottom: "20px" },
    guideText: { margin: "5px 0", color: "#24445d", lineHeight: "1.45", fontSize: "13px" },
    sectionLabel: { fontSize: "11px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" },
    tabRow: { display: "flex", gap: "4px", marginBottom: "20px", background: "#fff", padding: "4px", borderRadius: "12px", border: "1px solid #e5e7eb", width: "fit-content", flexWrap: "wrap" },
    tab: { padding: "8px 18px", borderRadius: "9px", border: "none", background: "transparent", cursor: "pointer", fontSize: "13px", fontWeight: "500", color: "#6b7280" },
    tabActive: { background: "#0f172a", color: "#fff" },
    card: { background: "#fff", borderRadius: "12px", padding: "16px 18px", marginBottom: "14px", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
    cardTitle: { fontSize: "14px", fontWeight: "700", color: "#111827", margin: "0 0 10px 0" },
    formulaBox: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 14px", marginBottom: 8 },
    formulaCode: { fontFamily: "monospace", fontSize: "13px", color: "#374151", display: "block" },
    r3Visual: { display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", margin: "12px 0" },
    r3Block: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "12px 18px", textAlign: "center", minWidth: 90 },
    r3BlockTitle: { fontSize: "10px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 },
    r3BigNum: { fontSize: "26px", fontWeight: "800", color: "#111827" },
    r3Sub: { fontSize: "11px", color: "#9ca3af", marginTop: 4 },
    termRow: { marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #f1f5f9" },
    termHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    termTitle: { fontSize: "14px", fontWeight: "700", color: "#111827" },
    termBadge: { fontSize: "13px", fontWeight: "700", color: "#2563eb", background: "#eff6ff", padding: "3px 10px", borderRadius: "20px" },
    termSteps: { display: "flex", flexDirection: "column", gap: 4, paddingLeft: 12 },
    step: { display: "flex", alignItems: "center", gap: 10, marginBottom: 4 },
    stepNum: { width: 20, height: 20, borderRadius: "50%", background: "#0f172a", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    stepCode: { fontFamily: "monospace", fontSize: "12px", background: "#f1f5f9", padding: "3px 8px", borderRadius: 4, color: "#374151" },
    sumBox: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 14px", marginTop: 8 },
    resultCard: { background: "#eff6ff", border: "2px solid #2563eb", borderRadius: "12px", padding: "20px", textAlign: "center", marginBottom: 14 },
    paramsRow: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 },
    paramChip: { display: "flex", flexDirection: "column", gap: 2, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 14px", minWidth: 80 },
    paramLabel: { fontSize: 10, color: "#6b7280", fontWeight: 600, textTransform: "uppercase" },
    paramVal: { fontSize: 18, fontWeight: 800 },
    tableWrap: { borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.07)", background: "#fff" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
    th: { background: "#0f172a", color: "#fff", padding: "10px 14px", textAlign: "left", fontWeight: 600 },
    td: { padding: "10px 14px", color: "#374151" },
    tooltip: { marginTop: 12, background: "#fff", border: "2px solid", borderRadius: "12px", padding: "16px 18px", boxShadow: "0 8px 24px rgba(0,0,0,0.10)" },
    tooltipBadge: { fontWeight: 800, fontSize: 16, padding: "3px 12px", borderRadius: "20px" },
    tooltipTitle: { fontSize: 14, fontWeight: 700, color: "#111827" },
    tooltipText: { fontSize: 13, color: "#374151", margin: "6px 0", lineHeight: 1.5 },
    tooltipFormula: { fontFamily: "monospace", background: "#f8fafc", borderRadius: 8, padding: "8px 12px", fontSize: 12 },
    pnCard: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", textAlign: "center", minWidth: 70 },
    pnLabel: { fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 4 },
    pnVal: { fontSize: 16, fontWeight: 800, color: "#2563eb" },
    pnPct: { fontSize: 10, color: "#9ca3af", marginTop: 2 },
    conclusionRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8, padding: "8px 10px", borderRadius: 8, background: "#f8fafc" },
    conclusionLabel: { fontWeight: 700, fontSize: 13, minWidth: 80 },
    conclusionText: { fontSize: 13, color: "#374151", flex: 1 },
    backBtn: { padding: "10px 16px", background: "#6b7280", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600" },
    pnCondCard: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px", marginTop: 4 },
    pnResultado: { display: "flex", alignItems: "center", marginTop: 12, padding: "14px 18px", background: "#eff6ff", border: "2px solid #2563eb", borderRadius: 10, flexWrap: "wrap" },
};
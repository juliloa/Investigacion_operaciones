import React, { useState } from "react";

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

const convertRate = (cantidad, tiempo, fromUnit, toUnit) => {
    if (!cantidad || !tiempo || parseFloat(tiempo) === 0) return null;
    const ratePerSec = parseFloat(cantidad) / (parseFloat(tiempo) * UNIT_FACTORS[fromUnit]);
    return ratePerSec * UNIT_FACTORS[toUnit];
};

const CanalesMultiples = ({ data, setData, onNext }) => {
    const [showPreviousOption, setShowPreviousOption] = useState(true);

    const update = (patch) => setData(prev => ({ ...prev, ...patch }));
    const updateL = (patch) => setData(prev => ({ ...prev, llegadas: { ...prev.llegadas, ...patch } }));
    const updateS = (patch) => setData(prev => ({ ...prev, servicio: { ...prev.servicio, ...patch } }));
    const updateC = (patch) => setData(prev => ({ ...prev, calcular: { ...prev.calcular, ...patch } }));
    const updatePnC = (patch) => setData(prev => ({ ...prev, pnCondicion: { ...prev.pnCondicion, ...patch } }));

    const {
        llegadas = {},
        servicio = {},
        calcular = {},
        x = "",
        modoPoisson = "exact",
        t = "",
        numServidores = 2,
        unidadBase,
        pnCondicion = {},
    } = data;

    const pnModo = pnCondicion.modo || "greater_eq";

    // ── Detectar diferencia de unidades ──────────────────────────
    const unidadesDiferentes = llegadas.unidad && servicio.unidad &&
        llegadas.unidad !== servicio.unidad &&
        llegadas.cantidad && servicio.cantidad;

    // Unidad base efectiva
    const uBase = unidadBase || servicio.unidad || "min";

    // λ y μ convertidos a uBase
    const lambda = convertRate(llegadas.cantidad, llegadas.tiempo, llegadas.unidad, uBase);
    const mu = convertRate(servicio.cantidad, servicio.tiempo, servicio.unidad, uBase);
    const rho = (lambda && mu) ? lambda / mu : null;
    const serverUtilization = (rho && numServidores) ? rho / numServidores : null;

    // λ y μ en sus unidades originales
    const lambdaOrig = llegadas.cantidad && llegadas.tiempo
        ? parseFloat(llegadas.cantidad) / parseFloat(llegadas.tiempo) : null;
    const muOrig = servicio.cantidad && servicio.tiempo
        ? parseFloat(servicio.cantidad) / parseFloat(servicio.tiempo) : null;

    const canContinue = lambda !== null && lambda > 0 &&
        mu !== null && mu > 0 &&
        numServidores > 0 &&
        (!unidadesDiferentes || unidadBase !== null) &&
        (calcular.poisson || calcular.exponencial || calcular.mmk) &&
        (!calcular.mmk || (rho !== null && serverUtilization !== null && serverUtilization < 1)) &&
        (!calcular.poisson || x !== "") &&
        (!calcular.exponencial || t !== "");

    // Cargar datos M/M/1 anterior
    const loadPreviousData = () => {
        const prev = localStorage.getItem("io_canales");
        if (prev) {
            const prevData = JSON.parse(prev);
            setData(prevData);
            setShowPreviousOption(false);
        }
    };

    // Crear nuevo problema
    const startNewProblem = () => {
        setShowPreviousOption(false);
        update({
            llegadas: { cantidad: "", tiempo: "", unidad: "min" },
            servicio: { cantidad: "", tiempo: "", unidad: "min" },
            calcular: { poisson: false, exponencial: false, mmk: true },
            x: "",
            modoPoisson: "exact",
            t: "",
            numServidores: 2,
            unidadBase: null,
            pnCondicion: { modo: "greater_eq", valor: "" },
        });
    };

    return (
        <div style={s.container}>
            <h2 style={s.title}>Canales Múltiples — M/M/k</h2>

            {/* OPCIÓN INICIAL: Usar M/M/1 anterior o nuevo problema */}
            {showPreviousOption && (
                <div style={s.optionCard}>
                    <p style={s.cardTitle}>¿Cómo deseas empezar?</p>
                    <p style={s.guideText}>
                        Puedes usar los datos de M/M/1 anterior para comparar, o resolver un nuevo problema.
                    </p>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 16 }}>
                        <button
                            style={{ ...s.modeBtn, ...s.modeBtnLarge }}
                            onClick={loadPreviousData}
                        >
                            <span style={{ fontSize: 16, fontWeight: 700 }}>Usar M/M/1 anterior</span>
                            <span style={{ fontSize: 12, marginTop: 8, opacity: 0.85 }}>Comparar resultados y medir mejora</span>
                        </button>
                        <button
                            style={{ ...s.modeBtn, ...s.modeBtnLarge, borderColor: "#9ca3af", background: "#f3f4f6" }}
                            onClick={startNewProblem}
                        >
                            <span style={{ fontSize: 16, fontWeight: 700 }}>Nuevo problema</span>
                            <span style={{ fontSize: 12, marginTop: 8, opacity: 0.85 }}>Resolver un nuevo caso</span>
                        </button>
                    </div>
                </div>
            )}

            {/* GUÍA */}
            {!showPreviousOption && (
                <>
                    <div style={s.guideCard}>
                        <h3 style={s.guideTitle}>¿Qué es M/M/k (Canales Múltiples)?</h3>
                        <p style={s.guideText}>
                            Sistema con <strong>k servidores</strong> donde los clientes llegan según
                            <strong> Poisson</strong> y cada servidor atiende con tiempo <strong>Exponencial</strong>.
                            Ideal para modelar centros de atención con múltiples cajas, asesores, etc.
                        </p>
                        <div style={s.defGrid}>
                            {[
                                {
                                    sym: "λ", bg: "#eff6ff", color: "#2563eb", name: "Tasa de llegadas",
                                    desc: "Clientes que llegan por unidad de tiempo (misma definición que M/M/1).", ej: "2 clientes/min"
                                },
                                {
                                    sym: "μ", bg: "#fef2f2", color: "#dc2626", name: "Tasa por servidor",
                                    desc: "Clientes que CADA servidor atiende por unidad de tiempo.", ej: "1 cliente/min"
                                },
                                {
                                    sym: "k", bg: "#f0fdf4", color: "#16a34a", name: "Número de servidores",
                                    desc: "Cantidad de servidores paralelos en el sistema.", ej: "k = 3"
                                },
                                {
                                    sym: "ρ", bg: "#fef3c7", color: "#ea580c", name: "Utilización",
                                    desc: "ρ/k = (λ/μ)/k. Fracción de trabajo entre todos. Debe ser < 1.", ej: "0.67 → 67%"
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
                        <p style={s.guideText}>Clientes que llegan y en qué período.</p>
                        <div style={s.inputRow}>
                            <div style={s.field}>
                                <label style={s.label}>¿Cuántos clientes llegan?</label>
                                <input type="number" value={llegadas.cantidad} onChange={e => updateL({ cantidad: e.target.value })} style={s.input} placeholder="ej: 60" />
                            </div>
                            <div style={s.fieldSm}>
                                <label style={s.label}>En cuántos</label>
                                <input type="number" value={llegadas.tiempo} onChange={e => updateL({ tiempo: e.target.value })} style={s.inputSm} placeholder="ej: 30" />
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
                                <span style={s.resultFormula}>({llegadas.cantidad} ÷ {llegadas.tiempo})</span>
                            </div>
                        )}
                    </div>

                    {/* ── SERVICIO ── */}
                    <div style={s.card}>
                        <p style={s.cardTitle}><span style={{ color: "#dc2626" }}>μ</span> — Tasa de servicio (por servidor)</p>
                        <p style={s.guideText}>Cuántos clientes CADA servidor puede atender.</p>
                        <div style={s.inputRow}>
                            <div style={s.field}>
                                <label style={s.label}>¿Cuántos clientes por servidor?</label>
                                <input type="number" value={servicio.cantidad} onChange={e => updateS({ cantidad: e.target.value })} style={s.input} placeholder="ej: 30" />
                            </div>
                            <div style={s.fieldSm}>
                                <label style={s.label}>En cuántos</label>
                                <input type="number" value={servicio.tiempo} onChange={e => updateS({ tiempo: e.target.value })} style={s.inputSm} placeholder="ej: 30" />
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
                                <span style={s.resultFormula}>({servicio.cantidad} ÷ {servicio.tiempo})</span>
                            </div>
                        )}
                    </div>

                    {/* ── CONVERSIÓN DE UNIDADES ── */}
                    {unidadesDiferentes && (
                        <div style={s.convCard}>
                            <p style={s.convTitle}>Unidades diferentes detectadas</p>
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
                                            <span style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>λ = {lConv?.toFixed(4)} clientes/{u}</span>
                                            <span style={{ fontSize: 11, color: "#6b7280" }}>μ = {mConv?.toFixed(4)} clientes/{u}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── NÚMERO DE SERVIDORES K ── */}
                    <div style={s.card}>
                        <p style={s.cardTitle}><span style={{ color: "#16a34a" }}>k</span> — Número de servidores</p>
                        <p style={s.guideText}>¿Cuántos servidores operan en paralelo?</p>
                        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                            <div style={{ ...s.field, maxWidth: 150 }}>
                                <label style={s.label}>Cantidad de servidores (k)</label>
                                <input
                                    type="number"
                                    value={numServidores}
                                    onChange={e => update({ numServidores: Math.max(1, parseInt(e.target.value) || 1) })}
                                    style={s.input}
                                    placeholder="ej: 3"
                                    min="1"
                                    max="10"
                                />
                            </div>
                            {/* Slider visual */}
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <input
                                    type="range"
                                    value={numServidores}
                                    onChange={e => update({ numServidores: parseInt(e.target.value) })}
                                    min="1"
                                    max="10"
                                    style={{ width: "100%", cursor: "pointer" }}
                                />
                                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4, display: "flex", justifyContent: "space-between" }}>
                                    <span>1</span><span>5</span><span>10</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ρ y Utilización */}
                    {lambda && mu && (!unidadesDiferentes || unidadBase) && (
                        <div style={{
                            ...s.resultInline,
                            borderColor: serverUtilization < 1 ? "#bbf7d0" : "#fecaca",
                            background: serverUtilization < 1 ? "#f0fdf4" : "#fef2f2",
                        }}>
                            <span style={{ color: serverUtilization < 1 ? "#16a34a" : "#dc2626", fontWeight: 700 }}>ρ = λ/μ =</span>
                            <span style={{ ...s.resultNum, color: serverUtilization < 1 ? "#15803d" : "#dc2626" }}>{rho?.toFixed(4)}</span>
                            <span style={s.resultUnit}>; Utilización = ρ/k =</span>
                            <span style={{ ...s.resultNum, fontSize: 18, color: serverUtilization < 1 ? "#15803d" : "#dc2626" }}>{serverUtilization?.toFixed(4)}</span>
                            <span style={s.resultUnit}>
                                {serverUtilization < 1 ? "Sistema estable" : "Sistema inestable — aumenta k o mejora μ"}
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
                                    desc: "Probabilidad de x llegadas.", when: "Opcional — igual que M/M/1."
                                },
                                {
                                    key: "exponencial", title: "Distribución Exponencial", formula: "P(T ≤ t) = 1 − e^(−μt)",
                                    desc: "Probabilidad de servicio en t unidades.", when: "Opcional — igual que M/M/1."
                                },
                                {
                                    key: "mmk", title: "Sistema M/M/k", formula: "P₀, Lq, L, Wq, W, Pw, Pn (Erlang C)",
                                    desc: "Métricas completas del sistema con k servidores.", when: "Principal — siempre recomendado."
                                },
                            ].map(({ key, title, formula, desc, when }) => (
                                <div
                                    key={key}
                                    style={{ ...s.checkCard, ...(calcular[key] ? s.checkActive : {}) }}
                                    onClick={() => updateC({ [key]: !calcular[key] })}
                                >
                                    <div style={s.checkHeader}>
                                        <div style={{ ...s.checkbox, background: calcular[key] ? "#2563eb" : "#fff", border: `2px solid ${calcular[key] ? "#2563eb" : "#d1d5db"}` }}>
                                            {calcular[key] && "✓"}
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
                    {(calcular.poisson || calcular.exponencial || calcular.mmk) && (
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
                                        <label style={s.label}>Valor de x</label>
                                        <input type="number" value={x} onChange={e => update({ x: e.target.value })} style={{ ...s.inputSm, width: 120 }} placeholder="ej: 2" min="0" />
                                    </div>
                                </div>
                            )}

                            {/* Exponencial */}
                            {calcular.exponencial && (
                                <div style={s.paramBlock}>
                                    <p style={s.paramTitle}>Para Exponencial — P(T ≤ t)</p>
                                    <div style={s.field}>
                                        <label style={s.label}>Valor de t ({uBase})</label>
                                        <input type="number" value={t} onChange={e => update({ t: e.target.value })} style={{ ...s.inputSm, width: 120 }} placeholder="ej: 1" min="0" step="0.1" />
                                    </div>
                                </div>
                            )}

                            {/* M/M/k Pn */}
                            {calcular.mmk && (
                                <div style={s.paramBlock}>
                                    <div style={{ marginTop: 14 }}>
                                        <p style={{ ...s.paramTitle, marginBottom: 8 }}>Condición adicional sobre Pn</p>
                                        <p style={s.guideText}>
                                            Calcula probabilidad de n clientes en sistema.
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
                                            <label style={s.label}>Valor de n</label>
                                            <input type="number" value={pnCondicion.valor} onChange={e => updatePnC({ valor: e.target.value })} style={{ ...s.inputSm, width: 120 }} placeholder="ej: 3" min="0" />
                                        </div>
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
                                { label: "λ", val: lambda?.toFixed(4) ?? "—", color: "#2563eb", sub: `en ${uBase}` },
                                { label: "μ", val: mu?.toFixed(4) ?? "—", color: "#dc2626", sub: `en ${uBase}` },
                                { label: "k", val: numServidores, color: "#16a34a", sub: "servidores" },
                                { label: "ρ/k", val: serverUtilization?.toFixed(4) ?? "—", color: serverUtilization < 1 ? "#16a34a" : "#dc2626", sub: "utilización" },
                            ].map(({ label, val, color, sub }) => (
                                <div key={label} style={s.summaryItem}>
                                    <span style={s.summaryLabel}>{label}</span>
                                    <span style={{ ...s.summaryVal, color }}>{val}</span>
                                    <span style={{ fontSize: 10, color: "#9ca3af" }}>{sub}</span>
                                </div>
                            ))}
                        </div>

                        {calcular.mmk && serverUtilization >= 1 && (
                            <div style={s.errorBox}>
                                Para M/M/k se requiere ρ/k &lt; 1. Actualmente ρ/k = {serverUtilization?.toFixed(4)}.
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
                </>
            )}
        </div>
    );
};

export default CanalesMultiples;

const s = {
    container: { padding: "30px", background: "#f4f6fb", fontFamily: "Inter, sans-serif", minHeight: "100vh" },
    title: { fontSize: "24px", fontWeight: "800", marginBottom: "20px" },
    optionCard: { background: "#fff", borderRadius: "12px", padding: "24px 28px", marginBottom: "20px", border: "2px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
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
    convCard: { background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: "12px", padding: "16px 18px", marginBottom: "14px" },
    convTitle: { fontSize: "14px", fontWeight: "700", color: "#92400e", margin: "0 0 8px 0" },
    convBtn: { display: "flex", flexDirection: "column", padding: "12px 16px", borderRadius: "10px", border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer", minWidth: 160, gap: 2 },
    convBtnActive: { border: "1.5px solid #16a34a", background: "#f0fdf4" },
    checkGrid: { display: "flex", flexDirection: "column", gap: 10 },
    checkCard: { padding: "14px 16px", borderRadius: "10px", border: "1.5px solid #e5e7eb", background: "#f9fafb", cursor: "pointer" },
    checkActive: { border: "1.5px solid #2563eb", background: "#eff6ff" },
    checkHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 6 },
    checkbox: { width: 20, height: 20, borderRadius: 5, color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    checkTitle: { fontSize: 14, fontWeight: 700, color: "#111827" },
    checkFormula: { display: "block", fontFamily: "monospace", fontSize: 12, background: "#f1f5f9", padding: "3px 8px", borderRadius: 4, marginBottom: 6, color: "#374151" },
    checkDesc: { fontSize: 12, color: "#374151", margin: "0 0 4px 0", lineHeight: 1.5 },
    checkWhen: { fontSize: 11, color: "#6b7280", margin: 0 },
    modeBtn: { padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#374151" },
    modeBtnActive: { border: "1.5px solid #2563eb", background: "#eff6ff", color: "#2563eb" },
    modeBtnLarge: { flex: 1, minWidth: 200, padding: "18px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 12, border: "2px solid #e5e7eb", background: "#fff", cursor: "pointer", gap: 6 },
    paramBlock: { marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #e5e7eb" },
    paramBlock_last: { marginBottom: 0, paddingBottom: 0, borderBottom: "none" },
    paramTitle: { fontSize: 13, fontWeight: 700, color: "#111827", margin: "0 0 6px 0" },
    summaryCard: { background: "#fff", borderRadius: "12px", padding: "16px 18px", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
    summaryGrid: { display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 },
    summaryItem: { display: "flex", flexDirection: "column", gap: 2, alignItems: "center", background: "#f9fafb", padding: "10px 14px", borderRadius: 8, flex: 1, minWidth: 100 },
    summaryLabel: { fontSize: 11, fontWeight: 600, color: "#6b7280" },
    summaryVal: { fontSize: 20, fontWeight: 800 },
    continueBtn: { width: "100%", padding: "12px 16px", borderRadius: "10px", border: "none", fontSize: "14px", fontWeight: 700, color: "#fff", cursor: "pointer" },
    errorBox: { padding: "12px 14px", borderRadius: "8px", background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontSize: 12, marginTop: 12 },
};

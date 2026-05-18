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
    const updatePnC = (patch) => setData(prev => ({ ...prev, pnCondicion: { ...prev.pnCondicion, ...patch } }));
    const updateMI = (patch) => setData(prev => ({ ...prev, mejoraInterna: { ...prev.mejoraInterna, ...patch } }));

    const {
        llegadas,
        servicio,
        x,
        modoPoisson,
        t,
        unidadBase,
        pnCondicion = {},
        mejoraInterna = { activa: false, tipo: "tasa", cantidad: "", tiempo: "", unidad: "min", porcentaje: "" }
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

    const invalidX = (!Number.isInteger(xValue) || xValue < 0);
    const invalidT = (!Number.isFinite(tValue) || tValue < 0);
    const invalidPn = (!Number.isInteger(pnValue) || pnValue < 0);
    const validationMessage = invalidX
        ? "x debe ser un número entero no negativo para Poisson."
        : invalidT
            ? "t debe ser un número no negativo para la distribución exponencial."
            : invalidPn
                ? "Pn requiere un valor entero no negativo."
                : mejoraInterna.activa && mejoraInterna.tipo === "tasa" && (!mejoraInterna.cantidad || !mejoraInterna.tiempo)
                    ? "Completa los campos de cantidad y tiempo para la nueva tasa de servicio."
                : mejoraInterna.activa && mejoraInterna.tipo === "porcentaje" && (!mejoraInterna.porcentaje || isNaN(mejoraInterna.porcentaje) || Number(mejoraInterna.porcentaje) <= 0)
                    ? "Ingresa un porcentaje de mejora válido mayor a 0."
                : "";

    const canContinue = lambda !== null && lambda > 0 &&
        mu !== null && mu > 0 &&
        (!unidadesDiferentes || unidadBase !== null) &&
        (rho !== null && rho < 1) &&
        (!invalidX) &&
        (!invalidT) &&
        (!invalidPn) &&
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

            {/* ── MEJORA INTERNA (OPCIONAL) ── */}
            <div style={{ ...s.card, background: mejoraInterna.activa ? "#f0fdf4" : "#f8fafc", borderColor: mejoraInterna.activa ? "#bbf7d0" : "#e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ paddingRight: 20 }}>
                        <p style={{ ...s.cardTitle, color: mejoraInterna.activa ? "#166534" : "#1e293b", fontSize: 15 }}>Análisis Comparativo: Mejora Interna del Servidor</p>
                        <p style={{ ...s.guideText, color: mejoraInterna.activa ? "#14532d" : "#475569", marginTop: 4 }}>
                            ¿Qué pasaría si el servidor actual fuera más rápido? Activa esta opción para simular un aumento en la capacidad de atención. 
                            El sistema generará una tabla comparativa automática para mostrarte cómo se reducirían las filas y los tiempos de espera frente a tu configuración original.
                        </p>
                    </div>
                    <label style={{ ...s.toggleSwitch, marginTop: 4 }}>
                        <input
                            type="checkbox"
                            checked={mejoraInterna.activa}
                            onChange={(e) => updateMI({ activa: e.target.checked })}
                            style={{ display: "none" }}
                        />
                        <div style={{ ...s.toggleTrack, background: mejoraInterna.activa ? "#10b981" : "#cbd5e1" }}>
                            <div style={{ ...s.toggleThumb, transform: mejoraInterna.activa ? "translateX(20px)" : "translateX(0)" }} />
                        </div>
                    </label>
                </div>

                {mejoraInterna.activa && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #bbf7d0" }}>
                        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                            <button
                                style={{ ...s.modeBtn, ...(mejoraInterna.tipo === "tasa" ? s.modeBtnActive : {}) }}
                                onClick={() => updateMI({ tipo: "tasa" })}
                            >
                                <span style={{ fontSize: 13, fontWeight: 700 }}>Ingresar Nueva Tasa</span>
                            </button>
                            <button
                                style={{ ...s.modeBtn, ...(mejoraInterna.tipo === "porcentaje" ? s.modeBtnActive : {}) }}
                                onClick={() => updateMI({ tipo: "porcentaje" })}
                            >
                                <span style={{ fontSize: 13, fontWeight: 700 }}>Porcentaje de Mejora</span>
                            </button>
                        </div>

                        {mejoraInterna.tipo === "tasa" ? (
                            <div style={s.inputRow}>
                                <div style={s.field}>
                                    <label style={s.label}>¿Cuántos clientes podrá atender ahora?</label>
                                    <input type="number" value={mejoraInterna.cantidad} onChange={e => updateMI({ cantidad: e.target.value })} style={s.input} placeholder="ej: 80" />
                                </div>
                                <div style={s.fieldSm}>
                                    <label style={s.label}>En cuántos</label>
                                    <input type="number" value={mejoraInterna.tiempo} onChange={e => updateMI({ tiempo: e.target.value })} style={s.inputSm} placeholder="ej: 60" />
                                </div>
                                <div style={s.fieldSm}>
                                    <label style={s.label}>Unidad</label>
                                    <select value={mejoraInterna.unidad} onChange={e => updateMI({ unidad: e.target.value })} style={s.select}>
                                        <option value="seg">seg</option>
                                        <option value="min">min</option>
                                        <option value="hora">hora</option>
                                        <option value="día">día</option>
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div style={s.field}>
                                <label style={s.label}>Porcentaje de mejora (% más rápido)</label>
                                <div style={{ position: "relative", maxWidth: "200px" }}>
                                    <input
                                        type="number"
                                        value={mejoraInterna.porcentaje}
                                        onChange={e => updateMI({ porcentaje: e.target.value })}
                                        style={{ ...s.input, paddingRight: "30px" }}
                                        placeholder="ej: 20"
                                        min="0"
                                    />
                                    <span style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "#6b7280", fontWeight: 700 }}>%</span>
                                </div>
                                <p style={s.guideText}>Ej: Si el servidor atiende 10 clientes/hora, un 20% de mejora lo subirá a 12 clientes/hora.</p>
                            </div>
                        )}
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

            {/* ── PARÁMETROS ADICIONALES ── */}
            <div style={s.card}>
                <p style={s.cardTitle}>Parámetros adicionales</p>

                {/* Poisson */}
                <div style={s.paramBlock}>
                    <p style={s.paramTitle}>Para Poisson — P(x)</p>
                    <div style={{ background: "#eff6ff", borderLeft: "4px solid #3b82f6", padding: "12px", borderRadius: "4px", marginBottom: "14px" }}>
                        <p style={{ margin: "0 0 6px 0", fontSize: "13px", color: "#1e3a8a", fontWeight: "600" }}>¿Para qué sirve y cómo hallarlo?</p>
                        <p style={{ margin: "0", fontSize: "12px", color: "#1e40af", lineHeight: "1.4" }}>
                            Calcula la probabilidad de que lleguen "x" clientes al sistema. En el problema, busca frases como: <em>"probabilidad de que lleguen 3 clientes"</em> o <em>"probabilidad de que lleguen más de 2 personas"</em>. <strong>La clave: habla de llegadas.</strong>
                        </p>
                    </div>
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

                {/* Exponencial */}
                <div style={s.paramBlock}>
                    <p style={s.paramTitle}>Para Exponencial — P(T ≤ t)</p>
                    <div style={{ background: "#fef2f2", borderLeft: "4px solid #ef4444", padding: "12px", borderRadius: "4px", marginBottom: "14px" }}>
                        <p style={{ margin: "0 0 6px 0", fontSize: "13px", color: "#7f1d1d", fontWeight: "600" }}>¿Para qué sirve y cómo hallarlo?</p>
                        <p style={{ margin: "0", fontSize: "12px", color: "#991b1b", lineHeight: "1.4" }}>
                            Calcula la probabilidad de que un cliente sea atendido en un tiempo "t" o menos. Busca frases como: <em>"probabilidad de que el servicio dure menos de 5 minutos"</em> o <em>"probabilidad de que sea atendido en a lo sumo 10 minutos"</em>. <strong>La clave: habla del tiempo de atención.</strong>
                        </p>
                    </div>
                    <div style={s.field}>
                        <label style={s.label}>Valor de t — tiempo límite ({uBase})</label>
                        <input type="number" value={t} onChange={e => update({ t: e.target.value })}
                            style={{ ...s.inputSm, width: 120 }} placeholder="ej: 1" min="0" step="0.1" />
                    </div>
                </div>

                {/* M/M/1 Pn */}
                <div style={s.paramBlock}>
                    {/* Condición Pn */}
                    <div style={{ marginTop: 14 }}>
                        <p style={{ ...s.paramTitle, marginBottom: 8 }}>Para la Distribución Pn (Clientes en el sistema)</p>
                        <div style={{ background: "#f0fdf4", borderLeft: "4px solid #22c55e", padding: "12px", borderRadius: "4px", marginBottom: "14px" }}>
                            <p style={{ margin: "0 0 6px 0", fontSize: "13px", color: "#14532d", fontWeight: "600" }}>¿Para qué sirve y cómo hallarlo?</p>
                            <p style={{ margin: "0", fontSize: "12px", color: "#166534", lineHeight: "1.4" }}>
                                Calcula la probabilidad de que haya exactamente "n" clientes en todo el local (los que hacen fila + el que está siendo atendido). Busca frases como: <em>"probabilidad de que haya 4 clientes en el sistema"</em> o <em>"probabilidad de que haya más de 2 personas en el lugar"</em>. <strong>La clave: habla de cantidad total de personas en el local.</strong>
                            </p>
                        </div>
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
            </div>

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
                        { label: "x", val: x || "—", color: "#374151", sub: "Poisson" },
                        { label: "t", val: t || "—", color: "#374151", sub: "Exponencial" },
                    ].map(({ label, val, color, sub }) => (
                        <div key={label} style={s.summaryItem}>
                            <span style={s.summaryLabel}>{label}</span>
                            <span style={{ ...s.summaryVal, color }}>{val}</span>
                            <span style={{ fontSize: 10, color: "#9ca3af" }}>{sub}</span>
                        </div>
                    ))}
                </div>

                {rho >= 1 && (
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
    toggleSwitch: { display: "inline-flex", alignItems: "center", cursor: "pointer" },
    toggleTrack: { width: "44px", height: "24px", borderRadius: "9999px", position: "relative", transition: "background-color 0.2s" },
    toggleThumb: { width: "20px", height: "20px", background: "#fff", borderRadius: "50%", position: "absolute", top: "2px", left: "2px", transition: "transform 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" },
};
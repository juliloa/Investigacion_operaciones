import React from "react";

const s = {
    container: {
        maxWidth: 900,
        margin: "0 auto",
        padding: "20px",
        fontFamily: "'Outfit', sans-serif",
    },
    title: {
        fontSize: 32,
        fontWeight: 800,
        color: "#1e293b",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: "#64748b",
        marginBottom: 32,
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 24,
        marginBottom: 32,
    },
    card: {
        background: "#ffffff",
        borderRadius: 16,
        padding: 24,
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 700,
        color: "#0f172a",
        marginBottom: 12,
        display: "flex",
        alignItems: "center",
        gap: 8,
    },
    iconWrap: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: 8,
    },
    text: {
        fontSize: 15,
        color: "#475569",
        lineHeight: 1.6,
        margin: 0,
    },
    list: {
        paddingLeft: 20,
        margin: "12px 0 0 0",
        color: "#475569",
        lineHeight: 1.6,
        fontSize: 15,
    },
    btn: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: "#4f7fe8",
        color: "#fff",
        border: "none",
        padding: "12px 24px",
        borderRadius: 8,
        fontSize: 15,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s",
        textDecoration: "none",
    },
    footer: {
        display: "flex",
        justifyContent: "flex-end",
        marginTop: 20,
    }
};

const ProjectIntro = ({ onNext }) => {
    return (
        <div style={s.container}>
            <h1 style={s.title}>Formulación de Proyectos</h1>
            <p style={s.subtitle}>Metodología para resolver problemas mediante la planificación de actividades.</p>

            <div style={s.grid}>
                {/* Problema y Necesidad */}
                <div style={s.card}>
                    <div style={s.cardTitle}>
                        <div style={{ ...s.iconWrap, background: "#dbeafe", color: "#2563eb" }}>
                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        1. Un problema y resolverlo
                    </div>
                    <p style={s.text}>
                        Todo proyecto nace para resolver un problema específico o mejorar una situación. 
                        <strong> ¿Qué es lo primero que se hace?</strong> Identificar y analizar las <em>necesidades</em> reales antes de proponer cualquier solución.
                    </p>
                </div>

                {/* Toma de Decisiones */}
                <div style={s.card}>
                    <div style={s.cardTitle}>
                        <div style={{ ...s.iconWrap, background: "#fce7f3", color: "#db2777" }}>
                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        2. Orden y Toma de Decisiones
                    </div>
                    <p style={s.text}>
                        Para resolver el problema, se debe desglosar el trabajo. El éxito depende del orden en que se hacen las actividades y de la toma de decisiones al subdividirlas en tareas manejables.
                    </p>
                </div>

                {/* Precedencia */}
                <div style={s.card}>
                    <div style={s.cardTitle}>
                        <div style={{ ...s.iconWrap, background: "#fef3c7", color: "#d97706" }}>
                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                        </div>
                        3. Actividad de Precedencia
                    </div>
                    <p style={s.text}>
                        No todo se puede hacer al mismo tiempo. Una <strong>actividad de precedencia</strong> es aquella que debe completarse obligatoriamente antes de que otra pueda comenzar.
                    </p>
                </div>

                {/* Esquema y Rutas */}
                <div style={s.card}>
                    <div style={s.cardTitle}>
                        <div style={{ ...s.iconWrap, background: "#dcfce3", color: "#16a34a" }}>
                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                        </div>
                        4. Red, Rutas y Esquemas
                    </div>
                    <p style={s.text}>
                        El proyecto se visualiza como una Red de Nodos.
                    </p>
                    <ul style={s.list}>
                        <li><strong>Rutas Críticas:</strong> Aquellas sin tiempo de demora (holgura cero). Si se retrasan, todo el proyecto se retrasa.</li>
                        <li><strong>Actividades Simultáneas:</strong> Tareas que pueden ejecutarse al mismo tiempo sin afectarse entre sí.</li>
                    </ul>
                </div>
            </div>

            <div style={{ ...s.card, background: "#f8fafc", border: "1px dashed #cbd5e1" }}>
                <h3 style={{ ...s.cardTitle, color: "#334155", fontSize: 16 }}>Paso a paso de cómo se haría:</h3>
                <ol style={{ ...s.list, margin: 0 }}>
                    <li>Ver las necesidades y definir el objetivo.</li>
                    <li>Listar las actividades requeridas (entre 8 y 15).</li>
                    <li>Estimar el tiempo que tomará cada actividad.</li>
                    <li>Definir las precedencias (qué va antes de qué).</li>
                    <li>Dibujar el Esquema/Red de actividades.</li>
                    <li>Calcular las rutas para encontrar la Ruta Crítica.</li>
                    <li>Mostrar que con las actividades elegidas se termina el proyecto en el tiempo estipulado.</li>
                </ol>
            </div>

            <div style={s.footer}>
                <button
                    style={s.btn}
                    onClick={onNext}
                    onMouseOver={e => e.currentTarget.style.background = "#3b6ad6"}
                    onMouseOut={e => e.currentTarget.style.background = "#4f7fe8"}
                >
                    Comenzar a formular
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default ProjectIntro;

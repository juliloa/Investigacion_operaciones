import React, { useMemo } from "react";
import ReactFlow, { Background, Controls, MarkerType } from "reactflow";
import "reactflow/dist/style.css";
import { calculateCPM } from "../../utils/cpm";

const s = {
    container: {
        maxWidth: 1100,
        margin: "0 auto",
        padding: "20px",
        fontFamily: "'Outfit', sans-serif",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 800,
        color: "#1e293b",
        margin: 0,
    },
    subtitle: {
        fontSize: 15,
        color: "#64748b",
        marginTop: 4,
    },
    btnOutline: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: "transparent",
        color: "#4f7fe8",
        border: "1px solid #4f7fe8",
        padding: "10px 20px",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s",
    },
    card: {
        background: "#ffffff",
        borderRadius: 12,
        padding: 24,
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
        marginBottom: 24,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 700,
        color: "#0f172a",
        marginBottom: 16,
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        marginTop: 16,
    },
    th: {
        background: "#f8fafc",
        padding: "12px",
        textAlign: "left",
        fontWeight: 600,
        color: "#475569",
        borderBottom: "2px solid #e2e8f0",
        fontSize: 13,
        textTransform: "uppercase",
    },
    td: {
        padding: "12px",
        borderBottom: "1px solid #e2e8f0",
        color: "#334155",
        fontSize: 14,
    },
    criticalRow: {
        background: "#fef2f2",
    },
    badge: {
        padding: "4px 8px",
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 700,
    },
    criticalBadge: {
        background: "#fee2e2",
        color: "#ef4444",
    },
    normalBadge: {
        background: "#f1f5f9",
        color: "#64748b",
    },
    summaryBox: {
        display: "flex",
        gap: 20,
        marginBottom: 24,
    },
    statBox: {
        flex: 1,
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: "16px 20px",
    },
    statLabel: {
        fontSize: 13,
        color: "#64748b",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        marginBottom: 8,
    },
    statValue: {
        fontSize: 32,
        fontWeight: 800,
        color: "#1e293b",
    },
    ganttRow: {
        display: "flex",
        alignItems: "center",
        marginBottom: 8,
    },
    ganttLabel: {
        width: 140,
        fontSize: 14,
        fontWeight: 600,
        color: "#475569",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        paddingRight: 12,
    },
    ganttTrack: {
        flex: 1,
        height: 24,
        background: "#f1f5f9",
        borderRadius: 4,
        position: "relative",
    },
    ganttBar: {
        position: "absolute",
        height: "100%",
        borderRadius: 4,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: 11,
        fontWeight: 700,
    }
};

const ProjectAnalysis = ({ data, onBack }) => {
    const activities = data?.activities || [];

    const { nodes: cpmNodes, projectDuration } = useMemo(() => calculateCPM(activities), [activities]);

    const { rfNodes, rfEdges } = useMemo(() => {
        // Compute topological depths for layout
        const depths = {};
        const depthCounts = {};
        
        cpmNodes.forEach(n => {
            let d = 0;
            if (n.precedences.length > 0) {
                d = Math.max(...n.precedences.map(p => depths[p] || 0)) + 1;
            }
            depths[n.id] = d;
            depthCounts[d] = (depthCounts[d] || 0) + 1;
        });

        const currentDepthY = {};
        const spacingX = 220;
        const spacingY = 120;

        const rfNodes = cpmNodes.map(n => {
            const d = depths[n.id];
            const indexInDepth = currentDepthY[d] || 0;
            currentDepthY[d] = indexInDepth + 1;
            
            const totalInDepth = depthCounts[d];
            const yOffset = (totalInDepth - 1) * spacingY / 2;
            
            const x = d * spacingX;
            const y = indexInDepth * spacingY - yOffset;

            return {
                id: n.id,
                position: { x, y: y + 200 }, // Center somewhat vertically
                data: { 
                    label: (
                        <div style={{ padding: "4px 8px", textAlign: "center" }}>
                            <div style={{ fontWeight: 800, fontSize: 16, color: n.isCritical ? "#ef4444" : "#1e293b" }}>{n.id}</div>
                            <div style={{ fontSize: 10, color: "#64748b" }}>Dur: {n.duration}</div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 9, borderTop: "1px solid #e2e8f0", paddingTop: 4 }}>
                                <span>ES:{n.ES}</span>
                                <span>LS:{n.LS}</span>
                            </div>
                        </div>
                    ) 
                },
                style: {
                    background: n.isCritical ? "#fef2f2" : "#ffffff",
                    border: `2px solid ${n.isCritical ? "#ef4444" : "#94a3b8"}`,
                    borderRadius: 8,
                    width: 90,
                }
            };
        });

        const rfEdges = [];
        cpmNodes.forEach(n => {
            n.precedences.forEach(pId => {
                // Determine if this edge is part of the critical path
                const parent = cpmNodes.find(pn => pn.id === pId);
                const isCriticalEdge = parent && parent.isCritical && n.isCritical;

                rfEdges.push({
                    id: `e-${pId}-${n.id}`,
                    source: pId,
                    target: n.id,
                    animated: isCriticalEdge,
                    style: { stroke: isCriticalEdge ? "#ef4444" : "#94a3b8", strokeWidth: isCriticalEdge ? 2 : 1 },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: isCriticalEdge ? "#ef4444" : "#94a3b8",
                    },
                });
            });
        });

        return { rfNodes, rfEdges };
    }, [cpmNodes]);

    return (
        <div style={s.container}>
            <div style={s.header}>
                <div>
                    <h2 style={s.title}>Red y Análisis de Rutas Críticas</h2>
                    <p style={s.subtitle}>
                        Resultados del Método de la Ruta Crítica (CPM).
                    </p>
                </div>
                <button style={s.btnOutline} onClick={onBack}>
                    Volver a Configuración
                </button>
            </div>

            <div style={s.summaryBox}>
                <div style={s.statBox}>
                    <div style={s.statLabel}>Duración Total del Proyecto</div>
                    <div style={s.statValue}>{projectDuration} <span style={{fontSize: 16, color: "#64748b", fontWeight: 500}}>días / horas</span></div>
                </div>
                <div style={s.statBox}>
                    <div style={s.statLabel}>Ruta Crítica (Cero Holgura)</div>
                    <div style={{ ...s.statValue, color: "#ef4444" }}>
                        {cpmNodes.filter(n => n.isCritical).map(n => n.id).join(" → ")}
                    </div>
                </div>
            </div>

            {/* LEYENDA DEL ESQUEMA */}
            <div style={{ background: "#f0f9ff", borderLeft: "4px solid #0284c7", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px" }}>
                <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#0369a1", fontWeight: "700" }}>¿Cómo leer este esquema de red?</p>
                <div style={{ display: "flex", gap: "24px", fontSize: "13px", color: "#0c4a6e" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: 16, height: 16, background: "#fef2f2", border: "2px solid #ef4444", borderRadius: 4 }}></div>
                        <span><strong>Rojo (Ruta Crítica):</strong> Actividades urgentes. Si se retrasan 1 día, todo el proyecto se retrasa 1 día. ¡Cero holgura!</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: 16, height: 16, background: "#ffffff", border: "2px solid #94a3b8", borderRadius: 4 }}></div>
                        <span><strong>Blanco (Normal):</strong> Actividades con tiempo de sobra (holgura). Tienen un colchón de tiempo antes de volverse urgentes.</span>
                    </div>
                </div>
            </div>

            {/* REACT FLOW NETWORK DIAGRAM */}
            <div style={{ ...s.card, height: 450, padding: 0, overflow: "hidden" }}>
                <ReactFlow 
                    nodes={rfNodes} 
                    edges={rfEdges} 
                    fitView 
                    attributionPosition="bottom-right"
                >
                    <Background color="#cbd5e1" gap={16} />
                    <Controls />
                </ReactFlow>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {/* GANTT CHART */}
                <div style={s.card}>
                    <p style={s.cardTitle}>Cronograma Visual</p>
                    <div style={{ background: "#fffbeb", borderLeft: "4px solid #f59e0b", padding: "12px", borderRadius: "6px", marginBottom: "20px" }}>
                        <p style={{ margin: "0 0 6px 0", fontSize: "13px", color: "#b45309", fontWeight: "700" }}>¿Cómo leer este cronograma?</p>
                        <p style={{ margin: "0", fontSize: "13px", color: "#92400e", lineHeight: "1.5" }}>
                            Las barras representan el tiempo que toma cada tarea. Las barras apiladas verticalmente indican <strong>actividades que se pueden hacer al mismo tiempo</strong>.<br/>
                            • <strong>Barra Roja:</strong> Tarea de la ruta crítica (no se puede retrasar).<br/>
                            • <strong>Barra Azul:</strong> Tarea normal.<br/>
                            • <strong>Línea Gris Clara:</strong> Es el "colchón de tiempo" u holgura. La barra azul puede moverse dentro de esa línea gris sin afectar la fecha final del proyecto.
                        </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        {/* Time axis markers */}
                        <div style={{ display: "flex", marginLeft: 152, marginBottom: 8, borderBottom: "1px solid #e2e8f0", paddingBottom: 4 }}>
                            {[...Array(Math.ceil(projectDuration) + 1).keys()].map(i => {
                                // Only show markers every max duration / 5 to avoid clutter if too long
                                const showMarker = projectDuration <= 20 || i % Math.ceil(projectDuration / 10) === 0;
                                return showMarker ? (
                                    <div key={i} style={{ flex: 1, fontSize: 10, color: "#94a3b8", textAlign: "left", position: "relative" }}>
                                        <div style={{ position: "absolute", left: `${(i / projectDuration) * 100}%`, transform: "translateX(-50%)" }}>{i}</div>
                                    </div>
                                ) : null;
                            })}
                        </div>

                        {cpmNodes.map(n => (
                            <div key={n.id} style={s.ganttRow}>
                                <div style={s.ganttLabel} title={n.name}>{n.id} - {n.name}</div>
                                <div style={s.ganttTrack}>
                                    <div style={{
                                        ...s.ganttBar,
                                        left: `${(n.ES / projectDuration) * 100}%`,
                                        width: `${(n.duration / projectDuration) * 100}%`,
                                        background: n.isCritical ? "#ef4444" : "#3b82f6",
                                    }}>
                                        {n.duration}
                                    </div>
                                    {/* Show slack indicator if not critical */}
                                    {!n.isCritical && n.slack > 0 && (
                                        <div style={{
                                            position: "absolute",
                                            left: `${(n.EF / projectDuration) * 100}%`,
                                            width: `${(n.slack / projectDuration) * 100}%`,
                                            height: 4,
                                            background: "#cbd5e1",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            borderRadius: 2
                                        }} title={`Holgura: ${n.slack}`}></div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    {/* ACTIVIDADES SIMULTANEAS Y RETRASOS */}
                    <div style={s.card}>
                        <p style={s.cardTitle}>Multitarea y Retrasos</p>
                        <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.6 }}>
                            <p style={{ fontWeight: 600, color: "#1e293b", marginBottom: 8 }}>¿Qué se puede hacer simultáneamente?</p>
                            <p style={{ marginBottom: 16 }}>
                                Observando el cronograma, cualquier barra que esté una encima de otra en la misma franja de tiempo significa que esas actividades <strong>se realizan en paralelo</strong>.
                                Hacerlas al mismo tiempo es lo que permite que el proyecto se termine más rápido que si hicieras todo uno por uno.
                            </p>

                            <p style={{ fontWeight: 600, color: "#1e293b", marginBottom: 8 }}>¿Qué pasa si se retrasan? ¿Joden el proyecto?</p>
                            <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
                                <li>
                                    <strong>Si es una actividad ROJA (Ruta Crítica):</strong> SÍ. Si se retrasa aunque sea un minuto, jode todo el proyecto y la fecha de entrega final se retrasa. <strong>No tienen solución directa</strong> más que contratar más gente para hacerla más rápido.
                                </li>
                                <li>
                                    <strong>Si es una actividad AZUL (Normal):</strong> NO joden el proyecto, <em>siempre y cuando</em> el retraso no supere su "colchón" de programación.
                                </li>
                            </ul>

                            <p style={{ fontWeight: 600, color: "#1e293b", marginBottom: 8 }}>¿Cuánto es el colchón exacto de programación?</p>
                            <p style={{ marginBottom: 8 }}>Aquí tienes el "colchón" (holgura) exacto de las actividades flexibles. Este es el tiempo máximo que puedes demorarte en resolver un problema antes de que arruine el proyecto:</p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {cpmNodes.filter(n => !n.isCritical).length === 0 ? (
                                    <span style={{ color: "#ef4444", fontWeight: 600 }}>¡Peligro! Todas las actividades son críticas. No hay ningún colchón de tiempo en este proyecto.</span>
                                ) : (
                                    cpmNodes.filter(n => !n.isCritical).map(n => (
                                        <div key={n.id} style={{ background: "#f1f5f9", padding: "6px 12px", borderRadius: 8, border: "1px solid #cbd5e1" }}>
                                            <strong>{n.name}:</strong> Colchón de {n.slack} unidades
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* TABLA DE RESULTADOS (Ancho Completo) */}
            <div style={s.card}>
                <p style={s.cardTitle}>Tiempos y Holguras</p>
                <div style={{ background: "#f0fdf4", borderLeft: "4px solid #22c55e", padding: "12px", borderRadius: "6px", marginBottom: "20px" }}>
                    <p style={{ margin: "0 0 6px 0", fontSize: "13px", color: "#166534", fontWeight: "700" }}>¿Qué significan estas siglas?</p>
                    <ul style={{ margin: "0", paddingLeft: "20px", fontSize: "13px", color: "#14532d", lineHeight: "1.5" }}>
                        <li><strong>ES (Inicio Temprano):</strong> Lo más pronto que puedes empezar esta tarea sin que te estorben las anteriores.</li>
                        <li><strong>EF (Fin Temprano):</strong> Lo más pronto que puedes terminarla.</li>
                        <li><strong>LS (Inicio Tardío):</strong> Lo más tarde que puedes empezarla <em>sin que se retrase el proyecto entero</em>.</li>
                        <li><strong>LF (Fin Tardío):</strong> Lo más tarde que puedes terminarla.</li>
                        <li><strong>Holgura (Colchón de tiempo):</strong> El tiempo que te "sobra". <br/>
                            👉 <em>¿Cómo se halla?</em> Restando el tiempo más tarde menos el tiempo más pronto: <strong>Holgura = LS - ES</strong> (o también <strong>LF - EF</strong>). <br/>
                            <em>Ejemplo:</em> Si lo más tarde que puedes empezar (LS) es el día 5, pero lo más pronto que puedes empezar (ES) es el día 3, tu holgura es 5 - 3 = 2 días de colchón. Si el resultado es 0, la actividad es <strong>Crítica</strong>.
                        </li>
                    </ul>
                </div>
                <div style={{ overflowX: "auto" }}>
                    <table style={s.table}>
                        <thead>
                            <tr>
                                <th style={s.th}>Actividad</th>
                                <th style={s.th}>ES (Inicio Pronto)</th>
                                <th style={s.th}>EF (Fin Pronto)</th>
                                <th style={s.th}>LS (Inicio Tarde)</th>
                                <th style={s.th}>LF (Fin Tarde)</th>
                                <th style={s.th}>Holgura (Colchón)</th>
                                <th style={s.th}>¿Es Crítica?</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cpmNodes.map(n => (
                                <tr key={n.id} style={n.isCritical ? s.criticalRow : {}}>
                                    <td style={{ ...s.td, fontWeight: 700 }}>{n.id}</td>
                                    <td style={s.td}>{n.ES}</td>
                                    <td style={s.td}>{n.EF}</td>
                                    <td style={s.td}>{n.LS}</td>
                                    <td style={s.td}>{n.LF}</td>
                                    <td style={{ ...s.td, fontWeight: 600 }}>{n.slack}</td>
                                    <td style={s.td}>
                                        <span style={{ ...s.badge, ...(n.isCritical ? s.criticalBadge : s.normalBadge) }}>
                                            {n.isCritical ? "Crítica" : "Normal"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={s.card}>
                <p style={s.cardTitle}>Conclusión y Recomendaciones Finales</p>
                <div style={{ fontSize: 15, color: "#475569", lineHeight: 1.6 }}>
                    <p>
                        Al analizar la red de dependencias, hemos determinado que <strong>tu proyecto tomará exactamente {projectDuration} unidades de tiempo</strong> para completarse. 
                    </p>
                    
                    <h4 style={{ color: "#1e293b", margin: "16px 0 8px 0" }}>La Ruta Intocable (Ruta Crítica)</h4>
                    <p>
                        Las actividades <strong>{cpmNodes.filter(n => n.isCritical).map(n => n.name).join(", ")}</strong> forman el corazón de tu proyecto. <strong>Tienen cero holgura.</strong><br/>
                        <em>¿Qué significa esto?</em> Imagina que estás haciendo un pastel. Si te retrasas en comprar la harina, todo el pastel se retrasa. De igual forma, si cualquiera de estas actividades clave se demora aunque sea 1 día, el proyecto ya no se entregará a tiempo. Tu máxima prioridad como gerente debe ser vigilar estas tareas.
                    </p>

                    <h4 style={{ color: "#1e293b", margin: "16px 0 8px 0" }}>El "Colchón" de Tiempo (Actividades con Holgura)</h4>
                    <p>
                        Las demás actividades tienen tiempo de "holgura". <br/>
                        <em>Por ejemplo:</em> Si pintar una pared tiene una holgura de 3 días, significa que, aunque debías empezar a pintar el lunes, si empiezas el martes o el miércoles, ¡el proyecto final no sufrirá retrasos! Usa estas actividades flexibles para reasignar trabajadores o recursos si la ruta crítica tiene problemas.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ProjectAnalysis;

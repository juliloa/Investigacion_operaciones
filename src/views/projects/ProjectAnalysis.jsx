import React, { useMemo, useState } from "react";
import ReactFlow, { Background, Controls, MarkerType } from "reactflow";
import "reactflow/dist/style.css";
import "./ProjectAnalysis.css";
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
    const [activeTooltip, setActiveTooltip] = useState(null);

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
                                <span>IP:{n.IP}</span>
                                <span>IL:{n.IL}</span>
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
        <div style={s.container} className="pa-container">
            <div style={s.header} className="pa-header">
                <div>
                    <h2 style={s.title}>🎯 Análisis de Rutas Críticas - PERT/CPM</h2>
                    <p style={s.subtitle}>
                        Visualización completa del Método de la Ruta Crítica
                    </p>
                </div>
                <button style={s.btnOutline} onClick={onBack}>
                    ← Volver
                </button>
            </div>

            {/* CONCEPTOS PERT-CPM CON ANÁLISIS */}
            <div style={s.card} className="pa-card">
                <p style={s.cardTitle}>📚 Conceptos PERT-CPM - Pasa sobre cada elemento para ver análisis</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                    {/* IP - Inicio Próximo */}
                    <div 
                        style={{
                            background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                            border: '2px solid #3b82f6',
                            padding: 20,
                            borderRadius: 12,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            position: 'relative'
                        }}
                        onMouseEnter={() => setActiveTooltip('IP')}
                        onMouseLeave={() => setActiveTooltip(null)}
                        className="pa-concept-card"
                    >
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#1e40af', marginBottom: 8 }}>IP</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1e3a8a', marginBottom: 8 }}>
                            Inicio Próximo
                        </div>
                        <div style={{ fontSize: 12, color: '#1e40af', lineHeight: 1.6 }}>
                            El tiempo más cercano en que puede empezar una actividad, suponiendo que todas las actividades precedentes han sido completadas.
                        </div>
                        {activeTooltip === 'IP' && (
                            <div style={{
                                position: 'absolute',
                                top: -120,
                                left: 0,
                                right: 0,
                                background: '#1e293b',
                                color: '#fff',
                                padding: 12,
                                borderRadius: 8,
                                fontSize: 12,
                                zIndex: 1000,
                                animation: 'slideInUp 0.3s ease-out'
                            }}>
                                <strong>Fórmula:</strong> Si tiene precedentes, IP = máximo TP de precedentes; si no, IP = 0
                                <div style={{ marginTop: 8, color: '#60a5fa' }}>Ejemplo: Una tarea que empieza cuando la anterior termina</div>
                            </div>
                        )}
                    </div>

                    {/* TP - Terminación Próxima */}
                    <div 
                        style={{
                            background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                            border: '2px solid #3b82f6',
                            padding: 20,
                            borderRadius: 12,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            position: 'relative'
                        }}
                        onMouseEnter={() => setActiveTooltip('TP')}
                        onMouseLeave={() => setActiveTooltip(null)}
                        className="pa-concept-card"
                    >
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#1e40af', marginBottom: 8 }}>TP</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1e3a8a', marginBottom: 8 }}>
                            Terminación Próxima
                        </div>
                        <div style={{ fontSize: 12, color: '#1e40af', lineHeight: 1.6 }}>
                            El tiempo más cercano en que una actividad puede terminar. Es lo más pronto que puede finalizar.
                        </div>
                        {activeTooltip === 'TP' && (
                            <div style={{
                                position: 'absolute',
                                top: -120,
                                left: 0,
                                right: 0,
                                background: '#1e293b',
                                color: '#fff',
                                padding: 12,
                                borderRadius: 8,
                                fontSize: 12,
                                zIndex: 1000,
                                animation: 'slideInUp 0.3s ease-out'
                            }}>
                                <strong>Fórmula:</strong> TP = IP + Duración
                                <div style={{ marginTop: 8, color: '#60a5fa' }}>Ejemplo: Si IP=5 y duración=3, entonces TP=8</div>
                            </div>
                        )}
                    </div>

                    {/* IL - Inicio Lejano */}
                    <div 
                        style={{
                            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                            border: '2px solid #ef4444',
                            padding: 20,
                            borderRadius: 12,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            position: 'relative'
                        }}
                        onMouseEnter={() => setActiveTooltip('IL')}
                        onMouseLeave={() => setActiveTooltip(null)}
                        className="pa-concept-card"
                    >
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#7f1d1d', marginBottom: 8 }}>IL</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#991b1b', marginBottom: 8 }}>
                            Inicio Lejano
                        </div>
                        <div style={{ fontSize: 12, color: '#7f1d1d', lineHeight: 1.6 }}>
                            El tiempo más lejano en que una actividad puede comenzar SIN retrasar el proyecto completo.
                        </div>
                        {activeTooltip === 'IL' && (
                            <div style={{
                                position: 'absolute',
                                top: -120,
                                left: 0,
                                right: 0,
                                background: '#1e293b',
                                color: '#fff',
                                padding: 12,
                                borderRadius: 8,
                                fontSize: 12,
                                zIndex: 1000,
                                animation: 'slideInUp 0.3s ease-out'
                            }}>
                                <strong>Fórmula:</strong> IL = TL - Duración
                                <div style={{ marginTop: 8, color: '#fca5a5' }}>Es el "último momento" en que puedes empezar la tarea</div>
                            </div>
                        )}
                    </div>

                    {/* TL - Terminación Lejana */}
                    <div 
                        style={{
                            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                            border: '2px solid #ef4444',
                            padding: 20,
                            borderRadius: 12,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            position: 'relative'
                        }}
                        onMouseEnter={() => setActiveTooltip('TL')}
                        onMouseLeave={() => setActiveTooltip(null)}
                        className="pa-concept-card"
                    >
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#7f1d1d', marginBottom: 8 }}>TL</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#991b1b', marginBottom: 8 }}>
                            Terminación Lejana
                        </div>
                        <div style={{ fontSize: 12, color: '#7f1d1d', lineHeight: 1.6 }}>
                            El tiempo más lejano en que una actividad puede terminar sin retrasar el proyecto.
                        </div>
                        {activeTooltip === 'TL' && (
                            <div style={{
                                position: 'absolute',
                                top: -120,
                                left: 0,
                                right: 0,
                                background: '#1e293b',
                                color: '#fff',
                                padding: 12,
                                borderRadius: 8,
                                fontSize: 12,
                                zIndex: 1000,
                                animation: 'slideInUp 0.3s ease-out'
                            }}>
                                <strong>Se calcula en el recorrido hacia atrás</strong>
                                <div style={{ marginTop: 8, color: '#fca5a5' }}>Si tiene sucesores, TL = mínimo IL de sucesores</div>
                            </div>
                        )}
                    </div>

                    {/* H - Holgura */}
                    <div 
                        style={{
                            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                            border: '2px solid #22c55e',
                            padding: 20,
                            borderRadius: 12,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            position: 'relative'
                        }}
                        onMouseEnter={() => setActiveTooltip('H')}
                        onMouseLeave={() => setActiveTooltip(null)}
                        className="pa-concept-card"
                    >
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#166534', marginBottom: 8 }}>H</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#15803d', marginBottom: 8 }}>
                            Holgura (Slack)
                        </div>
                        <div style={{ fontSize: 12, color: '#166534', lineHeight: 1.6 }}>
                            El período que una actividad se puede demorar sin provocar retrasos en todo el proyecto.
                        </div>
                        {activeTooltip === 'H' && (
                            <div style={{
                                position: 'absolute',
                                top: -120,
                                left: 0,
                                right: 0,
                                background: '#1e293b',
                                color: '#fff',
                                padding: 12,
                                borderRadius: 8,
                                fontSize: 12,
                                zIndex: 1000,
                                animation: 'slideInUp 0.3s ease-out'
                            }}>
                                <strong>Fórmula:</strong> H = IL - IP = TL - TP
                                <div style={{ marginTop: 8, color: '#86efac' }}>Si H=0 → Crítica. Si H&gt;0 → Con margen</div>
                            </div>
                        )}
                    </div>

                    {/* Ruta Crítica */}
                    <div 
                        style={{
                            background: 'linear-gradient(135deg, #f5d4d4 0%, #eb9999 100%)',
                            border: '3px solid #dc2626',
                            padding: 20,
                            borderRadius: 12,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            position: 'relative'
                        }}
                        onMouseEnter={() => setActiveTooltip('CRITICA')}
                        onMouseLeave={() => setActiveTooltip(null)}
                        className="pa-concept-card"
                    >
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#991b1b', marginBottom: 8 }}>🔴</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#991b1b', marginBottom: 8 }}>
                            Actividad Crítica
                        </div>
                        <div style={{ fontSize: 12, color: '#7f1d1d', lineHeight: 1.6 }}>
                            Actividad donde la Holgura = 0. Si se retrasa, retrasa TODO el proyecto.
                        </div>
                        {activeTooltip === 'CRITICA' && (
                            <div style={{
                                position: 'absolute',
                                top: -140,
                                left: 0,
                                right: 0,
                                background: '#1e293b',
                                color: '#fff',
                                padding: 12,
                                borderRadius: 8,
                                fontSize: 12,
                                zIndex: 1000,
                                animation: 'slideInUp 0.3s ease-out'
                            }}>
                                <strong>⚠️ PUNTO FOCAL DEL PROYECTO</strong>
                                <div style={{ marginTop: 8, color: '#fca5a5' }}>• IP = IL (sin margen antes)</div>
                                <div style={{ color: '#fca5a5' }}>• TP = TL (sin margen después)</div>
                                <div style={{ marginTop: 6, color: '#fca5a5' }}>Las actividades críticas conectadas forman la RUTA CRÍTICA</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div style={s.summaryBox} className="pa-statistic-row">
                <div style={{ ...s.statBox, background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)', borderColor: '#4f7fe8' }} 
                     className="pa-stat-box pa-stat-item">
                    <div style={s.statLabel} className="pa-stat-label">⏱️ Duración Total</div>
                    <div style={{ ...s.statValue, color: '#4f7fe8' }} className="pa-stat-number">{projectDuration}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>unidades de tiempo</div>
                </div>
                <div style={{ ...s.statBox, background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', borderColor: '#ef4444' }} 
                     className="pa-stat-box pa-stat-item critical">
                    <div style={s.statLabel} className="pa-stat-label">🔴 Ruta Crítica</div>
                    <div style={{ ...s.statValue, color: '#ef4444', fontSize: 24 }} className="pa-stat-number">
                        {cpmNodes.filter(n => n.isCritical).map(n => n.id).join(" → ")}
                    </div>
                </div>
                <div style={{ ...s.statBox, background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', borderColor: '#22c55e' }} 
                     className="pa-stat-box pa-stat-item">
                    <div style={s.statLabel} className="pa-stat-label">✅ Actividades Normales</div>
                    <div style={{ ...s.statValue, color: '#22c55e' }} className="pa-stat-number">
                        {cpmNodes.filter(n => !n.isCritical).length}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>con holgura disponible</div>
                </div>
            </div>

            {/* LEYENDA DEL ESQUEMA */}
            <div className="pa-info-box pa-info-box-info">
                <p style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#0369a1", fontWeight: "700" }}>📊 ¿Cómo leer este esquema de red?</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", fontSize: "13px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                        <div style={{ width: 20, height: 20, background: "#fef2f2", border: "3px solid #ef4444", borderRadius: 4, flexShrink: 0, marginTop: 2 }}></div>
                        <div>
                            <strong style={{ color: '#0369a1' }}>Rojo (Ruta Crítica):</strong> 
                            <p style={{ margin: '4px 0 0 0', color: '#0c4a6e' }}>Actividades urgentes. Si se retrasan, TODO el proyecto se retrasa. ¡Cero holgura!</p>
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                        <div style={{ width: 20, height: 20, background: "#ffffff", border: "3px solid #94a3b8", borderRadius: 4, flexShrink: 0, marginTop: 2 }}></div>
                        <div>
                            <strong style={{ color: '#0369a1' }}>Blanco (Normal):</strong>
                            <p style={{ margin: '4px 0 0 0', color: '#0c4a6e' }}>Actividades con tiempo de sobra (holgura). Tienen un colchón de tiempo antes de volverse críticas.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* GRÁFICO COMPARATIVO */}
            <div style={s.card} className="pa-card">
                <p style={s.cardTitle}>📈 Comparación: Duración vs Holgura</p>
                <div className="pa-chart-container">
                    {cpmNodes.map((n, idx) => {
                        const maxDuration = Math.max(...cpmNodes.map(node => node.duration));
                        const maxSlack = Math.max(...cpmNodes.map(node => node.H), 1);
                        const durationHeight = (n.duration / maxDuration) * 150;
                        const slackHeight = (n.H / maxSlack) * 150;
                        
                        return (
                            <div key={n.id} className="pa-chart-item" style={{ animation: `slideInUp 0.6s ease-out ${idx * 0.1}s backwards` }}>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 160, minWidth: 60 }}>
                                    <div 
                                        className="pa-chart-bar"
                                        style={{
                                            width: 24,
                                            height: durationHeight,
                                            background: n.isCritical ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                                            borderRadius: '4px 4px 0 0',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease'
                                        }}
                                        title={`Duración: ${n.duration}`}
                                    />
                                    {n.H > 0 && (
                                        <div 
                                            className="pa-chart-bar"
                                            style={{
                                                width: 24,
                                                height: slackHeight,
                                                background: 'linear-gradient(135deg, #cbd5e1, #94a3b8)',
                                                borderRadius: '4px 4px 0 0',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease'
                                            }}
                                            title={`Holgura: ${n.H}`}
                                        />
                                    )}
                                </div>
                                <div className="pa-chart-item-label">{n.id}</div>
                                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
                                    D:{n.duration} H:{n.H}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div style={{ marginTop: 16, padding: 12, background: '#f8fafc', borderRadius: 8, fontSize: 13, color: '#475569' }}>
                    <strong>Leyenda:</strong> Barras azules/rojas = Duración | Barras grises = Holgura | Altura proporcional a los valores
                </div>
            </div>

            {/* REACT FLOW NETWORK DIAGRAM */}
            <div style={{ ...s.card, height: 450, padding: 0, overflow: "hidden" }} className="pa-card pa-network-container">
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
                <div style={s.card} className="pa-card">
                    <p style={s.cardTitle}>📅 Cronograma Visual (Gantt)</p>
                    <div className="pa-info-box pa-info-box-warning">
                        <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#b45309", fontWeight: "700" }}>💡 ¿Cómo leer este cronograma?</p>
                        <ul style={{ margin: "0", paddingLeft: 20, fontSize: "12px", color: "#92400e", lineHeight: "1.6" }}>
                            <li><strong>Barra Roja:</strong> Tarea crítica (no se puede retrasar)</li>
                            <li><strong>Barra Azul:</strong> Tarea normal con tiempo libre</li>
                            <li><strong>Línea Gris:</strong> "Colchón de tiempo" u holgura</li>
                        </ul>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        {/* Time axis markers */}
                        <div style={{ display: "flex", marginLeft: 160, marginBottom: 12, borderBottom: "2px solid #cbd5e1", paddingBottom: 8 }}>
                            {[...Array(Math.ceil(projectDuration) + 1).keys()].map(i => {
                                const showMarker = projectDuration <= 20 || i % Math.ceil(projectDuration / 10) === 0;
                                return showMarker ? (
                                    <div key={i} style={{ flex: 1, fontSize: 11, color: "#94a3b8", textAlign: "left", position: "relative", fontWeight: 600 }}>
                                        <div style={{ position: "absolute", left: `${(i / projectDuration) * 100}%`, transform: "translateX(-50%)" }}>{i}</div>
                                    </div>
                                ) : null;
                            })}
                        </div>

                        {cpmNodes.map((n, idx) => (
                            <div key={n.id} style={{ ...s.ganttRow, animation: `slideInUp 0.6s ease-out ${idx * 0.08}s backwards` }} className="pa-table-row">
                                <div style={{ ...s.ganttLabel, fontWeight: 700, color: n.isCritical ? '#ef4444' : '#1e293b' }} title={n.name}>
                                    {n.id}
                                </div>
                                <div style={s.ganttTrack}>
                                    <div 
                                        className="pa-gantt-bar"
                                        style={{
                                            ...s.ganttBar,
                                            left: `${(n.IP / projectDuration) * 100}%`,
                                            width: `${(n.duration / projectDuration) * 100}%`,
                                            background: n.isCritical ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                                            boxShadow: n.isCritical ? '0 4px 12px rgba(239, 68, 68, 0.3)' : '0 4px 8px rgba(59, 130, 246, 0.2)'
                                        }}
                                        title={`${n.name}: ${n.duration} unidades`}
                                    >
                                        {n.duration}
                                    </div>
                                    {!n.isCritical && n.H > 0 && (
                                        <div style={{
                                            position: "absolute",
                                            left: `${(n.TP / projectDuration) * 100}%`,
                                            width: `${(n.H / projectDuration) * 100}%`,
                                            height: 4,
                                            background: "#cbd5e1",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            borderRadius: 2,
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease'
                                        }} title={`Holgura: ${n.H}`} 
                                        onMouseEnter={(e) => e.target.style.background = '#94a3b8'}
                                        onMouseLeave={(e) => e.target.style.background = '#cbd5e1'}
                                        ></div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    {/* ACTIVIDADES SIMULTANEAS Y RETRASOS */}
                    <div style={s.card} className="pa-card">
                        <p style={s.cardTitle}>⚠️ Riesgos y Flexibilidad</p>
                        <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.7 }}>
                            <div style={{ marginBottom: 20 }}>
                                <p style={{ fontWeight: 700, color: "#1e293b", marginBottom: 10, fontSize: 15 }}>🎯 Actividades Críticas (Rojo)</p>
                                <div className="pa-list-item" style={{ background: '#fee2e2', borderLeft: '4px solid #ef4444', paddingLeft: 12 }}>
                                    ⚡ Si se retrasan <strong>aunque sea 1 minuto</strong>, TODO el proyecto se retrasa.
                                </div>
                                <div className="pa-list-item" style={{ background: '#fee2e2', borderLeft: '4px solid #ef4444', paddingLeft: 12 }}>
                                    ❌ No hay solución directa. Solo: contratar más gente, eliminar tareas, o cambiar especificaciones.
                                </div>
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <p style={{ fontWeight: 700, color: "#1e293b", marginBottom: 10, fontSize: 15 }}>✅ Actividades Normales (Azul)</p>
                                <div className="pa-list-item" style={{ background: '#f0fdf4', borderLeft: '4px solid #22c55e', paddingLeft: 12 }}>
                                    💪 Tienen un "colchón" de tiempo (holgura). Pueden retrasarse <strong>sin afectar el proyecto</strong>.
                                </div>
                                <div className="pa-list-item" style={{ background: '#f0fdf4', borderLeft: '4px solid #22c55e', paddingLeft: 12 }}>
                                    🔄 Usa estas tareas para reasignar recursos si las críticas tienen problemas.
                                </div>
                            </div>

                            <div>
                                <p style={{ fontWeight: 700, color: "#1e293b", marginBottom: 12, fontSize: 15 }}>📊 Tu "Colchón" de Tiempo Exacto</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                    {cpmNodes.filter(n => !n.isCritical).length === 0 ? (
                                        <div className="pa-critical-badge" style={{ background: '#fee2e2', color: '#991b1b', width: '100%', textAlign: 'center', padding: 12 }}>
                                            ⚠️ ¡CUIDADO! Todas las actividades son críticas. NO HAY colchón de tiempo en este proyecto.
                                        </div>
                                    ) : (
                                        cpmNodes.filter(n => !n.isCritical).map((n, idx) => (
                                            <div 
                                                key={n.id} 
                                                className="pa-badge"
                                                style={{ 
                                                    background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', 
                                                    padding: "10px 14px", 
                                                    borderRadius: 8, 
                                                    border: '1px solid #60a5fa',
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    color: '#1e40af',
                                                    animation: `slideInLeft 0.5s ease-out ${idx * 0.1}s backwards`
                                                }}
                                                title={`${n.name}: Puedes demorar hasta ${n.H} unidades`}
                                            >
                                                <strong>{n.id}:</strong> +{n.H} unidades
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* TABLA DE RESULTADOS (Ancho Completo) */}
            <div style={s.card} className="pa-card">
                <p style={s.cardTitle}>📋 Tabla Completa: Tiempos y Holguras - PASA SOBRE COLUMNAS PARA ANÁLISIS</p>
                <div className="pa-info-box pa-info-box-success">
                    <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#166534", fontWeight: "700" }}>📚 Legenda de Siglas PERT-CPM</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12, fontSize: "12px", color: "#14532d" }}>
                        <div><strong>IP:</strong> Inicio más Próximo (cuándo puedes empezar)</div>
                        <div><strong>TP:</strong> Terminación más Próxima = IP + Duración</div>
                        <div><strong>IL:</strong> Inicio más Lejano (lo más tarde que puedes empezar)</div>
                        <div><strong>TL:</strong> Terminación más Lejana (lo más tarde que puedes terminar)</div>
                        <div><strong>H:</strong> Holgura = IL - IP = TL - TP</div>
                        <div><strong>🔴 Crítica:</strong> H = 0 (sin margen de error)</div>
                    </div>
                </div>
                <div className="pa-table-wrapper">
                    <table className="pa-table">
                        <thead>
                            <tr>
                                <th style={s.th}>ID</th>
                                <th style={s.th}>Actividad</th>
                                <th style={s.th}>Duración</th>
                                <th 
                                    style={{...s.th, cursor: 'pointer', position: 'relative'}}
                                    title="Tiempo más cercano en que puede empezar esta actividad"
                                    onMouseEnter={(e) => {
                                        e.target.style.background = '#4f7fe8';
                                        e.target.style.color = 'white';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = '#f8fafc';
                                        e.target.style.color = '#475569';
                                    }}
                                >
                                    IP ℹ️
                                </th>
                                <th 
                                    style={{...s.th, cursor: 'pointer'}}
                                    title="Tiempo más cercano en que esta actividad puede terminar (IP + Duración)"
                                    onMouseEnter={(e) => {
                                        e.target.style.background = '#4f7fe8';
                                        e.target.style.color = 'white';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = '#f8fafc';
                                        e.target.style.color = '#475569';
                                    }}
                                >
                                    TP ℹ️
                                </th>
                                <th 
                                    style={{...s.th, cursor: 'pointer'}}
                                    title="Tiempo más lejano en que puede empezar SIN retrasar el proyecto"
                                    onMouseEnter={(e) => {
                                        e.target.style.background = '#ef4444';
                                        e.target.style.color = 'white';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = '#f8fafc';
                                        e.target.style.color = '#475569';
                                    }}
                                >
                                    IL ℹ️
                                </th>
                                <th 
                                    style={{...s.th, cursor: 'pointer'}}
                                    title="Tiempo más lejano en que puede terminar SIN retrasar el proyecto"
                                    onMouseEnter={(e) => {
                                        e.target.style.background = '#ef4444';
                                        e.target.style.color = 'white';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = '#f8fafc';
                                        e.target.style.color = '#475569';
                                    }}
                                >
                                    TL ℹ️
                                </th>
                                <th 
                                    style={{...s.th, cursor: 'pointer'}}
                                    title="Período que puede demorar SIN afectar el proyecto (IL - IP)"
                                    onMouseEnter={(e) => {
                                        e.target.style.background = '#22c55e';
                                        e.target.style.color = 'white';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = '#f8fafc';
                                        e.target.style.color = '#475569';
                                    }}
                                >
                                    H ℹ️
                                </th>
                                <th style={s.th}>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cpmNodes.map((n, idx) => (
                                <tr 
                                    key={n.id} 
                                    className={`pa-table-row ${n.isCritical ? 'pa-critical-row' : ''}`}
                                    style={{
                                        ...( n.isCritical ? s.criticalRow : {}),
                                        animation: `slideInUp 0.6s ease-out ${idx * 0.05}s backwards`
                                    }}
                                    title={n.isCritical ? '🔴 ACTIVIDAD CRÍTICA - Si se retrasa, retrasa TODO' : '✅ Actividad normal con flexibilidad'}
                                >
                                    <td style={{ ...s.td, fontWeight: 800, color: n.isCritical ? '#ef4444' : '#4f7fe8', fontSize: 16 }}>
                                        {n.id}
                                    </td>
                                    <td style={{ ...s.td, fontWeight: 600 }}>{n.name}</td>
                                    <td style={{ ...s.td, textAlign: 'center', fontWeight: 600 }}>{n.duration}</td>
                                    <td style={{ ...s.td, textAlign: 'center', background: n.isCritical ? '#f0f9ff' : '#f8fafc' }} title={`Lo más pronto: ${n.IP}`}>
                                        <strong style={{ color: '#1e40af' }}>{n.IP}</strong>
                                        <div style={{ fontSize: 10, color: '#64748b' }}>más pronto</div>
                                    </td>
                                    <td style={{ ...s.td, textAlign: 'center', background: n.isCritical ? '#f0f9ff' : '#f8fafc' }} title={`Termina en: ${n.TP} (= ${n.IP} + ${n.duration})`}>
                                        <strong style={{ color: '#1e40af' }}>{n.TP}</strong>
                                        <div style={{ fontSize: 10, color: '#64748b' }}>= IP + {n.duration}</div>
                                    </td>
                                    <td style={{ ...s.td, textAlign: 'center', background: n.isCritical ? '#fef2f2' : '#f8fafc' }} title={`Lo más tarde para empezar: ${n.IL}`}>
                                        <strong style={{ color: '#991b1b' }}>{n.IL}</strong>
                                        <div style={{ fontSize: 10, color: '#64748b' }}>lo más tarde</div>
                                    </td>
                                    <td style={{ ...s.td, textAlign: 'center', background: n.isCritical ? '#fef2f2' : '#f8fafc' }} title={`Debe terminar antes de: ${n.TL}`}>
                                        <strong style={{ color: '#991b1b' }}>{n.TL}</strong>
                                        <div style={{ fontSize: 10, color: '#64748b' }}>{n.TL} máximo</div>
                                    </td>
                                    <td style={{ ...s.td, textAlign: 'center', fontWeight: 700, color: n.isCritical ? '#ef4444' : '#22c55e', fontSize: 16 }} title={`Holgura = ${n.IL} - ${n.IP} = ${n.H}`}>
                                        {n.H}
                                        <div style={{ fontSize: 10, color: n.isCritical ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
                                            {n.isCritical ? 'Crítica' : `+${n.H} margen`}
                                        </div>
                                    </td>
                                    <td style={s.td}>
                                        {n.isCritical ? (
                                            <span className="pa-critical-badge" title="Si esta actividad se retrasa, TODO el proyecto se retrasa">
                                                🔴 CRÍTICA
                                            </span>
                                        ) : (
                                            <span className="pa-normal-badge" title={`Puedes demorar hasta ${n.H} unidades sin afectar el proyecto`}>
                                                ✅ Normal
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={s.card} className="pa-card">
                <p style={s.cardTitle}>🎯 ¿Qué es la Ruta Crítica?</p>
                <div style={{ fontSize: 15, color: "#475569", lineHeight: 1.9 }}>
                    <div className="pa-timeline">
                        <div className="pa-timeline-item">
                            <strong style={{ color: "#1e293b", fontSize: 16 }}>📌 Definición</strong>
                            <p style={{ margin: '8px 0 0 0' }}>
                                La <strong>Ruta Crítica</strong> es la secuencia de actividades que determina la <strong>duración TOTAL del proyecto</strong>. 
                                Es el camino más largo en tu red de tareas.
                            </p>
                        </div>

                        <div className="pa-timeline-item">
                            <strong style={{ color: "#1e293b", fontSize: 16 }}>🤔 ¿Por qué importa?</strong>
                            <p style={{ margin: '8px 0 0 0' }}>
                                Imagina que construyes una casa. No puedes pintar paredes sin haberlas construido primero.
                                De todas las secuencias de tareas posibles, la más larga determina cuándo termina TODO el proyecto.
                            </p>
                        </div>

                        <div className="pa-timeline-item">
                            <strong style={{ color: "#1e293b", fontSize: 16 }}>⚙️ ¿Cómo se calcula?</strong>
                            <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
                                <li><strong>Recorrido hacia adelante:</strong> Calcula IP y TP desde inicio a fin</li>
                                <li><strong>Recorrido hacia atrás:</strong> Calcula IL, TL y Holgura desde fin a inicio</li>
                                <li><strong>Identifica críticas:</strong> Actividades con H = 0 forman la ruta crítica</li>
                            </ul>
                        </div>

                        <div className="pa-timeline-item pa-timeline-critical">
                            <strong style={{ color: "#ef4444", fontSize: 16 }}>🔴 Actividades Críticas</strong>
                            <p style={{ margin: '8px 0 0 0' }}>
                                Tienen <strong>Holgura = 0</strong>. <strong>Si se retrasan, el proyecto se retrasa.</strong> 
                                Cero margin de error. Son el punto focal para el gerente de proyecto.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div style={s.card} className="pa-card">
                <p style={s.cardTitle}>✅ Conclusión y Plan de Acción</p>
                <div style={{ fontSize: 15, color: "#475569", lineHeight: 1.8 }}>
                    <div style={{ background: 'linear-gradient(135deg, #e0e7ff 0%, #f0f9ff 100%)', padding: 20, borderRadius: 12, marginBottom: 20 }}>
                        <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#4f7fe8' }}>
                            ⏱️ Duración Total del Proyecto: <strong>{projectDuration}</strong> unidades de tiempo
                        </p>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <p style={{ fontWeight: 700, color: "#1e293b", marginBottom: 12, fontSize: 16 }}>
                            🔴 Ruta Intocable (Actividades Críticas)
                        </p>
                        <div style={{ background: '#fee2e2', padding: 16, borderRadius: 8, borderLeft: '4px solid #ef4444' }}>
                            <p style={{ margin: 0, fontWeight: 600, color: '#7f1d1d' }}>
                                {cpmNodes.filter(n => n.isCritical).map(n => n.id).join(" → ")}
                            </p>
                            <p style={{ margin: '8px 0 0 0', fontSize: 14, color: '#991b1b' }}>
                                Estas {cpmNodes.filter(n => n.isCritical).length} actividades son <strong>INTOCABLES</strong>. 
                                Si cualquiera se retrasa, todo se retrasa.
                                Monitoréalas constantemente. Asigna tu mejor equipo aquí.
                            </p>
                        </div>
                    </div>

                    <div>
                        <p style={{ fontWeight: 700, color: "#1e293b", marginBottom: 12, fontSize: 16 }}>
                            💪 Actividades Flexibles (Con Holgura)
                        </p>
                        {cpmNodes.filter(n => !n.isCritical).length === 0 ? (
                            <div style={{ background: '#fef2f2', padding: 16, borderRadius: 8, borderLeft: '4px solid #ef4444', color: '#991b1b', fontWeight: 600 }}>
                                ⚠️ ¡ALERTA! NO hay actividades con holgura. Todas las tareas son críticas. Este proyecto es de MÁXIMO RIESGO.
                            </div>
                        ) : (
                            <div style={{ background: '#f0fdf4', padding: 16, borderRadius: 8, borderLeft: '4px solid #22c55e' }}>
                                <p style={{ margin: '0 0 12px 0', color: '#166534', fontWeight: 600 }}>
                                    Usa estas actividades como "amortiguadores". Si algo falla en la ruta crítica, puedes reasignar recursos aquí:
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                                    {cpmNodes.filter(n => !n.isCritical).map(n => (
                                        <div 
                                            key={n.id}
                                            className="pa-badge"
                                            style={{
                                                background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                                                border: '1px solid #86efac',
                                                padding: 12,
                                                borderRadius: 8,
                                                color: '#166534'
                                            }}
                                        >
                                            <strong>{n.id}:</strong> {n.name}
                                            <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>
                                                Colchón: {n.H} unidades
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectAnalysis;

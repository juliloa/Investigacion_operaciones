import React, { useState } from "react";

const s = {
    container: {
        maxWidth: 1000,
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
    table: {
        width: "100%",
        borderCollapse: "separate",
        borderSpacing: "0 8px",
    },
    th: {
        textAlign: "left",
        padding: "0 16px 8px 16px",
        color: "#64748b",
        fontWeight: 600,
        fontSize: 13,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    },
    tr: {
        background: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        borderRadius: 8,
    },
    td: {
        padding: "16px",
        borderTop: "1px solid #f1f5f9",
        borderBottom: "1px solid #f1f5f9",
    },
    tdFirst: {
        borderLeft: "1px solid #f1f5f9",
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: 8,
        fontWeight: 700,
        color: "#2563eb",
        width: 60,
        textAlign: "center",
    },
    tdLast: {
        borderRight: "1px solid #f1f5f9",
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
        width: 60,
        textAlign: "center",
    },
    input: {
        width: "100%",
        padding: "8px 12px",
        border: "1px solid #cbd5e1",
        borderRadius: 6,
        fontSize: 14,
        fontFamily: "inherit",
        outline: "none",
        transition: "border-color 0.2s",
    },
    select: {
        width: "100%",
        padding: "8px 12px",
        border: "1px solid #cbd5e1",
        borderRadius: 6,
        fontSize: 14,
        fontFamily: "inherit",
        outline: "none",
        background: "#fff",
        cursor: "pointer",
        minHeight: 38,
    },
    btn: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: "#4f7fe8",
        color: "#fff",
        border: "none",
        padding: "10px 20px",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s",
    },
    btnOutline: {
        background: "transparent",
        color: "#4f7fe8",
        border: "1px solid #4f7fe8",
    },
    btnDanger: {
        background: "#fee2e2",
        color: "#ef4444",
        border: "none",
        padding: "6px",
        borderRadius: 6,
        cursor: "pointer",
    },
    footer: {
        display: "flex",
        justifyContent: "space-between",
        marginTop: 32,
        paddingTop: 24,
        borderTop: "1px solid #e2e8f0",
    },
    errorBox: {
        background: "#fef2f2",
        color: "#991b1b",
        padding: "12px 16px",
        borderRadius: 8,
        marginBottom: 20,
        fontSize: 14,
        display: "flex",
        alignItems: "center",
        gap: 8,
        borderLeft: "4px solid #ef4444",
    }
};

const ProjectInput = ({ data, setData, onNext, onBack }) => {
    const [error, setError] = useState("");

    const activities = data.activities || [];

    const handleAdd = () => {
        if (activities.length >= 15) {
            setError("El máximo permitido es 15 actividades.");
            return;
        }
        // Generate next ID (A, B, C...)
        const nextChar = String.fromCharCode(65 + activities.length);
        const newAct = {
            id: nextChar,
            name: `Actividad ${nextChar}`,
            duration: 1,
            precedences: []
        };
        setData({ ...data, activities: [...activities, newAct] });
        setError("");
    };

    const handleRemove = (index) => {
        if (activities.length <= 8) {
            setError("El mínimo requerido es de 8 actividades.");
            return;
        }
        const newActs = [...activities];
        const removedId = newActs[index].id;
        newActs.splice(index, 1);

        // Remove references to the deleted ID
        newActs.forEach(act => {
            act.precedences = act.precedences.filter(p => p !== removedId);
        });

        // Re-assign IDs to keep them sequential A, B, C...
        newActs.forEach((act, i) => {
            const newId = String.fromCharCode(65 + i);
            // We need to update precedences that pointed to the old ID... 
            // Actually, reassigning IDs is complex if they depend on them.
            // Better to just not re-assign IDs, or if we do, update all references.
            // For simplicity, let's just update all references.
            const oldId = act.id;
            act.id = newId;
            newActs.forEach(otherAct => {
                const pIndex = otherAct.precedences.indexOf(oldId);
                if (pIndex !== -1) {
                    otherAct.precedences[pIndex] = newId;
                }
            });
        });

        setData({ ...data, activities: newActs });
        setError("");
    };

    const updateAct = (index, field, value) => {
        const newActs = [...activities];
        newActs[index][field] = value;
        setData({ ...data, activities: newActs });
        setError("");
    };

    const togglePrecedence = (index, precId) => {
        const newActs = [...activities];
        const act = newActs[index];
        if (act.precedences.includes(precId)) {
            act.precedences = act.precedences.filter(p => p !== precId);
        } else {
            act.precedences.push(precId);
        }
        setData({ ...data, activities: newActs });
        setError("");
    };

    const validateAndNext = () => {
        if (activities.length < 8) {
            setError("Debes ingresar al menos 8 actividades.");
            return;
        }
        if (activities.length > 15) {
            setError("No puedes tener más de 15 actividades.");
            return;
        }
        
        // Basic validation: Check if there's at least one starting node (no precedences)
        const hasStart = activities.some(a => a.precedences.length === 0);
        if (!hasStart) {
            setError("Debe haber al menos una actividad inicial (sin precedencias).");
            return;
        }

        // Check for empty durations or negative durations
        const invalidDuration = activities.some(a => !a.duration || a.duration <= 0);
        if (invalidDuration) {
            setError("Todas las actividades deben tener una duración mayor a 0.");
            return;
        }

        // Advanced: detect cycles (e.g. A->B->A).
        // Since the UI only shows nodes that appear *before* the current one as available 
        // to prevent cycles easily? We are allowing any node right now. 
        // Let's implement a simple DFS cycle check.
        const isCyclic = () => {
            const visited = {};
            const recStack = {};
            
            const checkNode = (nodeId) => {
                if (!visited[nodeId]) {
                    visited[nodeId] = true;
                    recStack[nodeId] = true;

                    const node = activities.find(a => a.id === nodeId);
                    if (node) {
                        for (let p of node.precedences) {
                            if (!visited[p] && checkNode(p)) return true;
                            else if (recStack[p]) return true;
                        }
                    }
                }
                recStack[nodeId] = false;
                return false;
            };

            for (let a of activities) {
                if (checkNode(a.id)) return true;
            }
            return false;
        };

        if (isCyclic()) {
            setError("Hay un bucle circular en las dependencias (ej. A depende de B, y B depende de A). Revisa las precedencias.");
            return;
        }

        setError("");
        onNext();
    };

    return (
        <div style={s.container}>
            <div style={s.header}>
                <div>
                    <h2 style={s.title}>Configurar Actividades</h2>
                    <p style={s.subtitle}>
                        Ingresa entre 8 y 15 actividades. Define la duración y de qué actividades dependen para iniciar.
                    </p>
                </div>
                <button style={s.btn} onClick={handleAdd}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Añadir Actividad
                </button>
            </div>

            {error && (
                <div style={s.errorBox}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {error}
                </div>
            )}

            <table style={s.table}>
                <thead>
                    <tr>
                        <th style={s.th}>ID</th>
                        <th style={s.th}>Nombre de la Actividad</th>
                        <th style={s.th}>Duración (ej. días)</th>
                        <th style={s.th}>Precedencia (Depende de)</th>
                        <th style={s.th}></th>
                    </tr>
                </thead>
                <tbody>
                    {activities.map((act, index) => (
                        <tr key={act.id} style={s.tr}>
                            <td style={{ ...s.td, ...s.tdFirst }}>{act.id}</td>
                            <td style={s.td}>
                                <input
                                    style={s.input}
                                    value={act.name}
                                    onChange={e => updateAct(index, "name", e.target.value)}
                                    placeholder="Nombre..."
                                />
                            </td>
                            <td style={s.td}>
                                <input
                                    type="number"
                                    min="1"
                                    style={{ ...s.input, width: 100 }}
                                    value={act.duration}
                                    onChange={e => updateAct(index, "duration", parseFloat(e.target.value))}
                                />
                            </td>
                            <td style={s.td}>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                    {activities.map(other => {
                                        if (other.id === act.id) return null; // Can't depend on itself
                                        // To prevent backward cycles easily, we could only allow selection of IDs that appear before it.
                                        // But real CPM allows any order. We have a cycle detector anyway.
                                        const isSelected = act.precedences.includes(other.id);
                                        return (
                                            <button
                                                key={other.id}
                                                onClick={() => togglePrecedence(index, other.id)}
                                                style={{
                                                    padding: "4px 8px",
                                                    borderRadius: 4,
                                                    border: `1px solid ${isSelected ? "#3b82f6" : "#cbd5e1"}`,
                                                    background: isSelected ? "#eff6ff" : "#fff",
                                                    color: isSelected ? "#2563eb" : "#64748b",
                                                    fontSize: 12,
                                                    fontWeight: isSelected ? 700 : 500,
                                                    cursor: "pointer"
                                                }}
                                            >
                                                {other.id}
                                            </button>
                                        );
                                    })}
                                    {activities.length === 1 && <span style={{fontSize:13, color:"#94a3b8"}}>Sin opciones aún</span>}
                                </div>
                            </td>
                            <td style={{ ...s.td, ...s.tdLast }}>
                                <button
                                    style={s.btnDanger}
                                    onClick={() => handleRemove(index)}
                                    title="Eliminar"
                                >
                                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={s.footer}>
                <button style={{ ...s.btn, ...s.btnOutline }} onClick={onBack}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Volver a la Teoría
                </button>
                
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ fontSize: 13, color: activities.length < 8 || activities.length > 15 ? "#ef4444" : "#64748b", fontWeight: 600 }}>
                        {activities.length} / 15 actividades
                    </span>
                    <button style={s.btn} onClick={validateAndNext}>
                        Analizar Red y Rutas
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectInput;

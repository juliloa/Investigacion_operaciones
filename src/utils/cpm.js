// src/utils/cpm.js
// Método de la Ruta Crítica (CPM) - PERT/CPM
// IP = Tiempo de Inicio más Próximo
// TP = Tiempo de Terminación más Próximo
// IL = Tiempo de Inicio más Lejano
// TL = Tiempo de Terminación más Lejano
// H = Holgura (Slack)

export const calculateCPM = (activitiesInput) => {
    // Clone to avoid mutating the original input directly
    const nodes = activitiesInput.map(a => ({
        ...a,
        IP: 0,  // Inicio Próximo (Earliest Start)
        TP: 0,  // Terminación Próxima (Earliest Finish)
        IL: 0,  // Inicio Lejano (Latest Start)
        TL: 0,  // Terminación Lejana (Latest Finish)
        H: 0,   // Holgura (Slack)
        isCritical: false,
        successors: []
    }));

    const nodeMap = {};
    nodes.forEach(n => { nodeMap[n.id] = n; });

    // Populate successors
    nodes.forEach(n => {
        n.precedences.forEach(pId => {
            if (nodeMap[pId]) {
                nodeMap[pId].successors.push(n.id);
            }
        });
    });

    // Topological Sort (Kahn's Algorithm) to process in correct order
    const sorted = [];
    const inDegree = {};
    nodes.forEach(n => { inDegree[n.id] = n.precedences.length; });

    const queue = nodes.filter(n => inDegree[n.id] === 0);

    while (queue.length > 0) {
        const u = queue.shift();
        sorted.push(u);

        u.successors.forEach(vId => {
            inDegree[vId]--;
            if (inDegree[vId] === 0) {
                queue.push(nodeMap[vId]);
            }
        });
    }

    // Recorrido hacia adelante (Forward Pass)
    // Calcula IP y TP
    sorted.forEach(u => {
        if (u.precedences.length === 0) {
            u.IP = 0;
        } else {
            const maxTP = Math.max(...u.precedences.map(pId => nodeMap[pId].TP));
            u.IP = maxTP;
        }
        u.TP = u.IP + u.duration;
    });

    // Determine Project Duration (Max TP of all end nodes)
    const endNodes = nodes.filter(n => n.successors.length === 0);
    const maxProjectDuration = Math.max(...endNodes.map(n => n.TP));

    // Recorrido hacia atrás (Backward Pass)
    // Calcula IL, TL y H
    const reversed = [...sorted].reverse();
    reversed.forEach(u => {
        if (u.successors.length === 0) {
            u.TL = maxProjectDuration;
        } else {
            const minIL = Math.min(...u.successors.map(sId => nodeMap[sId].IL));
            u.TL = minIL;
        }
        u.IL = u.TL - u.duration;
        
        // Calculate Holgura (Slack)
        u.H = u.IL - u.IP; // o también TL - TP
        
        // A node is critical if H is 0 (or very close to 0 due to float math)
        if (Math.abs(u.H) < 0.0001) {
            u.isCritical = true;
            u.H = 0;
        }
    });

    return {
        nodes,
        projectDuration: maxProjectDuration
    };
};

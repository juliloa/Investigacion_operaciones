// src/utils/cpm.js

export const calculateCPM = (activitiesInput) => {
    // Clone to avoid mutating the original input directly
    const nodes = activitiesInput.map(a => ({
        ...a,
        ES: 0,
        EF: 0,
        LS: 0,
        LF: 0,
        slack: 0,
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

    // Forward Pass (ES, EF)
    sorted.forEach(u => {
        if (u.precedences.length === 0) {
            u.ES = 0;
        } else {
            const maxEF = Math.max(...u.precedences.map(pId => nodeMap[pId].EF));
            u.ES = maxEF;
        }
        u.EF = u.ES + u.duration;
    });

    // Determine Project Duration (Max EF of all end nodes)
    const endNodes = nodes.filter(n => n.successors.length === 0);
    const maxProjectDuration = Math.max(...endNodes.map(n => n.EF));

    // Backward Pass (LF, LS)
    // Reverse the topological sort
    const reversed = [...sorted].reverse();
    reversed.forEach(u => {
        if (u.successors.length === 0) {
            u.LF = maxProjectDuration;
        } else {
            const minLS = Math.min(...u.successors.map(sId => nodeMap[sId].LS));
            u.LF = minLS;
        }
        u.LS = u.LF - u.duration;
        
        // Calculate Slack
        u.slack = u.LS - u.ES; // or LF - EF
        
        // A node is critical if slack is 0 (or very close to 0 due to float math, though durations are integers/floats)
        if (Math.abs(u.slack) < 0.0001) {
            u.isCritical = true;
            u.slack = 0;
        }
    });

    return {
        nodes,
        projectDuration: maxProjectDuration
    };
};

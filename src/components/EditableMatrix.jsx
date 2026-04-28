import React from "react";

const EditableMatrix = ({ matrix, rowNames, colNames, onChangeCell, onChangeRowName, onChangeColName }) => {
  const tableStyle = { width: "100%", borderCollapse: "collapse", minWidth: "420px", fontSize: "14px" };
  const thStyle = { background: "#f1f5f9", padding: "10px", textAlign: "center", fontWeight: 700 };
  const rowHeaderStyle = { background: "#f8fafc", padding: "10px", fontWeight: 700, minWidth: "140px" };
  const tdStyle = { textAlign: "center", padding: "5px" };
  const headerInputStyle = { border: "none", background: "transparent", textAlign: "center", fontWeight: 700, outline: "none", width: "100%" };
  const cellInputStyle = { width: "60px", padding: "5px", textAlign: "center", borderRadius: "6px", border: "1px solid #ccc" };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}></th>
            {colNames.map((name, j) => (
              <th key={j} style={thStyle}>
                <input value={name} onChange={(e) => onChangeColName(j, e.target.value)} style={headerInputStyle} />
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <th style={rowHeaderStyle}>
                <input value={rowNames[i]} onChange={(e) => onChangeRowName(i, e.target.value)} style={headerInputStyle} />
              </th>

              {row.map((cell, j) => (
                <td key={j} style={tdStyle}>
                  <input type="number" value={cell} onChange={(e) => onChangeCell(i, j, e.target.value)} style={cellInputStyle} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EditableMatrix;

import React from "react";
import jsPDF from "jspdf";

const safeDiv = (a, b) => (b === 0 ? 0 : a / b);
const asPercent = (value) => `${(value * 100).toFixed(1)}%`;
const asMoney = (value) => `$${value.toFixed(2)}`;

const Step10 = ({ data, prev }) => {
  const alternatives = data.alternatives || [];
  const payoff = data.payoff || [];
  const probabilities = data.probabilities || [];
  const states = data.states || ["Favorable", "Desfavorable"];

  const probabilityFavorableState = probabilities[0] ?? 0;
  const probabilityUnfavorableState = probabilities[1] ?? 0;

  const studyConfig = data.studyConfig || {
    favorableDetectionRate: 0.9,
    unfavorableFalsePositiveRate: 0.25
  };

  const favorableDetectionRate = studyConfig.favorableDetectionRate ?? 0.9;
  const unfavorableFalsePositiveRate =
    studyConfig.unfavorableFalsePositiveRate ?? 0.25;

  const expectedValueWithoutStudy = alternatives.map((_, i) => {
    const favorablePayoff = payoff[i]?.[0] ?? 0;
    const unfavorablePayoff = payoff[i]?.[1] ?? 0;

    return (
      favorablePayoff * probabilityFavorableState +
      unfavorablePayoff * probabilityUnfavorableState
    );
  });

  const bestWithoutStudyValue = Math.max(...expectedValueWithoutStudy);
  const bestWithoutStudyIndex = expectedValueWithoutStudy.indexOf(bestWithoutStudyValue);
  const bestWithoutStudyAlternative = alternatives[bestWithoutStudyIndex] || "-";

  const bestPayoffFavorableState = Math.max(...payoff.map((row) => row?.[0] ?? 0));
  const bestPayoffUnfavorableState = Math.max(...payoff.map((row) => row?.[1] ?? 0));

  const expectedValuePerfectInformation =
    bestPayoffFavorableState * probabilityFavorableState +
    bestPayoffUnfavorableState * probabilityUnfavorableState;

  const probabilityFavorableResult =
    probabilityFavorableState * favorableDetectionRate +
    probabilityUnfavorableState * unfavorableFalsePositiveRate;
  const probabilityUnfavorableResult = 1 - probabilityFavorableResult;

  const probabilityFavStateGivenFavResult = safeDiv(
    probabilityFavorableState * favorableDetectionRate,
    probabilityFavorableResult
  );
  const probabilityUnfavStateGivenFavResult = safeDiv(
    probabilityUnfavorableState * unfavorableFalsePositiveRate,
    probabilityFavorableResult
  );

  const probabilityFavStateGivenUnfavResult = safeDiv(
    probabilityFavorableState * (1 - favorableDetectionRate),
    probabilityUnfavorableResult
  );
  const probabilityUnfavStateGivenUnfavResult = safeDiv(
    probabilityUnfavorableState * (1 - unfavorableFalsePositiveRate),
    probabilityUnfavorableResult
  );

  const expectedValueWhenFavorableResult = alternatives.map((_, i) => {
    const favorablePayoff = payoff[i]?.[0] ?? 0;
    const unfavorablePayoff = payoff[i]?.[1] ?? 0;

    return (
      favorablePayoff * probabilityFavStateGivenFavResult +
      unfavorablePayoff * probabilityUnfavStateGivenFavResult
    );
  });

  const expectedValueWhenUnfavorableResult = alternatives.map((_, i) => {
    const favorablePayoff = payoff[i]?.[0] ?? 0;
    const unfavorablePayoff = payoff[i]?.[1] ?? 0;

    return (
      favorablePayoff * probabilityFavStateGivenUnfavResult +
      unfavorablePayoff * probabilityUnfavStateGivenUnfavResult
    );
  });

  const bestWhenFavorableResultValue = Math.max(...expectedValueWhenFavorableResult);
  const bestWhenUnfavorableResultValue = Math.max(...expectedValueWhenUnfavorableResult);

  const bestWhenFavorableResultIndex = expectedValueWhenFavorableResult.indexOf(
    bestWhenFavorableResultValue
  );
  const bestWhenUnfavorableResultIndex = expectedValueWhenUnfavorableResult.indexOf(
    bestWhenUnfavorableResultValue
  );

  const bestWhenFavorableResultAlternative =
    alternatives[bestWhenFavorableResultIndex] || "-";
  const bestWhenUnfavorableResultAlternative =
    alternatives[bestWhenUnfavorableResultIndex] || "-";

  const expectedValueWithStudy =
    bestWhenFavorableResultValue * probabilityFavorableResult +
    bestWhenUnfavorableResultValue * probabilityUnfavorableResult;

  const evpi = expectedValuePerfectInformation - bestWithoutStudyValue;
  const evsi = expectedValueWithStudy - bestWithoutStudyValue;
  const studyEfficiency = safeDiv(evsi, evpi);

  const truePositive = probabilityFavorableState * favorableDetectionRate;
  const falseNegative = probabilityFavorableState * (1 - favorableDetectionRate);
  const falsePositive = probabilityUnfavorableState * unfavorableFalsePositiveRate;
  const trueNegative = probabilityUnfavorableState * (1 - unfavorableFalsePositiveRate);

  const precision = safeDiv(truePositive, truePositive + falsePositive);
  const recall = safeDiv(truePositive, truePositive + falseNegative);
  const accuracy = safeDiv(
    truePositive + trueNegative,
    truePositive + trueNegative + falsePositive + falseNegative
  );

  const recommendationText =
    expectedValueWithStudy > bestWithoutStudyValue
      ? `Conviene realizar el estudio. Mejora esperada: ${asMoney(evsi)}.`
      : "No conviene realizar el estudio. No mejora el valor esperado.";

  const generatePDF = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    const palette = {
      navy: [17, 53, 81],
      teal: [19, 141, 141],
      light: [241, 247, 252],
      softBlue: [228, 239, 250],
      text: [30, 42, 56],
      muted: [88, 109, 129]
    };

    let y = 14;
    let page = 1;

    const addFooter = (pageNumber) => {
      doc.setTextColor(...palette.muted);
      doc.setFontSize(9);
      doc.text(`Informe de decision | Pagina ${pageNumber}`, margin, pageHeight - 8);
    };

    const ensureSpace = (heightNeeded) => {
      if (y + heightNeeded > pageHeight - 18) {
        addFooter(page);
        doc.addPage();
        page += 1;
        y = 16;
      }
    };

    const drawSectionHeader = (title, subtitle = "") => {
      ensureSpace(16);
      doc.setFillColor(...palette.softBlue);
      doc.roundedRect(margin, y, pageWidth - margin * 2, 12, 2, 2, "F");
      doc.setTextColor(...palette.navy);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(title, margin + 3, y + 8);

      if (subtitle) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...palette.muted);
        doc.text(subtitle, pageWidth - margin - 3, y + 8, { align: "right" });
      }

      y += 16;
    };

    const addLabelValue = (label, value) => {
      const totalWidth = pageWidth - margin * 2;
      const gap = 4;
      const labelWidth = Math.min(74, totalWidth * 0.46);
      const valueWidth = totalWidth - labelWidth - gap;

      const labelLines = doc.splitTextToSize(`${label}:`, labelWidth);
      const valueLines = doc.splitTextToSize(String(value), valueWidth);

      const lineHeight = 4.8;
      const rowHeight =
        Math.max(labelLines.length, valueLines.length) * lineHeight;

      ensureSpace(rowHeight + 1.5);

      doc.setTextColor(...palette.text);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(labelLines, margin, y);

      doc.setFont("helvetica", "normal");
      doc.text(valueLines, margin + labelWidth + gap, y);

      y += rowHeight + 0.8;
    };

    const addParagraph = (text, indent = 0) => {
      const lines = doc.splitTextToSize(
        String(text),
        pageWidth - margin * 2 - indent
      );

      ensureSpace(lines.length * 4.8 + 2);
      doc.setTextColor(...palette.text);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(lines, margin + indent, y);
      y += lines.length * 4.8 + 1;
    };

    const drawSimpleTable = (headers, rows, colWidths) => {
      const tableWidth = pageWidth - margin * 2;
      const widths = colWidths || headers.map(() => tableWidth / headers.length);
      const rowHeight = 7;

      ensureSpace(rowHeight + 1);
      let x = margin;

      doc.setFillColor(...palette.navy);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);

      headers.forEach((header, i) => {
        doc.rect(x, y, widths[i], rowHeight, "F");
        doc.text(String(header), x + 2, y + 4.7);
        x += widths[i];
      });

      y += rowHeight;

      rows.forEach((row, rowIndex) => {
        ensureSpace(rowHeight + 1);
        x = margin;

        if (rowIndex % 2 === 0) {
          doc.setFillColor(...palette.light);
          doc.rect(margin, y, tableWidth, rowHeight, "F");
        }

        doc.setTextColor(...palette.text);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);

        row.forEach((cell, cellIndex) => {
          doc.text(String(cell), x + 2, y + 4.7);
          x += widths[cellIndex];
        });

        y += rowHeight;
      });

      y += 4;
    };

    const drawTreeWithoutStudy = () => {
      const boxY = y;
      const boxHeight = 62;
      ensureSpace(boxHeight + 4);

      doc.setFillColor(...palette.light);
      doc.roundedRect(margin, boxY, pageWidth - margin * 2, boxHeight, 2, 2, "F");
      doc.setTextColor(...palette.navy);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Arbol 1: decision sin estudio", margin + 3, boxY + 6);

      const rootX = margin + 12;
      const rootY = boxY + 28;
      const branchX = margin + 42;
      const leafX = margin + 108;

      doc.setDrawColor(70, 95, 120);
      doc.setFillColor(17, 53, 81);
      doc.rect(rootX, rootY - 4, 8, 8, "FD");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text("D", rootX + 2.5, rootY + 2);

      const maxBranches = Math.min(alternatives.length, 4);
      const spacing = 13;
      const startY = rootY - ((maxBranches - 1) * spacing) / 2;

      for (let i = 0; i < maxBranches; i += 1) {
        const branchY = startY + i * spacing;
        doc.setDrawColor(120, 140, 160);
        doc.line(rootX + 8, rootY, branchX, branchY);
        doc.line(branchX, branchY, leafX, branchY);

        const altLabel = alternatives[i] || `A${i + 1}`;
        const ev = expectedValueWithoutStudy[i] ?? 0;

        doc.setTextColor(...palette.text);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.text(`${altLabel}`, branchX + 2, branchY - 1.2);
        doc.text(`EV=${ev.toFixed(2)}`, leafX + 2, branchY - 1.2);
      }

      doc.setFillColor(19, 141, 141);
      doc.roundedRect(leafX + 40, boxY + 46, 34, 10, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(
        `Mejor: ${bestWithoutStudyAlternative}`,
        leafX + 42,
        boxY + 50.3
      );
      doc.text(`EV=${bestWithoutStudyValue.toFixed(2)}`, leafX + 42, boxY + 54.2);

      y = boxY + boxHeight + 4;
    };

    const drawTreeWithStudy = () => {
      const boxY = y;
      const boxHeight = 96;
      ensureSpace(boxHeight + 4);

      doc.setFillColor(...palette.light);
      doc.roundedRect(margin, boxY, pageWidth - margin * 2, boxHeight, 2, 2, "F");
      doc.setTextColor(...palette.navy);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Arbol 2: decision con estudio", margin + 3, boxY + 6);

      const rootX = margin + 12;
      const rootY = boxY + 46;
      const resultNodeX = margin + 46;
      const favorableY = boxY + 26;
      const unfavorableY = boxY + 66;
      const actionX = margin + 85;
      const payoffX = margin + 126;

      doc.setDrawColor(70, 95, 120);
      doc.setFillColor(17, 53, 81);
      doc.rect(rootX, rootY - 4, 8, 8, "FD");

      doc.setFillColor(95, 94, 90);
      doc.circle(resultNodeX, favorableY, 3.3, "FD");
      doc.circle(resultNodeX, unfavorableY, 3.3, "FD");

      doc.setDrawColor(120, 140, 160);
      doc.line(rootX + 8, rootY, resultNodeX - 3.3, favorableY);
      doc.line(rootX + 8, rootY, resultNodeX - 3.3, unfavorableY);

      doc.setTextColor(...palette.text);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(`F (${probabilityFavorableResult.toFixed(3)})`, resultNodeX + 5, favorableY + 1.2);
      doc.text(`U (${probabilityUnfavorableResult.toFixed(3)})`, resultNodeX + 5, unfavorableY + 1.2);

      const alternativesCount = Math.min(alternatives.length, 3);
      const branchSpacing = 10;
      const favoredStartY = favorableY - ((alternativesCount - 1) * branchSpacing) / 2;
      const unfavoredStartY = unfavorableY - ((alternativesCount - 1) * branchSpacing) / 2;

      for (let i = 0; i < alternativesCount; i += 1) {
        const altLabel = alternatives[i] || `A${i + 1}`;

        const yFavAlt = favoredStartY + i * branchSpacing;
        const yUnfavAlt = unfavoredStartY + i * branchSpacing;

        const evFav = expectedValueWhenFavorableResult[i] ?? 0;
        const evUnfav = expectedValueWhenUnfavorableResult[i] ?? 0;

        const isBestFav = i === bestWhenFavorableResultIndex;
        const isBestUnfav = i === bestWhenUnfavorableResultIndex;

        doc.setDrawColor(120, 140, 160);
        doc.line(resultNodeX + 3.3, favorableY, actionX, yFavAlt);
        doc.line(resultNodeX + 3.3, unfavorableY, actionX, yUnfavAlt);

        doc.setTextColor(...palette.text);
        doc.setFont("helvetica", isBestFav ? "bold" : "normal");
        doc.text(`${altLabel}${isBestFav ? " *" : ""}`, actionX + 2, yFavAlt + 1.2);
        doc.setFont("helvetica", isBestUnfav ? "bold" : "normal");
        doc.text(`${altLabel}${isBestUnfav ? " *" : ""}`, actionX + 2, yUnfavAlt + 1.2);

        doc.line(actionX + 22, yFavAlt, payoffX, yFavAlt);
        doc.line(actionX + 22, yUnfavAlt, payoffX, yUnfavAlt);

        doc.setFont("helvetica", isBestFav ? "bold" : "normal");
        doc.text(`EV=${evFav.toFixed(2)}`, payoffX + 2, yFavAlt + 1.2);
        doc.setFont("helvetica", isBestUnfav ? "bold" : "normal");
        doc.text(`EV=${evUnfav.toFixed(2)}`, payoffX + 2, yUnfavAlt + 1.2);
      }

      doc.setFont("helvetica", "normal");

      doc.setFillColor(19, 141, 141);
      doc.roundedRect(payoffX - 2, boxY + 80, 56, 10, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(`VE total con estudio = ${expectedValueWithStudy.toFixed(2)}`, payoffX, boxY + 86.2);

      y = boxY + boxHeight + 4;
    };

    const now = new Date();
    const dateText = now.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    doc.setFillColor(...palette.navy);
    doc.rect(0, 0, pageWidth, 38, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Informe de Evaluacion de Decision", margin, 18);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Analisis integral con valor esperado, Bayes e informacion del estudio", margin, 27);
    doc.text(dateText, pageWidth - margin, 27, { align: "right" });

    y = 46;

    drawSectionHeader("1. Resumen ejecutivo");
    addLabelValue("Mejor sin estudio", `${bestWithoutStudyAlternative} (${asMoney(bestWithoutStudyValue)})`);
    addLabelValue("Valor esperado con estudio", asMoney(expectedValueWithStudy));
    addLabelValue("EVPI", asMoney(evpi));
    addLabelValue("EVSI", asMoney(evsi));
    addLabelValue("Eficiencia del estudio", asPercent(studyEfficiency));

    ensureSpace(16);
    doc.setFillColor(...palette.light);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 14, 2, 2, "F");
    doc.setTextColor(...palette.text);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Recomendacion", margin + 3, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const recommendationLines = doc.splitTextToSize(
      recommendationText,
      pageWidth - margin * 2 - 6
    );
    doc.text(recommendationLines, margin + 3, y + 10);
    y += 7 + recommendationLines.length * 4.6;

    drawSectionHeader("2. Datos y supuestos del problema");
    addLabelValue("Estado 1", `${states[0] || "Favorable"} (p=${probabilityFavorableState.toFixed(3)})`);
    addLabelValue("Estado 2", `${states[1] || "Desfavorable"} (p=${probabilityUnfavorableState.toFixed(3)})`);
    addLabelValue(
      "P(Resultado favorable | Estado favorable)",
      favorableDetectionRate.toFixed(3)
    );
    addLabelValue(
      "P(Resultado favorable | Estado desfavorable)",
      unfavorableFalsePositiveRate.toFixed(3)
    );

    drawSectionHeader("3. Matriz de pagos y valores esperados");
    const alternativesRows = alternatives.map((name, i) => {
      const favorablePayoff = payoff[i]?.[0] ?? 0;
      const unfavorablePayoff = payoff[i]?.[1] ?? 0;

      return [
        name,
        favorablePayoff.toFixed(2),
        unfavorablePayoff.toFixed(2),
        expectedValueWithoutStudy[i].toFixed(2),
        expectedValueWhenFavorableResult[i].toFixed(2),
        expectedValueWhenUnfavorableResult[i].toFixed(2)
      ];
    });

    drawSimpleTable(
      [
        "Alt.",
        "Payoff S1",
        "Payoff S2",
        "VE sin estudio",
        "VE si resultado fav.",
        "VE si resultado desf."
      ],
      alternativesRows,
      [18, 26, 26, 34, 38, 38]
    );

    drawSectionHeader("4. Regla de decision con estudio", "Aplicacion de Bayes");
    addLabelValue(
      "Si el resultado es favorable",
      `${bestWhenFavorableResultAlternative} (${asMoney(bestWhenFavorableResultValue)})`
    );
    addLabelValue(
      "Si el resultado es desfavorable",
      `${bestWhenUnfavorableResultAlternative} (${asMoney(bestWhenUnfavorableResultValue)})`
    );
    addLabelValue("P(resultado favorable)", probabilityFavorableResult.toFixed(3));
    addLabelValue("P(resultado desfavorable)", probabilityUnfavorableResult.toFixed(3));

    drawSectionHeader("5. Calidad del estudio (Step 7)");
    drawSimpleTable(
      ["", "Predice favorable", "Predice desfavorable"],
      [
        ["Real favorable", truePositive.toFixed(4), falseNegative.toFixed(4)],
        ["Real desfavorable", falsePositive.toFixed(4), trueNegative.toFixed(4)]
      ],
      [48, 60, 60]
    );
    addLabelValue("Precision", asPercent(precision));
    addLabelValue("Recall", asPercent(recall));
    addLabelValue("Exactitud", asPercent(accuracy));

    drawSectionHeader("6. Arboles de decision");
    drawTreeWithoutStudy();
    drawTreeWithStudy();

    drawSectionHeader("7. Conclusiones");
    const conclusions = [
      `EVPI = ${asMoney(evpi)} y EVSI = ${asMoney(evsi)}.`,
      `La eficiencia del estudio es ${asPercent(studyEfficiency)} frente a informacion perfecta.`,
      `Decision recomendada: ${recommendationText}`
    ];

    conclusions.forEach((line) => {
      addParagraph(`- ${line}`);
    });

    addFooter(page);

    doc.save("informe-decision-ejecutivo.pdf");
  };

  return (
    <div style={container}>
      <h1 style={pageTitle}>Evaluacion final y reporte ejecutivo</h1>

      <div style={card}>
        <h2 style={cardTitle}>Resumen de resultados</h2>
        <div style={resultGrid}>
          <ResultBox label="Mejor sin estudio" value={`${bestWithoutStudyAlternative} (${asMoney(bestWithoutStudyValue)})`} />
          <ResultBox label="Valor con estudio" value={asMoney(expectedValueWithStudy)} />
          <ResultBox label="EVPI" value={asMoney(evpi)} />
          <ResultBox label="EVSI" value={asMoney(evsi)} />
          <ResultBox label="Eficiencia" value={asPercent(studyEfficiency)} />
        </div>
      </div>

      <div style={card}>
        <h2 style={cardTitle}>Parametros usados del estudio</h2>
        <p style={paragraph}>
          P(Resultado favorable | Estado favorable): {favorableDetectionRate.toFixed(3)}
        </p>
        <p style={paragraph}>
          P(Resultado favorable | Estado desfavorable): {unfavorableFalsePositiveRate.toFixed(3)}
        </p>
        <p style={paragraph}>
          Estos valores provienen del Step 7 y se integran automaticamente al informe PDF.
        </p>
      </div>

      <div style={card}>
        <h2 style={cardTitle}>Recomendacion</h2>
        <p style={recommendationTextStyle}>{recommendationText}</p>
      </div>

      <div style={buttons}>
        <button onClick={prev} style={btnSecondary}>Volver</button>
        <button onClick={generatePDF} style={btnPrimary}>Descargar informe PDF</button>
      </div>
    </div>
  );
};

const ResultBox = ({ label, value }) => (
  <div style={resultBox}>
    <p style={resultLabel}>{label}</p>
    <p style={resultValue}>{value}</p>
  </div>
);

export default Step10;

const container = {
  display: "flex",
  flexDirection: "column",
  gap: "18px"
};

const pageTitle = {
  margin: 0,
  fontSize: "28px",
  color: "#12263a"
};

const card = {
  background: "#ffffff",
  padding: "22px",
  borderRadius: "14px",
  border: "1px solid #e5edf5",
  boxShadow: "0 8px 24px rgba(17, 38, 58, 0.08)"
};

const cardTitle = {
  margin: "0 0 10px 0",
  color: "#12324a"
};

const resultGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "10px"
};

const resultBox = {
  background: "linear-gradient(180deg, #f8fbff 0%, #eef6ff 100%)",
  border: "1px solid #d8e8fa",
  borderRadius: "10px",
  padding: "12px"
};

const resultLabel = {
  margin: 0,
  fontSize: "12px",
  color: "#4b6780",
  textTransform: "uppercase",
  letterSpacing: "0.4px"
};

const resultValue = {
  margin: "7px 0 0 0",
  fontSize: "18px",
  color: "#113a5e",
  fontWeight: 700
};

const paragraph = {
  margin: "8px 0",
  color: "#29465d",
  lineHeight: "1.5"
};

const recommendationTextStyle = {
  margin: 0,
  color: "#1b3e58",
  lineHeight: "1.55",
  fontWeight: 600
};

const buttons = {
  display: "flex",
  justifyContent: "space-between"
};

const btnPrimary = {
  padding: "11px 20px",
  background: "#0f5e9c",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 600
};

const btnSecondary = {
  padding: "11px 20px",
  background: "#dde6ef",
  color: "#1f364a",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 600
};

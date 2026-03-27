import React from "react";
import jsPDF from "jspdf";

const Step10 = ({ data, prev }) => {
  const { alternatives, payoff, probabilities } = data;

  const P_alta = probabilities[0];
  const P_baja = probabilities[1];

  const P_fav_alta = 0.9;
  const P_fav_baja = 0.25;

  // 🧠 SIN ESTUDIO
  const VE_no = alternatives.map((_, i) =>
    payoff[i][0] * P_alta + payoff[i][1] * P_baja
  );
  const bestNo = Math.max(...VE_no);

  // 🧠 INFO PERFECTA
  const bestAlta = Math.max(...payoff.map(p => p[0]));
  const bestBaja = Math.max(...payoff.map(p => p[1]));

  const EVPI_total = bestAlta * P_alta + bestBaja * P_baja;

  // 🧠 CON ESTUDIO
  const P_fav = P_alta * P_fav_alta + P_baja * P_fav_baja;
  const P_desf = 1 - P_fav;

  const P_alta_fav = (P_alta * P_fav_alta) / P_fav;
  const P_baja_fav = (P_baja * P_fav_baja) / P_fav;

  const P_alta_desf = (P_alta * (1 - P_fav_alta)) / P_desf;
  const P_baja_desf = (P_baja * (1 - P_fav_baja)) / P_desf;

  const VE_fav = alternatives.map((_, i) =>
    payoff[i][0] * P_alta_fav + payoff[i][1] * P_baja_fav
  );

  const VE_desf = alternatives.map((_, i) =>
    payoff[i][0] * P_alta_desf + payoff[i][1] * P_baja_desf
  );

  const bestFav = Math.max(...VE_fav);
  const bestDesf = Math.max(...VE_desf);

  const VE_con = bestFav * P_fav + bestDesf * P_desf;

  // 🧠 MÉTRICAS
  const EVPI = EVPI_total - bestNo;
  const EVSI = VE_con - bestNo;
  const eficiencia = EVSI / EVPI;

  // 📄 GENERAR PDF
const generatePDF = () => {
  const doc = new jsPDF();

  let y = 20;

  // 🟦 PORTADA
  doc.setFontSize(18);
  doc.text("INFORME DE TOMA DE DECISIONES", 20, y);
  y += 10;

  doc.setFontSize(12);
  doc.text("Análisis completo con teoría de decisión", 20, y);
  y += 20;

  // 📊 DATOS
  doc.setFontSize(14);
  doc.text("1. Datos del problema", 20, y);
  y += 10;

  data.alternatives.forEach((alt, i) => {
    doc.text(`${alt}: ${data.payoff[i].join(", ")}`, 20, y);
    y += 8;
  });

  y += 5;
  doc.text(`Probabilidades: ${data.probabilities.join(", ")}`, 20, y);
  y += 15;

  // 📈 RESULTADOS
  doc.setFontSize(14);
  doc.text("2. Resultados", 20, y);
  y += 10;

  doc.setFontSize(12);
  doc.text(`Mejor sin estudio: ${bestNo.toFixed(2)}`, 20, y);
  y += 8;

  doc.text(`Valor con estudio: ${VE_con.toFixed(2)}`, 20, y);
  y += 8;

  doc.text(`EVPI: ${EVPI.toFixed(2)}`, 20, y);
  y += 8;

  doc.text(`EVSI: ${EVSI.toFixed(2)}`, 20, y);
  y += 8;

  doc.text(`Eficiencia: ${(eficiencia * 100).toFixed(2)}%`, 20, y);
  y += 15;

  // 🧠 ANÁLISIS
  doc.setFontSize(14);
  doc.text("3. Análisis", 20, y);
  y += 10;

  doc.setFontSize(12);

  if (VE_con > bestNo) {
    doc.text(
      "Se recomienda realizar el estudio de mercado, ya que mejora el valor esperado.",
      20,
      y
    );
  } else {
    doc.text(
      "No se recomienda realizar el estudio de mercado, ya que no mejora la decisión.",
      20,
      y
    );
  }

  y += 15;

  doc.text(
    "El análisis demuestra cómo la información adicional puede impactar la toma de decisiones.",
    20,
    y
  );

  y += 20;

  // 🏁 CIERRE
  doc.setFontSize(10);
  doc.text("Generado automáticamente por el sistema", 20, y);

  doc.save("informe-profesional.pdf");
};

  return (
    <div style={container}>
      <h1>Evaluación Final</h1>

      <div style={card}>
        <h2>Resultados</h2>

        <p>Mejor sin estudio: {bestNo.toFixed(2)}</p>
        <p>Con estudio: {VE_con.toFixed(2)}</p>

        <p>EVPI: {EVPI.toFixed(2)}</p>
        <p>EVSI: {EVSI.toFixed(2)}</p>

        <strong>
          Eficiencia: {(eficiencia * 100).toFixed(1)}%
        </strong>
      </div>

      <div style={card}>
        <h2>Interpretación</h2>

        <p>
          EVPI representa el máximo valor que tendría conocer el futuro perfectamente.
        </p>

        <p>
          EVSI mide cuánto aporta el estudio de mercado.
        </p>

        <p>
          La eficiencia indica qué tan bueno es el estudio comparado con información perfecta.
        </p>
      </div>

      <button onClick={generatePDF} style={btnPrimary}>
        Descargar Informe PDF
      </button>

      <div style={buttons}>
        <button onClick={prev} style={btnSecondary}>← Volver</button>
      </div>
    </div>
  );
};

export default Step10;

// 🎨 estilos
const container = {
  display: "flex",
  flexDirection: "column",
  gap: "20px"
};

const card = {
  background: "#fff",
  padding: "25px",
  borderRadius: "12px",
  boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
};

const btnPrimary = {
  padding: "12px",
  background: "#28a745",
  color: "#fff",
  border: "none",
  borderRadius: "8px"
};

const btnSecondary = {
  padding: "10px",
  background: "#ccc",
  border: "none",
  borderRadius: "6px"
};

const buttons = {
  display: "flex",
  justifyContent: "space-between"
};
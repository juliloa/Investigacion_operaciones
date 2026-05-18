import React, { useState } from "react";

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Outfit:wght@300;400;500&display=swap');

  :root {
    --accent: #4f7fe8;
    --accent-light: #eef3fd;
    --accent-mid: #c5d8f9;
    --text-primary: #1c2333;
    --text-secondary: #5a6478;
    --text-muted: #9aa3b5;
    --bg: #f0f4ff;
    --surface: #ffffff;
    --border: #dde4f4;
    --border-light: #edf0fa;
  }

  .sb-wrap {
    width: 264px; height: 100vh;
    background: var(--bg);
    border-right: 1px solid var(--border);
    position: fixed; left: 0; top: 0;
    font-family: 'Outfit', sans-serif;
    display: flex; flex-direction: column;
    overflow: hidden;
  }

  .sb-wrap::after {
    content: '';
    position: absolute; top: -60px; right: -60px;
    width: 200px; height: 200px; border-radius: 50%;
    background: radial-gradient(circle, rgba(79,127,232,0.14) 0%, transparent 70%);
    pointer-events: none;
  }

  .sb-inner {
    position: relative; z-index: 1;
    display: flex; flex-direction: column;
    height: 100%; padding: 28px 20px 24px;
  }

  .sb-brand {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 14px; padding: 16px 18px; margin-bottom: 28px;
    box-shadow: 0 2px 12px rgba(79,127,232,0.07);
    position: relative; overflow: hidden;
  }

  .sb-brand::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, var(--accent) 0%, #a5c0f5 100%);
    border-radius: 14px 14px 0 0;
  }

  .sb-brand-eyebrow {
    font-size: 9.5px; font-weight: 500; letter-spacing: 0.2em;
    text-transform: uppercase; color: var(--accent); margin-bottom: 5px; opacity: 0.85;
  }

  .sb-brand-name {
    font-family: 'Playfair Display', serif; font-size: 22px;
    font-weight: 500; color: var(--text-primary); line-height: 1.1;
  }

  .sb-brand-name em { font-style: italic; color: var(--accent); }

  .sb-nav {
    flex: 1; overflow-y: auto; scrollbar-width: none;
    display: flex; flex-direction: column; gap: 6px;
  }
  .sb-nav::-webkit-scrollbar { display: none; }

  .sb-group-btn {
    width: 100%; display: flex; align-items: center;
    justify-content: space-between; padding: 10px 14px;
    border-radius: 10px; border: 1px solid transparent;
    background: transparent; cursor: pointer; transition: all 0.2s ease; gap: 10px;
  }
  .sb-group-btn:hover {
    background: var(--surface); border-color: var(--border-light);
    box-shadow: 0 1px 6px rgba(79,127,232,0.06);
  }
  .sb-group-btn.open {
    background: var(--surface); border-color: var(--border);
    box-shadow: 0 2px 10px rgba(79,127,232,0.08);
  }

  .sb-group-left { display: flex; align-items: center; gap: 10px; }

  .sb-group-pip {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--border); transition: all 0.25s ease; flex-shrink: 0;
  }
  .sb-group-btn.open .sb-group-pip {
    background: var(--accent); box-shadow: 0 0 0 3px var(--accent-light);
  }

  .sb-group-label {
    font-size: 13px; font-weight: 500; color: var(--text-secondary);
    letter-spacing: 0.01em; transition: color 0.2s;
  }
  .sb-group-btn.open .sb-group-label { color: var(--text-primary); }

  .sb-group-badge {
    font-size: 10px; font-weight: 500; color: var(--accent);
    background: var(--accent-light); border: 1px solid var(--accent-mid);
    border-radius: 20px; padding: 1px 7px; line-height: 16px;
    margin-left: auto; margin-right: 4px; opacity: 0; transition: opacity 0.2s;
  }
  .sb-group-btn.open .sb-group-badge { opacity: 1; }

  .sb-chevron {
    width: 15px; height: 15px; color: var(--text-muted);
    transition: transform 0.25s cubic-bezier(0.4,0,0.2,1), color 0.2s; flex-shrink: 0;
  }
  .sb-group-btn.open .sb-chevron { transform: rotate(180deg); color: var(--accent); }

  .sb-steps {
    overflow: hidden;
    transition: max-height 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease;
  }

  .sb-steps-inner {
    padding: 6px 0 8px 22px; display: flex; flex-direction: column;
    gap: 1px; position: relative;
  }
  .sb-steps-inner::before {
    content: ''; position: absolute; left: 11px; top: 8px; bottom: 12px;
    width: 1px; background: linear-gradient(180deg, var(--accent-mid) 0%, var(--border-light) 100%);
  }

  .sb-step {
    display: flex; align-items: center; gap: 10px;
    padding: 7px 12px 7px 10px; border-radius: 8px; cursor: pointer;
    transition: all 0.18s ease; border: 1px solid transparent; position: relative;
  }
  .sb-step:hover { background: var(--surface); border-color: var(--border-light); }
  .sb-step.active {
    background: var(--accent); border-color: var(--accent);
    box-shadow: 0 3px 14px rgba(79,127,232,0.30);
  }

  .sb-step-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--border); flex-shrink: 0; margin-left: -13px;
    transition: all 0.18s ease; position: relative; z-index: 1;
  }
  .sb-step:hover .sb-step-dot { background: var(--accent-mid); }
  .sb-step.active .sb-step-dot { background: #fff; box-shadow: 0 0 0 2px rgba(255,255,255,0.5); }

  .sb-step-num {
    font-family: 'Playfair Display', serif; font-size: 10px;
    color: var(--text-muted); min-width: 16px; transition: color 0.18s; line-height: 1;
  }
  .sb-step.active .sb-step-num { color: rgba(255,255,255,0.6); }

  .sb-step-label {
    font-size: 12.5px; font-weight: 400; color: var(--text-secondary);
    transition: color 0.18s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .sb-step.active .sb-step-label { color: #fff; font-weight: 500; }

  /* ── SUB-GRUPO (Equilibrio de Nash) ── */
  .sb-subgroup { margin: 4px 0 2px 0; }

  .sb-subgroup-btn {
    width: 100%; display: flex; align-items: center; gap: 8px;
    padding: 6px 10px 6px 10px; border-radius: 8px;
    border: 1px solid transparent; background: transparent;
    cursor: pointer; transition: all 0.18s ease;
  }
  .sb-subgroup-btn:hover {
    background: var(--accent-light); border-color: var(--accent-mid);
  }
  .sb-subgroup-btn.open {
    background: var(--accent-light); border-color: var(--accent-mid);
  }

  .sb-subgroup-line {
    width: 14px; height: 1px; background: var(--accent-mid); flex-shrink: 0;
  }

  .sb-subgroup-label {
    font-size: 11.5px; font-weight: 600; color: var(--accent);
    letter-spacing: 0.02em; flex: 1; text-align: left;
  }

  .sb-subgroup-chevron {
    width: 12px; height: 12px; color: var(--accent);
    transition: transform 0.22s ease; flex-shrink: 0;
  }
  .sb-subgroup-btn.open .sb-subgroup-chevron { transform: rotate(180deg); }

  .sb-substeps-inner {
    padding: 4px 0 4px 34px; display: flex; flex-direction: column;
    gap: 1px; position: relative;
  }
  .sb-substeps-inner::before {
    content: ''; position: absolute; left: 23px; top: 6px; bottom: 6px;
    width: 1px; background: var(--accent-mid); opacity: 0.5;
  }

  .sb-divider {
    height: 1px; background: var(--border-light); margin: 4px 0;
  }

  .sb-footer {
    margin-top: 20px; padding-top: 16px;
    border-top: 1px solid var(--border-light);
    display: flex; align-items: center; justify-content: space-between;
  }

  .sb-divider { 
    height: 1px;
    background: var(--border-light);
    margin: 4px 0;
  }

  .sb-footer-text {
    font-size: 10px; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--text-muted);
  }
  .sb-footer-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); opacity: 0.5; }
`;

// ── DATOS ────────────────────────────────────────────────────────
const decisionSteps = [
  { number: "01", label: "Datos" },
  { number: "02", label: "Árbol" },
  { number: "03", label: "Sensibilidad" },
  { number: "04", label: "Árbol con valores" },
  { number: "05", label: "Análisis gráfico" },
  { number: "06", label: "Gráfica" },
  { number: "07", label: "Matriz" },
  { number: "08", label: "Árbol con estudio" },
  { number: "09", label: "Decisión" },
  { number: "10", label: "Evaluación final" },
];

const gameTheoryCoreSteps = [
  { number: "01", label: "Datos", step: 100 },
  { number: "02", label: "Análisis", step: 101 },
  { number: "03", label: "Método algebraico", step: 102 },
];

const canalesSimpleSteps = [
  { number: "01", label: "Datos", step: 200 },
  { number: "02", label: "Análisis", step: 201 },
];

const mmkSteps = [
  { number: "01", label: "Datos", step: 204 },
  { number: "02", label: "Análisis", step: 205 },
];

const nashSteps = [
  { number: "01", label: "Matriz", step: 103 },
  { number: "02", label: "Análisis", step: 104 },
];

const projectFormulationSteps = [
  { number: "01", label: "Conceptos Básicos", step: 300 },
  { number: "02", label: "Configurar Actividades", step: 301 },
  { number: "03", label: "Red y Rutas Críticas", step: 302 },
];

// ── ICONOS ───────────────────────────────────────────────────────
const Chevron = ({ size = 15 }) => (
  <svg className="sb-chevron" style={{ width: size, height: size }} viewBox="0 0 16 16" fill="none">
    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronSm = () => (
  <svg className="sb-subgroup-chevron" viewBox="0 0 16 16" fill="none">
    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── SUB-GRUPO (Equilibrio de Nash) ───────────────────────────────
const NashSubGroup = ({ currentStep, setStep }) => {
  const isAnyNashActive = nashSteps.some(s => s.step === currentStep);
  const [open, setOpen] = useState(isAnyNashActive);

  return (
    <div className="sb-subgroup">
      <button
        className={`sb-subgroup-btn${open ? " open" : ""}`}
        onClick={() => setOpen(v => !v)}
      >
        <div className="sb-subgroup-line" />
        <span className="sb-subgroup-label">Equilibrio de Nash</span>
        <ChevronSm />
      </button>

      <div style={{
        maxHeight: open ? `${nashSteps.length * 36}px` : "0px",
        opacity: open ? 1 : 0,
        overflow: "hidden",
        transition: "all 0.28s ease",
      }}>
        <div className="sb-substeps-inner">
          {nashSteps.map(({ number, label, step }) => (
            <div
              key={step}
              className={`sb-step${currentStep === step ? " active" : ""}`}
              onClick={() => setStep(step)}
            >
              <div className="sb-step-dot" />
              <span className="sb-step-num">{number}</span>
              <span className="sb-step-label">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const QueueSubGroup = ({ label, steps, currentStep, setStep }) => {
  const isAnyActive = steps.some(s => s.step === currentStep);
  const [open, setOpen] = useState(isAnyActive);

  return (
    <div className="sb-subgroup">
      <button
        className={`sb-subgroup-btn${open ? " open" : ""}`}
        onClick={() => setOpen(v => !v)}
      >
        <div className="sb-subgroup-line" />
        <span className="sb-subgroup-label">{label}</span>
        <ChevronSm />
      </button>

      <div style={{
        maxHeight: open ? `${steps.length * 36}px` : "0px",
        opacity: open ? 1 : 0,
        overflow: "hidden",
        transition: "all 0.28s ease",
      }}>
        <div className="sb-substeps-inner">
          {steps.map(({ number, label: lbl, step }) => (
            <div
              key={step}
              className={`sb-step${currentStep === step ? " active" : ""}`}
              onClick={() => setStep(step)}
            >
              <div className="sb-step-dot" />
              <span className="sb-step-num">{number}</span>
              <span className="sb-step-label">{lbl}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── NAV GROUP GENÉRICO ───────────────────────────────────────────
const NavGroup = ({ label, steps, baseIndex, currentStep, setStep, badgeCount, children }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="sb-group">
      <button
        className={`sb-group-btn${open ? " open" : ""}`}
        onClick={() => setOpen(v => !v)}
      >
        <div className="sb-group-left">
          <div className="sb-group-pip" />
          <span className="sb-group-label">{label}</span>
        </div>
        <span className="sb-group-badge">{badgeCount}</span>
        <Chevron />
      </button>

      <div
        className="sb-steps"
        style={{
          maxHeight: open ? "600px" : "0px",
          opacity: open ? 1 : 0,
          overflow: "hidden",
          transition: "max-height 0.4s ease, opacity 0.3s ease",
        }}
      >

        <div className="sb-steps-inner">
          {steps && steps.map(({ number, label: lbl, step }, i) => {
            const idx = step !== undefined ? step : baseIndex + i;
            const active = currentStep === idx;
            return (
              <div
                key={idx}
                className={`sb-step${active ? " active" : ""}`}
                onClick={() => setStep(idx)}
              >
                <div className="sb-step-dot" />
                <span className="sb-step-num">{number}</span>
                <span className="sb-step-label">{lbl}</span>
              </div>
            );
          })}
          {children}
        </div>
      </div>
    </div>
  );
};

// ── SIDEBAR PRINCIPAL ────────────────────────────────────────────
const Sidebar = ({ currentStep, setStep }) => {
  return (
    <>
      <style>{style}</style>
      <aside className="sb-wrap">
        <div className="sb-inner">

          <div className="sb-brand">
            <p className="sb-brand-eyebrow">Herramienta analítica</p>
            <h1 className="sb-brand-name">Inv.<em>Operaciones</em></h1>
          </div>

          <nav className="sb-nav">

            {/* DECISIÓN */}
            <NavGroup
              label="Decisión"
              steps={decisionSteps.map((s, i) => ({ ...s, step: i }))}
              baseIndex={0}
              currentStep={currentStep}
              setStep={setStep}
              badgeCount="10"
            />

            {/* TEORÍA DEL JUEGO */}
            <NavGroup
              label="Teoría del Juego"
              steps={gameTheoryCoreSteps}
              baseIndex={100}
              currentStep={currentStep}
              setStep={setStep}
              badgeCount="5"
            >
              <NashSubGroup currentStep={currentStep} setStep={setStep} />
            </NavGroup>

            {/* TEORÍA DE COLAS */}
            <NavGroup
              label="Teoría de Colas"
              steps={[]}
              baseIndex={200}
              currentStep={currentStep}
              setStep={setStep}
              badgeCount="6"
            >
              <QueueSubGroup
                label="Canal Simple M/M/1"
                steps={canalesSimpleSteps}
                currentStep={currentStep}
                setStep={setStep}
              />
              <QueueSubGroup
                label="Canales múltiples M/M/k"
                steps={mmkSteps}
                currentStep={currentStep}
                setStep={setStep}
              />
            </NavGroup>

            {/* FORMULACIÓN DE PROYECTOS */}
            <NavGroup
              label="Formulación de Proyectos"
              steps={projectFormulationSteps}
              baseIndex={300}
              currentStep={currentStep}
              setStep={setStep}
              badgeCount="3"
            />

          </nav>

          <div className="sb-footer">
            <span className="sb-footer-text">2026</span>
            <div className="sb-footer-dot" />
          </div>

        </div>
      </aside>
    </>
  );
};

export default Sidebar;
import React, { useEffect, useState } from "react";
import { defaultData } from "./data/defaultData";
import Sidebar from "./components/Sidebar";

import Step1 from "./steps/Step1";
import Step2 from "./steps/Step2";
import Step3 from "./steps/Step3";
import Step4 from "./steps/Step4";
import Step5 from "./steps/Step5";
import Step6 from "./steps/Step6";
import Step7 from "./steps/Step7";
import Step8 from "./steps/Step8";
import Step9 from "./steps/Step9";
import Step10 from "./steps/Step10";

// Teoría del Juego
import GameTheoryScreen from "./views/gameTheory/GameTheoryScreen";
import GameAnalysis from "./views/gameTheory/GameAnalysis";
import AlgebraicMethod from "./views/gameTheory/AlgebraicMethod";
import NashEquilibrium from "./views/gameTheory/NashEquilibrium";
import NashAnalysis from "./views/gameTheory/NashAnalysis";
import CanalesSimples from "./views/queues/CanalesSimples";
import CanalesSimpleAnalysis from "./views/queues/CanalesSimpleAnalysis";
import CanalesMultiples from "./views/queues/CanalesMultiples";
import CanalesMultiplesAnalysis from "./views/queues/CanalesMultiplesAnalysis";
import { safeJsonParse, toInteger } from "./utils/validation";

const defaultCanalesData = {
  llegadas: { cantidad: "", tiempo: "", unidad: "min" },
  servicio: { cantidad: "", tiempo: "", unidad: "min" },
  unidadBase: null,
  calcular: { poisson: true, exponencial: true, mm1: true },
  x: "",
  modoPoisson: "exact",
  t: "",
  pnCondicion: { modo: "greater_eq", valor: "3" },
};

const defaultCanalesMultiplesData = {
  llegadas: { cantidad: "", tiempo: "", unidad: "min" },
  servicio: { cantidad: "", tiempo: "", unidad: "min" },
  unidadBase: null,
  calcular: { poisson: false, exponencial: false, mmk: true },
  x: "",
  modoPoisson: "exact",
  t: "",
  numServidores: 2,
  pnCondicion: { modo: "greater_eq", valor: "3" },
};

const readStorage = (key, fallback) => {
  try {
    const parsed = safeJsonParse(localStorage.getItem(key), fallback);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const allowedSteps = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 100, 101, 102, 103, 104, 200, 201, 204, 205]);

function App() {
  const [step, setStep] = useState(() => {
    const saved = readStorage("io_step", 0);
    const parsed = toInteger(saved, 0);
    return Number.isInteger(parsed) && allowedSteps.has(parsed) ? parsed : 0;
  });

  const [canalesData, setCanalesData] = useState(() => {
    return readStorage("io_canales", defaultCanalesData);
  });

  const [canalesMultiplesData, setCanalesMultiplesData] = useState(() => {
    return readStorage("io_canales_mmk", defaultCanalesMultiplesData);
  });

  useEffect(() => {
    localStorage.setItem("io_canales", JSON.stringify(canalesData));
  }, [canalesData]);

  useEffect(() => {
    localStorage.setItem("io_canales_mmk", JSON.stringify(canalesMultiplesData));
  }, [canalesMultiplesData]);

  const [nashData, setNashData] = useState(() => {
    return readStorage("io_nash_data", {
      numPlayers: 2,
      matrix: [[["", ""], ["", ""]], [["", ""], ["", ""]]],
      rowNames: ["Estrategia 1", "Estrategia 2"],
      colNames: ["Estrategia 1", "Estrategia 2"],
      rowGroup: "Jugador 1",
      colGroup: "Jugador 2",
    });
  });

  useEffect(() => {
    localStorage.setItem("io_nash_data", JSON.stringify(nashData));
  }, [nashData]);

  const [data, setData] = useState(() => {
    return readStorage("io_data", defaultData);
  });

  const [gameMatrix, setGameMatrix] = useState(() => {
    return readStorage("io_game_data", null);
  });

  useEffect(() => {
    try {
      localStorage.setItem("io_step", String(step));
    } catch {
      // Ignorar errores de almacenamiento para no romper la navegación.
    }
  }, [step]);

  useEffect(() => {
    try {
      localStorage.setItem("io_data", JSON.stringify(data));
    } catch {
      // Ignorar errores de almacenamiento para no romper la navegación.
    }
  }, [data]);

  useEffect(() => {
    try {
      localStorage.setItem("io_game_data", JSON.stringify(gameMatrix));
    } catch {
      // Ignorar errores de almacenamiento para no romper la navegación.
    }
  }, [gameMatrix]);

  const next = () => setStep((s) => s + 1);
  const prev = () => setStep((s) => s - 1);

  const renderStep = () => {
    const props = { data, setData, next, prev };

    switch (step) {
      // =========================
      // DECISIÓN (0 - 9)
      // =========================
      case 0: return <Step1 {...props} />;
      case 1: return <Step2 {...props} />;
      case 2: return <Step3 {...props} />;
      case 3: return <Step4 {...props} />;
      case 4: return <Step5 {...props} />;
      case 5: return <Step6 {...props} />;
      case 6: return <Step7 {...props} />;
      case 7: return <Step8 {...props} />;
      case 8: return <Step9 {...props} />;
      case 9: return <Step10 {...props} />;

      // =========================
      // TEORÍA DEL JUEGO (100+)
      // =========================
      case 100:
        return (
          <GameTheoryScreen
            setStep={setStep}
            gameData={gameMatrix}
            setGameData={setGameMatrix}
          />
        );

      case 101:
        return (
          <GameAnalysis
            matrix={gameMatrix}
            onBack={() => setStep(100)}
            onOpenAlgebraic={() => setStep(102)}
          />
        );

      case 102:
        return (
          <AlgebraicMethod
            gameData={gameMatrix}
            onBack={() => setStep(101)}
            onGoData={() => setStep(100)}
          />
        );

      case 103:
        return (
          <NashEquilibrium
            nashData={nashData}
            setNashData={setNashData}
            onBack={() => setStep(100)}
            onGoAnalysis={() => setStep(104)}
          />
        );

      case 104:
        return (
          <NashAnalysis
            nashData={nashData}
            onBack={() => setStep(103)}
          />
        );

      case 200:
        return (
          <CanalesSimples
            data={canalesData}
            setData={setCanalesData}
            onNext={() => setStep(201)}
          />
        );

      case 201:
        return (
          <CanalesSimpleAnalysis
            data={canalesData}
            onBack={() => setStep(200)}
          />
        );

      case 204:
        return (
          <CanalesMultiples
            data={canalesMultiplesData}
            setData={setCanalesMultiplesData}
            onNext={() => setStep(205)}
          />
        );

      case 205:
        return (
          <CanalesMultiplesAnalysis
            data={canalesMultiplesData}
            onBack={() => setStep(204)}
          />
        );

      default:
        return <Step1 {...props} />;
    }

  };

  return (
    <div style={{ display: "flex" }}>
      {/* SIDEBAR */}
      <Sidebar currentStep={step} setStep={setStep} />

      {/* CONTENIDO PRINCIPAL */}
      <div style={content}>
        {renderStep()}
      </div>
    </div>
  );
}

export default App;

// =========================
// ESTILO CONTENIDO
// =========================

const content = {
  marginLeft: "260px",
  padding: "30px",
  width: "100%",
};
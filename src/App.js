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

//  Teoría del Juego
import GameTheoryScreen from "./views/gameTheory/GameTheoryScreen";
import GameAnalysis from "./views/gameTheory/GameAnalysis";
import AlgebraicMethod from "./views/gameTheory/AlgebraicMethod";

function App() {
  const [step, setStep] = useState(() => {
    try {
      const saved = localStorage.getItem("io_step");
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem("io_data");
      return saved ? JSON.parse(saved) : defaultData;
    } catch {
      return defaultData;
    }
  });

  const [gameMatrix, setGameMatrix] = useState(() => {
    try {
      const saved = localStorage.getItem("io_game_data");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem("io_step", String(step));
  }, [step]);

  useEffect(() => {
    localStorage.setItem("io_data", JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem("io_game_data", JSON.stringify(gameMatrix));
  }, [gameMatrix]);

  const next = () => setStep(step + 1);
  const prev = () => setStep(step - 1);

  const renderStep = () => {
    const props = { data, setData, next, prev };

    //  DECISIÓN (0 - 9)
    switch (step) {
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

      //  TEORÍA DEL JUEGO (100 - 199)
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

      default: return <Step1 {...props} />;
    }
  };

  return (
    <div style={{ display: "flex" }}>
      {/* SIDEBAR */}
      <Sidebar currentStep={step} setStep={setStep} />

      {/* CONTENIDO */}
      <div style={content}>
        {renderStep()}
      </div>
    </div>
  );
}

export default App;

//  estilos

const content = {
  marginLeft: "260px",
  padding: "30px",
  width: "100%"
};
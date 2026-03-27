import React, { useState } from "react";

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

function App() {
  const [step, setStep] = useState(0);

  const [data, setData] = useState({
    alternatives: ["A", "B", "C"],
    states: ["Alta", "Baja"],
    probabilities: [0.7, 0.3],
    payoff: [
      [30, -8],
      [20, 7],
      [5, 15]
    ]
  });

  const next = () => setStep(step + 1);
  const prev = () => setStep(step - 1);

  const renderStep = () => {
    const props = { data, setData, next, prev };

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

// 🎨 estilos

const content = {
  marginLeft: "260px",
  padding: "30px",
  width: "100%"
};
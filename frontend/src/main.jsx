import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import "./index.css";
import "./styles/aura-galaxy.css";
import "./styles/aura-foundation.css";
import "./styles/aura-block-one.css";
import "./styles/aura-agenda.css";
import "./styles/aura-finance.css";
import "./styles/aura-caja.css";
import "./styles/aura-closure.css";
import "./styles/aura-buttons.css";
import "./styles/aura-brand-controls.css";
import "./styles/aura-controls.css";
import "./styles/aura-states.css";
import "./styles/aura-rhythm.css";
import "./styles/aura-accessibility.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);

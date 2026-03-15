import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

import { init, miniApp } from "@telegram-apps/sdk";
import { App } from "./App";

const initializeTelegramSDK = async () => {
  try {
    await init();
    if (miniApp.ready.isAvailable()) {
      await miniApp.ready();
      console.log("Mini App ready");
    }
  } catch (error) {
    console.error("Xatolik:", error);
  }
};

initializeTelegramSDK();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

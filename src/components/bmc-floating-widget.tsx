"use client";

import { useEffect } from "react";

export function BMCFloatingWidget() {
  useEffect(() => {
    const SCRIPT_ID = "bmc-widget-script";
    const existingScript = document.getElementById(SCRIPT_ID);

    if (!existingScript && !document.getElementById("bmc-wbtn")) {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.setAttribute("data-name", "BMC-Widget");
      script.setAttribute("data-cfasync", "false");
      script.src = "https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js";
      script.setAttribute("data-id", "usamasarwar");
      script.setAttribute("data-description", "Support me on Buy me a coffee!");
      script.setAttribute("data-message", "");
      script.setAttribute("data-color", "#BD5FFF");
      script.setAttribute("data-position", "Right");
      script.setAttribute("data-x_margin", "18");
      script.setAttribute("data-y_margin", "18");
      script.async = true;

      script.onload = () => {
        // Trigger synthetic DOMContentLoaded event so the official script executes its DOMContentLoaded handler
        if (document.readyState === "complete" || document.readyState === "interactive") {
          window.dispatchEvent(new Event("DOMContentLoaded"));
        }
      };

      document.body.appendChild(script);
    } else if (!document.getElementById("bmc-wbtn")) {
      window.dispatchEvent(new Event("DOMContentLoaded"));
    }
  }, []);

  return null;
}

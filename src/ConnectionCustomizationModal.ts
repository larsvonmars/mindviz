export function showConnectionCustomizationModal(defaults: {
  sourceId: number;
  targetId: number;
  color?: string;
  width?: number;
  dasharray?: string;
  label?: string;
}): Promise<{
  color: string;
  width: number;
  dasharray: string;
  label: string;
}> {
  return new Promise((resolve) => {
    const modalOverlay = document.createElement("div");
    Object.assign(modalOverlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      background: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "10000",
    });

    const modalContainer = document.createElement("div");
    Object.assign(modalContainer.style, {
      background: "#fff",
      padding: "20px",
      borderRadius: "8px",
      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
      minWidth: "300px",
    });

    const title = document.createElement("h3");
    title.innerText = `Customize Connection (${defaults.sourceId} → ${defaults.targetId})`;
    title.style.marginBottom = "16px";
    modalContainer.appendChild(title);

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = defaults.color || "#ced4da";
    colorInput.style.width = "100%";
    colorInput.style.marginBottom = "10px";

    const widthInput = document.createElement("input");
    widthInput.type = "number";
    widthInput.placeholder = "Line Width (e.g. 2)";
    widthInput.value = defaults.width?.toString() || "2";
    widthInput.style.width = "100%";
    widthInput.style.marginBottom = "10px";

    const dashInput = document.createElement("input");
    dashInput.type = "text";
    dashInput.placeholder = "Dash Pattern (optional, e.g. 5,5)";
    dashInput.value = defaults.dasharray || "";
    dashInput.style.width = "100%";
    dashInput.style.marginBottom = "10px";

    const labelInput = document.createElement("input");
    labelInput.type = "text";
    labelInput.placeholder = "Connection Label (optional)";
    labelInput.value = defaults.label || "";
    labelInput.style.width = "100%";
    labelInput.style.marginBottom = "10px";

    modalContainer.appendChild(colorInput);
    modalContainer.appendChild(widthInput);
    modalContainer.appendChild(dashInput);
    modalContainer.appendChild(labelInput);

    const buttonContainer = document.createElement("div");
    Object.assign(buttonContainer.style, {
      display: "flex",
      justifyContent: "flex-end",
      gap: "10px",
    });

    const cancelButton = document.createElement("button");
    cancelButton.innerText = "Cancel";
    cancelButton.style.padding = "8px 12px";

    const okButton = document.createElement("button");
    okButton.innerText = "OK";
    okButton.style.padding = "8px 12px";

    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(okButton);
    modalContainer.appendChild(buttonContainer);
    modalOverlay.appendChild(modalContainer);
    document.body.appendChild(modalOverlay);

    cancelButton.addEventListener("click", () => {
      document.body.removeChild(modalOverlay);
      resolve({
        color: defaults.color || "#ced4da",
        width: defaults.width || 2,
        dasharray: defaults.dasharray || "",
        label: defaults.label || "",
      });
    });

    okButton.addEventListener("click", () => {
      document.body.removeChild(modalOverlay);
      resolve({
        color: colorInput.value,
        width: parseFloat(widthInput.value),
        dasharray: dashInput.value,
        label: labelInput.value,
      });
    });
  });
}

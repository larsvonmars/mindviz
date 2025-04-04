import { createBaseElement } from "./styles";

export function showConnectionCustomizationModal(defaults: {
  sourceId: number;
  targetId: number;
  color?: string;
  width?: number;
  dasharray?: string;
  label?: string;
}): Promise<{
  action: "update" | "delete";
  color?: string;
  width?: number;
  dasharray?: string;
  label?: string;
}> {
  return new Promise((resolve) => {
    const modalOverlay = createBaseElement<HTMLDivElement>('div', {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "10000",
      backdropFilter: "blur(2px)",
      transition: "opacity 0.3s ease",
      opacity: "0"
    });

    const modalContainer = createBaseElement<HTMLDivElement>('div', {
      background: "var(--mm-modal-bg, #fff)",
      padding: "32px",
      borderRadius: "16px",
      boxShadow: "0 12px 32px rgba(0,0,0,0.2)",
      width: "90%",
      maxWidth: "440px",
      transform: "scale(0.95)",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      opacity: "0"
    });

    setTimeout(() => {
      modalOverlay.style.opacity = "1";
      modalContainer.style.opacity = "1";
      modalContainer.style.transform = "scale(1)";
    }, 10);

    const title = createBaseElement<HTMLHeadingElement>('h3', {});
    title.innerText = `Customize Connection (${defaults.sourceId} → ${defaults.targetId})`;
    title.style.marginBottom = "16px";
    modalContainer.appendChild(title);

    // For simplicity, continue to use document.createElement for inputs.
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

    const buttonContainer = createBaseElement<HTMLDivElement>('div', {
      display: "flex",
      justifyContent: "flex-end",
      gap: "10px",
    });

    const deleteButton = createBaseElement<HTMLButtonElement>('button', {});
    deleteButton.className = "mm-button mm-button-danger";
    deleteButton.innerText = "Delete";
    deleteButton.addEventListener("click", () => {
      document.body.removeChild(modalOverlay);
      resolve({ action: "delete" });
    });

    const cancelButton = createBaseElement<HTMLButtonElement>('button', {});
    cancelButton.className = "mm-button mm-button-default";
    cancelButton.innerText = "Cancel";
    cancelButton.addEventListener("click", () => {
      document.body.removeChild(modalOverlay);
      resolve({
        action: "update",
        color: defaults.color || "#ced4da",
        width: defaults.width || 2,
        dasharray: defaults.dasharray || "",
        label: defaults.label || "",
      });
    });

    const okButton = createBaseElement<HTMLButtonElement>('button', {});
    okButton.className = "mm-button mm-button-default";
    okButton.innerText = "OK";
    okButton.addEventListener("click", () => {
      document.body.removeChild(modalOverlay);
      resolve({
        action: "update",
        color: colorInput.value,
        width: parseFloat(widthInput.value),
        dasharray: dashInput.value,
        label: labelInput.value,
      });
    });

    buttonContainer.appendChild(deleteButton);
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(okButton);
    modalContainer.appendChild(buttonContainer);
    modalOverlay.appendChild(modalContainer);
    document.body.appendChild(modalOverlay);
  });
}

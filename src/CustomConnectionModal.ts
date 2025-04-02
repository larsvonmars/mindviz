export function showConnectionModal(): Promise<{
  sourceId: number;
  targetId: number;
  color: string;
  width: number;
  dasharray: string;
  label: string;
} | null> {
  return new Promise((resolve) => {
    // Create modal overlay
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

    // Create modal container
    const modalContainer = document.createElement("div");
    Object.assign(modalContainer.style, {
      background: "#fff",
      padding: "20px",
      borderRadius: "8px",
      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
      minWidth: "300px",
    });

    // Title
    const title = document.createElement("h3");
    title.innerText = "Add Custom Connection";
    title.style.marginBottom = "16px";
    modalContainer.appendChild(title);

    // Create input fields
    const sourceInput = document.createElement("input");
    sourceInput.type = "number";
    sourceInput.placeholder = "Source Node ID";
    sourceInput.style.width = "100%";
    sourceInput.style.marginBottom = "10px";

    const targetInput = document.createElement("input");
    targetInput.type = "number";
    targetInput.placeholder = "Target Node ID";
    targetInput.style.width = "100%";
    targetInput.style.marginBottom = "10px";

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = "#ced4da";
    colorInput.style.width = "100%";
    colorInput.style.marginBottom = "10px";

    const widthInput = document.createElement("input");
    widthInput.type = "number";
    widthInput.placeholder = "Line Width (e.g. 2)";
    widthInput.value = "2";
    widthInput.style.width = "100%";
    widthInput.style.marginBottom = "10px";

    const dashInput = document.createElement("input");
    dashInput.type = "text";
    dashInput.placeholder = "Dash Pattern (optional, e.g. 5,5)";
    dashInput.style.width = "100%";
    dashInput.style.marginBottom = "10px";

    const labelInput = document.createElement("input");
    labelInput.type = "text";
    labelInput.placeholder = "Connection Label (optional)";
    labelInput.style.width = "100%";
    labelInput.style.marginBottom = "10px";

    // Append inputs to modal
    modalContainer.appendChild(sourceInput);
    modalContainer.appendChild(targetInput);
    modalContainer.appendChild(colorInput);
    modalContainer.appendChild(widthInput);
    modalContainer.appendChild(dashInput);
    modalContainer.appendChild(labelInput);

    // Button container
    const buttonContainer = document.createElement("div");
    Object.assign(buttonContainer.style, {
      display: "flex",
      justifyContent: "flex-end",
      gap: "10px"
    });

    const cancelButton = document.createElement("button");
    cancelButton.innerText = "Cancel";
    cancelButton.style.padding = "8px 12px";

    const addButton = document.createElement("button");
    addButton.innerText = "Add";
    addButton.style.padding = "8px 12px";

    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(addButton);
    modalContainer.appendChild(buttonContainer);

    modalOverlay.appendChild(modalContainer);
    document.body.appendChild(modalOverlay);

    // Event listeners for the buttons
    cancelButton.addEventListener("click", () => {
      document.body.removeChild(modalOverlay);
      resolve(null);
    });

    addButton.addEventListener("click", () => {
      const sourceId = parseInt(sourceInput.value);
      const targetId = parseInt(targetInput.value);
      const color = colorInput.value;
      const width = parseFloat(widthInput.value);
      const dasharray = dashInput.value;
      const label = labelInput.value;

      if (isNaN(sourceId) || isNaN(targetId)) {
        alert("Source and Target Node IDs must be valid numbers.");
        return;
      }

      document.body.removeChild(modalOverlay);
      resolve({ sourceId, targetId, color, width, dasharray, label });
    });
  });
}

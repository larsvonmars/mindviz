export function showStyleModal(defaultText: string, defaultBg: string, defaultDesc: string): Promise<{ text: string, background: string, description: string } | null> {
  // Helper function to create a form group
  const createFormGroup = (labelText: string, input: HTMLElement): HTMLElement => {
    const group = document.createElement("div");
    // ...existing code for group styling...
    const label = document.createElement("label");
    label.textContent = labelText;
    // ...existing code for label styling...
    group.appendChild(label);
    group.appendChild(input);
    return group;
  };

  // Helper to extract a solid color from a CSS background value
  const extractSolidColor = (bg: string): string | null => {
    const match = bg.match(/#[0-9a-f]{3,6}|rgb(a?)\([^)]+\)/i);
    return match ? match[0] : null;
  };

  return new Promise((resolve) => {
    const modalOverlay = document.createElement("div");
    Object.assign(modalOverlay.style, {
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
  
    const modal = document.createElement("div");
    Object.assign(modal.style, {
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
  
    // Fade in animation
    setTimeout(() => {
      modalOverlay.style.opacity = "1";
      modal.style.opacity = "1";
      modal.style.transform = "scale(1)";
    }, 10);
  
    // Header
    const header = document.createElement("h3");
    header.textContent = "Edit Node Style";
    // ...existing header styling...
    const headerUnderline = document.createElement("div");
    // ...existing header underline styling...
    header.appendChild(headerUnderline);
    modal.appendChild(header);
  
    // Text Input
    const textInput = document.createElement("input");
    Object.assign(textInput.style, {
      width: "100%",
      padding: "12px 16px",
      border: "1px solid var(--mm-input-border, #e9ecef)",
      borderRadius: "8px",
      fontSize: "14px",
      transition: "all 0.2s ease",
      background: "var(--mm-input-bg, #fff)",
      color: "var(--mm-input-text, #495057)"
    });
    textInput.value = defaultText;
    // ...focus and blur events for textInput...
  
    // Color Picker Group
    const colorGroup = document.createElement("div");
    Object.assign(colorGroup.style, {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
      gap: "12px",
      marginBottom: "20px"
    });
  
    const colorInput = document.createElement("input");
    colorInput.type = "color";
    Object.assign(colorInput.style, {
      width: "100%",
      height: "48px",
      borderRadius: "8px",
      border: "1px solid #e9ecef",
      cursor: "pointer"
    });
    colorInput.value = extractSolidColor(defaultBg) || "#ffffff";
  
    const bgInput = document.createElement("input");
    bgInput.type = "text";
    bgInput.placeholder = "CSS background value";
    Object.assign(bgInput.style, {
      width: "100%",
      padding: "12px 16px",
      border: "1px solid var(--mm-input-border, #e9ecef)",
      borderRadius: "8px",
      fontSize: "14px",
      transition: "all 0.2s ease",
      background: "var(--mm-input-bg, #fff)",
      color: "var(--mm-input-text, #495057)"
    });
    bgInput.value = defaultBg;
    // ...focus and blur events for bgInput...
  
    colorInput.addEventListener("input", () => (bgInput.value = colorInput.value));
    bgInput.addEventListener("input", () => {
      // Simple color validation using browser API
      const style = new Option().style;
      style.backgroundColor = bgInput.value;
      if (style.backgroundColor !== "") {
        colorInput.value = extractSolidColor(bgInput.value) || "#ffffff";
      }
    });
  
    // Description Textarea
    const descTextarea = document.createElement("textarea");
    Object.assign(descTextarea.style, {
      width: "100%",
      padding: "12px 16px",
      border: "1px solid var(--mm-input-border, #e9ecef)",
      borderRadius: "8px",
      fontSize: "14px",
      minHeight: "100px",
      resize: "vertical",
      transition: "all 0.2s ease",
      background: "var(--mm-input-bg, #fff)",
      color: "var(--mm-input-text, #495057)"
    });
    descTextarea.value = defaultDesc;
    // ...focus and blur events for descTextarea...
  
    // Append input groups
    modal.appendChild(createFormGroup("Node Text", textInput));
    const colorFormGroup = document.createElement("div");
    colorFormGroup.appendChild(createFormGroup("Background Color", colorInput));
    colorFormGroup.appendChild(createFormGroup("Custom Background", bgInput));
    modal.appendChild(colorFormGroup);
    modal.appendChild(createFormGroup("Description", descTextarea));
  
    // Button Group
    const buttonGroup = document.createElement("div");
    Object.assign(buttonGroup.style, {
      display: "flex",
      gap: "12px",
      justifyContent: "flex-end",
      marginTop: "24px"
    });
  
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    Object.assign(cancelButton.style, {
      padding: "12px 20px",
      border: "1px solid var(--mm-input-border, #e9ecef)",
      borderRadius: "8px",
      background: "none",
      cursor: "pointer",
      color: "var(--mm-input-text, #495057)",
      fontWeight: "500"
    });
    cancelButton.addEventListener("mouseover", () => {
      cancelButton.style.background = "#f8f9fa";
    });
    cancelButton.addEventListener("mouseout", () => {
      cancelButton.style.background = "none";
    });
  
    const saveButton = document.createElement("button");
    saveButton.textContent = "Save Changes";
    Object.assign(saveButton.style, {
      padding: "12px 24px",
      border: "none",
      borderRadius: "8px",
      background: "var(--mm-primary, #4dabf7)",
      color: "var(--mm-primary-contrast, #fff)",
      cursor: "pointer",
      fontWeight: "500",
      transition: "all 0.2s ease"
    });
    saveButton.addEventListener("mouseover", () => {
      saveButton.style.background = "var(--mm-primary-hover, #4dabf7)";
    });
    saveButton.addEventListener("mouseout", () => {
      saveButton.style.background = "var(--mm-primary, #4dabf7)";
    });
  
    cancelButton.addEventListener("click", () => {
      modalOverlay.style.opacity = "0";
      modal.style.opacity = "0";
      modal.style.transform = "scale(0.95)";
      setTimeout(() => {
        document.body.removeChild(modalOverlay);
        resolve(null);
      }, 300);
    });
  
    saveButton.addEventListener("click", () => {
      document.body.removeChild(modalOverlay);
      resolve({
        text: textInput.value,
        background: bgInput.value,
        description: descTextarea.value
      });
    });
  
    modal.addEventListener("keydown", (e) => {
      if (e.key === "Escape") cancelButton.click();
      if (e.key === "Enter" && e.ctrlKey) saveButton.click();
    });
  
    buttonGroup.append(cancelButton, saveButton);
    modal.appendChild(buttonGroup);
    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
    textInput.focus();
  });
}

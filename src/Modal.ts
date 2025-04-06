import { createBaseElement, createInput, createButton, CSS_VARS, extractSolidColor } from "./styles";

export function showStyleModal(defaultText: string, defaultBg: string, defaultDesc: string, defaultImageUrl: string = ""): Promise<{ text: string, background: string, description: string, imageUrl: string } | null> {
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
			transition: `opacity 0.3s ${CSS_VARS.transition}`,
			opacity: "0"
		});

		const modal = createBaseElement<HTMLDivElement>('div', {
			background: "var(--mm-modal-bg, #fff)",
			padding: "24px",
			borderRadius: "12px",
			boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
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

		// Header using utility element (styles can be further refined)
		const header = createBaseElement<HTMLHeadingElement>('h3', { /* ...existing header styles... */ });
		header.textContent = "Edit Node Style";
		modal.appendChild(header);

		// Create Text Input using utility function.
		const textInput = createInput();
		textInput.value = defaultText;
		// ...existing focus/blur events...
		// (Assume grouping of label and input happens similarly)
		modal.appendChild(textInput);

		// Create Color and Background inputs.
		const colorInput = createInput("color");
		colorInput.style.height = "48px";
		colorInput.value = extractSolidColor(defaultBg) || "#ffffff";

		const bgInput = createInput();
		bgInput.value = defaultBg;

		colorInput.addEventListener("input", () => (bgInput.value = colorInput.value));
		bgInput.addEventListener("input", () => {
			const style = new Option().style;
			style.backgroundColor = bgInput.value;
			if (style.backgroundColor !== "") {
				colorInput.value = extractSolidColor(bgInput.value) || "#ffffff";
			}
		});

		// Append color inputs (or wrap in form groups as needed)
		modal.appendChild(colorInput);
		modal.appendChild(bgInput);

		// Description textarea
		const descTextarea = createBaseElement<HTMLTextAreaElement>('textarea', {
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
		modal.appendChild(descTextarea);

		// Image URL input
		const imageUrlInput = createInput();
		imageUrlInput.placeholder = "Image URL";
		imageUrlInput.value = defaultImageUrl;
		modal.appendChild(imageUrlInput);

		// Button Group using utility button
		const buttonGroup = createBaseElement<HTMLDivElement>('div', {
			display: "flex",
			gap: "12px",
			justifyContent: "flex-end",
			marginTop: "24px"
		});

		const cancelButton = createButton(); // Secondary variant by default.
		cancelButton.textContent = "Cancel";
		cancelButton.addEventListener("click", () => {
			modalOverlay.style.opacity = "0";
			modal.style.opacity = "0";
			modal.style.transform = "scale(0.95)";
			setTimeout(() => {
				document.body.removeChild(modalOverlay);
				resolve(null);
			}, 300);
		});

		const saveButton = createButton("primary");
		saveButton.textContent = "Save Changes";
		saveButton.addEventListener("click", () => {
			document.body.removeChild(modalOverlay);
			resolve({
				text: textInput.value,
				background: bgInput.value,
				description: descTextarea.value,
				imageUrl: imageUrlInput.value
			});
		});

		buttonGroup.appendChild(cancelButton);
		buttonGroup.appendChild(saveButton);
		modal.appendChild(buttonGroup);

		modalOverlay.appendChild(modal);
		document.body.appendChild(modalOverlay);
		textInput.focus();
	});
}

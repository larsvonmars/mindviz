export const CSS_VARS = {
	primary: 'var(--mm-primary, #4dabf7)',
	primaryHover: 'var(--mm-primary-hover, #339af7)',
	danger: 'var(--mm-danger, #ff6b6b)',
	dangerHover: 'var(--mm-danger-hover, #c82333)',
	background: 'var(--mm-bg, #ffffff)',
	text: 'var(--mm-text, #495057)',
	border: 'var(--mm-border, #e9ecef)',
	radius: {
		sm: '4px',
		md: '8px',
		lg: '16px'
	},
	shadow: {
		sm: '0 2px 4px rgba(0,0,0,0.1)',
		md: '0 4px 8px rgba(0,0,0,0.15)',
		lg: '0 12px 32px rgba(0,0,0,0.2)'
	},
	spacing: {
		xs: '4px',
		sm: '8px',
		md: '16px',
		lg: '24px',
		xl: '32px'
	},
	transition: 'cubic-bezier(0.4, 0, 0.2, 1)',
	'modal-bg': 'var(--mm-modal-bg, #ffffff)',
	'modal-text': 'var(--mm-modal-text, #2d3436)',
	'modal-border': 'var(--mm-modal-border, #e0e0e0)',
	'modal-radius': '16px',
	'input-bg': 'var(--mm-input-bg, #f8f9fa)',
	'input-text': 'var(--mm-input-text, #495057)',
	'grid-color': 'var(--mm-grid-color, rgba(200, 200, 200, 0.3))',
	'grid-major-color': 'var(--mm-grid-major-color, rgba(150, 150, 150, 0.5))'
};

export const createBaseElement = <T extends HTMLElement>(tag: string, styles: Partial<CSSStyleDeclaration>): T => {
	const el = document.createElement(tag) as T;
	Object.assign(el.style, styles);
	return el;
};

export const createInput = (type: string = 'text'): HTMLInputElement => {
	const input = createBaseElement<HTMLInputElement>('input', {
		width: '100%',
		padding: CSS_VARS.spacing.sm,
		border: `1px solid ${CSS_VARS.border}`,
		borderRadius: CSS_VARS.radius.sm,
		fontSize: '14px',
		transition: `all 0.2s ${CSS_VARS.transition}`,
		background: CSS_VARS.background,
		color: CSS_VARS.text
	});
	input.type = type;
	return input;
};

export const createButton = (variant: 'primary' | 'secondary' | 'danger' = 'secondary'): HTMLButtonElement => {
	const button = createBaseElement<HTMLButtonElement>('button', {
		padding: `${CSS_VARS.spacing.sm} ${CSS_VARS.spacing.md}`,
		border: 'none',
		borderRadius: CSS_VARS.radius.sm,
		cursor: 'pointer',
		fontWeight: '500',
		transition: `all 0.2s ${CSS_VARS.transition}`,
		display: 'flex',
		alignItems: 'center',
		gap: CSS_VARS.spacing.sm
	});
	switch (variant) {
		case 'primary':
			button.style.background = CSS_VARS.primary;
			button.style.color = 'white';
			break;
		case 'danger':
			button.style.background = CSS_VARS.danger;
			button.style.color = 'white';
			break;
		default:
			button.style.background = 'none';
			button.style.border = `1px solid ${CSS_VARS.border}`;
			button.style.color = CSS_VARS.text;
	}
	button.addEventListener('mouseover', () => {
		if (variant === 'primary') {
			button.style.background = CSS_VARS.primaryHover;
		} else if (variant === 'danger') {
			button.style.background = CSS_VARS.dangerHover;
		} else {
			button.style.background = '#f8f9fa';
		}
	});
	button.addEventListener('mouseout', () => {
		if (variant === 'primary') {
			button.style.background = CSS_VARS.primary;
		} else if (variant === 'danger') {
			button.style.background = CSS_VARS.danger;
		} else {
			button.style.background = 'none';
		}
	});
	return button;
};

// Helper: extract a solid CSS color from a background value
export const extractSolidColor = (bg: string): string | null => {
	const match = bg.match(/#[0-9a-f]{3,6}|rgb(a?)\([^)]+\)/i);
	return match ? match[0] : null;
};

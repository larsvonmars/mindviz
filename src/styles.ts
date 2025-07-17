export const CSS_VARS = {
	// Primary colors with enhanced gradients
	primary: 'var(--mm-primary, #4dabf7)',
	primaryHover: 'var(--mm-primary-hover, #339af7)',
	primaryLight: 'var(--mm-primary-light, #e3f2fd)',
	primaryDark: 'var(--mm-primary-dark, #1976d2)',
	
	// Secondary and accent colors
	secondary: 'var(--mm-secondary, #6c757d)',
	accent: 'var(--mm-accent, #ff9800)',
	success: 'var(--mm-success, #28a745)',
	warning: 'var(--mm-warning, #ffc107)',
	danger: 'var(--mm-danger, #ff6b6b)',
	dangerHover: 'var(--mm-danger-hover, #c82333)',
	
	// Neutral colors
	background: 'var(--mm-bg, #ffffff)',
	backgroundSecondary: 'var(--mm-bg-secondary, #f8f9fa)',
	backgroundTertiary: 'var(--mm-bg-tertiary, #e9ecef)',
	text: 'var(--mm-text, #495057)',

        textSecondary: 'var(--mm-text-secondary, #6c757d)',
        textLight: 'var(--mm-text-light, #adb5bd)',
        textDark: 'var(--mm-text-dark, #212529)',
        'node-text': 'var(--mm-node-text, #000000)',
        'node-bg': 'var(--mm-node-bg, #ffffff)',
        'node-border-color': 'var(--mm-node-border-color, #e9ecef)',

	border: 'var(--mm-border, #e9ecef)',
	borderLight: 'var(--mm-border-light, #f1f3f4)',
	
	// Enhanced radius system
	radius: {
		xs: '2px',
		sm: '4px',
		md: '8px',
		lg: '12px',
		xl: '16px',
		xxl: '24px',
		full: '50%'
	},
	
	// Enhanced shadow system
	shadow: {
		xs: '0 1px 2px rgba(0,0,0,0.05)',
		sm: '0 2px 4px rgba(0,0,0,0.08)',
		md: '0 4px 12px rgba(0,0,0,0.12)',
		lg: '0 8px 24px rgba(0,0,0,0.15)',
		xl: '0 12px 32px rgba(0,0,0,0.18)',
		xxl: '0 24px 48px rgba(0,0,0,0.25)',
		inner: 'inset 0 2px 4px rgba(0,0,0,0.06)',
		glow: '0 0 20px rgba(77, 171, 247, 0.3)',
		glowLarge: '0 0 40px rgba(77, 171, 247, 0.2)'
	},
	
	// Enhanced spacing system
	spacing: {
		xs: '2px',
		sm: '4px',
		md: '8px',
		lg: '12px',
		xl: '16px',
		xxl: '24px',
		xxxl: '32px',
		huge: '48px'
	},
	
	// Enhanced transition system
	transition: {
		fast: '0.15s cubic-bezier(0.4, 0, 0.2, 1)',
		normal: '0.25s cubic-bezier(0.4, 0, 0.2, 1)',
		slow: '0.35s cubic-bezier(0.4, 0, 0.2, 1)',
		spring: '0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
		bounce: '0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
	},
	
	// Modal and overlay styles
	'modal-bg': 'var(--mm-modal-bg, #ffffff)',
	'modal-text': 'var(--mm-modal-text, #2d3436)',
	'modal-border': 'var(--mm-modal-border, #e0e0e0)',
	'modal-radius': '20px',
	'overlay-bg': 'rgba(0, 0, 0, 0.6)',
	
	// Input styles
	'input-bg': 'var(--mm-input-bg, #ffffff)',
	'input-text': 'var(--mm-input-text, #495057)',
	'input-border': 'var(--mm-input-border, #e9ecef)',
        'input-focus': 'var(--mm-input-focus, #4dabf7)',

        // Toolbar styles
        'toolbar-bg': 'var(--mm-toolbar-bg, rgba(248, 250, 252, 0.95))',
	
	// Grid and background patterns
	'grid-color': 'var(--mm-grid-color, rgba(200, 200, 200, 0.3))',
        'grid-major-color': 'var(--mm-grid-major-color, rgba(150, 150, 150, 0.5))',

        'connection-color': 'var(--mm-connection-color, #ced4da)',
	
	// Animation easing functions
	easing: {
		easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
		easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
		easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
		bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
		elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
	}
};

export const createBaseElement = <T extends HTMLElement>(tag: string, styles: Partial<CSSStyleDeclaration>): T => {
	const el = document.createElement(tag) as T;
	Object.assign(el.style, styles);
	return el;
};

export const createInput = (type: string = 'text'): HTMLInputElement => {
	const input = createBaseElement<HTMLInputElement>('input', {
		width: '100%',
		padding: `${CSS_VARS.spacing.lg} ${CSS_VARS.spacing.xl}`,
		border: `2px solid ${CSS_VARS['input-border']}`,
		borderRadius: CSS_VARS.radius.md,
		fontSize: '14px',
		fontWeight: '500',
		transition: `all ${CSS_VARS.transition.normal}`,
		background: CSS_VARS['input-bg'],
		color: CSS_VARS['input-text'],
		outline: 'none',
		boxShadow: CSS_VARS.shadow.xs
	});
	
	input.type = type;
	
	// Enhanced focus states
	input.addEventListener('focus', () => {
		input.style.borderColor = CSS_VARS['input-focus'];
		input.style.boxShadow = `${CSS_VARS.shadow.sm}, 0 0 0 3px rgba(77, 171, 247, 0.1)`;
		input.style.transform = 'translateY(-1px)';
	});
	
	input.addEventListener('blur', () => {
		input.style.borderColor = CSS_VARS['input-border'];
		input.style.boxShadow = CSS_VARS.shadow.xs;
		input.style.transform = 'translateY(0)';
	});
	
	return input;
};

export const createButton = (
        variant: 'primary' | 'secondary' | 'danger' = 'secondary',
        options?: { disableHoverEffect?: boolean }
): HTMLButtonElement => {
        const { disableHoverEffect = false } = options || {};
	const button = createBaseElement<HTMLButtonElement>('button', {
		padding: `${CSS_VARS.spacing.lg} ${CSS_VARS.spacing.xxl}`,
		border: 'none',
		borderRadius: CSS_VARS.radius.lg,
		cursor: 'pointer',
		fontWeight: '600',
		fontSize: '14px',
		transition: `all ${CSS_VARS.transition.normal}`,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: CSS_VARS.spacing.md,
		minWidth: '44px',
		minHeight: '44px',
		position: 'relative',
		overflow: 'hidden',
		outline: 'none',
		textTransform: 'none',
		letterSpacing: '0.025em'
	});
	
	// Create ripple effect container
	const rippleContainer = document.createElement('div');
	rippleContainer.style.cssText = `
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		overflow: hidden;
		border-radius: inherit;
	`;
	button.appendChild(rippleContainer);
	
	switch (variant) {
		case 'primary':
			button.style.background = `linear-gradient(135deg, ${CSS_VARS.primary}, ${CSS_VARS.primaryHover})`;
			button.style.color = 'white';
			button.style.boxShadow = `${CSS_VARS.shadow.md}, 0 0 20px rgba(77, 171, 247, 0.3)`;
			break;
		case 'danger':
			button.style.background = `linear-gradient(135deg, ${CSS_VARS.danger}, ${CSS_VARS.dangerHover})`;
			button.style.color = 'white';
			button.style.boxShadow = `${CSS_VARS.shadow.md}, 0 0 20px rgba(255, 107, 107, 0.3)`;
			break;
		default:
			button.style.background = `linear-gradient(145deg, ${CSS_VARS.background}, ${CSS_VARS.backgroundSecondary})`;
			button.style.border = `1px solid ${CSS_VARS.border}`;
			button.style.color = CSS_VARS.text;
			button.style.boxShadow = CSS_VARS.shadow.sm;
			button.style.backdropFilter = 'blur(10px)';
	}
	
        // Enhanced hover effects with better animations
        if (!disableHoverEffect) {
                button.addEventListener('mouseover', () => {
                        if (variant === 'primary') {
                                button.style.transform = 'translateY(-2px) scale(1.02)';
                                button.style.boxShadow = `${CSS_VARS.shadow.lg}, 0 0 30px rgba(77, 171, 247, 0.4)`;
                        } else if (variant === 'danger') {
                                button.style.transform = 'translateY(-2px) scale(1.02)';
                                button.style.boxShadow = `${CSS_VARS.shadow.lg}, 0 0 30px rgba(255, 107, 107, 0.4)`;
                        } else {
                                button.style.background = `linear-gradient(145deg, ${CSS_VARS.backgroundSecondary}, #ffffff)`;
                                button.style.transform = 'translateY(-2px) scale(1.02)';
                                button.style.boxShadow = `${CSS_VARS.shadow.md}, 0 0 15px rgba(77, 171, 247, 0.2)`;
                                button.style.borderColor = CSS_VARS.primary;
                        }
                });

                button.addEventListener('mouseout', () => {
                        if (variant === 'primary') {
                                button.style.transform = 'translateY(0) scale(1)';
                                button.style.boxShadow = `${CSS_VARS.shadow.md}, 0 0 20px rgba(77, 171, 247, 0.3)`;
                        } else if (variant === 'danger') {
                                button.style.transform = 'translateY(0) scale(1)';
                                button.style.boxShadow = `${CSS_VARS.shadow.md}, 0 0 20px rgba(255, 107, 107, 0.3)`;
                        } else {
                                button.style.background = `linear-gradient(145deg, ${CSS_VARS.background}, ${CSS_VARS.backgroundSecondary})`;
                                button.style.transform = 'translateY(0) scale(1)';
                                button.style.boxShadow = CSS_VARS.shadow.sm;
                                button.style.borderColor = CSS_VARS.border;
                        }
                });
        } else {
                // Simplified hover: only change border color
                button.addEventListener('mouseover', () => {
                        button.style.borderColor = CSS_VARS.primary;
                });
                button.addEventListener('mouseout', () => {
                        button.style.borderColor = CSS_VARS.border;
                });
        }
	
	// Enhanced click effect with ripple
        button.addEventListener('mousedown', (e) => {
                if (disableHoverEffect) {
                        button.style.transform = 'scale(0.98)';
                } else {
                        button.style.transform = button.style.transform.replace('scale(1.02)', 'scale(0.98)');
                }
		
		// Create ripple effect
		const rect = button.getBoundingClientRect();
		const size = Math.max(rect.width, rect.height);
		const x = e.clientX - rect.left - size / 2;
		const y = e.clientY - rect.top - size / 2;
		
		const ripple = document.createElement('div');
		ripple.style.cssText = `
			position: absolute;
			left: ${x}px;
			top: ${y}px;
			width: ${size}px;
			height: ${size}px;
			border-radius: 50%;
			background: rgba(255, 255, 255, 0.6);
			transform: scale(0);
			animation: ripple 0.6s ease-out;
			pointer-events: none;
		`;
		
		rippleContainer.appendChild(ripple);
		
		setTimeout(() => {
			ripple.remove();
		}, 600);
	});
	
        button.addEventListener('mouseup', () => {
                setTimeout(() => {
                        if (disableHoverEffect) {
                                button.style.transform = 'scale(1)';
                        } else if (variant === 'primary' || variant === 'danger') {
                                button.style.transform = 'translateY(-2px) scale(1.02)';
                        } else {
                                button.style.transform = 'translateY(-2px) scale(1.02)';
                        }
                }, 50);
        });
	
	return button;
};

// Helper: extract a solid CSS color from a background value
export const extractSolidColor = (bg: string): string | null => {
        const match = bg.match(/#[0-9a-f]{3,6}|rgb(a?)\([^)]+\)/i);
        return match ? match[0] : null;
};

// Force default MindViz CSS variables on the :root element
export const enforceCssVars = (): void => {
        if (typeof document === 'undefined') return;
        const root = document.documentElement;
        if (root.hasAttribute('data-mm-vars-injected')) return;
        root.setAttribute('data-mm-vars-injected', 'true');

        const vars: Record<string, string> = {
                '--mm-primary': '#4dabf7',
                '--mm-primary-hover': '#339af7',
                '--mm-primary-light': '#e3f2fd',
                '--mm-primary-dark': '#1976d2',
                '--mm-secondary': '#6c757d',
                '--mm-accent': '#ff9800',
                '--mm-success': '#28a745',
                '--mm-warning': '#ffc107',
                '--mm-danger': '#ff6b6b',
                '--mm-danger-hover': '#c82333',
                '--mm-bg': '#ffffff',
                '--mm-bg-secondary': '#f8f9fa',
                '--mm-bg-tertiary': '#e9ecef',
                '--mm-text': '#495057',
                '--mm-text-secondary': '#6c757d',
                '--mm-text-light': '#adb5bd',
                '--mm-text-dark': '#212529',
                '--mm-node-text': '#000000',
                '--mm-node-bg': '#ffffff',
                '--mm-node-border-color': '#e9ecef',
                '--mm-border': '#e9ecef',
                '--mm-border-light': '#f1f3f4',
                '--mm-input-bg': '#ffffff',
                '--mm-input-text': '#495057',
                '--mm-input-border': '#e9ecef',
                '--mm-input-focus': '#4dabf7',
                '--mm-toolbar-bg': 'rgba(248, 250, 252, 0.95)',
                '--mm-grid-color': 'rgba(200, 200, 200, 0.3)',
                '--mm-grid-major-color': 'rgba(150, 150, 150, 0.5)',
                '--mm-connection-color': '#ced4da',
                '--mm-modal-bg': '#ffffff',
                '--mm-modal-text': '#2d3436',
                '--mm-modal-border': '#e0e0e0',
                '--mm-overlay-bg': 'rgba(0, 0, 0, 0.6)'
        };

        for (const [key, value] of Object.entries(vars)) {
                root.style.setProperty(key, value, 'important');
        }
};

// Global CSS animations
export const injectGlobalStyles = () => {
        enforceCssVars();
        const style = document.createElement('style');
	style.textContent = `
		@keyframes ripple {
			0% {
				transform: scale(0);
				opacity: 1;
			}
			100% {
				transform: scale(4);
				opacity: 0;
			}
		}
		
		@keyframes fadeIn {
			from { opacity: 0; transform: translateY(20px); }
			to { opacity: 1; transform: translateY(0); }
		}
		
		@keyframes fadeInScale {
			from { opacity: 0; transform: scale(0.8); }
			to { opacity: 1; transform: scale(1); }
		}
		
		@keyframes slideInFromTop {
			from { opacity: 0; transform: translateY(-30px); }
			to { opacity: 1; transform: translateY(0); }
		}
		
		@keyframes slideInFromBottom {
			from { opacity: 0; transform: translateY(30px); }
			to { opacity: 1; transform: translateY(0); }
		}
		
		@keyframes slideInFromLeft {
			from { opacity: 0; transform: translateX(-30px); }
			to { opacity: 1; transform: translateX(0); }
		}
		
		@keyframes slideInFromRight {
			from { opacity: 0; transform: translateX(30px); }
			to { opacity: 1; transform: translateX(0); }
		}
		
		@keyframes pulse {
			0%, 100% { transform: scale(1); }
			50% { transform: scale(1.05); }
		}
		
		@keyframes bounce {
			0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
			40%, 43% { transform: translateY(-10px); }
			70% { transform: translateY(-5px); }
			90% { transform: translateY(-2px); }
		}
		
		@keyframes shake {
			0%, 100% { transform: translateX(0); }
			10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
			20%, 40%, 60%, 80% { transform: translateX(2px); }
		}
		
		@keyframes glow {
			0%, 100% { box-shadow: 0 0 20px rgba(77, 171, 247, 0.3); }
			50% { box-shadow: 0 0 30px rgba(77, 171, 247, 0.6); }
		}
		
		/* Utility classes for animations */
		.animate-fade-in { animation: fadeIn 0.3s ease-out; }
		.animate-fade-in-scale { animation: fadeInScale 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
		.animate-slide-in-top { animation: slideInFromTop 0.3s ease-out; }
		.animate-slide-in-bottom { animation: slideInFromBottom 0.3s ease-out; }
		.animate-slide-in-left { animation: slideInFromLeft 0.3s ease-out; }
		.animate-slide-in-right { animation: slideInFromRight 0.3s ease-out; }
		.animate-pulse { animation: pulse 2s infinite; }
		.animate-bounce { animation: bounce 1s; }
		.animate-shake { animation: shake 0.5s; }
		.animate-glow { animation: glow 2s infinite; }
		
		/* Enhanced transition utilities */
		.transition-all { transition: all ${CSS_VARS.transition.normal}; }
		.transition-fast { transition: all ${CSS_VARS.transition.fast}; }
		.transition-slow { transition: all ${CSS_VARS.transition.slow}; }
		.transition-spring { transition: all ${CSS_VARS.transition.spring}; }
		.transition-bounce { transition: all ${CSS_VARS.transition.bounce}; }
		
		/* Hover effects */
		.hover-lift:hover { transform: translateY(-2px); }
		.hover-scale:hover { transform: scale(1.05); }
		.hover-glow:hover { box-shadow: 0 0 20px rgba(77, 171, 247, 0.4); }
		
		/* Glass morphism effects */
		.glass {
			background: rgba(255, 255, 255, 0.1);
			backdrop-filter: blur(10px);
			border: 1px solid rgba(255, 255, 255, 0.2);
		}
		
		.glass-dark {
			background: rgba(0, 0, 0, 0.1);
			backdrop-filter: blur(10px);
			border: 1px solid rgba(255, 255, 255, 0.1);
		}
		
		/* Neumorphism effects */
		.neumorphic {
			background: linear-gradient(145deg, #ffffff, #f0f0f0);
			box-shadow: 20px 20px 60px #d9d9d9, -20px -20px 60px #ffffff;
		}
		
		.neumorphic-inset {
			background: linear-gradient(145deg, #f0f0f0, #ffffff);
			box-shadow: inset 20px 20px 60px #d9d9d9, inset -20px -20px 60px #ffffff;
		}
		
		/* Gradient backgrounds */
		.gradient-primary {
			background: linear-gradient(135deg, ${CSS_VARS.primary}, ${CSS_VARS.primaryHover});
		}
		
		.gradient-secondary {
			background: linear-gradient(135deg, ${CSS_VARS.backgroundSecondary}, ${CSS_VARS.background});
		}
		
		.gradient-danger {
			background: linear-gradient(135deg, ${CSS_VARS.danger}, ${CSS_VARS.dangerHover});
		}
		
		/* Scrollbar styling */
		::-webkit-scrollbar {
			width: 8px;
			height: 8px;
		}
		
		::-webkit-scrollbar-track {
			background: ${CSS_VARS.backgroundSecondary};
			border-radius: 4px;
		}
		
		::-webkit-scrollbar-thumb {
			background: ${CSS_VARS.border};
			border-radius: 4px;
			transition: background ${CSS_VARS.transition.normal};
		}
		
		::-webkit-scrollbar-thumb:hover {
			background: ${CSS_VARS.textSecondary};
		}
		
		/* Focus indicators */
		.focus-ring:focus {
			outline: 2px solid ${CSS_VARS.primary};
			outline-offset: 2px;
		}
		
		.focus-ring-inset:focus {
			outline: none;
			box-shadow: inset 0 0 0 2px ${CSS_VARS.primary};
		}
	`;
	
	document.head.appendChild(style);
};

// Utility functions for animations
export const animateElement = (element: HTMLElement, animation: string, duration: number = 300) => {
	return new Promise<void>((resolve) => {
		element.style.animation = `${animation} ${duration}ms ease-out`;
		element.addEventListener('animationend', () => {
			element.style.animation = '';
			resolve();
		}, { once: true });
	});
};

export const createLoadingSpinner = (size: number = 24): HTMLElement => {
	const spinner = createBaseElement<HTMLDivElement>('div', {
		width: `${size}px`,
		height: `${size}px`,
		border: `2px solid ${CSS_VARS.border}`,
		borderTop: `2px solid ${CSS_VARS.primary}`,
		borderRadius: '50%',
		animation: 'spin 1s linear infinite'
	});
	
	// Add spin animation if not already present
	if (!document.querySelector('#spinner-styles')) {
		const style = document.createElement('style');
		style.id = 'spinner-styles';
		style.textContent = `
			@keyframes spin {
				0% { transform: rotate(0deg); }
				100% { transform: rotate(360deg); }
			}
		`;
		document.head.appendChild(style);
	}
	
	return spinner;
};

export const createToast = (message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 3000): HTMLElement => {
	const toast = createBaseElement<HTMLDivElement>('div', {
		position: 'fixed',
		top: '20px',
		right: '20px',
		padding: `${CSS_VARS.spacing.lg} ${CSS_VARS.spacing.xxl}`,
		borderRadius: CSS_VARS.radius.lg,
		color: 'white',
		fontWeight: '500',
		fontSize: '14px',
		zIndex: '10001',
		opacity: '0',
		transform: 'translateX(100%)',
		transition: `all ${CSS_VARS.transition.spring}`,
		backdropFilter: 'blur(10px)',
		boxShadow: CSS_VARS.shadow.lg,
		maxWidth: '300px',
		wordWrap: 'break-word'
	});
	
	switch (type) {
		case 'success':
			toast.style.background = `linear-gradient(135deg, ${CSS_VARS.success}, #20a83a)`;
			break;
		case 'error':
			toast.style.background = `linear-gradient(135deg, ${CSS_VARS.danger}, ${CSS_VARS.dangerHover})`;
			break;
		default:
			toast.style.background = `linear-gradient(135deg, ${CSS_VARS.primary}, ${CSS_VARS.primaryHover})`;
	}
	
	toast.textContent = message;
	document.body.appendChild(toast);
	
	// Animate in
	setTimeout(() => {
		toast.style.opacity = '1';
		toast.style.transform = 'translateX(0)';
	}, 10);
	
	// Animate out
	setTimeout(() => {
		toast.style.opacity = '0';
		toast.style.transform = 'translateX(100%)';
		setTimeout(() => toast.remove(), 300);
	}, duration);
	
	return toast;
};

// Initialize global styles
if (typeof document !== 'undefined') {
	injectGlobalStyles();
}

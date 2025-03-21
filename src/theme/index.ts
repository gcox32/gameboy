export const theme = {
  colors: {
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    accent: '#0066cc',
    neutral: {
      100: '#f8f9fa',
      200: '#e9ecef',
      300: '#dee2e6',
      400: '#ced4da',
      500: '#adb5bd',
      600: '#6c757d',
      700: '#495057',
      800: '#343a40',
      900: '#212529'
    },
    surface: {
      light: '#ffffff',
      dark: '#1a1a1a'
    },
    text: {
      primary: '#212529',
      secondary: '#6c757d',
      light: '#ffffff',
      dark: '#000000',
      error: '#dc3545',
      success: '#28a745',
      warning: '#ffc107'
    },
    background: {
      primary: 'var(--background-color)',
      secondary: 'var(--hover-background-color)',
      error: '#fde8e8',
      success: '#e8f5e9',
      warning: '#fff8e1'
    },
    border: {
      primary: 'var(--border-color)',
      error: '#dc3545',
      success: '#28a745',
      warning: '#ffc107',
      subtle: 'rgba(0, 0, 0, 0.12)',
      default: 'rgba(0, 0, 0, 0.23)'
    },
    alert: {
      error: {
        background: '#fde8e8',
        text: '#dc3545',
        border: '#dc3545'
      },
      warning: {
        background: '#fff8e1',
        text: '#ffc107',
        border: '#ffc107'
      },
      success: {
        background: '#e8f5e9',
        text: '#28a745',
        border: '#28a745'
      },
      info: {
        background: 'var(--hover-background-color)',
        text: 'var(--foreground-rgb)',
        border: 'var(--border-color)'
      }
    },
    button: {
      primary: {
        background: '#6200ea',
        hover: '#3700b3',
        text: 'white',
        border: '#6200ea'
      },
      secondary: {
        background: '#f5f5f5',
        hover: '#e0e0e0', 
        text: '#424242',
        border: '#bdbdbd'
      },
      destructive: {
        background: '#dc3545',
        hover: '#c82333',
        text: 'white'
      }
    },
    hover: {
      bg: 'rgba(0, 0, 0, 0.04)'
    },
    pokemon: {
      normal: 'rgb(218, 207, 192)',
      fighting: 'rgb(198, 169, 130)',
      flying: 'rgb(214, 187, 187)',
      poison: 'rgb(162, 137, 162)',
      ground: 'rgb(205, 168, 120)',
      rock: 'rgb(157, 139, 139)',
      bug: 'rgb(180, 233, 180)',
      ghost: 'rgb(159, 158, 158)',
      fire: 'rgb(255, 181, 181)',
      water: 'rgb(164, 164, 253)',
      grass: 'rgb(131, 152, 131)',
      electric: 'rgb(255, 255, 188)',
      psychic: 'rgb(253, 210, 217)',
      ice: 'rgb(186, 249, 249)',
      dragon: 'rgb(255, 226, 171)'
    },
    system: {
      foreground: 'rgb(0, 0, 0)',
      background: 'white',
      link: '#333',
      border: '#ccc',
      hoverBackground: '#f5f5f5'
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  borderRadius: {
    sm: '2px',
    md: '4px',
    lg: '8px',
    full: '9999px'
  },
  typography: {
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '2rem'
    },
    fontWeights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },
  sizing: {
    button: {
      width: '220px',
      height: '48px'
    }
  },
  fonts: {
    mono: 'ui-monospace, Menlo, Monaco, "Cascadia Mono", "Segoe UI Mono", "Roboto Mono", "Oxygen Mono", "Ubuntu Monospace", "Source Code Pro", "Fira Mono", "Droid Sans Mono", "Courier New", monospace',
    gameboy: '"gameboy", sans-serif'
  }
};

export type Theme = typeof theme;

export const cssVariables = `
  :root {
    --accent-color: ${theme.colors.accent};
    --neutral-200: ${theme.colors.neutral[200]};
    --neutral-500: ${theme.colors.neutral[500]};
    --surface-color: ${theme.colors.surface.light};
    --text-primary: ${theme.colors.text.primary};
    --border-subtle: ${theme.colors.border.subtle};
    --hover-bg: ${theme.colors.hover.bg};
    --button-primary-bg: ${theme.colors.button.primary.background};
    --button-primary-hover: ${theme.colors.button.primary.hover};
    --button-primary-text: ${theme.colors.button.primary.text};
    
    --button-secondary-bg: ${theme.colors.button.secondary.background};
    --button-secondary-hover: ${theme.colors.button.secondary.hover};
    --button-secondary-text: ${theme.colors.button.secondary.text};
    --button-secondary-border: ${theme.colors.button.secondary.border};
    
    --button-destructive-bg: ${theme.colors.button.destructive.background};
    --button-destructive-hover: ${theme.colors.button.destructive.hover};
    --button-destructive-text: ${theme.colors.button.destructive.text};

    --border-radius-md: ${theme.borderRadius.md};
    --font-size-sm: ${theme.typography.fontSizes.sm};
    --font-weight-medium: ${theme.typography.fontWeights.medium};
    
    --foreground-rgb: ${theme.colors.system.foreground};
    --background-color: ${theme.colors.system.background};
    --link-color: ${theme.colors.system.link};
    --border-color: ${theme.colors.system.border};
    --hover-background-color: ${theme.colors.system.hoverBackground};
    
    --btn-width: ${theme.sizing.button.width};
    --btn-height: ${theme.sizing.button.height};
    
    --normal: ${theme.colors.pokemon.normal};
    --fighting: ${theme.colors.pokemon.fighting};
    --flying: ${theme.colors.pokemon.flying};
    --poison: ${theme.colors.pokemon.poison};
    --ground: ${theme.colors.pokemon.ground};
    --rock: ${theme.colors.pokemon.rock};
    --bug: ${theme.colors.pokemon.bug};
    --ghost: ${theme.colors.pokemon.ghost};
    --fire: ${theme.colors.pokemon.fire};
    --water: ${theme.colors.pokemon.water};
    --grass: ${theme.colors.pokemon.grass};
    --electric: ${theme.colors.pokemon.electric};
    --psychic: ${theme.colors.pokemon.psychic};
    --ice: ${theme.colors.pokemon.ice};
    --dragon: ${theme.colors.pokemon.dragon};
    
    --key-mapping-bg: ${theme.colors.surface.light};
    --key-mapping-container-bg: ${theme.colors.neutral[100]};
    --key-mapping-button-bg: ${theme.colors.neutral[200]};
    --key-mapping-button-hover: ${theme.colors.neutral[300]};
    --key-mapping-button-active: ${theme.colors.primary};
    --key-mapping-text: ${theme.colors.text.primary};
    --key-mapping-dot: ${theme.colors.accent};
  }

  [data-theme='dark'] {
    --accent-color: ${theme.colors.accent};
    --neutral-200: ${theme.colors.neutral[700]};
    --surface-color: ${theme.colors.surface.dark};
    --text-primary: ${theme.colors.text.light};
    --border-subtle: rgba(255, 255, 255, 0.12);
    --hover-bg: rgba(255, 255, 255, 0.04);
    --foreground-rgb: rgb(255, 255, 255);
    --link-color: #ccc;
    --background-color: #1a1a1a;
    --border-color: #555;
    --hover-background-color: #333;
    
    --key-mapping-bg: ${theme.colors.neutral[800]};
    --key-mapping-container-bg: ${theme.colors.neutral[900]};
    --key-mapping-button-bg: ${theme.colors.neutral[700]};
    --key-mapping-button-hover: ${theme.colors.neutral[600]};
    --key-mapping-text: ${theme.colors.text.light};
  }
`; 
const c = (v) => `hsl(var(--${v}) / <alpha-value>)`;

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: c('border'),
        input: c('input'),
        ring: c('ring'),
        background: c('background'),
        foreground: c('foreground'),
        primary: { DEFAULT: c('primary'), foreground: c('primary-foreground') },
        secondary: { DEFAULT: c('secondary'), foreground: c('secondary-foreground') },
        muted: { DEFAULT: c('muted'), foreground: c('muted-foreground') },
        accent: { DEFAULT: c('accent'), foreground: c('accent-foreground') },
        card: { DEFAULT: c('card'), foreground: c('card-foreground') },
        destaque: { DEFAULT: c('destaque'), texto: c('destaque-texto') },
      },
      borderRadius: {
        lg: '1rem',
        md: '0.75rem',
        sm: '0.5rem',
      },
      keyframes: {
        entrar: { from: { opacity: '0', transform: 'translateY(6px)' } },
        surgir: { from: { opacity: '0', transform: 'scale(0.97) translateY(-4px)' } },
        acender: { from: { opacity: '0.15' } },
        marchar: { to: { backgroundPosition: '12px 0' } },
        subir: { from: { transform: 'translateY(100%)' } },
        deslizar: { from: { transform: 'translateX(-100%)' } },
        tela: { from: { opacity: '0', transform: 'translateX(32px)' } },
        brotar: { from: { opacity: '0', transform: 'scale(0)' }, '60%': { transform: 'scale(1.25)' } },
      },
      animation: {
        entrar: 'entrar 320ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        surgir: 'surgir 160ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        acender: 'acender 1ms steps(1) both',
        marchar: 'marchar 400ms linear infinite',
        tela: 'tela 300ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        brotar: 'brotar 420ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'monospace'],
        dot: ['Doto', '"Space Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: {
          cyan: '#00D2FF',
          blue: '#0080FF',
          deepBlue: '#1D4ED8',
          indigo: '#3A0CA3',
          purple: '#7209B7',
          pink: '#FF4D6D',
          coral: '#FF006E',
          orange: '#FB5607',
          amber: '#FF9F1C',
          yellow: '#FFD166',
          green: '#10B981',
        },
        dark: {
          base: '#0B0F19',
          surface: '#111827',
          elevated: '#1F2937',
          subtle: '#182234',
        },
        light: {
          base: '#F8FAFC',
          surface: '#FFFFFF',
          elevated: '#FFFFFF',
          subtle: '#F1F5F9',
        },
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      boxShadow: {
        'glow-blue': '0 8px 28px -4px rgba(0, 128, 255, 0.25)',
        'glow-orange': '0 8px 28px -4px rgba(251, 86, 7, 0.25)',
        'glow-purple': '0 8px 28px -4px rgba(114, 9, 183, 0.25)',
      },
      backgroundImage: {
        'grad-primary':
          'linear-gradient(135deg, #00D2FF 0%, #0080FF 45%, #7209B7 100%)',
        'grad-accent':
          'linear-gradient(135deg, #FF006E 0%, #FB5607 50%, #FFD166 100%)',
        'grad-cyan-blue': 'linear-gradient(135deg, #00D2FF 0%, #0066FF 100%)',
        'grad-purple-pink': 'linear-gradient(135deg, #7209B7 0%, #FF006E 100%)',
        'grad-sunset': 'linear-gradient(135deg, #FB5607 0%, #FFD166 100%)',
      },
    },
  },
  plugins: [],
};

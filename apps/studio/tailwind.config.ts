import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Game View brand colors - Dark Coral Theme
        gv: {
          // Primary - Coral/Salmon (CTAs, active states)
          primary: {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#f97066', // Main coral
            600: '#ef4444',
            700: '#dc2626',
            800: '#b91c1c',
            900: '#991b1b',
          },
          // Accent - Teal/Cyan (secondary actions)
          accent: {
            50: '#f0fdfa',
            100: '#ccfbf1',
            200: '#99f6e4',
            300: '#5eead4',
            400: '#2dd4bf',
            500: '#14b8a6',
            600: '#0d9488',
            700: '#0f766e',
            800: '#115e59',
            900: '#134e4a',
          },
          // Neutral - Slate tones for dark UI
          neutral: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            750: '#283548',
            800: '#1e293b',
            900: '#0f172a',
            950: '#020617',
          },
          // Semantic colors
          success: {
            DEFAULT: '#22c55e',
            light: '#4ade80',
            dark: '#16a34a',
          },
          warning: {
            DEFAULT: '#f59e0b',
            light: '#fbbf24',
            dark: '#d97706',
            500: '#f59e0b',
          },
          error: {
            DEFAULT: '#ef4444',
            light: '#f87171',
            dark: '#dc2626',
          },
          info: {
            DEFAULT: '#3b82f6',
            light: '#60a5fa',
            dark: '#2563eb',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'gv': '12px',
        'gv-lg': '16px',
        'gv-xl': '20px',
      },
      boxShadow: {
        'gv': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
        'gv-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.2)',
        'gv-glow': '0 0 20px rgba(249, 112, 102, 0.3)',
      },
      backgroundImage: {
        'gv-gradient': 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        'gv-card': 'linear-gradient(180deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'hop': 'hop 0.6s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(249, 112, 102, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(249, 112, 102, 0.5)' },
        },
        'hop': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'fadeIn': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slideUp': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;

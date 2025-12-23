import type { Config } from 'tailwindcss'

const config: Config = {
  // Define quais arquivos o Tailwind deve analisar para aplicar os estilos
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}", // Adicionado caso você mantenha a pasta app
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Você pode personalizar as cores do Nexus Conect aqui
        nexus: {
          blue: "#3b82f6",
          dark: "#0f172a",
          accent: "#6366f1",
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}

export default config

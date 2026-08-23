/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0F17',
        surface: '#151D2A',
        surfaceSecondary: '#1E293B',
        border: '#334155',
        primary: '#3B82F6',
        accent: '#8B5CF6',
        textMuted: '#94A3B8',
        supported: '#10B981',
        unsupported: '#EF4444',
      },
    },
  },
  plugins: [],
}

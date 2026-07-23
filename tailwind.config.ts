import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0E1116', surface: '#171A21', surface2: '#1F232C',
        border: '#2A2F3A', ink: '#16181D',
        text: '#ECEEF1', text2: '#A2ABB8',
        copper: '#C0703B', nickel: '#6B7785', brand: '#2783DE',
        ok: '#46A171', warn: '#D5803B', danger: '#E56458',
      },
      borderRadius: { xl: '12px', lg: '8px' },
      fontFamily: { serif: ['Georgia', 'serif'], sans: ['Inter', 'system-ui', 'sans-serif'] },
      maxWidth: { content: '1200px' },
    },
  },
  plugins: [],
};
export default config;

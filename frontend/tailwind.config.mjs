import daisyui from 'daisyui'
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: { extend: {} },
  plugins: [daisyui], // no need to require daisyUI here
  daisyui:{
    themes: [...themes.map((t) => t.name)], // ✅ enable all themes dynamically

  }
};

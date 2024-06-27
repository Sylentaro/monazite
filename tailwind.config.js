/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  safelist: [
    'bg-orange-500',
    'bg-orange-600',
    // {
    //   pattern: /bg-(red|green|blue|orange)-(500|600)/, // You can display all the colors that you need
    // }
  ],
  // These paths are just examples, customize them to match your project structure
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans'],
        jakarta: ['Plus Jakarta Sans', 'sans-serif'],
        },
    },
  },
  plugins: [],
}

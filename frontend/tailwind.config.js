/** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
//   theme: {
//     extend: {
//       colors: {
//         primary: '#004aad',
//         secondary: '#050505',
//         accent: '#ff7eb3', // pinkish accent color
//       },
//       fontFamily: {
//         sans: ['"Poppins"', 'sans-serif'],
//       },
//     },
//   },
//   plugins: [],
// };
export const content = ['./index.html', './src/**/*.{js,jsx,ts,tsx}'];
export const theme = {
  extend: {
    colors: {
      primary: '#004aad',
      secondary: '#050505',
      accent: '#ff7eb3', // pinkish accent color
    },
    fontFamily: {
      sans: ['"Poppins"', 'sans-serif'],
    },
    animation: {
      'gradient-text': 'gradientMove 4s linear infinite',
      'zoom-out-fade': 'zoomOutFade 3s ease forwards',
      'fade-in-out': 'fadeInOut 2.5s ease',
      'fade-in': 'fadeIn 1s ease forwards',
      'slide-in-right': 'slideInRight 3.5s ease forwards',
    },
    keyframes: {
    gradientMove: {
      '0%': { backgroundPosition: '0% 50%' },
      '100%': { backgroundPosition: '200% 50%' },
    },
    zoomOutFade: {
      '0%': { transform: 'scale(1)', opacity: '1' },
      '100%': { transform: 'scale(1.5)', opacity: '0' },
    },
      fadeInOut: {
        '0%, 100%': {opacity: 0,transform: 'translate(-50%, -20%)',},
        '10%, 90%': {opacity: 1,transform: 'translate(-50%, -50%)',},
      },
      fadeIn: {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
      slideInRight: {
        '0%': { transform: 'translateY(100%)', opacity: '0' },
        '100%': { transform: 'translateY(0)', opacity: '1' },
      },
    },
    backgroundSize: {
    '200%': '200% 200%',
    },
  },
};
export const plugins = [require("tailwindcss-animate")];
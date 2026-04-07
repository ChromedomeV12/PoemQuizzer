/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 水墨 (ink wash) palette
        ink: {
          50: '#f9f8f6',
          100: '#f0ede7',
          200: '#e0d9ce',
          300: '#c8bba9',
          400: '#a89580',
          500: '#8c7562',
          600: '#735e4f',
          700: '#5d4c41',
          800: '#4d4038',
          900: '#423732',
          950: '#251e1a',
        },
        // 朱红 (vermilion / seal stamp)
        seal: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#c0392b',
          600: '#a93226',
          700: '#922b21',
          800: '#7b241c',
          900: '#641e16',
        },
        // 竹青 (bamboo green)
        bamboo: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#2d8659',
          600: '#24704a',
          700: '#1e5e3e',
          800: '#194c33',
          900: '#15402b',
        },
        // 金色 (gold accent)
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#d4a017',
          500: '#b8860b',
          600: '#996515',
          700: '#7a5010',
          800: '#63400d',
          900: '#4d3209',
        },
        success: '#2d8659',
        danger: '#c0392b',
        warning: '#d4a017',
      },
      fontFamily: {
        // Chinese calligraphy fonts
        'kai': ['"KaiTi"', '"STKaiti"', '"AR PL UKai CN"', 'KaiTi', 'serif'],
        'song': ['"SimSun"', '"STSong"', '"AR PL SungtiL GB"', 'serif'],
        'brush': ['"Ma Shan Zheng"', '"ZCOOL XiaoWei"', 'cursive', 'serif'],
      },
      backgroundImage: {
        // Rice paper texture gradient
        'paper': 'linear-gradient(135deg, #f9f8f6 0%, #f0ede7 50%, #e8e4dc 100%)',
        // Ink wash gradient
        'ink-wash': 'linear-gradient(135deg, #423732 0%, #5d4c41 30%, #8c7562 60%, #c8bba9 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'brush-stroke': 'brushStroke 1s ease-out',
        'seal-stamp': 'sealStamp 0.3s ease-out',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        brushStroke: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        sealStamp: {
          '0%': { transform: 'scale(2)', opacity: '0' },
          '50%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      boxShadow: {
        'ink': '0 4px 20px rgba(66, 55, 50, 0.15)',
        'paper': '0 2px 8px rgba(66, 55, 50, 0.08), 0 1px 3px rgba(66, 55, 50, 0.06)',
        'seal': '0 0 0 2px rgba(192, 57, 43, 0.3)',
      },
    },
  },
  plugins: [],
};

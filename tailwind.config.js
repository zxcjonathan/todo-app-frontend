/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}" // 告訴 Tailwind 掃描這些路徑下的文件來生成需要的 CSS
  ],
  theme: {
    extend: {}, // 在這裡擴展 Tailwind 預設主題 (顏色、字體、間距等)
  },
  plugins: [], // 在這裡添加 Tailwind 插件 (如排版插件)
}
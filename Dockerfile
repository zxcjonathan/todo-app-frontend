# frontend/Dockerfile

# 第一階段：構建階段
# 使用 Node.js 18 的官方長期支持 (LTS) 版本作為基礎映像
FROM node:18-alpine as builder

# 設定工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝前端依賴
RUN npm install

# 複製所有前端程式碼
COPY . .

# 執行 React 應用程式的構建命令
# 這會生成一個優化過的靜態檔案集 (通常在 build/ 資料夾)
RUN npm run build

# 第二階段：生產階段 (使用輕量級的 Nginx 服務靜態文件)
FROM nginx:alpine

# 將構建階段生成的靜態文件複製到 Nginx 的默認靜態文件目錄
COPY --from=builder /app/build /usr/share/nginx/html

# 暴露 Nginx 將運行的埠號
EXPOSE 80

# 啟動 Nginx 服務
CMD ["nginx", "-g", "daemon off;"]
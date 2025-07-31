// todo-app/frontend/src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // 引入主要的 CSS 檔案 (可能包含 TailwindCSS)
import App from './App'; // 引入 App 組件，這是我們應用程式的根組件
import reportWebVitals from './reportWebVitals'; // 用於性能測量，可選

// 創建 React 應用程式的根節點，並將其連接到 HTML 頁面中 ID 為 'root' 的元素
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App /> {/* 渲染 App 組件 */}
  </React.StrictMode>
);

// 用於記錄應用程式性能指標，可選
reportWebVitals();

// todo-app/frontend/src/App.js

import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios'; // 引入 axios
import './App.css'; // 確保您有這個 CSS 檔案，或調整路徑

// -----------------------------------------------------
// 核心配置：定義後端 API 的基本 URL
// 這將確保所有 axios 請求都指向正確的後端地址
// -----------------------------------------------------
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001'; // 後端伺服器的根 URL

// 業界推薦做法：為 axios 建立一個實例，設定 baseURL
// 這樣所有透過這個 `api` 實例發送的請求都會自動帶上 `baseURL`
const api = axios.create({
  baseURL: API_BASE_URL,
});

export default function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const notificationIntervalRef = useRef(null); // 用於保存定時器 ID

  // 載入待辦事項
  useEffect(() => {
    fetchTodos();

    // 在組件卸載時清除定時器
    return () => {
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current);
      }
    };
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await api.get('/todos');
      setTodos(response.data);
      // 獲取待辦事項後，開始檢查提醒
      startNotificationCheck(response.data);
    } catch (error) {
      console.error('Error fetching todos:', error);
      // 在控制台打印錯誤，不使用 alert() 以避免阻礙用戶界面
      console.log('Failed to load todos. Please check server connection and network tab in browser developer tools.');
    }
  };

  const addTodo = async () => {
    if (!title.trim()) { // trim() 用於去除前後空白，確保標題不只是空白字元
      console.log('待辦事項標題不能為空！');
      return;
    }
    try {
      const res = await api.post('/todos', { // 使用 api 實例，發送 title 和 dueDate
        title,
        dueDate // 這裡的 dueDate 將直接傳遞到後端，例如 "2025-07-28T15:30"
      });
      // 將新創建的待辦事項添加到列表最前面
      setTodos([res.data, ...todos]);
      setTitle(''); // 清空標題輸入框
      setDueDate(''); // 清空日期輸入框
      // 新增任務後，重新檢查提醒
      startNotificationCheck([res.data, ...todos]);
    } catch (error) {
      console.error('Error adding todo:', error);
      console.log('Failed to add todo. Please try again.');
    }
  };

  const toggleComplete = async (id, currentCompletedStatus) => {
    try {
      await api.put(`/todos/${id}`, { completed: !currentCompletedStatus }); // 修改為 PUT 請求，並傳遞 completed 狀態
      // 局部更新前端狀態，避免重新載入所有待辦事項，提高效率
      setTodos(prevTodos => {
        const updatedTodos = prevTodos.map(t =>
          t.id === id ? { ...t, completed: !t.completed } : t
        );
        // 更新後重新檢查提醒，特別是如果任務被標記為完成
        startNotificationCheck(updatedTodos);
        return updatedTodos;
      });
    } catch (error) {
      console.error('Error toggling complete status:', error);
      console.log('Failed to update todo status.');
    }
  };

  const deleteTodo = async (id) => {
    try {
      await api.delete(`/todos/${id}`);
      setTodos(prevTodos => {
        const updatedTodos = prevTodos.filter(t => t.id !== id);
        // 刪除任務後，重新檢查提醒
        startNotificationCheck(updatedTodos);
        return updatedTodos;
      });
    } catch (error) {
      console.error('Error deleting todo:', error);
      console.log('Failed to delete todo.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return '無效日期';
    }
    return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
  };

  // -----------------------------------------------------
  // 🔔 任務提醒通知功能
  // -----------------------------------------------------

  // 請求通知權限
  const requestNotificationPermission = () => {
    if (!("Notification" in window)) {
      console.log("此瀏覽器不支持桌面通知。");
      return;
    }
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        console.log("通知權限已授予。");
        // 如果已經有待辦事項，立即開始檢查
        startNotificationCheck(todos);
      } else if (permission === "denied") {
        console.log("通知權限被拒絕。");
      } else {
        console.log("通知權限被忽略。");
      }
    });
  };

  // 發送單個通知
  const sendNotification = (title, body) => {
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    }
  };

  // 檢查並發送提醒
  const checkAndSendReminders = (currentTodos) => {
    const now = new Date();
    currentTodos.forEach(todo => {
      // 只有未完成的任務才發送提醒
      if (!todo.completed && todo.dueDate) {
        const dueDate = new Date(todo.dueDate);
        // 如果到期時間在未來，且在提醒範圍內 (例如：提前 10 分鐘)
        // 這裡可以根據需求調整提前提醒的時間
        const reminderTime = new Date(dueDate.getTime() - 10 * 60 * 1000); // 提前 10 分鐘提醒

        // 判斷是否在提醒時間範圍內，且還未過期
        if (reminderTime <= now && now < dueDate) {
          // 為了避免重複提醒，我們需要一個機制來標記已提醒的任務
          // 這裡簡化處理，實際應用中可以將提醒狀態存儲在 localStorage 或後端
          // 為了演示，我們簡單地檢查是否已提醒過 (這在刷新頁面後會重置)
          if (!sessionStorage.getItem(`notified-${todo.id}`)) {
            sendNotification(`待辦事項提醒：${todo.title}`, `任務將在 ${formatDate(dueDate)} 到期！`);
            sessionStorage.setItem(`notified-${todo.id}`, 'true'); // 標記為已提醒
          }
        }
        // 如果任務已經過期但未完成，也可以發送一個「逾期」提醒
        else if (now >= dueDate && !sessionStorage.getItem(`overdue-notified-${todo.id}`)) {
            sendNotification(`逾期任務：${todo.title}`, `任務已於 ${formatDate(dueDate)} 過期！`);
            sessionStorage.setItem(`overdue-notified-${todo.id}`, 'true');
        }
      }
    });
  };

  // 啟動提醒檢查定時器
  const startNotificationCheck = (currentTodos) => {
    // 先清除舊的定時器，避免重複
    if (notificationIntervalRef.current) {
      clearInterval(notificationIntervalRef.current);
    }
    // 每分鐘檢查一次提醒 (可以調整頻率)
    notificationIntervalRef.current = setInterval(() => {
      checkAndSendReminders(currentTodos);
    }, 60 * 1000); // 每 1 分鐘檢查一次
  };


  // -----------------------------------------------------
  // 📋 行程表/待辦清單視圖 (簡單的日期分組)
  // -----------------------------------------------------
  // 將 todos 按照日期分組
  const groupedTodos = todos.reduce((acc, todo) => {
    const dateKey = todo.dueDate ? new Date(todo.dueDate).toDateString() : '無日期';
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(todo);
    return acc;
  }, {});

  // 將分組後的對象轉換為可迭代的陣列，並按日期排序
  const sortedGroupedTodos = Object.entries(groupedTodos).sort(([dateA], [dateB]) => {
    if (dateA === '無日期') return 1;
    if (dateB === '無日期') return -1;
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });


  return (
    <div className="p-6 max-w-md mx-auto bg-gray-50 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">📝 Todo List</h1>
      <div className="flex mb-4 gap-2">
        <input
          className="border p-2 flex-1 rounded"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="待辦事項"
        />
        <input
          type="datetime-local"
          className="border p-2 rounded"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
        />
        <button onClick={addTodo} className="bg-blue-500 text-white px-4 py-2 rounded">新增</button>
      </div>

      {/* 新增通知權限請求按鈕 */}
      <div className="mb-4">
        <button
          onClick={requestNotificationPermission}
          className="bg-green-500 text-white px-4 py-2 rounded w-full"
        >
          請求通知權限
        </button>
      </div>

      {/* 顯示分組後的待辦事項 */}
      {sortedGroupedTodos.length === 0 ? (
        <p className="text-gray-600 text-center">目前沒有待辦事項。</p>
      ) : (
        sortedGroupedTodos.map(([dateKey, todosInGroup]) => (
          <div key={dateKey} className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-700">
              {dateKey === '無日期' ? '無日期任務' : formatDate(dateKey).split(' ')[0]} {/* 僅顯示日期部分 */}
            </h2>
            <ul>
              {todosInGroup.map(todo => (
                <li key={todo.id} className="flex justify-between items-center p-2 mb-2 border rounded bg-white">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2 w-5 h-5"
                      checked={!!todo.completed}
                      onChange={() => toggleComplete(todo.id, todo.completed)}
                    />
                    <span className={todo.completed ? 'line-through text-gray-500' : ''}>
                      {todo.title} {todo.dueDate && `（${formatDate(todo.dueDate)}）`}
                    </span>
                  </div>
                  <button onClick={() => deleteTodo(todo.id)} className="text-red-500 hover:text-red-700 ml-2">刪除</button>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}

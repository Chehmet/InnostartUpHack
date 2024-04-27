const socket = new WebSocket('ws://localhost:8765');

// Обработчик события при открытии соединения
socket.onopen = function(event) {
    appendMessage('WebSocket connected');
};

// Обработчик события при закрытии соединения
socket.onclose = function(event) {
    appendMessage('WebSocket disconnected');
};

// Функция для добавления сообщения на веб-страницу
function appendMessage(message) {
    const messagesDiv = document.getElementById('messages');
    const p = document.createElement('p');
    p.textContent = message;
    messagesDiv.appendChild(p);
}

// Обработчик события при получении сообщения
socket.onmessage = function(event) {
    const receivedData = JSON.parse(event.data); // Парсим JSON-строку в JavaScript объект
    console.log('Received message:', receivedData); // Выводим полученные данные в консоль для отладки

    // Добавляем логику для обработки полученных данных
    // Например, вы можете отобразить их на веб-странице, добавив элементы HTML
    const messagesDiv = document.getElementById('messages');
    const p = document.createElement('p');
    p.textContent = 'Received message: ' + event.data;
    messagesDiv.appendChild(p);
};

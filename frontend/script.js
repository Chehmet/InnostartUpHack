const socket = new WebSocket('ws://localhost:8766');

    // WebSocket event handler for connection opening
    socket.onopen = function(event) {
        console.log('WebSocket connected');
    };

    // WebSocket event handler for receiving messages
    socket.onmessage = function(event) {
        console.log('Received message:', event.data);
        // Process received data and display it on the web page
        const data = JSON.parse(event.data);
        updateHeatMap(data);
    };

    // WebSocket event handler for connection closing
    socket.onclose = function(event) {
        console.log('WebSocket disconnected');
    };

    // Function to update the heatmap based on backend data
    function rotateMatrix(matrix, angle) {
        // Convert angle to radians
        const radians = angle * Math.PI / 180;
        const cosAngle = Math.cos(radians);
        const sinAngle = Math.sin(radians);

        // Calculate new dimensions of the rotated matrix
        const width = matrix[0].length;
        const height = matrix.length;

        // Initialize a new matrix to store the rotated values
        const rotatedMatrix = new Array(height);
        for (let i = 0; i < height; i++) {
            rotatedMatrix[i] = new Array(width);
        }

        // Calculate the center of the original matrix
        const centerX = width / 2;
        const centerY = height / 2;

        // Perform rotation for each element in the original matrix
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // Calculate the coordinates of the original point relative to the center
                const xOffset = x - centerX;
                const yOffset = y - centerY;

                // Apply rotation
                const rotatedX = Math.round(xOffset * cosAngle - yOffset * sinAngle + centerX);
                const rotatedY = Math.round(xOffset * sinAngle + yOffset * cosAngle + centerY);

                // Assign the value to the corresponding position in the rotated matrix
                if (rotatedX >= 0 && rotatedX < width && rotatedY >= 0 && rotatedY < height) {
                    rotatedMatrix[rotatedY][rotatedX] = matrix[y][x];
                }
            }
        }

        return rotatedMatrix;
    }

    function updateHeatMap(data) {
        const fieldData = data.field; // Access the 'field' property of the data
        // Append additional circles to the field data
        // fieldData[9][8] = 'orange'; // Orange circle at coordinates (9, 15)
        // fieldData[10][11] = 'red'; // Red circle at coordinates (10, 8)
        // fieldData[10][13] = 'black'; // Black circle at coordinates (10, 6)
        // fieldData[8][11] = 'green'; // Green circle at coordinates (8, 8)
        // fieldData[9][14] = 'purple'; // Purple circle at coordinates (9, 5)

        fieldData[9][8] = -1; // Orange circle at coordinates (9, 15)
        fieldData[10][11] = -1; // Red circle at coordinates (10, 8)
        fieldData[10][13] = -1; // Black circle at coordinates (10, 6)
        fieldData[8][11] = -1; // Green circle at coordinates (8, 8)
        fieldData[9][14] = -1; // Purple circle at coordinates (9, 5)

        // Rotate the field data by -30 degrees
        const rotatedFieldData = rotateMatrix(fieldData, 35);

        const intersection = document.getElementById('intersection');

        // Clear previous content
        intersection.innerHTML = '';

        // Create new heatmap
        for (let i = 0; i < rotatedFieldData.length; i++) {
            for (let j = 0; j < rotatedFieldData[i].length; j++) {
                const value = rotatedFieldData[i][19-j];
                const square = document.createElement('div');
                square.classList.add('square');
                // Check if the square is at coordinates (9, 8)
                // if (value==='orange') {
                //     square.style.backgroundColor = 'orange'; // Set the color to orange
                // } else if (value==='red') {
                //   square.style.backgroundColor = 'red'; // Set the color to red for coordinates (10, 11)
                // } else if (value==='black') {
                //   square.style.backgroundColor = 'black';
                // } else if (value==='green') {
                //   square.style.backgroundColor = 'green';
                // } else if (value==='purple') {
                //   square.style.backgroundColor = 'purple';
                if (value===-1){
                  square.style.backgroundColor = 'black';
                } else {
                    square.style.backgroundColor = getColor(value); // Use getColor function for other squares
                }
                intersection.appendChild(square);
            }
        }
    }

    // Function to determine color based on value
    function getColor(value) {
    if (value === 0) {
        return 'transparent'; // Make the cell transparent if value is 0
    } else {
        // Normalize the value to the range [0, 1]
        const normalizedValue = Math.min(1, value / 100);

        // Interpolate between blue and red based on the normalized value
        const r = Math.round(255 * normalizedValue); // Red component
        const b = Math.round(255 * (1 - normalizedValue)); // Blue component

        // Convert RGB values to hexadecimal notation
        const redHex = r.toString(16).padStart(2, '0'); // Convert red component to hexadecimal and ensure it has at least two digits
        const blueHex = b.toString(16).padStart(2, '0'); // Convert blue component to hexadecimal and ensure it has at least two digits

        // Return the hexadecimal color string
        return `#${redHex}00${blueHex}`; // Green component is omitted, resulting in a combination of red and blue
    }
}

// Создание графика на основе данных
function createChart(ctx, data) {
    return new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: false,
            maintainAspectRatio: false,
            scales: {
                xAxes: [{
                    type: 'time',
                    time: {
                        unit: 'minute'
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'Время'
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Количество транспорта'
                    }
                }]
            }
        }
    });
}

// Получение случайных данных
function getRandomData(timeRange) {
    const data = {
        labels: [],
        datasets: []
    };

    const colors = ['#FF5733', '#33FFA1', '#3366FF', '#FF33FF', '#FFFF33', '#33FFFF'];
    const types = ['Мотоциклы', 'Легковой автомобиль', 'Легковой автомобиль с прицепом', 'Грузовой автомобиль', 'Автопоезд', 'Автобус'];

    for (let i = 0; i < timeRange; i++) {
        data.labels.push(new Date(Date.now() - (timeRange - i - 1) * 60 * 1000).toLocaleTimeString('ru-RU'));
    }

    for (let i = 0; i < 6; i++) {
        const dataset = {
            label: types[i],
            backgroundColor: colors[i],
            borderColor: colors[i],
            data: []
        };

        for (let j = 0; j < timeRange; j++) {
            dataset.data.push(Math.floor(Math.random() * 20)); // Генерируем случайное количество транспорта от 0 до 20
        }

        data.datasets.push(dataset);
    }

    return data;
}

// Обновление графика при изменении временного диапазона
function updateChart(timeRange) {
    const ctx = document.getElementById('chartCanvas').getContext('2d');
    const data = getRandomData(timeRange);

    // Если график уже существует, удаляем его
    if (window.myChart) {
        window.myChart.destroy();
    }

    // Создаем новый график
    window.myChart = createChart(ctx, data);
}

// Обработчик изменения временного диапазона
document.getElementById('timeRange').addEventListener('change', function() {
    const timeRange = this.value === 'realtime' ? 1 : parseInt(this.value);
    updateChart(timeRange);
});

// Инициализация графика при загрузке страницы
updateChart(5);
const socket = new WebSocket('ws://localhost:8766');

socket.onopen = function(event) {
    console.log('WebSocket connected');
};

socket.onmessage = function(event) {
    console.log('Received message:', event.data);
    const data = JSON.parse(event.data);
    updateHeatMap(data);
};

socket.onclose = function(event) {
    console.log('WebSocket disconnected');
};

function rotateMatrix(matrix, angle) {
    const radians = angle * Math.PI / 180;
    const cosAngle = Math.cos(radians);
    const sinAngle = Math.sin(radians);
    const width = matrix[0].length;
    const height = matrix.length;
    const rotatedMatrix = new Array(height);
    for (let i = 0; i < height; i++) {
        rotatedMatrix[i] = new Array(width);
    }
    const centerX = width / 2;
    const centerY = height / 2;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const xOffset = x - centerX;
            const yOffset = y - centerY;
            const rotatedX = Math.round(xOffset * cosAngle - yOffset * sinAngle + centerX);
            const rotatedY = Math.round(xOffset * sinAngle + yOffset * cosAngle + centerY);
            if (rotatedX >= 0 && rotatedX < width && rotatedY >= 0 && rotatedY < height) {
                rotatedMatrix[rotatedY][rotatedX] = matrix[y][x];
            }
        }
    }
    return rotatedMatrix;
}

function updateHeatMap(data) {
    const fieldData = data.field;
    // fieldData[9][8] = -1;
    // fieldData[10][11] = -1;
    // fieldData[10][13] = -1;
    // fieldData[8][11] = -1;
    // fieldData[9][14] = -1;
    const rotatedFieldData = rotateMatrix(fieldData, -25);
    const intersection = document.getElementById('intersection');
    intersection.innerHTML = '';
    for (let i = 0; i < rotatedFieldData.length; i++) {
        for (let j = 0; j < rotatedFieldData[i].length; j++) {
            const value = rotatedFieldData[i][19 - j];
            const square = document.createElement('div');
            square.classList.add('square');
            if (value === -1) {
                square.style.backgroundColor = 'black';
            } else {
                square.style.backgroundColor = getColor(value);
            }
            intersection.appendChild(square);
        }
    }
}

function getColor(value) {
    if (value === 0) {
        return 'transparent';
    } else {
        const normalizedValue = Math.min(1, value / 100);
        const r = Math.round(255 * normalizedValue);
        const b = Math.round(255 * (1 - normalizedValue));
        const redHex = r.toString(16).padStart(2, '0');
        const blueHex = b.toString(16).padStart(2, '0');
        return `#${redHex}00${blueHex}`;
    }
}

function createBarChart(ctx, data) {
    return new Chart(ctx, {
        type: 'bar',
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

function createPieChart(ctx, data) {
    return new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: false,
            maintainAspectRatio: false,
        }
    });
}

function getRandomBarData(timeRange) {
    const data = {
        labels: [],
        datasets: []
    };
    const colors = ['#022E66', '#6B99C3', '#D1AB7D', '#96785B', '#C2C3C5', '#81BECE'];
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
            dataset.data.push(Math.floor(Math.random() * 20));
        }
        data.datasets.push(dataset);
    }
    return data;
}

function getRandomPieData(timeRange) {
    const data = {
        labels: [],
        datasets: []
    };
    const colors = ['#022E66', '#6B99C3', '#D1AB7D', '#96785B', '#C2C3C5', '#81BECE'];
    data.labels = ['Мотоциклы', 'Легковой автомобиль', 'Легковой автомобиль с прицепом', 'Грузовой автомобиль', 'Автопоезд', 'Автобус'];
    const dataset = {
        data: [],
        backgroundColor: colors
    };
    for (let j = 0; j < data.labels.length; j++) {
        dataset.data.push(Math.floor(Math.random() * 20));
    }
    data.datasets.push(dataset);
    return data;
}

function updateBarChart(timeRange) {
    window.myBarChart.data = getRandomBarData(timeRange);
    window.myBarChart.update();
}

function updatePieChart(timeRange) {
    window.myPieChart.data = getRandomPieData(timeRange);
    window.myPieChart.update();
}

document.getElementById('timeRangeBar').addEventListener('change', function() {
    window.BarTimeout = this.value === 'realtime' ? 1 : parseInt(this.value);
    updateBarChart(window.BarTimeout);
    clearInterval(intervalBar);
    intervalBar = setInterval(() => updateBarChart(window.BarTimeout), window.BarTimeout * 60 * 1000);
});

document.getElementById('timeRangePie').addEventListener('change', function() {
    window.PieTimeout = this.value === 'realtime' ? 1 : parseInt(this.value);
    updatePieChart(window.PieTimeout);
    clearInterval(intervalPie);
    intervalPie = setInterval(() => updatePieChart(window.PieTimeout), window.PieTimeout * 60 * 1000);
});

window.myBarChart = createBarChart(document.getElementById('barChartCanvas').getContext('2d'), [])
window.myPieChart = createPieChart(document.getElementById('pieChartCanvas').getContext('2d'), []);
window.BarTimeout = 5;
window.PieTimeout = 5;
updateBarChart(window.BarTimeout);
updatePieChart(window.PieTimeout);

intervalBar = setInterval(() => updateBarChart(window.BarTimeout), window.BarTimeout * 60 * 1000);
intervalPie = setInterval(() => updatePieChart(window.PieTimeout), window.PieTimeout * 60 * 1000);

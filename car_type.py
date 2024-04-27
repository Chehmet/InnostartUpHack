# Функция для создания уникального идентификатора
def create_unique_id(data):
    return f"{data['class']}_{data['center'][0]}_{data['center'][1]}_{data['unix_millis']}"

# Словарь для хранения информации о машинах
cars_data = {}

# Функция для обновления информации о машине
def update_car_data(data):
    unique_id = create_unique_id(data)
    if unique_id in cars_data:
        # Если машина уже существует, обновляем ее данные
        cars_data[unique_id] = data
    else:
        # Если это новая машина, добавляем ее в словарь
        cars_data[unique_id] = data

# Пример данных о машине
data = {
    "unix_millis": 1714236280451,
    "center": [6184938.463265167, 389864.42017234187],
    "class": 1
}

# Пример обновления информации о машине
update_car_data(data)

# Вывод информации о машинах
print(cars_data)

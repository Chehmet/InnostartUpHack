import asyncio
import websockets
from confluent_kafka import Consumer, KafkaError
import json
import time
import numpy as np

cars_data = {}
cars_inside_screen = {}

class_intervals = {
    'Мотоциклы': 0,
    'Легковой автомобиль': 1,
    'Легковой автомобиль с прицепом': 2,
    'Грузовой автомобиль': 3,
    'Автопоезд': 4,
    'Автобус': 5
}

cars_in_minute = {class_name: 0 for class_name in class_intervals.values()}
cars_in_5_minutes = {class_name: 0 for class_name in class_intervals.values()}
cars_in_hour = {class_name: 0 for class_name in class_intervals.values()}



async def kafka_to_websocket(websocket, path):
    global cars_in_5_minutes, cars_in_hour, cars_in_minute

    def create_unique_id(data):
        return f"{data['class']}_{data['center'][0]}_{data['center'][1]}_{data['unix_millis']}"

    def update_car_data(data):
        car_class = data['class']

        if is_inside(data['center']):


            cars_in_minute[car_class] += 1

            cars_in_5_minutes[car_class] += 1

            cars_in_hour[car_class] += 1

    def is_inside(center):
        x, y = center
        return minX < x < maxX and minY < y < maxY
    minX = 6184810.801764947
    maxX = 6185039.291359994
    minY = 389817.49571297463
    maxY = 389912.11757543014

    lengthX = maxX - minX
    lengthY = maxY - minY

    numX = 20
    numY = 20

    unitXLength = lengthX / numX
    unitYLength = lengthY / numY

    conf = {
        'bootstrap.servers': 'hack.invian.ru:9094',
        'group.id': 'girlies',
        'auto.offset.reset': 'earliest'
    }

    consumer = Consumer(conf)
    consumer.subscribe(['aboba'])

    try:
        cnt1 = 0
        cnt5 = 0
        cnt60 = 0
        while True:
            start_time = time.time()
            field = np.zeros((numX, numY), dtype='int')
            graph_data = 0
            while (time.time() - start_time) < 1:
                cnt1 += 1
                cnt5 += 1
                cnt60 += 1
                msg = consumer.poll(timeout=1.0)
                if msg is None:
                    print("None")
                    continue
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        print('%% %s [%d] reached end at offset %d\n' %
                              (msg.topic(), msg.partition(), msg.offset()))
                    elif msg.error():

                        print('Error: %s' % msg.error())
                else:
                    data = json.loads(msg.value().decode('utf-8'))
                    update_car_data(data)

                    graph_data = {"time": data["unix_millis"], "cars": len(cars_data) // 10}

                    if 'center' in data:
                        center_field_value = data['center']
                        if minX < center_field_value[0] < maxX and minY < center_field_value[1] < maxY:
                            field[int((center_field_value[0] - minX) // unitXLength)][
                                int((center_field_value[1] - minY) // unitYLength)] += 1
                        else:
                            print("Warning: incorrect borders:", center_field_value)

            await websocket.send(json.dumps(
                {"field": field.tolist(), "graph_data": graph_data, "data_in_minute": cars_in_minute,
                 "data_in_5_minutes": cars_in_5_minutes, "data_in_hour": cars_in_hour}))
            if cnt1 >= 60:
                cars_in_minute.clear()
                cars_in_minute = {class_name: 0 for class_name in class_intervals.values()}
                cnt1 = 0
            if cnt5 >= 300:
                cars_in_5_minutes.clear()
                cars_in_5_minutes = {class_name: 0 for class_name in class_intervals.values()}
                cnt5 = 0
            if cnt60 >= 3600:
                cars_in_hour.clear()
                cars_in_hour = {class_name: 0 for class_name in class_intervals.values()}
                cnt60 = 0

    finally:
        consumer.close()


start_server = websockets.serve(kafka_to_websocket, "localhost", 8766)

print("WebSocket server started at ws://localhost:8766")
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()

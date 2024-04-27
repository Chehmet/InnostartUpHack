import asyncio
import websockets
from confluent_kafka import Consumer, KafkaError

# Функция для обработки входящих сообщений из Kafka и отправки их клиентам через веб-сокет
async def kafka_to_websocket(websocket, path):
    conf = {
        'bootstrap.servers': 'hack.invian.ru:9094',  # Kafka broker address
        'group.id': 'girlies',        # Consumer group ID
        'auto.offset.reset': 'earliest'         # Reset offset to beginning on first run
    }

    # Создаем Kafka consumer instance
    consumer = Consumer(conf)
    consumer.subscribe(['aboba'])

    try:
        while True:
            # Получаем сообщения из Kafka
            msg = consumer.poll(timeout=1.0)

            if msg is not None and not msg.error():
                # Отправляем сообщение клиенту через веб-сокет
                await websocket.send(msg.value().decode('utf-8'))
            else:
                await asyncio.sleep(0.1)  # Ждем некоторое время, если нет сообщений

    finally:
        # Закрываем Kafka consumer при завершении работы
        consumer.close()

# Запускаем веб-сокет сервер на порте 8765
start_server = websockets.serve(kafka_to_websocket, "localhost", 8765)

# Запускаем цикл обработки событий
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()

import asyncio
import websockets
from confluent_kafka import Consumer, KafkaError
import json
import time
import numpy as np
import datetime

# Function to process Kafka messages and send them to clients via WebSocket
async def kafka_to_websocket(websocket, path):
    # minX = 6184875.801764947
    # maxX = 6185059.291359994
    # minY = 389817.49571297463
    # maxY = 389982.11757543014
    minX = 6184800.801764947
    maxX = 6185059.291359994
    minY = 389817.49571297463
    maxY = 389922.11757543014
    lengthX = maxX - minX
    lengthY = maxY - minY

    numX = 20
    numY = 20

    unitXLength = lengthX / numX
    unitYLength = lengthY / numY

    # Define Kafka consumer configuration
    conf = {
        'bootstrap.servers': 'hack.invian.ru:9094',  # Kafka broker address
        'group.id': 'girlies',        # Consumer group ID
        'auto.offset.reset': 'earliest'         # Reset offset to beginning on first run
    }

    # Create Kafka consumer instance
    consumer = Consumer(conf)
    consumer.subscribe(['aboba'])

    try:
        while True:
            start_time = time.time()
            field = np.zeros((numX, numY), dtype='int')
            while (time.time() - start_time) < 0.1:
                # Poll for messages
                msg = consumer.poll(timeout=1.0)
                if msg is None:
                    print("None")
                    continue
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        # End of partition, consumer reached end of the log
                        print('%% %s [%d] reached end at offset %d\n' %
                            (msg.topic(), msg.partition(), msg.offset()))
                    elif msg.error():
                        # Some error occurred
                        print('Error: %s' % msg.error())
                else:
                    # Message was successfully received
                    value = msg.value().decode('utf-8')
                    data = json.loads(value)
                    if 'center' in data:
                        # Assuming data['unix_millis'] contains the UNIX timestamp in milliseconds
                        unix_timestamp_millis = data['unix_millis']

                        # Convert milliseconds to seconds and create a datetime object
                        timestamp_seconds = unix_timestamp_millis / 1000.0
                        utc_datetime = datetime.datetime.utcfromtimestamp(timestamp_seconds)

                        # Add an offset of 2 hours to convert to UTC+2
                        local_datetime = utc_datetime + datetime.timedelta(hours=2)

                        # Format the local datetime as a string
                        local_time_str = local_datetime.strftime('%Y-%m-%d %H:%M:%S')

                        print('Local Time (UTC+2):', local_time_str)
                        center_field_value = data['center']
                        if minX < center_field_value[0] < maxX and minY < center_field_value[1] < maxY:
                            field[int((center_field_value[0] - minX) // unitXLength)][int((center_field_value[1] - minY) // unitYLength)] += 1
                        else:
                            print("Warning: incorrect borders:", center_field_value)

            await websocket.send(json.dumps({"field": field.tolist()}))

    finally:
        # Close the Kafka consumer
        consumer.close()

# Start the WebSocket server on port 8766
start_server = websockets.serve(kafka_to_websocket, "localhost", 8766)

# Output a message indicating that the server has started to the console
print("WebSocket server started at ws://localhost:8766")

# Run the event loop
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()

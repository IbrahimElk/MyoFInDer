# from fastapi import FastAPI, HTTPException
# from pydantic import BaseModel
from typing import List
# import json
import numpy as np
# from image_segmentation import Image_segmentation
# import uvicorn
import threading as t
import socket
import json
import time

def start_socket_server():
    host = "127.0.0.1"
    port = 8000
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as st:
        # Make this a listening socket using the provided Ip and port
        st.bind((host, port))
        st.listen()
        print("listening;")
        while True:
            Client_Socket, Client_Addr = st.accept()
            # For every client create a new thread for processing.
            Client_Thread = t.Thread(target=client_dispatcher, args=(
                Client_Socket, Client_Addr))
            Client_Thread.start()

class PayloadData:
    def __init__(self, title,  arr, width, height):
        self.title = title
        self.arr = arr
        self.width = width
        self.height = height

class Payload:
    def __init__(self, data):
        self.data = data

def process_payload(payload_str):
    try:
        # Assuming payload_str is a JSON string, you can parse it into a dictionary
        payload_dict = json.loads(payload_str)
        # Convert the dictionary to a Payload object
        data_list = []
        for key_title, value_Obj in payload_dict.items():
            data_obj = PayloadData(key_title, value_Obj['arr'], value_Obj['width'], value_Obj['height'])
            data_list.append(data_obj)

        payload_object = Payload(data_list)

        return payload_object

    except Exception as e:
        # Handle any potential exceptions here
        print(f"Error processing payload: {e}")

def client_dispatcher(client_socket: socket.socket, client_adrr: tuple[str, int]):
    print("0OOOKKKK")
    with client_socket:
        data = b""
        while True:
            print(data)
            chunk = client_socket.recv(4096)
            if not chunk:
                break
            data += chunk
            if b"EOF" in data:
                data = data.split(b"EOF")[0]  # Discard everything after the EOF marker
                break
            
            data = data.decode()
            # # check of dat command van juiste formaat is, dat er effectief een payload zal zijn.
            # data_dict:Payload = process_payload(data)
            print("nice going on")
            exampleResult = {
                "nucleiIn": [
                    [10, 20],
                    [15, 25],
                    [8, 30]
                ],
                "nucleiOut": [
                    [5, 12],
                    [18, 22]
                ],
                "fiber": [
                    [30, 40],
                    [32, 42],
                    [35, 45],
                    [38, 48]
                ]
            }
            ser = json.dumps(exampleResult)
            client_socket.sendall(ser.encode())
            print("whats going on")

if __name__ == "__main__":
    start_socket_server()


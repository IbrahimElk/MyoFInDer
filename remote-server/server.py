from image_segmentation import Image_segmentation
import threading as t
import socket
import json
import numpy as np
from utils import convert_base64_to_np, Payload, process_payload
import time
app = Image_segmentation()


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


def get_all_data_received(client_socket: socket.socket) -> bytes:
    data = b""
    while True:
        chunk = client_socket.recv(4096)
        if b"EOF" in chunk:
            # Discard everything after the EOF marker
            chunk = chunk.split(b"EOF")[0]
            data += chunk
            break
        data += chunk

    return data


def client_dispatcher(client_socket: socket.socket, client_adrr: tuple[str, int]):
    with client_socket:
        while True:
            data = get_all_data_received(client_socket)
            print("1")
            stringified_data = data.decode()
            print(stringified_data)
            print("2")
            # check of dat command van juiste formaat is, dat er effectief een payload zal zijn.
            data_dict: Payload = process_payload(stringified_data)
            print("3")
            print(data_dict)
            print("ok")
            if data_dict is None:
                client_socket.sendall(
                    "Payload processing failed due to invalid JSON.".encode())
                break

            # If you are using Python 3.7 or later, you can rely on dict.values() to maintain the correct order.
            imgs = list(data_dict.dict.values())
            print("4")
            print(imgs.__len__())
            # Convert base64 data to numpy arrays representing the images
            images = convert_base64_to_np(imgs)
            print("5")
            images_np = np.array(images)
            print(images_np.shape)

            output = app.predict(images_np,
                                 "blue", "green", 20, 20, 25)
            print(output)
            t1 = time.perf_counter()
            serialised_output = json.dumps(output)
            t2 = time.perf_counter()
            print(t2-t1)
            client_socket.sendall(serialised_output.encode())
            client_socket.sendall(b"EOF")

if __name__ == "__main__":
    start_socket_server()

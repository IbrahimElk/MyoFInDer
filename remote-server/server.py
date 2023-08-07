from image_segmentation import Image_segmentation
import threading as t
import socket
import json
from utils import convert_base64_to_np, Payload, process_payload
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


def client_dispatcher(client_socket: socket.socket, client_adrr: tuple[str, int]):
    with client_socket:
        data = b""
        while True:
            chunk = client_socket.recv(4096)
            if not chunk:
                break
            data += chunk
            if b"EOF" in data:
                data = data.split(b"EOF")[0]  # Discard everything after the EOF marker
                break
            
            stringified_data = data.decode()
            # check of dat command van juiste formaat is, dat er effectief een payload zal zijn.
            data_dict:Payload = process_payload(stringified_data)


            if data_dict is None:
                client_socket.sendall("Payload processing failed due to invalid JSON.".encode())
                break

            # If you are using Python 3.7 or later, you can rely on dict.values() to maintain the correct order.
            imgs = list(data_dict.dict.values())
            # Convert base64 data to numpy arrays representing the images
            images_np = convert_base64_to_np(imgs)
            
            output = app.predict(images_np)

            serialised_output = json.dumps(output)
            client_socket.sendall(serialised_output.encode())

if __name__ == "__main__":
    start_socket_server()


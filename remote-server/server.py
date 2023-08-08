from image_segmentation import Image_segmentation
import threading as t
import socket
import json
import numpy as np
from utils import convert_base64_to_np, Payload, process_payload
app = Image_segmentation()


def start_socket_server(host,port):
    """
    Starts a socket server that listens for incoming client connections on a specified IP and port.

    The server accepts client connections and creates a new thread for each client to handle communication.

    Example Usage:
        To start the socket server on IP 127.0.0.1 and port 8000, call this function as follows:
        ```python
        start_socket_server("127.0.0.1", 8000)
        ```
    """
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as st:
        # Make this a listening socket using the provided Ip and port
        st.bind((host, port))
        st.listen()
        print("listening")
        while True:
            Client_Socket, Client_Addr = st.accept()
            # For every client create a new thread for processing.
            Client_Thread = t.Thread(target=client_dispatcher, args=(
                Client_Socket, Client_Addr))
            Client_Thread.start()


def get_all_data_received(client_socket: socket.socket) -> bytes:
    """
    Receives and accumulates all data sent by the client through the socket until the "EOF" marker is received.

    Parameters:
        client_socket (socket.socket): The socket used for communication with the client.

    Returns:
        bytes: The accumulated data received from the client as a bytes object.

    Example Usage:
        Assuming you have a connected client_socket, you can use this function to receive all data from the client:
        ```python
        data_received = get_all_data_received(client_socket)
        print(data_received)
        ```
    """
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
    """
    Handles client communication for a connected client socket.

    This function receives data from the client, processes it, and sends back the prediction output.

    Parameters:
        client_socket (socket.socket): The socket used for communication with the client.
        client_addr (tuple[str, int]): A tuple containing the client's IP address (string) and port (integer).
    """
    with client_socket:
        while True:
            data = get_all_data_received(client_socket)
            stringified_data = data.decode()
            # check of dat command van juiste formaat is, dat er effectief een payload zal zijn.
            data_dict: Payload = process_payload(stringified_data)
            if data_dict is None:
                client_socket.sendall(
                    "Payload processing failed due to invalid JSON.".encode())
                break

            # If you are using Python 3.7 or later, you can rely on dict.values() to maintain the correct order.
            imgs = list(data_dict.dict.values())
            # Convert base64 data to numpy arrays representing the images
            images = convert_base64_to_np(imgs)
            images_np = np.array(images)
            output = app.predict(images_np,
                                 "blue", "green", 20, 20, 25)
            serialised_output = json.dumps(output)
            client_socket.sendall(serialised_output.encode())
            client_socket.sendall(b"EOF")


if __name__ == "__main__":
    host = "127.0.0.1"
    port = 8000
    start_socket_server(host,port)

# coding: utf-8

import cv2
from re import findall
from typing import Optional
import numpy as np
import base64
import json
from typing import List

class Payload:
    """
    Represents a payload containing a dictionary of ID-image pairs.

    Attributes:
        dict (dict): A dictionary to store ID-image pairs, where ID is a string and image is a Base64-encoded string.

    Example Usage:
        ```
        payload = Payload()
        payload.append("image001", "iVBORw0KGg... (Base64-encoded image data)")
        payload.append("image002", "data:image/png;base64,iVBORw0KG... (Base64-encoded image data)")
        ```
    """
    def __init__(self):
        self.dict:dict = {}

    def append(self, id_image:str, base64_image:str): 
        self.dict[id_image] = base64_image


def process_payload(payload_str):
    """
    Processes a JSON payload string and returns a Payload object containing the ID-image pairs.

    Parameters:
        payload_str (str): The JSON string representing the payload.

    Returns:
        Payload or None: A Payload object if the payload_str is successfully processed, or None if there is an error.

    Example Usage:
        ```python
        payload_str = '{"image001": "iVBORw0KGg...", "image002": "data:image/png;base64,iVBORw0KG..."}'
        payload = process_payload(payload_str)
        if payload is not None:
            # Use the payload object to access the ID-image pairs
            for id_image, base64_image in payload.dict.items():
                print(f"ID: {id_image}, Base64 Image: {base64_image}")
        else:
            print("Error processing payload.")
        ```
    """
    try:
        # Assuming payload_str is a JSON string, you can parse it into a dictionary
        payload_dict:dict = json.loads(payload_str)
        # Convert the dictionary to a Payload object
        payload = Payload()
        for key_title, value_Obj in payload_dict.items():
            payload.append(key_title, value_Obj)

        return payload

    except json.JSONDecodeError as e:
        print(f"Error decoding JSON: {e}")
        return None

    except Exception as e:
        print(f"Error processing payload: {e}")
        return None


def convert_base64_to_np(base64_data:List[str]):
    """
    Converts a list of Base64-encoded image data to a list of NumPy arrays representing valid images.

    Parameters:
        base64_data: A list of strings, where each string represents Base64-encoded image data.

    Returns:
        list: A list of NumPy arrays, each representing a valid image that has been successfully decoded from Base64.
        Where each image is a multidimensional numpy array (width,height,3)

    Example Usage:
        ```python
        
        base64_data = [
            "data:image/png;base64,iVBORw0KG...",
            "data:image/jpeg;base64,/9j/4AAQSkZ...",
            "iVBORw0KGg... (Base64-encoded image without the 'data:image' prefix)",
            "invalid_base64_string"  # Invalid Base64 string, won't be processed.
        ]

        # Calling the function to convert Base64 data to NumPy arrays
        images_np = convert_base64_to_np(base64_data)

        # `images_np` will now contain a list of valid NumPy arrays representing images.
        ```
    """
    images_np = []
    for base64_str in base64_data:
        if base64_str.startswith("data:image"):
            base64_str = base64_str.split(",")[1]
        
        image_bytes = base64.b64decode(base64_str) 
        image_np = check_image(image_bytes)
        if image_np is not None:
            images_np.append(image_np)
    return images_np


def check_image(image_data: bytes) -> Optional[np.ndarray]:
    """Function making sure that the loaded image has 3 channels and is 8-bits.

    It ignores the alpha channel if any, and can handle all the usual dtypes.
    Grayscale images simply receive two additional empty channels to give a
    3-channel image.

    Args:
        image_data: The binary image data to load.

    Returns:
        The loaded image as a 3-channel 8-bits array, or None if the loading
        wasn't successful.
    """
    # Convert the image_data bytes to a numpy array of type np.uint8
    image_data_bytes = bytes(image_data)
    image_array = np.frombuffer(image_data, dtype=np.uint8)
    image_array = np.frombuffer(image_data_bytes, dtype=np.uint8)
    # Decode the image using cv2.imdecode with the flag cv2.IMREAD_COLOR
    cv_img = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    # In case the image cannot be loaded
    if cv_img is None:
        return None

    zero_channel = np.zeros([cv_img.shape[0], cv_img.shape[1]])

    # In this section, we ensure that the image is RGB
    # The image is grayscale, building a 3 channel image from it
    if len(cv_img.shape) == 2:
        cv_img = np.stack([np.concatenate([zero_channel, zero_channel], axis=1), cv_img], axis=2)

    # If there's an Alpha channel on a grayscale, ignore it
    elif len(cv_img.shape) == 3 and cv_img.shape[2] == 2:
        cv_img = cv2.cvtColor(cv_img, cv2.COLOR_GRAY2BGR)

    # The image is 3 or 4 channels, ignoring the Alpha channel if any
    elif len(cv_img.shape) == 3 and cv_img.shape[2] in [3, 4]:
        cv_img = cv2.cvtColor(cv_img, cv2.COLOR_BGR2RGB)

    # If it's another format, returning None to indicate it wasn't successful
    else:
        return None

    # Parsing the d_type string of the image
    try:
        depth = findall(r'\d+', str(cv_img.dtype))[0]
    except IndexError:
        depth = ''
    type_ = str(cv_img.dtype).strip(depth)

    # In this section, we ensure that the image is 8-bits
    # If it's boolean, the image will be black and white
    if type_ == 'bool':
        cv_img = (cv_img.astype('uint8') * 255).astype('uint8')

    # If it's int, first making it uint and then casting to uint8
    elif type_ == 'int':
        cv_img = (cv_img + 2 ** (int(depth) - 1)).astype('uint' + depth)
        cv_img = (cv_img / 2 ** (int(depth) - 8)).astype('uint8')

    # If it's uint, simply casting to uint8
    elif type_ == 'uint':
        cv_img = (cv_img / 2 ** (int(depth) - 8)).astype('uint8')

    # If it's float, casting to [0-1] and then to uint8
    elif type_ == 'float':
        cv_img = ((cv_img - cv_img.min(initial=None)) /
                  (cv_img.max(initial=None) - cv_img.min(initial=None))
                  * 255).astype('uint8')

    # If it's another format, returning None to indicate it wasn't successful
    else:
        return None

    return cv_img


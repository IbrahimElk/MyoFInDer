# coding: utf-8

from pathlib import Path
import cv2
from numpy import zeros, stack, concatenate, ndarray
from re import findall
from typing import Optional
import numpy as np


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
    # image_data_bytes = bytes(image_data)
    # print(image_data_bytes)
    # image_array = np.frombuffer(image_data, dtype=np.uint8)
    # image_array = np.frombuffer(image_data_bytes, dtype=np.uint8)
    # print(image_array)
    # Decode the image using cv2.imdecode with the flag cv2.IMREAD_COLOR
    cv_img = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    print(cv_img)
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



# Sample binary image data (replace this with your actual binary data)
binary_alpha_data = np.random.randint(0, 256, size=(100, 100, 4), dtype=np.uint8).tobytes()
image_data_bytes = bytes(binary_alpha_data)
image_array = np.frombuffer(image_data_bytes, dtype=np.uint8)
image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
print(image)

image = cv2.imdecode(image_array, cv2.IMREAD_GRAYSCALE)

print(image)
# # Test the check_image function
# result_image = check_image(binary_grayscale_data)
# if result_image is not None:
#     print("Image successfully loaded and processed.")
# else:
#     print("Image loading or processing failed.")




# # Sample binary image data (replace this with your actual binary data)
# binary_alpha_data = np.random.randint(0, 256, size=(100, 100, 4), dtype=np.uint8).tobytes()
# # print(binary_alpha_data)

# # Test the check_image function
# result_image = check_image(binary_alpha_data)
# if result_image is not None:
#     print("Image successfully loaded and processed.")
# else:
#     print("Image loading or processing failed.")





# invalid_image_data = b'invalid_binary_data'
# print(invalid_image_data)

# # Test the check_image function
# result_image = check_image(invalid_image_data)
# if result_image is not None:
#     print("Image successfully loaded and processed.")
# else:
#     print("Image loading or processing failed.")







# def check_image(images: np.ndarray) -> Optional[ndarray]:
#     """Function making sure that the loaded image has 3 channels and is 8-bits.

#     It ignores the alpha channel if any, and can handle all the usual dtypes.
#     Grayscale images simply receive two additional empty channels to give a
#     3-channel image.

#     Args:
#         image_path: The path to the image to load.

#     Returns:
#         The loaded image as a 3-channel 8-bits array, or None if the loading
#         wasn't successful.
#     """

#     # Loading the image
#     cv_img = imread(str(image_path), IMREAD_ANYCOLOR)

#     # In case the file cannot be reached
#     if cv_img is None:
#         return None

#     zero_channel = zeros([cv_img.shape[0], cv_img.shape[1]])

#     # In this section, we ensure that the image is RGB
#     # The image is grayscale, building a 3 channel image from it
#     if len(cv_img.shape) == 2:
#         cv_img = stack([concatenate([zero_channel, zero_channel],
#                                     axis=2), cv_img], axis=2)

#     # If there's an Alpha channel on a grayscale, ignore it
#     elif len(cv_img.shape) == 3 and cv_img.shape[2] == 2:
#         cv_img = imread(str(image_path), IMREAD_GRAYSCALE)
#         cv_img = stack([concatenate([zero_channel, zero_channel],
#                                     axis=2), cv_img], axis=2)

#     # The image is 3 or 4 channels, ignoring the Alpha channel if any
#     elif len(cv_img.shape) == 3 and cv_img.shape[2] in [3, 4]:
#         cv_img = imread(str(image_path), IMREAD_COLOR)
#         cv_img = cvtColor(cv_img, COLOR_BGR2RGB)

#     # If it's another format, returning None to indicate it wasn't successful
#     else:
#         return None

#     # Parsing the d_type string of the image
#     try:
#         depth = findall(r'\d+', str(cv_img.dtype))[0]
#     except IndexError:
#         depth = ''
#     type_ = str(cv_img.dtype).strip(depth)

#     # In this section, we ensure that the image is 8-bits
#     # If it's boolean, the image will be black and white
#     if type_ == 'bool':
#         cv_img = (cv_img.astype('uint8') * 255).astype('uint8')

#     # If it's int, first making it uint and then casting to uint8
#     elif type_ == 'int':
#         cv_img = (cv_img + 2 ** (int(depth) - 1)).astype('uint' +
#                                                          depth)
#         cv_img = (cv_img / 2 ** (int(depth) - 8)).astype('uint8')

#     # If it's uint, simply casting to uint8
#     elif type_ == 'uint':
#         cv_img = (cv_img / 2 ** (int(depth) - 8)).astype('uint8')

#     # If it's float, casting to [0-1] and then to uint8
#     elif type_ == 'float':
#         cv_img = ((cv_img - cv_img.min(initial=None)) /
#                   (cv_img.max(initial=None) - cv_img.min(initial=None))
#                   * 255).astype('uint8')

#     # If it's another format, returning None to indicate it wasn't successful
#     else:
#         return None

#     return cv_img

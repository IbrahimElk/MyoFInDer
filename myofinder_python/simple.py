# coding: utf-8

from deepcell.applications import Mesmer
import numpy as np
import numpy.ma as ma
from pathlib import Path
import cv2
from typing import List, Tuple, Any, Optional
from numpy import zeros, stack, concatenate, ndarray
from re import findall
import time
# import tensorflow as tf
# import os
# os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

# gpu = tf.config.list_physical_devices('GPU')
# tf.config.experimental.set_memory_growth(gpu[0], True)


def check_image(image_path: Path) -> Optional[ndarray]:
    """Function making sure that the loaded image has 3 channels and is 8-bits.

    It ignores the alpha channel if any, and can handle all the usual dtypes.
    Grayscale images simply receive two additional empty channels to give a
    3-channel image.

    Args:
        image_path: The path to the image to load.

    Returns:
        The loaded image as a 3-channel 8-bits array, or None if the loading
        wasn't successful.
    """

    # Loading the image
    cv_img = cv2.imread(str(image_path), cv2.IMREAD_ANYCOLOR)

    # In case the file cannot be reached
    if cv_img is None:
        return None

    zero_channel = zeros([cv_img.shape[0], cv_img.shape[1]])

    # In this section, we ensure that the image is RGB
    # The image is grayscale, building a 3 channel image from it
    if len(cv_img.shape) == 2:
        cv_img = stack([concatenate([zero_channel, zero_channel],
                                    axis=2), cv_img], axis=2)

    # If there's an Alpha channel on a grayscale, ignore it
    elif len(cv_img.shape) == 3 and cv_img.shape[2] == 2:
        cv_img = cv2.imread(str(image_path), cv2.IMREAD_GRAYSCALE)
        cv_img = stack([concatenate([zero_channel, zero_channel],
                                    axis=2), cv_img], axis=2)

    # The image is 3 or 4 channels, ignoring the Alpha channel if any
    elif len(cv_img.shape) == 3 and cv_img.shape[2] in [3, 4]:
        cv_img = cv2.imread(str(image_path), cv2.IMREAD_COLOR)
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
        cv_img = (cv_img + 2 ** (int(depth) - 1)).astype('uint' +
                                                         depth)
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

# output = varrr("/home/ibrahim/Pictures/Screenshot.png",
#       "blue",
#       "green",
#       25,
#       25,
#       20)

# print(output)


# end = time.perf_counter()
# execution_time = end - t1

# print("Execution Time:", execution_time, "seconds")


app = Mesmer()

# Loads the image and keeps only the nuclei and fibers channels
image = check_image("/home/ibrahim/Pictures/Screenshot.png")
print(image.shape)

nuclei_channel = image[:, :, 2]
fiber_channel = image[:, :, 1]

image= np.stack((nuclei_channel,
                nuclei_channel), axis=-1)[np.newaxis, :]
final_result = np.array([image[0]
                        # ,image[0],image[0],image[0],image[0],image[0],image[0],image[0]
                        # ,image[0],image[0],image[0],image[0],image[0],image[0],image[0]
                        # ,image[0],image[0],image[0],image[0],image[0],image[0],image[0]
                        ])
print(final_result.shape)

del image

# Default parameters
radius = 10
maxima_threshold = 0.1
interior_threshold = 0.01
maxima_smooth = 0
interior_smooth = 0
maxima_index = 0
interior_index = -1
label_erosion = 0
fill_holes_threshold = 0
pixel_expansion = None
maxima_algorith = 'h_maxima'

t5 = time.perf_counter()




# # Actual nuclei detection function
labeled_image = app.predict(
    image=final_result,
    batch_size=4,
    image_mpp=None,
    pad_mode='constant',
    compartment='nuclear',
    preprocess_kwargs=dict(),
    postprocess_kwargs_whole_cell=dict(),
    postprocess_kwargs_nuclear={
        'radius': radius,
        'maxima_threshold': maxima_threshold,
        'interior_threshold': interior_threshold,
        'maxima_smooth': maxima_smooth,
        'interior_smooth': interior_smooth,
        'maxima_index': maxima_index,
        'interior_index': interior_index,
        'label_erosion': label_erosion,
        'small_objects_threshold': 20,
        'fill_holes_threshold': fill_holes_threshold,
        'pixel_expansion': pixel_expansion,
        'maxima_algorith': maxima_algorith,
    })

t6 = time.perf_counter()
print("predicting image")
print(t6-t5)
# # Removing useless axes on the output and nuclei channel
# labeled_image = np.squeeze(labeled_image)


# t7 = time.perf_counter()
# # Getting the fiber mask
# mask = self._get_fiber_mask(fiber_channel,
#                             nuclei_channel,
#                             fiber_threshold)
# t8 = time.perf_counter()
# print("getting fiber mask:")
# print(t8-t7)
# del fiber_channel

# # Calculating the area of fibers over the total area
# area = np.count_nonzero(mask) / mask.shape[0] / mask.shape[1]

# # Finding the contours of the fibers
# mask_8_bits = (mask * 255).astype('uint8')
# fiber_contours, _ = cv2.findContours(mask_8_bits, cv2.RETR_LIST,
#                                         cv2.CHAIN_APPROX_SIMPLE)
# fiber_contours = tuple(map(np.squeeze, fiber_contours))

# t9 = time.perf_counter()
# # Getting the position of the nuclei
# nuclei_out, nuclei_in = self._get_nuclei_positions(
#     labeled_image, mask, nuclei_channel, 0.4)
# t10 = time.perf_counter()
# print("finding nuclei posiiton")
# print(t10-t9)
# return path, nuclei_out, nuclei_in, fiber_contours, area

# # @staticmethod
# # def _get_fiber_mask(fiber_channel: np.ndarray,
# #                     nuclei_channel: np.ndarray,
# #                     threshold: int) -> np.ndarray:
# #     """Applies several images processing methods to the fiber channel of
# #     the image to smoothen the outline.

# #     Args:
# #         fiber_channel: The channel of the image containing the fibers.
# #         nuclei_channel: The channel of the image containing the nuclei.
# #         threshold: The gray level threshold above which a pixel is
# #             considered to be part of a fiber.

# #     Returns:
# #         A boolean mask containing the position of the fibers
# #     """

# #     # First, apply a base threshold
# #     kernel = np.ones((4, 4), np.uint8)
# #     _, processed = cv2.threshold(fiber_channel, threshold, 255,
# #                                  cv2.THRESH_BINARY)

# #     # Opening, to remove noise in the background
# #     processed = cv2.morphologyEx(processed,
# #                                  cv2.MORPH_OPEN, kernel)

# #     # Closing, to remove noise inside the fibers
# #     processed = cv2.morphologyEx(processed, cv2.MORPH_CLOSE, kernel)

# #     # Inverting black and white
# #     processed = cv2.bitwise_not(processed)

# #     # Find contours of the holes inside the fibers
# #     contours, _ = cv2.findContours(processed, cv2.RETR_TREE,
# #                                    cv2.CHAIN_APPROX_SIMPLE)

# #     for contour in contours:

# #         mask = np.zeros_like(processed)
# #         cv2.drawContours(mask, contour, -1, 255, -1)

# #         if np.average(nuclei_channel[mask == 255]) > 50:
# #             cv2.drawContours(processed, contour, -1, 0, -1)

# #     # Inverting black and white again
# #     processed = cv2.bitwise_not(processed)

# #     # Creating a boolean mask, later used to generate a masked array
# #     mask = processed.astype(bool)

# #     return mask

# # @staticmethod
# # def _get_nuclei_positions(labeled_image: np.ndarray,
# #                           mask: np.ndarray,
# #                           nuclei_channel: np.ndarray,
# #                           fiber_threshold: float = 0.85,
# #                           nuclei_threshold: int = 50) -> \
# #         (List[Tuple[np.ndarray, np.ndarray]],
# #          List[Tuple[np.ndarray, np.ndarray]]):
# #     """Computes the center of the nuclei and determines whether they're
# #     positive or not.

# #     Args:
# #         labeled_image: The image containing the nuclei.
# #         mask: The boolean mask of the fibers.
# #         nuclei_channel: The channel of the image containing the nuclei.
# #         fiber_threshold: Fraction of area above which a nucleus is
# #             considered to be inside a fiber.

# #     Returns:
# #         The list of the centers of nuclei outside of fibers, and the list
# #         of centers of nuclei inside fibers
# #     """

# #     nuclei_out_fiber = []
# #     nuclei_in_fiber = []

# #     # Masking the image containing the nuclei with the boolean mask of the
# #     # fibers
# #     masked_image = ma.masked_array(labeled_image, mask)

# #     # Each gray level on the nuclei image corresponds to one nucleus
# #     nb_nuc = np.max(labeled_image)

# #     # Iterating through the detected nuclei
# #     for i in range(1, nb_nuc + 1):

# #         # Getting a list of the detected pixels
# #         nucleus_y, nucleus_x = np.where(labeled_image == i)
# #         center_x, center_y = np.mean(nucleus_x), np.mean(nucleus_y)

# #         # Aborting for the current nucleus if it's not bright enough
# #         if np.average(nuclei_channel[nucleus_y,
# #                                      nucleus_x]) < nuclei_threshold:
# #             continue

# #         # Determining whether the nucleus is positive or negative
# #         in_fiber = ma.count_masked(masked_image[nucleus_y, nucleus_x])
# #         if in_fiber < fiber_threshold * nucleus_x.shape[0]:
# #             nuclei_out_fiber.append((center_x, center_y))
# #         else:
# #             nuclei_in_fiber.append((center_x, center_y))

# #     return nuclei_out_fiber, nuclei_in_fiber


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
import multiprocessing

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

# Define the number of processes to use (adjust according to your CPU cores)
# num_processes = multiprocessing.cpu_count()

# Function to process a chunk of the final_result array

if __name__ == '__main__':

    # Loads the image and keeps only the nuclei and fibers channels
    image = check_image("/home/ibrahim/Pictures/Screenshot.png")
    print("the original image shape loaded in")
    print(image.shape)

    nuclei_channel = image[:, :, 2]
    fiber_channel = image[:, :, 1]

    image = np.stack((nuclei_channel, nuclei_channel), axis=-1)[np.newaxis, :]
    final_result = np.array([image[0]] * 24)

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


    # Create a manager to share data between processes

    t4 = time.perf_counter()

    MY_APPL = Mesmer()
    labeled_image = MY_APPL.predict(
        image=final_result,
        batch_size=1,
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
    
    t5 = time.perf_counter()

    print("Total time for predicting all images in one time:", t5 - t4)

# coding: utf-8

from deepcell.applications import Mesmer
import numpy as np
import numpy.ma as ma
from pathlib import Path
import cv2
from typing import List, Tuple, Any

# Table for converting color strings to channels, assuming BGR images
color_to_int = {"red": 0,
                      "green": 1,
                      "blue": 2}

data_structure = dict[str, dict[str, dict[str, List[Tuple[float, float]]]]]

class Image_segmentation:
    """Class for processing images, detecting fibers and nuclei."""

    def __init__(self) -> None:
        """Simply loads the Mesmer library."""

        self._app = Mesmer()

    def predict(self,
                 images: np.ndarray,
                 nuclei_color: str,
                 fiber_color: str,
                 fiber_threshold: int,
                 nuclei_threshold: int,
                 small_objects_threshold: int) -> data_structure:

        # Removing the scale bar
        for image in images : 
            image[(image[:, :, 0] > 50) &
                (image[:, :, 1] > 50) &
                (image[:, :, 2] > 50)] = (0, 0, 0)

        nuclei_channels = images[:, :, :, color_to_int[nuclei_color]]
        fiber_channels = images[:, :, :, color_to_int[fiber_color]]
        new_images = np.stack([nuclei_channels, fiber_channels], axis=-1)

        labeled_images = self._app.predict(
            image=new_images,
            batch_size=4,
            image_mpp=None,
            pad_mode='constant',
            compartment='nuclear',
            preprocess_kwargs=dict(),
            postprocess_kwargs_whole_cell=dict(),
            postprocess_kwargs_nuclear={
                'radius': 10,
                'maxima_threshold': 0.1,
                'interior_threshold': 0.01,
                'maxima_smooth': 0,
                'interior_smooth': 0,
                'maxima_index': 0,
                'interior_index': -1,
                'label_erosion': 0,
                'small_objects_threshold': small_objects_threshold,
                'fill_holes_threshold': 0,
                'pixel_expansion': None,
                'maxima_algorith': 'h_maxima',
            })

        imageid_dict = {}
        for counter, (fiber_channel, nuclei_channel, labeled_image) in enumerate(zip(fiber_channels, nuclei_channels, labeled_images)):
            labeled_image = np.squeeze(labeled_image)

            mask = self._get_fiber_mask(fiber_channel, nuclei_channel, fiber_threshold)

            nuclei_out, nuclei_in = self._get_nuclei_positions(
                labeled_image, mask, nuclei_channel, 0.4)

            mask_8_bits = (mask * 255).astype('uint8')
            fiber_contours, _ = cv2.findContours(mask_8_bits, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
            fiber_contours = tuple(map(np.squeeze, fiber_contours))

            counter = 0
            for contour in fiber_contours:
                contour_list = contour.tolist()  # Convert the NumPy array to a list of lists
                imageid_dict[str(counter)] = {
                    "nuclei": {
                        "nucleiIn": nuclei_in,
                        "nucleiOut": nuclei_out
                    },
                    "fibers": {str(counter): {
                        "fiberPath": contour_list,
                        "fiberArea": cv2.contourArea(contour)
                    }}
                }
                counter += 1


        return imageid_dict
    @staticmethod
    def _get_fiber_mask(fiber_channel: np.ndarray,
                        nuclei_channel: np.ndarray,
                        threshold: int) -> np.ndarray:
        """Applies several images processing methods to the fiber channel of
        the image to smoothen the outline.

        Args:
            fiber_channel: The channel of the image containing the fibers.
            nuclei_channel: The channel of the image containing the nuclei.
            threshold: The gray level threshold above which a pixel is
                considered to be part of a fiber.

        Returns:
            A boolean mask containing the position of the fibers
        """

        # First, apply a base threshold
        kernel = np.ones((4, 4), np.uint8)
        _, processed = cv2.threshold(fiber_channel, threshold, 255,
                                     cv2.THRESH_BINARY)

        # Opening, to remove noise in the background
        processed = cv2.morphologyEx(processed,
                                     cv2.MORPH_OPEN, kernel)

        # Closing, to remove noise inside the fibers
        processed = cv2.morphologyEx(processed, cv2.MORPH_CLOSE, kernel)

        # Inverting black and white
        processed = cv2.bitwise_not(processed)

        # Find contours of the holes inside the fibers
        contours, _ = cv2.findContours(processed, cv2.RETR_TREE,
                                       cv2.CHAIN_APPROX_SIMPLE)

        for contour in contours:

            mask = np.zeros_like(processed)
            cv2.drawContours(mask, contour, -1, 255, -1)

            if np.average(nuclei_channel[mask == 255]) > 50:
                cv2.drawContours(processed, contour, -1, 0, -1)

        # Inverting black and white again
        processed = cv2.bitwise_not(processed)

        # Creating a boolean mask, later used to generate a masked array
        mask = processed.astype(bool)

        return mask

    @staticmethod
    def _get_nuclei_positions(labeled_image: np.ndarray,
                              mask: np.ndarray,
                              nuclei_channel: np.ndarray,
                              fiber_threshold: float = 0.85,
                              nuclei_threshold: int = 50) -> \
            (List[Tuple[np.ndarray, np.ndarray]],
             List[Tuple[np.ndarray, np.ndarray]]):
        """Computes the center of the nuclei and determines whether they're
        positive or not.

        Args:
            labeled_image: The image containing the nuclei.
            mask: The boolean mask of the fibers.
            nuclei_channel: The channel of the image containing the nuclei.
            fiber_threshold: Fraction of area above which a nucleus is
                considered to be inside a fiber.

        Returns:
            The list of the centers of nuclei outside of fibers, and the list
            of centers of nuclei inside fibers
        """

        nuclei_out_fiber = []
        nuclei_in_fiber = []

        # Masking the image containing the nuclei with the boolean mask of the
        # fibers
        masked_image = ma.masked_array(labeled_image, mask)

        # Each gray level on the nuclei image corresponds to one nucleus
        nb_nuc = np.max(labeled_image)

        # Iterating through the detected nuclei
        for i in range(1, nb_nuc + 1):

            # Getting a list of the detected pixels
            nucleus_y, nucleus_x = np.where(labeled_image == i)
            center_x, center_y = np.mean(nucleus_x), np.mean(nucleus_y)

            # Aborting for the current nucleus if it's not bright enough
            if np.average(nuclei_channel[nucleus_y,
                                         nucleus_x]) < nuclei_threshold:
                continue

            # Determining whether the nucleus is positive or negative
            in_fiber = ma.count_masked(masked_image[nucleus_y, nucleus_x])
            if in_fiber < fiber_threshold * nucleus_x.shape[0]:
                nuclei_out_fiber.append((center_x, center_y))
            else:
                nuclei_in_fiber.append((center_x, center_y))

        return nuclei_out_fiber, nuclei_in_fiber

import cv2
import numpy as np

binary_image = np.array([
    [0, 0, 0, 0, 0],
    [0, 255, 0, 255, 0],
    [0, 255, 0, 255, 0],
    [0, 0, 0, 0, 0],
], dtype=np.uint8)

fiber_contours, _ = cv2.findContours(binary_image, cv2.RETR_LIST,
                                    cv2.CHAIN_APPROX_SIMPLE)
fiber_contours = tuple(map(np.squeeze, fiber_contours))
for fiber_id, contour in enumerate(fiber_contours):
    print(fiber_id,contour)
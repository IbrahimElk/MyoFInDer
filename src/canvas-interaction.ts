import { Nuclei, Nucleus, Fiber, Fibers, NucleusJSON,FiberJSON } from "./markers";

/**
 * Interface representing a custom event extending CustomEventInit, used to pass additional data with a custom event.
 * @interface MyCustomEvent
 * @extends CustomEventInit
 */
export interface MyCustomEvent extends CustomEventInit 
{  positive: number,
  total: number,
  ratio:number,
  fiberRatio: number
} 

/**
 * Interface representing an object that holds information about the transformation on the canvas.
 * It includes details such as position, scale, transformation matrix, dragging status, and last cursor coordinates.
 * @interface transformationObject
 */
interface transformationObject {
  pos: { x: number; y: number };
  scale: number;
  m: number[];
  im: number[];
  isDragging: boolean;
  lastX: number;
  lastY: number;
}

/**
 * CanvasInteraction class manages the interaction with a canvas element and allows drawing and manipulation of images,
 * as well as markers (nuclei and fibers) on the canvas.
 * @class CanvasInteraction
 */
export class CanvasInteraction {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private nuclei: Nuclei;
  private fibers: Fibers;
  private image: HTMLImageElement;
  private imageColors;

  private transform: transformationObject;
  private showingNuclei: boolean;
  private showingFibers: boolean;
  private idImage :number;

  private static zoomExponent = 0.05; // exponential zooming for smooth zooming effect.

  /**
   * Creates an instance of CanvasInteraction.
   * @constructor
   * @param {HTMLCanvasElement} canvas - The canvas element to interact with.
   * @param {HTMLImageElement} image - The image element to be displayed on the canvas.
   * @param {number} id - An identifier for the image (optional, can be used to distinguish different images on the same canvas).
   */
  constructor(canvas: HTMLCanvasElement, image: HTMLImageElement,id:number) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    this.nuclei = new Nuclei();
    this.fibers = new Fibers();
    this.idImage = id;

    this.image = image;
    this.transform = {
      pos: { x: 0, y: 0 }, //the offset in the x and y directions in canvas.
      scale: 1, // scale for scaling in canvas.
      m: [1, 0, 0, 1, 0, 0], // transformation matrix.
      im: [1, 0, 0, 1, 0, 0], // inverse transformation matrix.
      isDragging: false, // boolean if dragging was enabled.
      lastX: 0, // last time pressed when dragging.
      lastY: 0, // last time clicked when dragging.
    };
    this.imageColors = {
      isRedRemoved: false,
      isGreenRemoved: false,
      isBlueRemoved: false,
    };
    this.showingNuclei = true;
    this.showingFibers = true;

    this.fitToScale();
  }
  // -------------------------------------------------------------------------
  // PUBLIC FUNCTIONS
  // -------------------------------------------------------------------------
  /**
   * Draws the image on the canvas along with any markers (nuclei and fibers) if enabled.
   * The method clears the canvas, applies the transformation matrix, draws the image,
   * modifies its colors, and then draws any visible markers (nuclei and fibers) on top of it.
   * @public
   * @function drawImageWithMarkers
   * @memberof CanvasInteraction
   * @returns {void}
   */
  public drawImageWithMarkers() {
    // console.log("inside drawImageWithMarkers");
    // Clear the canvas before drawing the image

    this.clearCanvas();

    // Call to clamp offsetPanX and offsetPanY
    this.clampOffsetPan();
    // still a reference to the same array
    const M = this.transform.m;
    // Apply the transformation matrix to the context
    this.ctx.setTransform(M[0], M[1], M[2], M[3], M[4], M[5]);

    // Draw the image
    this.ctx.drawImage(this.image, 0, 0);

    // Draw the image with modified colors
    this.modifyColorOfImage();

    // Draw the markers
    if (this.showingNuclei) {
      for (const marker of this.nuclei) {
        this.drawCircle(
          marker.getXpos(),
          marker.getYpos(),
          marker.getRadius(),
          marker.getColor()
        );
      }
    }

    if (this.showingFibers) {
      for (const marker of this.fibers) {
        this.drawFiber(marker);
      }
    }
    this.restoreCanvas();
  }
  /**
   * Clears the canvas by resetting the transformation matrix and clearing the entire canvas area.
   * @public
   * @function clearCanvas
   * @memberof CanvasInteraction
   * @returns {void}
   */
  public clearCanvas() {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  /**
   * Sets the visibility of nuclei on the canvas.
   * @public
   * @function showNuclei
   * @memberof CanvasInteraction
   * @param {boolean} show - A boolean value indicating whether to show nuclei (true) or hide them (false).
   * @returns {void}
   */
  public showNuclei(show: boolean): void {
    this.showingNuclei = show;
  }
  /**
   * Sets the visibility of fibers on the canvas.
   * @public
   * @function showFibers
   * @memberof CanvasInteraction
   * @param {boolean} show - A boolean value indicating whether to show fibers (true) or hide them (false).
   * @returns {void}
   */
  public showFibers(show: boolean): void {
    this.showingFibers = show;
  }
  /**
   * Updates the color channels of the image to be displayed on the canvas.
   * @public
   * @function updateChannels
   * @memberof CanvasInteraction
   * @param {boolean} redChannelEnabled - A boolean value indicating whether the red channel is enabled (true) or disabled (false).
   * @param {boolean} greenChannelEnabled - A boolean value indicating whether the green channel is enabled (true) or disabled (false).
   * @param {boolean} blueChannelEnabled - A boolean value indicating whether the blue channel is enabled (true) or disabled (false).
   * @returns {void}
   */
  public updateChannels(
    redChannelEnabled: boolean,
    greenChannelEnabled: boolean,
    blueChannelEnabled: boolean
  ) {
    this.imageColors.isBlueRemoved = !blueChannelEnabled;
    this.imageColors.isGreenRemoved = !greenChannelEnabled;
    this.imageColors.isRedRemoved = !redChannelEnabled;
  }
  /**
   * Adds a marker (nucleus) at the specified coordinates (x, y) with the given type (0 for nucleiIn, 1 for nucleiOut).
   * @public
   * @function addMarker
   * @memberof CanvasInteraction
   * @param {number} x - The x-coordinate of the marker.
   * @param {number} y - The y-coordinate of the marker.
   * @param {number} type - The type of the marker (0 for nucleiIn, 1 for nucleiOut).
   * @returns {void}
   */
  public addMarker(x: number, y: number, type: number) {
    const marker = new Nucleus(x, y, type,this.idImage);
    this.nuclei.append(marker);
    this.drawImageWithMarkers();
    this.fireEvent();
  }
  /**
   * Adds a fiber with the given fiberPoints (an array of [x, y] points representing the fiber path) and area.
   * @public
   * @function addFiber
   * @memberof CanvasInteraction
   * @param {[number, number][]} fiberPoints - An array of [x, y] points representing the path of the fiber.
   * @param {number} area - The area of the fiber.
   * @returns {void}
   */
  public addFiber(fiberPoints :[number,number][], area: number) {
    const ratioFiber = area / (this.image.width* this.image.height) ;
    const pointer = new Fiber(fiberPoints, this.idImage, area, ratioFiber);
    this.fibers.append(pointer);
    this.drawImageWithMarkers();
    this.fireEvent();
  }
  /**
   * Adds all markers (nuclei) based on the provided `nucleiIn` and `nucleiOut` arrays.
   * @public
   * @function addAllMarkers
   * @memberof CanvasInteraction
   * @param {{ nucleiIn: [number, number][]; nucleiOut: [number, number][]; }} nuclei - An object containing `nucleiIn` and `nucleiOut` arrays of [x, y] coordinates for nucleus positions.
   * @returns {void}
   */
  public addAllMarkers(nuclei: { nucleiIn: [number, number][]; nucleiOut: [number, number][]; }) {
    for(const marker of nuclei.nucleiIn){
      this.nuclei.append(new Nucleus(marker[0], marker[1], 0,this.idImage));
    }
    for(const marker of nuclei.nucleiOut){
      this.nuclei.append(new Nucleus(marker[0], marker[1], 1,this.idImage));
    }
    this.drawImageWithMarkers();
    this.fireEvent();
  }
  /**
   * Adds all fibers based on the provided `fibers` object.
   * @public
   * @function addAllFibers
   * @memberof CanvasInteraction
   * @param {{ [fiberID: string]: { fiberPath: [number, number][]; fiberArea: number; }; }} fibers - An object containing fiber information, with fiberID as keys and an object containing fiberPath and fiberArea as values.
   * @returns {void}
   */
  public addAllFibers(fibers: { [fiberID: string]: { fiberPath: [number, number][]; fiberArea: number; }; }) {
    for (const fiberID in fibers){
      const fiberObj = fibers[fiberID];
      const ratioFiber = fiberObj.fiberArea / (this.image.width* this.image.height) ;
      const pointer = new Fiber(fiberObj.fiberPath, this.idImage, fiberObj.fiberArea, ratioFiber);
      this.fibers.append(pointer);
    }
    this.drawImageWithMarkers();
    this.fireEvent();
  }
  /**
   * Fires a custom event named "markerAdded" to notify listeners about marker and fiber additions.
   * @private
   * @function fireEvent
   * @memberof CanvasInteraction
   * @returns {void}
   */
  private fireEvent() {
    const event:MyCustomEvent = {  
      positive: this.nuclei.getNucleiInCount(),
        total: this.nuclei.getTotalNucleiCount(),
        ratio:this.nuclei.getRatio(),
        fiberRatio: this.fibers.getRatio()
    }
    const markerAddedEvent = new CustomEvent("markerAdded", {"detail" : event} );
    this.canvas.dispatchEvent(markerAddedEvent);
  }
  /**
   * Returns the current state of the nuclei markers in the form of a JSON object.
   * @public
   * @function getNuclei
   * @memberof CanvasInteraction
   * @returns {{ nuclei: NucleusJSON[] }}
   */
  public getNuclei(): { nuclei: NucleusJSON[] }{
    return this.nuclei.toJSON();
  }
  /**
   * Returns the current state of the fibers in the form of a JSON object.
   * @public
   * @function getFibers
   * @memberof CanvasInteraction
   * @returns {{ fibers: FiberJSON[] }}
   */
  public getFibers(): { fibers: FiberJSON[] }{
    return this.fibers.toJSON();
  }
  //----------------------------------------- 
  /**
   * Handles the mouse down event on the canvas. If the middle mouse button (button 1) is pressed,
   * it sets the 'isDragging' property in the 'transform' object to 'true' and stores the current
   * mouse coordinates as 'lastX' and 'lastY' properties in the 'transform' object.
   * @public
   * @function mouseDownHandler
   * @memberof CanvasInteraction
   * @param {MouseEvent} e - The MouseEvent object representing the mouse down event.
   * @returns {void}
   */
  public mouseDownHandler(e: MouseEvent) {
    if (e.button === 1) {
      this.transform.isDragging = true;
      this.transform.lastX = e.clientX;
      this.transform.lastY = e.clientY;
    }
  }
  /**
   * Handles the mouse move event on the canvas when the mouse is being dragged (isDragging is true).
   * It calculates the change in mouse position (deltaX and deltaY) since the last mouse event,
   * updates the position (x and y) in the 'transform' object, applies the updated transformation
   * matrices, and then redraws the image with markers.
   * @public
   * @function mouseMoveHandler
   * @memberof CanvasInteraction
   * @param {MouseEvent} e - The MouseEvent object representing the mouse move event.
   * @returns {void}
   */
  public mouseMoveHandler(e: MouseEvent) {
    if (this.transform.isDragging) {
      const deltaX = e.clientX - this.transform.lastX;
      const deltaY = e.clientY - this.transform.lastY;
      this.transform.lastX = e.clientX;
      this.transform.lastY = e.clientY;
      this.transform.pos.x += deltaX;
      this.transform.pos.y += deltaY;
      this.updateMatrices();
      this.drawImageWithMarkers();
    }
  }
  /**
   * Handles the mouse up event on the canvas. It sets the 'isDragging' property in the 'transform' object to 'false',
   * indicating that the mouse drag action is completed.
   * @public
   * @function mouseUpHandler
   * @memberof ClassName
   * @param {MouseEvent} e - The MouseEvent object representing the mouse up event.
   * @returns {void}
   */
  public mouseUpHandler(e: MouseEvent) {
    console.log(e);
    this.transform.isDragging = false;
  }
  /**
   * Handles the mouse wheel (scroll) event on the canvas to implement zoom in/out functionality around the cursor position.
   * It calculates the new zoom factor based on the mouse wheel delta and clamps it to minimum and maximum zoom levels.
   * The function then updates the position and scale (x, y, and scale properties) in the 'transform' object accordingly,
   * applies the updated transformation matrices, and redraws the image with markers.
   * @public
   * @function mouseWheelHandler
   * @memberof CanvasInteraction
   * @param {WheelEvent} e - The WheelEvent object representing the mouse wheel event.
   * @returns {void}
   */
  public mouseWheelHandler(e: WheelEvent): void {
    e.preventDefault();
    const P = this.transform.pos;

    const zoomDelta = -e.deltaY * 0.01;
    const zoomMultiplier = Math.exp(zoomDelta * CanvasInteraction.zoomExponent);
    // do not zoom in too much or too little. (min 0.1 and max 5)
    // mutlply scale by zoomMultiplier(smooth zooming) instead of adding zoomdelta to scale(non smooth zooming).
    const newZoomFactor = Math.min(
      Math.max(0.1, this.transform.scale * zoomMultiplier),
      5
    );

    // the boundaries of the canvas on html. get mouse position relative to the canvas html. left top is origin (0,0)
    const canvasRect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;

    // there is no offset at the cursor. (the cursor is the origin and the axis are beinng scaled. )
    // pos.x and pos.y measure the offset.
    // mouseX is position in canvas relative to the canvas and pos.x is the amount by which the underlyig coordinate system of the canvas has shifted.
    // that amount of shift is (mouseX - pos.x) and that shift will get bugger or smaller because we zoom in/out.
    // (newZoomFactor / scale)  == (newZoomFactor / old newZoomFactor) == the amount of scale that is added relative to previous.
    // so we calculate a new offset relative to mouse position because we want zoom to cursor effect
    P.x = mouseX - (mouseX - P.x) * (newZoomFactor / this.transform.scale);
    P.y = mouseY - (mouseY - P.y) * (newZoomFactor / this.transform.scale);
    this.transform.scale = newZoomFactor;

    this.updateMatrices();
    // Redraw the image with the updated transformation matrix
    this.drawImageWithMarkers();
  }
  /**
   * Handles the mouse click event on the canvas. It calculates the mouse coordinates relative to the canvas
   * before the transformation takes place. The function uses the 'toWorld()' function (not shown in the provided code)
   * to get the original coordinates on the canvas before any transformations. It then adds a marker at the transformed
   * coordinates based on the mouse click event's button (left-click or right-click).
   * @public
   * @function mouseClickHandler
   * @memberof CanvasInteraction
   * @param {MouseEvent} e - The MouseEvent object representing the mouse click event.
   * @returns {void}
   */
  public mouseClickHandler(e: MouseEvent) {
    e.preventDefault();

    // info:
    // https://stackoverflow.com/questions/17130395/real-mouse-position-in-canvas
    const canvasRect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / canvasRect.width;
    const scaleY = this.canvas.height / canvasRect.height;

    const mouseX = (e.clientX - canvasRect.left) * scaleX;
    const mouseY = (e.clientY - canvasRect.top) * scaleY;
    // we dont need the mouse position on the screen.
    // we want to know the mouse position on the screen before the transformation takes place.
    // so, toWorld does an inverse transformation on those coordinates and the drawImageWithMarkers will transform those coordinates back to the their original points.
    const point = this.toWorld(mouseX, mouseY);
    if (e.button === 0) {
      this.addMarker(point.x, point.y, e.button);
    } else if (e.button === 2) {
      this.addMarker(point.x, point.y, e.button);
    }
  }
  
  // -------------------------------------------------------------------------
  // PRIVATE FUNCTIONS
  // -------------------------------------------------------------------------

  /**
   * Clamps the offset (pan) of the image to ensure it stays within the canvas bounds considering the zoom level.
   * If the image is smaller than the canvas, it centers the image within the canvas.
   * The function updates the 'pos' property of the 'transform' object and then applies the updated transformation matrices.
   * @private
   * @function clampOffsetPan
   * @memberof CanvasInteraction
   * @returns {void}
   */
  private clampOffsetPan() {
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    const imageWidth = this.image.width * this.transform.scale;
    const imageHeight = this.image.height * this.transform.scale;

    // Calculate the maximum allowed translation (pan) in the x and y directions when zoomed in
    const maxPanX = Math.max(0, canvasWidth - imageWidth);
    const maxPanY = Math.max(0, canvasHeight - imageHeight);

    // Calculate the minimum allowed translation (pan) in the x and y directions when zoomed in
    const minPanX = Math.min(0, canvasWidth - imageWidth);
    const minPanY = Math.min(0, canvasHeight - imageHeight);

    // Clamp the x and y offset to stay within the canvas bounds, considering the zoom level
    this.transform.pos.x = Math.max(
      minPanX,
      Math.min(this.transform.pos.x, maxPanX)
    );
    this.transform.pos.y = Math.max(
      minPanY,
      Math.min(this.transform.pos.y, maxPanY)
    );

    // If the image is smaller than the canvas, center it
    if (imageWidth < canvasWidth) {
      this.transform.pos.x = (canvasWidth - imageWidth) / 2;
    }
    if (imageHeight < canvasHeight) {
      this.transform.pos.y = (canvasHeight - imageHeight) / 2;
    }

    this.updateMatrices();
  }
  /**
   * Fits the image to the canvas by calculating and applying an initial scale factor.
   * The function sets the 'scale' property of the 'transform' object to ensure the entire image fits within the canvas.
   * It then updates the transformation matrices based on the new scale factor and applies the scaling and translation.
   * @private
   * @function fitToScale
   * @memberof CanvasInteraction
   * @returns {void}
   */
  private fitToScale() {
    // Calculate the initial scale factor to fit the image in the canvas
    const scaleX = this.canvas.width / this.image.width;
    const scaleY = this.canvas.height / this.image.height;
    this.transform.scale = Math.min(scaleX, scaleY);
    this.updateMatrices();
  }

/**
 * Updates the transformation matrices for scaling and translation based on the current scale factor and position.
 * The function modifies the 'transform' object's 'm' and 'im' properties in place to reflect the updated matrices.
 * @private
 * @function updateMatrices
 * @memberof CanvasInteraction
 * @returns {void}
 */
  private updateMatrices() {
    const M = this.transform.m; // still a reference to the same array
    const IM = this.transform.im; // if IM changes so does this.transform.im
    const S = this.transform.scale;
    const P = this.transform.pos;

    M[3] = M[0] = S;
    M[1] = M[2] = 0;
    M[4] = P.x;
    M[5] = P.y;
    // calculate the inverse transformation
    IM[0] = IM[3] = 1 / S;
    IM[1] = IM[2] = 0;
    IM[4] = -P.x / S;
    IM[5] = -P.y / S;
  }

/**
 * Restores the canvas context's transformation matrix to its default state.
 * @private
 * @function restoreCanvas
 * @memberof CanvasInteraction
 * @returns {void}
 */
  private restoreCanvas() {
    this.ctx.restore();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  /**
   * Draws a circle on the canvas with the specified center coordinates, radius, and fill color (if provided).
   * @private
   * @function drawCircle
   * @memberof CanvasInteraction
   * @param {number} x - The x-coordinate of the circle's center.
   * @param {number} y - The y-coordinate of the circle's center.
   * @param {number} radius - The radius of the circle.
   * @param {string} fill The fill color of the circle.
   * @returns {void}
   */
  private drawCircle(x: number, y: number, radius: number, fill: string) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
    this.ctx.fillStyle = fill;
    this.ctx.fill();
  }
  /**
   * Draws a fiber marker on the canvas using the provided Fiber object's position.
   * @private
   * @function drawFiber
   * @memberof CanvasInteraction
   * @param {Fiber} marker - The Fiber object representing the marker to be drawn.
   * @returns {void}
   */
  private drawFiber(marker: Fiber) {
    const points = marker.getPosition();
    // Set stroke and fill colors
    this.ctx.strokeStyle = "magenta";
    this.ctx.fillStyle = "rgba(255, 182, 193, 0.5)";
    // Begin the path
    this.ctx.beginPath();

    // Move to the first point
    this.ctx.moveTo(points[0][0], points[0][1]);

    // Draw lines to the rest of the points
    for (var i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i][0], points[i][1]);
    }

    // Close the path to connect the last point to the first
    this.ctx.closePath();

    // Fill the inside of the path with the specified color
    this.ctx.fill();

    // Draw the stroke of the path with the specified color
    this.ctx.stroke();
  }
  /**
   * Converts the given screen coordinates to world coordinates using the transformation matrix.
   * @private
   * @function toWorld
   * @memberof CanvasInteraction
   * @param {number} x - The x-coordinate in screen space to be converted to world coordinates.
   * @param {number} y - The y-coordinate in screen space to be converted to world coordinates.
   * @returns {{ x: number; y: number }} - An object representing the converted x and y coordinates in world space.
   */
  private toWorld(x: number, y: number): { x: number; y: number } {
    // convert screen to world coords
    const M = this.transform.m;
    const IM = this.transform.im;
    const point = { x: 0, y: 0 };
    point.x = x - M[4];
    point.y = y - M[5];
    point.x = point.x * IM[0] + point.y * IM[2];
    point.y = point.x * IM[1] + point.y * IM[3];
    return point;
  }
  /**
   * Modifies the color channels of the image on the canvas based on specified conditions.
   * If the corresponding color removal flag is set to true, the respective color channel will be set to 0 (removed) for each pixel.
   * The image data is modified in place, and the changes are reflected on the canvas.
   * @private
   * @function modifyColorOfImage
   * @memberof CanvasInteraction
   * @returns {void}
   */
  private modifyColorOfImage() {
    const imageData = this.ctx.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      if (this.imageColors.isRedRemoved) {
        data[i] = 0;
      }

      if (this.imageColors.isGreenRemoved) {
        data[i + 1] = 0;
      }

      if (this.imageColors.isBlueRemoved) {
        data[i + 2] = 0;
      }
    }
    this.ctx.putImageData(imageData, 0, 0);
  }

}

// interface rectangle {
//   xStart: number;
//   xEnd: number;
//   yStart: number;
//   yEnd: number;
// }
// class SelectionBox {
//   //TODO: make sure rectanlge is within bounds and is numbers in runtime (run time type checking? )
//   public static isInside(rectangle: rectangle, x: number, y: number): boolean {
//     const xMin = Math.min(rectangle.xStart, rectangle.xEnd);
//     const xMax = Math.max(rectangle.xStart, rectangle.xEnd);
//     const yMin = Math.min(rectangle.yStart, rectangle.yEnd);
//     const yMax = Math.max(rectangle.yStart, rectangle.yEnd);
//     return xMin <= x && x <= xMax && yMin <= y && y <= yMax;
//   }

//   //TODO: andere functie die te maken hebben met selectiebox.
// }

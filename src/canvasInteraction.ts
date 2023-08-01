import { Nuclei, Nucleus, Fiber, Fibers } from "./markers";

interface transformationObject {
  pos: { x: number; y: number };
  scale: number;
  m: number[];
  im: number[];
  isDragging: boolean;
  lastX: number;
  lastY: number;
}

export class CanvasInteraction {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private nuclei: Nuclei;
  private fibers: Fibers;
  private image: HTMLImageElement;
  private static zoomExponent = 0.05; // exponential zooming for smooth zooming effect.
  private imageColors;

  public transform: transformationObject;
  private showingNuclei: boolean;
  private showingFibers: boolean;

  constructor(canvas: HTMLCanvasElement, image: HTMLImageElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    this.nuclei = new Nuclei();
    this.fibers = new Fibers();

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

  private fitToScale() {
    // Calculate the initial scale factor to fit the image in the canvas
    const scaleX = this.canvas.width / this.image.width;
    const scaleY = this.canvas.height / this.image.height;
    this.transform.scale = Math.min(scaleX, scaleY);
    this.updateMatrices();
  }
  // update the transformation matrix and change the inverse matric accordingly.
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
  // Function to clear the canvas
  public clearCanvas() {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  // Function to restore the canvas state
  private restoreCanvas() {
    this.ctx.restore();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  // Function to draw the image with markers
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
  private drawCircle(x: number, y: number, radius: number, fill: string) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
    if (fill) {
      this.ctx.fillStyle = fill;
      this.ctx.fill();
    }
  }

  private drawFiber(marker: Fiber) {
    const points = marker.position;
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

  public mouseDownHandler(e: MouseEvent) {
    if (e.button === 1) {
      this.transform.isDragging = true;
      this.transform.lastX = e.clientX;
      this.transform.lastY = e.clientY;
    }
  }

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

  public mouseUpHandler(e: MouseEvent) {
    this.transform.isDragging = false;
  }

  // Handle mousewheel event to zoom in/out around the cursor position
  public mouseWheelHandler(e: WheelEvent):void {
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
  private addMarker(x: number, y: number, type: number) {
    const marker = new Nucleus(x, y, type);
    this.nuclei.append(marker);
    this.drawImageWithMarkers();
  }

  //TODO: change data to actual data.
//   public addFiber() {
//     const pointer = new Fiber(0, [
//       [100, 100],
//       [200, 50],
//       [300, 150],
//       [350, 100],
//       [400, 200],
//       [350, 250],
//       [250, 200],
//       [200, 300],
//       [100, 250],
//       [150, 150],
//       [100, 100],
//     ]);
//     this.fibers.append(pointer);
//   }

  public showNuclei(show: boolean): void {
    this.showingNuclei = show;
  }
  public showFibers(show: boolean): void {
    this.showingFibers = show;
  }

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

  public updateChannels(
    redChannelEnabled: boolean,
    greenChannelEnabled: boolean,
    blueChannelEnabled: boolean,
  ) {
    this.imageColors.isBlueRemoved = !blueChannelEnabled;
    this.imageColors.isGreenRemoved = !greenChannelEnabled;
    this.imageColors.isRedRemoved = !redChannelEnabled;
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

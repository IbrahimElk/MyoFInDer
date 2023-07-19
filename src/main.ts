const canvasContainer = document.getElementById("canvas_container") as HTMLDivElement;
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

canvas.width = canvasContainer.clientWidth;
canvas.height = canvasContainer.clientHeight;

//temp file to test fucntionality
const img = new Image();
img.src = "./src/assets/image.jpg";
const aspectRatio = img.width / img.height;

// Load the image and call the draw function after it's loaded
img.onload = function () {
  drawImageWithMarkers(ctx, img, m);
};

// Variables to handle image transformations
const pos = { x: 0, y: 0 }; //the offset in the x and y directions. 
let scale = 1; // scale for scaling
const zoomExponent = 0.05; // exponential zooming for smooth zooming effect. 

const m = [scale, 0, 0, scale, pos.x, pos.y]; // transformation matrix
const im = [1/scale,0,0,1/scale,-pos.x/scale,-pos.y/scale]; // inverse transformation matrix


// temp marker to place marker. 
class Marker {
  sprite;
  XPos;
  YPos;
  constructor() {
    this.sprite = new Image();
    this.sprite.src =
    "http://www.clker.com/cliparts/w/O/e/P/x/i/map-marker-hi.png";
    this.XPos = 0;
    this.YPos = 0;
    this.sprite.width = 372/10;
    this.sprite.height = 594/10;
  }
}
//TODO: DO NOT USE SPRITE FOR NUCLEUS , USE THE FOLLOWING FUNCTION: 
//   function drawCircle(ctx:CanvasRenderingContext2D, x:number, y:number, radius:number, fill:string) {
//     ctx.beginPath()
//     ctx.arc(x, y, radius, 0, 2 * Math.PI, false)
//     if (fill) {
//       // fillstyle = `rgb(${},${},${})` of `blue`
//       ctx.fillStyle = fill
//       ctx.fill()
//     }
// }


const markers:Array<Marker> = [];
const aMarker = new Marker();

// Function to clear the canvas
function clearCanvas(ctx:CanvasRenderingContext2D) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

// Function to restore the canvas state
function restoreCanvas(ctx:CanvasRenderingContext2D) {
  ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
// update the transformation matrix and change the inverse matric accordingly. 
function update(m:number[],im:number[],pos:{x:number,y:number},scale:number) { 
  m[3] = m[0] = scale;
  m[1] = m[2] = 0;
  m[4] = pos.x;
  m[5] = pos.y;
  // calculate the inverse transformation
  im[0]= im[3] = 1/scale;
  im[1] = im[2] = 0;
  im[4] = -pos.x/scale;
  im[5] = -pos.y/scale;
}
// Function to draw the image with markers
function drawImageWithMarkers(ctx:CanvasRenderingContext2D, img:CanvasImageSource, m:number[]) {
  // Clear the canvas before drawing the image
  clearCanvas(ctx);

  // Apply the transformation matrix to the context
  ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);

  // Draw the image
  ctx.drawImage(img, 0, 0);

  // Draw the markers
  for (const marker of markers) {
    ctx.drawImage(
      marker.sprite,
      marker.XPos - marker.sprite.width / 2,
      marker.YPos - marker.sprite.height,
      marker.sprite.width,
      marker.sprite.height
    );
  }
  // Restore the canvas state
  restoreCanvas(ctx);
}

// Dragging functionality
let isDragging = false;
let lastX = 0;
let lastY = 0;

canvas.addEventListener("mousedown", (e) => {
  if (e.button === 1) {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  }
});

document.addEventListener("mousemove", (e) => {
  if (isDragging) {
    const deltaX = e.clientX - lastX;
    const deltaY = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    pos.x += deltaX;
    pos.y += deltaY;
    update(m,im,pos,scale);
    drawImageWithMarkers(ctx, img, m);
  }
});

document.addEventListener("mouseup", () => {
    isDragging = false;
});

// Handle mousewheel event to zoom in/out around the cursor position
canvas.addEventListener("wheel", (e) => {
  e.preventDefault();

  const zoomDelta = -e.deltaY * 0.01;
  const zoomMultiplier = Math.exp(zoomDelta * zoomExponent);
  // do not zoom in too much or too little. (min 0.1 and max 5)
  // mutlply scale by zoomMultiplier(smooth zooming) instead of adding zoomdelta to scale(non smooth zooming). 
  const newZoomFactor = Math.min(Math.max(0.1, scale * zoomMultiplier), 5);
  
  // the boundaries of the canvas on html. get mouse position relative to the canvas html. left top is origin (0,0)
  const canvasRect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - canvasRect.left;
  const mouseY = e.clientY - canvasRect.top;
  
  // there is no offset at the cursor. (the cursor is the origin and the axis are beinng scaled. )
  // pos.x and pos.y measure the offset.
  // mouseX is position in canvas relative to the canvas and pos.x is the amount by which the underlyig coordinate system of the canvas has shifted. 
  // that amount of shift is (mouseX - pos.x) and that shift will get bugger or smaller because we zoom in/out. 
  // (newZoomFactor / scale)  == (newZoomFactor / old newZoomFactor) == the amount of scale that is added relative to previous. 
  // so we calculate a new offset relative to mouse position because we want zoom to cursor effect
  pos.x = mouseX - (mouseX - pos.x) * (newZoomFactor / scale);
  pos.y = mouseY - (mouseY - pos.y) * (newZoomFactor / scale);
  scale = newZoomFactor;

  update(m,im,pos,scale);
  // Redraw the image with the updated transformation matrix
  drawImageWithMarkers(ctx, img, m);
});


// Function to add a marker to the canvas
function addMarker(x:number, y:number) {
  const marker = new Marker();
  marker.XPos = x;
  marker.YPos = y;
  markers.push(marker);
  drawImageWithMarkers(ctx, img, m);
}

function toWorld(x:number, y:number) {  // convert screen to world coords
  const point = {x:0,y:0};
  point.x = x - m[4];
  point.y = y - m[5];
  point.x = point.x * im[0] + point.y * im[2];
  point.y = point.x * im[1] + point.y * im[3];
  return point;
}
// Event listener to add a marker when clicking on the canvas
canvas.addEventListener("click", (e) => {
  // info:
  // https://stackoverflow.com/questions/17130395/real-mouse-position-in-canvas
  const canvasRect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / canvasRect.width; 
  const scaleY = canvas.height / canvasRect.height;

  const mouseX = (e.clientX - canvasRect.left)* scaleX;
  const mouseY = (e.clientY - canvasRect.top)* scaleY;

  // we dont need the mouse position on the screen. 
  // we want to know the mouse position on the screen before the transformation takes place. 
  // so, toWorld does an inverse transformation on those coordinates and the drawImageWithMarkers will transform those coordinates back to the their original points. 
  const point = toWorld(mouseX,mouseY)
  addMarker(point.x, point.y);
});

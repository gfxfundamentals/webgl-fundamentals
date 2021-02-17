Title: How to implement zoom from mouse in 2D WebGL
Description: How to implement zoom from mouse in 2D WebGL
TOC: How to implement zoom from mouse in 2D WebGL

## Question:

I'm currently building a 2D drawing app in WebGL. I want to implement zoom to point under mouse cursor similar to example in [here](https://stackoverflow.com/a/53193433/2594567). But I can't figure out how to apply the solution from that answer in my case.

I have done basic zoom by scaling camera matrix. But it zooms to the top-left corner of the canvas, due to that being the origin (0,0) set by the projection (as far as I understand).

Basic pan & zoom implemented:
![img](https://i.imgur.com/asRTm1e.gif)

### My draw function (including matrix computations) looks like this:

```javascript
var projection = null;
var view = null;
var viewProjection = null;

function draw(gl, camera, sceneTree){
  // projection matrix
  projection = new Float32Array(9);
  mat3.projection(projection, gl.canvas.clientWidth, gl.canvas.clientHeight);
  
  // camera matrix
  view = new Float32Array(9);
  mat3.fromTranslation(view, camera.translation);
  mat3.rotate(view, view, toRadians(camera.rotation));
  mat3.scale(view, view, camera.scale);
  // view matrix
  mat3.invert(view, view)

  // VP matrix
  viewProjection = new Float32Array(9);
  mat3.multiply(viewProjection, projection, view);

  // go through scene tree:
  //  - build final matrix for each object
  //      e.g: u_matrix = VP x Model (translate x rotate x scale) 
  
  // draw each object in scene tree
  // ... 
}
```

### Vertex shader:
```
attribute vec2 a_position;

uniform mat3 u_matrix;

void main() {
  gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
}
```

### Zoom function:

```javascript

function screenToWorld(screenPos){
  // normalized screen position 
  let nsp = [
     2.0 * screenPos[0] / this.gl.canvas.width - 1,
     - 2.0 * screenPos[1] / this.gl.canvas.height + 1
  ];
    
  let inverseVP = new Float32Array(9);
  mat3.invert(inverseVP, viewProjection);

  let worldPos = [0, 0];
  return vec2.transformMat3(worldPos, nsp, inverseVP);
}

var zoomRange = [0.01, 2];

canvas.addEventListener('wheel', (e) => {
  let oldZoom = camera.scale[0];
  let zoom = Math.min(Math.max(oldZoom + e.deltaX / 100, zoomRange[0]), zoomRange[1]);

  camera.scale = [zoom, zoom];

  let zoomPoint = screenToWorld([e.clientX, e.clientY]);
  // totally breaks if enable this line 
  //vec2.copy(camera.translation, zoomPoint);
  
  // call draw function again
  draw();

}, false); 
```


If I apply `zoomPoint` to camera translation, the values of `zoomPoint` (and the camera position accordingly) start to raise up uncontrollably with every zoom event (no mater if I zoom in or out) and the objects drawn in the scene go immediately out of view.

Would greatly appreciate any insights or suggestions about what am I doing wrong here. Thanks.

## Answer:

Since you didn't post a **minimal reproducible example** in the question itself I couldn't test with your math library. Using my own though I was able to zoom like this

```
  const [clipX, clipY] = getClipSpaceMousePosition(e);
  
  // position before zooming
  const [preZoomX, preZoomY] = m3.transformPoint(
      m3.inverse(viewProjectionMat), 
      [clipX, clipY]);
    
  // multiply the wheel movement by the current zoom level
  // so we zoom less when zoomed in and more when zoomed out
  const newZoom = camera.zoom * Math.pow(2, e.deltaY * -0.01);
  camera.zoom = Math.max(0.02, Math.min(100, newZoom));
  
  updateViewProjection();
  
  // position after zooming
  const [postZoomX, postZoomY] = m3.transformPoint(
      m3.inverse(viewProjectionMat), 
      [clipX, clipY]);

  // camera needs to be moved the difference of before and after
  camera.x += preZoomX - postZoomX;
  camera.y += preZoomY - postZoomY;  
```

Note that zoom is the opposite of scale. If zoom = 2 then I want everything to appear 2x larger. To do that requires *shrinking* the camera space so we scale that space by 1 / zoom

Example:

{{{example url="../webgl-qna-how-to-implement-zoom-from-mouse-in-2d-webgl-example-1.html"}}}

note that I included camera.rotation just to make sure things worked if rotated. They seem to. [Here's one with zoom, pan, and rotate](https://jsfiddle.net/greggman/mdpxw3n6/)

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/2594567">nicktgn</a>
    from
    <a data-href="https://stackoverflow.com/questions/57892652">here</a>
  </div>
</div>

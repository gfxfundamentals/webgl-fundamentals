Title: Why don't these voxels I am drawing using GL.POINTS line up? How can I fix it?
Description:
TOC: qna

# Question:

I have been working on a voxel engine using webgl. It uses gl.points to draw voxels using a square based on your distance to the point. 

Here is the basics of how it work

````
Vertex: 

//Get position using the projection matrix and block XYZ 
gl_Position =  uMatrix * uModelMatrix * vec4(aPixelPosition[0],-aPixelPosition[2],aPixelPosition[1],1.0);

//Set size of point based on screen height and divide it by depth to size based on distance
gl_PointSize = (uScreenSize[1]) / gl_Position[2];
````

And here is how that looks when it is from a non-problematic angle. 

[![enter image description here][1]][1]

You can see, it looks just how I want to (of course its not as good as real cubes, but preforms amazing on mobile) now lets go inside of this hollow cube and see what it looks like. This picture is me looking into the corner

[![enter image description here][2]][2]

I changed the background color to highlight the issue. Basically if you are looking directly at the blocks, they work fine, but if they are at an angle to you, they are too small and leave large gaps. This picture is me looking at a wall directly 

[![enter image description here][3]][3]

You can see facing the back wall works perfect, but all the other walls look bad.

So clearly I am doing something wrong, or not thinking about something properly. I have tried a lot of different things to try and repair it but none of my fixes work proper. 

I have tried making it so blocks towards the edge of the screen are bigger, this fixes the problem but it also makes blocks bigger that don't need to be. Like for example looking at a flat wall, the edges would become much bigger even though  looking at a flat wall doesn't have the issue.

I have also tried making the squares much bigger and this fixes it but then they overlap everywhere and it doesn't look nearly as clean.

You can see the example of the problem here (just takes a second to generate the structure) 
 https://sebastian97.itch.io/voxel-glitchy
WASD- movement
Arrow keys / mouse - Look

  [1]: https://i.stack.imgur.com/5momo.png
  [2]: https://i.stack.imgur.com/Lx5r8.png
  [3]: https://i.stack.imgur.com/zjVHI.png

# Answer

Assuming you have your projection matrix separated out I think you want `gl_PointSize` to be

    vec4 modelViewPosition = view * model * position;

    gl_PointSize = someSize / -modelViewPosition.z;

    gl_Position = projection * modelViewPosition;

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    'use strict';

    /* global window, twgl, requestAnimationFrame, document */

    const height = 120;
    const width = 30
    const position = [];
    const color = [];
    const normal = [];
    for (let z = 0; z < width; ++z) {
      for (let x = 0; x < width; ++x) {
        position.push(x, 0, z);
        color.push(r(0.5), 1, r(0.5));
        normal.push(0, 1, 0);
      }
    }
    for (let y = 1; y < height ; ++y) {
      for (let x = 0; x < width; ++x) {
        position.push(x, -y, 0);
        color.push(0.6, 0.6, r(0.5));
        normal.push(0, 0, -1);
        
        position.push(x, -y, width - 1);
        color.push(0.6, 0.6, r(0.5));
        normal.push(0, 0, 1);
        
        position.push(0, -y, x);
        color.push(0.6, 0.6, r(0.5));
        normal.push(-1, 0, 0);
        
        position.push(width - 1, -y, x);
        color.push(0.6, 0.6, r(0.5));
        normal.push(1, 0, 0);
      }
    }

    function r(min, max) {
      if (max === undefined) {
        max = min;
        min = 0;
      }
      return Math.random() * (max - min) + min;
    }

    const m4 = twgl.m4;
    const v3 = twgl.v3;
    const gl = document.querySelector('canvas').getContext('webgl');

    const vs = `
    attribute vec4 position;
    attribute vec3 normal;
    attribute vec3 color;

    uniform mat4 projection;
    uniform mat4 modelView;

    varying vec3 v_normal;
    varying vec3 v_color;

    void main() {
      vec4 modelViewPosition = modelView * position;
      gl_Position = projection * modelViewPosition;
      gl_PointSize = 850.0 / -modelViewPosition.z;
      v_normal = mat3(modelView) * normal;
      v_color = color;
    }
    `;

    const fs = `
    precision highp float;

    varying vec3 v_normal;
    varying vec3 v_color;

    void main() {
      vec3 lightDirection = normalize(vec3(1, 2, 3));  // arbitrary light direction
      
      float l = dot(lightDirection, normalize(v_normal)) * .5 + .5;
      gl_FragColor = vec4(v_color * l, 1);
    }
    `;

    // compile shader, link, look up locations
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    // make some vertex data
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      position,
      normal,
      color: { numComponents: 3, data: color },
    });

    const keys = [];
    const eye = [10, 10, 55];
    const target = [0, 0, 0];
    const up = [0, 1, 0];
    const speed = 50;

    const kUp = 38;
    const kDown = 40;
    const kLeft = 37;
    const kRight = 39;
    const kForward = 87;
    const kBackward = 83;
    const kSlideLeft = 65;
    const kSlideRight = 68;

    const keyMove = new Map();
    keyMove.set(kForward,    { ndx: 8, eye:  1, target: -1 });
    keyMove.set(kBackward,   { ndx: 8, eye:  1, target:  1 });
    keyMove.set(kSlideLeft,  { ndx: 0, eye:  1, target: -1 });
    keyMove.set(kSlideRight, { ndx: 0, eye:  1, target:  1 });
    keyMove.set(kLeft,       { ndx: 0, eye:  0, target: -1 });
    keyMove.set(kRight,      { ndx: 0, eye:  0, target:  1 });
    keyMove.set(kUp,         { ndx: 4, eye:  0, target: -1 });
    keyMove.set(kDown,       { ndx: 4, eye:  0, target:  1 });

    let then = 0;
    function render(time) {
      time *= 0.001;  // seconds
      const deltaTime = time - then;
      then = time;
      
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      
      const fov = Math.PI * 0.25;
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      const near = 0.1;
      const far = 1000;
      const projection = m4.perspective(fov, aspect, near, far);
      
      const camera = m4.lookAt(eye, target, up);
      const view = m4.inverse(camera);
      const modelView = m4.translate(view, [width / -2, 0, width / -2]);
      
      keyMove.forEach((move, key) => {
        if (keys[key]) {
          const dir = camera.slice(move.ndx, move.ndx + 3);
          const delta = v3.mulScalar(dir, deltaTime * speed * move.target);
         v3.add(target, delta, target);
       if (move.eye) {
         v3.add(eye, delta, eye);
          }    
        }
      });

      gl.useProgram(programInfo.program);
      
      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      
      // calls gl.activeTexture, gl.bindTexture, gl.uniformXXX
      twgl.setUniforms(programInfo, {
        projection,
        modelView,
      });  
      
      // calls gl.drawArrays or gl.drawElements
      twgl.drawBufferInfo(gl, bufferInfo, gl.POINTS);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    window.addEventListener('keydown', (e) => {
      e.preventDefault();
      keys[e.keyCode] = true;
    });
    window.addEventListener('keyup', (e) => {
      keys[e.keyCode] = false;
    });

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }
    #i { position: absolute; top: 0; left: 5px; font-family: monospace; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>
    <div id="i">ASWD ⬆️⬇️⬅️➡️</div>

<!-- end snippet -->



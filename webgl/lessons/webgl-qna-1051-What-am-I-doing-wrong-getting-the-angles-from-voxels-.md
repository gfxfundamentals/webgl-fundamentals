Title: What am I doing wrong getting the angles from voxels?
Description:
TOC: qna

# Question:

#Apologies in advanced if I don't explain anything clearly, please feel free to ask for clarification. This hobby game project means a lot to me#

I am making a voxel rendering engine using webgl. It uses gl.points to draw squares for each voxel. I simply use a projection matrix translated by the cameras position, and then rotated by the cameras rotations. 

```
gl_Position = 
 uMatrix * uModelMatrix * vec4(aPixelPosition[0],-aPixelPosition[2],aPixelPosition[1],1.0);
```

The modelviewmatrix is simply just the default mat4.create(), for some reason it would not display anything without one. aPixelPosition is simply the X,Z,Y (in webgl space) of a voxel. 

Using something like this:

```
gl_PointSize = (uScreenSize[1]*0.7) / (gl_Position[2]);
```

You can set the size of the voxels based on their distance from the camera. Which works pretty well minus one visual error.

![](https://i.imgur.com/gt8euIb.png)
(Picture from inside a large hollow cube)

You can see the back wall displays fine (because they all are pointed directly at you) but the walls that are displayed at an  angle to you, need to be increased in size.
So I used the dot product between your facing position, and the position of the voxel minus your camera position to get the angle of each block and colored them accordingly. 

```
vPosition=acos(dot( normalize(vec2(sin(uYRotate),-cos(uYRotate))) ,
  normalize(vec2(aPixelPosition[0],aPixelPosition[1])-
vec2(uCam[0],uCam[1]))));

then color the blocks with what this returns.
```


![](https://i.imgur.com/NoYeTjW.png)

(walls go from black to white depending on their angle to you)

This visual demonstration shows the problem, the walls on the back face all point at an angle to you except for the ones you are directly looking at, the walls on the side of the same face get more and more angled to you. 

If I adjust the pointSize to increase with the angle using this, it will fix the visual glitch, but it introduces a new one.

![](https://i.imgur.com/TpHzmAi.png)

Everything looks good from here, but if you get really close to a wall of blocks and move left and right 

![](https://i.imgur.com/hIBFIWI.png)

There is a fairly noticeable bubbling effect as you scan left and right, because the ones on the side of your view are slightly more at an angle (even though they should face the same way anyways)

So clearly, my math isn't the best. How could I have it so only the walls on the side return an angle? And the ones on the back wall all don't return any angle. Thanks a ton.

I have tried making it so the dot product always checks the voxels X as if it is the same as the cameras, but this just made it so each voxel was colored the same.

# Answer

I'm not sure you can actually do what you're trying to do which is represent voxel (cubes) and 2D squares (gl.POINTS).

I'm not sure I can demo the issue. Maybe I should write a program to draw this so you can move the camera around but ...

Consider these 6 cubes

[![6 cubes][1]][1]

Just putting a square at their projected centers won't work

It seems to me there are no squares that will represent those cubes in a generic way that have no gaps and no other issues.

To make sure there are no gaps, every pixel the cube would cover needs to be covered by the square. So, first we can draw the rectangle that covers each cube

[![cube screen extents][2]][2]

Then because gl.POINTS are square we need to expand each area to a square

[![squares][3]][3]

given the amount of overlap there are going to be all kinds of issues. At extreme angles the size a particular square needs to be to cover the screen space of the cube it represents will get really large. Then, when Z is the same for a bunch of cubes you'll get z-fighting issues. For example the blue square will appear in front of the green square where they overlap making a little notch in the green. 

We can see that here

[![enter image description here][4]][4]

Each green pixel is partially overlapped by the brown pixel that is one column to the right and one voxel down because that POINT is in front and large enough to cover the screen space the brown voxel takes it ends up covering the green pixel to the left and up one.

Here's a shader that follows the algorithm above. For each point in 3D space it assumes a unit cube. It computes the normalized device coordinates (NDC) of each of the 8 points of the cube and uses those to get the min and max NDC coordinates. From that it can compute the `gl_PointSize` need to cover that large of an area. It then places the point in the center of that area. 

<!-- begin snippet: js hide: false console: true babel: false -->

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
    uniform vec2 resolution;

    varying vec3 v_normal;
    varying vec3 v_color;

    vec2 computeNDC(vec4 p, vec4 off) {
      vec4 clipspace = projection * modelView * (p + off);
      return clipspace.xy / clipspace.w;
    }


    void main() {
      vec2 p0 = computeNDC(position, vec4(-.5, -.5, -.5, 0));
      vec2 p1 = computeNDC(position, vec4( .5, -.5, -.5, 0));
      vec2 p2 = computeNDC(position, vec4(-.5,  .5, -.5, 0));
      vec2 p3 = computeNDC(position, vec4( .5,  .5, -.5, 0));
      vec2 p4 = computeNDC(position, vec4(-.5, -.5,  .5, 0));
      vec2 p5 = computeNDC(position, vec4( .5, -.5,  .5, 0));
      vec2 p6 = computeNDC(position, vec4(-.5,  .5,  .5, 0));
      vec2 p7 = computeNDC(position, vec4( .5,  .5,  .5, 0));
      
      vec2 minNDC = 
        min(p0, min(p1, min(p2, min(p3, min(p4, min(p5, min(p6, p7)))))));
      vec2 maxNDC = 
        max(p0, max(p1, max(p2, max(p3, max(p4, max(p5, max(p6, p7)))))));

      vec2 minScreen = (minNDC * 0.5 + 0.5) * resolution;
      vec2 maxScreen = (maxNDC * 0.5 + 0.5) * resolution;
      vec2 rangeScreen = ceil(maxScreen) - floor(minScreen);
      float sizeScreen = max(rangeScreen.x, rangeScreen.y);
      
      // sizeSize is now how large the point has to be to touch the 
      // corners
      
      gl_PointSize = sizeScreen;
      
      vec4 pos = projection * modelView * position;
      
      // clip ourselves
      if (pos.x < -pos.w || pos.x > pos.w) {
        gl_Position = vec4(0,0,-10,1);
        return;
      }
     
      // pos is the wrong place to put the point. The correct
      // place to put the point is the center of the extents
      // of the screen space points
      
      gl_Position = vec4(
        (minNDC + (maxNDC - minNDC) * 0.5) * pos.w,
        pos.z,
        pos.w);
        
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
      gl_FragColor.rgb *= gl_FragColor.a;
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

    let camera;
    const eye = [10, 10, 55];
    const target = [0, 0, 0];
    const up = [0, 1, 0];
    const speed = 0.5;

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

    function render() {  
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      
      const fov = Math.PI * 0.25;
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      const near = 0.1;
      const far = 1000;
      const projection = m4.perspective(fov, aspect, near, far);
      
      camera = m4.lookAt(eye, target, up);
      const view = m4.inverse(camera);
      const modelView = m4.translate(view, [width / -2, 0, width / -2]);
      
      gl.useProgram(programInfo.program);
      
      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      
      // calls gl.activeTexture, gl.bindTexture, gl.uniformXXX
      twgl.setUniforms(programInfo, {
        projection,
        modelView,
        resolution: [gl.canvas.width, gl.canvas.height],
      });  
      
      // calls gl.drawArrays or gl.drawElements
      twgl.drawBufferInfo(gl, bufferInfo, gl.POINTS);
    }
    render();

    window.addEventListener('keydown', (e) => {
      e.preventDefault();
      
      const move = keyMove.get(e.keyCode);
      if (move) {
        const dir = camera.slice(move.ndx, move.ndx + 3);
        const delta = v3.mulScalar(dir, speed * move.target);
        v3.add(target, delta, target);
       if (move.eye) {
         v3.add(eye, delta, eye);
        }    
        render();
      }
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

Even on top of that you're going to have other issues using `POINTS`

1. the max point size only has to be 1.

   The spec says implementation can choose a max size point they support and that at has to be at least 1. In other words, some implementations might only support point sizes of 1. [Checking WebGLStats](https://webglstats.com/webgl/parameter/ALIASED_POINT_SIZE_RANGE) it appears it appears in reality you might be ok but still...

2. some implementations clip POINTS in correctly and it's unlikely to be fixed

   See https://stackoverflow.com/a/56066386/128511 

  [1]: https://i.stack.imgur.com/wdj32.png
  [2]: https://i.stack.imgur.com/Lahmq.png
  [3]: https://i.stack.imgur.com/Mn7bW.png
  [4]: https://i.stack.imgur.com/Q6weP.png

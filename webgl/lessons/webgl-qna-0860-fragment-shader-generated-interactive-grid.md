Title: fragment shader generated interactive grid
Description:
TOC: qna

# Question:

I am trying to implement my own WebGL based 3D graph plotting app. 

As I might by dealing with a lot of data points, I hope I can make an interactive grid to help visualize number of different order of magnitude with scrolling support(for scaling). 

Here is my fragment shader for my grid cube. 

 precision highp float;
 varying vec3 pos;
 uniform float u_size;
 uniform float u_scale;

 float my_fmod(float inp_val, float inp_m) {
  float m = inp_m;
  float val = inp_val + 201.0 * m;
  return abs(val - float(int(val/m)) * m);
 }

 float gridline(float nPos0, float nPos1, float fac, float very_small_number) {
  if ( my_fmod(nPos0, 1./fac) < very_small_number || my_fmod(nPos1, 1./fac) < very_small_number) return 1.0;
  return 0.0;
 }

 void main() {

  float very_small_number = 0.015 / u_scale;
  float size = u_size;
  vec3 nPos = pos / u_scale;

  vec3 color = vec3(0.,0.,0.5);
  float sqrt5 = 2.236068;

  gl_FragColor = vec4(0.,0.,0.,1.); 

  float n = 5.;
  float sLine = 1.;
  float t1 = 1.;
  float t2 = 1.;

  if (pos.x == -size || pos.x == size) {
   if (gridline(nPos.y, nPos.z, n, very_small_number) > 0.5) gl_FragColor.xyz += color * t1;
   if (gridline(nPos.y*n, nPos.z*n, n, very_small_number) > 0.5) gl_FragColor.xyz += color * t2;
  } else if (pos.y == -size || pos.y == size) {
   if (gridline(nPos.x, nPos.z, n, very_small_number) > 0.5) gl_FragColor.xyz += color * t1;
   if (gridline(nPos.x*n, nPos.z*n, n, very_small_number) > 0.5) gl_FragColor.xyz += color * t2;
  } else if (pos.z == -size || pos.z == size) {
   if (gridline(nPos.x, nPos.y, n, very_small_number) > 0.5) gl_FragColor.xyz += color * t1;
   if (gridline(nPos.x*n, nPos.y*n, n, very_small_number) > 0.5) gl_FragColor.xyz += color * t2;
  }
 }


As you can see, I drew two sets of grid. They represents two different order of magnitudes. At this moment, it can scale perfectly but I want to add a feature which allows fading between different order of magnitudes and only shows grids that are in certain scale.

Here is the original look of the App,

[![enter image description here][1]][1]

It looks nice. And when I zoom in, 

[![enter image description here][2]][2]

The grid looks larger. But I hope that my shader can draw new grids inside the small grids and not to draw large grids which is not visible any more.

When I zoom out, 

[![enter image description here][3]][3]

There are too many grids shown and it affects the user's experience. 

So, how can I achieve transitioning between different order of magnitudes and apply fading between the transitions? Sorry for my poor English. Any help is appreciated. Have a nice day.


edit 1:

Here is the full code for experimenting.

https://github.com/Jonathan-D-Ip/WebGLPlottingApp/blob/master/Display.html

  [1]: https://i.stack.imgur.com/kM5Nv.png
  [2]: https://i.stack.imgur.com/9ttjK.png
  [3]: https://i.stack.imgur.com/km9fu.png

# Answer

If it was me I wouldn't be using a fragment shader for a grid I'd be using lines. I'd draw one grid at one size and if I was close to the transition and needed a new grid I'd draw another grid at another scale. Both grids would have an alpha setting so I could fade them out.

Here's an example, use the mousewheel or equivalent to zoom. Maybe you can adapt the ideas to your preferred solution. The important part is probably this part

      const gridLevel = Math.log10(zoom * zoomAdjust);
      const gridFract = euclideanModulo(gridLevel, 1);
      const gridZoom = Math.pow(10, Math.floor(gridLevel));
    
      const alpha1 = Math.max((1 - gridFract) * 1);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
      drawGrid(viewProjection, gridZoom, [0, alpha1, 0, alpha1]);
      const alpha2 = Math.max(gridFract * 10) - 1;
      if (alpha2 > 0) {
        drawGrid(viewProjection, gridZoom * 10, [0, alpha2, 0, alpha2],);
      }

`zoom` goes from 0.0001 to 10000 and represents the distance from the target. The code uses `Math.log10` to find out 10 to the what power is needed to get that zoom level. In other words if zoom is 100 then `gridLevel` = 2. If `zoom` is 1000 then `gridLevel` = 3. From that we can get the fractional amount between powers of 10 in `gridFract` which will always be in the range of 0 to 1 as we move between zoom levels.

`gridZoom` tells us what scale to draw one of our grids (we just remove the fractional part of `gridLevel`) and then raise 10 to that power. `gridZoom * 10` is the next largest grid size.

`alpha1` is the alpha for the grid. `alpha2` is the alpha for the second grid. 

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const m4 = twgl.m4;
    const gl = document.querySelector("canvas").getContext("webgl", {alpha: false});
    const zoomElem = document.querySelector("#zoom");
    const zoomAdjust = 1;  // change to adjust when things start/end. Try 5 or .5 for example

    let zoom = 1;

    const gridVS = `
    attribute vec4 position;
    uniform mat4 matrix;
    void main() {
      gl_Position = matrix * position;
    }
    `;
    const gridFS = `
    precision mediump float;
    uniform vec4 color;
    void main() {
      gl_FragColor = color;
    }
    `;
    const gridProgramInfo = twgl.createProgramInfo(gl, [gridVS, gridFS]);

    const gridPlaneLines = [];
    const numLines = 100;
    for (let i = 0; i <= 100; ++i) {
      gridPlaneLines.push(0, i, 100, i);
      gridPlaneLines.push(i, 0, i, 100);
    }
    const gridPlaneBufferInfo = twgl.createBufferInfoFromArrays(gl, {
      position: { numComponents: 2, data: gridPlaneLines },
    });

    function drawGrid(viewProjection, scale, color) {
      gl.useProgram(gridProgramInfo.program);
      twgl.setBuffersAndAttributes(gl, gridProgramInfo, gridPlaneBufferInfo);

      const scaling = [scale, scale, scale];
      // draw Z plane
      {
        let matrix = m4.scale(viewProjection, scaling);
        matrix = m4.rotateY(matrix, Math.PI);
        twgl.setUniforms(gridProgramInfo, {
          matrix,
          color,
        });
        twgl.drawBufferInfo(gl, gridPlaneBufferInfo, gl.LINES);
      }
      // draw X plane
      {
        let matrix = m4.scale(viewProjection, scaling);
        matrix = m4.rotateY(matrix, Math.PI * .5);
        twgl.setUniforms(gridProgramInfo, {
          matrix,
          color,
        });
        twgl.drawBufferInfo(gl, gridPlaneBufferInfo, gl.LINES);
      }
      // draw Y plane
      {
        let matrix = m4.scale(viewProjection, scaling);
        matrix = m4.rotateY(matrix, Math.PI);
        matrix = m4.rotateX(matrix, Math.PI * .5);
        twgl.setUniforms(gridProgramInfo, {
          matrix,
          color,
        });
        twgl.drawBufferInfo(gl, gridPlaneBufferInfo, gl.LINES);
      }
    }

    function render() {
      twgl.resizeCanvasToDisplaySize(gl.canvas, window.devicePixelRatio);
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

      zoomElem.textContent = zoom.toFixed(5);

      const fov = degToRad(60);
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      const zNear = zoom / 100;
      const zFar = zoom * 100;
      const projection = m4.perspective(fov, aspect, zNear, zFar);

      const eye = [zoom * -10, zoom * 5, zoom * -10];
      const target = [0, 0, 0];
      const up = [0, 1, 0];
      const camera = m4.lookAt(eye, target, up);
      const view = m4.inverse(camera);

      const viewProjection = m4.multiply(projection, view);

      const gridLevel = Math.log10(zoom * zoomAdjust);
      const gridFract = euclideanModulo(gridLevel, 1);
      const gridZoom = Math.pow(10, Math.floor(gridLevel));

      const alpha1 = Math.max((1 - gridFract) * 1);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
      drawGrid(viewProjection, gridZoom, [0, alpha1, 0, alpha1]);
      const alpha2 = Math.max(gridFract * 10) - 1;
      if (alpha2 > 0) {
        drawGrid(viewProjection, gridZoom * 10, [0, alpha2, 0, alpha2],);
      }
    }
    render();

    function euclideanModulo(n, m) {
        return ((n % m) + m) % m;
    };

    function degToRad(deg) {
      return deg * Math.PI / 180;
    }

    window.addEventListener('wheel', (e) => {
      e.preventDefault();
      const amount = e.deltaY;
      if (e.deltaY < 0) {
        zoom *= 1 - clamp(e.deltaY / -500, 0, 1);
      } else {
        zoom *= 1 + clamp(e.deltaY / 500, 0, 1);
      }
      zoom = clamp(zoom, 0.0001, 10000);
      render();
    }, {passive: false});
    window.addEventListener('resize', render);

    function clamp(v, min, max) {
      return Math.max(min, Math.min(max, v));
    }


<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }
    #ui { position: absolute; left: 1em; top: 1em; padding: 1em; color: white; }

<!-- language: lang-html -->

    <canvas></canvas>
    <script src="https://twgljs.org/dist/4.x/twgl-full.js"></script>
    <div id="ui">
      <div>zoom:<span id="zoom"></span></div>
    </div>

<!-- end snippet -->




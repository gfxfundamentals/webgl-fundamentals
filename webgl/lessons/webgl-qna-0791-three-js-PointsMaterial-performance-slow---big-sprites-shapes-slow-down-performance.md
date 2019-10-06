Title: three.js PointsMaterial performance slow - big sprites/shapes slow down performance
Description:
TOC: qna

# Question:

I'm working on a point cloud of about 60.000 vertices.

If I render the cloud "viewing it small" performance is ok, but when I "zoom in" and I see big sprites / planes / points on screen, performance drops.

This happens using a `PointsMaterial` or a `RawShaderMaterial`, a `Points` object or an `instancedBufferGeometry` mesh.

It looks like when rendering a single large shape that covers most of the canvas, performance drops.

Performance drops worse if the points have a transparent texture.

I remember having a similar problem while rendering big overlapping transparent images in Processing.

# Answer

As Sedenion mentioned you're most likely fill rate bound. That means you're drawing too many pixels.

A GPU can only draw so fast. A average non-gamer GPU can only draw 6-10 screens full of pixels at 60 frames a second. If you draw more pixels than that it will run too slow even of those are simple pixels (in other words even if you have simple shaders). For a normal 3D scene usually you have a depth test enabled. By drawing the closest things first the depth buffer will prevent things in the back from being drawn which helps speed things up. For sprites though usually depth testing is not used. This means every pixel from every sprite is drawn even if they overlap. If you add up the number of pixels getting drawn you'll see you are quickly drawing too many pixels.

Here's a simple example that just draws a 2048x2048 `POINT` in a solid color, no textures. An extremely simple shader. Drag the slider to the right to draw more points. In my 2014 Macbook Pro it can only draw about 12 points at that size before it can no longer run at 60fps. Different GPUs will be able to draw more or less. 

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const vs = `
    void main() {
      gl_Position = vec4(0, 0, 0, 1);
      gl_PointSize = 4000.0;
    }
    `
    const fs = `
    void main() {
      gl_FragColor = vec4(1./256., 0, 0, 1./256.);
    }
    `;

    const gl = document.querySelector("canvas").getContext("webgl");
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    let numPoints = 1;
    const inputElem = document.querySelector('input');
    const numPointsElem = document.querySelector('#numpoints');
    const fpsElem = document.querySelector('#fps');
    const numPixElem = document.querySelector('#numpix');
    const pointSizeElem = document.querySelector('#ps');
    const pointSize = Math.min(2048, gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)[1]);
    pointSizeElem.textContent = `${pointSize}x${pointSize}`;


    inputElem.addEventListener('input', (e) => {
      updateValue(e.target.value);
    });

    function updateValue(value) {
      numPointsElem.textContent = value;
      numPixElem.textContent = frmt(value * pointSize * pointSize);
      numPoints = value;
    };

    updateValue(1);

    let then = 0;
    function render(now) {
      const deltaTime = now - then;
      then = now;
      const fps = 1000 / deltaTime;
      fpsElem.textContent = fps.toFixed(1);
      
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(programInfo.program);
      gl.drawArrays(gl.POINTS, 0, numPoints);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    function frmt(v) {
      return [].map.call(v.toString(), a => a).reverse().map((a, n) => { return a + (n % 3 === 0 && n > 1 ? ',' : ''); }).reverse().join('');
    }

<!-- language: lang-css -->

    html { box-sizing: border-box; }
    *, *:after, *:before { box-sizing: inherit; }
    body {  margin: 0; font-family: monospace; }
    canvas { width: 100vw; height: 100vh; display: block; }
    #ui { 
      padding: 1em;
      position: absolute; 
      top: 0; 
      left: 0; 
      color: white; 
      background: rgba(0,0,0,0.9); 
      width: 100vw;
    };

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/twgl-full.min.js"></script>
    <canvas width="2048" height="2048"></canvas>
    <div id="ui">
      <div><input type="range" min="1" max="500" value="1"></div>
      <div>number of points: <span id="numpoints">1</span></div>
      <div>point size: <span id="ps"></span></div>
      <div>number of pixels being drawn per frame: <span id="numpix"></span></div>
      <div>frames per second: <span id="fps"></span></div>
    </div>

<!-- end snippet -->


There is no "easy" solution. You need to find a way to draw less pixels some way or another. Turn on depth testing and make your points not blend might be on solution to help. Sorting your points front to back after turning on depth testing would also help.

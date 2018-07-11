Title: WebGL - Animating lots of similar objects
Description: Ways to optimize drawing lots of similar objects

If it was me I'd calculate the starting and ending points, put them in vertex buffers, and lerp between them. Same as [*morph targets*](https://en.wikipedia.org/wiki/Morph_target_animation).

Example :

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const numAreas = 30;
    const numPointsPerArea = 100;
    const maxDistFromArea = 10;
    const areaWidth = 300;
    const areaHeight = 150;

    const endPositions = [];
    for (let a = 0; a < numAreas; ++a) {
      const areaX = rand(maxDistFromArea, areaWidth - maxDistFromArea);
      const areaY = rand(maxDistFromArea, areaHeight - maxDistFromArea);;
      for (let p = 0; p < numPointsPerArea; ++p) {
        const x = areaX + rand(-maxDistFromArea, maxDistFromArea);
        const y = areaY + rand(-maxDistFromArea, maxDistFromArea);
        endPositions.push(x, y);
      }
    }

    const startPositions = [];
    for (let a = 0; a < numAreas * numPointsPerArea; ++a) {
      startPositions.push(rand(areaWidth), rand(areaHeight));
    }

    function rand(min, max) {
      if (max === undefined) {
        max = min;
        min = 0;
      }
      return min + Math.random() * (max - min);
    }

    const vs = `
    attribute vec4 startPosition;
    attribute vec4 endPosition;
    uniform float u_lerp;
    uniform mat4 u_matrix;

    void main() {
      vec4 position = mix(startPosition, endPosition, u_lerp);
      gl_Position = u_matrix * position;
      gl_PointSize = 2.0;
    }
    `;

    const fs = `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(1, 0, 0, 1);
    }
    `

    const m4 = twgl.m4;
    const gl = document.querySelector('canvas').getContext('webgl');
    // compile shaders, link program, look up locations
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
    // put data in vertex buffers
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      startPosition: { data: startPositions, numComponents: 2 },
      endPosition: { data: endPositions, numComponents: 2, },
    });

    const easingFunc = easingSineOut;

    function render(time) {
      time *= 0.001;  // convert to seconds

      gl.useProgram(programInfo.program);

      // gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

      // set uniforms
      twgl.setUniforms(programInfo, {
        u_matrix: m4.ortho(0, 300, 150, 0, -1, 1),
        u_lerp: easingFunc(Math.min(1, time % 2)),
      });

      // gl.drawXXX
      twgl.drawBufferInfo(gl, bufferInfo, gl.POINTS);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    function easingSineOut(t) {
      return Math.sin(t * Math.PI * .5);
    }

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

Hopefully you get the point. It's up to you to add whatever other data you want (point per color, size per point, use a texture for points if you want some other shape than a square, or use triangles. Add similar data for lines, etc...) The important part is putting both the start and ending data and lerping between them

    attribute vec4 startPosition;
    attribute vec4 endPosition;
    uniform float u_lerp;

    void main() {
      vec4 position = mix(startPosition, endPosition, u_lerp);

Otherwise there's nothing wrong with uploading every frame via `bufferData` or `bufferSubData`. [Here's an example](http://webglsamples.org/google-io/2011/10000-objects-optimized.html) from [this talk](http://webglsamples.org/google-io/2011/index.html) updating 10000 objects where JavaScript is computing the position of the objects and updating all 210596 vertex positions and uploading the values via `bufferData` every frame.

The big difference between uploading via bufferData and canvas/svg is that with WebGL you're removing a ton from your loops. Consider

## Canvas/SVG

* for each object
    * compute position
    * call multiple draw functions
        * eg: ctx.fillStyle, ctx.begin(), ctx.arc(), ctx.fill()
        * draw functions generate points, copy to buffer (via gl.bufferData)
        * draw functions call gl.draw internally

So for 1000 objects that might be 4000 canvas api calls each of which is doing possibly a `gl.bufferData` internally, multiple `gl.drawXXX` calls and other things

## WebGL

* for each object
    * compute position
* gl.bufferData
* gl.drawXXX

In the WebGL case you still compute 1000 positions but you avoid potentially 3999 api calls and 999 calls to bufferData and replace it all with one draw call and one call to bufferData.

The Canvas and SVG APIs are not magic. They are doing the same things that you'd do manually in WebGL. The difference is they are generic so they can't optimize to the same level and they require lots of functions to produce output. Of course `ctx.fillStyle, ctx.beginPath, ctx.arc, ctx.fill` is only 4 lines of code so that's much less code then drawing a circle in WebGL but in WebGL, once you've defined the a circle you can draw more of them in 2 calls (gl.uniform, gl.draw) and those 2 calls are incredibly shallow (they aren't doing much work) where `ctx.arc` and `ctx.fill` are doing a ton of work. On top of which you can design solutions that draw 100s or 1000s of circles in a single draw call.


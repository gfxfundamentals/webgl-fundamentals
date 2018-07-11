Title: WebGL - Rendering High Resolution
Description: How to render in a higher resolution than WebGl supports

4000x4000 pixel is 4000x4000x4 or 64meg of memory. 8000x8000 is 256meg of memory. Browser's don't like allocating that large chunks of memory and often set limits on the page. So for example you have an 8000x8000 WebGL canvas which requires 2 buffers. The drawingbuffer AND the texture being displayed on the page. The drawingbuffer might be anti-aliases. If it's 4x MSAA then it would require a gig of memory just for that buffer. Then you take a screenshot so another 256meg of memory. So yes, the browser for one reason or another is likely to kill your page.

On top of that WebGL has it's own limits in size. You can look up that limit which is effectively [`MAX_TEXTURE_SIZE`](https://webglstats.com/webgl/parameter/MAX_TEXTURE_SIZE) or [`MAX_VIEWPORT_DIMS`](https://webglstats.com/webgl/parameter/MAX_VIEWPORT_DIMS). You can see from those about 40% of machines can't drawing larger than 4096 (although if you [filter to desktop only it's much better](https://webglstats.com/webgl/parameter/MAX_VIEWPORT_DIMS?platforms=0000ff03c02d20f201)). That number only means what the hardware can do. It's still limited by memory.

One way to kind of maybe solve this issue is to draw the image in parts. How you do that will depend on your app. If you're using a fairly standard perspective matrix for all your rendering you can use slightly different math to render any portion of the view. Most 3d math libraries have a `perspective` function and most of them also have a corresponding `frustum` function that is slightly more flexible.

Here's a fairly standard style WebGL simple sample that draws a cube using a typical `perspective` function

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    "use strict";

    const vs = `
    uniform mat4 u_worldViewProjection;

    attribute vec4 position;
    attribute vec3 normal;

    varying vec3 v_normal;

    void main() {
      v_normal = normal;
      gl_Position = u_worldViewProjection * position;
    }
    `;
    const fs = `
    precision mediump float;

    varying vec3 v_normal;

    void main() {
      gl_FragColor = vec4(v_normal * .5 + .5, 1);
    }
    `;

    const m4 = twgl.m4;
    const gl = document.querySelector("canvas").getContext("webgl");
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    const bufferInfo = twgl.primitives.createCubeBufferInfo(gl, 2);

    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.clearColor(0.2, 0.2, 0.2, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const fov = 30 * Math.PI / 180;
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.5;
    const zFar = 10;
    const projection = m4.perspective(fov, aspect, zNear, zFar);
    const eye = [1, 4, -6];
    const target = [0, 0, 0];
    const up = [0, 1, 0];

    const camera = m4.lookAt(eye, target, up);
    const view = m4.inverse(camera);
    const viewProjection = m4.multiply(projection, view);
    const world = m4.rotationY(Math.PI * .33);

    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    twgl.setUniforms(programInfo, {
      u_worldViewProjection: m4.multiply(viewProjection, world),
    });
    twgl.drawBufferInfo(gl, bufferInfo);


<!-- language: lang-html -->

    <canvas></canvas>
    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>

<!-- end snippet -->

And here's the same code rendering at 400x200 in eight 100x100 parts using a typical `frustum` function instead of `perspective`

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    "use strict";

    const vs = `
    uniform mat4 u_worldViewProjection;

    attribute vec4 position;
    attribute vec3 normal;

    varying vec3 v_normal;

    void main() {
      v_normal = normal;
      gl_Position = u_worldViewProjection * position;
    }
    `;
    const fs = `
    precision mediump float;

    varying vec3 v_normal;

    void main() {
      gl_FragColor = vec4(v_normal * .5 + .5, 1);
    }
    `;

    const m4 = twgl.m4;
    const gl = document.createElement("canvas").getContext("webgl");
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    const bufferInfo = twgl.primitives.createCubeBufferInfo(gl, 2);

    // size to render
    const totalWidth = 400;
    const totalHeight = 200;
    const partWidth = 100;
    const partHeight = 100;

    // this fov is for the totalHeight
    const fov = 30 * Math.PI / 180;
    const aspect = totalWidth / totalHeight;
    const zNear = 0.5;
    const zFar = 10;

    const eye = [1, 4, -6];
    const target = [0, 0, 0];
    const up = [0, 1, 0];

    // since the camera doesn't change let's compute it just once
    const camera = m4.lookAt(eye, target, up);
    const view = m4.inverse(camera);
    const world = m4.rotationY(Math.PI * .33);

    const imgRows = []; // this is only to insert in order
    for (let y = 0; y < totalHeight; y += partHeight) {
      const imgRow = [];
      imgRows.push(imgRow)
      for (let x = 0; x < totalWidth; x += partWidth) {
        renderPortion(totalWidth, totalHeight, x, y, partWidth, partHeight);
        const img = new Image();
        img.src = gl.canvas.toDataURL();
        imgRow.push(img);
      }
    }

    // because webgl goes positive up we're generating the rows
    // bottom first
    imgRows.reverse().forEach((imgRow) => {
      imgRow.forEach(document.body.appendChild.bind(document.body));
      document.body.appendChild(document.createElement("br"));
    });

    function renderPortion(totalWidth, totalHeight, partX, partY, partWidth, partHeight) {
      gl.canvas.width = partWidth;
      gl.canvas.height = partHeight;

      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.clearColor(0.2, 0.2, 0.2, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // corners at zNear for tital image
      const zNearTotalTop = Math.tan(fov) * 0.5 * zNear;
      const zNearTotalBottom = -zNearTotalTop;
      const zNearTotalLeft = zNearTotalBottom * aspect;
      const zNearTotalRight = zNearTotalTop * aspect;

      // width, height at zNear for total image
      const zNearTotalWidth = zNearTotalRight - zNearTotalLeft;
      const zNearTotalHeight = zNearTotalTop - zNearTotalBottom;

      const zNearPartLeft = zNearTotalLeft + partX * zNearTotalWidth / totalWidth;   const zNearPartRight = zNearTotalLeft + (partX + partWidth) * zNearTotalWidth / totalWidth;
      const zNearPartBottom = zNearTotalBottom + partY * zNearTotalHeight / totalHeight;
      const zNearPartTop = zNearTotalBottom + (partY + partHeight) * zNearTotalHeight / totalHeight;

      const projection = m4.frustum(zNearPartLeft, zNearPartRight, zNearPartBottom, zNearPartTop, zNear, zFar);
      const viewProjection = m4.multiply(projection, view);

      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.setUniforms(programInfo, {
        u_worldViewProjection: m4.multiply(viewProjection, world),
      });
      twgl.drawBufferInfo(gl, bufferInfo);
    }

<!-- language: lang-css -->

    img { border: 1px solid red; }
    body { line-height: 0 }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>

<!-- end snippet -->

If you run the snippet above you'll see it's generating 8 images

The important parts are this

First we need to decide on the total size we want

    const totalWidth = 400;
    const totalHeight = 200;

Then we'll make a function that will render any smaller portion of that size

    function renderPortion(totalWidth, totalHeight, partX, partY, partWidth, partHeight) {
       ...

We'll set the canvas to the size of the part

      gl.canvas.width = partWidth;
      gl.canvas.height = partHeight;

      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

And then compute what we need to pass to the `frustum` function. First we compute the rectangle at zNear that a perspective matrix would make given our field of view, aspect, and zNear values


      // corners at zNear for total image
      const zNearTotalTop = Math.tan(fov) * 0.5 * zNear;
      const zNearTotalBottom = -zNearTotalTop;
      const zNearTotalLeft = zNearTotalBottom * aspect;
      const zNearTotalRight = zNearTotalTop * aspect;

      // width, height at zNear for total image
      const zNearTotalWidth = zNearTotalRight - zNearTotalLeft;
      const zNearTotalHeight = zNearTotalTop - zNearTotalBottom;

Then we compute the corresponding area at zNear for the part of that we want to render and pass those to `frustum` to generate a projection matrix.

      const zNearPartLeft = zNearTotalLeft + partX * zNearTotalWidth / totalWidth;   const zNearPartRight = zNearTotalLeft + (partX + partWidth) * zNearTotalWidth / totalWidth;
      const zNearPartBottom = zNearTotalBottom + partY * zNearTotalHeight / totalHeight;
      const zNearPartTop = zNearTotalBottom + (partY + partHeight) * zNearTotalHeight / totalHeight;

      const projection = m4.frustum(zNearPartLeft, zNearPartRight, zNearPartBottom, zNearPartTop, zNear, zFar);

Then we just render like normal

Finally on the outside we have a loop to use the function we just generated to render as many parts as we want at whatever resolution we want.

    const totalWidth = 400;
    const totalHeight = 200;
    const partWidth = 100;
    const partHeight = 100;

    for (let y = 0; y < totalHeight; y += partHeight) {
      for (let x = 0; x < totalWidth; x += partWidth) {
        renderPortion(totalWidth, totalHeight, x, y, partWidth, partHeight);
        const img = new Image();
        img.src = gl.canvas.toDataURL();
        // do something with image.
      }
    }

This will let you render to any size you want but you'll need some other way to assemble the images into one larger image. You may or may not be able to do that in the browser. You could try making a giant 2D canvas and drawing each part into it (that assumes 2d canvas doesn't have the same limits as WebGL). To do that there's no need to make the images, just draw the webgl canvas into the 2d canvas.

Otherwise you might have to send them to a server you create to assemble the image or depending on your use case let the user save them and load them all into an image editing program.

Or if you just want to display them the browser will probably do better with 16x16 1024x1024 images than one 16kx16k image. In that case you probably want to call `canvas.toBlob` instead of using dataURLs and then call `URL.createObjectURL` for each blob. That way you won't have these giant dataURL strings sitting around.

Example:

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    "use strict";

    const vs = `
    uniform mat4 u_worldViewProjection;

    attribute vec4 position;
    attribute vec3 normal;

    varying vec3 v_normal;

    void main() {
      v_normal = normal;
      gl_Position = u_worldViewProjection * position;
    }
    `;
    const fs = `
    precision mediump float;

    varying vec3 v_normal;

    void main() {
      gl_FragColor = vec4(v_normal * .5 + .5, 1);
    }
    `;

    const m4 = twgl.m4;
    const gl = document.createElement("canvas").getContext("webgl");
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    const bufferInfo = twgl.primitives.createCubeBufferInfo(gl, 2);

    // size to render
    const totalWidth = 16384;
    const totalHeight = 16385;
    const partWidth = 1024;
    const partHeight = 1024;

    // this fov is for the totalHeight
    const fov = 30 * Math.PI / 180;
    const aspect = totalWidth / totalHeight;
    const zNear = 0.5;
    const zFar = 10;

    const eye = [1, 4, -6];
    const target = [0, 0, 0];
    const up = [0, 1, 0];

    // since the camera doesn't change let's compute it just once
    const camera = m4.lookAt(eye, target, up);
    const view = m4.inverse(camera);
    const world = m4.rotationY(Math.PI * .33);

    const imgRows = []; // this is only to insert in order
    for (let y = 0; y < totalHeight; y += partHeight) {
      const imgRow = [];
      imgRows.push(imgRow)
      for (let x = 0; x < totalWidth; x += partWidth) {
        renderPortion(totalWidth, totalHeight, x, y, partWidth, partHeight);
        const img = new Image();
        gl.canvas.toBlob((blob) => {
          img.src = URL.createObjectURL(blob);
        });
        imgRow.push(img);
      }
    }

    // because webgl goes positive up we're generating the rows
    // bottom first
    imgRows.reverse().forEach((imgRow) => {
      const div = document.createElement('div');
      imgRow.forEach(div.appendChild.bind(div));
      document.body.appendChild(div);
    });

    function renderPortion(totalWidth, totalHeight, partX, partY, partWidth, partHeight) {
      gl.canvas.width = partWidth;
      gl.canvas.height = partHeight;

      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.clearColor(0.2, 0.2, 0.2, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // corners at zNear for tital image
      const zNearTotalTop = Math.tan(fov) * 0.5 * zNear;
      const zNearTotalBottom = -zNearTotalTop;
      const zNearTotalLeft = zNearTotalBottom * aspect;
      const zNearTotalRight = zNearTotalTop * aspect;

      // width, height at zNear for total image
      const zNearTotalWidth = zNearTotalRight - zNearTotalLeft;
      const zNearTotalHeight = zNearTotalTop - zNearTotalBottom;

      const zNearPartLeft = zNearTotalLeft + partX * zNearTotalWidth / totalWidth;   const zNearPartRight = zNearTotalLeft + (partX + partWidth) * zNearTotalWidth / totalWidth;
      const zNearPartBottom = zNearTotalBottom + partY * zNearTotalHeight / totalHeight;
      const zNearPartTop = zNearTotalBottom + (partY + partHeight) * zNearTotalHeight / totalHeight;

      const projection = m4.frustum(zNearPartLeft, zNearPartRight, zNearPartBottom, zNearPartTop, zNear, zFar);
      const viewProjection = m4.multiply(projection, view);

      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.setUniforms(programInfo, {
        u_worldViewProjection: m4.multiply(viewProjection, world),
      });
      twgl.drawBufferInfo(gl, bufferInfo);
    }

<!-- language: lang-css -->

    img { border: 1px solid red; }
    div { white-space: nowrap; }
    body { line-height: 0 }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>

<!-- end snippet -->



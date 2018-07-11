Title: WebGL Mask Background Image
Description: How to cover the background

There tons of ways to do this, which is best for you is up to you.

## Use the stencil buffer

   Draw your mesh into the stencil buffer then draw your image with the stencil test set so it only draws where the mesh was drawn

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    var geoVS = `
    attribute vec4 position;
    uniform mat4 matrix;

    void main() {
      gl_Position = matrix * position;
    }
    `;
    var geoFS = `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(1, 0, 0, 1);  // doesn't matter. We're only using the stencil
    }
    `;
    var imgVS = `
    attribute vec4 position;
    varying vec2 v_texcoord;
    void main() {
      gl_Position = position;
      v_texcoord = position.xy * .5 + .5;  // only works if position is -1 <-> +1 quad
    }
    `;
    var imgFS = `
    precision mediump float;
    varying vec2 v_texcoord;
    uniform sampler2D tex;
    void main() {
      gl_FragColor = texture2D(tex, v_texcoord);
    }
    `;

    const m4 = twgl.m4;
    const gl = document.querySelector("canvas").getContext("webgl", {stencil: true});
    const geoPrgInfo = twgl.createProgramInfo(gl, [geoVS, geoFS]);
    const imgPrgInfo = twgl.createProgramInfo(gl, [imgVS, imgFS]);

    const geoBufferInfo = twgl.primitives.createCubeBufferInfo(gl, 1);
    const quadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

    const tex = twgl.createTexture(gl, {
      src: "https://farm9.staticflickr.com/8873/18598400202_3af67ef38f_z_d.jpg",
      crossOrigin: "",
      flipY: true,
    });

    function render(time) {
      time *= 0.001;

      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

      var fov = Math.PI * .25;
      var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      var zNear = 0.1;
      var zFar = 10;
      var mat = m4.perspective(fov, aspect, zNear, zFar);
      mat = m4.translate(mat, [0, 0, -3]);
      mat = m4.rotateX(mat, time * 0.81);
      mat = m4.rotateZ(mat, time * 0.77);

      // draw geometry to generate stencil
      gl.useProgram(geoPrgInfo.program);

      twgl.setBuffersAndAttributes(gl, geoPrgInfo, geoBufferInfo);
      twgl.setUniforms(geoPrgInfo, {
        matrix: mat,
      });

      // write 1 to stencil
      gl.enable(gl.STENCIL_TEST);
      gl.stencilFunc(gl.ALWAYS, 1, 0xFF);
      gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
      gl.drawElements(gl.TRIANGLES, geoBufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

      // draw image where stencil is set
      gl.useProgram(imgPrgInfo.program);

      twgl.setBuffersAndAttributes(gl, imgPrgInfo, quadBufferInfo);
      twgl.setUniforms(imgPrgInfo, {
        tex: tex,
      });

      gl.stencilFunc(gl.EQUAL, 1, 0xFF);
      gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
      gl.drawElements(gl.TRIANGLES, quadBufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);



<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }


<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>
    <canvas></canvas>


<!-- end snippet -->

## Use the depth buffer

   Draw your mesh into the depth buffer then draw your image with the depth function set so it only draws where the mesh was drawn.

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    var geoVS = `
    attribute vec4 position;
    uniform mat4 matrix;

    void main() {
      gl_Position = matrix * position;
    }
    `;
    var geoFS = `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(1, 0, 0, 1);  // doesn't matter. We're only using the stencil
    }
    `;
    var imgVS = `
    attribute vec4 position;
    varying vec2 v_texcoord;
    void main() {
      gl_Position = position;
      v_texcoord = position.xy * .5 + .5;  // only works if position is -1 <-> +1 quad
    }
    `;
    var imgFS = `
    precision mediump float;
    varying vec2 v_texcoord;
    uniform sampler2D tex;
    void main() {
      gl_FragColor = texture2D(tex, v_texcoord);
    }
    `;

    const m4 = twgl.m4;
    const gl = document.querySelector("canvas").getContext("webgl", {stencil: true});
    const geoPrgInfo = twgl.createProgramInfo(gl, [geoVS, geoFS]);
    const imgPrgInfo = twgl.createProgramInfo(gl, [imgVS, imgFS]);

    const geoBufferInfo = twgl.primitives.createCubeBufferInfo(gl, 1);
    const quadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

    const tex = twgl.createTexture(gl, {
      src: "https://farm9.staticflickr.com/8873/18598400202_3af67ef38f_z_d.jpg",
      crossOrigin: "",
      flipY: true,
    });

    function render(time) {
      time *= 0.001;

      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.clearDepth(0);  // clear depth to 0 (normally it's 1)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);

      var fov = Math.PI * .25;
      var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      var zNear = 0.1;
      var zFar = 10;
      var mat = m4.perspective(fov, aspect, zNear, zFar);
      mat = m4.translate(mat, [0, 0, -3]);
      mat = m4.rotateX(mat, time * 0.81);
      mat = m4.rotateZ(mat, time * 0.77);

      // draw geometry to generate depth
      gl.useProgram(geoPrgInfo.program);

      twgl.setBuffersAndAttributes(gl, geoPrgInfo, geoBufferInfo);
      twgl.setUniforms(geoPrgInfo, {
        matrix: mat,
      });

      gl.depthFunc(gl.ALWAYS);  // we only care about silhouette
      gl.drawElements(gl.TRIANGLES, geoBufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

      // draw image where depth is set
      gl.useProgram(imgPrgInfo.program);

      twgl.setBuffersAndAttributes(gl, imgPrgInfo, quadBufferInfo);
      twgl.setUniforms(imgPrgInfo, {
        tex: tex,
      });

      gl.depthFunc(gl.LESS);
      // this quad is drawn at z = 0 which is in the middle Z wize. Should probably
      // make it 1 so it's in the back but it's working as is so too lazy to
      // change
      gl.drawElements(gl.TRIANGLES, quadBufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

## Use CSS

   Set the canvas's CSS background to an image. Clear the canvas to some color, draw your mesh with 0,0,0,0 to cut a hole.

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    var geoVS = `
    attribute vec4 position;
    uniform mat4 matrix;

    void main() {
      gl_Position = matrix * position;
    }
    `;
    var geoFS = `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(0);
    }
    `;

    const m4 = twgl.m4;
    const gl = document.querySelector("canvas").getContext("webgl", {stencil: true});
    const geoPrgInfo = twgl.createProgramInfo(gl, [geoVS, geoFS]);

    const geoBufferInfo = twgl.primitives.createCubeBufferInfo(gl, 1);

    function render(time) {
      time *= 0.001;

      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.clearColor(1, 1, 1, 1); // clear to white
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      var fov = Math.PI * .25;
      var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      var zNear = 0.1;
      var zFar = 10;
      var mat = m4.perspective(fov, aspect, zNear, zFar);
      mat = m4.translate(mat, [0, 0, -3]);
      mat = m4.rotateX(mat, time * 0.81);
      mat = m4.rotateZ(mat, time * 0.77);

      // draw in 0,0,0,0 to cut a whole in the canvas to the HTML/CSS
      // defined background
      gl.useProgram(geoPrgInfo.program);

      twgl.setBuffersAndAttributes(gl, geoPrgInfo, geoBufferInfo);
      twgl.setUniforms(geoPrgInfo, {
        matrix: mat,
      });

      gl.drawElements(gl.TRIANGLES, geoBufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block;
      background-image: url(https://farm9.staticflickr.com/8873/18598400202_3af67ef38f_z_d.jpg);
      background-size: 100% 100%;
    }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

## Generate a texture mask

   Draw the mesh to a texture through framebuffer to generate a silhouette in the texture. Use that texture as input to another shader as a mask

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    var geoVS = `
    attribute vec4 position;
    uniform mat4 matrix;

    void main() {
      gl_Position = matrix * position;
    }
    `;
    var geoFS = `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(1);
    }
    `;
    var imgVS = `
    attribute vec4 position;
    varying vec2 v_texcoord;
    void main() {
      gl_Position = position;
      v_texcoord = position.xy * .5 + .5;  // only works if position is -1 <-> +1 quad
    }
    `;
    var imgFS = `
    precision mediump float;
    varying vec2 v_texcoord;
    uniform sampler2D colorTex;
    uniform sampler2D maskTex;
    void main() {
      vec4 color = texture2D(colorTex, v_texcoord);
      vec4 mask = texture2D(maskTex, v_texcoord);
      gl_FragColor = color * mask;
    }
    `;

    const m4 = twgl.m4;
    const gl = document.querySelector("canvas").getContext("webgl", {stencil: true});
    const geoPrgInfo = twgl.createProgramInfo(gl, [geoVS, geoFS]);
    const imgPrgInfo = twgl.createProgramInfo(gl, [imgVS, imgFS]);

    const geoBufferInfo = twgl.primitives.createCubeBufferInfo(gl, 1);
    const quadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

    const tex = twgl.createTexture(gl, {
      src: "https://farm9.staticflickr.com/8873/18598400202_3af67ef38f_z_d.jpg",
      crossOrigin: "",
      flipY: true,
    });

    // with no options creates a framebuffer with an RGBA8 texture
    // and depth buffer
    const fbi = twgl.createFramebufferInfo(gl);

    function render(time) {
      time *= 0.001;

      if (twgl.resizeCanvasToDisplaySize(gl.canvas)) {
        // with no argument will resize to the canvas size
        twgl.resizeFramebufferInfo(gl, fbi);
      }

      // calls gl.bindFramebuffer and gl.viewport
      twgl.bindFramebufferInfo(gl, fbi);

      // first draw the geometry to the texture
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      var fov = Math.PI * .25;
      var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      var zNear = 0.1;
      var zFar = 10;
      var mat = m4.perspective(fov, aspect, zNear, zFar);
      mat = m4.translate(mat, [0, 0, -3]);
      mat = m4.rotateX(mat, time * 0.81);
      mat = m4.rotateZ(mat, time * 0.77);

      gl.useProgram(geoPrgInfo.program);

      twgl.setBuffersAndAttributes(gl, geoPrgInfo, geoBufferInfo);
      twgl.setUniforms(geoPrgInfo, {
        matrix: mat,
      });

      gl.drawElements(gl.TRIANGLES, geoBufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
      // the texture now is black (0,0,0,0) where there's nothing and (1,1,1,1)
      // where are geometry was drawn

      // calls gl.bindFramebuffer and gl.viewport
      twgl.bindFramebufferInfo(gl, null);

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

      // draw image using our texture as a mask
      gl.useProgram(imgPrgInfo.program);

      twgl.setBuffersAndAttributes(gl, imgPrgInfo, quadBufferInfo);
      twgl.setUniforms(imgPrgInfo, {
        colorTex: tex,
        maskTex: fbi.attachments[0],
      });

      gl.drawElements(gl.TRIANGLES, quadBufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

Personally I'd probably use the last one as it's more flexible. You can use any technique to generate the mask. The mask will have levels (as in you can set it to 0.5 to get a 50/50 blend). That means you can get an antialiased each if you want. You can mask each color separate amounts.  You could easily blend between 2 images, etc. You could add other effects like [displacement maps](https://stackoverflow.com/a/42059618/128511) etc to the final pass.

Here's an example of rendering a cube in shades of gray and using the result to blend 2 images.

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    var geoVS = `
    attribute vec4 position;
    attribute vec3 normal;
    uniform mat4 matrix;
    varying vec3 v_normal;

    void main() {
      gl_Position = matrix * position;
      v_normal = (matrix * vec4(normal, 0)).xyz;
    }
    `;
    var geoFS = `
    precision mediump float;
    uniform vec3 u_lightDir;
    varying vec3 v_normal;
    void main() {
      gl_FragColor = vec4(dot(normalize(v_normal), u_lightDir) * .5 + .5);
    }
    `;
    var imgVS = `
    attribute vec4 position;
    varying vec2 v_texcoord;
    void main() {
      gl_Position = position;
      v_texcoord = position.xy * .5 + .5;  // only works if position is -1 <-> +1 quad
    }
    `;
    var imgFS = `
    precision mediump float;
    varying vec2 v_texcoord;
    uniform sampler2D color1Tex;
    uniform sampler2D color2Tex;
    uniform sampler2D maskTex;
    void main() {
      // it probably doesn't make sense to use the same
      // texcoords for all 3 textures but I'm lazy
      vec4 color1 = texture2D(color1Tex, v_texcoord);
      vec4 color2 = texture2D(color2Tex, v_texcoord);
      vec4 mask = texture2D(maskTex, v_texcoord);
      gl_FragColor = mix(color1, color2, mask);
    }
    `;

    const m4 = twgl.m4;
    const v3 = twgl.v3;
    const gl = document.querySelector("canvas").getContext("webgl", {stencil: true});
    const geoPrgInfo = twgl.createProgramInfo(gl, [geoVS, geoFS]);
    const imgPrgInfo = twgl.createProgramInfo(gl, [imgVS, imgFS]);

    const geoBufferInfo = twgl.primitives.createCubeBufferInfo(gl, 1);
    const quadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

    const textures = twgl.createTextures(gl, {
      tex1: {
        src: "https://farm9.staticflickr.com/8873/18598400202_3af67ef38f_z_d.jpg",
        crossOrigin: "",
        flipY: true,
      },
      tex2: {
        src: "https://farm1.staticflickr.com/339/18414821420_e3d0a8ec5f_z_d.jpg",
        crossOrigin: "",
        flipY: true,
      },
    });

    // with no options creates a framebuffer with an RGBA8 texture
    // and depth buffer
    const fbi = twgl.createFramebufferInfo(gl);

    function render(time) {
      time *= 0.001;

      if (twgl.resizeCanvasToDisplaySize(gl.canvas)) {
        // with no argument will resize to the canvas size
        twgl.resizeFramebufferInfo(gl, fbi);
      }

      // calls gl.bindFramebuffer and gl.viewport
      twgl.bindFramebufferInfo(gl, fbi);

      // first draw the geometry to the texture
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);

      var fov = Math.PI * .25;
      var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      var zNear = 0.1;
      var zFar = 10;
      var mat = m4.perspective(fov, aspect, zNear, zFar);
      mat = m4.translate(mat, [0, 0, -3]);
      mat = m4.rotateX(mat, time * 0.81);
      mat = m4.rotateZ(mat, time * 0.77);

      gl.useProgram(geoPrgInfo.program);

      twgl.setBuffersAndAttributes(gl, geoPrgInfo, geoBufferInfo);
      twgl.setUniforms(geoPrgInfo, {
        matrix: mat,
        u_lightDir: v3.normalize([1, 2, 3]),
      });

      gl.drawElements(gl.TRIANGLES, geoBufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
      // the texture now is black (0,0,0,0) where there's nothing and (1,1,1,1)
      // where are geometry was drawn

      // calls gl.bindFramebuffer and gl.viewport
      twgl.bindFramebufferInfo(gl, null);

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

      // draw image using our texture as a mask
      gl.useProgram(imgPrgInfo.program);

      twgl.setBuffersAndAttributes(gl, imgPrgInfo, quadBufferInfo);
      twgl.setUniforms(imgPrgInfo, {
        color1Tex: textures.tex1,
        color2Tex: textures.tex2,
        maskTex: fbi.attachments[0],
      });

      gl.drawElements(gl.TRIANGLES, quadBufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->


In general you can probably achieve many more effects using the texture mask but it really depends on your goal.



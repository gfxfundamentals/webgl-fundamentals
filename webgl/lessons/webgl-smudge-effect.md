Title: Make a smudge effet
Description: Mess up an image

Both seem relatively straightforward.

The first one, like you mentioned, you make a mesh (grid) of vertices that draw a plane. You texture map the face to the plane, as you drag the mouse around add a displacement to the each vertex the mouse touches. Over time reset the displacement back to 0 (as in 0 amount of displacement)

here's an example: It's only displacing a single vertex a random amount instead of something more predictable. Finally I'm just saving the time at which the displacement should fade out by, then in the shader I do a simple linear lerp (could use a fancier lerp for a bounce or something). This is so pretty much everything happens in the shader.

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const m4 = twgl.m4;
    const gl = document.querySelector("canvas").getContext("webgl");
    const vs = `
    attribute vec4 position;
    attribute vec3 displacement;

    uniform mat4 u_matrix;
    uniform float u_time;
    uniform float u_timeToGoBack;

    varying vec2 v_texcoord;

    void main() {
      // because position goes -1 <-> 1 we can just use
      // it for texture coords
      v_texcoord = position.xy * .5 + .5;

      // displacement.z is the time at which it should be undisplaced
      float displaceTime = displacement.z - u_time;
      float lerp = clamp(displaceTime / u_timeToGoBack, 0., 1.);
      vec2 displace = displacement.xy * lerp;

      gl_Position = u_matrix * (position + vec4(displace, 0, 0));
    }
    `;
    const fs = `
    precision mediump float;

    uniform sampler2D texture;

    varying vec2 v_texcoord;

    void main() {
      gl_FragColor = texture2D(texture, v_texcoord);
    }
    `;

    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    // create a grid of points in a -1 to +1 quad
    const positions = [];
    const displacements = [];
    const indices = [];

    const res = 100;
    for (var y = 0; y < res; ++y) {
      var v = (y / (res - 1)) * 2 - 1;
      for (var x = 0; x < res; ++x) {
        var u = (x / (res - 1)) * 2 - 1;

        positions.push(u, v);
        displacements.push(0, 0, 0);
      }
    }

    for (var y = 0; y < res - 1; ++y) {
      var off0 = (y + 0) * res;
      var off1 = (y + 1) * res;
      for (var x = 0; x < res - 1; ++x) {
        indices.push(
          off0 + x + 0, off0 + x + 1, off1 + x + 0,
          off1 + x + 0, off0 + x + 1, off1 + x + 1
        );
      }
    }

    // create buffers and fills them in.
    // (calls gl.createBuffer and gl.bufferData for each array)
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      position: { numComponents: 2, data: positions, },
      displacement: { numComponents: 3, data: displacements, },
      indices: indices,
    });

    // this will be replaced when the image has loaded;
    var img = { width: 1, height: 1 };

    const tex = twgl.createTexture(gl, {
      src: 'https://farm6.staticflickr.com/5078/14032935559_8c13e9b181_z_d.jpg',
      crossOrigin: '',
    }, function(err, texture, source) {
      img = source;
    });

    var currentTime = 0;
    var currentMatrix;
    const timeToGoBack = 2; // in seconds;

    function render(time) {
      time *= 0.001;  // convert to seconds

      currentTime = time;

      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.useProgram(programInfo.program);

      var aspect = img.width / img.height;
      var mat = m4.ortho(0, gl.canvas.clientWidth, gl.canvas.clientHeight, 0, -1, 1);
      mat = m4.translate(mat, [gl.canvas.clientWidth / 2, gl.canvas.clientHeight / 2, 0]);
      mat = m4.scale(mat, [img.width * .25, img.height * .25, 1]);

      currentMatrix = mat;

      // calls gl.bindBuffer, gl.vertexAttribPointer to setup
      // attributes
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

      twgl.setUniforms(programInfo, {
        u_matrix: mat,
        u_texture: tex,
        u_time: currentTime,
        u_timeToGoBack: timeToGoBack,
      });

      gl.drawElements(gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    const displace = new Float32Array(3);

    gl.canvas.addEventListener('mousemove', function(event, target) {
      target = target || event.target;
      const rect = target.getBoundingClientRect();

      const rx = event.clientX - rect.left;
      const ry = event.clientY - rect.top;

      const x = rx * target.width  / target.clientWidth;
      const y = ry * target.height / target.clientHeight;

      // reverse project the mouse onto the image
      var rmat = m4.inverse(currentMatrix);
      var s = m4.transformPoint(
        rmat, [x / target.width * 2 - 1, y / target.height * 2 - 1, 0]);

      // s is now a point in the space of `position`

      // lets just move closest point?
      var gx = Math.round((s[0] * .5 + .5) * res);
      var gy = Math.round((s[1] * .5 + .5) * res);

      gx = clamp(gx, 0, res - 1);
      gy = clamp(gy, 0, res - 1);

      const offset = ((res - gy - 1) * res + gx) * 3 * 4;

      displace[0] = rand(-.1, .1);
      displace[1] = rand(-.1, .1);
      displace[2] = currentTime + timeToGoBack;

      gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.attribs.displacement.buffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, offset, displace);
    });

    function rand(min, max) {
      return Math.random() * (max - min) + min;
    }

    function clamp(v, min, max) {
      return Math.max(min, Math.min(max, v));
    }

<!-- language: lang-css -->

    body {
      margin: 0;
    }
    canvas {
      width: 100vw;
      height: 100vh;
      display: block;
    }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

For the second one instead of displacing vertices you make a displacement texture, over time you reset that displacement back to 0

You can see an example of [fading things out here](https://stackoverflow.com/a/38407507/128511). If you took that sample and instead of drawing random square you draw under the mouse, then use that texture as a displacement to your main image. By displacement I mean normally you look up a texture in a fragment shader like this

    vec4 color = texture2D(someTexture, someTextureCoords);

Instead you want to displace the vertex coords with a displacement, something like this

    // assuming the displacement texture is the same size as
    // the main texture you can use the same texture coords

    // first look up the displacement and convert to -1 <-> 1 range
    // we're only using the R and G channels which will become U and V
    // displacements to our texture coordinates
    vec2 displacement = texture2D(displacementTexture, someTextureCoords).rg * 2. - 1.;

    vec2 uv = someTextureCoords + displacement * displacementRange;
    vec4 color = texture2d(someTexture, uv);

Here's the sample linked above being used for displacement

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    var vs = `
    attribute vec4 position;

    uniform mat4 u_matrix;

    void main() {
      gl_Position = u_matrix * position;
    }
    `;

    var fs = `
    precision mediump float;

    uniform vec4 u_color;

    void main() {
      gl_FragColor = u_color;
    }
    `;
    var vsQuad = `
    attribute vec4 position;
    attribute vec2 texcoord;

    varying vec2 v_texcoord;

    void main() {
      gl_Position = position;
      v_texcoord = texcoord;
    }
    `;
    var fsFade = `
    precision mediump float;

    varying vec2 v_texcoord;

    uniform sampler2D u_texture;
    uniform float u_mixAmount;

    const float kEpsilon = 2./256.;

    void main() {
      // convert color from 0.->1. to -1. -> +1. so we can go adjust toward zero
      vec4 color = texture2D(u_texture, v_texcoord) * 2. - 1.;

      // figure out how much to adjust
      vec4 adjust = -color * u_mixAmount;

      // If the adjustment is too small (because the texture is only 8bits)
      // the adjust the minimum amount.
      // Could also solve this by using floating point textures
      adjust = mix(adjust, sign(color) * -kEpsilon, step(abs(adjust), vec4(kEpsilon)));

      // adjust it
      color += adjust;

      // write it back converting back to 0 -> 1
      gl_FragColor = color * .5 + .5;
    }
    `;
    var fsDisplace = `
    precision mediump float;

    varying vec2 v_texcoord;

    uniform sampler2D u_texture;
    uniform sampler2D u_displacementTexture;
    uniform vec2 u_displacementRange;

    void main() {

      // assuming the displacement texture is the same size as
      // the main texture you can use the same texture coords

      // first look up the displacement and convert to -1 <-> 1 range
      // we're only using the R and G channels which will become U and V
      // displacements to our texture coordinates
      vec2 displacement = texture2D(u_displacementTexture, v_texcoord).rg * 2. - 1.;

      vec2 uv = v_texcoord + displacement * u_displacementRange;

      gl_FragColor = texture2D(u_texture, uv);
    }
    `;

    var $ = document.querySelector.bind(document);

    var mixAmount = 0.03;

    var gl = $("canvas").getContext("webgl");
    var m4 = twgl.m4;
    var programInfo = twgl.createProgramInfo(gl, [vs, fs]);
    var fadeProgramInfo = twgl.createProgramInfo(gl, [vsQuad, fsFade]);
    var displaceProgramInfo = twgl.createProgramInfo(gl, [vsQuad, fsDisplace]);

    // this will be replaced when the image has loaded;
    var img = { width: 1, height: 1 };

    const tex = twgl.createTexture(gl, {
      src: 'https://farm6.staticflickr.com/5078/14032935559_8c13e9b181_z_d.jpg',
      crossOrigin: '',
      flipY: true,
    }, function(err, texture, source) {
      img = source;
    });

    // Creates a -1 to +1 quad
    var quadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

    // Creates 2 RGBA texture + depth framebuffers
    var fadeAttachments = [
      { format: gl.RGBA, min: gl.NEAREST, max: gl.NEAREST, wrap: gl.CLAMP_TO_EDGE, },
      { format: gl.DEPTH_STENCIL },
    ];
    var fadeFbi1 = twgl.createFramebufferInfo(gl, fadeAttachments);
    var fadeFbi2 = twgl.createFramebufferInfo(gl, fadeAttachments);

    function drawThing(gl, x, y, rotation, scale, color) {
      var matrix = m4.ortho(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);
      matrix = m4.translate(matrix, [x, y, 0]);
      matrix = m4.rotateZ(matrix, rotation);
      matrix = m4.scale(matrix, [scale, scale, 1]);

      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, quadBufferInfo);
      twgl.setUniforms(programInfo, {
        u_matrix: matrix,
        u_color: color,
      });
      twgl.drawBufferInfo(gl, quadBufferInfo);
    }

    function rand(min, max) {
      if (max === undefined) {
        max = min;
        min = 0;
      }
      return min + Math.random() * (max - min);
    }

    function render(time) {
      if (twgl.resizeCanvasToDisplaySize(gl.canvas)) {
        // set the clear color to 0.5 which is 0 displacement
        // for our shader
        gl.clearColor(0.5, 0.5, 0.5, 0.5);
        // resize the framebuffer's attachments so their the
        // same size as the canvas
        twgl.resizeFramebufferInfo(gl, fadeFbi1, fadeAttachments);
        // clear the color buffer to 0.5
        twgl.bindFramebufferInfo(gl, fadeFbi1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        // resize the 2nd framebuffer's attachments so their the
        // same size as the canvas
        twgl.resizeFramebufferInfo(gl, fadeFbi2, fadeAttachments);
        // clear the color buffer to 0.5
        twgl.bindFramebufferInfo(gl, fadeFbi2);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }

      // fade by copying from fadeFbi1 into fabeFbi2 using mixAmount.
      // fadeFbi2 will contain mix(fadeFb1, u_fadeColor, u_mixAmount)
      twgl.bindFramebufferInfo(gl, fadeFbi2);

      gl.useProgram(fadeProgramInfo.program);
      twgl.setBuffersAndAttributes(gl, fadeProgramInfo, quadBufferInfo);
      twgl.setUniforms(fadeProgramInfo, {
        u_texture: fadeFbi1.attachments[0],
        u_mixAmount: mixAmount,
      });
      twgl.drawBufferInfo(gl, quadBufferInfo);

      // now draw new stuff to fadeFb2. Notice we don't clear!
      twgl.bindFramebufferInfo(gl, fadeFbi2);

      var x = rand(gl.canvas.width);
      var y = rand(gl.canvas.height);
      var rotation = rand(Math.PI);
      var scale = rand(10, 20);
      var color = [rand(1), rand(1), rand(1), 1];
      drawThing(gl, x, y, rotation, scale, color);


      // now use fadeFbi2 as a displacement while drawing tex to the canvas
      twgl.bindFramebufferInfo(gl, null);

      gl.useProgram(displaceProgramInfo.program);
      twgl.setBuffersAndAttributes(gl, displaceProgramInfo, quadBufferInfo);
      twgl.setUniforms(displaceProgramInfo, {
        u_texture: tex,
        u_displacementTexture: fadeFbi2.attachments[0],
        u_displacementRange: [0.1, 0.1],
      });
      twgl.drawBufferInfo(gl, quadBufferInfo);

      // swap the variables so we render to the opposite textures next time
      var temp = fadeFbi1;
      fadeFbi1 = fadeFbi2;
      fadeFbi2 = temp;

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { display: block; width: 100vw; height: 100vh; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

So all that's left is to make it draw under the mouse instead of at random

<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->

    var vs = `
    attribute vec4 position;

    uniform mat4 u_matrix;

    void main() {
      gl_Position = u_matrix * position;
    }
    `;

    var fs = `
    precision mediump float;

    uniform vec4 u_color;

    void main() {
      gl_FragColor = u_color;
    }
    `;
    var vsQuad = `
    attribute vec4 position;
    attribute vec2 texcoord;

    uniform mat4 u_matrix;

    varying vec2 v_texcoord;

    void main() {
      gl_Position = u_matrix * position;
      v_texcoord = texcoord;
    }
    `;
    var fsFade = `
    precision mediump float;

    varying vec2 v_texcoord;

    uniform sampler2D u_texture;
    uniform float u_mixAmount;

    const float kEpsilon = 2./256.;

    void main() {
      vec4 color = texture2D(u_texture, v_texcoord) * 2. - 1.;
      vec4 adjust = -color * u_mixAmount;
      adjust = mix(adjust, sign(color) * -kEpsilon, step(abs(adjust), vec4(kEpsilon)));
      color += adjust;
      gl_FragColor = color * .5 + .5;
    }
    `;
    var fsDisplace = `
    precision mediump float;

    varying vec2 v_texcoord;

    uniform sampler2D u_texture;
    uniform sampler2D u_displacementTexture;
    uniform vec2 u_displacementRange;

    void main() {

      // assuming the displacement texture is the same size as
      // the main texture you can use the same texture coords

      // first look up the displacement and convert to -1 <-> 1 range
      // we're only using the R and G channels which will become U and V
      // displacements to our texture coordinates
      vec2 displacement = texture2D(u_displacementTexture, v_texcoord).rg * 2. - 1.;

      vec2 uv = v_texcoord + displacement * u_displacementRange;

      gl_FragColor = texture2D(u_texture, uv);
    }
    `;

    var $ = document.querySelector.bind(document);

    var mixAmount = 0.03;

    var gl = $("canvas").getContext("webgl");
    var m4 = twgl.m4;
    var programInfo = twgl.createProgramInfo(gl, [vs, fs]);
    var fadeProgramInfo = twgl.createProgramInfo(gl, [vsQuad, fsFade]);
    var displaceProgramInfo = twgl.createProgramInfo(gl, [vsQuad, fsDisplace]);

    // this will be replaced when the image has loaded;
    var img = { width: 1, height: 1 };

    const tex = twgl.createTexture(gl, {
      src: 'https://farm6.staticflickr.com/5078/14032935559_8c13e9b181_z_d.jpg',
      crossOrigin: '',
    }, function(err, texture, source) {
      img = source;
    });

    // Creates a -1 to +1 quad
    var quadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

    // Creates 2 RGBA texture + depth framebuffers
    var fadeAttachments = [
      { format: gl.RGBA,
        min: gl.NEAREST,
        max: gl.NEAREST,
        wrap: gl.CLAMP_TO_EDGE,
      },
    ];
    var fadeFbi1 = twgl.createFramebufferInfo(gl, fadeAttachments);
    var fadeFbi2 = twgl.createFramebufferInfo(gl, fadeAttachments);

    function drawThing(gl, x, y, rotation, scale, color) {
      var matrix = m4.ortho(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);
      matrix = m4.translate(matrix, [x, y, 0]);
      matrix = m4.rotateZ(matrix, rotation);
      matrix = m4.scale(matrix, [scale, scale, 1]);

      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, quadBufferInfo);
      twgl.setUniforms(programInfo, {
        u_matrix: matrix,
        u_color: color,
      });
      twgl.drawBufferInfo(gl, quadBufferInfo);
    }

    function rand(min, max) {
      if (max === undefined) {
        max = min;
        min = 0;
      }
      return min + Math.random() * (max - min);
    }

    var drawRect = false;
    var rectX;
    var rectY;
    var currentMatrix;

    function render(time) {
      if (twgl.resizeCanvasToDisplaySize(gl.canvas)) {
        // set the clear color to 0.5 which is 0 displacement
        // for our shader
        gl.clearColor(0.5, 0.5, 0.5, 0.5);
        // resize the framebuffer's attachments so their the
        // same size as the canvas
        twgl.resizeFramebufferInfo(gl, fadeFbi1, fadeAttachments);
        // clear the color buffer to 0.5
        twgl.bindFramebufferInfo(gl, fadeFbi1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        // resize the 2nd framebuffer's attachments so their the
        // same size as the canvas
        twgl.resizeFramebufferInfo(gl, fadeFbi2, fadeAttachments);
        // clear the color buffer to 0.5
        twgl.bindFramebufferInfo(gl, fadeFbi2);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }

      // fade by copying from fadeFbi1 into fabeFbi2 using mixAmount.
      // fadeFbi2 will contain mix(fadeFb1, u_fadeColor, u_mixAmount)
      twgl.bindFramebufferInfo(gl, fadeFbi2);

      gl.useProgram(fadeProgramInfo.program);
      twgl.setBuffersAndAttributes(gl, fadeProgramInfo, quadBufferInfo);
      twgl.setUniforms(fadeProgramInfo, {
        u_matrix: m4.identity(),
        u_texture: fadeFbi1.attachments[0],
        u_mixAmount: mixAmount,
      });
      twgl.drawBufferInfo(gl, quadBufferInfo);

      if (drawRect) {
        drawRect = false;
        // now draw new stuff to fadeFb2. Notice we don't clear!
        twgl.bindFramebufferInfo(gl, fadeFbi2);

        var rotation = rand(Math.PI);
        var scale = rand(10, 20);
        var color = [rand(1), rand(1), rand(1), 1];
        drawThing(gl, rectX, rectY, rotation, scale, color);
      }

      // now use fadeFbi2 as a displacement while drawing tex to the canvas
      twgl.bindFramebufferInfo(gl, null);

      var mat = m4.ortho(0, gl.canvas.clientWidth, gl.canvas.clientHeight, 0, -1, 1);
      mat = m4.translate(mat, [gl.canvas.clientWidth / 2, gl.canvas.clientHeight / 2, 0]);
      mat = m4.scale(mat, [img.width * 0.5, img.height * 0.5, 1]);

      currentMatrix = mat;

      gl.useProgram(displaceProgramInfo.program);
      twgl.setBuffersAndAttributes(gl, displaceProgramInfo, quadBufferInfo);
      twgl.setUniforms(displaceProgramInfo, {
        u_matrix: mat,
        u_texture: tex,
        u_displacementTexture: fadeFbi2.attachments[0],
        u_displacementRange: [0.05, 0.05],
      });
      twgl.drawBufferInfo(gl, quadBufferInfo);

      // swap the variables so we render to the opposite textures next time
      var temp = fadeFbi1;
      fadeFbi1 = fadeFbi2;
      fadeFbi2 = temp;

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    gl.canvas.addEventListener('mousemove', function(event, target) {
      target = target || event.target;
      const rect = target.getBoundingClientRect();

      const rx = event.clientX - rect.left;
      const ry = event.clientY - rect.top;

      const x = rx * target.width  / target.clientWidth;
      const y = ry * target.height / target.clientHeight;

      // reverse project the mouse onto the image
      var rmat = m4.inverse(currentMatrix);
      var clipspacePoint = [x / target.width * 2 - 1, -(y / target.height * 2 - 1), 0];
      var s = m4.transformPoint(rmat, clipspacePoint);

      // s is now a point in the space of the image's quad. The quad goes -1 to 1
      // and we're going to draw into it using pixels because drawThing takes
      // a pixel value and our displacement map is the same size as the canvas
      drawRect = true;
      rectX = ( s[0] * .5 + .5) * gl.canvas.width;
      rectY = (-s[1] * .5 + .5) * gl.canvas.height;
    });

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { display: block; width: 100vw; height: 100vh; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->


Getting the exact effect of your second example looks like it's running the displacement through some kind of noise function. You could use something like the [WebGL Inspector](https://benvanik.github.io/WebGL-Inspector/) or the [Shader Editor](https://github.com/spite/ShaderEditorExtension) to look inside the shaders and see what they're doing.

[Here's another example](https://codepen.io/greggman/pen/bgXgvr) that creates a displacement texture that displaces more toward the center than the edge.

NOTE: I should make it clear I didn't look at the details of how the examples you linked to worked, I'm only suggesting they are doing something *similar* to this. The best way to find out what they're really doing is to look at their code and run the tools mentioned in the previous paragraphs to look inside and see what's going on. Maybe they aren't using direct displacement but instead using something like normals as displacements. Maybe instead of drawing a solid color (the 2nd and 3rd examples) or a texture (the 4th example), they're drawing with a procedurally generated pattern or using screen based texture coordinates for a repeating texture pattern. Maybe the displacement texture is a separate texture and they have a "mix mask" that they draw in white and fade to black to decide how much of the displacement texture to apply. There is an infinite number of ways to do things in WebGL.




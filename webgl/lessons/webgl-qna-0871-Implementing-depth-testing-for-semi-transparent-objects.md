Title: Implementing depth testing for semi-transparent objects
Description:
TOC: qna

# Question:

I've been carefully trolling the internet for the past two days to understand depth testing for semi-transparent objects. I've read multiple papers/tutorials on the subject and in theory I believe I understand how it works. However none of them give me actual example code.

I have three requirements for my depth testing of semi-transparent objects:

1. It should be order independant.

2. It should work if two quads of the same objects are intersection each other. Both semi-transparent. Imagine a grass object that looks like a X when viewed from above:

[![enter image description here][1]][1]


3. It should correctly render a semi-transparent player `rgba(0, 1, 0, 0.5)`, behind a building's window `rgba(0, 0, 1, 0.5)`, but in front of a background object `rgba(1, 0, 0, 1)`:

[![enter image description here][2]][2]


*The line on the far left is how I imagine the light/color changes as it travels through the semi-transparent objects towards the camera*


## Final Thoughts ##

I suspect the best approach to go for is to do depth peeling, but I'm still lacking some implementation/example. I'm leaning towards this approach because the game is 2.5D and since it could get dangerous for performance (lots of layers to peel), there won't need to be more than two semi-transparent objects to "peel".

I'm already familiar with framebuffers and how to code them (doing some post processing effects with them). I will be using them, right?

Most of the knowledge of opengl comes from [this tutorial][4] but it covers depth testing and semi-transparency separately. He also sadly doesn't cover order independent transparency at all (see bottom of Blending page).

Finally, please don't answer only in theory. e.g. 

> Draw opaque, draw transparent, draw opaque again, etc.

My ideal answer will contain code of how the buffers are configured, the shaders, and screenshots of each pass with an explanation of what its doing.

The programming language used is also not too important as long as it uses OpenGL 4 or newer. The non-opengl code can be pseudo (I don't care how you sort an array or create an GLFW window).

### EDIT: ###

I'm updating my question to just have so example of the current state of my code. This example draws the semi-transparent player (green) first, opaque background (red) second and then the semi-transparent window (blue). However the depth should be calculated by the Z position of the square and not the order of which it is drawn.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    (function() {
       // your page initialization code here
       // the DOM will be available here
      var script = document.createElement('script');
      script.onload = function () {
        main();
      };
      script.src = 'https://mdn.github.io/webgl-examples/tutorial/gl-matrix.js';
      document.head.appendChild(script); //or something of the likes
    })();

    //
    // Start here
    //
    function main() {
      const canvas = document.querySelector('#glcanvas');
      const gl = canvas.getContext('webgl', {alpha:false});

      // If we don't have a GL context, give up now

      if (!gl) {
        alert('Unable to initialize WebGL. Your browser or machine may not support it.');
        return;
      }

      // Vertex shader program

      const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec4 aVertexColor;

        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;

        varying lowp vec4 vColor;

        void main(void) {
          gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
          vColor = aVertexColor;
        }
      `;

      // Fragment shader program

      const fsSource = `
        varying lowp vec4 vColor;

        void main(void) {
          gl_FragColor = vColor;
        }
      `;

      // Initialize a shader program; this is where all the lighting
      // for the vertices and so forth is established.
      const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

      // Collect all the info needed to use the shader program.
      // Look up which attributes our shader program is using
      // for aVertexPosition, aVevrtexColor and also
      // look up uniform locations.
      const programInfo = {
        program: shaderProgram,
        attribLocations: {
          vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
          vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
        },
        uniformLocations: {
          projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
          modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        },
      };

      // Here's where we call the routine that builds all the
      // objects we'll be drawing.
      const buffers = initBuffers(gl);

      // Draw the scene
      drawScene(gl, programInfo, buffers);
    }

    //
    // initBuffers
    //
    // Initialize the buffers we'll need. For this demo, we just
    // have one object -- a simple two-dimensional square.
    //
    function initBuffers(gl) {
      // Create a buffer for the square's positions.

      const positionBuffer0 = gl.createBuffer();

      // Select the positionBuffer as the one to apply buffer
      // operations to from here out.

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer0);

      // Now create an array of positions for the square.

      var positions = [
         0.5,  0.5,
        -0.5,  0.5,
         0.5, -0.5,
        -0.5, -0.5,
      ];

      // Now pass the list of positions into WebGL to build the
      // shape. We do this by creating a Float32Array from the
      // JavaScript array, then use it to fill the current buffer.

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

      // Now set up the colors for the vertices

      var colors = [
        0.0,  1.0,  0.0,  0.5,    // white
        0.0,  1.0,  0.0,  0.5,    // red
        0.0,  1.0,  0.0,  0.5,    // green
        0.0,  1.0,  0.0,  0.5,    // blue
      ];

      const colorBuffer0 = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer0);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);



      // Create a buffer for the square's positions.

      const positionBuffer1 = gl.createBuffer();

      // Select the positionBuffer as the one to apply buffer
      // operations to from here out.

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer1);

      // Now create an array of positions for the square.

      positions = [
         2.0,  0.4,
        -2.0,  0.4,
         2.0, -2.0,
        -2.0, -2.0,
      ];

      // Now pass the list of positions into WebGL to build the
      // shape. We do this by creating a Float32Array from the
      // JavaScript array, then use it to fill the current buffer.

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

      // Now set up the colors for the vertices

      colors = [
        1.0,  0.0,  0.0,  1.0,    // white
        1.0,  0.0,  0.0,  1.0,    // red
        1.0,  0.0,  0.0,  1.0,    // green
        1.0,  0.0,  0.0,  1.0,    // blue
      ];

      const colorBuffer1 = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer1);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
      
      // Create a buffer for the square's positions.

      const positionBuffer2 = gl.createBuffer();

      // Select the positionBuffer as the one to apply buffer
      // operations to from here out.

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer2);

      // Now create an array of positions for the square.

      positions = [
         1.0,  1.0,
        -0.0,  1.0,
         1.0, -1.0,
        -0.0, -1.0,
      ];

      // Now pass the list of positions into WebGL to build the
      // shape. We do this by creating a Float32Array from the
      // JavaScript array, then use it to fill the current buffer.

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

      // Now set up the colors for the vertices

      colors = [
        0.0,  0.0,  1.0,  0.5,    // white
        0.0,  0.0,  1.0,  0.5,    // red
        0.0,  0.0,  1.0,  0.5,    // green
        0.0,  0.0,  1.0,  0.5,    // blue
      ];

      const colorBuffer2 = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer2);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);



      return {
        position0: positionBuffer0,
        color0: colorBuffer0,
        position1: positionBuffer1,
        color1: colorBuffer1,
        position2: positionBuffer2,
        color2: colorBuffer2,
      };
    }

    //
    // Draw the scene.
    //
    function drawScene(gl, programInfo, buffers) {
      gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      //gl.clearDepth(1.0);                 // Clear everything
      gl.disable(gl.DEPTH_TEST)
      gl.enable(gl.BLEND)
      gl.blendEquation(gl.FUNC_ADD)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

      // Clear the canvas before we start drawing on it.


      // Create a perspective matrix, a special matrix that is
      // used to simulate the distortion of perspective in a camera.
      // Our field of view is 45 degrees, with a width/height
      // ratio that matches the display size of the canvas
      // and we only want to see objects between 0.1 units
      // and 100 units away from the camera.

      const fieldOfView = 45 * Math.PI / 180;   // in radians
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      const zNear = 0.1;
      const zFar = 100.0;
      const projectionMatrix = mat4.create();

      // note: glmatrix.js always has the first argument
      // as the destination to receive the result.
      mat4.perspective(projectionMatrix,
                       fieldOfView,
                       aspect,
                       zNear,
                       zFar);

      // Set the drawing position to the "identity" point, which is
      // the center of the scene.
      const modelViewMatrix = mat4.create();

      // Now move the drawing position a bit to where we want to
      // start drawing the square.

      mat4.translate(modelViewMatrix,     // destination matrix
                     modelViewMatrix,     // matrix to translate
                     [-0.0, 0.0, -6.0]);  // amount to translate

      function drawSquare(positionbuffer, colorbuffer) {
      // Tell WebGL how to pull out the positions from the position
      // buffer into the vertexPosition attribute
      {
        const numComponents = 2;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, positionbuffer);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexPosition);
      }

      // Tell WebGL how to pull out the colors from the color buffer
      // into the vertexColor attribute.
      {
        const numComponents = 4;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, colorbuffer);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexColor,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexColor);
      }

      // Tell WebGL to use our program when drawing

      gl.useProgram(programInfo.program);

      // Set the shader uniforms

      gl.uniformMatrix4fv(
          programInfo.uniformLocations.projectionMatrix,
          false,
          projectionMatrix);
      gl.uniformMatrix4fv(
          programInfo.uniformLocations.modelViewMatrix,
          false,
          modelViewMatrix);

      {
        const offset = 0;
        const vertexCount = 4;
        gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
      }
      }
      drawSquare(buffers.position0, buffers.color0); // Player
      drawSquare(buffers.position1, buffers.color1); // Background
      drawSquare(buffers.position2, buffers.color2); // Window
    }

    //
    // Initialize a shader program, so WebGL knows how to draw our data
    //
    function initShaderProgram(gl, vsSource, fsSource) {
      const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
      const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

      // Create the shader program

      const shaderProgram = gl.createProgram();
      gl.attachShader(shaderProgram, vertexShader);
      gl.attachShader(shaderProgram, fragmentShader);
      gl.linkProgram(shaderProgram);

      // If creating the shader program failed, alert

      if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
      }

      return shaderProgram;
    }

    //
    // creates a shader of the given type, uploads the source and
    // compiles it.
    //
    function loadShader(gl, type, source) {
      const shader = gl.createShader(type);

      // Send the source to the shader object

      gl.shaderSource(shader, source);

      // Compile the shader program

      gl.compileShader(shader);

      // See if it compiled successfully

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }

      return shader;
    }

<!-- language: lang-html -->

    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width">
      <title></title>
    </head>
    <body>
      <canvas id="glcanvas" width="640" height="480"></canvas>

    </body>
    </html>

<!-- end snippet -->



  [1]: https://i.stack.imgur.com/sWESO.jpg
  [2]: https://i.stack.imgur.com/FmNCN.jpg
  [4]: https://learnopengl.com/

# Answer

This seems to be the what [the paper linked by ripi2](http://jcgt.org/published/0002/02/09/) is doing

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function main() {
      const m4 = twgl.m4;
      const gl = document.querySelector('canvas').getContext('webgl2', {alpha: false});
      if (!gl) {
        alert('need WebGL2');
        return;
      }
      const ext = gl.getExtension('EXT_color_buffer_float');
      if (!ext) {
        alert('EXT_color_buffer_float');
        return;
      }

      const vs = `
      #version 300 es
      layout(location=0) in vec4 position;
      uniform mat4 u_matrix;
      void main() {
        gl_Position = u_matrix * position;
      }
      `;

      const checkerFS = `
      #version 300 es
      precision highp float;

      uniform vec4 color1;
      uniform vec4 color2;

      out vec4 fragColor;

      void main() {
        ivec2 grid = ivec2(gl_FragCoord.xy) / 32;
        fragColor = mix(color1, color2, float((grid.x + grid.y) % 2));
      }
      `;

      const transparentFS = `
      #version 300 es
      precision highp float;
      uniform vec4 Ci;

      out vec4 fragData[2];

      float w(float z, float a) {
        return a * max(pow(10.0,-2.0),3.0*pow(10.0,3.0)*pow((1.0 - z), 3.));
      }

      void main() {
        float ai = Ci.a;
        float zi = gl_FragCoord.z;

        float wresult = w(zi, ai);
        fragData[0] = vec4(Ci.rgb * wresult, ai);
        fragData[1].r = ai * wresult;
      }
      `;

      const compositeFS = `
      #version 300 es
      precision highp float;
      uniform sampler2D ATexture;
      uniform sampler2D BTexture;

      out vec4 fragColor;

      void main() {
        vec4 accum = texelFetch(ATexture, ivec2(gl_FragCoord.xy), 0);
        float r = accum.a;
        accum.a = texelFetch(BTexture, ivec2(gl_FragCoord.xy), 0).r;
        fragColor = vec4(accum.rgb / clamp(accum.a, 1e-4, 5e4), r);
      }
      `;

      const checkerProgramInfo = twgl.createProgramInfo(gl, [vs, checkerFS]);
      const transparentProgramInfo = twgl.createProgramInfo(gl, [vs, transparentFS]);
      const compositeProgramInfo = twgl.createProgramInfo(gl, [vs, compositeFS]);

      const bufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

      const fbi = twgl.createFramebufferInfo(
        gl,
        [
          { internalFormat: gl.RGBA32F, minMag: gl.NEAREST },
          { internalFormat: gl.R32F, minMag: gl.NEAREST },
        ]);

      function render(time) {
        time *= 0.001;

        twgl.setBuffersAndAttributes(gl, transparentProgramInfo, bufferInfo);

        // drawOpaqueSurfaces();
        gl.useProgram(checkerProgramInfo.program);
        gl.disable(gl.BLEND);
        twgl.setUniforms(checkerProgramInfo, {
          color1: [.5, .5, .5, 1],
          color2: [.7, .7, .7, 1],
          u_matrix: m4.identity(),
        });
        twgl.drawBufferInfo(gl, bufferInfo);

        twgl.bindFramebufferInfo(gl, fbi);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
        gl.clearBufferfv(gl.COLOR, 0, new Float32Array([0, 0, 0, 1]));
        gl.clearBufferfv(gl.COLOR, 1, new Float32Array([1, 1, 1, 1]));

        gl.depthMask(false);
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE_MINUS_SRC_ALPHA);

        gl.useProgram(transparentProgramInfo.program);

        // drawTransparentSurfaces();
        const quads = [
           [ .4,  0,  0, .4],
           [ .4, .4,  0, .4],
           [  0, .4,  0, .4],
           [  0, .4, .4, .4],
           [  0, .0, .4, .4],
           [ .4, .0, .4, .4],
        ];
        quads.forEach((color, ndx) => {
          const u = ndx / (quads.length - 1);
          // change the order every second
          const v = ((ndx + time | 0) % quads.length) / (quads.length - 1);
          const xy = (u * 2 - 1) * .25;
          const z = (v * 2 - 1) * .25;
          let mat = m4.identity();
          mat = m4.translate(mat, [xy, xy, z]);
          mat = m4.scale(mat, [.3, .3, 1]);
          twgl.setUniforms(transparentProgramInfo, {
            Ci: color,
            u_matrix: mat,
          });
          twgl.drawBufferInfo(gl, bufferInfo);
        });

        twgl.bindFramebufferInfo(gl, null);
        gl.drawBuffers([gl.BACK]);

        gl.blendFunc(gl.ONE_MINUS_SRC_ALPHA, gl.SRC_ALPHA);

        gl.useProgram(compositeProgramInfo.program);

        twgl.setUniforms(compositeProgramInfo, {
          ATexture: fbi.attachments[0],
          BTexture: fbi.attachments[1],
          u_matrix: m4.identity(),
        });

        twgl.drawBufferInfo(gl, bufferInfo);

        /* only needed if {alpha: false} not passed into getContext
        gl.colorMask(false, false, false, true);
        gl.clearColor(1, 1, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.colorMask(true, true, true, true);
        */

        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);
    }
    main();

<!-- language: lang-html -->

    <canvas></canvas>
    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>

<!-- end snippet -->

Some things to note:

* It's using WebGL2 but it should be possible in WebGL1, you'd have to change the shaders to use GLSL ES 1.0.
* It's using floating point textures. The paper mentions you can use half float textures as well. Note that rendering to both half and float textures is an optional feature in even WebGL2. I believe most mobile hardware can render to half but not to float. 
* It's using weight equation 10 from the paper. There are 4 weight equations in the paper. 7, 8, 9, and 10. To do 7, 8, or 9 you'd need to pass in view space `z` from the vertex shader to the fragment shader
* It's switching the order of drawing every second

The code is pretty straight forward.

It creates 3 shaders. One to draw a checkerboard just so we have something that is opaque to see the transparent stuff drawn above. One is the transparent object shader. The last is the shader the composites the transparent stuff into the scene.

Next it makes 2 textures, a floating point RGBA32F texture and a floating point R32F texture (red channel only). It attaches those to a framebuffer. (that is all done in the 1 function, `twgl.createFramebufferInfo`. That function makes the textures the same size as the canvas by default.

We make a single quad that goes from -1 to +1

We use that quad to draw the checkerboard into the canvas

Then we turn on blending, setup the blend equations as the paper said, switch to rendering onto our framebuffer, clear that framebuffer. note, it's cleared to 0,0,0,1 and 1 respectively. This is the version where we don't have separate blend functions per draw buffer. If you switch to the version that can use separate blending functions per draw buffer then you need to clear to different values and use a different shader (See paper)

Using our transparency shader we that same quad to draw 6 rectangles each of a solid color. I just used a solid color to keep it simple. Each is at a different Z and the Zs change every second just to see the results Z changing.

In the shader `Ci` is the input color. It's expected to be a premultiplied alpha color according to the paper.  fragData[0]` is the "accumulate" texture and `fragData[1]` is the "revealage" texture and is only one channel, red. The `w` function represents the equation 10 from the paper.

After all 6 quads are drawn we switch back to rendering to the canvas and use the compositing shader to composite the transparency result with the non-transparent canvas contents.

Here's an example with some geometry. Differences:

* It's using equations (7) from the paper instead of (10)
* In order to do correct zbuffering the depth buffer needs to be shared when doing opaque and transparent rendering. So there are 2 frames buffers. One buffer has RGBA8 + depth, the other is RGBA32F + R32F + depth. The depth buffer is shared.
* The transparent renderer computes simple lighting and then uses the result as the `Ci` value from the paper
* After compositing the transparent into the opaque we still need to copy the opaque into the canvas to see the result

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    function main() {
      const m4 = twgl.m4;
      const v3 = twgl.v3;
      const gl = document.querySelector('canvas').getContext('webgl2', {alpha: false});
      if (!gl) {
        alert('need WebGL2');
        return;
      }
      const ext = gl.getExtension('EXT_color_buffer_float');
      if (!ext) {
        alert('EXT_color_buffer_float');
        return;
      }

      const vs = `
      #version 300 es
      layout(location=0) in vec4 position;
      layout(location=1) in vec3 normal;
      uniform mat4 u_projection;
      uniform mat4 u_modelView;
      
      out vec4 v_viewPosition;
      out vec3 v_normal;

      void main() {
        gl_Position = u_projection * u_modelView * position;
        v_viewPosition = u_modelView * position;
        v_normal = (u_modelView * vec4(normal, 0)).xyz;
      }
      `;

      const checkerFS = `
      #version 300 es
      precision highp float;

      uniform vec4 color1;
      uniform vec4 color2;

      out vec4 fragColor;

      void main() {
        ivec2 grid = ivec2(gl_FragCoord.xy) / 32;
        fragColor = mix(color1, color2, float((grid.x + grid.y) % 2));
      }
      `;
      
      const opaqueFS = `
      #version 300 es
      precision highp float;
      
      in vec4 v_viewPosition;
      in vec3 v_normal;
      
      uniform vec4 u_color;
      uniform vec3 u_lightDirection;
      
      out vec4 fragColor;
      
      void main() {
        float light = abs(dot(normalize(v_normal), u_lightDirection));
        fragColor = vec4(u_color.rgb * light, u_color.a);
      }
      `;

      const transparentFS = `
      #version 300 es
      precision highp float;
      uniform vec4 u_color;
      uniform vec3 u_lightDirection;
      
      in vec4 v_viewPosition;
      in vec3 v_normal;
      
      out vec4 fragData[2];

      // eq (7)
      float w(float z, float a) {
        return a * max(
          pow(10.0, -2.0),
          min(
            3.0 * pow(10.0, 3.0),
            10.0 /
            (pow(10.0, -5.0) + 
             pow(abs(z) / 5.0, 2.0) +
             pow(abs(z) / 200.0, 6.0)
            )
          )
        );
      }

      void main() {
        float light = abs(dot(normalize(v_normal), u_lightDirection));
        vec4 Ci = vec4(u_color.rgb * light, u_color.a);
      
        float ai = Ci.a;
        float zi = gl_FragCoord.z;

        float wresult = w(zi, ai);
        fragData[0] = vec4(Ci.rgb * wresult, ai);
        fragData[1].r = ai * wresult;
      }
      `;

      const compositeFS = `
      #version 300 es
      precision highp float;
      uniform sampler2D ATexture;
      uniform sampler2D BTexture;
      
      out vec4 fragColor;

      void main() {
        vec4 accum = texelFetch(ATexture, ivec2(gl_FragCoord.xy), 0);
        float r = accum.a;
        accum.a = texelFetch(BTexture, ivec2(gl_FragCoord.xy), 0).r;
        fragColor = vec4(accum.rgb / clamp(accum.a, 1e-4, 5e4), r);
      }
      `;
      
      const blitFS = `
      #version 300 es
      precision highp float;
      uniform sampler2D u_texture;
      
      out vec4 fragColor;

      void main() {
        fragColor = texelFetch(u_texture, ivec2(gl_FragCoord.xy), 0);
      }
      `;

      const checkerProgramInfo = twgl.createProgramInfo(gl, [vs, checkerFS]);
      const opaqueProgramInfo = twgl.createProgramInfo(gl, [vs, opaqueFS]);
      const transparentProgramInfo = twgl.createProgramInfo(gl, [vs, transparentFS]);
      const compositeProgramInfo = twgl.createProgramInfo(gl, [vs, compositeFS]);
      const blitProgramInfo = twgl.createProgramInfo(gl, [vs, blitFS]);

      const xyQuadVertexArrayInfo = makeVAO(checkerProgramInfo, twgl.primitives.createXYQuadBufferInfo(gl));
      const sphereVertexArrayInfo = makeVAO(transparentProgramInfo, twgl.primitives.createSphereBufferInfo(gl, 1, 16, 12));
      const cubeVertexArrayInfo = makeVAO(opaqueProgramInfo, twgl.primitives.createCubeBufferInfo(gl, 1, 1));
      
      function makeVAO(programInfo, bufferInfo) {
        return twgl.createVertexArrayInfo(gl, programInfo, bufferInfo);
      }
      
      // In order to do proper zbuffering we need to share
      // the depth buffer 
      
      const opaqueAttachments = [
        { internalFormat: gl.RGBA8, minMag: gl.NEAREST },
        { format: gl.DEPTH_COMPONENT16, minMag: gl.NEAREST },
      ];
      const opaqueFBI = twgl.createFramebufferInfo(gl, opaqueAttachments);
      
      const transparentAttachments = [
        { internalFormat: gl.RGBA32F, minMag: gl.NEAREST },
        { internalFormat: gl.R32F, minMag: gl.NEAREST },
        { format: gl.DEPTH_COMPONENT16, minMag: gl.NEAREST, attachment: opaqueFBI.attachments[1] },
      ];
      const transparentFBI = twgl.createFramebufferInfo(gl, transparentAttachments);

      function render(time) {
        time *= 0.001;

        if (twgl.resizeCanvasToDisplaySize(gl.canvas)) {
          // if the canvas is resized also resize the framebuffer
          // attachments (the depth buffer will be resized twice 
          // but I'm too lazy to fix it)
          twgl.resizeFramebufferInfo(gl, opaqueFBI, opaqueAttachments);
          twgl.resizeFramebufferInfo(gl, transparentFBI, transparentAttachments);
        }
        
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const fov = 45 * Math.PI / 180;
        const zNear = 0.1;
        const zFar = 500;
        
        const projection = m4.perspective(fov, aspect, zNear, zFar);
        const eye = [0, 0, -5];
        const target = [0, 0, 0];
        const up = [0, 1, 0];
        const camera = m4.lookAt(eye, target, up);
        const view = m4.inverse(camera);

        const lightDirection = v3.normalize([1, 3, 5]);

        twgl.bindFramebufferInfo(gl, opaqueFBI);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);    
        gl.depthMask(true);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindVertexArray(xyQuadVertexArrayInfo.vertexArrayObject);

        // drawOpaqueSurfaces();
        // draw checkerboard
        gl.useProgram(checkerProgramInfo.program);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);
        twgl.setUniforms(checkerProgramInfo, {
          color1: [.5, .5, .5, 1],
          color2: [.7, .7, .7, 1],
          u_projection: m4.identity(),
          u_modelView: m4.identity(),
        });
        twgl.drawBufferInfo(gl, xyQuadVertexArrayInfo);

        // draw a cube with depth buffer
        gl.enable(gl.DEPTH_TEST);
        
        {
          gl.useProgram(opaqueProgramInfo.program);
          gl.bindVertexArray(cubeVertexArrayInfo.vertexArrayObject);
          let mat = view;
          mat = m4.rotateX(mat, time * .1);
          mat = m4.rotateY(mat, time * .2);
          mat = m4.scale(mat, [1.5, 1.5, 1.5]);
          twgl.setUniforms(opaqueProgramInfo, {
            u_color: [1, .5, .2, 1],
            u_lightDirection: lightDirection,
            u_projection: projection,
            u_modelView: mat,
          });    
          twgl.drawBufferInfo(gl, cubeVertexArrayInfo);
        }
        
        twgl.bindFramebufferInfo(gl, transparentFBI);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
        // these values change if using separate blend functions
        // per attachment (something WebGL2 does not support)
        gl.clearBufferfv(gl.COLOR, 0, new Float32Array([0, 0, 0, 1]));
        gl.clearBufferfv(gl.COLOR, 1, new Float32Array([1, 1, 1, 1]));

        gl.depthMask(false);  // don't write to depth buffer (but still testing)
        gl.enable(gl.BLEND);
        // this changes if using separate blend functions per attachment
        gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE_MINUS_SRC_ALPHA);

        gl.useProgram(transparentProgramInfo.program);
        gl.bindVertexArray(sphereVertexArrayInfo.vertexArrayObject);

        // drawTransparentSurfaces();
        const spheres = [
           [ .4,  0,  0, .4],
           [ .4, .4,  0, .4],
           [  0, .4,  0, .4],
           [  0, .4, .4, .4],
           [  0, .0, .4, .4],
           [ .4, .0, .4, .4],
        ];
        spheres.forEach((color, ndx) => {
          const u = ndx + 2;
          let mat = view;
          mat = m4.rotateX(mat, time * u * .1);
          mat = m4.rotateY(mat, time * u * .2);
          mat = m4.translate(mat, [0, 0, 1 + ndx * .1]);
          twgl.setUniforms(transparentProgramInfo, {
            u_color: color,
            u_lightDirection: lightDirection,
            u_projection: projection,
            u_modelView: mat,
          });
          twgl.drawBufferInfo(gl, sphereVertexArrayInfo);
        });

        // composite transparent results with opaque
        twgl.bindFramebufferInfo(gl, opaqueFBI);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);

        gl.disable(gl.DEPTH_TEST);
        gl.blendFunc(gl.ONE_MINUS_SRC_ALPHA, gl.SRC_ALPHA);

        gl.useProgram(compositeProgramInfo.program);
        gl.bindVertexArray(xyQuadVertexArrayInfo.vertexArrayObject);

        twgl.setUniforms(compositeProgramInfo, {
          ATexture: transparentFBI.attachments[0],
          BTexture: transparentFBI.attachments[1],
          u_projection: m4.identity(),
          u_modelView: m4.identity(),
        });

        twgl.drawBufferInfo(gl, xyQuadVertexArrayInfo);

        /* only needed if {alpha: false} not passed into getContext
        gl.colorMask(false, false, false, true);
        gl.clearColor(1, 1, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.colorMask(true, true, true, true);
        */
        
        // draw opaque color buffer into canvas
        // could probably use gl.blitFramebuffer
        gl.disable(gl.BLEND);
        twgl.bindFramebufferInfo(gl, null);
        gl.useProgram(blitProgramInfo.program);
        gl.bindVertexArray(xyQuadVertexArrayInfo.vertexArrayObject);

        twgl.setUniforms(blitProgramInfo, {
          u_texture: opaqueFBI.attachments[0],
          u_projection: m4.identity(),
          u_modelView: m4.identity(),
        });
        twgl.drawBufferInfo(gl, xyQuadVertexArrayInfo);

        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);
    }
    main();

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <canvas></canvas>
    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>

<!-- end snippet -->

It occurs to me rather than use standard OpenGL blending for the last 2 steps (composite followed by blit) we could change the composite shader so it takes 3 textures (ATexutre, BTexture, opaqueTexture) and blends in the shader outputting directly to the canvas. That would be faster.

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    function main() {
      const m4 = twgl.m4;
      const v3 = twgl.v3;
      const gl = document.querySelector('canvas').getContext('webgl2', {alpha: false});
      if (!gl) {
        alert('need WebGL2');
        return;
      }
      const ext = gl.getExtension('EXT_color_buffer_float');
      if (!ext) {
        alert('EXT_color_buffer_float');
        return;
      }

      const vs = `
      #version 300 es
      layout(location=0) in vec4 position;
      layout(location=1) in vec3 normal;
      uniform mat4 u_projection;
      uniform mat4 u_modelView;
      
      out vec4 v_viewPosition;
      out vec3 v_normal;

      void main() {
        gl_Position = u_projection * u_modelView * position;
        v_viewPosition = u_modelView * position;
        v_normal = (u_modelView * vec4(normal, 0)).xyz;
      }
      `;

      const checkerFS = `
      #version 300 es
      precision highp float;

      uniform vec4 color1;
      uniform vec4 color2;

      out vec4 fragColor;

      void main() {
        ivec2 grid = ivec2(gl_FragCoord.xy) / 32;
        fragColor = mix(color1, color2, float((grid.x + grid.y) % 2));
      }
      `;
      
      const opaqueFS = `
      #version 300 es
      precision highp float;
      
      in vec4 v_viewPosition;
      in vec3 v_normal;
      
      uniform vec4 u_color;
      uniform vec3 u_lightDirection;
      
      out vec4 fragColor;
      
      void main() {
        float light = abs(dot(normalize(v_normal), u_lightDirection));
        fragColor = vec4(u_color.rgb * light, u_color.a);
      }
      `;

      const transparentFS = `
      #version 300 es
      precision highp float;
      uniform vec4 u_color;
      uniform vec3 u_lightDirection;
      
      in vec4 v_viewPosition;
      in vec3 v_normal;
      
      out vec4 fragData[2];

      // eq (7)
      float w(float z, float a) {
        return a * max(
          pow(10.0, -2.0),
          min(
            3.0 * pow(10.0, 3.0),
            10.0 /
            (pow(10.0, -5.0) + 
             pow(abs(z) / 5.0, 2.0) +
             pow(abs(z) / 200.0, 6.0)
            )
          )
        );
      }

      void main() {
        float light = abs(dot(normalize(v_normal), u_lightDirection));
        vec4 Ci = vec4(u_color.rgb * light, u_color.a);
      
        float ai = Ci.a;
        float zi = gl_FragCoord.z;

        float wresult = w(zi, ai);
        fragData[0] = vec4(Ci.rgb * wresult, ai);
        fragData[1].r = ai * wresult;
      }
      `;

      const compositeFS = `
      #version 300 es
      precision highp float;
      uniform sampler2D ATexture;
      uniform sampler2D BTexture;
      uniform sampler2D opaqueTexture;
      
      out vec4 fragColor;

      void main() {
        vec4 accum = texelFetch(ATexture, ivec2(gl_FragCoord.xy), 0);
        float r = accum.a;
        accum.a = texelFetch(BTexture, ivec2(gl_FragCoord.xy), 0).r;
        vec4 transparentColor = vec4(accum.rgb / clamp(accum.a, 1e-4, 5e4), r);
        vec4 opaqueColor = texelFetch(opaqueTexture, ivec2(gl_FragCoord.xy), 0);
        //  gl.blendFunc(gl.ONE_MINUS_SRC_ALPHA, gl.SRC_ALPHA);
        fragColor = transparentColor * (1. - r) + opaqueColor * r;
      }
      `;
      
      const checkerProgramInfo = twgl.createProgramInfo(gl, [vs, checkerFS]);
      const opaqueProgramInfo = twgl.createProgramInfo(gl, [vs, opaqueFS]);
      const transparentProgramInfo = twgl.createProgramInfo(gl, [vs, transparentFS]);
      const compositeProgramInfo = twgl.createProgramInfo(gl, [vs, compositeFS]);

      const xyQuadVertexArrayInfo = makeVAO(checkerProgramInfo, twgl.primitives.createXYQuadBufferInfo(gl));
      const sphereVertexArrayInfo = makeVAO(transparentProgramInfo, twgl.primitives.createSphereBufferInfo(gl, 1, 16, 12));
      const cubeVertexArrayInfo = makeVAO(opaqueProgramInfo, twgl.primitives.createCubeBufferInfo(gl, 1, 1));
      
      function makeVAO(programInfo, bufferInfo) {
        return twgl.createVertexArrayInfo(gl, programInfo, bufferInfo);
      }
      
      // In order to do proper zbuffering we need to share
      // the depth buffer 
      
      const opaqueAttachments = [
        { internalFormat: gl.RGBA8, minMag: gl.NEAREST },
        { format: gl.DEPTH_COMPONENT16, minMag: gl.NEAREST },
      ];
      const opaqueFBI = twgl.createFramebufferInfo(gl, opaqueAttachments);
      
      const transparentAttachments = [
        { internalFormat: gl.RGBA32F, minMag: gl.NEAREST },
        { internalFormat: gl.R32F, minMag: gl.NEAREST },
        { format: gl.DEPTH_COMPONENT16, minMag: gl.NEAREST, attachment: opaqueFBI.attachments[1] },
      ];
      const transparentFBI = twgl.createFramebufferInfo(gl, transparentAttachments);

      function render(time) {
        time *= 0.001;

        if (twgl.resizeCanvasToDisplaySize(gl.canvas)) {
          // if the canvas is resized also resize the framebuffer
          // attachments (the depth buffer will be resized twice 
          // but I'm too lazy to fix it)
          twgl.resizeFramebufferInfo(gl, opaqueFBI, opaqueAttachments);
          twgl.resizeFramebufferInfo(gl, transparentFBI, transparentAttachments);
        }
        
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const fov = 45 * Math.PI / 180;
        const zNear = 0.1;
        const zFar = 500;
        
        const projection = m4.perspective(fov, aspect, zNear, zFar);
        const eye = [0, 0, -5];
        const target = [0, 0, 0];
        const up = [0, 1, 0];
        const camera = m4.lookAt(eye, target, up);
        const view = m4.inverse(camera);

        const lightDirection = v3.normalize([1, 3, 5]);

        twgl.bindFramebufferInfo(gl, opaqueFBI);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);    
        gl.depthMask(true);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindVertexArray(xyQuadVertexArrayInfo.vertexArrayObject);

        // drawOpaqueSurfaces();
        // draw checkerboard
        gl.useProgram(checkerProgramInfo.program);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);
        twgl.setUniforms(checkerProgramInfo, {
          color1: [.5, .5, .5, 1],
          color2: [.7, .7, .7, 1],
          u_projection: m4.identity(),
          u_modelView: m4.identity(),
        });
        twgl.drawBufferInfo(gl, xyQuadVertexArrayInfo);

        // draw a cube with depth buffer
        gl.enable(gl.DEPTH_TEST);
        
        {
          gl.useProgram(opaqueProgramInfo.program);
          gl.bindVertexArray(cubeVertexArrayInfo.vertexArrayObject);
          let mat = view;
          mat = m4.rotateX(mat, time * .1);
          mat = m4.rotateY(mat, time * .2);
          mat = m4.scale(mat, [1.5, 1.5, 1.5]);
          twgl.setUniforms(opaqueProgramInfo, {
            u_color: [1, .5, .2, 1],
            u_lightDirection: lightDirection,
            u_projection: projection,
            u_modelView: mat,
          });    
          twgl.drawBufferInfo(gl, cubeVertexArrayInfo);
        }
        
        twgl.bindFramebufferInfo(gl, transparentFBI);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
        // these values change if using separate blend functions
        // per attachment (something WebGL2 does not support)
        gl.clearBufferfv(gl.COLOR, 0, new Float32Array([0, 0, 0, 1]));
        gl.clearBufferfv(gl.COLOR, 1, new Float32Array([1, 1, 1, 1]));

        gl.depthMask(false);  // don't write to depth buffer (but still testing)
        gl.enable(gl.BLEND);
        // this changes if using separate blend functions per attachment
        gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE_MINUS_SRC_ALPHA);

        gl.useProgram(transparentProgramInfo.program);
        gl.bindVertexArray(sphereVertexArrayInfo.vertexArrayObject);

        // drawTransparentSurfaces();
        const spheres = [
           [ .4,  0,  0, .4],
           [ .4, .4,  0, .4],
           [  0, .4,  0, .4],
           [  0, .4, .4, .4],
           [  0, .0, .4, .4],
           [ .4, .0, .4, .4],
        ];
        spheres.forEach((color, ndx) => {
          const u = ndx + 2;
          let mat = view;
          mat = m4.rotateX(mat, time * u * .1);
          mat = m4.rotateY(mat, time * u * .2);
          mat = m4.translate(mat, [0, 0, 1 + ndx * .1]);
          twgl.setUniforms(transparentProgramInfo, {
            u_color: color,
            u_lightDirection: lightDirection,
            u_projection: projection,
            u_modelView: mat,
          });
          twgl.drawBufferInfo(gl, sphereVertexArrayInfo);
        });

        // composite transparent results with opaque
        twgl.bindFramebufferInfo(gl, null);

        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);
        
        gl.useProgram(compositeProgramInfo.program);
        gl.bindVertexArray(xyQuadVertexArrayInfo.vertexArrayObject);

        twgl.setUniforms(compositeProgramInfo, {
          ATexture: transparentFBI.attachments[0],
          BTexture: transparentFBI.attachments[1],
          opaqueTexture: opaqueFBI.attachments[0],
          u_projection: m4.identity(),
          u_modelView: m4.identity(),
        });

        twgl.drawBufferInfo(gl, xyQuadVertexArrayInfo);

        /* only needed if {alpha: false} not passed into getContext
        gl.colorMask(false, false, false, true);
        gl.clearColor(1, 1, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.colorMask(true, true, true, true);
        */
        
        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);
    }
    main();

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <canvas></canvas>
    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>

<!-- end snippet -->



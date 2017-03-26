It's actually common it just redraw stuff which I went over here

http://stackoverflow.com/questions/38339215/webgl-smoothly-fade-lines-out-of-canvas/38345958#38345958

Redrawing stuff means you can keep some things from not fading out. For example if you're making a space shooting game and you only want explosions and missile trails to fade out but you don't want the spaceships and asteroids to fade out then you need to do it by redrawing everything and manually fading stuff out by drawn them while decreasing their alpha

If you just want everything to fade out then you can use a post processing type effect. 

You make 2 textures and attach them to 2 framebuffers. You blend/fade the first framebuffer `fadeFb1` into the second one `fadeFb2` with a fadeColor using

    gl_FragColor = mix(textureColor, fadeColor, mixAmount);

You then draw any new stuff to `fadeFb2`

Then finally draw `fadeFb2` to the canvas so you can see the result.

The next frame you do the same thing except swap which buffer you're drawing to and which one you're fading to.

    frame 0: mix(fadeFb1,fadeColor)->fadeFb2, draw->fadeFb2, fadeFB2->canvas
    frame 1: mix(fadeFb2,fadeColor)->fadeFb1, draw->fadeFb1, fadeFB1->canvas
    frame 2: mix(fadeFb1,fadeColor)->fadeFb2, draw->fadeFb2, fadeFB2->canvas
    ...

Note you don't clear when you draw since you need the result to be left behind

As for setting up framebuffers there's a tutorial here that might be useful

http://webglfundamentals.org/webgl/lessons/webgl-image-processing-continued.html

Here's an example using [twgl](http://twgljs.org) since I'm too lazy for straight WebGL

<!-- begin snippet: js hide: false console: true babel: false -->

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
    uniform vec4 u_fadeColor;

    void main() {
      vec4 color = texture2D(u_texture, v_texcoord);
      gl_FragColor = mix(color, u_fadeColor, u_mixAmount);
    }
    `;
    var fsCopy = `
    precision mediump float;

    varying vec2 v_texcoord;

    uniform sampler2D u_texture;

    void main() {
      gl_FragColor = texture2D(u_texture, v_texcoord);
    }
    `;

    var $ = document.querySelector.bind(document);

    var mixAmount = 0.05;
    var mixElem = $("#mix");
    var mixValueElem = $("#mixValue");
    mixElem.addEventListener('input', function(e) {
        setMixAmount(e.target.value / 100);
    });

    function setMixAmount(value) {
      mixAmount = value;
      mixValueElem.innerHTML = mixAmount;
    }
    setMixAmount(mixAmount);

    var gl = $("canvas").getContext("webgl");
    var m4 = twgl.m4;
    var programInfo = twgl.createProgramInfo(gl, [vs, fs]);
    var fadeProgramInfo = twgl.createProgramInfo(gl, [vsQuad, fsFade]);
    var copyProgramInfo = twgl.createProgramInfo(gl, [vsQuad, fsCopy]);

    // Creates a -1 to +1 quad
    var quadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

    // Creates an RGBA/UNSIGNED_BYTE texture and depth buffer framebuffer
    var imgFbi = twgl.createFramebufferInfo(gl);

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
      twgl.drawBufferInfo(gl, gl.TRIANGLES, quadBufferInfo);
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
        twgl.resizeFramebufferInfo(gl, fadeFbi1, fadeAttachments);
        twgl.resizeFramebufferInfo(gl, fadeFbi2, fadeAttachments);
      }
      
      // fade by copying from fadeFbi1 into fabeFbi2 using mixAmount.
      // fadeFbi2 will contain mix(fadeFb1, u_fadeColor, u_mixAmount)
      twgl.bindFramebufferInfo(gl, fadeFbi2);

      gl.useProgram(fadeProgramInfo.program);
      twgl.setBuffersAndAttributes(gl, fadeProgramInfo, quadBufferInfo);
      twgl.setUniforms(fadeProgramInfo, {
        u_texture: fadeFbi1.attachments[0],
        u_mixAmount: mixAmount,
        u_fadeColor: [0, 0, 0, 0],
      });
      twgl.drawBufferInfo(gl, gl.TRIANGLES, quadBufferInfo);

      // now draw new stuff to fadeFb2. Notice we don't clear!
      twgl.bindFramebufferInfo(gl, fadeFbi2);

      var x = rand(gl.canvas.width);
      var y = rand(gl.canvas.height);
      var rotation = rand(Math.PI);
      var scale = rand(10, 20);
      var color = [rand(1), rand(1), rand(1), 1];
      drawThing(gl, x, y, rotation, scale, color);


      // now copy fadeFbi2 to the canvas so we can see the result
      twgl.bindFramebufferInfo(gl, null);

      gl.useProgram(copyProgramInfo.program);
      twgl.setBuffersAndAttributes(gl, copyProgramInfo, quadBufferInfo);
      twgl.setUniforms(copyProgramInfo, {
        u_texture: fadeFbi2.attachments[0],
      });
      twgl.drawBufferInfo(gl, gl.TRIANGLES, quadBufferInfo);

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
    #ui { position: absolute; top: 0 }


<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/twgl-full.min.js"></script>
    <canvas></canvas>
    <div id="ui">
    <span>mix:</span><input id="mix" type="range" min="0" max="100" value="5" /><span id="mixValue"></span>
    </div>

<!-- end snippet -->


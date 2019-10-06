Title: How to work with framebuffers in webgl?
Description:
TOC: qna

# Question:

I have been trying to understand framebuffer in WebGL/OpenGL-ES.
I know that we can blend multiple textures using framebuffer.

So, to understand that I wrote a sample by taking a 1*1 texture and tried to apply framebuffer logic on top of it.
But , it didn't work.

See snippet at bottom, if you click on "mix red and blue", the images doesn't get rendered, am I doing anything wrong?


Code :
`

    var canvas, gl, attrPosition, texture, program, vertexBuffer, textureBuffer, vertices, texVertices, attrPos, attrTexPos, textures = [], framebuffers = [];

    canvas = document.getElementById('canvas');
  gl = getWebGL();
  vertices = new Float32Array([
   -1.0, -1.0,  
    1.0, -1.0, 
    1.0,  1.0, 
   -1.0,  1.0, 
   -1.0, -1.0, 
  ]);

  texVertices = new Float32Array([
   0.0, 0.0,
   1.0, 0.0,
   1.0, 1.0,
   0.0, 1.0,
   0.0, 0.0
  ]);
  var getProgram = function () {
   var vs = createVertexShader([
    'attribute vec2 attrPos;',
    'attribute vec2 attrTexPos;',
    'varying highp vec2 vTexCoord;',
    'void main() {',
     '\tgl_Position = vec4(attrPos, 0.0, 1.0);',
    '}'
   ].join('\n'));

   var fs = createFragmentShader([
    'varying highp vec2 vTexCoord;',
    'uniform sampler2D uImage;',
    'void main() {',
     '\tgl_FragColor = texture2D(uImage, vTexCoord);',
    '}'
   ].join('\n'));
   return createAndLinkPrograms(vs, fs);
  };

  var render = function () {
   gl.clear(gl.DEPTH_BUFFER_BIT|gl.COLOR_BUFFER_BIT);
   gl.bindTexture(gl.TEXTURE_2D, texture);
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
   gl.vertexAttribPointer(attrPos, 2, gl.FLOAT, gl.FALSE, 0, 0);
   gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
   gl.vertexAttribPointer(attrTexPos, 2, gl.FLOAT, gl.FALSE, 0, 0);
   gl.drawArrays(gl.TRIANGLE_STRIP, 0, 5);
  };
  if (gl) {
   gl.clearColor(0.1, 0.5, 1.0, 1.0);
   render();
   program = getProgram();
   texture = createAndSetupTexture();
   vertexBuffer = createAndBindBuffer(vertices, gl.ARRAY_BUFFER);
   attrPos = gl.getUniformLocation(program, 'attrPos');
   gl.enableVertexAttribArray(attrPos);

   textureBuffer = createAndBindBuffer(texVertices, gl.ARRAY_BUFFER);
   attrTexPos = gl.getUniformLocation(program, 'attrTexPos');
   gl.enableVertexAttribArray(attrTexPos);

   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([123, 0, 60, 255]));
   render();
  }

  var initPingPongTextures = function(textures, framebuffers) {
   for (var i = 0; i < 2; ++i) {
    var tex = createAndSetupTexture(gl);
    textures.push(tex);
    // make the texture the same size as the image
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    // Create a framebuffer
    var fbo = gl.createFramebuffer();
    framebuffers.push(fbo);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    // Attach a texture to it.
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
   }
  }

  var setFramebuffer = function(fbo, width, height) {
   gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
   gl.viewport(0, 0, width, height);
  };

  var mixRedAndBlue = function () {
   gl.activeTexture(gl.TEXTURE0);
   gl.bindTexture(gl.TEXTURE_2D, texture);

   setFramebuffer(framebuffers[0], 1, 1);
   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255]));
   render();
   gl.bindTexture(gl.TEXTURE_2D, textures[0]);

   setFramebuffer(framebuffers[1], 1, 1);
   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 255, 0, 255]));
   render();
   gl.bindTexture(gl.TEXTURE_2D, textures[1]);

   setFramebuffer(null, 1, 1);
   render();
  };`

<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->

    var getWebGLContext = function(canvas) {
     var webglContextParams = ['webgl', 'experimental-webgl', 'webkit-3d', 'moz-webgl'];
     var webglContext = null;
     for (var index = 0; index < webglContextParams.length; index++) {
      try {
       webglContext = canvas.getContext(webglContextParams[index]);
       if(webglContext) {
        //breaking as we got our context
        break;
       }
      } catch (E) {
       console.log(E);
      }
     }
     if(webglContext === null) {
      alert('WebGL is not supported on your browser.');
     } else {
      //WebGL is supported in your browser, lets render the texture
     }
     fillGLForCleanUp(webglContext);
     return webglContext;
    }
    var createVertexShader = function (vertexShaderSource) {
     console.log(vertexShaderSource);
     var vertexShader = gl.createShader(gl.VERTEX_SHADER);
     gl.shaderSource(vertexShader, vertexShaderSource);
     gl.compileShader(vertexShader);
     return vertexShader;
    }

    var createFragmentShader = function (fragmentShaderSource) {
     console.log(fragmentShaderSource);
     var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
     gl.shaderSource(fragmentShader, fragmentShaderSource);
     gl.compileShader(fragmentShader);
     return fragmentShader;
    }


    var createAndLinkPrograms = function (vertexShader, fragmentShader) {
     var program = gl.createProgram();
     gl.attachShader(program, vertexShader);
     gl.attachShader(program, fragmentShader);
     gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            alert('Could not initialise shaders');
        }
     gl.useProgram(program);
     return program;
    }

    var createAndBindBuffer = function (verticesOrIndices, bufferType) {
     var buffer = gl.createBuffer();
     gl.bindBuffer(bufferType, buffer);
     gl.bufferData(bufferType, verticesOrIndices, gl.STATIC_DRAW);
     //clear memory
     gl.bindBuffer(bufferType, null);
     return buffer;
    }

    var allowAllImageSizes = function() {
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      // gl.bindTexture(gl.TEXTURE_2D, null);
    } 

    var createAndSetupTexture = function() {
     var texture = gl.createTexture();
     gl.bindTexture(gl.TEXTURE_2D, texture);
     allowAllImageSizes();
     gl.textures.push(texture);
     return texture;
    }

    var getWebGL = function (canvas, width, height) {
     if(!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'canvas';
      canvas.width = !width ? 512 : width;
      canvas.height = !height ? 512 : height;
      document.body.appendChild(canvas);
     } else {
      canvas.width = !width ? 512 : width;
      canvas.height = !height ? 512 : height;
     }
     return getWebGLContext(canvas);
    }

    var fillGLForCleanUp = function (gl) {
     gl.textures = [];
     gl.framebuffers = [];
     gl.array_buffer = [];
     gl.element_array_buffers = [];
    }


    var canvas, gl, attrPosition, texture, program, 
    vertexBuffer, textureBuffer, vertices, texVertices,
    attrPos, attrTexPos, textures = [], framebuffers = [];
    canvas = document.getElementById('canvas');
    gl = getWebGL(canvas);
    vertices = new Float32Array([
     -1.0, -1.0,  
      1.0, -1.0, 
      1.0,  1.0, 
     -1.0,  1.0, 
     -1.0, -1.0, 
    ]);

    texVertices = new Float32Array([
     0.0, 0.0,
     1.0, 0.0,
     1.0, 1.0,
     0.0, 1.0,
     0.0, 0.0
    ]);
    var getProgram = function () {
     var vs = createVertexShader([
      'attribute vec2 attrPos;',
      'attribute vec2 attrTexPos;',
      'varying highp vec2 vTexCoord;',
      'void main() {',
       '\tgl_Position = vec4(attrPos, 0.0, 1.0);',
      '}'
     ].join('\n'));

     var fs = createFragmentShader([
      'varying highp vec2 vTexCoord;',
      'uniform sampler2D uImage;',
      'void main() {',
       '\tgl_FragColor = texture2D(uImage, vTexCoord);',
      '}'
     ].join('\n'));
     return createAndLinkPrograms(vs, fs);
    };

    var render = function () {
     gl.clear(gl.DEPTH_BUFFER_BIT|gl.COLOR_BUFFER_BIT);
     gl.bindTexture(gl.TEXTURE_2D, texture);
     gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
     gl.vertexAttribPointer(attrPos, 2, gl.FLOAT, gl.FALSE, 0, 0);
     gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
     gl.vertexAttribPointer(attrTexPos, 2, gl.FLOAT, gl.FALSE, 0, 0);
     gl.drawArrays(gl.TRIANGLE_STRIP, 0, 5);
    };
    if (gl) {
     gl.clearColor(0.1, 0.5, 1.0, 1.0);
     render();
     program = getProgram();
     texture = createAndSetupTexture();
     vertexBuffer = createAndBindBuffer(vertices, gl.ARRAY_BUFFER);
     attrPos = gl.getUniformLocation(program, 'attrPos');
     gl.enableVertexAttribArray(attrPos);

     textureBuffer = createAndBindBuffer(texVertices, gl.ARRAY_BUFFER);
     attrTexPos = gl.getUniformLocation(program, 'attrTexPos');
     gl.enableVertexAttribArray(attrTexPos);

     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([123, 0, 60, 255]));
     render();
    }

    var initPingPongTextures = function(textures, framebuffers) {
     for (var i = 0; i < 2; ++i) {
      var tex = createAndSetupTexture(gl);
      textures.push(tex);
      // make the texture the same size as the image
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      // Create a framebuffer
      var fbo = gl.createFramebuffer();
      framebuffers.push(fbo);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      // Attach a texture to it.
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
     }
    }

    var setFramebuffer = function(fbo, width, height) {
     gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
     gl.viewport(0, 0, width, height);
    };

    var mixRedAndBlue = function () {
     gl.activeTexture(gl.TEXTURE0);
     gl.bindTexture(gl.TEXTURE_2D, texture);

     setFramebuffer(framebuffers[0], 1, 1);
     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255]));
     render();
     gl.bindTexture(gl.TEXTURE_2D, textures[0]);

     setFramebuffer(framebuffers[1], 1, 1);
     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 255, 0, 255]));
     render();
     gl.bindTexture(gl.TEXTURE_2D, textures[1]);

     setFramebuffer(null, 1, 1);
     render();
    };

<!-- language: lang-html -->

    <button id="redImg" onclick="mixRedAndBlue()">Mix Red and blue</button><hr/>
    <canvas id="canvas" width=512 height=512></canvas>


<!-- end snippet -->



**Edit 1 :**

I am trying to achieve the same for multiple programs with multiple fragment shaders because having if/else statements within the fragment shader is not recommended as it runs for each pixel.

`    
Shaders.prototype.VS_Base = [
   'attribute vec3 verticesPosition;',
   'attribute vec2 texturePosition;',
   'varying highp vec2 vTextureCoord;',
   'void main(void) {',
   '\tgl_Position = vec4(verticesPosition * vec3(1.0, -1.0, 1.0), 0.5);',
   '\tvTextureCoord = texturePosition;',
   '}'
 ].join('\n');

 Shaders.prototype.FS_Base_Image_RED = [
   '#ifdef GL_ES',
   'precision highp float;',
   '#endif',
   'uniform sampler2D uImage;',
   'varying highp vec2 vTextureCoord;',
   'void main (void) {',
   '\tgl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);//texture2D(uImage, vTextureCoord);',
   '}'
 ].join('\n');

 Shaders.prototype.FS_Base_Image_BLUE = [
   '#ifdef GL_ES',
   'precision highp float;',
   '#endif',
   'uniform sampler2D uImage;',
   'varying highp vec2 vTextureCoord;',
   'void main (void) {',
   '\tgl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);//texture2D(uImage, vTextureCoord);',
   '}'
 ].join('\n');`

Now I have 2 separate programs for both the fragment shader and I need to use framebuffers for mixing Red and Blue. I am not looking for `mix()` as the actual scenario is very complex and that's the reason I am using multiple programs with fragment shaders for avoiding conditional if/else statements.

# Answer

It's not clear what you're trying to do. Framebuffers are just a list of attachments (textures and renderbuffers). You use them to render to a texture and/or renderbuffer. Then you can use the texture you just rendered to as input to some other render.

Here's an example with NO framebuffers. It blends 2 textures.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var vs = `
    attribute vec4 position;

    varying vec2 v_texcoord;

    void main() {
      gl_Position = position;
      v_texcoord = position.xy * .5 + .5;
    }
    `;

    var fs = `
    precision mediump float;

    varying vec2 v_texcoord;

    uniform sampler2D tex1;
    uniform sampler2D tex2;

    void main() {
      vec4 color1 = texture2D(tex1, v_texcoord);
      vec4 color2 = texture2D(tex2, v_texcoord);
      gl_FragColor = mix(color1, color2, 0.5);
    }
    `;

    const gl = document.querySelector("canvas").getContext("webgl");
    const program = twgl.createProgramFromSources(gl, [vs, fs]);

    // make 2 textures with canvas 2d
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.canvas.width = 64;
    ctx.canvas.height = 64;

    // first texture has a circle
    ctx.fillStyle = "blue";
    ctx.fillRect(0, 0, 64, 64);
    ctx.strokeStyle = "yellow";
    ctx.beginPath();
    ctx.arc(32, 32, 20, 0, Math.PI * 2, false);
    ctx.lineWidth = 12;
    ctx.stroke();

    const tex1 = createTextureFromCanvas(gl, ctx.canvas);

    // second texture has a diamond (diagonal square)
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = "cyan";
    ctx.beginPath();
    ctx.moveTo(32, 6);
    ctx.lineTo(58, 32);
    ctx.lineTo(32, 58);
    ctx.lineTo(6, 32);
    ctx.lineTo(32, 6);
    ctx.fill();

    const tex2 = createTextureFromCanvas(gl, ctx.canvas);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]), gl.STATIC_DRAW);


    const positionLoc = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const tex1Loc = gl.getUniformLocation(program, "tex1");  
    const tex2Loc = gl.getUniformLocation(program, "tex2");  
      
    gl.useProgram(program);

    gl.uniform1i(tex1Loc, 0);
    gl.uniform1i(tex2Loc, 1);
    gl.activeTexture(gl.TEXTURE0 + 0);
    gl.bindTexture(gl.TEXTURE_2D, tex1);
    gl.activeTexture(gl.TEXTURE0 + 1);
    gl.bindTexture(gl.TEXTURE_2D, tex2);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    function createTextureFromCanvas(gl, canvas) {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, ctx.canvas);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return tex;
    }





<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/2.x/twgl.min.js"></script>
    <canvas></canvas>


<!-- end snippet -->

For your purpose there is no difference about the blending part, the only difference is where the textures come from. Above the textures were created by using a 2d canvas. Instead you can use framebuffer to render to a texture. **AFTER** you've rendered to a texture you can then use that texture in some other render just like above.

To render to a texture first you create a framebuffer

    var fb = gl.createFramebuffer();

Then you attach a texture to it

    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);  
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, 
        gl.COLOR_ATTACHMENT0,  // attach texture as COLOR_ATTACHMENT0
        gl.TEXTURE_2D,         // attach a 2D texture
        someTexture,           // the texture to attach
        0);                    // the mip level to render to (must be 0 in WebGL1)

Depending on your attachments you should check if they work.

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      // these attachments don't work
    }

The WebGL spec lists 3 combinations of attachments that are guaranteed to work. The example below is using one of those 3 so there's no need to check

Now if you bind the framebuffer

    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

Then when you call any `gl.drawXXX` function or `gl.clear` it will be drawing to the `someTexture` instead of the canvas. To start drawing to the canvas again bind `null`

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

Remember that if the canvas and the texture are different sizes you'll need to call `gl.viewport` to render correctly

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var vs = `
    attribute vec4 position;

    uniform mat4 matrix;

    varying vec2 v_texcoord;

    void main() {
      gl_Position = matrix * position;
      v_texcoord = position.xy * .5 + .5;
    }
    `;

    var colorFS = `
    precision mediump float;

    uniform vec4 color;

    void main() {
      gl_FragColor = color;
    }
    `;

    var mixFS = `
    precision mediump float;

    varying vec2 v_texcoord;

    uniform sampler2D tex1;
    uniform sampler2D tex2;

    void main() {
      // probably should use different texture coords for each
      // texture for more flexibility but I'm lazy
      vec4 color1 = texture2D(tex1, v_texcoord);
      vec4 color2 = texture2D(tex2, v_texcoord);
      gl_FragColor = mix(color1, color2, 0.5);
    }
    `;

    const gl = document.querySelector("canvas").getContext("webgl");
    const colorProgram = twgl.createProgramFromSources(gl, [vs, colorFS]);
    const mixProgram = twgl.createProgramFromSources(gl, [vs, mixFS]);

    // make 2 textures by attaching them to framebuffers and rendering to them
    const texFbPair1 = createTextureAndFramebuffer(gl, 64, 64);
    const texFbPair2 = createTextureAndFramebuffer(gl, 64, 64);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]), gl.STATIC_DRAW);

    function setAttributes(buf, positionLoc) {
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    }
      
    const colorPrgPositionLoc = gl.getAttribLocation(colorProgram, "position");
    setAttributes(buf, colorPrgPositionLoc);
    const colorLoc = gl.getUniformLocation(colorProgram, "color");
    const colorProgMatrixLoc = gl.getUniformLocation(colorProgram, "matrix");

    // draw red rect to first texture through the framebuffer it's attached to
    gl.useProgram(colorProgram);
      
    gl.bindFramebuffer(gl.FRAMEBUFFER, texFbPair1.fb);
    gl.viewport(0, 0, 64, 64);
    gl.uniform4fv(colorLoc, [1, 0, 0, 1]);
    gl.uniformMatrix4fv(colorProgMatrixLoc, false, [
      0.5, 0, 0, 0,
        0,.25, 0, 0,
        0, 0, 1, 0,
       .2,.3, 0, 1,
    ]);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Draw a blue rect to the second texture through the framebuffer it's attached to
    gl.bindFramebuffer(gl.FRAMEBUFFER, texFbPair2.fb);
    gl.viewport(0, 0, 64, 64);
    gl.uniform4fv(colorLoc, [0, 0, 1, 1]);
    gl.uniformMatrix4fv(colorProgMatrixLoc, false, [
      0.25, 0, 0, 0,
        0,.5, 0, 0,
        0, 0, 1, 0,
       .2,.3, 0, 1,
    ]);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Draw both textures to the canvas
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      
    const mixPrgPositionLoc = gl.getAttribLocation(mixProgram, "position");
    setAttributes(buf, mixPrgPositionLoc);
      
    const mixProgMatrixLoc = gl.getUniformLocation(mixProgram, "matrix");

    const tex1Loc = gl.getUniformLocation(mixProgram, "tex1");  
    const tex2Loc = gl.getUniformLocation(mixProgram, "tex2");  
      
    gl.useProgram(mixProgram);

    gl.uniform1i(tex1Loc, 0);
    gl.uniform1i(tex2Loc, 1);
    gl.activeTexture(gl.TEXTURE0 + 0);
    gl.bindTexture(gl.TEXTURE_2D, texFbPair1.tex);
    gl.activeTexture(gl.TEXTURE0 + 1);
    gl.bindTexture(gl.TEXTURE_2D, texFbPair2.tex);
    gl.uniformMatrix4fv(mixProgMatrixLoc, false, [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ]);  

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    function createTextureAndFramebuffer(gl, width, height) {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(
         gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      return {tex: tex, fb: fb};
    }

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/2.x/twgl.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

The only functional difference between the first program and the second is how the textures got their data. In the first example the textures got their data from a canvas 2d. In the 2nd example the textures got their data by rendering to them using WebGL.

As for why your example doesn't blend textures, in order to blend 2 textures you need a shader that uses two textures.

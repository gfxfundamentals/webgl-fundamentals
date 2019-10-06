Title: WebGL drawing 2D image with depth map to achieve pseudo-3D effect
Description:
TOC: qna

# Question:

I'm learning WebGL, done that with the help of WebGLFundamentals page, which helped me pretty much to understand how buffers, shaders and all that stuff works.
But now I want to achieve a certain effect which I saw here: https://tympanus.net/Tutorials/HeatDistortionEffect/index3.html
  I know how to make the heat distortion effect, the effect I want to achieve is the DEPTH on the image. This demo has a tutorial but it doesnt really explain how to do it, it says I must have a grayscale map, in which the white parts are the closest ones and the black parts the farest. But I really cant understand how it works, here is my shader's code:

    var vertexShaderText = [
         "attribute vec2 a_position;",
         "attribute vec2 a_texCoord;",
         "uniform vec2 u_resolution;",
         "varying vec2 v_texCoord;",
         "void main() {",
         "  vec2 zeroToOne = a_position / u_resolution;",
         "  vec2 zeroToTwo = zeroToOne * 2.0;",
         "  vec2 clipSpace = zeroToTwo - 1.0;",
         "  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);",
         "  v_texCoord = a_texCoord;",
         "}"
      ].join("\n")

      var fragShaderText = [
         "precision mediump float;",
         "uniform sampler2D u_image;",
         "uniform sampler2D u_depthMap;",
         "uniform vec2 mouse;",
         "varying vec2 v_texCoord;",
         "void main() {",
         "  float frequency=100.0;",
         "  float amplitude=0.010;",
         "  float distortion=sin(v_texCoord.y*frequency)*amplitude;",
         "  float map=texture2D(u_depthMap,v_texCoord).r;",
         "  vec4 color=texture2D(u_image,vec2(v_texCoord.x+distortion*map, v_texCoord.y));",
         "  gl_FragColor = color;",
         "}"
      ].join("\n")

What I want is when I move the mouse, the image would respond to the shader to distort like in the link I showed above. But I really have no idea on how to do it on the javascript part.
Thanks

# Answer

Following the [image processing tutorials](https://webglfundamentals.org/webgl/lessons/webgl-2-textures.html) from that same site shows how to load multiple images. The sample you linked to and [the tutorial](https://tympanus.net/codrops/2016/05/03/animated-heat-distortion-effects-webgl/) make it pretty clear how it works

First you need the original image

![original image](https://i.imgur.com/xKYRSwu.jpg)

and you then apply a sine wave distortion.

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    "use strict";

    function main() {
      // Get A WebGL context
      /** @type {HTMLCanvasElement} */
      const canvas = document.getElementById("canvas");
      const gl = canvas.getContext("webgl");
      if (!gl) {
        return;
      }

      let originalImage = { width: 1, height: 1 }; // replaced after loading
      const originalTexture = twgl.createTexture(gl, {
        src: "https://i.imgur.com/xKYRSwu.jpg", crossOrigin: '',
      }, (err, texture, source) => {
        originalImage = source;
      });

      // compile shaders, link program, lookup location
      const programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

      // calls gl.createBuffer, gl.bindBuffer, gl.bufferData for a quad
      const bufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

      requestAnimationFrame(render);
      
      function render(time) {
        time *= 0.001;  // seconds
        
        twgl.resizeCanvasToDisplaySize(gl.canvas);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(programInfo.program);

        // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

        const canvasAspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const imageAspect = originalImage.width / originalImage.height;
        const mat = m3.scaling(imageAspect / canvasAspect, -1);
        
        // calls gl.activeTexture, gl.bindTexture, gl.uniformXXX
        twgl.setUniforms(programInfo, {
          u_matrix: mat,
          u_originalImage: originalTexture,
          u_distortionAmount: 0.003,  // .3%
          u_distortionRange: 100,
          u_time: time * 10,
        });

        // calls gl.drawArrays or gl.drawElements
        twgl.drawBufferInfo(gl, bufferInfo);
        
        requestAnimationFrame(render);
      }
    }

    main();

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>
    <canvas id="canvas"></canvas>

    <!-- vertex shader -->
    <script id="vs" type="f">
    attribute vec2 position;
    attribute vec2 texcoord;

    uniform mat3 u_matrix;

    varying vec2 v_texcoord;

    void main() {
       gl_Position = vec4((u_matrix * vec3(position, 1)).xy, 0, 1);
       v_texcoord = texcoord;
    }
    </script>
    <!-- fragment shader -->
    <script id="fs" type="x-shader/x-fragment">
    precision mediump float;

    uniform float u_time;
    uniform float u_distortionAmount;
    uniform float u_distortionRange;

    // our textures
    uniform sampler2D u_originalImage;

    // the texcoords passed in from the vertex shader.
    varying vec2 v_texcoord;

    void main() {
       vec2 distortion = vec2(
          sin(u_time + v_texcoord.y * u_distortionRange), 0) * u_distortionAmount;
       vec4 original = texture2D(u_originalImage, v_texcoord + distortion);
       gl_FragColor = original;
    }
    </script>
    <script src="https://webglfundamentals.org/webgl/resources/m3.js"></script>

<!-- end snippet -->

Then they also load a texture of multiple maps. This texture was created by hand in photoshop (or other image editing program). The green channel is how much to multiply the distortion by. The greener the more distortion.

![](http://i.imgur.com/W9QazjL.jpg)

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    "use strict";

    function main() {
      // Get A WebGL context
      /** @type {HTMLCanvasElement} */
      const canvas = document.getElementById("canvas");
      const gl = canvas.getContext("webgl");
      if (!gl) {
        return;
      }

      let originalImage = { width: 1, height: 1 }; // replaced after loading
      const originalTexture = twgl.createTexture(gl, {
        src: "https://i.imgur.com/xKYRSwu.jpg", 
        crossOrigin: '',
      }, (err, texture, source) => {
        originalImage = source;
      });
      
      const mapTexture = twgl.createTexture(gl, {
        src: "https://i.imgur.com/W9QazjL.jpg", crossOrigin: '',
      });

      // compile shaders, link program, lookup location
      const programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

      // calls gl.createBuffer, gl.bindBuffer, gl.bufferData for a quad
      const bufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

      requestAnimationFrame(render);
      
      function render(time) {
        time *= 0.001;  // seconds
        
        twgl.resizeCanvasToDisplaySize(gl.canvas);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(programInfo.program);

        // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

        const canvasAspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const imageAspect = originalImage.width / originalImage.height;
        const mat = m3.scaling(imageAspect / canvasAspect, -1);
        
        // calls gl.activeTexture, gl.bindTexture, gl.uniformXXX
        twgl.setUniforms(programInfo, {
          u_matrix: mat,
          u_originalImage: originalTexture,
          u_mapImage: mapTexture,
          u_distortionAmount: 0.003,  // .3%
          u_distortionRange: 100,
          u_time: time * 10,
        });

        // calls gl.drawArrays or gl.drawElements
        twgl.drawBufferInfo(gl, bufferInfo);
        
        requestAnimationFrame(render);
      }
    }

    main();

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <canvas id="canvas"></canvas>

    <script id="vs" type="f">
    attribute vec2 position;
    attribute vec2 texcoord;

    uniform mat3 u_matrix;

    varying vec2 v_texcoord;

    void main() {
       gl_Position = vec4(u_matrix * vec3(position, 1), 1);
       v_texcoord = texcoord;
    }
    </script>
    <script id="fs" type="f">
    precision mediump float;

    uniform float u_time;
    uniform float u_distortionAmount;
    uniform float u_distortionRange;

    // our textures
    uniform sampler2D u_originalImage;
    uniform sampler2D u_mapImage;

    // the texcoords passed in from the vertex shader.
    varying vec2 v_texcoord;

    void main() {
       vec4 depthDistortion = texture2D(u_mapImage, v_texcoord);
       float distortionMult = depthDistortion.g;  // just green channel
       
       vec2 distortion = vec2(
          sin(u_time + v_texcoord.y * u_distortionRange), 0) * u_distortionAmount;
       vec4 color0 = texture2D(u_originalImage, v_texcoord + distortion * distortionMult);
       gl_FragColor = color0;
    }
    </script>
    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>
    <script src="https://webglfundamentals.org/webgl/resources/m3.js"></script>

<!-- end snippet -->

Next there's an offset for the mouse multplied by another hand drawn map. This map is the red channel of the image above where the more red it is the more the mouse offset is applied. The map kind of represents depth. Since we need stuff in the front to move opposite of stuff in the back we need to convert that channel from 0 to 1 to -.5 to +.5 in the shader 

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    "use strict";

    function main() {
      // Get A WebGL context
      /** @type {HTMLCanvasElement} */
      const canvas = document.getElementById("canvas");
      const gl = canvas.getContext("webgl");
      if (!gl) {
        return;
      }

      let originalImage = { width: 1, height: 1 }; // replaced after loading
      const originalTexture = twgl.createTexture(gl, {
        src: "https://i.imgur.com/xKYRSwu.jpg", 
        crossOrigin: '',
      }, (err, texture, source) => {
        originalImage = source;
      });
      
      const mapTexture = twgl.createTexture(gl, {
        src: "https://i.imgur.com/W9QazjL.jpg", crossOrigin: '',
      });

      // compile shaders, link program, lookup location
      const programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

      // calls gl.createBuffer, gl.bindBuffer, gl.bufferData for a quad
      const bufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

      const mouse = [0, 0];
      document.addEventListener('mousemove', (event) => {
        mouse[0] = (event.clientX / gl.canvas.clientWidth  * 2 - 1) * 0.05;
        mouse[1] = (event.clientY / gl.canvas.clientHeight * 2 - 1) * 0.05;
      });
      
      requestAnimationFrame(render);
      
      function render(time) {
        time *= 0.001;  // seconds
        
        twgl.resizeCanvasToDisplaySize(gl.canvas);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(programInfo.program);

        // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

        const canvasAspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const imageAspect = originalImage.width / originalImage.height;
        const mat = m3.scaling(imageAspect / canvasAspect, -1);
        
        // calls gl.activeTexture, gl.bindTexture, gl.uniformXXX
        twgl.setUniforms(programInfo, {
          u_matrix: mat,
          u_originalImage: originalTexture,
          u_mapImage: mapTexture,
          u_distortionAmount: 0.003,  // .3%
          u_distortionRange: 100,
          u_time: time * 10,
          u_mouse: mouse,
        });

        // calls gl.drawArrays or gl.drawElements
        twgl.drawBufferInfo(gl, bufferInfo);
        
        requestAnimationFrame(render);
      }
    }

    main();

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <canvas id="canvas"></canvas>

    <!-- vertex shader -->
    <script id="vs" type="f">
    attribute vec2 position;
    attribute vec2 texcoord;

    uniform mat3 u_matrix;

    varying vec2 v_texcoord;

    void main() {
       gl_Position = vec4(u_matrix * vec3(position, 1), 1);
       v_texcoord = texcoord;
    }
    </script>
    <!-- fragment shader -->
    <script id="fs" type="f">
    precision mediump float;

    uniform float u_time;
    uniform float u_distortionAmount;
    uniform float u_distortionRange;
    uniform vec2 u_mouse;

    // our textures
    uniform sampler2D u_originalImage;
    uniform sampler2D u_mapImage;

    // the texcoords passed in from the vertex shader.
    varying vec2 v_texcoord;

    void main() {
       vec4 depthDistortion = texture2D(u_mapImage, v_texcoord);
       float distortionMult = depthDistortion.g;     // just green channel
       float parallaxMult = 0.5 - depthDistortion.r; // just red channel
       
       vec2 distortion = vec2(
          sin(u_time + v_texcoord.y * u_distortionRange), 0) * u_distortionAmount  * distortionMult;
       vec2 parallax = u_mouse * parallaxMult;
          
       vec4 color0 = texture2D(u_originalImage, v_texcoord + distortion + parallax);
       gl_FragColor = color0;
    }
    </script>
    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>
    <script src="https://webglfundamentals.org/webgl/resources/m3.js"></script>

<!-- end snippet -->

Finally, (not in the tutorial but in the sample) it loads a blurred version of the original image (blurred in some image editing program like photoshop)

![](http://i.imgur.com/Zw7mMLX.jpg)

It might be hard to see it's blurred since the blurring is subtle.

The sample then uses the blurred image the more distorted things are

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    "use strict";

    function main() {
      // Get A WebGL context
      /** @type {HTMLCanvasElement} */
      const canvas = document.getElementById("canvas");
      const gl = canvas.getContext("webgl");
      if (!gl) {
        return;
      }

      let originalImage = { width: 1, height: 1 }; // replaced after loading
      const originalTexture = twgl.createTexture(gl, {
        src: "https://i.imgur.com/xKYRSwu.jpg", 
        crossOrigin: '',
      }, (err, texture, source) => {
        originalImage = source;
      });
      
      const mapTexture = twgl.createTexture(gl, {
        src: "https://i.imgur.com/W9QazjL.jpg", crossOrigin: '',
      });
      
      const blurredTexture = twgl.createTexture(gl, {
        src: "https://i.imgur.com/Zw7mMLX.jpg", crossOrigin: '',
      });

      // compile shaders, link program, lookup location
      const programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

      // calls gl.createBuffer, gl.bindBuffer, gl.bufferData for a quad
      const bufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

      const mouse = [0, 0];
      document.addEventListener('mousemove', (event) => {
        mouse[0] = (event.clientX / gl.canvas.clientWidth  * 2 - 1) * 0.05;
        mouse[1] = (event.clientY / gl.canvas.clientHeight * 2 - 1) * 0.05;
      });
      
      requestAnimationFrame(render);
      
      function render(time) {
        time *= 0.001;  // seconds
        
        twgl.resizeCanvasToDisplaySize(gl.canvas);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(programInfo.program);

        // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

        const canvasAspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const imageAspect = originalImage.width / originalImage.height;
        const mat = m3.scaling(imageAspect / canvasAspect, -1);
        
        // calls gl.activeTexture, gl.bindTexture, gl.uniformXXX
        twgl.setUniforms(programInfo, {
          u_matrix: mat,
          u_originalImage: originalTexture,
          u_mapImage: mapTexture,
          u_blurredImage: blurredTexture,
          u_distortionAmount: 0.003,  // .3%
          u_distortionRange: 100,
          u_time: time * 10,
          u_mouse: mouse,
        });

        // calls gl.drawArrays or gl.drawElements
        twgl.drawBufferInfo(gl, bufferInfo);
        
        requestAnimationFrame(render);
      }
    }

    main();

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <canvas id="canvas"></canvas>

    <!-- vertex shader -->
    <script id="vs" type="f">
    attribute vec2 position;
    attribute vec2 texcoord;

    uniform mat3 u_matrix;

    varying vec2 v_texcoord;

    void main() {
       gl_Position = vec4(u_matrix * vec3(position, 1), 1);
       v_texcoord = texcoord;
    }
    </script>
    <!-- fragment shader -->
    <script id="fs" type="f">
    precision mediump float;

    uniform float u_time;
    uniform float u_distortionAmount;
    uniform float u_distortionRange;
    uniform vec2 u_mouse;

    // our textures
    uniform sampler2D u_originalImage;
    uniform sampler2D u_blurredImage;
    uniform sampler2D u_mapImage;

    // the texcoords passed in from the vertex shader.
    varying vec2 v_texcoord;

    void main() {
       vec4 depthDistortion = texture2D(u_mapImage, v_texcoord);
       float distortionMult = depthDistortion.g;     // just green channel
       float parallaxMult = 0.5 - depthDistortion.r; // just red channel
       
       vec2 distortion = vec2(
          sin(u_time + v_texcoord.y * u_distortionRange), 0) * u_distortionAmount  * distortionMult;
       vec2 parallax = u_mouse * parallaxMult;
          
       vec2 uv = v_texcoord + distortion + parallax;
       vec4 original = texture2D(u_originalImage, uv);
       vec4 blurred = texture2D(u_blurredImage, uv);
       gl_FragColor = mix(original, blurred, length(distortion) / u_distortionAmount);
    }
    </script>
    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>
    <script src="https://webglfundamentals.org/webgl/resources/m3.js"></script>

<!-- end snippet -->

The finally big difference is rather than use a simple sine wave for distortion the shader on that sample is computing something slight more complicated.

# cover

The code above uses a 2 unit quad that goes from -1 to +1 in X and Y. If you passed in an identiy matrix (or a 1,1 scale matrix which is the same thing) it would cover the canvas. Instead we want the image to not be distorted. To do that we had this code

    const canvasAspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const imageAspect = originalImage.width / originalImage.height;
    const mat = m3.scaling(imageAspect / canvasAspect, -1);

This just effectively says make it fill the canvas vertically and scale it in whatever it neesd to be to match the original image's aspect. The -1 is to flip the quad since otherwise the image is upside down.

To implement `cover` we just need to check if scale is < 1. If so it's not going to fill the canvas so we set the horizontal scale to 1 and adjust the vertical scale

    // this assumes we want to fill vertically
    let horizontalDrawAspect = imageAspect / canvasAspect;
    let verticalDrawAspect = -1;
    // does it fill horizontally?
    if (horizontalDrawAspect < 1) {
      // no it does not so scale so we fill horizontally and
      // adjust vertical to match
      verticalDrawAspect /= horizontalDrawAspect;
      horizontalDrawAspect = 1;
    }
    const mat = m3.scaling(horizontalDrawAspect, verticalDrawAspect);

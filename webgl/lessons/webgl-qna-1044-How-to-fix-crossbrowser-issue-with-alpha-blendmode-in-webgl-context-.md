Title: How to fix crossbrowser issue with alpha blendmode in webgl context?
Description:
TOC: qna

# Question:

I try to make the background of my fragment shader transparent with gl.blendFuncSeparate.
That works fine on Windows (Chrome/FF/Edge) but on MacOS it only runs in Firefox. Chrome Mac and Safari draw the whole viewport transparent.

<!-- begin snippet: js hide: false console: true babel: true -->

<!-- language: lang-js -->

    class Render {
      constructor() {
        this.pos = [];
        this.program = [];
        this.buffer = [];
        this.ut = [];
        this.resolution = [];
        
        this.frame = 0;
        this.start = Date.now();
        this.options = {
          alpha: true,
          premultipliedAlpha: true,
          preserveDrawingBuffer: false
         };
        
        this.canvas = document.querySelector('canvas');
        this.gl =  this.canvas.getContext('webgl', this.options);

        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.gl.viewport(0, 0, this.width, this.height);

        this.gl.enable(this.gl.BLEND);
        this.gl.blendFuncSeparate(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA, this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
              
        this.clearCanvas();
      
        window.addEventListener('resize', this.resetCanvas, true);
        this.init();
      }
      
       init = () => {
        let vertexSource = document.querySelector('#vertexShader').textContent;
        let fragmentSource = document.querySelector('#fragmentShader').textContent;

        this.createGraphics(vertexSource, fragmentSource, 0);
         
        this.canvas.addEventListener('mousemove', (e) => {
          this.mouseX = e.pageX / this.canvas.width;
          this.mouseY = e.pageY / this.canvas.height;
        }, false);

        this.renderLoop();
      };

      resetCanvas = () => {
        this.width = 300; //this.shaderCanvas.width;
        this.height = 300; // this.shaderCanvas.height;
        this.gl.viewport(0, 0, this.width, this.height);
        this.clearCanvas();
      };

      createShader = (type, source) => {
        let shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        let success = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
        if (!success) {
          console.log(this.gl.getShaderInfoLog(shader));
          this.gl.deleteShader(shader);
          return false;
        }
        return shader;
      };

      createProgram = (vertexSource, fragmentSource) => {
        // Setup Vertext/Fragment Shader functions //
        this.vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
        this.fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);
        
        // Setup Program and Attach Shader functions //
        let program = this.gl.createProgram();
        this.gl.attachShader(program, this.vertexShader);
        this.gl.attachShader(program, this.fragmentShader);
        this.gl.linkProgram(program);
        this.gl.useProgram(program);
        
        return program;
      };

      createGraphics = (vertexSource, fragmentSource, i) => {
        
        // Create the Program //
        this.program[i] = this.createProgram(vertexSource, fragmentSource);
        // Create and Bind buffer //
        this.buffer[i] = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer[i]);

        this.gl.bufferData(
          this.gl.ARRAY_BUFFER,
          new Float32Array([-1, 1, -1, -1, 1, -1, 1, 1]),
          this.gl.STATIC_DRAW
        );

        this.pos[i] = this.gl.getAttribLocation(this.program[i], 'pos');
        
        this.gl.vertexAttribPointer(
          this.pos[i],
          2,              // size: 2 components per iteration
          this.gl.FLOAT,  // type: the data is 32bit floats
          false,          // normalize: don't normalize the data
          0,              // stride: 0 = move forward size * sizeof(type) each iteration to get the next position
          0               // start at the beginning of the buffer
        );
        
        
        this.gl.enableVertexAttribArray(this.pos[i]);
        
        this.importProgram(i);
        
      };

      clearCanvas = () => {
        this.gl.clearColor(1,1,1,1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // Turn off rendering to alpha
        this.gl.colorMask(true, true, true, false);
      };

      updateUniforms = (i) => {
        this.importUniforms(i);
        
        this.gl.drawArrays(
          this.gl.TRIANGLE_FAN, // primitiveType
          0,                    // Offset
          4                     // Count
        );
      };

      importProgram = (i) => {
        this.ut[i] = this.gl.getUniformLocation(this.program[i], 'time');

        this.resolution[i] = new Float32Array([300, 300]);
        this.gl.uniform2fv(
          this.gl.getUniformLocation(this.program[i],'resolution'),
          this.resolution[i]
        );
      };

      importUniforms = (i) => {
        this.gl.uniform1f(this.ut[i], (Date.now() - this.start) / 1000);
      };

      renderLoop = () => {   
        this.frame++;
        this.updateUniforms(0);
        this.animation = window.requestAnimationFrame(this.renderLoop);
      };
    }

    let demo = new Render(document.body);

<!-- language: lang-css -->

    body {
      background: #333;
      padding: 0;
      margin: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    canvas {
      position: absolute;
      top: 0;
      right: 0;
      left: 0;
      bottom: 0;
      width: 200px;
      height: 200px;
      background: transparent;
    }

<!-- language: lang-html -->

    <canvas width="300" height="300"></canvas>

    <script id="vertexShader" type="x-shader/x-vertex">
      attribute vec3 pos;

      void main() {
        gl_Position=vec4(pos, .5);
      }
    </script>

    <script id="fragmentShader" type="x-shader/x-fragment">
      precision mediump float;

     uniform float time;
     uniform vec2 resolution;

     mat2 rotate2d(float angle){
       return mat2(cos(angle),-sin(angle),
             sin(angle),cos(angle));
     }

     float variation(vec2 v1, vec2 v2, float strength, float speed) {
      return sin(
       dot(normalize(v1), normalize(v2)) * strength + time * speed
      ) / 100.0;
     }

     vec4 paintCircle (vec2 uv, vec2 center, float rad, float width) {
      vec2 diff = center-uv;
      float len = length(diff);

      len += variation(diff, vec2(0.0, 1.0), 3.0, 2.0);
      len -= variation(diff, vec2(1.0, 0.0), 3.0, 2.0);

      float circle = 1. -smoothstep(rad-width, rad, len);

      return vec4(circle);
     }

     void main() {
      vec2 uv = gl_FragCoord.xy / resolution.xy;
      vec4 color;
      float radius = 0.15;
      vec2 center = vec2(0.5);

      color = paintCircle(uv, center, radius, .2);
      vec2 v = rotate2d(time) * uv;

      color *= vec4(255,255, 0,255);

         gl_FragColor = color;
     }
    </script>

<!-- end snippet -->

Snippet above wont work on MacOS Chrome, but run successful in Windows Chrome. You should see a fluid yellow circle. The goal is to see only the animated figure on HTML background (#333). The canvas is transparent.
I've already tried different blend functions, but no combination is working cross browser.

```javascript
this.options = {
  alpha: true,
  premultipliedAlpha: true,
  preserveDrawingBuffer: false
 };
```

```javascript
this.gl.enable(this.gl.BLEND);
this.gl.blendFuncSeparate(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA, this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
```

```javascript
clearCanvas = () => {
  this.gl.clearColor(1,1,1,1);
  this.gl.clear(this.gl.COLOR_BUFFER_BIT);

  // Turn off rendering to alpha
  this.gl.colorMask(true, true, true, false);
};
```

# Answer

I don't know what you expected to happen and you apparently already edited you codepen making your question completely irrelevant since we can no longer check the issue. Next time **please use a [snippet](https://stackoverflow.blog/2014/09/16/introducing-runnable-javascript-css-and-html-code-snippets/)**

With `preserveDrawingBuffer: false` the canvas is cleared every frame. in `clearCanvas` you clear the alpha to one and then turn off rendering to alpha but because `preserveDrawingBuffer` is false (the default) the drawing buffer is cleared which means alpha is now back to zero. After that you render 0,0,0 or 1,1,0 into it. 1,1,0,0 is an invalid color when `premultipliedAlpha` is true, the default. Why? Because `premultiplied` means the colors you put in the canvas have been multiplied by alpha. alpha is 0. 0 times anything is zero so when the alpha is zero then red, green, and blue must also be zero.

This is why you see different colors on different browsers. When your colors are invalid the results are undefined.

Setting `preserveDrawingBuffer` to true does not fix your issue. It just means you set the alpha to 1 and then leave it at 1 since you turned off rendering to alpha so the entire canvas is then opaque.

The correct fix for what you appear to want would be for you to not clear at all (let preserverDrawingBuffer: false, do the clearing for you) and don't turn off rendering to alpha with `gl.colorMask` then in your shader write 0 to alpha where you want to see the background and 1 where you don't

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const vertexSource = `
    attribute vec3 pos;

    void main() {
     gl_Position=vec4(pos, .5);
    }
    `;

    const fragmentSource = `
    precision mediump float;

     uniform float time;
     uniform vec2 resolution;

      mat2 rotate2d(float angle){
       return mat2(cos(angle),-sin(angle),
             sin(angle),cos(angle));
     }

     float variation(vec2 v1, vec2 v2, float strength, float speed) {
      return sin(
       dot(normalize(v1), normalize(v2)) * strength + time * speed
      ) / 100.0;
     }

    // vec3 paintCircle (vec2 uv, vec2 center, float rad, float width) {
     vec4 paintCircle (vec2 uv, vec2 center, float rad, float width) {
      vec2 diff = center-uv;
      float len = length(diff);

      len += variation(diff, vec2(0.0, 1.0), 3.0, 2.0);
      len -= variation(diff, vec2(1.0, 0.0), 3.0, 2.0);

      float circle = 1. -smoothstep(rad-width, rad, len);

    //  return vec3(circle);
      return vec4(circle);
     }


     void main() {
      vec2 uv = gl_FragCoord.xy / resolution.xy;
    //  vec3 color;
      vec4 color;
      float radius = 0.15;
      vec2 center = vec2(0.5);

      color = paintCircle(uv, center, radius, .2);
      vec2 v = rotate2d(time) * uv;
      //color *= vec3(v.x, v.y, 0.7-v.y*v.x);

    //  color *= vec3(255,255, 0);
      color *= vec4(255,255, 0,255);
      //color += paintCircle(uv, center, radius, 0.01);

    //  gl_FragColor = vec4(color, 1.0);
      gl_FragColor = color;
     }
    `;

    class Render {
      constructor() {
        this.pos = [];
        this.program = [];
        this.buffer = [];
        this.ut = [];
        this.resolution = [];
        
        this.frame = 0;
        this.start = Date.now();
    this.options = {
    // these are already the defaults
    //  alpha: true,
    //  premultipliedAlpha: true,
    //  preserveDrawingBuffer: false
     };
        
        this.canvas = document.querySelector('canvas');
        this.gl =  this.canvas.getContext('webgl', this.options);

        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.gl.viewport(0, 0, this.width, this.height);

    //    this.gl.enable(this.gl.BLEND);
    //    this.gl.blendFuncSeparate(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA, this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
        //this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
        //this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
              
    // this.clearCanvas();
      
        window.addEventListener('resize', this.resetCanvas, true);
        this.init();
      }
      
       init = () => {
        this.createGraphics(vertexSource, fragmentSource, 0);
         
        this.renderLoop();
      };

      resetCanvas = () => {
        this.width = 300; //this.shaderCanvas.width;
        this.height = 300; // this.shaderCanvas.height;
        this.gl.viewport(0, 0, this.width, this.height);
        this.clearCanvas();
      };

      createShader = (type, source) => {
        let shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        let success = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
        if (!success) {
          console.log(this.gl.getShaderInfoLog(shader));
          this.gl.deleteShader(shader);
          return false;
        }
        return shader;
      };

      createProgram = (vertexSource, fragmentSource) => {
        // Setup Vertext/Fragment Shader functions //
        this.vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
        this.fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);
        
        // Setup Program and Attach Shader functions //
        let program = this.gl.createProgram();
        this.gl.attachShader(program, this.vertexShader);
        this.gl.attachShader(program, this.fragmentShader);
        this.gl.linkProgram(program);
        this.gl.useProgram(program);
        
        return program;
      };

      createGraphics = (vertexSource, fragmentSource, i) => {
        
        // Create the Program //
        this.program[i] = this.createProgram(vertexSource, fragmentSource);
        // Create and Bind buffer //
        this.buffer[i] = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer[i]);

        this.gl.bufferData(
          this.gl.ARRAY_BUFFER,
          new Float32Array([-1, 1, -1, -1, 1, -1, 1, 1]),
          this.gl.STATIC_DRAW
        );

        this.pos[i] = this.gl.getAttribLocation(this.program[i], 'pos');
        
        this.gl.vertexAttribPointer(
          this.pos[i],
          2,              // size: 2 components per iteration
          this.gl.FLOAT,  // type: the data is 32bit floats
          false,          // normalize: don't normalize the data
          0,              // stride: 0 = move forward size * sizeof(type) each iteration to get the next position
          0               // start at the beginning of the buffer
        );
        
        
        this.gl.enableVertexAttribArray(this.pos[i]);
        
        this.importProgram(i);
        
      };

      updateUniforms = (i) => {
        this.importUniforms(i);
        
        this.gl.drawArrays(
          this.gl.TRIANGLE_FAN, // primitiveType
          0,                    // Offset
          4                     // Count
        );
      };

      importProgram = (i) => {
        this.ut[i] = this.gl.getUniformLocation(this.program[i], 'time');

        this.resolution[i] = new Float32Array([300, 300]);
        this.gl.uniform2fv(
          this.gl.getUniformLocation(this.program[i],'resolution'),
          this.resolution[i]
        );
      };

      importUniforms = (i) => {
        this.gl.uniform1f(this.ut[i], (Date.now() - this.start) / 1000);
      };

      renderLoop = () => {   
        this.frame++;
        this.updateUniforms(0);
        this.animation = window.requestAnimationFrame(this.renderLoop);
      };
    }

    let demo = new Render(document.body);

<!-- language: lang-css -->

    body {
      background-color: red;
      background-image: linear-gradient(45deg, blue 25%, transparent 25%, transparent 75%, blue 75%, blue),
    linear-gradient(-45deg, blue 25%, transparent 25%, transparent 75%, blue 75%, blue);
    background-size: 30px 30px;
      padding: 0;
      margin: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    canvas {
      position: absolute;
      top: 0;
      right: 0;
      left: 0;
      bottom: 0;
      width: 300px;
      height: 300px;
      background: transparent;
    }

<!-- language: lang-html -->

    <canvas width="300" height="300"></canvas>

<!-- end snippet -->

Note I set the background to a pattern so we can see it's working.

Not sure if you meant this line

  color *= vec4(255,255, 0,255);

to use 255. Colors in WebGL go from 0 to 1 so maybe you really meant

  color *= vec4(1, 1, 0, 1);

Let me add there are also some minor issues with the code. Many of these are opinions so take em or leave em.

1. CSS

   The easiest way to get a canvas to fill the screen is this

        body { margin: 0; }
        canvas { width: 100vw; height: 100vh; display: block; }

   That's all you need

2. Resizing on resize event

   I'd argue [there are better ways](https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html)

3. Using `Date.now`

   requestAnimationFrame passes in the time since the page loaded to the callback and is higher resolution than `Date.now()`

4. The code structure

   Of course I don't know your plans but expecting each pair of shaders to use the same inputs seems kind of unusual. Of course it's your code so maybe that's what you intended.

5. The code is setup for multiple programs but calls `gl.useProgram` once.

   Seems like `updateUniforms` should be calling `gl.useProgram` so it affects the correct program?

6. Using arrow functions on class methods?

   See https://medium.com/@charpeni/arrow-functions-in-class-properties-might-not-be-as-great-as-we-think-3b3551c440b1

   Also AFAIK this format is not yet supported in Firefox or Safari only Chrome (though you could use Babel to translate)

7. Not setting the viewport every frame

   This is hugely personal opinon but likely at some point you'll add
   framebuffers with different sizes at which point you'll need to set the viewport all the time. Micro-optimizing something that happens once a frame is hardly worth it.

8. Passing in `position` as a vec3

   attributes default to 0,0,0,1 so if you don't get all 4 values from your buffers you'll get exactly what you need.

Here's a version with some of those changes

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const vertexSource = `
    attribute vec4 pos;

    void main() {
     gl_Position = pos;
    }
    `;

    const fragmentSource = `
    precision mediump float;

     uniform float time;
     uniform vec2 resolution;

      mat2 rotate2d(float angle){
       return mat2(cos(angle),-sin(angle),
             sin(angle),cos(angle));
     }

     float variation(vec2 v1, vec2 v2, float strength, float speed) {
      return sin(
       dot(normalize(v1), normalize(v2)) * strength + time * speed
      ) / 100.0;
     }

     vec4 paintCircle (vec2 uv, vec2 center, float rad, float width) {
      vec2 diff = center-uv;
      float len = length(diff);

      len += variation(diff, vec2(0.0, 1.0), 3.0, 2.0);
      len -= variation(diff, vec2(1.0, 0.0), 3.0, 2.0);

      float circle = 1. -smoothstep(rad-width, rad, len);

      return vec4(circle);
     }


     void main() {
      vec2 uv = gl_FragCoord.xy / resolution.xy;
      vec4 color;
      float radius = 0.15;
      vec2 center = vec2(0.5);

      color = paintCircle(uv, center, radius, .2);
      vec2 v = rotate2d(time) * uv;
      color *= vec4(1,1, 0,1);

      gl_FragColor = color;
     }
    `;

    class Render {
      constructor() {
        this.pos = [];
        this.program = [];
        this.buffer = [];
        this.ut = [];
        this.ures = [];
        
        this.frame = 0;
        this.canvas = document.querySelector('canvas');
        this.gl =  this.canvas.getContext('webgl');

        this.renderLoop = this.renderLoop.bind(this);

        this.init();
      }
      
       init() {
        this.createGraphics(vertexSource, fragmentSource, 0);
         
        this.renderLoop(0);
      }

      createShader(type, source) {
        let shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        let success = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
        if (!success) {
          console.log(this.gl.getShaderInfoLog(shader));
          this.gl.deleteShader(shader);
          return false;
        }
        return shader;
      }

      createProgram (vertexSource, fragmentSource) {
        // Setup Vertext/Fragment Shader functions //
        this.vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
        this.fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);
        
        // Setup Program and Attach Shader functions //
        let program = this.gl.createProgram();
        this.gl.attachShader(program, this.vertexShader);
        this.gl.attachShader(program, this.fragmentShader);
        this.gl.linkProgram(program);
        
        return program;
      }

      createGraphics (vertexSource, fragmentSource, i) {
        
        // Create the Program //
        this.program[i] = this.createProgram(vertexSource, fragmentSource);
        // Create and Bind buffer //
        this.buffer[i] = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer[i]);

        this.gl.bufferData(
          this.gl.ARRAY_BUFFER,
          new Float32Array([-1, 1, -1, -1, 1, -1, 1, 1]),
          this.gl.STATIC_DRAW
        );

        this.pos[i] = this.gl.getAttribLocation(this.program[i], 'pos');
        
        this.gl.vertexAttribPointer(
          this.pos[i],
          2,              // size: 2 components per iteration
          this.gl.FLOAT,  // type: the data is 32bit floats
          false,          // normalize: don't normalize the data
          0,              // stride: 0 = move forward size * sizeof(type) each iteration to get the next position
          0               // start at the beginning of the buffer
        );
        
        
        this.gl.enableVertexAttribArray(this.pos[i]);
        
        this.importProgram(i);
        
      }

      updateUniforms(i, time) {
        this.gl.useProgram(this.program[i]);
        this.importUniforms(i, time);
        
        this.gl.drawArrays(
          this.gl.TRIANGLE_FAN, // primitiveType
          0,                    // Offset
          4                     // Count
        );
      };

      importProgram(i) {
        this.ut[i] = this.gl.getUniformLocation(this.program[i], 'time');
        this.ures[i] = this.gl.getUniformLocation(this.program[i],'resolution');
      };

      importUniforms(i, time) {
        this.gl.uniform1f(this.ut[i], time / 1000);
        this.gl.uniform2f(this.ures[i], this.gl.canvas.width, this.gl.canvas.height);
      }

      resizeCanvasToDisplaySize() {
        const canvas = this.gl.canvas;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width ||
                           canvas.height !== height;
        if (needResize) {
          canvas.width = width;
          canvas.height = height;
        }
        return needResize;
      }


      renderLoop(time) {   
        this.resizeCanvasToDisplaySize();
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.frame++;
        this.updateUniforms(0, time);
        this.animation = window.requestAnimationFrame(this.renderLoop);
      }
    }

    let demo = new Render(document.body);

<!-- language: lang-css -->

    body {
      background-color: red;
      margin: 0;
    }

    canvas {
      width: 100vw;
      height: 100vh;
      display: block;
    }

<!-- language: lang-html -->

    <canvas></canvas>

<!-- end snippet -->



Title: WebGL Droste effect
Description:
TOC: qna

# Question:

I am trying to use WebGL achieve [Droste effect](https://en.wikipedia.org/wiki/Droste_effect) on a cube's faces. There is a single mesh in the viewport, a cube, and all of its faces share the same texture. To achieve Droste effect, I update the texture on each frame and I actually just take a snapshot of the `canvas` whose WebGL context I am drawing to, which over time results in the Droste effect as the snapshot increasingly contain more and more nested past frames.

There is a demo of what I have right now in action here:

https://tomashubelbauer.github.io/webgl-op-1/?cubeTextured

The code in question follows:

```
// Set up fragment and vertex shader and attach them to a program, link the program
// Create a vertex buffer, an index buffer and a texture coordinate buffer
// Tesselate the cube's vertices and fill in the index and texture coordinate buffers
const textureCanvas = document.createElement('canvas');
textureCanvas.width = 256;
textureCanvas.height = 256;
const textureContext = textureCanvas.getContext('2d');

// In every `requestAnimationFrame`:
textureContext.drawImage(context.canvas, 0, 0);
const texture = context.createTexture();
context.bindTexture(context.TEXTURE_2D, texture);
context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, context.RGBA, context.UNSIGNED_BYTE, textureCanvas);
context.generateMipmap(context.TEXTURE_2D);
// Clear the viewport completely (depth and color buffers)
// Set up attribute and uniform values, the projection and model view matrices
context.activeTexture(context.TEXTURE0);
context.bindTexture(context.TEXTURE_2D, texture);
context.uniform1i(fragmentShaderTextureSamplerUniformLocation, 0);
context.drawElements(context.TRIANGLES, 36, context.UNSIGNED_SHORT, 0)
```

The above is the meat of it all, there is a separate canvas from the WebGL one and it gets the WebGL canvas drawn on it before each WebGL frame and this canvas is then used to create the texture for the given frame and the texture is applied to the cube's faces according to the texture coordinate buffer and the texture sampler uniform provided to the fragment shader which just uses `gl_FragColor = texture2D(textureSampler, textureCoordinate)` like you would expect.

But this is super slow (30 FPS slow on this simple demo with one cube mesh where all my other demoes some with an order of magnitude more tris still edge the 60 FPS `requestAnimationFrame` cap).

Also it feels weird to do this "outside" of WebGL by using the external canvas when I feel like it should be achievable using WebGL alone.

I know WebGL keeps two buffers, one for the active frame and the back buffer for the recently drawn frame and these two swap with each frame to achieve immediate screen update. Is it possible to tap to this back buffer and use it as a texture? Can you please provide example code of how that would be done?

# Answer

From [this article](https://webglfundamentals.org/webgl/lessons/webgl-render-to-texture.html)

The normal way to do this is to render to a texture by attaching that texture to a framebuffer.

```
const fb = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
gl.framebufferTexture2D(
    gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0 /* level */) 
```

Now to render to the texture

```
gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
gl.viewport(0, 0, textureWidth, textureHeight);
```

To render to the canvas

```
gl.bindFramebuffer(gl.FRAMEBUFFER, null);
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
```

To do what you want you need 2 textures since you can not read from and write to the same texture at the same time so you draw say 

* Draw Image to TextureA
* Draw Previous Frame (TextureB) to TextureA
* Draw Cube with TextureA to TextureB
* Draw TextureB to Canvas

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    "use strict";

    function main() {
      const m4 = twgl.m4;
      const gl = document.querySelector('canvas').getContext('webgl')

      const vs = `
      attribute vec4 position;
      attribute vec2 texcoord;
      uniform mat4 u_matrix;
      varying vec2 v_texcoord;
      void main() {
        gl_Position = u_matrix * position;
        v_texcoord = texcoord;
      }
      `;
      
      const fs = `
      precision mediump float;
      varying vec2 v_texcoord;
      uniform sampler2D u_tex;
      void main() {
        gl_FragColor = texture2D(u_tex, v_texcoord);
      }
      `;
      
      // compile shaders, link program, look up locations
      const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

      // gl.createBuffer, gl.bufferData for positions and texcoords of a cube
      const cubeBufferInfo = twgl.primitives.createCubeBufferInfo(gl, 1);
      // gl.createBuffer, gl.bufferData for positions and texcoords of a quad
      const quadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl, 2);

      // all the normal stuff for setting up a texture
      const imageTexture = twgl.createTexture(gl, {
        src: 'https://i.imgur.com/ZKMnXce.png',
      });

      function makeFramebufferAndTexture(gl, width, height) {
        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D,
           0,       // level
           gl.RGBA, // internal format
           width,
           height,
           0,       // border
           gl.RGBA, // format
           gl.UNSIGNED_BYTE, // type
           null,    // data (no data needed)
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        
        gl.framebufferTexture2D(
           gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
           gl.TEXTURE_2D, texture, 0 /* level */);
      
        // note: depending on what you're rendering you might want to atttach
        // a depth renderbuffer or depth texture. See linked article
        
        return {
          framebuffer,
          texture,
          width,
          height,
        };
      }
      
      function bindFramebufferAndSetViewport(gl, fbi) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbi ? fbi.framebuffer : null);
        const {width, height} = fbi || gl.canvas;
        gl.viewport(0, 0, width, height);
      }

      let fbiA = makeFramebufferAndTexture(gl, 512, 512);
      let fbiB = makeFramebufferAndTexture(gl, 512, 512);
      
      function drawImageAndPreviousFrameToTextureB() {
        bindFramebufferAndSetViewport(gl, fbiB);
        
        // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
        // for each attribute
        twgl.setBuffersAndAttributes(gl, programInfo, quadBufferInfo);

        // calls gl.activeTexture, gl.bindTexture, gl.uniform 
        twgl.setUniforms(programInfo, {
          u_tex: imageTexture,
          u_matrix: m4.identity(),
        });

        // calls gl.drawArrays or gl.drawElements
        twgl.drawBufferInfo(gl, quadBufferInfo);
        
        // ---------
        
        // draw previous cube texture into current cube texture
        {
          twgl.setUniforms(programInfo, {
            u_tex: fbiA.texture,
            u_matrix: m4.scaling([0.8, 0.8, 1]),
          });
          twgl.drawBufferInfo(gl, quadBufferInfo);
        }
      }    
        
      function drawTexturedCubeToTextureA(time) {
        // ---------   
        // draw cube to "new" dstFB using srcFB.texture on cube
        bindFramebufferAndSetViewport(gl, fbiA);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        twgl.setBuffersAndAttributes(gl, programInfo, cubeBufferInfo);
        
        {
          const fov = 60 * Math.PI / 180;
          const aspect = fbiA.width / fbiA.height;
          const near = 0.1;
          const far = 100;
          let mat = m4.perspective(fov, aspect, near, far); 
          mat = m4.translate(mat, [0, 0, -2]);
          mat = m4.rotateX(mat, time);
          mat = m4.rotateY(mat, time * 0.7);

          twgl.setUniforms(programInfo, {
            u_tex: fbiB.texture,
            u_matrix: mat,
          });
        }
        
        twgl.drawBufferInfo(gl, cubeBufferInfo);
      }
      
      function drawTextureAToCanvas() {
        // --------
        // draw dstFB.texture to canvas
        bindFramebufferAndSetViewport(gl, null);
        
        twgl.setBuffersAndAttributes(gl, programInfo, quadBufferInfo);
        
        {
          const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
          const near = -1;
          const far = 1;
          let mat = m4.ortho(-aspect, aspect, -1, 1, near, far);

          twgl.setUniforms(programInfo, {
            u_tex: fbiA.texture,
            u_matrix: mat,
          });
        }
        
        twgl.drawBufferInfo(gl, quadBufferInfo);
      }  
      
      function render(time) {
        time *= 0.001; // convert to seconds;
        
        twgl.resizeCanvasToDisplaySize(gl.canvas);
        
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        
        // there's only one shader program so let's set it here
        gl.useProgram(programInfo.program);
      
        drawImageAndPreviousFrameToTextureB();
        drawTexturedCubeToTextureA(time);
        drawTextureAToCanvas();
      
        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);
    }

    main();

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

As for the canvas and its 2 buffers, no it is not possible to directly use them as textures. You can call `gl.copyTexImage2D` or `gl.copyTexSubImage2D` top copy a portion of the canvas to a texture though so that is another solution. It's less flexible and I believe slower than the framebuffer method

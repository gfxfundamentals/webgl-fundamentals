Title: Does GPU swap created Textures with the CPU?
Description:
TOC: qna

# Question:

Updating this after HankMoody's comments.
I ran this and actually a context lost took place at about 4GB into the texture creation:
   

    Total size = 4001366016                        
    [Violation] 'setTimeout' handler took 427ms    
    WebGL: CONTEXT_LOST_WEBGL: loseContext: context lost 
    context lost; stopping now 
    context is lost

This almost aligns with the GPU information I can obtain from `chrome://gpu`:

    szDisplayMemoryEnglish 4163 MB

If i'm reading this properly it should mean that I have about 4GB of ram.

An interesting this was I had to create a buffer (Float32Array) and pass it along otherwise the code would run forever.

So as it stands I cannot say if the GPU is actually swapping anything to the CPU. But I have no reason to assume so since I was able to reach the limits of my GPU's memory and cause it to reset.

*****************************
To get to the bottom of the reasons we keep losing context in our code, I tried to simulate that by indefinitely creating textures until the context is lost.

However, regardless of the how long my loop continues to create textures I never hit this issue. My laptop becomes completely unresponsive but I never see a 'context lost' in Chrome console.

Does GPU somehow swap the texture memory with the CPU memory perhaps?

Here's the code I'm using:

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    let contextLost = false;
    function createCanvas(canvasWidth, canvasHeight) {
      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth + 'px';
      canvas.height = canvasHeight + 'px';
       
     canvas.addEventListener("webglcontextlost", function(event) {
      //event.preventDefault();
      console.log('context is lost');
      contextLost = true;
      
     }, false);
     canvas.addEventListener(
      "webglcontextrestored", function() { 
      console.log('context is restored'); 
      }, false);

      return canvas;
    }
    function getGLContext(canvas) {
      const attributes = { alpha: false, depth: false, antialias: false };
      // Only fetch a gl context if we haven't already
      const gl = canvas.getContext('webgl2', attributes);
      if(!gl) {
       throw 'No support for WebGL2';
      }
      if(!gl.getExtension('EXT_color_buffer_float')) {
       throw 'No support for floatingpoint output textures';
      }
      return gl;
    }
    function createTexture(gl, width, height, data) {
      const texture = gl.createTexture();
      // Bind the texture so the following methods effect this texture.
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      // Pixel format and data for the texture
      gl.texImage2D(
        gl.TEXTURE_2D,  // Target, matches bind above.
        0,              // Level of detail.
        gl.R32F,        // Internal format.
        width,          // Width - normalized to s.
        height,         // Height - normalized to t.
        0,              // Always 0 in OpenGL ES.
        gl.RED,        // Format for each pixel.
        gl.FLOAT,           // Data type for each chanel.
        data);          // Image data in the described format, or null.
      // Unbind the texture.
      gl.bindTexture(gl.TEXTURE_2D, null);

      return texture;
    }

    let totalSize = 0;
    const buffer = new Float32Array(1024*1024);
    function createTexture2() {
     const texsize=1024 * 1024 * 4;
     const tex = createTexture(gl, 1024, 1024, buffer) ;
     if(!tex || contextLost) {
      console.log('context lost; stopping now');
      return;
     }
     totalSize += texsize;
     console.log('Total size = ' + totalSize);
     window.setTimeout(createTexture2, 0);
    }
    const canvas = createCanvas(1,1);
    const gl = getGLContext(canvas);

    createTexture2();

    console.log('the end');

<!-- end snippet -->


# Answer

> Does GPU swap created Textures with the CPU?

That is up to the browser / driver / OS.

Some drivers can swap textures. Some GPUs share memory with the CPU so the same swapping that happens with normal CPU memory happens with GPU memory.

Some OSes virtualize the GPU some don't. In other words if you ran some native game that uses a lot of GPU memory and at the same time ran your test you might get different results.

Some Browsers can implement their own swapping. In other words if you ran your test in 2 windows at the same time you might get different or the same results.

There's no easy answer.

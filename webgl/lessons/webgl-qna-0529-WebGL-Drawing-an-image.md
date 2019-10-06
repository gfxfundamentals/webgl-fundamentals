Title: WebGL Drawing an image
Description:
TOC: qna

# Question:

I'm new to WebGL, I've worked with OpenGL in Java before. I've been trying to code a simple function that draws an image on a specific location with a specific size and rotation. But after searching on the internet for a while, my code still isn't working.

Currently, I've succeeded in drawing an image, but that image is not close to being in the correct location, having the correct size and rotation. I've lost my overview over what code does and needs what because I've used code from a number of different tutorials since I didn't found one tutorial that had all my specifications.

I know that the image loading part works for sure. I just need help with making a function that 

 - sets up the vertex and fragment shader (for drawing width a texture)
 - translates, resizes and rotates it into the correct location, size and rotations
 - and draws it

Could someone help me with that?

# Answer

You should probably [read up on WebGL](http://webglfundamentals.org) especially about [matrices](http://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html).

In any case here's "drawImage" from the canvas 2d API re-written in WebGL with the full transform stack.

In other words in Canvas2D you could do this

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(w, h);
    ctx.drawImage(img, x, y);
    ctx.restore();

Below you can do this

    save();
    translate(x, y);
    rotate(angle);
    scale(w, h);
    drawImage(targetWidth, targetHeight, tex, texWidth, texHeight, x, y);
    restore();


<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->

    var m4 = twgl.m4;
    var gl = twgl.getWebGLContext(document.getElementById("c"));
    var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

    // a unit quad
    var arrays = {
      position: { 
        numComponents: 2, 
        data: [
          0, 0,  
          1, 0, 
          0, 1, 
          0, 1, 
          1, 0,  
          1, 1,
        ],
      },
    };
    var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
      
    // Let's use a 2d canvas for a texture just so we don't have to download anything
    var ctx = document.createElement("canvas").getContext("2d");
    var w = 128;
    var h = 64;
    ctx.canvas.width = w;
    ctx.canvas.height = h;
    ctx.fillStyle = "blue";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "green";
    ctx.fillRect(w / 8, h / 8, w / 8 * 6, h / 8 * 6);
    ctx.fillStyle = "red";
    ctx.fillRect(w / 4, h / 4, w / 2, h / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "20px sans-serif";
    ctx.fillStyle = "yellow";
    ctx.fillText("texture", w / 2, h / 2);
          
    var tex = twgl.createTexture(gl, { src: ctx.canvas });

    // Implement a matrix stack like Canvas2d
    var matrixStack = [ m4.identity() ];      
          
    function render(time) {      
      var t = time * 0.001;

      var texWidth     = w;
      var texHeight    = h;
      var targetWidth  = gl.canvas.width;
      var targetHeight = gl.canvas.height;
          
      save();
      translate(
        (Math.sin(t * 0.9) * 0.5 + 0.5) * targetWidth,
        (Math.sin(t * 0.8) * 0.5 + 0.5) * targetHeight);
      rotate(t * 0.7);
      scale(
        Math.sin(t * 0.7) * 0.5 + 1,
        Math.sin(t * 0.6) * 0.5 + 1);
      
      // scale and rotate from center of image
      translate(texWidth * -0.5, texHeight * -0.5);
        
      drawImage(
        targetWidth, targetHeight,
        tex, texWidth, texHeight,  
        0, 0);
        
      restore();
        
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    function getCurrentMatrix() {
      return matrixStack[matrixStack.length - 1];
    }

    function save() {
      matrixStack.push(m4.copy(getCurrentMatrix()));
    }

    function restore() {
      matrixStack.pop();
      if (!matrixStack.length) {
        matrixStack.push(m4.identity());
      }
    }

    function translate(x, y) {
      var m = getCurrentMatrix();
      m4.translate(m, [x, y, 0], m);
    }

    function scale(x, y) {
      var m = getCurrentMatrix();
      m4.scale(m, [x, y, 1], m);
    }

    function rotate(radians) {
      var m = getCurrentMatrix();
      m4.rotateZ(m, radians, m);
    }
          

    // we pass in texWidth and texHeight because unlike images
    // we can't look up the width and height of a texture

    // we pass in targetWidth and targetHeight to tell it
    // the size of the thing we're drawing too. We could look 
    // up the size of the canvas with gl.canvas.width and
    // gl.canvas.height but maybe we want to draw to a framebuffer
    // etc.. so might as well pass those in.

    // srcX, srcY, srcWidth, srcHeight are in pixels 
    // computed from texWidth and texHeight

    // dstX, dstY, dstWidth, dstHeight are in pixels
    // computed from targetWidth and targetHeight
    function drawImage(
        targetWidth, targetHeight,
        tex, texWidth, texHeight,
        srcX, srcY, srcWidth, srcHeight,
        dstX, dstY, dstWidth, dstHeight
    ) {
      // handle case where only x, y are passed in
      // as in ctx.drawIimage(img, x, y);
      if (srcWidth === undefined) {
        srcWidth  = texWidth;
        srcHeight = texHeight;
      }
      
      // handle case where only x, y, width, height are passed in
      // as in ctx.drawIimage(img, x, y, width, height);
      if (dstX === undefined) {
        dstX = srcX;
        dstY = srcY;
        dstWidth = srcWidth;
        dstHeight = srcHeight;
      }
          
      var mat  = m4.identity();
      var tmat = m4.identity();
      
      var uniforms = {
        matrix: mat,
        textureMatrix: tmat,
        texture: tex,
      };

      // these adjust the unit quad to generate texture coordinates
      // to select part of the src texture

      // NOTE: no check is done that srcX + srcWidth go outside of the
      // texture or are in range in any way. Same for srcY + srcHeight

      m4.translate(tmat, [srcX / texWidth, srcY / texHeight, 0], tmat);
      m4.scale(tmat, [srcWidth / texWidth, srcHeight / texHeight, 1], tmat);

      // these convert from pixels to clip space
      m4.ortho(0, targetWidth, targetHeight, 0, -1, 1, mat);

      // Add in global matrix
      m4.multiply(getCurrentMatrix(), mat, mat);

      // these move and scale the unit quad into the size we want
      // in the target as pixels
      m4.translate(mat, [dstX, dstY, 0], mat);
      m4.scale(mat, [dstWidth, dstHeight, 1], mat);

      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.setUniforms(programInfo, uniforms);
      twgl.drawBufferInfo(gl, gl.TRIANGLES, bufferInfo);
      
    }

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/twgl-full.js"></script>
    <script id="vs" type="not-js">
    // we will always pass a 0 to 1 unit quad
    // and then use matrices to manipulate it
    attribute vec4 position;   

    uniform mat4 matrix;
    uniform mat4 textureMatrix;

    varying vec2 texcoord;

    void main () {
      gl_Position = matrix * position;
      
      texcoord = (textureMatrix * position).xy;
    }
    </script>
    <script id="fs" type="not-js">
    precision mediump float;

    varying vec2 texcoord;
    uniform sampler2D texture;

    void main() {
      gl_FragColor = texture2D(texture, texcoord);
    }
    </script>
    <canvas id="c" width="640" height="480"></canvas>

<!-- end snippet -->

and [here's an article describing how it works](https://webglfundamentals.org/webgl/lessons/webgl-2d-drawimage.html)


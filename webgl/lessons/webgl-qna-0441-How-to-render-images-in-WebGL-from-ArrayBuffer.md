Title: How to render images in WebGL from ArrayBuffer
Description:
TOC: qna

# Question:

I am having a image that I am reading in server side and pushing to web browser via AJAX call. I have a requirement where I have to render them line by line using WebGL.

For Example : Image is 640X480 where 640 is width and 480 is height. Now the total number of pixels will be 640*480 = 307200 pixels. So, I want to render the whole image in 640(total width) intervals in a loop using WebGL.

Now I have texture2D(as per my knowledge) in webgl to do so, but not getting any idea of where to start . I also having the ArrayBuffer with me , only thing is using Texture2D I want to render it slowly ,line by line.

I am ready to go for any js libraries ,if they are satisfying the requirements.
So, to write a image line by line we can do something like this.

**Vertex Shader**

 -       
        attribute vec2 a_position;?
        attribute vec2 a_texCoord;?

        void main() {
           ???
        }

 - **Fragment Shader**
         
         #ifdef GL_ES
         precision mediump float;
         #endif

        uniform float time;
        uniform vec2 mouse;
        uniform vec2 resolution;

        void main( void ) {
       vec2 position = 1.0 - gl_FragCoord.xy / resolution;
       vec3 color = vec3(1.0);
 
       if (time > position.y * 10.0) {
        color = texture2D(uImage0, uv);
       }
 
      gl_FragColor = vec4(color, 1.0);

        }

 - **Javascript For rendering pixel by pixel**
           
           
          function createTextureFromArray(gl, dataArray, type, width, height) {
                var data = new Uint8Array(dataArray);
                var texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, type, width, height, 0, type, gl.UNSIGNED_BYTE, data);
                return texture;
         }
           
           var arrayBuffer = new ArrayBuffer(640*480);
           for (var i=0; i < 640; i++) {
               for (var j=0; j < 480; j++) {
                   arrayBuffer[i] = Math.floor(Math.random() * 255) + 0;     //filling buffer with random data between 0 and 255 which will be further filled to the texture 
                   //NOTE : above data is just dummy data , I will get this data from server pixel by pixel.
               }
           }
           var gl = canvas.getContext('webgl');
           // setup GLSL program
           var program = createProgramFromScripts(gl, ["2d-vertex-shader", "2d-fragment-shader"]);
           gl.useProgram(program);
           //what should I add after this ?
Can anybody complete the code , I have no idea of how to write code to accomplish this.
     

# Answer

It's not clear at all what you're trying to accomplish and why you are using WebGL at all. Are you sending one line of data at a time and you want to render that one individual line of data when its received? Are you sending all the data and you just want reveal it a line at time horizontally?

If you have the entire image available then you can just render a larger and larger portion of it using canvas2d. The `drawImage` function takes optional source and destination rectangles.

    // at init time
    var x = 0;

    // at render time
    while (x < img.width) {
      var srcX = x;
      var srcY = 0;
      var srcWidth = 1;  // one pixel per frame
      var srcHeight = img.height;
      var dstX = x;
      var dstY = 0;
      var dstWidth = 1;
      var dstHeight = img.height;
      ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight, dstX, dstY, dstWidth, dstHeight);
      ++x;
    }

If you're sending them 1 line of data at a time you can use `ImageData` to make a 1xheight image and use `putImageData` to draw it.    

    // at init time or whenever you know the height
    var imageData = ctx.createImageData(1, height);
    var x = 0;
    
    // on received next line of data
    for (var ii = 0; ii < imageData.length; ++ii) {
      imageData.data[ii] = receivedColumnOfPixels[ii];
    }

    ctx.putImageData(imageData, x, 0);
    ++x;

If you want to scale the `ImageData` put it in a second canvas and use that canvas as input to `drawImage` using the first technique.

You can do the same things in WebGL. If you have the entire texture in memory then each frame adjust your positions and texture coordinates to draw a different part of it. If you're receiving 1 column of data at a time then just use a texture that's 1 x height and draw that at the appropriate place. OR, copy that 1 x height data into the fullsize texture using `gl.texSubImage2D` and then adjust the positions and texture coordinates appropriately to draw the part of the texture you want to draw to the part of the canvas you want to draw it.

`drawImage` implemented in WebGL would look something like this. I'm using [twgl.js](http://twgljs.org) because WebGL is too verbose. 

<!-- begin snippet: js hide: false console: false babel: false -->

<!-- language: lang-js -->

    var m4 = twgl.m4;
    var gl = document.getElementById("c").getContext("webgl");
    // compiles shader, links and looks up locations
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
    // calls gl.createBuffer, gl.bindBuffer, gl.bufferData for each array
    var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    // create a texture using a canvas so we don't have to download one
    var ctx = document.createElement("canvas").getContext("2d");
    ctx.fillStyle = "blue";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.lineWidth = 20;
    ["red", "orange", "yellow"].forEach(function(color, ndx, array) {
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc((ndx + 1) / (array.length + 1) * ctx.canvas.width, ctx.canvas.height / 2, ctx.canvas.height * 0.4, 0, Math.PI * 2, false);
      ctx.stroke();
    });
    ctx.fillStyle = "white";
    ctx.font = "40px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("DrawImage", ctx.canvas.width / 2, ctx.canvas.height / 2);

    // calls gl.createTexture, gl.bindTexture, gl.texImage2D, gl.texParameteri
    var tex = twgl.createTexture(gl, { src: ctx.canvas });
    var texWidth  = ctx.canvas.width;
    var texHeight = ctx.canvas.height;

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
        tex, texWidth, texHeight,
        srcX, srcY, srcWidth, srcHeight,
        dstX, dstY, dstWidth, dstHeight,
        targetWidth, targetHeight) {
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
      m4.translate(mat, [-1, 1, 0], mat);
      m4.scale(mat, [2 / targetWidth, -2 / targetHeight, 1], mat); 

      // these move and scale the unit quad into the size we want
      // in the target as pixels
      m4.translate(mat, [dstX, dstY, 0], mat);
      m4.scale(mat, [dstWidth, dstHeight, 1], mat);

      gl.useProgram(programInfo.program);
      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      // calls gl.uniformXXX, gl.activeTexture, gl.bindTexture
      twgl.setUniforms(programInfo, uniforms);
      // calls gl.drawArray or gl.drawElements
      twgl.drawBufferInfo(gl, gl.TRIANGLES, bufferInfo);
      
    }
      
    function render(time) {
      time *= 0.001;
      var targetWidth  = gl.canvas.width;
      var targetHeight = gl.canvas.height;

      // pick some various src rects and dst rects
      var srcX = Math.abs(Math.sin(time * 1   )) * texWidth;
      var srcY = Math.abs(Math.sin(time * 1.81)) * texHeight;
      var srcWidth  = (texWidth  - srcX) * Math.abs(Math.sin(time * 2.12));
      var srcHeight = (texHeight - srcY) * Math.abs(Math.sin(time * 1.53));

      var dstX = Math.abs(Math.sin(time * 0.34)) * targetWidth;
      var dstY = Math.abs(Math.sin(time * 2.75)) * targetHeight;
      var dstWidth  = (targetWidth  - dstX) * Math.abs(Math.sin(time * 1.16));
      var dstHeight = (targetHeight - dstY) * Math.abs(Math.sin(time * 1.17));
      
      drawImage(
        tex, texWidth, texHeight,  
        srcX, srcY, srcWidth, srcHeight,
        dstX, dstY, dstWidth, dstHeight,
        targetWidth, targetHeight);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/twgl-full.min.js"></script>
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
    <canvas id="c"></canvas>

<!-- end snippet -->

To understand them matrix math [see these articles](http://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html) and work your way backward or forward in those articles.

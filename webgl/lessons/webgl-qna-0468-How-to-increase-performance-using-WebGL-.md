Title: How to increase performance using WebGL?
Description:
TOC: qna

# Question:

I am rendering a texture using WebGL ,However ,the way I am rendering is I am rendering few lines of data and then moving those lines to right and again drawing another set of lines.

For example : I have a image of 640*480 ,which contains 640*480*4 pixels of RGBA, however I am only filling the alpha values and it is a GrayScale medical Dicom image.

Now ,the issue that I am facing is it is rendering the texture with jerks ,the image rendering is not happening smoothly.

For example, This is what happens :
There are 640 lines of data to be rendered.

So, I took a arraybuffer of 640*480*4 and then , Suppose first line came to client via websocket from server to render ,then I will fill the indexes as  3, 640+3, 640*2+3, 640*3+3 and so on until 640*480+3. Then when the second line is received ,I will move first line to second line like 3->7, 640+3->640+7, ......640*480+3->640*480+7. And then the newly received line will be rendered to 3, 640+3, 640*2+3, 640*3+3 and this will continue until the 640th line of image data.


Here's the code that I have done.

Code:
    
        var renderLineData = function (imageAttr) {
  var data = imageAttr.data;
  var LINES_PER_CHUNK = imageAttr.lines;
  var alpha = 4;
  if(imageAttr.newImage) {
   newBuffer = new ArrayBuffer(imageAttr.width * imageAttr.height * alpha);dataTypedArray = new Uint8Array(newBuffer);
   // provide texture coordinates for the rectangle.
   provideTextureCoordsForRect();
   setParams();
   // Upload the image into the texture.
   // look up uniform locations
   uploadImageToTexture(gl.getUniformLocation(program, 'u_matrix'));
  } else {
   for (var z = imageAttr.index; z > 0; z--) {
    for (i = 0 ; i < LINES_PER_CHUNK; i++) {
     for (j = 0 ; j < imageAttr.height; j++) {
      dataTypedArray[i * alpha + imageAttr.width*alpha * j + 3 + LINES_PER_CHUNK  * alpha * z] = dataTypedArray[i * alpha + imageAttr.width*alpha * j +  3 + LINES_PER_CHUNK  * alpha * (z-1)];
     }
    }
   }
  }
  for (i = 0, k = imageAttr.height*LINES_PER_CHUNK; i < LINES_PER_CHUNK; i++) {
   for (j = 0 ; j < imageAttr.height; j++) {
    dataTypedArray[i * alpha + imageAttr.width*4 * j + 3] = data[k - imageAttr.height + j];
   }
   k = k - imageAttr.height;
  }
  imageAttrTemp = imageAttr;
      renderImgSlowly(gl, imageAttr, dataTypedArray);
 };
    function renderImgSlowly (gl, image, dataTypedArray)  {
  gl.clear(gl.COLOR_BUFFER_BIT || gl.DEPTH_BUFFER_BIT);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, image.width, image.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, dataTypedArray);
  //Draw the rectangle.
  gl.drawArrays(gl.TRIANGLES, 0, 6);
 }



# Answer

First off, nothing you are doing is likely to be the speed issue. A 640x320 image is not that large and the amount of processing you're doing in JavaScript is unlikely to be the bottleneck. 

On top of that WebGL will have no trouble drawing a single quad which is all you're drawing. Nor will it have a problem uploading a 640x480 texture.

The bottleneck is the network. Sending chunks over the network is slow.

On the other hand, if you want to optimize, why are you shifting the data around in JavaScript? Just put it in the correct place in the texture to start with with `gl.texSubImage2D`. If you only want to draw the part that has had data put in it then adjust the texture coordinates to select that part of the texture

Also, why are you using `RGBA` if you only need one channel? Use `LUMINANCE`.

      if (imageAttr.newImage) {
          destColumn = imageAttr.width;
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, imageAttr.width, imageAttr.height, 0,
                        gl.LUMINANCE, gl.UNSIGNED_BYTE, null);
      }
      destColumn -= imageAttr.lines;
      // should check it destColumn does not go negative!
      gl.texSubImage2D(gl.TEXTURE_2D, 0, destColumn, 0, imageAttr.lines, imageAttr.height,
                       gl.LUMINANCE, gl.UNSIGNED_BYTE, imageAttr.data);
      
      var srcX = destColumn;
      var srcY = 0;
      var srcWidth  = imageAttr.width - destColumn;
      var srcHeight = imageAttr.height;

      var dstX = destColumn * gl.canvas.width / imageAttr.width;
      var dstY = 0;
      var dstWidth  = srcWidth * gl.canvas.width / imageAttr.width;
      var dstHeight = srcHeight;

      var texWidth     = imageAttr.width;
      var texHeight    = imageAttr.height;
      var targetWidth  = gl.canvas.width;
      var targetHeight = gl.canvas.height;
          
      drawImageInWebGL(
        tex, texWidth, texHeight,  
        srcX, srcY, srcWidth, srcHeight,
        dstX, dstY, dstWidth, dstHeight,
        targetWidth, targetHeight);
    }

Here's an example


<!-- begin snippet: js hide: true console: false babel: false -->

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
          
    // we're only using 1 texture so just make and bind it now
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
          
          
    var destColumn = 0;
          
    // We're using 1 byte wide texture pieces so we need to 
    // set UNPACK_ALIGNMENT to 1 as it defaults to 4
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
                
    simulateSendingAnImageNColumnsAtATime(1, 1, addLinesToImageAndDraw);
      
    function addLinesToImageAndDraw(imageAttr) {
      if (imageAttr.newImage) {
          destColumn = imageAttr.width;
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, imageAttr.width, imageAttr.height, 0,
                        gl.LUMINANCE, gl.UNSIGNED_BYTE, null);
      }
      destColumn -= imageAttr.lines;
      // should check it destColumn does not go negative!
      gl.texSubImage2D(gl.TEXTURE_2D, 0, destColumn, 0, imageAttr.lines, imageAttr.height,
                       gl.LUMINANCE, gl.UNSIGNED_BYTE, imageAttr.data);
      
      var srcX = destColumn;
      var srcY = 0;
      var srcWidth  = imageAttr.width - destColumn;
      var srcHeight = imageAttr.height;

      var dstX = destColumn * gl.canvas.width / imageAttr.width;
      var dstY = 0;
      var dstWidth  = srcWidth * gl.canvas.width / imageAttr.width;
      var dstHeight = gl.canvas.height;

      var texWidth     = imageAttr.width;
      var texHeight    = imageAttr.height;
      var targetWidth  = gl.canvas.width;
      var targetHeight = gl.canvas.height;
          
      drawImage(
        tex, texWidth, texHeight,  
        srcX, srcY, srcWidth, srcHeight,
        dstX, dstY, dstWidth, dstHeight,
        targetWidth, targetHeight);
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
      m4.ortho(0, targetWidth, targetHeight, 0, -1, 1, mat)

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


    // =====================================================================
    // Everything below this line represents stuff from the server.
    // so it's irrelevant to the answer
    //

    function simulateSendingAnImageNColumnsAtATime(minColumnsPerChunk, maxColumnsPerChunk, callback) {
      var imageData = createImageToSend(640, 480);
      
      // cut data into columns at start because this work would be done on
      // the server
      var columns = [];
      var x = 0;
      while (x < imageData.width) {
        // how many columns are left?
        var maxWidth = imageData.width - x;
        
        // how many columns should we send
        var columnWidth = Math.min(maxWidth, rand(minColumnsPerChunk, maxColumnsPerChunk + 1));
        
        var data = createImageChunk(imageData, imageData.width - x - columnWidth, 0, columnWidth, imageData.height);    
        
        columns.push({
          newImage: x === 0,
          lines: columnWidth,
          width: imageData.width,
          height: imageData.height,
          data: data,
        });
        
        x += columnWidth;
      }
      
      var columnNdx = 0;
      sendNextColumn();
      
      function sendNextColumn() {
        if (columnNdx < columns.length) {
          callback(columns[columnNdx++]);
          if (columnNdx < columns.length) {
            // should we make this random to siumlate network speed
            var timeToNextChunkMS = 17;
            setTimeout(sendNextColumn, timeToNextChunkMS);
          }
        }
      }
    }

    function createImageChunk(imageData, x, y, width, height) {
      var data = new Uint8Array(width * height);
      for (var yy = 0; yy < height; ++yy) {
        for (var xx = 0; xx < width; ++xx) {
          var srcOffset = ((yy + y) * imageData.width + xx + x) * 4;
          var dstOffset = yy * width + xx;
          // compute gray scale
          var gray = Math.max(imageData.data[srcOffset], imageData.data[srcOffset + 1], imageData.data[srcOffset + 2]);
          data[dstOffset] = gray;
        }
      }
      return data;
    }

    function rand(min, max) {
      return Math.floor(Math.random() * max - min) + min;
    }

    function createImageToSend(width, height) {
      // create a texture using a canvas so we don't have to download one
      var ctx = document.createElement("canvas").getContext("2d");
      ctx.width = width;
      ctx.height = height;
      ctx.fillStyle = "#222";
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.lineWidth = 20;
      ["#AAA", "#888", "#666"].forEach(function(color, ndx, array) {
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.arc((ndx + 1) / (array.length + 1) * ctx.canvas.width, ctx.canvas.height / 2,
                ctx.canvas.height * 0.4, 0, Math.PI * 2, false);
        ctx.stroke();
      });
      ctx.fillStyle = "white";
      ctx.font = "40px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Some Image", ctx.canvas.width / 2, ctx.canvas.height / 2);
      return ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

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
    <canvas id="c" width="640" height="480"></canvas>

<!-- end snippet -->


NOTE: This will not be smooth because it is using `setTimeout` to simulate receiving network data but that's exactly what you're likely seeing.

Here's a sample that rotates the image independently of updating the texture. You can see it runs perfectly smooth. The slowness is not WebGL, the slowness is networking (as simulated by `setTimeout`)


<!-- begin snippet: js hide: true console: false babel: false -->

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
          
    // we're only using 1 texture so just make and bind it now
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
          
          
    var destColumn = 0;
    var imageWidth;
    var imageHeight;
          
    // We're using 1 byte wide texture pieces so we need to 
    // set UNPACK_ALIGNMENT to 1 as it defaults to 4
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
                
    simulateSendingAnImageNColumnsAtATime(1, 1, addLinesToImageAndDraw);
      
    function addLinesToImageAndDraw(imageAttr) {
      if (imageAttr.newImage) {
          destColumn  = imageAttr.width;
          imageWidth  = imageAttr.width;
          imageHeight = imageAttr.height;
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, imageAttr.width, imageAttr.height, 0,
                        gl.LUMINANCE, gl.UNSIGNED_BYTE, null);
      }
      destColumn -= imageAttr.lines;
      // should check it destColumn does not go negative!
      gl.texSubImage2D(gl.TEXTURE_2D, 0, destColumn, 0, imageAttr.lines, imageAttr.height,
                       gl.LUMINANCE, gl.UNSIGNED_BYTE, imageAttr.data);
    }
          
    function render(time) {
      if (imageWidth) {
        var srcX = destColumn;
        var srcY = 0;
        var srcWidth  = imageWidth - destColumn;
        var srcHeight = imageHeight;

        var dstX = destColumn * gl.canvas.width / imageWidth;
        var dstY = 0;
        var dstWidth  = srcWidth * gl.canvas.width / imageWidth;
        var dstHeight = gl.canvas.height;

        var texWidth     = imageWidth;
        var texHeight    = imageHeight;
        var targetWidth  = gl.canvas.width;
        var targetHeight = gl.canvas.height;

        drawImageWithRotation(
          time * 0.001,
          tex, texWidth, texHeight,  
          srcX, srcY, srcWidth, srcHeight,
          dstX, dstY, dstWidth, dstHeight,
          targetWidth, targetHeight);
      }
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
          

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
    function drawImageWithRotation(
        rotation,
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
        
      // convert from pixels to clipspace
      m4.ortho(0, targetWidth, targetHeight, 0, -1, 1, mat);
          
      // rotate around center of canvas
      m4.translate(mat, [targetWidth / 2, targetHeight / 2, 0], mat);
      m4.rotateZ(mat, rotation, mat);
      m4.translate(mat, [-targetWidth / 2, -targetHeight / 2, 0], mat);
          
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
      twgl.drawBufferInfo(gl, bufferInfo);
      
    }


    // =====================================================================
    // Everything below this line represents stuff from the server.
    // so it's irrelevant to the answer
    //

    function simulateSendingAnImageNColumnsAtATime(minColumnsPerChunk, maxColumnsPerChunk, callback) {
      var imageData = createImageToSend(640, 480);
      
      // cut data into columns at start because this work would be done on
      // the server
      var columns = [];
      var x = 0;
      while (x < imageData.width) {
        // how many columns are left?
        var maxWidth = imageData.width - x;
        
        // how many columns should we send
        var columnWidth = Math.min(maxWidth, rand(minColumnsPerChunk, maxColumnsPerChunk + 1));
        
        var data = createImageChunk(imageData, imageData.width - x - columnWidth, 0, columnWidth, imageData.height);    
        
        columns.push({
          newImage: x === 0,
          lines: columnWidth,
          width: imageData.width,
          height: imageData.height,
          data: data,
        });
        
        x += columnWidth;
      }
      
      var columnNdx = 0;
      sendNextColumn();
      
      function sendNextColumn() {
        if (columnNdx < columns.length) {
          callback(columns[columnNdx++]);
          if (columnNdx < columns.length) {
            // should we make this random to siumlate network speed
            var timeToNextChunkMS = 17;
            setTimeout(sendNextColumn, timeToNextChunkMS);
          }
        }
      }
    }

    function createImageChunk(imageData, x, y, width, height) {
      var data = new Uint8Array(width * height);
      for (var yy = 0; yy < height; ++yy) {
        for (var xx = 0; xx < width; ++xx) {
          var srcOffset = ((yy + y) * imageData.width + xx + x) * 4;
          var dstOffset = yy * width + xx;
          // compute gray scale
          var gray = Math.max(imageData.data[srcOffset], imageData.data[srcOffset + 1], imageData.data[srcOffset + 2]);
          data[dstOffset] = gray;
        }
      }
      return data;
    }

    function rand(min, max) {
      return Math.floor(Math.random() * max - min) + min;
    }

    function createImageToSend(width, height) {
      // create a texture using a canvas so we don't have to download one
      var ctx = document.createElement("canvas").getContext("2d");
      ctx.width = width;
      ctx.height = height;
      ctx.fillStyle = "#222";
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.lineWidth = 20;
      ["#AAA", "#888", "#666"].forEach(function(color, ndx, array) {
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.arc((ndx + 1) / (array.length + 1) * ctx.canvas.width, ctx.canvas.height / 2,
                ctx.canvas.height * 0.4, 0, Math.PI * 2, false);
        ctx.stroke();
      });
      ctx.fillStyle = "white";
      ctx.font = "40px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Some Image", ctx.canvas.width / 2, ctx.canvas.height / 2);
      return ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>
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





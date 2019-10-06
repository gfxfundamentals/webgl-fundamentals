Title: How to implement a scrolling texture in WebGL?
Description:
TOC: qna

# Question:

I have gone through [this](http://www.studyjs.com/webgl/texture.html) as a example on how to render a normal texture to a canvas using WebGL and successfully implemented it.

Now I am trying to implement a scrolling image where I am getting line by line pixel data from another machine in the same network via Ajax Polling or Websockets and have to render the same using WebGL to canvas.

So, now I know we can easily render 60 frames per second which means if I get 50 lines of pixel data per second from another computer in the network ,I should be easily able to render them without any jerks.

I am able to do pixel by pixel transfer using CPU(javascript),where I render 1st line of data ,and on receiving second line of data ,I move 1st line of pixel data to 2nd and render the new line to the first line . This works but I am unable to see a smooth scrolling , I have also tried to use gl.texSubImage2D by keeping all line data in a single Array and looping through it on getting a new line ,but it also doesn't work as expected.

Basically ,what I am looking for is I will get 1 line of pixel data from another pc in the network and then I will render that as 1st line of the texture ,then when I receive the second line , then the GPU should move the 1st line of pixel data to second line and after I render the 1st new line of pixel data received via network ,I will render the first line by calling gl.texSubImage2D and call gl.drawArrays to make sure we are rendering without any jerks. This should happen until the end of texture, so GPU takes care of moving the pixels and CPU takes care of sending new line of pixel data to GPU.

So, in this way GPU will take care of moving the pixels to accomplish a scrolling image ,instead of CPU doing it and hanging the browser.

I have also gone through https://stackoverflow.com/questions/10249469/what-is-the-most-efficient-way-of-moving-multiple-objects-stored-in-vbo-in-spa
 and 
https://www.opengl.org/discussion_boards/showthread.php/136155-Scrolling-textures

But still a little confused on how to implement it exactly.
Any suggestions?

# Answer

You have asked this same question 4 times already. [Here](https://stackoverflow.com/questions/35649175/how-to-increase-performance-using-webgl), [here](https://stackoverflow.com/questions/35766596/unable-to-render-image-using-webgl), [here](https://stackoverflow.com/questions/35649175/how-to-increase-performance-using-webgl), and [here](https://stackoverflow.com/questions/35548762/how-to-stream-multiple-images-via-a-arraybuffer-in-html5-canvas-and-webgl-with-c).

An working answer was already given [here](https://stackoverflow.com/a/35666303/128511). 

It basically showed that while you can render at 60fps you are unlikely to be able to receive data at 60fps. It also showed there's **NO REASON TO MOVE THE DATA**. Why create more work for yourself?

You apparently want an infinitely scrolling display. First off, as I already pointed out, there's no guarantee your data will arrive fast enough. The user might be on a slow connection or might be using the connection for something else (netflix, youtube, torrents).

So you can't assume you'll have enough data to constantly scroll.

Here's [the same answer I gave you before](https://stackoverflow.com/a/35666303/128511) slightly modified for infinite data 

Notes: It assumes 1 column is added to the texture per frame. All it does is keep writing a column into the texture. So imagine there are only 8 columns in the texture. The first frame the texture looks like this with only 1 column of data

     [1.......]

It then draws this using 2 draw calls for the same texture drawing just the first column on the right and the rest of the texture on the left.

     [.......][1]

Next frame the texture looks like this with 2 columns of data

     [12......]

And it draws these 2 parts

     [......][12]

When the the 9th column of data comes in (our texture is only 8 columns large) we replace the 1st column so the texture looks like this

     [92345678]

We then draw this with 2 draw calls

     [2345678][9]

Repeat this forever and it will look like an infinite scrolling texture.

The code pretends it's receiving an infinite set of data by calling `getNextLineData`. `getNextLineData` just generates a new column of data. That function would need to be replaced by something that receives data from the network.

If you really want this to work though you're going to have to deal with network issues. You're going to have to decide what to do when the network is slow. Do you stop scrolling? Do you keep scrolling with blank data? Repeating the same data? What?

Similarly the network could be fast. If you start receiving data too fast what do you do? Draw extra columns? Scroll faster? I'd guess you probably want to cache the data but only use 1 column of it per frame so you'd need a list of columns. `getNextLineData` would pull off the oldest column and your network code would add columns of data.

You mentioned ECG though. If you need the data to be live then you wouldn't want to cache the data, you'd want to show as much of it as you received each frame. The simplest way would be to call `getNextLineData` until you run out of data.

Also note nothing about this example requires WebGL. You could just as easily do it with canvas 2d. Create one canvas to be the "texture". Update a column per frame using `ctx.putImageData` then call `ctx2.drawImage` into a separate canvas calls similar to the 2 `drawImage` calls in this WebGL example

<!-- begin snippet: js hide: false -->

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
          
    // make the texture the same size as the canvas just to make it easy
    var texWidth = gl.canvas.width;
    var texHeight = gl.canvas.height;
          
    // we're only using 1 texture so just make and bind it now
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
          gl.TEXTURE_2D, 0, gl.LUMINANCE, texWidth, texHeight, 0, 
          gl.LUMINANCE, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
          
    var destColumn = 0;
          
    // We're using 1 byte wide texture pieces so we need to 
    // set UNPACK_ALIGNMENT to 1 as it defaults to 4
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
                
    function addLineToTexture(lineData) {
      gl.texSubImage2D(gl.TEXTURE_2D, 0, destColumn, 0, 1, texHeight,
                       gl.LUMINANCE, gl.UNSIGNED_BYTE, lineData);
          
      // advance column and wrap back to 0
      destColumn = (destColumn + 1) % texWidth;
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
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.setUniforms(programInfo, uniforms);
      twgl.drawBufferInfo(gl, gl.TRIANGLES, bufferInfo);
      
    }

    // Scroll constantly
      
    function render() {
      addLineToTexture(getNextLineData());
      
      function drawFirstPart() {
        var srcX = 0;
        var srcY = 0;
        var srcWidth  = destColumn;
        var srcHeight = texHeight;

        var dstX = texWidth - destColumn;
        var dstY = 0;
        var dstWidth  = destColumn;
        var dstHeight = texHeight;

        var targetWidth  = gl.canvas.width;
        var targetHeight = gl.canvas.height;

        drawImage(
          tex, texWidth, texHeight,  
          srcX, srcY, srcWidth, srcHeight,
          dstX, dstY, dstWidth, dstHeight,  
          targetWidth, targetHeight);
      }

      function drawSecondPart() {
        var srcX = destColumn;
        var srcY = 0;
        var srcWidth  = texWidth - destColumn + 1;
        var srcHeight = texHeight;

        var dstX = 0;
        var dstY = 0;
        var dstWidth  = texWidth - destColumn + 1;
        var dstHeight = texHeight;

        var targetWidth  = gl.canvas.width;
        var targetHeight = gl.canvas.height;

        drawImage(
          tex, texWidth, texHeight,  
          srcX, srcY, srcWidth, srcHeight,
          dstX, dstY, dstWidth, dstHeight,
          targetWidth, targetHeight);
      }

      drawFirstPart();
      drawSecondPart();
      
      requestAnimationFrame(render);
    }
    render();
      
      
    // =====================================================================
    // Everything below this line represents stuff from the server.
    // so it's mostly irrelevant to the answer
    // this code just generates endless data

    var count = 0;
    var data;

    function getNextLineData() {
      if (!data) {
        data = new Uint8Array(texHeight);
      }
      
      ++count;
      for (var ii = 0; ii < data.length; ++ii) {
        data[ii] = 0;
      }
      addPoint(count, 0.010, 255, data);
      addPoint(count, 0.031, 240, data);
      addPoint(count, 0.023, 220, data);
      addPoint(count, 0.013, 200, data);
      
      return data;
    }

    function addPoint(count, mult, value, data) {
      var s = Math.floor((Math.sin(count * mult) * 0.5 + 0.5) * (data.length - 1));
      data[s] = value;
    }

<!-- language: lang-css -->

    canvas { border: 1px solid red; }

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
    <canvas id="c" width="500" height="150"></canvas>

<!-- end snippet -->



Title: How to maintain aspect ratio in case of rendering images using texture2D in WebGL to canvas?
Description:
TOC: qna

# Question:

I have a image of width * height = 1442 * 1303,
I am able to read them and render to canvas successfully via webgl's texture2D.

In client side ,I am having a arraybuffer that gets the image data which is of size = width*height*4.

So, How to maintain aspect ratio of the image when my canvas width and height is window.innerWidth*0.90 and window.innerHeight*0.90.

Also, I have to directly render using arraybuffer via WEBGL 2dTexture so, I can't use any 2d canvs API such as drawImage. Please suggest something.

# Answer

There's literally a million answers to this question.

First there's the size of your image, then the size you decide to draw it, and the size of the canvas, followed by the size the canvas is displayed. There's the positions of the vertices your using as well which could be anything.

[See this article on WebGL](http://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html) which points out that WebGL uses clip space coordinates (-1 to +1) and [this article points out that the size a canvas is displayed is separate from its resolution](http://webglfundamentals.org/webgl/lessons/webgl-anti-patterns.html).

Let's assume you want to draw the image as large as possible and fit it to the canvas.

So first let's look up the size the canvas is being displayed

    var canvasDisplayWidth  = gl.canvas.clientWidth;
    var canvasDisplayHeight = gl.canvas.clientHeight;

Let's assume we want to draw the image as large as possible so
first try fitting the width to the canvas

    var imageDisplayWidth  = canvasDisplayWidth;
    var imageDisplayHeight = img.height * imageDisplayWidth / img.width;

Now let's check if it fit? If not let's use the height

    if (imageDrawHeight > canvasDisplayHeight) { 
      imageDisplayHeight = canvasDisplayHeight;
      imageDisplayWidth  = img.width * imageDisplayHeight / img.height;
    }

Now we need to convert `imageDisplayWidth` and `imageDisplayHeight` to the size of pixels in the canvas. Note: If the canvas is being displayed the same size
as the its resolution you can skip this step as the display size and the draw size will be the same.

    // make our image take into account the pixel aspect
    var canvasPixelsAcrossPerDisplayPixel = gl.canvas.width  / canvasDisplayWidth;
    var canvasPixelsDownPerDisplayPixel   = gl.canvas.height / canvasDisplayHeight;

    var imageDrawWidth  = imageDisplayWidth  * canvasPixelsAcrossPerDisplayPixel;
    var imageDrawHeight = imageDisplayHeight * canvasPixelsDownPerDisplayPixel;     

Now we need to convert that to clip space

    var clipWidth  = imageDrawWidth  / canvas.width;
    var clipHeight = imageDrawHeight / canvas.height;

Now, given a unit quad we can just scale it to fit that size.

    var m = m4.identity();

    // convert our square unit quad match the size we want
    m4.scale(m, [clipWidth, clipHeight, 1], m);

    // move our unit square from 0,0 (the center) to the bottom, top corner
    m4.translate(m, [-1, 1, 0], m);

    // scale our unit sqaure to cover the clip space
    m4.scale(m, [2, -2, 1], m); 

Now can draw with that matrix and our unit quad

<!-- begin snippet: js hide: true -->

<!-- language: lang-js -->

    var m4 = twgl.m4;
    var gl = twgl.getWebGLContext(document.getElementById("c"));
    var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

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

    // Lets make a texture using a 2d canvas
    // There's a circle in the middle. If our
    // code is correct it will be a circle when
    // drawn (not an oval or ellipse)
    var ctx = document.createElement("canvas").getContext("2d");
    ctx.canvas.width = 100;
    ctx.canvas.height = 75;
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = "blue";
    ctx.fillRect(10, 10, ctx.canvas.width - 20, ctx.canvas.height - 20);
    ctx.strokeStyle = "yellow";
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.arc(
      ctx.canvas.width / 2, ctx.canvas.height / 2,
      Math.min(ctx.canvas.width, ctx.canvas.height) / 2 - 20,
      0, Math.PI * 2, false);
    ctx.stroke();

    var img = ctx.canvas;
          
    var tex = twgl.createTexture(gl, {
      src: img,
    });

    var canvasDisplayWidth  = gl.canvas.clientWidth;
    var canvasDisplayHeight = gl.canvas.clientHeight;

    // Let's assume we want to draw the image as large as possible so
    // first try fitting the width to the canvas

    var imageDisplayWidth  = canvasDisplayWidth;
    var imageDisplayHeight = img.height * imageDisplayWidth / img.width;

    // Now let's check if it fit? If not let's use the height
    if (imageDisplayHeight > canvasDisplayHeight) { 
      imageDisplayHeight  = canvasDisplayHeight;
      imageDisplayWidth   = img.width * imageDisplayHeight / img.height;
    }
          
    // Now we need to convert `imageDisplayWidth` and `imageDisplayHeight` to the size of pixels
    // in the canvas. Note: If the canvas is being displayed the same size
    // as the its resolution you can skip this step

    var canvasPixelsAcrossPerDisplayPixel = gl.canvas.width  / canvasDisplayWidth;
    var canvasPixelsDownPerDisplayPixel   = gl.canvas.height / canvasDisplayHeight;

    var imageDrawWidth  = imageDisplayWidth  * canvasPixelsAcrossPerDisplayPixel;
    var imageDrawHeight = imageDisplayHeight * canvasPixelsDownPerDisplayPixel;     

    // Now we need to convert that to clip space

    var clipWidth  = imageDrawWidth  / gl.canvas.width;
    var clipHeight = imageDrawHeight / gl.canvas.height;

    // Now, given a unit quad we can just scale it to fit that size.
    var m = m4.identity();

    // convert our square unit quad to something to match the image's aspect
    m4.scale(m, [clipWidth, clipHeight, 1], m);

    // move our unit square from 0,0 (the center) to the bottom, left corner
    m4.translate(m, [-1, 1, 0], m);

    // scale our unit square to cover the clip space
    m4.scale(m, [2, -2, 1], m); 

    var uniforms = {
      texture: tex,
      matrix: m,
    };

    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    twgl.setUniforms(programInfo, uniforms);
    twgl.drawBufferInfo(gl, gl.TRIANGLES, bufferInfo);

<!-- language: lang-html -->

    <script id="vs" type="notjs">
    attribute vec4 position; 

    uniform mat4 matrix; 
    varying vec2 v_texcoord; 

    void main() {
      gl_Position = matrix * position; 
      
      // using position since we know it's a unit quad 
      v_texcoord = position.xy;
    }
    </script>
    <script id="fs" type="notjs">
    precision mediump float; 

    uniform sampler2D texture; 

    varying vec2 v_texcoord; 

    void main() { 
      gl_FragColor = texture2D(texture, v_texcoord); 
    }
    </script>
    <script src="https://twgljs.org/dist/twgl-full.min.js"></script>
    <canvas id="c" width="50" height="100" style="width: 300px; height: 150px; border: 1px solid black;"></canvas>

<!-- end snippet -->



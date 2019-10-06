Title: Load image, scale, then overlap - badge an image
Description:
TOC: qna

# Question:

All my current code is in a worker. I now have the need for a simple graphics issue. I have two square images with known width/height. I need to take the first and draw it at 64x64, then take the second and draw it at 16x16 and position at the bottom right corner. The final image is 64x64. I am basically trying to make the 2nd image a badge on the first image.

So now this is piece of cake in 2d canvas, however I cannot (for some reasons) do communication with the doc, I have to do this all in canvas, in Firefox we have support since Firefox 44 (last year) for webgl canvas. So I am trying to get this done in that.

Here is what I put together from around the web. My `drawImage` method is what needs to work properly I set it up to take arguments but I remove all my code that was respecting it, because it was really breaking things. I have to edit the `vec4` second arg for scaling (for instance `1.5` will make it scale to half the size), but I am not able to figure out how to position.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function doit() {
     var img, tex, vloc, tloc, vertexBuff, texBuff;

     var cvs3d = document.getElementById('cvs');
     var ctx3d = cvs3d.getContext('experimental-webgl');
     var uLoc;

     // create shaders
     var vertexShaderSrc =
      'attribute vec2 aVertex;' +
      'attribute vec2 aUV;' +
      'varying vec2 vTex;' +
      'uniform vec2 pos;' +
      'void main(void) {' +
      '  gl_Position = vec4(aVertex + pos, 0.0, 1.0);' +
      '  vTex = aUV;' +
      '}';

     var fragmentShaderSrc =
      'precision highp float;' +
      'varying vec2 vTex;' +
      'uniform sampler2D sampler0;' +
      'void main(void){' +
      '  gl_FragColor = texture2D(sampler0, vTex);' +
      '}';

     var vertShaderObj = ctx3d.createShader(ctx3d.VERTEX_SHADER);
     var fragShaderObj = ctx3d.createShader(ctx3d.FRAGMENT_SHADER);
     ctx3d.shaderSource(vertShaderObj, vertexShaderSrc);
     ctx3d.shaderSource(fragShaderObj, fragmentShaderSrc);
     ctx3d.compileShader(vertShaderObj);
     ctx3d.compileShader(fragShaderObj);

     var progObj = ctx3d.createProgram();
     ctx3d.attachShader(progObj, vertShaderObj);
     ctx3d.attachShader(progObj, fragShaderObj);

     ctx3d.linkProgram(progObj);
     ctx3d.useProgram(progObj);

     ctx3d.viewport(0, 0, 64, 64);

     vertexBuff = ctx3d.createBuffer();
     ctx3d.bindBuffer(ctx3d.ARRAY_BUFFER, vertexBuff);
     ctx3d.bufferData(ctx3d.ARRAY_BUFFER, new Float32Array([-1, 1, -1, -1, 1, -1, 1, 1]), ctx3d.STATIC_DRAW);

     texBuff = ctx3d.createBuffer();
     ctx3d.bindBuffer(ctx3d.ARRAY_BUFFER, texBuff);
     ctx3d.bufferData(ctx3d.ARRAY_BUFFER, new Float32Array([0, 1, 0, 0, 1, 0, 1, 1]), ctx3d.STATIC_DRAW);

     vloc = ctx3d.getAttribLocation(progObj, 'aVertex');
     tloc = ctx3d.getAttribLocation(progObj, 'aUV');
     uLoc = ctx3d.getUniformLocation(progObj, 'pos');

     var drawImage = function(imgobj, x, y, w, h) {
      tex = ctx3d.createTexture();
      ctx3d.bindTexture(ctx3d.TEXTURE_2D, tex);
      ctx3d.texParameteri(ctx3d.TEXTURE_2D, ctx3d.TEXTURE_MIN_FILTER, ctx3d.NEAREST);
      ctx3d.texParameteri(ctx3d.TEXTURE_2D, ctx3d.TEXTURE_MAG_FILTER, ctx3d.NEAREST);
      ctx3d.texImage2D(ctx3d.TEXTURE_2D, 0, ctx3d.RGBA, ctx3d.RGBA, ctx3d.UNSIGNED_BYTE, imgobj);

      ctx3d.enableVertexAttribArray(vloc);
      ctx3d.bindBuffer(ctx3d.ARRAY_BUFFER, vertexBuff);
      ctx3d.vertexAttribPointer(vloc, 2, ctx3d.FLOAT, false, 0, 0);

      ctx3d.enableVertexAttribArray(tloc);
      ctx3d.bindBuffer(ctx3d.ARRAY_BUFFER, texBuff);
      ctx3d.bindTexture(ctx3d.TEXTURE_2D, tex);
      ctx3d.vertexAttribPointer(tloc, 2, ctx3d.FLOAT, false, 0, 0);

      ctx3d.drawArrays(ctx3d.TRIANGLE_FAN, 0, 4);
     };

     img = new Image();
     img.src = 'data:image/png;base64,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';

     img.onload = function() {
      console.log('drawing base image now');
      drawImage(this, 0, 0, 64, 64);

      var img2 = new Image();
      img2.src = 'data:image/png;base64,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';
      img2.onload = function() {
        drawImage(img2, 64-16, 64-16, 16, 16); // draw in bottom right corner
      }
     };
    }

    window.onload = function() {
     doit();
    }


<!-- language: lang-css -->

    #cvs {
      border: 1px solid red;
    }

<!-- language: lang-html -->

    <canvas id="cvs" width=64 height=64></canvas>

<!-- end snippet -->

# Answer

There's a million answers to this question because *WebGL is a rasterization library*

So for example

1. You could adjust the viewport

2. You could add a `uniform vec2 scale` on top of your `pos` since without a scale you can't make the quad smaller/larger

3. You could update the vertices before drawing.

4. You could multiply `aVertex` by a `uniform mat3 matrix` which would let you arbitrarily position, scale, and rotate

5. You could multiply `aVertex` by a `uniform mat4 matrix` which would let you arbitrarily position, scale, rotate, and project into 3d

...etc...

5 is this the standard solution because it's the most flexible. [This article goes over using a `mat3`](http://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html) and shows your method before it and why using a matrix is a far better choice, it then expands on that to a `mat4` for doing full 3d.

So it's not clear what you want. Do you want to learn the "good way" (#5) or do you just want your code to work with as few changes as possible.

Just for fun here's #1

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    function doit() {
      var img, tex, vloc, tloc, vertexBuff, texBuff;

      var cvs3d = document.getElementById('cvs');
      var ctx3d = cvs3d.getContext('experimental-webgl', { 
        preserveDrawingBuffer: true, 
      });
      var uLoc;

      // create shaders
      var vertexShaderSrc =
          'attribute vec2 aVertex;' +
          'attribute vec2 aUV;' +
          'varying vec2 vTex;' +
          'uniform vec2 pos;' +
          'void main(void) {' +
          '  gl_Position = vec4(aVertex + pos, 0.0, 1.0);' +
          '  vTex = aUV;' +
          '}';

      var fragmentShaderSrc =
          'precision highp float;' +
          'varying vec2 vTex;' +
          'uniform sampler2D sampler0;' +
          'void main(void){' +
          '  gl_FragColor = texture2D(sampler0, vTex);' +
          '}';

      var vertShaderObj = ctx3d.createShader(ctx3d.VERTEX_SHADER);
      var fragShaderObj = ctx3d.createShader(ctx3d.FRAGMENT_SHADER);
      ctx3d.shaderSource(vertShaderObj, vertexShaderSrc);
      ctx3d.shaderSource(fragShaderObj, fragmentShaderSrc);
      ctx3d.compileShader(vertShaderObj);
      ctx3d.compileShader(fragShaderObj);

      var progObj = ctx3d.createProgram();
      ctx3d.attachShader(progObj, vertShaderObj);
      ctx3d.attachShader(progObj, fragShaderObj);

      ctx3d.linkProgram(progObj);
      ctx3d.useProgram(progObj);

      vertexBuff = ctx3d.createBuffer();
      ctx3d.bindBuffer(ctx3d.ARRAY_BUFFER, vertexBuff);
      ctx3d.bufferData(ctx3d.ARRAY_BUFFER, new Float32Array([-1, 1, -1, -1, 1, -1, 1, 1]), ctx3d.STATIC_DRAW);

      texBuff = ctx3d.createBuffer();
      ctx3d.bindBuffer(ctx3d.ARRAY_BUFFER, texBuff);
      ctx3d.bufferData(ctx3d.ARRAY_BUFFER, new Float32Array([0, 1, 0, 0, 1, 0, 1, 1]), ctx3d.STATIC_DRAW);

      vloc = ctx3d.getAttribLocation(progObj, 'aVertex');
      tloc = ctx3d.getAttribLocation(progObj, 'aUV');
      uLoc = ctx3d.getUniformLocation(progObj, 'pos');

      var drawImage = function(imgobj, x, y, w, h) {
        tex = ctx3d.createTexture();
        ctx3d.bindTexture(ctx3d.TEXTURE_2D, tex);
        ctx3d.texParameteri(ctx3d.TEXTURE_2D, ctx3d.TEXTURE_MIN_FILTER, ctx3d.NEAREST);
        ctx3d.texParameteri(ctx3d.TEXTURE_2D, ctx3d.TEXTURE_MAG_FILTER, ctx3d.NEAREST);
        ctx3d.texImage2D(ctx3d.TEXTURE_2D, 0, ctx3d.RGBA, ctx3d.RGBA, ctx3d.UNSIGNED_BYTE, imgobj);

        ctx3d.enableVertexAttribArray(vloc);
        ctx3d.bindBuffer(ctx3d.ARRAY_BUFFER, vertexBuff);
        ctx3d.vertexAttribPointer(vloc, 2, ctx3d.FLOAT, false, 0, 0);

        ctx3d.enableVertexAttribArray(tloc);
        ctx3d.bindBuffer(ctx3d.ARRAY_BUFFER, texBuff);
        ctx3d.bindTexture(ctx3d.TEXTURE_2D, tex);
        ctx3d.vertexAttribPointer(tloc, 2, ctx3d.FLOAT, false, 0, 0);

        ctx3d.viewport(x, y, w, h);
        ctx3d.drawArrays(ctx3d.TRIANGLE_FAN, 0, 4);
      };

      img = new Image();
      img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAnUlEQVR42u3byQ3AIAwEQKpPH2kkrZE0wCEQR8RY2i/Y8/IDQowx9OSruDjZKvYPAAAAAAAAAGge8L6epekFAgAAAAAAAE4G2H3AGUAAAAAAAAAAgDaA0YCj+wMAAAAAAAAAWIQAAAAAAAAAAPMXmQ3uBwAAAAAAAE4G+PX7gYr+Qi4AAAAAAAAAgHRVHLD0w0SpPwAAAAAAAABAMi8E/hnSV9Q3nQAAAABJRU5ErkJggg==';

      img.onload = function() {
        console.log('drawing base image now');
        drawImage(this, 0, 0, 64, 64);

        var img2 = new Image();
        img2.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAnUlEQVR42u3byQ3AIAwEQKpPH2kkrZE0wCEQR8RY2i/Y8/IDQowx9OSruDjZKvYPAAAAAAAAAGge8L6epekFAgAAAAAAAE4G2H3AGUAAAAAAAAAAgDaA0YCj+wMAAAAAAAAAWIQAAAAAAAAAAPMXmQ3uBwAAAAAAAE4G+PX7gYr+Qi4AAAAAAAAAgHRVHLD0w0SpPwAAAAAAAABAMi8E/hnSV9Q3nQAAAABJRU5ErkJggg==';
        img2.onload = function() {
          drawImage(img2, 64-16, 64-16, 16, 16); // draw in bottom right corner
        }
      };
    }

    window.onload = function() {
      doit();
    }

<!-- language: lang-css -->

    #cvs {
      border: 1px solid red;
    }

<!-- language: lang-html -->

    <canvas id="cvs" width=64 height=64></canvas>

<!-- end snippet -->

Note that WebGL, by default, clears the canvas the next time you render so the fact that you're rendering twice, once after each image loads, means you're only going to end up with the 2nd result. To prevent that you need to pass `{ preserveDrawingBuffer: true, }` as the second parameter to `getContext`.

I gotta be honest, this feels like a "do my homework for me question". Like did you even look up a single article on WebGL? I suppose I should give you the benefit of the doubt but there's so much here.

Do you know [WebGL only cares about clip space coordinates](http://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html)?

Do you know WebGL -1 is at the bottom and +1 is at the top?

Do you know [WebGL can't draw non-power of 2 images](http://webglfundamentals.org/webgl/lessons/webgl-3d-textures.html) unless you set various texture parameters? Your example works because the image is 64x64 but if it was 65x64 it would fail.

So that brings up more questions. 

The textures are upside down. Again, it's up to you to decide how to fix them.

You could

1. Flip your texture coordinates

2. Load the texture flipped with `gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);`

3. Use a negative scale (assuming you go with solution #2 above). That will complicate your `pos` settings

4. Adjust your texture coordinates in your shader

5. Negate gl_Position.y in your shader

6. Use solutions #4 (mat3) or #5 (mat4) above and create a projection matrix makes flips the space.

..etc...

Again the matrix solutions are the best solutions and you should really go read the articles I posted.



That said, hacking your current code in the #2 solution

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    function doit() {
      var img, tex, vloc, tloc, sloc, vertexBuff, texBuff;

      var cvs3d = document.getElementById('cvs');
      var ctx3d = cvs3d.getContext('experimental-webgl', { 
        preserveDrawingBuffer: true, 
      });
      var uLoc;

      // create shaders
      var vertexShaderSrc = `
          attribute vec2 aVertex;
          attribute vec2 aUV;
          varying vec2 vTex;
          uniform vec2 pos;
          uniform vec2 scale; 
          void main(void) {
            gl_Position = vec4(aVertex * scale + pos, 0.0, 1.0);
            vTex = aUV;
          }`;

      var fragmentShaderSrc = `
          precision highp float;
          varying vec2 vTex;
          uniform sampler2D sampler0;
          void main(void){
            gl_FragColor = texture2D(sampler0, vTex);
          }`;

      var vertShaderObj = ctx3d.createShader(ctx3d.VERTEX_SHADER);
      var fragShaderObj = ctx3d.createShader(ctx3d.FRAGMENT_SHADER);
      ctx3d.shaderSource(vertShaderObj, vertexShaderSrc);
      ctx3d.shaderSource(fragShaderObj, fragmentShaderSrc);
      ctx3d.compileShader(vertShaderObj);
      ctx3d.compileShader(fragShaderObj);

      var progObj = ctx3d.createProgram();
      ctx3d.attachShader(progObj, vertShaderObj);
      ctx3d.attachShader(progObj, fragShaderObj);

      ctx3d.linkProgram(progObj);
      ctx3d.useProgram(progObj);

      vertexBuff = ctx3d.createBuffer();
      ctx3d.bindBuffer(ctx3d.ARRAY_BUFFER, vertexBuff);
      ctx3d.bufferData(ctx3d.ARRAY_BUFFER, new Float32Array([-1, 1, -1, -1, 1, -1, 1, 1]), ctx3d.STATIC_DRAW);

      texBuff = ctx3d.createBuffer();
      ctx3d.bindBuffer(ctx3d.ARRAY_BUFFER, texBuff);
      ctx3d.bufferData(ctx3d.ARRAY_BUFFER, new Float32Array([0, 1, 0, 0, 1, 0, 1, 1]), ctx3d.STATIC_DRAW);

      vloc = ctx3d.getAttribLocation(progObj, 'aVertex');
      tloc = ctx3d.getAttribLocation(progObj, 'aUV');
      uLoc = ctx3d.getUniformLocation(progObj, 'pos');
      sLoc = ctx3d.getUniformLocation(progObj, 'scale');

      var drawImage = function(imgobj, x, y, w, h) {
        tex = ctx3d.createTexture();
        ctx3d.bindTexture(ctx3d.TEXTURE_2D, tex);
        ctx3d.texParameteri(ctx3d.TEXTURE_2D, ctx3d.TEXTURE_MIN_FILTER, ctx3d.NEAREST);
        ctx3d.texParameteri(ctx3d.TEXTURE_2D, ctx3d.TEXTURE_MAG_FILTER, ctx3d.NEAREST);
        ctx3d.texImage2D(ctx3d.TEXTURE_2D, 0, ctx3d.RGBA, ctx3d.RGBA, ctx3d.UNSIGNED_BYTE, imgobj);

        ctx3d.enableVertexAttribArray(vloc);
        ctx3d.bindBuffer(ctx3d.ARRAY_BUFFER, vertexBuff);
        ctx3d.vertexAttribPointer(vloc, 2, ctx3d.FLOAT, false, 0, 0);

        ctx3d.enableVertexAttribArray(tloc);
        ctx3d.bindBuffer(ctx3d.ARRAY_BUFFER, texBuff);
        ctx3d.bindTexture(ctx3d.TEXTURE_2D, tex);
        ctx3d.vertexAttribPointer(tloc, 2, ctx3d.FLOAT, false, 0, 0);
        
        // convert x, y to clip space (assuming viewport matches canvas size)
        var cx = x / ctx3d.canvas.width * 2 - 1;
        var cy = y / ctx3d.canvas.height * 2 - 1;
        
        // convert w, h to clip space (quad is 2 units big)
        var cw = w / ctx3d.canvas.width;
        var ch = h / ctx3d.canvas.height;
        
        // because the quad centered over 0.0 we have to add in 
        // half the width and height (cw, ch are already half because
        // it's 2 unit quad
        cx += cw;
        cy += ch;
        
        // then we negate cy and ch because webgl -1 is at the bottom
        ctx3d.uniform2f(uLoc, cx, -cy)
        ctx3d.uniform2f(sLoc, cw, -ch);

        ctx3d.drawArrays(ctx3d.TRIANGLE_FAN, 0, 4);
      };

      img = new Image();
      img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAnUlEQVR42u3byQ3AIAwEQKpPH2kkrZE0wCEQR8RY2i/Y8/IDQowx9OSruDjZKvYPAAAAAAAAAGge8L6epekFAgAAAAAAAE4G2H3AGUAAAAAAAAAAgDaA0YCj+wMAAAAAAAAAWIQAAAAAAAAAAPMXmQ3uBwAAAAAAAE4G+PX7gYr+Qi4AAAAAAAAAgHRVHLD0w0SpPwAAAAAAAABAMi8E/hnSV9Q3nQAAAABJRU5ErkJggg==';

      img.onload = function() {
        console.log('drawing base image now');
        drawImage(this, 0, 0, 64, 64);

        var img2 = new Image();
        img2.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAnUlEQVR42u3byQ3AIAwEQKpPH2kkrZE0wCEQR8RY2i/Y8/IDQowx9OSruDjZKvYPAAAAAAAAAGge8L6epekFAgAAAAAAAE4G2H3AGUAAAAAAAAAAgDaA0YCj+wMAAAAAAAAAWIQAAAAAAAAAAPMXmQ3uBwAAAAAAAE4G+PX7gYr+Qi4AAAAAAAAAgHRVHLD0w0SpPwAAAAAAAABAMi8E/hnSV9Q3nQAAAABJRU5ErkJggg==';
        img2.onload = function() {
          drawImage(img2, 64-16, 64-16, 16, 16); // draw in bottom right corner
        }
      };
    }

    doit();

<!-- language: lang-css -->

    #cvs {
      border: 1px solid red;
    }

<!-- language: lang-html -->

    <canvas id="cvs" width=64 height=64></canvas>

<!-- end snippet -->

Personally I'd suggest you [read up on WebGL](http://webglfundamentals.org) including [how to implement `drawImage`](http://webglfundamentals.org/webgl/lessons/webgl-2d-drawimage.html) and [how to create a matrix stack](http://webglfundamentals.org/webgl/lessons/webgl-2d-matrix-stack.html)

Let me add there's nothing wrong with the `pos` & `scale` solution per se. 4x4 Matrices take up to 64 multiplies to compute and using them in a standard way that drawImage clone does it has to do at least 2 matrix multiplies which so that's 128 number * number multiplies. Whereas the `pos` & `scale` solution only uses 6 multiplies. In other words it's technically faster though unlikely to be a bottleneck.

Another advantage to the `pos` & `scale` solution is it uses only 2 vec2 uniforms (4 floats) whereas the `mat4` matrix solution uses a mat4 (16 floats). Since there's a maximum number of uniforms you can use there might be cases where to squeeze room for other stuff the `pos` & `scale` solution is better. Such is the joy of WebGL, it's up to you to decide which techniques to use

PS: [pngcrush](http://pngcrush.com/) is your friend

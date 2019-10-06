Title: Clipping images in Webgl
Description:
TOC: qna

# Question:

The 2-D canvas provides an api called draw image :
context.drawImage(img,sx,sy,swidth,sheight,x,y,width,height);
where **sx** is the position from where the **image clipping** starts .

http://www.w3schools.com/tags/canvas_drawimage.asp,

I am trying to use webgl to render a 2D image using **texImage2D**. i wanted to check if there is a way to **implement clipping with webgl**.

I am using the following tutorial to render 2d images with webgl.
http://webglfundamentals.org/webgl/lessons/webgl-image-processing.html

Original Image: 


![Original Image][1]

Clipping with drawImage(2D):


![enter image description here][2]


Clipping with webgl: 


![enter image description here][3]


<!-- begin snippet: js hide: false -->

<!-- language: lang-js -->

    var gl,program,positionLocation,originalImageTexture,canvas;
    var x = 10;
    var y = 20;
    function setupWebGL(){

     var canvas = document.getElementById("canvas");
     gl = canvas.getContext("webgl");
       if (!gl) {
         return;
       }
       // setup GLSL program
       var program = createProgramFromScripts(gl, ["2d-vertex-shader", "2d-fragment-shader"]);
       gl.useProgram(program);
       // look up where the vertex data needs to go.
       positionLocation = gl.getAttribLocation(program, "a_position");
      texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
       var texture = gl.createTexture();
       gl.bindTexture(gl.TEXTURE_2D, texture);
      
       // lookup uniforms
       var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
       textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");
       colorLocation = gl.getUniformLocation(program, "u_color");
        // set the resolution
       gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      
       // Set the parameters so we can render any size image.
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);


       gl.enable(gl.BLEND);
       gl.blendEquation( gl.FUNC_ADD );
       gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
       gl.disable(gl.DEPTH_TEST);
    }

        function draw() {
        // use canvas to simulate an image
       var image = document.createElement("canvas");
        document.body.appendChild(image); // so we can see the source image
        image.width  = 200;
        image.height = 150;
        var ctx   = image.getContext("2d");
        ctx.fillRect(0, 0, image.width, image.height);
        for (var py = 0; py < image.height; py += 25) {
          for (var px = 0; px < image.width; px += 25) {
            ctx.fillStyle = "rgb(" + (py / image.height * 255 | 0) + "," + 
                                     (px / image.width  * 255 | 0) + "," + 
                                      255 + ")";
            ctx.beginPath();
            ctx.arc(px + 12, py + 12, 10, 0, Math.PI * 2);
            ctx.fill();
          }
        }
          
       setupWebGL();
          
        var srcX = 12;
        var srcY = 35;
        var srcWidth = 75;
        var srcHeight = 50;
          
        var dstX = 100;
        var dstY = 110;
        var dstWidth  = srcWidth;
        var dstHeight = srcHeight;
        
        var u0 = 50 / image.width;
        var v0 = 0 / image.height;
        var u1 = (50 + image.width) / image.width;
        var v1 = (0 + image.height) / image.height;
          
       // provide texture coordinates for the rectangle.
       var texCoordBuffer = gl.createBuffer();
       gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
       gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([u0, v0, u1,v0, u0,v1, u0,v1, u1,v0, u1,v1]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(texCoordLocation);
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

      
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,gl.RGBA, gl.UNSIGNED_BYTE, image);
      
        // set the size of the image
        gl.uniform2f(textureSizeLocation, image.width, image.height);
        // Create a buffer for the position of the rectangle corners.
        var positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        setRectangle( gl, x, y, image.width, image.height);
        
     
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      
    }

        function setRectangle(gl, x, y, width, height) {
     var x1 = x;
     var x2 = x + width;
     var y1 = y;
     var y2 = y + height;
     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([x1, y1,x2, y1,x1, y2,x1, y2,x2, y1,x2, y2]), gl.STATIC_DRAW);
    }

    draw();

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <canvas width="400" height="300" id="canvas"></canvas>
    <script src="//webglfundamentals.org/webgl/resources/webgl-utils.js"></script>
    <!-- vertex shader -->
    <script id="2d-vertex-shader" type="x-shader/x-vertex">
    attribute vec2 a_position;
    attribute vec2 a_texCoord;

    uniform vec2 u_resolution;

    varying vec2 v_texCoord;

    void main() {
       // convert the rectangle from pixels to 0.0 to 1.0
       vec2 zeroToOne = a_position / u_resolution;

       // convert from 0->1 to 0->2
       vec2 zeroToTwo = zeroToOne * 2.0;

       // convert from 0->2 to -1->+1 (clipspace)
       vec2 clipSpace = zeroToTwo - 1.0;

       gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

       // pass the texCoord to the fragment shader
       // The GPU will interpolate this value between points.
       v_texCoord = a_texCoord;
    }
    </script>
    <!-- fragment shader -->
    <script id="2d-fragment-shader" type="x-shader/x-fragment">
    precision mediump float;

    // our texture
    uniform sampler2D u_image;

    // the texCoords passed in from the vertex shader.
    varying vec2 v_texCoord;

    void main() {
       gl_FragColor = texture2D(u_image, v_texCoord);
    }
    </script>

<!-- end snippet -->


  [1]: http://i.stack.imgur.com/wroi3.png
  [2]: http://i.stack.imgur.com/uhzmH.png
  [3]: http://i.stack.imgur.com/j6t5a.png

# Answer

[You need to adjust the texture coordinates to select the part of the texture you're interested in](http://webglfundamentals.org/webgl/lessons/webgl-3d-textures.html).

Texture coordinates go from 0 to 1 so if you wanted to convert from `drawImage` then given

    drawImage(image, srcX, srcY, srcWidth, srcHeight, 
              dstX, dstY, dstWidth, dstHeight);

In WebGL you'd have to adjust the texcoord using the `src` values and the vertex coordinates of where to draw using the `dst` values.

    u0 = srcX / image.width;
    v0 = srcY / image.height;

    u1 = (srcX + srcWidth) / image.width;
    v1 = (srcY + srcHeight) / image.height;

Now update your texcoords. In the example you linked to

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      u0,  v0,
      u1,  v0,
      u0,  v1,
      u0,  v1,
      u1,  v0,
      u1,  v1]), gl.STATIC_DRAW);

you could also add some math to the shader. Using [the same techniques as the articles starting here](http://webglfundamentals.org/webgl/lessons/webgl-2d-translation.html) you can use math to adjust the texcoordinates in the shader just like those articles are adjusting the positions.

So for example you could leave the UV coordinates going from 0 to 1 like they originally were but update the shader so you can pass in an offset and a scale that multiply them to get them where you want. Or, if you continue with those articles you can use a matrix to manipulate them with more flexibility.

Similarly for the destination size, rather than update the vertices you can use various math in the shader to move a simple unit square around and scale and size to to whatever size you desire.

As for the code you posted this line

    var u1 = (50 + image.width) / image.width;
 
Is basically saying you want to read pixels from the texture 50 pixels past the right edge. That's why you're getting black. 

The second problem is this line

    setRectangle( gl, x, y, image.width, image.height);

Unless you intended to stretch the image your asking for a clipped image (say `image.width - 50`) to be drawn `image.width` pixels, so if your image is 75 pixels your going to get 25 pixels of source stretched to 75 pixels of destination

not sure if that what you wanted. Here's the fixed version
 
Note I used the canvas the make an image because the dataURL made it really painful to edit.

<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->

    var gl,program,positionLocation,originalImageTexture,canvas;
    var x = 10;
    var y = 20;
    function setupWebGL(){

     var canvas = document.getElementById("canvas");
     gl = canvas.getContext("webgl");
       if (!gl) {
         return;
       }
       // setup GLSL program
       var program = webglUtils.createProgramFromScripts(gl, ["2d-vertex-shader", "2d-fragment-shader"]);
       gl.useProgram(program);
       // look up where the vertex data needs to go.
       positionLocation = gl.getAttribLocation(program, "a_position");
      texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
       var texture = gl.createTexture();
       gl.bindTexture(gl.TEXTURE_2D, texture);
      
       // lookup uniforms
       var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
       textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");
       colorLocation = gl.getUniformLocation(program, "u_color");
        // set the resolution
       gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      
       // Set the parameters so we can render any size image.
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);


       gl.enable(gl.BLEND);
       gl.blendEquation( gl.FUNC_ADD );
       gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
       gl.disable(gl.DEPTH_TEST);
    }

        function draw() {
        // use canvas to simulate an image
       var image = document.createElement("canvas");
        document.body.appendChild(image); // so we can see the source image
        image.width  = 200;
        image.height = 150;
        var ctx   = image.getContext("2d");
        ctx.fillRect(0, 0, image.width, image.height);
        for (var py = 0; py < image.height; py += 25) {
          for (var px = 0; px < image.width; px += 25) {
            ctx.fillStyle = "rgb(" + (py / image.height * 255 | 0) + "," + 
                                     (px / image.width  * 255 | 0) + "," + 
                                      255 + ")";
            ctx.beginPath();
            ctx.arc(px + 12, py + 12, 10, 0, Math.PI * 2);
            ctx.fill();
          }
        }
          
       setupWebGL();
          
        var srcX = 50;
        var srcY = 0;
        var srcWidth = image.width - 50;
        var srcHeight = image.height;
          
        var dstX = x;
        var dstY = y;
        var dstWidth  = srcWidth;
        var dstHeight = srcHeight;
        
     var u0 = srcX / image.width;
      var v0 = srcY / image.height;
     var u1 = (srcX + srcWidth)  / image.width;
      var v1 = (srcY + srcHeight) / image.height;
     
       // provide texture coordinates for the rectangle.
       var texCoordBuffer = gl.createBuffer();
       gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
       gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([u0, v0, u1,v0, u0,v1, u0,v1, u1,v0, u1,v1]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(texCoordLocation);
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

      
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,gl.RGBA, gl.UNSIGNED_BYTE, image);
      
        // set the size of the image
        gl.uniform2f(textureSizeLocation, image.width, image.height);
        // Create a buffer for the position of the rectangle corners.
        var positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        setRectangle( gl, dstX, dstY, dstWidth, dstHeight);
       
     
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      
    }

        function setRectangle(gl, x, y, width, height) {
     var x1 = x;
     var x2 = x + width;
     var y1 = y;
     var y2 = y + height;
     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([x1, y1,x2, y1,x1, y2,x1, y2,x2, y1,x2, y2]), gl.STATIC_DRAW);
    }

    draw();

<!-- language: lang-css -->

    canvas { border: 1px solid red; }

<!-- language: lang-html -->

    <canvas width="400" height="300" id="canvas"></canvas>
    <script src="//webglfundamentals.org/webgl/resources/webgl-utils.js"></script>
    <!-- vertex shader -->
    <script id="2d-vertex-shader" type="x-shader/x-vertex">
    attribute vec2 a_position;
    attribute vec2 a_texCoord;

    uniform vec2 u_resolution;

    varying vec2 v_texCoord;

    void main() {
       // convert the rectangle from pixels to 0.0 to 1.0
       vec2 zeroToOne = a_position / u_resolution;

       // convert from 0->1 to 0->2
       vec2 zeroToTwo = zeroToOne * 2.0;

       // convert from 0->2 to -1->+1 (clipspace)
       vec2 clipSpace = zeroToTwo - 1.0;

       gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

       // pass the texCoord to the fragment shader
       // The GPU will interpolate this value between points.
       v_texCoord = a_texCoord;
    }
    </script>
    <!-- fragment shader -->
    <script id="2d-fragment-shader" type="x-shader/x-fragment">
    precision mediump float;

    // our texture
    uniform sampler2D u_image;

    // the texCoords passed in from the vertex shader.
    varying vec2 v_texCoord;

    void main() {
       gl_FragColor = texture2D(u_image, v_texCoord);
    }
    </script>

<!-- end snippet -->

I also wanted to emphasize again this is not usually the way I'd do it. Like I said before for this particular case I'd use a unit square position and a unit square for texcoords. I'd then use to matrixes to translate and offset both. This would let me do all the things the 2D canvas API can do. Scale the image, clip the image, rotate the image, flip the image. It would even let me do things the canvas API can't do like rotate the texture inside the rectangle.


<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->

    var gl,program,positionLocation,originalImageTexture,canvas;
    function setupWebGL(){

     var canvas = document.getElementById("canvas");
     gl = canvas.getContext("webgl");
       if (!gl) {
         return;
       }
       // setup GLSL program
       var program = webglUtils.createProgramFromScripts(gl, ["2d-vertex-shader", "2d-fragment-shader"]);
       gl.useProgram(program);
       // look up where the vertex data needs to go.
       positionLocation = gl.getAttribLocation(program, "a_position");
      texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
       var texture = gl.createTexture();
       gl.bindTexture(gl.TEXTURE_2D, texture);
      
       // lookup uniforms
       matrixLocation = gl.getUniformLocation(program, "u_matrix");
       texMatrixLocation = gl.getUniformLocation(program, "u_texMatrix");
      
       // Set the parameters so we can render any size image.
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

       // provide texture coordinates for the rectangle.
       var texCoordBuffer = gl.createBuffer();
       gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
       gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(texCoordLocation);
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,gl.RGBA, gl.UNSIGNED_BYTE, image);
      
        // Create a buffer for the position of the rectangle corners.
        var positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0 , 1, 1]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

       gl.enable(gl.BLEND);
       gl.blendEquation( gl.FUNC_ADD );
       gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
       gl.disable(gl.DEPTH_TEST);
    }

    var originX, originY, srcX, srcY, srcWidth, srcHeight, dstX, dstY, dstWidth, dstHeight, angleInRadians,texAngle;

    function draw(time) {
        time *= 0.001; // make time in seconds
      
      
        switch (((time / 4) | 0) % 5) {
          case 0:
            originX = 0;
            originY = 0;
            srcX = 50;
            srcY = 0;
            srcWidth = image.width - 50;
            srcHeight = image.height;
          
            dstX = 10;
            dstY = 20;
            dstWidth  = srcWidth;
            dstHeight = srcHeight;
                
            angleInRadians = 0;
            texAngle = 0;
            break;
          case 1:
             // clip it more
             srcX = 50 + Math.sin(time      ) * 20;
             srcY = 50 + Math.sin(time * 1.3) * 20;
             srcWidth  = image.width  - (50 + Math.sin(time      ) * 20) - srcX;
             srcHeight = image.height - (50 + Math.sin(time * 1.3) * 20) - srcY;
             dstWidth  = srcWidth;
             dstHeight = srcHeight;
             break;
          case 2:
            // spin image around top left
            angleInRadians = time;
            break;
          case 3:
            // spin image around center
            angleInRadians = time;
            dstX = 100;
            dstY = 100;
            originX = -srcWidth / 2;
            originY = -srcHeight / 2;
            break;
          case 4:
            // spin texture around center
            texAngle = -time;
            break;
        }
      
          
        var x = dstX;
        var y = dstY;
        // We have a 1 unit square. If will scale by destWidth and destHeight we'll stretch
        // it to the size we want
        var xScale = dstWidth;
        var yScale = dstHeight;
        
        // We also have a 1 unit square for the texcoords. We can scale that to clip
        var texXOff   = srcX      / image.width;
        var texYOff   = srcY      / image.height;
        var texXScale = srcWidth  / image.width;
        var texYScale = srcHeight / image.height;

        // Compute the matrices
        var projectionMatrix = make2DProjection(gl.canvas.clientWidth, gl.canvas.clientHeight);
        var translationMatrix = makeTranslation(x, y);
        var rotationMatrix = makeRotation(angleInRadians);
        var originMatrix = makeTranslation(originX, originY);
        var scaleMatrix = makeScale(xScale, yScale);
      
        // Multiply the matrices.
        var matrix = matrixMultiply(scaleMatrix, originMatrix);
        matrix = matrixMultiply(matrix, rotationMatrix);
        matrix = matrixMultiply(matrix, translationMatrix);
        matrix = matrixMultiply(matrix, projectionMatrix);
          
        // compute matrixes for texture
        var texPreRot = makeTranslation(-0.5, -0.5);
        var texRot    = makeRotation(texAngle);
        var texPostRot= makeTranslation(0.5, 0.5);
        var texOffMat = makeTranslation(texXOff, texYOff);
        var texScaleMat = makeScale(texXScale, texYScale);
      
        var texMatrix = matrixMultiply(texScaleMat, texOffMat);
        texMatrix = matrixMultiply(texMatrix, texPreRot);
        texMatrix = matrixMultiply(texMatrix, texRot);
        texMatrix = matrixMultiply(texMatrix, texPostRot);
        

        // Set the matrices
        gl.uniformMatrix3fv(matrixLocation, false, matrix);      
        gl.uniformMatrix3fv(texMatrixLocation, false, texMatrix);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
     
        requestAnimationFrame(draw);
    }

        // use canvas to simulate an image
       image = document.createElement("canvas");
        document.body.appendChild(image); // so we can see the source image
        image.width  = 200;
        image.height = 150;
        var ctx   = image.getContext("2d");
        ctx.fillRect(0, 0, image.width, image.height);
        for (var py = 0; py < image.height; py += 25) {
          for (var px = 0; px < image.width; px += 25) {
            ctx.fillStyle = "rgb(" + (py / image.height * 255 | 0) + "," + 
                                     (px / image.width  * 255 | 0) + "," + 
                                      255 + ")";
            ctx.beginPath();
            ctx.arc(px + 12, py + 12, 10, 0, Math.PI * 2);
            ctx.fill();
          }
        }
          
    setupWebGL();
    requestAnimationFrame(draw);

<!-- language: lang-css -->

    canvas { border: 1px solid red; }

<!-- language: lang-html -->

    <canvas width="400" height="300" id="canvas"></canvas>
    <script src="//webglfundamentals.org/webgl/resources/webgl-utils.js"></script>
    <script src="//webglfundamentals.org/webgl/resources/webgl-2d-math.js"></script>
    <!-- vertex shader -->
    <script id="2d-vertex-shader" type="x-shader/x-vertex">
    attribute vec2 a_position;
    attribute vec2 a_texCoord;

    uniform mat3 u_matrix;    // manipulates position
    uniform mat3 u_texMatrix; // manipulates texcoords

    varying vec2 v_texCoord;

    void main() {
         gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);

       // pass the texCoord to the fragment shader
       // The GPU will interpolate this value between points.
       v_texCoord = (u_texMatrix * vec3(a_texCoord, 1)).xy;
    }
    </script>
    <!-- fragment shader -->
    <script id="2d-fragment-shader" type="x-shader/x-fragment">
    precision mediump float;

    // our texture
    uniform sampler2D u_image;

    // the texCoords passed in from the vertex shader.
    varying vec2 v_texCoord;

    void main() {
       gl_FragColor = texture2D(u_image, v_texCoord);
    }
    </script>

<!-- end snippet -->



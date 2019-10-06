Title: WebGL Basics: Using Render Loops to Apply 2D Convolution Filters to Buffer Canvases
Description:
TOC: qna

# Question:

Very new to WebGL and attempting to port some 2D image processing shaders in order to get a handle on things. I initially was misled by the MDN tutorials into thinking WebGL was like OpenGL desktop, but then found [these tutorials](http://webglfundamentals.org/webgl/lessons/webgl-image-processing.html), which I found much more true to form as well as my purposes. However, I'm still having some trouble in formatting a render loop so I can pass a continually updating texture for processing. In cases where it does render, I just get a muddy mess and in cases where the vertex shader isn't a simple pass through I get nothing. I understand GLSL and the basics of how buffers work, but clearly am doing something very wrong here... Any help would be greatly appreciated. Thanks!

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    class GL {
        constructor(canvas){
            this.gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
            if (!this.gl) {
                alert("Unable to initialize WebGL. Your browser may not support it.");
                this.gl = null;
            }
     
            //init shaders
            var fragmentShader = getShader(this.gl, "fshader");
            var vertexShader = getShader(this.gl, "vshader");
            var shaderProgram = this.gl.createProgram();
            this.gl.attachShader(shaderProgram, vertexShader);
            this.gl.attachShader(shaderProgram, fragmentShader);
            this.gl.linkProgram(shaderProgram);
            this.gl.useProgram(shaderProgram);
            
            this.positionLocation = this.gl.getAttribLocation(shaderProgram, "position");
            this.texCoordLocation = this.gl.getAttribLocation(shaderProgram, "texcoord");
            var resolutionLocation = this.gl.getUniformLocation(shaderProgram, "resolution");
            this.width = this.gl.getUniformLocation(shaderProgram, "width");
        
            //set resolution
            this.gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
            
            function getShader(gl, id) {
                var shaderScript, theSource, currentChild, shader;
                shaderScript = document.getElementById(id);

                if (!shaderScript) {
                    return null;
                }

                theSource = "";
                currentChild = shaderScript.firstChild;
                
                while(currentChild) {
                    if (currentChild.nodeType == currentChild.TEXT_NODE) {
                        theSource += currentChild.textContent;
                    }
                    currentChild = currentChild.nextSibling;
                }

                if (shaderScript.type == "x-shader/x-fragment") {
                    shader = gl.createShader(gl.FRAGMENT_SHADER);
                } else if (shaderScript.type == "x-shader/x-vertex") {
                    shader = gl.createShader(gl.VERTEX_SHADER);
                } else {
                    // Unknown shader type
                    return null;
                }

                gl.shaderSource(shader, theSource);
                gl.compileShader(shader);

                if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                    alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
                    return null;
                }

                    return shader;
            };
        };
        
        render(bufferCanvas, x, y) { 
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            //texture coordinates
            var texCoordBuffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
            this.gl.enableVertexAttribArray(this.texCoordLocation);
            this.gl.vertexAttribPointer(this.texCoordLocation, 2, this.gl.FLOAT, false, 8, 0);
            
            this.gl.bufferData(
                this.gl.ARRAY_BUFFER, 
                new Float32Array([
                    0.0,  0.0,
                    1.0,  0.0,
                    0.0,  1.0,
                    0.0,  1.0,
                    1.0,  0.0,
                    1.0,  1.0]), 
                this.gl.STATIC_DRAW);
            
            //create texture
            var texture = this.gl.createTexture();
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            
            //normalize image to powers of two
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
            
            //load texture from 2d canvas
            this.gl.texImage2D(this.gl.TEXTURE_2D, 
                               0, 
                               this.gl.RGBA, 
                               this.gl.RGBA, 
                               this.gl.UNSIGNED_BYTE, 
                               bufferCanvas);

            //load buffer
            var buffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
            this.gl.enableVertexAttribArray(this.positionLocation);
            this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 12, 0);
     
            //draw size and position
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([   
                x, y,
                x + bufferCanvas.width, y,
                x, y + bufferCanvas.height,
                x, y + bufferCanvas.height,
                x+ bufferCanvas.width, y,
                x+ bufferCanvas.width, y + bufferCanvas.height]), this.gl.STATIC_DRAW);
            
            //blur width
            this.gl.enableVertexAttribArray(this.width);
            this.gl.vertexAttribPointer(this.width, 1, this.gl.FLOAT, false, 12, 8);
            
            //draw
            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
        };
    };


    var canvas2d = document.getElementById('buffer-canvas');
    var context2d = canvas2d.getContext("2d");
    var canvasGL = new GL(document.getElementById('main-canvas'));
    canvasGL.width = 5.0;

    for(var i=0; i<10; i++) {
        var r = Math.floor(Math.random() * 255);
        var g = Math.floor(Math.random() * 255);
        var b = Math.floor(Math.random() * 255);
        var a = Math.floor(Math.random() * 255);
        context2d.fillStyle = "rgba(" + r + "," + g + "," + b + "," + a + ")";
        
        var x = Math.random() * canvas2d.width;
        var y = Math.random() * canvas2d.height;
        var width = canvas2d.width - (Math.random() * canvas2d.width);
        var height = canvas2d.height - (Math.random() * canvas2d.height);
        context2d.fillRect(x, y, width , height);
        
        canvasGL.render(canvas2d, canvas2d.getBoundingClientRect("left"), canvas2d.getBoundingClientRect("top"));
    }

<!-- language: lang-html -->

    <head>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/sylvester/0.1.3/sylvester.min.js"></script>
    <script src="https://github.com/mdn/webgl-examples/blob/gh-pages/tutorial/glUtils.js"></script>
      
    <script id="vshader" type="x-shader/x-vertex">
    precision mediump float;

    attribute vec2 position;
    attribute vec2 texcoord;

    uniform vec2 resolution;
    uniform float width;

    varying vec2 texcoord11;
    varying vec2 texcoord00;
    varying vec2 texcoord02;
    varying vec2 texcoord20;
    varying vec2 texcoord22;

    void main()
    {
        gl_Position = vec4(((position / resolution) * 2.0 - 1.0) * vec2(1, -1), 0, 1);

     // get texcoords
     texcoord11 = texcoord;
     texcoord00 = texcoord + vec2(-width, -width);
     texcoord02 = texcoord + vec2( width, -width);
     texcoord20 = texcoord + vec2( width,  width);
     texcoord22 = texcoord + vec2(-width,  width);
    }
    </script>
      
    <script id="fshader" type="x-shader/x-fragment">
    precision mediump float;

    uniform sampler2D image;

    varying vec2 texcoord11;
    varying vec2 texcoord00;
    varying vec2 texcoord02;
    varying vec2 texcoord20;
    varying vec2 texcoord22;

    void main()
    {
     vec4 blur;
     
     blur = texture2D(image, texcoord11);
     blur += texture2D(image, texcoord00);
     blur += texture2D(image, texcoord02);
     blur += texture2D(image, texcoord20);
     blur += texture2D(image, texcoord22);

     gl_FragColor = 0.2 * blur;
    }
    </script>
    </head>

    <body>
    <canvas id="main-canvas" width="400" height="300" style="border:1px solid black;"></canvas>
    <canvas id="buffer-canvas" width="400" height="300" style="visibility:hidden;"></canvas>
    </body>

<!-- end snippet -->



# Answer

There's several issues with the code

* neither of the script tags seem to be needed

* You assign `this.width` to a uniform location

        this.width = this.gl.getUniformLocation(shaderProgram, "width");
  
  But then later destroy that with

        canvasGL.width = 5.0

* `width` is a uniform but you're trying to set it as an attribute

   wrong

        this.gl.enableVertexAttribArray(this.width);
        this.gl.vertexAttribPointer(this.width, 1, this.gl.FLOAT, false, 12, 8);

   right

        this.gl.uniform1f(this.width, whateverYouWantedWidthToBe);

* You've got unneeded strides on all your attributes

   wrong

        this.gl.vertexAttribPointer(this.texCoordLocation, 2, this.gl.FLOAT, false, 8, 0);
        this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 12, 0);

   right

        this.gl.vertexAttribPointer(this.texCoordLocation, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 0, 0);

   Well I suppose the texcoord one is not *wrong* if you want to set strides but the position one is wrong since you're using 2 floats per position not 3. Why not just set them to 0?

* You're assigning the `texCoordLocation` to a `var` but then using it as a property on `this`

    wrong

        var texCoordBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);

    right?

        this.texCoordBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);

* On top of that the structure of the code is probably not what you intended. 

  In WebGL you don't generally call `gl.createXXX` functions in your render function. You'd call `gl.createXXX` functions those during initialization. [See here for a more typical structure](https://stackoverflow.com/questions/13009328/drawing-many-shapes-in-webgl).

* It's not clear at all what this line is trying to do

        canvasGL.render(canvas2d, canvas2d.getBoundingClientRect("left"),     
                        canvas2d.getBoundingClientRect("top"))

  What do you think `canvas2d.getBoundingClientRect()` is going to return that's useful for rendering? Also that's not how `getBoundingClientRect` works. [It returns a rect, it doesn't take any arguments](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect).

Once you have all that fixed it's not clear what you want `width` to be. I'm assuming you want it to be pixels but in that case it needs to be `1 / canvas2D.width` and you need a separate value for `height` in your shader since you'll need different values to move up and down a certain number of pixels vs left and right.

### other suggestions

* Pull `gl` into a local variable. Then you don't have to do `this.gl` everywhere. Less typing, shorter, and faster

* You can get the contents of script tag with just this

        var theSource = shaderScript.text;

* You're checking for shader compile errors but not link errors.

* [`visibility: hidden;` doesn't do what I think you think it does](https://stackoverflow.com/questions/133051/what-is-the-difference-between-visibilityhidden-and-displaynone). You probably want `display: none;`.

Here's one version that does something.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    class GL {
        constructor(canvas){
            var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
            if (!gl) {
                alert("Unable to initialize WebGL. Your browser may not support it.");
                return;  
            }
            this.gl = gl;
     
            //init shaders
            var fragmentShader = getShader(gl, "fshader");
            var vertexShader = getShader(gl, "vshader");
            var shaderProgram = gl.createProgram();
            gl.attachShader(shaderProgram, vertexShader);
            gl.attachShader(shaderProgram, fragmentShader);
            gl.linkProgram(shaderProgram);
            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
                alert("An error occurred linking the shaders: " + gl.getProgramInfoLog(shaderProgram));
                return;
            }
            
          
            this.shaderProgram = shaderProgram;
            
            this.positionLocation = gl.getAttribLocation(shaderProgram, "position");
            this.texCoordLocation = gl.getAttribLocation(shaderProgram, "texcoord");
            this.resolutionLocation = gl.getUniformLocation(shaderProgram, "resolution");
            this.blurOffsetLocation = gl.getUniformLocation(shaderProgram, "blurOffset");
        
            // init texture coordinates
            this.texCoordBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);        
            gl.bufferData(
                gl.ARRAY_BUFFER, 
                new Float32Array([
                    0.0,  0.0,
                    1.0,  0.0,
                    0.0,  1.0,
                    0.0,  1.0,
                    1.0,  0.0,
                    1.0,  1.0]), 
                gl.STATIC_DRAW);
            
          
            // create position buffer
            this.positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
          
            //create texture
            this.texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            
            //normalize image to powers of two
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            
            function getShader(gl, id) {
                var shaderScript, theSource, currentChild, shader;
                shaderScript = document.getElementById(id);

                if (!shaderScript) {
                    return null;
                }

                var theSource = shaderScript.text;
                
                if (shaderScript.type == "x-shader/x-fragment") {
                    shader = gl.createShader(gl.FRAGMENT_SHADER);
                } else if (shaderScript.type == "x-shader/x-vertex") {
                    shader = gl.createShader(gl.VERTEX_SHADER);
                } else {
                    // Unknown shader type
                    return null;
                }

                gl.shaderSource(shader, theSource);
                gl.compileShader(shader);

                if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                    alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
                    return null;
                }

                    return shader;
            };
        };
        
        render(bufferCanvas, x, y, blurAmount) {
            var gl = this.gl;
            gl.clear(this.gl.COLOR_BUFFER_BIT);
          
            gl.useProgram(this.shaderProgram);

            // setup buffers and attributes
            gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);        
            gl.enableVertexAttribArray(this.texCoordLocation);
            gl.vertexAttribPointer(this.texCoordLocation, 2, gl.FLOAT, false, 0, 0);
          
            //load buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
            gl.enableVertexAttribArray(this.positionLocation);
            gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);
     
            //draw size and position
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([   
                x, y,
                x + bufferCanvas.width, y,
                x, y + bufferCanvas.height,
                x, y + bufferCanvas.height,
                x+ bufferCanvas.width, y,
                x+ bufferCanvas.width, y + bufferCanvas.height]), gl.STATIC_DRAW);
                  
            //load texture from 2d canvas
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.texImage2D(gl.TEXTURE_2D, 
                          0, 
                          gl.RGBA, 
                          gl.RGBA, 
                          gl.UNSIGNED_BYTE, 
                          bufferCanvas);

            //blur width
            gl.uniform2f(this.blurOffsetLocation, 
                         blurAmount / bufferCanvas.width,
                         blurAmount / bufferCanvas.height);
          
            //set resolution
            gl.uniform2f(this.resolutionLocation, 
                         gl.canvas.width, 
                         gl.canvas.height);     
          
            //draw
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        };
    };


    var canvas2d = document.getElementById('buffer-canvas');
    var context2d = canvas2d.getContext("2d");
    var canvasGL = new GL(document.getElementById('main-canvas'));

    function render(time) {
        time *= 0.001;
        var r = Math.floor(Math.random() * 255);
        var g = Math.floor(Math.random() * 255);
        var b = Math.floor(Math.random() * 255);
        var a = Math.floor(Math.random() * 255);
        context2d.fillStyle = "rgba(" + r + "," + g + "," + b + "," + a + ")";
        
        var x = Math.random() * canvas2d.width;
        var y = Math.random() * canvas2d.height;
        var width = canvas2d.width - (Math.random() * canvas2d.width);
        var height = canvas2d.height - (Math.random() * canvas2d.height);
        context2d.fillRect(x, y, width , height);
        canvasGL.render(canvas2d, 0, 0, Math.sin(time) * 5);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-html -->

    <script id="vshader" type="x-shader/x-vertex">
    precision mediump float;

    attribute vec2 position;
    attribute vec2 texcoord;

    uniform vec2 resolution;
    uniform vec2 blurOffset;

    varying vec2 texcoord11;
    varying vec2 texcoord00;
    varying vec2 texcoord02;
    varying vec2 texcoord20;
    varying vec2 texcoord22;

    void main()
    {
        gl_Position = vec4(((position / resolution) * 2.0 - 1.0) * vec2(1, -1), 0, 1);

     // get texcoords
     texcoord11 = texcoord;
     texcoord00 = texcoord + blurOffset * vec2(-1, -1);
     texcoord02 = texcoord + blurOffset * vec2( 1, -1);
     texcoord20 = texcoord + blurOffset * vec2( 1,  1);
     texcoord22 = texcoord + blurOffset * vec2(-1,  1);
    }
    </script>
      
    <script id="fshader" type="x-shader/x-fragment">
    precision mediump float;

    uniform sampler2D image;

    varying vec2 texcoord11;
    varying vec2 texcoord00;
    varying vec2 texcoord02;
    varying vec2 texcoord20;
    varying vec2 texcoord22;

    void main()
    {
     vec4 blur;
     
     blur = texture2D(image, texcoord11);
     blur += texture2D(image, texcoord00);
     blur += texture2D(image, texcoord02);
     blur += texture2D(image, texcoord20);
     blur += texture2D(image, texcoord22);

        // do you really want to blend the alpha?
     gl_FragColor = 0.2 * blur;
    }
    </script>

    <canvas id="main-canvas" width="400" height="300" style="border:1px solid black;"></canvas>
    <canvas id="buffer-canvas" width="400" height="300" style="display: none;"></canvas>

<!-- end snippet -->



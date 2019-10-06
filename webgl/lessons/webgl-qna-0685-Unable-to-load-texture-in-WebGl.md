Title: Unable to load texture in WebGl
Description:
TOC: qna

# Question:

I am able to load RGB colours but not textures. If it could be some settings problem please prompt me.
This is the screenshot of chrome://flags
[![chrome://flags][1]][1]

The HTML code is given :


        <!DOCTYPE html>
    <meta charset="UTF-8">
    <html>
    <head>
    <title>WebGL Cube with Texture</title>
    
    <script type="x-shader/x-vertex" id="vshader">
         attribute vec3 coords;
         attribute vec2 texCoords;
         uniform vec3 normal;
         uniform mat4 modelview;
         uniform mat4 projection;
         uniform mat3 normalMatrix;
         varying vec3 vNormal;
         varying vec2 vTexCoords;
         void main() {
            vec4 coords = vec4(coords,1.0);
            vec4 transformedVertex = modelview * coords;
            vNormal = normalMatrix * normal;
            vTexCoords = texCoords;
            gl_Position = projection * transformedVertex;
         }
    </script>
    <script type="x-shader/x-fragment" id="fshader">
         precision mediump float;
         uniform bool textured;
         uniform sampler2D sampler;
         varying vec3 vNormal;
         varying vec2 vTexCoords;
         uniform vec4 color;
         void main() {
             if (textured) {
                  vec4 color = texture2D(sampler, vTexCoords);
                  vec3 unitNormal = normalize(vNormal);
                  float multiplier = abs(unitNormal.z);
                  gl_FragColor = vec4( multiplier*color.r, multiplier*color.g, multiplier*color.b, color.a );
              }
             else {
                  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); // use basic white when texture's not there.
             }
         }
    </script>
    
    
    <script type="text/javascript" src="gl-matrix-min.js"></script>
    <script type="text/javascript" src="simple-rotator.js"></script>
    <script type="text/javascript">
    
    "use strict";
    
    var gl;   // The webgl context.
    
    var aCoords;           // Location of the coords attribute variable in the shader program.
    var aCoordsBuffer;     // Buffer to hold coords.
    var aTexCoords;        // Location of the texCoords attribute variable in the shader program.
    var aTexCoordsBuffer;  // Buffer to hold texCoords.
    var uProjection;       // Location of the projection uniform matrix in the shader program.
    var uModelview;        // Location of the modelview unifirm matrix in the shader program.
    var uNormal;           // Location of the normal uniform in the shader program.
    var uColor;            // Location of the color uniform in the shader program, used only for axes.
    var uTextured;         // Location of the textured uniform in the shader program.
    var uSampler;          // Location of the sampler in the shader program.
    var uNormalMatrix;     // Location of the normalMatrix uniform matrix in the shader program.
    
    var projection = mat4.create();   // projection matrix
    var modelview = mat4.create();    // modelview matrix
    var normalMatrix = mat3.create(); // matrix, derived from modelview matrix, for transforming normal vectors
    
    var rotator;   // A SimpleRotator object to enable rotation by mouse dragging.
    
    var textureID = null;  // Texture object, to be created after image has loaded.
    
    
    /* Draws a colored cube, along with a set of coordinate axes.
     * (Note that the use of the above drawPrimitive function is not an efficient
     * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
     */
    function draw() { 
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        if (document.getElementById("persproj").checked) {
             mat4.perspective(projection, Math.PI/4, 1, 2, 10);
        }
        else {
             mat4.ortho(projection,-2.5, 2.5, -2.5, 2.5, 2, 10);
        }
        gl.uniformMatrix4fv(uProjection, false, projection );
    
        
        var modelview = rotator.getViewMatrix();
        var saveModelview = mat4.clone(modelview);
    
        if (textureID) {
             gl.uniform1i( uTextured, 1 );       // Tell shader to use texture and lighting.
             gl.bindTexture(gl.TEXTURE_2D, textureID);     // Which texture should be used.
             gl.uniform1i(uSampler, 0);     // Set sampler in shadre to use texture unit zero.
        }
        else {
             gl.uniform1i( uTextured, 0 );  // Cube will appear in plain white.
        }
        
        drawFace(modelview)  // front face of the cube
        mat4.rotateY(modelview,modelview,Math.PI/2);  //right face
        drawFace(modelview)  // front face
        mat4.rotateY(modelview,modelview,Math.PI/2);  //back face
        drawFace(modelview)  // front face
        mat4.rotateY(modelview,modelview,Math.PI/2);  //left face
        drawFace(modelview)  // front face
        modelview = mat4.clone(saveModelview);
        mat4.rotateX(modelview,modelview,Math.PI/2);
        drawFace(modelview)  // top face
        mat4.rotateX(modelview,modelview,Math.PI);
        drawFace(modelview)  // bottom face
        
     }
    
    /**
     * Draws the front face of the cube, subject to a modelview transform.
     */
    function drawFace(modelview) {
        gl.uniformMatrix4fv(uModelview, false, modelview );
        mat3.normalFromMat4(normalMatrix, modelview);
        gl.uniformMatrix3fv(uNormalMatrix, false, normalMatrix);
        gl.uniform3f(uNormal, 0, 0, 1);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);  // front face
    }
    
    /**
     * Loads data for the front face of the cube into VBOs.
     */
    function createFace() {
         var vertices = [ -1,-1,1, 1,-1,1, 1,1,1, -1,1,1 ];
         var texCoords = [ 0,0, 2,0, 2,2, 0,2 ];
         gl.enableVertexAttribArray(aCoords);
         gl.bindBuffer(gl.ARRAY_BUFFER,aCoordsBuffer);
         gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
         gl.vertexAttribPointer(aCoords, 3, gl.FLOAT, false, 0, 0);
         gl.enableVertexAttribArray(aTexCoords);
         gl.bindBuffer(gl.ARRAY_BUFFER,aTexCoordsBuffer);
         gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
         gl.vertexAttribPointer(aTexCoords, 2, gl.FLOAT, false, 0, 0);
    }
    
    /**
     * Load an image from the URL "textures/bridk001.jpg".  The image is loade
     * asynchronously.  When the 
     */
    function loadTexture() {
         var img = new Image();
         img.onload = function() {
               var id = gl.createTexture();
               gl.bindTexture(gl.TEXTURE_2D,id);
               gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
               gl.generateMipmap(gl.TEXTURE_2D);
               gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
               gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
               textureID = id;
               draw();
         }
         img.src = "./skin.jpg";
    }
    
    
    /* Creates a program for use in the WebGL context gl, and returns the
     * identifier for that program.  If an error occurs while compiling or
     * linking the program, an exception of type String is thrown.  The error
     * string contains the compilation or linking error.  If no error occurs,
     * the program identifier is the return value of the function.
     */
    function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
       var vsh = gl.createShader( gl.VERTEX_SHADER );
       gl.shaderSource(vsh,vertexShaderSource);
       gl.compileShader(vsh);
       if ( ! gl.getShaderParameter(vsh, gl.COMPILE_STATUS) ) {
          throw "Error in vertex shader:  " + gl.getShaderInfoLog(vsh);
       }
       var fsh = gl.createShader( gl.FRAGMENT_SHADER );
       gl.shaderSource(fsh, fragmentShaderSource);
       gl.compileShader(fsh);
       if ( ! gl.getShaderParameter(fsh, gl.COMPILE_STATUS) ) {
          throw "Error in fragment shader:  " + gl.getShaderInfoLog(fsh);
       }
       var prog = gl.createProgram();
       gl.attachShader(prog,vsh);
       gl.attachShader(prog, fsh);
       gl.linkProgram(prog);
       if ( ! gl.getProgramParameter( prog, gl.LINK_STATUS) ) {
          throw "Link error in program:  " + gl.getProgramInfoLog(prog);
       }
       return prog;
    }
    
    
    /* Gets the text content of an HTML element.  This is used
     * to get the shader source from the script elements that contain
     * it.  The parameter should be the id of the script element.
     */
    function getTextContent( elementID ) {
        var element = document.getElementById(elementID);
        var fsource = "";
        var node = element.firstChild;
        var str = "";
        while (node) {
            if (node.nodeType == 3) // this is a text node
                str += node.textContent;
            node = node.nextSibling;
        }
        return str;
    }
    
    
    /**
     * Initializes the WebGL program including the relevant global variables
     * and the WebGL state.  Creates a SimpleView3D object for viewing the
     * cube and installs a mouse handler that lets the user rotate the cube.
     */
    function init() {
       try {
            var canvas = document.getElementById("glcanvas");
            gl = canvas.getContext("webgl");
            if ( ! gl ) {
                gl = canvas.getContext("experimental-webgl");
            }
            if ( ! gl ) {
                throw "Could not create WebGL context.";
            }
            var vertexShaderSource = getTextContent("vshader"); 
            var fragmentShaderSource = getTextContent("fshader");
            var prog = createProgram(gl,vertexShaderSource,fragmentShaderSource);
            gl.useProgram(prog);
            aCoords =  gl.getAttribLocation(prog, "coords");
            aTexCoords = gl.getAttribLocation(prog, "texCoords");
            uModelview = gl.getUniformLocation(prog, "modelview");
            uProjection = gl.getUniformLocation(prog, "projection");
            uSampler =  gl.getUniformLocation(prog, "sampler");
            uNormal =  gl.getUniformLocation(prog, "normal");
            uColor =  gl.getUniformLocation(prog, "color");
            uTextured =  gl.getUniformLocation(prog, "textured");
            uNormalMatrix =  gl.getUniformLocation(prog, "normalMatrix");
            aCoordsBuffer = gl.createBuffer();
            aTexCoordsBuffer = gl.createBuffer();
            gl.enable(gl.DEPTH_TEST);
            gl.enable(gl.CULL_FACE);  // no need to draw back faces
            document.getElementById("persproj").checked = true;
            rotator = new SimpleRotator(canvas,draw);
            rotator.setView( [2,2,5], [0,1,0], 6 );
       }
       catch (e) {
          document.getElementById("message").innerHTML =
               "Could not initialize WebGL: " + e;
          return;
       }
       createFace();
       loadTexture();
       draw();
    }
    
    </script>
    </head>
    <body onload="init()" style="background-color:#DDD">
    
    <h2>A Cube With a Brick Texture</h2>
    
    <p id=message>Drag the mouse on the canvas to rotate the view.</p>
    
    <p>
      <input type="radio" name="projectionType" id="persproj" value="perspective" onchange="draw()">
          <label for="persproj">Perspective projection</label>
      <input type="radio" name="projectionType" id="orthproj" value="orthogonal" onchange="draw()" style="margin-left:1cm">
          <label for="orthproj">Orthogonal projection</label>
      <button onclick="rotator.setView( [2,2,5], [0,1,0], 6 ); draw()" style="margin-left:1cm">Reset View</button>
    </p>
    
    <noscript><hr><h3>This page requires Javascript and a web browser that supports WebGL</h3><hr></noscript>
    
    <div>
       <canvas width=600 height=600 id="glcanvas" style="background-color:red"></canvas>
    </div>
    
    
    </body>
    </html>

All i get as an output is [![Cube but no texture][2]][1]
The other functions are loading fine. The file paths are correct.


  [1]: https://i.stack.imgur.com/hKDmS.png
  [2]: https://i.stack.imgur.com/osLYY.png

# Answer

The issue is you need to run a simple web server for WebGL dev. It should take you about 2 minutes to get setup

[See this](https://stackoverflow.com/questions/12905426/what-is-a-faster-alternative-to-pythons-http-server-or-simplehttpserver)

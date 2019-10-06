Title: WebGL: INVALID_VALUE: texImage2D: no video error in Chrome
Description:
TOC: qna

# Question:

I'm attempting to add video as texture in WebGL. The project is simple and only involves one object. The code I have works fine in Firefox but claims there is no video when loaded in Chrome. The ERROR seems to be that the video is not starting in Chrome for some reason even though I have a function to start the video:

    function startVideo() {
      videoElement.play();
      intervalID = setInterval(draw, 15);
    }

as well as 

    videoElement.preload = "auto";

tied to my video objectin JS. 

Additionally, I also have 

    <video id="video" src="Firefox.ogv" autoplay muted>
          Your browser doesn't appear to support the <code>&lt;video&gt;</code> element.
    </video>

just to be sure, but it is not loadng the texture. The error is being referenced in this function for teximage2D:

    function updateTexture() {
      gl.bindTexture(gl.TEXTURE_2D, modelTexture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, videoElement);
    } 

Subsequently, I also get the error:

    RENDER WARNING: texture bound to texture unit 0 is not renderable. It maybe non-power-of-2 and have incompatible texture filtering.

I am using this tutorial combined with my own implemenation : 

https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Animating_textures_in_WebGL

My JS and HTML are located here:

https://github.com/TacoB0t/CSC43/tree/prog/prog5

Everything mostly takes place in the init() and draw() function of the JS

HTML:

    <html>
        <head>
                <script type="text/javascript" src="webgl-utils.js"></script>
                <script type="text/javascript" src="webgl-debug.js"></script>
                <script type="text/javascript" src="cuon-utils.js"></script>
                <script type="text/javascript" src="cuon-matrix.js"></script>
                <script type="text/javascript" src="prog5.js"></script>
                <script type="text/javascript" src="chest.js"></script>
                <script type="text/javascript" src="cube.js"></script>
    
        </head>
        <body onload="init()">
                <script id="vertexShader" type="x-shader/x-vertex">
                        precision mediump float;
                                                              
                        uniform mat4 modelMatrix;
                        uniform mat4 viewMatrix;
                        uniform mat4 projectionMatrix;
                        uniform vec4 lightPosition;
                        
                        attribute vec4 vertexPosition;  
                        attribute vec3 vertexNormal;
                        attribute vec2 vertexTexCoord;                              
                                          
                        varying vec3 fragmentNormal;
                        varying vec3 fragmentLight;
                        varying vec3 fragmentView;
                        varying vec4 fragmentPosition; 
                        varying vec2 fragmentTexCoord;                              
        
                        void main() {
                                mat4 modelViewMatrix = viewMatrix * modelMatrix;
                                
                                vec4 p = modelViewMatrix * vertexPosition;
                                vec4 q = viewMatrix * lightPosition;                            
                                
                                fragmentPosition    = vertexPosition; 
                                fragmentNormal      = normalize(mat3(modelViewMatrix) * vertexNormal);
                                fragmentLight       = normalize(vec3(q - p));
                                fragmentView        = normalize(vec3(-p));
                                fragmentTexCoord    = vertexTexCoord;               
                                                        
                                gl_Position     = projectionMatrix * modelViewMatrix * vertexPosition;
                        }
                </script>
                <script id="lightingFragmentShader" type="x-shader/x-fragment">
                        precision mediump float;
                        
                        varying vec3 fragmentNormal;
                        varying vec3 fragmentLight;
                        varying vec3 fragmentView;
                        varying vec4 fragmentPosition; 
                        varying vec2 fragmentTexCoord;
                        
                        uniform sampler2D modelTexture;
                        uniform vec3 modelColor;
                        uniform vec3 lightColor;
                        
                        void main() {
                                vec3 n = normalize(fragmentNormal);
                                vec3 l = normalize(fragmentLight);
                                vec3 v = normalize(fragmentView);
                                vec3 h = normalize(l + v);
                                vec4 modelColor          = texture2D(modelTexture, fragmentTexCoord);
                                
                                float d = max(dot(l,n) , 0.0);
                                float s = pow(max(dot(h, n), 0.0), 10.0);
                                
                                vec3 fragmentColor  = vec3(modelColor) * lightColor * d + lightColor * s;
                            
                                gl_FragColor        = vec4(fragmentColor, 1.0); 
                        }
                </script> 
                <center>
                    <canvas id="webgl" width="500px" height="500px">
                        This content requires <a href="http://get.webgl.org/">WebGL</a>
                    </canvas>
                    <font face ="Arial">
                        <br>
                        Light Source Position
                        <br>
                        X-AXIS<input id="x-light" type="range" min="-5.0" max="5.0" value="0" step="0.1" oninput="refresh()">
                        <br>
                        Y-AXIS <input id="y-light" type="range" min="-5.0" max="5.0" value="0" step="0.1" oninput="refresh()">
                        <br>
                        Z-AXIS<input id="z-light" type="range" min="-5.0" max="5.0" value="0" step="0.1" oninput="refresh()">
                    </font>
                </center>
            <video id="video" src="Firefox.ogv" autoplay muted style="display: none;">
           Your browser doesn't appear to support the <code>&lt;video&gt;</code> element.
             </video>
        </body>
    </html>

JS:

    var gl;
    var canvas;
    
    var dragging = false;
    var texShader;
    var chestModel;
    
    var xValue = 0;
    var yValue = 0;
    var zValue = 0;
    
    var modelRotationX = 0;
    var modelRotationY = 0;
    var lastClientX;
    var lastClientY;
    
    var videoElement;
    var modelTexture;
    var copyVideo;
    
    //refresh function used to request animation frame after moving slider in HTML
    function refresh(){
        xValue = document.getElementById("x-light").value;
        yValue = document.getElementById("y-light").value;
        zValue = document.getElementById("z-light").value;
        requestAnimationFrame(draw);
    }
    
    //define 'flatten' function to flatten tables to single array
    function flatten(a) {    
        return a.reduce(function (b, v) { b.push.apply(b, v); return b }, [])   
    }
    
    //create tumble interaction functions to click and drag cube
    function onmousedown(event){
        dragging    = true;
        lastClientX = event.clientX;
        lastClientY = event.clientY;
    }
    
    function onmouseup(event){ 
        dragging = false;
    }
    
    /*using clientX and clientY derived from click event, use to create modelX and Y 
    rotation before passing to model matrices rotation transformations*/
    function onmousemove(event){
        //console.log(event.clientX, event.clientY);
        if (dragging){  
            var dX = event.clientX - lastClientX;
            var dY = event.clientY - lastClientY;
            
            modelRotationY = modelRotationY + dX;
            modelRotationX = modelRotationX + dY;
            
            
            if (modelRotationX > 90.0){
                modelRotationX = 90.0;
            }
            
            if (modelRotationX < -90.0){
                modelRotationX = -90.0;
            }
            
        requestAnimationFrame(draw);
        }
         lastClientX = event.clientX;
         lastClientY = event.clientY;
         
    }
    function startVideo() {
      videoElement.play();
      intervalID = setInterval(draw, 15);
    }
    
    function videoDone() {
      clearInterval(intervalID);
    }
    
    
    //define Shader object constructor function
    function Shader(vertexId, fragmentId){
        
        this.program = createProgram(gl, document.getElementById( vertexId).text,
                                         document.getElementById(fragmentId).text);
                                         
        this.modelMatrixLocation         = gl.getUniformLocation(this.program, 'modelMatrix');
        this.viewMatrixLocation          = gl.getUniformLocation(this.program, 'viewMatrix');
        this.projectionMatrixLocation    = gl.getUniformLocation(this.program, 'projectionMatrix');
        this.vertexPositionLocation      = gl.getAttribLocation(this.program, 'vertexPosition'); 
        this.lightPositionLocation       = gl.getUniformLocation(this.program, 'lightPosition');
        this.modelColorLocation          = gl.getUniformLocation(this.program, 'modelColor');
        this.lightColorLocation          = gl.getUniformLocation(this.program, 'lightColor');
        this.vertexNormalLocation        = gl.getAttribLocation(this.program, 'vertexNormal');
        this.vertexTexCoordLocation      = gl.getAttribLocation(this.program, 'vertexTexCoord');
        
        gl.enableVertexAttribArray(this.vertexPositionLocation);
        gl.enableVertexAttribArray(this.vertexNormalLocation);
        gl.enableVertexAttribArray(this.vertexTexCoordLocation);
    }
    
    //define use() method for Shader objects
    Shader.prototype.use = function(projectionMatrix, modelMatrix, viewMatrix){
        
        gl.useProgram(this.program);
        
        gl.uniformMatrix4fv(this.modelMatrixLocation, false, modelMatrix.elements);
        gl.uniformMatrix4fv(this.viewMatrixLocation, false, viewMatrix.elements);
        gl.uniformMatrix4fv(this.projectionMatrixLocation, false, projectionMatrix.elements);
    
        gl.uniform4f(this.lightPositionLocation, xValue, yValue, zValue, 0.0);
        gl.uniform3f(this.modelColorLocation, 0.6, 0.3, 0.2);
        gl.uniform3f(this.lightColorLocation, 1.0, 1.0, 1.0);
    }
    
    //define Model object constructor function
    function Model(positions, triangles, normals, texCoords){
        //initialize buffer objects
        this.positionBuffer  = gl.createBuffer();
        this.triangleBuffer  = gl.createBuffer();
        this.normalsBuffer   = gl.createBuffer();
        this.texCoordBuffer  = gl.createBuffer();
        
        
        //copy vertex data from array in CPU onto GPU
        this.positionArray = new Float32Array(flatten(positions));
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.positionArray, gl.STATIC_DRAW);    
    
        //copy triangle data from array in CPU onto GPU
        this.triangleArray = new Uint16Array(flatten(triangles));
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.triangleArray, gl.STATIC_DRAW);
        
        this.normalsArray = new Float32Array(flatten(normals));
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.normalsArray, gl.STATIC_DRAW);
        
        this.textCoordArray = new Float32Array(flatten(texCoords));
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.textCoordArray, gl.STATIC_DRAW);
    }
    
    //define draw() method for Model objects to bind barray buffers
    Model.prototype.draw = function(shader){
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(shader.vertexPositionLocation, 3, gl.FLOAT, false, 0, 0);
            
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalsBuffer);
        gl.vertexAttribPointer(shader.vertexNormalLocation, 3, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);    
        gl.vertexAttribPointer(shader.vertexTexCoordLocation, 2, gl.FLOAT, false, 0, 0);
        
       
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
        gl.drawElements(gl.TRIANGLES, this.triangleArray.length, gl.UNSIGNED_SHORT, 0);
        
             
    }
    
    //initizlize texture object
    function loadTexture(image, texture){
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        //requestAnimationFrame(draw);                                                        
    }
    
    
    function init(){
        
        //initialize GL context
        canvas = document.getElementById('webgl');
        gl = getWebGLContext(canvas, false);
        
        canvas.onmousedown  = onmousedown;
        canvas.onmouseup    = onmouseup;
        canvas.onmousemove  = onmousemove;
        
        //instantiate shader objects for each defined shader
        texShader           = new Shader('vertexShader', 'lightingFragmentShader');
        
        //instantiate model objects for each model
        chestModel          = new Model(chest.positions, chest.triangles, chest.normals, chest.texCoords);
        
        videoElement = document.getElementById("video");
            
        modelTexture    = gl.createTexture();
        
        gl.bindTexture(gl.TEXTURE_2D, modelTexture);
        gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([255, 255, 255, 255]));
        
       
        videoElement.addEventListener("canplaythrough", startVideo, true);
        videoElement.addEventListener("playing", function (){ copyVideo = true; }, true);
        videoElement.addEventListener("ended", videoDone, true);
        
       /* videoElement.onload   = function() {
           loadTexture(videoElement, modelTexture);
        }*/ 
        loadTexture(videoElement, modelTexture);
        
        videoElement.crossOrigin  = "anonymous";
        videoElement.src = "Firefox.ogv";
        
        
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);                               
        gl.enable(gl.DEPTH_TEST);
        
        //request animation frame
        requestAnimationFrame(draw);    
        
    }
    
    
    function draw(){
         if (copyVideo) {
           updateTexture();
        }
        //compose matrices for transformations
        var viewMatrix          = new Matrix4();
        var projectionMatrix    = new Matrix4();  
        
        viewMatrix.translate(0.0, 0.0, -1.8);
        projectionMatrix.perspective(90, 1, 1, 10);
            
        //set color and refresh rendering for canvas       
        gl.clearColor(0.5, 0.5, 0.5, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
       
        /*instantiate model matrices for each respective model 
          and draw models with applied shader*/
        var chestModelMatrix    = new Matrix4();
        chestModelMatrix.rotate(modelRotationX, 1, 0, 0 );
        chestModelMatrix.rotate(modelRotationY, 0, 1, 0 ); 
        chestModelMatrix.translate(0.0, 0.0, 0.0, 0.0 );
        
        //set uniform locations and apply shader to designated model
        texShader.use(projectionMatrix, chestModelMatrix, viewMatrix);    
        chestModel.draw(texShader);
                
    }
    
    function updateTexture() {
      gl.bindTexture(gl.TEXTURE_2D, modelTexture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, videoElement);
    }




# Answer

I'm not an HTML video expert but this works for me. You need to wait for the `playing` event before you start copying the video to a texture

    var copyVideo;    // if true we can call gl.texImage2D
    var video = document.createElement("video");
    video.src = someVideoUrl;

    video.addEventListener("playing", function() {
      copyVideo = true;
    }, true);
    video.addEventListener("ended", function() {
      video.currentTime = 0;
      video.play();
    }, true);

    video.play();

Working example:

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    "use strict";
    var m4 = twgl.m4;
    var gl = document.getElementById("c").getContext("webgl");
    var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

    var bufferInfo = twgl.primitives.createCubeBufferInfo(gl, 2);

    var camera = m4.identity();
    var view = m4.identity();
    var viewProjection = m4.identity();

    var texture = twgl.createTexture(gl, {
      src: [0, 0, 255],
      format: gl.RGB,
      min: gl.LINEAR,
      wrap: gl.CLAMP_TO_EDGE,
    });

    var uniforms = {
      u_texture: texture,
      u_worldViewProjection: m4.identity(),
    };

    var copyVideo;
    var video = document.createElement("video");
    video.src = "https://webglsamples.org/color-adjust/sample-video.mp4";
    video.crossOrigin = "*";
    video.volume = 0; // sample video has bad audio
    video.addEventListener("playing", function() {
      copyVideo = true;
    }, true);
    video.addEventListener("ended", function() {
      video.currentTime = 0;
      video.play();
    }, true);
    video.addEventListener("error", function() {
      console.log("could not play video");
    }, true);

    video.play();

    function render(time) {
      time *= 0.001;
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      gl.enable(gl.DEPTH_TEST);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      var radius = 5;
      var orbitSpeed = time;
      var projection = m4.perspective(30 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.5, 100);
      var eye = [Math.cos(orbitSpeed) * radius, 3, Math.sin(orbitSpeed) * radius];
      var target = [0, 0, 0];
      var up = [0, 1, 0];

      if (copyVideo) {
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
      }

      m4.lookAt(eye, target, up, camera);
      m4.inverse(camera, view);
      m4.multiply(projection, view, viewProjection);

      m4.copy(viewProjection, uniforms.u_worldViewProjection);

      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo)
      twgl.setUniforms(programInfo, uniforms);
      twgl.drawBufferInfo(gl, bufferInfo);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    body { margin: 0; }
    #c { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script id="vs" type="notjs">
    uniform mat4 u_worldViewProjection;

    attribute vec4 position;
    attribute vec2 texcoord;

    varying vec2 v_texCoord;

    void main() {
      v_texCoord = texcoord;
      gl_Position = u_worldViewProjection * position;
    }
      </script>
      <script id="fs" type="notjs">
    precision mediump float;

    varying vec2 v_texCoord;
    uniform sampler2D u_texture;

    void main() {
      gl_FragColor = texture2D(u_texture, v_texCoord);
    }
      </script>
      <script src="https://twgljs.org/dist/2.x/twgl-full.min.js"></script>

    <canvas id="c"></canvas>

<!-- end snippet -->



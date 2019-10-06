Title: WebGL texImage2D Issues: How to get texture onto unit/object?
Description:
TOC: qna

# Question:

So I'm looking for some help on WebGL textures/3D rendering.

The point of my code (what I have done of it so far) is to create a 3D maze of textured blocks/cubes that the user can navigate through via arrow keys or WASD. The issue I'm having is just with texImage2d() I believe.

I've tried things like

     var stonePic = document.getElementById("stoneTex");
     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, stonePic));

which didn't work and resulted in <a href="http://imgur.com/a/pXkja">this</a>.

I also tried

    var stonePic = new Image();
    stonePic.src = "stoneWall2.png";

which resulted in the same error.

What am I doing wrong? Am I able to fix it?

    <HTML>
     <HEAD>
      <TITLE>Brick Wall Maze</TITLE>
     <SCRIPT>
      
     //VERTEX SHADER TEXT
     var vertexShaderText = 
     [
      'precision mediump float;',
      '',
      'attribute vec3 vertPosition;',
      'attribute vec2 vertTexCoord;',
      'varying vec2 fragTexCoord;',
      'uniform vec3 theta;',
      'uniform vec3 trans;',
      'uniform float thetaC;',
      'uniform vec3 camLoc;',
      'void main()',
      '{',
      'fragTexCoord = vertTexCoord;',
      'vec3 c = cos(theta);',
      'vec3 s = sin(theta);',
      '',
      'mat4 ry = mat4(c.y,0.0,-1.0*s.y,0.0, 0.0,1.0,0.0,0.0, s.y,0.0,c.y,0.0, 0.0,0.0,0.0,1.0);',
      'mat4 translate = mat4(1,0,0,0, 0,1,0,0, 0,0,1,0, trans.x,trans.y,trans.z,1);',
      'vec4 tempLoc = vec4(vertPosition, 1.0);',
      
      'float l = -1.0;',
      'float r = 1.0;',
      'float t = 1.0;',
      'float b = -1.0;',
      'float f = 100.0;',
      'float n = 1.0;',
      'mat4 perspective  = mat4(2.0*n/(r-l),0,0,0,  0,2.0*n/(t-b),0,0, (r+l)/(r-l),(t+b)/(t-b),-1.0*(f+n)/(f-n),-1.0,   0,0,-2.0*f*n/(f-n),0);',
      
      'float tempc = cos(thetaC);',
      'float temps = sin(thetaC);',
      'mat4 camRY = mat4(tempc,0,-1.0*temps,0, 0,1,0,0, temps,0,tempc,0, 0,0,0,1);',
      'mat4 viewM = mat4(1.0,0,0,0, 0,1.0,0,0, 0,0,1.0,0, camLoc.x,camLoc.y,camLoc.z,1.0);',
      'gl_Position = perspective * camRY * viewM * translate * ry * tempLoc;',
      '}'
     ].join("\n");
     
     // FRAGMENT SHADER TEXT
     var fragmentShaderText = 
     [
      'precision mediump float;',
      'varying vec2 fragTexCoord;',
      'uniform sampler2D sampler;',
      'void main()',
      '{',
      'gl_FragColor = texture2D(sampler, fragTexCoord);',
      '}'
     ].join('\n');
    
     // ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
     
     function initializeGL()
     { 
      var canvas = document.getElementById("screen"); 
      var gl =  canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) { alert("WEBGL IS NOT AVAILABLE"); }
    
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0.5, 0.7, 0.6 ,1.0);
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      
      return gl;
     }
     
     function initializeShaders(gl)
     {
      // VERTEX SHADER
      var vertexShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertexShader, vertexShaderText);
      gl.compileShader(vertexShader);
      if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
       console.log("ERROR: ",gl.getShaderInfoLog(vertexShader));
      }
    
      // FRAGMENT SHADER
      var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragmentShader,fragmentShaderText);
      gl.compileShader(fragmentShader);
      if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
       console.log("ERROR: ",gl.getShaderInfoLog(fragmentShader));
      }
      
      // PROGRAM
      var program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
    
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
       console.error("ERROR", gl.getShaderInfoLog(program));
      }
    
      gl.validateProgram(program);
      if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
       console.error("ERROR", gl.getShaderInfoLog(program));
      }
    
      return program;
     }
    
     // var brickTexture;
     var stoneTexture;
     
     function setupIndBuffers(gl, program, buffer)
     {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);  
      positionAttributeLocation = gl.getAttribLocation(program, "vertPosition");
      texCoordAttributeLocation = gl.getAttribLocation(program, "vertTexCoord");
      gl.vertexAttribPointer(
      positionAttributeLocation, //ATTRIBUTE LOCATION
      3, //NUMBER of elements per attribute
      gl.FLOAT, //TYPES OF ELEMENTS
      gl.FALSE,
      5*Float32Array.BYTES_PER_ELEMENT, //SIZE OF AN INDIVIDUAL VERTEX
      0 //OFFSET
      );
      
      
      gl.vertexAttribPointer(
      texCoordAttributeLocation, //ATTRIBUTE LOCATION
      2, //NUMBER of elements per attribute
      gl.FLOAT, //TYPES OF ELEMENTS
      gl.FALSE,
      5*Float32Array.BYTES_PER_ELEMENT, //SIZE OF AN INDIVIDUAL VERTEX
      3*Float32Array.BYTES_PER_ELEMENT //OFFSET
      );
      
      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.enableVertexAttribArray(texCoordAttributeLocation);
     }
     
     function setupVertices(gl, program)
     {
      /*
      // Brick Texture
      brickTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, brickTexture);
    
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
    
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    
      var brickArray = [];
      
      for (i = 0; i < 16; i++) {
       for (j = 0; j < 16; j++) {
        if (i == 0 || j == 0) {
         // Push Black
         brickArray.push(0, 0, 255);
        }
        else {
         // Push Red
         brickArray.push(220, 30, 30, 255);
        }
       }
      }
    
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 16, 16, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(brickArray));
      gl.bindTexture(gl.TEXTURE_2D, null);
      */
      
      // ~ ~ ~ ~ ~
      // STONE TEXTURE
      stoneTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, stoneTexture);
    
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, stonePic);
    
      gl.bindTexture(gl.TEXTURE_2D, null);
     }
     
     /*
     brickVertices = 
     [
      // X, Y, Z     U, V,            
     
      // Top
      -1.0, 1.0, -1.0,   0.0, 0.0,
      -1.0, 1.0, 1.0,    0.0, 10,
      1.0, 1.0, 1.0,     10, 10,
      1.0, 1.0, -1.0,    10, 0.0,
    
      // Left
      -1.0, 1.0, 1.0,    10,10,
      -1.0, -1.0, 1.0,   0,10,
      -1.0, -1.0, -1.0,  0,0,
      -1.0, 1.0, -1.0,   10,0,
    
      // Right
      1.0, 1.0, 1.0,    10,10,
      1.0, -1.0, 1.0,   0,10,
      1.0, -1.0, -1.0,  0,0,
      1.0, 1.0, -1.0,   10,0,
    
      // Front
      1.0, 1.0, 1.0,     10,10,
      1.0, -1.0, 1.0,    10,0,
      -1.0, -1.0, 1.0,   0,0,
      -1.0, 1.0, 1.0,    0,10,
    
      // Back
      1.0, 1.0, -1.0,     10,10,
      1.0, -1.0, -1.0,    10,0,
      -1.0, -1.0, -1.0,   0,0,
      -1.0, 1.0, -1.0,    0,10,
    
      // Bottom
      -1.0, -1.0, -1.0,   0,0,
      -1.0, -1.0, 1.0,    0,10,
      1.0, -1.0, 1.0,     10,10,
      1.0, -1.0, -1.0,    10,0,
     ];
     */
    
     stoneVertices =
     [
      // X, Y, Z     U, V,
    
      // Top
      -1.0, 1.0, -1.0,   0.0, 0.0,
      -1.0, 1.0, 1.0,    0.0, 1.0,
      1.0, 1.0, 1.0,     1.0, 1.0,
      1.0, 1.0, -1.0,    1.0, 0.0,
    
      // Left
      -1.0, 1.0, 1.0,    1,1,
      -1.0, -1.0, 1.0,   0,1,
      -1.0, -1.0, -1.0,  0,0,
      -1.0, 1.0, -1.0,   1,0,
    
      // Right
      1.0, 1.0, 1.0,    1,1,
      1.0, -1.0, 1.0,   0,1,
      1.0, -1.0, -1.0,  0,0,
      1.0, 1.0, -1.0,   1,0,
    
      // Front
      1.0, 1.0, 1.0,     1,1,
      1.0, -1.0, 1.0,    1,0,
      -1.0, -1.0, 1.0,   0,0,
      -1.0, 1.0, 1.0,    0,1,
    
      // Back
      1.0, 1.0, -1.0,     1,1,
      1.0, -1.0, -1.0,    1,0,
      -1.0, -1.0, -1.0,   0,0,
      -1.0, 1.0, -1.0,    0,1,
    
      // Bottom
      -1.0, -1.0, -1.0,   0,0,
      -1.0, -1.0, 1.0,    0,1,
      1.0, -1.0, 1.0,     1,1,
      1.0, -1.0, -1.0,    1,0,
      ];
    
     /*
     stoneVertices =
     [
      // X, Y, Z     U, V,            
      
      // Top
      -1.0, 1.0, -1.0,   0.0, 0.0,
      -1.0, 1.0, 1.0,    0.0, 1.0,
      1.0, 1.0, 1.0,     1.0, 1.0,
      1.0, 1.0, -1.0,    1.0, 0.0,
    
      // Left
      -1.0, 1.0, 1.0,    1,1,
      -1.0, -1.0, 1.0,   0,1,
      -1.0, -1.0, -1.0,  0,0,
      -1.0, 1.0, -1.0,   1,0,
    
      // Right
      1.0, 1.0, 1.0,    1,1,
      1.0, -1.0, 1.0,   0,1,
      1.0, -1.0, -1.0,  0,0,
      1.0, 1.0, -1.0,   1,0,
    
      // Front
      1.0, 1.0, 1.0,     1,1,
      1.0, -1.0, 1.0,    1,0,
      -1.0, -1.0, 1.0,   0,0,
      -1.0, 1.0, 1.0,    0,1,
    
      // Back
      1.0, 1.0, -1.0,     1,1,
      1.0, -1.0, -1.0,    1,0,
      -1.0, -1.0, -1.0,   0,0,
      -1.0, 1.0, -1.0,    0,1,
    
      // Bottom
      -1.0, -1.0, -1.0,   0,0,
      -1.0, -1.0, 1.0,    0,1,
      1.0, -1.0, 1.0,     1,1,
      1.0, -1.0, -1.0,    1,0,
      ];
      */
    
      class Cube
      {
       constructor(test)
       {
        this.tranLoc = gl.getUniformLocation(program, "trans");
        this.thetaLoc = gl.getUniformLocation(program, "theta");
        this.loc = [0, 0, 0];
    
        if(test) {
         this.verts = stoneBuffer;
         this.texture = stoneTexture;
        }
        /*else {
         this.verts = stoneBuffer;
         this.texture = stoneTexture;
        }*/
    
        this.boxIndices =
        [
         // Top
         0, 1, 2,
         0, 2, 3,
         // Left
         5, 4, 6,
         6, 4, 7,
         // Right
         8, 9, 10,
         8, 10, 11,
         // Front
         13, 12, 14,
         15, 14, 12,
         // Back
         16, 17, 18,
         16, 18, 19,
         // Bottom
         21, 20, 22,
         22, 20, 23
        ];
    
        this.iBuffer = gl.createBuffer();
    
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(this.boxIndices), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null); 
       }
    
       render()
       {
        if (this.texture == stoneTexture) {
         //gl.bindBuffer(gl.ARRAY_BUFFER,brickBuffer);
         setupIndBuffers(gl, program, stoneBuffer);
        }
        /*else {
         //gl.bindBuffer(gl.ARRAY_BUFFER,this.crateBuffer);
         setupIndBuffers(gl, program, brickBuffer);
        }*/
        
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iBuffer);
        var thetaV = [0, 0, 0];
        gl.uniform3fv(this.tranLoc, new Float32Array(this.loc));
        gl.uniform3fv(this.thetaLoc, new Float32Array(thetaV));
        gl.drawElements(gl.TRIANGLES, this.boxIndices.length, gl.UNSIGNED_BYTE, 0);
        gl.bindTexture(gl.TEXTURE_2D, null); 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
       }
      }
    
     </SCRIPT>
     </HEAD>
    
     <BODY>
      <CANVAS ID = "screen" WIDTH = "800" HEIGHT = "600" ALT = "Your browser does not support canvas."/>
      <IMG ID = "stoneTex" SRC = "stoneWall2.png" WIDTH = "50" HEIGHT = "50" ALT = "tex"/>
    
     <SCRIPT>
     //Init GL System
     var gl = initializeGL();
     var program = initializeShaders(gl);
     setupVertices(gl, program);
     gl.useProgram(program);
     //var stonePic = document.getElementById("stoneTex");
      
     // SETUP BRICK BUFFER
     /*var brickBuffer = gl.createBuffer();
     setupIndBuffers(gl, program, brickBuffer);
     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(brickVertices), gl.STATIC_DRAW);
     gl.bindBuffer(gl.ARRAY_BUFFER, null);
     */
     
     // SETUP STONE BUFFER
     var stoneBuffer = gl.createBuffer();
     setupIndBuffers(gl, program, stoneBuffer);
     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(stoneVertices), gl.STATIC_DRAW);
     gl.bindBuffer(gl.ARRAY_BUFFER, null);
     
     // Initialize and render actual objects.
     var x = new Cube(true);
     x.loc = [-5, 0, -10];
     //var y = new Cube(false);
     //y.loc = [5, 0, -10];
    
     var loop = function()
     {
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      x.render();
      requestAnimationFrame(loop);
     }
     
     requestAnimationFrame(loop);
     </SCRIPT>
     </BODY>
     </HTML>
 



# Answer

What you're doing wrong is not waiting for the images to load. Images in web browsers are downloaded asynchronously. That means you have to wait for them to download before calling `gl.texImage2D`

Normally I'd do something like this

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    // Create a texture.
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
     
    // Fill the texture with a 1x1 blue pixel.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                  new Uint8Array([0, 0, 255, 255]));
     
    // Asynchronously load an image
    var image = new Image();
    image.src = "resources/f-texture.png";
    image.addEventListener('load', function() {
      // Now that the image has loaded make copy it to the texture.
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
      // if it's a power of 2 in both dimensions then
      // we can generate mips, otherwise we'd have to do other things
      gl.generateMipmap(gl.TEXTURE_2D);
    });

<!-- end snippet -->

`texture` is now a texture and you can start rendering with it immediately. When the image has finished downloading its contents will be copied to the texture. At that point you either need to render again or, if like most WebGL apps, and the one in the question, you're rendering continuously then it will appear automatically the next time your app renders

[See these articles](https://webglfundamentals.org/webgl/lessons/webgl-3d-textures.html)


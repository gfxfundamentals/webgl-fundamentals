Title: WebGL texture bound to texture unit 0 is not renderable error
Description:
TOC: qna

# Question:

I been getting a "texture bound to texture unit 0 is not renderable. It maybe non-power-of-2 and have incompatible texture filtering." error when loading a texture to an object in WebGL. I tried all of the suggestions on StackOverflow but none of them worked for me. I tried changing the image files to make the dimensions a power of 2 and tried different file formats (jpg, gif, png). 

I can't tell if the image is the problem or something is happening in my code. 

Fragment Shader:

    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;

    void main(void) {
     gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
    }
  

Vertex Shader:

    attribute vec3 aVertexPosition;
    attribute vec2 aTextureCoord;

    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;

    varying vec2 vTextureCoord;

    void main(void) {
      gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
      vTextureCoord = aTextureCoord;
    }


initShaders()

    function initShaders() {
 var fragmentShader = getShader(gl, "shader-fs");
 var vertexShader = getShader(gl, "shader-vs");


 //Create the program, then attach and link 
 shaderProgram = gl.createProgram();
 gl.attachShader(shaderProgram, vertexShader);
 gl.attachShader(shaderProgram, fragmentShader);
 gl.linkProgram(shaderProgram);

 //Check for linker errors.
 if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
  alert("Could not initialise shaders");
 }

 //Attach shaderprogram to openGL context.
 gl.useProgram(shaderProgram);
  
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
  
    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
 shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
    }

Texture Load:

    var sunTexture;

    function initTexture() {

    sunTexture = gl.createTexture();
 sunTexture.image = new Image();

 sunTexture.image.onload = function() {
  handleLoadedTexture(sunTexture)
 }
  
    sunTexture.image.src = "images/leaves.jpg";  
    }

    function handleLoadedTexture(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
       gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
       gl.bindTexture(gl.TEXTURE_2D, null);
    }
  

drawScene() - Render and draw the object
 

    var mvMatrix = mat4.create();
    var pMatrix = mat4.create();

    function drawScene() {

   gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
   mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);

  
      // Render the Sun
     mat4.identity(mvMatrix);  
     mat4.translate(mvMatrix, mvMatrix, 0, 0, -7.0);
     mat4.multiply(mvMatrix, mouseRotMatrix, mvMatrix);
    
     gl.bindBuffer(gl.ARRAY_BUFFER, sunVertexPositionBuffer);
     gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, sunVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
     gl.bindBuffer(gl.ARRAY_BUFFER, sunVertexTextureBuffer);
     gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, sunVertexTextureBuffer.itemSize, gl.FLOAT, false, 0, 0);

     gl.activeTexture(gl.TEXTURE0);
     gl.bindTexture(gl.TEXTURE_2D, sunTexture);
     gl.uniform1i(shaderProgram.samplerUniform, 0);


    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, sunVertexPositionBuffer.numItems);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }

initBuffers() - Set up the data for the position and texture buffer

    var sunVertexPositionBuffer; 
    var sunVertexTextureBuffer;
  
    function initBuffers() {

    sunVertexPositionBuffer = gl.createBuffer(); 
    sunVertexTextureBuffer = gl.createBuffer();
 
  
    var sRadius = 4;
    var slices = 25;
    var stacks = 12; 
    var sVertices = []; 
    var count = 0;
  
    for (t = 0 ; t < stacks ; t++ ) { 
   var phi1 = ((t)/stacks) * Math.PI;
   var phi2 = ((t+1)/stacks) * Math.PI;
    
    for (p = 0 ; p < slices + 1; p++) { 
      var theta = ((p)/slices ) * 2 * Math.PI ; 
   var xVal = sRadius * Math.cos(theta) * Math.sin(phi1);
   var yVal = sRadius * Math.sin(theta) * Math.sin(phi1);
      var zVal = sRadius * Math.cos(phi1);
            
   sVertices = sVertices.concat([xVal, yVal, zVal]);
      count++;
      
      var xVal = sRadius * Math.cos(theta) * Math.sin(phi2);
      var yVal = sRadius * Math.sin(theta) * Math.sin(phi2);
   var zVal = sRadius * Math.cos(phi2);
      
   sVertices = sVertices.concat([xVal, yVal, zVal]);
      count++;
     }
    }
   
     var textureCoords = [];
  
     for (t = 0; t < stacks; t++) {
   var phi1 = ((t)/stacks);
   var phi2 = ((t+1)/stacks);
    
   for (p = 0; p < slices + 1; p++) {
    var theta = 1 - ( (p)/slices );
      
    textureCoords = textureCoords.concat([theta, phi1]);
    textureCoords = textureCoords.concat([theta, phi2]);
   }
     }      

     gl.bindBuffer(gl.ARRAY_BUFFER, sunVertexPositionBuffer);
     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sVertices), gl.STATIC_DRAW);
     gl.bindBuffer(gl.ARRAY_BUFFER, sunVertexTextureBuffer);
     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);  
  
     sunVertexPositionBuffer.itemSize = 3; 
     sunVertexPositionBuffer.numItems = count 
     sunVertexTextureBuffer.itemSize = 2;
     sunVertexTextureBuffer.numItems = stacks * (slices + 1) * 2;

     gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

# Answer

The issue is likely that the code starts rendering before the images has loaded and until that time your texture is not-renderable.

My solution is always to start the texture with a single pixel so it's renderable immediately

     sunTexture = gl.createTexture();
     gl.bindTexture(gl.TEXTURE_2D, sunTexture);
     gl.texImage2D(gl.TEXTURE_2D, 1, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                   new Uint8Array([0, 0, 255, 255])); // blue

When the image finishes loading the code will update the texture but until then it's usable.

See [these tutorials](https://webglfundamentals.org/webgl/lessons/webgl-3d-textures.html)

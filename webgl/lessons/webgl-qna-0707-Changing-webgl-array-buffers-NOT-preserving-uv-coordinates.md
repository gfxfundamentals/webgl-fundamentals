Title: Changing webgl array buffers NOT preserving uv coordinates
Description:
TOC: qna

# Question:

I have been beating my head against the wall for a while on this.
I am using webgl and I have to sets of vertices.  (The x,y and z are the same but I am also including u,v for the texture.)  
One set goes from 0 to 1 for the texture map and the other goes from 0 to 10 (in order to repeat the texture.  

However, depending on which array buffer I setup last, that is the only UV used.

     //SETUP Crate Texture
 var crateBuffer = gl.createBuffer();
 setupIndBuffers(gl,program,crateBuffer);
 gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(crateVerts),gl.STATIC_DRAW);
 gl.bindBuffer(gl.ARRAY_BUFFER, null);
 
 //Setup brick vertex buffer (and UV)
 var brickBuffer = gl.createBuffer();
 setupIndBuffers(gl,program,brickBuffer);
 gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(brickVerts),gl.STATIC_DRAW);
 gl.bindBuffer(gl.ARRAY_BUFFER, null);

This will result in the texture being repeated 10 times 

However,

     
 //Setup brick vertex buffer (and UV)
 var brickBuffer = gl.createBuffer();
 setupIndBuffers(gl,program,brickBuffer);
 gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(brickVerts),gl.STATIC_DRAW);
 gl.bindBuffer(gl.ARRAY_BUFFER, null);
 
 //SETUP Crate Texture
 var crateBuffer = gl.createBuffer();
 setupIndBuffers(gl,program,crateBuffer);
 gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(crateVerts),gl.STATIC_DRAW);
 gl.bindBuffer(gl.ARRAY_BUFFER, null);

This will make both texture not repeat.  Originally I tried to put the array buffer inside the objects and I thought it was a javaScript binding problem.  However that does not seem to be the issue.  

Any suggestions or advice would be welcome.  

Here is my entire code:

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

      //SHADER TEXT
      
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
     'mat4 ry = mat4(c.y,0.0,-1.0*s.y,0.0,0.0,1.0,0.0,0.0,s.y,0.0,c.y,0.0,0.0,0.0,0.0,1.0);',
     'mat4 translate = mat4(1,0,0,0,0,1,0,0,0,0,1,0, trans.x,trans.y,trans.z,1);',
     'vec4 tempLoc = vec4(vertPosition,1.0);',
     
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
     'gl_Position =   perspective* camRY*viewM* translate * ry* tempLoc;',
     '}'
     ].join("\n");
     
     var fragmentShaderText = 
     [
     'precision mediump float;',
     'varying vec2 fragTexCoord;',
     'uniform sampler2D sampler;//samplers appear in order defined',
     'void main()',
     '{',
     'gl_FragColor = texture2D(sampler,fragTexCoord);',
     '}'
     ].join('\n');
     
     function getGL()
     { 
      var c = document.getElementById("MyScreen"); 
      var gl =  c.getContext("webgl")||c.getContext("experimental-webgl");
      if(!gl)
      {
       alert("WEBGL IS NOT AVAILABLE");
      }
      gl.viewport(0,0,c.width, c.height);
      gl.clearColor(.6,.6,1.0,1.0);
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      
      //VERY IMPORTANT
      gl.enable(gl.DEPTH_TEST);
      
      return gl;
     }
     
     function initShaderProgram(gl)
     {
      //Setup shaders
      var vertexShader = gl.createShader(gl.VERTEX_SHADER);
      var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      
      gl.shaderSource(vertexShader,vertexShaderText);
      gl.shaderSource(fragmentShader,fragmentShaderText);
      gl.compileShader(vertexShader);
      if(!gl.getShaderParameter(vertexShader,gl.COMPILE_STATUS))
      {
       console.log("ERROR: ",gl.getShaderInfoLog(vertexShader));
      }
      gl.compileShader(fragmentShader);
      if(!gl.getShaderParameter(fragmentShader,gl.COMPILE_STATUS))
      {
       console.log("ERROR: ",gl.getShaderInfoLog(fragmentShader));
      }
      
      //Setup program
      var program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))
      {
       console.error('ERROR', gl.getShaderInfoLog(program));
      }
      gl.validateProgram(program);
      if(!gl.getProgramParameter(program,gl.VALIDATE_STATUS))
      {
       console.error('ERROR', gl.getShaderInfoLog(program));
      }
      return program;
     }
     var brickTexture;
     var checkeredTexture;
     var XTexture;
     
     function setupIndBuffers(gl,program, buff)
     {
      gl.bindBuffer(gl.ARRAY_BUFFER,buff);  
      positionAttributeLcoation = gl.getAttribLocation(program,'vertPosition');
      texCoordAttributeLocation = gl.getAttribLocation(program,'vertTexCoord');
      gl.vertexAttribPointer(
      positionAttributeLcoation, //ATTRIBUTE LOCATION
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
      
      gl.enableVertexAttribArray(positionAttributeLcoation);
      gl.enableVertexAttribArray(texCoordAttributeLocation);
     }
     
     function setupVertices(gl,program)
     {
      checkeredTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, checkeredTexture);
      //Sets up our S
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,gl.REPEAT); //gl.MIRRORED_REPEAT//gl.CLAMP_TO_EDGE
      //Sets up our T
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT); //gl.MIRRORED_REPEAT//gl.CLAMP_TO_EDGE                   
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
      //Actually get our texture;
      var myPic = [];
      for(i =0; i < 16; i ++)
      {
       for(j =0; j< 16; j ++)
       {
        if(i%2 == j%2)
        {
         //Push red
         myPic.push(0,255,0,255);
        }
        else
        {
         myPic.push(128,255,128,255);
        } 
       }
      }
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,16,16,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(myPic));
      gl.bindTexture(gl.TEXTURE_2D,null);
      //
      //
      //
      //Brick Texture
      //
      //
      brickTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, brickTexture);
      //Sets up our S
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);//gl.CLAMP_TO_EDGE
      //Sets up our T
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,gl.MIRRORED_REPEAT);//gl.CLAMP_TO_EDGE                                                    
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
      var myPic2 = [];
      for(i =0; i < 16; i ++)
      {
       for(j =0; j< 16; j ++)
       {
        if(i == 0 || j ==0)
        {
         //Push Black
         myPic2.push(0,0,0,255);
        }
        else
        {
         myPic2.push(255,30,30,255);
        }
        
       }
      }
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,16,16,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(myPic2));
      gl.bindTexture(gl.TEXTURE_2D,null);
      
      //
      //X TEXTURE/
      //
      XTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, XTexture);
      //Sets up our S
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);//gl.CLAMP_TO_EDGE
      //Sets up our T
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,gl.MIRRORED_REPEAT);//gl.CLAMP_TO_EDGE                                                         
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
      var myPic2 = [];
      for(i =0; i < 16; i ++)
      {
       for(j =0; j< 16; j ++)
       {
        if(i == 0 || j ==0 || i == 15 || j == 15 || i ==j || i+j == 15)
        {
         //Push red
         myPic2.push(0,0,0,255);
        }
        else
        {
         myPic2.push(137,63,69,255);
        }
        
       }
      }
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,16,16,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(myPic2));
      gl.bindTexture(gl.TEXTURE_2D,null); 
      gl.activeTexture(gl.TEXTURE0); 
     }
     
     //
     //Initializing the GL context
     //
     
     brickVerts = 
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

     
     crateVerts = [
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
     
      class cube
      {
       constructor(test)
       {
        this.tranLoc = gl.getUniformLocation(program,'trans');
        this.thetaLoc = gl.getUniformLocation(program,'theta');
        this.loc = [0,0,0];
        if(test)
        {
         this.verts = brickBuffer;
         this.tex = brickTexture;
        }
        else
        {
         this.verts = crateBuffer;
         this.tex = XTexture;
        }
        this.boxIndices =
        [// Top
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
        22, 20, 23    ];
        this.iBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.iBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint8Array(this.boxIndices),gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,null);
        
       }
       render()
       {
        gl.bindBuffer(gl.ARRAY_BUFFER,this.verts);
        gl.bindTexture(gl.TEXTURE_2D, this.tex);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.iBuffer);
        var thetaV = [0,0,0];
        gl.uniform3fv(this.tranLoc,new Float32Array(this.loc));
        gl.uniform3fv(this.thetaLoc,new Float32Array(thetaV));
        gl.drawElements(gl.TRIANGLES,this.boxIndices.length,gl.UNSIGNED_BYTE,0);
        gl.bindTexture(gl.TEXTURE_2D,null); 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,null);
        gl.bindBuffer(gl.ARRAY_BUFFER,null);
       }
      
      }


      //Init GL System
     var gl = getGL();
     var program = initShaderProgram(gl);
     setupVertices(gl,program);
     gl.useProgram(program);
      

     
     //Setup brick vertex buffer (and UV)
     var brickBuffer = gl.createBuffer();
     setupIndBuffers(gl,program,brickBuffer);
     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(brickVerts),gl.STATIC_DRAW);
     gl.bindBuffer(gl.ARRAY_BUFFER, null);
     
     //SETUP Crate Texture
     var crateBuffer = gl.createBuffer();
     setupIndBuffers(gl,program,crateBuffer);
     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(crateVerts),gl.STATIC_DRAW);
     gl.bindBuffer(gl.ARRAY_BUFFER, null);
     
     //Initialize and render actual objects.
     var x = new cube(true);
     x.loc = [-5,0,-10];
     var y = new cube(false);
     y.loc = [5,0,-10];
     var loop = function()
     {
     gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
     x.render();
     y.render();
     requestAnimationFrame(loop);
     }
     requestAnimationFrame(loop);

<!-- language: lang-html -->


     <img id="tex" src =  "https://opengameart.org/sites/default/files/cratetex.png" alt="texture" width = "0" height = "0" />
      <CANVAS ID ="MyScreen" width="400" Height="250" alt="Your browser does not support canvas"></CANVAS>
     
     


<!-- end snippet -->

 
 

# Answer

You need to set up your attributes before **EACH** draw call (or rather anytime you want to draw something different). Either that or use vertex array objects.

Each attribute has a reference to a buffer. That reference is set at the time you call `gl.vertexAttribPointer` for some attribute. So to draw with a different buffer on that attribute you need to first call `gl.bindBuffer(gl.ARRAY_BUFFER, bufferYouWantTheAttributeToUse)` and then call `gl.vertexAttribPointer` which set the attribute use that buffer.

[See this explanation for more](https://stackoverflow.com/questions/46214731/how-do-webgl-attributes-work)

Also [see this](https://webglfundamentals.org/webgl/lessons/webgl-drawing-multiple-things.html)

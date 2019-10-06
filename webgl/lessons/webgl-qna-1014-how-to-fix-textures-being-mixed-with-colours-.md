Title: how to fix textures being mixed with colours?
Description:
TOC: qna

# Question:

Current Problem

![Current problem][1] 

Intended Wall texture

![Intended Wall texture][2] 

The wall is not drawn with the desired texture. Random colors are being mixed with the wall texture on the cylinder. The rest of the objects don't need a texture. The program is run on a localhost and the image is definitely being loaded. Here is my code for the building. How can I fix the texture problem?
The script library gl-matrix-mi.js is loaded as well. There are 2 buttons and 2 sliders created in the html file which calls initDemo().

```
var mat4 = glMatrix.mat4;
var segments = 64,m_zoom=5,zoomValue=5;
var xRotateNeg = 1,m_XAngle=0,xRotSpeed=5;
var groundVertices = null;
var cylVertices=[];
var points = [0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0];
var coneVertices=[];
var indices=[];
var positionAttribLocation = null;
var colorAttribLocation = null;
var gl = null;
var program = null;
var theVertexBufferObject = null;
var matWorldUniformLocation =null;
var matViewUniformLocation =null;
var matProjectionUniformLocation =null;
var worldMatrix   = null;
var viewMatrix   = null;
var projectionMatrix = null;
var canvas = null;
var myElement= null;
var wallTexture = null;

var vertexShaderText =
[
'precision mediump float;',
'',
'attribute vec3 vertPosition;',
'attribute vec3 vertColor;',
'attribute vec2 vertTexCoord;',
'varying vec2 fragTexCoord;',
'varying vec3 fragColor;',
'uniform mat4 mWorld;',
'uniform mat4 mView;',
'uniform mat4 mProjection;',
'',
'void main()',
'{',
' fragColor = vertColor;',
' fragTexCoord = vertTexCoord;',
' gl_Position = mProjection * mView * mWorld * vec4(vertPosition, 1.0);',
'}'
].join('\n');

var fragmentShaderText =
[
'precision mediump float;',
'',
'varying vec3 fragColor;',
'void main()',
'{',
' gl_FragColor = vec4(fragColor, 1.0);',
'}'
].join('\n');

var fragTexShaderText =
[
'precision mediump float;',
'',
'varying vec2 fragTexCoord;',
'uniform sampler2D sampler;',
'void main()',
'{',
' gl_FragColor = texture2D(sampler,fragTexCoord);',
'}'
].join('\n');

var initDemo = function () {
 console.log('This is working');
 
 canvas = document.getElementById('game-surface');
 gl = canvas.getContext('webgl');
 
 if (!gl) {
  console.log('WebGL not supported, falling back on experimental-webgl');
  gl = canvas.getContext('experimental-webgl');
 }
 if (!gl) {
  alert('Your browser does not support WebGL');
 }
 
 clear();
 gl.enable(gl.DEPTH_TEST);
 
 //
 //Create Shaders
 //
 var vertexShader = gl.createShader(gl.VERTEX_SHADER);
 var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
 var fragmentTexShader = gl.createShader(gl.FRAGMENT_SHADER);
 
 gl.shaderSource(vertexShader,vertexShaderText);
 gl.shaderSource(fragmentShader,fragmentShaderText);
 gl.shaderSource(fragmentTexShader,fragTexShaderText);
 
 gl.compileShader(vertexShader);

 if (!gl.getShaderParameter(vertexShader,gl.COMPILE_STATUS)){
  console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader));
  return;
 }

 gl.compileShader(fragmentShader);
 
 if (!gl.getShaderParameter(fragmentShader,gl.COMPILE_STATUS)){
  console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader));
  return;
 }

 gl.compileShader(fragmentTexShader);
 
 if (!gl.getShaderParameter(fragmentTexShader,gl.COMPILE_STATUS)){
  console.error('ERROR compiling fragment tex shader!', gl.getShaderInfoLog(fragmentTexShader));
  return;
 }
 //
 // set Listeners
 //
 document.getElementById("btnStopStart").addEventListener("click", f_StopStart); 
 document.getElementById("btnRedirect").addEventListener("click", f_ChangeDirection);
 document.getElementById("sldRotation").addEventListener("change", f_AdjustRotSpeed);
 document.getElementById("sldZoom").addEventListener("change", f_AdjustZoom);
 xRotSpeed =document.getElementById("sldRotation").value;
 m_zoom  =document.getElementById("sldZoom").value;
 //
 // Attach Shaders
 //
 program = gl.createProgram();
 gl.attachShader(program,vertexShader);
 gl.attachShader(program,fragmentShader);
 
 gl.linkProgram(program);
 if (!gl.getProgramParameter(program,gl.LINK_STATUS)){
  console.error('ERROR linking program!', gl.getProgramInfoLog(program));
  return;
 }

 //
 //Set vertices
 //
 var y=2, k=0, radius=1; //The origin
 var red=0.5,green=0.4,blue=0.4;
 var u=0;
 for (i =0;i<=(segments);i++){
  u = i / (360/segments*2.13);
  x = radius*Math.cos(2*Math.PI*u);
  z = radius*Math.sin(2*Math.PI*u);

  if (k>7){k=0};
  //Bottom cylinder
  cylVertices.push( x, 0, z, points[k] , points[k+1]);
  k+=2;
  //Top cylinder
  cylVertices.push( x, y, z, points[k] , points[k+1]);
  k+=2;
  //Cone Bottom vertices
  coneVertices.push(x, y, z);
  coneVertices.push(red-0.2,green-0.2,blue-0.2);
  //Cone Top vertices
  coneVertices.push(0, y+2, 0);
  coneVertices.push(red-0.2,green-0.2,blue-0.2);
 }
 
 groundVertices =
 [ //T1 X,Y,Z   R  ,G ,B
  -4.0, -0.01, 4.0, 0.1,0.8,0.1,
  -4.0, -0.01, -4.0, 0.1,0.8,0.1,
  4.0, -0.01, -4.0, 0.1,0.8,0.1,
  //T2
  4.0, -0.01, 4.0, 0.1,0.8,0.1,
  -4.0, -0.01, 4.0, 0.1,0.8,0.1,
  4.0, -0.01, -4.0, 0.1,0.8,0.1
 ];
 cylArray  = new Float32Array(cylVertices); //sidearray
 coneArray  = new Float32Array(coneVertices); //cone side array
 

 matWorldUniformLocation =gl.getUniformLocation(program,'mWorld');
 matViewUniformLocation =gl.getUniformLocation(program,'mView');
 matProjectionUniformLocation=gl.getUniformLocation(program,'mProjection');

 worldMatrix   = new Float32Array(16);
 viewMatrix   = new Float32Array(16);
 projectionMatrix = new Float32Array(16);
 
 xRotationMatrix = new Float32Array(16);
 gl.useProgram(program);
 var identityMatrix = new Float32Array(16);
 mat4.identity(identityMatrix);
 //
 //------MAIN RENDER LOOP-------
 //
 var angle = 0;
 var loop = function (){
  setCamera();
  angle = performance.now() / 1000 / 6 * 2 * Math.PI;
  mat4.rotate(xRotationMatrix,identityMatrix, angle * (m_XAngle*0.1) * xRotateNeg, [0,1,0]);//x rotation
  gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, xRotationMatrix);
  
  clear();
  
  theVertexBufferObject = gl.createBuffer();
  colorBufferObject = gl.createBuffer();
  
  gl.enableVertexAttribArray(positionAttribLocation);
  gl.enableVertexAttribArray(colorAttribLocation);
  
  drawCone();
  drawGround();

  gl.detachShader(program,fragmentShader);
  gl.attachShader(program,fragmentTexShader);
  
  gl.bindTexture(gl.TEXTURE_2D, wallTexture);
  gl.activeTexture(gl.TEXTURE0);
  drawCylSide();

  gl.detachShader(program,fragmentTexShader);
  gl.attachShader(program,fragmentShader);
  
  requestAnimationFrame(loop);
 };
 requestAnimationFrame(loop);
};
//
// --------------------functions--------------------
//
// Draw Cylinder
function drawCylSide(){
 gl.bindBuffer(gl.ARRAY_BUFFER,theVertexBufferObject);
 gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cylArray),gl.STATIC_DRAW);
 
 setPointer(5);
 gl.enableVertexAttribArray(positionAttribLocation);

 var texCoordAttribLocation = gl.getAttribLocation(program,'vertTexCoord');
 gl.vertexAttribPointer(
  texCoordAttribLocation,    //Attribute location
  2,         //Number of vertix elements
  gl.FLOAT,       //Type of elements
  gl.FALSE,       //Normalised
  5 * Float32Array.BYTES_PER_ELEMENT, //Size of individual vertex
  3 * Float32Array.BYTES_PER_ELEMENT, //Offset
 );
 gl.enableVertexAttribArray(texCoordAttribLocation);
 wallTexture = gl.createTexture();
 gl.bindTexture(gl.TEXTURE_2D, wallTexture);
 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.texImage2D(
  gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
  gl.UNSIGNED_BYTE,
  document.getElementById('wall-img')
 );
 gl.bindTexture(gl.TEXTURE_2D, null);

 gl.drawArrays(gl.TRIANGLE_STRIP,0, segments);
};
//
// Draw Cone
//
function drawCone(){
 gl.bindBuffer(gl.ARRAY_BUFFER,theVertexBufferObject);
 gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coneArray),gl.STATIC_DRAW);
 setPointer(6);
 setColorPointer();
 gl.enableVertexAttribArray(colorAttribLocation);
 gl.drawArrays(gl.TRIANGLE_STRIP,0, segments);
};
//
// Draw Floor
//
function drawGround(){
 gl.bindBuffer(gl.ARRAY_BUFFER,theVertexBufferObject);
 gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(groundVertices),gl.STATIC_DRAW);
 setPointer(6);
 
 gl.drawArrays(gl.TRIANGLES, 0, 3);
 gl.drawArrays(gl.TRIANGLES, 3, 3);
};
//
// Pointers
//
function setPointer(n){
 positionAttribLocation = gl.getAttribLocation(program,'vertPosition');
 gl.vertexAttribPointer(
  positionAttribLocation,    //Attribute location
  3,         //Number of vertix elements
  gl.FLOAT,       //Type of elements
  gl.FALSE,       //Normalised
  n * Float32Array.BYTES_PER_ELEMENT, //Size of individual vertex
  0         //Offset
 );
};
function setColorPointer(){
 colorAttribLocation = gl.getAttribLocation(program,'vertColor');
 gl.vertexAttribPointer(
  colorAttribLocation,    //Attribute location
  3,         //Number of vertix elements
  gl.FLOAT,       //Type of elements
  gl.FALSE,       //Normalised
  6 * Float32Array.BYTES_PER_ELEMENT, //Size of individual vertex
  3 * Float32Array.BYTES_PER_ELEMENT, //Offset
 );
};
function clear(){
 gl.clearColor(0.75, 0.85, 0.8, 1.0);
 gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
};
function setCamera(){
 mat4.identity(worldMatrix);
 mat4.lookAt(viewMatrix,[0,1,(-1*m_zoom)],[0,0,0],[0,10,0]);
 mat4.perspective(projectionMatrix,glMatrix.glMatrix.toRadian(45),canvas.width/canvas.height,0.1,1000.0);

 gl.uniformMatrix4fv(matWorldUniformLocation,gl.FALSE,worldMatrix);
 gl.uniformMatrix4fv(matViewUniformLocation,gl.FALSE,viewMatrix);
 gl.uniformMatrix4fv(matProjectionUniformLocation,gl.FALSE,projectionMatrix); 
};
function f_StopStart(){
 if (m_XAngle!=0) {m_XAngle=0}
 else{m_XAngle=document.getElementById("sldRotation").value;};
};
function f_ChangeDirection(){
 xRotateNeg= xRotateNeg*-1;
};
function f_AdjustRotSpeed(){
 xRotSpeed=document.getElementById("sldRotation").value;
 m_XAngle=xRotSpeed;
};
function f_AdjustZoom(){
 zoomValue=document.getElementById("sldZoom").value;
 m_zoom=zoomValue;
};
```

The goal would be for only the wall (cylinder) to have texture.


  [1]: https://i.stack.imgur.com/0Kr5U.png
  [2]: https://i.stack.imgur.com/Dkste.jpg

# Answer

As Kirill pointed out if you leave your code the same you'd need to call `gl.linkProgram` after detaching and attaching new shaders but that effectively makes a new program. All your uniform locations will become invalid and you'll need to look up the locations again. It's not common to do things that way.

It's far [more common to create multiple programs at init time and use them at render time](https://webglfundamentals.org/webgl/lessons/webgl-drawing-multiple-things.html)

Uniforms also are not shared across programs. You need to look up attribute and uniform locations for each program even if they have the same names.

You might find [these tutorials](https://webglfundamentals.org) useful.

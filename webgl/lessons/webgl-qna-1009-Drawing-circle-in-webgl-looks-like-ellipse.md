Title: Drawing circle in webgl looks like ellipse
Description:
TOC: qna

# Question:

I'm new to webgl and trying to draw circle but somehow it looks like an ellipse not exact shape that I want. Where did I made mistake (or other problem in code)?

index.html files just contains canvas element with width=900 height=600. So I didn't add it here.
    
    var vertexShader=['precision mediump float;','attribute vec2 vPosition;','attribute vec3 vColor;','varying vec3 fragColor;','void main()','{','fragColor=vColor;','gl_Position=vec4(vPosition,0.0,1.0);','}'].join('\n');
    var fragmentShader=['precision mediump float;','varying vec3 fragColor;','void main(){','gl_FragColor=vec4(fragColor,1.0);','}'].join('\n');
 

    function init(){
 console.log('running');
 var canvas=document.getElementById('canvas');
 var gl=canvas.getContext('webgl');

 //CLEAR
 gl.clearColor(1.0,0.0,0.0,1.0);//R,G,B,Alfa
 gl.clear(gl.COLOR_BUFFER_BIT);//gl.DEPTH_BUFFER_BIT

 //SHADERS
 var vertShader=gl.createShader(gl.VERTEX_SHADER);
 gl.shaderSource(vertShader,vertexShader);
 var fragShader=gl.createShader(gl.FRAGMENT_SHADER);
 gl.shaderSource(fragShader,fragmentShader);
 gl.compileShader(vertShader);
 gl.compileShader(fragShader);

 //PROGRAM
 var program=gl.createProgram();
 gl.attachShader(program,vertShader);
 gl.attachShader(program,fragShader);
 gl.linkProgram(program);
 gl.useProgram(program);

 var numberofsides=360;
 var triangleVertices=yuvarlakCiz(-0.19,0,0,0.35,numberofsides);
 var triangleVertices2=yuvarlakCiz(-0.1,0,0,0.29,numberofsides); 
 triangleVertices=renkAyarla(1.0,1.0,1.0,triangleVertices);
 triangleVertices2=renkAyarla(1.0,0.0,0.0,triangleVertices2);
 console.log(triangleVertices);
 //BUFFER
 var triangleBuffer=gl.createBuffer();
 gl.bindBuffer(gl.ARRAY_BUFFER,triangleBuffer);
 gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(triangleVertices),gl.STATIC_DRAW);
 //LOCATION ALMA
 var attloc=gl.getAttribLocation(program,'vPosition');
 var attcolor=gl.getAttribLocation(program,'vColor');
 //ATTRIBUTE AYARLAMA
 gl.vertexAttribPointer(
  attloc,
  2,
  gl.FLOAT,
  gl.FALSE,
  5*Float32Array.BYTES_PER_ELEMENT,
  0
 );
 gl.vertexAttribPointer(
  attcolor,
  3,
  gl.FLOAT,
  gl.FALSE,
  5*Float32Array.BYTES_PER_ELEMENT,
  2*Float32Array.BYTES_PER_ELEMENT
 );
 //İLK CIRCLE ÇİZME
 gl.enableVertexAttribArray(attloc); 
 gl.enableVertexAttribArray(attcolor);
 gl.drawArrays(gl.TRIANGLE_FAN, 0,numberofsides+2); 
 //2.CIRCLE BUFFER
 var circle2=gl.createBuffer(); 
 gl.bindBuffer(gl.ARRAY_BUFFER,circle2);
 gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(triangleVertices2),gl.STATIC_DRAW);
  
 var attloc1=gl.getAttribLocation(program,'vPosition');
 var attcolor1=gl.getAttribLocation(program,'vColor');
 gl.vertexAttribPointer(
  attloc1,
  2,
  gl.FLOAT,
  gl.FALSE,
  5*Float32Array.BYTES_PER_ELEMENT,
  0
 );
 gl.vertexAttribPointer(
  attcolor1,
  3,
  gl.FLOAT,
  gl.FALSE,
  5*Float32Array.BYTES_PER_ELEMENT,
  2*Float32Array.BYTES_PER_ELEMENT
 );
 gl.enableVertexAttribArray(attloc1);
 gl.enableVertexAttribArray(attcolor1);
 //gl.drawArrays(gl.TRIANGLE_FAN, 0,numberofsides+2);
 
 
    }

    function yuvarlakCiz(x,y,z,radius,numberofsides){
 var numberofVertices=numberofsides+2;
 var doublepi=2*Math.PI;

 var verticesX=[];
 var verticesY=[];
 var verticesZ=[];
 verticesX[0]=x;
 verticesY[0]=y;
 verticesZ[0]=z;
 for (var i = 1 ;i<numberofVertices; i++) {
  verticesX[i]=x+(radius * Math.cos(i*doublepi/numberofsides));  
  verticesY[i]=y+(radius * Math.sin(i*doublepi/numberofsides));
  verticesZ[i]=z;
 }
 var mergeVertices=[];
 for (var i = 0 ;i<numberofVertices; i++) {
  mergeVertices[i*5]=verticesX[i];
  mergeVertices[i*5+1]=verticesY[i];
  mergeVertices[i*5+2]=0.0;
  mergeVertices[i*5+3]=0.0;
  mergeVertices[i*5+4]=0.0;
 // mergeVertices[i*3+2]=verticesZ[i];
 }
 return mergeVertices;
    }

    function renkAyarla(r,g,b,dizi){ //SETTING COLORS
 for (var i =0; i <dizi.length/5; i++) {
  dizi[i*5+2]=r;
  dizi[i*5+3]=g;
  dizi[i*5+4]=b;
 }
 return dizi;
    }

[Circle Example][1]


  [1]: https://i.stack.imgur.com/GlwJK.png

# Answer

What's missing is that WebGL always takes clip space coordinates that go from -1 to +1 across the canvas regardless of dimensions so if your canvas is not square you need to find some math to compensate.

Since it's just math there are 1000 ways to change the code.

One would be multiplying your position by the aspect of the canvas.

You currently have this

    gl_Position=vec4(vPosition,0.0,1.0);

You could change it to this

    gl_Position=vec4(vPosition * vec2(600.0/900.0, 1),0.0,1.0);

You could change it to make it so you can pass in scale

    uniform vec2 scale;
    ...
    gl_Position=vec4(vPosition * scale,0.0,1.0);

Then set `scale` to `600.0 / 900.0, 1` by looking up its location and setting it

A more common way is to use one or more matrices

    uniform mat4 matrix;
    ...
    gl_Position = matrix * vec4(vPosition, 0.0, 1.0);

In which case you can apply the same scale as a above but you can also do tons of other things.

[This series of articles](https://webglfundamentals.org) covers all of these solutions and more

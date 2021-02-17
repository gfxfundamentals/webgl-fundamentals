Title: How to draw correctly textured trapezoid polygons
Description: How to draw correctly textured trapezoid polygons
TOC: How to draw correctly textured trapezoid polygons

## Question:

I need to draw parts of a texture on trapezoids polygons. (old school fake-3D race game, the road is made of these trapezoids and I want to apply a texture on them.)

But the texture appears wrong, like if each of the two triangles forming a trapezoid are half of a parrallelogram instead, they have each a different horizontal skewing, not a global perspective transformation.


Searching for a solution I see that this problem is common and the reason why is that the two triangles are not equal and the shader is 2D. From what I found, and especially this answer : https://stackoverflow.com/a/25239021/3666866 , I tried to fix my shader. But it did not change anything...

    My shaders :  (copied from webglfundamentals.com, edited according to https://stackoverflow.com/a/25239021/3666866)

    <script id="3d-vertex-shader" type="x-shader/x-vertex">
  attribute vec4 a_position ;
  //attribute vec2 a_texcoord ;
  attribute vec4 a_texcoord ;
  uniform mat4 u_matrix ;
  //varying vec2 v_texcoord ;
  varying vec4 v_texcoord ;
  void main() {
   gl_Position = u_matrix * a_position ;
   v_texcoord = a_texcoord ;
  }
 </script>

 <script id="3d-fragment-shader" type="x-shader/x-fragment">
  precision mediump float ;
  //varying vec2 v_texcoord ;
  varying vec4 v_texcoord ;
  uniform sampler2D u_texture ;
  void main() {
    //gl_FragColor = texture2D(u_texture, v_texcoord) ;
    gl_FragColor = texture2DProj( u_texture , v_texcoord ) ;
  }
 </script>
 
 code :

 gl_.positionLocation = gl.getAttribLocation( gl_.program, "a_position" );
 gl_.texcoordLocation = gl.getAttribLocation( gl_.program, "a_texcoord" );
 gl.matrixLocation = gl.getUniformLocation( gl_.program, "u_matrix" );
 gl.textureLocation = gl.getUniformLocation( gl_.program, "u_texture" );
 gl_.positionBuffer = gl.createBuffer();
 gl.bindBuffer( gl.ARRAY_BUFFER, gl_.positionBuffer );
 var positions = new Float32Array(
  [
  -1.5, -0.5,   0.5,
   1.5, -0.5,   0.5,
  -0.5,  0.5,   0.5,
  -0.5,  0.5,   0.5,
   1.5, -0.5,   0.5,
   0.5,  0.5,   0.5,
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  
 gl_.texcoordBuffer = gl.createBuffer();
 gl.bindBuffer( gl.ARRAY_BUFFER, gl_.texcoordBuffer );
 gl.bufferData(
   gl.ARRAY_BUFFER,
   new Float32Array(
    [
    0.25, 0  ,
    0.5 , 0  ,
    0.25, 0.5,
    0.25, 0.5,
    0.5 , 0  ,
    0.5 , 0.5,
   ]),
   gl.STATIC_DRAW);


 
 The render code :
 gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
 gl.bindBuffer( gl.ARRAY_BUFFER, positionBuffer );
 gl.vertexAttribPointer(positionLocation,3,gl.FLOAT,false,0,0);
 gl.enableVertexAttribArray( texcoordLocation );
 gl.bindBuffer( gl.ARRAY_BUFFER, texcoordBuffer );
 gl.vertexAttribPointer(texcoordLocation,3,gl.FLOAT,false,0,0);
 let projectionMatrix = m4.perspective( fieldOfViewRadians, aspect, 1, 2000);
 let viewProjectionMatrix = m4.multiply( projectionMatrix, viewMatrix );
 let matrix = m4.xRotate( viewProjectionMatrix, modelXRotationRadians );
 gl.uniformMatrix4fv( matrixLocation , false , viewProjectionMatrix );
 gl.uniform1i( textureLocation , 0 );
 gl.drawArrays(gl.TRIANGLES, 0, 6 * 1 );

Where is the error ?

## Answer:

Looking at the examples you linked to you need to provide 3D texture coordinates. So instead of UVs like

     0, 0,
     0, 1,
     1, 0,
     1, 1,

They need to each be multiplied by the absolute value of the X coordinate of the trapizoid's points and then that absolute value of X needs to be the 3rd coordinate

     0 * X0, 0 * X0, X0,
     0 * X1, 1 * X1, X1,
     1 * X2, 0 * X2, X2,
     1 * X3, 1 * X3, X3,

This ends up with the same texture coordinates because `texture2DProj` divides the `xy` of each coordinate by `z` but it changes how the texture coordinate is interpolated.

You can provide that those texture coordinates by supplying them manually and putting them in a buffer or you can do it by calculating them in the vertex shader
     
```
attribute vec4 position;
attribute vec2 texcoord;

uniform mat4 u_matrix;

varying vec3 v_texcoord;

void main() {
  gl_Position = u_matrix * position;
  v_texcoord = vec3(texcoord.xy, 1) * abs(position.x);
}
```

example

{{{example url="../webgl-qna-how-to-draw-correctly-textured-trapezoid-polygons-example-1.html"}}}



<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/3666866">Diego</a>
    from
    <a data-href="https://stackoverflow.com/questions/56915103">here</a>
  </div>
</div>

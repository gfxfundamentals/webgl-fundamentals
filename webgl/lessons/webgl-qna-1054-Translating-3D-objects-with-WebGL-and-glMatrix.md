Title: Translating 3D objects with WebGL and glMatrix
Description:
TOC: qna

# Question:

I want to translate two 3D objects separately in WebGl, right now my code changes only the position and rotation of the camera.  I'm using glMatrix for vector math."buffers" is an array with the object data. 
buffers[0] and buffers[1] are two separate objects. The translation and rotation are done in drawScene function


 function drawScene(gl, programInfo, buffers, deltaTime) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var fieldOfView = 45 * Math.PI / 180; 
  var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  var zNear = 0.1;
  var zFar = 100.0;
  var projectionMatrix = mat4.create();

  mat4.perspective(projectionMatrix,fieldOfView,aspect,zNear,zFar);

  modelViewMatrix = mat4.create();

  // Camera Movement
  mat4.translate(modelViewMatrix,modelViewMatrix,[-0.0 + cubeTranslate, 0.0, -6.0]);
  mat4.rotate(modelViewMatrix,modelViewMatrix,cubeRotation,[0, 0, 1]);



  for( i = 0; i < 2; i++ ){

   var numComponents = 3;
   var type = gl.FLOAT;
   var normalize = false;
   var stride = 0;
   var offset = 0;
   gl.bindBuffer(gl.ARRAY_BUFFER, buffers[i].position);
   gl.vertexAttribPointer(
    programInfo.attribLocations.vertexPosition,
    numComponents,
    type,
    normalize,
    stride,
    offset);
   gl.enableVertexAttribArray(
    programInfo.attribLocations.vertexPosition);

   var numComponents = 4;
   var type = gl.FLOAT;
   var normalize = false;
   var stride = 0;
   var offset = 0;
   gl.bindBuffer(gl.ARRAY_BUFFER, buffers[i].color);
   gl.vertexAttribPointer(
    programInfo.attribLocations.vertexColor,
    numComponents,
    type,
    normalize,
    stride,
    offset);
   gl.enableVertexAttribArray(
    programInfo.attribLocations.vertexColor);
   

   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers[i].indices);

   gl.useProgram(programInfo.program);

   
   gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix);
   gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix);

   
   var vertexCount = 36;
   var type = gl.UNSIGNED_SHORT;
   var offset = 0;
   gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    
  }
  cubeRotation += deltaTime;
  cubeTranslate += 0.01
 }

# Answer

Your code should be structured to compute matrices for each object separately

A typical program is

    renderloop
      set viewport
      clear
      compute projection matrix
      compute view matrix
      for each object
        use program for object
        set buffers and attributes (or vertex array object)
        compute a modelView matrix
        set uniforms 
        draw

In your case you have this outside the `for each object` loop

    mat4.translate(modelViewMatrix,modelViewMatrix,[-0.0 + cubeTranslate, 0.0, -6.0]);
    mat4.rotate(modelViewMatrix,modelViewMatrix,cubeRotation,[0, 0, 1]);


That's computing a camera matrix really. To get view matrix take the inverse

    m4.invert(modelViewMatrix, modelViewMatrix);

Then inside your loop start with that matrix

    
    for each object
        
         const mat = mat4.clone(modelViewMatrix);
         
         // now do something specific for each this object
         // for example
         mat4.translate(mat, mat, [objectNdx, 0, 0]);

Honestly I'd rename your matrices like this

```
   camera = mat4.create();

    // Camera Movement
    mat4.translate(camera,camera,[-0.0 + cubeTranslate, 0.0, -6.0]);
    mat4.rotate(camera,camera,cubeRotation,[0, 0, 1]);

    view = mat4.create();
    mat4.invert(view, camera);

    modelViewMatrix = mat4.create();

    for( i = 0; i < 2; i++ ){

        mat4.copy(modelViewMatrix, view);

        // now manipulate the matrix in ways specific to this model
        // example
        mat4.translate(modelViewMatrix, modelViewMatrix, [i, 0, 0]);
```

You might find [this article helpful](https://webglfundamentals.org/webgl/lessons/webgl-drawing-multiple-things.html)

Note that often the "compute modelView matrix" part is separated into a [scene graph](https://webglfundamentals.org/webgl/lessons/webgl-scene-graph.html) or at least partially separated. the scene graph returns "world matrices" which are then combined with the view matrix either in code or in the shader.

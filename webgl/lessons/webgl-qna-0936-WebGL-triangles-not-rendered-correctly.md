Title: WebGL triangles not rendered correctly
Description:
TOC: qna

# Question:

I am trying to make a webGL application for rendering random generated terrains. The rendering of the terrain works fine (almost), but when I try to render a simple quad to simulate water, the triangles of the water are not in the right place. 

[![enter image description here][1]][1]

The red parts in the image are the messed up triangles, which should only be two triangles forming a square as big as the terrain. I found out that if the terrain size is 33x33 points (like in the image), the water buffers size makes up 1089 triangles instead of two, which is kind of weird. The same principle applies for other terrain sizes, i.e. 65x65, 129x129, etc. 

My water code is something like this with size set to 50:

    height: 0,
 rotation: [0, 0, 0],
 scale: [1, 1, 1],
 ver: [
  -size,  0,  size,
  -size,  0, -size,
   size,  0, -size,
  -size,  0,  size,
   size,  0, -size,
   size,  0,  size
 ],
 vao: undefined,
 
 setup_buffer: function(){
  
  this.vao = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vao);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.ver), gl.STATIC_DRAW);
  
  gl.vertexAttribPointer(
   water_shader.position_attrib_location, // Attribute location
   3, // Number of elements per attribute
   gl.FLOAT, // Type of elements
   gl.FALSE,
   3 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
   0 // Offset from the beginning of a single vertex to this attribute
  );
  
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
 }

So all I am doing is creating and binding a buffer, storing 6 vertices in it and specifiying them via vertexAttribPointer before unbinding the buffer. 

The terrain.setup_buffer() function is almost the same except that it uses an index buffer and that one vertex contains 9 coordinates (position, color, normal) instead of 3. Note that the terrain generation and the variables of the terrain are not in this code, but I can assure that all functions are working and all variables existing and initialized.

    this.vao = gl.createBuffer();
 gl.bindBuffer(gl.ARRAY_BUFFER, this.vao);
 gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.ver), gl.STATIC_DRAW);
  
 this.ibo = gl.createBuffer();
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
 gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.ind), gl.STATIC_DRAW);
  
 gl.vertexAttribPointer(
  terrain_shader.position_attrib_location, // Attribute location
  3, // Number of elements per attribute
  gl.FLOAT, // Type of elements
  gl.FALSE,
  9 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
  0 // Offset from the beginning of a single vertex to this attribute
 );
 gl.vertexAttribPointer(
  terrain_shader.color_attrib_location, // Attribute location
  3, // Number of elements per attribute
  gl.FLOAT, // Type of elements
  gl.FALSE,
  9 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
  3 * Float32Array.BYTES_PER_ELEMENT // Offset from the beginning of a single vertex to this attribute
 );
 gl.vertexAttribPointer(
  terrain_shader.normal_attrib_location, // Attribute location
  3, // Number of elements per attribute
  gl.FLOAT, // Type of elements
  gl.FALSE,
  9 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
  6 * Float32Array.BYTES_PER_ELEMENT // Offset from the beginning of a single vertex to this attribute
 );
  
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
 gl.bindBuffer(gl.ARRAY_BUFFER, null);

So this is my main loop with all the initializations.

    var canvas = document.getElementById('opengl-surface');
 var gl = canvas.getContext('webgl');

 if (!gl) {
  console.log('WebGL not supported, falling back on experimental-webgl');
  gl = canvas.getContext('experimental-webgl');
 }

 if (!gl) {
  alert('Your browser does not support WebGL');
 }

 gl.clearColor(0.75, 0.85, 0.8, 1.0);
 gl.enable(gl.DEPTH_TEST);
 
 //create shader
 water_shader.setup_shader();
 terrain_shader.setup_shader();
 
 // Create buffers
 terrain.generate(5, 0.9, true);
 
 water.setup_buffer();
    terrain.setup_buffer();

 var projectionMatrix = new Float32Array(16);
 mat4.perspective(projectionMatrix, glMatrix.toRadian(45), canvas.width/canvas.height, 0.1, 1000.0);
 
 gl.useProgram(water_shader.program);
 gl.uniformMatrix4fv(water_shader.location_projection_matrix, gl.FALSE, projectionMatrix);
 gl.uniform4fv(water_shader.location_color, [1, 0, 0, 1]);
 gl.useProgram(null);
 
 gl.useProgram(terrain_shader.program);
 gl.uniformMatrix4fv(terrain_shader.location_projection_matrix, gl.FALSE, projectionMatrix);
 gl.uniform3fv(terrain_shader.location_light_direction, light.direction);
 gl.uniform3fv(terrain_shader.location_light_color, light.color);
 gl.useProgram(null);
 
 //
 // Main render loop
 //
 var identity = new Float32Array(16);
 mat4.identity(identity);
 
 var loop = function(){
  
  camera.rotate();
  camera.translate();
  
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  //render terrain
  {
   gl.useProgram(terrain_shader.program);
   gl.uniformMatrix4fv(terrain_shader.location_view_matrix, gl.FALSE, camera.view_matrix());
   gl.uniformMatrix4fv(terrain_shader.location_model_matrix, gl.FALSE, terrain.model_matrix());
      
   gl.bindBuffer(gl.ARRAY_BUFFER, terrain.vao);
   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, terrain.ibo);
   gl.enableVertexAttribArray(terrain_shader.position_attrib_location);
   gl.enableVertexAttribArray(terrain_shader.color_attrib_location);
   gl.enableVertexAttribArray(terrain_shader.normal_attrib_location);
   gl.drawElements(gl.TRIANGLES, terrain.ind.length, gl.UNSIGNED_SHORT, 0);
   gl.disableVertexAttribArray(terrain_shader.position_attrib_location);
   gl.disableVertexAttribArray(terrain_shader.color_attrib_location);
   gl.disableVertexAttribArray(terrain_shader.normal_attrib_location);
   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
   gl.bindBuffer(gl.ARRAY_BUFFER, null);
   gl.useProgram(null);
  }
 
  
  //render water_shader
  {
   gl.useProgram(water_shader.program);
   gl.uniformMatrix4fv(water_shader.location_view_matrix, gl.FALSE, camera.view_matrix());
   gl.uniformMatrix4fv(water_shader.location_model_matrix, gl.FALSE, water.model_matrix());
   
   gl.bindBuffer(gl.ARRAY_BUFFER, water.vao);
   gl.enableVertexAttribArray(water_shader.position_attrib_location);
   gl.drawArrays(gl.TRIANGLES, 0, 1089); //here should be 2 istead of 1089
   gl.disableVertexAttribArray(water_shader.position_attrib_location);
   gl.bindBuffer(gl.ARRAY_BUFFER, null);
   gl.useProgram(null);
  }
  requestAnimationFrame(loop);
 };
 
 requestAnimationFrame(loop);

The shaders are pretty much straight forward and do not need much explanation. For the sake of completeness, here is my water shader code

VS:

    precision mediump float;

    attribute vec3 vertPosition;
  
 uniform mat4 modelMatrix;
 uniform mat4 viewMatrix;
 uniform mat4 projectionMatrix;
  
 void main()
 {
   gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(vertPosition, 1.0),
 }

FS:

    precision mediump float;
  
 uniform vec4 color;
  
 void main()
 {
   gl_FragColor = color;
 }

There are also other problems, e.g. if shrink the terrain size to (2^3+1)x(2^3+1) vertices, I get an "GL_INVALID_OPERATION : glDrawArrays: attempt to access out of range vertices in attribute 0" error. This should not happen, since I logged the arrays and got a vertex array of the size 729 (9x9x9), and an index array of the size 384 (8x8x2x3).

Another problem is that if I call water.setup_buffer() after terrain.setup_buffer(), both render calls (terrain and water) throw the same error as above mentioned ("GL_INVALID_OPERATION ").

If it helps, I am working on google chrome and windows 10, but on ms edge the same errors occur.  

  [1]: https://i.stack.imgur.com/pCnfb.png

# Answer

Unless you're using Vertex Array Objects (which are part of WebGL2 but are only optional in WebGL1 as an extension) the vertex attribute state **IS GLOBAL STATE**. That is state set by `gl.vertexAttribPointer`, `gl.enableVertexAttribArray`, `gl.vertexAttribXXX` is all global state unless you're using Vertex Array Objects (which you're not)

That means when you call

    water.setup_buffer();

The **global** attribute state is set. You then call

    terrain.setup_buffer();

Which overwrites the previous **global** attribute state.

Here's some answers that describe attribute state

https://stackoverflow.com/a/27164577/128511

https://stackoverflow.com/a/28641368/128511

You should either

(a) use Vertex Array Objects (VAOs) so that attribute state is per VAO

or

(b) separate setting up buffers (init time stuff) from setting up attributes (render time stuff).

Without VAOs the normal way to render is

    for each thing you want to draw
       gl.useProgram
       setup attributes for that thing
       bind textures and set uniforms for that thing
       call gl.drawElements or gl.drawArrays


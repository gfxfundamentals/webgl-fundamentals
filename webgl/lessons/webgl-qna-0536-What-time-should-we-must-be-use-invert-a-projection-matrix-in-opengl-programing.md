Title: What time should we must be use invert a projection matrix in opengl programing
Description:
TOC: qna

# Question:

 ## Rencently I saw has someone to invert a projectionMatrix to draw their 3D scene using webgl programming, I don't know the function of to invert a projectionMatrix to project the scene. I don't know what happen when you invert a projectionMatrix, 
   
     mat4.perspective(perspectiveMatrix, Math.PI/2, ratio, 0.1, 10);
     mat4.invert(projectionInverse, projectionMatrix);
     .....
     mat4.multiply(modelViewProjectMatrix, modelViewMatrix, projectionInverse);
     webGL.gl.uniformMatrix4fv(shader.uniforms['proj_inv'], false, modelViewProjectMatrix);

Is anyone could tell me what exactly happen when you invert a projectionMatrix,

# Answer

A typical projection matrix converts from a frustum of camera space into clip space (well, once you divide by w) so an inverse projection would convert from clip space back into camera space.

Typical uses are converting from screen space -> clip space -> camera space so you can do picking. That's not usually used in a shader though.

Another other common use is if you want to display a frustum to represent what a camera scenes in a 3D modeling package. In other words you have a modeling package that has 2 or more cameras. The camera the modeling package is using to view the 3D scene and the cameras in the scene that will later be used to render the scene from. To visualize which way those cameras are pointing you can render a 2 unit (-1 + 1) wireframe cube through the inverse projection. That will project the cube into the shape of a the frustum that match what that camera sees

[The live frustum diagram near the bottom of this page](http://webglfundamentals.org/webgl/lessons/webgl-3d-perspective.html) uses that technique



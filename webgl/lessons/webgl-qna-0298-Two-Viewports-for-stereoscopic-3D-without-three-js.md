Title: Two Viewports for stereoscopic 3D without three.js
Description:
TOC: qna

# Question:

Is it possible to create a stereoscopic 3D vision of my scene, easilly, without resorting to three.js?
I thought about 2 canvas or two viewports, but I don't know if it's possible to do so, so I've started by trying to create a new viewport, but it just stays black and only shows the second.

    function drawScene() {
        gl.viewport(0, 0, gl.viewportWidth/2, gl.viewportHeight);
  mat4.frustum(-24.0, 24.0, -11.0, 25.0, -100.0, 100.0, pMatrix);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
  if(perspective){
   mat4.perspective(38.5, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
  }
  if(perspectiveTP){
   mat4.perspective(53.13, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
  }
  if(orthogonal){
   mat4.ortho(-24.0, 24.0,  -11.0, 25.0, -100.0, 100.0, pMatrix);
  }
        mat4.identity(mvMatrix);
  if(perspectiveTP){
      mat4.lookAt([camX+frogH,camY,camZ+frogV],[frogH,1,frogV],[0,1,0], mvMatrix);
  }
  if(perspective){
   mat4.lookAt([-12,50,17],[-12,0,17],[0,0,1], mvMatrix);
  }
  if(orthogonal){
   mat4.lookAt([-12,52.5,10],[-12,0,10],[0,0,1], mvMatrix);
  }
  mat4.identity(pMatrix);
  gl.viewport(gl.viewportWidth/2, 0, gl.viewportWidth/2, gl.viewportHeight);
  mat4.frustum(-24.0, 24.0, -11.0, 25.0, -100.0, 100.0, pMatrix);
  
        if(perspective){
   mat4.perspective(38.5, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
  }
  if(perspectiveTP){
   mat4.perspective(53.13, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
  }
  if(orthogonal){
   mat4.ortho(-24.0, 24.0,  -11.0, 25.0, -100.0, 100.0, pMatrix);
  }
        mat4.identity(mvMatrix);

  if(perspectiveTP){
      mat4.lookAt([camX+frogH,camY,camZ+frogV],[frogH,1,frogV],[0,1,0], mvMatrix);
  }
  if(perspective){
   mat4.lookAt([-12,50,17],[-12,0,17],[0,0,1], mvMatrix);
  }
  if(orthogonal){
   mat4.lookAt([-12,52.5,10],[-12,0,10],[0,0,1], mvMatrix);
  }
(...)

EDIT: I've simply created a drawSceneLeft and a drawSceneRight, but not sure if it's the right way to achieve what I'm trying to do, any help is still welcome!

# Answer

What is your draw function doing? If it's clearing the canvas then you're basically drawing one half, erasing the entire canvas, then drawing the other half.

`gl.viewport` only sets vertex math related functions. It doesn't stop things from drawing outside the viewport. Specifically it tells WebGL how to convert from clipspace back into pixels and it clips vertex calculations. So for example if you were to draw `POINTS` and you set `gl_PointSize` to `100` those points could bleed out of your viewport. A point whose center is outside the viewport won't get drawn at all (it's clipped) but a point whose center is on the edge inside of the viewport will be drawn. Only vertex calculation is clipped and the point is inside so it's not clipped. Once it's passed that test the primitive is still rendered, in this case a 100x100 pixel `POINT` of which ~50 pixels are outside the viewport.

On the other hand. `gl.scissor` does clip during rasterization. So, enable the scissor test `gl.enable(gl.SCISSOR_TEST)` and set the scissor `gl.scissor(x, y, width, height)` and now that same `POINT` above would be clipped. `gl.clear` will also be clipped.

TD;LR you need to set both the `gl.viewport` and enable and set the scissor to render multiple viewports.

Title: How can I move the perspective vanishing point from the center of the canvas?
Description: How can I move the perspective vanishing point from the center of the canvas?
TOC: How can I move the perspective vanishing point from the center of the canvas?

## Question:

I have a simple object that draws a 3d gizmo at 0, 0, 0. If the camera is centered on 0, 0, 0, then it draws the gizmo at the center of the screen.

[![enter image description here][1]][1]

I would like to "lift" this gizmo and render it at the bottom right of the screen in screen coordinates, without rotating it. Basically, I want the gizmo to show the rotation of the center of the screen without blocking the view and without having to focus on a specific point. So I want to do away with the model matrix, or something.

I got the following to work by translating the projection matrix:

[![enter image description here][2]][2]

```
this.gl.uniformMatrix4fv(this.modelMatrixUniform, false, modelMatrix);
this.gl.uniformMatrix4fv(this.viewMatrixUniform, false, viewMatrix);

const bottomRightMat = mat4.create();
mat4.translate(bottomRightMat, projectionMatrix, [5, -3, 0]);
this.gl.uniformMatrix4fv(this.projectionMatrixUniform, false, bottomRightMat);
this.gl.drawElements(this.gl.LINES, this.indexBuffer.getLength(), this.gl.UNSIGNED_SHORT, 0);
```

But the gizmo has been rotated into its new position. The red line should still point down and to the left, since that's the direction of the positive X axis at the center of the screen. Also, the numbers 5 and 3 are arbitrary, and I don't think they would work at different zooms or camera locations.

Is there a way to specify a matrix transform that takes the center of the screen and translates it in screen space?

  [1]: https://i.stack.imgur.com/zAnbh.png
  [2]: https://i.stack.imgur.com/K23pW.png

## Answer:

One way would be to change the viewport when rendering that object.

```
// size of area in bottom right
const miniWidth = 150;
const miniHeight = 100;
gl.viewport(gl.canvas.width - miniWidth, gl.canvas.height - miniHeight, miniWidth, miniHeight);

// now draw. you'll need to zoom in, like set the camera closer
// or move the object closer or add a scale matrix after the projection
// matrix as in projection * scale * view * ...
```

you'll need a projection matrix that matches the aspect ratio of the new viewport and you'll either need to scale the object, put the camera closer, or add a 2D scale between the projection and view matrices.
Remember to put the viewport back to the full canvas to render the rest of the scene.


{{{example url="../webgl-qna-how-can-i-move-the-perspective-vanishing-point-from-the-center-of-the-canvas--example-1.html"}}}



Another is to compute an off center frustum projection matrix. Instead of `mat4.perspective` use `mat4.frustum`

```
function perspectiveWithCenter(
    fieldOfView, width, height, near, far, centerX = 0, centerY = 0) {
  const aspect = width / height;

  // compute the top and bottom of the near plane of the view frustum
  const top = Math.tan(fieldOfView * 0.5) * near;
  const bottom = -top;

  // compute the left and right of the near plane of the view frustum
  const left = aspect * bottom;
  const right = aspect * top;

  // compute width and height of the near plane of the view frustum
  const nearWidth = right - left;
  const nearHeight = top - bottom;

  // convert the offset from canvas units to near plane units
  const offX = centerX * nearWidth / width;
  const offY = centerY * nearHeight / height;

  const m = mat4.create();
  mat4.frustum(
        m,
        left + offX,
        right + offX,
        bottom + offY,
        top + offY,
        near,
        far);
  return m;
}
```

So to draw your gizmo set call something like

```
  const gizmoCenterX = -gl.canvas.clientWidth  / 2 + 50;
  const gizmoCenterY =  gl.canvas.clientHeight / 2 - 50;
  const offsetProjection = perspectiveWithCenter(
      fov, gl.canvas.clientWidth, gl.canvas.clientHeight, zNear, zFar,
      gizmoCenterX, gizmoCenterY);
```

{{{example url="../webgl-qna-how-can-i-move-the-perspective-vanishing-point-from-the-center-of-the-canvas--example-2.html"}}}



<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/977524">whiterook6</a>
    from
    <a data-href="https://stackoverflow.com/questions/63509029">here</a>
  </div>
</div>

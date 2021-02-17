Title: How to get the 3d coordinates of a mouse click
Description: How to get the 3d coordinates of a mouse click
TOC: How to get the 3d coordinates of a mouse click

## Question:

Since there is suprisingly almost no information on webGL (or I just don't know how to search for it), I have a question about how to transform a mouse coordinates to 3D coordinates, so to see where exactly on the screen I am clicking.

So my case is that I have a very simple skybox, the camera is positioned at [0, 0, 0] and I can look around it by clicking and dragging. What I want to do is be able to click somewhere on that skybox and know where I have clicked as I need to put an annotation (some text, or html element) on that position. And that html element must move and go out of view with me turning to another side. So what I need is a way to get a mouse click and find out which side of the cube I am clicking on and at what coordinates, so I can place the annotations correctly.

I am using a plain WebGL, I don't use THREE.js or anything like that. Since its just one cube, I can only assume finding the intersection won't be that hard and won't require extra libraries.

## Answer:

Well you're certainly right that it's hard to find an example 

A common webgl shader projects in 3D using code like either

    gl_Position = matrix * position;

or

    gl_Position = projection * modelView * position;

or

    gl_Position = projection * view * world * position;

which are all the same thing basically. They take `position` and multiply it by a matrix to convert to clip space.  You need to do the opposite to go the other way, take a position in clip space and covert back to `position` space which is

    inverse (projection * view * world) * clipSpacePosition

So, take your 3D library and compute the inverse of the matrix you're passing to WebGL. For exmaple here is some code that is computing matrices to draw something using [twgl's](https://twgljs.org) math library

      const fov = 30 * Math.PI / 180;
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      const zNear = 0.5;
      const zFar = 10;
      const projection = m4.perspective(fov, aspect, zNear, zFar);

      const eye = [1, 4, -6];
      const target = [0, 0, 0];
      const up = [0, 1, 0];
      const camera = m4.lookAt(eye, target, up);

      const view = m4.inverse(camera);
      const viewProjection = m4.multiply(projection, view);
      const world = m4.rotationY(time);

For a shader that is effectively doing this

      gl_Position = viewProjection * world * position

So we need the inverse

      const invMat = m4.inverse(m4.multiply(viewProjection, world));

Then we need a clip space ray. We're going from 2D to 3D so we'll make a ray that cuts through the frustum starting at zNear and ending at zFar by using -1 and +1 as our Z value

      canvas.addEventListener('mousemove', (e) => {
         const rect = canvas.getBoundingClientRect();
         const x = e.clientX - rect.left;
         const y = e.clientY - rect.top;

         const clipX = x / rect.width  *  2 - 1;
         const clipY = y / rect.height * -2 + 1;

         const start = m4.transformPoint(invMat, [clipX, clipY, -1]);
         const end   = m4.transformPoint(invMat, [clipX, clipY,  1]);

         ... do something with start/end
      });

`start` and `end` are now relative to `position` (the data in your geometry) so you now have to use some ray to triangle code in JavaScript to walk through all your triangles and see if the ray from start to end intersecs one or more of your triangles.

Note if all you want is a ray in world space, not position space then you'd use

      const invMat = m4.inverse(viewProjection);


{{{example url="../webgl-qna-how-to-get-the-3d-coordinates-of-a-mouse-click-example-1.html"}}}

As for WebGL info there is some [here](https://webglfundamentals.org)

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/5693095">Poyr23</a>
    from
    <a data-href="https://stackoverflow.com/questions/60136758">here</a>
  </div>
</div>

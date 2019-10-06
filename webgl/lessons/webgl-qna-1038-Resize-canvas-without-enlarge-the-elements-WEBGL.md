Title: Resize canvas without enlarge the elements WEBGL
Description:
TOC: qna

# Question:

I m new in WebGl and i wish resize the canvas without enlarge all the elements.
i try to edit in the HTML file this line of code:

    <canvas id="gl-canvas" width="512"" height="512">

with the new one 

    <canvas id="gl-canvas" width="1024"" height="1024">

but the figure inside the html will be more big and i dont want. I want just resize the space that contain the elements. 

i tried to do this one too:
In the JS file i tried to edit 

    gl.viewport( 0, 0, canvas.width, canvas.height );

with 

    gl.viewport( 0, 0, 0.5*canvas.width, 0.5*canvas.height );

the figure will be half smaller, but the space remain the same. I need more space for the animation because now at some point the animation exits the screen even if I have a lot of space still available (which is white).

*I want upload some photos for explain better my point* 

My Canvas

![My canvas][1]

Details of the Web Inspector

![details of web inspector][2]

thanks.


  [1]: https://i.stack.imgur.com/nneUT.png
  [2]: https://i.stack.imgur.com/2X9Hk.png

# Answer

WebGL requires you to draw the items yourself to match the size. WebGL takes normalized coordinates in (called clip space). They always go from -1 to +1 across the canvas and -1 to +1 up the canvas regardless of size. To draw anything you supply math via JavaScript and/or GLSL shaders that take whatever data you supply and convert that data to clip space. That means if you want the items to stay the same size you need to adjust the math you're using to draw the things you are drawing. Without seeing your math we can't really know what to suggest.

The most common way to draw things in WebGL is to multiply 2D or 3D data by 1 or more matrices. You can read about that [here](https://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html). You may need to read the articles before that one to understand that one. You may also wish to read the articles after that one as they continue from 2D to 3D

So, then there is no easy answer except to say it's up to you to decide on a solution to fix your math. Without knowing what math you're using we can't suggest a way to keep the size the same.

If you were using clip space coordinates directly then you could just pass in an X and Y scale. if the canvas gets twice as large then scale by half as much and the objects would stay the same size.

    gl_Position = someClipspaceCoordinates * vec4(scaleX, scaleY, 1, 1);

If you were using [an orthographic projection](https://webglfundamentals.org/webgl/lessons/webgl-3d-orthographic.html) then you'd choose some number of units per pixel and adjust the values you pass into your orthographic projection matrix making function

    const pixelsPerUnit = ???;
    const unitsAcross = gl.canvas.clientWidth / pixelsPerUnit;
    const unitsDown = gl.canvas.clientHeight / pixelsPerUnit;

    // assuming you want 0,0 at the center
    const left   = -unitsAcross / 2;
    const right  =  unitsAcross / 2;
    const bottom = -unitsDown / 2;
    const top    =  unitsDown / 2;
    const near   = ???;
    const far    = ???;

    const projectionMatrix = someOrthographicProjectionMatrixFunction(
        left, right, bottom, top, near, far);

If you were drawing in 3D using a [perspective projection](https://webglfundamentals.org/webgl/lessons/webgl-3d-perspective.html) then you'd have to either calculate a field of view based on the width or height of the canvas to keep objects the same size, OR, move the camera closer to or further away from the objects.

To adjust by field of view you'd do something like

```
const fovPerPixel = 0.1 * Math.PI / 180;
const fov = gl.canvas.clientHeight * fovPerPixel;
const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
const near = 0.5;
const far = 1000;
const projectionMatrix = somePerspectiveProjectionMatrixFunction(
    fov, aspect, near, far);
```

Note that this method has the issue that as the canvas gets larger the things drawn toward the edges of the canvas will get more and more distorted as the field of view gets wider and wider to keep everything the same size. When the field of view hits 180 degrees or wider the perspective math will break and things won't display.

To adjust by moving the camera see [this answer](https://stackoverflow.com/a/29362951/128511) as a starting point.

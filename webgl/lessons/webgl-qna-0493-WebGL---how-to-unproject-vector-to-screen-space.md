Title: WebGL - how to unproject vector to screen space
Description:
TOC: qna

# Question:

I have an oddball question... It's probably less to do with webGL and more to do with just straight 3D geometry and matrix multiplication.. but here goes:

I'm using a 3rd party javascript library to perform webGL rendering. Using this library, I would like to 'unproject' a point in 3d space (x, y, z) to the 2d screen space of the HTML canvas on which the scene is rendered. 

The library does not provide any built in methods for doing this... and it is not open source...

The library does however provide two useful functions. One for retrieving both the 'view' and 'projection' matrices of the current camera. And another for calculating a hit point - a bit like a ray cast. To calculate a hit point, you pass in the screen coordinates (Xs,Ys) and if it hits an object, it returns the 3D-world-space point (Xw,Yw,Zw)

I'm hoping with this information, someone can help me reverse engineer the solution for going from (Xw,Yw,Zw) to (Xs, Ys) - given the camera matrix information.

Here is some sample data:

    TestPoint =
    {
      ScreenCoordinateX: 1098,
      ScreenCoordinateY: 998
    }

    HitPoint = 
    { 
      WorldCoordinateX: 12082.2,
      WorldCoordinateY: 200.18,
      WorldCoordinateZ: -5848
    }

    CameraViewMatrix = 
    {
      0: -0.817419,  1: -0.130593,    2: 0.561045,    3: 0, 
      4: 0.57542,    5: -0.139804,    6: 0.805821,    7: 0,
      8: -0.0267983, 9: 0.981529,     10: 0.189425,   11: 0,
      12: 7844.46,   13: 6482.28,     14: -17852.8,   15: 1
    }

    CameraProjectionMatrix = 
    {
      0: 1.9222,     1: 0,         2: 0,          3: 0,     
      4: 0,          5: 3.73205,   6: 0,          7: 0,
      8: 0,          9: 0,         10: -1.58869,  11: -1,
      12: 0,         13: 0,        14: -13901.6,  15: 0
    }

Thanks in advance for any help you can provide

# Answer

Unproject or project? Usually unproject means to take a screen space position (like the mouse) and turn it into a 3d position (like a ray going through the frustum).

To project a vector to screen space you need a viewProjection matrix. In your case you've only got a view and a projection so multiply them together to get a viewProjection then multiply your vector by that matrix. The result should be a 4d vector. Divide the the xyz portion by the w portion. (note, some libraries already have a matrix * vector function that divides by w).

You'll now have clipspace coordinates (-1 to +1). Scale the to screen space 

     zeroToOne = (clipSpace + 1) / 2
     screenSpace = zeroToOne * screenDimension 

[There's examples here for positioning HTML text to match WebGL](http://webglfundamentals.org/webgl/lessons/webgl-text-html.html)


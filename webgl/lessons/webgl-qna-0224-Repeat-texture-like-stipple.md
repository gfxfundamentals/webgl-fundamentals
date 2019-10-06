Title: Repeat texture like stipple
Description:
TOC: qna

# Question:

I'm using orthographic projection.

I have 2 triangles creating one long quad.
On this quad i put a texture that repeat him self along the the way.

The world zoom is always changing by the user - and makes the quad length be short or long accordingly. The height is being calculated in the shader so it is always the same size (in pixels).

My problem is that i want the texture to repeat according to it's real (pixel size) and the length of the quad. In other words, that the texture will be always the same size (pixels) and it will fill the quad by repeating it more or less depend on the quad length. 

The rotation is important.

For Example
My texture is ![enter image description here][1]

I've added to my vertices - texture coordinates for duplicating it 20 times now
as you see below![enter image description here][2]
Because it's too much zoomed out we see the texture squeezed. 

Now i'm zooming in and the texture stretched. It will always be 20 times repeat.
![enter image description here][3]


I'm sure that i have to play in with the texture coordinates in the frag shader, but don't see the solution. or perhaps there is a better solution to my problem.

---- ADDITION ----

Solved it by:
Calculating the repeat S value in the current zoom (That i'm adding the vertices) and send the map width (in world values) as attribute. Every draw i'm sending the current map width as uniform for calculating the scale.

But i'm not happy with this solution.

  [1]: http://i.stack.imgur.com/hBPWh.png
  [2]: http://i.stack.imgur.com/hV6ev.png
  [3]: http://i.stack.imgur.com/AJGhd.png

# Answer

The general solution is to include a texture matrix. So your vertex shader might look something like

    attribute vec4 a_position;
    attribute vec2 a_texcoord;

    varying vec2 v_texcoord;

    uniform mat4 u_matrix;
    uniform mat4 u_texMatrix;

    void main() {
      gl_Position = u_matrix * a_position;
      v_texcoord = (u_texMatrix * v_texcoord).xy;
    }

Now you can set up texture matrix to scale your texture coordinates however you need. If your texture coordinates go from 0 to 1 across the texture and your pattern is 16 pixels wide then if you're drawing a line 100 pixels long you'd need 100/16 as your X scale.

    var pixelsLong = 100;
    var pixelsTall = 8;
    var textureWidth = 16;
    var textureHeight = 16;

    var xScale = pixelsLong / textureWidth;
    var yScale = pixelsTall / textureHeight;

    var texMatrix = [
      xScale, 0, 0, 0,
      0, yScale, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ];

    gl.uniformMatrix4fv(texMatrixLocation, false, texMatrix);

That seems like it would work. Because you're using a matrix you can also easily offset or rotate the texture. See [matrix math](http://games.greggman.com/game/webgl-2d-matrices/)
     

    


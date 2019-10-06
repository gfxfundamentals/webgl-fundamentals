Title: The relation between gl_PointSize, gl_Position, gl_FragCoord
Description:
TOC: qna

# Question:

example
the vs shader
```C
void main() {
  gl_Position = vec4(0, 0, 0, 1);
  gl_PointSize = 100.0;
}
```
the canvas is 1x5 pixels (width,height)

the fragment shader uses  gl_FragCoord

what will the values of gl_FragCoord be for these 5 pixels?

Cheers


# Answer

For each pixel `gl_FragCoord.xy` will be 

    4.5, 0.5
    3.5, 0.5
    2.5, 0.5
    1.5, 0.5
    0.5, 0.5

`gl_FragCoord` is always **the pixel being drawn currently**. Your fragment shader will be called 5 times. Once for each of the 5 pixels the 100x100 sized point covers (it is of course clipped to the size of the canvas which you said is only 1x5 pixels in size)

Which pixels is currently being drawn depends on what you asked the GPU to do when you called `gl.drawArrays` or `gl.drawElements`.

The vertex shader above as no inputs that change. It will always try to draw a 100x100 pixel "point" in the center of the current viewport to whatever you're drawing to assuming you passed `gl.POINTS` to `gl.drawArrays`. If you passed `LINES` or `TRIANGLES` or anything else it's not likely to draw anything since the shader always sets `gl_Position` to `vec4(0, 0, 0, 1)` which would make a line of zero length or a triangle of zero size.

In the case of POINTS, gl_Position is converted from clip space to the pixel space of the thing you're drawing to (canvas or framebuffer). This conversion happens based on whatever you set `gl.viewport` to.

generally you set `gl.viewport` to the size of the canvas. in this case 

```
const x = 0;
const y = 0;
const width = 1;
const height = 5;
gl.viewport(x, y, width, height);
```

The conversion from clipspace to pixelspace via the viewport setting will come out with a position at 0.5, 2.5. From that pixel position a square will be calculated based on `gl_PointSize`

     gl_Position = vec4(0, 0, 0, 1);
     gl.viewport(0, 0, 1, 5);

     pixelPosition becomes 0.5, 2.5

     x1 = 0.5 - gl_PointSize / 2;
     y1 = 2.5 - gl_PointSize / 2;
     x2 = 0.5 + gl_PointSize / 2;
     y2 = 2.5 + gl_PointSize / 2;

Which means the "POINT" you asked to be drawn goes from

     x1 = -49.5
     y1 = -47.5
     x2 = 50.5
     y2 = 52.5

That rectangle is much larger than the 1x5 canvas but it will be clipped which results in the 5 pixels of the canvas getting rendered to. For each pixel in the canvas the fragment shader is called. `gl_FragCoord` is the coordinate of the pixel currently being drawn to. The first pixel in the canvas (bottom left) always has a `gl_FragCoord.xy` of (0.5, 0.5). The pixel one pixel to right of that always has a `gl_FragCoord.xy` of (1.5, 0.5). 

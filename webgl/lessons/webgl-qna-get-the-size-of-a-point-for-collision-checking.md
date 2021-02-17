Title: Get the size of a point for collision checking
Description: Get the size of a point for collision checking
TOC: Get the size of a point for collision checking

## Question:

Forgive me if my terminology is wrong, but I'm just trying to do some simple point collision detection in WebGL.  I have a bunch of `gl.POINTS` floating around a canvas (640x480, set as HTML attributes), I've set `gl_PointSize = 10.0` in my vertex shader, and am trying to convert this to the correct coordinate system.  

I just want to do some basic collision detection based on the four corners of each rendered point (just to have the points bounce off each other, given I've increased their size to represent a square).  

The issue I'm having is that I can't seem to wrap my head around how to calculate their exact size.  I have their vertex location and thought I could simply do a normalization between the canvas size, point size, and the WebGL coordinates of [-1, 1].

Basically, is there a 'simple' way to calculate the precise size of a point?

## Answer:

The size of a point is its center +/- half its size


```
+-[canvas]-----------------------+
|                                |
|                                |
|                                |
|  +---+                         |
|  | + |                         |
|  +---+                         |
|                                |
+--------------------------------+
```

In the example above the canvas 32x7
The center of the point is at 4x2 in pixels. Its `gl_PointSize` is 3. Its clip space position would be

```
cx = px / canvasWidth * 2 - 1
cx = 4 / 32 * 2 - 1 = -0.75
cy = py / canvasHeight * 2 - 1
cy = 2 /  7 * 2 - 1 = -0.43
```

Its clip space width and height are

```
clipWidth  = gl_PointSize / canvasWidth
clipHeight = gl_PointSize / canvasHeight
```

Also remember that +Y is up in WebGL


{{{example url="../webgl-qna-get-the-size-of-a-point-for-collision-checking-example-1.html"}}}

Also remember that positions in WebGL are edges not pixels. If you have a 2x2 canvas the center of the bottom left pixel in clip space is -0.5, -0.5

```
  -1   0   1
   |   |   |
   +---+---+-- 1
   |   |   |
   |   |   |
   |   |   |
   +---+---+-- 0
   |   |   |
   | + |   |     <--- you can see the center of that pixel is at -0.5, -0.5
   |   |   |
   +---+---+-- -1
```

In pixel space the same canvas would be

```
   0   1   2
   |   |   |
   +---+---+-- 2
   |   |   |
   |   |   |
   |   |   |
   +---+---+-- 1
   |   |   |
   | + |   |     <--- you can see the center of that pixel is at 0.5, 0.5
   |   |   |
   +---+---+-- 0
```

`gl.POINTS` takes the center of the point in pixel space, adds +/- gl_PointSize / 2 to make a rectangle. Any pixel who's center is inside that rectangle will be rendered (or rather considered for rendering given all the other tests depth/stencil/discard, etc...)

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/74562">the_e</a>
    from
    <a data-href="https://stackoverflow.com/questions/60023787">here</a>
  </div>
</div>

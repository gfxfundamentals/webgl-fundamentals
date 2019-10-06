Title: WEBGL Draw pixels inside vertices position
Description:
TOC: qna

# Question:

I am new to the WebGL and shaders world, and I was wondering what the best way for me to paint only the pixels within a path. I have the positions 2d of each point and I would like to fill with a color inside the path.

2D Positions

[![ Vertices positions][1]][1]

Fill

[![Vertices Fill][2]][2]


  [1]: http://i.stack.imgur.com/Kj0n2.jpg
  [2]: http://i.stack.imgur.com/6NEvz.jpg

Could someone give me a direction? Thanks!

# Answer

Unlike the canvas 2d API to do this in WebGL requires you to triangulate the path. WebGL only draws points (squares), lines, and triangles. Everything else (circles, paths, 3d models) is up to you to creatively use those 3 primitives.

In your case you need turn your path into a set of triangles. [There are tons of algorithms to do that](https://www.google.co.uk/search?q=Polygon+(Triangulate+%7C+Triangulation)). Each one has tradeoffs, some only handle convex paths, some don't handle holes, some add more points in the middle and some don't. Some are faster than others. There are also libraries that do it like [this one for example](https://github.com/prideout/polygon.js)

It's kind of a big topic arguably too big to go into detail here. [Other SO questions about it already have answers](https://stackoverflow.com/questions/7316000/convert-polygon-to-triangles).

Once you do have the path turned into triangles then it's pretty straightforward to pass those triangles into WebGL and have them drawn. 

Plenty of answers on SO already cover that as well. Examples

https://stackoverflow.com/questions/33773726/drawing-parametric-shapes-in-webgl-without-three-js

Or you might prefer [some tutorials](http://webglfundamentals.org)

Title: draw image without using "texturing rectangle" method
Description:
TOC: qna

# Question:

Is there any other way how to draw image that texturing rectangle (2 triangles)?   

I want to iterate over image's pixels and draw this pixels on the canvas where ever I want.   

My goal is to compute the position (coordinates) of every single pixel to get cylindrical projected image.  

Is it possible and have you any idea how, please?

# Answer

That's not really how WebGL works.

[See this article on how WebGL works](http://webglfundamentals.org/webgl/lessons/webgl-how-it-works.html)

Basically WebGL draws triangles (and lines, and quads/points). You don't decide where each pixel goes, instead you decide where to put the vertices of triangles, webgl then rasterizes each triangle asking you what color to make the pixels.

So, for polar coordinates you need to work backward. Given you can know what pixel WebGL is going to draw do the math to figure out what would be drawn at that pixel if you were using polar coordinates.

Otherwise you could simulate polar coordinates by drawing a textured circle (using many triangles) with the texture stretched around the circle. You'd then draw into the texture first just pretending X and Y are your polar coordinates and finally render that texture onto the circle.

Unfortunately the resolution would get worse and worse the further from the center of the texture. Use a large enough texture though and that probably would not be a problem. At least that would be true with the simplest solution. 

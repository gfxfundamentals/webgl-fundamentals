Title: How to maintain WebGL Canvas aspect ratio?
Description:
TOC: qna

# Question:

I have a Canvas which I'm drawing to via WebGl.
My Canvas is sized: 640 width x 480 height.

Im drawing a simple square in the middle. However I was surprised to find that when it is drawn it looks a little stretched horizontally.

What do i need to do to make this square look proper (no stretching)?
Note that I have not played with any viewport settings. Im just going thru the early WebGL tutorials.

# Answer

Are you drawing a square in 2d or 3d? It's hard to know how to help without seeing your code.

[These tutorials generally go over both the 2d and 3d case](http://games.greggman.com/game/webgl-fundamentals/).

The short answer is in WebGL drawing the canvas is always in the -1 to +1 space from left to right and -1 to +1 space from bottom to top.

So for example if your canvas is 300x150 and you want to draw a rectangle 10x20 pixels at 30,40 you'd somehow have to set `gl_Position` for each of the 4 vertices to

    clipSpaceX = pixelSpaceX * 2 / canvasWidth  - 1
    clipSpaceY = pixelSpaceY * 2 / canvasHeight - 1 

Note: That math will be with y at the lower left corner of the canvas. Flip y if you want 0 at the top of the canvas.

    clipSpaceY = -(pixelSpaceY * 2 / canvasHeight - 1) 

But there's an infinite number of ways to get those results. To name just a few (1) pass in clipspace coordinates computed in JavaScript (2) pass pixel space coordinates and do the math above in the shader (3) pass in a unit square and do the math to expand it to the size you want.

It's really up to you.
    

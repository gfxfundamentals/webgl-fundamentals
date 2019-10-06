Title: Custom globalCompositeOperation in html5 Canvas
Description:
TOC: qna

# Question:

I'm looking at all of the different types of global composite operations here:

https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation

None of them do exactly what I want to do. Is there a way to define a custom globalCompositeOperation? It would be perfect if I could create a shader and then have it be used everytime I draw something with a CanvasRenderingContext2D.draw method. 

Specifically, on a per pixel basis, I want the following (psuedo code) operation to be used by the CanvasRenderingContext2D.draw methods:

    if the existing canvas color alpha is 0.0, 
        then draw the new shape's color and set alpha to 0.1
    if the existing canvas color is the same as the new shape's color
        then increase the alpha, by 0.1
    if the existing canvas color is different from the the new shape's color
        then decrease the alpha by 0.1

Am I even thinking about this correctly? I'm sensing that I should be using WebGLRenderingContext somehow, but I'm a little shaky on how it all fits together.

# Answer

The answer is mostly no.

There is no way to define your own `globalCompositeOperation` with Canvas2D.

2 solutions off the top of my head

1. Use 2 canvases, a 2d one and WebGL one

        for each shape
           clear the 2d canvas
           draw the shape into the 2d canvas
           upload the canvas to a webgl texture
           composite that texture with the previous results using a custom shader.

    The problem with this solution is it will be slow because uploading your canvas to a texture is a relatively slow operation. But, it means you can use all of the canvas functions like `stroke` and `arc` and gradients etc to build it shape. 

2.  Switch entirely to WebGL

    The problem here is you won't have access to all the features of the 2D API and reproducing ALL of them is a lot of work. 

    On the other hand, if you are only using a limited set of them then it may not be too much work. For example if you are only using `drawImage`, `fillRect`, `clear`, and maybe `moveTo` and `lineTo`, `fill` and `stroke` then it would be relatively easy to reproduce in WebGL. If you are using lots of the features like masking, bezier curves, gradients, or patterns it starts to become much more work.

As a starter [here's a tutorial that presents a certain kind of compositing or image processing](http://webglfundamentals.org/webgl/lessons/webgl-image-processing-continued.html) which is the basic technique for `globalCompositeOperation` in WebGL. Both of the solutions above would require this basic type of solution to composite the results after each `shape`.

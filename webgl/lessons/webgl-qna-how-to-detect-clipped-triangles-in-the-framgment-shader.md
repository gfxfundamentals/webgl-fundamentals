Title: How to detect clipped triangles in the framgment shader
Description: How to detect clipped triangles in the framgment shader
TOC: How to detect clipped triangles in the framgment shader

## Question:

I am new to WEBGL, I read a lot of posts about fragment shaders. However, I cannot figure out how to access the primitive vertices (or a flag for each vertex) in the fragment shader.

My goal is to discard the fragment if at least one of its primitive vertices are clipped.

Thanks for the help

## Answer:

You can't directly access vertices in a fragment shader. The only data a fragment shader gets by default is the screen coordinate (canvas/framebuffer coord) and depth buffer value for the current pixel being rasterized. All other data you have to pass in.  

Of the top of my head, in the vertex shader you could compute if a vertex is clipped and pass that info on to the fragment shaders as a varying. You'd pass 0 if not clipped and 1 if clipped. varyings get interpolated so if in the fragment shader the varying is > 0 then one of the vertices was clipped.

{{{example url="../webgl-qna-how-to-detect-clipped-triangles-in-the-framgment-shader-example-1.html"}}}

There are probably more efficient ways like pass all vertices of a triangle to the vertex shader and if any one of them is clipped set all vertices to be clipped so that triangle is not even rasterized.


{{{example url="../webgl-qna-how-to-detect-clipped-triangles-in-the-framgment-shader-example-2.html"}}}

This would arguably be more efficient since instead of rejecting 1000s of pixels one at a time we're rejecting the entire triangle and skipping even checking per pixel. It takes more data though since we need to be able to pass in all 3 vertices for every triangle to the vertex shader at the same time.

note: if you're new to WebGL you might find [these articles](https://webglfundamentals.org) useful.

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/6523086">ABotella</a>
    from
    <a data-href="https://stackoverflow.com/questions/59354672">here</a>
  </div>
</div>

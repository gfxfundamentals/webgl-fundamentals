Title: Accessing textures by pixel coordinate in WebGL2
Description: Accessing textures by pixel coordinate in WebGL2
TOC: Accessing textures by pixel coordinate in WebGL2

## Question:

From https://webgl2fundamentals.org/webgl/lessons/webgl-image-processing.html

> WebGL2 adds the ability to read a texture using pixel coordinates as well. Which way is best is up to you. I feel like it's more common to use texture coordinates than pixel coordinates.

Nowhere is this mentioned other then passing uniform with texture dimensions in pixels and calculate from there, is there a way to access these pixel coords without calculation as it is supposed here?



## Answer:

You can read individual pixels/texels from a texture in WebGL2 with `texelFetch`

    vec4 color = texelFetch(someUniformSampler, ivec2(pixelX, pixelY), intMipLevel);

For example, compute the average color of a texture by reading each pixel

{{{example url="../webgl-qna-accessing-textures-by-pixel-coordinate-in-webgl2-example-1.html"}}}

notes: since the canvas is RGBA8 can only get integer result. Could change to some float format but that would complicate the example which is not about rendering it's about `texelFetch`.

Of course just by changing the data from R8 to RGBA8 we can do 4 arrays as once if we interleave the values

{{{example url="../webgl-qna-accessing-textures-by-pixel-coordinate-in-webgl2-example-2.html"}}}

To do more requires figuring out some way to arrange the data and use an input to the fragment shader to figure out where the data is. For example we again interleave the data, 5 arrays so the data goes 0,1,2,3,4,0,1,2,3,4,0,1,2,3,4.

Let's go back to R8 and do 5 separate arrays. We need to draw 5 pixels. We can tell which pixel is being drawn by looking at `gl_FragCoord`. We can use that to offset which pixels we look at and pass in how many to skip.

{{{example url="../webgl-qna-accessing-textures-by-pixel-coordinate-in-webgl2-example-3.html"}}}



<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/3793191">bogersja</a>
    from
    <a data-href="https://stackoverflow.com/questions/54100955">here</a>
  </div>
</div>

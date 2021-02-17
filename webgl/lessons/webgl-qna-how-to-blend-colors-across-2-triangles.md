Title: How to blend colors across 2 triangles
Description: How to blend colors across 2 triangles
TOC: How to blend colors across 2 triangles

## Question:

I am learning WebGL and I've drawn a full screen quad with colors for each vertex. No lighting or normals or perspective matrix or depth buffer; I'm just drawing a gradient background. This is what I get:

[![full screen gradient][1]][1]

It looks good but I cannot help noticing the diagonal smear from the bottom right to the top left. I feel this is an artifact of linear interpolating the far opposite vertices. I'm drawing two triangles: the bottom left, and the top right. I think I would get similar results using OpenGL instead of WebGL.

Given the same four colors and the same size rectangle, is there a way to render this so the edge between the two triangles isn't so apparent? Maybe more vertices, or a different blending function? I'm not sure exactly what the colors should be at each pixel; I just want to know how to get rid of the diagonal smear.


  [1]: https://i.stack.imgur.com/6oOgx.png

## Answer:

The issue is the top right triangle has no knowledge of the bottom left corner so the top right triangle is not including any of the blue from the bottom left (and visa versa)

A couple of ways to fix that. 

One is to use a 2x2 texture with linear sampling. You have to do some extra math to get the interpolation correct because a texture only interpolates between pixels

```
+-------+-------+
|       |       |
|   +-------+   |
|   |   |   |   |
+---|---+---|---+
|   |   |   |   |
|   +-------+   |
|       |       |
+-------+-------+
```

Above is a 4 pixel texture stretched to 14 by 6. Sampling happens between pixels so only this center area will get the gradient. Outside that area would be sampled with pixels outside the texture so using [CLAMP_TO_EDGE](https://webglfundamentals.org/webgl/lessons/webgl-3d-textures.html) or on the opposite side of the texture using REPEAT.

{{{example url="../webgl-qna-how-to-blend-colors-across-2-triangles-example-1.html"}}}

Note: to see what I mean about the extra math needed for the texture coordinates here is the same example without the extra math

{{{example url="../webgl-qna-how-to-blend-colors-across-2-triangles-example-2.html"}}}

Also of course, rather than do the math in the fragment shader we could fix the texture coordinates in JavaScript

{{{example url="../webgl-qna-how-to-blend-colors-across-2-triangles-example-3.html"}}}

Another way is to do the interpolation yourself based on those corners (which is effectively doing what the texture sampler is doing in the previous example, bi-linear interpolation of the 4 colors).

{{{example url="../webgl-qna-how-to-blend-colors-across-2-triangles-example-4.html"}}}



<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/977524">whiterook6</a>
    from
    <a data-href="https://stackoverflow.com/questions/60212615">here</a>
  </div>
</div>

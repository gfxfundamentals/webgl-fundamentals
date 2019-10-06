Title: WebGL - Set multiple vertices
Description:
TOC: qna

# Question:

I'm trying to translate some TypeScript code into a vertex shader to use with WebGL. My goal is to draw the bitangent lines of two circles. I have a function to calculate the tangent points here, https://jsfiddle.net/Zanchi/4xnp1n8x/2/ on line 27. Essentially, it returns a tuple of points with x and y values.

    // First circle bottom tangent point
    const t1 = {
      x: x1 + r1 * cos(PI/2 - alpha),
      y: y1 + r1 * sin(PI/2 - alpha)
    }; //... and so on

I know I can do the calcuation in JS and pass the values to the shader via an attribute, but I'd like to leverage the GPU to do the point calculations instead.

Is it possible to set multiple vertices in a single vertex shader call, or use multiple values calculated in the first call of the shader in subsequent calls?

# Answer

> Is it possible to set multiple vertices in a single vertex shader call

No

> or use multiple values calculated in the first call of the shader in subsequent calls?

No

A vertex shader outputs 1 vertex per iteration/call. You set the number of iterations when you call `gl.drawArrays` (gl.drawElements is more complicated)

I'm not sure you gain much by not just putting the values in an attribute. It might be fun to generate them in the vertex shader but it's probably not performant. 

In WebGL1 there is no easy way to use a vertex shader to generate data. First off you'd need some kind of count or something that changes for each iteration and there is nothing that changes if you don't supply at least one attribute. You could supply one attribute with just a count `[0, 1, 2, 3, ...]` and use that count to generate vertices. This is what [vertexshaderart.com](https://vertexshaderart.com) does but it's all for fun, not for perf.

In WebGL2 there is the `gl_VertexID` built in variable which means you get a count for free, no need to supply an attribute. In WebGL2 you can also use *transform feedback* to write the output of a vertex shader to a buffer. In that way you can generate some vertices once into a buffer and then use the generated vertices from that buffer (and therefore probably get better performance than generating them every time).



Title: Don't blend a polygon that crosses itself
Description: Don't blend a polygon that crosses itself
TOC: Don't blend a polygon that crosses itself

## Question:

I'm drawing two polylines (which are lines in the sample) in webgl with enabled blending. 

    gl.uniform4f(colorUniformLocation, 0, 0, 0, 0.3);
    
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0.2, -1, 0.2, 1,]), gl.STATIC_DRAW);
    gl.drawArrays(gl.LINE_STRIP, 0, 2);
    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, -1, 0, 1,0, -1, 0, 1]), gl.STATIC_DRAW);
    gl.drawArrays(gl.LINE_STRIP, 0, 4);

[Here][1] is the codepen sample. 

The left line are crossed with itself and it seems like it blends with itself, so as result it becomes darker. 

I would like the blend to work between those polylines, but don't want a polyline to blend with itself. Is there a way to do it?



  [1]: https://codepen.io/smatushonok/pen/vYBqEYq?editors=0011

## Answer:

One way would be to use the stencil test. You'd set webgl so that the stencil stores a certain value when a pixel is drawn and you'd set the stencil test so it fails if it sees that value.

First an example that draws 2 sets of 2 overlapping triangles with blending on. The pairs will get darker where they overlap

{{{example url="../webgl-qna-don-t-blend-a-polygon-that-crosses-itself-example-1.html"}}}

Then the same example with the stencil test on

First we need to ask for a stencil buffer

```
  const gl = someCanvas.getContext('webgl2', {stencil: true});
```

Then we turn on the stencil test

```  
  gl.enable(gl.STENCIL_TEST);
```

Set up the test so it only draws if the stencil buffer is zero

```
  gl.stencilFunc(
     gl.EQUAL,   // the test
     0,          // reference value
     0xFF,       // mask
  );
```

And set the operation so we increment the stencil when we draw so they will no longer be zero and therefore fail the test

```
  gl.stencilOp(
     gl.KEEP,  // what to do if the stencil test fails
     gl.KEEP,  // what to do if the depth test fails
     gl.INCR,  // what to do if both tests pass
  );
```

Between the first draw and the second we clear the stencil buffer

```
gl.clear(gl.STENCIL_BUFFER_BIT);
```

Example

{{{example url="../webgl-qna-don-t-blend-a-polygon-that-crosses-itself-example-2.html"}}}

Another solution you could also use the depth test if you're drawing 2D stuff. The default depth test only draws if the depth is `gl.LESS` than the current depth so just turning the depth test on and setting a different depth between draws would also work if the depth of the triangles is the same. You could compute a different depth value for each thing you draw, you'd need to look up the bit resolution of the depth buffer. Or, you could use `gl.polygonOffset`

```
gl.enable(gl.DEPTH_TEST);
gl.enable(gl.POLYGON_OFFSET_FILL); 

... then ...

for (let i = 0; i < numThingsToDraw; ++i) {
  gl.polygonOffset(0, -i);  // each thing 1 depth unit less
  draw2DThing(things[i]);
}
```

example

{{{example url="../webgl-qna-don-t-blend-a-polygon-that-crosses-itself-example-3.html"}}}



<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="http://optixsoft.com">mt_serg</a>
    from
    <a data-href="https://stackoverflow.com/questions/58168732">here</a>
  </div>
</div>

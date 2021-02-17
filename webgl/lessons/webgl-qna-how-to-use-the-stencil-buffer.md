Title: How to use the stencil buffer
Description: How to use the stencil buffer
TOC: How to use the stencil buffer

## Question:

How I can use to stencil buffer for my easiest program? 
I have read many different themes about it, but I not found a detailed guide about it.
I want to cut out for hole each side in a created tetrahedron.

[![enter image description here][1]][1]

Please explain to me step by step use stencil buffer?

[Link for my program][2]


  [1]: https://i.stack.imgur.com/yV9oD.png
  [2]: https://dropfiles.ru/filesgroup/62503e88028a16b1055f78a7e2b70456.html

## Answer:

To use the stencil buffer you have to first request it when you create the webgl context

    const gl = someCanvasElement.getContext('webgl', {stencil: true});


Then you turn on the stencil test

```  
  gl.enable(gl.STENCIL_TEST);
```

Set up the test so it always passes and set the reference value to 1

```
  gl.stencilFunc(
     gl.ALWAYS,    // the test
     1,            // reference value
     0xFF,         // mask
  );
```

And set the operation so we'll set the stencil to the reference value when both the stencil and depth tests pass

```
  gl.stencilOp(
     gl.KEEP,     // what to do if the stencil test fails
     gl.KEEP,     // what to do if the depth test fails
     gl.REPLACE,  // what to do if both tests pass
  );
```

We then draw the first inner triangle

```
... lots of setup for a single triangle ...

gl.drawArrays(...) or gl.drawElements(...)
```

Then we change the test so it only passes if the stencil is zero

```
  gl.stencilFunc(
     gl.EQUAL,     // the test
     0,            // reference value
     0xFF,         // mask
  );
  gl.stencilOp(
     gl.KEEP,     // what to do if the stencil test fails
     gl.KEEP,     // what to do if the depth test fails
     gl.KEEP,     // what to do if both tests pass
  );

```

and now we can draw something else (the larger triangle) and it will only draw where there is 0 in the stencil buffer which is everywhere except where the first triangle was drawn.

Example:

{{{example url="../webgl-qna-how-to-use-the-stencil-buffer-example-1.html"}}}



<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/9698958">AnatoliyC</a>
    from
    <a data-href="https://stackoverflow.com/questions/59539788">here</a>
  </div>
</div>

Title: Why does WebGL take more memory than Canvas 2D
Description: Why does WebGL take more memory than Canvas 2D
TOC: Why does WebGL take more memory than Canvas 2D

## Question:

1024x1024 2d canvas may use about 1024 * 1024 * 4 = 4M memory,but webGL context use at least 5-10 times more memory.

```
<!DOCTYPE html>
<html>
    <body>
    
        <div style="display:inline-block ;overflow: hidden;width: 512px;height: 512px;">
            <canvas id="canvas" width="1024" height="1024" style="border: red 1px solid;transform: scale(0.5); transform-origin: 0 0;">old version need update</canvas>
        </div>
    </body>

    <script>
        var ctx = window.document.getElementById("canvas").getContext("webgl")
        var gl = canvas.getContext("experimental-webgl");

    </script>

</html>
```

## Answer:

There are possibly multiple reasons

### By default a webgl canvas is anti-aliased. 

The browser chooses the amount but checking 

{{{example url="../webgl-qna-why-does-webgl-take-more-memory-than-canvas-2d-example-1.html"}}}

On my machine a 300x150 canvas is actually 1200x600 because that's [how a GPU's built in antialiasing works](https://mynameismjp.wordpress.com/2012/10/24/msaa-overview/)

You can turn off anti-aliasing by passing in `antialias: false` when creating the context

{{{example url="../webgl-qna-why-does-webgl-take-more-memory-than-canvas-2d-example-2.html"}}}

### WebGL is double buffered

So there will always be at least 2 buffers allocated, the drawing buffer (the buffer you render to) and a copy used for rendering the page. So even with antialiasing off there will be 2 buffers where as 2D canvas might have only 1 (it's up to the browser what it does for canvas 2D)

### WebGL requires a GL context and related support

WebGL internally in the browser creates some kind of context to track all the state. That state is per WebGL context. In other words if you create 2 WebGL contexts the browser needs to track 2 sets of WebGL state. In Chrome that includes things like the command buffer and other buffers to transfer commands and data from the process running the webpage to the process talking to the GPU. That by itself can be 2-4 meg. Canvas 2D on the other hand most likely allocates that info once and shares it across all canvases. It might not even be accounted for when looking at memory usage.

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/14539628">fanyu zhang</a>
    from
    <a data-href="https://stackoverflow.com/questions/64673758">here</a>
  </div>
</div>

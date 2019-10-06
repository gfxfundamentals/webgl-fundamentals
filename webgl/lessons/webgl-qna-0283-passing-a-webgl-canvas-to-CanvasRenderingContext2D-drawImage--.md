Title: passing a webgl canvas to CanvasRenderingContext2D.drawImage()
Description:
TOC: qna

# Question:

I am trying to copy the contents of one canvas to another. 

The source canvas has a webgl context. 

The destination canvas has a 2d context. 

My code looks like:

    destinationContext.drawImage(sourceCanvas, 0, 0);

This works in Firefox and IE, but it does not work in Chrome. Why not?

Thanks!


# Answer

Here's some working code. 

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.querySelector("#a").getContext("webgl");
    const ctx = document.querySelector("#b").getContext("2d");

    // put a rectangle in the webgl canvas
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(10,20,100,50);
    gl.clearColor(0,0,1,1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // copy the webgl canvas to the 2d canvas
    ctx.drawImage(gl.canvas, 0, 0);

<!-- language: lang-css -->

    canvas {
      border: 1px solid black;
      margin: 5px;
    }

<!-- language: lang-html -->

    <canvas id="a" width="200" height="100"></canvas>
    <canvas id="b" width="200" height="100"></canvas>


<!-- end snippet -->

Here's some working code with a delay. If you are not copying the WebGL canvas in the same event that you drew to it then you need [one of these solutions](https://stackoverflow.com/questions/26783586/canvas-todataurl-returns-blank-image-only-in-firefox). Even though that question is about `toDataURL` all the same things apply to using a WebGL canvas with `drawImage`.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.querySelector("#a").getContext("webgl", {
      preserveDrawingBuffer: true,
    });
    const ctx = document.querySelector("#b").getContext("2d");

    // put a rectangle in the webgl canvas
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(10,20,100,50);
    gl.clearColor(0,0,1,1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // copy the webgl canvas to the 2d canvas 1 second later
    setTimeout(copy, 1000);

    function copy() {
      ctx.drawImage(gl.canvas, 0, 0);
    }

<!-- language: lang-css -->

    canvas {
      border: 1px solid black;
      margin: 5px;
    }

<!-- language: lang-html -->

    <canvas id="a" width="200" height="100"></canvas>
    <canvas id="b" width="200" height="100"></canvas>

<!-- end snippet -->



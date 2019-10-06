Title: Meteor mobile canvas doesnt fit to screen
Description:
TOC: qna

# Question:

I am trying out meteor's `meteor run android-device`.
I have the following simple html:

    <body>
        <canvas id='id'></canvas>
    </body>
and the `css `:

    html, body {
        margin: 0;
        padding: 0;
    }
    
    canvas {
        width: 100vw;
        height: 100vh;
        position: absolute;
    }

which gives this output:
[![enter image description here][1]][1]


[![enter image description here][2]][2]


  [1]: http://i.stack.imgur.com/roO3f.png
  [2]: http://i.stack.imgur.com/w4n9k.png

THAT is NOT what i am looking for. I want my WebGl dont get stretched by different screen sizes.
WebGL code:

    var canvas = this.find('#id');
    if (!canvas) {
        console.log('Strange Error occured');
        return;
    }
    var gl = canvas.getContext('webgl');
    if (!gl) {
        console.log("gl not supported");
        return;
    }
    
    
    gl.clearColor(0.4, 0.7, 0.9, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    renderTriangle();


So how can i achieve, that if i draw something it gets rendered without being relatively to my screen size OR if so , how can i fix this?
Note : i dont use `gl.viewport` or any camera transformation YET

# Answer

How about reading some [WebGL tutorials](http://webglfundamentals.org)?

> Note : i dont use gl.viewport or any camera transformation YET

Isn't that exactly what you need to do?

You'll probably want to [dynamically set the size of the canvas's drawingBuffer](http://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html) otherwise you're going to get stretched pixels.

Canvases have 2 sizes, #1 the number of pixels in their drawingBuffer, #2 the size they're displayed.

After changing the size you'll need to call `gl.viewport`

WebGL coordinates are always +1 to -1 and everything else is up to you so if you don't want your triangle to stretch you need to look at the size the canvas displayed (`canvas.clientWidth`, `canvas.clientHeight`) and then use that to pick the appropriate clip space coordinates for your triangle. How you do that is entirely up to you. Most people do it by multiplying their vertex positions with a projection matrix in their vertex shader.

If you're doing 3D then you'd set your aspect (`aspect = canvas.clientWidth / canvas.clientHeight`) in your [perspective matrix](http://webglfundamentals.org/webgl/lessons/webgl-3d-perspective.html) for your projection. For 2D most people would probably just use an orthographic projection. Setting it to the display size (`left = -canvas.clientHeight / 2, right = canvas.clientWidth / 2, top = -canvas.clientHeight / 2, bottom = canvas.clientHeight / 2`), **not** the drawingBuffer size would also make your stuff not stretch.



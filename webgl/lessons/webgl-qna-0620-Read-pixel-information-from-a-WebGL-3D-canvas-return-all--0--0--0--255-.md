Title: Read pixel information from a WebGL 3D canvas return all [0, 0, 0, 255]
Description:
TOC: qna

# Question:

I'm trying to complete a goal to get a image copy of a certain WebGL Web software: ArcGIS Scene Viewer. It is using a canvas and I tried this:

        var canvas = document.getElementsByTagName("canvas")[0];
  var resultDOM = document.getElementById("result");
  resultDOM.innerText = canvas;
  var gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
  var pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
  gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  console.log(pixels); // Uint8Array

But the Array logged in console is always full of [0, 0, 0, 255].
So I'm not in full control of the JSAPI I use to create that canvas, so I can't set `preserveDrawingBuffer: true` when first time initializing the `canvas`, all I can do is after the canvas loaded the map then execute some JS. So how can I get the image I need?

Am I doing something wrong here? I also tried framebuffer, it is also not working:

    canvas.addEventListener('click', function(ev) {
        var gl = canvas.getContext("webgl", {
          preserveDrawingBuffer: true
        });
        var framebuffer = gl.createFramebuffer();
        //insert code to get mouse x,y position on canvas
        var top = canvas.offsetTop;
        var left = canvas.offsetLeft;
        var x = ev.clientX - left;
        var y = ev.clientY - top;
        var pixels = new Uint8Array(4);
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        console.log(x, y, pixels);
    });

The pixel value returned is also [0, 0, 0, 0].

Here's a sample you can try: https://jsfiddle.net/qvtt87ky/
It is always returning a whole black image.

# Answer

Framebuffers are just collections of attachments. You didn't add any attachments so your framebuffers isn't setup.

On top of that if you want to read something out of a framebuffer you have to put data in (render to) the framebuffer. Your example code, even if you added the attachments, wouldn't do that.

Example:

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var gl = document.querySelector("canvas").getContext("webgl");

    // Clear the canvas to red
    gl.clearColor(1, 0, 0, 1); // red
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Make a framebuffer
    var fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    // Make a texture
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    var width = 1;
    var height = 1;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    // Attach the texture to the framebuffer
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

    // Clear the texture to green
    gl.clearColor(0, 1, 0, 1); // green
    gl.clear(gl.COLOR_BUFFER_BIT);

    var pixel = new Uint8Array(4);
    // Read from texture (because it's attached to the current
    // framebuffer
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    console.log("texture:", pixel);

    // Read from canvas to show it's a different color
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    console.log("canvas:", pixel);


<!-- language: lang-html -->

    <canvas></canvas>

<!-- end snippet -->



## other

This code makes no sense to me

    var resultDOM = document.getElementById("result");
    resultDOM.innerText = canvas;

Appending a canvas as `innerText` just means it's going to try to convert an `HTMLCanvasElement` to a string which will likely just print something like `[object HTMLCanvasElement]` so I'm not sure what that code is trying to do

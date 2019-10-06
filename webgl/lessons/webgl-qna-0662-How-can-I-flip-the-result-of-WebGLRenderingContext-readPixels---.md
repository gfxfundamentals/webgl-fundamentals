Title: How can I flip the result of WebGLRenderingContext.readPixels()?
Description:
TOC: qna

# Question:

Why is the imageData that I get from `WebGLRenderingContext.readPixels()` upside down?

I try to do the folowing:

    var gl = renderer.domElement.getContext("webgl")

    var pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    var imageData = new ImageData(Uint8ClampedArray.from(pixels), gl.drawingBufferWidth, gl.drawingBufferHeight);

    ctx.putImageData(imageData, 0, 0);

but the result is an image that is mirrored along the x-axis (i.e.: flipped upside down).

I've also tried to use scale after `ctx.putImageData` like this:

    ctx.scale(1, -1);

But no results. Reversing the pixels also doesn't work.

By now I understand that putImageData() uses coordinates that start from top left, and readPixels() starts from bottom left.

Does anyone have suggestions on how to flip the image or avoid the problem altogether?


# Answer

If you're going to copy to a 2d canvas to flip you might as well skip the `readPixels`. Just use `drawImage`

    var dstX = 0;
    var dstY = 0;
    var dstWidth = ctx.canvas.width;
    var dstHeight = ctx.canvas.height;    
    ctx.drawImage(gl.canvas, dstX, dstY, dstWidth, dstHeight);

The browser will do the right thing and the result will be right side up.

Example:

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    var gl = document.querySelector("#webgl").getContext("webgl");
    var ctx = document.querySelector("#two_d").getContext("2d");

    // fill webgl canvas with red on top and blue on bottom
    gl.enable(gl.SCISSOR_TEST);
    for (var y = 0; y < 15; ++y) {
      var v = y / 14;
      gl.scissor(0, y * 10, 300, 10);
      gl.clearColor(v, 0, 1 - v, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    // copy it to 2d canvas
    var dstX = 0;
    var dstY = 0;
    var dstWidth = ctx.canvas.width;
    var dstHeight = ctx.canvas.height;
    ctx.drawImage(gl.canvas, dstX, dstY, dstWidth, dstHeight);

<!-- language: lang-css -->

    canvas { 
      margin: 1em;
      border: 1px solid black;
    }

<!-- language: lang-html -->

    <canvas id="webgl"></canvas>
    <canvas id="two_d"></canvas>

<!-- end snippet -->

If you really did want to call `gl.readPixels` for some reason (you had no intent of every putting them in a 2d canvas, then you can just flip the bytes

    var width = gl.drawingBufferWidth;
    var height = gl.drawingBufferHeight
    var pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    
    var halfHeight = height / 2 | 0;  // the | 0 keeps the result an int
    var bytesPerRow = width * 4;
    
    // make a temp buffer to hold one row
    var temp = new Uint8Array(width * 4);
    for (var y = 0; y < halfHeight; ++y) {
      var topOffset = y * bytesPerRow;
      var bottomOffset = (height - y - 1) * bytesPerRow;
    
      // make copy of a row on the top half
      temp.set(pixels.subarray(topOffset, topOffset + bytesPerRow));
    
      // copy a row from the bottom half to the top
      pixels.copyWithin(topOffset, bottomOffset, bottomOffset + bytesPerRow);
    
      // copy the copy of the top half row to the bottom half 
      pixels.set(temp, bottomOffset);
    }

Example:

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    var gl = document.querySelector("#webgl").getContext("webgl");
    var ctx = document.querySelector("#two_d").getContext("2d");

    // fill webgl canvas with red on top and blue on bottom
    gl.enable(gl.SCISSOR_TEST);
    for (var y = 0; y < 15; ++y) {
      var v = y / 14;
      gl.scissor(0, y * 10, 300, 10);
      gl.clearColor(v, 0, 1 - v, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }


    var width = gl.drawingBufferWidth;
    var height = gl.drawingBufferHeight
    var pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    var halfHeight = height / 2 | 0;  // the | 0 keeps the result an int
    var bytesPerRow = width * 4;

    // make a temp buffer to hold one row
    var temp = new Uint8Array(width * 4);
    for (var y = 0; y < halfHeight; ++y) {
      var topOffset = y * bytesPerRow;
      var bottomOffset = (height - y - 1) * bytesPerRow;

      // make copy of a row on the top half
      temp.set(pixels.subarray(topOffset, topOffset + bytesPerRow));

      // copy a row from the bottom half to the top
      pixels.copyWithin(topOffset, bottomOffset, bottomOffset + bytesPerRow);

      // copy the copy of the top half row to the bottom half 
      pixels.set(temp, bottomOffset);
    }

    // This part is not part of the answer. It's only here
    // to show the code above worked
    // copy the pixels in a 2d canvas to show it worked
    var imgdata = new ImageData(with, height);
    imgdata.data.set(pixels);
    ctx.putImageData(imgdata, 0, 0);

<!-- language: lang-css -->

    canvas { 
      margin: 1em;
      border: 1px solid black;
    }

<!-- language: lang-html -->

    <canvas id="webgl"></canvas>
    <canvas id="two_d"></canvas>

<!-- end snippet -->




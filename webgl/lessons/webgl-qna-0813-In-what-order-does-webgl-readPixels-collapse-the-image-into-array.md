Title: In what order does webgl readPixels collapse the image into array
Description:
TOC: qna

# Question:

I am reading an image using a command such as

    gl.readPixels(0, 0, gl.width, gl.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

Now pixels has a length of `width*height*4` in a 1D array. I am unsure along which axis are the image values collapsed? Intuitively I would expect it to read each row, moving down the column for Red first, then G, B, A (I call this collapsing along width, then height, than RGBA).

For instance, if I would like to access the RED value in the second-from-the-right pixel at the bottom of the image, would I use:

    <br>
    pixels[width*height-2] (collapse along width, then height, then RGBA)<br>
    pixels[width*height-1-height] (collapse along height, then width, then RGBA)<br>
    pixels[width*height*4-8] (collapse along RGBA, then width, then height)<br>

or some other order.



# Answer

The order is the standard GL order which is the first pixel corresponds to the 0,0 position in the texture, renderbuffer, canvas.

For the canvas itself 0,0 is the bottom left corner. For textures there is no concept of bottom, there's the first pixel (0,0), the pixel at (1,0), the pixel at (0,1) and the last pixel at (1,1).

For the canvas (since it's the only thing with a set direction),
The right most pixel in the first row (bottom) is `data[(width - 1) * pixelSize]`
The right most pixel in the 3rd row is `data[(width * 3 - 1) * pixelSize]`
The right most pixel in the last row (top) is `data[(width * height - 1) * pixelSize]`

A simple test

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.querySelector("canvas").getContext("webgl");

    gl.enable(gl.SCISSOR_TEST);
    drawRectUsingScissor(0, 0, 1, 1, [ 1, 0, 0, 1]);
    drawRectUsingScissor(1, 0, 1, 1, [ 0, 1, 0, 1]);
    drawRectUsingScissor(0, 1, 1, 1, [ 0, 0, 1, 1]);
    drawRectUsingScissor(1, 1, 1, 1, [ 1, .5, 0, 1]);

    const width = 2;
    const height = 2;
    const pixelSize = 4;
    const data = new Uint8Array(width * height * pixelSize);
    gl.readPixels(0, 0, 2, 2, gl.RGBA, gl.UNSIGNED_BYTE, data);

    log("raw: ", data);

    for (let y = 0; y < height; ++y) {
     for (let x = 0; x < width; ++x) {
       const offset = (y * width + x) * pixelSize;
       log(x, ',', y, ':', data.slice(offset, offset + pixelSize)); 
     }
    }

    function drawRectUsingScissor(x, y, width, height, color) {
      gl.clearColor(...color);
      gl.scissor(x, y, width, height);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    function log(...args) {
      const elem = document.createElement("pre");
      elem.textContent = [...args].join(' ');
      document.body.appendChild(elem);
    }

<!-- language: lang-css -->

    canvas {
      width: 100px;
      height: 100px;
      image-rendering: pixelated;
    }
    pre { margin: 0 }

<!-- language: lang-html -->

    <canvas width="2" height="2"></canvas>

<!-- end snippet -->

Note that the above is not strictly true since you have to take `gl.PACK_ALIGNMENT` setting into account which defaults to 4 but can be set to 1, 2, 4, or 8. For RGBA/UNSIGNED_BYTE reading you don't have to worry about `PACK_ALIGNMENT`


    

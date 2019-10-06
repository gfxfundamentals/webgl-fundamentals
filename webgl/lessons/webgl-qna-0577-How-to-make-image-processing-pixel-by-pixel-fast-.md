Title: How to make image processing pixel-by-pixel fast?
Description:
TOC: qna

# Question:

Using the 2D canvas context, I implemented an image processing algorithm in
JavaScript that has the following characteristics:

  * Each line can be processed separately.

  * Each line is processed from left to right. The color of a pixel in the
    output image is computed from:

      - the color in the input image at the current location

      - for all pixels after the first one: the color at the output picture in
        the previous location, i.e. one pixel to the left

Runtime of the algorithm is accordingly: *O(n)*

The algorithm is very slow in Chrome 52, because canvas manipulations are slow:

  * reading color at current location in input image:
    `inputImageData.slice(location, location + 4)`

  * (reading the output color of the previous location in the output image is
    quick, it’s taken from a variable)

  * writing pixel to output image, which – according to Chrome’s profiler – is
    the single operation that takes most of the time:

        outputImageContext.fillStyle = outputColor;
        outputImageContext.fillRect(x, y, 1, 1);

I looked into image processing with WebGL. However it seems not applicable
because with WebGL all pixels are calculated independently. The algorithm
mandates a scanning from left to right.

# Answer

It's not clear what you want to accomplish.

From your description

> Each line is processed from left to right. The color of a pixel in the output image is computed from:
>
> * the color in the input image at the current location
> * for all pixels after the first one: the color at the output picture in the previous location, i.e. one pixel to the left

Sounds like you're just going to smear the first column over the entire image. 

* 1st column = 1st column, 
* 2nd column = 1st column, 
* 3rd column = 2nd column, 
* 4th column = 3rd column. 

Processing left to right that's just the first column repeated. If so just call `ctx.drawImage(ctx.canvas, 0, 0, 1, ctx.canvas.height, 0, 0, ctx.canvas.width, ctx.canvas.height);` which will use the canvas as an image, take the first column and expand it to fill the entire canvas.

Otherwise I didn't really understand your algorithm. Sorry

In any case, assuming you do actually need to reference the result of previous pixels immediately then a few things.

Slicing imagedata.data to get pixels out will be slow. Every slice is a memory allocation. If you want speed you'd probably be better off not creating a new object for every pixel.

As for writing, yes, setting one pixel at a time using `fillRect` would be extremely slow. How about just setting the pixel directly in an `ImageData` and then putting the ImageData back into the canvas?

Otherwise try to do as little work in your inner loop as possible. If you can calculate something only once then calculate it only once.

Here's some code that blends in a circle. It's not *that* slow although I think although slow is subjective.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var ctx = document.querySelector("canvas").getContext("2d");
    var width = ctx.canvas.width;
    var height = ctx.canvas.height;

    function r(min, max) {
      if (max === undefined) {
        max = min;
        min = 0;
      }
      return Math.random() * (max - min) + min;
    }

    function drawRandomCircle(ctx) {
      var color = "hsl(" + r(360) + ", " + r(50, 100) + "%, 50%)";
      ctx.beginPath();
      ctx.arc(r(width), r(height), r(100), 0, Math.PI * 2, false);
      ctx.fillStyle = color;
      ctx.fill();  
    }

    // put some image into the canvas so have something to work with
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);
    for (var ii = 0; ii < 200; ++ii) {
      drawRandomCircle(ctx);
    }

    function process(time) {
      time *= 0.001;
      
      drawRandomCircle(ctx);
      
      // get a copy of the image
      var imageData = ctx.getImageData(0, 0, width, height);
      var pixels = imageData.data;
      
      var xoff = Math.sin(time) * 15 | 0;
      var yoff = Math.cos(time) * 15 | 0;

      // blur
      for (var y = 0; y < height; ++y) {
        var lineOffset = (y + yoff + height) % height * width;
        for (var x = 0; x < width; ++x) {
          var off0 = (y * width + x) * 4;
          var off1 = (lineOffset + (x + xoff + width) % width) * 4;
           
          var r0 = pixels[off0 + 0];
          var g0 = pixels[off0 + 1];
          var b0 = pixels[off0 + 2];
          
          var r1 = pixels[off1 + 0];
          var g1 = pixels[off1 + 1];
          var b1 = pixels[off1 + 2];
          
          pixels[off0 + 0] = (r0 * 9 + r1) / 10;
          pixels[off0 + 1] = (g0 * 9 + g1) / 10;
          pixels[off0 + 2] = (b0 * 9 + g1) / 10;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      requestAnimationFrame(process);
    }

    requestAnimationFrame(process);

<!-- language: lang-html -->

    <canvas width="1000" height="1000"></canvas>

<!-- end snippet -->

One note, the code above gets a new copy of the canvas every frame `getImageData`. It does this so it can see the new circle that was just drawn. That means there is at least one large memory allocation every frame to get a new copy of the pixels in the canvas. If you don't need to do that then make the copy at initialization time and just keep using the same data.



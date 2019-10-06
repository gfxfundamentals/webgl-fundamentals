Title: alternative to DOM element 'new Image()' of browser implementation in headless-gl javascript?
Description:
TOC: qna

# Question:

Currently I am using a webGL based browser implementation code at client end. It is working perfectly. But, I want to use the same code at server end. Yes, this is not browser based, pure javascript code using headless-gl wrapper.

While doing this I am facing a problem.

new `Image()` is identified by browser, but at server side I am getting error `Image is not defined`. 

In node-webGL it can be used as 

`*var Image = require("node-webgl").Image;*`,

 but in headless-gl I tried with

 `*require("gl").Image;`* and `*require('gl')(width, height, { preserveDrawingBuffer: true }).Image*`.

With the above I haven't had any success. Can someone offer some explanation, or advice on a proper place to look for a headless-gl manual?

# Answer

Headless-gl only provides WebGL. It does not provide image loading which is not part of WebGL per se, images are part of HTML5

You could try the [images package](https://www.npmjs.com/package/images)

To load and get the data something like this should work

    var images = require('images');
    var img = images('/path/to/img.jpg');
    var raw = img.toBuffer(images.TYPE_RAW);
    var pixels = new Uint8Array(raw.buffer, 12); // skip the raw header
    
You could now upload the image

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, img.width(), img.height(),
                  0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

Or make a wrapper to emulate the WebGL API for images

    gl.texImage2D = function(origFn) {
      return function(bind, mip, internalFormat) {
         var width;
         var height;
         var border;
         var format;
         var type;
         var data;
         if (arguments.length === 9) {
           // sig1: bind, mip, internalFormat, width, height, border, format, type, data
           width = arguments[3];
           height = arguments[4];
           border = arguments[5];
           format = arguments[6];
           type = arguments[7];
           data = arguments[8];
         } else if (arguments.length === 6) {
           // sig2: bind, mip, internalFormat, format, type, image
           format = arguments[3];
           type = arguments[4];
           img = arguments[6];
           var raw = img.toBuffer(images.TYPE_RAW);
           data = new Uint8Array(raw.buffer, 12); // skip the raw header           
           width = img.width();
           height = img.height();
           border = 0;
         } else {
           throw "Bad args to texImage2D";
         }
         gl.texImage2D(bind, mip, internalFormat, width, height, 
                       border, format, type, data);
      };
    }(gl.texImage2D);



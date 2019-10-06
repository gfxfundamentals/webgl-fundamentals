Title: How do I obtain pixel data from a canvas I don't own?
Description:
TOC: qna

# Question:

I am trying to get the pixel RGBA data from a canvas for further processing. I think the canvas is actually a Unity game if that makes a difference.

I am trying to do this with the canvas of the game [Shakes and Fidget](https://w27.sfgame.net/?platform=webgl). I use the [readPixels](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/readPixels) method from the [context](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext).

This is what I tried:

    var example = document.getElementById('#canvas');
    var context = example.getContext('webgl2');      // Also doesn't work with: ', {preserveDrawingBuffer: true}'
    var pixels = new Uint8Array(context.drawingBufferWidth * context.drawingBufferHeight * 4); 
    context.readPixels(0, 0, context.drawingBufferWidth, context.drawingBufferHeight, context.RGBA, context.UNSIGNED_BYTE, pixels);

But all pixels are black apparently (which is not true obviously).

*Edit: Also, I want to read the pixels multiple times.
Thanks everyone for your answers. The answer provided by [@Kaiido](https://stackoverflow.com/users/3702797/kaiido) worked perfectly for me :)*

# Answer

Likely you either need to read the pixels in the same event as they are rendered, or you need to force the canvas to use `preserveDrawingBuffer: true` so you can read the canvas at any time.

To do the second override `getContext`


    HTMLCanvasElement.prototype.getContext = function(origFn) {
      const typesWeCareAbout = {
        "webgl": true,
        "webgl2": true,
        "experimental-webgl": true,
      };
      return function(type, attributes = {}) {
        if (typesWeCareAbout[type]) {
          attributes.preserveDrawingBuffer = true;
        }
        return origFn.call(this, type, attributes);
      };
    }(HTMLCanvasElement.prototype.getContext);

Put that at the top of the file before the Unity game OR put it in a separate script file and include it before the Unity game.

You should now be able to get a context on whatever canvas Unity made and call `gl.readPixels` anytime you want.

For the other method, getting pixels in the same event, you would instead wrap `requestAnimationFrame` so that you can insert your `gl.readPixels` after Unity's use of `requestAnimationFrame`

    window.requestAnimationFrame = function(origFn) {
      return function(callback) {
        return origFn(this, function(time) {
          callback(time);
          gl.readPixels(...);
        };
      };
    }(window.requestAnimationFrame);

Another solution would be to use a virtual webgl context. [This library shows an example of implementing a virtual webgl context](https://github.com/greggman/virtual-webgl/) and shows [an example of post processing the unity output](https://greggman.github.io/virutal-webgl/unity-example/index.html)

note that at some point Unity will likely switch to using an `OffscreenCanvas`. At that point it will likely require other solutions than those above.

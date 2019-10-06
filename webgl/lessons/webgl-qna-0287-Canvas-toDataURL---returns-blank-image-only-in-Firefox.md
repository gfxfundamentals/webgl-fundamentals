Title: Canvas toDataURL() returns blank image only in Firefox
Description:
TOC: qna

# Question:

I'm using [glfx.js][1] to edit my image but when I'm trying to get that image's data using the `toDataURL()` function I get a blank image (width the same size as the original image).

The strange thing is that in Chrome the script works perfect.

What I want to mention is that the image is loaded in `canvas` using the onload event:

               img.onload = function(){

     try {
      canvas = fx.canvas();
     } catch (e) {
      alert(e);
      return;
     }
     
     // convert the image to a texture
     texture = canvas.texture(img);

     // draw and update canvas
     canvas.draw(texture).update();
     
     // replace the image with the canvas
     img.parentNode.insertBefore(canvas, img);
     img.parentNode.removeChild(img);

    }

Also my image's path is on the same domain;

The problem (in Firefox) is when i hit the save button. Chrome returns the expected result but Firefox return this:

    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA7YAAAIWCAYAAABjkRHCAAAHxklEQVR4nO3BMQEAAADCoPVPbQZ/oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
    ... [ lots of A s ] ... 
    AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAzwD6aAABkwvPRgAAAABJRU5ErkJggg==

What could cause this result and how can I fix it?

  [1]: http://evanw.github.io/glfx.js/


# Answer

Most likely there's some async event between the time you draw to the canvas and the time you call `toDataURL`. By default the canvas is cleared after every composite. Either prevent the canvas from being cleared by creating the WebGL context with `preserveDrawingBuffer: true` as in

    var gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});

or make sure toDataURL is called before exiting whatever event you're using to render.  For example if you do this

    function render() {
      drawScene(); 
      requestAnimationFrame(render);
    }
    render();

And somewhere else do this

    someElement.addEventListener('click', function() {
      var data = someCanvas.toDataURL();
    }, false);

Those 2 events, the `animation frame`, and the `click` are not in sync and the canvas may be cleared between calling them. Note: The canvas won't appear cleared as it's double buffered but the buffer toDataURL and other commands that effect that buffer are looking at is cleared.

The solution is either use `preserveDrawingBuffer` or make your call to `toDataURL` inside the same event as rendering. For example

    var captureFrame = false;

    function render() {
      drawScene(); 

      if (captureFrame) {
        captureFrame = false;
        var data = someCanvas.toDataURL();
        ...
      }

      requestAnimationFrame(render);
    }
    render();

    someElement.addEventListener('click', function() {
      captureFrame = true;
    }, false);

What's the point of `preserveDrawingBuffer: false` which is the default? It can be significantly faster, especially on mobile to not have to preserve the drawing buffer. Another way to look at it is the browser needs 2 copies of your canvas. The one you're drawing to and the one it's displaying. It has 2 ways to deal with these 2 buffers. (A) double buffer. Let you draw to one, display the other, swap the buffers when you're done rendering which is inferred from exiting any event that issued draw commands (B) Copy the contents of the buffer you're drawing to do the buffer that's being displayed. Swapping is much faster than copying. So, swapping is the default. It's up to the browser what actually happens. The only requirement is that if `preserveDrawingBuffer` is `false` that the drawing buffer get cleared after a composite (which is yet another async event and therefore unpredictable) if `preserveDrawingBuffer` is `true` then it must copy so that the drawingbuffer's contents is preserved.

Note that once a canvas has a context it will always have the same context. So in other words let's say you change the code that initializes the WebGL context but you still want to set `preserveDrawingBuffer: true`

There are at least 2 ways.

### find the canvas first, get a context on it

since the code later will end up with the same context.

```
<script>
document.querySelector('#somecanvasid').getContext(
    'webgl', {preserveDrawingBuffer: true});
</script>
<script src="script/that/will/use/somecanvasid.js"></script>
```

Because you've already created a context for that canvas whatever script comes after will get the same context.

### augment `getContext`

```
<script>
HTMLCanvasElement.prototype.getContext = function(origFn) {
  return function(type, attributes) {
    if (type === 'webgl') {
      attributes = Object.assign({}, attributes, {
        preserveDrawingBuffer: true,
      });
    }
    return origFn.call(this, type, attributes);
  };
}(HTMLCanvasElement.prototype.getContext);
</script>
<script src="script/that/will/use/webgl.js"></script>
```

In this case any webgl context created after augmenting the `getContext` will  have `preserveDrawingBuffer` set to true.

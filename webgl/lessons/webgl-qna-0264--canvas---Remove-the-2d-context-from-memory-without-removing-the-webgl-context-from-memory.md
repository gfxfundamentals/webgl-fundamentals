Title: <canvas>: Remove the 2d context from memory without removing the webgl context from memory
Description:
TOC: qna

# Question:

I have a <canvas> element with a 2d and a (duplicate) webgl context with the same texture as the 2d context's pixel data.

Is it possible to remove a 2d context from memory without removing the webgl context?

(Clearing the 2d context via clearRect or fillRect won't remove it from memory)
(Changing the width/height resets both the webgl and 2d context.)

The only thing I can think of now is to create a new canvas, draw a 2d context into the temporary canvas, set the width property (thus clearing the original canvas), and then create a texture in the original canvas based on the temporary canvas 2d context.

# Answer

2d contexts and WebGL contexts are unrelated so the short answer is "yes, it is possible to remove the 2d context from memory without removing the webgl context from memory"

You can't have 2 contexts on 1 canvas (yet). You can have 2 contexts each from a different canvas. If you call `gl.texImage2D(....., some2DCanvas)` that copies the contents of `some2DCanvas` into the texture. There's no connection between them as it's a copy.

On the other hand there is no such thing as "remove the 2d context". You can not explicitly get rid of a context in JavaScript. All you can do is stop referencing it.  For example

    function() {
      var ctx = document.createElement("canvas").getContext("2d");
    }();

This creates a context which is referenced by the variable `ctx`. Because that variable is local to the function, as soon as the function exits the variable disappears and there is now no reference to the context nor the canvas it was created from. As such the browser can, whenever it feels like it, discard both the canvas and the context. When that happens is undefined. But, there is no command which will explicitly "remove the 2d context".


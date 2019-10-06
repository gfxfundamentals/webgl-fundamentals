Title: Save Empscripten webGL canvas as image in JS
Description:
TOC: qna

# Question:

I have an Emscripten-driven webGL canvas that I need to save as an image from a Javascript handler. Let's say there's a simple JS "Save" button.

    <script type="text/javascript">
    var Exporter = {
        preRun: [],
        postRun: [],
        save: function() {
        var c=Module.canvas;
        var d=c.toDataURL("image/png");
        var w=window.open('about:blank','image from canvas');
        w.document.write("<img src='"+d+"' alt='from canvas'/>");
        }
    };
    </script>
    <input type="button" value="Save" onclick="Exporter.save()" />

By default, the webGL context has preserveDrawingBuffer set to false, so the resulting image is blank.

For the image to show the rendered webGL scene, I need to add ```preserveDrawingBuffer: true``` to the attributes passed in the getContext call inside my compiled Empscripten code. I can do this by hand editing the compiled empscripten js code; the resulting image is then correct, but I'd like to avoid this hack - I'd have to do it after each recompile.

Is there and easier and cleaner way to add ```preserveDrawingBuffer``` to the ```webGLContextAttributes``` from outside? i.e. as a compile option for ```emcc```, some SDL parameter inside the C code or from Javascript in the hosting page?

**UPDATE**
See below for the solution; unrelated issue I encountered was that the saved image had lower bit depth and anti-aliased lines looked pretty bad. Using ```c.toDataURL( "image/jpeg" )``` solved that.

# Answer

Well, first off, all of emscripten and all of it's libraries are open source so you can just go change them.

In particular copy `library_gl.js` to your project folder and then remove `-lGL` and add `--js-library library_gl.js` to your build script, you can then hack your local `library_gl.js` to do whatever you want.

Otherwise I don't know SDL at all but you can just get the context yourself before your call the emscripten code. A canvas can only have one context, if you call `getContext` again for the same type of context you'll get the same context. In other words if your JavaScript creates the context first the emscripten code will get the same context

so this should work

     theCanvasElement.getContext("webgl", {preserveDrawingBuffer: true});
     
     ... now execute emscripten and have it use `theCanvasElement`

If you can't even do that you can override `getContext`

    HTMLCanvasElement.prototype.getContext = (function(oldGetContextFn) {
      return function(type, attrs) {
        attrs = attrs || {};
        if (type === "webgl") {
          attrs.preserveDrawingBuffer = true;
        }
        return oldGetContextFn.apply(this, type, attrs);
      };
    }(HTMLCanvasElement.prototype.getContext));



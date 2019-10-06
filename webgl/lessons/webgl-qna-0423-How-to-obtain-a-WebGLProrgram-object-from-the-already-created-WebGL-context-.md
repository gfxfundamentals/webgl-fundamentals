Title: How to obtain a WebGLProrgram object from the already created WebGL context?
Description:
TOC: qna

# Question:

I wonder, how can I obtain any WebGL program instance (`WebGLProgram`) from any desired WebGL context?

To fetch the WebGL context is NOT a problem. You are searching the DOM of the current page for the canvas element using `document.getElementsByTagName()` or `document.getElementById()`, if you know the exact canvas id:

    let canvas = document.getElementById( "canvasId" );
    let context = canvas.getContext( "webgl" );

Here we fetch the current context as I suppose, but if I want to get some shader parameters or get certain value from already running vertex/fragment shader - I need to have a WebGL program, which is associated with the current WebGL rendering context.

But I can't find any method in WebGL API like `context.getAttachedProgram()` or `context.getActiveProgram()`.

So what is the way get the active WebGL program which is used for the rendering process? 
Maybe, there is some special WebGL parameter?

# Answer

There is no way to get all the programs or any other resources from a WebGL context. If the context is already existing the best you can do is look at the current resources with things like `gl.getParameter(gl.CURRENT_PROGRAM)` etc..

What you can do instead is wrap the WebGL context

    var allPrograms = [];
    
    someContext.createProgram = (function(oldFunc) {
       return function() {
         // call the real createProgram
         var prg = oldFunc.apply(this, arguments);

         // if a program was created save it
         if (prg) {
           allPrograms.push(prg);
         }

         return prg;
       };
    }(someContext.createProgram));

Of course you'd need to wrap `gl.deleteProgram` as well to remove things from the array of all programs.

    someContext.deleteProgram = (function(oldFunc) {
       return function(prg) {
         // call the real deleteProgram
         oldFunc.apply(this, arguments);

         // remove the program from allPrograms
         var ndx = allPrograms.indexOf(prg);
         if (ndx >= 0) {
            allPrograms.splice(ndx, 1);
         }
       };
    }(someContext.deleteProgram));


These are the techniques used by things like the [WebGL Inspector](https://benvanik.github.io/WebGL-Inspector/) and the [WebGL Shader Editor Extension](https://github.com/spite/ShaderEditorExtension).

If you want to wrap all contexts you can use a similar technique to wrap `getContext`.

    HTMLCanvasElement.prototype.getContext = (function(oldFunc) {
       return function(type) {
          var ctx = oldFunc.apply(this, arguments);
          if (ctx && (type === "webgl" || type === "experimental-webgl")) {
            ctx = wrapTheContext(ctx);
          }
          return ctx;
       };
    }(HTMLCanvasElement.prototype.getContext));


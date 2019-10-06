Title: Why WebGL 'clear' draw to front buffer?
Description:
TOC: qna

# Question:

Why no need for swap-buffers or glFinish?

    <!DOCTYPE html>
    <html>
     <head>
      <title>Game v.0.0</title>
      <script>
       var gl = null;
       function startGame()
       { { var canvas = document.getElementById('gameCanvas');
         var glNames = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
         for (var glNameI = 0; glNameI < glNames.length; ++glNameI)
          try
          { gl = canvas.getContext(glNames[glNameI]);
           if (gl) break;
          }
          catch(e)
          {}
      if(!gl)
         { canvas.outerHTML = "<a>WebGL NOT SUPPORTED? :(</a>";
          return;
         }
        }
         
        window.onkeydown = function(ev)
        { switch(ev.keyCode)
         {
         case 49:// 1 key
          gl.clearColor(0.3,0.7,0.2,1.0);
          gl.clear(gl.COLOR_BUFFER_BIT); 
          break;
         case 50:// 2 key
          gl.clearColor(0.3,0.2,0.7,1.0);
          gl.clear(gl.COLOR_BUFFER_BIT); 
          break;
         }
        };
       }
      </script>
      <style type="text/css">
       canvas {border: 2px dotted blue;}
      </style>
     </head>
      
     <body onload="startGame()">
      <div><canvas id="gameCanvas" width="640" height="480"></canvas></div>
     </body>
     
    </html>

# Answer

Because that's the way WebGL works.

WebGL swaps/copies automatically. Anytime you do anything that effects the WebGL drawingBuffer (think "backbuffer) it gets marked to swap/copy. The next time the browser composites the web page it will do either a swap or a copy. You can tell it to always copy. You can not tell it to always swap

Specifically, creating the WebGL context with `{preserveDrawingBuffer: true}` as in

    gl = someCanvas.getContext("webgl", {preserveDrawingBuffer: true});

Tells WebGL you always want it to do a copy.

The default is WebGL chooses swap or copy depending on various factors. For example if anti-aliasing is on it's always effectively a copy (a resolve) where as if anti-aliasing is off it might be a swap. Also, in this default case, when `preserveDrawingBuffer` is false after it does a copy or swap it will clear the backbuffer. This is to try to make it appear consistent regardless of whether it chooses to copy or swap.

If `preserveDrawingBuffer` = true then it never clears the backbuffer.

If you want to do a bunch of work over multiple JavaScript events and not let the user see the results until all your work is done you'll need to render to a framebuffer with an attached texture or renderbuffer and then when all your work is done render than attachment to the canvas (the backbuffer).

as for `gl.finish` that's a no-op in WebGL. It has no point.


Title: No antialiasing for iOS 8 safari webgl
Description:
TOC: qna

# Question:

Safari on iOS 8 supporting webgl is surely a good news but after I run my demo I find that there is no antialiasing. Any solutions?

# Answer

role you own? There's lots of ways to anti-alias. Here's one. First check that you're not already anti-aliased


    var gl = someCanvas.getContext("webgl");
    var contextAttribs = gl.getContextAttributes();
    if (!contextAttribs.antialias) {
      // do your own anti-aliasing
    }

The simplest way would be to make your canvas's backing store larger than it's displayed. Assuming you have a canvas that you want to be displayed a certain size

    canvas.width = desiredWidth * 2;
    canvas.height = desiredHeight * 2;
    canvas.style.width = desiredWidth + "px";
    canvas.style.height = desiredHeight + "px";

Now your canvas will most likely be bi-linear filtered when drawn. In iOS's case since they are all HD-DPI you probably will need to do 4x

    canvas.width  = desiredWidth  * 4;
    canvas.height = desiredHeight * 4;
    canvas.style.width  = desiredWidth  + "px";
    canvas.style.height = desiredHeight + "px";

You can find out by looking at `window.devicePixelRatio`. In fact if you want 1x1 pixels you'd do this

    var devicePixelRatio = window.devicePixelRatio || 1;
    var overdraw = 1; // or 2
    var scale = devicePixelRatio * overdraw;
    canvas.width  = desiredWidth  * scale;
    canvas.height = desiredHeight * scale;
    canvas.style.width  = desiredWidth  + "px";
    canvas.style.height = desiredHeight + "px";

Otherwise, another way is to render to a texture attached to a framebuffer then render the texture into the canvas [using a shader that does antialiasing](http://www.glge.org/demos/fxaa/).

Title: WebGL Perspective Camera Canvas Resizing Issue
Description:
TOC: qna

# Question:

**Edit: The have confirmed the issue is not the matrix, but rather the canvas. The canvas appears to resize, but it actually is cutting off parts of the model until I do an entire refresh.**

**LIVE PREVIEW: http://jsfiddle.net/B5B8k/6/**

I ported my C++ underlying engine code to Javascript and I setup a basic square made of 6 vertices (2 triangles) and I attempted to render this. I have now found that the issue relates to the canvas. The canvas is being resized to the innerWidth of the Window and the innerHeight of the window. Whenever the window is stretched though, part of the canvas remains the "gl.clear" color which covers up whatever I am rendering.

    this.getPerspective = function(fov, aspect, zNear, zFar) {
        var yMax = zNear * Math.tan(fov * Math.PI / 360);
        var yMin = -yMax;
        var xMin = yMin * aspect;
        var xMax = yMax * aspect;
        return this.getFrustrum(xMin, xMax, yMin, yMax, zNear, zFar);
    };
    this.getFrustrum = function(left, right, bottom, top, zNear, zFar) {
        var X = 2*zNear/(right-left);
        var Y = 2*zNear/(top-bottom);
        var A = (right+left)/(right-left);
        var B = (top+bottom)/(top-bottom);
        var C = -(zFar + zNear)/(zFar - zNear);
        var D = -2*zFar*zNear/(zFar - zNear);
        
        return new Mat4(X,0,A,0, 0,Y,B,0, 0,0,C,D, 0,0,-1,0);
    };

This function takes "Numbers" : 

   - fov (in degrees)

   - aspect (window width/window height)

   - z near clipping plane

   - and z far clipping plane.

If you need to see more code, then please ask. 

# Answer

the short answer is you need to call `gl.viewport` as in

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

You could call it in `resize` but arguably you should call it in your `draw` function because in the future if you use framebuffer objects you'll need to call it everytime you switch to framebuffers of a different size than the canvas.

The long version is you should never use `window.innerWidth` and `window.innerHeight` as those hardcode your app to only work in a full window. Instead use `canvas.clientWidth` and `canvas.clientHeight` as those will work in all cases like if you canvas only covers part of the page, for example an 3d editor with a settings column, or embedded, like in an article.

On top of that, for an app that constantly renders like yours it's best to call resize every frame for the same reasons.

    function draw() {
       resize();
       ...

with resize written like this


            function resize() {
                var width = canvas.clientWidth;
                var height = canvas.clientHeight;
                if (canvas.clientWidth != width ||
                    canvas.clientHeight != height) {
                  canvas.width = canvas.clientWidth;
                  canvas.height = canvas.clientHeight;
                  perspective = new Mat4()
                  perspective = perspective.getPerspective(60, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
                  perspective.mat[3][3] = 1;
                  perspective = perspective.mul(new Mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, -5, 0, 0, 0, 1));
               }
            }

The reason is that while the `resize` event works when the window is resized it doesn't help if a canvas is resizes for some other reason. So again, calling resize every frame works in all cases where as calling resize only on the resize event only works in one specific case.

You might even move the `perspective.mat` manipulation code inside you draw function because again, if in the future you draw to a framebuffer (say to draw shadow maps) you'll have to change your perspective matrix anyway. While it's certainly a good idea to do as little work each frame as possible, in the large scheme of things you'll only be calculating a perspective matrix once or twice per frame whereas later with more objects you'll likely be calculating tons of stuff in your draw loop so the time spent calculating a perspective matrix will be a minimal cost relatively.

Finally, `gl.useProgram(0)` at the end of your loop is invalid for `WebGL` and is generating a ton of errors in the JavaScript console..


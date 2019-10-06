Title: webgl redraw cube but I don't want to clear others
Description:
TOC: qna

# Question:

I was in success to draw multi textured cube by webgl. 
But, I should share the canvas with other webgl context.
And if I draw this cube on objects drawn by other webgl context, How can I draw my cube and redraw, move, ... without other objects by other context clear.

    function start() {
       ...
    if (gl) {
            gl.clearColor(0.0, 0.0, 0.0, 0.0);  
            gl.clearDepth(1.0);                 
            gl.enable(gl.DEPTH_TEST);           
            gl.depthFunc(gl.LEQUAL);            
       ...
    }
    
    function drawScene() {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      ...
    }



# Answer

You can't share a canvas with another WebGLRenderingContext (at least not as of 2016/08/05).

In general in WebGL you need to redraw everything every frame. [WebGL is a rasterization library](http://webglfundamentals.org) not a scene graph. It has no concept of cubes. It just renders pixels. If you want to move just one cube of a bunch of cubes you need to keep some data structure (like an array or tree) that keeps track of all the cubes' positions, orientations, etc. Update the position of one or more cubes then draw them all.

You'll find that's what pretty much all WebGL programs do

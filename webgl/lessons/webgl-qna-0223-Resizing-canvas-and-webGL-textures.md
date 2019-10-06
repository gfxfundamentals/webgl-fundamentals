Title: Resizing canvas and webGL textures
Description:
TOC: qna

# Question:

I want to resize my window and have my canvas and everything in it stretch to fill as the window expands/contracts. 

This is a little tricky because in my webgl code I'm creating a feedback loop between a daisy chain of framebuffers and fragment shaders. There is a small transformation happening in one vertex shader to keep the feedback loop going. If I call the following on a resize event, it makes an additional transformation that I don't want and sends the feedback loop out of control. However, it does stretch the textures to fit the window.

    gl.viewport(0,0,canvas.clientWidth, canvas.clientHeight);

I have also tried doing an event listener to resize the canvas, but the textures do not resize along with it. Instead they just stay locked to the bottom left corner of my window. Inspecting the canvas element shows that the canvas has indeed changed size, but the textures do not.
     
    window.addEventListener( 'resize', resizeCanvas );
    
    function resizeCanvas(){
    var width = canvas.clientWidth;
    var height = canvas.clientHeight;
    if(canvas.width != width ||
     canvas.height != height){
     canvas.width = width;
     canvas.height = height;
     //gl.viewport(0,0,width, height);
     }
    }

I want to do this without having to reallocate my fbo's. For some reason I thought I would just be able to stretch my canvas and everything in it, but I can't seem to get it working.

[Here is a link](http://adamferriss.com/feedback/simple.html) to a page with my full webgl code. This one doesn't have any feedback loops in it for the sake of simplicity, but I can post one if it would be helpful to see. Thanks in advance for the help!


# Answer

I'm not sure I understand the issue but glancing at your code, if your framebuffer attachments (in this cases textures) are a different size than your canvas you need to call `gl.viewport` every time you change the current framebuffer. 

In other words in pseudo code

    function(render) {
      resizeCanvas();

      gl.bindFramebuffer(gl.FRAMEBUFFER, someFramebuffer);
      gl.viewport(0, 0, widthOfSomeFramebuffer, heightOfSomeFramebuffer);
      drawStuffToFramebuffer();

      gl.bindFramebuffer(gl.FRAMEBUFFER, someOtherFramebuffer);
      gl.viewport(0, 0, widthOfSomeOtherFramebuffer, heightOtherOfSomeFramebuffer);
      drawStuffToOtherFramebuffer();

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      drawStuffToCanvas();
    
      requestAnimationFrame(render);
    }
    render();

In most cases the viewport should always be set to the size of the canvas when drawing to the canvas (`width` and `height` not `clientWidth` and `clientHeight`). Use `clientWidth` and `clientHeight` for resizing and/or for computing an aspect ratio for your projection, whether that projection is 2d or 3d. In fact it's arguably **wrong** to use `clientWidth` and `clientHeight` for `gl.viewport`.

You can kind of think of `gl.viewport` as defining the area you want to draw to. Setting it to `gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)` is basically saying you want to draw on the entire canvas. 

That's not the entire truth though. `gl.viewport` basically sets how to convert from clipspace (-1  <->  +1), the space used in your shaders, back into pixelspace on whatever the current drawing surface is (canvas or framebuffer). So, setting the viewport to `gl.viewport(x, y, width, height)` is saying -1 to +1 in x goes from pixels x to x + w - 1 on the current drawing surface and -1 to +1 in y goes from pixels y to y + height - 1 on the current drawing surface.

Since in most cases you want to draw on the entire drawing surface you need to set `gl.viewport` to the size of the surface you're drawing to.

Hopefully that makes it clear why using `clientWidth` and `clientHeight` is wrong for `gl.viewport` because `clientWidth` and `clientHeight` have no relation to the actual size of the canvas (the pixels in it). They only relate to how large those pixels are stretched or shrunk. In other words

    <canvas width="10" height="20" style="width: 30px; height: 40px"></canvas>

    ...

    console.log("canvas.width       : " + canvas.width);
    console.log("canvas.height      : " + canvas.height);
    console.log("canvas.clientWidth : " + canvas.clientWidth);
    console.log("canvas.clientHeight: " + canvas.clientHeight);

Will print

    canvas.width       : 10
    canvas.height      : 20
    canvas.clientWidth : 30
    canvas.clientHeight: 40

That means there are only 10x20 actual pixels in the canvas but they're being stretched to 30x40 on the page. Setting the viewport to `gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight)` would be saying you want to draw to an area 30 pixels wide and 40 pixels tall but you only actually have 10 pixels across and 20 pixels down

As far as handing resize goes if you're constantly rendering (which it looks like you are in your code) then it's easiest and arguably best to call resize at the beginning of your render loop. 

Title: Webgl Distortion in Chrome with three Monitors
Description:
TOC: qna

# Question:

I'm developing a webgl application (a simple solar system) and everything looks fine on Chrome and Firefox on ONE monitor
But if I start eyefinity (three monitors each full hd + bezel compensation) the solarsystem is distorted in chrome. 

In Firefox it looks correct and really nice:
http://kritten.org/pictures/firefox.jpg

In Chrome it looks like this:
http://kritten.org/pictures/chrome.jpg

It seems that the principal point (is this the right name?) is in the wrong location.
If I move forward in Firefox I actually move forward, but in Chrome I move to the right. So it keeps this distortion any time.

Are there any ideas what could be wrong?



# Answer

The issue with Chrome is it's got a limit on the size a canvas can be. This is part of the WebGL spec although arguably Chrome should fix it. You can try to [encourage them to fix it here](https://code.google.com/p/chromium/issues/detail?id=445542).

The specific issue is that the WebGL spec says that even though you may ask for a canvas of a certain size WebGL might give you a smaller drawingbuffer. This was specifically because graphics cards have a size limit. Some are as low as 1024. Let's say some card has a limit of 2048. You've got one monitor that's 1280x1024. No problem. 

You now add a second monitor for a total desktop space of 2560x1024. You now stretch a window across both monitors. You ask for a canvas of size 2560x1024. What should happen? WebGL can't make one that big, the GPU says it has a limit of 2048. So there were 3 option

1.  Crash. That's no go

2.  Force the canvas to stay under 2048

3.  Let the canvas be stretched to 2560 but make the drawingbuffer the limit which is 2048 in this example

The WebGL committee picked #3 because it's the one least likely to cause problems. The worst that happens is you get a distorted image but the user can scale the window back down until things are normal so your webpage doesn't die.

Unfortunately 99.99% of WebGL programs ignore this feature of WebGL and so you get this distorted image when you run into that part of the spec.

In this particular case though the limit isn't in your GPU it's in Chrome. The proof is that it works in Firefox. Again you can try to [encourage them to fix it here](https://code.google.com/p/chromium/issues/detail?id=445542).

If you'd like to make your program work around it you need to look up what size the canvas's drawing buffer was actually made and use that in the correct places. You can find out but checking `gl.drawingBufferWidth` and `gl.drawingBufferHeight`

That means first set the camera aspect to the size the canvas is actually displayed. You really should always do this

    aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    perspective = yourPerspectiveFunction(fov, aspect, zNear, zFar);

In three.js that would be

    camera.aspect = renderer.domElement.clientWidth /
                    renderer.domElement.clientHeight;
    camera.updateProjectionMatrix();

You should set your viewport to the size of the drawingbuffer

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawBufferHeight);

In three.js that would be

    renderer.setViewport(0, 0, renderer.context.drawingBufferWidth,
                               renderer.context.drawingBufferHeight);

That should also always work. 

If you're doing anything else related to the width and height of the canvas (picking, scissor, etc..) you'll need to do the appropriate math to convert from the size the canvas is being displayed to the size of its drawingbuffer

That will get rid of the distortion, of course since Chrome will actually only be creating a smaller drawingBuffer you'll get some scaling. 

Title: WebGL VS Canvas 2D hardware acceleration
Description:
TOC: qna

# Question:

These days, I need to draw many images on a canvas. The canvas size is 800x600px, and I have many images of 256x256px(some is smaller) to draw on it, these small images will compose a complete image on the canvas. I have two ways to implement this. 

First, if I use canvas 2D context, that is `context = canvas.getContext('2d')`, then I can just use `context.drawimage()` method to put every image on the proper location of the canvas. 

Another way, I use WebGL to draw these images on the canvas. On this way, for every small image, I need to draw a rectangle. The size of the rectangle is the same as this small image. Besides, the rectangle is on the proper location of the canvas. Then I use the image as texture to fill it.

Then, I compare the performance of these two methods. Both of their fps will reach 60, and the animation(When I click or move by the mouse, canvas will redraw many times) looks very smooth. So I compare their **CPU usage**. I expect that when I use WebGL, the CPU will use less because GPU will assure many work of drawing. But the result is, the CPU usage looks almost the same. I try to optimize my WebGL code, and I think it's good enough. By google, I found that browser such as Chrome, Firefox will enable **Hardware acceleration** by default. So I try to close the hardware acceleration. Then the CPU usage of the first method becomes much higher. So, my question is, since canvas 2D use GPU to accelerate, is it necessary for me to use WebGL just for 2D rendering? What is different between canvas 2D GPU acceleration and WebGL? They both use GPU. Maybe there is any other method to lower the CPU usage of the second method? Any answer will be appreciate!

# Answer

Canvas 2D is still supported more places than WebGL so if you don't need any other functionality then going with Canvas 2D would mean your page will work on those browsers that have canvas but not WebGL (like old android devices). Of course it will be slow on those devices and might fail for other reasons like running out of memory if you have a lot of images.

Theoretically WebGL can be faster because the default for canvas 2d is that the drawingbuffer is preserved whereas for WebGL it's not. That means if you turn anti-aliasing off on WebGL the browser has the option to double buffer. Something it can't do with canvas2d. Another optimization is in WebGL you can turn off alpha which means the browser has the option to turn off blending when compositing your WebGL with the page, again something it doesn't have the option to do with canvas 2d. (there are plans to be able to turn off alpha for canvas 2d but as of 2017/6 it's not widely supported)

But, by *option* I mean just that. It's up to the browser to decide whether or not to make those optimizations. 

Otherwise if you don't pick those optimizations it's possible the 2 will be the same speed. I haven't personally found that to be the case. I've tried to do some `drawImage` only things with canvas 2d and didn't get a smooth framerate were as I did with WebGL. It made no sense to be but I assumed there was something going on inside the browser I was un-aware off.

I guess that brings up the final difference. WebGL is low-level and well known. There's not much the browser can do to mess it up. Or to put it another way you're 100% in control. 

With Canvas2D on the other hand it's up to the browser what to do and which optimizations to make. They might changes on each release. I know for Chrome at one point any canvas under 256x256 was NOT hardware accelerated. Another example would be what the canvas does when drawing an image. In WebGL you make the texture. You decide how complicated your shader is. In Canvas you have no idea what it's doing. Maybe it's using a complicated shader that supports all the various canvas `globalCompositeOperation`, masking, and other features. Maybe for memory management it splits images into chucks and renders them in pieces. For each browser as well as each version of the same browser what it decides to do is up to that team, where as with WebGL it's pretty much 100% up to you. There's not much they can do in the middle to mess up WebGL.

FYI: Here's [an article detailing how to write a WebGL version of the canvas2d `drawImage` function](https://webglfundamentals.org/webgl/lessons/webgl-2d-drawimage.html) and it's followed by [an article on how to implement the canvas2d matrix stack](https://webglfundamentals.org/webgl/lessons/webgl-2d-drawimage.html).

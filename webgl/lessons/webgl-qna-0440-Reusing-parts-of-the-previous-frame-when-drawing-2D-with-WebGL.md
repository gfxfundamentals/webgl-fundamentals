Title: Reusing parts of the previous frame when drawing 2D with WebGL
Description:
TOC: qna

# Question:

I'm using WebGL to do something very similar to image processing. I draw a single Quad in orthoscopic projection, and perform some processing in the fragment shaders. There are two steps, in the first one the original texture from the Quad is processed in the fragment shader and written to a framebuffer, a second step processes that data to the final canvas.

The users can zoom and translate the image. For this to work smoothly, I need to hit 60 fps, or this gets noticeably sluggish. This is no issue on desktop GPUs, but on mobile devices with much weaker hardware and higher resolutions this gets problematic. 

The translation case is the most noticeable and problematic, the user drags the mouse pointer or their finger over the screen and the image is lagging behind. But translation is also a case where I could theoretically reuse a lot of data from the previous frame. 

Ideally I'd copy the canvas from the last frame, translate it by x,y pixels, and then only do the whole image processing in fragment shaders on the parts of the canvas that aren't covered by the translated previous canvas.

Is there a way to do this in WebGL? 



# Answer

If you want to access the previous frame you need to draw to a texture attached to a framebuffer. Then draw that texture into the canvas translated.



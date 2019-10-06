Title: How to crop HTMLVideoElement in WebGL's texImage2D?
Description:
TOC: qna

# Question:

I'm playing around with WebGL, and I can successfully render a video element to a WebGL context with [`texImage2D`][3]. However, I'm now trying to crop this video element before rendering it. For example, I want to take the top half of the video element and draw it in the left half of my GL context; and the bottom half in the right half.

![image1][1]

**What is the best practice for this "crop action" in WebGL 1?**

I have figured out that I can adjust the [viewport][2] to render something in the left/right half, but I can't seem to find how to crop.
 
It would be nice if [`texImage2D`][3] supported offset and dimension parameters for video elements, but that's not the case.  

Maybe I can adjust this in the texture parameters or something?

  [1]: https://i.stack.imgur.com/rmLEa.png
  [2]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/viewport
  [3]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D

# Answer

In WebGL1 there is no easy way to crop at the `texImage2D` level. I suggest you just put the entire video frame into 1 texture and then use texture coordinates when rendering to select the part of the texture you want to display in each area


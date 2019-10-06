Title: How to make a Three.js shader that outputs a string?
Description:
TOC: qna

# Question:

I'm developing a web application with Three.js that renders a scene in ASCII, much like the example given [here](http://threejs.org/examples/#canvas_ascii_effect). I'm having issues with frame rate though.

I've tried all sorts of different algorithms to convert the rendered scene into an ASCII string. Some slower than the example, some much faster than the example, but all too slow for rendering large scenes, even with the WebGL renderer.

Now I'm considering moving this conversion process over to the GPU via a shader, although I'm not sure how to make a Three.js shader output a string. Optimally I would also like to be able to input a custom string of ASCII characters to be used as a palette, though there isn't a string type in GLSL.

Thanks! :)

# Answer

See [this sample](http://blog.tojicode.com/2012/07/sprite-tile-maps-on-gpu.html)

It basically takes a texture, let's call it the *map texture*, and uses each pixel as a lookup into another texture of sprite images. 

In your case you'd change those tiles to ascii characters and you'd render your 3d scene to the *map texture* by attaching it to a framebuffer. In other words,

    render your scene to a texture 
    use that texture as a lookup into another texture of ascii characters.



Title: Webgl rendering time limit - Internet Explorer 11
Description:
TOC: qna

# Question:

I have an issue where, sometimes (1 in 50 to 100) Internet explorer will throw this warning, which will cause webgl rendering to fail and throw:

> WEBGL11257: WebGL content is taking too long to render on your GPU.
> Temporarily switching to software rendering. 

I use Three.js and what happens when this occurs is that my Webgl renderer context will stop working since it assume it's using the GPU. It will then throw x amount of errors of all functions that are WebGL specific.

This can be fixed on my machine by exceeding the time limit, which at default is 500ms, by doing this change in the registry editor: https://support.microsoft.com/en-us/help/3099259/update-to-add-a-setting-to-disable-500-msec-time-limit-for-webgl-frame-in-internet-explorer-11

This is of course not a sustainable solution, since the clients that run IE11 or Edge should not have to do this. I wonder if anyone have stumbled upon this issue and if there is anything to do about it client side?



# Answer

The solution is to stop rendering whatever it taking too long to render. In most WebGL implementations each call to a `draw` function is timed. If it takes too long the browser will lose the webgl context.

Example of things that usually take too long. 

* Drawing too many large triangles/points

   You can draw hundreds of thousands, even millions of triangles if they are in general small but, draw very large triangles like that cover the entire screen things will get too slow fast

* Drawing lots of pixels with a complex fragment shader

   Fragments shaders run for every pixel they are rendered too. a 1920x1080 screen has over 2 million pixels so a slow fragment shader running 2 million times can end up being too slow

* Using random texture reads.

   The GPU is optimized to read textures in a straightforward way. It kind of assumes if you read one texel in a texture your going to read other texels nearby and caches the nearby texels. If instead you read texels in a semi random order you'll defeat the cache and go really slow.

Workarounds

*  If you need to draw lots of large things split up your draw calls.

   Let's say drawing 1 million triangles in a single call is too slow. Trying drawing 100k over 10 draw calls

*   Optimize your fragment shaders

*   Sort and draw opaque things front to back

    This is because the GPU can do the depth test per pixel, if the test fails then the fragment shader for that pixel is not run.

But ultimately if one of your draw calls is taking 500ms (1/2 a second) and you can't optimize then your page is probably really going to be frustrating for users. You could draw smaller parts over several frames to keep your frame rate high so the UX stays responsive.

One other thing that can trigger the same error is a shader that takes too long to compile. The shader might run fast enough once it's compiled but the complexity of compiling the shader itself, especially on DirectX, can end up taking more than 500ms and the browser will lose the WebGL context. For example [this very bad shader](https://www.vertexshaderart.com/art/DWwhcFd3xWKC5yjiW) runs for me on my iPhone but takes too long to compile on Windows and the browser loses the WebGL context.

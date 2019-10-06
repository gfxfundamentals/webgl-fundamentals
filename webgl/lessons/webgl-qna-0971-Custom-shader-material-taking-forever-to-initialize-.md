Title: Custom shader material taking forever to initialize?
Description:
TOC: qna

# Question:

I've been working on a raymarched project in three.js for a little over a year now and as the complexity has increased so has the initialization time. It can now take over 40 seconds to load the project in browser however once loaded runs at +60fps. I've tracked down the culprit function through performance tests and it seems to get hung up on the InitMaterial function within three's library. Does anyone have any idea as to what could be causing this hangup? Personally I believe it could be due to the amount of uniforms we use in the shader as there are quite a few of them.

You can find the [code in question here][1]. Note that the globalsinclude.glsl is where the list of uniforms is.


  [1]: https://github.com/mtwoodard/hypVR-Ray/releases/tag/hypvr-ray

# Answer

This is a problem in general with DirectX on Windows. I suspect if you try the same page on Linux or Mac or start Chrome with `--use-angle=gl` on Windows you'll see the time drop.

As an example you can [try this ridiculous shader](https://www.vertexshaderart.com/art/DWwhcFd3xWKC5yjiW). It takes about 3 seconds to compile on OpenGL but in DirectX the browser will likely decide it's taking too long and reset the GPU process.

There isn't much a browser can do about that issue as it's mostly in Microsoft's court. Microsoft designed DirectX for native games. Native games can compile shaders offline. The Web can't do that because they are opaque binaries passed to the driver and could be full of exploits.

There's been talk about adding asynchronous shader compilation functions to WebGL. The shader would still take 40 seconds to compile it just wouldn't block the page. At this point though that's unlikely to happen.

The only thing I can suggest is simplify your shaders. If you have loops maybe unwrap them and see if that helps.

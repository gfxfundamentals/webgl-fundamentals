Title: How to get OpenGL version using Javascript?
Description:
TOC: qna

# Question:

Is there any way to let the browser returns the opengl version string?

I know that opengl is not executed by the browser, this is why in the code, the shaders are written as string to not make javascript syntax errors,

So, if the browser can interract with the GPU, then there must be some code that returns a string to the console instead of shaders?

# Answer

The short answer is, you can't. You can ask for the standard GL versions.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.createElement("canvas").getContext("webgl");
    console.log(gl.getParameter(gl.VERSION));
    console.log(gl.getParameter(gl.SHADING_LANGUAGE_VERSION));
    console.log(gl.getParameter(gl.VENDOR));


<!-- end snippet -->

But at the moment they are required to return similar values on all implementations of WebGL. For example on my machine they return

    WebGL 1.0 (OpenGL ES 2.0 Chromium) 
    WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium) 
    WebKit 

Respectively.

The reason they are supposed to return these specific values is for privacy reasons. If you could find out the vendor of someone's GPU then you could use that as more information to identify them. (see https://panopticlick.eff.org/ for examples of using browser info to uniquely identify a specific machine.)

Apple has even pointed out that if you knew the vendor and model number of the GPU then you could for example know if someone recently bought a MacPro since MacPro's have a GPU that is available no where else. So for example you could target ads at them. "Hey, I see based on your GPU you have an $7000 computer. How'd you like this expensive vacation package?"

Google has decided on the other hand they don't see that as a problem and so they've decided to turn on a WebGL extension what was originally supposed to be *privileged* (meaning only available by special enabling for things like testing). That extension is the `WEBGL_debug_renderer_info` extension (http://www.khronos.org/registry/webgl/extensions/WEBGL_debug_renderer_info/)

To use it first you have to check if it's available, then if it is, you can get the actual vendor and renderer.

    // try to get the extensions
    const ext = gl.getExtension("WEBGL_debug_renderer_info");

    // if the extension exists, find out the info.
    if (ext) {
      console.log(gl.getParameter(ext.UNMASKED_VENDOR_WEBGL));
      console.log(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL));
    }

When I run that on my machine I get

    NVIDIA Corporation
    NVIDIA GeForce GT 650M OpenGL Engine 

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.createElement("canvas").getContext("webgl");
    // try to get the extensions
    const ext = gl.getExtension("WEBGL_debug_renderer_info");

    // if the extension exists, find out the info.
    if (ext) {
      console.log(gl.getParameter(ext.UNMASKED_VENDOR_WEBGL));
      console.log(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL));
    }


<!-- end snippet -->

note: Checked recently 2017-Aug-1 This is available in Firefox 54, Safari 10.1.2, Chrome 59 so I guess the other browsers have decided it was important to expose

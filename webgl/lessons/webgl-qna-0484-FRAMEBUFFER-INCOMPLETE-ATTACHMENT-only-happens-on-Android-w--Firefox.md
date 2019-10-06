Title: FRAMEBUFFER_INCOMPLETE_ATTACHMENT only happens on Android w/ Firefox
Description:
TOC: qna

# Question:

I have some javascript/webgl code that works on every browser I've tried, except for the mobile version of firefox running on Android. The problem has something to do with being "[framebuffer complete](https://www.opengl.org/wiki/Framebuffer_Object#Framebuffer_Completeness)", but I don't know what specifically is wrong.

Here's the smallest repro I could make. It's supposed to just create a texture and a framebuffer, set some properties, then check that the framebuffer is 'complete':

<!-- begin snippet: js hide: false -->

<!-- language: lang-js -->

    var canvas = document.createElement('canvas');
    var gl = canvas.getContext('webgl');
    var GL = WebGLRenderingContext;
    if (gl.getExtension('OES_texture_float') === null) {
        alert("No float support.");
    }

    var texture = gl.createTexture();
    var frameBuffer = gl.createFramebuffer();
    gl.bindTexture(GL.TEXTURE_2D, texture);
    gl.bindFramebuffer(GL.FRAMEBUFFER, frameBuffer);

    gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST);
    gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
    gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
    gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
    gl.texImage2D(
        GL.TEXTURE_2D, //target
        0,             //level
        GL.RGBA,       //internalformat
        2,             //width
        2,             //height
        0,             //border
        GL.RGBA,       //format
        GL.FLOAT,      // type [changing to UNSIGNED_BYTE "fixes" the failure...?]
        null           // pixels
    );
    gl.framebufferTexture2D(
        GL.FRAMEBUFFER,
        GL.COLOR_ATTACHMENT0,
        GL.TEXTURE_2D,
        texture,
        0);

    var result = gl.checkFramebufferStatus(GL.FRAMEBUFFER);
    if (result === GL.FRAMEBUFFER_COMPLETE) {
        alert("success (FRAMEBUFFER_COMPLETE)");
    } else {
        alert("ERROR " + ({
            [0]: "Argument wasn't a frame buffer",
            [GL.INVALID_ENUM]: "INVALID_ENUM",
            [GL.FRAMEBUFFER_INCOMPLETE_ATTACHMENT]: "FRAMEBUFFER_INCOMPLETE_ATTACHMENT",
            [GL.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT]:
                "FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT",
            [GL.FRAMEBUFFER_INCOMPLETE_DIMENSIONS]: "FRAMEBUFFER_INCOMPLETE_DIMENSIONS",
            [GL.FRAMEBUFFER_UNSUPPORTED]: "FRAMEBUFFER_UNSUPPORTED"
        }[result] || result));
    }


<!-- end snippet -->

In my testing, this code succeeds on Windows+Firefox-44, Windows+Chrome-49, Android+Chrome, and Ubuntu+Firefox. But it fails with `FRAMEBUFFER_INCOMPLETE_ATTACHMENT` on Android+Firefox.

Also, I've found that it only seems to affect `FLOAT` textures. If I change the type to `UNSIGNED_BYTE`, it passes.

Because I'm not familiar with opengl in general, it's likely that I've made some obvious oversight (e.g. not binding a required property) and mobile firefox is the only browser that didn't silently fix my mistake.

Another possibly relevant thing is having to pass `GL.FRAMEBUFFER` into `gl.checkFramebufferStatus`, instead of the actual `frameBuffer` instance. When I pass `frameBuffer`, the result is just always 0. Normally 0 means success, but [the mdn docs](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/checkFramebufferStatus) don't even list 0 as a possible return value for this function; they say the good result is `FRAMEBUFFER_COMPLETE`.

# Answer

If it's working **on the exact same phone** in other browsers then I'd [file a bug with Mozilla](https://bugzilla.mozilla.org/).

In general though, the ability to attach a floating point texture to a framebuffer is not universally supported. In OpenGL ES 2.0 no formats whatsoever are guaranteed to work :( 

In WebGL, only 3 formats are guaranteed to work. [From the spec](https://www.khronos.org/registry/webgl/specs/latest/1.0/#6.6):

> The following combinations of framebuffer object attachments, when all of the attachments are framebuffer attachment complete, non-zero, and have the same width and height, must result in the framebuffer being framebuffer complete:

> * COLOR_ATTACHMENT0 = RGBA/UNSIGNED_BYTE texture
> * COLOR_ATTACHMENT0 = RGBA/UNSIGNED_BYTE texture + DEPTH_ATTACHMENT = DEPTH_COMPONENT16 renderbuffer
> * COLOR_ATTACHMENT0 = RGBA/UNSIGNED_BYTE texture + DEPTH_STENCIL_ATTACHMENT = DEPTH_STENCIL renderbuffer

All other combinations of attachments are up to the GPU/driver/browser.


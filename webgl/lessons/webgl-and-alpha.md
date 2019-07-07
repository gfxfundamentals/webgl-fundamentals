Title: WebGL and Alpha
Description: How alpha in WebGL is different than alpha in OpenGL
TOC: WebGL and Alpha


I've noticed some OpenGL developers having issues with how WebGL
treats alpha in the backbuffer (ie, the canvas), so I thought it
 might be good to go over some of the differences between WebGL
 and OpenGL related to alpha.

The biggest difference between OpenGL and WebGL is that OpenGL
renders to a backbuffer that is not composited with anything,
or effectively not composited with anything by the OS's window
manager, so it doesn't matter what your alpha is.

WebGL is composited by the browser with the web page and the
default is to use pre-multiplied alpha the same as .png `<img>`
tags with transparency and 2D canvas tags.

WebGL has several ways to make this more like OpenGL.

### #1) Tell WebGL you want it composited with non-premultiplied alpha

    gl = canvas.getContext("webgl", {
      premultipliedAlpha: false  // Ask for non-premultiplied alpha
    });

The default is true.

Of course the result will still be composited over the page with whatever
background color ends up being under the canvas (the canvas's background
color, the canvas's container background color, the page's background
color, the stuff behind the canvas if the canvas has a z-index > 0, etc....)
in other words, the color CSS defines for that area of the webpage.

A really good way to find if you have any alpha problems is to set the
canvas's background to a bright color like red. You'll immediately see
what is happening.

    <canvas style="background: red;"><canvas>

You could also set it to black which will hide any alpha issues you have.

### #2) Tell WebGL you don't want alpha in the backbuffer

    gl = canvas.getContext("webgl", { alpha: false }};

This will make it act more like OpenGL since the backbuffer will only have
RGB. This is probably the best option because a good browser could see that
you have no alpha and actually optimize the way WebGL is composited. Of course
that also means it actually won't have alpha in the backbuffer so if you are
using alpha in the backbuffer for some purpose that might not work for you.
Few apps that I know of use alpha in the backbuffer. I think arguably this
should have been the default.

### #3) Clear alpha at the end of your rendering

    ..
    renderScene();
    ..
    // Set the backbuffer's alpha to 1.0
    gl.clearColor(1, 1, 1, 1);
    gl.colorMask(false, false, false, true);
    gl.clear(gl.COLOR_BUFFER_BIT);

Clearing is generally very fast as there is a special case for it in most
hardware. I did this in most of my demos. If I was smart I'd switch to
method #2 above. Maybe I'll do that right after I post this. It seems like
most WebGL libraries should default to this method. Those few developers
that are actually using alpha for compositing effects can ask for it. The
rest will just get the best perf and the least surprises.

### #4) Clear the alpha once then don't render to it anymore

    // At init time. Clear the back buffer.
    gl.clearColor(1,1,1,1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Turn off rendering to alpha
    gl.colorMask(true, true, true, false);

Of course if you are rendering to your own framebuffers you may need to turn
rendering to alpha back on and then turn it off again when you switch to
rendering to the canvas.

### #5) Handling Images

My default if you are loading images with alpha into WebGL. WebGL will
provide the values as they are in the PNG file with color values not
premultiplied. This is generally what I'm used to for OpenGL programs
because it's lossless whereas pre-multiplied is lossy.

    1, 0.5, 0.5, 0  // RGBA

Is a possible value un-premultiplied whereas pre-multiplied it's an
impossible value because `a = 0` which means `r`, `g`, and `b` have
to be zero.

You can have WebGL pre-multiply the alpha if you want. You do this
by setting `UNPACK_PREMULTIPLY_ALPHA_WEBGL` to true like this

    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

The default is un-premultiplied.

Be aware that most if not all Canvas 2D implementations work with
pre-multiplied alpha. That means when you transfer them to WebGL and
`UNPACK_PREMULTIPLY_ALPHA_WEBGL` is false WebGL will convert them
back to un-premultipiled.

### #6) Using a blending equation that works with pre-multiplied alpha.

Almost all OpenGL apps I've writing or worked on use

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

That works for non pre-multiplied alpha textures.

If you actually want to work with pre-multiplied alpha textures then you
probably want

    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

Those are the methods I'm aware of. If you know of more please post them below.




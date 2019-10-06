Title: WebGL alpha blending
Description:
TOC: qna

# Question:

I'm trying to layer one texture over another, but I'm having alpha blending issues around the edges. I've tried many blending combinations with no luck. Where am I going wrong?

Current state of framebuffer (opaque):

<img src="https://i.stack.imgur.com/MwvYf.png" width="250">

Transparent texture rendered in off-screen framebuffer:

<img src="https://i.stack.imgur.com/fwpd3.png" width="250">

Result when I try to blend the two. Notice the edges on the circle:

<img src="https://i.stack.imgur.com/rPBbV.png" width="250">

Here's the blendFunc:

    _gl.blendFuncSeparate( _gl.SRC_ALPHA, _gl.ONE_MINUS_SRC_ALPHA, _gl.ONE, _gl.ONE_MINUS_SRC_ALPHA );

Here's the shader. Just basic rendering of a texture:

    uniform sampler2D texture;
    varying vec2 vUv;

    void main() {
        vec4 tColor = texture2D(texture, vUv);

     gl_FragColor = tColor;
    }

# Answer

Most likely your textures are using premultiplied alpha and so your blend function should be

    _gl.blendFunc(_gl.ONE, _gl.ONE_MINUS_SRC_ALPHA);

If your textures are not premultiplied you probably want to premultiply them either in your shader

    gl_FragColor.rgb *= gl_FragColor.a

or when you load them (before you call `gl.texImage2D`) you can tell the browser to premultiply them

    _gl.pixelStorei(_gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

[This document probably explains the issues better](https://developer.nvidia.com/content/alpha-blending-pre-or-not-pre)

and you might find this relevant as well

https://stackoverflow.com/questions/39341564/webgl-how-to-correctly-blend-alpha-channel-png/

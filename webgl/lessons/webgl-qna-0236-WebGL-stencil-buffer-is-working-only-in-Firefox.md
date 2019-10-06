Title: WebGL stencil buffer is working only in Firefox
Description:
TOC: qna

# Question:

I have a semi-working usage of a stencil buffer in WebGL. This works fine in Firefox, but fails in Chrome (and Internet Explorer as well.) The rest of the application continues to function without error, except that the stencil is ignored.

![Left: Firefox, Right: Chrome][1]


  [1]: http://i.stack.imgur.com/Xqd37.png

Here Firefox is correctly creating the stencil, so the green rectangle is rendered with hole in it. Here is a jsFiddle demo: http://jsfiddle.net/XH9eC/3/

I turn on stenciling mode and turn off the color mask:

    gl.colorMask(gl.FALSE, gl.FALSE, gl.FALSE, gl.FALSE);
    gl.stencilFunc(gl.ALWAYS, 1, 0xFF);
    gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE);

Then I render the square in the middle of the screen

Then I change the stenciling mode and turn on color:

    gl.colorMask(true, true, true, true);
    gl.stencilFunc(gl.EQUAL, 0, 0xFF);
    gl.stencilOp(gl.ZERO, gl.ZERO, gl.ZERO)

And lastly I render the green background.

If it matters, this is the code I use to render the background and the square stencil (I just use different vertices):

    var background = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, background);
    gl.vertexAttribPointer(position_location, 2, gl.FLOAT, false, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
     0, 0,
     800, 600,
     0, 600,
     0, 0,
     800, 0,
     800, 600
    ]), gl.STATIC_DRAW);

I have run into this problem with other code and have yet to fix it. I have seen other examples of the stencil buffer being used in Chrome.

# Answer

This sounds like a bug in Firefox. [Run this test in Firefox](https://www.khronos.org/registry/webgl/sdk/tests/conformance/context/context-attributes-alpha-depth-stencil-antialias.html) and see if it passes. 

You're supposed to need to request a stencil buffer when you create the WebGL context by passing in `stencil:true` as in

     var gl = canvas.getContext("webgl", {stencil:true});

Requesting a stencil buffer does not guarantee you got one. To check you can use

        var contextAttributes = gl.getContextAttributes();
        var haveStencilBuffer = contextAttributes.stencil;


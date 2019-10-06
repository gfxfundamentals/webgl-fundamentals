Title: Alpha rendering difference between OpenGL and WebGL
Description:
TOC: qna

# Question:

I'm rendering the same scene using the same exact C++ code, once to native OpenGL on windows and once using Emscripten to WebGL. Everything in the scene looks exactly the same, except when I'm rendering something with alpha != 1.0. The difference looks like this:
[![enter image description here][1]][1]

The blue cube color is `(0.0, 0.0, 1.0, 0.5)`  
The shader used for rendering the cube does nothing except draw the color.  
On the right is how it looks with OpenGL and is the expected result, just blue with half transparency. On the left is how it looks with Emscripten+WebGL. It looks like the color which is rendered is actually `(0.5, 0.5, 1.0, 0.5)`

The blend function I use is the standard:
    
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);

Is there some kind of difference with alpha in WebGL? What can possibly cause this to happen?

  [1]: http://i.stack.imgur.com/Iuo7v.png

# Answer

Did you set the canvas to be non-premultilied?

    gl = someCanvas.getContext("webgl", { premultipliedAlpha: false });

The default for WebGL is true. The default for most OpenGL apps is false

On top of that WebGL is composited with the rest of the page. At a minimum that's the background color of the canvas or whatever it's inside (the body of your document). 

To see if this is the problem try setting your canvas's background color to purple or something that will stick out

    <canvas ... style="background-color: #F0F;"></canvas>

or in css

    canvas { background-color: #F0F; }

OpenGL apps are rarely composited over anything where as WebGL apps effectively are ALWAYS composited.

Some solutions

*   Turn off alpha

    If you don't need alpha in your destination you can turn it off

        gl = someCanvas.getContext("webgl", { alpha: false });

    Now the alpha will effectively be 1

*   Set the alpha to 1 at the end of a frame

        // clear only the alpha channel to 1
        gl.clearColor(1, 1, 1, 1);
        gl.colorMask(false, false, false, true);
        gl.clear(gl.COLOR_BUFFER_BIT);

    don't forget to set the color mask back to all true if you need
    to clear the color buffer later

*   Set the canvas's background color to black

        canvas { background-color: #000; }

If possible I'd pick turning off alpha. The reason if is alpha is set to off it's possible the browser can turn off blending when drawing the canvas into the browser. That could be a 10-20% or more increase in speed depending on the GPU. There's no guarantee that any browser makes that optimization, only that it's possible to does whereas with the other 2 solutions it's not possible or at least far less likely

Title: Reading out an FBO with Premultiplied Alpha
Description:
TOC: qna

# Question:

I am drawing brush strokes to an framebuffer object using the method described in the answer of this question:

https://stackoverflow.com/questions/2171085/opengl-blending-with-previous-contents-of-framebuffer

This method correctly alpha - blends different OpenGL drawing operations into one FBO and makes sure the alpha stays correct.

It uses

glBlendFuncSeparate(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA, GL_ONE, GL_ONE_MINUS_SRC_ALPHA);

to mix the OpenGL drawing operations (in my case brush strokes) into FBO and uses

glBlendFunc(GL_ONE, GL_ONE_MINUS_SRC_ALPHA);

to draw the final FBO (in my case a Photoshop like layer) back to the screen which removes the premultiplied alpha used in the method. This works fine for me when blitting the FBO to the screen.

However, when I want to read out the content of the FBO I cannot get rid of the premultiplied alpha. I.e. when I use

glBlendFunc(GL_ONE, GL_ONE_MINUS_SRC_ALPHA);

to draw the layer into another FBO and than use glReadPixel() to read out the content of this FBO, the content is still premultiplied.

In other words, when I draw the FBO to the screen, blending and removing the prem. alpha works, when doing the same thing and drawing into an FBO, it fails.

Here is resulting (wrong) image when I read out the FBO:

[![enter image description here][1]][1]

and here is the correct result when drawing the layer directly to the screen:

[![enter image description here][2]][2]

Thanks for any help.


  [1]: http://i.stack.imgur.com/JPTdo.png
  [2]: http://i.stack.imgur.com/Iam5b.png

# Answer

I'm not sure what you mean by "get rid of the premultiplied alpha". If you want the picture to be un-premultiplied then you have to manually unpremultiply it either in JavaScript or in a shader with something like

    gl_FragCoord = vec4(color.a > 0. ? color.rgb / color.a : vec3(0), color.a);

The reason it works when you draw to the canvas is because by default the canvas expects premultiplied alpha. Rendering with ONE,ONE_MINUS_SRC_ALPHA is drawing with premultiplied alpha and keeping the result premultiplied

Example:

    Un-premultiplied    Red = 0.7  Alpha = 0.2
    
        convert to premultiplied   Red = Red * Alpha

    Premultiplied       Red = 0.14 Alpha = 0.2

        blend with ONE,ONE_MINUS_SRC_ALPHA

                        DstRed = 0.0  DstAlpha = 0.0

        newPixelRed    = Red(0.14) * ONE + DstRed(0.0) * (1 - Alpha(0.2))
        newPixelRed    = 0.14 +            0.0 * 0.8
        newPixelRed    = 0.14

        newPixelAlpha  = Alpha(0.2) * ONE + DstAlpha(0.0) * (1 - Alpha(0.2))
        newPixelAlpha  = 0.2 + 0.0 * 0.8
        newPixelAlpha  = 0.2

So `newPixelRed` and `newPixelAlpha` area exactly what they were before you drew.

The only way to get `newPixelRed` to go back to its unpremultiplied state is to divide by alpha

    newPixelRed = Red(0.14) / Alpha(0.2)
    newPixelRed = 0.14 / 0.2
    newPixelRed = 0.7            <- The original red before it was premultiplied

You can only do that in a shader or JavaScript. Blending alone won't do it.

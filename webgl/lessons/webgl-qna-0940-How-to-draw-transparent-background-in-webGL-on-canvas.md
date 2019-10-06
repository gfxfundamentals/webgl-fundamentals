Title: How to draw transparent background in webGL on canvas
Description:
TOC: qna

# Question:

https://codepen.io/anon/pen/zMRjwv

In that page, I want to draw a transparent background but it's not working when I use `gl.clearColor(0, 0, 0, 0)`.  

     const gl = canvas.getContext('webgl', {alpha: false});

Set `alpha:false` is also can't because 2D context 
attributes: alpha: Boolean that indicates if the canvas contains an alpha channel. 

If set to false, the browser will knows that the backdrop is always opaque, which can speed up drawing of transparent content and `images.WebGL` context. 

    attributes:
    alpha: Boolean that indicates if the canvas contains an alpha buffer.


# Answer

The issue with the sample you linked to is that the sample itself is not transparent. It draw a background, then it draws sakura petals, then it applies a glow shader to give the petals a glow. This generates an opaque image so setting the canvas alpha to true (or not setting it all) won't make a difference.

To make it transparent comment out the following lines and change the background color

    // gl.bindFramebuffer(gl.FRAMEBUFFER, renderSpec.mainRT.frameBuffer);
    // gl.viewport(0, 0, renderSpec.mainRT.width, renderSpec.mainRT.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // renderBackground();
    renderPointFlowers();
    // renderPostProcess();

You can then possibly adjust the petal brightness changing this line

    col *= mix(0.8, 1.0, pow(abs(coord.x), 0.3));

to this for example

    col *= mix(1.8, 3.0, pow(abs(coord.x), 0.3));


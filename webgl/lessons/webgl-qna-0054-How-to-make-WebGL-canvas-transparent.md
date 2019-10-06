Title: How to make WebGL canvas transparent
Description:
TOC: qna

# Question:

Is it possible to have **WebGL canvas** with transparent background?
I want to have contents of web page visible through the canvas.

This is what I have now: http://i50.tinypic.com/2vvq7h2.png

As you can see, the text behind the WebGL canvas is not visible. When I change style of Canvas element in CSS and add

    opacity: 0.5;

The page will look like this:
http://i47.tinypic.com/302ys9c.png

Which is almost what I want, but not entirely - the color of text due to the CSS alpha setting is of course not the same black and color of blue shape is not the same blue as in the first picture.

Thanks for any help!


# Answer

WebGL defaults to being transparent. Here's a sample

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.getElementById("c").getContext("webgl");
    gl.clearColor(0.5, 0, 0, 0.5);
    gl.clear(gl.COLOR_BUFFER_BIT);

<!-- language: lang-css -->

    pre {
        padding-left: 50px;
        font-family: sans-serif;
        font-size: 20px;
        font-weight: bold;
    }

    canvas {
        z-index: 2;
        position: absolute;
        top: 0px;
        border: 1px solid black;
    }


<!-- language: lang-html -->

    <pre>
    Some 
    text
    under
    the
    canvas
    </pre>
    <canvas id="c"></canvas>


<!-- end snippet -->

Note that the browser assumes the pixels in the canvas represent PRE-MULTIPLIED-ALPHA values. That means for example if you changed the clear color to (1, 0, 0, 0.5) you'd get something you don't see anywhere else in HTML.

What I mean by that is Pre-multiplied alpha means the RGB parts are such that they've already been multiplied by the alpha value. So if you started 1,0,0 for RGB and your alpha is 0.5. Then if you multiply the RGB by alpha you'd get 0.5, 0, 0 for the RGB. That's what the browser expects by default.

If the pixels in WebGL are 1,0,0,0.5 that makes no sense to the browser and you'll get strange effects.  

See for example 

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.getElementById("c").getContext("webgl");
    gl.clearColor(1, 0, 0, 0.5);
    gl.clear(gl.COLOR_BUFFER_BIT);


<!-- language: lang-css -->

    pre {
        padding-left: 50px;
        font-family: sans-serif;
        font-size: 20px;
        font-weight: bold;
    }

    canvas {
        z-index: 2;
        position: absolute;
        top: 0px;
        border: 1px solid black;
    }

<!-- language: lang-html -->

    <pre>
    Some 
    text
    under
    the
    canvas
    </pre>
    <canvas id="c"></canvas>


<!-- end snippet -->

Notice the black text has become red even though you'd think an alpha of 0.5 = 50% of the black text and 50% of the red WebGL canvas. That's because the red has not been pre-multiplied.

You can solve this by making sure the values you create in WebGL represent pre-multiplied values., or you can tell the browser that your WebGL pixels are not pre-multiplied when you create the webgl context with

    const gl = canvas.getContext("webgl", { premultipliedAlpha: false });

Now the 1,0,0,0.5 pixels work again. Example: 

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.getElementById("c").getContext("webgl", {
      premultipliedAlpha: false,
    });
    gl.clearColor(1, 0, 0, 0.5);
    gl.clear(gl.COLOR_BUFFER_BIT);

<!-- language: lang-css -->

    pre {
        padding-left: 50px;
        font-family: sans-serif;
        font-size: 20px;
        font-weight: bold;
    }

    canvas {
        z-index: 2;
        position: absolute;
        top: 0px;
        border: 1px solid black;
    }

<!-- language: lang-html -->

    <pre>
    Some 
    text
    under
    the
    canvas
    </pre>
    <canvas id="c"></canvas>

<!-- end snippet -->

Which way you do this is up to your application. Many GL programs expect non-premultiplied alpha where as all other parts of HTML5 expect premultlipled alpha so WebGL gives you both options.





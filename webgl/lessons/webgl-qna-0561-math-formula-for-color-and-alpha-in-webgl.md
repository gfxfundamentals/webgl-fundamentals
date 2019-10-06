Title: math formula for color and alpha in webgl
Description:
TOC: qna

# Question:

    body {
        background-color:black;
    }
    #myCanvas {
        background-color:rgba(55,23,88,0.5); // (bg_R,bg_V,bg_B,bg_A)
    }

    var myCanvas= document.getElementById("myCanvas");
    gl = myCanvas.getContext("webgl", {
             premultipliedAlpha: true ,
             alpha:true
    });


    gl.clearColor(0.8, 0, 0, 0.5); // (ccR,ccV,ccB,ccA)
    gl.clear(gl.COLOR_BUFFER_BIT);

Now i am looking the color of the resulting canvas :

rvba = 222,8,33,255

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    var myCanvas= document.getElementById("myCanvas");

    gl = myCanvas.getContext("webgl", {
      premultipliedAlpha: true ,
      alpha:true
    });

    gl.clearColor(0.8, 0, 0, 0.5);
    gl.clear(gl.COLOR_BUFFER_BIT);
    var pixels = new Uint8Array( 4);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    console.log(pixels); // Uint8Array




<!-- language: lang-css -->

    * {
      margin:0;
    }
    body {
      background-color:black;
    }
    #myCanvas {
      background-color:rgba(55,23,88,0.5);
    }

<!-- language: lang-html -->

    <canvas id="myCanvas"  ></canvas>

<!-- end snippet -->

What is the formula ?
(final_R,final_V,final_B,final_A) = function ( bg_R,bg_V,bg_B,bg_A,ccR,ccV,ccB,ccA) ?

and furthermore, if premultipliedAlpha is set to false, how this function change ?

Thanks !

edit : oups...i read the result color of the canvas in a screenshot...but the values change each time, now i have rvba = 227,0,20,255

OK..the screenshot was a very strange idea...now i use gl.readpixel,
and i've got : [204, 0, 0, 128]

So, with this very different result, my question is out of date.

Sorry !


# Answer

Your example is invalid. With `premultipliedAlpha: true` (which is the default by the way) there's no such thing as a color that's

    gl.clearColor(0.8, 0, 0, 0.5);

Why? Because colors go from 0.0 to 1.0.  Since alpha is 0.5 the highest number you can have in R, G, or B, is 0.5 since `premultipliedAlpha: true` means the 0.0 <-> 1.0 value was multiplied by alpha. 1.0 (the highest value possible) * 0.5 alpha = 0.5 therefore your 0.8 red value in `gl.clearColor` is invalid

Invalid colors are undefined according to the WebGL spec which means the result can be different per browser.

As for what happens with `premultiplyAlpha: true` vs `premultiplyAlpha: false` it's not really defined by WebGL. For **valid** colors you can assume that with `premultiplyAlpha: true` it's 

    dstColor = srcColor + dst * (1 - srcAlpha)

For `premultiplyAlpha: false` you for **valid** colors the result should be

    dstColor = srcColor * alpha + dst * (1 - srcAlpha)

But how it actually gets to that result is undefined. For example maybe it's going to first multiply the alpha in the texture or shader used to composite and then use the same as premultiplied alpha. 

For invalid colors you can't assume anything. Maybe it's going to post process out of range colors to magenta. It's not specified. 

As for calling `gl.readPixels` that will only give you the value in the canvas, not the value displayed (which could be pretty much anything depending on tons of CSS settings.)

As a simple example

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var gl = document.querySelector("canvas").getContext("webgl");
    var pixel = new Uint8Array(4);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    log("color:", pixel);

    function log() {
      var pre = document.createElement("pre");
      pre.appendChild(document.createTextNode(Array.prototype.join.call(arguments, " ")));
      document.body.appendChild(pre);
    }

<!-- language: lang-html -->

    <canvas style="background-color: rgb(255, 0, 0);"><canvas>


<!-- end snippet -->

Even though that canvas's background color is red `gl.readPixels` returns 0,0,0,0

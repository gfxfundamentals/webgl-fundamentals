Title: WebGL Text - HTML
Description: How to use HTML to display text that is positioned to match WebGL
TOC: Text - HTML


This article is a continuation of previous WebGL articles.  If you haven't
read them I suggest [you start there](webgl-3d-perspective.html) and work
your way back.

A common question is "how to I draw text in WebGL".  The first thing to
ask yourself is what's your purpose in drawing the text.  You're in a
browser, the browser displays text.  So your first answer should be to use
HTML to display text.

Let's do the easiest example first: You just want to draw some text over
your WebGL.  We might call this a text overlay.  Basically this is text
that stays in the same position.

The simple way is to make an HTML element or elements and use CSS to make
them overlap.

For example: First make a container and put both a canvas and some HTML to
be overlaid inside the container.

    <div class="container">
      <canvas id="canvas"></canvas>
      <div id="overlay">
        <div>Time: <span id="time"></span></div>
        <div>Angle: <span id="angle"></span></div>
      </div>
    </div>

Next setup the CSS so that the canvas and the HTML overlap

    .container {
        position: relative;
    }
    #overlay {
        position: absolute;
        left: 10px;
        top: 10px;
    }

Now look up those elements at init time and create or lookup the areas you want to
change.

    // look up the elements we want to affect
    var timeElement = document.querySelector("#time");
    var angleElement = document.querySelector("#angle");

    // Create text nodes to save some time for the browser.
    var timeNode = document.createTextNode("");
    var angleNode = document.createTextNode("");

    // Add those text nodes where they need to go
    timeElement.appendChild(timeNode);
    angleElement.appendChild(angleNode);

Finally update the nodes when rendering

    function drawScene() {
        ...

        // convert rotation from radians to degrees
        var angle = radToDeg(rotation[1]);

        // only report 0 - 360
        angle = angle % 360;

        // set the nodes
        angleNode.nodeValue = angle.toFixed(0);  // no decimal place
        timeNode.nodeValue = clock.toFixed(2);   // 2 decimal places

And here's that example

{{{example url="../webgl-text-html-overlay.html" }}}

Notice how I put spans inside the divs specifically for the parts I wanted to change. I'm making the
assumption here that that's faster than just using the divs with no spans and saying something like

    timeNode.value = "Time " + clock.toFixed(2);

Also I'm using text nodes by calling `node = document.createTextNode()`
and later `node.nodeValue = someMsg`.  I could also use
`someElement.innerHTML = someHTML`.  That would be more flexible because
you could insert arbitrary HTML strings though it might be slightly slower
since the browser has to create and destroy nodes each time you set it.
Which is better is up to you.

The important point to take way from the overlay technique is that WebGL
runs in a browser.  Remember to use the browser's features when
appropriate.  Lots of OpenGL programmers are used to having to render
every part of their app 100% themselves from scratch but because WebGL
runs in a browser it already has tons of features.  Use them.  This has
lots of benefits.  For example you can use CSS styling to easily give that
overlay an interesting style.

For example here's the same example but adding some style.  The background
is rounded, the letters have a glow around them.  There's a red border.
You get all that essentially for free by using HTML.

{{{example url="../webgl-text-html-overlay-styled.html" }}}

The next most common thing to want to do is position some text relative to
something you're rendering.  We can do that in HTML as well.

In this case we'll again make a container with the canvas and another
container for our moving HTML

    <div class="container">
      <canvas id="canvas" width="400" height="300"></canvas>
      <div id="divcontainer"></div>
    </div>

And we'll setup the CSS

    .container {
        position: relative;
        overflow: none;
        width: 400px;
        height: 300px;
    }

    #divcontainer {
        position: absolute;
        left: 0px;
        top: 0px;
        width: 100%;
        height: 100%;
        z-index: 10;
        overflow: hidden;

    }

    .floating-div {
        position: absolute;
    }

The `position: absolute;` part makes the `#divcontainer` be positioned in
absolute terms relative to the first parent with another `position:
relative` or `position: absolute` style.  In this case that's the
container that both the canvas and the `#divcontainer` are in.

The `left: 0px; top: 0px` makes the `#divcontainer` align with everything.
The `z-index: 10` makes it float over the canvas.  And the `overflow:
hidden` makes its children get clipped.

Finally `.floating-div` will be used for the positionable div we create.

So now we need to look up the divcontainer, create a div and append it.

    // look up the divcontainer
    var divContainerElement = document.querySelector("#divcontainer");

    // make the div
    var div = document.createElement("div");

    // assign it a CSS class
    div.className = "floating-div";

    // make a text node for its content
    var textNode = document.createTextNode("");
    div.appendChild(textNode);

    // add it to the divcontainer
    divContainerElement.appendChild(div);


Now we can position the div by setting its style.

    div.style.left = Math.floor(x) + "px";
    div.style.top  = Math.floor(y) + "px";
    textNode.nodeValue = clock.toFixed(2);

Here's an example where we're just bounding the div around.

{{{example url="../webgl-text-html-bouncing-div.html" }}}

So the next step is we want to place it relative to something in the 3D
scene.  How do we do that?  We do it exactly how we asked the GPU to do it
when we [covered perspective projection](webgl-3d-perspective.html).

Up through that example we learned how to use matrices, how to multiply
them, and how to apply a projection matrix to convert them to clip space.
We pass all of that to our shader and it multiplies vertices in local
space and converts them to clip space.  We can do all the math ourselves in
JavaScript as well.  Then we can multiply clip space (-1 to +1) into pixels
and use that to position the div.

    gl.drawArrays(...);

    // We just got through computing a matrix to draw our
    // F in 3D.

    // choose a point in the local space of the 'F'.
    //             X  Y  Z  W
    var point = [100, 0, 0, 1];  // this is the front top right corner

    // compute a clip space position
    // using the matrix we computed for the F
    var clipspace = m4.transformVector(matrix, point);

    // divide X and Y by W just like the GPU does.
    clipspace[0] /= clipspace[3];
    clipspace[1] /= clipspace[3];

    // convert from clipspace to pixels
    var pixelX = (clipspace[0] *  0.5 + 0.5) * gl.canvas.width;
    var pixelY = (clipspace[1] * -0.5 + 0.5) * gl.canvas.height;

    // position the div
    div.style.left = Math.floor(pixelX) + "px";
    div.style.top  = Math.floor(pixelY) + "px";
    textNode.nodeValue = clock.toFixed(2);

And voila, the top left corner of our div is perfectly aligned
with the top right front corner of the F.

{{{example url="../webgl-text-html-div.html" }}}

Of course if you want more text make more divs.

{{{example url="../webgl-text-html-divs.html" }}}

You can look at the source of that last example to see the
details. One important point is I'm just guessing that
creating, appending and removing HTML elements from the DOM
is slow so the example above creates them and keeps them
around. It hides any unused ones rather than removing them
from the DOM. You'd have to profile to know if that's faster.
That was just the method I chose.

Hopefully it's clear how to use HTML for text. [Next we'll
cover using Canvas 2D for text](webgl-text-canvas2d.html).




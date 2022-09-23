Title: WebGL Resizing the Canvas.
Description: How to resize a WebGL canvas and the issues involved
TOC: Resizing the Canvas

Here's what you need to know to change the size of the canvas.

Every canvas has 2 sizes. The size of its drawingbuffer. This is how many pixels are in the canvas.
The second size is the size the canvas is displayed. CSS determines the size the canvas is
displayed.

You can set the size of the canvas's drawingbuffer in 2 ways. One using HTML

```html
<canvas id="c" width="400" height="300"></canvas>
```

The other using JavaScript

```html
<canvas id="c"></canvas>
```

JavaScript

```js
const canvas = document.querySelector("#c");
canvas.width = 400;
canvas.height = 300;
```

As for setting a canvas's display size if you don't have any CSS that affects the canvas's display size
the display size will be the same size as its drawingbuffer. So in the 2 examples above the canvas's drawingbuffer is 400x300
and its display size is also 400x300.

Here's an example of a canvas whose drawingbuffer is 10x15 pixels that is displayed 400x300 pixels on the page

```html
<canvas id="c" width="10" height="15" style="width: 400px; height: 300px;"></canvas>
```

or for example like this

```html
<style>
#c {
  width: 400px;
  height: 300px;
}
</style>
<canvas id="c" width="10" height="15"></canvas>
```

If we draw a single pixel wide rotating line into that canvas we'll see something like this

{{{example url="../webgl-10x15-canvas-400x300-css.html" }}}

Why is it so blurry? Because the browser takes our 10x15 pixel canvas and stretches it to 400x300 pixels and
generally it filters it when it stretches it.

So, what do we do if, for example, we want the canvas to fill the window? Well, first we can get
the browser to stretch the canvas to fill the window with CSS. Example

    <html>
      <head>
        <style>
          /*  */
          html, body {
            height: 100%;
            margin: 0;
          }
          /* make the canvas fill its container */
          #c {
            width: 100%;
            height: 100%;
            display: block;
          }
        </style>
      </head>
      <body>
        <canvas id="c"></canvas>
      </body>
    </html>

Now we just need to make the drawingbuffer match whatever size the browser has stretched the canvas. 
This is unfortunately a complicated topic. Let's go over some different methods

## Use `clientWidth` and `clientHeight`

This is the easiest way.
`clientWidth` and `clientHeight` are properties every element in HTML has that tell us
the size of the element in CSS pixels. 

> Note: The client rect includes any CSS padding so if you're using `clientWidth`
and/or `clientHeight` it's best not to put any padding on your canvas element.

Using JavaScript we can check what size that element is being displayed and then adjust
its drawingbuffer size to match.

```js
function resizeCanvasToDisplaySize(canvas) {
  // Lookup the size the browser is displaying the canvas in CSS pixels.
  const displayWidth  = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;

  // Check if the canvas is not the same size.
  const needResize = canvas.width  !== displayWidth ||
                     canvas.height !== displayHeight;

  if (needResize) {
    // Make the canvas the same size
    canvas.width  = displayWidth;
    canvas.height = displayHeight;
  }

  return needResize;
}
```

Let's call this function just before we render
so it will always adjust the canvas to our desired size just before drawing.

```js
function drawScene() {
   resizeCanvasToDisplaySize(gl.canvas);

   ...
```

And here's that

{{{example url="../webgl-resize-canvas.html" }}}

Hey, something is wrong? Why is the line not covering the entire area?

The reason is when we resize the canvas we also need to call `gl.viewport` to set the viewport.
`gl.viewport` tells WebGL how to convert from clip space (-1 to +1) back to pixels and where to do
it within the canvas. When you first create the WebGL context WebGL will set the viewport to match the size
of the canvas but after that it's up to you to set it. If you change the size of the canvas
you need to tell WebGL a new viewport setting.

Let's change the code to handle this. On top of that, since the WebGL context has a
reference to the canvas let's pass that into resize.

    function drawScene() {
       resizeCanvasToDisplaySize(gl.canvas);

    +   gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
       ...

Now it's working.

{{{example url="../webgl-resize-canvas-viewport.html" }}}

Open that in a separate window, size the window, notice it always fills the window.

I can hear you asking, *why doesn't WebGL set the viewport for us automatically
when we change the size of the canvas?* The reason is it doesn't know how or why
you are using the viewport. You could be [rendering to a framebuffer](webgl-render-to-texture.html)
or doing something else that requires a different viewport size. WebGL has no
way of knowing your intent so it can't automatically set the viewport for you.

---

## Handling `devicePixelRatio` and Zoom

Why is that not the end of it? Well, This is where it gets complicated. 

The first thing to understand is that most sizes in the browser are in CSS pixel
units. This is an attempt to make the sizes device independent. So for example
at the top of this article we set the canvas's display size to 400x300 CSS
pixels. Depending on if the user has an HD-DPI display, or is zoomed in or
zoomed out, or has an OS zoom level set, how many actual pixels that becomes on
the monitor will be different.

`window.devicePixelRatio` will tell us in general, the ratio of CSS pixels
to actual pixels on your monitor. For example here's your browser's current setting

> <div>devicePixelRatio = <span data-diagram="dpr"></span></div>

If you're on a desktop or laptop try pressing <kbd>ctrl</kbd>+<kbd>+</kbd> and <kbd>ctrl</kbd>+<kbd>-</kbd> to zoom in and out (<kbd>⌘</kbd>+<kbd>+</kbd> and <kbd>⌘</kbd>+<kbd>-</kbd> on Mac). You should see the number change except in Safari.

So if we want the number of pixels in the canvas to match the number of pixels actually used to display it
the seemingly obvious solution would be to multiply `clientWidth` and `clientHeight` by the `devicePixelRatio` like this:

```js
function resizeCanvasToDisplaySize(canvas) {
  // Lookup the size the browser is displaying the canvas in CSS pixels.
-  const displayWidth  = canvas.clientWidth;
-  const displayHeight = canvas.clientHeight;
+  const dpr = window.devicePixelRatio;
+  const displayWidth  = Math.round(canvas.clientWidth * dpr);
+  const displayHeight = Math.round(canvas.clientHeight * dpr);

  // Check if the canvas is not the same size.
  const needResize = canvas.width  != displayWidth || 
                     canvas.height != displayHeight;

  if (needResize) {
    // Make the canvas the same size
    canvas.width  = displayWidth;
    canvas.height = displayHeight;
  }

  return needResize;
}
```

We need to call `Math.round` (or `Math.ceil`, or `Math.floor` or `| 0`) to get the number
to an integer because `canvas.width` and `canvas.height` are always in integers so
our comparison might fail if `devicePixelRatio` is not an integer which is common, especially
if the user's zooms.

> Note: Whether to use `Math.floor` or `Math.ceil` or `Math.round` is not defined by the HTML
spec. It's up to the browser. 🙄

In any case, this will **not** actually work. The new problem is that given a `devicePixelRatio` that is not 1.0
the CSS size the canvas needs to be to fill a given area might not be an integer value
but `clientWidth` and `clientHeight` are defined as integers. Let's say the window is
999 actual device pixels wide your devicePixelRatio = 2.0 and you ask for 100% size canvas.
There's no integer CSS size * 2.0 that = 999.

The next solution is to use
[`getBoundingClientRect()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect).
It returns a [`DOMRect`](https://developer.mozilla.org/en-US/docs/Web/API/DOMRect) 
that has a `width` and `height`. It's the same
client rect as represented by `clientWidth` and `clientHeight` but it is not required
to be an integer.

Below is a purple `<canvas>` that's set to `width: 100%` of its container. Zoom out a few times to 75% or 60%
and you may see its `clientWidth` and its `getBoundingClientRect().width` diverge. 

> <div data-diagram="getBoundingClientRect"></div>

On my machines I get these readings

```
Windows 10, zoom level 75%, Chrome
clientWidth: 700
getBoundingClientRect().width = 700.0000610351562

MacOS, zoom level 90%, Chrome
clientWidth: 700
getBoundingClientRect().width = 700.0000610351562

MacOS, zoom level -1, Safari (safari does not show the zoom level)
clientWidth: 700
getBoundingClientRect().width = 699.9999389648438

Firefox, both Windows and MacOS all zoom levels
clientWidth: 700
getBoundingClientRect().width = 700
```

Note: Firefox showed 700 in this particular setup but with enough various test I've
seen it give a non-integer result from `getBoundingClientRect` for example make the window
thin so that the 100% canvas is smaller than 700 and you might get a non-integer result
on Firefox.

So, given that we could try using `getBoundingClientRect`.

```js
function resizeCanvasToDisplaySize(canvas) {
  // Lookup the size the browser is displaying the canvas in CSS pixels.
  const dpr = window.devicePixelRatio;
-  const displayWidth  = Math.round(canvas.clientWidth * dpr);
-  const displayHeight = Math.round(canvas.clientHeight * dpr);
+  const {width, height} = canvas.getBoundingClientRect();
+  const displayWidth  = Math.round(width * dpr);
+  const displayHeight = Math.round(height * dpr);

  // Check if the canvas is not the same size.
  const needResize = canvas.width  != displayWidth || 
                     canvas.height != displayHeight;

  if (needResize) {
    // Make the canvas the same size
    canvas.width  = displayWidth;
    canvas.height = displayHeight;
  }

  return needResize;
}
```

So are we done? Unfortunately no. It turns out that `canvas.getBoundingClientRect()` can
not always return the exact correct size. The reason is complicated but it has to do with
the way the browser decides to draw things. Some parts are decided at the HTML level
and some parts are decided later at the "compositor" level (the part that actually draws).
`getBoundingClientRect()` happens at the HTML level but certain things happen after that
which could affect what size the canvas is actually drawn.

I think an example is the HTML part works in the abstract and the compositor
works in the concrete. So lets say you have a window that's 999 device pixels
wide and a devicePixelRatio of 2.0. You make two elements side by side that are
`width: 50%`. So HTML computes each one should be 499.5 device pixels. But when it
actually comes time to draw the compositor can't draw 499.5 pixels so one
element gets 499 and the other gets 500. Which one gets or loses a pixel is
undefined by any specs.

The solution the browser vendors came up with is to use the
[`ResizeObserver` API](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
and provide the actual size used via the `devicePixelContextBoxSize` property of
the entries it provides.
It returns the actual number of device pixels that were used. Note it's called the
`ContentBox` not the `ClientBox` which means it's the actual part of the
canvas element showing the *content* of the canvas so it doesn't include the padding like
the `clientWidth`, `clientHeight` and `getBoundingClientRect`, a nice benefit.

It's returned this way because the result is asynchronous. The "compositor" mentioned
above runs asynchronously from the page. It can figure out the size it's actually going to use and then send you that size *out of band*.

Unfortunately while the `ResizeObserver` is available in all modern browser the
`devicePixelContentBoxSize` is only available in Chrome/Edge so far. Here's how
to use it.

We create a `ResizeObserver` and we pass it a function to call anytime any elements
we're observing change size. In our case that's our canvas.

```js
const resizeObserver = new ResizeObserver(onResize);
resizeObserver.observe(canvas, {box: 'content-box'});
```

The code above creates a `ResizeObserver` that will call the function `onResize`
(below) when an element we observe changes size. We tell it to `observe` our
canvas. We tell it to observe when the `content-box` changes size. This is
important and a little confusing. We could ask it to tell us when the
`device-pixel-content-box` changes size but let's imagine we have a canvas that
is some percentage size of the window like the common 100% of our line example
above. In that case our canvas will always be the same number of device pixels
regardless of zoom level. The window hasn't changed size when we zoom so there's
still the same number of device pixels. On the otherhand the `content-box` will
change as we zoom because it's measured in CSS pixels and so as we zoom, more or
less CSS pixels fit in the number of device pixels.

If we don't care about the zoom level then we could just observe `device-pixel-content-box`.
It will throw an error if it's not supported so we'd do something like this

```js
const resizeObserver = new ResizeObserver(onResize);
try {
  // only call us of the number of device pixels changed
  resizeObserver.observe(canvas, {box: 'device-pixel-content-box'});
} catch (ex) {
  // device-pixel-content-box is not supported so fallback to this
  resizeObserver.observe(canvas, {box: 'content-box'});
}
```

The `onResize` function will be called with an array of [`ResizeObserverEntry`s](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserverEntry). One for each thing
that changed size. We'll record the size in a map so that we can handle more than
one element.

```js
// init with the default canvas size
const canvasToDisplaySizeMap = new Map([[canvas, [300, 150]]]);

function onResize(entries) {
  for (const entry of entries) {
    let width;
    let height;
    let dpr = window.devicePixelRatio;
    if (entry.devicePixelContentBoxSize) {
      // NOTE: Only this path gives the correct answer
      // The other paths are imperfect fallbacks
      // for browsers that don't provide anyway to do this
      width = entry.devicePixelContentBoxSize[0].inlineSize;
      height = entry.devicePixelContentBoxSize[0].blockSize;
      dpr = 1; // it's already in width and height
    } else if (entry.contentBoxSize) {
      if (entry.contentBoxSize[0]) {
        width = entry.contentBoxSize[0].inlineSize;
        height = entry.contentBoxSize[0].blockSize;
      } else {
        width = entry.contentBoxSize.inlineSize;
        height = entry.contentBoxSize.blockSize;
      }
    } else {
      width = entry.contentRect.width;
      height = entry.contentRect.height;
    }
    const displayWidth = Math.round(width * dpr);
    const displayHeight = Math.round(height * dpr);
    canvasToDisplaySizeMap.set(entry.target, [displayWidth, displayHeight]);
  }
}
```

That's kind of a mess. You can see the API shipped at least 3 different versions
before supporting `devicePixelContentBoxSize` 😂

Now we'll change our resize function to use this data

```js
function resizeCanvasToDisplaySize(canvas) {
-  // Lookup the size the browser is displaying the canvas in CSS pixels.
-  const dpr = window.devicePixelRatio;
-  const {width, height} = canvas.getBoundingClientRect();
-  const displayWidth  = Math.round(width * dpr);
-  const displayHeight = Math.round(height * dpr);
+  // Get the size the browser is displaying the canvas in device pixels.
+ const [displayWidth, displayHeight] = canvasToDisplaySizeMap.get(canvas);

  // Check if the canvas is not the same size.
  const needResize = canvas.width  != displayWidth || 
                     canvas.height != displayHeight;

  if (needResize) {
    // Make the canvas the same size
    canvas.width  = displayWidth;
    canvas.height = displayHeight;
  }

  return needResize;
}
```

Here's an example using this code

{{{example url="../webgl-resize-canvas-hd-dpi.html" }}}

It may be difficult to see any difference. If you have an HD-DPI display
like your smartphone or all Macs since 2019 or maybe a 4k monitor then this
line should be thinner than the line of the previous example.

Otherwise, if you zoom in (I suggest you open the example in a new window), as you zoom
in the line should stay the same resolution where as if you zoom in on the previous example
the line will get thicker and lower-resolution since it's not adjusting to the `devicePixelRatio`.

Just as a test here are all 3 methods above just using a simple canvas 2d.
To keep it simple it does not use WebGL. Instead it uses Canvas 2D and makes 2 patterns, a 2x2 pixel vertical black and white pattern and a 2x2 pixel horizontal black and white
pattern. It draws the horizontal pattern ▤ on the left and the vertical pattern ▥
on the right.

{{{example url="../webgl-resize-the-canvas-comparison.html"}}}

Resize this window, or better, open it in a new window and zoom in an out using
the keys mentioned above. At different zoom levels resize the window, and notice
only the bottom one works in all cases (in Chrome/Edge). Note the higher your
device's `devicePixelRatio` the harder it may be to see problems. What you
should see is an unvarying pattern on left and on the right. If you see harsh
patterns or you see differing darkness like a gradient then it's not working.
Since it will only work in Chrome/Edge you'll need to try it there to see it
work.

Also note, some OSes (MacOS) provide an OS level scaling option that is mostly
hidden from apps. In this case you'll see a slight pattern on the bottom example
(assuming your in Chrome/Edge) but it will be a regular pattern.

This brings up the issue that there is no good solution on the other browsers but, do you
need a real solution? The majority of WebGL apps do something like draw some things in 3D
with textures and or lighting on them. As such it's often not noticeable to either use
the top solution where we ignored `devicePixelRatio` or to use `clientWidth`, `clientHeight`
or `getBoundingClientRect()` * `devicePixelRatio` and not worry about it past that.

Further, blindly using `devicePixelRatio` can really slow down your performance.
On iPhoneX or iPhone11 <code>window.devicePixelRatio</code> is <code>3</code> which
means you'll be drawing 9 times as many pixels. On A Samsung Galaxy S8 that value is <code>4</code> which means you'd be drawing
16 times as many pixels. That can really slow down your program. In fact it's a common optimization in games to actually render
less pixels than are displayed and let the GPU scale them up. It really depends on what your needs are. If you're drawing
a graph for printing you might want to support HD-DPI. If you're making a game you might not or you might want to give the
user the option to turn support on or off if their system is not fast enough to draw so many pixels.

One other caveat is, at least in January 2021 the `round(getBoundingClientRect * devicePixelRatio)` works on most modern browsers **IF and ONLY IF** the canvas is the full
size of the window like the line example above. The exception is Safari where it doesn't work if the user's zoom level is not 100%.
Here's an example using the patterns

{{{example url="../webgl-resize-the-canvas-comparison-fullwindow.html"}}}

You'll notice if you zoom and resize *this page* it will fail with `getBoundingClientRect`.
This is because the canvas is not the full window, it's in an iframe. Open the example
in a separate window and it will work.

Which solution you use is up to you. For me, 99% of the time I don't use
`devicePixelRatio`. It makes my pages slow and except for a few graphics pros most
people won't notice a difference. On this site there are a few diagrams where it's
used it but majority of examples do not.

If you look at many WebGL programs they handle resizing or setting the size of the canvas in many different ways.
I think it's arguable the best way is to let the browser chose the size to display canvas with CSS and then looking up what size it chose and adjusting
the number of pixels in the canvas in response.
If you're curious <a href="webgl-anti-patterns.html">here are some of the reasons</a> I think the way described above is the preferable way.

<!-- just to shut up the build that this link used to exist
     and still exists in older translations -->
<a href="webgl-animation.html"></a>

<script type="module" src="resources/webgl-resizing-the-canvas.module.js"></script>

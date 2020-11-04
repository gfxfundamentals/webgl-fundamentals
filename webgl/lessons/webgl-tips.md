Title: WebGL Tips
Description: Small issues that might trip you up with WebGL
TOC: #

This article is a collection of issues you might run into
using WebGL that seemed too small to have their own article.

---

<a id="screenshot" data-toc="Taking a screenshot"></a>

# Taking A Screenshot of the Canvas

In the browser there are effectively 2 functions that will take a screenshot.
The old one 
[`canvas.toDataURL`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL)
and the new better one 
[`canvas.toBlob`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)

So you'd think it would be easy to take a screenshot by just adding some code like

```html
<canvas id="c"></canvas>
+<button id="screenshot" type="button">Save...</button>
```

```js
const elem = document.querySelector('#screenshot');
elem.addEventListener('click', () => {
  canvas.toBlob((blob) => {
    saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.png`);
  });
});

const saveBlob = (function() {
  const a = document.createElement('a');
  document.body.appendChild(a);
  a.style.display = 'none';
  return function saveData(blob, fileName) {
     const url = window.URL.createObjectURL(blob);
     a.href = url;
     a.download = fileName;
     a.click();
  };
}());
```

Here's the example from [the article on animation](webgl-animation.html)
with the code above added and some CSS to place the button

{{{example url="../webgl-tips-screenshot-bad.html"}}}

When I tried it I got this screenshot

<div class="webgl_center"><img src="resources/screencapture-398x298.png"></div>

Yes, it's just a blank image.

It's possible it worked for you depending on your browser/OS but in general
it's not likely to work.

The issue is that for performance and compatibility reasons, by default the browser
will clear a WebGL canvas's drawing buffer after you've drawn to it.

There are 3 solutions.

1.  call your rendering code just before capturing

    The code we used as a `drawScene` function. It would be best to make that
    code not change any state and then we could call it to render for capturing.

    ```js
    elem.addEventListener('click', () => {
    +  drawScene();
      canvas.toBlob((blob) => {
        saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.png`);
      });
    });
    ```

2.  call the capturing code in our render loop

    In this case we'd just set a flag that we want to capture and then
    in the rendering loop actually do the capture

    ```js
    let needCapture = false;
    elem.addEventListener('click', () => {
       needCapture = true;
    });
    ```

    and then in our render loop, which is current implemented in `drawScene`,
    somewhere after everything has been drawn

    ```js
    function drawScene(time) {
      ...

    +  if (needCapture) {
    +    needCapture = false;
    +    canvas.toBlob((blob) => {
    +      saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.png`);
    +    });
    +  }

      ...
    }
    ```

3. Set `preserveDrawingBuffer: true` when creating the WebGL context

    ```js
    const gl = someCanvas.getContext('webgl', {preserveDrawingBuffer: true});
    ```

    This makes webgl not clear the canvas after compositing the canvas with the
    rest of the page but prevents certain *possible* optimizations.

I'd pick #1 above. For this particular example first I'd separate the parts of
the code that update state from the parts that draw.

```js
  var then = 0;

-  requestAnimationFrame(drawScene);
+  requestAnimationFrame(renderLoop);

+  function renderLoop(now) {
+    // Convert to seconds
+    now *= 0.001;
+    // Subtract the previous time from the current time
+    var deltaTime = now - then;
+    // Remember the current time for the next frame.
+    then = now;
+
+    // Every frame increase the rotation a little.
+    rotation[1] += rotationSpeed * deltaTime;
+
+    drawScene();
+
+    // Call renderLoop again next frame
+    requestAnimationFrame(renderLoop);
+  }

  // Draw the scene.
+  function drawScene() {
- function drawScene(now) {
-    // Convert to seconds
-    now *= 0.001;
-    // Subtract the previous time from the current time
-    var deltaTime = now - then;
-    // Remember the current time for the next frame.
-    then = now;
-
-    // Every frame increase the rotation a little.
-    rotation[1] += rotationSpeed * deltaTime;

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    ...

-    // Call drawScene again next frame
-    requestAnimationFrame(drawScene);
  }
```

and now we can just call `drawScene` before capturing

```js
elem.addEventListener('click', () => {
+  drawScene();
  canvas.toBlob((blob) => {
    saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.png`);
  });
});
```

And now it should work.

{{{example url="../webgl-tips-screenshot-good.html" }}}

If you actually check the captured image you'll see the background is transparent.
See [this article](webgl-and-alpha.html) for a few details.

---

<a id="preservedrawingbuffer" data-toc="Prevent the Canvas Being Cleared"></a>

# Preventing the canvas being cleared

Let's say you wanted to let the user paint with an animated
object. You need to pass in `preserveDrawingBuffer: true` when
you create the webgl context. This prevents the browser from
clearing the canvas. 

Taking the last example from [the article on animation](webgl-animation.html)

```js
var canvas = document.querySelector("#canvas");
-var gl = canvas.getContext("webgl");
+var gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
```

and change the call to `gl.clear` so it only clears the depth buffer

```js
-// Clear the canvas AND the depth buffer.
-gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
+// Clear the depth buffer.
+gl.clear(gl.DEPTH_BUFFER_BIT);
```

{{{example url="../webgl-tips-preservedrawingbuffer.html" }}}

Note that if you were serious about making a drawing program this would not be a
solution as the browser will still clear the canvas anytime we change its
resolution. We're changing is resolution based on its display size. Its display
size changes when the window changes size. That can include when the user downloads
a file, even in another tab, and the browser adds a status bar. It also includes when
the user turns their phone and the browser switches from portrait to landscape.

If you really wanted to make a drawing program you'd
[render to a texture](webgl-render-to-texture.html).

---

<a id="tabindex" data-toc="Get Keyboard Input From a Canvas"></a>

# Getting Keyboard Input

If you're making a full page / full screen webgl app then you can do whatever
you want but often you'd like some canvas to just be a part of a larger page and
you'd like it so if the user clicks on the canvas the canvas gets keyboard input.
A canvas can't normally get keyboard input though. To fix that set the
[`tabindex`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/tabIndex)
of the canvas to 0 or more. Eg.

```html
<canvas tabindex="0"></canvas>
```

This ends up causing a new issue though. Anything that has a `tabindex` set
will get highlighted when it has the focus. To fix that set its focus CSS outline
to none

```css
canvas:focus {
  outline:none;
}
```

To demonstrate here are 3 canvases 

```html
<canvas id="c1"></canvas>
<canvas id="c2" tabindex="0"></canvas>
<canvas id="c3" tabindex="1"></canvas>
```

and some css just for the last canvas 

```css
#c3:focus {
    outline: none;
}
```

Let's attach the same event listeners to all of them

```js
document.querySelectorAll('canvas').forEach((canvas) => {
  const ctx = canvas.getContext('2d');

  function draw(str) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(str, canvas.width / 2, canvas.height / 2);
  }
  draw(canvas.id);

  canvas.addEventListener('focus', () => {
    draw('has focus press a key');
  });

  canvas.addEventListener('blur', () => {
    draw('lost focus');
  });

  canvas.addEventListener('keydown', (e) => {
    draw(`keyCode: ${e.keyCode}`);
  });
});
```

Notice you can't get the first canvas to accept keyboard input.
The second canvas you can but it gets highlighted. The 3rd
canvas has both solutions applied.

{{{example url="../webgl-tips-tabindex.html"}}}

---

<a id="html-background" data-toc="Use WebGL as Background in HTML"></a>

# Making your background a WebGL animation

A common question is how to make a WebGL animation be the background of
a webpage.

There are 2 obvious ways.

* Set the canvas CSS `position` to `fixed` as in

```css
#canvas {
 position: fixed;
 left: 0;
 top: 0;
 z-index: -1;
 ...
}
```

and set `z-index` to -1.

A small disadvantage to this solution is your JavaScript must integrate with the page
and if you have a complex page then you need to make sure none of the JavaScript in your
webgl code conflicts with the JavaScript doing other things in the page.

* Use an `iframe`

This is the solution used on [the front page of this site](/).

In your webpage just insert an iframe, for example

```html
<iframe id="background" src="background.html"></iframe>
<div>
  Your content goes here.
</div>
```

Then style the iframe to fill the window and be in the background
which is basically the same code as we used above for the canvas
except we also need to set `border` to `none` since iframes have
a border by default.

```css
#background {
    position: fixed;
    width: 100vw;
    height: 100vh;
    left: 0;
    top: 0;
    z-index: -1;
    border: none;
    pointer-events: none;
}
```

{{{example url="../webgl-tips-html-background.html"}}}

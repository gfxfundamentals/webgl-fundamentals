Title: WebGL Anti-Patterns
Description: What not to do in WebGL, why not to do it, and what to do instead
TOC: Anti-Patterns


This is a list of anti patterns for WebGL. Anti patterns are things you should avoid doing

1.  <a id="viewportwidth"></a>Putting `viewportWidth` and `viewportHeight` on the `WebGLRenderingContext`

    Some code adds properties for their viewport width and height
    and sticks them on the `WebGLRenderingContext` something like this

    <pre class="prettyprint">
    gl = canvas.getContext("webgl");
    gl.viewportWidth = canvas.width;    // BAD!!!
    gl.viewportHeight = canvas.height;  // BAD!!!
    </pre>

    Then later they might do something like this

    <pre class="prettyprint">
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    </pre>

    **Why it's Bad:**

    It's objectively bad because you now have 2 properties that need to be updated
    anytime you change the size of the canvas. For example if you change the size
    of the canvas when the user resizes the window `gl.viewportWidth` & `gl.viewportHeight`
    will be wrong unless you set them again.

    It's subjectively bad because any new WebGL programmer will glance at your code
    and likely think `gl.viewportWidth` and `gl.viewportHeight` are part of the WebGL
    spec, confusing them for months.

    **What to do instead:**

    Why make more work for yourself? The WebGL context has its canvas available
    and that has a size.

    <pre class="prettyprint">
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    </pre>

    The context also has its width and height directly on it.

    <pre class="prettyprint">
    // When you need to set the viewport to match the size of the canvas's
    // drawingBuffer this will always be correct
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    </pre>

    Even better it will handle extreme cases whereas using `gl.canvas.width`
    and `gl.canvas.height` will not. [As for why see here](#drawingbuffer).

2.  <a id="canvaswidth"></a>Using `canvas.width` and `canvas.height` for aspect ratio

    Often code uses `canvas.width` and `canvas.height` for aspect ratio like this

    <pre class="prettyprint">
    const aspect = canvas.width / canvas.height;
    perspective(fieldOfView, aspect, zNear, zFar);
    </pre>

    **Why it's Bad:**

    The width and height of the canvas have nothing to do with the size the canvas is
    displayed. CSS controls the size the canvas is displayed.

    **What to do instead:**

    Use `canvas.clientWidth` and `canvas.clientHeight`. Those values tell you what
    size your canvas is actually being displayed on the screen. Using those values
    you'll always get the correct aspect ratio regardless of your CSS settings.

    <pre class="prettyprint">
    const aspect = canvas.clientWidth / canvas.clientHeight;
    perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
    </pre>

    Here are examples of a canvas who's drawingbuffers are the same size (`width="400" height="300"`)
    but using CSS we've told the browser to display the canvas a different size.
    Notice the samples both display the 'F' in the correct aspect ratio.

    {{{diagram url="../webgl-canvas-clientwidth-clientheight.html" width="150" height="200" }}}
    <p></p>
    {{{diagram url="../webgl-canvas-clientwidth-clientheight.html" width="400" height="150" }}}

    If we had used `canvas.width` and `canvas.height` that would not be true.

    {{{diagram url="../webgl-canvas-width-height.html" width="150" height="200" }}}
    <p></p>
    {{{diagram url="../webgl-canvas-width-height.html" width="400" height="150" }}}

3.  <a id="innerwidth"></a>Using `window.innerWidth` and `window.innerHeight` to compute anything

    Many WebGL programs use `window.innerWidth` and `window.innerHeight` in many places.
    For example:

    <pre class="prettyprint">
    canvas.width = window.innerWidth;                    // BAD!!
    canvas.height = window.innerHeight;                  // BAD!!
    </pre>

    **Why it's Bad:**

    It's not portable. Yes, it can work for WebGL pages where you want to make the canvas
    fill the screen. The problem comes when you don't. Maybe you decide to make an article
    like these tutorials where your canvas is just some small diagram in a larger page.
    Or maybe you need some property editor on the side or a score for a game. Sure you can fix your code
    to handle those cases but why not just write it so it works in those cases in the first place?
    Then you won't have to go change any code when you copy it to a new project or use an old
    project in a new way.

    **What to do instead:**

    Instead of fighting the Web platform, use the Web platform as it was designed to be used.
    Use CSS and `clientWidth` and `clientHeight`.

    <pre class="prettyprint">
    var width = gl.canvas.clientWidth;
    var height = gl.canvas.clientHeight;

    gl.canvas.width = width;
    gl.canvas.height = height;
    </pre>

    Here are 9 cases. They all use exactly the same code. Notice that none of them
    reference `window.innerWidth` nor `window.innerHeight`.

    <a href="../webgl-same-code-canvas-fullscreen.html" target="_blank">A page with nothing but a canvas using CSS to make it fullscreen</a>

    <a href="../webgl-same-code-canvas-partscreen.html" target="_blank">A page with a canvas set to using 70% width so there is room for editor controls</a>

    <a href="../webgl-same-code-canvas-embedded.html" target="_blank">A page with a canvas embedded in a paragraph</a>

    <a href="../webgl-same-code-canvas-embedded-border-box.html" target="_blank">A page with a canvas embedded in a paragraph using <code>box-sizing: border-box;</code></a>

    <code>box-sizing: border-box;</code> makes borders and padding take space from the element they're defined on rather than outside it. In other words, in
    normal box-sizing mode a 400x300 pixel element with 15 pixel border has a 400x300 pixel content space surrounded by a 15 pixel border making its total size
    430x330 pixels. In box-sizing: border-box mode the border goes on the inside so that same element would stay 400x300 pixels, the content would end up
    being 370x270. This is yet another reason why using `clientWidth` and `clientHeight` is so important. If you set the border to say `1em` you'd have no
    way of knowing what size your canvas will turn out. It would be different with different fonts on different machines or different browsers.

    <a href="../webgl-same-code-container-fullscreen.html" target="_blank">A page with nothing but a container using CSS to make it fullscreen into which the code will insert a canvas</a>

    <a href="../webgl-same-code-container-partscreen.html" target="_blank">A page with a container set to using 70% width so there is room for editor controls into which the code will insert a canvas</a>

    <a href="../webgl-same-code-container-embedded.html" target="_blank">A page with a container embedded in a paragraph into which the code will insert a canvas</a>

    <a href="../webgl-same-code-container-embedded-border-box.html" target="_blank">A page with a container embedded in a paragraph using <code>box-sizing: border-box;</code> into which the code will insert a canvas</a>

    <a href="../webgl-same-code-body-only-fullscreen.html" target="_blank">A page with no elements with CSS setup to make it fullscreen into which the code will insert a canvas</a>

    Again, the point is, if you embrace the web and write your code using the techniques above you won't have to change any code when you run into different use cases.

4.  <a id="resize"></a>Using the `'resize'` event to change the size of your canvas.

    Some apps check for the window `'resize'` event like this to resize their canvas.

    <pre class="prettyprint">
    window.addEventListener('resize', resizeTheCanvas);
    </pre>

    or this

    <pre class="prettyprint">
    window.onresize = resizeTheCanvas;
    </pre>

    **Why it's Bad:**

    It's not bad per se, rather, for *most* WebGL programs it fits less use cases.
    Specifically `'resize'` only works when the window is resized. It doesn't work
    if the canvas is resized for some other reason. For example let's say you're making
    a 3D editor. You have your canvas on the left and your settings on the right. You've
    made it so there's a draggable bar separating the 2 parts and you can drag that bar
    to make the settings area larger or smaller. In this case you won't get any `'resize'`
    events. Similarly if you've got a page where other content gets added or removed and
    the canvas changes size as the browser re-lays out the page you won't get a resize
    event.

    **What to do instead:**

    Like many of the solutions to anti-patterns above there's a way to write your code
    so it just works for most cases. For WebGL apps that constantly draw every frame
    the solution is to check if you need to resize every time you draw like this

    <pre class="prettyprint">
    function resizeCanvasToDisplaySize() {
      var width = gl.canvas.clientWidth;
      var height = gl.canvas.clientHeight;
      if (gl.canvas.width != width ||
          gl.canvas.height != height) {
         gl.canvas.width = width;
         gl.canvas.height = height;
      }
    }

    function render() {
       resizeCanvasToDisplaySize();
       drawStuff();
       requestAnimationFrame(render);
    }
    render();
    </pre>

    Now in any of those cases your canvas will scale to the right size. No need to
    change any code for different cases. For example using the same code from #3 above
    here's an editor with a sizable editing area.

    {{{example url="../webgl-same-code-resize.html" }}}

    There would be no resize events for this case nor any other where the canvas gets resized
    based on the size of other dynamic elements on the page.

    For WebGL apps that don't re-draw every frame the code above is still correct, you'll just need
    to trigger a re-draw in every case where the canvas can possibly get resized. One easy way to use a `ResizeObserver`

    <pre class="prettyprint">
    const resizeObserver = new ResizeObserver(render);
    resizeObserver.observe(gl.canvas, {box: 'content-box'});
    </pre>

5.  <a id="properties"></a>Adding properties to `WebGLObject`s

    `WebGLObject`s are the various types of resources in WebGL like a `WebGLBuffer`
    or `WebGLTexture`. Some apps add properties to those objects. For example code like this:

    <pre class="prettyprint">
    var buffer = gl.createBuffer();
    buffer.itemSize = 3;        // BAD!!
    buffer.numComponents = 75;  // BAD!!

    var program = gl.createProgram();
    ...
    program.u_matrixLoc = gl.getUniformLocation(program, "u_matrix");  // BAD!!
    </pre>

    **Why it's Bad:**

    The reason this is bad is that WebGL can "lose the context". This can happen for any
    reason but the most common reason is if the browser decides too many GPU resources are being used
    it might intentionally lose the context on some `WebGLRenderingContext`s to free up space.
    WebGL programs that want to always work have to handle this. Google Maps handles this for example.

    The problem with the code above is that when the context is lost the WebGL creation functions like
    `gl.createBuffer()` above will return `null`. That effectively makes the code this

    <pre class="prettyprint">
    var buffer = null;
    buffer.itemSize = 3;        // ERROR!
    buffer.numComponents = 75;  // ERROR!
    </pre>

    That will likely kill your app with an error like

    <pre class="prettyprint">
    TypeError: Cannot set property 'itemSize' of null
    </pre>

    While many apps don't care if they die when the context is lost it seems like a bad idea
    to write code that will have to be fixed later if the developers ever decide to update their
    app to handle context lost events.

    **What to do instead:**

    If you want to keep `WebGLObjects` and some info about them together one way would be
    to use JavaScript objects. For example:

    <pre class="prettyprint">
    var bufferInfo = {
      id: gl.createBuffer(),
      itemSize: 3,
      numComponents: 75,
    };

    var programInfo = {
      id: program,
      u_matrixLoc: gl.getUniformLocation(program, "u_matrix"),
    };
    </pre>

    Personally I'd suggest <a href="webgl-less-code-more-fun.html">using a few simple helpers that make writing WebGL
    much simpler</a>.

Those are a few of what I consider WebGL Anti-Patterns in code I've seen around the net.
Hopefully I've made the case why to avoid them and given solutions that are easy and useful.

<div class="webgl_bottombar"><a id="drawingbuffer"></a><h3>What is drawingBufferWidth and drawingBufferHeight?</h3>
<p>
GPUs have a limit on how big a rectangle of pixels (texture, renderbuffer) they can support. Often this
size is the next power of 2 larger than whatever a common monitor resolution was at the time the GPU was
made. For example if the GPU was designed to support 1280x1024 screens it might have a size limit of 2048.
If it was designed for 2560x1600 screens it might have a limit of 4096.
</p>
<p>
That seems reasonable but what happens if you have multiple monitors? Let's say I have a GPU with a limit
of 2048 but I have two 1920x1080 monitors. The user opens a browser window with a WebGL page, they then
stretch that window across both monitors. Your code tries to set the <code>canvas.width</code> to
<code>canvas.clientWidth</code> which in this case is 3840. What should happen?
</p>
<p>Off the top of my head there are only 3 options</p>
<ol>
<li>
 <p>Throw an exception.</p>
 <p>That seems bad. Most web apps won't be checking for it and the app will crash.
 If the app had user data in it the user just lost their data</p>
</li>
<li>
 <p>Limit the size of the canvas to the GPUs limit</p>
 <p>The problem with this solution is it will also
 likely lead to a crash or possibly a messed up webpage because the code expects the canvas to be the size
 they requested and they expect other parts of the UI and elements on the page to be in the proper places.</p>
</li>
<li>
 <p>Let the canvas be the size the user requested but make its drawingbuffer the limit</p>
 <p>This is the
 solution WebGL uses. If your code is written correctly the only thing the user might notice is the image in
 the canvas is being scaled slightly. Otherwise it just works. In the worst case most WebGL programs that
 don't do the right thing will just have a slightly off display but if the user sizes the window back down
 things will return to normal.</p>
</li>
</ol>
<p>Most people don't have multiple monitors so this issue rarely comes up. Or at least it used to.
Chrome and Safari, at least as of January 2015, had a hard coded limit on canvas size of 4096. Apple's
5k iMac is past that limit. Lots of WebGL apps were having strange displays because of this.
Similarly many people have started using WebGL with multiple monitors for installation work and have
been hitting this limit.</p>
<p>
So, if you want to handle these cases use <code>gl.drawingBufferWidth</code> and <code>gl.drawingBufferHeight</code> as
shown in #1 above. For most apps if you follow the best practices above things will just work. Be aware
though if you are doing calculations that need to know the actual size of the drawingbuffer you need
to take that into account. Examples off the top of my head, [picking](webgl-picking.html), in other words converting from
mouse coordinates into canvas pixel coordinates. Another would be any kind of post processing
effects that want to know the actual size of the drawingbuffer.
</p>
</div>


Title: WebGL 反面模式
Description: WebGL中不应该这么做，为什么，应该这么做。
TOC: WebGL 错误模式


这里是一些WebGL的反面模式，反面模式就是一些你应该避免的做法

1.  将 `viewportWidth` 和 `viewportHeight` 属性放在 `WebGLRenderingContext` 对象上。

    有些代码添加了视图宽度和高度属性，并将它附加在 `WebGLRenderingContext` 上，像这样

    <pre class="prettyprint">
    gl = canvas.getContext("webgl");
    gl.viewportWidth = canvas.width;    // 不好!!!
    gl.viewportHeight = canvas.height;  // 不好!!!
    </pre>

    然后可以做这样的操作

    <pre class="prettyprint">
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    </pre>

    **为什么这样不好:**

    主要的错误就是多了两个属性，并且需要在画布尺寸改变的时候更新这些属性。
    假如你将画布的宽高设置为某值，但当用户改变窗口大小时 `gl.viewportWidth` & `gl.viewportHeight`
    就不是正确的值，你就需要重新设置它们。

    其次是假如一些WebGL新手看到你的代码，会把 `gl.viewportWidth` 和 `gl.viewportHeight`
    当作WebGL规范的一部分，会给他们带来长时间影响或困惑。

    **应该怎么做:**

    为什么自己给自己找麻烦？WebGL上下文有它的宽和高，直接使用就行。

    <pre class="prettyprint">
    // 当你需要保持视图和画布的 drawingBuffer 大小一致，
    // 这样做永远都是对的
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    </pre>

    甚至能解决使用 `gl.canvas.width` 和 `gl.canvas.height` 时无法解决的情况。
    [具体原因看这里](#drawingbuffer)。

2.  使用 `canvas.width` 和 `canvas.height` 计算长宽比

    经常有代码使用 `canvas.width` 和 `canvas.height` 计算长宽比，像这样 

    <pre class="prettyprint">
    var aspect = canvas.width / canvas.height;
    perspective(fieldOfView, aspect, zNear, zFar);
    </pre>

    **为什么这样不好:**

    画布的宽和高属性与画布的显示尺寸无关，CSS控制画布的显示尺寸。

    **应该怎么做:**

    使用 `canvas.clientWidth` 和 `canvas.clientHeight`，这些值可以告诉你画布显示在屏幕上的实际尺寸。
    这样就可以不用关心CSS设置，得到正确的长宽比。

    <pre class="prettyprint">
    var aspect = canvas.clientWidth / canvas.clientHeight;
    perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
    </pre>

    这有一些示例，使用大小相同(`width="400" height="300"`)的画布，
    但是用CSS告诉浏览器显示不同的尺寸，注意示例中的所有 'F' 都有正确的长宽比。

    {{{diagram url="../webgl-canvas-clientwidth-clientheight.html" width="150" height="200" }}}
    <p></p>
    {{{diagram url="../webgl-canvas-clientwidth-clientheight.html" width="400" height="150" }}}

    如果我们使用 `canvas.width` 和 `canvas.height`，结果就不是正确的了。

    {{{diagram url="../webgl-canvas-width-height.html" width="150" height="200" }}}
    <p></p>
    {{{diagram url="../webgl-canvas-width-height.html" width="400" height="150" }}}

3.  使用 `window.innerWidth` 和 `window.innerHeight`计算任何东西

    大多数WebGL应用在任何地方都使用 `window.innerWidth` 和 `window.innerHeight`。
    例如：

    <pre class="prettyprint">
    canvas.width = window.innerWidth;                    // 不好!!
    canvas.height = window.hinnerHeight;                 // 不好!!
    </pre>

    **为什么这样不好:**

    这样不灵活。是的，它可以在需要的时候将画布填满窗口，问题是如果你不想这么做了，
    也许你想在一个文章像这篇教程一样，加入一个画布当作图表展示。或者你可能需要一个侧边的编辑器，计分板之类的布局。
    当然你可以修改代码解决应对这些情况，但是为什么不在一开始就让它适应这些情况？
    这样就不需要在新项目中修改所有的相关代码。

    **应该怎么做:**

    使用Web平台而不是对抗Web平台，它有自己的设计模式。
    使用CSS和 `clientWidth` 和 `clientHeight`。

    <pre class="prettyprint">
    var width = gl.canvas.clientWidth;
    var height = gl.canvas.clientHeight;

    gl.canvas.width = width;
    gl.canvas.height = height;
    </pre>

    这有 9 个例子，都使用相同的代码，注意它们中没有一个使用了 `window.innerWidth` 或 `window.innerHeight`。

    <a href="../webgl-same-code-canvas-fullscreen.html" target="_blank">使用CSS让一个画布全屏</a>

    <a href="../webgl-same-code-canvas-partscreen.html" target="_blank">使画布宽度为 70%，给编辑器留下空间</a>

    <a href="../webgl-same-code-canvas-embedded.html" target="_blank">将画布嵌入到段落中</a>

    <a href="../webgl-same-code-canvas-embedded-border-box.html" target="_blank">使用<code>box-sizing: border-box;</code>将画布嵌入到段落中</a>

    <code>box-sizing: border-box;</code>将边框和内边距算入元素，而不是算在外面。换句话说，普通的盒模型定义一个 400x300 像素的元素，
    边框为 15 像素，实际内容部分为 400x300 像素，并且外边有一个 15 像素宽的边框，这样总共就是 430x330 像素。在 box-sizing: border-box 模式下，
    边框算在内部，所以内容部分就为 370x270 像素，这也是使用 `clientWidth` 和 `clientHeight` 的另一个重要原因。如果设置边框为 `1em`，
    你就没办法知道画布的最终尺寸，它在不同的浏览器和字体下都不同。

    <a href="../webgl-same-code-container-fullscreen.html" target="_blank">使用CSS控制容器全屏，并使用代码插入一个画布到容器中</a>

    <a href="../webgl-same-code-container-partscreen.html" target="_blank">使用一个宽度为 70% 的容器，并使用代码插入一个画布到容器中</a>

    <a href="../webgl-same-code-container-embedded.html" target="_blank">在段落中嵌入一个容器，并使用代码插入一个画布到容器中</a>

    <a href="../webgl-same-code-container-embedded-border-box.html" target="_blank">使用 <code>box-sizing: border-box;</code>在段落中嵌入一个容器，并使用代码插入一个画布到容器中</a>

    <a href="../webgl-same-code-body-only-fullscreen.html" target="_blank">一个页面使用CSS设置为全屏，并使用代码插入一个画布到页面中</a>

    重点是，如果你拥抱Web技术并使用上面的技巧，就可以在多种情况中不需要改变代码。

4.  使用 `'resize'` 事件改变画布的大小

    有些应用监听窗口的 `'resize'` 事件，像这样去重置画布大小。

    <pre class="prettyprint">
    window.addEventListener('resize', resizeTheCanvas);
    </pre>

    或这样

    <pre class="prettyprint">
    window.onresize = resizeTheCanvas;
    </pre>

    **为什么这样不好:**

    这样本身没什么问题，然而，对于**大多数**WebGL应用，它适用的情况比较少。
    尤其是 `'resize'` 只有在窗口重置大小的时候才能触发。在其他情况下画布改变大小就不管用了，
    例如假设要制作一个三维编辑器，画布在左侧设置在右侧，你使用了一个拖动条可以改变两个部分的大小，
    在这种情况下你不会得到任何 `'resize'` 事件，相似的，如果一个页面中添加和移除一些内容，
    你也不会得到重置大小事件。

    **应该怎么做:**

    像大多数其他反面模式一样，可以用一种更通用的方式应对多种情况。
    对于WebGL应用则需要在绘制每一帧之前检查是否需要重置画布大小，
    像这样

    <pre class="prettyprint">
    function resize() {
      var width = gl.canvas.clientWidth;
      var height = gl.canvas.clientHeight;
      if (gl.canvas.width != width ||
          gl.canvas.height != height) {
         gl.canvas.width = width;
         gl.canvas.height = height;
      }
    }

    function render() {
       resize();
       drawStuff();
       requestAnimationFrame(render);
    }
    render();
    </pre>

    现在在这些情况下你都可以得到正确地尺寸，不需要修改任何代码。
    例如使用上方 #3 的方法，制作一个可修改大小的编辑区。

    {{{example url="../webgl-same-code-resize.html" }}}

    这里没有重置大小事件或者其他画布重置大小触发的事件，只需要基于页面元素的大小动态改变尺寸。

    对于不需要持续绘制的WebGL应用，只需要在画布可能改变大小的地方触发重绘。
    一种简单的方式是使用 requestAnimationFrame 循环，像这样

    <pre class="prettyprint">
    function resize() {
      var width = gl.canvas.clientWidth;
      var height = gl.canvas.clientHeight;
      if (gl.canvas.width != width ||
          gl.canvas.height != height) {
         gl.canvas.width = width;
         gl.canvas.height = height;
         return true;
      }
      return false;
    }

    var needToRender = true;  // 至少绘制一次
    function checkRender() {
       if (resize() || needToRender) {
         needToRender = false;
         drawStuff();
       }
       requestAnimationFrame(checkRender);
    }
    checkRender();
    </pre>

    这样每当 `needToRender` 为true时就会重置画布大小。
    这样在不需要持续绘制的应用中，就能处理画布问题。只需要在场景需要重新绘制时设置 `needToRender` 为true。

5.  给 `WebGLObject` 添加属性

    `WebGLObject` 是WebGL资源中的多种类型，比如 `WebGLBuffer` 或 `WebGLTexture`。
    一些应用为这些属性对象添加属性，例如像这样：

    <pre class="prettyprint">
    var buffer = gl.createBuffer();
    buffer.itemSize = 3;        // 不好!!
    buffer.numComponents = 75;  // 不好!!

    var program = gl.createProgram();
    ...
    program.u_matrixLoc = gl.getUniformLocation(program, "u_matrix");  // 不好!!
    </pre>

    **为什么这样不好:**

    原因是WebGL可能“丢失上下文”，这样在大多数情况下没问题，但假如浏览器发现太多GPU资源被使用时，
    可能会故意丢失`WebGLRenderingContext`的上下文用来释放一些空间，
    WebGL应用需要处理这样情况，比如 Google 地图。

    上方代码的问题是当上下文丢失，WebGL创建方法比如 `gl.createBuffer()` 会返回 `null`。
    等于让代码变成这样

    <pre class="prettyprint">
    var buffer = null;
    buffer.itemSize = 3;        // 错误!
    buffer.numComponents = 75;  // 错误!
    </pre>

    这样错误就会终止你的应用，像这样

    <pre class="prettyprint">
    TypeError: Cannot set property 'itemSize' of null
    </pre>

    尽管很多应用不关心丢失上下文后是否会中断，但在后续更新中才想到解决这个问题似乎就不是那么好了。

    **应该怎么做:**

    如果你想让 `WebGLObjects` 和一些相关信息关联，应该使用 JavaScript 对象，例如：

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

    个人建议<a href="webgl-less-code-more-fun.html">使用一些简单的辅助方法让编写WebGL更简单</a>。

这些是我想到的一些WebGL的反面模式，希望我的例子能够解释清楚为什么要避免以及如何解决。

<div class="webgl_bottombar"><a id="drawingbuffer"></a><h3>drawingBufferWidth 和 drawingBufferHeight 是什么？</h3>
<p>
GPU对矩形像素值(纹理, renderbuffer)的支持有限制。通常这个大小是GPU生产时常用显示器分辨率的下一个2的整数次幂。
假如一个GPU设计用于 1280x1024 的屏幕，那么它的限制可能就是 2048 像素。
如果设计用于 2560x1600 的屏幕，限制可能是 4096 像素。
</p><p>
这样似乎很合理，但是如果你有多个显示器怎么办？假设我们有一个限制为 2048 的GPU，但是有两个 1920x1080 的显示器。
你的代码想要设置<code>canvas.width</code>为<code>canvas.width</code>也就是 3840，会发生什么？</p>
<p>我想到的只有三种情况</p>
<ol>
<li>
 <p>抛出异常</p>
 <p>这似乎很不好，大多数网页应用不会检查这个并且会崩溃。如果应用中有用户数据，用户就会丢失他们的数据。</p>
</li>
<li>
 <p>限制画布大小为GPU的限制大小</p>
 <p>这种情况可能也会导致崩溃或者把网页搞得混乱，因为代码期望画布大小为请求的大小，并且对其他UI元素做了对应调整。
</p>
</li>
<li>
 <p>让画布的大小成为用户请求的大小但drawingbuffer为限制大小</p>
 <p>
 这就是WebGL使用的方式，如果你的代码编写正确，用户只会注意到画布中的图像被明显缩放。
 不然就是不崩溃，只有用户将它放在一个窗口后才会显示正确的内容。</p>
</li>
</ol>
<p>
大多数用户不使用多个显示器，所以这个问题很少出现。至少在Chrome和Safari上，2015年一月之后，
将画布尺寸硬编码限制为 4096。苹果的 5K iMac 受到了这个限制。大多数WebGL应用因为这个原因出现奇怪的显示结果。
同样的很多开始学习WebGL的人，在使用多个显示器时会触发这个限制。</p>
<p>
所以，如果你想处理这些情况就像 #1 一样使用<code>gl.drawingBufferWidth</code> 和 <code>gl.drawingBufferHeight</code>。
对于大多数应用使用上方的设置就没什么问题。要注意的是如果你需要计算一些东西的话，就要通过这个知道drawingbuffer的实际尺寸，
并将它带入计算。例如选择物体，换句话说从鼠标坐标转换到画布像素坐标。另一种就是任何一种需要知道drawingbuffer实际大小的后处理效果。
</p>
</div>







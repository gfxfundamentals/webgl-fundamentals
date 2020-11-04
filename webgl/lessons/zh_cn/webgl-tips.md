Title: WebGL 小技巧
Description: WebGL 中可能绊倒你的小问题
TOC: #

这篇文章是一些在使用 WebGL 过程中可能遇到的小问题合集。

---

<a id="screenshot" data-toc="截屏"></a>

# 从画布中截屏

在浏览器中，有 2 个有效的截屏函数。
旧的是 [`canvas.toDataURL`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL)，
更好更新的是 [`canvas.toBlob`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)

所以你可能以为加一些下面的代码就可以很容易的截图：

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

这里有个来自 [关于动画的文章](webgl-animation.html) 的例子，用上面的代码和一些 CSS 来放置按键。

{{{example url="../webgl-tips-screenshot-bad.html"}}}

然后我的到了下面的截图

<div class="webgl_center"><img src="resources/screencapture-398x298.png"></div>

是的，就是一张空白图片。

上面的代码有可能正常工作，取决于你的浏览器/操作系统。
但一般来说，它不会正常工作。

这问题的原因，是因为为了性能和兼容性，当完成绘制后，浏览器默认会清除 WebGL 画布的绘制缓存。

有 3 种解决方法。

1. 在截图前调用渲染代码

    假设我们使用的绘制代码是 `drawScene` 函数。
    最好不要对它有所改动，然后在截图前调用它进行渲染。

    ```js
    elem.addEventListener('click', () => {
    +  drawScene();
      canvas.toBlob((blob) => {
        saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.png`);
      });
    });
    ```

2. 在渲染循环中调用截图代码

    在这种情况下，当我们想要截图时，设置标志位，然后在渲染循环中去进行截图。

    ```js
    let needCapture = false;
    elem.addEventListener('click', () => {
       needCapture = true;
    });
    ```

    然后在渲染循环中（当前是在 `drawScene` 中实现的），所有内容都完成绘制后：

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

3. 创建 WebGL context 时设置 `preserveDrawingBuffer: true`

    ```js
    const gl = someCanvas.getContext('webgl', {preserveDrawingBuffer: true});
    ```

    这让 WebGL 在将画布和页面其它内容合成后不清除画布，防止 *可能* 的优化。

我会选上面的 #1。在这个特定的例子中，我会将更新状态的代码从绘制部分中抽取出来。

```js
  var then = 0;

-  requestAnimationFrame(drawScene);
+  requestAnimationFrame(renderLoop);

+  function renderLoop(now) {
+    // 转换成秒
+    now *= 0.001;
+    // 当前时间减去之前时间
+    var deltaTime = now - then;
+    // 为下一帧记住当前时间
+    then = now;
+
+    // 每一帧都增加一点旋转
+    rotation[1] += rotationSpeed * deltaTime;
+
+    drawScene();
+
+    // 为下一帧再次调用 renderLoop
+    requestAnimationFrame(renderLoop);
+  }

  // 绘制场景
+  function drawScene() {
- function drawScene(now) {
-    // 转换成秒
-    now *= 0.001;
-    // 当前时间减去之前时间
-    var deltaTime = now - then;
-    // 为下一帧记住当前时间
-    then = now;
-
-    // 每一帧都增加一点旋转
-    rotation[1] += rotationSpeed * deltaTime;

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    ...

-    // 为下一帧再次调用 drawScene
-    requestAnimationFrame(drawScene);
  }
```

现在我们可以在截图前调用 `drawScene` 了。

```js
elem.addEventListener('click', () => {
+  drawScene();
  canvas.toBlob((blob) => {
    saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.png`);
  });
});
```

现在应该可以正常工作了。

{{{example url="../webgl-tips-screenshot-good.html" }}}

如果你检查截图，会发现背景是透明的。
看 [这篇文章](webgl-and-alpha.html) 获取一些细节。

<a id="preservedrawingbuffer" data-toc="防止画布被清空"></a>

# 防止画布被清空

假设你想让用户绘制动画物体，当你创建 WebGL context 时需要设置 `preserveDrawingBuffer: true`。
这防止浏览器清空画布。

像 [关于动画的文章](webgl-animation.html) 的例子。

```js
var canvas = document.querySelector("#canvas");
-var gl = canvas.getContext("webgl");
+var gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
```

然后改成调用 `gl.clear`，这样只会清除深度信息缓存。

```js
-// 清除画布和深度信息的缓存
-gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
+// 清除深度信息的缓存
+gl.clear(gl.DEPTH_BUFFER_BIT);
```

{{{example url="../webgl-tips-preservedrawingbuffer.html" }}}

注意，如果你真的想写一个绘制程序，上面的方法不是一个好的方案，因为只要改变分辨率，浏览器就会清空画布。
修改的分辨率是基于显示大小的，当窗口大小改变时，显示大小也会改变。
这包括当用户下载文件时，即使不在一个窗口浏览器添加了一个状态栏。
也包括了用户旋转了手机，浏览器从竖屏切换到了横屏。

如果你真在想要写个绘制程序，你最好 [渲染到纹理](webgl-render-to-texture.html)。

---

<a id="tabindex" data-toc="在画布中获取键盘输入"></a>

# 获取键盘输入

如果你在做一个整页/全屏的 WebGL 应用，那你可以做任何你想做的。
但通常情况会是大的页面中有一块画布，当用户点击画布时，画布可以获取键盘输入。
但一般来说画布无法获取键盘输入。
解决方法是将画布的 [`tabindex`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/tabIndex) 设置成 0 或者更大。例如：

```html
<canvas tabindex="0"></canvas>
```

但这会造成新的问题。任何有 `tabindex` 设置的元素在聚焦时都会高亮。
要解决这个问题，在 CSS 中将它的聚焦轮廓设成 none

```css
canvas:focus {
  outline: none;
}
```

举个例子，这里有 3 个画布：

```html
<canvas id="c1"></canvas>
<canvas id="c2" tabindex="0"></canvas>
<canvas id="c3" tabindex="1"></canvas>
```

设置最后一个画布:

```css
#c3:focus {
  outline: none;
}
```

对它们挂上同样的事件监听：

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

观察到第一个画布无法获取键盘输入。
第二个画布可以获取键盘输入，但是被高亮了。
第三个画布既获取了键盘输入，又没有被高亮。

{{{example url="../webgl-tips-tabindex.html"}}}

---

<a id="html-background" data-toc="将 WebGL 作为 HTML 的背景"></a>

# 将 WebGL 动画作为背景

一个常被问到的问题是，如何将 WebGL 动画用作网页的背景。

有 2 种方法：

* 将画布的 CSS 属性 `position` 设置成 `fixed`

```css
#canvas {
 position: fixed;
 left: 0;
 top: 0;
 z-index: -1;
 ...
}
```

并将 `z-index` 设置成 -1。

这么做的缺点是，你的 JavaScript 代码必须嵌入在页面中，
并且如果你的页面很复杂，需要确保 WebGL 代码中的 JavaScript 和页面中的 JavaScript 不冲突。

* 使用 `iframe`

这是这个 [网站主页](/) 使用的方案。

在你的网页中插入一个 iframe，例如：

```html
<iframe id="background" src="background.html"></iframe>
<div>
  这里是你的内容
</div>
```

然后给 iframe 设置样式，填满窗口并且作为背景。
代码几乎和上面设置画布一样，除了将 `border` 设置成 `none`，因为 iframe 默认有边框。

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

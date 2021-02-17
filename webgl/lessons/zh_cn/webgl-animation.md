Title: WebGL 动画
Description: 如何使用WebGL实现动画
TOC: WebGL 动画


此文上接WebGL系列文章，第一篇是<a href="webgl-fundamentals.html">基础概念</a>。
前一篇是<a href="webgl-3d-camera.html">三维相机</a>，如果没读建议从那开始。

如何使用WebGL实现动画？

事实上这个问题和WebGL并不相关，如果你想实现动画只需要利用JavaScript
随着时间改变一些值然后绘制。

我们可以看看之前使用的动画的例子。

    *var fieldOfViewRadians = degToRad(60);
    *var rotationSpeed = 1.2;

    *requestAnimationFrame(drawScene);

    // 绘制场景
    function drawScene() {
    *  // 每一帧旋转一点
    *  rotation[1] += rotationSpeed / 60.0;

      ...
    *  // 下一帧继续调用 drawScene 
    *  requestAnimationFrame(drawScene);
    }

这是结果

{{{example url="../webgl-animation-not-frame-rate-independent.html" }}}

这里还有一些小细节，上方的代码中有`rotationSpeed / 60.0`，
我们除以 60.0 是假设浏览器一秒钟调用 60 次 requestAnimationFrame。

这并不是一个有效的假设，也许用户使用的是一个低效的设备，比如旧的智能手机。
或者用户在后台运行了一个复杂的程序。有多种原因可能导致浏览器不是60帧每秒。
也许在 2020 年所有的设备每秒 240 帧，也许用户是一个游戏玩家，在CRT显示器上每秒 90 帧。

你可以在这个例子中发现问题

{{{diagram url="../webgl-animation-frame-rate-issues.html" }}}

在上方的例子中我们想让所有的 'F' 以相同的速度转动。
中间的 'F' 全速运行，并且帧率独立。左边和右边的模拟的是当前设备 1/8 的速率，
左边的**不是**帧率独立，右边的**是**帧率独立。

注意到由于左边的使用的计数，所以帧率变慢不能跟上正常速度。
右边的尽管以 1/8 的帧率运行，它还是能和中间的保持相同的速度。

让帧率独立的方法是计算两帧之间的时间，用这个时间计算当前帧的动画量。

首先需要得到时间，幸好页面加载调用 `requestAnimationFrame` 时会传入时间。

我觉得如果时间的单位是秒会简单一些，由于 `requestAnimationFrame` 传递给我们的时间是毫秒
（千分之一秒），我们需要将它乘以 0.001 得到秒。

所以就可以像这样计算出时间差

    *var then = 0;

    requestAnimationFrame(drawScene);

    // 绘制场景
    *function drawScene(now) {
    *  // 转换时间为秒
    *  now *= 0.001;
    *  // 减去上一次的时间得到时间差
    *  var deltaTime = now - then;
    *  // 记住这次时间
    *  then = now;

       ...

一旦有了 `deltaTime` 就可以决定每秒转多少个单位，例子中是 1.2 意思就是每秒转动 1.2 弧度。
大约是 1/5 圈或者说 5 秒可以转一整圈，不管帧率是多少。

    *    rotation[1] += rotationSpeed * deltaTime;

这是这个版本

{{{example url="../webgl-animation.html" }}}

除非你的机器比较慢，不然可能看不出和该页第一个的区别，
但是如果不使动画帧率独立，不同的用户可能会得到预期之外的结果。

接下来讲<a href="webgl-3d-textures.html">如何使用纹理</a>。
<div class="webgl_bottombar">
<h3>不要使用 setInterval 或 setTimeout!</h3>
<p>如果你之前使用JavaScript实现动画可能会使用<code>setInterval</code> 或 <code>setTimeout</code>
调用绘制。
</p><p>
使用 <code>setInterval</code> 或 <code>setTimeout</code> 的问题是会出现双重动画。
首先 <code>setInterval</code> 或 <code>setTimeout</code> 和浏览器的显示无关，
它们和浏览器绘制每一帧不同步，所以就不能和用户的设备同步。如果使用
<code>setInterval</code> 或 <code>setTimeout</code> 并且假设 60 帧每秒，
然后用户的设备实际帧率可能是其他数值，就会和设备不同步。
</p><p>
另一个问题是浏览器不知道你为什么使用<code>setInterval</code> 或 <code>setTimeout</code>。
例如，即使你的页面是不可见的，例如不是当前打开的标签，浏览器还是会运行你的代码。
也许你会使用 <code>setInterval</code> 或 <code>setTimeout</code> 查看邮箱或 tweeter，
浏览器并不知道你的目的是什么。每秒都检查新邮件和 tweeter 没什么问题，但每秒钟都使用WebGL绘制 1000
个物体就有问题了。你将对用户不可见的标签页进行绘制。
</p><p>
<code>requestAnimationFrame</code> 解决了这些问题，他只会在正确的时间调用，
保持动画和屏幕帧率相同，并且只会在可见时调用。
</p>
</div>




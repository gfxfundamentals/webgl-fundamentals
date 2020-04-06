Title: WebGL 文字 - HTML
Description: 如何使用HTML显示文字，并和WebGL中的位置匹配。
TOC: WebGL 文字 - HTML


此文上接WebGL系列文章，如果没读建议[先看这个](webgl-3d-perspective.html)，
然后再回来。

一个常见的问题就是“如何在WebGL中绘制文字”，首先你需要问自己绘制文字的目的是什么，
你在浏览器中，浏览器可以显示文字，所以第一个答案就是使用HTML显示文字。

先来做个简单的例子：假设你只需要在WebGL上绘制文字，我们就就把它叫做覆盖文字，
这样的文字基本上是固定在某个位置的。

简单的实现方式是创建一个或多个HTML元素，然后使用CSS让它们覆盖在画布上。

例如：首先创建一个容器然后将画布和一些HTML元素放在里面，让这些元素在容器中覆盖在画布上。

    <div class="container">
      <canvas id="canvas"></canvas>
      <div id="overlay">
        <div>Time: <span id="time"></span></div>
        <div>Angle: <span id="angle"></span></div>
      </div>
    </div>

然后设置CSS使HTML元素覆盖在画布上

    .container {
        position: relative;
    }
    #overlay {
        position: absolute;
        left: 10px;
        top: 10px;
    }

在初始化时找到这些元素并设置需要的属性。

    // 找到需要用到的元素
    var timeElement = document.querySelector("#time");
    var angleElement = document.querySelector("#angle");

    // 创建文字节点为浏览器节省一些时间
    var timeNode = document.createTextNode("");
    var angleNode = document.createTextNode("");

    // 将文字节点放入需要的地方
    timeElement.appendChild(timeNode);
    angleElement.appendChild(angleNode);

最后在渲染时更新节点

    function drawScene() {
        ...

        // 将旋转角从弧度转换为角度
        var angle = radToDeg(rotation[1]);

        // 范围在 0 - 360 之间
        angle = angle % 360;

        // 设置节点
        angleNode.nodeValue = angle.toFixed(0);  // 不保留小数
        timeNode.nodeValue = clock.toFixed(2);   // 保留两个小数

这是结果

{{{example url="../webgl-text-html-overlay.html" }}}

注意到我将修改的内容放入 span 中再放到 div 里，我觉的这样比直接放在 div 中要快一些，
像这样

    timeNode.value = "Time " + clock.toFixed(2);

我也使用的是  `node = document.createTextNode()` 并在之后调用的是
`node.nodeValue = someMsg`，我也可以使用 `someElement.innerHTML = someHTML`，
那样就更灵活，可以插入HTML字符串在里面，但是那样可能就会慢一些，
因为每次设置浏览器都要创建和消除节点，哪种方式更好取决于你自己。

对覆盖层技术而言，重要的是要清楚WebGL时运行在浏览器中的，可能的话要记得使用浏览器的特性。
许多OpenGL程序员想将所有的东西都100%使用WebGL绘制，但是WebGL运行在浏览器中，
浏览器已经帮你完成了很多工作，可以提供很多便利。例如你可以使用CSS非常简单的实现的修改覆盖层的样式。

这有一个例子加了一些样式，背景是圆角的，字母有光晕，有红色的边框，
你可以使用HTML得到你想要的各种结果。

{{{example url="../webgl-text-html-overlay-styled.html" }}}

还有一个重要的事情是让文字的位置和渲染的东西关联，我们也可以使用HTML实现。

在这个例子中我们还是创建一个容器，放入画布和其他容器，用来放移动的HTML

    <div class="container">
      <canvas id="canvas" width="400" height="300"></canvas>
      <div id="divcontainer"></div>
    </div>

设置CSS

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

`position: absolute;` 使 `#divcontainer` 的位置变为绝对值，
意思是和第一个包含 `position:relative` 或 `position: absolute` 样式的父容器相关，
在这个例子中就是画布和 `#divcontainer` 所在容器。

`left: 0px; top: 0px` 使 `#divcontainer` 左上对齐一切，
`z-index: 10` 使它浮在画布上，`overflow: hidden` 使子元素被边界裁剪。

最后 `.floating-div` 用来定位创建的 div。

所以现在需要找到divcontainer，创建 div 然后加在里面。

    // 找到 divcontainer
    var divContainerElement = document.querySelector("#divcontainer");

    // 创建 div
    var div = document.createElement("div");

    // 设置 CSS 类
    div.className = "floating-div";

    // 创建一个文字节点作为内容
    var textNode = document.createTextNode("");
    div.appendChild(textNode);

    // 加到 divcontainer 里
    divContainerElement.appendChild(div);

现在就通过设置它的样式来改变位置。

    div.style.left = Math.floor(x) + "px";
    div.style.top  = Math.floor(y) + "px";
    textNode.nodeValue = clock.toFixed(2);

这是例子，将文字限制在框内运动。

{{{example url="../webgl-text-html-bouncing-div.html" }}}

下一步使将位置和三维场景中的东西关联，如何实现呢？我们使用之前讲过的
[透视投影](webgl-3d-perspective.html)，就像让GPU做的事情一样。

通过那篇文章我们知道了如何使用矩阵，如何将它们乘起来，如何使用一个透视投影矩阵将坐标转换到裁剪空间。
我们也可以在JavaScript中做相同的运算，然后将裁剪空间坐标 (-1 到 +1) 转换到像素坐标，
使用这个像素坐标设置 div 的位置。

    gl.drawArrays(...);

    // 我们刚计算出绘制三维 F 的矩阵

    // 选择物体空间中 'F' 的一点
    //             X  Y  Z  W
    var point = [100, 0, 0, 1];  // 这是正面的右上角

    // 使用矩阵计算出这一点的裁剪空间坐标
    var clipspace = m4.transformVector(matrix, point);

    // 将 X 和 Y 除以 W，和 GPU 一样
    clipspace[0] /= clipspace[3];
    clipspace[1] /= clipspace[3];

    // 从裁剪空间转换到像素值
    var pixelX = (clipspace[0] *  0.5 + 0.5) * gl.canvas.width;
    var pixelY = (clipspace[1] * -0.5 + 0.5) * gl.canvas.height;

    // 定位 div
    div.style.left = Math.floor(pixelX) + "px";
    div.style.top  = Math.floor(pixelY) + "px";
    textNode.nodeValue = clock.toFixed(2);

Wow~，div 的左上角已经和 F 的正面右上角关联起来了。

{{{example url="../webgl-text-html-div.html" }}}

当然我们也可以使用更多的 div。

{{{example url="../webgl-text-html-divs.html" }}}

你可以查看最后一个例子的源码获取更多细节。
一个重要的点是，我推测从DOM创建，附加和移除HTML元素是比较慢的，
所以上方的例子创建元素后调整它们的位置，隐藏不用的部分而不是从DOM移除。
你可能需要做一个对比样例来看它是不是更快，这只是我选择的解决方式。

希望这篇文章让你了解了如何使用HTML创建文字，接下来我们将
[使用二维画布创建文字](webgl-text-canvas2d.html)。




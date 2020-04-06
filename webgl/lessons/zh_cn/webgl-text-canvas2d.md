Title: WebGL 文字 - 二维Canvas
Description: 如何使用使用二维画布显示与WebGL同步的文字
TOC: WebGL 文字 - 二维Canvas


此文上接[WebGL文字绘制](webgl-text-html.html)，如果没读建议从那里开始。

除了使用HTML元素显示文字，还可以使用一个新画布，但是使用的是二维上下文.
我只是猜测它会比直接使用HTML元素要快一些,没有证明过。当然也会少一些灵活性，
比如不能使用好用的CSS样式了，但是也不需要创建并保持HTML元素了。

和其他例子一样我们先创建一个容器，但是这次放两个画布进去。

    <div class="container">
      <canvas id="canvas"></canvas>
      <canvas id="text"></canvas>
    </div>

接下来设置CSS让画布成为覆盖层

    .container {
        position: relative;
    }

    #text {
        position: absolute;
        left: 0px;
        top: 0px;
        z-index: 10;
    }

在初始化时找到文字画布并创建一个二维上下文。

    // 找到画布
    var textCanvas = document.querySelector("#text");

    // 创建一个二维上下文
    var ctx = textCanvas.getContext("2d");

渲染时，像WebGL一样，需要每帧都清空二维画布。

    function drawScene() {
        ...

        // 清空二维画布
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

然后只调用 `fillText` 绘制文字

        ctx.fillText(someMsg, pixelX, pixelY);

这是结果

{{{example url="../webgl-text-html-canvas2d.html" }}}

为什么文字变小了？因为那是二维画布的默认文字大小，如果你想使用其它大小可以
[看看二维画布API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_text)。

使用二维画布的另一个原因是可以很容易的绘制其他东西，例如添加一个箭头

    // 绘制箭头和文字

    // 保存画布设置
    ctx.save();

    // 将画布原点移动到 F 的正面右上角
    ctx.translate(pixelX, pixelY);

    // 绘制箭头
    ctx.beginPath();
    ctx.moveTo(10, 5);
    ctx.lineTo(0, 0);
    ctx.lineTo(5, 10);
    ctx.moveTo(0, 0);
    ctx.lineTo(15, 15);
    ctx.stroke();

    // 绘制文字
    ctx.fillText(someMessage, 20, 20);

    // 还原画布设置
    ctx.restore();

我们之前讲过使用二维画布[矩阵栈](webgl-2d-matrix-stack.html)的平移方法，
不需要在绘制箭头的时候做其他运算了。我们只是假设绘制在原点，并且需要把原点移动到 F 的右上角。

{{{example url="../webgl-text-html-canvas2d-arrows.html" }}}

涉及到二维画布的使用，可以[查看二维画布API](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
获得更多信息。接下来我们将[用WebGL渲染文字](webgl-text-texture.html)。


Title: WebGL 和阿尔法通道
Description: WebGL和OpenGL的阿尔法通道有什么不同
TOC: WebGL 和阿尔法通道


我发现有些OpenGL的开发者对WebGL的阿尔法通道有疑问，
所以我觉得有必要讲一下WebGL和OpenGL的阿尔法通道的不同之处。

最大的不同点是OpenGL渲染到一个后备缓冲中，不和其他东西混合，
或者说不和操作系统窗口管理器中的其他东西混合。所以阿尔法通道是什么无所谓。

WebGL则是被浏览器混合在页面中，默认使用的是预乘阿尔法通道，
和带有透明的 .png `<img>`标签以及二维画布相同。

WebGL可以使用几种方法去模仿OpenGL。

### #1) 告诉WebGL你想让它是非预乘阿尔法通道的

    gl = canvas.getContext("webgl", {
      premultipliedAlpha: false  // 请求非预乘阿尔法通道
    });

默认值是 true。

当然结果还是会和背景混合，可能是画布的背景色，画布的容器的背景色，页面的背景色，
在画布背后的东西等等。换句话说，CSS定义的那个区域的颜色。

当遇到阿尔法通道问题时，一个比较好用方法就是将画布的背景色设置为一个亮色，
比如红色，你会很容易知道发生了什么。

    <canvas style="background: red;"><canvas>

你也可以设置成黑色，用来隐藏你的阿尔法通道问题。

### #2) 告诉WebGL你不想在后备缓冲中使用阿尔法通道

    gl = canvas.getContext("webgl", { alpha: false }};

这样就很像OpenGL，因为后备缓冲只有RGB。这可能是最好的方式，因为好点的浏览器知道你没有阿尔法，
并优化WebGL的混合方式。这也意味着后备缓冲中没有阿尔法通道，如果出于某些原因想在后备缓冲中使用阿尔法通道就不太合适了。
我知道的只有极少数应用在后备缓冲中使用阿尔法通道，所以我认为这个设置应该成为默认设置。

### #3) 在渲染结束后清除阿尔法通道

    ..
    renderScene();
    ..
    // 设置后备缓冲的阿尔法为 1.0
    gl.clearColor(1, 1, 1, 1);
    gl.colorMask(false, false, false, true);
    gl.clear(gl.COLOR_BUFFER_BIT);

在大多数硬件中使用清除时非常快速的，我经常在我的示例中使用这种方式。
如果聪明点的话我会换成上方 #2 的方式，也许我会在这篇文章以后使用那种方式，
似乎大多数WebGL库都将使用这个默认设置。少数想用阿尔法通道的开发者会请求这个特性，
其他的会得到一些优化。

### #4) 清除一次阿尔法通道不再渲染

    // 在初始化阶段，清楚后备缓冲
    gl.clearColor(1,1,1,1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 关闭向阿尔法通道的渲染
    gl.colorMask(true, true, true, false);

当然如果你想在帧缓冲中使用阿尔法通道，可以在渲染前开启，在渲染后再关闭，
保证渲染到画布前是关闭的。

### #5) 处理图像

默认的如果你将带有阿尔法的图像加载到WebGL中，WebGL会将它的值当作PNG的颜色值，
不是预乘阿尔法的。这也是我在OpenGL程序中常用的方法，因为它比预乘的多了一些信息。

    1, 0.5, 0.5, 0  // RGBA

有可能会出现非预乘的值是有意义的而预乘值就没意义了，
比如 `a = 0` 表示 `r`, `g`, 和 `b` 都将是零。

你想的话也可以让WebGL使用预乘值，可以通过设置 `UNPACK_PREMULTIPLY_ALPHA_WEBGL`
为 true 实现

    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

默认值是非预乘值。

要注意的是大多数二维画布使用的是预乘阿尔法通道的值。这就意味着你将
`UNPACK_PREMULTIPLY_ALPHA_WEBGL` 设置为 false 时，WebGL会将传入的值转换成非预乘值。

### #6) 对非预乘阿尔法的值使用混合方程

我写的或用的几乎所有的OpenGL应用都使用

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

这适用于非预乘阿尔法通道的纹理。

如果你确实想使用预乘阿尔法通道的纹理可能就需要使用

    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

这些是我想到的方法，如果你知道其它方法请在下方留言。




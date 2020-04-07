Title: WebGL 设置和安装
Description: 如何进行WebGL的开发
TOC: WebGL 设置和安装


事实上，开发WebGL只需要一个网页浏览器。
你可以用[jsfiddle.net](https://jsfiddle.net/greggman/8djzyjL3/)、[jsbin.com](https://jsbin.com)或[codepen.io](https://codepen.io/greggman/pen/YGQjVV)当本教程的学习环境。

如果你想在之前的网站里引用外部脚本，只需要添加一对`<script src="..."></script>`标签。

但这么做有一些限制。WebGL在使用图片上有着比Canvas2D更强的限制，就是说WebGL不能随意使用网络获图像，
还有一点需要注意的是WebGL读取本地数据的速度很快。

如果你想运行和编辑本站示例，首先下载本网站。[你可以从这里下载](https://github.com/gfxfundamentals/webgl-fundamentals/)。

{{{image url="resources/download-webglfundamentals.gif" }}}

解压缩文件到任一文件夹。

## 使用一个简单易用的Web Server

下一步你需要搭建一个简单的web服务器。我知道“web服务器”听起来很吓人，但搭建[web服务器实际上是非常简单的](https://games.greggman.com/game/saving-and-loading-files-in-a-web-page/)。

如果你使用的是Chrome浏览器，这有一个扩展[Servez](https://greggman.github.io/servez)可以当web服务器。

{{{image url="resources/servez.gif" }}}

只需选择解压后的文件夹，点击“Start”，然后在地址 [`http://localhost:8080/webgl/`](http://localhost:8080/webgl/) 中选择例子。

如果你更喜欢使用命令行，另一种方法是使用[node.js](https://nodejs.org)。
在下载并安装后，打开命令行/控制台/终端窗口。
如果你是Windows系统，安装过程会提示你额外安装“Node Command Prompt”，同意就可以了。

然后通过输入如下内容安装[`servez`](https://github.com/greggman/servez-cli)

    npm -g install servez

如果你用的是OSX系统

    sudo npm -g install servez

完成安装后接着输入

    servez 你/的/文/件/解/压/地/址

然后应该显示类似的东西

{{{image url="resources/servez-response.png" }}}

最后你就可以在你的网页浏览器里访问 [`http://localhost:8080/webgl/`](http://localhost:8080/webgl/) 了。

如果你不指定路径，servez 会使用当前所在文件夹。

## 使用浏览器中的开发者工具

大多数浏览器都内置了大量的开发者工具。

{{{image url="resources/chrome-devtools.png" }}}

[Chrome浏览器的使用文档在这里](https://developers.google.com/web/tools/chrome-devtools/)，
[Firefox浏览器的在这](https://developer.mozilla.org/en-US/docs/Tools)。

这有个简单的使用技巧：若是没有显示任何内容就查看JavaScript控制台，如果有什么问题的话控制台上面通常都有错误信息。
通过仔细的阅读错误信息可以帮你确定问题的根源。

{{{image url="resources/javascript-console.gif" }}}

## WebGL 辅助工具

有很多WebGL 监测工具/辅助工具。[这有个Chrome浏览器的](https://benvanik.github.io/WebGL-Inspector/)。

{{{image url="https://benvanik.github.io/WebGL-Inspector/images/screenshots/1-Trace.gif" }}}

[Firefox也有个类似的](https://hacks.mozilla.org/2014/03/introducing-the-canvas-debugger-in-firefox-developer-tools/)。
它需要在`about:flags`中设置启用，而且可能你需要[Firefox开发者版本](https://www.mozilla.org/en-US/firefox/developer/)。

它们可能会对你有帮助。
它们大多数的功能是运行程序时可以捕获某一帧并查看这一帧中WebGL的详细调用。
它在你的程序正常运行时或运行并崩溃的情况下很有用。
但是如果你初始化阶段出了问题或你没有在每一帧中使用动画它就不会捕捉任何东西。
尽管如此，但它仍然是一个非常有用的工具。
我经常会在绘制中加调试断点，用来查看uniform变量。
如果我看到一堆NaN就会跟踪设置uniform变量的部分以便找到错误代码。
它们大多数是为动画样本而设计的，并且会捕获一个帧，让你能够看到所有用来生成这个帧的WebGL的详细调用。
若是你正在编写或是已经写完，它们可以对你有帮助，这是极好的，但是，若是你的问题是出在绘制的初始化阶段或是你没有使用动画来绘制每一帧动画，它们就难以帮你捕捉到错误了。尽管如此，它们总的来说还是很有用的。
我就会经常检查绘制时的调用和各种uniform变量。如果我看到一堆`NaN` (Not a Number)冒出我通常可以追寻到产生bug的代码。

## 查看源码

通常只需要右键选择查看源代码

{{{image url="resources/view-source.gif" }}}

但若遇到不能右键网页或网页的源代码是在多个文件中的情况，你可以通过开发者工具看到源代码

{{{image url="resources/devtools-source.gif" }}}

## 开始学习

希望这有助于你完成准备工作以便开始接下来的学习。[现在回到教程](index.html)。

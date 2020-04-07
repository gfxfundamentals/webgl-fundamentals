Title: WebGL 样板
Description: WebGL应用中常用的代码
TOC: WebGL 样板


此文上接<a href="webgl-fundamentals.html">WebGL基础概念</a>，
学习WebGL似乎有些难度，因为大多数教程都想一次教完所有东西，
而我会尽量避免这样，在需要合适的时候讲一些小的知识点。

WebGL复杂的原因之一是需要两个方法，一个顶点着色器和一个片断着色器。
这两个方法通常是在你的GPU上运行，也是高速运行的保障。
所以它们是一种自定义语言，目的是能够在GPU上良好运行。
这两个方法需要编译并链接在一起，而这个过程在 99% 的WbgGL应用中是一样的。

这是编译着色器的样板代码。

    /**
     * 创建并编译一个着色器
     *
     * @param {!WebGLRenderingContext} gl WebGL上下文。
     * @param {string} shaderSource GLSL 格式的着色器代码
     * @param {number} shaderType 着色器类型, VERTEX_SHADER 或
     *     FRAGMENT_SHADER。
     * @return {!WebGLShader} 着色器。
     */
    function compileShader(gl, shaderSource, shaderType) {
      // 创建着色器程序
      var shader = gl.createShader(shaderType);

      // 设置着色器的源码
      gl.shaderSource(shader, shaderSource);

      // 编译着色器
      gl.compileShader(shader);

      // 检测编译是否成功
      var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (!success) {
        // 编译过程出错，获取错误信息。
        throw "could not compile shader:" + gl.getShaderInfoLog(shader);
      }

      return shader;
    }

这是链接 2 个着色器到一个着色程序中的代码

    /**
     * 从 2 个着色器中创建一个程序
     *
     * @param {!WebGLRenderingContext) gl WebGL上下文。
     * @param {!WebGLShader} vertexShader 一个顶点着色器。
     * @param {!WebGLShader} fragmentShader 一个片断着色器。
     * @return {!WebGLProgram} 程序
     */
    function createProgram(gl, vertexShader, fragmentShader) {
      // 创建一个程序
      var program = gl.createProgram();

      // 附上着色器
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);

      // 链接到程序
      gl.linkProgram(program);

      // 检查链接是否成功
      var success = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (!success) {
          // 链接过程出现问题
          throw ("program failed to link:" + gl.getProgramInfoLog (program));
      }

      return program;
    };

处理错误的方式有很多种，抛出错误信息可能是最好的方式。
而且这几行代码在几乎所有的WebGL程序中都是相似的。

我喜欢把着色器代码放在非 JavaScript 代码的 &lt;script&gt; 标签中，
这样很容易编辑，使用的时候可以这样做

    /**
     * 用 script 标签的内容创建着色器
     *
     * @param {!WebGLRenderingContext} gl WebGL上下文。
     * @param {string} scriptId script标签的id。
     * @param {string} opt_shaderType. 要创建的着色器类型。
     *     如果没有定义，就使用script标签的type属性。
     *     
     * @return {!WebGLShader} 着色器。
     */
    function createShaderFromScript(gl, scriptId, opt_shaderType) {
      // 通过id找到script标签
      var shaderScript = document.getElementById(scriptId);
      if (!shaderScript) {
        throw("*** Error: unknown script element" + scriptId);
      }

      // 提取标签内容。
      var shaderSource = shaderScript.text;

      // 如果没有传着色器类型，就使用标签的 ‘type’ 属性
      if (!opt_shaderType) {
        if (shaderScript.type == "x-shader/x-vertex") {
          opt_shaderType = gl.VERTEX_SHADER;
        } else if (shaderScript.type == "x-shader/x-fragment") {
          opt_shaderType = gl.FRAGMENT_SHADER;
        } else if (!opt_shaderType) {
          throw("*** Error: shader type not set");
        }
      }

      return compileShader(gl, shaderSource, opt_shaderType);
    };

现在编译着色器只需要

    var shader = compileShaderFromScript(gl, "someScriptTagId");

我通常会更进一步，使用一个方法编译两个着色器，附加到程序并链接到程序。

    /**
     * 通过两个 script 标签创建程序。
     *
     * @param {!WebGLRenderingContext} gl WebGL上下文。
     * @param {string} vertexShaderId 顶点着色器的标签id。
     * @param {string} fragmentShaderId 片断着色器的标签id。
     * @return {!WebGLProgram} 程序。
     */
    function createProgramFromScripts(
        gl, vertexShaderId, fragmentShaderId) {
      var vertexShader = createShaderFromScriptTag(gl, vertexShaderId, gl.VERTEX_SHADER);
      var fragmentShader = createShaderFromScriptTag(gl, fragmentShaderId, gl.FRAGMENT_SHADER);
      return createProgram(gl, vertexShader, fragmentShader);
    }

另一几乎在我所有WebGL应用中都会使用的代码是重置画布大小。
你可以[在这里看看那个方法是如何实现的](webgl-resizing-the-canvas.html)。

所有示例中使用的这两个方法都在

    <script src="resources/webgl-utils.js"></script>

里，并且像这样使用

    var program = webglUtils.createProgramFromScripts(
      gl, [idOfVertexShaderScript, idOfFragmentShaderScript]);

    ...

    webglUtils.resizeCanvasToMatchDisplaySize(canvas);

这样做就可以剔除大量和示例无关的代码，突出示例想要表达的内容。

这是我最小的一套WebGL样板代码。
[你可以在 `webgl-utils.js` 中找到源码](../resources/webgl-utils.js)。
如果你想要更有组织的代码。可以查看[TWGL.js](https://twgljs.org)。

其余的让WebGL显得比较复杂的部分就是设置着色器的输入，可以看看是
<a href="webgl-how-it-works.html">如何实现的</a>。

我还建议你看看[码少趣多](webgl-less-code-more-fun.html)和
[TWGL](https://twgljs.org)。

*   [`webgl-lessons-ui.js`](../resources/webgl-lessons-ui.js)

    这个代码提供了含有数值的滑块，并更够在拖拽时更新数值。
    同样的，我只是不想在示例代码中参杂太多不相干代码。

*   [`lessons-helper.js`](../resources/lessons-helper.js)

    这个代码在 webglfundmentals.org 以外不是必须的，它只是能够在在线编辑器中提供合适的错误提示。

*   [`m3.js`](../resources/m3.js)

    这是一个二维数学库，在讲到矩阵式需要用到，本来是将它们写在代码中的，但是考虑到无关代码较多，
    就整合到一个脚本文件中了。

*   [`m4.js`](../resources/m4.js)

    这是一个三维数学库，它们在三维的文章中使用，同样的由于代码较多，为保证示例代码显示明确，
    就将它们写在一个文件中了。




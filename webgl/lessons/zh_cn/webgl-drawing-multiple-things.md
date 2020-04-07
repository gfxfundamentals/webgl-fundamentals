Title: WebGL 绘制多个物体
Description: 如何使用WebGL绘制多个物体
TOC: WebGL 绘制多个物体


此文上接[一系列WebGL相关文章](webgl-fundamentals.html)，
如果没读请从那里开始。

学到WebGL的一些基础以后，面临的一个问题可能是如何绘制多个物体。

这里有一些特别的地方你需要提前了解，WebGL就像是一个方法，
但不同于一般的方法直接传递参数，它需要调用一些方法去设置状态，
最后用某个方法执行绘制，并使用之前设置的状态。你在写代码时可能会用这种形式的方法

    function drawCircle(centerX, centerY, radius, color) { ... }

或者用这种形式的方法

    var centerX;
    var centerY;
    var radius;
    var color;

    function setCenter(x, y) {
       centerX = x;
       centerY = y;
    }

    function setRadius(r) {
       radius = r;
    }

    function setColor(c) {
       color = c;
    }

    function drawCircle() {
       ...
    }

WebGL使用的是后一种形式，例如 `gl.createBuffer`,
`gl.bufferData`, `gl.createTexture`, 和 `gl.texImage2D`
方法让你上传缓冲（顶点）或者纹理（颜色等）给WebGL，
`gl.createProgram`, `gl.createShader`, `gl.compileProgram`, 和
`gl.linkProgram` 让你创建自己的 GLSL 着色器，
剩下的所有方法几乎都是设置全局变量或者最终方法 `gl.drawArrays` 或 `gl.drawElements`
需要的**状态**。 

清楚这个以后，WebGL应用基本都遵循以下结构

初始化阶段

*   创建所有着色器和程序并寻找参数位置
*   创建缓冲并上传顶点数据
*   创建纹理并上传纹理数据

渲染阶段

*   清空并设置视图和其他全局状态（开启深度检测，剔除等等）
*   对于想要绘制的每个物体
    *   调用 `gl.useProgram` 使用需要的程序
    *   设置物体的属性变量
        *   为每个属性调用 `gl.bindBuffer`, `gl.vertexAttribPointer`, `gl.enableVertexAttribArray`
    *   设置物体的全局变量
        *   为每个全局变量调用 `gl.uniformXXX`
        *   调用 `gl.activeTexture` 和 `gl.bindTexture` 设置纹理到纹理单元
    *   调用 `gl.drawArrays` 或 `gl.drawElements`

基本上就是这些，详细情况取决于你的实际目的和代码组织情况。

有的事情例如上传纹理数据（甚至时顶点数据）可能遇到异步，
你就需要等所有资源下载完成后才能开始。

让我们来做一个简单的应用，绘制三个物体，一个立方体，一个球体，一个椎体。

我不会详细介绍如何计算出立方体，球体和椎体数据，
假设有方法能够返回[上篇文章中的 bufferInfo 对象](webgl-less-code-more-fun.html)。

这是代码，着色器是[透视示例](webgl-3d-perspective.html)中的简单的着色器，
新添加了一个 `u_colorMult` 全局变量和顶点颜色相乘。

    // 从顶点着色器中传入的值
    varying vec4 v_color;

    uniform vec4 u_colorMult;

    void main() {
       gl_FragColor = v_color * u_colorMult;
    }


初始化阶段

    // 每个物体需要的全局变量
    var sphereUniforms = {
      u_colorMult: [0.5, 1, 0.5, 1],
      u_matrix: m4.identity(),
    };
    var cubeUniforms = {
      u_colorMult: [1, 0.5, 0.5, 1],
      u_matrix: m4.identity(),
    };
    var coneUniforms = {
      u_colorMult: [0.5, 0.5, 1, 1],
      u_matrix: m4.identity(),
    };

    // 每个物体的平移量
    var sphereTranslation = [  0, 0, 0];
    var cubeTranslation   = [-40, 0, 0];
    var coneTranslation   = [ 40, 0, 0];

绘制阶段

    var sphereXRotation =  time;
    var sphereYRotation =  time;
    var cubeXRotation   = -time;
    var cubeYRotation   =  time;
    var coneXRotation   =  time;
    var coneYRotation   = -time;

    // ------ 绘制球体 --------

    gl.useProgram(programInfo.program);

    // 设置所需的属性变量
    webglUtils.setBuffersAndAttributes(gl, programInfo, sphereBufferInfo);

    sphereUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        sphereTranslation,
        sphereXRotation,
        sphereYRotation);

    // 设置刚才计算出的全局变量
    webglUtils.setUniforms(programInfo, sphereUniforms);

    gl.drawArrays(gl.TRIANGLES, 0, sphereBufferInfo.numElements);

    // ------ 绘制立方体 --------

    // 设置所需的属性变量
    webglUtils.setBuffersAndAttributes(gl, programInfo, cubeBufferInfo);

    cubeUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        cubeTranslation,
        cubeXRotation,
        cubeYRotation);

    // 设置刚才计算出的全局变量
    webglUtils.setUniforms(programInfo, cubeUniforms);

    gl.drawArrays(gl.TRIANGLES, 0, cubeBufferInfo.numElements);

    // ------ 绘制椎体 --------

    // 设置所需的属性变量
    webglUtils.setBuffersAndAttributes(gl, programInfo, coneBufferInfo);

    coneUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        coneTranslation,
        coneXRotation,
        coneYRotation);

    // 设置刚才计算出的全局变量
    webglUtils.setUniforms(programInfo, coneUniforms);

    gl.drawArrays(gl.TRIANGLES, 0, coneBufferInfo.numElements);

这是结果

{{{example url="../webgl-multiple-objects-manual.html" }}}

需要注意的是，由于我们只有一个程序，所以只调用了一次 `gl.useProgram`，
如果我们有不同的着色程序，则需要在使用前调用 `gl.useProgram`。

这还有一个值得简化的地方，将这三个相关的事情组合到一起。

1.  着色程序（和它的全局变量以及属性 info/setter）
2.  想要绘制的物体的缓冲和属性变量
3.  绘制物体所需程序的全局变量

简单的简化后制作一个序列对象，将三个物体放在其中

    var objectsToDraw = [
      {
        programInfo: programInfo,
        bufferInfo: sphereBufferInfo,
        uniforms: sphereUniforms,
      },
      {
        programInfo: programInfo,
        bufferInfo: cubeBufferInfo,
        uniforms: cubeUniforms,
      },
      {
        programInfo: programInfo,
        bufferInfo: coneBufferInfo,
        uniforms: coneUniforms,
      },
    ];

绘制的时候仍然需要更新矩阵

    var sphereXRotation =  time;
    var sphereYRotation =  time;
    var cubeXRotation   = -time;
    var cubeYRotation   =  time;
    var coneXRotation   =  time;
    var coneYRotation   = -time;

    // 为每个物体计算矩阵
    sphereUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        sphereTranslation,
        sphereXRotation,
        sphereYRotation);

    cubeUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        cubeTranslation,
        cubeXRotation,
        cubeYRotation);

    coneUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        coneTranslation,
        coneXRotation,
        coneYRotation);

但是绘制代码就会变成一个简单的循环

    // ------ 绘制几何体 --------

    objectsToDraw.forEach(function(object) {
      var programInfo = object.programInfo;
      var bufferInfo = object.bufferInfo;

      gl.useProgram(programInfo.program);

      // 设置所需的属性
      webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);

      // 设置全局变量
      webglUtils.setUniforms(programInfo, object.uniforms);

      // 绘制
      gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
    });


理论上这就是大多数现有三维引擎的主要渲染循环。
其他地方的某些代码控制 `objectsToDraw` 列表中的对象，
基本上就是这样。

{{{example url="../webgl-multiple-objects-list.html" }}}

这还有一些小优化，如果将要绘制的对象和前一个对象使用相同的程序，
则不需要调用 `gl.useProgram`。同样的，如果绘制的形状/几何体/顶点
是之前绘制过的，相同的参数就不必再设置一遍。

所以，简单的优化后可能像这样

    var lastUsedProgramInfo = null;
    var lastUsedBufferInfo = null;

    objectsToDraw.forEach(function(object) {
      var programInfo = object.programInfo;
      var bufferInfo = object.bufferInfo;
      var bindBuffers = false;

      if (programInfo !== lastUsedProgramInfo) {
        lastUsedProgramInfo = programInfo;
        gl.useProgram(programInfo.program);

        // 更换程序后要重新绑定缓冲，因为只需要绑定程序要用的缓冲。
        // 如果两个程序使用相同的bufferInfo但是第一个只用位置数据，
        // 当我们从第一个程序切换到第二个时，有些属性就不存在。
        bindBuffers = true;
      }

      // 设置所需的属性
      if (bindBuffers || bufferInfo != lastUsedBufferInfo) {
        lastUsedBufferInfo = bufferInfo;
        webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      }

      // 设置全局变量
      webglUtils.setUniforms(programInfo, object.uniforms);

      // 绘制
      gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
    });

这次我们多绘制一些物体，用包含更多物体的序列代替之前的三个物体。

    // 将图形放在数组中以便随机抽取
    var shapes = [
      sphereBufferInfo,
      cubeBufferInfo,
      coneBufferInfo,
    ];

    // 创建两个对象数组，一个用于绘制，一个用于使用
    var objectsToDraw = [];
    var objects = [];

    // 每个物体的全局变量
    var numObjects = 200;
    for (var ii = 0; ii < numObjects; ++ii) {
      // 选择一个形状
      var bufferInfo = shapes[rand(0, shapes.length) | 0];

      // 创建一个物体
      var object = {
        uniforms: {
          u_colorMult: [rand(0, 1), rand(0, 1), rand(0, 1), 1],
          u_matrix: m4.identity(),
        },
        translation: [rand(-100, 100), rand(-100, 100), rand(-150, -50)],
        xRotationSpeed: rand(0.8, 1.2),
        yRotationSpeed: rand(0.8, 1.2),
      };
      objects.push(object);

      // 添加到绘制数组中
      objectsToDraw.push({
        programInfo: programInfo,
        bufferInfo: bufferInfo,
        uniforms: object.uniforms,
      });
    }

渲染时

    // 计算每个物体的矩阵
    objects.forEach(function(object) {
      object.uniforms.u_matrix = computeMatrix(
          viewMatrix,
          projectionMatrix,
          object.translation,
          object.xRotationSpeed * time,
          object.yRotationSpeed * time);
    });

然后在上方的循环中绘制所有物体。

{{{example url="../webgl-multiple-objects-list-optimized.html" }}}

你也可以根据 `programInfo` 和/或 `bufferInfo` 对物体进行排序，
这样就会更大程度的利用优化代码，大多数游戏引擎都会这么做。
但这并不简单，如果你绘制的都是不透明物体那就可以直接排序，
但是一旦你要绘制半透明物体时，就必须按照一定的顺序绘制。
大多数三维引擎通过使用两个或多个对象数组解决这个问题，一个存储不透明物体，
另一个存储透明物体，不透明数组按照程序和几何体排序，透明数组按照深度排序，
可能还有其他数组存储覆盖物或者后处理效果等。

<a href="../webgl-multiple-objects-list-optimized-sorted.html"
target="_blank">这是一个使用排序的例子</a>。在我的机器上从 ~31fps
提升到了 ~37fps，几乎是 20% 的性能提升。但是这是最差的情况和最好的情况的对比，
大多数应用考虑的非常全面，理论上除了一些非常特殊的情况以外，其他情况并不需要考虑太多。

需要特别注意的是着色器和图形往往一一对应，
例如一个需要法向量的着色器就不能用在没有法向量的几何体上，
同样的一个需要纹理的着色器在没有纹理时就无法正常运行。

这就是需要选择一个优质的三维引擎（例如[Three.js](https://threejs.org)）的原因之一，
因为它可以帮你解决这些问题。你创建几何体时只需要告诉 three.js 你想如何渲染，
它就会在运行时为你创建你需要的着色器。几乎所有的三维引擎，从 Unity3D 到 Unreal
到 Source 到 Crytek，有些在离线时创建着色器，但是重要的是它们都会**创建**着色器。

当然，你阅读这些文章的目的是想知道底层原理，自己写所有的东西非常好并且也很有趣，
但是需要注意的是[WebGL是非常底层的](webgl-2d-vs-3d-library.html)，
所以如果你想自己做所有的东西的话，要做的东西很多，通常包括着色器生成器，
因为不同的特性需要不同的着色器。

你可能注意到我并没有把 `computeMatrix` 放在循环中，
那是因为渲染理论上应该和矩阵计算分离，通常情况下矩阵计算放在接下来要讲的
[场景图](webgl-scene-graph.html)中。

现在我们有了绘制多个物体的框架，就可以[绘制一些文字了](webgl-text-html.html)。


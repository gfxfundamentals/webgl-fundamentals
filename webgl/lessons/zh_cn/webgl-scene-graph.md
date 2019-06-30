Title: WebGL - 场景图
Description: 场景图是的目的是什么，有什么用处。
TOC: WebGL 场景图


此文上接[WebGL系类文章](webgl-fundamentals.html)，
上一篇是[绘制多个物体](webgl-drawing-multiple-things.html)，
如果没读请从那里开始。

我觉得一些CS或图形学大师会打我脸，但是我还是得说。
场景图通常是一个树结构，每一个节点都会创建一个矩阵，
这可能并不是一个很有意义的定义，也许看几个例子会更清楚。

大多数三维引擎使用场景图，将需要显示的东西放在场景图中，
引擎会遍历场景图找出需要绘制的东西。场景图具有层级结构，
如果你想模拟宇宙运动，可能需要这样一个图。

{{{diagram url="resources/planet-diagram.html" height="500" }}}

场景图的意义是什么？它的首要作用就是为矩阵提供了父子关系，就像
[我们讲过的二维矩阵运算](webgl-2d-matrices.html)一样。
例如在一个模拟宇宙的例子中（并不是真实的），星星（孩子）在它们所在的星系（父母）运用，
同样的月亮（孩子）绕着地球（父母）运动，如果地球移动，月亮也会跟着移动。
拖动上图中的名字然后观察他们的关系。

如果你回想[二维矩阵运算](webgl-2d-matrices.html)可能会想起，
多个矩阵相乘后实现物体的平移，旋转和缩放。场景图提供了一个结构，
为矩阵作用在哪个物体上提供了帮助。

理论上场景图中的每个 `Node` 都代表一个**逻辑空间**。为那个**逻辑空间**
提供合适的矩阵不必考虑在它之上的物体。另一种表达的方式是月亮只关心绕地球转动的轨道，
它不需要考虑绕太阳转动的轨道，如果没有场景图结构就需要做很多复杂的数学运算其计算月亮相对于太阳的轨道，
因为它相对于太阳的轨道是类似于这样的

{{{diagram url="resources/moon-orbit.html" }}}

有了场景图就只需要让月亮成为地球的子节点然后绕地球运转。
地球绕太阳运转的部分场景图会处理，它通过遍历节点并把矩阵相乘，就像这样

    worldMatrix = greatGrandParent * grandParent * parent * self(localMatrix)

按照术语我们的宇宙关系应该是这样的

    worldMatrixForMoon = galaxyMatrix * starMatrix * planetMatrix * moonMatrix;

我们可以用一个简单的递归函数来实现这个运算

    function computeWorldMatrix(currentNode, parentWorldMatrix) {
        // 通过把我们的父节点的世界矩阵和当前结点的局部矩阵相乘，
        // 计算出当前节点的世界矩阵
        var worldMatrix = m4.multiply(parentWorldMatrix, currentNode.localMatrix);

        // 让子节点做同样的事
        currentNode.children.forEach(function(child) {
            computeWorldMatrix(child, worldMatrix);
        });
    }

这里使用了三维场景图中常用的术语。

*   `localMatrix`: 当前节点的局部矩阵。它会在局部空间的原点对自己和子节点进行转换操作。

*    `worldMatrix`: 将当前结点的局部空间的变换转换到场景图根节点所在的空间。
     换句话说它将节点放在了世界空间中，如果我们计算月球的世界矩阵，就会得到之前看到的有趣的轨道。

场景图很容易实现，让我们来定义一个简单的 `Node` 对象。
组织场景图的方式有很多种，我不知道哪种是最好的，常用的方式是有一个可选的绘制物体字段。

    var node = {
       localMatrix: ...,  // 当前节点的局部矩阵
       worldMatrix: ...,  // 当前结点的世界矩阵
       children: [],      // 子节点序列
       thingToDraw: ??,   // 当前节点需要绘制的物体
    };

我们来做一个太阳系的场景图，为了保持简洁我不会使用纹理。
先来创建几个方法来帮助我们管理节点，首先定义一个节点类

    var Node = function() {
      this.children = [];
      this.localMatrix = m4.identity();
      this.worldMatrix = m4.identity();
    };

提供一个设定节点父节点的方式。

    Node.prototype.setParent = function(parent) {
      // 从父节点中移除
      if (this.parent) {
        var ndx = this.parent.children.indexOf(this);
        if (ndx >= 0) {
          this.parent.children.splice(ndx, 1);
        }
      }

      // 添加到新的父节点上
      if (parent) {
        parent.children.append(this);
      }
      this.parent = parent;
    };

这段代码根据父子节点关系和局部矩阵计算世界矩阵。如果我们从父节点调用，
它将会递归的计算出子节点的世界矩阵。如果你对矩阵运算不太了解
[可以看看这个文章](webgl-2d-matrices.html)。

    Node.prototype.updateWorldMatrix = function(parentWorldMatrix) {
      if (parentWorldMatrix) {
        // 传入一个矩阵计算出世界矩阵并存入 `this.worldMatrix`。
        m4.multiply(this.localMatrix, parentWorldMatrix, this.worldMatrix);
      } else {
        // 没有矩阵传入，直接将局部矩阵拷贝到世界矩阵
        m4.copy(this.localMatrix, this.worldMatrix);
      }

      // 计算所有的子节点
      var worldMatrix = this.worldMatrix;
      this.children.forEach(function(child) {
        child.updateWorldMatrix(worldMatrix);
      });
    };

为了简单我们只包含太阳，月亮和地球，也会使用假的距离使内容便于呈现在屏幕上。
我们会用黄色的球体代表太阳，蓝绿色的球体代表地球，灰色的代表月亮。
如果你对 `drawInfo`, `bufferInfo`, 和 `programInfo` 感到陌生可以
[看看前一篇文章](webgl-drawing-multiple-things.html)。

    // 定义所有的节点
    var sunNode = new Node();
    sunNode.localMatrix = m4.translation(0, 0, 0);  // 太阳在中心
    sunNode.drawInfo = {
      uniforms: {
        u_colorOffset: [0.6, 0.6, 0, 1], // 黄色
        u_colorMult:   [0.4, 0.4, 0, 1],
      },
      programInfo: programInfo,
      bufferInfo: sphereBufferInfo,
    };

    var earthNode = new Node();
    earthNode.localMatrix = m4.translation(100, 0, 0);  // 地球离太阳 100 个单位距离
    earthNode.drawInfo = {
      uniforms: {
        u_colorOffset: [0.2, 0.5, 0.8, 1],  // 蓝绿色
        u_colorMult:   [0.8, 0.5, 0.2, 1],
      },
      programInfo: programInfo,
      bufferInfo: sphereBufferInfo,
    };

    var moonNode = new Node();
    moonNode.localMatrix = m4.translation(20, 0, 0);  // 月亮离地球 20 个单位距离
    moonNode.drawInfo = {
      uniforms: {
        u_colorOffset: [0.6, 0.6, 0.6, 1],  // 灰色
        u_colorMult:   [0.1, 0.1, 0.1, 1],
      },
      programInfo: programInfo,
      bufferInfo: sphereBufferInfo,
    };

现在将它们关联起来

    // 关联物体
    moonNode.setParent(earthNode);
    earthNode.setParent(sunNode);

同样创建一个物体列表和一个将要绘制的物体列表

    var objects = [
      sunNode,
      earthNode,
      moonNode,
    ];

    var objectsToDraw = [
      sunNode.drawInfo,
      earthNode.drawInfo,
      moonNode.drawInfo,
    ];

渲染时更新每个物体的局部矩阵来旋转每个物体

    // 更新每个物体的局部矩阵
    m4.multiply(m4.yRotation(0.01), sunNode.localMatrix  , sunNode.localMatrix);
    m4.multiply(m4.yRotation(0.01), earthNode.localMatrix, earthNode.localMatrix);
    m4.multiply(m4.yRotation(0.01), moonNode.localMatrix , moonNode.localMatrix);

局部矩阵更新了就可以更新世界矩阵

    sunNode.updateWorldMatrix();

最后将世界矩阵和投影视图矩阵相乘得到每个物体的[世界视图投影矩阵](webgl-3d-perspective.html)。

    // 计算每个物体的矩阵
    objects.forEach(function(object) {
      object.drawInfo.uniforms.u_matrix = m4.multiply(viewProjectionMatrix, object.worldMatrix);
    });

渲染过程使[上节中相似的循环](webgl-drawing-multiple-things.html)。

{{{example url="../webgl-scene-graph-solar-system.html" }}}

你可能注意到所有的星体的大小是一样的，让地球变大一点吧

    // 地球离太阳 100 个单位距离
    earthNode.localMatrix = m4.translation(100, 0, 0);
    // 让地球变为两倍大小
    earthNode.localMatrix = m4.scale(earthNode.localMatrix, 2, 2, 2);

{{{example url="../webgl-scene-graph-solar-system-larger-earth.html" }}}

呃，月亮也变大了。想要修复这个问题的话就需要手动缩小月亮。
一个更好的方法就是为场景图添加更多节点。而不是只是

      sun
       |
      earth
       |
      moon

我们将它变成

     solarSystem
       |    |
       |   sun
       |
     earthOrbit
       |    |
       |  earth
       |
      moonOrbit
          |
         moon

这样就让地球绕 solarSystem 转动，我们就可以单独旋转和缩放太阳并且不会影响到地球，
同样的地球可以独立于月球转动。让我们给 `solarSystem`, `earthOrbit` 和 `moonOrbit`
定义节点。

    var solarSystemNode = new Node();
    var earthOrbitNode = new Node();
    earthOrbitNode.localMatrix = m4.translation(100, 0, 0);  // 地球轨道离太阳 100 个单位距离
    var moonOrbitNode = new Node();
    moonOrbitNode.localMatrix = m4.translation(20, 0, 0);  // 月球离太阳 20 个单位距离

轨道距离将从原始节点中移除

    var earthNode = new Node();
    -// 地球离太阳 100 个单位距离
    -earthNode.localMatrix = m4.translation(100, 0, 0);
    -// 让地球变为两倍大小
    -earthNode.localMatrix = m4.scale(earthNode.localMatrix, 2, 2, 2);
    +earthNode.localMatrix = m4.scaling(2, 2, 2);   // 让地球变为两倍大小

    var moonNode = new Node();
    -moonNode.localMatrix = m4.translation(20, 0, 0);  // 月亮离地球 20 个单位距离

像这样连接它们

    // 关联物体
    sunNode.setParent(solarSystemNode);
    earthOrbitNode.setParent(solarSystemNode);
    earthNode.setParent(earthOrbitNode);
    moonOrbitNode.setParent(earthOrbitNode);
    moonNode.setParent(moonOrbitNode);

只需要更新轨道

    // 更新每个物体的局部矩阵
    -m4.multiply(m4.yRotation(0.01), sunNode.localMatrix  , sunNode.localMatrix);
    -m4.multiply(m4.yRotation(0.01), earthNode.localMatrix, earthNode.localMatrix);
    -m4.multiply(m4.yRotation(0.01), moonNode.localMatrix , moonNode.localMatrix);
    +m4.multiply(m4.yRotation(0.01), earthOrbitNode.localMatrix, earthOrbitNode.localMatrix);
    +m4.multiply(m4.yRotation(0.01), moonOrbitNode.localMatrix, moonOrbitNode.localMatrix);

    // 更新场景图中所有节点的世界矩阵
    -sunNode.updateWorldMatrix();
    +solarSystemNode.updateWorldMatrix();

你会看到地球是两倍大小，月球不是。

{{{example url="../webgl-scene-graph-solar-system-larger-earth-fixed.html" }}}

你可能注意到太阳和地球不会同步转动了，现在它们是独立的。

让我们调整一下。

    -sunNode.localMatrix = m4.translation(0, 0, 0);  // 太阳在中心
    +sunNode.localMatrix = m4.scaling(5, 5, 5);

    ...

    +moonNode.localMatrix = m4.scaling(0.4, 0.4, 0.4);

    ...
    // 更新每个物体的局部矩阵
    matrixMultiply(earthOrbitNode.localMatrix, m4.yRotation(0.01), earthOrbitNode.localMatrix);
    matrixMultiply(moonOrbitNode.localMatrix, m4.yRotation(0.01), moonOrbitNode.localMatrix);
    +// 旋转地球
    +m4.multiply(m4.yRotation(0.05), earthNode.localMatrix, earthNode.localMatrix);
    +// 旋转月亮
    +m4.multiply(m4.yRotation(-0.01), moonNode.localMatrix, moonNode.localMatrix);

{{{example url="../webgl-scene-graph-solar-system-adjusted.html" }}}

现在我们有一个 `localMatrix` 并且每一帧都会修改，这样会在运算过程中不断累积错误。
有一个解决方法叫做**正交归一化矩阵**，就算这样也不是绝对没问题。例如我们缩放到 0 再恢复，
只对一个 `x` 值施加变换

    x = 246;       // frame #0, x = 246

    scale = 1;
    x = x * scale  // frame #1, x = 246

    scale = 0.5;
    x = x * scale  // frame #2, x = 123

    scale = 0;
    x = x * scale  // frame #3, x = 0

    scale = 0.5;
    x = x * scale  // frame #4, x = 0  OOPS!

    scale = 1;
    x = x * scale  // frame #5, x = 0  OOPS!

最后会丢失值，我们可以添加其他的类从外部更新矩阵。让我们给 `Node` 的定义中添加一个 `source`。
如果 `source` 存在就从它那里获取局部矩阵。

    *var Node = function(source) {
      this.children = [];
      this.localMatrix = m4.identity();
      this.worldMatrix = m4.identity();
    +  this.source = source;
    };

    Node.prototype.updateWorldMatrix = function(matrix) {

    +  var source = this.source;
    +  if (source) {
    +    source.getMatrix(this.localMatrix);
    +  }

      ...

现在我们可以创建一个源。通常一个源会提供平移，旋转和缩放变换，就像这样

    var TRS = function() {
      this.translation = [0, 0, 0];
      this.rotation = [0, 0, 0];
      this.scale = [1, 1, 1];
    };

    TRS.prototype.getMatrix = function(dst) {
      dst = dst || new Float32Array(16);
      var t = this.translation;
      var r = this.rotation;
      var s = this.scale;

      // 通过平移，旋转和缩放计算矩阵
      m4.translation(t[0], t[1], t[2], dst);
      matrixMultiply(m4.xRotation(r[0]), dst, dst);
      matrixMultiply(m4.yRotation(r[1]), dst, dst);
      matrixMultiply(m4.zRotation(r[2]), dst, dst);
      matrixMultiply(m4.scaling(s[0], s[1], s[2]), dst, dst);
      return dst;
    };

然后这样使用它

    // 在初始化阶段用源初始化节点
    var someTRS  = new TRS();
    var someNode = new Node(someTRS);

    // 渲染阶段
    someTRS.rotation[2] += elapsedTime;

现在就不会有问题了，因为每次都会创建一个新的矩阵。

你可能回想我又不做太阳系，场景图有什么意义呢？
如果你想动画一个人物就可能需要这样一个场景图

{{{diagram url="resources/person-diagram.html" height="400" }}}

你想给手指和脚趾使用几个关节可以自己决定，关节越多动画的灵活性越强，所需要的运动数据也越多。
老一点的游戏例如 Virtua Fighter 有大约 15 个关节。二十世纪中叶的游戏有 30 到 70
个关节。如果把手的每个关节都做的话一个手就有至少 20 个关节，两个手就有 40 个，
大多数游戏大拇指使用一个关节，其他四个手指使用一个关节，以便节约时间（GPU/CPU 和 美工的时间）和内存。

这里有我做的一个方块人的例子，它的每个节点都用到了上方的 `TRS`，程序员的美术和动画能力简直了！FTW!  :P

{{{example url="../webgl-scene-graph-block-guy.html" }}}

你会在很多三维库中找到类似这样的场景图。

<div class="webgl_bottombar">
<h3>SetParent vs AddChild / RemoveChild</h3>
<p>大多数场景图有一个 <code>node.addChild</code> 方法和一个
 <code>node.removeChild</code>
方法，而我在上方定义了一个 <code>node.setParent</code> 方法。
哪种方式更好？理论上只是风格不同，但是我有一个客观的理由证明
<code>setParent</code> 比 <code>addChild</code> 要好一些，因为它可以让代码这样写。</p>
<pre class="prettyprint">
    someParent.addChild(someNode);
    ...
    someOtherParent.addChild(someNode);
</pre>
<p>什么意思呢？ <code>someNode</code> 是否同时存在于 <code>someParent</code> 和 <code>someOtherParent</code> 之中呢?
大多数场景图中这是不合理的，那第二次调用的时候会产生错误么？
<code>ERROR: Already have parent</code>。在 <code>someNode</code> 
添加到 <code>someOtherParent</code> 之前它自动从 <code>someParent</code> 移除了么？
如果移除了那么 <code>addChild</code> 就不是一个清晰的方法名。
</p>
<p><code>setParent</code> 就没有这样的问题</p>
<pre class="prettyprint">
    someNode.setParent(someParent);
    ...
    someNode.setParent(someOtherParent);
</pre>
<p>
在这个情况下它是 100% 明确的，没有歧义。
</div>



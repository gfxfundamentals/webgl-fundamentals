Title: WebGL 纹理映射的透视纠正
Description: W 有什么特殊的地方
TOC: WebGL 纹理映射的透视纠正


此文上接WebGL系列文章，第一个是[基础概念](webgl-fundamentals.html)，
这篇文章讲纹理映射的透视纠正，要理解它你可能需要先看看[透视投影](webgl-3d-perspective.html)
和[纹理](webgl-3d-textures.html)，你也需要知道[可变量以及它的用处](webgl-how-it-works.html)，但是我还会简短的介绍一下。

在"[工作原理](webgl-how-it-works.html)"中我们讲过了可变量的工作原理，
顶点着色器可以声明可变量并给它赋值，一旦顶点着色器被引用 3 次就会画一个三角形。
绘制这个三角形的每个像素都会调用片断着色器获得像素颜色，
在三个顶点之间的点会得到差之后的可变量。

{{{diagram url="resources/fragment-shader-anim.html" width="600" height="400" caption="v_color is interpolated between v0, v1 and v2" }}}

回到我们的[第一篇文章](webgl-fundamentals.html)，在裁剪空间中绘制一个三角形，
没有数学运算，只是传入裁剪空间坐标到一个简单的顶点着色器，像这样

      // 属性从缓冲中获取数据
      attribute vec4 a_position;

      // 所有的着色器都有一个 main 函数
      void main() {

        // gl_Position 是着色器需要设置的一个特殊的变量
        gl_Position = a_position;
      }

还有一个简单的片断着色器提供固定的颜色

      // 片断着色器没有默认的精度，
      // 中等精度是个不错的默认值
      precision mediump float;

      void main() {
        // gl_FragColor 是片断着色器需要设置的一个特殊变量
        gl_FragColor = vec4(1, 0, 0.5, 1); // 返回红紫色
      }

让我们在裁剪空间绘制两个矩形，为每个顶点传递`X`, `Y`, `Z`, 和 `W`。

    var positions = [
      -.8, -.8, 0, 1,  // 第一个矩形的第一个三角形
       .8, -.8, 0, 1,
      -.8, -.2, 0, 1,
      -.8, -.2, 0, 1,  // 第一个矩形的第二个三角形
       .8, -.8, 0, 1,
       .8, -.2, 0, 1,

      -.8,  .2, 0, 1,  // 第二个矩形的第一个三角形
       .8,  .2, 0, 1,
      -.8,  .8, 0, 1,
      -.8,  .8, 0, 1,  // 第二个矩形的第二个三角形
       .8,  .2, 0, 1,
       .8,  .8, 0, 1,
    ];

这是结果

{{{example url="../webgl-clipspace-rectangles.html" }}}

再添加一个浮点型可变量，并把它从顶点着色器直接传递到片断着色器

      attribute vec4 a_position;
    +  attribute float a_brightness;

    +  varying float v_brightness;

      void main() {
        gl_Position = a_position;

    +    // 直接传递亮度到片断着色器
    +    v_brightness = a_brightness;
      }

在片断着色器中使用可变量设置颜色

      precision mediump float;

    +  // 顶点着色器的值插值后传入这里
    +  varying float v_brightness;  

      void main() {
    *    gl_FragColor = vec4(v_brightness, 0, 0, 1);  // 红色
      }

我们需要给可变量提供数据，创建一个缓冲放入一些数据，每个顶点一个值，
我们将设置左边亮度为 0，右边亮度为 1。

```
  // 创建缓冲并放入 12 个亮度值
  var brightnessBuffer = gl.createBuffer();

  // 绑定到 ARRAY_BUFFER
  gl.bindBuffer(gl.ARRAY_BUFFER, brightnessBuffer);

  var brightness = [
    0,  // 第一个矩形的第一个三角形
    1, 
    0, 
    0,  // 第一个矩形的第二个三角形
    1, 
    1, 

    0,  // 第二个矩形的第一个三角形
    1, 
    0, 
    0,  // 第二个矩形的第二个三角形
    1, 
    1, 
  ];
  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(brightness), gl.STATIC_DRAW);
```

还需要在初始化阶段找到 `a_brightness` 的位置

```
  // 找到顶点数据的输入位置
  var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
+  var brightnessAttributeLocation = gl.getAttribLocation(program, "a_brightness");  
```

然后在渲染阶段设置属性

```
  // 启用属性
  gl.enableVertexAttribArray(brightnessAttributeLocation);

  // 绑定位置缓冲
  gl.bindBuffer(gl.ARRAY_BUFFER, brightnessBuffer);

  // 告诉属性如何从缓冲中读取数据
  var size = 1;          // 每次迭代读取一个单位数据
  var type = gl.FLOAT;   // 数据类型是 32 位浮点型
  var normalize = false; // 不用单位化
  var stride = 0;        // 每次迭代需要移动的距离
  var offset = 0;        // 从缓冲的起始处开始
  gl.vertexAttribPointer(
      brightnessAttributeLocation, size, type, normalize, stride, offset);
```

现在渲染后得到会得到两个矩形，左边 `brightness` 是 0 右边是 1，
中间的部分是插值（或可变量）。

{{{example url="../webgl-clipspace-rectangles-with-varying.html" }}}

在[透视投影的文章](webgl-3d-perspective.html)中我们知道WebGL会将放入 `gl_Position`
的值除以`gl_Position.w`。

在上方的顶点中我们提供的 `W` 值为 `1`，但是我们知道WebGL会除以 `W`，
所以做如下修改应该结果不变。

```
  var mult = 20;
  var positions = [
      -.8,  .8, 0, 1,  // 第一个矩形的第一个三角形
       .8,  .8, 0, 1,
      -.8,  .2, 0, 1,
      -.8,  .2, 0, 1,  // 第一个矩形的第二个三角形
       .8,  .8, 0, 1,
       .8,  .2, 0, 1,

      -.8       , -.2       , 0,    1,  // 第二个矩形的第一个三角形
       .8 * mult, -.2 * mult, 0, mult,
      -.8       , -.8       , 0,    1,
      -.8       , -.8       , 0,    1,  // 第二个矩形的第二个三角形
       .8 * mult, -.2 * mult, 0, mult,
       .8 * mult, -.8 * mult, 0, mult,
  ];
```

如上所示我们将第二个矩形右边的点的 `X` 和 `Y` 都乘以 `mult`，
同时设置 `W` 为 `mult`。由于WebGL会除以 `W` 所以我们应该得到相同的结果对么？

这是结果

{{{example url="../webgl-clipspace-rectangles-with-varying-non-1-w.html" }}}

注意两个矩形和上一个例子位置相同，事实是 `X * MULT / MULT(W)` 还是 `X`，
`Y` 也一样，但颜色却不同，为什么？

事实是WebGL使用 `W` 实现纹理映射或者可变量插值的透视投影。

如果将片断着色器改成这样就更容以看出效果

    gl_FragColor = vec4(fract(v_brightness * 10.), 0, 0, 1);  // 红色

将 `v_brightness` 乘以 10 就会是值的范围为 0 到 10，`fract` 会保留小数部分所以结果还是 0 到 1之间，
但是总共是 10 次 0 到 1 了。

{{{example url="../webgl-clipspace-rectangles-with-varying-non-1-w-repeat.html" }}}

现在应该更容易看出透视效果。

线性插值应该是这样的公式

     result = (1 - t) * a + t * b

`t` 的范围是 0 到 1，表示 `a` 到 `b` 之间的位置，0 表示在 `a` 点，1 表示在 `b` 点。

可变量经过 WebGL 的插值时使用这个公式

     result = (1 - t) * a / aW + t * b / bW
              -----------------------------
                 (1 - t) / aW + t / bW

`aW` 表示 `a` 点的 `W` 值，也就是 `gl_Position.w` 的值，而不一定等于缓冲中的值，
同理 `bW` 是设置在 `b` 点的 `gl_Position.w`。

为什么这个很重要？这有一个简单的纹理，使用[纹理文章](webgl-3d-textures.html)的例子，
并调整了 UV，每个面使用整张纹理，是一个 4×4 像素的纹理。

{{{example url="../webgl-perspective-correct-cube.html" }}}

现在将例子中的顶点着色器做一些修改，手工除以 `W`，只增加了一行代码

```
attribute vec4 a_position;
attribute vec2 a_texcoord;

uniform mat4 u_matrix;

varying vec2 v_texcoord;

void main() {
  // 将位置和矩阵相乘
  gl_Position = u_matrix * a_position;

+  // 手工除以 W
+  gl_Position /= gl_Position.w;

  // 将纹理坐标传到片断着色器
  v_texcoord = a_texcoord;
}
```
除以 `W` 意味值 `gl_Position.w` 始终为 1，`X`, `Y`, 和 `Z`
不会有什么影响，因为WebGL也会默认做除法，这是结果。

{{{example url="../webgl-non-perspective-correct-cube.html" }}}

我们还是得到了一个立方体，但是纹理变得扭曲了，这是因为没有传入 `W`
WebGL就不能正确的实现纹理的透视纠正，或者更准确地说，
WebGL就不能正确的对可变量的插值实现透视。

如果你还记得的话 `W` 就是[透视矩阵](webgl-3d-perspective.html)中的 `Z`，
当 `W` 始终为 `1` 时WebGL做的就是一个简单的线性插值，
事实上如果你拿着上述的等式

     result = (1 - t) * a / aW + t * b / bW
              -----------------------------
                 (1 - t) / aW + t / bW

设置所有的 `W` 为 1 就会得到

     result = (1 - t) * a / 1 + t * b / 1
              ---------------------------
                 (1 - t) / 1 + t / 1

除以 1 等于什么也没做，所以简化成这样
                 
     result = (1 - t) * a + t * b
              -------------------
                 (1 - t) + t

`(1 - t) + t = 1`，继续简化

     result = (1 - t) * a + t * b

就和上方提到的线性插值一样了。

现在就清楚为什么WebGL要使用 4x4 的矩阵和包含 `X`, `Y`, `Z`, 和 `W` 四个值的向量了吧。
`X` 和 `Y` 除以 `W` 得到裁剪空间坐标，`Z` 除以 `W` 也得到裁剪空间的 Z 坐标，
`W` 同时还为纹理映射的透视纠正提供了帮助。
<div class="webgl_bottombar">
<h3>二十世纪中叶的游戏机</h3>
<p>
一点小事，Playstation 1 和其他同一时代的游戏机都没有做纹理映射的透视纠正，
根据以上的信息你就能看出为什么路面是这样的了。
</p>
<div class="webgl_center"><img src="resources/ridge-racer-01.png" style="max-width: 500px;" /></div>
<p></p>
<div class="webgl_center"><img src="resources/ridge-racer-02.png" style="max-width: 500px;" /></div>
</div>

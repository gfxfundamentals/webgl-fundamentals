Title: WebGL 三维方向光源
Description: 如何在WebGL中实现方向光源

此文上接[WebGL 三维相机](webgl-3d-camera.html)，
如果没读建议[从那里开始](webgl-3d-camera.html)。

实施光照的方式有很多种，最简单的可能就是**方向光源**了。

方向光是指光照均匀地来自某一个方向，晴朗天气下的太阳经常被当作方向光源，
它距离太远所以光线被看作是平行的照到地面上。

计算方向光非常简单，将方向光的方向和面的朝向**点乘**就可以得到两个方向的余弦值。

这有个例子

{{{diagram url="resources/dot-product.html" caption="drag the points"}}}

随意拖动其中的点，如果两点方向刚好相反，点乘结果则为 -1。
如果方向相同结果为 1。

这有什么用呢？如果将三维物体的朝向和光的方向点乘，
结果为 1 则物体朝向和光照方向相同，为 -1 则物体朝向和光照方向相反。

{{{diagram url="resources/directional-lighting.html" caption="rotate the direction" width="500" height="400"}}}

我们可以将颜色值和点乘结果相乘，BOOM！有光了！

还有一个问题，我们如何知道三维物体的朝向？

## 法向量

我不知道为什么叫**法向量**，但是在三维图形学中法向量就是描述面的朝向的单位向量。

这是正方体和球体的一些法向量。

{{{diagram url="resources/normals.html"}}}

这些插在物体上的线就是对应顶点的法向量。

注意到正方体在每个顶角有 3 个法向量。 这是因为需要 3 个法向量去描述相邻的每个面的朝向。

这里的法向量是基于他们的方向着色的，正 x 方向为<span style="color: red;">红色</span>，
上方向为<span style="color: green;">绿色</span>，正 z 方向为<span style="color: blue;">蓝色</span>。

让我们来给[上节](webgl-3d-camera.html)中的 `F` 添加法向量。
由于 `F` 非常规则并且朝向都是 x, y, z轴，所以非常简单。正面的的部分法向量为 `0, 0, 1`，
背面的部分法向量为 `0, 0, -1`，左面为 `-1, 0, 0`，右面为 `1, 0, 0`，上面为 `0, 1, 0`，
然后底面为 `0, -1, 0`。

```
function setNormals(gl) {
  var normals = new Float32Array([
          // 正面左竖
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,

          // 正面上横
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,

          // 正面中横
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,

          // 背面左竖
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,

          // 背面上横
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,

          // 背面中横
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,

          // 顶部
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,

          // 上横右面
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // 上横下面
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,

          // 上横和中横之间
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // 中横上面
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,

          // 中横右面
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // 中横底面
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,

          // 底部右侧
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // 底面
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,

          // 左面
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0]);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
}
```

在代码中使用它们，先移除顶点颜色以便观察光照效果。

    // 找顶点着色器中的属性
    var positionLocation = gl.getAttribLocation(program, "a_position");
    -var colorLocation = gl.getAttribLocation(program, "a_color");
    +var normalLocation = gl.getAttribLocation(program, "a_normal");

    ...

    -// 创建一个缓冲存储颜色
    -var colorBuffer = gl.createBuffer();
    -// 绑定到 ARRAY_BUFFER
    -gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    -// 将几何数据放入缓冲
    -setColors(gl);

    +// 创建缓冲存储法向量
    +var normalBuffer = gl.createBuffer();
    +// 绑定到 ARRAY_BUFFER (可以看作 ARRAY_BUFFER = normalBuffer)
    +gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    +// 将法向量存入缓冲
    +setNormals(gl);

在渲染的时候

```
-// 启用颜色属性
-gl.enableVertexAttribArray(colorLocation);
-
-// 绑定颜色缓冲
-gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
-
-// 告诉颜色属性怎么从 colorBuffer (ARRAY_BUFFER) 中读取颜色值
-var size = 3;                 // 每次迭代使用3个单位的数据
-var type = gl.UNSIGNED_BYTE;  // 单位数据类型是无符号 8 位整数
-var normalize = true;         // 标准化数据 (从 0-255 转换到 0.0-1.0)
-var stride = 0;               // 0 = 移动距离 * 单位距离长度sizeof(type)  每次迭代跳多少距离到下一个数据
-var offset = 0;               // 从绑定缓冲的起始处开始
-gl.vertexAttribPointer(
-    colorLocation, size, type, normalize, stride, offset)

+// 启用法向量属性
+gl.enableVertexAttribArray(normalLocation);
+
+// 绑定法向量缓冲
+gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
+
+// 告诉法向量属性怎么从 normalBuffer (ARRAY_BUFFER) 中读取值
+var size = 3;          // 每次迭代使用3个单位的数据
+var type = gl.FLOAT;   // 单位数据类型是 32 位浮点型
+var normalize = false; // 单位化 (从 0-255 转换到 0-1)
+var stride = 0;        // 0 = 移动距离 * 单位距离长度sizeof(type)  每次迭代跳多少距离到下一个数据
+var offset = 0;        // 从绑定缓冲的起始处开始
+gl.vertexAttribPointer(
+    normalLocation, size, type, normalize, stride, offset)
```

现在让着色器使用它

首先在顶点着色器中只将法向量传递给片断着色器

    attribute vec4 a_position;
    -attribute vec4 a_color;
    +attribute vec3 a_normal;

    uniform mat4 u_matrix;

    -varying vec4 v_color;
    +varying vec3 v_normal;

    void main() {
      // 将位置和矩阵相乘
      gl_Position = u_matrix * a_position;

    -  // 将颜色传到片断着色器
    -  v_color = a_color;

    +  // 将法向量传到片段着色器
    +  v_normal = a_normal;
    }

然后在片断着色器中将法向量和光照方向点乘

```
precision mediump float;

// 从顶点着色器中传入的值
-varying vec4 v_color;
+varying vec3 v_normal;

+uniform vec3 u_reverseLightDirection;
+uniform vec4 u_color;

void main() {
+   // 由于 v_normal 是插值出来的，和有可能不是单位向量，
+   // 可以用 normalize 将其单位化。
+   vec3 normal = normalize(v_normal);
+
+   float light = dot(normal, u_reverseLightDirection);

*   gl_FragColor = u_color;

+   // 将颜色部分（不包括 alpha）和 光照相乘
+   gl_FragColor.rgb *= light;
}
```

Then we need to lookup the locations of `u_color` and `u_reverseLightDirection`.

```
  // lookup uniforms
  var matrixLocation = gl.getUniformLocation(program, "u_matrix");
+  var colorLocation = gl.getUniformLocation(program, "u_color");
+  var reverseLightDirectionLocation =
+      gl.getUniformLocation(program, "u_reverseLightDirection");

```

and we need to set them

```
  // Set the matrix.
  gl.uniformMatrix4fv(matrixLocation, false, worldViewProjectionMatrix);

+  // Set the color to use
+  gl.uniform4fv(colorLocation, [0.2, 1, 0.2, 1]); // green
+
+  // set the light direction.
+  gl.uniform3fv(reverseLightDirectionLocation, m4.normalize([0.5, 0.7, 1]));
```

`normalize`, which we went over before, will make whatever values we put in there
into a unit vector. The specific values in the sample are
`x = 0.5` which is positive `x` means the light is on the right pointing left.
`y = 0.7` which is positive `y` means the light is above pointing down.
`z = 1` which is positive `z` means the light is in front pointing into the scene.
the relative values means the the direction is mostly pointing into the scene
and poiting more down then right.

And here it is

{{{example url="../webgl-3d-lighting-directional.html" }}}

If you rotate the F you might notice something. The F is rotating
but the lighting isn't changing. As the F rotates we want whatever part
is facing the direction of the light to be the brightest.

To fix this we need to re-orient the normals as the object is re-oriented.
Like we did for positions we can multiply the normals by some matrix.  The
most obvious matrix would be the `world` matrix.  As it is right now we're
only passing in 1 matrix called `u_matrix`.  Let's change it to pass in 2
matrices.  One called `u_world` which will be the world matrix.  Another
called `u_worldViewProjection` which will be what we're currently passing
in as `u_matrix`

```
attribute vec4 a_position;
attribute vec3 a_normal;

*uniform mat4 u_worldViewProjection;
+uniform mat4 u_world;

varying vec3 v_normal;

void main() {
  // Multiply the position by the matrix.
*  gl_Position = u_worldViewProjection * a_position;

*  // orient the normals and pass to the fragment shader
*  v_normal = mat3(u_world) * a_normal;
}
```

Notice we are multiplying `a_normal` by `mat3(u_world)`. That's
because normals are a direction so we don't care about translation.
The orientation portion of the matrix is only in the top 3x3
area of the matrix.

Now we have to look those uniforms up

```
  // lookup uniforms
*  var worldViewProjetionLocation =
*      gl.getUniformLocation(program, "u_worldViewProjection");
+  var worldLocation = gl.getUniformLocation(program, "u_world");
```

And we have to change the code that updates them

```
*// Set the matrices
*gl.uniformMatrix4fv(
*    worldViewProjectionLocation, false,
*    worldViewProjectionMatrix);
*gl.uniformMatrix4fv(worldLocation, false, worldMatrix);
```

and here's that

{{{example url="../webgl-3d-lighting-directional-world.html" }}}

Rotate the F and notice which ever side is facing the light direction gets lit.

There is one problem which I don't know how to show directly so I'm
going to show it in a diagram. We're multiplying the `normal` by
the `u_world` matrix to re-orient the normals.
What happens if we scale the world matrix?
It turns out we get the wrong normals.

{{{diagram url="resources/normals-scaled.html" caption="click to toggle normals" width="600" }}}

I've never bothered to understand
the solution but it turns out you can get the inverse of the world matrix,
transpose it, which means swap the columns for rows, and use that instead
and you'll get the right answer.

In the diagram above the <span style="color: #F0F;">purple</span> sphere
is unscaled. The <span style="color: #F00;">red</span> sphere on the left
is scaled and the normals are being multiplied by the world matrix. You
can see something is wrong. The <span style="color: #00F;">blue</span>
sphere on the right is using the world inverse transpose matrix.

Click the diagram to cycle through different representations. You should
notice when the scale is extreme it's very easy to see the normals
on the left (world) are **not** staying perpendicular to the surface of the sphere
where as the ones on the right (worldInverseTranspose) are staying perpendicular
to the sphere. The last mode makes them all shaded red. You should see the lighting
on the 2 outer spheres is very different based on which matrix is used.
It's hard to tell which is correct which is why this is a subtle issue but
based on the other visualizations it's clear using the worldInverseTranspose
is correct.

To implement this in our example let's change the code like this.  First
we'll update the shader.  Techincally we could just update the value of
`u_world` but it's best if we rename things so they're named what they
actually are otherwise it will get confusing.

```
attribute vec4 a_position;
attribute vec3 a_normal;

uniform mat4 u_worldViewProjection;
*uniform mat4 u_worldInverseTranspose;

varying vec3 v_normal;

void main() {
  // Multiply the position by the matrix.
  gl_Position = u_worldViewProjection * a_position;

  // orient the normals and pass to the fragment shader
*  v_normal = mat3(u_worldInverseTranspose) * a_normal;
}
```

Then we need to look that up

```
-  var worldLocation = gl.getUniformLocation(program, "u_world");
+  var worldInverseTransposeLocation =
+      gl.getUniformLocation(program, "u_worldInverseTranspose");
```

And we need to compute and set it

```
var worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
var worldInverseMatrix = m4.inverse(worldMatrix);
var worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

// Set the matrices
gl.uniformMatrix4fv(
    worldViewProjectionLocation, false,
    worldViewProjectionMatrix);
-gl.uniformMatrix4fv(worldLocation, false, worldMatrix);
+gl.uniformMatrix4fv(
+    worldInverseTransposeLocation, false,
+    worldInverseTransposeMatrix);
```

and here's the code to transpose a matrix

```
var m4 = {
  transpose: function(m) {
    return [
      m[0], m[4], m[8], m[12],
      m[1], m[5], m[9], m[13],
      m[2], m[6], m[10], m[14],
      m[3], m[7], m[11], m[15],
    ];
  },

  ...
```

Because the effect is subtle and because we aren't scaling anything
there's no noticble difference but at least now we're prepared.

{{{example url="../webgl-3d-lighting-directional-worldinversetranspose.html" }}}

I hope this first step into lighting was clear.  Next up [point
lighting](webgl-3d-lighting-point.html).

<div class="webgl_bottombar">
<h3>Alternatives to mat3(u_worldInverseTranspose) * a_normal</h3>
<p>In our shader above there's a line like this</p>
<pre class="prettyprint">
v_normal = mat3(u_worldInverseTranspose) * a_normal;
</pre>
<p>We could have done this</p>
<pre class="prettyprint">
v_normal = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;
</pre>
<p>Because we set <code>w</code> to 0 before multiplying that would
end up multiplying the translation from the matrix by 0 effectively removing it. I think that's
the more common way to do it. The mat3 way looked cleaner to me but
I've often done it this way too.</p>
<p>Yet another solution would be to make <code>u_worldInverseTranspose</code> a <code>mat3</code>.
There are 2 reasons not to do that. One is we might have
other needs for the full <code>u_worldInverseTranspose</code> so passing the entire
<code>mat4</code> means we can use with for those other needs.
Another is that all of our matrix functions in JavaScript
make 4x4 matrices. Making a whole other set for 3x3 matrices
or even converting from 4x4 to 3x3 is work we'd rather
not do unless there was a more compelling reason.</p>
</div>

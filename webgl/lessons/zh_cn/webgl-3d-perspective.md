Title: WebGL 三维透视投影
Description: 在WebGL中如何实现三维透视投影

此文上接WebGL系列文章，从[基础概念](webgl-fundamentals.html)开始，
上一篇是[三维的基础内容](webgl-3d-orthographic.html)，如果没读过请从那里开始。

上一篇文章讲述了如何实现三维，那个三维用的不是透视投影，
而是的所谓的“正射”投影，但那不是我们日常观看三维的方式。

我们应使用透视投影代替它，但什么是透视投影？
它的基础特性就是离得越远显得越小。

<img class="webgl_center" width="500" src="../resources/perspective-example.svg" />

在上方的示例中，远处的物体会变小，想要实现例子中近大远小的效果，
简单的做法就是将裁减空间中的 X 和 Y 值除以 Z 值。

你可以这么想：如果一个线段是 (10, 15) 到 (20,15)，
它长度为十个单位，在当前的代码中它就是 10 个像素长，
但是如果我们将它除以 Z ，且 Z 值 为 1

<pre class="webgl_center">
10 / 1 = 10
20 / 1 = 20
abs(10-20) = 10
</pre>

它将是 10 个像素长，如果 Z 值为 2

<pre class="webgl_center">
10 / 2 = 5
20 / 2 = 10
abs(5 - 10) = 5
</pre>

就是 5 像素了，当 Z 值为 3 时

<pre class="webgl_center">
10 / 3 = 3.333
20 / 3 = 6.666
abs(3.333 - 6.666) = 3.333
</pre>

你可以看出随着 Z 变大距离就变远了，画的也会小一点。
如果我们除以裁剪空间中的 Z ，值可能会变大，因为 Z 
是一个较小的值(-1 到 +1)。但是我们可以提供一个
fudgeFactor 因子和 Z 相乘，这样就可以调整缩放的程度。

让我们来试试，首先修改顶点着色器，除以 Z 再乘以我们的
"fudgeFactor" 因子。

```
<script id="3d-vertex-shader" type="x-shader/x-vertex">
...
+uniform float u_fudgeFactor;
...
void main() {
  // 将位置和矩阵相乘
  vec4 position = u_matrix * a_position;

+  // 调整除数
+  float zToDivideBy = 1.0 + position.z * u_fudgeFactor;

*  // x 和 y 除以调整后的除数
*  gl_Position = vec4(position.xy / zToDivideBy, position.zw);
}
</script>
```

注意，由于裁减空间中的 Z 值是 -1 到 +1 的，所以 +1 是为了让
`zToDivideBy` 变成 0 到 +2 * fudgeFactor

还需要更新代码以设置 fudgeFactor。

```
  ...
  var fudgeLocation = gl.getUniformLocation(program, "u_fudgeFactor");

  ...
  var fudgeFactor = 1;
  ...
  function drawScene() {
    ...
    // 设置 fudgeFactor
    gl.uniform1f(fudgeLocation, fudgeFactor);

    // 绘制几何体
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 16 * 6;
    gl.drawArrays(primitiveType, offset, count);
```

这是结果。

{{{example url="../webgl-3d-perspective.html" }}}

如果效果不明显，可以将 "fudgeFactor" 滑块从 1.0 拖到 0.0
来对比没添加这些代码之前的样子。

<img class="webgl_center" src="../resources/orthographic-vs-perspective.png" />
<div class="webgl_center">orthographic vs perspective</div>

事实上WebGL会将我们提供给 `gl_Position` 的  x,y,z,w 值自动除以 w 。

我们可以通过修改着色器来证明，用 `zToDivideBy` 代替 `gl_Position.w`

```
<script id="2d-vertex-shader" type="x-shader/x-vertex">
...
uniform float u_fudgeFactor;
...
void main() {
  // 将位置和矩阵相乘
  vec4 position = u_matrix * a_position;

  // 调整除数
  float zToDivideBy = 1.0 + position.z * u_fudgeFactor;

  // 将 x y z 除以 zToDivideBy
*  gl_Position = vec4(position.xyz, zToDivideBy);

  // 传递颜色到给片断着色器
  v_color = a_color;
}
</script>
```

看他们多像。

{{{example url="../webgl-3d-perspective-w.html" }}}

为什么WebGL会自动除以 W ？因为使用矩阵的魔力，可以用把值从 z 传值到 w 。

一个这样的矩阵

<div class="webgl_math_center"><pre class="webgl_math">
1, 0, 0, 0,
0, 1, 0, 0,
0, 0, 1, 1,
0, 0, 0, 0,
</pre></div>

将会把 z 的值复制给 w ， 你可以把每列看作

<div class="webgl_math_center"><pre class="webgl_math">
x_out = x_in * 1 +
        y_in * 0 +
        z_in * 0 +
        w_in * 0 ;

y_out = x_in * 0 +
        y_in * 1 +
        z_in * 0 +
        w_in * 0 ;

z_out = x_in * 0 +
        y_in * 0 +
        z_in * 1 +
        w_in * 0 ;

w_out = x_in * 0 +
        y_in * 0 +
        z_in * 1 +
        w_in * 0 ;
</pre></div>

简化后得到

<div class="webgl_math_center"><pre class="webgl_math">
x_out = x_in;
y_out = y_in;
z_out = z_in;
w_out = z_in;
</pre></div>

如果 w 原来就是 1.0 就会加 1

<div class="webgl_math_center"><pre class="webgl_math">
1, 0, 0, 0,
0, 1, 0, 0,
0, 0, 1, 1,
0, 0, 0, 1,
</pre></div>

他会将 W 的运算变为

<div class="webgl_math_center"><pre class="webgl_math">
w_out = x_in * 0 +
        y_in * 0 +
        z_in * 1 +
        w_in * 1 ;
</pre></div>

因为 `w_in` = 1.0 是已知的

<div class="webgl_math_center"><pre class="webgl_math">
w_out = z_in + 1;
</pre></div>

最后可以将 fudgeFactor 像这样放入矩阵中

<div class="webgl_math_center"><pre class="webgl_math">
1, 0, 0, 0,
0, 1, 0, 0,
0, 0, 1, fudgeFactor,
0, 0, 0, 1,
</pre></div>

相当于

<div class="webgl_math_center"><pre class="webgl_math">
w_out = x_in * 0 +
        y_in * 0 +
        z_in * fudgeFactor +
        w_in * 1 ;
</pre></div>

简化后为

<div class="webgl_math_center"><pre class="webgl_math">
w_out = z_in * fudgeFactor + 1;
</pre></div>

So, let's modify the program again to just use matrices.

First let's put the vertex shader back. It's simple again

```
<script id="2d-vertex-shader" type="x-shader/x-vertex">
uniform mat4 u_matrix;

void main() {
  // Multiply the position by the matrix.
  gl_Position = u_matrix * a_position;
  ...
}
</script>
```

Next let's make a function to make our Z &rarr; W matrix.

```
function makeZToWMatrix(fudgeFactor) {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, fudgeFactor,
    0, 0, 0, 1,
  ];
}
```

and we'll change the code to use it.

```
    ...
    // Compute the matrices
*    var matrix = makeZToWMatrix(fudgeFactor);
*    matrix = m4.multiply(matrix, m4.projection(gl.canvas.clientWidth, gl.canvas.clientHeight, 400));
    matrix = m4.translate(matrix, translation[0], translation[1], translation[2]);
    matrix = m4.xRotate(matrix, rotation[0]);
    matrix = m4.yRotate(matrix, rotation[1]);
    matrix = m4.zRotate(matrix, rotation[2]);
    matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);

    ...
```

and note, again, it's exactly the same.

{{{example url="../webgl-3d-perspective-w-matrix.html" }}}

All that was basically just to show you that dividing by Z gives us
perspective and that WebGL conveniently does this divide by Z for us.

But there are still some problems.  For example if you set Z to around
-100 you'll see something like the animation below

<img class="webgl_center" src="resources/z-clipping.gif" style="border: 1px solid black;" />

What's going on?  Why is the F disappearing early?  Just like WebGL clips
X and Y or +1 to -1 it also clips Z.  What we're seeing here is where Z <
-1.

I could go into detail about the math to fix it but [you can derive
it](http://stackoverflow.com/a/28301213/128511) the same way we did 2D
projection.  We need to take Z, add some amount and scale some amount and
we can make any range we want get remapped to the -1 to +1.

The cool thing is all of these steps can be done in 1 matrix.  Even
better, rather than a `fudgeFactor` we'll decide on a `fieldOfView` and
compute the right values to make that happen.

Here's a function to build the matrix.

```
var m4 = {
  perspective: function(fieldOfViewInRadians, aspect, near, far) {
    var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
    var rangeInv = 1.0 / (near - far);

    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0
    ];
  },

  ...
```

This matrix will do all our conversions for us.  It will adjust the units
so they are in clip space, it will do the math so that we can choose a
field of view by angle and it will let us choose our Z-clipping space.  It
assumes there's an *eye* or *camera* at the origin (0, 0, 0) and given a
`zNear` and a `fieldOfView` it computes what it would take so that stuff
at `zNear` ends up at `Z = -1` and stuff at `zNear` that is half of
`fieldOfView` above or below the center ends up with `Y = -1` and `Y = 1`
respectively.  It computes what to use for X by just multiplying by the
`aspect` passed in.  We'd normally set this to the `width / height` of the
display area.  Finally, it figures out how much to scale things in Z so
that stuff at zFar ends up at `Z = 1`.

Here's a diagram of the matrix in action.

{{{example url="../frustum-diagram.html" width="400" height="600" }}}

That shape that looks like a 4 sided cone the cubes are spinning in is
called a "frustum".  The matrix takes the space inside the frustum and
converts that to clip space.  `zNear` defines where things will get
clipped in the front and `zFar` defines where things get clipped in the
back.  Set `zNear` to 23 and you'll see the front of the spinning cubes
get clipped.  Set `zFar` to 24 and you'll see the back of the cubes get
clipped.

There's just one problem left.  This matrix assumes there's a viewer at
0,0,0 and it assumes it's looking in the negative Z direction and that
positive Y is up.  Our matrices up to this point have done things in a
different way.  To make this work we need to put our objects in front of
the view.

We could do that by moving our F.  We were drawing at (45, 150, 0).  Let's
move it to (-150, 0, -360)

Now, to use it we just need to replace our old call to `m4.projection`
with a call to `m4.perspective`

```
var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
var zNear = 1;
var zFar = 2000;
var matrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);
matrix = m4.translate(matrix, translation[0], translation[1], translation[2]);
matrix = m4.xRotate(matrix, rotation[0]);
matrix = m4.yRotate(matrix, rotation[1]);
matrix = m4.zRotate(matrix, rotation[2]);
matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);
```

And here it is.

{{{example url="../webgl-3d-perspective-matrix.html" }}}

We're back to just a matrix multiply and we're getting both a field of
view and we're able to choose our Z space.  We're not done but this
article is getting too long.  Next up, [cameras](webgl-3d-camera.html).

<div class="webgl_bottombar">
<h3>Why did we move the F so far in Z (-360)?</h3>
<p>

In the other samples we had the F at (45, 150, 0) but in the last sample
it's been moved to (-150, 0, -360).  Why did it need to be moved so far
away?

</p>
<p>

The reason is up until this last sample our <code>m4.projection</code> function
has made a projection from pixels to clip space.  That means the area we
were displaying represented 400x300 pixels.  Using 'pixels' really doesn't
make sense in 3D.  The new projection makes a frustum that makes it so the
area represented at <code>zNear</code> is 2 units tall and 2 * aspect units wide.
Since our 'F' is 150 units big and the view can only see 2 units when it's
at zNear we need to move it pretty far away from the origin to see it all.

</p>
<p>

Similarly we moved 'X' from 45 to -150.  Again, the view used to represent
0 to 400 units across.  Now it represents -1 to +1 units across.

</p>
</div>



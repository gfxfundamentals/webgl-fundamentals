Title: WebGL性能优化 - 实例化绘制
Description: 绘制同一物体的多个实例
TOC: 实例化绘制

WebGL有一个拓展叫做*实例化绘制*。
一般来说，使用这种方法绘制多个相同的物体比一个一个绘制要快得多。

注意这项功能对于WebGL 1是一项可选的拓展，但是很明显它可以在
[几乎所有的设备上使用](https://webglstats.com/webgl/extension/ANGLE_instanced_arrays)。

首先让我们来演示一下如何绘制同一物体的多个实例。

下面的代码*类似*于我们在
[正射投影](webgl-3d-orthographic.html)
这篇文章中的结尾部分。我们先来看下面两个着色器的代码。

```html
<!-- 顶点着色器 -->
<script id="vertex-shader-3d" type="x-shader/x-vertex">
attribute vec4 a_position;
uniform mat4 matrix;

void main() {
  // 顶点位置与矩阵相乘。
  gl_Position = matrix * a_position;
}
</script>
```

and

```html
<!-- 片元着色器 -->
<script id="fragment-shader-3d" type="x-shader/x-fragment">
precision mediump float;

uniform vec4 color;

void main() {
  gl_FragColor = color;
}
</script>  
```

在顶点着色器里我们像[那篇文章](webgl-3d-orthographic.html)
一样让实例的每个顶点与一个矩阵相乘，因为这样非常的灵活。
在片元着色器中则使用通过uniform传递的颜色变量。

要进行绘制我们得先编译着色器并连接为一个program，
然后再找到所有attribute和uniform的地址。

```js
const program = webglUtils.createProgramFromScripts(
    gl, ['vertex-shader-3d', 'fragment-shader-3d']);

const positionLoc = gl.getAttribLocation(program, 'a_position');
const colorLoc = gl.getUniformLocation(program, 'color');
const matrixLoc = gl.getUniformLocation(program, 'matrix');
```

之后我们需要使用一个缓冲区提供顶点数据。

```js
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -0.1,  0.4,
    -0.1, -0.4,
     0.1, -0.4,
     0.1, -0.4,
    -0.1,  0.4,
     0.1,  0.4,
     0.4, -0.1,
    -0.4, -0.1,
    -0.4,  0.1,
    -0.4,  0.1,
     0.4, -0.1,
     0.4,  0.1,
  ]), gl.STATIC_DRAW);
const numVertices = 12;
```

让我们绘制5个实例，并给每个实例分别提供1个矩阵和1种颜色。

```js
const numInstances = 5;
const matrices = [
  m4.identity(),
  m4.identity(),
  m4.identity(),
  m4.identity(),
  m4.identity(),
];

const colors = [
  [ 1, 0, 0, 1, ],  // 红色
  [ 0, 1, 0, 1, ],  // 绿色
  [ 0, 0, 1, 1, ],  // 蓝色
  [ 1, 0, 1, 1, ],  // 紫红色
  [ 0, 1, 1, 1, ],  // 青色
];
```

要绘制它们我们首先得使用着色器程序，并设置attribute，
然后在一个循环当中为这5个实例分别计算新的矩阵，
再去设置矩阵和颜色的uniform，最后把它们绘制出来。

```js
function render(time) {
  time *= 0.001; // seconds

  gl.useProgram(program);

  // 设置顶点位置的attribute
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(
      positionLoc,  // location
      2,            // size (每次迭代从缓冲区里取出的数量)
      gl.FLOAT,     // 缓冲区中的数据类型
      false,        // 归一化
      0,            // stride (0 = 根据size和数据类型进行推断)
      0,            // offset in buffer
  );

  matrices.forEach((mat, ndx) => {
    m4.translation(-0.5 + ndx * 0.25, 0, 0, mat);
    m4.zRotate(mat, time * (0.1 + 0.1 * ndx), mat);

    const color = colors[ndx];

    gl.uniform4fv(colorLoc, color);
    gl.uniformMatrix4fv(matrixLoc, false, mat);

    gl.drawArrays(
        gl.TRIANGLES,
        0,             // offset
        numVertices,   // 每个实例的顶点数量
    );
  });

  requestAnimationFrame(render);
}
requestAnimationFrame(render);
```

注意到这个数学矩阵库里所有关于矩阵函数的最后一个参数都是一个可选的
目标矩阵。在其它大多数文章里我们并没有用到这个参数，而是让它自行创建一个
新的矩阵，但这一次我们想让结果存放在已经创建好的矩阵上。

于是乎我们得到了5个不同颜色而且还在自转的加号。

{{{example url="../webgl-instanced-drawing-not-instanced.html"}}}

对于每个实例来说，每绘制一次要调用一次`gl.uniform4v`，`gl.uniformMatrix4fv`
还有`gl.drawArrays`，一共是15个WebGL的函数调用。如果我们的着色器
更加复杂，像是[聚光灯那篇文章](webgl-3d-lighting-spot.html)一样的话，
每个物体至少要有7次函数调用，分别是6次调用`gl.uniformXXX`，
最后一次调用`gl.drawArrays`。如果我们要绘制400个物体的话
那将会是2800个WebGL函数调用。

实例化就是一个帮助我们减少函数调用的好路子。
它的工作原理是让你告诉WebGL你想绘制多少次相同的物体（实例的数量）。
对于每个attribute，你可以让它每次调用顶点着色器时迭代到缓冲区的
*下一个值*（默认行为），或者是每绘制N（N通常为1）个实例时才迭代到
*下一个值*。

举个栗子，我们不妨使用attribute来提供`matrix`和`color`的值以取代uniform。
我们会在缓冲区里为每个实例提供矩阵和颜色，设置好从缓冲区里读取数据的
attribute，然后告诉WebGL只有在绘制下一个实例的时候才迭代到下一个值。

Let's do it!

第一件要做的事是启用这项可选的WebGL拓展。它叫做
[`ANGLE_instanced_arrays`](https://developer.mozilla.org/en-US/docs/Web/API/ANGLE_instanced_arrays)。

```js
const canvas = document.querySelector('#canvas');
const gl = canvas.getContext('webgl');
if (!gl) {
  return;
}

+const ext = gl.getExtension('ANGLE_instanced_arrays');
+if (!ext) {
+  return alert('need ANGLE_instanced_arrays');
+}
```

接下来我们改一下这些着色器，用attribute给`matrix`和`color`提供数据。

```html
<!-- 顶点着色器 -->
<script id="vertex-shader-3d" type="x-shader/x-vertex">
attribute vec4 a_position;
-uniform mat4 matrix;
+attribute vec4 color;
+attribute mat4 matrix;
+
+varying vec4 v_color;

void main() {
  // 顶点位置与矩阵相乘
  gl_Position = matrix * a_position;

+  // 传递颜色到片元着色器
+  v_color = color;
}
</script>
```

and 

```html
<!-- 片元着色器 -->
<script id="fragment-shader-3d" type="x-shader/x-fragment">
precision mediump float;

-uniform vec4 color;
+// Passed in from the vertex shader.
+varying vec4 v_color;

void main() {
-  gl_FragColor = color;
+  gl_FragColor = v_color;
}
</script>  
```

因为attribute只能在顶点着色器中声明所以我们需要用varying
把颜色传递到片元着色器。

然后我们需要找到所有attribute的位置。

```js
const program = webglUtils.createProgramFromScripts(
    gl, ['vertex-shader-3d', 'fragment-shader-3d']);

const positionLoc = gl.getAttribLocation(program, 'a_position');
-const colorLoc = gl.getUniformLocation(program, 'color');
-const matrixLoc = gl.getUniformLocation(program, 'matrix');
+const colorLoc = gl.getAttribLocation(program, 'color');
+const matrixLoc = gl.getAttribLocation(program, 'matrix');
```

现在，我们需要一个缓冲区来储存所有一会我们要提供给attribute的矩阵。
因为缓冲区最好在一个*chuck*中更新，所以我们把所有的矩阵放在一个
`Float32Array`当中。

```js
// 为每一个实例设置矩阵
const numInstances = 5;
+// make a typed array with one view per matrix
+const matrixData = new Float32Array(numInstances * 16);
```

然后我们再为每一个矩阵创建一个更小的`Float32Array`的观察视图。

```js
-const matrices = [
-  m4.identity(),
-  m4.identity(),
-  m4.identity(),
-  m4.identity(),
-  m4.identity(),
-];
const matrices = [];
for (let i = 0; i < numInstances; ++i) {
  const byteOffsetToMatrix = i * 16 * 4;
  const numFloatsForView = 16;
  matrices.push(new Float32Array(
      matrixData.buffer,
      byteOffsetToMatrix,
      numFloatsForView));
}
```

这样做的话我们可以用`matrixData`来取得所有矩阵的数据，
当需要取得某一个矩阵的数据的时候只要用`matrices[ndx]`即可。

同时我们也需要在GPU上创建缓冲区来储存这些数据。
目前只需要申请一段合适大小的缓冲区就好了，我们暂时不需要提供数据给它，
所以`gl.bufferData`第二个参数设置为要为缓冲区申请的字节数。

```js
const matrixBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
// 只为缓冲区申请特定大小的空间
gl.bufferData(gl.ARRAY_BUFFER, matrixData.byteLength, gl.DYNAMIC_DRAW);
```
注意到最后一个参数是`gl.DYNAMIC_DRAW`。这是一个给WebGL的*指示*，
告诉它我们要经常刷新这里的数据。

接下来颜色值也需要储存在缓冲区当中。因为在这个例子当中颜色不会改变，
所以我们直接上传数据即可。

```js
-const colors = [
-  [ 1, 0, 0, 1, ],  // red
-  [ 0, 1, 0, 1, ],  // green
-  [ 0, 0, 1, 1, ],  // blue
-  [ 1, 0, 1, 1, ],  // magenta
-  [ 0, 1, 1, 1, ],  // cyan
-];
+// 为每一个实例设置颜色
+const colorBuffer = gl.createBuffer();
+gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
+gl.bufferData(gl.ARRAY_BUFFER,
+    new Float32Array([
+        1, 0, 0, 1,  // red
+        0, 1, 0, 1,  // green
+        0, 0, 1, 1,  // blue
+        1, 0, 1, 1,  // magenta
+        0, 1, 1, 1,  // cyan
+      ]),
+    gl.STATIC_DRAW);
```

在绘制的时候，我们再也不用在循环中设置矩阵和颜色的uniform，
而是先来计算一下每个实例的矩阵。

```js
// 更新所有矩阵
matrices.forEach((mat, ndx) => {
  m4.translation(-0.5 + ndx * 0.25, 0, 0, mat);
  m4.zRotate(mat, time * (0.1 + 0.1 * ndx), mat);

-  const color = colors[ndx];
-
-  gl.uniform4fv(colorLoc, color);
-  gl.uniformMatrix4fv(matrixLoc, false, mat);
-
-  gl.drawArrays(
-      gl.TRIANGLES,
-      0,             // offset
-      numVertices,   // num vertices per instance
-  );
});
```

因为我们的矩阵已经作为了目标矩阵参数来传递，同时它还是一个
`Float32Array`的数组，所以在计算完以后我们就可以把数据直接上传给GPU了。

```js
// 上传新的矩阵数据
gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
gl.bufferSubData(gl.ARRAY_BUFFER, 0, matrixData);
```

现在我们需要为矩阵和颜色设置attribute。
注意矩阵的类型为`mat4`，一个`mat4`实际上占用了4个attribute槽位。

```js
const bytesPerMatrix = 4 * 16;
for (let i = 0; i < 4; ++i) {
  const loc = matrixLoc + i;
  gl.enableVertexAttribArray(loc);
  // 注意stride和offset
  const offset = i * 16;  // 一行有4个单精度浮点数，1个就占用4字节
  gl.vertexAttribPointer(
      loc,              // location
      4,                // size (num values to pull from buffer per iteration)
      gl.FLOAT,         // type of data in buffer
      false,            // normalize
      bytesPerMatrix,   // stride, num bytes to advance to get to next set of values
      offset,           // offset in buffer
  );
  // 这行说的是attribute只对下一个实例才进行迭代
  ext.vertexAttribDivisorANGLE(loc, 1);
}
```

要进行实例化绘制最重要的其实是调用`ext.vertexAttribDivisorANGLE`，
它告诉attribute只有在绘制下一个实例的时候才迭代到下一个值。
意思是说，`matrix` attribute会对于第一个实例的所有顶点使用
第一个矩阵，第二个实例使用第二个矩阵以此类推。

接下来我们还需要去设置颜色的attribute。

```js
// 为颜色设置attribute
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.enableVertexAttribArray(colorLoc);
gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
// this line says this attribute only changes for each 1 instance
ext.vertexAttribDivisorANGLE(colorLoc, 1);
```

还有一点你要牢记，我们已经在这两个attribute上设置了divisor，
如果我们想要绘制其它东西的话我们需要把divisor重新设置为0（默认）。
**或者，我们有更好的选择——**[vertex array objects](webgl-attributes.html#vaos)。

最后我们总算是可以在一个draw call当中绘制所有的实例了。

```js
ext.drawArraysInstancedANGLE(
  gl.TRIANGLES,
  0,             // offset
  numVertices,   // 每个实例的顶点数
  numInstances,  // 实例的数量
);
```

{{{example url="../webgl-instanced-drawing.html"}}}

在之前的例子当中每个实例需要三次函数调用，所以一共是15次的调用。
但是现在我们只需要总共两次函数调用即可，第一次上传所有的矩阵数据，
第二次就是请求绘制了。对于这个例子来说，只要稍微设置一下矩阵和颜色
就可以请求绘制了，我们还可以用[vertex array object](webgl-attributes.html#vaos)
把这些设置从渲染的时候移动到初始化的时候。

我不知道我是不是显得有点啰嗦了，还有一点我想说的是，上面的代码我们并没有
考虑到关于canvas方面的东西。我是说，我们并没有使用任何的
[投影矩阵](webgl-3d-orthographic.html)或是[视图矩阵](webgl-3d-camera.html)。
因为我们只是为了去演示如何实例化绘制罢了。如果你想往里加点投影或是视图矩阵的话，
那将意味着更多的计算会放到JavaScript当中，
这可能会引起一些性能问题。有个更好的办法是给顶点着色器添加一到两个
uniform来储存这些矩阵。

```html
<!-- 顶点着色器 -->
<script id="vertex-shader-3d" type="x-shader/x-vertex">
attribute vec4 a_position;
attribute vec4 color;
attribute mat4 matrix;
+uniform mat4 projection;
+uniform mat4 view;

varying vec4 v_color;

void main() {
  // Multiply the position by the matrix.
-  gl_Position = matrix * a_position;
+  gl_Position = projection * view * matrix * a_position;

  // Pass the vertex color to the fragment shader.
  v_color = color;
}
</script>
```

然后在初始化的时候找到他们的位置

```js
const positionLoc = gl.getAttribLocation(program, 'a_position');
const colorLoc = gl.getAttribLocation(program, 'color');
const matrixLoc = gl.getAttribLocation(program, 'matrix');
+const projectionLoc = gl.getUniformLocation(program, 'projection');
+const viewLoc = gl.getUniformLocation(program, 'view');
```

然后再渲染的时候设置它们。

```js
gl.useProgram(program);

+// 设置视图和投影矩阵
+// 因为对于所有实例来说它们是一样的
+const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
+gl.uniformMatrix4fv(projectionLoc, false,
+    m4.orthographic(-aspect, aspect, -1, 1, -1, 1));
+gl.uniformMatrix4fv(viewLoc, false, m4.zRotation(time * .1));
```

{{{example url="../webgl-instanced-drawing-projection-view.html"}}}

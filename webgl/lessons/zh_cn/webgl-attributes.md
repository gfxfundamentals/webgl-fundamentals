Title: WebGL 属性
Description: WebGL 中的属性是什么？
TOC: WebGL 属性

这篇文章是想形象的介绍如何在 WebGL 中设置属性状态。
有一篇类似的文章 [关于纹理单元](webgl-texture-units.html)。

作为前置条件，你可能需要先阅读 [WebGL 是如何工作的](webgl-how-it-works.html) 和 [WebGL 着色器和 GLSL](https://webglfundamentals.org/webgl/lessons/webgl-shaders-and-glsl.html)

## 属性

在 WebGL 中，属性是顶点着色器的输入，从缓冲中获取数据。
当 `gl.drawArrays` 或 `gl.drawElements` 被调用时，WebGL 会多次执行用户提供的顶点着色器。
每次迭代时，属性定义了如何从它们绑定的缓冲中读取数据，并提供给顶点着色器内的属性。

如果用 JavaScript 实现，它们看起来可能像这样：

```js
// 伪代码
const gl = {
  arrayBuffer: null,
  vertexArray: {
    attributes: [
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0, },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0, },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0, },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0, },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0, },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0, },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0, },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0, },
    ],
    elementArrayBuffer: null,
  },
}
```

可以看到上面有 8 个属性。

当你调用 `gl.enableVertexAttribArray(location)` 或 `gl.disableVertexAttribArray` 时，你可以想象它是这样的：

```js
// 伪代码
gl.enableVertexAttribArray = function(location) {
  const attrib = gl.vertexArray.attributes[location];
  attrib.enable = true;
};

gl.disableVertexAttribArray = function(location) {
  const attrib = gl.vertexArray.attributes[location];
  attrib.enable = false;
};
```

换句话说，参数 location 直接对应属性的索引。

类似的， `gl.vertexAttribPointer` 用来设置几乎所有其它属性设置。
它实现起来像这样：

```js
// 伪代码
gl.vertexAttribPointer = function(location, size, type, normalize, stride, offset) {
  const attrib = gl.vertexArray.attributes[location];
  attrib.size = size;
  attrib.type = type;
  attrib.normalize = normalize;
  attrib.stride = stride ? stride : sizeof(type) * size;
  attrib.offset = offset;
  attrib.buffer = gl.arrayBuffer;  // !!!! <-----
};
```

注意，当我们调用 `gl.vertexAttribPointer` 时，`attrib.buffer` 会被设置成当前 `gl.arrayBuffer` 的值。
上面伪代码中，通过调用 `gl.bindBuffer(gl.ARRAY_BUFFER, someBuffer)` 来设置 `gl.arrayBuffer` 的值。

```js
// 伪代码
gl.bindBuffer = function(target, buffer) {
  switch (target) {
    case ARRAY_BUFFER:
      gl.arrayBuffer = buffer;
      break;
    case ELEMENT_ARRAY_BUFFER;
      gl.vertexArray.elementArrayBuffer = buffer;
      break;
  ...
};
```

接下来是顶点着色器。在顶点着色器中，声明属性。例如：

```glsl
attribute vec4 position;
attribute vec2 texcoord;
attribute vec3 normal;

...

void main() {
  ...
}
```

当调用 `gl.linkProgram(someProgram)` 将顶点着色器和片段着色器链接在一起，
WebGL （驱动/ GPU /浏览器）决定了每个属性的索引/存储单元。
除非你手动分配了存储单元（见下面），否则你不知道你会选到哪个。
这由浏览器/驱动/ GPU 决定。
所以，必须查询顶点位置、纹理座标和法线对应的属性，通过调用 `gl.getAttribLocation`。

```js
const positionLoc = gl.getAttribLocation(program, 'position');
const texcoordLoc = gl.getAttribLocation(program, 'texcoord');
const normalLoc = gl.getAttribLocation(program, 'normal');
```

假设 `positionLoc` = `5`，意思是当顶点着色器执行（当调用 `gl.drawArrays` 或 `gl.drawElements`）时,
顶点着色器预期你给属性 5 设置了正确的类型、大小、偏移、步长、缓冲等。

注意，在你链接到着色程序之前，你可以调用 `gl.bindAttribLocation(program, location, nameOfAttribute)`
来选择存储单元。例如：

```js
// 告诉 `gl.linkProgram` 将 `position` 分配给属性 #7
gl.bindAttribLocation(program, 7, 'position');
```

## 完整的属性状态

上面没有提到的是，每个属性都有默认值。没有提到是因为通常不这么使用。

```js
attributes: [
   { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?,
   　divisor: 0, value: [0, 0, 0, 1], },
   { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?,
   　divisor: 0, value: [0, 0, 0, 1], },
   ..
```

可以通过各个 `gl.vertexAttribXXX` 函数来设置每个属性的值。当 `enable` 为 false 时，该值被使用。
当 `enable` 为 true 时，属性从分配的缓冲取值。

<a id="vaos"></a>

## 顶点数组对象 (VAO)

WebGL 有一个扩展，`OES_vertex_array_object`。

`OES_vertex_array_object` 扩展让你创建、替换 `vertexArray`。也就是：

```js
const vao = ext.createVertexArrayOES();
```

创建了你在上面 *伪代码* 中看到的赋予 `gl.vertexArray` 的对象。
调用 `ext.bindVertexArrayOES(vao)` 将创建的顶点数组对象分配给当前顶点数组。

```js
// 伪代码
ext.bindVertexArrayOES = function(vao) {
  gl.vertexArray = vao ? vao : defaultVAO;
};
```

这让你在当前 VAO 中设置所有属性和 `ELEMENT_ARRAY_BUFFER`，
这样，当你想要绘制特定形状时，只要调用 `ext.bindVertexArrayOES` 一次就能有效地设置所有属性。
当没有扩展时，对于 **每个属性**，都要调用一次 `gl.bindBuffer` 和 `gl.vertexAttribPointer`（可能还有 `gl.enableVertexAttribArray`)

可以看到使用顶点数组对象是件好事。
但要使用它们通常需要更多的有组织的代码。
比如，在一个着色器中用 `gl.TRIANGLES` 绘制一个立方体，然后在另一个着色器中用 `gl.LINES` 再绘制一次。
假设使用三角形绘制时，光线使用法线，像这样在着色器中定义属性：

```glsl
// lighting-shader
// 通过三角形绘制立方体的着色器

attribute vec4 a_position;
attribute vec3 a_normal;
```

然后像在 [关于方向光源的文章](webgl-3d-lighting-directional.html) 中提到的那样使用位置和法线。

对于线，你不想要光线，你想要单一的颜色，所以你写了和 [第一篇文章](webgl-fundamentals.html) 差不多的着色器。
为颜色定义了全局变量。这意味着在顶点着色器中只需要顶点位置。

```glsl
// solid-shader
// 通过线绘制立方体的着色器

attribute vec4 a_position;
```

我们不知道对于每个着色器，属性的存储单元在哪儿。
假设对于上面的 lighting-shader，存储单元是

```
a_position location = 1
a_normal location = 0
```

对于只有一个属性的 solid-shader

```
a_position location = 0
```

很明显，如果切换着色器，我们需要区别的设置属性。
一个着色器期待 `a_position` 的值出现在属性 0 的位置，另一个着色器期待它出现在属性 1 的位置。

重新设置属性需要额外的工作。
更糟的是，使用顶点数组对象是为了帮助我们，而不是让我们做更多的工作。
要解决这个问题，我们要在链接到着色器程序之前绑定存储单元。

我们 **在调用 gl.linkProgram 之前** 告诉 WebGL

```js
gl.bindAttribLocation(solidProgram, 0, 'a_position');
gl.bindAttribLocation(lightingProgram, 0, 'a_position');
gl.bindAttribLocation(lightingProgram, 1, 'a_normal');
```

这告诉 WebGL 在链接着色器时，对应分配的存储单元。
现在我们可以对这两个着色器使用同一个 VAO 了。

## 属性数量的最大值

WebGL 要求至少支持 8 个属性。但特定的电脑/浏览器/实现/驱动可以支持更多。
可以通过下面的代码来查询有多少属性可以支持：

```js
const maxAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
```

如果你决定使用多于 8 个属性，你最好检查一下支持的数量，
并通知你的用户它们的机器不支持更多属性或者回退使用更简单的着色器。


Title: WebGL 矩阵 vs 数学中的矩阵
Description: WebGL 的约定和数学中的区别
TOC: WebGL 矩阵 vs 数学中的矩阵


这篇文章是有关多篇文章中提到的矩阵的，尤其是 [介绍矩阵的文章](webgl-2d-matrices.html)，
也包括 [介绍 3D 的文章](webgl-3d-orthographic.html)，[关于透视投影的文章](webgl-3d-perspective.html) 
和 [关于相机的文章](webgl-3d-camera.html)。

在编程领域中，行通常是从左到右的，列是从上到下。

> ## col·umn
> /ˈkäləm/
>
> *名词*
> 1. 一根直立的柱子，通常是圆柱形的，由石头或混凝土制成，支撑着一个底座、拱门或其他结构，或作为一个纪念碑单独存在。
>
>    *同义词*：pillar, post, pole, upright, vertical, ...
>
> 2. 页面或文本的竖直分割线。

> ## row
> /rō/
>
> *名词*
> * 表格条目中的水平线。

可以在我们的软件中看到例子。
比如我的文本编辑器就显示行和列（译者注：原文中这里用了 line，和 row 是一样的）。

<div class="webgl_center"><img src="resources/editor-lines-and-columns.gif" class="gman-border-bshadow" style="width: 372px;"></div>

注意左下角区域的状态栏，显示了行和列。

在电子表格中，我们看到行是横向的：

<div class="webgl_center"><img src="resources/spreadsheet-row.png" style="width: 808px; filter: brightness(0.9);" class="nobg"></div>

而列是竖向的：

<div class="webgl_center"><img src="resources/spreadsheet-column.png" style="width: 808px; filter: brightness(0.9);" class="nobg"></div>

所以，当我们用 JavaScript 为 WebGL 创建 3x3 和 4x4 矩阵时，它们看起来是这样的：

```js
const m3x3 = [
  0, 1, 2,  // 行 0
  3, 4, 5,  // 行 1
  6, 7, 8,  // 行 2
];

const m4x4 = [
   0,  1,  2,  3,  // 行 0
   4,  5,  6,  7,  // 行 1
   8,  9, 10, 11,  // 行 2
  12, 13, 14, 15,  // 行 3
];
```

很明显，根据约定，`m3x3` 的第一行是 `0, 1, 2`，`m4x4` 的最后一行是 `12, 13, 14, 15`。

在 [第一篇关于矩阵的文章](webgl-2d-matrices.html) 中我们看到，创建一个标准的 WebGL 3x3 2D 变换矩阵，
变换的值 `tx` 和 `ty` 是在位置 6 和 7 上。

```js
const some3x3TranslationMatrix = [
   1,  0,  0,
   0,  1,  0,
  tx, ty,  1,
];
```

或者对于在 [第一篇关于 3D 的文章](webgl-3d-orthographic.html) 中介绍的 4x4 矩阵，变换值位于 12, 13, 14：

```js
const some4x4TranslationMatrix = [
   1,  0,  0,  0,
   0,  1,  0,  0,
   0,  0,  1,  0,
  tx, ty, tz,  1,
];
```

但是，这有一个问题。在数学约定中，矩阵通常是竖着来的。数学家可能会这么写变换矩阵：

<div class="webgl_center"><img src="resources/3x3-math-translation-matrix.svg" style="width: 120px;"></div>

4x4 变换矩阵像这样：

<div class="webgl_center"><img src="resources/4x4-math-translation-matrix.svg" style="width: 150px;"></div>

这给了我们一个问题。
如果我们想要像数学中那样写矩阵，4x4 矩阵就像这样：

```js
const some4x4TranslationMatrix = [
   1,  0,  0,  tx,
   0,  1,  0,  ty,
   0,  0,  1,  tx,
   0,  0,  0,  1,
];
```

不幸的是，这样做也有问题。像 [关于相机的文章](webgl-3d-camera.html) 中提到的，4x4 矩阵中每列都有特殊的含义。

第一、二、三列通常对应 x，y 和 z 轴。最后一列是位置或变换值。

在代码中，将这些部分单独拿出来让人不快。想要获得 z 轴？你得这样做：

```js
const zAxis = [
  some4x4Matrix[2],
  some4x4Matrix[6],
  some4x4Matrix[10],
];
```

ಠ_ಠ !

所以，WebGL 和 WebGL 基于的 OpenGL ES 的做法是，将行称为列：

```js
const some4x4TranslationMatrix = [
   1,  0,  0,  0,   // 这是列 0
   0,  1,  0,  0,   // 这是列 1
   0,  0,  1,  0,   // 这是列 2
  tx, ty, tz,  1,   // 这是列 3
];
```

现在它和数学定义一样了。和上面的例子比较，如果我们想要获取 z 轴，只需要：

```js
const zAxis = some4x4Matrix.slice(8, 11);
```

对于熟悉 C++ 的人，OpenGL 要求 4x4 矩阵中的 16 个值在内存中是连续的，
所以在 C++ 中我们可以创建一个 `Vec4` 结构体或类:

```c++
// C++
struct Vec4 {
  float x;
  float y;
  float z;
  float w;
};
```

然后我们可以用 4 个结构体创建 4x4 矩阵：

```c++
// C++
struct Mat4x4 {
  Vec4 x_axis;
  Vec4 y_axis;
  Vec4 z_axis;
  Vec4 translation;
}
```

或者：

```c++
// C++
struct Mat4x4 {
  Vec4 column[4];
}
```

这样就可以了。

但不幸的是当你在代码中申明这样一个矩阵时，它和数学中的版本一点也不像:

```C++
// C++
Mat4x4 someTranslationMatrix = {
  {  1,  0,  0,  0, },
  {  0,  1,  0,  0, },
  {  0,  0,  1,  0, },
  { tx, ty, tz,  1, },
};
```

或者回到 JavaScript，没有像 C++ 一样的结构体：

```js
const someTranslationMatrix = [
   1,  0,  0,  0,
   0,  1,  0,  0,
   0,  0,  1,  0,
  tx, ty, tz,  1,
];
```

所以，通过这个约定，将行称为“列”，让一些事情变简单了，却让其它的事变复杂了，如果你是一个数学相关的人。

我提到这些事，是因为这篇文章是以程序员的视角来写的，不是数学相关人的视角。
就像每一个一维数组一样，二维数组中行也是横向的。

```js
const someTranslationMatrix = [
   1,  0,  0,  0,  // 行 0
   0,  1,  0,  0,  // 行 1
   0,  0,  1,  0,  // 行 2
  tx, ty, tz,  1,  // 行 3
];
```

或

```js
// 笑脸图片
const dataFor7x8OneChannelImage = [
    0, 255, 255, 255, 255, 255,   0,  // 行 0
  255,   0,   0,   0,   0,   0, 255,  // 行 1
  255,   0, 255,   0, 255,   0, 255,  // 行 2
  255,   0,   0,   0,   0,   0, 255,  // 行 3
  255,   0, 255,   0, 255,   0, 255,  // 行 4
  255,   0, 255, 255, 255,   0, 255,  // 行 5
  255,   0,   0,   0,   0,   0, 255,  // 行 6
    0, 255, 255, 255, 255, 255,   0,  // 行 7
]
```

所以所有的文章中，都会将它们当作行。

如果你是个和数学相关的人，你可能感到困惑。
对此我感到抱歉，我也想不出解决方法。
我可以将行 3 称为列，但这和编程中的概念不一致，会造成困惑。

无论如何，希望这能阐明为什么这些解释看起来和数学书中一点也不一样。
它们符合编程中的约定。
希望这对使用数学约定的人有用，并不造成困惑。


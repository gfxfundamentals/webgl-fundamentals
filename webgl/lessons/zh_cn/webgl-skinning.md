Title: WebGL 蒙皮
Description: 在WebGL中如何蒙皮网格
TOC: WebGL 蒙皮


图形学中的蒙皮是根据多矩阵的加权影响来移动一组顶点。这很抽象。

它被称为*蒙皮*因为通常使3D角色拥有由骨骼“bone”组成的骨架“skeleton”，在这里骨骼“bone”是矩阵的另一种表述方式，并对**每个顶点**设置每个骨骼对该顶点的影响。

举个例子一个角色手部的骨骼对于靠近手的顶点的影响几乎是100%，脚部的骨骼对于这些顶点则不会有影响。手腕附近的顶点会受手骨一些影响还会受臂骨一些影响。

基本你需要骨骼(这只是矩阵层级的一种奇妙描述方法)和权重。权重是每个顶点从0到1的值表示某一骨骼矩阵对此顶点位置的影响程度。至于数据，权重有点像顶点颜色。每个顶点有一组权重。换句话说权重放在缓冲中通过属性提供。

通常你限制每个顶点的一部分权重数量，因为否则会有太多的数据。一个角色可拥有位于任何地方的15个骨骼(VR 战士1)到150-300个骨骼(许多现代游戏)。
如果你有300个骨骼，那么每个顶点需要300个权重对应300个骨骼。如果你有10000个顶点就会需要3百万个权重。

所以，大多数实时蒙皮系统限制每个顶点~4个权重。通常这是在导出器／转换器中完成的，从像blender／maya／3dsmax的3D软件包中获取数据，并对于每个顶点找到最大的四个权重并归一化这些权重。

伪代码示例，非蒙皮顶点通常会像这样计算

    gl_Position = projection * view * model * position;

蒙皮顶点像这样被有效计算

    gl_Position = projection * view *
                  (bone1Matrix * position * weight1 +
                   bone2Matrix * position * weight2 +
                   bone3Matrix * position * weight3 +
                   bone4Matrix * position * weight4);

正如你看到的那样，每个顶点计算四个不同的位置，然后通过应用权重融合成一个。

假设你将骨骼矩阵存储在全局变量数组中, 并且通过属性传入权重以及是哪个骨骼的权重，你应该会这样做

    attribute vec4 a_position;
    attribute vec4 a_weights;         // 每个顶点4个权重
    attribute vec4 a_boneNdx;         // 4个骨骼下标
    uniform mat4 bones[MAX_BONES];    // 每个骨骼1个矩阵

    gl_Position = projection * view *
                  (bones[int(a_boneNdx[0])] * a_position * a_weight[0] +
                   bones[int(a_boneNdx[1])] * a_position * a_weight[1] +
                   bones[int(a_boneNdx[2])] * a_position * a_weight[2] +
                   boneS[int(a_boneNdx[3])] * a_position * a_weight[3]);


这还有一个问题。假设你有一个人的模型，原点(0,0,0)在两脚之间的地上。

<div class="webgl_center"><img src="resources/bone-head.svg" style="width: 500px;"></div>

假设你放一个矩阵matrix/骨骼bone/关节joint在头的位置，并想用它作为蒙皮的骨骼。简单起见，假设你只设定了头部的顶点有1.0的权重对于头部骨骼，其他地方的关节不影响这些顶点。

<div class="webgl_center"><img src="resources/bone-head-setup.svg" style="width: 500px;"></div>

这会有一个问题。头部顶点在原点上方2个单位。头部骨骼也在原点上方2个单位。如果你真的将头部顶点和头部骨骼矩阵相乘，你将得到原点上方4个单位的顶点位置。原本顶点的2个单位 + 头部骨骼矩阵的2个单位。

<div class="webgl_center"><img src="resources/bone-head-problem.svg" style="width: 500px;"></div>

一种解决方案是存储"绑定姿势"，这是每个关节的额外矩阵，你用矩阵来作用于顶点位置之前的位置。这个例子，头部矩阵的绑定姿势比原点高2个单位。所以现在你可以使用该矩阵的逆来减去额外的2个矩阵。

换句话说，传递给着色器的骨骼矩阵每个都乘以了他们的绑定姿势的逆矩阵，以便只影响从原有位置的变化，相对于网格原点。

我们举一个例子。我们将制作像这样的格子动画

<div class="webgl_center"><img src="resources/skinned-mesh.svg" style="width: 400px;"></div>

* `b0`, `b1`和 `b2`是骨骼矩阵。
* `b1`是`b0`的子，`b2`是`b1`的子
* 点`0,1`对于骨骼b0的权重为1.0 
* 点`2,3`对于骨骼b0和骨骼b1的权重都为0.5
* 点`4,5`对于骨骼b1的权重为1.0 
* 点`6,7`对于骨骼b1和骨骼b2的权重都为0.5 
* 点`8,9`对于骨骼b2的权重为1.0

我们会使用[码少趣多](webgl-less-code-more-fun.html)文章中介绍的utils.

首先我们需要顶点位置和影响每个顶点的每个骨骼下标以及0到1的数字权重表示这个骨骼的影响量。

```
var arrays = {
  position: {
    numComponents: 2,
    data: [
     0,  1,  // 0
     0, -1,  // 1
     2,  1,  // 2
     2, -1,  // 3
     4,  1,  // 4
     4, -1,  // 5
     6,  1,  // 6
     6, -1,  // 7
     8,  1,  // 8
     8, -1,  // 9
    ],
  },
  boneNdx: {
    numComponents: 4,
    data: [
      0, 0, 0, 0,  // 0
      0, 0, 0, 0,  // 1
      0, 1, 0, 0,  // 2
      0, 1, 0, 0,  // 3
      1, 0, 0, 0,  // 4
      1, 0, 0, 0,  // 5
      1, 2, 0, 0,  // 6
      1, 2, 0, 0,  // 7
      2, 0, 0, 0,  // 8
      2, 0, 0, 0,  // 9
    ],
  },
  weight: {
    numComponents: 4,
    data: [
     1, 0, 0, 0,  // 0
     1, 0, 0, 0,  // 1
    .5,.5, 0, 0,  // 2
    .5,.5, 0, 0,  // 3
     1, 0, 0, 0,  // 4
     1, 0, 0, 0,  // 5
    .5,.5, 0, 0,  // 6
    .5,.5, 0, 0,  // 7
     1, 0, 0, 0,  // 8
     1, 0, 0, 0,  // 9
    ],
  },

  indices: {
    numComponents: 2,
    data: [
      0, 1,
      0, 2,
      1, 3,
      2, 3, //
      2, 4,
      3, 5,
      4, 5,
      4, 6,
      5, 7, //
      6, 7,
      6, 8,
      7, 9,
      8, 9,
    ],
  },
};
// 调用gl.createBuffer, gl.bindBuffer, gl.bufferData
var bufferInfo = webglUtils.createBufferInfoFromArrays(gl, arrays);
```

我们定义全局变量包括对应每个骨骼的矩阵

```
// 4个矩阵, 每个骨骼一个
var numBones = 4;
var boneArray = new Float32Array(numBones * 16);

var uniforms = {
  projection: m4.orthographic(-20, 20, -10, 10, -1, 1),
  view: m4.translation(-6, 0, 0),
  bones: boneArray,
  color: [1, 0, 0, 1],
};
```

在boneArray中创建视图，每个矩阵一个

```
// 为所有骨骼创建视图
// 在一个数组中以便上传，但是是分割的
// 数学计算用到的数组
var boneMatrices = [];  // 全局变量数据
var bones = [];         // 乘以绑定矩阵的逆之前的值
var bindPose = [];      // 绑定矩阵
for (var i = 0; i < numBones; ++i) {
  boneMatrices.push(new Float32Array(boneArray.buffer, i * 4 * 16, 16));
  bindPose.push(m4.identity());  // 仅仅分配存储空间
  bones.push(m4.identity());     // 仅仅分配存储空间
}
```

接下来是一些计算骨骼矩阵的代码。我们仅仅是在层级中旋转他们就像手指的骨头一样。

```
// 旋转每个骨骼角度，模拟一个层级
function computeBoneMatrices(bones, angle) {
  var m = m4.identity();
  m4.zRotate(m, angle, bones[0]);
  m4.translate(bones[0], 4, 0, 0, m);
  m4.zRotate(m, angle, bones[1]);
  m4.translate(bones[1], 4, 0, 0, m);
  m4.zRotate(m, angle, bones[2]);
  // bones[3]没有用
}
```

现在调用一次来生成他们的初始位置（绑定姿势），用结果来计算绑定姿势矩阵的逆。

```
// 计算每个矩阵的初始位置
computeBoneMatrices(bindPose, 0);

// 计算他们的逆
var bindPoseInv = bindPose.map(function(m) {
  return m4.inverse(m);
});
```

现在我们可以开始渲染

首先我们为骨骼设置动画，为每个骨骼计算一个新的世界矩阵

```
var t = time * 0.001;
var angle = Math.sin(t) * 0.8;
computeBoneMatrices(bones, angle);
```

之后我们将结果乘以绑定姿势的逆来解决之前提到的问题

```
// 每个都乘以绑定矩阵的逆
bones.forEach(function(bone, ndx) {
  m4.multiply(bone, bindPoseInv[ndx], boneMatrices[ndx]);
});
```

然后就是所有常规的步骤，设置属性，设置全局变量，渲染

```
gl.useProgram(programInfo.program);
// 调用gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);

// 调用gl.uniformXXX, gl.activeTexture, gl.bindTexture
webglUtils.setUniforms(programInfo, uniforms);

// 调用gl.drawArrays or gl.drawIndices
webglUtils.drawBufferInfo(gl, bufferInfo, gl.LINES);
```

这是结果

{{{example url="../webgl-skinning.html" }}}

红线是*蒙皮*网格。绿线和蓝线分别代表每个骨骼或者“关节”的x轴和y轴。你可以看到顶点是如何受多个骨骼影响并在他们之间移动的。我们没有介绍如何绘制骨骼，因为它对于解释蒙皮怎么工作不重要。如果你感兴趣参见代码。

注意: 骨骼bones vs 关节joints 让人迷惑。都指的是1件事情，*矩阵*。
但是，在3d模型包中通常画一个gizmo(一个ui部件)
在矩阵之间。最终看起来像骨骼一样。关节是矩阵所处的位置，他们从一个关节到下一个画一条线或锥体使它看起来像一个骨架。

<div class="webgl_center">
  <img src="resources/bone-display.png" style="width: 351px;">
  <div class="caption"><a href="https://www.blendswap.com/blends/view/66412">LowPoly Man</a> by <a href="https://www.blendswap.com/user/TiZeta">TiZeta</a></div>
</div>

另一个需要注意的小事，上面的例子权重和骨骼下标使用的是浮点数，可以使用`UNSIGNED_BYTE`来节省一些空间。

不幸的是着色器中可以使用的全局变量的数量是有限制的。对WebGL比较低的限制是64个vec4，即8个mat4 你可能需要一些全局变量用于其他的事情像片断着色器中的`color` 以及`projection`和`view`这意味着如果我们在一个限制为64个vec4的设备上，我们只能有5个骨骼！查看
[WebGLStats](https://webglstats.com/webgl/parameter/MAX_VERTEX_UNIFORM_VECTORS)
大多数设备支持128个vec4，其中70%支持256个vec4 但是对于上面的例子，这分别只有13个骨骼和29个骨骼。13对于90年代VR战士1风格的角色尚且不够，29与现代游戏中使用的数字相距甚远。

关于这个问题有很多方法。一个是离线预处理模型并打破它们为多个部分，每个使用不超过N个骨骼。这很复杂并带来了自身的一系列问题。

另一种是将骨骼矩阵存储在纹理中。一个重要的启示纹理不仅仅是图片，它们实际上是你可以传递给着色器的随机访问的2D数组数据，你可以使用它们做各种事情，不仅仅是读取图像。

让我们用纹理传递矩阵来绕过全局变量的限制问题。让其简单我们准备使用浮点型纹理。浮点型纹理是WebGL的可选功能但是幸运的是大多数设备支持它。

这是获得扩展的代码。如果它失败了，我们可能要告诉用户他们运气不好或者选择其他解决方案。

```
var ext = gl.getExtension('OES_texture_float');
if (!ext) {
  return;  // 扩展在这个设备上不存在
}
```

让我们更新着色器从纹理中获取矩阵。
我们会制作每行一个矩阵的纹理。纹理的每个纹素texel
有R，G，B和A，这是4个值所以每个矩阵我们只需4个像素，一个像素对应矩阵的每一行。纹理在某一纬度上的限制通常至少2048个像素，所以这会给我们至少2048的骨骼矩阵的空间，这已足够。

```
attribute vec4 a_position;
attribute vec4 a_weight;
attribute vec4 a_boneNdx;

uniform mat4 projection;
uniform mat4 view;
*uniform sampler2D boneMatrixTexture;
*uniform float numBones;

+// 这些偏移假设纹理每行4像素
+#define ROW0_U ((0.5 + 0.0) / 4.)
+#define ROW1_U ((0.5 + 1.0) / 4.)
+#define ROW2_U ((0.5 + 2.0) / 4.)
+#define ROW3_U ((0.5 + 3.0) / 4.)
+
+mat4 getBoneMatrix(float boneNdx) {
+  float v = (boneNdx + 0.5) / numBones;
+  return mat4(
+    texture2D(boneMatrixTexture, vec2(ROW0_U, v)),
+    texture2D(boneMatrixTexture, vec2(ROW1_U, v)),
+    texture2D(boneMatrixTexture, vec2(ROW2_U, v)),
+    texture2D(boneMatrixTexture, vec2(ROW3_U, v)));
+}

void main() {

  gl_Position = projection * view *
*                (getBoneMatrix(a_boneNdx[0]) * a_position * a_weight[0] +
*                 getBoneMatrix(a_boneNdx[1]) * a_position * a_weight[1] +
*                 getBoneMatrix(a_boneNdx[2]) * a_position * a_weight[2] +
*                 getBoneMatrix(a_boneNdx[3]) * a_position * a_weight[3]);

}
```

<a id="texel-coords"></a>需要注意的一点是，纹理中像素的纹理坐标是从它们的边缘计算的。像我们在[纹理](webgl-3d-textures.html)的文章中提到的纹理坐标从0到1。0是最左边缘的像素，1是最右边缘的像素。如果你有宽度为3像素的纹理，那就像这样。

<div class="webgl_center"><img src="resources/texel-coords.svg" style="width: 400px;"></div>

选取某个特定像素，那么公式是

     (x + .5) / width

上面的每个像素是

     (0 + .5) / 3  = 0.166
     (1 + .5) / 3 =  0.5
     (2 + .5) / 3 =  0.833

或者

<div class="webgl_center"><img src="resources/texel-coords-middle.svg" style="width: 400px;"></div>

现在我们设定一个放入骨骼矩阵的纹理

```
// 准备纹理来存骨骼矩阵
var boneMatrixTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, boneMatrixTexture);
// 因为我们希望使用纹理的原始数据
// 我们关闭筛选
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
// 也关闭包裹，因为纹理也许不是2的幂
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
```

我们会用全局变量传递纹理和骨骼的数量

```
var uniforms = {
  projection: m4.orthographic(-20, 20, -10, 10, -1, 1),
  view: m4.translation(-6, 0, 0),
*  boneMatrixTexture,
*  numBones,
  color: [1, 0, 0, 1],
};
```

然后我们唯一需要改变的是在渲染时用最新的骨骼矩阵更新纹理

```
// 用此时的矩阵更新纹理
gl.bindTexture(gl.TEXTURE_2D, boneMatrixTexture);
gl.texImage2D(
    gl.TEXTURE_2D,
    0,         // 层级
    gl.RGBA,   // 内部格式
    4,         // 4像素宽,每个像素RGBA4个通道所以4像素是16个值
    numBones,  // 每个骨骼一行
    0,         // 边框
    gl.RGBA,   // 格式
    gl.FLOAT,  // 类型
    boneArray);
```

结果是一样的，但我们已经解决了没有足够的全局变量来传递矩阵的问题

{{{example url="../webgl-skinning-bone-matrices-in-texture.html" }}}

所以这就是蒙皮的基础知识。写呈现蒙皮网格的代码并不困难。更困难的部分实际上是获取数据。你通常需要一些3D软件像blender/maya/3d studio max，然后要么写你自己的导出器或者找到一个导出器提供所有你需要的数据。你会看到像我们介绍的一样加载蒙皮相较于展示它会有10倍多的代码，这还不包括大约20-30倍多的代码从3D程序中导出的导出器。题外话这部分通常是人们写他们的3D引擎通常忽略的。引擎是简单的部分😜

将会有很多代码，所以让我们先尝试显示未蒙皮的模型。

让我们尝试加载一个glTF文件。 [glTF](https://www.khronos.org/gltf/)是为WebGL而设计的。在网上我找到了这个[虎鲸文件](https://www.blendswap.com/blends/view/65255)是[Junskie Pastilan](https://www.blendswap.com/user/pasilan)制作的。

<div class="webgl_center"><img src="../resources/models/killer_whale/thumbnail.jpg"></div>

glTF有两种格式。`.gltf`格式是一个JSON文件通常引用一个 `.bin`文件，这是一个二进制文件通常只包含几何体，可能包含动画数据。另一种格式是`.glb`二进制格式。通常是JSON和其他文件连接到一个二进制文件内，每个连接部分之间有一个短头和一个大小／类型描述。对于JavaScript，我认为`.gltf`格式稍微容易上手，所以让我们尝试加载它。

首先我下载了[.blend文件](https://www.blendswap.com/blends/view/65255)，安装[blender](https://blender.org)，安装[gltf导出器](https://github.com/KhronosGroup/glTF-Blender-IO)，blender中加载文件并导出。

<div class="webgl_center"><img src="resources/blender-killer-whale.png" style="width: 700px;" class="nobg"></div>

> 快速说明：3D软件像Blender，Maya，3DSMax是极其复杂的软件，有1000多种选项。当我在1996年第一次学习3DSMax时，我大约3周每天花2-3小时阅读1000多页的手册，通过教程工作。几年后，当我学习Maya时，我做了类似的事情。Blender同样复杂并且更甚它与几乎所有其他软件的界面非常不同。你应该花费一些时间来学习你决定使用的3D软件包。

导出之后我用文本编辑器打开.gltf文件并浏览了一下。我用这个[表](https://www.khronos.org/files/gltf20-reference-guide.pdf)来弄清楚格式。

我想说明下面的代码不是一个完美的gltf加载器，只是足以展示鲸鱼的代码。我怀疑如果我们尝试不同的文件，我们会遇到需要更改的区域。

首先要做的事情是加载文件。简单起见，我们使用JavaScript的[async/await](https://javascript.info/async-await)。首先我们写一些代码来加载`.gltf` 文件和它引用的文件。

```
async function loadGLTF(url) {
  const gltf = await loadJSON(url);

  // 加载所有gltf文件相关连的文件
  const baseURL = new URL(url, location.href);
  gltf.buffers = await Promise.all(gltf.buffers.map((buffer) => {
    const url = new URL(buffer.uri, baseURL.href);
    return loadBinary(url.href);
  }));

  ...

async function loadFile(url, typeFunc) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`could not load: ${url}`);
  }
  return await response[typeFunc]();
}

async function loadBinary(url) {
  return loadFile(url, 'arrayBuffer');
}

async function loadJSON(url) {
  return loadFile(url, 'json');
}
```

现在我们需要遍历数据将其连接起来。

首先让我们着手于glTF如何定义一个网格。网格是图元的集合。图元实际上是渲染所需的缓冲和属性。让我们使用[码少趣多](webgl-less-code-more-fun.html)文章中实现的webglUtils。我们将遍历网格，为每个网格创建一个传递给`webglUtils.setBuffersAndAttributes`的`BufferInfo`。回忆 `BufferInfo`实际上只是属性信息，及下标如果有的话，和传递给`gl.drawXXX`的元素数量。举个例子一个只有位置和法线的立方体会具有如下结构的BufferInfo

```
const cubeBufferInfo = {
  attribs: {
    'a_POSITION': { buffer: WebGLBuffer, type: gl.FLOAT, numComponents: 3, },
    'a_NORMAL': { buffer: WebGLBuffer, type: gl.FLOAT, numComponents: 3, },
  },
  numElements: 24,
  indices: WebGLBuffer,
  elementType: gl.UNSIGNED_SHORT,
}
```

所以我们将遍历每个图元生成一个像这样的BufferInfo。

图元有一组属性，每个属性引用一个访问器。访问器描述是哪种数据，例如`VEC3`/`gl.FLOAT`并引用一个视图缓冲。给定一个访问器下标，我们可以编写一些代码来返回一个WebGLBuffer，其中包含加载的数据，访问器和，缓冲视图的stride。

```
// 给定一个访问器下标返回一个访问器, WebGLBuffer和一个stride
function getAccessorAndWebGLBuffer(gl, gltf, accessorIndex) {
  const accessor = gltf.accessors[accessorIndex];
  const bufferView = gltf.bufferViews[accessor.bufferView];
  if (!bufferView.webglBuffer) {
    const buffer = gl.createBuffer();
    const target = bufferView.target || gl.ARRAY_BUFFER;
    const arrayBuffer = gltf.buffers[bufferView.buffer];
    const data = new Uint8Array(arrayBuffer, bufferView.byteOffset, bufferView.byteLength);
    gl.bindBuffer(target, buffer);
    gl.bufferData(target, data, gl.STATIC_DRAW);
    bufferView.webglBuffer = buffer;
  }
  return {
    accessor,
    buffer: bufferView.webglBuffer,
    stride: bufferView.stride || 0,
  };
}
```

我们也需要一个将glTF访问器的type类型转换为数字的方法

```
function throwNoKey(key) {
  throw new Error(`no key: ${key}`);
}

const accessorTypeToNumComponentsMap = {
  'SCALAR': 1,
  'VEC2': 2,
  'VEC3': 3,
  'VEC4': 4,
  'MAT2': 4,
  'MAT3': 9,
  'MAT4': 16,
};

function accessorTypeToNumComponents(type) {
  return accessorTypeToNumComponentsMap[type] || throwNoKey(type);
}
```

现在我们已经创建了这些函数，我们可以使用他们来设置网格

注意：glTF文件可以定义材质，但是导出器并没有导出任何材质到文件内，即使已经勾选了导出材质的选项。我只能猜测在blender中导出器不处理任何材质。我们会使用默认材质如果文件中没有材质的话。因为这个文件中没有任何材质，这里没有使用glTF材质的代码。

```
const defaultMaterial = {
  uniforms: {
    u_diffuse: [.5, .8, 1, 1],
  },
};

// 设置网格
gltf.meshes.forEach((mesh) => {
  mesh.primitives.forEach((primitive) => {
    const attribs = {};
    let numElements;
    for (const [attribName, index] of Object.entries(primitive.attributes)) {
      const {accessor, buffer, stride} = getAccessorAndWebGLBuffer(gl, gltf, index);
      numElements = accessor.count;
      attribs[`a_${attribName}`] = {
        buffer,
        type: accessor.componentType,
        numComponents: accessorTypeToNumComponents(accessor.type),
        stride,
        offset: accessor.byteOffset | 0,
      };
    }

    const bufferInfo = {
      attribs,
      numElements,
    };

    if (primitive.indices !== undefined) {
      const {accessor, buffer} = getAccessorAndWebGLBuffer(gl, gltf, primitive.indices);
      bufferInfo.numElements = accessor.count;
      bufferInfo.indices = buffer;
      bufferInfo.elementType = accessor.componentType;
    }

    primitive.bufferInfo = bufferInfo;

    // 存储图元的材质信息
    primitive.material = gltf.materials && gltf.materials[primitive.material] || defaultMaterial;
  });
});
```

现在每个图元都有一个`bufferInfo`和一个`material`属性。

对于蒙皮，我们通常需要某种场景图。我们在[场景图](webgl-scene-graph.html)的文章中创建了一个场景图，所以让我们使用那个。

```
class TRS {
  constructor(position = [0, 0, 0], rotation = [0, 0, 0, 1], scale = [1, 1, 1]) {
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
  }
  getMatrix(dst) {
    dst = dst || new Float32Array(16);
    m4.compose(this.position, this.rotation, this.scale, dst);
    return dst;
  }
}

class Node {
  constructor(source, name) {
    this.name = name;
    this.source = source;
    this.parent = null;
    this.children = [];
    this.localMatrix = m4.identity();
    this.worldMatrix = m4.identity();
    this.drawables = [];
  }
  setParent(parent) {
    if (this.parent) {
      this.parent._removeChild(this);
      this.parent = null;
    }
    if (parent) {
      parent._addChild(this);
      this.parent = parent;
    }
  }
  updateWorldMatrix(parentWorldMatrix) {
    const source = this.source;
    if (source) {
      source.getMatrix(this.localMatrix);
    }

    if (parentWorldMatrix) {
      // 一个矩阵传入，所以做数学运算
      m4.multiply(parentWorldMatrix, this.localMatrix, this.worldMatrix);
    } else {
      // 没有矩阵传入，所以只是拷贝局部矩阵到世界矩阵
      m4.copy(this.localMatrix, this.worldMatrix);
    }

    // 现在处理所有子
    const worldMatrix = this.worldMatrix;
    for (const child of this.children) {
      child.updateWorldMatrix(worldMatrix);
    }
  }
  traverse(fn) {
    fn(this);
    for (const child of this.children) {
      child.traverse(fn);
    }
  }
  _addChild(child) {
    this.children.push(child);
  }
  _removeChild(child) {
    const ndx = this.children.indexOf(child);
    this.children.splice(ndx, 1);
  }
}
```

相较于[场景图](webgl-scene-graph.html)文章中的代码有一些值的注意的变化。

* 此代码使用ES6的`class`特性。

  使用`class`语法比定义类的旧方法要好得多。

* 我们给`Node`添加了要绘制的数组

  这将列出从此节点要绘制的的物体。我们会用类的实例实际上来绘制。这个方法我们通常可以用不同的类绘制不同的物体。

  注意：我不确定在Node里添加一个要绘制的数组是最好的方法。我觉得场景图本身应该可能不包含要绘制的物体。需要绘制的东西可改为图中节点的引用来获取数据。要绘制物体的方法比较常见所以让我们开始使用。

* 我们增加了一个`traverse`方法。

  它用当前节点调用传入的函数，并对子节点递归执行。

* `TRS`类使用四元数进行旋转

  我们并没有介绍过四元数，说实话我不认为我非常理解足以解释他们。幸运的是，我们用它们并不需要知道他们如何工作。我们只是从gltf文件中取出数据，调用一个函数它通过这些数据创建一个矩阵，使用该矩阵。

glTF文件中的节点数据存储为数组。
我们会转换glTF文件中的节点数据为`Node`实例。我们存储节点数据的旧数组为`origNodes`，我们稍后会需要用它。

```
const origNodes = gltf.nodes;
gltf.nodes = gltf.nodes.map((n) => {
  const {name, skin, mesh, translation, rotation, scale} = n;
  const trs = new TRS(translation, rotation, scale);
  const node = new Node(trs, name);
  const realMesh =　gltf.meshes[mesh];
  if (realMesh) {
    node.drawables.push(new MeshRenderer(realMesh));
  }
  return node;
});
```

上面我们为每个节点创建一个`TRS`实例，一个`Node`实例，我们查找之前设置的网格数据，如果有`mesh`属性的话，创建一个 `MeshRenderer`来绘制它。

让我们来创建`MeshRenderer`。它只是[码少趣多](webgl-less-code-more-fun.html)文章中渲染单个模型代码的封装。它所做的就是存一个对于网格的引用，然后为每个图元设置程序，属性和全局变量，最终通过`webglUtils.drawBufferInfo`调用`gl.drawArrays`或者 `gl.drawElements`;

```
class MeshRenderer {
  constructor(mesh) {
    this.mesh = mesh;
  }
  render(node, projection, view, sharedUniforms) {
    const {mesh} = this;
    gl.useProgram(meshProgramInfo.program);
    for (const primitive of mesh.primitives) {
      webglUtils.setBuffersAndAttributes(gl, meshProgramInfo, primitive.bufferInfo);
      webglUtils.setUniforms(meshProgramInfo, {
        u_projection: projection,
        u_view: view,
        u_world: node.worldMatrix,
      });
      webglUtils.setUniforms(meshProgramInfo, primitive.material.uniforms);
      webglUtils.setUniforms(meshProgramInfo, sharedUniforms);
      webglUtils.drawBufferInfo(gl, primitive.bufferInfo);
    }
  }
}
```

我们已经创建了节点，现在我们需要将它们实际安排到场景图中。在glTF中2步完成。
首先，每个节点有一个可选的children属性，为子节点的下标数组，所以我们可以遍历所有节点为它们的子节点设定父节点。
```
function addChildren(nodes, node, childIndices) {
  childIndices.forEach((childNdx) => {
    const child = nodes[childNdx];
    child.setParent(node);
  });
}

// 将节点加入场景图
gltf.nodes.forEach((node, ndx) => {
  const children = origNodes[ndx].children;
  if (children) {
    addChildren(gltf.nodes, node, children);
  }
});
```

然后有一个场景的数组。一个场景有一个场景底部节点在nodes数组中下标的数组来引用这些节点。我不是很清楚为什么不简单地从单个根节点开始，但是无论如何这就是glTF文件中地内容。所以我们创建一个根节点，作为所有场景子节点的父节点。

```
  // 设置场景
  for (const scene of gltf.scenes) {
    scene.root = new Node(new TRS(), scene.name);
    addChildren(gltf.nodes, scene.root, scene.nodes);
  }

  return gltf;
}
```

我们已经完成了加载，至少只是网格部分。让我们将主函数标记为`async` 所以我们能使用`await`关键字。

```
async function main() {
```

我们可以像这样加载gltf文件

```
const gltf = await loadGLTF('resources/models/killer_whale/whale.CYCLES.gltf');
```

我们需要一个与gltf文件中的数据匹配的着色器。让我们看看gltf文件中的图元数据。

```
{
    "name" : "orca",
    "primitives" : [
        {
            "attributes" : {
                "JOINTS_0" : 5,
                "NORMAL" : 2,
                "POSITION" : 1,
                "TANGENT" : 3,
                "TEXCOORD_0" : 4,
                "WEIGHTS_0" : 6
            },
            "indices" : 0
        }
    ]
}
```

看一下，我们只使用`NORMAL`和`POSITION`来渲染。我们在每个属性前添加了`a_`，因此像这样的顶点着色器应该可以工作。 

```
attribute vec4 a_POSITION;
attribute vec3 a_NORMAL;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

varying vec3 v_normal;

void main() {
  gl_Position = u_projection * u_view * u_world * a_POSITION;
  v_normal = mat3(u_world) * a_NORMAL;
}
```

片断着色器中我们使用一个简单的平行光

```
precision mediump float;

varying vec3 v_normal;

uniform vec4 u_diffuse;
uniform vec3 u_lightDirection;

void main () {
  vec3 normal = normalize(v_normal);
  float light = dot(u_lightDirection, normal) * .5 + .5;
  gl_FragColor = vec4(u_diffuse.rgb * light, u_diffuse.a);
}
```

注意我们使用了[平行光](webgl-3d-lighting-directional.html)文章中提到的点乘，但与此不同，这里点乘结果乘以.5并加上.5。正常平行光照，当直接面向光源时，表面100%照亮，减弱到0%当表面方向和光照垂直。这意味着远离光线的模型的1/2是黑的。通过乘以.5并加上.5，我们将点乘从-1 &lt;-&gt; 1转换到0 &lt;-&gt; 1，这意味着当完全反方向时才会是黑色。这为简单测试提供了简单并很好的照明。

所以，我们需要编译和连接着色器

```
// 编译和连接着色器，查找属性和全局变量的位置
const meshProgramInfo = webglUtils.createProgramInfo(gl, ["meshVS", "fs"]);
```

接着渲染，所有和之前不同的地方是

```
const sharedUniforms = {
  u_lightDirection: m4.normalize([-1, 3, 5]),
};

function renderDrawables(node) {
  for(const drawable of node.drawables) {
      drawable.render(node, projection, view, sharedUniforms);
  }
}

for (const scene of gltf.scenes) {
  // 更新场景中的世界矩阵。
  scene.root.updateWorldMatrix();
  // 遍历场景并渲染所有renderables
  scene.root.traverse(renderDrawables);
}
```

之前遗留下来的(未在上面显示)是用于计算投影矩阵，相机矩阵，和视图矩阵的代码。接下来我们遍历每个场景，调用`scene.root.updateWorldMatrix`会更新场景图中所有节点的矩阵。然后我们为`renderDrawables`调用`scene.root.traverse`。

`renderDrawables`调用该节点上所有绘制对象的渲染方法，传入投影，视图矩阵，`sharedUniforms`包含的光照信息。

{{{example url="../webgl-skinning-3d-gltf.html" }}}

现在，这是我们处理蒙皮的工作。

首先让我们创建一个代表蒙皮的类。它将管理关节列表，关节是应用于蒙皮的场景图中节点的另一个名字。它还会有绑定矩阵的逆矩阵。它会管理我们放入关节矩阵的材质。

```
class Skin {
  constructor(joints, inverseBindMatrixData) {
    this.joints = joints;
    this.inverseBindMatrices = [];
    this.jointMatrices = [];
    // 为每个关节矩阵分配足够的空间
    this.jointData = new Float32Array(joints.length * 16);
    // 为每个关节和绑定逆矩阵创建视图
    for (let i = 0; i < joints.length; ++i) {
      this.inverseBindMatrices.push(new Float32Array(
          inverseBindMatrixData.buffer,
          inverseBindMatrixData.byteOffset + Float32Array.BYTES_PER_ELEMENT * 16 * i,
          16));
      this.jointMatrices.push(new Float32Array(
          this.jointData.buffer,
          Float32Array.BYTES_PER_ELEMENT * 16 * i,
          16));
    }
    // 创建存储关节矩阵的纹理
    this.jointTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.jointTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  update(node) {
    const globalWorldInverse = m4.inverse(node.worldMatrix);
    // 遍历每个关节获得当前世界矩阵
    // 来计算绑定矩阵的逆 
    // 并在纹理中存储整个结果
    for (let j = 0; j < this.joints.length; ++j) {
      const joint = this.joints[j];
      const dst = this.jointMatrices[j];
      m4.multiply(globalWorldInverse, joint.worldMatrix, dst);
      m4.multiply(dst, this.inverseBindMatrices[j], dst);
    }
    gl.bindTexture(gl.TEXTURE_2D, this.jointTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 4, this.joints.length, 0,
                  gl.RGBA, gl.FLOAT, this.jointData);
  }
}
```

像`MeshRenderer`一样，我们制作`SkinRenderer`，来用`Skin`来渲染蒙皮网格。

```
class SkinRenderer {
  constructor(mesh, skin) {
    this.mesh = mesh;
    this.skin = skin;
  }
  render(node, projection, view, sharedUniforms) {
    const {skin, mesh} = this;
    skin.update(node);
    gl.useProgram(skinProgramInfo.program);
    for (const primitive of mesh.primitives) {
      webglUtils.setBuffersAndAttributes(gl, skinProgramInfo, primitive.bufferInfo);
      webglUtils.setUniforms(skinProgramInfo, {
        u_projection: projection,
        u_view: view,
        u_world: node.worldMatrix,
        u_jointTexture: skin.jointTexture,
        u_numJoints: skin.joints.length,
      });
      webglUtils.setUniforms(skinProgramInfo, primitive.material.uniforms);
      webglUtils.setUniforms(skinProgramInfo, sharedUniforms);
      webglUtils.drawBufferInfo(gl, primitive.bufferInfo);
    }
  }
}
```

你可以看到和 `MeshRenderer`非常类似。它有一个`Skin`的引用来更新所有渲染需要的矩阵。然后它后跟了渲染的标准模式，使用程序，设置属性，用`webglUtils.setUniforms`设置全局变量，也绑定纹理，然后渲染。

我们也需要一个支持蒙皮的顶点着色器

```
<script id="skinVS" type="notjs">
attribute vec4 a_POSITION;
attribute vec3 a_NORMAL;
attribute vec4 a_WEIGHTS_0;
attribute vec4 a_JOINTS_0;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;
uniform sampler2D u_jointTexture;
uniform float u_numJoints;

varying vec3 v_normal;

// 这些偏移假设纹理每行4个像素
#define ROW0_U ((0.5 + 0.0) / 4.)
#define ROW1_U ((0.5 + 1.0) / 4.)
#define ROW2_U ((0.5 + 2.0) / 4.)
#define ROW3_U ((0.5 + 3.0) / 4.)

mat4 getBoneMatrix(float jointNdx) {
  float v = (jointNdx + 0.5) / u_numJoints;
  return mat4(
    texture2D(u_jointTexture, vec2(ROW0_U, v)),
    texture2D(u_jointTexture, vec2(ROW1_U, v)),
    texture2D(u_jointTexture, vec2(ROW2_U, v)),
    texture2D(u_jointTexture, vec2(ROW3_U, v)));
}

void main() {
  mat4 skinMatrix = getBoneMatrix(a_JOINTS_0[0]) * a_WEIGHTS_0[0] +
                    getBoneMatrix(a_JOINTS_0[1]) * a_WEIGHTS_0[1] +
                    getBoneMatrix(a_JOINTS_0[2]) * a_WEIGHTS_0[2] +
                    getBoneMatrix(a_JOINTS_0[3]) * a_WEIGHTS_0[3];
  mat4 world = u_world * skinMatrix;
  gl_Position = u_projection * u_view * world * a_POSITION;
  v_normal = mat3(world) * a_NORMAL;
}
</script>
```

这与我们之前介绍的蒙皮着色器几乎相同。我们重命名了属性值来匹配gltf文件中的内容。最大的不同是我们生成了一个 `skinMatrix`。在我们之前的蒙皮着色器，我们将位置和每一个关节／骨骼矩阵相乘，并乘以每个关节的影响权重。在这个例子中，我们代替的将矩阵和权重相乘并相加，只乘以一次位置。这产生相同的结果，但是我们可以使用`skinMatrix`和法线相乘，我们需要这样做否则法线会和蒙皮不匹配。

还要注意在这里我们用`u_world`相乘。我们在`Skin.update`里减去了它。

```
*const globalWorldInverse = m4.inverse(node.worldMatrix);
// 遍历每个关节，获得它当前的世界矩阵 
// 来计算绑定矩阵的逆
// 并在纹理中存储整个结果
for (let j = 0; j < this.joints.length; ++j) {
  const joint = this.joints[j];
  const dst = this.jointMatrices[j];
*  m4.multiply(globalWorldInverse, joint.worldMatrix, dst);
```

无论你是否这样做取决于你。这样做的原因是它允许你实例化蒙皮。换句话说你可以在相同帧中在不同的地方渲染蒙皮网格。如果有很多的关节，对于一个蒙皮网格做所有的矩阵数学是非常慢的，所以你做一遍数学操作，然后你可以通过一个不同的世界矩阵将蒙皮网格重渲染在任何地方。 

这对于显示一群角色是有效的。不幸的是所有的角色都会是相同的姿势，所以我并不清楚这是否有用。这种情况通常出现的频率是多少? 你可以在`Skin`中移除乘以世界矩阵的逆并在着色器中移除乘以`u_world`，结果是一样的，你仅仅不能*实例化* 那个蒙皮网格。当然你可以多次渲染不同姿势的同一蒙皮网格。你会需要一个不同的`Skin`对象指向其他方向的不同节点。

回到我们的加载代码，当我们创建`Node`实例时，如果有`skin`属性，我们记录它，为了能为它创建一个`Skin`。

```
+const skinNodes = [];
const origNodes = gltf.nodes;
gltf.nodes = gltf.nodes.map((n) => {
  const {name, skin, mesh, translation, rotation, scale} = n;
  const trs = new TRS(translation, rotation, scale);
  const node = new Node(trs, name);
  const realMesh =　gltf.meshes[mesh];
+  if (skin !== undefined) {
+    skinNodes.push({node, mesh: realMesh, skinNdx: skin});
+  } else if (realMesh) {
    node.drawables.push(new MeshRenderer(realMesh));
  }
  return node;
});
```

创建`Node`之后我们需要创建`Skin`。蒙皮通过`joints`数组引用节点，该数组是为关节提供矩阵的节点下标数组。
蒙皮也引用一个访问器，访问器引用了保存在文件中的反向绑定姿势矩阵。

```
// 设置蒙皮
gltf.skins = gltf.skins.map((skin) => {
  const joints = skin.joints.map(ndx => gltf.nodes[ndx]);
  const {stride, array} = getAccessorTypedArrayAndStride(gl, gltf, skin.inverseBindMatrices);
  return new Skin(joints, array);
});
```

上面的代码给定一个访问器下标，调用了`getAccessorTypedArrayAndStride`。我们需要提供这部分的代码。给定一个访问器，我们会返回[类型化数组](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray)的正确类型视图以访问缓冲中的数据。

```
const glTypeToTypedArrayMap = {
  '5120': Int8Array,    // gl.BYTE
  '5121': Uint8Array,   // gl.UNSIGNED_BYTE
  '5122': Int16Array,   // gl.SHORT
  '5123': Uint16Array,  // gl.UNSIGNED_SHORT
  '5124': Int32Array,   // gl.INT
  '5125': Uint32Array,  // gl.UNSIGNED_INT
  '5126': Float32Array, // gl.FLOAT
}

// 给定一个GL类型返回需要的类型
function glTypeToTypedArray(type) {
  return glTypeToTypedArrayMap[type] || throwNoKey(type);
}

// 给定一个访问器下标返回访问器
// 和缓冲正确部分的类型化数组
function getAccessorTypedArrayAndStride(gl, gltf, accessorIndex) {
  const accessor = gltf.accessors[accessorIndex];
  const bufferView = gltf.bufferViews[accessor.bufferView];
  const TypedArray = glTypeToTypedArray(accessor.componentType);
  const buffer = gltf.buffers[bufferView.buffer];
  return {
    accessor,
    array: new TypedArray(
        buffer,
        bufferView.byteOffset + (accessor.byteOffset || 0),
        accessor.count * accessorTypeToNumComponents(accessor.type)),
    stride: bufferView.byteStride || 0,
  };
}
```

需要注意的是上面的代码我们用硬编码的WebGL常量制作了一个表。这是我们第一次这样做。常量不会改变，所以这是安全的。

现在我们有了蒙皮，我们可以返回并将它们添加到引用它们的节点。

```
// 给蒙皮节点添加SkinRenderers
for (const {node, mesh, skinNdx} of skinNodes) {
  node.drawables.push(new SkinRenderer(mesh, gltf.skins[skinNdx]));
}
```

如果我们这样渲染我们看不出任何不同。我们需要让一些节点动起来。让我们遍历`Skin`中的每个节点，换句话说每个关节，并在本地x轴上旋转一点点。

为此，我们会存每个关节的原始本地矩阵。我们会每帧旋转一些本地矩阵，使用一个特殊的方法`m4.decompose`，会转换矩阵为关节的位置，旋转量，缩放量。

```
const origMatrix = new Map();
function animSkin(skin, a) {
  for(let i = 0; i < skin.joints.length; ++i) {
    const joint = skin.joints[i];
    // 如果这个关节并没有存储矩阵
    if (!origMatrix.has(joint)) {
      // 为关节存储一个矩阵
      origMatrix.set(joint, joint.source.getMatrix());
    }
    // 获取原始的矩阵
    const origMatrix = origRotations.get(joint);
    // 旋转它
    const m = m4.xRotate(origMatrix, a);
    // 分解回关节的位置，旋转量，缩放量
    m4.decompose(m, joint.source.position, joint.source.rotation, joint.source.scale);
  }
}
```

然后在渲染之前我们会调用它

```
animSkin(gltf.skins[0], Math.sin(time) * .5);
```

注意`animSkin`不是通常的做法。理想情况下，我们会加载一些艺术家制作的动画或者我们知道我们想要以某种方式在代码中操作某个特定关节。在这个例子里，我们只是看看蒙皮是否有效，这似乎是一种简单的方法。

{{{example url="../webgl-skinning-3d-gltf-skinned.html" }}}

在我们继续之前一些注意事项

当我第一次尝试让它工作时，就像大多数程序一样，屏幕上没有显示的东西。

所以，首先做的是在蒙皮着色器的末尾添加这一行 

```
  gl_Position = u_projection * u_view *  a_POSITION;
```

在片断着色器中，我改变了它，仅仅在末尾添加这个来画纯色的

```
gl_FragColor = vec4(1, 0, 0, 1);
```

这将删除所有蒙皮，仅仅在原点绘制网格。我调整相机位置直到我有了一个好的视角。

```
const cameraPosition = [5, 0, 5];
const target = [0, 0, 0];
```

这显示了虎鲸的轮廓，所以我知道至少有一些数据正在发挥作用

<div class="webgl_center"><img src="resources/skinning-debug-01.png"></div>

接下来我让片断着色器显示法线

```
gl_FragColor = vec4(normalize(v_normal) * .5 + .5, 1);
```

法线从-1 到 1，所以 `* .5 + .5`调整它们到0 到 1来观察颜色。

回到顶点着色器我仅仅传递法线

```
v_normal = a_NORMAL;
```

我可以看到这样

<div class="webgl_center"><img src="resources/skinning-debug-02.png"></div>

我并没有觉得法线会出错，但是从我认为有效的开始，并确认它确实是有效的是很好的方法。

接下来我想我应该检查权重。所有我需要做的就是像法线一样从顶点着色器传递权重

```
v_normal = a_WEIGHTS_0.xyz * 2. - 1.;
```

权重从0到1，但是因为片断着色器需要法线，我仅仅改变权重从-1到1

这最初产生了一种混乱的颜色。一旦我发现了这个bug，我得到了这样的图像

<div class="webgl_center"><img src="resources/skinning-debug-03.png"></div>

它并不完全明显是正确的，但确实有道理。你希望每个骨骼最近的颜色有强烈的颜色，并且你希望在骨骼周围看到色环，因为那个区域的权重可能是1.0或者至少全部相似。

由于原始图像太乱了，我也尝试显示骨骼下标 

```
v_normal = a_JOINTS_0.xyz / (u_numJoints - 1.) * 2. - 1.;
```

下标从 0 到 骨骼数量- 1，所以上边的代码会得到-1到1的结果。

当正常工作时，我得到了这样的图像

<div class="webgl_center"><img src="resources/skinning-debug-04.png"></div>

又一次得到了乱七八糟的颜色。上图是修复后的样子。这就是你期望看到的虎鲸的权重。每个骨骼周围的色环。

这个bug和`webglUtils.createBufferInfoFromArrays`如何计算组件数量有关。有些情况下它被忽略了特定的那个，试图猜测，并猜错了。修复bug后我移除了着色器的改动。注意如果你想使用它们，我在注释中保留它们。

我想说清楚上面的代码是为了帮助说明蒙皮。它并不意味是一个成熟的蒙皮引擎。我想如果我们试图做一个可使用的引擎，我们会遇到许多我们可能需要改变的事情，但我希望这个例子可以帮助轻微揭开蒙皮的神秘面纱。

Title: WebGL 加载 .obj 文件
Description: 如何解析并显示 .obj 文件
TOC: WebGL 加载 .obj 文件

Wavefront 的 .obj 文件是网上最常用的 3D 文件格式。
它们并不是难以解析的格式，所以让我们试试。这能够提供一个解析 3D 文件的有用例子。

**免责申明** 该 .obj 解析器不会面面俱到或者完美，也不保证能够处理所有 .obj 文件。
这只是一个练习。如果你使用该程序并遇到问题，下面的链接可能会对你有帮助。

我找到的有关 .obj 文件的文档 [这里](http://paulbourke.net/dataformats/obj/)。
不过 [这里](https://www.loc.gov/preservation/digital/formats/fdd/fdd000507.shtml)
链接了很多其它相关文档，包括 [原始文档](http://www.cs.utah.edu/~/boulos/cs3505/obj_spec.pdf)。

让我们看一个简单的例子。下面是从 blender 默认场景中导出的 cube.obj：

```txt
# Blender v2.80 (sub 75) OBJ File: ''
# www.blender.org
mtllib cube.mtl
o Cube
v 1.000000 1.000000 -1.000000
v 1.000000 -1.000000 -1.000000
v 1.000000 1.000000 1.000000
v 1.000000 -1.000000 1.000000
v -1.000000 1.000000 -1.000000
v -1.000000 -1.000000 -1.000000
v -1.000000 1.000000 1.000000
v -1.000000 -1.000000 1.000000
vt 0.375000 0.000000
vt 0.625000 0.000000
vt 0.625000 0.250000
vt 0.375000 0.250000
vt 0.375000 0.250000
vt 0.625000 0.250000
vt 0.625000 0.500000
vt 0.375000 0.500000
vt 0.625000 0.750000
vt 0.375000 0.750000
vt 0.625000 0.750000
vt 0.625000 1.000000
vt 0.375000 1.000000
vt 0.125000 0.500000
vt 0.375000 0.500000
vt 0.375000 0.750000
vt 0.125000 0.750000
vt 0.625000 0.500000
vt 0.875000 0.500000
vt 0.875000 0.750000
vn 0.0000 1.0000 0.0000
vn 0.0000 0.0000 1.0000
vn -1.0000 0.0000 0.0000
vn 0.0000 -1.0000 0.0000
vn 1.0000 0.0000 0.0000
vn 0.0000 0.0000 -1.0000
usemtl Material
s off
f 1/1/1 5/2/1 7/3/1 3/4/1
f 4/5/2 3/6/2 7/7/2 8/8/2
f 8/8/3 7/7/3 5/9/3 6/10/3
f 6/10/4 2/11/4 4/12/4 8/13/4
f 2/14/5 1/15/5 3/16/5 4/17/5
f 6/18/6 5/19/6 1/20/6 2/11/6
```

即使不看文档我们也能发现 `v` 开始的行表示顶点，`vt` 开始的行表示纹理座标，
`vn` 开始的行表示法线。接下来就是理解剩下的代表什么。

看起来 .obj 文件是文本文件，所以我们要做的第一件事就是加载文本文件。
幸运的是，如果使用 [async/await](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Async_await) 这将是一件很简单的事。

```js
async function main() {
  ...

  const response = await fetch('resources/models/cube/cube.obj');
  const text = await response.text();
}
```

接着，我们可以一行一行地解析，每行都是下面的形式:

```
keyword data data data ...
```

每行的开头是 keyword，data 由空格隔开。以 `#` 开头的行是注释。

接着，用代码来解析每一行，跳过空白行和注释，然后根据 keyword 调用对应的函数。

```js
function parseOBJ(text) {

  const keywords = {
  };

  const keywordRE = /(\w*)(?: )*(.*)/;
  const lines = text.split('\n');
  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
    const line = lines[lineNo].trim();
    if (line === '' || line.startsWith('#')){
      continue;
    }
    const m = keywordRE.exec(line);
    if (!m) {
      continue;
    }
    const [, keyword, unparsedArgs] = m;
    const parts = line.split(/\s+/).slice(1);
    const handler = keywords[keyword];
    if (!handler) {
      console.warn('unhandled keyword:', keyword, ' at line', lineNo + 1);
      continue;
    }
    handler(parts, unparsedArgs);
  }
}
```

注意：我们去除了每行开头和结尾的空格。
我不知道这是否有必要，但是我觉得没有坏处。
我们用 `/\s+/` 将每行以空格分割。
同样地我不知道这是否有必要，data 之间会有多于一个空格吗？是否可以是制表符？
不知道，但是这样看起来更安全。

另外，我们将每行的第一部分作为 keyword，然后找到对应的函数调用，
并将 keyword 后面的 data 传给该函数。所以接下来我们只要完成这些函数。

之前，我们猜测了 `v`，`vt` 和 `vn` 的含义。
文档表明 `f` 代表“面”或多边形，每部分数据代表了顶点、纹理座标以及法线。

如果一个索引是正数，表示从序列 1 开始的偏移。
如果索引是负数，表示从序列结尾开始的偏移。
索引的顺序是：顶点/纹理座标/法线，只有顶点是必要的。

```txt
f 1 2 3             # 只包含顶点索引
f 1/1 2/2 3/3       # 包含顶点索引和纹理座标索引
f 1/1/1 2/2/2 3/3/3 # 包含顶点索引、纹理座标索引和法线索引
f 1//1 2//2 3//3    # 包含顶点索引和法线索引
```
`f` 可以有多于 3 个顶点，比如 4 个顶点代表四边形。
WebGL 只能绘制三角形，所以需要将数据转换成三角形。
标准并没有规定说一个面可以有多于 4 个顶点，也没有说面必须是凹的或凸的。
但暂时让我们假设面是凹的。

通常在 WebGL 中，我们不单独说明顶点、纹理座标和法线，“webgl 顶点”代表了包含了代表该顶点的顶点座标、纹理座标、法线的数据集合。
例如，要绘制一个立方体，WebGL 需要 36 个顶点，每个面是两个三角形，每个三角形是 3 个顶点。
6 个面 * 每个面 2 个三角形 * 每个三角形 3 个顶点 = 36 个顶点。
尽管一个立方体只有 8 个不重复的顶点和 6 条不重复的法线。
所以，我们需要读取面的顶点索引来生成包含了顶点位置、纹理座标、法线的“webgl 顶点”。
[*](webgl-pulling-vertices.html)

所以，根据上面的描述，我们可以像下面这样解析：

```js
function parseOBJ(text) {
+  // 因为索引是从 1 开始的，所以填充索引为 0 的位置
+  const objPositions = [[0, 0, 0]];
+  const objTexcoords = [[0, 0]];
+  const objNormals = [[0, 0, 0]];
+
+  // 和 `f` 一样的索引顺序
+  const objVertexData = [
+    objPositions,
+    objTexcoords,
+    objNormals,
+  ];
+
+  // 和 `f` 一样的索引顺序
+  let webglVertexData = [
+    [],   // 顶点
+    [],   // 纹理座标
+    [],   // 法线
+  ];
+
+  function addVertex(vert) {
+    const ptn = vert.split('/');
+    ptn.forEach((objIndexStr, i) => {
+      if (!objIndexStr) {
+        return;
+      }
+      const objIndex = parseInt(objIndexStr);
+      const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
+      webglVertexData[i].push(...objVertexData[i][index]);
+    });
+  }
+
  const keywords = {
+    v(parts) {
+      objPositions.push(parts.map(parseFloat));
+    },
+    vn(parts) {
+      objNormals.push(parts.map(parseFloat));
+    },
+    vt(parts) {
+      objTexcoords.push(parts.map(parseFloat));
+    },
+    f(parts) {
+      const numTriangles = parts.length - 2;
+      for (let tri = 0; tri < numTriangles; ++tri) {
+        addVertex(parts[0]);
+        addVertex(parts[tri + 1]);
+        addVertex(parts[tri + 2]);
+      }
+    },
  };
```

上面的代码创建了 3 个数组来保存从 object 文件中解析出来的顶点位置、纹理座标和法线。
同时创建了 3 个数组来保存 WebGL 的顶点。为了方便引用，数组的顺序和 `f` 中索引的顺序是一样的。

例如下面的 `f` 行

```txt
f 1/2/3/ 4/5/6 7/8/9
```

像 `4/5/6` 表示对这个面的一个顶点使用“顶点 4”，“纹理座标 5”，“法线 6”。
我们将顶点、纹理座标、法线数据放进 `objVertexData` 数组，这样就能简单的表示为：
对 webglData 的第 i 项，使用 objData 第 i 个数组中的第 n 个元素。
这样会简化我们的代码。

在函数的结尾返回我们构建的数据

```js
  ...

  return {
    position: webglVertexData[0],
    texcoord: webglVertexData[1],
    normal: webglVertexData[2],
  };
```

接下来要做的就是将数据绘制出来。首先我们使用 [三维方向光源](webgl-3d-lighting-directional.html) 中着色器的变体。

```js
const vs = `
attribute vec4 a_position;
attribute vec3 a_normal;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

varying vec3 v_normal;

void main() {
  gl_Position = u_projection * u_view * u_world * a_position;
  v_normal = mat3(u_world) * a_normal;
}
`;

const fs = `
precision mediump float;

varying vec3 v_normal;

uniform vec4 u_diffuse;
uniform vec3 u_lightDirection;

void main () {
  vec3 normal = normalize(v_normal);
  float fakeLight = dot(u_lightDirection, normal) * .5 + .5;
  gl_FragColor = vec4(u_diffuse.rgb * fakeLight, u_diffuse.a);
}
`;
```

然后使用来自 [码少趣多](webgl-less-code-more-fun.html) 中的代码加载模型

```js
async function main() {
  // 获取 WebGL 渲染上下文
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector("#canvas");
  const gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  ... shaders ...

  // 编译、链接着色器，查找属性和全局变量位置
  const meshProgramInfo = webglUtils.createProgramInfo(gl, [vs, fs]);

  const data = await loadOBJ('resources/models/cube/cube.obj');

  // 数据是像这样命名的：
  //
  // {
  //   position: [...],
  //   texcoord: [...],
  //   normal: [...],
  // }
  //
  // 因为这些数组的名称和顶点着色器中的属性对应，所以我们可以将数据直接传进
  // 来自“码少趣多”文章中的 `createBufferInfoFromArrays`。

  // 通过调用 gl.createBuffer, gl.bindBuffer, gl.bufferData 为每个数组创建缓冲
  const bufferInfo = webglUtils.createBufferInfoFromArrays(gl, data);
```

然后绘制数据

```js
  const cameraTarget = [0, 0, 0];
  const cameraPosition = [0, 0, 4];
  const zNear = 0.1;
  const zFar = 50;

  function degToRad(deg) {
    return deg * Math.PI / 180;
  }

  function render(time) {
    time *= 0.001;  // 转成秒

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    const fieldOfViewRadians = degToRad(60);
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

    const up = [0, 1, 0];
    // 通过 lookAt 计算 camera 矩阵。
    const camera = m4.lookAt(cameraPosition, cameraTarget, up);

    // 通过 camera 矩阵创建 view 矩阵。
    const view = m4.inverse(camera);

    const sharedUniforms = {
      u_lightDirection: m4.normalize([-1, 3, 5]),
      u_view: view,
      u_projection: projection,
    };

    gl.useProgram(meshProgramInfo.program);

    // 调用 gl.uniform
    webglUtils.setUniforms(meshProgramInfo, sharedUniforms);

    // 调用 gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
    webglUtils.setBuffersAndAttributes(gl, meshProgramInfo, bufferInfo);

    // 调用 gl.uniform
    webglUtils.setUniforms(meshProgramInfo, {
      u_world: m4.yRotation(time),
      u_diffuse: [1, 0.7, 0.5, 1],
    });

    // 调用 gl.drawArrays or gl.drawElements
    webglUtils.drawBufferInfo(gl, bufferInfo);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}
```

这样，我们就能看到模型被加载和绘制。

{{{example url="../webgl-load-obj-cube.html"}}}

我们也看到了关于未处理 keyword 的信息。它们是什么作用呢？

`usemtl` 是这之中最重要的。它指明了后面出现的所有几何体都使用指定的材质。
例如，你有一个车辆的模型，你可能会希望车窗是透明的，保险杠是金属反光的。
窗是 [透明](webgl-text-texture.html) 的，
保险杠是 [反光](webgl-environment-maps.html) 的，
所以它们需要和车体不一样的绘制方法。
`usemtl` 标签标记了这部分信息。

因为我们需要单独绘制这些部分，所以我们需要修改代码，
每次遇到 `usemtl` 我们就创建一个新的 webgl 数据集。

首先，添加代码

```js
function parseOBJ(text) {
  // 因为索引是从 1 开始的，所以填充索引为 0 的位置
  const objPositions = [[0, 0, 0]];
  const objTexcoords = [[0, 0]];
  const objNormals = [[0, 0, 0]];

  // 和 `f` 一样的索引顺序
  const objVertexData = [
    objPositions,
    objTexcoords,
    objNormals,
  ];

  // 和 `f` 一样的索引顺序
  let webglVertexData = [
    [],   // 顶点
    [],   // 纹理座标
    [],   // 法线
  ];

+  const geometries = [];
+  let geometry;
+  let material = 'default';
+
+  function newGeometry() {
+    // 如果有存在的几何体并且不是空的，销毁
+    if (geometry && geometry.data.position.length) {
+      geometry = undefined;
+    }
+  }
+
+  function setGeometry() {
+    if (!geometry) {
+      const position = [];
+      const texcoord = [];
+      const normal = [];
+      webglVertexData = [
+        position,
+        texcoord,
+        normal,
+      ];
+      geometry = {
+        material,
+        data: {
+          position,
+          texcoord,
+          normal,
+        },
+      };
+      geometries.push(geometry);
+    }
+  }

...
```

接着当我们在处理 keywords 的时候，在合适的地方调用它们，包括添加 `o` keyword 的函数。

```js
  ...

  const keywords = {
    v(parts) {
      objPositions.push(parts.map(parseFloat));
    },
    vn(parts) {
      objNormals.push(parts.map(parseFloat));
    },
    vt(parts) {
      objTexcoords.push(parts.map(parseFloat));
    },
    f(parts) {
+     setGeometry();
      const numTriangles = parts.length - 2;
      for (let tri = 0; tri < numTriangles; ++tri) {
        addVertex(parts[0]);
        addVertex(parts[tri + 1]);
        addVertex(parts[tri + 2]);
      }
    },
+   usemtl(parts, unparsedArgs) {
+     material = unparsedArgs;
+     newGeometry();
+   },
  };

  ...

```

`usemtl` 不是必要的，如果在文件中没有 `usemtl`，我们想要有默认的几何体。
所以在 `f` 函数中我们调用了 `setGeometry` 来创建。

最后我们返回 `geometries` 对象数组，每个对象包含 `name` 和 `data`。

```js
  ...

-  return {
-    position: webglVertexData[0],
-    texcoord: webglVertexData[1],
-    normal: webglVertexData[2],
-  };
+  return geometries;
}
```

同时，我们需要处理纹理座标或法线缺失的情况。

```js
+  // 移除空数组
+  for (const geometry of geometries) {
+    geometry.data = Object.fromEntries(
+        Object.entries(geometry.data).filter(([, array]) => array.length > 0));
+  }

  return {
    materialLibs,
    geometries,
  };
}
```

让我们继续 keywords，根据 [*官方规范*](http://www.cs.utah.edu/~boulos/cs3505/obj_spec.pdf)，
`mtllib` 指定了包含材质信息的独立的一个或多个文件。
不幸的是，在实际应用中，文件名中可以包含空格，但 .obj 格式中并没有提供逃逸字符来使用空格或引号。
理想情况应该使用能解决这些问题的、良好定义的格式，比如 json、xml 或 yaml 等。
但 .obj 格式诞生的比它们都早。

稍后我们在处理加载文件。先让我们把它加到加载器里以便之后可以使用。

```js
function parseOBJ(text) {
  ...
+  const materialLibs = [];

  ...

  const keywords = {
    ...
+    mtllib(parts, unparsedArgs) {
+      materialLibs.push(unparsedArgs);
+    },
    ...
  };

-  return geometries;
+  return {
+    materialLibs,
+    geometries,
+  };
}
```

`o` 指定表明了接下来的条目属于命名为 "object" 的对象。但我们并不清楚如何使用它。
文件中能只包含 `o` 而没有 `usemtl` 吗？先假设可以。

```js
function parseOBJ(text) {
  ...
  let material = 'default';
+  let object = 'default';

  ...

  function setGeometry() {
    if (!geometry) {
      const position = [];
      const texcoord = [];
      const normal = [];
      webglVertexData = [
        position,
        texcoord,
        normal,
      ];
      geometry = {
+        object,
        material,
        data: {
          position,
          texcoord,
          normal,
        },
      };
      geometries.push(geometry);
    }
  }

  const keywords = {
    ...
+    o(parts, unparsedArgs) {
+      object = unparsedArgs;
+      newGeometry();
+    },
    ...
  };
```

`s` 指定了一个 smoothing group。我觉得这是我们可以忽略的。
它们通常在建模程序中用来自动生成顶点法线。
顶点法线的计算，需要先计算每个面的法线，而每个面的法线可以很容易使用 *叉乘* 得到，
这部分已经在 [三维相机](webgl-3d-camera.html) 中提到了。
对于任意顶点，我们可以对该顶点所在的面取均值。
但是有时我们想要一条边时，我们需要能够告诉程序忽略一些面。
Smoothing groups 让我们指定计算顶点法线时哪些面需要被包含。
关于如何计算几何体的顶点法线，你可有看 [WebGL 三维几何加工](webgl-3d-geometry-lathe.html) 作为例子。

在我们的例子中，我们先忽略它。假设大部分 .obj 文件内部都包含法线，所以一般不需要 smoothing groups。
一般在模型库中才会有它，以便你想要编辑或重新生成法线。

```js
+  const noop = () => {};

  const keywords = {
    ...
+    s: noop,
    ...
  };
```

目前为止我们还剩一个 keyword：`g` 代表组 (group)。通常它只是一些元数据。
Objects 可以存在于多个 group 中。
因为它会出现在我们接下来的文件中，所以我们先添加支持代码，尽管现在并不使用。

```js
function parseOBJ(text) {
  ...
+  let groups = ['default'];
  ...
  function setGeometry() {
    if (!geometry) {
      const position = [];
      const texcoord = [];
      const normal = [];
      webglVertexData = [
        position,
        texcoord,
        normal,
      ];
      geometry = {
        object,
+        groups,
        material,
        data: {
          position,
          texcoord,
          normal,
        },
      };
      geometries.push(geometry);
    }
  }

  ...

  const keywords = {
    ...
+    g(parts) {
+      groups = parts;
+      newGeometry()
+    },
    ...
  };
```

现在我们创建了多个几何体的集合，我们需要改变我们的初始化代码来为每一个几何体创建 `WebGLBuffers`。
同时我们也会创建一个随机的颜色，这样就能方便地分辨不同的部分。

```js
-  const response = await fetch('resources/models/cube/cube.obj');
+  const response = await fetch('resources/models/chair/chair.obj');
  const text = await response.text();
-  const data = parseOBJ(text);
+  const obj = parseOBJ(text);

+  const parts = obj.geometries.map(({data}) => {
    // 数据是像这样命名的：
    //
    // {
    //   position: [...],
    //   texcoord: [...],
    //   normal: [...],
    // }
    //
    // 因为这些数组的名称和顶点着色器中的属性对应，所以我们可以将数据直接传进
    // 来自“码少趣多”文章中的 `createBufferInfoFromArrays`。

    // 通过调用 gl.createBuffer, gl.bindBuffer, gl.bufferData 为每个数组创建缓冲
    const bufferInfo = webglUtils.createBufferInfoFromArrays(gl, data);
+    return {
+      material: {
+        u_diffuse: [Math.random(), Math.random(), Math.random(), 1],
+      },
+      bufferInfo,
+    };
+  });
```

我们从加载一个立方体换成了我在 [Sketchfab](https://sketchfab.com) 发现的，
由 [haytonm](https://sketchfab.com/haytonm) 创建的 [CC-BY 4.0](http://creativecommons.org/licenses/by/4.0/) [椅子](https://sketchfab.com/3d-models/chair-aa2acddb218646a59ece132bf95aa558)。

<div class="webgl_center"><img src="../resources/models/chair/chair.jpg" style="width: 452px;"></div>

要渲染，我们只需要循环绘制每个部分

```js
function render(time) {
  ...

  gl.useProgram(meshProgramInfo.program);

  // 调用 gl.uniform
  webglUtils.setUniforms(meshProgramInfo, sharedUniforms);

+  // 对整个空间矩阵进行一次计算
+  const u_world = m4.yRotation(time);
+
+  for (const {bufferInfo, material} of parts) {
    // 调用 gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
    webglUtils.setBuffersAndAttributes(gl, meshProgramInfo, bufferInfo);
    // 调用 gl.uniform
    webglUtils.setUniforms(meshProgramInfo, {
-      u_world: m4.yRotation(time),
-      u_diffuse: [1, 0.7, 0.5, 1],
+      u_world,
+      u_diffuse: material.u_diffuse,
    });
    // 调用 gl.drawArrays or gl.drawElements
    webglUtils.drawBufferInfo(gl, bufferInfo);
+  }

  ...
```

成功了！

{{{example url="../webgl-load-obj.html"}}}

如果我们试着把物体放中间是不是更好？

为了把物体放中间我们需要计算物体的范围，即顶点的最小和最大位置。
首先我们需要一个函数，计算给定多个位置中的最小和最大位置

```js
function getExtents(positions) {
  const min = positions.slice(0, 3);
  const max = positions.slice(0, 3);
  for (let i = 3; i < positions.length; i += 3) {
    for (let j = 0; j < 3; ++j) {
      const v = positions[i + j];
      min[j] = Math.min(v, min[j]);
      max[j] = Math.max(v, max[j]);
    }
  }
  return {min, max};
}
```

然后我们遍历几何体的每个部分，并且得到对于的范围

```js
function getGeometriesExtents(geometries) {
  return geometries.reduce(({min, max}, {data}) => {
    const minMax = getExtents(data.position);
    return {
      min: min.map((min, ndx) => Math.min(minMax.min[ndx], min)),
      max: max.map((max, ndx) => Math.max(minMax.max[ndx], max)),
    };
  }, {
    min: Array(3).fill(Number.POSITIVE_INFINITY),
    max: Array(3).fill(Number.NEGATIVE_INFINITY),
  });
}
```

接着，我们需要计算物体的平移距离，以便能将它的中心放在原点，同时计算原点和 camera 的距离，保证能完全看到物体。

```js
-  const cameraTarget = [0, 0, 0];
-  const cameraPosition = [0, 0, 4];
-  const zNear = 0.1;
-  const zFar = 50;
+  const extents = getGeometriesExtents(obj.geometries);
+  const range = m4.subtractVectors(extents.max, extents.min);
+  // 移动物体的距离，使得其中心在原点
+  const objOffset = m4.scaleVector(
+      m4.addVectors(
+        extents.min,
+        m4.scaleVector(range, 0.5)),
+      -1);
+  const cameraTarget = [0, 0, 0];
+  // 计算移动 camera 的距离，以便我们能完全看到物体
+  const radius = m4.length(range) * 1.2;
+  const cameraPosition = m4.addVectors(cameraTarget, [
+    0,
+    0,
+    radius,
+  ]);
+  // 设置合适于物体大小的 zNear 和 zFar 值
+  const zNear = radius / 100;
+  const zFar = radius * 3;
```

上面，我们也设置了适合显示物体的 `zNear` 和 `zFar` 值。

只需要使用 `objOffset` 来将物体平移到原点。

```js
// 将整个空间矩阵重新计算一次
-const u_world = m4.yRotation(time);
+let u_world = m4.yRotation(time);
+u_world = m4.translate(u_world, ...objOffset);
```

这样，对象就居中了。

{{{example url="../webgl-load-obj-w-extents.html"}}}

在网上查阅了一下，有些非标准的 .obj 文件包含了顶点的颜色值。
它们将额外的值放在了每个顶点位置的后面，

标准

```
v <x> <y> <z>
```

非标准

```
v <x> <y> <z> <red> <green> <blue>
```

不清楚后面是否有可选的 alpha 值。

我查了一下，找到了由 [Oleaf](https://sketchfab.com/homkahom0) 创建的 [Book - Vertex chameleon study](https://sketchfab.com/3d-models/book-vertex-chameleon-study-51b0b3bdcd844a9e951a9ede6f192da8) by [CC-BY-NC](http://creativecommons.org/licenses/by-nc/4.0/) 使用了顶点颜色。

<div class="webgl_center"><img src="../resources/models/book-vertex-chameleon-study/book.png" style="width: 446px;"></div>

让我们看看能不能添加代码来支持显示顶点颜色。

我们需要在有顶点位置、法线和纹理座标的地方添加一些代码

```js
function parseOBJ(text) {
  // 因为索引是从 1 开始的，所以填充索引为 0 的位置
  const objPositions = [[0, 0, 0]];
  const objTexcoords = [[0, 0]];
  const objNormals = [[0, 0, 0]];
+  const objColors = [[0, 0, 0]];

  // 和 `f` 一样的索引顺序
  const objVertexData = [
    objPositions,
    objTexcoords,
    objNormals,
+    objColors,
  ];

  // 和 `f` 一样的索引顺序
  let webglVertexData = [
    [],   // 顶点
    [],   // 纹理座标
    [],   // 法线
+    [],   // 颜色
  ];

  ...

  function setGeometry() {
    if (!geometry) {
      const position = [];
      const texcoord = [];
      const normal = [];
+      const color = [];
      webglVertexData = [
        position,
        texcoord,
        normal,
+        color,
      ];
      geometry = {
        object,
        groups,
        material,
        data: {
          position,
          texcoord,
          normal,
+          color,
        },
      };
      geometries.push(geometry);
    }
  }
```

这使得我们的代码有一点不通用。

```js
  const keywords = {
    v(parts) {
-      objPositions.push(parts.map(parseFloat));
+      // 如果超过 3 个值，就是顶点颜色
+      if (parts.length > 3) {
+        objPositions.push(parts.slice(0, 3).map(parseFloat));
+        objColors.push(parts.slice(3).map(parseFloat));
+      } else {
+        objPositions.push(parts.map(parseFloat));
+      }
    },
    ...
  };
```

然后当我们读取到 `f` 面的时候，调用 `addVertex`，我们需要获取顶点的颜色

```js
  function addVertex(vert) {
    const ptn = vert.split('/');
    ptn.forEach((objIndexStr, i) => {
      if (!objIndexStr) {
        return;
      }
      const objIndex = parseInt(objIndexStr);
      const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
      webglVertexData[i].push(...objVertexData[i][index]);
+      // 如果这是位置索引并且解析到了颜色值，将顶点的颜色值复制到 webgl 顶点的颜色中
+      if (i === 0 && objColors.length > 1) {
+        geometry.data.color.push(...objColors[index]);
+      }
    });
  }
```

接着，我们需要更改我们的着色器来使用顶点颜色

```js
const vs = `
attribute vec4 a_position;
attribute vec3 a_normal;
+attribute vec4 a_color;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

varying vec3 v_normal;
+varying vec4 v_color;

void main() {
  gl_Position = u_projection * u_view * u_world * a_position;
  v_normal = mat3(u_world) * a_normal;
+  v_color = a_color;
}
`;

const fs = `
precision mediump float;

varying vec3 v_normal;
+varying vec4 v_color;

uniform vec4 u_diffuse;
uniform vec3 u_lightDirection;

void main () {
  vec3 normal = normalize(v_normal);
  float fakeLight = dot(u_lightDirection, normal) * .5 + .5;
-  gl_FragColor = vec4(u_diffuse.rgb * fakeLight, u_diffuse.a);
+  vec4 diffuse = u_diffuse * v_color;
+  gl_FragColor = vec4(diffuse.rgb * fakeLight, diffuse.a);
}
`;
```

就如上面提到的，我不确定这个非标准版本的 .obj 文件能否在每个顶点颜色中包含 alpha 值。
我们的 [helper library](webgl-less-code-more-fun.html) 根据我们传入的数据自动创建缓冲区。
它假设每个元素有多少个组成部分。
对于名字中包含 `position` 或 `normal` 的，默认每个元素包含 3 个组成部分。
对于名字中包含 `texcoord` 的，默认每个元素 2 个组成部分。
其它的每个元素默认 4 个组成部分。
这样的话，如果我们的颜色仅包含 r、g、b，每个元素三个组成部分，我们需要传参给它。

```js
const parts = obj.geometries.map(({data}) => {
  // 数据是像这样命名的：
  //
  // {
  //   position: [...],
  //   texcoord: [...],
  //   normal: [...],
  // }
  //
  // 因为这些数组的名称和顶点着色器中的属性对应，所以我们可以将数据直接传进
  // 来自“码少趣多”文章中的 `createBufferInfoFromArrays`。

+   if (data.position.length === data.color.length) {
+     // 是 3， helper library 默认是 4 所以我们需要告诉程序只有 3 个
+     data.color = { numComponents: 3, data: data.color };
+   }

  // 通过调用 gl.createBuffer, gl.bindBuffer, gl.bufferData 为每个数组创建缓冲
  const bufferInfo = webglUtils.createBufferInfoFromArrays(gl, data);
  return {
    material: {
      u_diffuse: [Math.random(), Math.random(), Math.random(), 1],
    },
    bufferInfo,
  };
});
```

我们也希望能够处理更常见的没有顶点颜色的情况。
在 [WebGL 基础概念](webgl-fundamentals.html) 和 [WebGL 属性](webgl-attributes.html) 中我们提到了属性通常从缓冲中获取值。
但我们也可以将属性设置成常量。没有的值使用默认常量。

```js
gl.disableVertexAttribArray(someAttributeLocation);  // 使用常量
const value = [1, 2, 3, 4];
gl.vertexAttrib4fv(someAttributeLocation, value);    // 使用给定的值
```

如果将属性的值设为 `{value:[1, 2, 3, 4]}`，我们的 [helper library](webgl-less-code-more-fun.html) 为我们处理了这种情况。当检查到没有顶点颜色时，默认将顶点颜色属性设置成白色。

```js
const parts = obj.geometries.map(({data}) => {
  // 数据是像这样命名的：
  //
  // {
  //   position: [...],
  //   texcoord: [...],
  //   normal: [...],
  // }
  //
  // 因为这些数组的名称和顶点着色器中的属性对应，所以我们可以将数据直接传进
  // 来自“码少趣多”文章中的 `createBufferInfoFromArrays`。

+  if (data.color) {
      if (data.position.length === data.color.length) {
        // 是 3， helper library 默认是 4 所以我们需要告诉程序只有 3 个
        data.color = { numComponents: 3, data: data.color };
      }
+  } else {
+    // 没有顶点颜色，使用白色
+    data.color = { value: [1, 1, 1, 1] };
+  }

  ...
});
```

我们也不能使用随机颜色

```js
const parts = obj.geometries.map(({data}) => {
  ...

  // 通过调用 gl.createBuffer, gl.bindBuffer, gl.bufferData 为每个数组创建缓冲
  const bufferInfo = webglUtils.createBufferInfoFromArrays(gl, data);
  return {
    material: {
-      u_diffuse: [Math.random(), Math.random(), Math.random(), 1],
+      u_diffuse: [1, 1, 1, 1],
    },
    bufferInfo,
  };
});
```

这样，我们就能带顶点颜色的 .obj 文件了。

{{{example url="../webgl-load-obj-w-vertex-colors.html"}}}

至于解析和使用材质，[看下一篇](webgl-load-obj-w-mtl.html)。

## 一些注意点

### 这个加载器是不完整的

你可以 [阅读更多关于 .obj 格式](http://paulbourke.net/dataformats/obj/)。
有大量的功能上面的代码是不支持的。
同时，代码也没有经过大量 .obj 文件的测试，所以可能有很多未知的 bug。
也就是说，我假设了大多数在线的 .obj 文件只使用了上面提到的功能，所以这部分代码说不定是一个有用的例子。

### 这个加载器没有进行错误检查

例如： `vt` 可以有 3 个值而不仅仅是 2 个。3 个值是给 3D 纹理使用的，不普遍所以我没有处理。
如果你确实想要用它解析 3D 纹理座标，你需要修改着色器来处理 3D 纹理，
修改生成 `WebGLBuffers` (调用 `createBufferInfoFromArrays`)的代码，告诉它每个 UV 座标有 3 个组成部分。

### 假设数据是一致的

我不知道是否会出现同一个文件中一些 `f` 有 3 个条目而另一些只有 2 个条目会。如果有可能，上面的代码没有处理这种情况。

这段代码同样假设了所有顶点座标都有 x、y、z。如果出现有些顶点座标有 x、y、z，有些顶点座标只有 x、y，而有些则有 x、y、z、r、g、b，我们需要重构代码。

### 可以将所有数据放进一个缓冲里

上面的代码将顶点位置、纹理座标、法线放进了不同的缓冲。
你也可以将它们交错的放进一个缓冲中：pos, uv, nrm, pos, uv, nrm, ...
这样的话就需要改变设置属性的方式。

更进一步，你甚至可以将所有部分的所有数据放进同一个缓冲里，而不是每个部分、每个类型的数据一个缓冲。

我不考虑这些因为我觉得它们没有那么重要，同时它们也会使得代码变得复杂。

### 可以重建顶点的索引

上面的代码将顶点展开放进了三个数组中。我们可以重建顶点的索引。
尤其当我们将所有顶点数据放进一个共享的缓冲中，或至少每个类型有一个单独的共享缓冲时，
对于每个 `f` 面，可以将索引转换到一个正数（负数变换到正确的正数），那么对于每个顶点，
数据集就变成了一个或多个 *id*。所以，只要记下 *id 到索引的映射关系* 就能查找到对应的索引。

```js
const idToIndexMap = {};
const webglIndices = [];

function addVertex(vert) {
  const ptn = vert.split('/');
  // 首先将所有索引转换成正数
  const indices = ptn.forEach((objIndexStr, i) => {
    if (!objIndexStr) {
      return;
    }
    const objIndex = parseInt(objIndexStr);
    return objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
  });
  // 现在检查已存在的顶点位置、纹理座标、法线组合
  const id = indices.join(',');
  let vertIndex = idToIndexMap[id];
  if (!vertIndex) {
    vertIndex = webglVertexData[0].length / 3;
    idToIndexMap[id] = vertexIndex;
    indices.forEach((index, i) => {
      if (index !== undefined) {
        webglVertexData[i].push(...objVertexData[i][index]);
      }
    })
  }
  webglIndices.push(vertexIndex);
}
```

或者，如果你觉得重要你可以收到重排索引。

### 这段代码没有处理只有顶点座标，或只有顶点座标和纹理座标的情况

这段代码假设法线存在。就像我们在 [三维几何加工](webgl-3d-geometry-lathe.html) 里做的，
如果法线不存在，我们可以生成它，考虑到如果我们需要 smoothing group。
或者我们也可以不使用也不计算法线的不同着色器。

### 你不应该使用 .obj 文件

老实说，我认为你不应该使用 .obj 文件。我写这篇文章是作为一个例子。
如果你可以从一个文件中获取顶点数据，你可以为任意格式的文件写导入器。

.obj 文件的问题包括：

* 不支持光线或视角

  如果你加载大量部件（比如景观中的树、灌木、石头），你不需要视角或光线，这可能没问题。
  但文件如果提供选项让你能够原样导入作者创建的整个场景会更好。

* 没有层级，没有场景图

  如果你想要导入一辆车，你会希望车轮能够转向，并能够绕着中心点旋转。
  这对 .obj 文件来说是不可能的，因为 .obj 不包含 [场景图][webgl-scene-graph.html]。
  更好的文件格式包含这些数据，如果你想要能够旋转的部件、滑动窗户、开门、移动角色的腿等，这会很有用。

* 不支持动画或蒙皮

  相比于其它的，我们更想要 [蒙皮](webgl-skinning.html)，但 .obj 并没有蒙皮或者动画相关内容。
  如果你不需要这些，可能没什么问题。但我更偏向一种能包含更多内容的格式。

* .obj 不支持更多现代的材质

  材质一般来说针对于特定的引擎，但至少对于一些基于物理的材质渲染各引擎是共通的。
  据我所知，.obj 文件并不支持。

* .obj 需要解析

  除非你在写一个通用的查看器让用户上传 .obj 文件，通常最佳的做法是使用一个不太需要解析的文件格式。
  .gltf 是一种为 WebGL 设计的文件格式。它使用 JSON，你可以轻松地加载。
  对于二进制数据，它使用能直接加载进 GPU 的格式，一般不需要将数字解析进数组。

  你可以查看加载 .gltf 的例子 [蒙皮](webgl-skinning.html)。

  如果你想使用 .obj 文件，最佳实践是先将它转换成其它文件格式，然后在你的页面中使用。

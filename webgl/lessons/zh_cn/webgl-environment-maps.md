Title: WebGL 环境贴图 (反射)
Description: 如何实现环境贴图。
TOC: WebGL 环境贴图


这篇文章是WebGL系列文章的一部分从[基础概念](webgl-fundamentals.html)开始。上接[立方体纹理](webgl-cube-maps.html)。这篇文章也用到了[WebGL 三维方向光源](webgl-3d-lighting-directional.html)中介绍的概念。如果你尚未阅读这些文章，则可能需要先阅读这些文章。

*环境贴图*表示你所绘制物体的环境。如果你正在绘制室外场景它将表示室外环境。如果你正在绘制舞台上的人它将表示会场。如果你正在绘制外太空那它会是星星。 如果我们有能够展现从空间中一点看向6个方向的6张图片，我们可以用这6张图片实现环境贴图。

这是来自加州山景城计算机历史博物馆的环境贴图。

<div class="webgl_center">
  <img src="../resources/images/computer-history-museum/pos-x.jpg" style="width: 128px" class="border">
  <img src="../resources/images/computer-history-museum/neg-x.jpg" style="width: 128px" class="border">
  <img src="../resources/images/computer-history-museum/pos-y.jpg" style="width: 128px" class="border">
</div>
<div class="webgl_center">
  <img src="../resources/images/computer-history-museum/neg-y.jpg" style="width: 128px" class="border">
  <img src="../resources/images/computer-history-museum/pos-z.jpg" style="width: 128px" class="border">
  <img src="../resources/images/computer-history-museum/neg-z.jpg" style="width: 128px" class="border">
</div>

以[立方体纹理](webgl-cube-maps.html)中的代码为基础，我们使用6张图片代替我们生成的

```js
// 创建纹理。
var texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

const faceInfos = [
  {
    target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, 
    url: 'resources/images/computer-history-museum/pos-x.jpg',
  },
  {
    target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 
    url: 'resources/images/computer-history-museum/neg-x.jpg',
  },
  {
    target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 
    url: 'resources/images/computer-history-museum/pos-y.jpg',
  },
  {
    target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 
    url: 'resources/images/computer-history-museum/neg-y.jpg',
  },
  {
    target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 
    url: 'resources/images/computer-history-museum/pos-z.jpg',
  },
  {
    target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 
    url: 'resources/images/computer-history-museum/neg-z.jpg',
  },
];
faceInfos.forEach((faceInfo) => {
  const {target, url} = faceInfo;

  // 上传画布到立方体贴图的每个面
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 512;
  const height = 512;
  const format = gl.RGBA;
  const type = gl.UNSIGNED_BYTE;
  
  // 设置每个面，使其立即可渲染
  gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

  // 异步加载图片
  const image = new Image();
  image.src = url;
  image.addEventListener('load', function() {
    // 图片加载完成将其拷贝到纹理
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    gl.texImage2D(target, level, internalFormat, format, type, image);
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  });
});
gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
```

注意我们通过传`null`给`texImage2D`来给每个面填充512x512的空图片。立方体贴图必须有6个面，6个面必须是同样大小的正方形。如果不是纹理不会渲染。但是，我们加载6张图片。我们希望可以立即渲染，所以我们分配6个面然后开始加载图片。当每个图片加载完成再上传到相应的面再生成mipmap。这意味着我们可以立即开始渲染，在图片加载过程中立方体贴图的面可以依次被填充，6个面都没加载完成时也能被渲染。

但是，仅仅加载图片是不够的。与[光照](webgl-3d-lighting-point.html)一样，这里我们需要一点数学。

这里我们需要知道对于每个片元给定一个从视点／相机位置到物体表面的向量，它将反射到哪个方向。我们可以使用该方向从立方体贴图中获取颜色值。

反射的公式是

    reflectionDir = eyeToSurfaceDir – 
        2 ∗ dot(surfaceNormal, eyeToSurfaceDir) ∗ surfaceNormal

眼见为实。回忆关于[光照]的文章，点乘返回两个向量夹角的余弦值。向量相加得到一个新的向量，所以让我们来看一个视线垂直于平面的例子。

<div class="webgl_center"><img src="resources/reflect-180-01.svg" style="width: 400px"></div>

让我们可视化上边的公式。首先回想一下两个方向完全相反的向量点乘结果为-1，用图来表示

<div class="webgl_center"><img src="resources/reflect-180-02.svg" style="width: 400px"></div>

代入点乘结果和 <span style="color:black; font-weight:bold;">视点到平面的向量eyeToSurfaceDir</span> 和 <span style="color:green;">平面法向量surfaceNormal</span> 到反射公式得出结果

<div class="webgl_center"><img src="resources/reflect-180-03.svg" style="width: 400px"></div>

-2乘以-1得到正2。

<div class="webgl_center"><img src="resources/reflect-180-04.svg" style="width: 400px"></div>

相加向量得到<span style="color: red">反射向量reflectionDir</span>

<div class="webgl_center"><img src="resources/reflect-180-05.svg" style="width: 400px"></div>

我们可以看到给出的两个法向量, 一个完全抵消了视点发出的向量，另一个完全反射回了眼睛，正是在原图中我们期望得到的。

<div class="webgl_center"><img src="resources/reflect-180-06.svg" style="width: 400px"></div>

让我们向右旋转平面45度。

<div class="webgl_center"><img src="resources/reflect-45-01.svg" style="width: 400px"></div>

两个夹角为135度的向量点乘结果为-0.707

<div class="webgl_center"><img src="resources/reflect-45-02.svg" style="width: 400px"></div>

在公式中带入得到

<div class="webgl_center"><img src="resources/reflect-45-03.svg" style="width: 400px"></div>

同理负负得正，但是<span style="color: green">向量</span>现在缩短了30%。

<div class="webgl_center"><img src="resources/reflect-45-04.svg" style="width: 400px"></div>

向量相加得到了<span style="color: red">反射向量</span>

<div class="webgl_center"><img src="resources/reflect-45-05.svg" style="width: 400px"></div>

我们放回原始图来看是正确的。

<div class="webgl_center"><img src="resources/reflect-45-06.svg" style="width: 400px"></div>

我们用<span style="color: red">反射方向</span>选取立方体贴图的颜色来给物体表面着色。

这是一个你能改变旋转方向并能看到等式各个部分的图。你也可以看到反射向量指向立方体贴图的不同面从而影响物体表面的着色。

{{{diagram url="resources/environment-mapping.html" width="400" height="400" }}}
    
既然我们了解了反射是如何工作的，我们可以使用它从立方体纹理中选取颜色值，我们改变着色器来实现它.

首先在顶点着色器中我们会计算世界坐标系中的顶点位置和顶点法线，然后用varing传递它们给片断着色器。这和[三维聚光灯](webgl-3d-lighting-spot.html)文章中我们所做的相似。

```glsl
attribute vec4 a_position;
attribute vec3 a_normal;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

varying vec3 v_worldPosition;
varying vec3 v_worldNormal;

void main() {
  // 将位置与矩阵相乘。
  gl_Position = u_projection * u_view * u_world * a_position;

  // 传递世界位置给片断着色器
  v_worldPosition = (u_world * a_position).xyz;

  // 转换法线并传递给片断着色器
  v_worldNormal = mat3(u_world) * a_normal;
}
```

接下来在片断着色器中我们单位化worldNormal，因为顶点之间的法线会被插值。我们传递了世界坐标系中的相机位置接着用世界坐标系中的表面位置减去它我们得到了eyeToSurfaceDir。

最终我们用GLSL的内置函数`reflect`，它实现了我们之前介绍的公式。我们使用这个结果从立方体纹理中获得一个颜色值。

```glsl
precision highp float;

// 从顶点着色器传入的。
varying vec3 v_worldPosition;
varying vec3 v_worldNormal;

// 纹理。
uniform samplerCube u_texture;

// 相机位置。
uniform vec3 u_worldCameraPosition;

void main() {
  vec3 worldNormal = normalize(v_worldNormal);
  vec3 eyeToSurfaceDir = normalize(v_worldPosition - u_worldCameraPosition);
  vec3 direction = reflect(eyeToSurfaceDir,worldNormal);

  gl_FragColor = textureCube(u_texture, direction);
}
```

在这个例子中我们也需要真实法线。我们用真实法线所以立方体的面看起来是平的。在之前的例子中我们重新定位了立方体的位置为了看到立方体贴图如何工作。但是在这个例子中我们需要真实的法线就像[光照文章](webgl-3d-lighting-directional.html)中的一样。

初始化阶段

```js
// 创建缓冲来存法线
var normalBuffer = gl.createBuffer();
// 绑定它到ARRAY_BUFFER (可视为ARRAY_BUFFER = normalBuffer)
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
// 将法线数据赋给缓冲
setNormals(gl);
```

渲染阶段

```js
// 绑定normalbuffer
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

// 告诉属性怎么从normalBuffer (ARRAY_BUFFER)中取出数据
var size = 3;          // 每次迭代运行提取三个单位数据
var type = gl.FLOAT;   // 数据类型是32位浮点型
var normalize = false; // 不归一化数据
var stride = 0;        // 0 = 移动单位数量 * 每个单位占用内存sizeof(type)
var offset = 0;        // 从缓冲起始位置开始读取
gl.vertexAttribPointer(
    normalLocation, size, type, normalize, stride, offset)
```

当然我们需要在初始化阶段找到全局变量的位置

```
var projectionLocation = gl.getUniformLocation(program, "u_projection");
var viewLocation = gl.getUniformLocation(program, "u_view");
var worldLocation = gl.getUniformLocation(program, "u_world");
var textureLocation = gl.getUniformLocation(program, "u_texture");
var worldCameraPositionLocation = gl.getUniformLocation(program, "u_worldCameraPosition");
```

在渲染阶段给它们赋值

```
// 计算投影矩阵
var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
var projectionMatrix =
    m4.perspective(fieldOfViewRadians, aspect, 1, 2000);
gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);

var cameraPosition = [0, 0, 2];
var target = [0, 0, 0];
var up = [0, 1, 0];
// 用lookAt函数计算相机的世界矩阵
var cameraMatrix = m4.lookAt(cameraPosition, target, up);

// 通过相机的世界矩阵计算视图矩阵
var viewMatrix = m4.inverse(cameraMatrix);

var worldMatrix = m4.xRotation(modelXRotationRadians);
worldMatrix = m4.yRotate(worldMatrix, modelYRotationRadians);

// 设置全局变量
gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);
gl.uniformMatrix4fv(viewLocation, false, viewMatrix);
gl.uniformMatrix4fv(worldLocation, false, worldMatrix);
gl.uniform3fv(worldCameraPositionLocation, cameraPosition);

// 告诉着色器对于u_texture使用纹理单元0
gl.uniform1i(textureLocation, 0);
```

基本反射

{{{example url="../webgl-environment-map.html" }}}

接下来让我们看怎样用立方体贴图实现[天空盒](webgl-skybox.html).



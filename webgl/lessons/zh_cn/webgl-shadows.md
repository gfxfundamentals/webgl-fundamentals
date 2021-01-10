Title: WebGL 阴影
Description: 如何计算阴影
TOC: 阴影

让我们绘制一些阴影！

## 前提条件

计算基本的阴影并没有*那么*难，但是需要一些背景知识。为了能够理解本文，你需要已经理解以下话题。

* [正射投影](webgl-3d-orthographic.html)
* [透视投影](webgl-3d-perspective.html)
* [聚光灯](webgl-3d-lighting-spot.html)
* [纹理](webgl-3d-textures.html)
* [渲染到纹理](webgl-render-to-texture.html)
* [投影纹理](webgl-planar-projection-mapping.html)
* [可视化相机](webgl-visualizing-the-camera.html)

因此，如果你还没有阅读过这些话题，请先去读一下。

首先，本文假设你已经读过 [码少趣多](webgl-less-code-more-fun.html)，因为本文使用到了那里提到的库，以便使得本文的例子更整洁。如果你不明白 `webglUtils.setBuffersAndAttributes` 函数是设置 buffers 和 attributes 的，或者不明白 `webglUtils.setUniforms` 函数是设置 uniforms 的，等等之类的函数你都不能理解，那么你可能要往回 [read the fundamentals](webgl-fundamentals.html)。

首先，绘制阴影的方法不止一种。每一种方法都有它们的优缺点。绘制阴影最常见的方法是使用阴影映射（shadow map）。

阴影映射是通过组合上面前提条件文章中提到的技术来实现的。

在 [平面的投影映射文章](webgl-planar-projection-mapping.html) 中，我们知道了如何将一张图像投影到物体上

{{{example url="../webgl-planar-projection-with-projection-matrix.html"}}}

回想一下，我们并没有把那张图像绘制在场景的物体上，而是在物体被渲染的时候，对于每一个像素，我们都会检查被投影的纹理是否在范围内，如果在范围内，我们会从被投影的纹理中采样相应的颜色，如果不在范围内，则我们就会从另一个不同的纹理中采样一个颜色，纹理的颜色是通过使用纹理坐标进行查找的，纹理坐标把一个纹理映射到了物体上。

如果被投影的纹理里包含了来自光源视角的深度数据，则会怎么样？换句话说，假设上面的例子中，在视椎体的顶端有一个光源，而被投影的纹理包含了在该光源视角下的深度信息。结果是，球体会得到一个更加接近光源的深度值，而平面会得到一个稍微远离光源的深度值。

<div class="webgl_center"><img class="noinvertdark" src="resources/depth-map-generation.svg" style="width: 600px;"></div>

如果我们具有了这些深度信息，那么我们在选择要渲染哪个颜色的时候，我们就可以从被投影的纹理中进行采样，得到一个采样深度值，然后和当前正在绘制的像素的深度值进行比较。如果当前像素的深度值比采样得到的深度值大，则说明还有其他东西比当前像素更加接近光源。也就是说，某样东西挡住了光源，因此该像素是处于阴影中的。

<div class="webgl_center"><img class="noinvertdark" src="resources/projected-depth-texture.svg" style="width: 600px;"></div>

其中，深度纹理被投影到光源视角下的视椎体内。当我们绘制地板的像素时，我们会计算在光源视角下，该像素的深度值（在上图中是 0.3）。然后我们在被投影的深度纹理中找到对应的深度值。在光源视角下，纹理内的深度值是 0.1，因为光线首先击中的是球体。因为 0.1 &lt; 0.3，所以我们知道该位置的地板一定在阴影内。

首先，我们来绘制阴影映射。我们会取 [平面的投影映射文章](webgl-planar-projection-mapping.html) 的最后一个示例，但我们并不是加载一个纹理，我们会 [渲染到纹理](webgl-render-to-texture.html)。在 [那篇文章](webgl-render-to-texture.html) 中，我们使用了一个深度渲染缓冲。这为我们提供了一个深度缓冲，以帮助对像素的排序，但是，我们并不能使用一个深度渲染缓冲作为一个纹理输入到着色器中。幸运的是，有一个名为 `WEBGL_depth_texture` 的 WebGL 扩展，我们可以尝试开启该扩展，它会给我们提供深度纹理。有了深度纹理，我们就可以把它附加到一个帧缓冲 上，然后使用该纹理作为着色器的输入。检查并开启该扩展的代码是：

```js
function main() {
  // 获得一个 WebGL context
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector('#canvas');
  const gl = canvas.getContext('webgl');
  if (!gl) {
    return;
  }

+  const ext = gl.getExtension('WEBGL_depth_texture');
+  if (!ext) {
+    return;
+  }
}
```

现在，和 [渲染到纹理文章](webgl-render-to-texture.html) 中的类似，我们创建一个纹理和一个帧缓冲，然后把该纹理作为 `DEPTH_ATTACHMENT` 附加到帧缓冲上。

```js
const depthTexture = gl.createTexture();
const depthTextureSize = 512;
gl.bindTexture(gl.TEXTURE_2D, depthTexture);
gl.texImage2D(
    gl.TEXTURE_2D,      // target
    0,                  // mip level
    gl.DEPTH_COMPONENT, // internal format
    depthTextureSize,   // width
    depthTextureSize,   // height
    0,                  // border
    gl.DEPTH_COMPONENT, // format
    gl.UNSIGNED_INT,    // type
    null);              // data
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

const depthFramebuffer = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
gl.framebufferTexture2D(
    gl.FRAMEBUFFER,       // target
    gl.DEPTH_ATTACHMENT,  // attachment point
    gl.TEXTURE_2D,        // texture target
    depthTexture,         // texture
    0);                   // mip level
```

[由于种种原因](#attachment-combinations)，我们还需要创建一个颜色纹理并把它作为一个 color attachment 附加到帧缓冲上，即使我们并不会使用它。

```js
// 创建一个和深度纹理相同尺寸的颜色纹理
const unusedTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, unusedTexture);
gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    depthTextureSize,
    depthTextureSize,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null,
);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

// 把它附加到该帧缓冲上
gl.framebufferTexture2D(
    gl.FRAMEBUFFER,        // target
    gl.COLOR_ATTACHMENT0,  // attachment point
    gl.TEXTURE_2D,         // texture target
    unusedTexture,         // texture
    0);                    // mip level
```

为了使用深度纹理，我们还需要能够使用不同的着色器来渲染场景多次。一次是一个简单的着色器，只是为了渲染到深度纹理上，然后再使用我们当前的着色器，该着色器会投影一个纹理。

因此，首先让我们来修改一下 `drawScene` 函数，以便我们可以传入我们想要用来渲染的着色器程序

```js
-function drawScene(projectionMatrix, cameraMatrix, textureMatrix) {
+function drawScene(projectionMatrix, cameraMatrix, textureMatrix, programInfo) {
  // 从相机矩阵中创建一个视图矩阵
  const viewMatrix = m4.inverse(cameraMatrix);

-  gl.useProgram(textureProgramInfo.program);
+  gl.useProgram(programInfo.program);

  // 设置对于球体和平面都是一样的 uniforms
  // 注意：在着色器中，任何没有对应 uniform 的值都会被忽略。
-  webglUtils.setUniforms(textureProgramInfo, {
+  webglUtils.setUniforms(programInfo, {
    u_view: viewMatrix,
    u_projection: projectionMatrix,
*    u_textureMatrix: textureMatrix,
-    u_projectedTexture: imageTexture,
+    u_projectedTexture: depthTexture,
  });

  // ------ 绘制球体 --------

  // 设置所有需要的 attributes
-  webglUtils.setBuffersAndAttributes(gl, textureProgramInfo, sphereBufferInfo);
+  webglUtils.setBuffersAndAttributes(gl, programInfo, sphereBufferInfo);

  // 设置球体特有的 uniforms
-  webglUtils.setUniforms(textureProgramInfo, sphereUniforms);
+  webglUtils.setUniforms(programInfo, sphereUniforms);

  // 调用 gl.drawArrays 或 gl.drawElements
  webglUtils.drawBufferInfo(gl, sphereBufferInfo);

  // ------ 绘制平面 --------

  // 设置所有需要的 attributes
-  webglUtils.setBuffersAndAttributes(gl, textureProgramInfo, planeBufferInfo);
+  webglUtils.setBuffersAndAttributes(gl, programInfo, planeBufferInfo);

  // 设置我们刚刚计算的 uniforms
-  webglUtils.setUniforms(textureProgramInfo, planeUniforms);
+  webglUtils.setUniforms(programInfo, planeUniforms);

  // 调用 gl.drawArrays 或 gl.drawElements
  webglUtils.drawBufferInfo(gl, planeBufferInfo);
}
```

现在，让我们使用该函数从光源视角绘制一次场景，然后使用深度纹理再绘制一次场景

```js
function render() {
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  // 首先从光源的视角绘制一次
-  const textureWorldMatrix = m4.lookAt(
+  const lightWorldMatrix = m4.lookAt(
      [settings.posX, settings.posY, settings.posZ],          // position
      [settings.targetX, settings.targetY, settings.targetZ], // target
      [0, 1, 0],                                              // up
  );
-  const textureProjectionMatrix = settings.perspective
+  const lightProjectionMatrix = settings.perspective
      ? m4.perspective(
          degToRad(settings.fieldOfView),
          settings.projWidth / settings.projHeight,
          0.5,  // near
          10)   // far
      : m4.orthographic(
          -settings.projWidth / 2,   // left
           settings.projWidth / 2,   // right
          -settings.projHeight / 2,  // bottom
           settings.projHeight / 2,  // top
           0.5,                      // near
           10);                      // far

+  // 绘制到深度纹理
+  gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
+  gl.viewport(0, 0, depthTextureSize, depthTextureSize);
+  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

-  drawScene(textureProjectionMatrix, textureWorldMatrix, m4.identity());
+  drawScene(lightProjectionMatrix, lightWorldMatrix, m4.identity(), colorProgramInfo);

+  // 现在绘制场景到画布，把深度纹理投影到场景内
+  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
+  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
+  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  let textureMatrix = m4.identity();
  textureMatrix = m4.translate(textureMatrix, 0.5, 0.5, 0.5);
  textureMatrix = m4.scale(textureMatrix, 0.5, 0.5, 0.5);
-  textureMatrix = m4.multiply(textureMatrix, textureProjectionMatrix);
+  textureMatrix = m4.multiply(textureMatrix, lightProjectionMatrix);
  // 使用该世界矩阵的逆矩阵来创建一个
  // 可以变换其他坐标为相对于这个世界空间
  // 的矩阵。
  textureMatrix = m4.multiply(
      textureMatrix,
-      m4.inverse(textureWorldMatrix));
+      m4.inverse(lightWorldMatrix));

  // 计算投影矩阵
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const projectionMatrix =
      m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

  // 使用 look at 计算相机的矩阵
  const cameraPosition = [settings.cameraX, settings.cameraY, 7];
  const target = [0, 0, 0];
  const up = [0, 1, 0];
  const cameraMatrix = m4.lookAt(cameraPosition, target, up);

-  drawScene(projectionMatrix, cameraMatrix, textureMatrix); 
+  drawScene(projectionMatrix, cameraMatrix, textureMatrix, textureProgramInfo); 
}
```

注意，我把 `textureWorldMatrix` 重命名成了 `lightWorldMatrix`，而 `textureProjectionMatrix` 重命名成了 `lightProjectionMatrix`。它们和之前还是一样的，只不过之前我们是投影纹理到一个任意空间内的。现在我们尝试从光源视角投影一个阴影映射。在数学上是一样的，但重命名这些变量似乎更合适。

在上面的代码中，我们首先使用之前绘制视椎体线框的着色器来渲染球体和平面到深度纹理中。那个着色器只会绘制了纯色的东西，并没有做什么特别的事情，这就是当渲染到深度纹理时我们所需要做的全部事情。

然后，我们再渲染场景到画布中，就像我们之前做的那样，把纹理投影到场景内。当我们在着色器内引用深度纹理时，只有红色分量是有效的，所以我们会重复红色分量作为绿色分量和蓝色分量。

```glsl
void main() {
  vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
  bool inRange = 
      projectedTexcoord.x >= 0.0 &&
      projectedTexcoord.x <= 1.0 &&
      projectedTexcoord.y >= 0.0 &&
      projectedTexcoord.y <= 1.0;

-  vec4 projectedTexColor = texture2D(u_projectedTexture, projectedTexcoord.xy);
+  // 'r' 通道内包含深度值
+  vec4 projectedTexColor = vec4(texture2D(u_projectedTexture, projectedTexcoord.xy).rrr, 1);
  vec4 texColor = texture2D(u_texture, v_texcoord) * u_colorMult;
  float projectedAmount = inRange ? 1.0 : 0.0;
  gl_FragColor = mix(texColor, projectedTexColor, projectedAmount);
}
```

趁此机会，让我们添加一个立方体到场景中

```js
+const cubeBufferInfo = primitives.createCubeBufferInfo(
+    gl,
+    2,  // size
+);

...

+const cubeUniforms = {
+  u_colorMult: [0.5, 1, 0.5, 1],  // 绿色的光源
+  u_color: [0, 0, 1, 1],
+  u_texture: checkerboardTexture,
+  u_world: m4.translation(3, 1, 0),
+};

...

function drawScene(projectionMatrix, cameraMatrix, textureMatrix, programInfo) {

    ...

+    // ------ 绘制立方体 --------
+
+    // 设置所需要的所有 attributes
+    webglUtils.setBuffersAndAttributes(gl, programInfo, cubeBufferInfo);
+
+    // 设置我们刚刚计算的 uniforms
+    webglUtils.setUniforms(programInfo, cubeUniforms);
+
+    // 调用 gl.drawArrays 或 gl.drawElements
+    webglUtils.drawBufferInfo(gl, cubeBufferInfo);

...
```

然后让我们来调整一下设置。我们会移动相机和为了使纹理投影可以覆盖到的范围更大，我们会加宽视场角。

```js
const settings = {
-  cameraX: 2.5,
+  cameraX: 6,
  cameraY: 5,
  posX: 2.5,
  posY: 4.8,
  posZ: 4.3,
  targetX: 2.5,
  targetY: 0,
  targetZ: 3.5,
  projWidth: 1,
  projHeight: 1,
  perspective: true,
-  fieldOfView: 45,
+  fieldOfView: 120,
};
```

注意：我把绘制表示视椎体的线框立方体的代码移到了 `drawScene` 函数的外面。

{{{example url="../webgl-shadows-depth-texture.html"}}}

这和上面的例子是完全一样的，只不过我们不是通过加载一个图像，而是通过渲染场景来生成一个深度纹理。如果你想要验证的话，可以把 `cameraX` 改回 2.5，把 `fieldOfView` 改回 45，这样就会和上面例子看起来一样了，除了我们投影的是深度纹理，而不是加载一个图像外。

深度值的范围是 0.0 到 1.0，代表它们在视椎体内的位置，因此 0.0（暗）表示接近视椎体的顶端的那端，而 1.0（亮）则是位于较远的开口那端。

因此，剩下要做的就是，我们不在投影纹理的颜色和映射纹理的颜色中做选择，我们可以使用深度纹理中的深度值来检查深度纹理的 Z 位置是离光源更近还是更远，然后再检查要绘制的像素的深度值。如果深度纹理的深度值更小，则表明有某物挡住了光源，该像素位于阴影中。

```glsl
void main() {
  vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
+  float currentDepth = projectedTexcoord.z;

  bool inRange = 
      projectedTexcoord.x >= 0.0 &&
      projectedTexcoord.x <= 1.0 &&
      projectedTexcoord.y >= 0.0 &&
      projectedTexcoord.y <= 1.0;

-  vec4 projectedTexColor = vec4(texture2D(u_projectedTexture, projectedTexcoord.xy).rrr, 1);
+  float projectedDepth = texture2D(u_projectedTexture, projectedTexcoord.xy).r;
+  float shadowLight = (inRange && projectedDepth <= currentDepth) ? 0.0 : 1.0;  

  vec4 texColor = texture2D(u_texture, v_texcoord) * u_colorMult;
-  gl_FragColor = mix(texColor, projectedTexColor, projectedAmount);
+  gl_FragColor = vec4(texColor.rgb * shadowLight, texColor.a);
}
```

在上面的代码中，如果 `projectedDepth` 小于 `currentDepth` ，则从光源视角来看，有某物更加接近光源，所以正在绘制的像素位于阴影中。

如果我们运行它，我们就会得到一个阴影

{{{example url="../webgl-shadows-basic.html" }}}

有点像样了，我们可以在地面看到球体的阴影，但是这些位于应该没有阴影的地方的奇怪图案是什么？这些图案被称为*阴影痤疮（shadow acne）*。这些图案的来源是因为存储在深度纹理里的深度数据已经被量化了，深度数据已经是一个纹理，一个像素网格了，它被从光源视角中投影出来，但是我们要把它和相机视角的深度值进行比较。即意味着在这个深度纹理网格中的值和我们相机没有对齐，因此，当我们计算 `currentDepth` 时，有时会出现比 `projectedDepth` 稍微大的值，有时会出现稍微小的值。

让我们添加一个偏差值（bias）。

```glsl
...

+uniform float u_bias;

void main() {
  vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
-  float currentDepth = projectedTexcoord.z;
+  float currentDepth = projectedTexcoord.z + u_bias;

  bool inRange = 
      projectedTexcoord.x >= 0.0 &&
      projectedTexcoord.x <= 1.0 &&
      projectedTexcoord.y >= 0.0 &&
      projectedTexcoord.y <= 1.0;

  float projectedDepth = texture2D(u_projectedTexture, projectedTexcoord.xy).r;
  float shadowLight = (inRange && projectedDepth <= currentDepth) ? 0.0 : 1.0;  

  vec4 texColor = texture2D(u_texture, v_texcoord) * u_colorMult;
  gl_FragColor = vec4(texColor.rgb * shadowLight, texColor.a);
}
```

而且我们需要设置它

```js
const settings = {
  cameraX: 2.75,
  cameraY: 5,
  posX: 2.5,
  posY: 4.8,
  posZ: 4.3,
  targetX: 2.5,
  targetY: 0,
  targetZ: 3.5,
  projWidth: 1,
  projHeight: 1,
  perspective: true,
  fieldOfView: 120,
+  bias: -0.006,
};

...

function drawScene(projectionMatrix, cameraMatrix, textureMatrix, programInfo, /**/u_lightWorldMatrix) {
  // 从相机矩阵中创建一个视图矩阵
  const viewMatrix = m4.inverse(cameraMatrix);

  gl.useProgram(programInfo.program);

  // 设置对于球体和平面都是一样的 uniforms
  // 注意：在着色器中，任何没有对应 uniform 的值都会被忽略。
  webglUtils.setUniforms(programInfo, {
    u_view: viewMatrix,
    u_projection: projectionMatrix,
+    u_bias: settings.bias,
    u_textureMatrix: textureMatrix,
    u_projectedTexture: depthTexture,
  });

  ...
```

{{{example url="../webgl-shadows-basic-w-bias.html"}}}

滑动偏差值，你可以看到它如何影响图案的出现时间和出现地方。

为了更接近于完整，让我们真地添加一个聚光灯，聚光灯的计算方法从 [聚光灯文章](webgl-3d-lighting-spot.html) 中来。

首先，让我们直接从 [那篇文章](webgl-3d-lighting-spot.html) 中粘贴我们需要的部分到顶点着色器中。

```glsl
attribute vec4 a_position;
attribute vec2 a_texcoord;
+attribute vec3 a_normal;

+uniform vec3 u_lightWorldPosition;
+uniform vec3 u_viewWorldPosition;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;
uniform mat4 u_textureMatrix;

varying vec2 v_texcoord;
varying vec4 v_projectedTexcoord;
+varying vec3 v_normal;

+varying vec3 v_surfaceToLight;
+varying vec3 v_surfaceToView;

void main() {
  // 将坐标乘以矩阵
  vec4 worldPosition = u_world * a_position;

  gl_Position = u_projection * u_view * worldPosition;

  // 将纹理坐标传给片段着色器
  v_texcoord = a_texcoord;

  v_projectedTexcoord = u_textureMatrix * worldPosition;

+  // 调整法线方位并传给片段着色器
+  v_normal = mat3(u_world) * a_normal;
+
+  // 计算物体表面的世界坐标
+  vec3 surfaceWorldPosition = (u_world * a_position).xyz;
+
+  // 计算物体表面指向光源的向量
+  // 然后将它传给片段着色器
+  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
+
+  // 计算物体表面指向相机的向量
+  // 然后将它传给片段着色器
+  v_surfaceToView = u_viewWorldPosition - surfaceWorldPosition;
}
```

接着是片段着色器

```glsl
precision mediump float;

// 从顶点着色器中传入
varying vec2 v_texcoord;
varying vec4 v_projectedTexcoord;
+varying vec3 v_normal;
+varying vec3 v_surfaceToLight;
+varying vec3 v_surfaceToView;

uniform vec4 u_colorMult;
uniform sampler2D u_texture;
uniform sampler2D u_projectedTexture;
uniform float u_bias;
+uniform float u_shininess;
+uniform vec3 u_lightDirection;
+uniform float u_innerLimit;          // in dot space
+uniform float u_outerLimit;          // in dot space

void main() {
+  // 因为 v_normal 是一个 varying，它已经被插值了
+  // 所以它不会是一个单位向量。对它进行归一化
+  // 使其再次成为单位向量
+  vec3 normal = normalize(v_normal);
+
+  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
+  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
+  vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);
+
+  float dotFromDirection = dot(surfaceToLightDirection,
+                               -u_lightDirection);
+  float limitRange = u_innerLimit - u_outerLimit;
+  float inLight = clamp((dotFromDirection - u_outerLimit) / limitRange, 0.0, 1.0);
+  float light = inLight * dot(normal, surfaceToLightDirection);
+  float specular = inLight * pow(dot(normal, halfVector), u_shininess);

  vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
  float currentDepth = projectedTexcoord.z + u_bias;

  bool inRange =
      projectedTexcoord.x >= 0.0 &&
      projectedTexcoord.x <= 1.0 &&
      projectedTexcoord.y >= 0.0 &&
      projectedTexcoord.y <= 1.0;

  // 'r' 通道内包含深度值
  float projectedDepth = texture2D(u_projectedTexture, projectedTexcoord.xy).r;
  float shadowLight = (inRange && projectedDepth <= currentDepth) ? 0.0 : 1.0;

  vec4 texColor = texture2D(u_texture, v_texcoord) * u_colorMult;
-  gl_FragColor = vec4(texColor.rgb * shadowLight, texColor.a);
+  gl_FragColor = vec4(
+      texColor.rgb * light * shadowLight +
+      specular * shadowLight,
+      texColor.a);
}
```

注意，我们只需要使用 `shadowLight` 来调整 `light` 和 `specular` 的效果。如果一个物体位于阴影内，则没有光。

然后我们还需要设置好 uniforms

```js
-function drawScene(projectionMatrix, cameraMatrix, textureMatrix, programInfo) {
+function drawScene(
+    projectionMatrix,
+    cameraMatrix,
+    textureMatrix,
+    lightWorldMatrix,
+    programInfo) {
  // 从相机矩阵中创建一个视图矩阵
  const viewMatrix = m4.inverse(cameraMatrix);

  gl.useProgram(programInfo.program);

  // 设置对于球体和平面都是一样的 uniforms
  // 注意：在着色器中，任何没有对应 uniform 的值都会被忽略。  
  webglUtils.setUniforms(programInfo, {
    u_view: viewMatrix,
    u_projection: projectionMatrix,
    u_bias: settings.bias,
    u_textureMatrix: textureMatrix,
    u_projectedTexture: depthTexture,
+    u_shininess: 150,
+    u_innerLimit: Math.cos(degToRad(settings.fieldOfView / 2 - 10)),
+    u_outerLimit: Math.cos(degToRad(settings.fieldOfView / 2)),
+    u_lightDirection: lightWorldMatrix.slice(8, 11).map(v => -v),
+    u_lightWorldPosition: lightWorldMatrix.slice(12, 15),
+    u_viewWorldPosition: cameraMatrix.slice(12, 15),
  });

...

function render() {
  ...

-  drawScene(lightProjectionMatrix, lightWorldMatrix, m4.identity(), colorProgramInfo);
+  drawScene(
+      lightProjectionMatrix,
+      lightWorldMatrix,
+      m4.identity(),
+      lightWorldMatrix,
+      colorProgramInfo);

  ...

-  drawScene(projectionMatrix, cameraMatrix, textureMatrix, textureProgramInfo);
+  drawScene(
+      projectionMatrix,
+      cameraMatrix,
+      textureMatrix,
+      lightWorldMatrix,
+      textureProgramInfo);

  ...
}
```

介绍一下其中一些 uniform 设置。回想一下 [聚光灯文章](webgl-3d-lighting-spot.html) 的 innerLimit 和 outerLimit 设置都是在点乘空间（余弦空间）内的，而我们只需要一半的视场角，因为它们会绕着光源的方向进行延伸。再回想一下 [相机文章](webgl-3d-camera.html) 中 4x4 矩阵的第 3 行是 Z 轴，所以我们从 `lightWorldMatrix` 的第 3 行中拉取前 3 个值，就会得到光源的 -Z 方向。我们想要的是 +Z 方向，所以我们对它进行翻转。类似地，相机文章还告诉了我们，第 4 行是世界坐标，所以我们可以通过从对应矩阵中把它们拉取出来得到 lightWorldPosition 和 viewWorldPosition（即相机的世界坐标）。当然，我们也可以通过暴露更多的设置或者传入更多的变量来得到它们。

让我们把背景清除为黑色，并设置视椎体线框为白色

```js
function render() {

  ...

  // 现在绘制场景到画布，并投影深度纹理到场景
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
+  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  ...

  // ------ 绘制视椎体 ------
  {

    ...

          // 设置我们刚刚计算的 uniforms
    webglUtils.setUniforms(colorProgramInfo, {
-      u_color: [0, 0, 0, 1],
+      u_color: [1, 1, 1, 1],
      u_view: viewMatrix,
      u_projection: projectionMatrix,
      u_world: mat,
    });
```

现在，我们有了一个带阴影的聚光灯。

{{{example url="../webgl-shadows-w-spot-light.html" }}}

对于方向光源，我们可以从 [方向光源文章](webgl-3d-lighting-directional.html) 中拷贝它的着色器，然后将我们的投影从透视的改为正射的即可。

首先是顶点着色器

```glsl
attribute vec4 a_position;
attribute vec2 a_texcoord;
+attribute vec3 a_normal;

-uniform vec3 u_lightWorldPosition;
-uniform vec3 u_viewWorldPosition;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;
uniform mat4 u_textureMatrix;

varying vec2 v_texcoord;
varying vec4 v_projectedTexcoord;
varying vec3 v_normal;

-varying vec3 v_surfaceToLight;
-varying vec3 v_surfaceToView;

void main() {
  // 将坐标乘以矩阵
  vec4 worldPosition = u_world * a_position;

  gl_Position = u_projection * u_view * worldPosition;

  // 将纹理坐标传给片段着色器
  v_texcoord = a_texcoord;

  v_projectedTexcoord = u_textureMatrix * worldPosition;

  // 调整法线方位并传给片段着色器
  v_normal = mat3(u_world) * a_normal;

-  // 计算物体表面的世界坐标
-  vec3 surfaceWorldPosition = (u_world * a_position).xyz;
-
-  // 计算物体表面指向光源的向量
-  // 然后将它传给片段着色器
-  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
-
-  // 计算物体表面指向相机的向量
-  // 然后将它传给片段着色器
-  v_surfaceToView = u_viewWorldPosition - surfaceWorldPosition;
}
```

接着是片段着色器

```glsl
precision mediump float;

// 从顶点着色器中传入
varying vec2 v_texcoord;
varying vec4 v_projectedTexcoord;
varying vec3 v_normal;
-varying vec3 v_surfaceToLight;
-varying vec3 v_surfaceToView;

uniform vec4 u_colorMult;
uniform sampler2D u_texture;
uniform sampler2D u_projectedTexture;
uniform float u_bias;
-uniform float u_shininess;
-uniform vec3 u_lightDirection;
-uniform float u_innerLimit;          // in dot space
-uniform float u_outerLimit;          // in dot space
+uniform vec3 u_reverseLightDirection;

void main() {
  // 因为 v_normal 是一个 varying，它已经被插值了
  // 所以它不会是一个单位向量。对它进行归一化
  // 使其再次成为单位向量
  vec3 normal = normalize(v_normal);

+  float light = dot(normal, u_reverseLightDirection);

-  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
-  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
-  vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);
-
-  float dotFromDirection = dot(surfaceToLightDirection,
-                               -u_lightDirection);
-  float limitRange = u_innerLimit - u_outerLimit;
-  float inLight = clamp((dotFromDirection - u_outerLimit) / limitRange, 0.0, 1.0);
-  float light = inLight * dot(normal, surfaceToLightDirection);
-  float specular = inLight * pow(dot(normal, halfVector), u_shininess);

  vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
  float currentDepth = projectedTexcoord.z + u_bias;

  bool inRange =
      projectedTexcoord.x >= 0.0 &&
      projectedTexcoord.x <= 1.0 &&
      projectedTexcoord.y >= 0.0 &&
      projectedTexcoord.y <= 1.0;

  // 'r' 通道内包含深度值
  float projectedDepth = texture2D(u_projectedTexture, projectedTexcoord.xy).r;
  float shadowLight = (inRange && projectedDepth <= currentDepth) ? 0.0 : 1.0;

  vec4 texColor = texture2D(u_texture, v_texcoord) * u_colorMult;
  gl_FragColor = vec4(
-      texColor.rgb * light * shadowLight +
-      specular * shadowLight,
+      texColor.rgb * light * shadowLight,
      texColor.a);
}
```

和 uniforms

```js
  // 设置对于球体和平面都是一样的 uniforms
  // 注意：在着色器中，任何没有对应 uniform 的值都会被忽略。
  webglUtils.setUniforms(programInfo, {
    u_view: viewMatrix,
    u_projection: projectionMatrix,
    u_bias: settings.bias,
    u_textureMatrix: textureMatrix,
    u_projectedTexture: depthTexture,
-    u_shininess: 150,
-    u_innerLimit: Math.cos(degToRad(settings.fieldOfView / 2 - 10)),
-    u_outerLimit: Math.cos(degToRad(settings.fieldOfView / 2)),
-    u_lightDirection: lightWorldMatrix.slice(8, 11).map(v => -v),
-    u_lightWorldPosition: lightWorldMatrix.slice(12, 15),
-    u_viewWorldPosition: cameraMatrix.slice(12, 15),
+    u_reverseLightDirection: lightWorldMatrix.slice(8, 11),
  });
```

我调整了相机位置以便看到更大的场景。

{{{example url="../webgl-shadows-w-directional-light.html"}}}

从上面的代码中应该可以看出某个问题，即我们的阴影映射分辨率只有那么大，所以即使计算方向光源只需要一个方向，不需要光源本身的位置，但为了能够决定哪块区域需要计算并应用阴影映射，我们仍然需要选择一个光源位置。

本文越来越长了，但还有很多和阴影相关的东西没有讲，所以我们把剩下的留到 [下一篇文章](webgl-shadows-continued.html)。

<div class="webgl_bottombar">
<a id="attachment-combinations"></a>
<h3>我们为什么要创建一个不会使用的颜色纹理？</h3>
<p>下面我们进入到 WebGL 规范的细节中。</p>
<p>WebGL 是基于 OpenGL ES 2.0 的，而 <a href="https://www.khronos.org/registry/webgl/specs/latest/1.0/">WebGL 规范</a>
基本上说 WebGL 遵循 OpenGL ES 2.0 规范，除了 WebGL 规范中列出的例外。</p>
<p>当你创建一个帧缓冲时，你就会添加 attachments。你可以添加所有类型的 attachments。在上面的例子中，我们添加了一个 RGBA/UNSIGNED_BYTE 纹理 color attachment 和一个深度纹理 attachment。在渲染到纹理文章中，我们附加了一个类似的 color attachment，但我们附加的另一个 attachment 是一个深度渲染缓冲，而不是一个深度纹理。我们还可以附加一个 RGB 纹理，一个 LUMINANCE 纹理，和许多其他类型的纹理和渲染缓冲。</p>
<p><a href="">OpenGL ES 2.0 规范</a> 给出了一堆关于某个 attachments 组合是否可以一起工作的规则。其中一个规则是至少有一个 attachment。另一个规则是它们必须具有相同的尺寸。最后的规则是</p>
<blockquote>
<h4>4.4.5 Framebuffer Completeness</h4>
<p>
The combination of internal formats of the attached images does not violate an <b>implementation-dependent</b> set of restrictions.
</p>
</blockquote>
<p>
这个不幸的措辞意味着<b>即使没有 attachments 组合也能正常工作！</b>
</p>
<p>
WebGL 委员会看到了这一点并决定要求 WebGL 实现至少支持 3 种常见组合。从 <a href="https://www.khronos.org/registry/webgl/specs/latest/1.0/#6.8">WebGL 规范的第 6.8 节</a> 来看，这些组合是：
<blockquote>
<ul>
  <li><code>COLOR_ATTACHMENT0</code> = <code>RGBA</code>/<code>UNSIGNED_BYTE</code> texture</li>
  <li><code>COLOR_ATTACHMENT0</code> = <code>RGBA</code>/<code>UNSIGNED_BYTE</code> texture + <code>DEPTH_ATTACHMENT</code> = <code>DEPTH_COMPONENT16</code> renderbuffer</li>
  <li><code>COLOR_ATTACHMENT0</code> = <code>RGBA</code>/<code>UNSIGNED_BYTE</code> texture + <code>DEPTH_STENCIL_ATTACHMENT</code> = <code>DEPTH_STENCIL</code> renderbuffer</li>
</blockquote>
<p>
后来 <a href="https://www.khronos.org/registry/webgl/extensions/WEBGL_depth_texture/">WEBGL_depth_texture</a> 扩展被创建。
该扩展真正说的是，你可以创建深度纹理，你也可以附加它们到帧缓冲中，但该扩展没有说更多关于所需组合的内容。所以，考虑到 OpenGL ES 2.0 规范的规则说，什么样的组合可以正常工作是由具体的实现决定的，考虑到 WebGL 规范只列出了 3 种必须正常工作的组合，而这 3 种组合都不包含深度纹理，只有深度渲染缓冲，这意味着并不保证使用深度纹理总是可以正常工作，至少根据规范是这样的。
</p>
<p>
实际上，似乎大多数驱动本身可以在只附加深度纹理的情况下正常工作。不幸的是，至少在 2020 年二月之前，Safari 不允许这种组合可以正常工作。它要求必须还要有一个 color attachment，很有可能需要一个 <code>RGBA</code>/<code>UNSIGNED_BYTE</code> color attachment。实际上，没有 color attachment 会失败也是符合上面的 WebGL 规范的。
</p>
<p>
总而言之，我们需要未使用的颜色纹理才能在 Safari 中正常工作。遗憾的是，这样也仍然不能保证这种组合可以在所有的驱动/gpus/浏览器中正常工作。幸运的是，这种组合看起来在任何地方都能够正常工作。同样幸运的是，<a href="https://webgl2fundamentals.org">WebGL2</a> 所基于的 OpenGL ES 3.0 修改了规范，要求更多的组合也能正常工作。不幸的是，截止 2020 年二月，<a href="https://webgl2fundamentals.org/webgl/lessons/webgl-getting-webgl2.html">Safari 还不支持 WebGL2</a>。所以，在 WebGL1 中，我们需要添加未使用的颜色纹理，然后祈祷它可以正常工作。😭
</p>
</div>
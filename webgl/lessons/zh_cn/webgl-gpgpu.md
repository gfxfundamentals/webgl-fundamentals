Title: WebGL GPGPU
Description: 如何用 WebGL 做通用计算
TOC: GPGPU

GPGPU 是 "General Purpose" GPU，意思是用 GPU 来做绘制像素之外的事情。

对 GPGPU 最基本的认知是理解一个纹理并不是一个图片，而是一些值的二维数组。在文章 [the article on textures](webgl-3d-textures.html) 中我们提到了读取纹理。在 [the article on rendering to a texture](webgl-render-to-texture.html) 中我们提到了向纹理中写入数据。所以，如果我们意识到一个纹理是一个 2D 数组的值，我们已经描述过读取和写入 2D 数组的方法。这就是 GPGPU 在 WebGL 中的本质。

在 JavaScript 中有一个函数 [`Array.prototype.map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)，将会给出一个数组，对数组的每一项调用一个函数

```js
function multBy2(v) {
  return v * 2;
}

const src = [1, 2, 3, 4, 5, 6];
const dst = src.map(multBy2);

// dst is now [2, 4, 6, 8, 10, 12];
```

你可以把 `multBy2` 看作一个着色器，`map` 则是类似于 `gl.drawArrays` 或 `gl.drawElements` 的调用。
有一些不一样的是

## 着色器不会创建一个新数组，需要你自己提供一个

我们可以通过创建自己的 map 函数来模拟

```js
function multBy2(v) {
  return v * 2;
}

+function mapSrcToDst(src, fn, dst) {
+  for (let i = 0; i < src.length; ++i) {
+    dst[i] = fn(src[i]);
+  }
+}

const src = [1, 2, 3, 4, 5, 6];
-const dst = src.map(multBy2);
+const dst = new Array(6);    // to simulate that in WebGL we have to allocate a texture
+mapSrcToDst(src, multBy2, dst);

// dst is now [2, 4, 6, 8, 10, 12];
```

## 着色器不会返回一个值，他们会设置 `gl_FragColor`

这很容易去模拟

```js
+let gl_FragColor;

function multBy2(v) {
-  return v * 2;
+  gl_FragColor = v * 2;
}

function mapSrcToDst(src, fn, dst) {
  for (let i = 0; i < src.length; ++i) {
-    dst[i] = fn(src[i]);
+    fn(src[i]);
+    dst[i] = gl_FragColor;
  }
}

const src = [1, 2, 3, 4, 5, 6];
const dst = new Array(6);    // to simulate that in WebGL we have to allocate a texture
mapSrcToDst(src, multBy2, dst);

// dst is now [2, 4, 6, 8, 10, 12];
```

## 着色器是基于目标的，而不是基于源的

换句话说他们循环遍历结果并且询问“我需要往这里放什么值”
> 译者注: 这里涉及到片元着色器的运行原理，`dst` 相当于要渲染的 6 个像素，而 `multBy2(src)` 则是 6 个像素对应的片元着色器

```js
let gl_FragColor;

function multBy2(src) {
-  gl_FragColor = v * 2;
+  return function(i) {
+    gl_FragColor = src[i] * 2;
+  }
}

-function mapSrcToDst(src, fn, dst) {
-  for (let i = 0; i < src.length; ++i) {
-    fn(src[i]);
+function mapDst(dst, fn) {
+  for (let i = 0; i < dst.length; ++i) {    
+    fn(i);
    dst[i] = gl_FragColor;
  }
}

const src = [1, 2, 3, 4, 5, 6];
const dst = new Array(6);    // to simulate that in WebGL we have to allocate a texture
mapDst(dst, multBy2(src));

// dst is now [2, 4, 6, 8, 10, 12];
```

## 在 WebGL 里面这个像素的 index 或者 ID 的值通过 `gl_FragCoord` 来提供

```js
let gl_FragColor;
+let gl_FragCoord;

function multBy2(src) {
-  return function(i) {
-    gl_FragColor = src[i] * 2;
+  return function() {
+    gl_FragColor = src[gl_FragCoord] * 2;
  }
}

function mapDst(dst, fn) {
  for (let i = 0; i < dst.length; ++i) {    
-    fn(i);
+    gl_FragCoord = i;
+    fn();
    dst[i] = gl_FragColor;
  }
}

const src = [1, 2, 3, 4, 5, 6];
const dst = new Array(6);    // to simulate that in WebGL we have to allocate a texture
mapDst(dst, multBy2(src));

// dst is now [2, 4, 6, 8, 10, 12];
```

## 在 WebGL 里纹理是一个二维数组。

让我们假设我们的 `dst` 数组代表了一个 3x2 的纹理

```js
let gl_FragColor;
let gl_FragCoord;

function multBy2(src, across) {
  return function() {
-    gl_FragColor = src[gl_FragCoord] * 2;
+    gl_FragColor = src[gl_FragCoord.y * across + gl_FragCoord.x] * 2;
  }
}

-function mapDst(dst, fn) {
-  for (let i = 0; i < dst.length; ++i) {    
-    gl_FragCoord = i;
-    fn();
-    dst[i] = gl_FragColor;
-  }
-}
function mapDst(dst, across, up, fn) {
  for (let y = 0; y < up; ++y) {
    for (let x = 0; x < across; ++x) {
      gl_FragCoord = {x, y};
      fn();
      dst[y * across + x] = gl_FragColor;
    }
  }
}

const src = [1, 2, 3, 4, 5, 6];
const dst = new Array(6);    // to simulate that in WebGL we have to allocate a texture
mapDst(dst, 3, 2, multBy2(src, 3));

// dst is now [2, 4, 6, 8, 10, 12];
```

我们可以继续下去。我希望上面的示例可以让你了解到 GPGPU 在 WebGL 中其实是很简单的概念。接下来让我们实际在 WebGL 中来实现

为了理解接下来的代码，你最少需要阅读过 "[the article on fundamentals](webgl-fundamentals.html)"，可能还有 "[How It Works](webgl-how-it-works.html)" 和 "[the article on textures](webgl-3d-textures.html)"。

```js
const vs = `
attribute vec4 position;
void main() {
  gl_Position = position;
}
`;

const fs = `
precision highp float;

uniform sampler2D srcTex;
uniform vec2 srcDimensions;

void main() {
  vec2 texcoord = gl_FragCoord.xy / srcDimensions;
  vec4 value = texture2D(srcTex, texcoord);
  gl_FragColor = value * 2.0;
}
`;

const dstWidth = 3;
const dstHeight = 2;

// make a 3x2 canvas for 6 results
const canvas = document.createElement('canvas');
canvas.width = dstWidth;
canvas.height = dstHeight;

const gl = canvas.getContext('webgl');

const program = webglUtils.createProgramFromSources(gl, [vs, fs]);
const positionLoc = gl.getAttribLocation(program, 'position');
const srcTexLoc = gl.getUniformLocation(program, 'srcTex');
const srcDimensionsLoc = gl.getUniformLocation(program, 'srcDimensions');

// setup a full canvas clip space quad
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  -1, -1,
   1, -1,
  -1,  1,
  -1,  1,
   1, -1,
   1,  1,
]), gl.STATIC_DRAW);

// setup our attributes to tell WebGL how to pull
// the data from the buffer above to the position attribute
gl.enableVertexAttribArray(positionLoc);
gl.vertexAttribPointer(
    positionLoc,
    2,         // size (num components)
    gl.FLOAT,  // type of data in buffer
    false,     // normalize
    0,         // stride (0 = auto)
    0,         // offset
);

// create our source texture
const srcWidth = 3;
const srcHeight = 2;
const tex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, tex);
gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1); // see https://webglfundamentals.org/webgl/lessons/webgl-data-textures.html
gl.texImage2D(
    gl.TEXTURE_2D,
    0,                // mip level
    gl.LUMINANCE,     // internal format
    srcWidth,
    srcHeight,
    0,                // border
    gl.LUMINANCE,     // format
    gl.UNSIGNED_BYTE, // type
    new Uint8Array([
      1, 2, 3,
      4, 5, 6,
    ]));
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

gl.useProgram(program);
gl.uniform1i(srcTexLoc, 0);  // tell the shader the src texture is on texture unit 0
gl.uniform2f(srcDimensionsLoc, srcWidth, srcHeight);

gl.drawArrays(gl.TRIANGLES, 0, 6);  // draw 2 triangles (6 vertices)

// get the result
const results = new Uint8Array(dstWidth * dstHeight * 4);
gl.readPixels(0, 0, dstWidth, dstHeight, gl.RGBA, gl.UNSIGNED_BYTE, results);

// print the results
for (let i = 0; i < dstWidth * dstHeight; ++i) {
  log(results[i * 4]);
}
```

然后运行它

{{{example url="../webgl-gpgpu-mult-by-2.html"}}}

一些关于上面代码的注释

* 我们在裁剪空间绘制了一个从 -1 到 1 的四边形。

  我们用两个三角形创建了一个从 -1 到 1 的四边形。这意味着，假设视口设置的正确，我们将会绘制目标的所有像素。换句话说，我们的着色器会为结果数组中的每一个元素生成一个值。这个案例中，数组就是 canvas 本身。

* `gl_FragCoord` 是一个像素坐标，但是纹理引用的是纹理坐标。

  这意味着我们需要转化像素坐标到纹理坐标作为 `srcTex` 的值。
  就是这一行。

  ```glsl
  vec2 texcoord = gl_FragCoord.xy / srcDimensions;
  ```

* 着色器为每个像素输出了四个值

  在这个场景下这和我们如何读取输出有关。我们在 `readPixels` 中选择 `RGBA/UNSIGNED_BYTE`[because other format/type combinations are not supported](webgl-readpixels.html)。所以我们需要查找每第四个值来获得我们的答案。

  注意: 用 WebGL 一次性处理四个值是比较明智的，而且会更快。

* 我们输入和输出的数据都是 `UNSIGNED_BYTE` 值

  这意味着我们只能传入或者返回 0 到 255 的值。我们可以通过提供不同格式的纹理来为输入提供不同的格式。我们也可以尝试渲染不同格式的纹理来获得更大范围的值。

在上面的示例中我们的输出和输出都是相同的大小。让我们来改变它，我们将输入的值两两相加得到输出。换句话说，给出 `[1, 2, 3, 4, 5, 6]` 作为输出，我们期望得到的输出是 `[3, 7, 11]`。并且，我们依旧保持 3x2 的数据输入。

为了从纹理中获取任意的值，我们需要生成纹理坐标。
以下是从二维数组中获取一个值的基本公式，就像它是一个一维数组

```js
y = floor(indexInto1DArray / width);
x = indexInto1DArray % width;
```

对于纹理，我们需要将这个值转化为纹理坐标

```glsl
vec2 texcoord = (vec2(x, y) + 0.5) / dimensionsOfTexture;
```

想知道为啥要 + 0.5 可以看[这里](webgl-skinning.html#texel-coords)。

鉴于此，我们的着色器需要改为两个值相加。

```glsl
precision highp float;

uniform sampler2D srcTex;
uniform vec2 srcDimensions;
uniform vec2 dstDimensions;

vec4 getValueFrom2DTextureAs1DArray(sampler2D tex, vec2 dimensions, float index) {
  float y = floor(index / dimensions.x);
  float x = mod(index, dimensions.x);
  vec2 texcoord = (vec2(x, y) + 0.5) / dimensions;
  return texture2D(tex, texcoord);
}

void main() {
  // compute a 1D index into dst
  vec2 dstPixel = floor(gl_FragCoord.xy);  // see https://webglfundamentals.org/webgl/lessons/webgl-shadertoy.html#pixel-coords
  float dstIndex = dstPixel.y * dstDimensions.x + dstPixel.x;

  vec4 v1 = getValueFrom2DTextureAs1DArray(srcTex, srcDimensions, dstIndex * 2.0);
  vec4 v2 = getValueFrom2DTextureAs1DArray(srcTex, srcDimensions, dstIndex * 2.0 + 1.0);

  gl_FragColor = v1 + v2;
}
```

函数 `getValueFrom2DTextureAs1DArray` 基本上是从我们的数组中访问值的函数。也就是这两行

```glsl
  vec4 v1 = getValueFrom2DTextureAs1DArray(srcTex, srcDimensions, dstIndex * 2.0);
  vec4 v2 = getValueFrom2DTextureAs1DArray(srcTex, srcDimensions, dstIndex * 2.0 + 1.0);
```

效果等同于

```glsl
  vec4 v1 = srcTexAs1DArray[dstIndex * 2.0];
  vec4 v2 = setTexAs1DArray[dstIndex * 2.0 + 1.0];
```

在 JavaScript 我们需要查找 `dstDimensions` 的位置

```js
const program = webglUtils.createProgramFromSources(gl, [vs, fs]);
const positionLoc = gl.getAttribLocation(program, 'position');
const srcTexLoc = gl.getUniformLocation(program, 'srcTex');
const srcDimensionsLoc = gl.getUniformLocation(program, 'srcDimensions');
+const dstDimensionsLoc = gl.getUniformLocation(program, 'dstDimensions');
```

然后设置它

```js
gl.useProgram(program);
gl.uniform1i(srcTexLoc, 0);  // tell the shader the src texture is on texture unit 0
gl.uniform2f(srcDimensionsLoc, srcWidth, srcHeight);
+gl.uniform2f(dstDimensionsLoc, dstWidth, dstHeight);
```

并且我们需要修改结果(画布)的大小

```js
const dstWidth = 3;
-const dstHeight = 2;
+const dstHeight = 1;
```

到此为止，我们就有了可以通过数学运算随机访问源数组的结果数组

{{{example url="../webgl-gpgpu-add-2-elements.html"}}}

如果你希望用更多的数组来作为输出，只需要添加更多纹理即可。

## 第一个示例: 粒子

我们假设你有一个非常简单的粒子系统，每个粒子都有一个位置和一个速度，并且当它从屏幕的边缘离开，它会从屏幕的另一边出现。

鉴于该站的其他文章，你会在 JavaScript 更新粒子的位置

```js
for (const particle of particles) {
  particle.pos.x = (particle.pos.x + particle.velocity.x) % canvas.width;
  particle.pos.y = (particle.pos.y + particle.velocity.y) % canvas.height;
}
```

然后每次绘制一个粒子

```
useProgram (particleShader)
setup particle attributes
for each particle
  set uniforms
  draw particle
```

或者你会一次性上传所有粒子的位置

```
bindBuffer(..., particlePositionBuffer)
bufferData(..., latestParticlePositions, ...)
useProgram (particleShader)
setup particle attributes
set uniforms
draw particles
```

在文章 [the article on pulling vertices](webgl-pulling-vertices.html) 中我们提到了把位置存储在纹理中。如果我们在纹理中同时存储位置和速度信息，我们可以使用 GPGPU 这个技术来在着色器中更新粒子的位置。

在开始之前，为了使之简单，我们使用浮点纹理。这是 WebGL 的一个可选特性，大部分设备可以读取浮点纹理。桌面端可以渲染浮点纹理，但是大部分智能手机不行。

同时为了支持*顶点拉取*，我们需要检查一下顶点着色器是否支持使用纹理，这也是一个可选特性。我们应该仔细检查一下支持多少。在这种情况下，我们只需要在顶点着色器中使用一个纹理，我们检查至少支持 1。

> 译者注: 顶点拉取即不直接提供顶点的位置数据，而是由顶点着色器通过位置信息从内存(通常是纹理)中拿到数据

```js
// Get A WebGL context
/** @type {HTMLCanvasElement} */
const canvas = document.querySelector("#canvas");
const gl = canvas.getContext("webgl");
if (!gl) {
  return;
}
+// check we can use floating point textures
+const ext1 = gl.getExtension('OES_texture_float');
+if (!ext1) {
+  alert('Need OES_texture_float');
+  return;
+}
+// check we can render to floating point textures
+const ext2 = gl.getExtension('WEBGL_color_buffer_float');
+if (!ext2) {
+  alert('Need WEBGL_color_buffer_float');
+  return;
+}
+// check we can use textures in a vertex shader
+if (gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) < 1) {
+  alert('Can not use textures in vertex shaders');
+  return;
+}
```

这里的片元着色器用来更新粒子的位置

```glsl
precision highp float;

uniform sampler2D positionTex;
uniform sampler2D velocityTex;
uniform vec2 texDimensions;
uniform vec2 canvasDimensions;
uniform float deltaTime;

vec2 euclideanModulo(vec2 n, vec2 m) {
	return mod(mod(n, m) + m, m);
}

void main() {
  // compute texcoord from gl_FragCoord;
  vec2 texcoord = gl_FragCoord.xy / texDimensions;
  
  vec2 position = texture2D(positionTex, texcoord).xy;
  vec2 velocity = texture2D(velocityTex, texcoord).xy;
  vec2 newPosition = euclideanModulo(position + velocity * deltaTime, canvasDimensions);

  gl_FragColor = vec4(newPosition, 0, 1);
}
```

在这里每个位置都有一个速度，所以速度纹理和位置纹理是一样的大小。此外，我们在纹理中生成了新的位置，所以我们可以知道我们的结果纹理和源纹理也是大小相同的。这意味着我们可以用`texDimensions` 处理全部三个纹理。

在下面的着色器中，我们使用顶点 id，我们在 [the article on drawing without data](webgl-drawing-without-data.html) 提到过这块内容。我们使用 id 得到从纹理中提取数据的位置。有点像 [pulling-vertices](webgl-pulling-vertices.html)。

```glsl
attribute float id;
uniform sampler2D positionTex;
uniform vec2 texDimensions;
uniform mat4 matrix;

vec4 getValueFrom2DTextureAs1DArray(sampler2D tex, vec2 dimensions, float index) {
  float y = floor(index / dimensions.x);
  float x = mod(index, dimensions.x);
  vec2 texcoord = (vec2(x, y) + 0.5) / dimensions;
  return texture2D(tex, texcoord);
}

void main() {
  // pull the position from the texture
  vec4 position = getValueFrom2DTextureAs1DArray(positionTex, texDimensions, id);

  // do the common matrix math
  gl_Position = matrix * vec4(position.xy, 0, 1);
  gl_PointSize = 10.0;
}
```

所以我们需要三个纹理，一个用来存储速度，两个用来存储位置。为什么位置需要两个纹理？因为你不能写入你正在读取的纹理。所以，我们会做到如下效果

    newPositions = oldPositions + velocities

然后，每一帧我们都会互换 `newPositions` 和 `oldPositions`。

下面就是创建位置和速度纹理的代码。

```js
// create random positions and velocities.
const rand = (min, max) => {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return Math.random() * (max - min) + min;
};
const positions = new Float32Array(
    ids.map(_ => [rand(canvas.width), rand(canvas.height), 0, 0]).flat());
const velocities = new Float32Array(
    ids.map(_ => [rand(-300, 300), rand(-300, 300), 0, 0]).flat());

function createTexture(gl, data, width, height) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(
      gl.TEXTURE_2D,
      0,        // mip level
      gl.RGBA,  // internal format
      width,
      height,
      0,        // border
      gl.RGBA,  // format
      gl.FLOAT, // type
      data,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

// create a texture for the velocity and 2 textures for the positions.
const velocityTex = createTexture(gl, velocities, particleTexWidth, particleTexHeight);
const positionTex1 = createTexture(gl, positions, particleTexWidth, particleTexHeight);
const positionTex2 = createTexture(gl, null, particleTexWidth, particleTexHeight);
```

我们也需要帧缓冲，就像我们在文章 [渲染到纹理](webgl-render-to-texture.html) 中提到的。我们创建两个帧缓冲，每个位置纹理占用一个帧缓冲。

```js
function createFramebuffer(gl, tex) {
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  return fb;
}

// create 2 framebuffers. One that renders to positionTex1 one
// and another that renders to positionTex2

const positionsFB1 = createFramebuffer(gl, positionTex1);
const positionsFB2 = createFramebuffer(gl, positionTex2);

let oldPositionsInfo = {
  fb: positionsFB1,
  tex: positionTex1,
};
let newPositionsInfo = {
  fb: positionsFB2,
  tex: positionTex2,
};
```

我们还需要为我们的通过顶点拉取绘制粒子的着色器提供一个顶点 id 缓冲。

```js
// setup an id buffer
const particleTexWidth = 20;
const particleTexHeight = 10;
const numParticles = particleTexWidth * particleTexHeight;
const ids = new Array(numParticles).fill(0).map((_, i) => i);
const idBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, idBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ids), gl.STATIC_DRAW);
```

然后我们需要编译这一系列的着色器并且找到所有变量的位置

```js
const updatePositionProgram = webglUtils.createProgramFromSources(
    gl, [updatePositionVS, updatePositionFS]);
const drawParticlesProgram = webglUtils.createProgramFromSources(
    gl, [drawParticlesVS, drawParticlesFS]);

const updatePositionPrgLocs = {
  position: gl.getAttribLocation(updatePositionProgram, 'position'),
  positionTex: gl.getUniformLocation(updatePositionProgram, 'positionTex'),
  velocityTex: gl.getUniformLocation(updatePositionProgram, 'velocityTex'),
  texDimensions: gl.getUniformLocation(updatePositionProgram, 'texDimensions'),
  canvasDimensions: gl.getUniformLocation(updatePositionProgram, 'canvasDimensions'),
  deltaTime: gl.getUniformLocation(updatePositionProgram, 'deltaTime'),
};

const drawParticlesProgLocs = {
  id: gl.getAttribLocation(drawParticlesProgram, 'id'),
  positionTex: gl.getUniformLocation(drawParticlesProgram, 'positionTex'),
  texDimensions: gl.getUniformLocation(drawParticlesProgram, 'texDimensions'),
  matrix: gl.getUniformLocation(drawParticlesProgram, 'matrix'),
};
```

在渲染的时候，我们先运行顶点更新着色器来生成新的位置。

```js
let then = 0;
function render(time) {
  // convert to seconds
  time *= 0.001;
  // Subtract the previous time from the current time
  const deltaTime = time - then;
  // Remember the current time for the next frame.
  then = time;

  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  // render to the new positions
  gl.bindFramebuffer(gl.FRAMEBUFFER, newPositionsInfo.fb);
  gl.viewport(0, 0, particleTexWidth, particleTexHeight);

  // setup our attributes to tell WebGL how to pull
  // the data from the buffer above to the position attribute
  // this buffer just contains a -1 to +1 quad for rendering
  // to every pixel
  gl.bindBuffer(gl.ARRAY_BUFFER, updatePositionBuffer);
  gl.enableVertexAttribArray(updatePositionPrgLocs.position);
  gl.vertexAttribPointer(
      updatePositionPrgLocs.position,
      2,         // size (num components)
      gl.FLOAT,  // type of data in buffer
      false,     // normalize
      0,         // stride (0 = auto)
      0,         // offset
  );

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, oldPositionsInfo.tex);
  gl.activeTexture(gl.TEXTURE0 + 1);
  gl.bindTexture(gl.TEXTURE_2D, velocityTex);

  gl.useProgram(updatePositionProgram);
  gl.uniform1i(updatePositionPrgLocs.positionTex, 0);  // tell the shader the position texture is on texture unit 0
  gl.uniform1i(updatePositionPrgLocs.velocityTex, 1);  // tell the shader the position texture is on texture unit 1
  gl.uniform2f(updatePositionPrgLocs.texDimensions, particleTexWidth, particleTexHeight);
  gl.uniform2f(updatePositionPrgLocs.canvasDimensions, gl.canvas.width, gl.canvas.height);
  gl.uniform1f(updatePositionPrgLocs.deltaTime, deltaTime);

  gl.drawArrays(gl.TRIANGLES, 0, 6);  // draw 2 triangles (6 vertices)
```

然后我们用新的位置来为粒子绘制点。

```js
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // setup our attributes to tell WebGL how to pull
  // the data from the buffer above to the id attribute
  gl.bindBuffer(gl.ARRAY_BUFFER, idBuffer);
  gl.enableVertexAttribArray(drawParticlesProgLocs.id);
  gl.vertexAttribPointer(
      drawParticlesProgLocs.id,
      1,         // size (num components)
      gl.FLOAT,  // type of data in buffer
      false,     // normalize
      0,         // stride (0 = auto)
      0,         // offset
  );

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, newPositionsInfo.tex);

  gl.useProgram(drawParticlesProgram);
  gl.uniform2f(drawParticlesProgLocs.texDimensions, particleTexWidth, particleTexWidth);
  gl.uniform1i(drawParticlesProgLocs.positionTex, 0);  // tell the shader the position texture is on texture unit 0
  gl.uniformMatrix4fv(
      drawParticlesProgLocs.matrix,
      false,
      m4.orthographic(0, gl.canvas.width, 0, gl.canvas.height, -1, 1));

  gl.drawArrays(gl.POINTS, 0, numParticles);
```

最后我们交换引用新老位置的变量，所以我们这一帧的新位置变成了下一帧的老位置。

```js
  // swap which texture we will read from
  // and which one we will write to
  {
    const temp = oldPositionsInfo;
    oldPositionsInfo = newPositionsInfo;
    newPositionsInfo = temp;
  }
```

至此，我们得到了基于 GPGPU 的粒子。JavaScript 除了调用了两次 `gl.drawArrays` 之外几乎没有做其他工作。一次更新位置，一次绘制粒子

{{{example url="../webgl-gpgpu-particles.html"}}}

我们通过 20x10 像素大小的位置和速度纹理绘制了 200 个粒子。那如果我们想要绘制 199 个粒子呢？因为 WebGL 只处理纹理，而且纹理是一个二维数组，我们没办法创建一个 199 像素的二维数组。相反，我们可以计算 200 但是只绘制 199 个。你需要为不能完全适合 2D 数组的问题找到类似的解决方案。

## 下一个示例: 求离一点最近的线段

我不确定这是一个好示例，但这是我写的。我觉得这个不好是因为我认为有更好的算法来找离点最近的线而不是暴力的去检查每一条线和点。例如，各种空间划分算法可以让你轻松丢弃 95% 的点，因此速度更快。不过这个示例至少可以展示 GPGPU 的一些技术。

问题: 我们有 500 个点和 1000 条线段。为每个点找到最近的线。暴力破解的方法如下

```
for each point
  minDistanceSoFar = MAX_VALUE
  for each line segment
    compute distance from point to line segment
    if distance is < minDistanceSoFar
       minDistanceSoFar = distance
       closestLine = line segment
```

为 500 个点，每个点检查 1000 条线，这里总共有 500,000 次检查。现在 GPU 有 100 甚至 1000 个内核，所以使用 GPU 会让运行速度有千百倍的提升。

我们依旧把数据放到纹理之中。一个纹理存储各个点，一个纹理存储每条线段的起始和结束点。还要一个纹理来写入距离点最近的线段的 ID。

这是寻找一个点最近线段的片元着色器。
这就是上面提到的暴力算法

```js
  function closestLineFS(numLineSegments) {
    return `
precision highp float;

uniform sampler2D pointsTex;
uniform vec2 pointsTexDimensions;
uniform sampler2D linesTex;
uniform vec2 linesTexDimensions;

vec4 getAs1D(sampler2D tex, vec2 dimensions, float index) {
  float y = floor(index / dimensions.x);
  float x = mod(index, dimensions.x);
  vec2 texcoord = (vec2(x, y) + 0.5) / dimensions;
  return texture2D(tex, texcoord);
}

// from https://stackoverflow.com/a/6853926/128511
// a is the point, b,c is the line segment
float distanceFromPointToLine(in vec3 a, in vec3 b, in vec3 c) {
  vec3 ba = a - b;
  vec3 bc = c - b;
  float d = dot(ba, bc);
  float len = length(bc);
  float param = 0.0;
  if (len != 0.0) {
    param = clamp(d / (len * len), 0.0, 1.0);
  }
  vec3 r = b + bc * param;
  return distance(a, r);
}

void main() {
  // gl_FragCoord is the coordinate of the pixel that is being set by the fragment shader.
  // It is the center of the pixel so the bottom left corner pixel will be (0.5, 0.5).
  // the pixel to the left of that is (1.5, 0.5), The pixel above that is (0.5, 1.5), etc...
  // so we can compute back into a linear index 
  float ndx = floor(gl_FragCoord.y) * pointsTexDimensions.x + floor(gl_FragCoord.x); 
  
  // find the closest line segment
  float minDist = 10000000.0; 
  float minIndex = -1.0;
  vec3 point = getAs1D(pointsTex, pointsTexDimensions, ndx).xyz;
  for (int i = 0; i < ${numLineSegments}; ++i) {
    vec3 lineStart = getAs1D(linesTex, linesTexDimensions, float(i * 2)).xyz;
    vec3 lineEnd = getAsID(linesTex, linesTexDimensions, float(i * 2 + 1)).xyz;
    float dist = distanceFromPointToLine(point, lineStart, lineEnd);
    if (dist < minDist) {
      minDist = dist;
      minIndex = float(i);
    }
  }
  
  // convert to 8bit color. The canvas defaults to RGBA 8bits per channel
  // so take our integer index (minIndex) and convert to float values that
  // will end up as the same 32bit index when read via readPixels as
  // 32bit values.
  gl_FragColor = vec4(
    mod(minIndex, 256.0),
    mod(floor(minIndex / 256.0), 256.0),
    mod(floor(minIndex / (256.0 * 256.0)), 256.0) ,
    floor(minIndex / (256.0 * 256.0 * 256.0))) / 255.0;
}
`;
  }
```

我将 `getValueFrom2DTextureAs1DArray` 重命名为 `getAs1D` 只是为了有些行更短，增加可读性。

第一件值得注意的事情就是我们需要生成着色器，WebGL1 的着色器必须要常量整数循环表达式，所以我们不能传递线段的数量，我们只能在着色器中硬编码。

否则他就是我们上面暴力算法的一个非常直接的实现。

`pointsTex` 包含了点。 `linesTex` 包含了每条线段的两个点。

让我们使用 [less code more fun](webgl-less-code-more-fun.html) 中提到的帮助函数，否则会有点啰嗦。

首先我们创建一些测试数据。这里是两个点和五条线。他们通过 0, 0 来补全，因为每一个点存储在 RGBA 的纹理中。

```js
const points = [
  100, 100, 0, 0,
  200, 100, 0, 0,
];
const lines = [
   25,  50,   0, 0,
   25, 150,   0, 0,
   90,  50,   0, 0,
   90, 150,   0, 0,
  125,  50,   0, 0,
  125, 150,   0, 0,
  185,  50,   0, 0,
  185, 150,   0, 0,
  225,  50,   0, 0,
  225, 150,   0, 0,
];
const numPoints = points.length / 4;
const numLineSegments = lines.length / 4 / 2;
```

如果我们把它绘制出来，大概是这样

<img src="resources/line-segments-points.svg" style="width: 500px;" class="webgl_center">

线段从左到右编号为 0 到 4.所以如果我们的代码生效，第一个点(<span style="color: red;">红色</span>)
会得到 1 作为最接近的线，而第二个点(<span style="color: green;">绿色</span>)会得到 3。

让我们把数据放入纹理之中。

```js
const {tex: pointsTex, dimensions: pointsTexDimensions} =
    createDataTexture(gl, points, gl.FLOAT);
const {tex: linesTex, dimensions: linesTexDimensions} =
    createDataTexture(gl, lines, gl.FLOAT);

function createDataTexture(gl, data, type) {
  const numElements = data.length / 4;

  // compute a size that will hold all of our data
  const width = Math.ceil(Math.sqrt(numElements));
  const height = Math.ceil(numElements / width);

  const bin = type === gl.FLOAT
      ? new Float32Array(width * height * 4)
      : new Uint8Array(width * height * 4);
  bin.set(data);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(
      gl.TEXTURE_2D,
      0,        // mip level
      gl.RGBA,  // internal format
      width,
      height,
      0,        // border
      gl.RGBA,  // format
      type,     // type
      bin,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return {tex, dimensions: [width, height]};
}
```

在这个示例中我们让代码来选择纹理的尺寸并填充。举个示例，如果你给了 7 个元素的数组，将会被放在 3x3 的纹理当中。它会同时返回纹理和它选择的纹理尺寸。为什么我们让他选择纹理尺寸？因为纹理有最大的尺寸。

理想情况下我们只需要把数据看成一维的位置数组，一维的线点数组等等。所以我们可以只定义一个 Nx1 的纹理。不幸的是 GPU 有最大的尺寸限制，必须小于 1024 或者 2048。如果限制是 1024 但是我们需要 1025 个值的数组，我们需要把数据放在比如 513x2 的纹理当中。通过把数据放在一个正方形中，我们一般不会达到限制，直到我们达到纹理最大尺寸的平方。对于 1024 的尺寸限制来说，这允许我们放入一百万个数据。

我们现在知道了我们有多少线段，我们可以生成合适的着色器

```js
const closestLinePrgInfo = webglUtils.createProgramInfo(
    gl, [closestLineVS, closestLineFS(numLineSegments)]);
```

我们还需要一个存储结果的纹理和一个连接它的帧缓存。这次我们对每个点只需要整数结果，最近线段的 id,我们可以使用一个 RGBA/UNSIGNED_BYTE 纹理。你可以看到着色器的最后我们把最近线段的 id 编码到了 8bit 的 RGBA 颜色中。

```js
// create a texture for the results
const {tex: closestLinesTex, dimensions: closestLinesTexDimensions} =
    createDataTexture(gl, new Array(numPoints * 4), gl.UNSIGNED_BYTE);

function createFramebuffer(gl, tex) {
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  return fb;
}

// create a framebuffer so we can write to the closestLinesTex
const closestLineFB = createFramebuffer(gl, closestLinesTex);
```

我们依旧通过从 -1 到 +1 的四边形让 WebGL 渲染所有结果的像素

```js
// setup a full canvas clip space quad
const quadBufferInfo = webglUtils.createBufferInfoFromArrays(gl, {
  position: {
    numComponents: 2,
    data: [
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ],
  },
});
```

接下来我们可以渲染

```js
// compute the closest lines
gl.bindFramebuffer(gl.FRAMEBUFFER, closestLineFB);
gl.viewport(0, 0, ...closestLinesTexDimensions);

// setup our attributes to tell WebGL how to pull
// the data from the buffer above to the position attribute
// this buffer just contains a -1 to +1 quad for rendering
// to every pixel
webglUtils.setBuffersAndAttributes(gl, closestLinePrgInfo, quadBufferInfo);
gl.useProgram(closestLinePrgInfo.program);
webglUtils.setUniforms(closestLinePrgInfo, {
  pointsTex,
  pointsTexDimensions,
  linesTex,
  linesTexDimensions,
});
gl.drawArrays(gl.TRIANGLES, 0, 6);  // draw the clip space quad so we get one result for each pixel
```

最后我们读取结果

```js
{
  const [width, height] = closestLinesTexDimensions;
  const pixels = new Uint8Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

  // get a view of the pixels as 32bit unsigned integers
  const results = new Uint32Array(pixels.buffer);
  console.log(results);
}
```

如果我们运行它

{{{example url="../webgl-gpgpu-closest-line-results.html"}}}

你会得到期望的结果 `[1, 3]`

从 GPU 中读取数据较慢。假设我们想要一个可视化的结果。读取这些结果并且通过 canvas2D 渲染出来是比较容易的，那通过 WebGL 呢？让我们原样使用数据并绘制出结果？

首先，绘制点是相对容易的。就像上面的粒子示例一样，我们将每个顶点的 id 传递给顶点着色器并用它获取点。让我们绘制不同颜色的点，这样我们可以通过保持和点相同的的颜色来高亮离点最近的线。

```js
const drawPointsVS = `
attribute float a_id;
uniform float numPoints;
uniform sampler2D pointsTex;
uniform vec2 pointsTexDimensions;
uniform mat4 matrix;

varying vec4 v_color;

vec4 getAs1D(sampler2D tex, vec2 dimensions, float index) {
  float y = floor(index / dimensions.x);
  float x = mod(index, dimensions.x);
  vec2 texcoord = (vec2(x, y) + 0.5) / dimensions;
  return texture2D(tex, texcoord);
}

// converts hue, saturation, and value each in the 0 to 1 range
// to rgb.  c = color, c.x = hue, c.y = saturation, c.z = value
vec3 hsv2rgb(vec3 c) {
  c = vec3(c.x, clamp(c.yz, 0.0, 1.0));
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  // pull the position from the texture
  vec4 position = getAs1D(pointsTex, pointsTexDimensions, a_id);

  // do the common matrix math
  gl_Position = matrix * vec4(position.xy, 0, 1);
  gl_PointSize = 5.0;

  float hue = a_id / numPoints;
  v_color = vec4(hsv2rgb(vec3(hue, 1, 1)), 1);
}
`;
```

我们通过用 `hsv2rgb` 并且传入一个从 0 到 1 的色调来替代直接传入颜色。对于 500 个点来说我们不太容易把线区分开来，但是对于大约 10 个点，我们还是能够区分它们的。

我们将生成的颜色传递给一个简单的片元着色器

```js
const drawClosestPointsLinesFS = `
precision highp float;
varying vec4 v_color;
void main() {
  gl_FragColor = v_color;
}
`;
```

为了画出所有线，即使不是离点最近的线也保持一致，我们不生成颜色。这个场景下我们在片元着色器里硬编码一个颜色

```js
const drawLinesVS = `
attribute float a_id;
uniform sampler2D linesTex;
uniform vec2 linesTexDimensions;
uniform mat4 matrix;

vec4 getAs1D(sampler2D tex, vec2 dimensions, float index) {
  float y = floor(index / dimensions.x);
  float x = mod(index, dimensions.x);
  vec2 texcoord = (vec2(x, y) + 0.5) / dimensions;
  return texture2D(tex, texcoord);
}

void main() {
  // pull the position from the texture
  vec4 position = getAs1D(linesTex, linesTexDimensions, a_id);

  // do the common matrix math
  gl_Position = matrix * vec4(position.xy, 0, 1);
}
`;

const drawLinesFS = `
precision highp float;
void main() {
  gl_FragColor = vec4(vec3(0.8), 1);
}
`;
```

最后我们绘制最近的线

```js
const drawClosestLinesVS = `
attribute float a_id;
uniform float numPoints;
uniform sampler2D closestLinesTex;
uniform vec2 closestLinesTexDimensions;
uniform sampler2D linesTex;
uniform vec2 linesTexDimensions;
uniform mat4 matrix;

varying vec4 v_color;

vec4 getAs1D(sampler2D tex, vec2 dimensions, float index) {
  float y = floor(index / dimensions.x);
  float x = mod(index, dimensions.x);
  vec2 texcoord = (vec2(x, y) + 0.5) / dimensions;
  return texture2D(tex, texcoord);
}

// converts hue, saturation, and value each in the 0 to 1 range
// to rgb.  c = color, c.x = hue, c.y = saturation, c.z = value
vec3 hsv2rgb(vec3 c) {
  c = vec3(c.x, clamp(c.yz, 0.0, 1.0));
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  // pull the position from the texture
  float pointId = floor(a_id / 2.0);
  vec4 lineCode = getAs1D(closestLinesTex, closestLinesTexDimensions, pointId);
  float lineId = dot(lineCode, vec4(255, 256 * 255, 256 * 256 * 255, 256 * 256 * 256 * 255));
  float linePointId = lineId * 2.0 + mod(a_id, 2.0);
  vec4 position = getAs1D(linesTex, linesTexDimensions, linePointId);

  // do the common matrix math
  gl_Position = matrix * vec4(position.xy, 0, 1);
  gl_PointSize = 5.0;

  float hue = pointId / numPoints;
  v_color = vec4(hsv2rgb(vec3(hue, 1, 1)), 1);
}
`;
```

你可以看到这和点的绘制没有太大区别，除了每条线需要两个点，开始的点和结束的点。我们的 id (a_id) 是上面的计数 0，1，2，3，4，5，6... 等，所以除以 2 得到一个 `pointId`。

```glsl
  float pointId = floor(a_id / 2.0);
```

我们可以用它从相应的点中拉取数据

```glsl
  vec4 lineCode = getAs1D(closestLinesTex, closestLinesTexDimensions, pointId);
```

然后我们将结果纹理中的颜色转化为 `lineId`，然后通过它获取到线段开始和结束的位置。

```glsl
float lineId = dot(lineCode, vec4(255, 256 * 255, 256 * 256 * 255, 256 * 256 * 256 * 255));
float linePointId = lineId * 2.0 + mod(a_id, 2.0);
```

由于在我们的数据中线段开始和结束的点是连续的，所以我们将 `lineId` 乘以 2 然后加上 `mod(a_id, 2.0)` 的值可以得到起点或者终点。

最后我们用和绘制点一样的方式来计算颜色保证线的颜色和点匹配。

我们需要编译所有的新着色器程序

```js
const closestLinePrgInfo = webglUtils.createProgramInfo(
    gl, [closestLineVS, closestLineFS(numLineSegments)]);
+const drawLinesPrgInfo = webglUtils.createProgramInfo(
+    gl, [drawLinesVS, drawLinesFS]);
+const drawPointsPrgInfo = webglUtils.createProgramInfo(
+    gl, [drawPointsVS, drawClosestPointsLinesFS]);
+const drawClosestLinesPrgInfo = webglUtils.createProgramInfo(
+    gl, [drawClosestLinesVS, drawClosestPointsLinesFS]);
```

我们也需要创建 id 的缓冲，我们需要足够的 id，比绘制点的数量和用于绘制线的点的数量都多。这样我们可以在所有的程序中复用一样的 id 缓冲。

```js
// setup an id buffer
const numIds = Math.max(numPoints, numLineSegments * 2);
const ids = new Array(numIds).fill(0).map((_, i) => i);
const idBufferInfo = webglUtils.createBufferInfoFromArrays(gl, {
  id: {
    numComponents: 1,
    data: ids,
  },
});
```

所以在渲染的时候我们像之前一样计算结果，但是我们不通过 `readPixels` 查找结果。相反我们只是把它作为纹理传递给合适的着色器。

首先我们用灰色绘制所有的线

```js
// draw all the lines in gray
gl.bindFramebuffer(gl.FRAMEBUFFER, null);
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

const matrix = m4.orthographic(0, gl.canvas.width, 0, gl.canvas.height, -1, 1);

webglUtils.setBuffersAndAttributes(gl, drawLinesPrgInfo, idBufferInfo);
gl.useProgram(drawLinesPrgInfo.program);
webglUtils.setUniforms(drawLinesPrgInfo, {
  linesTex,
  linesTexDimensions,
  matrix,
});

gl.drawArrays(gl.LINES, 0, numLineSegments * 2);
```

然后我们绘制离点最近的线

```js
webglUtils.setBuffersAndAttributes(gl, drawClosestLinesPrgInfo, idBufferInfo);
gl.useProgram(drawClosestLinesPrgInfo.program);
webglUtils.setUniforms(drawClosestLinesPrgInfo, {
  numPoints,
  closestLinesTex,
  closestLinesTexDimensions,
  linesTex,
  linesTexDimensions,
  matrix,
});

// there is one closest line for each point, 2 vertices per line
gl.drawArrays(gl.LINES, 0, numPoints * 2);
```

最后我们绘制每个点

```
// draw the points
webglUtils.setBuffersAndAttributes(gl, drawPointsPrgInfo, idBufferInfo);
gl.useProgram(drawPointsPrgInfo.program);
webglUtils.setUniforms(drawPointsPrgInfo, {
  numPoints,
  pointsTex,
  pointsTexDimensions,
  matrix,
});
gl.drawArrays(gl.POINTS, 0, numPoints);
```

在我们运行之前让我们再做一些事情。让我们添加更多的点和线

```js
-const points = [
-  100, 100, 0, 0,
-  200, 100, 0, 0,
-];
-const lines = [
-   25,  50,   0, 0,
-   25, 150,   0, 0,
-   90,  50,   0, 0,
-   90, 150,   0, 0,
-  125,  50,   0, 0,
-  125, 150,   0, 0,
-  185,  50,   0, 0,
-  185, 150,   0, 0,
-  225,  50,   0, 0,
-  225, 150,   0, 0,
-];

+function createPoints(numPoints) {
+  const points = [];
+  for (let i = 0; i < numPoints; ++i) {
+    points.push(r(gl.canvas.width), r(gl.canvas.height), 0, 0);  // RGBA
+  }
+  return points;
+}
+
+const r = max => Math.random() * max;
+
+const points = createPoints(8);
+const lines = createPoints(125 * 2);

const numPoints = points.length / 4;
const numLineSegments = lines.length / 4 / 2;
```

如果我们运行他

{{{example url="../webgl-gpgpu-closest-line.html"}}}

你可以继续增加点和线的数量，但在某些情况下你无法分辨哪些点和线对应。数量较少的时候你至少可以从视觉上验证它有效。

为了增加一些趣味性，让我们把粒子和这个示例结合起来。我们将使用粒子示例中更新位置的技术来更新点和线段的位置。

为了实现它，我们从粒子示例中复制了 `updatePositionFS` 着色器并编译它。至于顶点着色器，我们可以直接使用 `closestLineVS`，因为它只是将 `a_position` 复制到 `gl_Position`

```js
const closestLinePrgInfo = webglUtils.createProgramInfo(
    gl, [closestLineVS, closestLineFS(numLineSegments)]);
const drawLinesPrgInfo = webglUtils.createProgramInfo(
    gl, [drawLinesVS, drawLinesFS]);
const drawPointsPrgInfo = webglUtils.createProgramInfo(
    gl, [drawPointsVS, drawClosestPointsLinesFS]);
const drawClosestLinesPrgInfo = webglUtils.createProgramInfo(
    gl, [drawClosestLinesVS, drawClosestPointsLinesFS]);
+const updatePositionPrgInfo = webglUtils.createProgramInfo(
+    gl, [closestLineVS, updatePositionFS]);
```

我们需要生成点和线的速度

```js
-function createPoints(numPoints) {
+function createPoints(numPoints, ranges) {
  const points = [];
  for (let i = 0; i < numPoints; ++i) {
-    points.push(r(gl.canvas.width), r(gl.canvas.height), 0, 0);  // RGBA
+    points.push(...ranges.map(range => r(...range)), 0, 0);  // RGBA
  }
  return points;
}

-const r = max => Math.random() * max;
+const r = (min, max) => min + Math.random() * (max - min);

-const points = createPoints(8);
-const lines = createPoints(125 * 2);
+const points = createPoints(8, [[0, gl.canvas.width], [0, gl.canvas.height]]);
+const lines = createPoints(125 * 2, [[0, gl.canvas.width], [0, gl.canvas.height]]);
const numPoints = points.length / 4;
const numLineSegments = lines.length / 4 / 2;

+const pointVelocities = createPoints(numPoints, [[-20, 20], [-20, 20]]);
+const lineVelocities = createPoints(numLineSegments * 2, [[-20, 20], [-20, 20]]);
```

我们需要复制点和线的纹理，这样我们就有新老两个版本保证我们可以从老版本读取然后渲染到新版本中。

```js
-const {tex: pointsTex, dimensions: pointsTexDimensions} =
-    createDataTexture(gl, points, gl.FLOAT);
-const {tex: linesTex, dimensions: linesTexDimensions} =
-    createDataTexture(gl, lines, gl.FLOAT);
+const {tex: pointsTex1, dimensions: pointsTexDimensions1} =
+    createDataTexture(gl, points, gl.FLOAT);
+const {tex: linesTex1, dimensions: linesTexDimensions1} =
+    createDataTexture(gl, lines, gl.FLOAT);
+const {tex: pointsTex2, dimensions: pointsTexDimensions2} =
+    createDataTexture(gl, points, gl.FLOAT);
+const {tex: linesTex2, dimensions: linesTexDimensions2} =
+    createDataTexture(gl, lines, gl.FLOAT);
```

然后我们需要为速度创建纹理

```js
const {tex: pointVelocityTex, dimensions: pointVelocityTexDimensions} =
    createDataTexture(gl, pointVelocities, gl.FLOAT);
const {tex: lineVelocityTex, dimensions: lineVelocityTexDimensions} =
    createDataTexture(gl, lineVelocities, gl.FLOAT);
```

我们需要为点和线创建帧缓冲

```js
const pointsFB1 = createFramebuffer(gl, pointsTex1);
const pointsFB2 = createFramebuffer(gl, pointsTex2);
const linesFB1 = createFramebuffer(gl, linesTex1);
const linesFB2 = createFramebuffer(gl, linesTex2);
```

然后需要设置对象来引用老的和新的

```js
let oldPointsLines = {
  pointsFB: pointsFB1,
  linesFB: linesFB1,
  pointsTex: pointsTex1,
  linesTex: linesTex1,
};
let newPointsLines = {
  pointsFB: pointsFB2,
  linesFB: linesFB2,
  pointsTex: pointsTex2,
  linesTex: linesTex2,
};
```

接着我们创建一个渲染循环

```js
const pointsTexDimensions = pointsTexDimensions1;
const linesTexDimensions = linesTexDimensions1;

let then = 0;
function render(time) {
  // convert to seconds
  time *= 0.001;
  // Subtract the previous time from the current time
  const deltaTime = time - then;
  // Remember the current time for the next frame.
  then = time;

  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
```

在这个循环中我们首先通过旧的位置和速度得到新的位置

```js
  // update the point positions
  gl.bindFramebuffer(gl.FRAMEBUFFER, newPointsLines.pointsFB);
  gl.viewport(0, 0, ...pointsTexDimensions);
  webglUtils.setBuffersAndAttributes(gl, updatePositionPrgInfo, quadBufferInfo);
  gl.useProgram(updatePositionPrgInfo.program);
  webglUtils.setUniforms(updatePositionPrgInfo, {
    positionTex: oldPointsLines.pointsTex,
    texDimensions: pointsTexDimensions,
    velocityTex: pointVelocityTex,
    canvasDimensions: [gl.canvas.width, gl.canvas.height],
    deltaTime,
  });
  gl.drawArrays(gl.TRIANGLES, 0, 6);  // draw the clip space quad so we get one result for each pixel
```

然后对线段的位置做同样的处理

```js
  // update the line positions
  gl.bindFramebuffer(gl.FRAMEBUFFER, newPointsLines.linesFB);
  gl.viewport(0, 0, ...linesTexDimensions);
  webglUtils.setBuffersAndAttributes(gl, updatePositionPrgInfo, quadBufferInfo);
  gl.useProgram(updatePositionPrgInfo.program);
  webglUtils.setUniforms(updatePositionPrgInfo, {
    positionTex: oldPointsLines.linesTex,
    texDimensions: linesTexDimensions,
    velocityTex: lineVelocityTex,
    canvasDimensions: [gl.canvas.width, gl.canvas.height],
    deltaTime,
  });
  gl.drawArrays(gl.TRIANGLES, 0, 6);  // draw the clip space quad so we get one result for each pixel
```

做完上面的操作之后，我们可以提取出用于计算最近线条的纹理，剩下的渲染逻辑保持不变

```js
+  const {linesTex, pointsTex} = newPointsLines;

  ... rendering code from previous example ...
```

最后像我们的粒子示例中一样我们交换新的和老的

```js
  // swap old and new for next frame
  {
    const temp = oldPointsLines;
    oldPointsLines = newPointsLines;
    newPointsLines = temp;
  }
  requestAnimationFrame(render);
}
requestAnimationFrame(render);
```

这样我们就可以看到它动起来了，而且所有的计算都是由 GPU 完成的。

{{{example url="../webgl-gpgpu-closest-line-dynamic.html"}}}

## 关于 GPGPU 的一些警告

* 在 WebGL1 中 GPGPU 主要限制只能使用 2D 数组作为输出，不过你可以使用 `WEBGL_draw_buffers` 扩展(如果存在)来输出到多个 2D 数组

  WebGL2 添加了处理任意大小 1D 数组的能力。WebGPU (AFAIK)让你可以随机访问写入，即(计算着色器)。
  
* GPU 没有 CPU 一样的精度

  检查你的结果并且确保它们是可以接受的

* GPGPU 有开销

  在一开始的两个示例里面我们用 GPU 计算一些数据并且读取结果。设置缓冲，纹理设置 attributes 和 uniforms 都需要花费时间。足够的时间，对于任何小于一定大小的内容，直接使用 JavaScript 会更好。示例中乘 6 个数字或者加 3 的量太小了，不适用于 GPGPU。这种权衡在哪里还没有定义，但是如果你不做至少 1000 或者更多的事情，那就使用 JavaScript

* `readPixels` 较慢

  从 WebGL 中读书结果较慢，所以尽可能的避免它。作为一个示例，粒子示例和动态最近的线的示例都没有将结果读取到 JavaScript。尽可能长时间的将运行结果保存在 GPU 上。换句话说，你可以做一些事情像

  * 用 GPU 计算
  * 读取结果
  * 为下一步准备结果
  * 上传准备好的结果到 GPU
  * 用 GPU 计算
  * 读取结果
  * 为下一步准备结果
  * 上传准备好的结果到 GPU
  * 用 GPU 计算
  * 读取结果

  如果可以的话，通过创造性的解决方案会更快

  * 用 GPU 计算
  * 使用 GPU 为下一步准备结果
  * 用 GPU 计算
  * 使用 GPU 为下一步准备结果
  * 用 GPU 计算
  * 读取结果

  我们动态最近的线示例做了这个。运行结果从来没有离开过 GPU。

  另一个示例，我曾经写过一个直方图计算着色器。我将结果读取回 JavaScript，计算出最大和最小的值。然后将图像绘制回画布，使用这些最小值和最大值作为统一来自动调整图像。

  但是不将数据读回 JavaScript。我们可以在直方图上面运行一个着色器，生成一个包含最大最小值的 2 像素的纹理。

  接着我可以将 2 像素的纹理传入第三个可以读取最大最小值的着色器，不需要从 GPU 中读取它们来设置 uniform。

  类似的，为了展示直方图，我们线从 GPU 中读取数据，接着我可以写一个着色器直接展示直方图的数据而不是将数据读取到 JavaScript。

  通过上面的操作，整个流程都在 GPU 完成，可能会更快。

* GPU 可以并行做很多事情，但大多数不能像CPU那样执行多任务。GPU 通常不能进行“抢占式多任务处理”。这意味着如果你给他们一个非常复杂的着色器，比如需要5分钟才能运行，他们可能会让你的整个机器冻结 5 分钟。大多数优秀的操作系统通过让 CPU 检查从它们给 GPU 的最后一个命令到现在有多长时间来处理这个问题。如果时间太长(5-6秒)，GPU 没有响应，那么他们唯一的选择就是重置 GPU。

  这就是为什么 WebGL 会丢失上下文，并得到"Aw, rats!"或类似的消息。

  让 GPU 做许多事情是很容易的，但在图像方面，将其提升到5-6秒的级别并不常见。它通常是 0.1 秒的水平，但这仍然很糟糕，通常你希望图形运行得快，所以程序员希望优化或找到一种不同的技术来保持他们的应用程序的响应。

  另一方面，你可能真的想给 GPU 一个沉重的任务来运行。这里没有简单的解决办法。手机的 GPU 远不如高端个人电脑强大。除了自己计时之外，没有办法确定在多少工作会让 GPU “太慢”。

  我没有解决办法。只是一个警告，根据你要做的事情，你可能会遇到这个问题。

* 移动设备通常不支持浮点纹理
  
  这里个问题没有简单的解决办法。一种解决方案是尝试将浮点值编码为 RGBA/UNSIGNED_BYTE 值。在着色器中，当你从纹理中读取一个值时，你需要转换回浮点数，当你输出一个颜色时，你需要将它重新编码回 RGBA/UNSIGNED_BYTE 。看[这里](https://stackoverflow.com/a/63830492/128511)

  但是，如果我们要在上面的粒子或最近的线的示例中使用它，它们将需要巨大的改变。上面的代码只需要一次查找就可以提取出一个位置(3个值，x, y, z)，但现在我们需要进行 3 次查找。上面的代码也能够写一个新的 3 个值的位置 gl_FragColor = newPosition，但现在我们只能写1个值。我们要么尝试使用 WEBGL_draw_buffers 来让我们写出 3 个值到 3 个不同的纹理(更多的工作)，要么我们必须调整着色器运行 3 次，分别为 X, Y 和 Z

  另一个解决方案是一些移动设备支持半浮点数。半浮点数的精度非常低，对某些问题很有用，但远不如 32 位浮点数有用。

我希望这些粒子可以帮你理解 WebGL 中 GPGPU 的关键思想，即 WebGL 读取和写入 2D 纹理都是 2D 数组的**数据**，而不仅仅是图像的像素。

它们的工作原理类似于map函数，为每个值调用函数，但是不需要决定其值将存储在何处。相反，这是由功能外部决定的。在 WebGL 的情况下，这取决于你如何设置你正在绘制的东西。一旦你调用gl.drawXXX，着色器将被每个需要的值调用，并被问到“我应该设置什么值?”

就是这样。

上面的粒子大多将 2D 纹理当作 1D 数组使用，当然你也可以将它们当作 2D 数组使用(例如将两个大矩阵相乘用于机器学习)，或者类似我们用数学方法将 2D 数组处理为 1D 数组，我们也可以用数学方法将 2D 数组处理为 3D 数组，并将其用于流体模拟等事情。

---

这里有一个[很棒的视频](https://www.youtube.com/watch?v=X-iSQQgOd1A)通过 GPGPU 制作一些粒子，视频的下半段用计算着色器来进行了 “粘液” 模拟。

<a href="https://jsgist.org/?src=c4e91cff94b0543a7c4287f18c06a78b">here it is translated into WebGL</a> 使用了上面提到的技术。


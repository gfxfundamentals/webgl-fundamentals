Title: WebGL 使用多个纹理
Description: 在WebGL中如何使用多个纹理
TOC: WebGL 使用多个纹理


此文上接[WebGL 图像处理](webgl-image-processing.html)，
如果没读建议[从那开始](webgl-image-processing.html)。

现在可能是一个合适的时机去回答“如何使用 2 个或多个纹理？”。

非常简单，回到[几节之前绘制一个图像的着色器](webgl-image-processing.html)，
将它升级到使用两个纹理。

首先改变代码加载两个图像，这其实不是WebGL的事情，是 HTML5
和 JavaScript 的事情，但是我也会涉及到。图像加载是异步的，可能需要适应一下。

基本上有两种方式来处理图像的加载，一种是重构代码，
让它在没有纹理的时候运行，当图像加载后，
再更新程序。我们会在以后的文章中用到这个方法。

这个例子中就等两个图像都加载完成后再开始绘制。

首先修改加载单个图像的方法，非常简单，
先创建一个新的 `Image` 对象，设置加载的url，然后设置回调函数在图像加载完成后调用。

```
function loadImage(url, callback) {
  var image = new Image();
  image.src = url;
  image.onload = callback;
  return image;
}
```

现在来创建一个方法加载一个 URL 序列，并且创建一个图像序列。
首先设置 `imagesToLoad` 为加载图像的个数，然后为每个图像调用 `loadImage`，
当 `imagesToLoad` 递减到 0 的时候说明所有图像加载完成，调用回调函数。

```
function loadImages(urls, callback) {
  var images = [];
  var imagesToLoad = urls.length;

  // 每个图像加载完成后调用一次
  var onImageLoad = function() {
    --imagesToLoad;
    // 如果所有图像都加载完成就调用回调函数
    if (imagesToLoad == 0) {
      callback(images);
    }
  };

  for (var ii = 0; ii < imagesToLoad; ++ii) {
    var image = loadImage(urls[ii], onImageLoad);
    images.push(image);
  }
}
```

然后就可以像这样调用 loadImages

```
function main() {
  loadImages([
    "resources/leaves.jpg",
    "resources/star.jpg",
  ], render);
}
```

接下来修改着色器使用两个纹理，在这个例子中我们将两个纹理相乘。

```
<script id="fragment-shader-2d" type="x-shader/x-fragment">
precision mediump float;

// 纹理
uniform sampler2D u_image0;
uniform sampler2D u_image1;

// 从顶点着色器传入的 texCoords
varying vec2 v_texCoord;

void main() {
   vec4 color0 = texture2D(u_image0, v_texCoord);
   vec4 color1 = texture2D(u_image1, v_texCoord);
   gl_FragColor = color0 * color1;
}
</script>
```

需要创建两个WebGL纹理对象。

```
  // 创建两个纹理
  var textures = [];
  for (var ii = 0; ii < 2; ++ii) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // 设置参数以便使用任意尺的影像
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // 上传图像到纹理
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[ii]);

    // 将纹理添加到纹理序列
    textures.push(texture);
  }
```

WebGL有一个叫做"texture units"的对象，你可以把它看成是一个纹理引用的序列，
你需要告诉着色器每个 sampler（取样器） 使用哪一个 texture unit（纹理单元）。

```
  // 寻找取样器的位置
  var u_image0Location = gl.getUniformLocation(program, "u_image0");
  var u_image1Location = gl.getUniformLocation(program, "u_image1");

  ...

  // 设置使用的纹理单元
  gl.uniform1i(u_image0Location, 0);  // 纹理单元 0
  gl.uniform1i(u_image1Location, 1);  // 纹理单元 1
```

然后将每个纹理单元绑定纹理。

```
  // 设置每个纹理单元对应一个纹理
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, textures[0]);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, textures[1]);
```

使用的两个图像像这样

<style>.glocal-center { text-align: center; } .glocal-center-content { margin-left: auto; margin-right: auto; }</style>
<div class="glocal-center"><table class="glocal-center-content"><tr><td><img src="../resources/leaves.jpg" /> <img src="../resources/star.jpg" /></td></tr></table></div>

这就是使用WebGL将它们相乘的结果。

{{{example url="../webgl-2-textures.html" }}}

有些需要回顾的部分。

理解纹理单元的简单方式是：所有的纹理方法可以在“激活的纹理单元”上使用，
“激活的纹理单元”就是一个全局变量指向你想使用的所有纹理单元，
每个纹理单元有两个目标对象，TEXTURE_2D 目标和 TEXTURE_CUBE_MAP 目标。
每个纹理方法针对激活纹理单元上的一个目标，如果用 JavaScript 表示 WebGL
方法可能像这样

```
var getContext = function() {
  var textureUnits = [
    { TEXTURE_2D: ??, TEXTURE_CUBE_MAP: ?? },
    { TEXTURE_2D: ??, TEXTURE_CUBE_MAP: ?? },
    { TEXTURE_2D: ??, TEXTURE_CUBE_MAP: ?? },
    { TEXTURE_2D: ??, TEXTURE_CUBE_MAP: ?? },
    { TEXTURE_2D: ??, TEXTURE_CUBE_MAP: ?? },
    ...
  ];
  var activeTextureUnit = 0;

  var activeTexture = function(unit) {
    // 将纹理单元枚举转换成索引
    var index = unit - gl.TEXTURE0;
    // 设置激活纹理单元
    activeTextureUnit = index;
  };

  var bindTexture = function(target, texture) {
    // 设置激活纹理单元的目标对象纹理
    textureUnits[activeTextureUnit][target] = texture;
  };

  var texImage2D = function(target, ... args ...) {
    // 绑定对应纹理单元调用相应的方法
    var texture = textureUnits[activeTextureUnit][target];
    texture.image2D(...args...);
  };

  // 返回 WebGL API
  return {
    activeTexture: activeTexture,
    bindTexture: bindTexture,
    texImage2D: texImage2D,
  }
};
```

着色器获得纹理单元

```
  gl.uniform1i(u_image0Location, 0);  // 纹理单元 0
  gl.uniform1i(u_image1Location, 1);  // 纹理单元 1
```

需要注意的是，设置全局变量的时候使用索引代替纹理单元，但是调用 gl.activeTexture
的时候你需要传递特殊的常量gl.TEXTURE0, gl.TEXTURE1 之类。
幸运的是这些常量是连续的，所以这些代码

```
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, textures[0]);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, textures[1]);
```

可以写成这样

```
  gl.activeTexture(gl.TEXTURE0 + 0);
  gl.bindTexture(gl.TEXTURE_2D, textures[0]);
  gl.activeTexture(gl.TEXTURE0 + 1);
  gl.bindTexture(gl.TEXTURE_2D, textures[1]);
```

或这样

```
  for (var ii = 0; ii < 2; ++ii) {
    gl.activeTexture(gl.TEXTURE0 + ii);
    gl.bindTexture(gl.TEXTURE_2D, textures[ii]);
  }
```

希望这样能够帮助你理解WebGL单次绘制中如何使用多个纹理。




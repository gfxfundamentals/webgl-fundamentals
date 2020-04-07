Title: WebGL 文字 - 使用字形纹理
Description: 如何使用一个字形纹理显示文字
TOC: WebGL 文字 - 使用字形纹理


此文上接WebGL系列文章，上一篇是[在WebGL中使用纹理渲染文字](webgl-text-texture.html)，
如果没读可以先看那些。

上篇文章中讲到了[如何使用纹理在WebGL场景中绘制文字](webgl-text-texture.html)，
那个技术非常常用，并且常用在多人游戏角色头顶名称中，由于那个名字很少改变所以很好用。

假如你想在UI中绘制很多文字并且经常改变，接着[上文](webgl-text-texture.html)
的例子我们可以为每个字母制作一个纹理。让我们修改代码实现。

    +var names = [
    +  "anna",   // 0
    +  "colin",  // 1
    +  "james",  // 2
    +  "danny",  // 3
    +  "kalin",  // 4
    +  "hiro",   // 5
    +  "eddie",  // 6
    +  "shu",    // 7
    +  "brian",  // 8
    +  "tami",   // 9
    +  "rick",   // 10
    +  "gene",   // 11
    +  "natalie",// 12,
    +  "evan",   // 13,
    +  "sakura", // 14,
    +  "kai",    // 15,
    +];

    // 创建文字纹理，一个字母一个
    var textTextures = [
    +  "a",    // 0
    +  "b",    // 1
    +  "c",    // 2
    +  "d",    // 3
    +  "e",    // 4
    +  "f",    // 5
    +  "g",    // 6
    +  "h",    // 7
    +  "i",    // 8
    +  "j",    // 9
    +  "k",    // 10
    +  "l",    // 11
    +  "m",    // 12,
    +  "n",    // 13,
    +  "o",    // 14,
    +  "p",    // 14,
    +  "q",    // 14,
    +  "r",    // 14,
    +  "s",    // 14,
    +  "t",    // 14,
    +  "u",    // 14,
    +  "v",    // 14,
    +  "w",    // 14,
    +  "x",    // 14,
    +  "y",    // 14,
    +  "z",    // 14,
    ].map(function(name) {
    *  var textCanvas = makeTextCanvas(name, 10, 26);

然后为名字中每个字母渲染一个矩形而不是原来的只用一个矩形。

    // 绘制文字设置
    +// 因为每个字母使用的是相通的属性和程序
    +// 我们只需要设置一次
    +gl.useProgram(textProgramInfo.program);
    +setBuffersAndAttributes(gl, textProgramInfo.attribSetters, textBufferInfo);

    textPositions.forEach(function(pos, ndx) {
    +  var name = names[ndx];
    +
    +  // 每个字母
    +  for (var ii = 0; ii < name.length; ++ii) {
    +    var letter = name.charCodeAt(ii);
    +    var letterNdx = letter - "a".charCodeAt(0);
    +
    +    // 选择一个字母纹理
    +    var tex = textTextures[letterNdx];

        // 使用 'F' 的位置

        // 由于 pos 在视图空间，表示它是一个从眼睛位置出发的一个向量
        // 所以沿着向量朝眼睛方向移动一定距离
        var fromEye = m4.normalize(pos);
        var amountToMoveTowardEye = 150;  // 因为 F 是 150 个单位长
        var viewX = pos[0] - fromEye[0] * amountToMoveTowardEye;
        var viewY = pos[1] - fromEye[1] * amountToMoveTowardEye;
        var viewZ = pos[2] - fromEye[2] * amountToMoveTowardEye;
        var desiredTextScale = -1 / gl.canvas.height;  // 1x1 像素大小
        var scale = viewZ * desiredTextScale;

        var textMatrix = m4.translate(projectionMatrix, viewX, viewY, viewZ);
        // 将矩形缩放到需要的大小
        textMatrix = m4.scale(textMatrix, tex.width * scale, tex.height * scale, 1);
        +textMatrix = m4.translate(textMatrix, ii, 0, 0);

        // 设置全局变量
        m4.copy(textMatrix, textUniforms.u_matrix);
        textUniforms.u_texture = tex.texture;
        webglUtils.setUniforms(textProgramInfo, textUniforms);

        // 绘制文字
        gl.drawElements(gl.TRIANGLES, textBufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
      }
    });

查看结果

{{{example url="../webgl-text-glyphs.html" }}}

不幸的是它比较慢，例子中并没有体现出来这一点，但是我们绘制了73个矩形，
计算了73个矩阵并使用了292次矩阵乘法运算，一个典型的UI可能很容易超过1000个字母，
这种方式就会在每一帧需要进行大量计算。

为了解决这个问题通常是使用一个包含所有字母的纹理图集，
我们在[给立方体 6 各面贴图](webgl-3d-textures.html#texture-atlas)
的例子中讲到过纹理图集。

我在网上找到了[一个简单的开源字体纹理图集](https://opengameart.org/content/8x8-font-chomps-wacky-worlds-beta)。
<img class="webgl_center" width="256" height="160" style="image-rendering: pixelated;" src="../resources/8x8-font.png" />

```
var fontInfo = {
  letterHeight: 8,
  spaceWidth: 8,
  spacing: -1,
  textureWidth: 64,
  textureHeight: 40,
  glyphInfos: {
    'a': { x:  0, y:  0, width: 8, },
    'b': { x:  8, y:  0, width: 8, },
    'c': { x: 16, y:  0, width: 8, },
    'd': { x: 24, y:  0, width: 8, },
    'e': { x: 32, y:  0, width: 8, },
    'f': { x: 40, y:  0, width: 8, },
    'g': { x: 48, y:  0, width: 8, },
    'h': { x: 56, y:  0, width: 8, },
    'i': { x:  0, y:  8, width: 8, },
    'j': { x:  8, y:  8, width: 8, },
    'k': { x: 16, y:  8, width: 8, },
    'l': { x: 24, y:  8, width: 8, },
    'm': { x: 32, y:  8, width: 8, },
    'n': { x: 40, y:  8, width: 8, },
    'o': { x: 48, y:  8, width: 8, },
    'p': { x: 56, y:  8, width: 8, },
    'q': { x:  0, y: 16, width: 8, },
    'r': { x:  8, y: 16, width: 8, },
    's': { x: 16, y: 16, width: 8, },
    't': { x: 24, y: 16, width: 8, },
    'u': { x: 32, y: 16, width: 8, },
    'v': { x: 40, y: 16, width: 8, },
    'w': { x: 48, y: 16, width: 8, },
    'x': { x: 56, y: 16, width: 8, },
    'y': { x:  0, y: 24, width: 8, },
    'z': { x:  8, y: 24, width: 8, },
    '0': { x: 16, y: 24, width: 8, },
    '1': { x: 24, y: 24, width: 8, },
    '2': { x: 32, y: 24, width: 8, },
    '3': { x: 40, y: 24, width: 8, },
    '4': { x: 48, y: 24, width: 8, },
    '5': { x: 56, y: 24, width: 8, },
    '6': { x:  0, y: 32, width: 8, },
    '7': { x:  8, y: 32, width: 8, },
    '8': { x: 16, y: 32, width: 8, },
    '9': { x: 24, y: 32, width: 8, },
    '-': { x: 32, y: 32, width: 8, },
    '*': { x: 40, y: 32, width: 8, },
    '!': { x: 48, y: 32, width: 8, },
    '?': { x: 56, y: 32, width: 8, },
  },
};
```

然后我们[像之前加载图像一样加载这个纹理](webgl-3d-textures.html)。

```
// 创建一个纹理
var glyphTex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, glyphTex);
// 使用 1×1 蓝色像素像素填充纹理
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              new Uint8Array([0, 0, 255, 255]));
// 异步加载图像
var image = new Image();
image.src = "resources/8x8-font.png";
image.addEventListener('load', function() {
  // 图像加载完成，将它拷贝到纹理
  gl.bindTexture(gl.TEXTURE_2D, glyphTex);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
});
```

现在我们有了一个包含字形的纹理，可以在运行时给每个字形创建矩形，这些顶点将使用纹理坐标选择确切的字形。

给定字符串创建顶点。

```
function makeVerticesForString(fontInfo, s) {
  var len = s.length;
  var numVertices = len * 6;
  var positions = new Float32Array(numVertices * 2);
  var texcoords = new Float32Array(numVertices * 2);
  var offset = 0;
  var x = 0;
  var maxX = fontInfo.textureWidth;
  var maxY = fontInfo.textureHeight;
  for (var ii = 0; ii < len; ++ii) {
    var letter = s[ii];
    var glyphInfo = fontInfo.glyphInfos[letter];
    if (glyphInfo) {
      var x2 = x + glyphInfo.width;
      var u1 = glyphInfo.x / maxX;
      var v1 = (glyphInfo.y + fontInfo.letterHeight - 1) / maxY;
      var u2 = (glyphInfo.x + glyphInfo.width - 1) / maxX;
      var v2 = glyphInfo.y / maxY;

      // 每个字母 6 个顶点
      positions[offset + 0] = x;
      positions[offset + 1] = 0;
      texcoords[offset + 0] = u1;
      texcoords[offset + 1] = v1;

      positions[offset + 2] = x2;
      positions[offset + 3] = 0;
      texcoords[offset + 2] = u2;
      texcoords[offset + 3] = v1;

      positions[offset + 4] = x;
      positions[offset + 5] = fontInfo.letterHeight;
      texcoords[offset + 4] = u1;
      texcoords[offset + 5] = v2;

      positions[offset + 6] = x;
      positions[offset + 7] = fontInfo.letterHeight;
      texcoords[offset + 6] = u1;
      texcoords[offset + 7] = v2;

      positions[offset + 8] = x2;
      positions[offset + 9] = 0;
      texcoords[offset + 8] = u2;
      texcoords[offset + 9] = v1;

      positions[offset + 10] = x2;
      positions[offset + 11] = fontInfo.letterHeight;
      texcoords[offset + 10] = u2;
      texcoords[offset + 11] = v2;

      x += glyphInfo.width + fontInfo.spacing;
      offset += 12;
    } else {
      // 没有的字母就留一个间距
      x += fontInfo.spaceWidth;
    }
  }

  // 返回用到的 TypedArrays 的 ArrayBufferViews 
  return {
    arrays: {
      position: new Float32Array(positions.buffer, 0, offset),
      texcoord: new Float32Array(texcoords.buffer, 0, offset),
    },
    numVertices: offset / 2,
  };
}
```

我们还要手动创建一个 bufferInfo([如果你不知道 bufferInfo 是什么可以看看这里](webgl-drawing-multiple-things.html))。

    // 手动创建一个 bufferInfo
    var textBufferInfo = {
      attribs: {
        a_position: { buffer: gl.createBuffer(), numComponents: 2, },
        a_texcoord: { buffer: gl.createBuffer(), numComponents: 2, },
      },
      numElements: 0,
    };

然后需要在渲染文字时更新缓冲，我们也让文字动态变化

    textPositions.forEach(function(pos, ndx) {

      var name = names[ndx];
    +  var s = name + ":" + pos[0].toFixed(0) + "," + pos[1].toFixed(0) + "," + pos[2].toFixed(0);
    +  var vertices = makeVerticesForString(fontInfo, s);
    +
    +  // 更新缓冲
    +  textBufferInfo.attribs.a_position.numComponents = 2;
    +  gl.bindBuffer(gl.ARRAY_BUFFER, textBufferInfo.attribs.a_position.buffer);
    +  gl.bufferData(gl.ARRAY_BUFFER, vertices.arrays.position, gl.DYNAMIC_DRAW);
    +  gl.bindBuffer(gl.ARRAY_BUFFER, textBufferInfo.attribs.a_texcoord.buffer);
    +  gl.bufferData(gl.ARRAY_BUFFER, vertices.arrays.texcoord, gl.DYNAMIC_DRAW);

      // 使用 'F' 的位置

      // 由于 pos 在视图空间，表示它是一个从眼睛位置出发的一个向量
      // 所以沿着向量朝眼睛方向移动一定距离
      var fromEye = m4.normalize(pos);
      var amountToMoveTowardEye = 150;  // because the F is 150 units long
      var viewX = pos[0] - fromEye[0] * amountToMoveTowardEye;
      var viewY = pos[1] - fromEye[1] * amountToMoveTowardEye;
      var viewZ = pos[2] - fromEye[2] * amountToMoveTowardEye;
      var desiredTextScale = -1 / gl.canvas.height * 2;  // 1x1 pixels
      var scale = viewZ * desiredTextScale;

      var textMatrix = m4.translate(projectionMatrix, viewX, viewY, viewZ);
      textMatrix = m4.scale(textMatrix, scale, scale, 1);

      m4.copy(textMatrix, textUniforms.u_matrix);
      webglUtils.setUniforms(textProgramInfo, textUniforms);

      // 绘制文字
      gl.drawArrays(gl.TRIANGLES, 0, vertices.numVertices);
    });

这是结果

{{{example url="../webgl-text-glyphs-texture-atlas.html" }}}

这就是使用字形纹理图集的基本原理，还有几个明显值得添加或改进的地方。

*   重用相同的序列

    当前 `makeVerticesForString` 在每次调用的时候都创建新的 Float32Arrays。
    这最终可能会导致垃圾回收停顿。重用相同的序列可能会好一些，如果序列不够大可以放大并保持大小不变。

*   添加回车支持

    检测是否是 `\n` 然后在创建顶点时换行，这样容易制作文字段落。

*   添加各种格式化支持

    如果你想居中或对齐文字就可以添加这个功能。

*   添加顶点颜色支持

    这样就可以对每个字母设置不同的颜色，当然你还需要决定如何改变文字颜色。

*   考虑在运行时用二维画布创建字形纹理图集

另一个没有讲到的重要的问题是纹理限制了大小但是字体不限，如果你想支持所有 Unicode 编码就需要处理汉语和日语，
阿拉伯语等其他语言。截止2015年已经有了超过 110,000 种 Unicode 字形！你可以用纹理适应所有字形，只是没有足够的空间。

操作系统和浏览器解决这个问题的方式是，在使用GPU加速时使用字形纹理缓冲。
向上方一样它们可能将字形放在纹理图集中，但是每种字形可能有一个固定大小的空间，
只在纹理中保存最近常用的字形。如果需要绘制的字形不在纹理中，就替换掉最不常用的那个。
当然如果要替换的字形需要绘制的话，就要在绘制后再替换。

另一个可以做的事情，尽管我不推荐，是结合这个技术和[上篇中的技术](webgl-text-texture.html)，
可以将字形直接渲染到一个纹理中。

还有一个在WebGL中绘制文字的方式就是使用三维文字，例如所有例子中的 'F' 就是一个三维字母。
你需要为每个字母创建一个，三位字母通常用于标题和电影logo，其他地方很少用。

希望这些涵盖了WebGL的文字部分。


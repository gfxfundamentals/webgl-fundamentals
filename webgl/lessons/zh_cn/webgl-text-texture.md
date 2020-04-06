Title: WebGL 文字 - 使用纹理
Description: 用纹理在WebGL中显示文字
TOC: WebGL 文字 - 使用纹理


此文上接WebGL系列文章，上一篇是[用Canvas 2D在WebGL画布上叠加一个文字层](webgl-text-canvas2d.html)，如果没读建议从那里开始。

在上文中我们讲到[如何在WebGL场景上方绘制一个二维画布文字层](webgl-text-canvas2d.html)，
那种方法可行并且容易实现，但是有一些限制，比如不能被三维物体遮挡。为了实现这个就需要在WebGL
中绘制文字。

最简单的方式是制作一个文字纹理，你可以使用PhotoShop或其他绘图软件制作一个含有文字的图片。

<img class="webgl_center" src="resources/my-awesme-text.png" />

然后创建平整的几何体显示它，这其实是我做过的所有游戏使用的方法。例如 Locoroco
只有大约 270 个句子，它被本地化为 17 种语言。我们有一个Excel表格包含了所有语言的句子，
然后使用一个脚本将它们加载到PhotoShop种生成纹理，每种语言每个句子做成一个纹理。

当然你也可以在运行时创建纹理，由于WebGL运行在浏览器中，我们可以借助 Canvas 2D API
帮助生成纹理。

从[上文](webgl-text-canvas2d.html)的例子开始，添加一个方法向二维画布种填充文字

    var textCtx = document.createElement("canvas").getContext("2d");

    // 将文字放在画布中间
    function makeTextCanvas(text, width, height) {
      textCtx.canvas.width  = width;
      textCtx.canvas.height = height;
      textCtx.font = "20px monospace";
      textCtx.textAlign = "center";
      textCtx.textBaseline = "middle";
      textCtx.fillStyle = "black";
      textCtx.clearRect(0, 0, textCtx.canvas.width, textCtx.canvas.height);
      textCtx.fillText(text, width / 2, height / 2);
      return textCtx.canvas;
    }

现在需要使用WebGL绘制两个不同的物体，'F' 和文字。我将使用
[之前讲到的帮助方法](webgl-drawing-multiple-things.html)，
如果你不清楚 `programInfo`, `bufferInfo` 是什么，就看看那篇文章。

所以，先创建 'F' 和单位矩形。

    // 创建 'F' 的数据
    var fBufferInfo = primitives.create3DFBufferInfo(gl);
    // 创建一个单位矩形供文字使用
    var textBufferInfo = primitives.createPlaneBufferInfo(gl, 1, 1, 1, 1, m4.xRotation(Math.PI / 2));

单位矩形是一个单位大小的矩形（正方形），这个矩形以原点为中心。`createPlaneBufferInfo`
创建一个在 xz 面的平面，我们传入一个矩形将它变成 xy 平面的单位矩形。

接着创建两个着色器

    // 设置着色程序
    var fProgramInfo = createProgramInfo(gl, ["vertex-shader-3d", "fragment-shader-3d"]);
    var textProgramInfo = createProgramInfo(gl, ["text-vertex-shader", "text-fragment-shader"]);

创建文字纹理

    // 创建文字纹理
    var textCanvas = makeTextCanvas("Hello!", 100, 26);
    var textWidth  = textCanvas.width;
    var textHeight = textCanvas.height;
    var textTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
    // 确保即使不是 2 的整数次幂也能渲染
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

设置 'F' 和文字的全局变量

    var fUniforms = {
      u_matrix: m4.identity(),
    };

    var textUniforms = {
      u_matrix: m4.identity(),
      u_texture: textTex,
    };

计算出 F 的矩阵并保存它的视图矩阵

    var fViewMatrix = m4.translate(viewMatrix,
        translation[0] + xx * spread, translation[1] + yy * spread, translation[2]);
    fViewMatrix = m4.xRotate(fViewMatrix, rotation[0]);
    fViewMatrix = m4.yRotate(fViewMatrix, rotation[1] + yy * xx * 0.2);
    fViewMatrix = m4.zRotate(fViewMatrix, rotation[2] + now + (yy * 3 + xx) * 0.1);
    fViewMatrix = m4.scale(fViewMatrix, scale[0], scale[1], scale[2]);
    fViewMatrix = m4.translate(fViewMatrix, -50, -75, 0);

像这样绘制 F

    gl.useProgram(fProgramInfo.program);

    webglUtils.setBuffersAndAttributes(gl, fProgramInfo, fBufferInfo);

    fUniforms.u_matrix = m4.multiply(projectionMatrix, fViewMatrix);

    webglUtils.setUniforms(fProgramInfo, fUniforms);

    // 绘制几何体
    gl.drawElements(gl.TRIANGLES, fBufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

对于文字我们只需要将原点移到 F，还需要将单位矩形缩放到纹理的大小，最后需要乘以投影矩阵。

    // 只使用 'F' 视图矩阵的位置
    var textMatrix = m4.translate(projectionMatrix,
        fViewMatrix[12], fViewMatrix[13], fViewMatrix[14]);
    // 缩放单位矩形到所需大小
    textMatrix = m4.scale(textMatrix, textWidth, textHeight, 1);

然后渲染文字

    // 绘制文字设置
    gl.useProgram(textProgramInfo.program);

    webglUtils.setBuffersAndAttributes(gl, textProgramInfo, textBufferInfo);

    m4.copy(textMatrix, textUniforms.u_matrix);
    webglUtils.setUniforms(textProgramInfo, textUniforms);

    // 绘制文字
    gl.drawElements(gl.TRIANGLES, textBufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

这是结果

{{{example url="../webgl-text-texture.html" }}}

你可能注意到文字部分覆盖了 F，那是因为我们绘制了一个矩形，画布的默认颜色是黑色透明(0,0,0,0)，
然后我们将它绘制到矩形上了，我们可以混合像素。

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

这样将源像素（片断着色器产生的颜色）和目标像素（画布上的颜色）的颜色根据混合方法进行混合，
我们设置混合方法为 `SRC_ALPHA` 对源，`ONE_MINUS_SRC_ALPHA` 对目标。

    result = dest * (1 - src_alpha) + src * src_alpha

所以加入目标像素是绿色 `0,1,0,1`，源是红色 `1,0,0,1` 就得到

    src = [1, 0, 0, 1]
    dst = [0, 1, 0, 1]
    src_alpha = src[3]  // 这是 1
    result = dst * (1 - src_alpha) + src * src_alpha

    // 相当于
    result = dst * 0 + src * 1

    // 最后结果
    result = src

对于黑色透明的部分的纹理 `0,0,0,0`

    src = [0, 0, 0, 0]
    dst = [0, 1, 0, 1]
    src_alpha = src[3]  // 这是 0
    result = dst * (1 - src_alpha) + src * src_alpha

    // 相当于
    result = dst * 1 + src * 0

    // 最后结果
    result = dst

这是使用混合的结果。

{{{example url="../webgl-text-texture-enable-blend.html" }}}

你会发现这样好一些，但是还是有问题，如果仔细看就会看到这样的问题

<img class="webgl_center" src="resources/text-zbuffer-issue.png" />

为什么会这样？我们现在是绘制一个 F 然后绘制文字，然后绘制下一个 F 和文字。
我们还有[深度缓冲](webgl-3d-orthographic.html)，所以当绘制一个 F 的文字时，
即使使用混合模式保留了背景色，但是深度缓冲还是会更新，当绘制下一个 F 时如果那个 F
的某些部分在之前文字像素的后面，那些部分就不会绘制。

我们遇到了一个使用GPU渲染三维时的最难解决的问题，**透明出现问题**。

对与透明渲染常用的解决方法是先渲染不透明的物体，然后按照 z 的顺寻绘制透明物体，
绘制时开启深度检测但是关闭深度缓冲更新。

先将绘制的不透明物体（F）和透明物体区分开（文字），先定义一些东西保存文字的位置。

    var textPositions = [];

在循环绘制 F 时保存这些位置

    var fViewMatrix = m4.translate(viewMatrix,
        translation[0] + xx * spread, translation[1] + yy * spread, translation[2]);
    fViewMatrix = m4.xRotate(fViewMatrix, rotation[0]);
    fViewMatrix = m4.yRotate(fViewMatrix, rotation[1] + yy * xx * 0.2);
    fViewMatrix = m4.zRotate(fViewMatrix, rotation[2] + now + (yy * 3 + xx) * 0.1);
    fViewMatrix = m4.scale(fViewMatrix, scale[0], scale[1], scale[2]);
    fViewMatrix = m4.translate(fViewMatrix, -50, -75, 0);
    +// 保存 f 的视图位置
    +textPositions.push([fViewMatrix[12], fViewMatrix[13], fViewMatrix[14]]);

绘制 F 前关闭混合模式开启深度缓冲

    gl.disable(gl.BLEND);
    gl.depthMask(true);

绘制文字开启混合关闭深度缓冲写入

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);

然后在所有保存的位置绘制文字

    +// 绘制文字设置
    +gl.useProgram(textProgramInfo.program);
    +
    +webglUtils.setBuffersAndAttributes(gl, textProgramInfo, textBufferInfo);

    +textPositions.forEach(function(pos) {
      // 绘制文字

      // 使用 F 的视图位置
    *  var textMatrix = m4.translate(projectionMatrix, pos[0], pos[1], pos[2]);
      // 将文字缩放到需要的大小
      textMatrix = m4.scale(textMatrix, textWidth, textHeight, 1);

      m4.copy(textMatrix, textUniforms.u_matrix);
      webglUtils.setUniforms(textProgramInfo, textUniforms);

      // 绘制文字
      gl.drawElements(gl.TRIANGLES, textBufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
    +});

注意，我将设置程序和属性放在循环外面了，因为我们将同一个物体绘制很多遍不需要每次都设置这些。

现在它基本上可以了

{{{example url="../webgl-text-texture-separate-opaque-from-transparent.html" }}}

你可能注意到我并没有向之前提到的进行排序，在这个例子中我们绘制的几乎是透明的文字，
如果排序了也看不出明显的效果，我会将它留在其他文章中去讲。

另一个问题是文字和对应的 'F' 相交了，这其实没有一个明确的解决办法。
如果你正在制作一个MMO然后想给每个玩家显示一些持续文字，你可能会将文字显示在头顶。
只需要将它的 +Y 加一些距离，确保它总是在玩家头上方。

你也可以将它移动到相机方向，我们来实现这个吧。由于 'pos' 在视图空间中，
这意味着它和眼睛位置（在视图空间 0,0,0 处）有关，所以如果我们将它单位化然后乘以一个值，
将它移到眼睛方向固定距离。

    +// 由于 pos 在视图空间，表示它是一个从眼睛位置出发的一个向量
    +// 所以沿着向量朝眼睛方向移动一定距离
    +var fromEye = m4.normalize(pos);
    +var amountToMoveTowardEye = 150;  // 因为 F 是 150 个单位长
    +var viewX = pos[0] - fromEye[0] * amountToMoveTowardEye;
    +var viewY = pos[1] - fromEye[1] * amountToMoveTowardEye;
    +var viewZ = pos[2] - fromEye[2] * amountToMoveTowardEye;
    +var textMatrix = m4.translate(projectionMatrix, viewX, viewY, viewZ);

    *var textMatrix = m4.translate(projectionMatrix, viewX, viewY, viewZ);
    // 将矩形缩放到需要的大小
    textMatrix = m4.scale(textMatrix, textWidth, textHeight, 1);

这是结果。

{{{example url="../webgl-text-texture-moved-toward-view.html" }}}

你可能还会发现文字边缘的问题。

<img class="webgl_center" src="resources/text-gray-outline.png" />

这个问题是 Canvas 2D API 只生成预乘阿尔法通道的值，当我们上传画布内容为WebGL纹理时，
WebGL视图获取没有预乘阿尔法的值，但是由于预乘阿尔法的值缺失阿尔法，所以很难完美转换成非预乘值。

解决这个问题需要告诉WebGL不用做反预乘。

    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

这个告诉WebGL提供预乘值到`gl.texImage2D` 和 `gl.texSubImage2D`，
如果像 Canvas 2D 数据本身就是预乘的话，就直接传递到WebGL。

我们还需要修改混合方法

    -gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    +gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

旧的方法将源和它的阿尔法通道相乘，就是 `SRC_ALPHA` 代表的意思。
但是现在我们的纹理数据已经乘了它的阿尔法值，就是预乘的意思。
所以就不需要让GPU再做乘法，设置为 `ONE` 表示乘以 1。

{{{example url="../webgl-text-texture-premultiplied-alpha.html" }}}

现在边界消失了。

如果你想让文字保持固定大小怎么办？如果你还记得[透视投影](webgl-3d-perspective.html)
种讲到过透视矩阵就是将物体缩放 `1 / -Z`，以实现近大远小。所以，我们只需缩放 `-Z` 的期望倍数。

    ...
    // 由于 pos 在视图空间，表示它是一个从眼睛位置出发的一个向量
    // 所以沿着向量朝眼睛方向移动一定距离
    var fromEye = normalize(pos);
    var amountToMoveTowardEye = 150;  // 因为 F 是 150 个单位长
    var viewX = pos[0] - fromEye[0] * amountToMoveTowardEye;
    var viewY = pos[1] - fromEye[1] * amountToMoveTowardEye;
    var viewZ = pos[2] - fromEye[2] * amountToMoveTowardEye;
    +var desiredTextScale = -1 / gl.canvas.height;  // 1x1 像素大小
    +var scale = viewZ * desiredTextScale;

    var textMatrix = m4.translate(projectionMatrix, viewX, viewY, viewZ);
    // 将矩形缩放到需要的大小
    *textMatrix = m4.scale(textMatrix, textWidth * scale, textHeight * scale, 1);
    ...

{{{example url="../webgl-text-texture-consistent-scale.html" }}}

如果你想给每个 F 绘制不同的文字，就应该给每个 F 创建一个新纹理，然后更新那个 F 的全局变量。

    // 创建纹理，每个 F 一个
    var textTextures = [
      "anna",   // 0
      "colin",  // 1
      "james",  // 2
      "danny",  // 3
      "kalin",  // 4
      "hiro",   // 5
      "eddie",  // 6
      "shu",    // 7
      "brian",  // 8
      "tami",   // 9
      "rick",   // 10
      "gene",   // 11
      "natalie",// 12,
      "evan",   // 13,
      "sakura", // 14,
      "kai",    // 15,
    ].map(function(name) {
      var textCanvas = makeTextCanvas(name, 100, 26);
      var textWidth  = textCanvas.width;
      var textHeight = textCanvas.height;
      var textTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, textTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
      // 确保即使不是 2 的整数次幂也能渲染
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return {
        texture: textTex,
        width: textWidth,
        height: textHeight,
      };
    });

然后再渲染时选择纹理

    *textPositions.forEach(function(pos, ndx) {

      +// 选择一个纹理
      +var tex = textTextures[ndx];

      // 将 F 缩放到需要的大小
      var textMatrix = m4.translate(projectionMatrix, viewX, viewY, viewZ);
      // 将矩形缩放到需要的大小
      *textMatrix = m4.scale(textMatrix, tex.width * scale, tex.height * scale, 1);

然后再绘制前设置纹理全局变量

      *textUniforms.u_texture = tex.texture;

{{{example url="../webgl-text-texture-different-text.html" }}}

我们使用黑色绘制的文字，如果使用白色会更有用。那样就可以将文字颜色乘以一个颜色值然后变成任意需要的颜色。

首先改变文字着色器，乘以一个颜色

    varying vec2 v_texcoord;

    uniform sampler2D u_texture;
    +uniform vec4 u_color;

    void main() {
    *   gl_FragColor = texture2D(u_texture, v_texcoord) * u_color;
    }


然后绘制使用白色绘制文字到画布

    textCtx.fillStyle = "white";

创建一些颜色

    // 颜色，每个 F 一个
    var colors = [
      [0.0, 0.0, 0.0, 1], // 0
      [1.0, 0.0, 0.0, 1], // 1
      [0.0, 1.0, 0.0, 1], // 2
      [1.0, 1.0, 0.0, 1], // 3
      [0.0, 0.0, 1.0, 1], // 4
      [1.0, 0.0, 1.0, 1], // 5
      [0.0, 1.0, 1.0, 1], // 6
      [0.5, 0.5, 0.5, 1], // 7
      [0.5, 0.0, 0.0, 1], // 8
      [0.0, 0.0, 0.0, 1], // 9
      [0.5, 5.0, 0.0, 1], // 10
      [0.0, 5.0, 0.0, 1], // 11
      [0.5, 0.0, 5.0, 1], // 12,
      [0.0, 0.0, 5.0, 1], // 13,
      [0.5, 5.0, 5.0, 1], // 14,
      [0.0, 5.0, 5.0, 1], // 15,
    ];

绘制时选择颜色

    // 设置颜色全局变量
    textUniforms.u_color = colors[ndx];

不同颜色

{{{example url="../webgl-text-texture-different-colors.html" }}}

事实上浏览器在开启 GPU 加速时使用了这个技术，它们使用你的HTML内容和各种样式生成纹理，
只要内容不变就只需要不停渲染纹理，即使是滚动之类..当然，如果每次都不停的更新内容就会慢一些，
因为重生成纹理并重上传它们到GPU是相对较慢的操作。

在[下篇文章中我们将讲一个频繁更新时较好的处理方法](webgl-text-glyphs.html)。


<div class="webgl_bottombar">
<h3>缩放文字去像素化</h3>
<p>
你可能会注意到使用固定尺寸例子前的文字，在距离相机近的时候像素化很严重，如何修复？
</p>
<p>
事实上在三维中缩放二维并不是十分常见，看大多数游戏或三维编辑器就会发现无论相机近还是远，
文字总是固定尺寸。事实上那些文字通常都是绘制在二维而不是三维中，所以即使有人或物体在别的东西的背后，
例如队友在墙后面，你还是可以看到和它相关的文字。
</p>
<p>如果你确实需要在三维中缩放二维文字，我不知道有什么简单的办法，我想到了这几个
</p>
<ul>
<li>在不同的分辨率下使用不同的字体和字号生成不同大小的纹理，然后在高分辨率时使用大一点的纹理，
这个技术叫做LODing（使用不同级别的细节）。</li>
<li>另一个是在每一帧渲染文字时使用确切相关的大小，那样就会非常慢。</li>
<li>另一个可能就是使用二维文字的外包几何体。换句话说就是使用三角形代替绘制纹理。
这个方法可行，但是当文字很小的时候渲染的不是很正常，很大的时候可以看到三角形。</li>
<li>还有一个是<a href="https://www.google.com/search?q=loop+blinn+curve+rendering">使用渲染曲线的特殊着色器</a>。
这个非常酷但是超出了我可以在这里解释的范围。</li>
</div>




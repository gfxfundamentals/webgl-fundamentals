Title: WebGL 着色器和GLSL
Description: 着色器和GLSL分别是什么

此文上接[WebGL 基础概念](webgl-fundamentals.html)。
如果你还没有阅读WebGL工作原理，也许可以先[阅读这篇文章](webgl-how-it-works.html)。

我们之前提到过着色器和GLSL，但是没有涉及细节，你可能已经对此有所了解，
但以防万一，这里将详细讲解着色器和GLSL。

在[工作原理](webgl-how-it-works.html)中我们提到，WebGL每次绘制需要两个着色器，
一个**顶点着色器**和一个**片断着色器**，每一个着色器都是一个**方法**。
一个顶点着色器和一个片断着色器链接在一起放入一个着色程序中（或者只叫程序）。
一个典型的WebGL应用会有多个着色程序。

## 顶点着色器

一个顶点着色器的工作是生成裁剪空间坐标值，通常是以下的形式

    void main() {
       gl_Position = doMathToMakeClipspaceCoordinates
    }

每个顶点调用一次（顶点）着色器，每次调用都需要设置一个特殊的全局变量`gl_Position`，
该变量的值就是裁减空间坐标值。

顶点着色器需要的数据，可以通过以下三种方式获得。

1.  [Attributes 属性](#attributes-) (从缓冲中获取的数据)
2.  [Uniforms 全局变量](#uniforms-) (在一次绘制中对所有顶点保持一致值)
3.  [Textures 纹理](#textures-) (从像素或纹理元素中获取的数据)
 
### Attributes 属性

最常用的方法是缓冲和**属性**，在[工作原理](webgl-how-it-works.html)
中讲到了缓冲和属性，你可以创建缓冲，

    var buf = gl.createBuffer();

将数据存入缓冲

    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, someData, gl.STATIC_DRAW);

然后初始化的时候，在你制作的（着色）程序中找到属性所在地址

    var positionLoc = gl.getAttribLocation(someShaderProgram, "a_position");

在渲染的时候告诉WebGL怎么从缓冲中获取数据传递给属性

    // 开启从缓冲中获取数据
    gl.enableVertexAttribArray(positionLoc);

    var numComponents = 3;  // (x, y, z)
    var type = gl.FLOAT;    // 32位浮点数据
    var normalize = false;  // 不标准化
    var offset = 0;         // 从缓冲起始位置开始获取
    var stride = 0;         // 到下一个数据跳多少位内存
                            // 0 = 使用当前的单位个数和单位长度 （ 3 * Float32Array.BYTES_PER_ELEMENT ）

    gl.vertexAttribPointer(positionLoc, numComponents, type, false, stride, offset);

在[WebGL 基础概念](webgl-fundamentals.html)中示范了不做任何运算直接将数据传递给`gl_Position`。

    attribute vec4 a_position;

    void main() {
       gl_Position = a_position;
    }

如果缓冲中存的是裁剪空间坐标就没什么问题。

属性可以用 `float`, `vec2`, `vec3`, `vec4`, `mat2`, `mat3` 和 `mat4` 数据类型。

### Uniforms 全局变量

全局变量在一次绘制过程中传递给着色器的值都一样，在下面的一个简单的例子中，
用全局变量给顶点着色器添加了一个偏移量

    attribute vec4 a_position;
    +uniform vec4 u_offset;

    void main() {
       gl_Position = a_position + u_offset;
    }

现在可以把所有顶点偏移一个固定值，首先在初始化时找到全局变量的地址

    var offsetLoc = gl.getUniformLocation(someProgram, "u_offset");

然后在绘制前设置全局变量

    gl.uniform4fv(offsetLoc, [1, 0, 0, 0]);  // 向右偏移一半屏幕宽度

要注意的是全局变量属于单个着色程序，如果多个着色程序有同名全局变量，需要找到每个全局变量并设置自己的值。
我们调用`gl.uniform???`的时候只是设置了**当前程序**的全局变量，当前程序是传递给`gl.useProgram`
的最后一个程序。

全局变量有很多类型，对应的类型有对应的设置方法。

    gl.uniform1f (floatUniformLoc, v);                 // float
    gl.uniform1fv(floatUniformLoc, [v]);               // float 或 float array
    gl.uniform2f (vec2UniformLoc,  v0, v1);            // vec2
    gl.uniform2fv(vec2UniformLoc,  [v0, v1]);          // vec2 或 vec2 array
    gl.uniform3f (vec3UniformLoc,  v0, v1, v2);        // vec3
    gl.uniform3fv(vec3UniformLoc,  [v0, v1, v2]);      // vec3 或 vec3 array
    gl.uniform4f (vec4UniformLoc,  v0, v1, v2, v4);    // vec4
    gl.uniform4fv(vec4UniformLoc,  [v0, v1, v2, v4]);  // vec4 或 vec4 array

    gl.uniformMatrix2fv(mat2UniformLoc, false, [  4x element array ])  // mat2 或 mat2 array
    gl.uniformMatrix3fv(mat3UniformLoc, false, [  9x element array ])  // mat3 或 mat3 array
    gl.uniformMatrix4fv(mat4UniformLoc, false, [ 16x element array ])  // mat4 或 mat4 array

    gl.uniform1i (intUniformLoc,   v);                 // int
    gl.uniform1iv(intUniformLoc, [v]);                 // int 或 int array
    gl.uniform2i (ivec2UniformLoc, v0, v1);            // ivec2
    gl.uniform2iv(ivec2UniformLoc, [v0, v1]);          // ivec2 或 ivec2 array
    gl.uniform3i (ivec3UniformLoc, v0, v1, v2);        // ivec3
    gl.uniform3iv(ivec3UniformLoc, [v0, v1, v2]);      // ivec3 or ivec3 array
    gl.uniform4i (ivec4UniformLoc, v0, v1, v2, v4);    // ivec4
    gl.uniform4iv(ivec4UniformLoc, [v0, v1, v2, v4]);  // ivec4 或 ivec4 array

    gl.uniform1i (sampler2DUniformLoc,   v);           // sampler2D (textures)
    gl.uniform1iv(sampler2DUniformLoc, [v]);           // sampler2D 或 sampler2D array

    gl.uniform1i (samplerCubeUniformLoc,   v);         // samplerCube (textures)
    gl.uniform1iv(samplerCubeUniformLoc, [v]);         // samplerCube 或 samplerCube array

还有一些类型 `bool`, `bvec2`, `bvec3`, and `bvec4`。它们可用`gl.uniform?f?`或`gl.uniform?i?`。

一个数组可以一次设置所有的全局变量，例如

    // 着色器里
    uniform vec2 u_someVec2[3];

    // JavaScript 初始化时
    var someVec2Loc = gl.getUniformLocation(someProgram, "u_someVec2");

    // 渲染的时候
    gl.uniform2fv(someVec2Loc, [1, 2, 3, 4, 5, 6]);  // 设置数组 u_someVec2

如果你想单独设置数组中的某个值，就要单独找到该值的地址。

    // JavaScript 初始化时
    var someVec2Element0Loc = gl.getUniformLocation(someProgram, "u_someVec2[0]");
    var someVec2Element1Loc = gl.getUniformLocation(someProgram, "u_someVec2[1]");
    var someVec2Element2Loc = gl.getUniformLocation(someProgram, "u_someVec2[2]");

    // 渲染的时候
    gl.uniform2fv(someVec2Element0Loc, [1, 2]);  // set element 0
    gl.uniform2fv(someVec2Element1Loc, [3, 4]);  // set element 1
    gl.uniform2fv(someVec2Element2Loc, [5, 6]);  // set element 2

同样的，如果你创建了一个结构体

    struct SomeStruct {
      bool active;
      vec2 someVec2;
    };
    uniform SomeStruct u_someThing;

你需要找到每个元素的地址

    var someThingActiveLoc = gl.getUniformLocation(someProgram, "u_someThing.active");
    var someThingSomeVec2Loc = gl.getUniformLocation(someProgram, "u_someThing.someVec2");

### 纹理（顶点着色器中）

同 [Textures 纹理（在片断着色器中）](#textures-)。

## 片断着色器

一个片断着色器的工作是为当前光栅化的像素提供颜色值，通常是以下的形式

    precision mediump float;

    void main() {
       gl_FragColor = doMathToMakeAColor;
    }

每个像素都将调用一次片段着色器，每次调用需要从你设置的特殊全局变量`gl_FragColor`中获取颜色信息。

片段着色器所需的数据，可以通过以下三种方式获取

1.  [Uniforms 全局变量](#uniforms-) (values that stay the same for every pixel of a single draw call)
2.  [Textures 纹理](#textures-) (data from pixels/texels)
3.  [Varyings 可变量](#varyings-) (data passed from the vertex shader and interpolated)

### Uniform 全局变量（片断着色器中）

同 [Uniforms 全局变量](#uniforms-).

### Textures 纹理（片断着色器中）

在着色器中获取纹理信息，可以先创建一个`sampler2D`类型全局变量，然后用GLSL方法`texture2D`
从纹理中提取信息。

    precision mediump float;

    uniform sampler2D u_texture;

    void main() {
       vec2 texcoord = vec2(0.5, 0.5)  // 获取纹理中心的值
       gl_FragColor = texture2D(u_texture, texcoord);
    }

从纹理中获取的数据[取决于很多设置](webgl-3d-textures.html)。
至少要创建并给纹理填充数据，例如

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    var level = 0;
    var width = 2;
    var height = 1;
    var data = new Uint8Array([
       255, 0, 0, 255,   // 一个红色的像素
       0, 255, 0, 255,   // 一个绿色的像素
    ]);
    gl.texImage2D(gl.TEXTURE_2D, level, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);

在初始化时找到全局变量的地址

    var someSamplerLoc = gl.getUniformLocation(someProgram, "u_texture");

在渲染的时候WebGL要求纹理必须绑定到一个纹理单元上

    var unit = 5;  // 挑选一个纹理单元
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);

然后告诉着色器你要使用的纹理在那个纹理单元

    gl.uniform1i(someSamplerLoc, unit);

### Varyings 可变量

在[工作原理](webgl-how-it-works.html)提到过，可变量是一种顶点着色器给片断着色器传值的方式。

为了使用可变量，要在两个着色器中定义同名的可变量。
给顶点着色器中可变量设置的值，会作为参考值进行内插，在绘制像素时传给片段着色器的可变量。

顶点着色器

    attribute vec4 a_position;

    uniform vec4 u_offset;

    +varying vec4 v_positionWithOffset;

    void main() {
      gl_Position = a_position + u_offset;
    +  v_positionWithOffset = a_position + u_offset;
    }

片断着色器

    precision mediump float;

    +varying vec4 v_positionWithOffset;

    void main() {
    +  // 从裁剪空间 (-1 <-> +1) 转换到颜色空间 (0 -> 1).
    +  vec4 color = v_positionWithOffset * 0.5 + 0.5
    +  gl_FragColor = color;
    }

上方的示例几乎没有意义，通常情况下直接将裁剪空间的值传给片断着色器当作颜色值是没有意义的，
虽然它可以运行并且可以生成颜色值。

## GLSL

GLSL stands for Graphics Library Shader Language. It's the language shaders are written
in. It has some special semi unique features that are certainly not common in JavaScript.
It's designed to do the math that is commonly needed to compute things for rasterizing
graphics. So for example it has built in types like `vec2`, `vec3`, and `vec4` which
represent 2 values, 3 values, and 4 values respectively. Similarly it has `mat2`, `mat3`
and `mat4` which represent 2x2, 3x3, and 4x4 matrices. You can do things like multiply
a `vec` by a scalar.

    vec4 a = vec4(1, 2, 3, 4);
    vec4 b = a * 2.0;
    // b is now vec4(2, 4, 6, 8);

Similarly it can do matrix multiplication and vector to matrix multiplication

    mat4 a = ???
    mat4 b = ???
    mat4 c = a * b;

    vec4 v = ???
    vec4 y = c * v;

It also has various selectors for the parts of a vec. For a vec4

    vec4 v;

*   `v.x` is the same as `v.s` and `v.r` and `v[0]`.
*   `v.y` is the same as `v.t` and `v.g` and `v[1]`.
*   `v.z` is the same as `v.p` and `v.b` and `v[2]`.
*   `v.w` is the same as `v.q` and `v.a` and `v[3]`.

It it able to *swizzle* vec components which means you can swap or repeat components.

    v.yyyy

is the same as

    vec4(v.y, v.y, v.y, v.y)

Similarly

    v.bgra

is the same as

    vec4(v.b, v.g, v.r, v.a)

when constructing a vec or a mat you can supply multiple parts at once. So for example

    vec4(v.rgb, 1)

Is the same as

    vec4(v.r, v.g, v.b, 1)

Also

    vec4(1)

Is the same as

    vec4(1, 1, 1, 1)

One thing you'll likely get caught up on is that GLSL is very type strict.

    float f = 1;  // ERROR 1 is an int. You can't assign an int to a float

The correct way is one of these

    float f = 1.0;      // use float
    float f = float(1)  // cast the integer to a float

The example above of `vec4(v.rgb, 1)` doesn't complain about the `1` because `vec4` is
casting the things inside just like `float(1)`.

GLSL has a bunch of built in functions. Many of them operate on multiple components at once.
So for example

    T sin(T angle)

Means T can be `float`, `vec2`, `vec3` or `vec4`. If you pass in `vec4` you get `vec4` back
which the sine of each of the components. In other words if `v` is a `vec4` then

    vec4 s = sin(v);

is the same as

    vec4 s = vec4(sin(v.x), sin(v.y), sin(v.z), sin(v.w));

Sometimes one argument is a float and the rest is `T`. That means that float will be applied
to all the components. For example if `v1` and `v2` are `vec4` and `f` is a float then

    vec4 m = mix(v1, v2, f);

is the same as

    vec4 m = vec4(
      mix(v1.x, v2.x, f),
      mix(v1.y, v2.y, f),
      mix(v1.z, v2.z, f),
      mix(v1.w, v2.w, f));

You can see a list of all the GLSL functions on the last page of [the WebGL
Reference Card](https://www.khronos.org/files/webgl/webgl-reference-card-1_0.pdf).
If you like really dry and verbose stuff you can try
[the GLSL spec](https://www.khronos.org/files/opengles_shading_language.pdf).

## Putting it all together

That's the point of this entire series of posts. WebGL is all about creating various shaders, supplying
the data to those shaders and then calling `gl.drawArrays` or `gl.drawElements` to have WebGL process
the vertices by calling the current vertex shader for each vertex and then render pixels by calling the
the current fragment shader for each pixel.

Actually creating the shaders requires several lines of code. Since those lines are the same in
most WebGL programs and since once written you can pretty much ignore them. [How to compile GLSL shaders
and link them into a shader program is covered here](webgl-boilerplate.html).

If you're just starting from here you can go in 2 directions. If you are interested in image procesing
I'll show you [how to do some 2D image processing](webgl-image-processing.html).
If you are interesting in learning about translation,
rotation, scale and eventually 3D then [start here](webgl-2d-translation.html).




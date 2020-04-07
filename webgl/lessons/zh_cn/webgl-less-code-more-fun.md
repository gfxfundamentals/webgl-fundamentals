Title: WebGL 码少趣多
Description: 让编写WebGL代码少点啰嗦
TOC: WebGL 码少趣多


此文上接WebGL系列文章，从[基础理论](webgl-fundamentals.html)开始，
如果没读请从那里开始。

编写WebGL代码时，你需要将着色器对链接到程序中，然后找到输入变量的位置。
这些输入变量包括属性和全局变量，找到他们的位置非常啰唆和无聊。

假设我们有[这样一个典型的WebGL着色程序模板](webgl-boilerplate.html)，
有这样一对着色器。

顶点着色器：

```
uniform mat4 u_worldViewProjection;
uniform vec3 u_lightWorldPos;
uniform mat4 u_world;
uniform mat4 u_viewInverse;
uniform mat4 u_worldInverseTranspose;

attribute vec4 a_position;
attribute vec3 a_normal;
attribute vec2 a_texcoord;

varying vec4 v_position;
varying vec2 v_texCoord;
varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;

void main() {
  v_texCoord = a_texcoord;
  v_position = (u_worldViewProjection * a_position);
  v_normal = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;
  v_surfaceToLight = u_lightWorldPos - (u_world * a_position).xyz;
  v_surfaceToView = (u_viewInverse[3] - (u_world * a_position)).xyz;
  gl_Position = v_position;
}
```

片断着色器：

```
precision mediump float;

varying vec4 v_position;
varying vec2 v_texCoord;
varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;

uniform vec4 u_lightColor;
uniform vec4 u_ambient;
uniform sampler2D u_diffuse;
uniform vec4 u_specular;
uniform float u_shininess;
uniform float u_specularFactor;

vec4 lit(float l ,float h, float m) {
  return vec4(1.0,
              max(l, 0.0),
              (l > 0.0) ? pow(max(0.0, h), m) : 0.0,
              1.0);
}

void main() {
  vec4 diffuseColor = texture2D(u_diffuse, v_texCoord);
  vec3 a_normal = normalize(v_normal);
  vec3 surfaceToLight = normalize(v_surfaceToLight);
  vec3 surfaceToView = normalize(v_surfaceToView);
  vec3 halfVector = normalize(surfaceToLight + surfaceToView);
  vec4 litR = lit(dot(a_normal, surfaceToLight),
                    dot(a_normal, halfVector), u_shininess);
  vec4 outColor = vec4((
  u_lightColor * (diffuseColor * litR.y + diffuseColor * u_ambient +
                u_specular * litR.z * u_specularFactor)).rgb,
      diffuseColor.a);
  gl_FragColor = outColor;
}
```

你要在代码中像这样找到所有要设置的变量。

```
// 初始化时
var u_worldViewProjectionLoc   = gl.getUniformLocation(program, "u_worldViewProjection");
var u_lightWorldPosLoc         = gl.getUniformLocation(program, "u_lightWorldPos");
var u_worldLoc                 = gl.getUniformLocation(program, "u_world");
var u_viewInverseLoc           = gl.getUniformLocation(program, "u_viewInverse");
var u_worldInverseTransposeLoc = gl.getUniformLocation(program, "u_worldInverseTranspose");
var u_lightColorLoc            = gl.getUniformLocation(program, "u_lightColor");
var u_ambientLoc               = gl.getUniformLocation(program, "u_ambient");
var u_diffuseLoc               = gl.getUniformLocation(program, "u_diffuse");
var u_specularLoc              = gl.getUniformLocation(program, "u_specular");
var u_shininessLoc             = gl.getUniformLocation(program, "u_shininess");
var u_specularFactorLoc        = gl.getUniformLocation(program, "u_specularFactor");

var a_positionLoc              = gl.getAttribLocation(program, "a_position");
var a_normalLoc                = gl.getAttribLocation(program, "a_normal");
var a_texCoordLoc              = gl.getAttribLocation(program, "a_texcoord");


// 初始化或绘制时需要的全局变量值
var someWorldViewProjectionMat = computeWorldViewProjectionMatrix();
var lightWorldPos              = [100, 200, 300];
var worldMat                   = computeWorldMatrix();
var viewInverseMat             = computeInverseViewMatrix();
var worldInverseTransposeMat   = computeWorldInverseTransposeMatrix();
var lightColor                 = [1, 1, 1, 1];
var ambientColor               = [0.1, 0.1, 0.1, 1];
var diffuseTextureUnit         = 0;
var specularColor              = [1, 1, 1, 1];
var shininess                  = 60;
var specularFactor             = 1;


// 绘制时
gl.useProgram(program);

// 设置所有的缓冲和属性
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.enableVertexAttribArray(a_positionLoc);
gl.vertexAttribPointer(a_positionLoc, positionNumComponents, gl.FLOAT, false, 0, 0);
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
gl.enableVertexAttribArray(a_normalLoc);
gl.vertexAttribPointer(a_normalLoc, normalNumComponents, gl.FLOAT, false, 0, 0);
gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
gl.enableVertexAttribArray(a_texcoordLoc);
gl.vertexAttribPointer(a_texcoordLoc, texcoordNumComponents, gl.FLOAT, 0, 0);

// 设置使用的纹理
gl.activeTexture(gl.TEXTURE0 + diffuseTextureUnit);
gl.bindTexture(gl.TEXTURE_2D, diffuseTexture);

// 设置所有的全局变量
gl.uniformMatrix4fv(u_worldViewProjectionLoc, false, someWorldViewProjectionMat);
gl.uniform3fv(u_lightWorldPosLoc, lightWorldPos);
gl.uniformMatrix4fv(u_worldLoc, worldMat);
gl.uniformMatrix4fv(u_viewInverseLoc, viewInverseMat);
gl.uniformMatrix4fv(u_worldInverseTransposeLoc, worldInverseTransposeMat);
gl.uniform4fv(u_lightColorLoc, lightColor);
gl.uniform4fv(u_ambientLoc, ambientColor);
gl.uniform1i(u_diffuseLoc, diffuseTextureUnit);
gl.uniform4fv(u_specularLoc, specularColor);
gl.uniform1f(u_shininessLoc, shininess);
gl.uniform1f(u_specularFactorLoc, specularFactor);

gl.drawArrays(...);
```

需要写很多代码。

这有很多方式简化这个过程，
首先可以一次获取WebGL中需要的所有属性和全局变量的位置，
然后在一个方法中设置它们，我们可以传递一个JavaScript对象给这个方法。
如果理解了这一步操作，我们的代码应该会变成这样

```
// 初始化时
var uniformSetters = webglUtils.createUniformSetters(gl, program);
var attribSetters  = webglUtils.createAttributeSetters(gl, program);

var attribs = {
  a_position: { buffer: positionBuffer, numComponents: 3, },
  a_normal:   { buffer: normalBuffer,   numComponents: 3, },
  a_texcoord: { buffer: texcoordBuffer, numComponents: 2, },
};

// 初始化或或绘制时需要的全局变量值
var uniforms = {
  u_worldViewProjection:   computeWorldViewProjectionMatrix(...),
  u_lightWorldPos:         [100, 200, 300],
  u_world:                 computeWorldMatrix(),
  u_viewInverse:           computeInverseViewMatrix(),
  u_worldInverseTranspose: computeWorldInverseTransposeMatrix(),
  u_lightColor:            [1, 1, 1, 1],
  u_ambient:               [0.1, 0.1, 0.1, 1],
  u_diffuse:               diffuseTexture,
  u_specular:              [1, 1, 1, 1],
  u_shininess:             60,
  u_specularFactor:        1,
};

// 绘制时
gl.useProgram(program);

// 设置所有的缓冲和属性
webglUtils.setAttributes(attribSetters, attribs);

// 设置需要的全局变量和纹理
webglUtils.setUniforms(uniformSetters, uniforms);

gl.drawArrays(...);
```

这样看起来就简单，清晰，代码量少一些了。

如果需要你也可以使用多个JavaScript对象，例如

```
// 初始化时
var uniformSetters = webglUtils.createUniformSetters(gl, program);
var attribSetters  = webglUtils.createAttributeSetters(gl, program);

var attribs = {
  a_position: { buffer: positionBuffer, numComponents: 3, },
  a_normal:   { buffer: normalBuffer,   numComponents: 3, },
  a_texcoord: { buffer: texcoordBuffer, numComponents: 2, },
};

// 初始化或渲染时需要的全局变量
var uniformsThatAreTheSameForAllObjects = {
  u_lightWorldPos:         [100, 200, 300],
  u_viewInverse:           computeInverseViewMatrix(),
  u_lightColor:            [1, 1, 1, 1],
};

var uniformsThatAreComputedForEachObject = {
  u_worldViewProjection:   perspective(...),
  u_world:                 computeWorldMatrix(),
  u_worldInverseTranspose: computeWorldInverseTransposeMatrix(),
};

var objects = [
  { translation: [10, 50, 100],
    materialUniforms: {
      u_ambient:               [0.1, 0.1, 0.1, 1],
      u_diffuse:               diffuseTexture,
      u_specular:              [1, 1, 1, 1],
      u_shininess:             60,
      u_specularFactor:        1,
    },
  },
  { translation: [-120, 20, 44],
    materialUniforms: {
      u_ambient:               [0.1, 0.2, 0.1, 1],
      u_diffuse:               someOtherDiffuseTexture,
      u_specular:              [1, 1, 0, 1],
      u_shininess:             30,
      u_specularFactor:        0.5,
    },
  },
  { translation: [200, -23, -78],
    materialUniforms: {
      u_ambient:               [0.2, 0.2, 0.1, 1],
      u_diffuse:               yetAnotherDiffuseTexture,
      u_specular:              [1, 0, 0, 1],
      u_shininess:             45,
      u_specularFactor:        0.7,
    },
  },
];

// 绘制时
gl.useProgram(program);

// 设置所有对象公共部分的参数
webglUtils.setAttributes(attribSetters, attribs);
webglUtils.setUniforms(uniformSetters, uniformThatAreTheSameForAllObjects);

objects.forEach(function(object) {
  computeMatricesForObject(object, uniformsThatAreComputedForEachObject);
  webglUtils.setUniforms(uniformSetters, uniformThatAreComputedForEachObject);
  webglUtils.setUniforms(unifromSetters, objects.materialUniforms);
  gl.drawArrays(...);
});
```

这是使用这个辅助方法的一个例子

{{{example url="../webgl-less-code-more-fun.html" }}}

继续让代码更少一点，在之前的代码中我们用自己创建的缓冲设置 `attribs` ，
创建缓冲的代码没有列出来，假设你想创建一个位置，
法向量和纹理坐标的缓冲，你可能需要写这些代码

    // 一个三角形
    var positions = [0, -10, 0, 10, 10, 0, -10, 10, 0];
    var texcoords = [0.5, 0, 1, 1, 0, 1];
    var normals   = [0, 0, 1, 0, 0, 1, 0, 0, 1];

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    var texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);

    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

看起来像是这种简化形式。

    // 一个三角形
    var arrays = {
       position: { numComponents: 3, data: [0, -10, 0, 10, 10, 0, -10, 10, 0], },
       texcoord: { numComponents: 2, data: [0.5, 0, 1, 1, 0, 1],               },
       normal:   { numComponents: 3, data: [0, 0, 1, 0, 0, 1, 0, 0, 1],        },
    };

    var bufferInfo = createBufferInfoFromArrays(gl, arrays);

代码少多了！现在我们可以在渲染时这样写

    // 设置所有需要的缓冲和属性
    webglUtils.setBuffersAndAttributes(gl, attribSetters, bufferInfo);

    ...

    // 绘制几何体
    gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);

这是结果

{{{example url="../webgl-less-code-more-fun-triangle.html" }}}

甚至在你使用索引时也可以这样做，`webglUtils.setBuffersAndAttributes`
会设置所有属性并使用你提供的 `indices` 设置 `ELEMENT_ARRAY_BUFFER`，
所以你需要调用 `gl.drawElements`。

    // 有索引的矩形
    var arrays = {
       position: { numComponents: 3, data: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0], },
       texcoord: { numComponents: 2, data: [0, 0, 0, 1, 1, 0, 1, 1],                 },
       normal:   { numComponents: 3, data: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],     },
       indices:  { numComponents: 3, data: [0, 1, 2, 1, 2, 3],                       },
    };

    var bufferInfo = webglUtils.createBufferInfoFromArrays(gl, arrays);

在渲染时将调用 `gl.drawElements` 代替 `gl.drawArrays`。

    // 设置所有需要的缓冲和属性
    webglUtils.setBuffersAndAttributes(gl, attribSetters, bufferInfo);

    ...

    // 绘制几何体
    gl.drawElements(gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

这是结果

{{{example url="../webgl-less-code-more-fun-quad.html" }}}

`createBufferInfoFromArrays`方法本质上创建了类似这样的一个对象

     bufferInfo = {
       numElements: 4,        // 或者其他元素的实际个数
       indices: WebGLBuffer,  // 如果没有索引这个属性就不存在
       attribs: {
         a_position: { buffer: WebGLBuffer, numComponents: 3, },
         a_normal:   { buffer: WebGLBuffer, numComponents: 3, },
         a_texcoord: { buffer: WebGLBuffer, numComponents: 2, },
       },
     };

然后 `webglUtils.setBuffersAndAttributes` 使用通过这个对象设置所有的缓冲和属性。

最后是我认为的最后一步，假定 `position` 总是有三个单位长度 (x, y, z)，
`texcoords` 总是有 2 个单位长度，索引 3 个单位长度，法向量 3 个单位长度，
然后让程序推测出单元的个数。

    // 有索引的矩形
    var arrays = {
       position: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0],
       texcoord: [0, 0, 0, 1, 1, 0, 1, 1],
       normal:   [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
       indices:  [0, 1, 2, 1, 2, 3],
    };

对应版本

{{{example url="../webgl-less-code-more-fun-quad-guess.html" }}}

我不确定哪个方式更好，因为推测有何很出出错。
例如我想在纹理坐标中添加一个单位长度存储其他信息，
按照 2 个单位去推测单元个数就会出错。当然，
如果出错了我可以像前一个例子中那样声明单元个数，取决于个人。
有些人喜欢事情按照他们的思路实现，越简单越好。

为什么不按照属性在着色器中的类型来确定单元的个数？
因为当我们使用 `vec4` 时大多数情况下只从缓冲中提供 3 个单位长度的数据  (x, y, z)，
WebGL会自动设置 `w = 1`。所以这就意味着我们不能轻易推断出用户的真实意愿，
因为他们在着色器中定义的单位长度可能和提供的长度不相符。

还有这样一个形式

    var program = webglUtils.createProgramFromScripts(gl, ["vertexshader", "fragmentshader"]);
    var uniformSetters = webglUtils.createUniformSetters(gl, program);
    var attribSetters  = webglUtils.createAttributeSetters(gl, program);

可以简化成这样

    var programInfo = webglUtils.createProgramInfo(gl, ["vertexshader", "fragmentshader"]);

返回类似这样的对象

    programInfo = {
       program: WebGLProgram,  // 刚编译的程序
       uniformSetters: ...,    // webglUtils.createUniformSetters 返回的 setter
       attribSetters: ...,     // webglUtils.createAttribSetters 返回的 setter
    }

这是一个简单的简化，但是如果在多程序的代码中，就可以保持程序和对应的 setter 一致。

{{{example url="../webgl-less-code-more-fun-quad-programinfo.html" }}}

总之，这是我在写WebGL程序时喜欢的模式，这些教程中的例子我会使用标准的
**啰唆**的方式，这样就不会让别人因为我自己的模式感到迷惑。
在某些时候标准形式过于复杂，所以在接下来的课程中可能会使用这种模式。

你也可以在你的代码中使用这种风格，例子中使用的方法 `createUniformSetters`,
 `createAttributeSetters`, `createBufferInfoFromArrays`, `setUniforms`,
和 `setBuffersAndAttributes` 都在 [`webgl-utils.js`](https://github.com/gfxfundamentals/webgl-fundamentals/blob/master/webgl/resources/webgl-utils.js)中。
如果你想更有组织的使用，可以看看 [TWGL.js](https://twgljs.org)。

接下来，[绘制多个物体](webgl-drawing-multiple-things.html)。

<div class="webgl_bottombar">
<h3>我们能直接使用 setter 么?</h3>
<p>
熟悉JavaScript的人可能会想，我能像这样直接使用 setter 么？
</p>
<pre class="prettyprint">
// 初始化时
var uniformSetters = webglUtils.createUniformSetters(program);

// 绘制时
uniformSetters.u_ambient([1, 0, 0, 1]); // 设置环境光为红色
</pre>
<p>这样做不好的原因就是，在使用GLSL的过程中经常会修改，调试。假设屏幕上什么都没有出现，首先我会简化着色器，例如我会尽可能简化片断着色器。</p>
<pre class="prettyprint showlinemods">
// 片断着色器
precision mediump float;

varying vec4 v_position;
varying vec2 v_texCoord;
varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;

uniform vec4 u_lightColor;
uniform vec4 u_ambient;
uniform sampler2D u_diffuse;
uniform vec4 u_specular;
uniform float u_shininess;
uniform float u_specularFactor;

vec4 lit(float l ,float h, float m) {
  return vec4(1.0,
              max(l, 0.0),
              (l > 0.0) ? pow(max(0.0, h), m) : 0.0,
              1.0);
}

void main() {
  vec4 diffuseColor = texture2D(u_diffuse, v_texCoord);
  vec3 a_normal = normalize(v_normal);
  vec3 surfaceToLight = normalize(v_surfaceToLight);
  vec3 surfaceToView = normalize(v_surfaceToView);
  vec3 halfVector = normalize(surfaceToLight + surfaceToView);
  vec4 litR = lit(dot(a_normal, surfaceToLight),
                    dot(a_normal, halfVector), u_shininess);
  vec4 outColor = vec4((
  u_lightColor * (diffuseColor * litR.y + diffuseColor * u_ambient +
                u_specular * litR.z * u_specularFactor)).rgb,
      diffuseColor.a);
  gl_FragColor = outColor;
*  gl_FragColor = vec4(0,1,0,1);  // &lt;!--- 就是绿色
}
</pre>
<p>注意到我添加了一行，直接将 <code>gl_FragColor</code> 设置为固定颜色。
大多数驱动会发现之前的行没有为结果做贡献，优化后就会把没用的变量移除，
下次我运行程序调用<code>createUniformSetters</code>就不会为<code>u_ambient</code>
创建 setter，所以 <code>uniformSetters.u_ambient()</code> 就会报错。
<pre class="prettyprint">
TypeError: undefined is not a function
</pre>
<p><code>setUniforms</code> 可以避免这种错误，它只会设置存在的全局变量。</p>
</div>

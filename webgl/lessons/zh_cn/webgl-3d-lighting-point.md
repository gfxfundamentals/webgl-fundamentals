Title: WebGL 三维点光源
Description: 如何在WebGL中实现点光源
TOC: WebGL 三维点光源


此文上接[WebGL三维方向光源](webgl-3d-lighting-directional.html)，
如果没看请[从那里开始](webgl-3d-lighting-directional.html)。

上篇中说到方向光统一来自一个方向，在渲染前设置好方向。

如果代替方向而是从三维空间中选一个点当作光源，
然后在着色器中根据光源和表面位置计算光照方向的话，就是点光源了。

{{{diagram url="resources/point-lighting.html" width="500" height="400" className="noborder" }}}

如果旋转上方的表面会发现，每个点都有一个不同的**面到光源**的矢量，
将这个矢量和法向量点乘后，表面上的每个点都会有一个不同的光照值。

让我们实现它吧。

首先需要一个光源位置

    uniform vec3 u_lightWorldPosition;

然后需要计算表面的世界坐标，我们可以将位置和世界矩阵相乘得到...

    uniform mat4 u_world;

    ...

    // 计算表面的世界坐标
    vec3 surfaceWorldPosition = (u_world * a_position).xyz;

然后可以计算出一个从表面到光源的矢量，用来模拟之前的方向光，
只是这次我们为表面上的每个点都计算了一个方向。

    v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;

这是全部的内容

    attribute vec4 a_position;
    attribute vec3 a_normal;

    +uniform vec3 u_lightWorldPosition;

    +uniform mat4 u_world;
    uniform mat4 u_worldViewProjection;
    uniform mat4 u_worldInverseTranspose;

    varying vec3 v_normal;

    +varying vec3 v_surfaceToLight;

    void main() {
      // 将位置和矩阵相乘
      gl_Position = u_worldViewProjection * a_position;

      // 重定向法向量并传递给片断着色器
      v_normal = mat3(u_worldInverseTranspose) * a_normal;

    +  // 计算表面的世界坐标
    +  vec3 surfaceWorldPosition = (u_world * a_position).xyz;
    +
    +  // 计算表面到光源的方向
    +  // 传递给片断着色器
    +  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
    }

在片断着色器中需要将表面到光源的方向进行单位化，
注意，虽然我们可以在顶点着色器中传递单位向量，
但是 `varying` 会进行插值再传给片断着色器，
所以片断着色器中的向量基本上不是单位向量了。

    precision mediump float;

    // 从顶点着色器中传入的值
    varying vec3 v_normal;
    +varying vec3 v_surfaceToLight;

    -uniform vec3 u_reverseLightDirection;
    uniform vec4 u_color;

    void main() {
      // 由于 v_normal 是可变量，所以经过插值后不再是单位向量，
      // 单位化后会成为单位向量
      vec3 normal = normalize(v_normal);

      vec3 surfaceToLightDirection = normalize(v_surfaceToLight);

      -float light = dot(normal, u_reverseLightDirection);
      +float light = dot(normal, surfaceToLightDirection);

      gl_FragColor = u_color;

      // 只将颜色部分（不包含 alpha） 和光照相乘
      gl_FragColor.rgb *= light;
    }


然后需要找到 `u_world` 和 `u_lightWorldPosition` 的位置

```
-  var reverseLightDirectionLocation =
-      gl.getUniformLocation(program, "u_reverseLightDirection");
+  var lightWorldPositionLocation =
+      gl.getUniformLocation(program, "u_lightWorldPosition");
+  var worldLocation =
+      gl.getUniformLocation(program, "u_world");
```

设置它们

```
  // 设置矩阵
+  gl.uniformMatrix4fv(
+      worldLocation, false,
+      worldMatrix);
  gl.uniformMatrix4fv(
      worldViewProjectionLocation, false,
      worldViewProjectionMatrix);

  ...

-  // 设置光照方向
-  gl.uniform3fv(reverseLightDirectionLocation, m4.normalize([0.5, 0.7, 1]));
+  // 设置光源位置
+  gl.uniform3fv(lightWorldPositionLocation, [20, 30, 50]);
```

这是结果

{{{example url="../webgl-3d-lighting-point.html" }}}

现在我们可以加一个叫做镜面高光的东西。

观察现实世界中的物体，如果物体表面恰好将光线反射到你眼前，
就会显得非常明亮，像镜子一样。

<img class="webgl_center" src="resources/specular-highlights.jpg" />

我们可以通过计算光线是否反射到眼前来模拟这种情况，**点乘**又一次起到了至关重要的作用。

如何测试呢？如果入射角和反射角恰好与眼睛和和光源的夹角相同，那么光线就会反射到眼前。

{{{diagram url="resources/surface-reflection.html" width="500" height="400" className="noborder" }}}

如果我们知道了物体表面到光源的方向（刚刚已经计算过了），
加上物体表面到视区/眼睛/相机的方向，再除以 2 得到 `halfVector` 向量，
将这个向量和法向量比较，如果方向一致，那么光线就会被反射到眼前。
那么如何确定方向是否一致呢？用之前的**点乘**就可以了。1 表示相符，
0 表示垂直，-1 表示相反。

{{{diagram url="resources/specular-lighting.html" width="500" height="400" className="noborder" }}}

所以首先我们需要传入相机位置，计算表面到相机的方向矢量，
然后传递到片断着色器。

    attribute vec4 a_position;
    attribute vec3 a_normal;

    uniform vec3 u_lightWorldPosition;
    +uniform vec3 u_viewWorldPosition;

    uniform mat4 u_world;
    uniform mat4 u_worldViewProjection;
    uniform mat4 u_worldInverseTranspose;

    varying vec3 v_normal;

    varying vec3 v_surfaceToLight;
    +varying vec3 v_surfaceToView;

    void main() {
      // 将位置和矩阵相乘
      gl_Position = u_worldViewProjection * a_position;

      // 重定向法向量并传递到片断着色器
      v_normal = mat3(u_worldInverseTranspose) * a_normal;

      // 计算表面的世界坐标
      vec3 surfaceWorldPosition = (u_world * a_position).xyz;

      // 计算表面到光源的方向
      // 然后传递到片断着色器
      v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;

    +  // 计算表面到相机的方向
    +  // 然后传递到片断着色器
    +  v_surfaceToView = u_viewWorldPosition - surfaceWorldPosition;
    }

然后在片断着色器中计算表面到光源和相机之间的 `halfVector`，
将它和法向量相乘，查看光线是否直接反射到眼前。

    // 从顶点着色器中传入的值
    varying vec3 v_normal;
    varying vec3 v_surfaceToLight;
    +varying vec3 v_surfaceToView;

    uniform vec4 u_color;

    void main() {
      // 由于 v_normal 是可变量，所以经过插值后不再是单位向量，
      // 单位化后会成为单位向量
      vec3 normal = normalize(v_normal);

    +  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
    +  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
    +  vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);

      float light = dot(normal, surfaceToLightDirection);
    +  float specular = dot(normal, halfVector);

      gl_FragColor = u_color;

      // 只将颜色部分（不包含 alpha） 和光照相乘
      gl_FragColor.rgb *= light;

    +  // 直接加上高光
    +  gl_FragColor.rgb += specular;
    }

最后找到 `u_viewWorldPosition` 并设置它

    var lightWorldPositionLocation =
        gl.getUniformLocation(program, "u_lightWorldPosition");
    +var viewWorldPositionLocation =
    +    gl.getUniformLocation(program, "u_viewWorldPosition");

    ...

    // 计算相机矩阵
    var camera = [100, 150, 200];
    var target = [0, 35, 0];
    var up = [0, 1, 0];
    var cameraMatrix = makeLookAt(camera, target, up);

    +// 设置相机位置
    +gl.uniform3fv(viewWorldPositionLocation, camera);


这是结果

{{{example url="../webgl-3d-lighting-point-specular.html" }}}

**但，亮瞎了!**

我们可以将点乘结果进行求幂运算来解决太亮的问题，
它会把高光从线性变换变成指数变换。

{{{diagram url="resources/power-graph.html" width="300" height="300" className="noborder" }}}

红线越接近顶部，我们加的光照就越多，通过求幂可以将高光的部分向右移动。

就把它叫做 `shininess` 并加到着色器中。

    uniform vec4 u_color;
    +uniform float u_shininess;

    ...

    -  float specular = dot(normal, halfVector);
    +  float specular = 0.0;
    +  if (light > 0.0) {
    +    specular = pow(dot(normal, halfVector), u_shininess);
    +  }

点乘结果有可能为负值，将赋值求幂有可能会得到 undefined 的结果，
所以我们只将点乘结果为正的部分进行计算，其他部分设置为 0.0。

当然还要找到亮度的位置并设置它

    +var shininessLocation = gl.getUniformLocation(program, "u_shininess");

    ...

    // 设置亮度
    gl.uniform1f(shininessLocation, shininess);

这是结果

{{{example url="../webgl-3d-lighting-point-specular-power.html" }}}

最后想说的是光的颜色。

在此之前我们都是将 `light` 和 F 的颜色直接相乘，
如果想要有色光也可以为光照提供颜色。

    uniform vec4 u_color;
    uniform float u_shininess;
    +uniform vec3 u_lightColor;
    +uniform vec3 u_specularColor;

    ...

      // 只将颜色部分（不包含 alpha） 和光照相乘
    *  gl_FragColor.rgb *= light * u_lightColor;

      // 直接和高光相加
    *  gl_FragColor.rgb += specular * u_specularColor;
    }

然后

    +  var lightColorLocation =
    +      gl.getUniformLocation(program, "u_lightColor");
    +  var specularColorLocation =
    +      gl.getUniformLocation(program, "u_specularColor");

和

    // 设置光照颜色
    +  gl.uniform3fv(lightColorLocation, m4.normalize([1, 0.6, 0.6]));  // 红光
    // 设置高光颜色
    +  gl.uniform3fv(specularColorLocation, m4.normalize([1, 0.6, 0.6]));  // 红光

{{{example url="../webgl-3d-lighting-point-color.html" }}}

接下来是？？？

<div class="webgl_bottombar">
<h3>为什么 <code>pow(negative, power)</code> 是 undefined?</h3>
<p>它是什么意思?</p>
<div class="webgl_center"><pre class="glocal-center-content">pow(5, 2)</pre></div>
<p>你可以当作</p>
<div class="webgl_center"><pre class="glocal-center-content">5 * 5 = 25</pre></div>
<p>然后</p>
<div class="webgl_center"><pre class="glocal-center-content">pow(5, 3)</pre></div>
<p>可以看作是</p>
<div class="webgl_center"><pre class="glocal-center-content">5 * 5 * 5 = 125</pre></div>
<p>那么</p>
<div class="webgl_center"><pre class="glocal-center-content">pow(-5, 2)</pre></div>
<p>就是</p>
<div class="webgl_center"><pre class="glocal-center-content">-5 * -5 = 25</pre></div>
<p>然后</p>
<div class="webgl_center"><pre class="glocal-center-content">pow(-5, 3)</pre></div>
<p>就成为</p>
<div class="webgl_center"><pre class="glocal-center-content">-5 * -5 * -5 = -125</pre></div>
<p>你可能知道负数和负数相乘就会变成正数，再乘以负数就会变成负数。</p>
<p>那么这是什么意思呢?</p>
<div class="webgl_center"><pre class="glocal-center-content">pow(-5, 2.5)</pre></div>
<p>你如何决定这是正数还是负数？我数学并不好但是这看起来很难确定所以就是 undefined。</p>.
</div>


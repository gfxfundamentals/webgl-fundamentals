Title: WebGL 三维聚光灯
Description: 如何在 WebGL 中实现聚光灯的效果
TOC: WebGL 三维聚光灯


此文上接[WebGL 三维点光源](webgl-3d-lighting-point.html)，
如果没读建议从[那里开始](webgl-3d-lighting-point.html)。

在上篇文章中我们讲到点光源，计算光源到物体表面每一点的方向，然后做与
[方向光](webgl-3d-lighting-directional.html)相同的运算，
也就是对光线方向和表面法向量（表面面对的方向）做点乘运算。
如果两个方向完全相同就会得到 1，应该被完全照亮。
如果两个方向垂直会得到0，相反会得到 -1。我们直接将这个值和表面的颜色相乘，
实现光照效果。

聚光灯只是做了少量修改，事实上如果你比较有创新能力的话，可能会根据之前学的东西知道聚光灯的实现方法。

你可以把点光源想象成一个点，光线从那个点照向所有方向。
实现聚光灯只需要以那个点为起点选择一个方向，作为聚光灯的方向，
然后将其他光线方向与所选方向点乘，然后随意选择一个限定范围，
然后判断光线是否在限定范围内，如果不在就不照亮。

{{{diagram url="resources/spot-lighting.html" width="500" height="400" className="noborder" }}}

在上方的图示中我们开一看到光线照向所有的方向，并且将每个方向的点乘结果显示在上面。
然后指定一个方向**方向**表示聚光灯的方向，选择一个限定（上方以度为单位）。
通过限定我们计算一个**点乘限定**，只需对限定值取余弦就可以得到。如果与选定聚光灯方向的点乘大于这个点乘限定，就照亮，否则不照亮。

换一种方式解释，假设限定是 20 度，我们可以将它转换为弧度，然后取余弦值得到 -1 到 1 之间的数，
暂且把它称作点乘空间。或者可以用这个表格表示限定值的转换。

                限制值
       角度   |   弧度   | 点乘空间
     --------+---------+----------
        0    |   0.0   |    1.0
        22   |    .38  |     .93
        45   |    .79  |     .71
        67   |   1.17  |     .39
        90   |   1.57  |    0.0
       180   |   3.14  |   -1.0

我们可以只需判断

    dotFromDirection = dot(surfaceToLight, -lightDirection)
    if (dotFromDirection >= limitInDotSpace) {
       // 使用光照
    }

让我们来实现它。

首先修改[上文](webgl-3d-lighting-point.html)的片断着色器。

```
precision mediump float;

// 从顶点着色器传入的值
varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;

uniform vec4 u_color;
uniform float u_shininess;
+uniform vec3 u_lightDirection;
+uniform float u_limit;          // 在点乘空间中

void main() {
  // 因为 v_normal 是可变量，被插值过
  // 所以不是单位向量，单位可以让它成为再次成为单位向量
  vec3 normal = normalize(v_normal);

  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
  vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);

-  float light = dot(normal, surfaceToLightDirection);
+  float light = 0.0;
  float specular = 0.0;

+  float dotFromDirection = dot(surfaceToLightDirection,
+                               -u_lightDirection);
+  if (dotFromDirection >= u_limit) {
*    light = dot(normal, surfaceToLightDirection);
*    if (light > 0.0) {
*      specular = pow(dot(normal, halfVector), u_shininess);
*    }
+  }

  gl_FragColor = u_color;

  // 只将颜色部分（不包含 alpha） 和光照相乘
  gl_FragColor.rgb *= light;

  // 直接加上高光
  gl_FragColor.rgb += specular;
}
```

当然我们需要找到刚才添加的全局变量的位置。

```
  var lightDirection = [?, ?, ?];
  var limit = degToRad(20);

  ...

  var lightDirectionLocation = gl.getUniformLocation(program, "u_lightDirection");
  var limitLocation = gl.getUniformLocation(program, "u_limit");
```

然后设置它们

```
    gl.uniform3fv(lightDirectionLocation, lightDirection);
    gl.uniform1f(limitLocation, Math.cos(limit));
```

这是结果

{{{example url="../webgl-3d-lighting-spot.html" }}}

一些需要注意的细节：一个是我们在上方对 `u_lightDirection` 取负，
这其实是一个等价的选择，我们希望两个方向匹配的时候能指向相同的方向，
也就是需要将 surfaceToLightDirection 和聚光灯的反方向相比，
我们可以用很多种方式实现这个。可以在设置全局变量时传入反方向，
那可能是我的首选，但是我觉得那样应该叫做 `u_reverseLightDirection` 或 `u_negativeLightDirection`
而不是 `u_lightDirection`。

另一件事，也许这个只是个人习惯，如果可能的话我尽量不在着色器中使用条件语句，
原因是我认为着色器并不是真的使用条件语句，如果你在着色器中使用着色器，
编译器会在代码中扩展很多 0 和 1 的乘法运算来实现，所以这里并不是真的条件语句，
它会将你的代码扩展成多种组合。我不确定现在是否还是这样，但是我们可以使用一些技巧来避免这种情况，
你自己可以选择用或不用。

有一个 GLSL 函数叫做 `step`，它获取两个值，如果第二个值大于或等于第一个值就返回 1.0，
否则返回 0。用JavaScript大概可以这样表示。

    function step(a, b) {
       if (b >= a) {
           return 1;
       } else {
           return 0;
       }
    }

让我们使用 `step` 避免这种情况

```
  float dotFromDirection = dot(surfaceToLightDirection,
                               -u_lightDirection);
  // 如果光线在聚光灯范围内 inLight 就为 1，否则为 0
  float inLight = step(u_limit, dotFromDirection);
  float light = inLight * dot(normal, surfaceToLightDirection);
  float specular = inLight * pow(dot(normal, halfVector), u_shininess);
```

看起来没有什么区别，这是结果

{{{example url="../webgl-3d-lighting-spot-using-step.html" }}}

还有一件事，现在的聚光灯效果非常粗糙和僵硬。只有在聚光灯范围内或外，
在外面就直接变黑，没有任何过渡。

要修正它我们可以使用两个限定值代替原来的一个，
一个内部限定一个外部限定。如果在内部限定内就使用 1.0，
在外部限定外面就使用 0.0，在内部和外部限定之间就使用 1.0 到 0.0 之间的插值。

这是我们实现这个的一种方式

```
-uniform float u_limit;          // 在点乘空间中
+uniform float u_innerLimit;     // 在点乘空间中
+uniform float u_outerLimit;     // 在点乘空间中

...

  float dotFromDirection = dot(surfaceToLightDirection,
                               -u_lightDirection);
-  float inLight = step(u_limit, dotFromDirection);
+  float limitRange = u_innerLimit - u_outerLimit;
+  float inLight = clamp((dotFromDirection - u_outerLimit) / limitRange, 0.0, 1.0);
  float light = inLight * dot(normal, surfaceToLightDirection);
  float specular = inLight * pow(dot(normal, halfVector), u_shininess);

```

这样就行了

{{{example url="../webgl-3d-lighting-spot-falloff.html" }}}

现在我们得到了聚光灯的效果。

需要注意的事如果 `u_innerLimit` 和 `u_outerLimit`相等那么 `limitRange`
就会是 0.0 。除以 0 就会导致 undefined。这在着色器中没有什么解决办法，
所以只需要在JavaScript中确保 `u_innerLimit` 和 `u_outerLimit` 永远不要相等。
（注意：示例代码中并没有做这个。）

GLSL 也有一个函数可以稍微做一些简化，叫做 `smoothstep`，和 `step` 相似返回一个 0 到 1
之间的值，但是它获取最大和最小边界值，返回该值在边界范围映射到 0 到 1 之间的插值。

     smoothstep(lowerBound, upperBound, value)

让我们来实现它

```
  float dotFromDirection = dot(surfaceToLightDirection,
                               -u_lightDirection);
-  float limitRange = u_innerLimit - u_outerLimit;
-  float inLight = clamp((dotFromDirection - u_outerLimit) / limitRange, 0.0, 1.0);
  float inLight = smoothstep(u_outerLimit, u_innerLimit, dotFromDirection);
  float light = inLight * dot(normal, surfaceToLightDirection);
  float specular = inLight * pow(dot(normal, halfVector), u_shininess);
```

这样也可以

{{{example url="../webgl-3d-lighting-spot-falloff-using-smoothstep.html" }}}

不同之处是 `smoothstep` 使用 Hermite 插值而不是线型插值，
也就是说 `lowerBound` 和 `upperBound` 之间的值插值后像下方右图所示，
线型插值是左图。

<img class="webgl_center invertdark" src="resources/linear-vs-hermite.png" />

如果你觉得没什么关系的话，使用什么取决于你自己。

还有一件事就是注意当 `lowerBound` 大于或等于 `upperBound` 时 `smoothstep`
方法会产生 undefined。它们值相等和志强的情况一样，多出的问题是 `lowerBound` 大于
`upperBound` 时，但是对于正常的聚光灯这种情况永远不会出现。

<div class="webgl_bottombar">
<h3>小心 GLSL 中的 undefined 情况</h3>
<p>
GLSL 中的一些函数在某些情况下会出现 undefined，对一个负值使用<code>pow</code>求幂就是一个例子，
因为结果是无法预期。我们遇到的另一个例子就是上方的<code>smoothstep</code>。
<p>
你应该注意这些情况，否则你的着色器会在不同的设备上得到不同的结果。
<a href="https://www.khronos.org/files/opengles_shading_language.pdf">规范第 8 节</a>
列出了所有内置函数，它们的用法，是否会出现 undefined 情况。</p>
<p>这是会出现undefined情况的列表。注意<code>genType</code> 表示 <code>float</code>, <code>vec2</code>, <code>vec3</code>, 或 <code>vec4</code>。</p>
<pre class="prettyprint"><code>genType asin (genType x)</code></pre><p>反正弦函数，返回角度 x 的反正弦值，返回值在 [−π/2, π/2] 之间，如果 ∣x∣ > 1 导致undefined。</p>


<pre class="prettyprint"><code>genType acos (genType x)</code></pre><p>反余弦函数。返回角度 x 的反余弦值，返回值范围为[0, π]，
如果 ∣x∣ > 1 导致undefined。</p>



<pre class="prettyprint"><code>genType atan (genType y, genType x)</code></pre><p>反正切函数。返回一个正切为 y/x 的角度，
x 和 y 的符号决定象限，返回值范围为[−π,π]，如果 x 和 y 都是 0 导致undefined。</p>


<pre class="prettyprint"><code>genType pow (genType x, genType y)</code></pre><p>返回 x 的 y 次幂, 例如, x<sup>y</sup>。
如果 x < 0 导致undefined，如果 x = 0 并且 y <= 0 导致undefined。</p>


<pre class="prettyprint"><code>genType log (genType x)</code></pre><p>返回 x 的自然对数, 例如, 返回 y 值满足 x = e<sup>y</sup>。
如果 x <= 0 导致undefinded。</p>


<pre class="prettyprint"><code>genType log2 (genType x)</code></pre><p>返回以 2 为底 x 的对数。例如，返回 y 满足 x=2<sup>y</sup>。
如果 x <= 0 导致undefinded。</p>



<pre class="prettyprint"><code>genType sqrt (genType x)</code></pre><p>返回 √x .
如果 x < 0 导致undefinded。</p>


<pre class="prettyprint"><code>genType inversesqrt (genType x)</code></pre><p>
返回 1/√x.
如果 x <= 0 导致undefinded。</p>


<pre class="prettyprint"><code>genType clamp (genType x, genType minVal, genType maxVal)
genType clamp (genType x, float minVal, float maxVal)</code></pre><p>
返回 min (max (x, minVal), maxVal).
如果 minVal > maxVal 导致undefined。</p>



<pre class="prettyprint"><code>genType smoothstep (genType edge0, genType edge1, genType x)
genType smoothstep (float edge0, float edge1, genType x)</code></pre><p>
如果 x <= edge0 返回 0.0，如果 x >= edge1 返回 1.0，
当 edge0 < x < edge1 使用 Hermite 插值到 0 到 1 之间。
当你希望在阈值范围内平滑插值时这个函数就很有用。相当于：
</p>
<pre class="prettyprint">
 genType t;
 t = clamp ((x – edge0) / (edge1 – edge0), 0, 1);
 return t * t * (3 – 2 * t);
</pre>
<p>如果 edge0 >= edge1 导致undefined。</p>





</div>


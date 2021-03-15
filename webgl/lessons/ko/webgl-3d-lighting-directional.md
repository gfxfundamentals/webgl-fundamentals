Title: WebGL 3D - Directional Lighting
Description: How to implement directional lighting in WebGL
TOC: Directional Lighting



이 게시물은 [WebGL Fundamentals](webgl-fundamentals.html)라는 기사 게시물의 일부 이며 시리즈 입니다.
이 게시물은 [WebGL 3D Cameras](webgl-3d-camera.html)에 이어 집니다. 만약 당신이 읽지 읽지않았다면, [여기서 시작](webgl-3d-camera.html) 하길 제안 드립니다.

여기에는 빛을 구현하는 많은 방법이 있습니다. 아마도 가장 간단한것이
*방향성있는 빛" 입니다. 

방향성 있는 비은 빛이 한 방향으로 부터 균일하게 오는것을 가정합니다.
맑은 날 태양이 종종 방향성있는 빛으로 생각이 됩니다.
태양은 너무 멀어서 광선이 물체의 표면에 수평하게 닿는것으로 생각이 됩니다.

방향성 있는 빛을 계산하는 것은 꽤 실제로 간단합니다.
만일 우리가 어떤 빛의 방향이 움직이고 우리가 물체 표면의 방향이 직면한다는 것을
알고있다면, 우리는 2 방향의 내적을 가져올수 있습니다.
그리고 그것은 우리에게 두 방향의 각도의 코사인 값을 알려줄 것 입니다.

여기에 예가 있습니다.

{{{diagram url="resources/dot-product.html" caption="drag the points"}}}

지점을 드래그 해보세요, 만약 당신이 정확히 서로의 반대를 적용하면,
당신은 내적이 -1 인것을 알것입니다. 
만약 그것들이 정확하게 동일한 지점에 있다면, 내적은 1 입니다.

어떻게 이것이 유용한가요 ? 음 우리가 만일 3d 물체의 표면의 방향이 직면하고,
우리가 빛의 방향이 비추고 있다는것을 알고 있다면,
우리는 그것들의 내적을 구할수가 있습니다. 그리고 그것은 우리에게 1이라는 숫자 일것 입니다.
만일 빛이 직접 표면에 가리키고 있다면, 그것은 우리에게 숫자 1을 줄것이며,
직접 반대를 가리키고 있다면 -1 일 것 입니다.

{{{diagram url="resources/directional-lighting.html" caption="rotate the direction" width="500" height="400"}}}

우리는 우리의 컬러값을 내적과 곱할수 있습니다. 대박이다. 빛 이 나오네..
문제는 어떻게 우리가 3d 물체의 표면이 직면하고 있는 방향을 아는것 입니다.

## 법선의 소개

법선은 라틴어로 *norma*, 목수의 사각형이라고 불립니다.
단순히 목수의 사각형은 직각인것 처럼, 법선은 선 혹은 표면에 직각을 이룹니다.
3D 그래픽에서 법선은 표면에 직면하는 방향을 가리키는 유닛벡터란 단어 입니다.

여기에 구와 원에 대한 법선 몇가지 있습니다.
{{{diagram url="resources/normals.html"}}}

오브젝트 밖으로 튀어나온 선들은 각 정점들의 법선을 나타 냅니다.

큐브에는 각 코너마다 3개의 법선이 있습니다. 
이것은 구에 직면하는 방법을 나타내기 위해 3개의 법선이 필요하기 때문입니다.

법선은 양수 x는 <span style="color: red;">빨간색</span>, 
위쪽은 <span style="color: green;">녹색</span> 
그리고 z축 양수는 <span style="color: blue;">파랑색 </span> 입니다.

이제 우리들의 예전예제 [our previous examples](webgl-3d-camera.html)의 F에 법선을 추가하여 조명을 비출수 있도록 하겠습니다.
F는 매우 크고, x, y 혹은 z축에 정렬되어 있기 때문에 매우 쉽습니다.
앞쪽을 향하는 것은 0, 0, 1의 법선을 가집니다.
뒤쪽을 향한는 것은 0, 0, -1의 법선을 가집니다.
왼쪽은 -1, 0, 0, 오른쪽은 1, 0, 0 입니다.
위쪽은 0, 1, 0, 아래쪽은 0, -1, 0 입니다.

```
function setNormals(gl) {
  var normals = new Float32Array([
          // left column front
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,

          // top rung front
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,

          // middle rung front
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,

          // left column back
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,

          // top rung back
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,

          // middle rung back
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,

          // top
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,

          // top rung right
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // under top rung
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,

          // between top rung and middle
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // top of middle rung
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,

          // right of middle rung
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // bottom of middle rung.
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,

          // right of bottom
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // bottom
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,

          // left side
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0]);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
}
```
설정 합니다. 우리가 정점 색상을 제거하면, 조명을 보는 것을 더 쉬울 것 입니다.

    // look up where the vertex data needs to go.
    var positionLocation = gl.getAttribLocation(program, "a_position");
    -var colorLocation = gl.getAttribLocation(program, "a_color");
    +var normalLocation = gl.getAttribLocation(program, "a_normal");

    ...

    -// Create a buffer to put colors in
    -var colorBuffer = gl.createBuffer();
    -// Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = colorBuffer)
    -gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    -// Put geometry data into buffer
    -setColors(gl);

    +// Create a buffer to put normals in
    +var normalBuffer = gl.createBuffer();
    +// Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = normalBuffer)
    +gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    +// Put normals data into buffer
    +setNormals(gl);

이제 그릴 시간입니다.

```
-// Turn on the color attribute
-gl.enableVertexAttribArray(colorLocation);
-
-// Bind the color buffer.
-gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
-
-// Tell the attribute how to get data out of colorBuffer (ARRAY_BUFFER)
-var size = 3;                 // 3 components per iteration
-var type = gl.UNSIGNED_BYTE;  // the data is 8bit unsigned values
-var normalize = true;         // normalize the data (convert from 0-255 to 0-1)
-var stride = 0;               // 0 = move forward size * sizeof(type) each iteration to get the next position
-var offset = 0;               // start at the beginning of the buffer
-gl.vertexAttribPointer(
-    colorLocation, size, type, normalize, stride, offset)

+// Turn on the normal attribute
+gl.enableVertexAttribArray(normalLocation);
+
+// Bind the normal buffer.
+gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
+
+// Tell the attribute how to get data out of normalBuffer (ARRAY_BUFFER)
+var size = 3;          // 3 components per iteration
+var type = gl.FLOAT;   // the data is 32bit floating point values
+var normalize = false; // normalize the data (convert from 0-255 to 0-1)
+var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
+var offset = 0;        // start at the beginning of the buffer
+gl.vertexAttribPointer(
+    normalLocation, size, type, normalize, stride, offset)
```

이제 우리는 저것들을 사용할 쉐이더를 만들 필요가 있습니다.

처음 할일은 정점 쉐이더를 통해 색상 셰이더로 법선을 전달 합니다.
    attribute vec4 a_position;
    -attribute vec4 a_color;
    +attribute vec3 a_normal;

    uniform mat4 u_matrix;

    -varying vec4 v_color;
    +varying vec3 v_normal;

    void main() {
      // Multiply the position by the matrix.
      gl_Position = u_matrix * a_position;

    -  // Pass the color to the fragment shader.
    -  v_color = a_color;

    +  // Pass the normal to the fragment shader
    +  v_normal = a_normal;
    }

그리고 법선과 빛의 방향의 내적을 사용하는 수학을 사용할 색상 쉐이더가 있습니다.
And the fragment shader we'll do the math using the dot product
of the direction of the light and the normal

```
precision mediump float;

// Passed in from the vertex shader.
-varying vec4 v_color;
+varying vec3 v_normal;

+uniform vec3 u_reverseLightDirection;
+uniform vec4 u_color;

void main() {
+   // because v_normal is a varying it's interpolated
+   // so it will not be a unit vector. Normalizing it
+   // will make it a unit vector again
+   vec3 normal = normalize(v_normal);
+
+   float light = dot(normal, u_reverseLightDirection);

*   gl_FragColor = u_color;

+   // Lets multiply just the color portion (not the alpha)
+   // by the light
+   gl_FragColor.rgb *= light;
}
```

그리고 우리는 'u_color'와 'u_reverseLightDirection'의 위치를 찾을
필요가 있습니다.
```
  // lookup uniforms
  var matrixLocation = gl.getUniformLocation(program, "u_matrix");
+  var colorLocation = gl.getUniformLocation(program, "u_color");
+  var reverseLightDirectionLocation =
+      gl.getUniformLocation(program, "u_reverseLightDirection");

```
그리고 우리는 그것을 세팅할 필요가 있습니다.

```
  // Set the matrix.
  gl.uniformMatrix4fv(matrixLocation, false, worldViewProjectionMatrix);

+  // Set the color to use
+  gl.uniform4fv(colorLocation, [0.2, 1, 0.2, 1]); // green
+
+  // set the light direction.
+  gl.uniform3fv(reverseLightDirectionLocation, m4.normalize([0.5, 0.7, 1]));
```

우리가 이전에 다뤘던 `normalize`는 우리가 그곳에 넣은 값을 단위벡터로 만들 것 입니다.
샘플의 특정 값은 `x = 0.5` 이며, 양수 `x` 는 
빛이 왼쪽을 가리키는 오른편에 있다는것을 의미합니다.
양수 `y`인 `y = 0.7`은 빛이 아래를 가리키는 것을 의미합니다.
양수 `z`인 `z = 1`은 빛이 화면에 앞을 앞을 가리키는 것을 의미합니다.
방향을 의미하는 상대 값은 대부분 화면을 가리키고, 아래와 오른쪽을 가리킵니다.

그리고 여기에 있습니다.

{{{example url="../webgl-3d-lighting-directional.html" }}}

만약에 당신이 F를 회전시키면 무언가를 알아 차릴것 입니다.
F가 회전하지만, 빛은 변하지 않습니다.
우리가 원하는 것은 F가 회전하면서, 빛에 직면한 부분이 좀 더 
밝아지는 것 입니다.

이 문제를 해결하기 위해서는 우리는 오브젝트의 방향이 변경될 때, 법선의 방향을 변경해야 합니다.
우리가 위치에 대해 무언가를 했던것 처럼, 우리는 법선을 몇가지 행렬과 곱할수 있습니다.
가장 명확한 행렬은 `world` 행렬 입니다.
지금처럼 우리는 `u_matrix`라 불리는 행렬을 전달 합니다.
이제 그것을 2 개의 행렬을 넘기도록 변경 합시다.
하나는 `u_world`라 불리는 world 행렬일 것입니다.
다른 하나는 우리가 현재 `u_matrix`를 보내는 것과 같은 `u_worldViewProjection`라 불리고 있는 놈입니다.

```
attribute vec4 a_position;
attribute vec3 a_normal;

*uniform mat4 u_worldViewProjection;
+uniform mat4 u_world;

varying vec3 v_normal;

void main() {
  // Multiply the position by the matrix.
*  gl_Position = u_worldViewProjection * a_position;

*  // orient the normals and pass to the fragment shader
*  v_normal = mat3(u_world) * a_normal;
}
```

이제 우리는 `a_normal`을 `mat3(u_world)`와 곱합니다.
법선이 방향이기 때문에 우리는 이동은 신경쓰지 않습니다.
행렬의 방향을 가리키는 부분은 오직 행렬 위쪽에 3x3 부분 입니다.

이제 우리는 그 유니폼의 위치를 찾아야 합니다.

```
  // lookup uniforms
*  var worldViewProjectionLocation =
*      gl.getUniformLocation(program, "u_worldViewProjection");
+  var worldLocation = gl.getUniformLocation(program, "u_world");
```

그리고 우리는 코드를 변경하고 갱신 해야합니다.

```
*// Set the matrices
*gl.uniformMatrix4fv(
*    worldViewProjectionLocation, false,
*    worldViewProjectionMatrix);
*gl.uniformMatrix4fv(worldLocation, false, worldMatrix);
```

여기에 있습니다.

{{{example url="../webgl-3d-lighting-directional-world.html" }}}

F를 회전시키고 어느쪽이 빛의 방향을 향하고 있는지 확인하세요

내가 어떻게 직접 보여줄지 잘 모르는 문제가 하나 있는데,
그래서 나는 그것을 다이어그램으로 보여 줄 것입니다.
우리는 법선의 방향을 바꾸기 위해 `normal` 을 `u_world` 행렬에 곱합니다.
우리가 world 행렬을 크기조절하면 어떻게 될까요?
그것은 우리가 잘못된 법선을 얻은것을 나타냅니다.

{{{diagram url="resources/normals-scaled.html" caption="click to toggle normals" width="600" }}}

나는 절대 솔루션을 이해하는데 신경을쓰지 않았지만, 
당신은 world 행렬의 역행렬을 얻을수 있고, 그것을 전치하면, 즉 열을 행으로 바꾸고
그리고 당신은 올바른 해답을 얻을 것 입니다.

위의 다이어그램에서 <span style="color: #F0F;"> 보라색 </span> 구가 크기조절 되지 않았습니다.
왼쪽의 <span style="color: #F00;"> 빨강색 </span> 구는 크기조절 되었습니다.
그리고 법선은 world 행렬에 의해 곱해집니다.
당신은 무언가 잘못된것을 볼수 있습니다. 
오른쪽에 <span style="color: #00F;"> 파랑색 </span> 구는 world 역 전치행렬을
사용하고 있습니다.

다이어그램을 클릭하여 다른 표현을 순환합니다. 화면크기가 극단적 인 경우 왼쪽 (월드)의 법선이 오른쪽 (worldInverseTranspose)에있는 것 (worldInverseTranspose)이 구에 수직을 유지하는 것처럼 구 표면에 수직으로 유지되지 않는 것을 매우 쉽게 알 수 있습니다
마지막 모드는 그것들을 빨간색으로 음영처리 하는 것 입니다.
2 개의 바깥 쪽 구의 조명은 어떤 매트릭스가 사용되는지에 따라 매우 다릅니다. 
이것이 미묘한 문제인 이유를 말하기는 어렵지만 다른 시각화를 기반으로 worldInverseTranspose를 사용하는 것이 정확하다는 것이 분명합니다.

이 예제에서 이것을 구현하기 위해 코드를 다음과 같이 고쳐봅시다.
먼저 우리는 쉐이더를 수정할것 입니다.
기술적으로 우리는 `u_world` 값을 업데이트 할수 있습니다. 그러나
제일 좋은것은 우리가 이름을 바꿔서 지정하는 것이 가장 좋습니다.
그렇지 않으면 혼동할수 있을 것 입니다.


```
attribute vec4 a_position;
attribute vec3 a_normal;

uniform mat4 u_worldViewProjection;
*uniform mat4 u_worldInverseTranspose;

varying vec3 v_normal;

void main() {
  // Multiply the position by the matrix.
  gl_Position = u_worldViewProjection * a_position;

  // orient the normals and pass to the fragment shader
*  v_normal = mat3(u_worldInverseTranspose) * a_normal;
}
```
그리고 나서 우리는 위의 방향을 찾을 필요가 있다.

```
-  var worldLocation = gl.getUniformLocation(program, "u_world");
+  var worldInverseTransposeLocation =
+      gl.getUniformLocation(program, "u_worldInverseTranspose");
```

그리고 우리는 계산하고 세팅할 필요가 있다.

```
var worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
var worldInverseMatrix = m4.inverse(worldMatrix);
var worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

// Set the matrices
gl.uniformMatrix4fv(
    worldViewProjectionLocation, false,
    worldViewProjectionMatrix);
-gl.uniformMatrix4fv(worldLocation, false, worldMatrix);
+gl.uniformMatrix4fv(
+    worldInverseTransposeLocation, false,
+    worldInverseTransposeMatrix);
```

그리고 여기에 전치행렬의 대한 코드가 있다.

```
var m4 = {
  transpose: function(m) {
    return [
      m[0], m[4], m[8], m[12],
      m[1], m[5], m[9], m[13],
      m[2], m[6], m[10], m[14],
      m[3], m[7], m[11], m[15],
    ];
  },

  ...
```

왜냐하면 효과는 미비하고 우리가 어떤것을 크기조절 하지 않았기 때문에
차이는 거의 없지만 우리는 현재 준비가 되어있습니다.

{{{example url="../webgl-3d-lighting-directional-worldinversetranspose.html" }}}

나는 조명의 대한 첫번째 스텝은 명료하길 희망한다.
다음번에 잘해봐
[point lighting](webgl-3d-lighting-point.html).

<div class="webgl_bottombar">
<h3>다음을 대체하자 to mat3(u_worldInverseTranspose) * a_normal</h3>
<p>우리 쉐이더 내부에 다음과 같은 라인이 있다.</p>
<pre class="prettyprint">
v_normal = mat3(u_worldInverseTranspose) * a_normal;
</pre>
<p>우린 이걸 완료해야해</p>
<pre class="prettyprint">
v_normal = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;
</pre>
<p>왜냐하면 곱하기전에 우리는 <code>w</code>를 0으로 세팅했기 때문에
그리고 0과 행렬을 곱하면 효과적으로 그것을 지울수 있습니다.
나는 일반적인 방법이라고 생각 합니다.
3*3 matrix 방법은 나에게 깔끔하게 보였고, 종종 이런방식으로 해왔습니다. </p>

<p> 또다른 해결책은 <code> u_worldInverseTranspose</code>를
<code> mat3 </code>로 만드는 것입니다.
그렇게 하지 않은데 두가지 이유가 있습니다.
하나는 전체 <code>u_worldInverseTranspose</code>에 대한 다른 요구 사항이있을 수 있으므로 전체 <code>mat4 </code>를 전달하면 다른 요구 사항에 사용할 수 있다는 의미입니다. 
다른 하나는 JavaScript의 모든 행렬 함수가 4x4 행렬을 만든다는 것입니다.
3x3 행렬에 대해 완전히 다른 세트를 만들거나 4x4에서 3x3으로 변환하는 것은 더 강력한 이유가없는 한 우리는 작업하지 않을 것 입니다. </p>
</div>

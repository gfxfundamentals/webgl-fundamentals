Title: WebGL 3D - 방향성 조명
Description: WebGL에서 방향성 조명을 구현하는 방법
TOC: 방향성 조명


이 글은 WebGL 관련 시리즈의 한 부분으로, 첫 번째는 [WebGL 기초](webgl-fundamentals.html)였습니다.
또한 이 글은 [WebGL 3D 카메라](webgl-3d-camera.html)에서 이어집니다.
아직 읽지 않았다면 [거기](webgl-3d-camera.html)부터 시작하는 게 좋습니다.

조명을 구현하는 방법에는 여러 가지가 있습니다.
아마 가장 간단한 건 *방향성 조명*일 겁니다.

방향성 조명은 빛이 한 방향에서 균일하게 들어온다고 가정합니다.
맑은 날의 태양이 종종 방향성 조명으로 여겨지는데요.
너무 멀리 있어서 빛살이 물체의 표면 모두를 평행하게 비추는 걸로 간주될 수 있습니다.

실제로 방향성 조명을 계산하는 것은 굉장히 쉽습니다.
빛이 어떤 방향으로 가고 있는지 알고 물체의 표면이 향하는 방향을 알면, 두 방향의 *스칼라곱*을 구할 수 있고 두 방향 사이의 각도에 대한 cosine을 얻을 수 있습니다.

{{{diagram url="resources/dot-product.html" caption="점을 드래그해보세요"}}}

점을 끌어서 서로 정확히 반대에 두면 스칼라곱이 -1인 것을 알 수 있습니다.
정확히 같은 지점에 있다면 스칼라곱은 1이 되죠.

그게 어떻게 유용할까요?
3D 객체의 표면이 향하는 방향을 알고 빛이 비추는 방향을 안다면, 그 스칼라곱을 구할 수 있고, 빛이 표면을 직접 가리킨다면 1이 주어지고 정반대로 가리키면 -1이 주어집니다.

{{{diagram url="resources/directional-lighting.html" caption="방향을 회전시켜보세요" width="500" height="400"}}}

색상을 해당 스칼라곱으로 곱할 수 있습니다.
그리고 짜잔! 빛입니다!

한 가지 문제는 3D 객체의 표면이 향하는 방향을 어떻게 알 수 있을까요?

## 법선 소개

법선은 라틴어 *norma*에서 유래한 것으로, carpenter's square라고 불리는데요.
Carpenter's square가 직각인 것처럼, 법선은 선이나 표면에 대해 직각을 이룹니다.
3D 그래픽에서 법선은 표면이 향하는 방향을 설명하는 단위 벡터를 뜻하는 단어입니다.

다음은 큐브와 구체에 대한 법선입니다.

{{{diagram url="resources/normals.html"}}}

객체에서 튀어나온 선들은 각 정점에 대한 법선을 나타냅니다.

큐브는 각 모서리에 3개의 법선을 가지는데요.
큐브의 각 면이 향하는 방향을 나타내려면 3개의 다른 법선이 필요하기 때문입니다.

또한 법선은 방향에 따라 +x는 <span style="color: red;">빨강</span>, 위쪽은 <span style="color: green;">초록</span>, +z는 <span style="color: blue;">파랑</span>으로 채색됩니다.

그러면 [이전 예제](webgl-3d-camera.html)의 'F'에 법선을 추가해서 조명을 비춰봅시다.
`F`가 박스형이고 면이 x, y, z축에 정렬되어 있기 때문에 굉장히 쉽습니다.
앞쪽을 향하고 있는 것은 법선 `0, 0, 1`을 가집니다.
뒤쪽을 향하는 것은 `0, 0, -1`입니다.
왼쪽을 향하는 것은 `-1, 0, 0`, 오른쪽을 향하는 것은 `1, 0, 0`입니다.
위쪽은 `0, 1, 0`이고 아래쪽은 `0, -1, 0`입니다.

```
function setNormals(gl) {
  var normals = new Float32Array([
    // 왼쪽 열 앞쪽
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,

    // 상단 획 앞쪽
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,

    // 중간 획 앞쪽
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,

    // 왼쪽 열 뒤쪽
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,

    // 상단 획 뒤쪽
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,

    // 중간 획 뒤쪽
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,

    // 상단
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,

    // 상단 획 오른쪽
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,

    // 상단 획 아래쪽
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,

    // 상단과 중간 획 사이
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,

    // 중간 획의 위쪽
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,

    // 중간 획의 오른쪽
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,

    // 중간 획의 아래쪽
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,

    // 하단의 오른쪽
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,

    // 하단
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,

    // 왼쪽 면
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
}
```

그리고 이것들을 설정하는데요.
그 동안 정점 색상을 제거하여 조명을 보기 쉽게 합시다.

    // 정점 데이터가 어디로 가야하는지 탐색
    var positionLocation = gl.getAttribLocation(program, "a_position");
    -var colorLocation = gl.getAttribLocation(program, "a_color");
    +var normalLocation = gl.getAttribLocation(program, "a_normal");

    ...

    -// 색상을 넣을 버퍼 생성
    -var colorBuffer = gl.createBuffer();
    -// ARRAY_BUFFER에 바인딩 (ARRAY_BUFFER = colorBuffer)
    -gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    -// 버퍼에 geometry 데이터 넣기
    -setColors(gl);

    +// 법선 데이터를 넣을 버퍼 생성
    +var normalBuffer = gl.createBuffer();
    +// ARRAY_BUFFER에 바인딩 (ARRAY_BUFFER = normalBuffer)
    +gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    +// 법선 데이터를 버퍼에 넣기
    +setNormals(gl);

그리고 렌더링할 때

```
-// color attribute 활성화
-gl.enableVertexAttribArray(colorLocation);
-
-// color buffer 바인딩
-gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
-
// colorBuffer(ARRAY_BUFFER)에서 데이터 가져오는 방법을 attribute에 지시
-var size = 3;                 // 반복마다 3개의 컴포넌트
-var type = gl.UNSIGNED_BYTE;  // 데이터는 unsigned 8bit 값
-var normalize = true;         // 데이터 정규화 (0-255에서 0-1로 전환)
-var stride = 0;               // 0 = 다음 위치를 가져오기 위해 반복마다 size * sizeof(type) 만큼 앞으로 이동
-var offset = 0;               // 버퍼의 처음부터 시작
-gl.vertexAttribPointer(colorLocation, size, type, normalize, stride, offset)

+// normal attribute 활성화
+gl.enableVertexAttribArray(normalLocation);
+
+// normal buffer 바인딩
+gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
+
+// normalBuffer(ARRAY_BUFFER)에서 데이터 가져오는 방법을 attribute에 지시
+var size = 3;          // 반복마다 3개의 컴포넌트
+var type = gl.FLOAT;   // 데이터는 32bit float
+var normalize = false; // 데이터 정규화 (0-255에서 0-1로 전환)
+var stride = 0;        // 0 = 다음 위치를 가져오기 위해 반복마다 size * sizeof(type) 만큼 앞으로 이동
+var offset = 0;        // 버퍼의 처음부터 시작
+gl.vertexAttribPointer(normalLocation, size, type, normalize, stride, offset)
```

이제 셰이더가 이걸 사용하도록 만들어야 합니다.

먼저 vertex shader를 통해 fragment shader로 normal을 전달합니다.

    attribute vec4 a_position;
    -attribute vec4 a_color;
    +attribute vec3 a_normal;

    uniform mat4 u_matrix;

    -varying vec4 v_color;
    +varying vec3 v_normal;

    void main() {
      // 위치를 행렬로 곱하기
      gl_Position = u_matrix * a_position;

    -  // 색상을 fragment shader로 전달
    -  v_color = a_color;

    +  // 법선을 fragment shader로 전달
    +  v_normal = a_normal;
    }

그리고 fragment shader는 빛의 방향과 법선의 스칼라곱을 이용한 수식을 수행할 겁니다.

```
precision mediump float;

// Vertex shader에서 전달
-varying vec4 v_color;
+varying vec3 v_normal;

+uniform vec3 u_reverseLightDirection;
+uniform vec4 u_color;

void main() {
+   // v_normal이 varying이기 때문에 보간되므로 단위 벡터가 아닙니다.
+   // 정규화하면 다시 단위 벡터가 됩니다.
+   vec3 normal = normalize(v_normal);
+
+   float light = dot(normal, u_reverseLightDirection);

*   gl_FragColor = u_color;

+   // 색상 부분(alpha 제외)에만 light 곱하기
+   gl_FragColor.rgb *= light;
}
```

그런 다음 `u_color`와 `u_reverseLightDirection`의 위치를 찾아야 합니다.

```
  // Uniform 탐색
  var matrixLocation = gl.getUniformLocation(program, "u_matrix");
+  var colorLocation = gl.getUniformLocation(program, "u_color");
+  var reverseLightDirectionLocation =
+      gl.getUniformLocation(program, "u_reverseLightDirection");

```

그리고 이것들을 설정해야 합니다.

```
  // 행렬 설정
  gl.uniformMatrix4fv(matrixLocation, false, worldViewProjectionMatrix);

+  // 사용할 색상 설정
+  gl.uniform4fv(colorLocation, [0.2, 1, 0.2, 1]); // 초록색
+
+  // 빛의 방향 설정
+  gl.uniform3fv(reverseLightDirectionLocation, m4.normalize([0.5, 0.7, 1]));
```

앞서 살펴본 `normalize`는 우리가 넣은 값을 단위 벡터로 만듭니다.
`x = 0.5`, +`x`는 오른쪽에 있는 빛이 왼쪽을 가리키는 걸 의미합니다.
`y = 0.7`, +`y`는 위쪽에 있는 빛이 아래쪽을 가리키는 걸 의미합니다.
`z = 1`, +`z`는 앞쪽에 있는 빛이 scene 쪽을 가리키는 걸 의미합니다.
상대 값은 방향이 대부분 scene을 가리키고 아래쪽보단 오른쪽을 가리키는 걸 의미합니다.

그리고 다음은 결과입니다.

{{{example url="../webgl-3d-lighting-directional.html" }}}

F를 회전시키셨다면 뭔가 눈치채셨을 겁니다.
F는 회전하지만 조명은 변하지 않는데요.
우리는 F가 회전함에 따라 빛의 방향을 향하는 부분이 가장 밝기를 원합니다.

이걸 고치기 위해 객체의 방향이 변경될 때 법선의 방향을 변경해야 합니다.
위치에 했던 것처럼 법선에 어떤 행렬을 곱할 수 있는데요.
가장 확실한 행렬은 `world` 행렬입니다.
현재는 `u_matrix`라 불리는 행렬 하나만 전달하고 있는데요.
2개의 행렬을 전달하도록 바꿔봅시다.
`u_world`로 명명한 것은 `world` 행렬이 됩니다.
`u_worldViewProjection`로 명명한 또 다른 것은 현재 `u_matrix`로 전달하고 있는 것입니다.

```
attribute vec4 a_position;
attribute vec3 a_normal;

*uniform mat4 u_worldViewProjection;
+uniform mat4 u_world;

varying vec3 v_normal;

void main() {
  // 위치를 행렬로 곱하기
*  gl_Position = u_worldViewProjection * a_position;

*  // 법선의 방향을 정하고 fragment shader로 전달
*  v_normal = mat3(u_world) * a_normal;
}
```

`a_normal`를 `mat3(u_world)`로 곱한다는 점을 주목하세요.
이는 법선은 방향이므로 translation은 고려하지 않기 때문입니다.
행렬의 orientation 부분은 행렬의 상단 3x3 영역에만 있습니다.

이제 위 uniform을 찾아야 합니다.

```
  // Uniform 탐색
*  var worldViewProjectionLocation =
*      gl.getUniformLocation(program, "u_worldViewProjection");
+  var worldLocation = gl.getUniformLocation(program, "u_world");
```

그리고 uniform을 업데이트하는 코드를 수정해야 합니다.

```
*// 행렬 설정
*gl.uniformMatrix4fv(
*  worldViewProjectionLocation, false, worldViewProjectionMatrix);
*gl.uniformMatrix4fv(worldLocation, false, worldMatrix);
```

그리고 여기 결과입니다.

{{{example url="../webgl-3d-lighting-directional-world.html" }}}

F를 회전시켜서 어느 쪽이 빛의 방향을 향하는지 확인해보세요.

어떻게 직접 보여줄지 모르겠는 문제가 한 가지 있어 다이어그램으로 보여드리겠습니다.
우리는 `normal`을 법선의 방향을 변경하는 `u_world` 행렬로 곱하고 있는데요.
`world` 행렬을 scale하면 무슨 일이 일어날까요?
잘못된 법선을 얻게 됩니다.

{{{diagram url="resources/normals-scaled.html" caption="법선을 전환하려면 클릭" width="600" }}}

`world` 행렬의 역을 구하고, 열을 행으로 바꾸는 전치를 해서, 이를 대신 사용하면 올바른 답을 구할 수 있습니다.

위 다이어그램에서 <span style="color: #F0F;">보라색</span> 구는 크기가 바뀌지 않습니다.
왼쪽의 <span style="color: #F00;">빨간색</span> 구는 크기가 바뀌고 법선은 `world` 행렬로 곱해집니다.
뭔가 잘못되었음을 알 수 있습니다.
오른쪽의 <span style="color: #00F;">파란색</span> 구는 `world` 역전치행렬을 사용하고 있습니다.

다이어그램을 클릭하여 다른 표현들을 둘러보세요.
Scale이 극단적일 때 왼쪽의 법선(world)이 구의 표면에 수직으로 유지되지 **않는** 반면에 오른쪽에 있는 것(worldInverseTranspose)은 구에 대해 수직이 유지되는 걸 쉽게 확인할 수 있습니다.
마지막 모드는 모두 빨간색으로 음영 처리되는데요.
어떤 행렬을 사용했는지에 따라 바깥쪽 구 2개의 조명이 매우 다르다는 것을 알 수 있습니다.
애매한 문제이기 때문에 어느 것이 맞다고 말하기는 힘들지만, 다른 시각화로 비교해봤을 때 worldInverseTranspose를 사용하는 것이 맞다는 건 분명합니다.

예제에서 이를 구현하기 위해 이렇게 코드를 수정해봅시다.
먼저 셰이더를 업데이트할 겁니다.
기술적으로는 `u_world`의 값만 업데이트할 수 있지만 혼란스러울 수 있기 때문에 실제 이름으로 바꿔주는 게 가장 좋습니다.

```
attribute vec4 a_position;
attribute vec3 a_normal;

uniform mat4 u_worldViewProjection;
*uniform mat4 u_worldInverseTranspose;

varying vec3 v_normal;

void main() {
  // 위치를 행렬로 곱하기
  gl_Position = u_worldViewProjection * a_position;

  // 법선의 방향을 정하고 fragment shader로 전달
*  v_normal = mat3(u_worldInverseTranspose) * a_normal;
}
```

그런 다음 uniform을 찾아야 합니다.

```
-  var worldLocation = gl.getUniformLocation(program, "u_world");
+  var worldInverseTransposeLocation =
+      gl.getUniformLocation(program, "u_worldInverseTranspose");
```

그리고 그걸 계산하고 설정해야 합니다.

```
var worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
var worldInverseMatrix = m4.inverse(worldMatrix);
var worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

// 행렬 설정
gl.uniformMatrix4fv(
  worldViewProjectionLocation, false, worldViewProjectionMatrix);
-gl.uniformMatrix4fv(
  worldLocation, false, worldMatrix);
+gl.uniformMatrix4fv(
+  worldInverseTransposeLocation, false, worldInverseTransposeMatrix);
```

그리고 다음은 행렬을 전치하는 코드입니다.

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

효과가 애매하고 어떤 것도 크기가 변경되고 있지 않기 때문에 눈에 띄는 차이는 없지만 적어도 지금은 준비가 되어 있습니다.

{{{example url="../webgl-3d-lighting-directional-worldinversetranspose.html" }}}

조명에 대한 첫 걸음이 명쾌했기를 바랍니다.
다음은 [점 조명](webgl-3d-lighting-point.html)입니다.

<div class="webgl_bottombar">
<h3>mat3(u_worldInverseTranspose) * a_normal 대안</h3>
<p>위 셰이더에는 이런 줄이 있습니다.</p>
<pre class="prettyprint">
v_normal = mat3(u_worldInverseTranspose) * a_normal;
</pre>
<p>우리는 이걸 할 수 있었는데요.</p>
<pre class="prettyprint">
v_normal = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;
</pre>
<p>
곱하기 전에 <code>w</code>를 0으로 설정했기 때문에, 사실상 0을 제거하여 행렬에서 translation을 곱하게 됩니다.
저는 그게 더 일반적인 방법이라고 생각합니다.
mat3 방식이 더 깔끔해 보였지만 종종 이런 방식으로 해왔습니다.
</p>
<p>
또 다른 해결책은 <code>u_worldInverseTranspose</code>를 <code>mat3</code>로 만드는 겁니다.
이렇게 하지 않은 2가지 이유가 있는데요.
하나는 <code>u_worldInverseTranspose</code> 전체에 대한 다른 요구 사항이 있을 수 있으므로 <code>mat4</code> 전체를 전달하면 다른 요구 사항에 대해 사용할 수 있습니다.
또 다른 이유로 JavaScript의 모든 행렬 함수는 4x4 행렬을 만듭니다.
3x3 행렬에 대해 완전히 다른 세트를 만들거나 4x4에서 3x3으로 변환하는 것은 더 설득력 있는 이유를 제외하면 안 하는 게 나은 작업입니다.
</p>
</div>


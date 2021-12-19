Title: WebGL 안개
Description: 안개를 구현하는 방법
TOC: 안개


이 글은 WebGL 관련 시리즈의 일부입니다.
첫 글은 [기초](webgl-fundamentals.html)로 시작했습니다.

WebGL에서 안개는 동작 방식을 생각하면 *가짜*처럼 보이기 때문에 굉장히 흥미롭습니다.
기본적으로 하는 일은 셰이더의 카메라 계산에 깊이나 거리를 사용하여 색상을 더 혹은 덜 안개색으로 만드는 겁니다.

다시 말해 이런 형태의 기본 방정식으로 시작합니다.

```glsl
gl_FragColor = mix(originalColor, fogColor, fogAmount);
```

여기서 `fogAmount`는 0에서 1사이의 값입니다.
`mix` 함수는 처음 두 값을 혼합하는데요.
`fogAmount`가 0일 때 `mix`는 `originalColor`를 반환합니다.
`fogAmount`가 1일 때 `mix`는 `fogColor`를 반환합니다.
0과 1사이에서 두 색상의 비율을 얻게 됩니다.
다음과 같이 직접 `mix`를 구현할 수도 있습니다.

```glsl
gl_FragColor = originalColor + (fogColor - originalColor) * fogAmount;
```

이를 수행하는 셰이더를 만들어봅시다.
[텍스처에 대한 글](webgl-3d-textures.html)의 텍스처가 적용된 큐브를 사용할 겁니다.

프래그먼트 셰이더에 믹싱을 추가해보겠습니다.

```glsl
precision mediump float;

// 정점 셰이더에서 전달됩니다.
varying vec2 v_texcoord;

// 텍스처
uniform sampler2D u_texture;

+uniform vec4 u_fogColor;
+uniform float u_fogAmount;

void main() {
+  vec4 color = texture2D(u_texture, v_texcoord);
+  gl_FragColor = mix(color, u_fogColor, u_fogAmount);  
}
```

그런 다음 초기화할 때 새로운 유니폼 위치를 찾아야 합니다.

```js
var fogColorLocation = gl.getUniformLocation(program, "u_fogColor");
var fogAmountLocation = gl.getUniformLocation(program, "u_fogAmount");
```

그리고 렌더링할 때 그것들을 설정합니다.

```js
var fogColor = [0.8, 0.9, 1, 1];
var settings = {
  fogAmount: .5,
};

...

function drawScene(time) {
  ...

  // 캔버스와 깊이 버퍼를 안개색으로 지우기
  gl.clearColor(...fogColor);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  ...

  // 안개의 색상과 양 설정
  gl.uniform4fv(fogColorLocation, fogColor);
  gl.uniform1f(fogAmountLocation, settings.fogAmount);

  ...
}
```

슬라이더를 드래그하면 텍스처와 안개색 사이에서 변경할 수 있습니다.

{{{example url="../webgl-3d-fog-just-mix.html" }}}

이제 안개 양을 전달하는 대신에 카메라의 깊이 등을 기반으로 계산해야 합니다.

[카메라에 대한 글](webgl-3d-camera.html)을 떠올려보면 뷰 행렬을 적용한 후에 모든 위치는 카메라에 상대적입니다.
카메라가 -z 축을 내려다보고 있으므로, 월드 행렬과 뷰 행렬로 곱한 후 z 위치를 보면, 카메라의 z 평면에서 얼마나 떨어져 있는 나타내는 값을 얻게 됩니다.

해당 데이터를 프래그먼트 셰이더로 전달하여 안개 양 계산에 사용할 수 있도록 정점 셰이더를 수정해봅시다.
이를 위해 `u_matrix`를 두 부분으로 나누려고 하는데요.
바로 투영 행렬과 월드 뷰 행렬입니다.

```glsl
attribute vec4 a_position;
attribute vec2 a_texcoord;

-uniform mat4 u_matrix;
+uniform mat4 u_worldView;
+uniform mat4 u_projection;

varying vec2 v_texcoord;
+varying float v_fogDepth;

void main() {
  // 위치에 행렬 곱하기
-  gl_Position = u_matrix * a_position;
+  gl_Position = u_projection * u_worldView * a_position;

  // 텍스처 좌표를 프래그먼트 셰이더로 전달
  v_texcoord = a_texcoord;

+  // 카메라를 기준으로 -z 위치만 전달합니다.
+  // 카메라는 -z 방향을 보고 있으므로, 일반적으로 카메라 앞의 물체는 -z 위치를 가지지만, 부정 연산으로 양수인 깊이를 얻습니다.
+  v_fogDepth = -(u_worldView * a_position).z;
}
```

이제 프래그먼트 세이더에서 어떤 값보다 깊이가 작으면 안개를 혼합하지 않도록 합니다. (fogAmount = 0)
어떤 값보다 깊이가 크면 안개를 100% 적용합니다. (fogAmount = 1)
이 두 값 사이에서 색상을 혼합하는데요.

그렇게 작동하는 코드를 작성할 수도 있지만 GLSL는 이를 수행하는 `smoothstep` 함수를 가지고 있습니다.
여러분은 최소값, 최대값, 테스트 값을 전달하면 됩니다.
테스트 값이 최소값보다 작거나 같으면 0을 반환합니다.
테스트 값이 최대값보다 크거나 같으면 1을 반환합니다.
테스트 값이 이 두 값 사이에 있으면 최소값과 최대값 사이 테스트 값의 위치와 비례하는 0과 1사이의 값을 반환합니다.

안개 양을 계산하기 위해 이를 프래그먼트 셰이더에서 사용하는 것은 굉장히 쉽습니다.

```glsl
precision mediump float;

// 정점 셰이더에서 전달됩니다.
varying vec2 v_texcoord;
varying float v_fogDepth;

// 텍스처
uniform sampler2D u_texture;
uniform vec4 u_fogColor;
-uniform float u_fogAmount;
+uniform float u_fogNear;
+uniform float u_fogFar;

void main() {
  vec4 color = texture2D(u_texture, v_texcoord);

+  float fogAmount = smoothstep(u_fogNear, u_fogFar, v_fogDepth);

-  gl_FragColor = mix(color, u_fogColor, u_fogAmount);  
+ gl_FragColor = mix(color, u_fogColor, fogAmount);  
}
```

당연히 초기화할 때 모든 유니폼을 찾아야 합니다.

```js
// 유니폼 탐색
+var projectionLocation = gl.getUniformLocation(program, "u_projection");
+var worldViewLocation = gl.getUniformLocation(program, "u_worldView");
var textureLocation = gl.getUniformLocation(program, "u_texture");
var fogColorLocation = gl.getUniformLocation(program, "u_fogColor");
+var fogNearLocation = gl.getUniformLocation(program, "u_fogNear");
+var fogFarLocation = gl.getUniformLocation(program, "u_fogFar");
```

그리고 렌더링할 때 그것들을 설정합니다.

```js
var fogColor = [0.8, 0.9, 1, 1];
var settings = {
-  fogAmount: .5,
+  fogNear: 1.1,
+  fogFar: 2.0,
};

// 장면 그리기
function drawScene(time) {
  ...

  // 투영 행렬 계산
  var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  var projectionMatrix =
      m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

  var cameraPosition = [0, 0, 2];
  var up = [0, 1, 0];
  var target = [0, 0, 0];

  // lookAt을 사용하여 카메라 행렬 계산
  var cameraMatrix = m4.lookAt(cameraPosition, target, up);

  // 카메라 행렬로 뷰 행렬 만들기
  var viewMatrix = m4.inverse(cameraMatrix);

-  var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);
-
-  var matrix = m4.xRotate(viewProjectionMatrix, modelXRotationRadians);
-  matrix = m4.yRotate(matrix, modelYRotationRadians);

+  var worldViewMatrix = m4.xRotate(viewMatrix, modelXRotationRadians);
+  worldViewMatrix = m4.yRotate(worldViewMatrix, modelYRotationRadians);

  // 행렬 설정
-  gl.uniformMatrix4fv(matrixLocation, false, matrix);
+  gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);
+  gl.uniformMatrix4fv(worldViewLocation, false, worldViewMatrix);

  // u_texture에 텍스처 유닛 0을 사용하도록 셰이더에 지시
  gl.uniform1i(textureLocation, 0);

  // 안개색, 근거리, 원거리 설정
  gl.uniform4fv(fogColorLocation, fogColor);
+  gl.uniform1f(fogNearLocation, settings.fogNear);
+  gl.uniform1f(fogFarLocation, settings.fogFar);
-  gl.uniform1f(fogAmountLocation, settings.fogAmount);
```

안개를 더 쉽게 확인할 수 있도록 거리별로 40개의 큐브를 그려보겠습니다.

```js
var settings = {
  fogNear: 1.1,
  fogFar: 2.0,
+  xOff: 1.1,
+  zOff: 1.4,
};

...

const numCubes = 40;
for (let i = 0; i <= numCubes; ++i) {
  var worldViewMatrix = m4.translate(viewMatrix, -2 + i * settings.xOff, 0, -i * settings.zOff);
  worldViewMatrix = m4.xRotate(worldViewMatrix, modelXRotationRadians + i * 0.1);
  worldViewMatrix = m4.yRotate(worldViewMatrix, modelYRotationRadians + i * 0.1);

  gl.uniformMatrix4fv(worldViewLocation, false, worldViewMatrix);

  // 지오메트리 그리기
  gl.drawArrays(gl.TRIANGLES, 0, 6 * 6);
}
```

이제 깊이 기반의 안개가 생깁니다.

{{{example url="../webgl-3d-fog-depth-based.html" }}}

참고: `fogNear`가 `fogFar`보다 작거나 같으면 안 되지만 이를 확인하는 코드를 추가하지 않았기 때문에 둘 다 적절히 설정해야 합니다.

위에서 언급했듯이 저는 이게 속임수처럼 느껴집니다.
안개색이 배경색과 일치해야만 작동하기 때문인데요.
배경색을 바꾸면 환상은 사라집니다.

```js
-gl.clearColor(...fogColor);
+gl.clearColor(1, 0, 0, 1);  // 빨간색
```

<div class="webgl_center"><img src="resources/fog-background-color-mismatch.png"></div>

그러니 안개색과 일치하도록 배경색을 설정해야 한다는 것을 기억해주시면 좋겠습니다.

깊이를 사용하면 잘 동작하고 저렴한 방법이지만 문제가 있습니다.
카메라 주변에 객체의 원이 있다고 가정해봅시다.
카메라의 z 평면에서의 거리를 기반으로 얀개 양을 계산할 겁니다.
즉 카메라를 돌릴 때 뷰 공간 Z값이 0에 가까워지는 것에 따라 안개 속으로 들어가고 나가는 것처럼 보입니다.

<div class="webgl_center"><img src="resources/fog-depth.svg" style="width: 600px;"></div>

이 예제에서 문제점을 볼 수 있습니다.

{{{example url="../webgl-3d-fog-depth-based-issue.html" }}}

위를 보면 카메라 바로 주위에 8개의 큐브가 원을 형성하고 있습니다.
카메라가 제자리에서 회전하고 있는데요.
즉 큐브는 항상 카메라와 같은 거리에 있지만 Z평면과는 다른 거리이기 때문에 안개량 계산 결과 가장자리 근처의 큐브가 안개 밖으로 나오게 됩니다.

대신에 모든 큐브에 대해 동일한 카메라와의 거리를 계산하여 고칠 수 있습니다.

<div class="webgl_center"><img src="resources/fog-distance.svg" style="width: 600px;"></div>

이를 위해 뷰 공간의 정점 위치를 정점 셰이더에서 프래그먼트 셰이더로 전달해야 합니다.

```glsl
attribute vec4 a_position;
attribute vec2 a_texcoord;

uniform mat4 u_worldView;
uniform mat4 u_projection;

varying vec2 v_texcoord;
-varying float v_fogDepth;
+varying vec3 v_position;

void main() {
  // 위치에 행렬 곱하기
  gl_Position = u_projection * u_worldView * a_position;

  // 텍스처 좌표를 프래그먼트 셰이더로 전달
  v_texcoord = a_texcoord;

-  // 카메라를 기준으로 -z 위치만 전달합니다.
-  // 카메라는 -z 방향을 보고 있으므로, 일반적으로 카메라 앞의 물체는 -z 위치를 가지지만, 부정 연산으로 양수인 깊이를 얻습니다.
-  v_fogDepth = -(u_worldView * a_position).z;
+  // 뷰 위치를 프래그먼트 셰이더로 전달
+  v_position = (u_worldView * a_position).xyz;
}
```

그런 다음 프래그먼트 셰이더에서 위치를 사용하여 거리를 계산할 수 있습니다.

```
precision mediump float;

// 정점 셰이더에서 전달됩니다.
varying vec2 v_texcoord;
-varying float v_fogDepth;
+varying vec3 v_position;

// 텍스처
uniform sampler2D u_texture;
uniform vec4 u_fogColor;
uniform float u_fogNear;
uniform float u_fogFar;

void main() {
  vec4 color = texture2D(u_texture, v_texcoord);

-  float fogAmount = smoothstep(u_fogNear, u_fogFar, v_fogDepth);
+  float fogDistance = length(v_position);
+  float fogAmount = smoothstep(u_fogNear, u_fogFar, fogDistance);

  gl_FragColor = mix(color, u_fogColor, fogAmount);  
}
```

이제 카메라가 회전할 때 더 이상 큐브가 안개에서 나오지 않습니다.

{{{example url="../webgl-3d-fog-distance-based.html" }}}

지금까지 모든 안개는 선형 계산을 사용했습니다.
다시 말해 안개색은 근거리와 원거리 사이에 선형적으로 적용됩니다.
현실 세계에서 보여지는 것처럼 안개는 기하급수적으로 작용하는데요.
뷰어로부터의 거리의 제곱에 따라 더 짙어집니다.
다음은 기하급수적인 안개에 대한 일반적인 방정식입니다.

```glsl
#define LOG2 1.442695

fogAmount = 1. - exp2(-fogDensity * fogDensity * fogDistance * fogDistance * LOG2));
fogAmount = clamp(fogAmount, 0., 1.);
```

이걸 사용하려면 이런 식으로 프래그먼트 셰이더를 바꿔야 합니다.

```
precision mediump float;

// 정점 셰이더에서 전달됩니다.
varying vec2 v_texcoord;
varying vec3 v_position;

// 텍스처
uniform sampler2D u_texture;
uniform vec4 u_fogColor;
-uniform float u_fogNear;
-uniform float u_fogFar;
+uniform float u_fogDensity;

void main() {
  vec4 color = texture2D(u_texture, v_texcoord);

  #define LOG2 1.442695

  float fogDistance = length(v_position);
-  float fogAmount = smoothstep(u_fogNear, u_fogFar, fogDistance);
+  float fogAmount = 1. - exp2(-u_fogDensity * u_fogDensity * fogDistance * fogDistance * LOG2);
  fogAmount = clamp(fogAmount, 0., 1.);

  gl_FragColor = mix(color, u_fogColor, fogAmount);  
}
```

그리고 거리 *exp2* 밀도 기반의 안개를 얻게 됩니다.

{{{example url="../webgl-3d-fog-distance-exp2.html" }}}

밀도 기반의 안개에 대해 한 가지 주의해야 할 점은 근거리와 원거리 설정이 없다는 겁니다.
이게 더 현실적일 수 있지만 심미적 요구 사항에는 안 맞을 수도 있습니다.
어느 걸 선호하는 것은 디자인적인 결정입니다.

안개를 계산하는 다른 많은 방법이 있습니다.
저사양 GPU에서는 `gl_FragCoord.z`를 사용할 수 있습니다.
`gl_FragCoord`는 WebGL이 설정하는 전역 변수입니다.
`x` 그리고 `y` 컴포넌트는 그려지는 픽셀의 좌표입니다.
`z` 좌표는 0에서 1사이 해당 픽셀의 깊이입니다.
바로 거리로 변환할 수는 없지만 근거리와 원거리에 대한 0에서 1사이의 값을 선택해서 안개처럼 보이도록 할 수 있습니다.
정점 셰이더에서 아무것도 프래그먼트 셰이더로 전달하지 않아도 되며 거리 계산이 필요하지 않으므로 이건 저전력 GPU에서 저렴한 안개 효과를 만드는 한 가지 방법입니다.

{{{example url="../webgl-3d-fog-depth-based-gl_FragCoord.html" }}}


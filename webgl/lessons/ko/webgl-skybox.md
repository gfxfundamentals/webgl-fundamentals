Title: WebGL SkyBox
Description: Skybox로 하늘 보여주기!
TOC: Skybox


이 글은 WebGL 관련 시리즈의 일부입니다.
첫 글은 [기초](webgl-fundamentals.html)로 시작했는데요.
이 글은 [environment map에 관한 글](webgl-environment-maps.html)에서 이어집니다.

*Skybox*는 모든 방향에서 하늘처럼 보이거나 수평선을 포함하여 아주 멀리 있는 것처럼 보이게 하는 텍스처로 구성된 박스입니다.
방에 일어나 있고 각각의 벽에 포스터가 있다고 상상해보면, 하늘을 보여주는 포스터로 천장을 덮을 수 있고, 땅을 보여주는 포스터를 바닥에 추가할 수 있는데, 이게 skybox입니다.

많은 3D 게임들이 큰 큐브를 만들고 하늘에 텍스처를 입히는 방식으로 이를 수행합니다.

이 방식은 잘 동작하지만 몇 가지 문제가 있습니다.
한 가지는 카메라가 향하고 있는 방향이 어디든 여러 방향에서 봐야하는 큐브가 있다는 겁니다.
여러분은 모든 게 멀리 그려지길 바라겠지만 큐브의 모서리가 clipping plane 바깥으로 나가길 원하진 않을 텐데요.
해당 문제를 복잡하게 하는 것은 성능 상의 이유로, GPU가 [depth buffer test](webgl-3d-orthographic.html)를 사용하여 테스트가 실패할 픽셀의 그리기를 건너뛸 수 있기 때문에, 멀리 있는 것보다 가까이 있는 것을 먼저 그리려는 겁니다.
따라서 이상적으로는 depth buffer test를 키고 마지막에 skybox를 그려야 겠지만, 실제로 박스를 쓰는 경우 카메라가 다른 방향에서 보기 때문에, 박스의 모서리가 측면보다 멀리 떨어져 문제가 발생합니다.

<div class="webgl_center"><img src="resources/skybox-issues.svg" style="width: 500px"></div>

위에서 볼 수 있듯이 큐브의 가장 먼 지점이 절두체 내부에 있는지 확인해야 하지만, 그것 때문에 큐브의 일부 모서리가 덮고 싶지 않은 객체를 덮을 수 있습니다.

일반적인 해결책은 depth test를 끄고 skybox를 먼저 그리는 거지만, 장면에서 나중에 다룰 픽셀을 그리지 않는 depth buffer test는 이점이 없습니다.

큐브를 사용하는 대신에 캔버스 전체를 덮고 [cubemap](webgl-cube-maps.html)을 사용하는 사각형을 그려봅시다.
일반적으로 3D 공간에서 사각형을 투영하기 위해 view projection matrix를 사용하는데요.
이 경우에는 정반대로 하려고 합니다.
View projection matrix의 역행렬을 사용하여, 카메라가 사각형의 각 픽셀을 바라보는 방향을 가져오려고 하는데요.
이는 cubemap을 바라보는 방향을 알려줄 겁니다.

[Environment Map 예제](webgl-environment-maps.html)를 가져와 여기서 사용하지 않을 법선 관련 코드를 모두 제거했습니다.
그런 다음 사각형이 필요합니다.

```js
// 사각형을 정의하는 값으로 버퍼 채우기
function setGeometry(gl) {
  var positions = new Float32Array(
    [
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}
```

이 사각형은 이미 clip space에 있으므로 캔버스를 채울 겁니다.
정점마다 2개의 값만 있기 때문에 attribute를 설정하는 코드를 수정해야 합니다.

```js
// positionBuffer(ARRAY_BUFFER)에서 데이터 가져오는 방법을 attribute에 지시
-var size = 3;          // 반복마다 3개의 컴포넌트
+var size = 2;          // 반복마다 2개의 컴포넌트
var type = gl.FLOAT;   // 데이터는 32bit float
var normalize = false; // 데이터 정규화 안 함
var stride = 0;        // 0 = 다음 위치를 가져오기 위해 반복마다 size * sizeof(type) 만큼 앞으로 이동
var offset = 0;        // 버퍼의 처음부터 시작
gl.vertexAttribPointer(positionLocation, size, type, normalize, stride, offset)
```

다음으로 vertex shader의 경우 `gl_Position`을 사각형의 정점으로 설정합니다.
위치가 clip space에 있고, 캔버스 전체를 덮도록 설정되어 있으므로, 어떤 행렬 계산도 필요하지 않습니다.
픽셀이 가장 깊은 depth를 가지도록 `gl_Position.z`를 1로 설정합니다.
그리고 position을 fragment shader로 전달하는데요.

```glsl
attribute vec4 a_position;
varying vec4 v_position;
void main() {
  v_position = a_position;
  gl_Position = a_position;
  gl_Position.z = 1;
}
```

Fragment shader에서 position을 view projection matrix의 역행렬로 곱하고, 4D 공간에서 3D 공간으로 만들기 위해 w로 나눕니다.

```glsl
precision mediump float;

uniform samplerCube u_skybox;
uniform mat4 u_viewDirectionProjectionInverse;

varying vec4 v_position;
void main() {
  vec4 t = u_viewDirectionProjectionInverse * v_position;
  gl_FragColor = textureCube(u_skybox, normalize(t.xyz / t.w));
}
```

마지막으로 uniform location을 찾아야 합니다.

```js
var skyboxLocation = gl.getUniformLocation(program, "u_skybox");
var viewDirectionProjectionInverseLocation =
    gl.getUniformLocation(program, "u_viewDirectionProjectionInverse");
```

그리고 이것들을 설정합니다.

```js
// projection matrix 계산
var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

// 원점에서 2unit인 원을 그리며 원점을 바라보는 카메라
var cameraPosition = [Math.cos(time * .1), 0, Math.sin(time * .1)];
var target = [0, 0, 0];
var up = [0, 1, 0];
// lookAt을 사용하여 카메라 행렬 계산
var cameraMatrix = m4.lookAt(cameraPosition, target, up);

// camera matrix로 view matrix 만들기
var viewMatrix = m4.inverse(cameraMatrix);

// direction만 다루므로 translation 제거
viewMatrix[12] = 0;
viewMatrix[13] = 0;
viewMatrix[14] = 0;

var viewDirectionProjectionMatrix =
    m4.multiply(projectionMatrix, viewMatrix);
var viewDirectionProjectionInverseMatrix =
    m4.inverse(viewDirectionProjectionMatrix);

// uniform 설정
gl.uniformMatrix4fv(
  viewDirectionProjectionInverseLocation,
  false,
  viewDirectionProjectionInverseMatrix
);

// u_skybox에 대해 texture unit 0을 사용하도록 셰이더에 지시
gl.uniform1i(skyboxLocation, 0);
```

위에서 `cameraPosition`을 계산하는 원점을 중심으로 카메라를 회전하고 있습니다.
그런 다음 `cameraMatrix`를 `viewMatrix`로 변환한 후에는 카메라가 있는 위치가 아니라 카메라가 바라보는 방향만 다루므로 translation을 0으로 만듭니다.

거기에 projection matrix를 곱하고, 역행렬로 만든 다음, 행렬을 설정합니다.

{{{example url="../webgl-skybox.html" }}}

이 샘플에 environment map cube를 결합해봅시다.
[Less code more fun](webgl-less-code-more-fun.html)에서 언급한 유틸을 사용할 겁니다.

두 셰이더 세트를 모두 넣어야 합니다.

```html
<script id="skybox-vertex-shader" type="x-shader/x-vertex">
...
<script id="skybox-fragment-shader" type="x-shader/x-fragment">
...
<script id="envmap-vertex-shader" type="x-shader/x-vertex">
...
<script id="envmap-fragment-shader" type="x-shader/x-fragment">
...
```

그런 다음 셰이더를 컴파일하고 모든 attribute과 uniform location을 찾습니다.

```js
// GLSL program을 설정하고 location 탐색
const envmapProgramInfo = webglUtils.createProgramInfo(
    gl, ["envmap-vertex-shader", "envmap-fragment-shader"]);
const skyboxProgramInfo = webglUtils.createProgramInfo(
    gl, ["skybox-vertex-shader", "skybox-fragment-shader"]);
```

정점 데이터로 버퍼를 설정합니다.
`primitives` 라이브러리에는 이미 이런 데이터를 제공하는 함수가 있으므로 이를 사용할 수 있습니다.

```js
// 버퍼를 생성하고 정점 데이터로 채우기
const cubeBufferInfo = primitives.createCubeBufferInfo(gl, 1);
const quadBufferInfo = primitives.createXYQuadBufferInfo(gl);
```

렌더링할 때 모든 행렬을 계산합니다.

```js
// 원점에서 2unit인 원을 그리며 원점을 바라보는 카메라
var cameraPosition = [Math.cos(time * .1) * 2, 0, Math.sin(time * .1) * 2];
var target = [0, 0, 0];
var up = [0, 1, 0];
// lookAt을 사용하여 카메라 행렬 계산
var cameraMatrix = m4.lookAt(cameraPosition, target, up);

// camera matrix로 view matrix 만들기
var viewMatrix = m4.inverse(cameraMatrix);

// x축을 중심으로 큐브 회전
var worldMatrix = m4.xRotation(time * 0.11);

// direction만 다루므로 translation 제거
var viewDirectionMatrix = m4.copy(viewMatrix);
viewDirectionMatrix[12] = 0;
viewDirectionMatrix[13] = 0;
viewDirectionMatrix[14] = 0;

var viewDirectionProjectionMatrix = m4.multiply(
    projectionMatrix, viewDirectionMatrix);
var viewDirectionProjectionInverseMatrix =
    m4.inverse(viewDirectionProjectionMatrix);
```

그런 다음 큐브를 먼저 그립니다.

```js
// 큐브 그리기
gl.depthFunc(gl.LESS);  // default depth test 사용
gl.useProgram(envmapProgramInfo.program);
webglUtils.setBuffersAndAttributes(gl, envmapProgramInfo, cubeBufferInfo);
webglUtils.setUniforms(envmapProgramInfo, {
  u_world: worldMatrix,
  u_view: viewMatrix,
  u_projection: projectionMatrix,
  u_texture: texture,
  u_worldCameraPosition: cameraPosition,
});
webglUtils.drawBufferInfo(gl, cubeBufferInfo);
```

이어서 skybox를 그립니다.

```js
// skybox 그리기

// 사각형이 1.0에서 depth test를 통과하도록 만들기
gl.depthFunc(gl.LEQUAL);

gl.useProgram(skyboxProgramInfo.program);
webglUtils.setBuffersAndAttributes(gl, skyboxProgramInfo, quadBufferInfo);
webglUtils.setUniforms(skyboxProgramInfo, {
  u_viewDirectionProjectionInverse: viewDirectionProjectionInverseMatrix,
  u_skybox: texture,
});
webglUtils.drawBufferInfo(gl, quadBufferInfo);
```

그리고

{{{example url="../webgl-skybox-plus-environment-map.html" }}}

지난 3개의 글이 cubemap을 활용하는 방법을 알려줬길 바랍니다.
예를 들어 [계산된 조명](webgl-3d-lighting-spot.html)에서 코드를 가져와, environment map의 결과와 결합하여, 자동차 후드나 광택이 있는 바닥을 만드는 게 일반적입니다.
Cubemap을 사용하여 조명을 계산하는 기술도 있습니다.
Environment map에서 얻은 값을 색상으로 사용하는 대신 조명 방정식에 입력하여 사용한다는 점을 제외하면 environment map과 동일합니다.


Title: WebGL Environment Map (반사)
Description: Environment map을 구현하는 방법
TOC: Environment Map


이 글은 WebGL 관련 시리즈의 일부입니다.
첫 글은 [기초](webgl-fundamentals.html)로 시작했는데요.
이 글은 [cubemap에 관한 글](webgl-cube-maps.html)에서 이어집니다.
또한 [조명에 대한 글](webgl-3d-lighting-directional.html)에서 다룬 개념을 사용합니다.
아직 읽지 않으셨다면 해당 글을 먼저 읽어주세요.

*Environment map*은 그리는 객체의 환경을 나타내는데요.
야외 장면을 그리는 경우 야외를 표현합니다.
무대의 사람을 그린다면 장소를 표현하게 됩니다.
우주 장면을 그리면 별이 될 겁니다.
장소의 한 지점에서 환경을 보여주는 6개의 이미지가 있다면 cubemap으로 environment map을 구현할 수 있습니다.

다음은 캘리포니아 마운틴 뷰에 있는 컴퓨터 역사 박물관 로비의 environment map입니다.

<div class="webgl_center">
  <img src="../resources/images/computer-history-museum/pos-x.jpg" style="width: 128px" class="border">
  <img src="../resources/images/computer-history-museum/neg-x.jpg" style="width: 128px" class="border">
  <img src="../resources/images/computer-history-museum/pos-y.jpg" style="width: 128px" class="border">
</div>
<div class="webgl_center">
  <img src="../resources/images/computer-history-museum/neg-y.jpg" style="width: 128px" class="border">
  <img src="../resources/images/computer-history-museum/pos-z.jpg" style="width: 128px" class="border">
  <img src="../resources/images/computer-history-museum/neg-z.jpg" style="width: 128px" class="border">
</div>

[이전 글의 코드](webgl-cube-maps.html)를 기반으로 생성한 이미지 대신에 이미지 6개를 불러옵시다.

```js
// 텍스처 생성
var texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

const faceInfos = [
  {
    target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, 
    url: 'resources/images/computer-history-museum/pos-x.jpg',
  },
  {
    target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 
    url: 'resources/images/computer-history-museum/neg-x.jpg',
  },
  {
    target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 
    url: 'resources/images/computer-history-museum/pos-y.jpg',
  },
  {
    target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 
    url: 'resources/images/computer-history-museum/neg-y.jpg',
  },
  {
    target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 
    url: 'resources/images/computer-history-museum/pos-z.jpg',
  },
  {
    target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 
    url: 'resources/images/computer-history-museum/neg-z.jpg',
  },
];
faceInfos.forEach((faceInfo) => {
  const {target, url} = faceInfo;

  // 캔버스를 cubemap 면에 업로드
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 512;
  const height = 512;
  const format = gl.RGBA;
  const type = gl.UNSIGNED_BYTE;
  
  // 즉시 렌더링될 수 있도록 각 면을 설정
  gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

  // 비동기적으로 이미지 로드
  const image = new Image();
  image.src = url;
  image.addEventListener('load', function() {
    // 이제 이미지를 불러왔고 이를 텍스처에 업로드
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    gl.texImage2D(target, level, internalFormat, format, type, image);
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  });
});
gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
```

모든 면에 대해 `texImage2D`에 `null`을 전달하여 512x512의 비어있는 이미지로 초기화합니다.
Cubemap은 6개의 면을 가져야 하며, 6개의 면은 모두 동일한 크기의 사각형이여야 합니다.
텍스처가 아니라면 렌더링되지 않을 겁니다.
하지만 우리는 이미지 6개를 로딩하고 있습니다.
즉시 렌더링을 시작하고 싶으므로 6개의 면을 모두 할당한 다음 이미지 로딩을 시작합니다.
각 이미지가 로드되면 알맞은 면으로 업로드한 다음 mipmap을 다시 생성합니다.
다시 말해 즉시 렌더링할 수 있고, 이미지가 다운로드되면 cubemap의 면이 한 번에 하나씩 이미지로 채워지며, 6개가 모두 로드되지 않아도 렌더링할 수 있습니다.

하지만 이미지를 로딩하는 것만으로는 부족합니다.
[조명](webgl-3d-lighting-point.html)처럼 약간의 수식이 필요합니다.

이 경우 눈/카메라에서 객체의 표면까지의 벡터가 주어지면, 그려지는 각 fragment가 해당 표면에서 반사되는 방향을 알고 싶습니다.
그러면 해당 방향을 사용하여 cubemap의 색상을 가져올 수 있습니다.

반사에 대한 공식은 다음과 같습니다.

    reflectionDir = eyeToSurfaceDir – 
        2 ∗ dot(surfaceNormal, eyeToSurfaceDir) ∗ surfaceNormal

[조명에 대한 글](webgl-3d-lighting-directional.html)을 떠올려보면 두 벡터의 스칼라곱은 두 벡터 사이 각도의 cosine을 반환합니다.
벡터를 추가하면 새로운 벡터가 생기므로 평평한 표면을 수직으로 보는 눈을 예제를 들어봅시다.

<div class="webgl_center"><img src="resources/reflect-180-01.svg" style="width: 400px"></div>

위의 공식을 시각화해봅시다.
먼저 정확히 반대 방향을 가리키는 두 벡터의 스칼라곱은 -1이므로 다음과 같이 시각적으로 나타낼 수 있습니다.

<div class="webgl_center"><img src="resources/reflect-180-02.svg" style="width: 400px"></div>

이 스칼라곱을 <span style="color:black; font-weight:bold;">eyeToSurfaceDir</span>과 반사 공식의 <span style="color:green;">법선</span>에 연결하면 이렇게 됩니다.

<div class="webgl_center"><img src="resources/reflect-180-03.svg" style="width: 400px"></div>

-2를 -1로 곱하면 +2가 됩니다.

<div class="webgl_center"><img src="resources/reflect-180-04.svg" style="width: 400px"></div>

따라서 벡터를 연결하여 더하면 <span style="color: red">반사된 벡터</span>가 됩니다.

<div class="webgl_center"><img src="resources/reflect-180-05.svg" style="width: 400px"></div>

위에서 하나는 눈에서 완전히 반대되고, 다른 하나는 반사가 눈 쪽을 곧장 향하는 2개의 벡터를 볼 수 있습니다.
원래 다이어그램으로 돌아가보면 예상한 것과 정확히 일치합니다.

<div class="webgl_center"><img src="resources/reflect-180-06.svg" style="width: 400px"></div>

표면을 오른쪽으로 45도 회전시켜 보겠습니다.

<div class="webgl_center"><img src="resources/reflect-45-01.svg" style="width: 400px"></div>

135도 떨어진 두 벡터의 스칼라곱은 -0.707입니다.

<div class="webgl_center"><img src="resources/reflect-45-02.svg" style="width: 400px"></div>

그리고 공식에 전부 연결합니다.

<div class="webgl_center"><img src="resources/reflect-45-03.svg" style="width: 400px"></div>

다시 두 음수를 곱하면 양수가 되지만 이제 <span style="color: green">벡터</span>는 30% 더 짧아집니다.

<div class="webgl_center"><img src="resources/reflect-45-04.svg" style="width: 400px"></div>

그리고 벡터를 더하면 <span style="color: red">반사된 벡터</span>가 됩니다.

<div class="webgl_center"><img src="resources/reflect-45-05.svg" style="width: 400px"></div>

원래 다이어그램에 다시 넣어보면 잘 맞는 것 같습니다.

<div class="webgl_center"><img src="resources/reflect-45-06.svg" style="width: 400px"></div>

<span style="color: red">반사된 방향</span>을 이용하여 cubemap을 보고 물체의 표면을 채색합니다.

다음은 surface의 rotation을 설정하고 방정식의 다양한 부분을 볼 수 있는 다이어그램입니다.
또한 반사 벡터가 cubemap의 다른 면을 가리켜서 표면 색상에 영향을 주는 것도 볼 수 있습니다.

{{{diagram url="resources/environment-mapping.html" width="400" height="400" }}}

이제 반사가 어떻게 작동하는지 알고, cubemap에서 값을 찾기 위해 사용할 수 있으므로, 셰이더를 변경해봅시다.

먼저 vertex shader에서 정점의 world position과 world oriented normal을 계산하고 이를 fragment shader에 varying으로 전달할 겁니다.
이는 [스포트라이트에 대한 글](webgl-3d-lighting-spot.html)에서 했던 것과 유사합니다.

```glsl
attribute vec4 a_position;
attribute vec3 a_normal;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

varying vec3 v_worldPosition;
varying vec3 v_worldNormal;

void main() {
  // 위치를 행렬로 곱하기
  gl_Position = u_projection * u_view * u_world * a_position;

  // View position을 fragment shader로 보내기
  v_worldPosition = (u_world * a_position).xyz;

  // 법선의 방향을 정하고 fragment shader로 전달
  v_worldNormal = mat3(u_world) * a_normal;
}
```

그런 다음 fragment shader에서 `worldNormal`이 정점 사이의 표면을 가로질러 보간되므로 정규화합니다.
카메라의 world position을 전달하고 표면의 world position에서 이를 빼면 `eyeToSurfaceDir`이 됩니다.

마지막으로 위에서 살펴본 공식을 구현하는 GLSL 내장 함수 `reflect`를 사용합니다.
그리고 결과를 이용하여 cubemap에서 색상을 가져옵니다.

```glsl
precision highp float;

// Vertex shader에서 전달
varying vec3 v_worldPosition;
varying vec3 v_worldNormal;

// 텍스처
uniform samplerCube u_texture;

// 카메라의 위치
uniform vec3 u_worldCameraPosition;

void main() {
  vec3 worldNormal = normalize(v_worldNormal);
  vec3 eyeToSurfaceDir = normalize(v_worldPosition - u_worldCameraPosition);
  vec3 direction = reflect(eyeToSurfaceDir,worldNormal);

  gl_FragColor = textureCube(u_texture, direction);
}
```

또한 이 예제를 위해 실제 법선이 필요한데요.
실제 법선으로 큐브의 면이 평평하게 보이도록 합니다.
이전 예제에서 cubemap의 작동을 보기 위해 큐브의 위치를 수정했지만, 이 경우에는 [조명에 대한 글](webgl-3d-lighting-directional.html)에서 다룬 것처럼 큐브에 대한 실제 법선이 필요합니다.

초기화할 때

```js
// 법선을 넣을 버퍼 생성
var normalBuffer = gl.createBuffer();
// ARRAY_BUFFER에 바인딩 (ARRAY_BUFFER = normalBuffer)
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
// 법선 데이터를 버퍼에 넣기
setNormals(gl);
```

렌더링할 때

```js
// 법선 버퍼 바인딩
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

// Tell the attribute how to get data out of normalBuffer (ARRAY_BUFFER)
var size = 3;          // 반복마다 3개의 컴포넌트
var type = gl.FLOAT;   // 데이터는 32bit 부동 소수점 값
var normalize = false; // 데이터 정규화 (0-255에서 0-1로 전환)
var stride = 0;        // 0 = 다음 위치를 가져오기 위해 반복마다 size * sizeof(type) 만큼 앞으로 이동
var offset = 0;        // 버퍼의 처음부터 시작
gl.vertexAttribPointer(normalLocation, size, type, normalize, stride, offset);
```

물론 초기화할 때 uniform location을 찾아야 합니다.

```js
var projectionLocation = gl.getUniformLocation(program, "u_projection");
var viewLocation = gl.getUniformLocation(program, "u_view");
var worldLocation = gl.getUniformLocation(program, "u_world");
var textureLocation = gl.getUniformLocation(program, "u_texture");
var worldCameraPositionLocation = gl.getUniformLocation(program, "u_worldCameraPosition");
```

그리고 렌더링할 때 이들을 설정합니다.

```js
// projection matrix 계산
var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);
gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);

var cameraPosition = [0, 0, 2];
var target = [0, 0, 0];
var up = [0, 1, 0];
// lookAt을 사용하여 카메라 행렬 계산
var cameraMatrix = m4.lookAt(cameraPosition, target, up);

// camera matrix로 view matrix 만들기
var viewMatrix = m4.inverse(cameraMatrix);

var worldMatrix = m4.xRotation(modelXRotationRadians);
worldMatrix = m4.yRotate(worldMatrix, modelYRotationRadians);

// Uniform 설정
gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);
gl.uniformMatrix4fv(viewLocation, false, viewMatrix);
gl.uniformMatrix4fv(worldLocation, false, worldMatrix);
gl.uniform3fv(worldCameraPositionLocation, cameraPosition);

// u_texture에 texture unit 0을 사용하도록 셰이더에 지시
gl.uniform1i(textureLocation, 0);
```

{{{example url="../webgl-environment-map.html" }}}

다음은 [skybox에 cubemap을 사용하는 방법](webgl-skybox.html)을 보여드리겠습니다.


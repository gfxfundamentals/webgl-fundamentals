Title: WebGL 평면 및 원근 투영 매핑
Description: 텍스처를 평면으로 투영
TOC: 평면 및 원근 투영 매핑


이 글은 예제를 정리하기 위해 [less code more fun](webgl-less-code-more-fun.html)에서 언급된 라이브러리를 사용합니다.
`webglUtils.setBuffersAndAttributes` 함수가 buffer와 attribute를 설정하는 것이나, `webglUtils.setUniforms` 함수가 uniform을 설정하는 게 무슨 의미인지 모르겠다면, 뒤로 돌아가서 [WebGL 기초](webgl-fundamentals.html)를 먼저 읽어주세요.

또한 [perspective](webgl-3d-perspective.html), [카메라](webgl-3d-camera.html), [텍스처](webgl-3d-textures.html), [카메라 시각화](webgl-visualizing-the-camera.html)에 대한 글을 읽었다고 가정하기 때문에 읽지 않았다면 먼저 읽어주세요.

투영 매핑은 영사기가 스크린을 향하게 하고 영화를 투사하는 것과 같은 의미로 "projecting" 방법입니다.
영사기는 투시면을 투사하는데요.
스크린이 영사기에서 멀어질수록 이미지는 더 커집니다.
영사기에 수직이 아니도록 스크린의 각도를 조정하면 결과는 사디리꼴이나 임의의 사변형이 됩니다.

<div class="webgl_center"><img src="resources/perspective-projection.svg" style="width: 400px"></div>

물론 투영 매핑이 평평할 필요는 없습니다.
원통형 투영 매핑, 구형 투영 매핑 등이 있죠.

먼저 평면 투영 매핑을 살펴봅시다.
이 경우 스크린이 영사기에서 멀어질수록 영상이 커지는 대신에 동일한 크기가 되도록 영사기가 스크린만큼 크다고 상상해야 합니다.

<div class="webgl_center"><img src="resources/orthographic-projection.svg" style="width: 400px"></div>

먼저 평면과 구체를 그리는 간단한 장면을 만들어 보겠습니다.
양쪽 모두 간단한 8x8 체커 보드 텍스처를 사용할 겁니다.

셰이더는 다양한 행렬이 분리되어 있으므로 JavaScript에서 함께 곱할 필요가 없다는 걸 제외하면 [텍스처에 대한 글](webgl-3d-textures.html)의 셰이더와 유사합니다.

```glsl
// vertex shader
attribute vec4 a_position;
attribute vec2 a_texcoord;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

varying vec2 v_texcoord;

void main() {
  gl_Position = u_projection * u_view * u_world * a_position;

  // fragment shader로 텍스처 좌표 전달
  v_texcoord = a_texcoord;
}
```

또한 uniform `u_colorMult`를 추가하여 텍스처 색상을 곱했습니다.
단색 텍스처를 만들면 이런 식으로 색상을 변경할 수 있습니다.

```glsl
// fragment shader
precision mediump float;

// Vertex shader에서 전달
varying vec2 v_texcoord;

uniform vec4 u_colorMult;
uniform sampler2D u_texture;

void main() {
  gl_FragColor = texture2D(u_texture, v_texcoord) * u_colorMult;
}
```

다음은 program, sphere buffer, plane buffer를 설정하는 코드입니다.

```js
// GLSL program 설정
// 셰이더 컴파일, program 연결, location 탐색
const textureProgramInfo = webglUtils.createProgramInfo(gl, ['vertex-shader-3d', 'fragment-shader-3d']);

const sphereBufferInfo = primitives.createSphereBufferInfo(
    gl,
    1,  // 반지름
    12, // subdivisions around
    6,  // subdivisions down
);
const planeBufferInfo = primitives.createPlaneBufferInfo(
    gl,
    20,  // 너비
    20,  // 높이
    1,   // subdivisions across
    1,   // subdivisions down
);
```

그리고 [데이터 텍스처에 관한 글](webgl-data-textures.html)에서 다룬 기술을 사용하여 8x8 픽셀 체커 보드 텍스처를 만드는 코드입니다.

```js
// 8x8 체커 보드 텍스처 만들기
const checkerboardTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, checkerboardTexture);
gl.texImage2D(
    gl.TEXTURE_2D,
    0,                // mip level
    gl.LUMINANCE,     // internal format
    8,                // 너비
    8,                // 높이
    0,                // 테두리
    gl.LUMINANCE,     // format
    gl.UNSIGNED_BYTE, // type
    new Uint8Array([  // 데이터
      0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
      0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
      0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
      0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
      0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
      0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
      0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
      0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
    ]));
gl.generateMipmap(gl.TEXTURE_2D);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
```

그리기 위해 projection matrix와 camera matrix를 가져와서, camera matrix로 view matrix를 계산한 다음, 구체와 큐브를 그리는 함수를 만들겁니다.

```js
// 각 객체에 대한 uniform
const planeUniforms = {
  u_colorMult: [0.5, 0.5, 1, 1],  // 하늘색
  u_texture: checkerboardTexture,
  u_world: m4.translation(0, 0, 0),
};
const sphereUniforms = {
  u_colorMult: [1, 0.5, 0.5, 1],  // 분홍색
  u_texture: checkerboardTexture,
  u_world: m4.translation(2, 3, 4),
};

function drawScene(projectionMatrix, cameraMatrix) {
  // camera matrix로 view matrix 만들기
  const viewMatrix = m4.inverse(cameraMatrix);

  gl.useProgram(textureProgramInfo.program);

  // 구체와 평면이 공유하는 uniform 설정
  webglUtils.setUniforms(textureProgramInfo, {
    u_view: viewMatrix,
    u_projection: projectionMatrix,
  });

  // ------ 구체 그리기 --------

  // 필요한 모든 attribute 설정
  webglUtils.setBuffersAndAttributes(gl, textureProgramInfo, sphereBufferInfo);

  // 구체에 고유한 uniform 설정
  webglUtils.setUniforms(textureProgramInfo, sphereUniforms);

  // gl.drawArrays 혹은 gl.drawElements 호출
  webglUtils.drawBufferInfo(gl, sphereBufferInfo);

  // ------ 평면 그리기 --------

  // 필요한 모든 attribute 설정
  webglUtils.setBuffersAndAttributes(gl, textureProgramInfo, planeBufferInfo);

  // 평면에 고유한 uniform 설정
  webglUtils.setUniforms(textureProgramInfo, planeUniforms);

  // gl.drawArrays 혹은 gl.drawElements 호출
  webglUtils.drawBufferInfo(gl, planeBufferInfo);
}
```

우리는 이 코드는 `render` 함수에서 이렇게 사용할 수 있습니다.

```js
const settings = {
  cameraX: 2.75,
  cameraY: 5,
};
const fieldOfViewRadians = degToRad(60);

function render() {
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  // Clip space에서 픽셀로 변환하는 방법을 WebGL에 지시
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  // 캔버스와 depth buffer 지우기
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Projection matrix 계산
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const projectionMatrix =
      m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

  // lookAt을 사용하여 카메라 행렬 계산
  const cameraPosition = [settings.cameraX, settings.cameraY, 7];
  const target = [0, 0, 0];
  const up = [0, 1, 0];
  const cameraMatrix = m4.lookAt(cameraPosition, target, up);

  drawScene(projectionMatrix, cameraMatrix);
}
render();
```

이제 평면과 구체가 있는 간단한 장면이 생겼습니다.
장면 이해를 돕기 위해 카메라 위치를 변경해주는 슬라이더를 추가했습니다.

{{{example url="../webgl-planar-projection-setup.html"}}}

이제 구체와 평면에 텍스처를 평면으로 투영해봅시다.

먼저 [텍스처를 로드](webgl-3d-textures.html)합니다.

```js
function loadImageTexture(url) {
  // 텍스처 생성
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // 1x1 파란 픽셀로 텍스처 채우기
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 255, 255])
  );
  // 비동기적으로 이미지 로드
  const image = new Image();
  image.src = url;
  image.addEventListener('load', function() {
    // 이제 이미지가 로드되었기 때문에 텍스처로 복사
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
    // 텍스처가 2의 거듭 제곱이라 가정
    gl.generateMipmap(gl.TEXTURE_2D);
    render();
  });
  return texture;
}

const imageTexture = loadImageTexture('resources/f-texture.png');
```

[카메라 시각화에 대한 글](webgl-visualizing-the-camera.html)을 떠올려보면, -1에서 +1사이의 큐브를 만들고 카메라의 절두체를 나타내도록 그렸습니다.
절두체 내부의 공간이 world space에서 -1에서 +1사이의 clip space로 변환되는 world space 내부에 있는 절두체 모양의 영역을 나타내도록 행렬을 만들었는데요.
여기서도 비슷하게 할 수 있습니다.

한 번 해봅시다.
먼저 fragment shader에서 텍스처 좌표가 0.0에서 1.0사이인 곳에 투영된 텍스처를 그립니다.
해당 범위 밖에서는 체커 보드 텍스처를 사용할 겁니다. 

```glsl
precision mediump float;

// Vertex shader에서 전달
varying vec2 v_texcoord;
+varying vec4 v_projectedTexcoord;

uniform vec4 u_colorMult;
uniform sampler2D u_texture;
+uniform sampler2D u_projectedTexture;

void main() {
-  gl_FragColor = texture2D(u_texture, v_texcoord) * u_colorMult;
+  // 올바른 값을 얻기 위해 w로 나누기 (Perspective에 대한 글 참고)
+  vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
+
+  bool inRange = 
+      projectedTexcoord.x >= 0.0 &&
+      projectedTexcoord.x <= 1.0 &&
+      projectedTexcoord.y >= 0.0 &&
+      projectedTexcoord.y <= 1.0;
+
+  vec4 projectedTexColor = texture2D(u_projectedTexture, projectedTexcoord.xy);
+  vec4 texColor = texture2D(u_texture, v_texcoord) * u_colorMult;
+
+  float projectedAmount = inRange ? 1.0 : 0.0;
+  gl_FragColor = mix(texColor, projectedTexColor, projectedAmount);
}
```

투영된 텍스처 좌표를 계산하기 위해 [카메라 시각화](webgl-visualizing-the-camera.html)에 대한 글의 특정 방향을 향하도록 배치된 카메라처럼 3D 공간을 나타내는 행렬을 만듭니다.
그런 다음 해당 공간을 통해 구체의 world position과 평면 정점을 투영합니다.
0과 1사이에 있을 때 방금 작성한 코드가 텍스처를 표시할 겁니다.

이 *공간*을 통해 구체의 world position과 평면 정점을 투영하기 위해 vertex shader에 코드를 추가해봅시다.

```glsl
attribute vec4 a_position;
attribute vec2 a_texcoord;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;
+uniform mat4 u_textureMatrix;

varying vec2 v_texcoord;
+varying vec4 v_projectedTexcoord;

void main() {
+  vec4 worldPosition = u_world * a_position;

-  gl_Position = u_projection * u_view * u_world * a_position;
+  gl_Position = u_projection * u_view * worldPosition;

  // fragment shader로 texcoord 전달
  v_texcoord = a_texcoord;

+  v_projectedTexcoord = u_textureMatrix * worldPosition;
}
```

이제 남은 것은 이 상대적인 공간을 정의하는 행렬을 실제로 계산하는 겁니다.
다른 객체들과 마찬가지로 world matrix를 계산한 다음 역행렬을 적용하면 되는데요.
이는 이 공간에 상대적인 다른 객체들의 world position을 향하는 행렬을 제공할 겁니다.
이건 [카메라에 대한 글](webgl-3d-camera.html)에서 사용한 view matrix와 완전히 동일합니다.

마찬가지로 [같은 글](webgl-3d-camera.html)에서 만들었던 `lookAt` 함수를 사용할 겁니다.

```js
const settings = {
  cameraX: 2.75,
  cameraY: 5,
+  posX: 3.5,
+  posY: 4.4,
+  posZ: 4.7,
+  targetX: 0.8,
+  targetY: 0,
+  targetZ: 4.7,
};

function drawScene(projectionMatrix, cameraMatrix) {
  // camera matrix로 view matrix 만들기
  const viewMatrix = m4.inverse(cameraMatrix);

  let textureWorldMatrix = m4.lookAt(
      [settings.posX, settings.posY, settings.posZ],          // 위치
      [settings.targetX, settings.targetY, settings.targetZ], // 대상
      [0, 1, 0],                                              // up
  );

  // 이 world matrix의 역행렬을 사용하여 다른 위치가 world space에 상대적으로 되도록 변환하는 행렬을 만듭니다.
  const textureMatrix = m4.inverse(textureWorldMatrix);

  // 구체와 평면 모두에 동일한 uniform 설정
  webglUtils.setUniforms(textureProgramInfo, {
    u_view: viewMatrix,
    u_projection: projectionMatrix,
+    u_textureMatrix: textureMatrix,
+    u_projectedTexture: imageTexture,
  });

  ...
}
```

물론 꼭 `lookAt`을 사용하지 않아도 됩니다.
예를 들어 [장면 그래프](webgl-scene-graph.html)나 [행렬 스택](webgl-2d-matrix-stack.html)을 사용하여 원하는대로 world matrix를 만들 수 있습니다.

실행 전에 몇 가지 scale을 추가해봅시다.

```js
const settings = {
  cameraX: 2.75,
  cameraY: 5,
  posX: 3.5,
  posY: 4.4,
  posZ: 4.7,
  targetX: 0.8,
  targetY: 0,
  targetZ: 4.7,
+  projWidth: 2,
+  projHeight: 2,
};

function drawScene(projectionMatrix, cameraMatrix) {
  // camera matrix로 view matrix 만들기
  const viewMatrix = m4.inverse(cameraMatrix);

  let textureWorldMatrix = m4.lookAt(
      [settings.posX, settings.posY, settings.posZ],          // 위치
      [settings.targetX, settings.targetY, settings.targetZ], // 대상
      [0, 1, 0],                                              // up
  );
+  textureWorldMatrix = m4.scale(
+      textureWorldMatrix,
+      settings.projWidth, settings.projHeight, 1,
+  );

  // 이 world matrix의 역행렬을 사용하여 다른 위치가 world space에 상대적으로 되도록 변환하는 행렬을 만듭니다.
  const textureMatrix = m4.inverse(textureWorldMatrix);

  ...
}
```

이를 통해 투영된 텍스처를 얻습니다.

{{{example url="../webgl-planar-projection.html"}}}

텍스처가 들어있는 공간을 보기 힘들 수도 있을 것 같습니다.
시각화를 돕기 위해 wireframe cube를 추가해봅시다.

먼저 별도의 셰이더 세트가 필요합니다.
이 셰이더는 텍스처 없이, 단색만 그릴 수 있습니다.

```html
<script id="color-vertex-shader" type="x-shader/x-vertex">
attribute vec4 a_position;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

void main() {
  // 위치를 행렬로 곱하기
  gl_Position = u_projection * u_view * u_world * a_position;
}
</script>
```

```html
<script id="color-fragment-shader" type="x-shader/x-fragment">
precision mediump float;

uniform vec4 u_color;
void main() {
  gl_FragColor = u_color;
}
</script>
```

그런 다음 이 셰이더도 컴파일하고 연결해야 합니다.

```js
// GLSL program 설정
const textureProgramInfo = webglUtils.createProgramInfo(gl, ['vertex-shader-3d', 'fragment-shader-3d']);
+const colorProgramInfo = webglUtils.createProgramInfo(gl, ['color-vertex-shader', 'color-fragment-shader']);
```

그리고 선으로 만들어진 큐브를 그리기 위한 데이터가 필요합니다.

```js
const sphereBufferInfo = primitives.createSphereBufferInfo(
    gl,
    1,  // 반지름
    12, // subdivisions around
    6,  // subdivisions down
);
const planeBufferInfo = primitives.createPlaneBufferInfo(
    gl,
    20,  // 너비
    20,  // 높이
    1,   // subdivisions across
    1,   // subdivisions down
);
+const cubeLinesBufferInfo = webglUtils.createBufferInfoFromArrays(gl, {
+  position: [
+     0,  0, -1,
+     1,  0, -1,
+     0,  1, -1,
+     1,  1, -1,
+     0,  0,  1,
+     1,  0,  1,
+     0,  1,  1,
+     1,  1,  1,
+  ],
+  indices: [
+    0, 1,
+    1, 3,
+    3, 2,
+    2, 0,
+
+    4, 5,
+    5, 7,
+    7, 6,
+    6, 4,
+
+    0, 4,
+    1, 5,
+    3, 7,
+    2, 6,
+  ],
+});
```

이 큐브는 텍스처 좌표를 맞추기 위해 X와 Y에 대해 0에서 1사이가 됩니다.
Z의 경우 -1에서 1사이가 되죠.
이건 양쪽 방향으로 늘릴 수 있도록 크기를 조정하기 위한 겁니다.

이제 그걸 써서 하고 싶은 것은 공간이 존재하는 곳에 큐브를 그리는 것이기 때문에 이전의 `textureWorldMatrix`를 사용할 수 있습니다.

```js
function drawScene(projectionMatrix, cameraMatrix) {

  ...
+  // ------ 큐브 그리기 ------
+
+  gl.useProgram(colorProgramInfo.program);
+
+  // 필요한 모든 attribute 설정
+  webglUtils.setBuffersAndAttributes(gl, colorProgramInfo, cubeLinesBufferInfo);
+
+  // Z에서 큐브의 크기를 조정하기 때문에 무한대로 투영되는 텍스처를 나타내기 위해 정말 길어집니다.
+  const mat = m4.scale(textureWorldMatrix, 1, 1, 1000);
+
+  // 계산한 uniform 설정
+  webglUtils.setUniforms(colorProgramInfo, {
+    u_color: [0, 0, 0, 1],
+    u_view: viewMatrix,
+    u_projection: projectionMatrix,
+    u_world: mat,
+  });
+
+  // gl.drawArrays 혹은 gl.drawElements 호출
+  webglUtils.drawBufferInfo(gl, cubeLinesBufferInfo, gl.LINES);
}
```

이제 projection이 어디있는지 더 쉽게 알 수 있습니다.

{{{example url="../webgl-planar-projection-with-lines.html"}}}

정말로 텍스처를 *투영*한 것이 아니라는 점을 유의해야 합니다.
오히려 정반대입니다.
렌더링되는 객체의 각 픽셀에 대해 텍스처의 어느 부분이 거기에 투영되는지 확인한 다음 텍스처의 해당 부분에서 색상을 찾습니다.

위의 영사기를 언급했는데 어떻게 영사기를 시뮬레이션할까요?
기본적으로는 projection matrix로 곱할 수 있습니다.

```js
const settings = {
  cameraX: 2.75,
  cameraY: 5,
  posX: 2.5,
  posY: 4.8,
  posZ: 4.3,
  targetX: 2.5,
  targetY: 0,
  targetZ: 3.5,
  projWidth: 1,
  projHeight: 1,
+  perspective: true,
+  fieldOfView: 45,
};

...

function drawScene(projectionMatrix, cameraMatrix) {
  // camera matrix로 view matrix 만들기
  const viewMatrix = m4.inverse(cameraMatrix);

  const textureWorldMatrix = m4.lookAt(
      [settings.posX, settings.posY, settings.posZ],          // 위치
      [settings.targetX, settings.targetY, settings.targetZ], // 대상
      [0, 1, 0],                                              // up
  );
-  textureWorldMatrix = m4.scale(
-      textureWorldMatrix,
-      settings.projWidth, settings.projHeight, 1,
-  );
  
+  const textureProjectionMatrix = settings.perspective
+      ? m4.perspective(
+          degToRad(settings.fieldOfView),
+          settings.projWidth / settings.projHeight,
+          0.1,  // near
+          200)  // far
+      : m4.orthographic(
+          -settings.projWidth / 2,   // left
+           settings.projWidth / 2,   // right
+          -settings.projHeight / 2,  // bottom
+           settings.projHeight / 2,  // top
+           0.1,                      // near
+           200);                     // far

  // 이 world matrix의 역행렬을 사용하여 다른 위치가 world space에 상대적으로 되도록 변환하는 행렬을 만듭니다.
-  const textureMatrix = m4.inverse(textureWorldMatrix);
+  const textureMatrix = m4.multiply(
+      textureProjectionMatrix,
+      m4.inverse(textureWorldMatrix));
```

참고로 perspective나 orthographic projection matrix를 사용하는 선택지가 있습니다.

또한 선을 그릴 때 해당 projection matrix를 사용해야 합니다.

```js
// ------ 큐브 그리기 ------

...

-// Z에서 큐브의 크기를 조정하기 때문에 무한대로 투영되는 텍스처를 나타내기 위해 정말 길어집니다.
-const mat = m4.scale(textureWorldMatrix, 1, 1, 1000);

+// Projection과 일치하도록 큐브 방향 조정
+const mat = m4.multiply(
+    textureWorldMatrix, m4.inverse(textureProjectionMatrix));
```

이러면 다음과 같은 결과를 얻습니다.

{{{example url="../webgl-planar-projection-with-projection-matrix-0-to-1.html"}}}

작동은 하지만 projection과 cube line은 모두 0에서 1사이의 공간을 사용하므로 projection frustum의 1/4만 사용합니다.

수정을 위해 먼저 큐브를 모든 방향으로 -1에서 +1사이인 큐브로 만들어봅시다.

```js
const cubeLinesBufferInfo = webglUtils.createBufferInfoFromArrays(gl, {
  position: [
-     0,  0, -1,
-     1,  0, -1,
-     0,  1, -1,
-     1,  1, -1,
-     0,  0,  1,
-     1,  0,  1,
-     0,  1,  1,
-     1,  1,  1,
+    -1, -1, -1,
+     1, -1, -1,
+    -1,  1, -1,
+     1,  1, -1,
+    -1, -1,  1,
+     1, -1,  1,
+    -1,  1,  1,
+     1,  1,  1,
  ],
  indices: [
    0, 1,
    1, 3,
    3, 2,
    2, 0,

    4, 5,
    5, 7,
    7, 6,
    6, 4,

    0, 4,
    1, 5,
    3, 7,
    2, 6,
  ],
});
```

그런 다음 텍스처 행렬을 사용할 때 절두체 내부 공간을 0에서 1사이로 만들어야 하는데, 공간을 0.5만큼 offset하고 0.5로 scale하면 됩니다.

```js
const textureWorldMatrix = m4.lookAt(
    [settings.posX, settings.posY, settings.posZ],          // 위치
    [settings.targetX, settings.targetY, settings.targetZ], // 대상
    [0, 1, 0],                                              // up
);
const textureProjectionMatrix = settings.perspective
    ? m4.perspective(
        degToRad(settings.fieldOfView),
        settings.projWidth / settings.projHeight,
        0.1,  // near
        200)  // far
    : m4.orthographic(
        -settings.projWidth / 2,   // left
         settings.projWidth / 2,   // right
        -settings.projHeight / 2,  // bottom
         settings.projHeight / 2,  // top
         0.1,                      // near
         200);                     // far

-// 이 world matrix의 역행렬을 사용하여 다른 위치가 world space에 상대적으로 되도록 변환하는 행렬을 만듭니다.
-const textureMatrix = m4.multiply(
-    textureProjectionMatrix,
-    m4.inverse(textureWorldMatrix));

+let textureMatrix = m4.identity();
+textureMatrix = m4.translate(textureMatrix, 0.5, 0.5, 0.5);
+textureMatrix = m4.scale(textureMatrix, 0.5, 0.5, 0.5);
+textureMatrix = m4.multiply(textureMatrix, textureProjectionMatrix);
+// 이 world matrix의 역행렬을 사용하여 다른 위치가 world space에 상대적으로 되도록 변환하는 행렬을 만듭니다.
+textureMatrix = m4.multiply(
+    textureMatrix,
+    m4.inverse(textureWorldMatrix));
```

이제 작동하는 것 같네요.

{{{example url="../webgl-planar-projection-with-projection-matrix.html"}}}

그래서 텍스처를 평면으로 투영하는 것의 장점이 뭘까요?

하나는 여러분이 원하기 때문이죠, 하하.
대부분의 3D 모델링 패키지는 텍스처를 평면으로 투영하는 기능을 제공합니다.

또 하나는 decal입니다.
Decal은 표면에 페인트 얼룩이나 폭발 흔적을 붙이는 방법입니다.
일반적으로 decal은 위와 같은 셰이더를 통해 작동하지 않습니다.
대신에 decal을 적용하려는 모델의 geometry를 검토하는 함수를 작성하는데요.
JavaScript의 셰이더 예제에 있는 `inRange` 확인과 동일하게, 각 삼각형에 대해 decal이 적용될 영역의 내부에 있는지 확인합니다.
범위 내에 있는 각 삼각형에 대해 투영된 텍스처 좌표를 사용하여 새로운 geometry에 추가합니다.
그런 다음 해당 decal을 그려야 하는 목록에 추가하면 되죠.

Geometry를 생성은 적절한 방법이며, 그렇지 않으면 2개, 3개, 4개의 다른 셰이더가 필요하고 너무 복잡해져서 GPU 셰이더 텍스처 제한에 도달하게 됩니다.

또 다른 것은 현실 세계의 [투영 매핑](https://en.wikipedia.org/wiki/Projection_mapping)을 시뮬레이션하는 겁니다.
영상을 투사할 3D 모델을 만든 다음 영상을 텍스처로 사용하는 것을 제외하고는 위와 같은 코드를 사용하여 투사합니다.
그러면 영사기와 함께 실제 현장에 있을 필요없이 모델에 맞춰 영상을 완성하고 편집할 수 있습니다.

이런 종류의 투영이 유용한 다른 것은 [그림자 매핑을 이용한 그림자 계산](webgl-shadows.html)입니다.

<div class="webgl_bottombar">
<h3>조건부 텍스처 참조</h3>
<p>위의 fragment shader에서 모든 경우에 두 가지 텍스처를 읽게 됩니다.</p>
<pre class="prettyprint"><code>
  vec4 projectedTexColor = texture2D(u_projectedTexture, projectedTexcoord.xy);
  vec4 texColor = texture2D(u_texture, v_texcoord) * u_colorMult;

  float projectedAmount = inRange ? 1.0 : 0.0;
  gl_FragColor = mix(texColor, projectedTexColor, projectedAmount);
</code></pre>
<p>왜 이렇게 하지 않았을까요?</p>
<pre class="prettyprint"><code>
  if (inRange) {
    gl_FragColor = texture2D(u_projectedTexture, projectedTexcoord.xy);
  } else {
    gl_FragColor = texture2D(u_texture, v_texcoord) * u_colorMult;
  }
</code></pre>
<p><a href="https://www.khronos.org/files/opengles_shading_language.pdf">GLSL ES 1.0 spec Appendix A, Section 6</a>을 보면</p>
<blockquote>
<h4>텍스처 접근</h4>
<p>
non-uniform conditional block의 body 내에서 mip-mapped texture에 접근하면 정의되지 않은 값이 제공됩니다.
non-uniform conditional block은 컴파일 시 실행을 결정할 수 없는 block입니다.
<p>
</blockquote>
<p>
다시 말해, mip-mapped texture를 사용하려면 늘 접근해야 하는데요.
결과를 조건부로 사용할 수 있습니다.
예를 들어 다음과 같이 작성할 수 있죠.
</p>
<pre class="prettyprint"><code>
  vec4 projectedTexColor = texture2D(u_projectedTexture, projectedTexcoord.xy);
  vec4 texColor = texture2D(u_texture, v_texcoord) * u_colorMult;

  if (inRange) {
    gl_FragColor = projectedTexColor;
  } else {
    gl_FragColor = texColor;
  }
</code></pre>
<p>혹은 이렇게</p>
<pre class="prettyprint"><code>
  vec4 projectedTexColor = texture2D(u_projectedTexture, projectedTexcoord.xy);
  vec4 texColor = texture2D(u_texture, v_texcoord) * u_colorMult;

  gl_FragColor = inRange ? projectedTexColor : texColor;
</code></pre>
<p>
하지만 mip-mapped texture 자체에 조건부로 접근할 수는 없는데요.
GPU에서 작동하지만 모든 GPU에서 작동하지는 않습니다.
non-mipmapped texture에 대해서는 아무 명령도 내리지 않으므로 mip-mapped texture가 아닌 것을 알고 있다면 괜찮습니다.
</p>
<p>어쨌든 아는 것이 중요합니다.</p>
<p>
<code>inRange</code>를 기반으로 분리하는 대신 <code>mix</code>를 사용하는 이유는 개인적인 취향입니다.
<code>mix</code>가 더 유연하기 때문에 보통 이걸로 작성합니다.
</p>
</div>


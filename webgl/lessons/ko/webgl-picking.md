Title: WebGL 피킹
Description: WebGL에서 항목을 선택하는 방법
TOC: 피킹 (물체 클릭)


이 글은 WebGL을 사용하여 물체를 선택하거나 고르는 방법에 관한 것입니다.

이 사이트의 다른 글을 읽으셨다면 WebGL 자체는 단순 래스터화 라이브러리라는 것을 깨달으셨을 겁니다.
삼각형, 선, 점을 캔버스에 그리므로 "선택할 객체"라는 개념이 없는데요.
여러분이 제공하는 셰이더를 통해 픽셀만 출력합니다.
이는 무언가를 "선택"하는 개념을 코드에서 가져와야 한다는 걸 의미합니다.
이를 위해 사용자가 선택할 수 있는 항목이 무엇인지 정의가 필요한데요.
말인즉슨 이 글에서 일반적인 개념을 다룰 순 있지만, 여러분의 어플리케이션에 사용 가능한 개념으로 변환하는 방법은 스스로 결정해야 합니다.

## 객체 클릭

사용자가 클릭한 항목을 알아내는 가장 쉬운 방법 중 하나는 각 객체에 대한 숫자 아이디를 제공하는 것인데, 그러면 아이디를 사용하여 조명과 텍스처 없이 색상으로 모든 객체를 그릴 수 있습니다.
이는 각 객체의 실루엣 이미지를 제공할 겁니다.
깊이 버퍼는 정렬을 처리할 텐데요.
그러면 마우스 아래에 있는 픽셀 색상을 읽을 수 있고, 거기에 렌더링된 객체의 아이디를 알 수 있습니다.

이 기술을 구현하기 위해 이전에 다뤘던 여러 글을 결합해야 합니다.
먼저 여러 항목을 그리면 그것들을 선택하려고 할 수 있으므로 [여러 객체 그리기](webgl-drawing-multiple-things.html)에 대한 글에서 나온 내용을 사용할 겁니다.

여기에 더해 이러한 아이디를 화면 밖에서도 렌더링하고 싶기 때문에 [텍스처에 렌더링](webgl-render-to-texture.html)하는 코드도 추가할 겁니다.

그럼 [여러 항목 그리기](webgl-drawing-multiple-things.html)에서 다뤘던 200개의 항목을 그리는 마지막 예제부터 시작하겠습니다.

거기에 [텍스처 렌더링에 대한 글](webgl-render-to-texture.html)의 마지막 예제에서 텍스처와 깊이 버퍼가 첨부된 프레임 버퍼를 추가해봅시다.

```js
// 렌더링할 텍스처 생성
const targetTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, targetTexture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

// 깊이 렌더 버퍼 생성
const depthBuffer = gl.createRenderbuffer();
gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);

function setFramebufferAttachmentSizes(width, height) {
  gl.bindTexture(gl.TEXTURE_2D, targetTexture);
  // 레벨 0의 크기와 포맷 정의
  const level = 0;
  const internalFormat = gl.RGBA;
  const border = 0;
  const format = gl.RGBA;
  const type = gl.UNSIGNED_BYTE;
  const data = null;
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border,
                format, type, data);

  gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
}

// 프레임 버퍼 생성과 바인딩
const fb = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

// 첫 번째 색상 어태치먼트에 텍스처 첨부
const attachmentPoint = gl.COLOR_ATTACHMENT0;
const level = 0;
gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, level);

// 깊이 버퍼를 targetTexture와 같은 크기로 만들기
gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
```

텍스처와 깊이 렌더 버퍼의 크기를 설정하는 코드를 함수에 넣어 캔버스의 크기에 맞게 크기를 조정하도록 호출할 수 있습니다.

렌더링 코드에서 캔버스의 크기가 변경되면 텍스처와 렌더 버퍼가 일치하도록 조정할 겁니다.

```js
function drawScene(time) {
  time *= 0.0005;

-  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
+  if (webglUtils.resizeCanvasToDisplaySize(gl.canvas)) {
+    // 캔버스 크기가 바뀌었으니 프레임 버퍼 어태치먼트와 일치시킵니다.
+    setFramebufferAttachmentSizes(gl.canvas.width, gl.canvas.height);
+  }

...
```

다음으로 두 번째 셰이더가 필요합니다.
샘플의 셰이더는 정점 색상을 사용하여 렌더링하고 있지만 우리는 아이디로 렌더링하기 위해 단색으로 설정 가능한 셰이더가 필요합니다.

```html
<!-- 정점 셰이더 -->
<script id="pick-vertex-shader" type="x-shader/x-vertex">
  attribute vec4 a_position;
  
  uniform mat4 u_matrix;
  
  void main() {
    // Multiply the position by the matrix.
    gl_Position = u_matrix * a_position;
  }
</script>
<!-- 프래그먼트 셰이더 -->
<script id="pick-fragment-shader" type="x-shader/x-fragment">
  precision mediump float;
  
  uniform vec4 u_id;
  
  void main() {
     gl_FragColor = u_id;
  }
</script>
```

그리고 [도우미 함수](webgl-less-code-more-fun.html)를 사용하여 컴파일, 연결, 위치 탐색을 해야 합니다.

```js
// GLSL 프로그램 설정
const programInfo = webglUtils.createProgramInfo(
    gl, ["3d-vertex-shader", "3d-fragment-shader"]);
+const pickingProgramInfo = webglUtils.createProgramInfo(
+    gl, ["pick-vertex-shader", "pick-fragment-shader"]);
```

모든 객체를 두 번 렌더링할 수 있어야 합니다.
할당한 셰이더와 방금 작성한 셰이더로 모든 객체를 렌더링하는 코드를 함수로 추출해봅시다.

```js
function drawObjects(objectsToDraw, overrideProgramInfo) {
  objectsToDraw.forEach(function(object) {
    const programInfo = overrideProgramInfo || object.programInfo;
    const bufferInfo = object.bufferInfo;

    gl.useProgram(programInfo.program);

    // 필요한 모든 속성 설정
    webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);

    // 유니폼 설정
    webglUtils.setUniforms(programInfo, object.uniforms);

    // 그리기
    gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
  });
}
```

`drawObjects`는 객체의 할당된 셰이더 대신에 피킹 셰이더를 사용하기 위해 전달할 수 있는 선택적 `overrideProgramInfo`를 가집니다.

이를 호출하여 한 번은 아이디로 텍스처에, 다시 한 번은 캔버스에 장면을 그려봅시다.

```js
// 장면 그리기
function drawScene(time) {
  time *= 0.0005;

  ...

  // 각 객체에 대한 행렬 계산
  objects.forEach(function(object) {
    object.uniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        object.translation,
        object.xRotationSpeed * time,
        object.yRotationSpeed * time);
  });

+  // ------ 텍스처에 객체 그리기 --------
+
+  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
+  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
+
+  gl.enable(gl.CULL_FACE);
+  gl.enable(gl.DEPTH_TEST);
+
+  // 캔버스와 깊이 버퍼 지우기
+  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
+
+  drawObjects(objectsToDraw, pickingProgramInfo);
+
+  // ------ 캔버스에 객체 그리기
+
+  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
+  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
+
+  drawObjects(objectsToDraw);

  requestAnimationFrame(drawScene);
}
```

피킹 셰이더는 `u_id`를 아이디로 설정해야 하므로 유니폼 데이터에 이를 추가해봅시다.

```js
// 각 객체에 대한 정보를 만듭니다.
const baseHue = rand(0, 360);
const numObjects = 200;
for (let ii = 0; ii < numObjects; ++ii) {
+  const id = ii + 1;
  const object = {
    uniforms: {
      u_colorMult: chroma.hsv(eMod(baseHue + rand(0, 120), 360), rand(0.5, 1), rand(0.5, 1)).gl(),
      u_matrix: m4.identity(),
+      u_id: [
+        ((id >>  0) & 0xFF) / 0xFF,
+        ((id >>  8) & 0xFF) / 0xFF,
+        ((id >> 16) & 0xFF) / 0xFF,
+        ((id >> 24) & 0xFF) / 0xFF,
+      ],
    },
    translation: [rand(-100, 100), rand(-100, 100), rand(-150, -50)],
    xRotationSpeed: rand(0.8, 1.2),
    yRotationSpeed: rand(0.8, 1.2),
  };
  objects.push(object);
  objectsToDraw.push({
    programInfo: programInfo,
    bufferInfo: shapes[ii % shapes.length],
    uniforms: object.uniforms,
  });
}
```

[도우미 라이브러리](webgl-less-code-more-fun.html)가 유니폼 적용을 처리하기 때문에 잘 동작합니다.

아이디를 R, G, B, A로 나눠야 합니다.
텍스처의 포맷/타입이 `gl.RGBA`/`gl.UNSIGNED_BYTE`이기 때문에 채널당 8비트를 얻습니다.
8비트는 256개의 값만 나타낼 수 있지만 아이디를 4개의 채널로 나눠서 총 40억개 이상인 32비트를 얻을 수 있습니다.

"마우스 아래에 아무것도 없음"을 의미하는 0을 사용할 것이기 때문에 아이디에 1을 추가합니다.

이제 마우스 아래에 있는 객체를 하이라이트 표시해봅시다.

먼저 캔버스에 상대적인 마우스 위치를 가져오는 코드가 필요합니다.

```js
// mouseX와 mouseY는 캔버스에 상대적인 CSS 표시 공간에 있습니다.
let mouseX = -1;
let mouseY = -1;

...

gl.canvas.addEventListener('mousemove', (e) => {
   const rect = canvas.getBoundingClientRect();
   mouseX = e.clientX - rect.left;
   mouseY = e.clientY - rect.top;
});
```

위 코드에서 `mouseX`와 `mouseY`는 표시 공간의 CSS 픽셀에 있습니다.
즉 캔버스에 있는 픽셀 수의 공간이 아니라 캔버스가 표시되는 공간에 있다는 뜻입니다.

```html
<canvas width="11" height="22" style="width:33px; height:44px;"></canvas>
```

다시 말해 이런 캔버스가 있을 때 `mouseX`는 0에서 33까지이고 `mouseY`는 0에서 44까지입니다.
더 많은 정보를 알고 싶다면 [이 글](webgl-resizing-the-canvas.html)을 확인해주세요.

이제 마우스 위치를 가지고 있으니 마우스 아래의 픽셀을 찾는 코드를 추가해봅시다.

```js
const pixelX = mouseX * gl.canvas.width / gl.canvas.clientWidth;
const pixelY = gl.canvas.height - mouseY * gl.canvas.height / gl.canvas.clientHeight - 1;
const data = new Uint8Array(4);
gl.readPixels(
    pixelX,            // x
    pixelY,            // y
    1,                 // 너비
    1,                 // 높이
    gl.RGBA,           // 포맷
    gl.UNSIGNED_BYTE,  // 타입
    data);             // 결과를 저장할 형식화 배열
const id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24);
```

`pixelX`와 `pixelY`를 계산하는 위 코드는 표시 공간의 `mouseX`와 `mouseY`에서 캔버스 공간의 픽셀로 변환합니다.
다시 말해 위 예제에서 `mouseX`는 0에서 33사이가 되고 `mouseY`는 0에서 44사이가 됩니다.
`pixelX`는 0에서 11사이일 것이며 `pixelY`는 0에서 22사이일 겁니다.

실제 코드에서는 유틸리티 함수 `resizeCanvasToDisplaySize`를 사용하고 있으며, 캔버스와 동일한 크기로 텍스처를 만들기 때문에 표시 크기와 캔버스 크기는 일치하지만, 일치하지 않은 경우에 대한 최소한의 대비를 해뒀습니다.

이제 아이디가 있으니 실제로 선택된 객체를 하이라이트 표시하기 위해 캔버스 렌더링에 사용할 색상을 변경해봅시다.
우리가 썼던 셰이더는 사용 가능한 유니폼 `u_colorMult`를 가지고 있으므로, 마우스 아래에 객체가 있으면 이를 찾아서 `u_colorMult` 값을 저장하고 선택 색상으로 교체한 다음 복원합니다.

```js
// mouseX와 mouseY는 캔버스에 상대적인 CSS 표시 공간에 있습니다.
let mouseX = -1;
let mouseY = -1;
+let oldPickNdx = -1;
+let oldPickColor;
+let frameCount = 0;

// 장면 그리기
function drawScene(time) {
  time *= 0.0005;
+  ++frameCount;

  // ------ 텍스처에 객체 그리기 --------

  ...

  // ------ 마우스 아래에 어떤 픽셀이 있는지 알아내 해당 값을 읽습니다.

  const pixelX = mouseX * gl.canvas.width / gl.canvas.clientWidth;
  const pixelY = gl.canvas.height - mouseY * gl.canvas.height / gl.canvas.clientHeight - 1;
  const data = new Uint8Array(4);
  gl.readPixels(
      pixelX,            // x
      pixelY,            // y
      1,                 // 너비
      1,                 // 높이
      gl.RGBA,           // 포맷
      gl.UNSIGNED_BYTE,  // 타입
      data);             // 결과를 저장할 형식화 배열
  const id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24);

  // 객체의 색상 복원
  if (oldPickNdx >= 0) {
    const object = objects[oldPickNdx];
    object.uniforms.u_colorMult = oldPickColor;
    oldPickNdx = -1;
  }

  // 마우스 아래에 있는 객체를 하이라이트 표시
  if (id > 0) {
    const pickNdx = id - 1;
    oldPickNdx = pickNdx;
    const object = objects[pickNdx];
    oldPickColor = object.uniforms.u_colorMult;
    object.uniforms.u_colorMult = (frameCount & 0x8) ? [1, 0, 0, 1] : [1, 1, 0, 1];
  }

  // ------ 캔버스에 객체 그리기

```

그러면 마우스를 장면 위에서 움직일 수 있고 마우스 아래의 객체는 깜박일 겁니다.

{{{example url="../webgl-picking-w-gpu.html" }}}

가능한 최적화 중 하나는 아이디를 캔버스와 동일한 크기의 텍스처로 렌더링하는 겁니다.
개념적으로는 가장 쉬운 작업입니다.

하지만 마우스 아래에 있는 픽셀만 렌더링할 수도 있습니다.
이를 위해 수식이 해당 1픽셀만 포함하도록 절두체를 사용합니다.

지금까지는 3D의 경우 Z평면에 대한 시야, 종횡비, near/far 값을 입력으로 사용하고, 이러한 값들로 정의된 절두체를 클립 공간으로 변환하기 위한 원근 투영 행렬을 만드는 `perspective` 함수를 사용했습니다.

대부분의 3D 수학 라이브러리는 Z평면에 대한 left, right, top, bottom, z-near, z-far, 6개의 값을 받아 원근 행렬을 생성하는 `frustum` 함수가 가지고 있습니다.

이를 사용하여 마우스 아래에 있는 1픽셀에 대한 원근 행렬을 생성할 수 있습니다.

먼저 `perspective` 함수를 사용하는 경우 근거리 평면의 가장자리와 크기를 계산합니다.

```js
// 절두체의 근거리 평면 계산
const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
const top = Math.tan(fieldOfViewRadians * 0.5) * near;
const bottom = -top;
const left = aspect * bottom;
const right = aspect * top;
const width = Math.abs(right - left);
const height = Math.abs(top - bottom);
```

`left`, `right`, `width`, `height`는 근거리 평면의 크기와 위치입니다.
이제 해당 평면에서 마우스 아래에 있는 1픽셀의 크기와 위치를 계산하고 `frustum` 함수에 전달하여 해당 1픽셀을 포함하는 투영 행렬을 생성할 수 있습니다.

```js
// 마우스 아래의 1픽셀을 포함하는 근거리 평면 부분 계산
const pixelX = mouseX * gl.canvas.width / gl.canvas.clientWidth;
const pixelY = gl.canvas.height - mouseY * gl.canvas.height / gl.canvas.clientHeight - 1;

const subLeft = left + pixelX * width / gl.canvas.width;
const subBottom = bottom + pixelY * height / gl.canvas.height;
const subWidth = 1 / gl.canvas.width;
const subHeight = 1 / gl.canvas.height;

// 해당 1픽셀에 대한 절두체 만들기
const projectionMatrix = m4.frustum(
    subLeft,
    subLeft + subWidth,
    subBottom,
    subBottom + subHeight,
    near,
    far);
```

이걸 사용하려면 약간의 변경이 필요합니다.
이제 셰이더는 `u_matrix`만 사용하기 때문에 다른 투영 행렬로 그리려고 한다면, 캔버스에 그리기 위해 일반 투영 행렬로 한 번, 1픽셀 투영 행렬에 대해 다시 한 번, 모든 객체에 대해 프레임마다 두 번씩 행렬을 다시 계산해야 합니다.

해당 곱셈을 정점 셰이더로 이동하여 자바스크립트에서 제거할 수 있습니다.

```html
<!-- 정점 셰이더 -->
<script id="3d-vertex-shader" type="x-shader/x-vertex">
attribute vec4 a_position;
attribute vec4 a_color;

-uniform mat4 u_matrix;
+uniform mat4 u_viewProjection;
+uniform mat4 u_world;

varying vec4 v_color;

void main() {
-  // 위치에 행렬 곱하기
-  gl_Position = u_matrix * a_position;
+  // 위치에 행렬 곱하기
+  gl_Position = u_viewProjection * u_world * a_position;

  // 프래그먼트 셰이더로 색상 전달
  v_color = a_color;
}
</script>

...

<!-- 정점 셰이더 -->
<script id="pick-vertex-shader" type="x-shader/x-vertex">
attribute vec4 a_position;
  
-uniform mat4 u_matrix;
+uniform mat4 u_viewProjection;
+uniform mat4 u_world;
  
void main() {
-  // 위치에 행렬 곱하기
-  gl_Position = u_matrix * a_position;
+  // 위치에 행렬 곱하기
+  gl_Position = u_viewProjection * u_world * a_position;
}
</script>
```

그런 다음 자바스크립트 `viewProjectionMatrix`를 모든 객체에 공유할 수 있습니다.

```js
const objectsToDraw = [];
const objects = [];
+const viewProjectionMatrix = m4.identity();

// 각 객체에 대한 정보를 만듭니다.
const baseHue = rand(0, 360);
const numObjects = 200;
for (let ii = 0; ii < numObjects; ++ii) {
  const id = ii + 1;
  const object = {
    uniforms: {
      u_colorMult: chroma.hsv(eMod(baseHue + rand(0, 120), 360), rand(0.5, 1), rand(0.5, 1)).gl(),
-      u_matrix: m4.identity(),
+      u_world: m4.identity(),
+      u_viewProjection: viewProjectionMatrix,
      u_id: [
        ((id >>  0) & 0xFF) / 0xFF,
        ((id >>  8) & 0xFF) / 0xFF,
        ((id >> 16) & 0xFF) / 0xFF,
        ((id >> 24) & 0xFF) / 0xFF,
      ],
    },
    translation: [rand(-100, 100), rand(-100, 100), rand(-150, -50)],
    xRotationSpeed: rand(0.8, 1.2),
    yRotationSpeed: rand(0.8, 1.2),
  };
```

그리고 각 객체에 대한 행렬을 계산하는 곳에서 더 이상 뷰 투영 행렬을 포함시킬 필요가 없습니다.

```js
-function computeMatrix(viewProjectionMatrix, translation, xRotation, yRotation) {
-  let matrix = m4.translate(viewProjectionMatrix,
+function computeMatrix(translation, xRotation, yRotation) {
+  let matrix = m4.translation(
      translation[0],
      translation[1],
      translation[2]);
  matrix = m4.xRotate(matrix, xRotation);
  return m4.yRotate(matrix, yRotation);
}
...

// 각 객체에 대한 행렬 계산
objects.forEach(function(object) {
  object.uniforms.u_world = computeMatrix(
-      viewProjectionMatrix,
      object.translation,
      object.xRotationSpeed * time,
      object.yRotationSpeed * time);
});
```

1x1 픽셀 텍스처와 깊이 버퍼만 생성할 겁니다.

```js
setFramebufferAttachmentSizes(1, 1);

...

// 장면 그리기
function drawScene(time) {
  time *= 0.0005;
  ++frameCount;

-  if (webglUtils.resizeCanvasToDisplaySize(gl.canvas)) {
-    // 캔버스 크기가 바뀌었으니 프레임 버퍼 어태치먼트와 일치시킵니다.
-    setFramebufferAttachmentSizes(gl.canvas.width, gl.canvas.height);
-  }
+  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
```

그런 다음 화면 바깥의 아이디들을 렌더링하기 전에 1픽셀 투영 행렬을 사용하여 뷰 투영을 설정한 다음 캔버스에 그릴 때 원본 투영 행렬을 사용할 겁니다.

```js
-// 투영 행렬 계산
-const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
-const projectionMatrix =
-    m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

// lookAt을 사용하여 카메라 행렬 계산
const cameraPosition = [0, 0, 100];
const target = [0, 0, 0];
const up = [0, 1, 0];
const cameraMatrix = m4.lookAt(cameraPosition, target, up);

// 카메라 행렬로 뷰 행렬 만들기
const viewMatrix = m4.inverse(cameraMatrix);

-const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

// 각 객체에 대한 행렬 계산
objects.forEach(function(object) {
  object.uniforms.u_world = computeMatrix(
      object.translation,
      object.xRotationSpeed * time,
      object.yRotationSpeed * time);
});

// ------ 텍스처에 객체 그리기 --------

// 마우스 아래에 어떤 픽셀이 있는지 알아내 해당 픽셀만 렌더링하도록 절두체를 설정합니다.

{
  // 절두체의 근거리 평면 계산
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const top = Math.tan(fieldOfViewRadians * 0.5) * near;
  const bottom = -top;
  const left = aspect * bottom;
  const right = aspect * top;
  const width = Math.abs(right - left);
  const height = Math.abs(top - bottom);

  // 마우스 아래의 1픽셀을 포함하는 근거리 평면 부분 계산
  const pixelX = mouseX * gl.canvas.width / gl.canvas.clientWidth;
  const pixelY = gl.canvas.height - mouseY * gl.canvas.height / gl.canvas.clientHeight - 1;

  const subLeft = left + pixelX * width / gl.canvas.width;
  const subBottom = bottom + pixelY * height / gl.canvas.height;
  const subWidth = 1 / gl.canvas.width;
  const subHeight = 1 / gl.canvas.height;

  // 해당 1픽셀에 대한 절두체 만들기
  const projectionMatrix = m4.frustum(
      subLeft,
      subLeft + subWidth,
      subBottom,
      subBottom + subHeight,
      near,
      far);
+  m4.multiply(projectionMatrix, viewMatrix, viewProjectionMatrix);
}

gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
gl.viewport(0, 0, 1, 1);

gl.enable(gl.CULL_FACE);
gl.enable(gl.DEPTH_TEST);

// 캔버스와 깊이 버퍼 지우기
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

drawObjects(objectsToDraw, pickingProgramInfo);

// 1픽셀 읽기
-const pixelX = mouseX * gl.canvas.width / gl.canvas.clientWidth;
-const pixelY = gl.canvas.height - mouseY * gl.canvas.height / gl.canvas.clientHeight - 1;
const data = new Uint8Array(4);
gl.readPixels(
-    pixelX,            // x
-    pixelY,            // y
+    0,                 // x
+    0,                 // y
    1,                 // 너비
    1,                 // 높이
    gl.RGBA,           // 포맷
    gl.UNSIGNED_BYTE,  // 타입
    data);             // 결과를 저장할 형식화 배열
const id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24);

// 객체의 색상을 복원
if (oldPickNdx >= 0) {
  const object = objects[oldPickNdx];
  object.uniforms.u_colorMult = oldPickColor;
  oldPickNdx = -1;
}

// 마우스가 있는 곳의 객체를 하이라이트 표시
if (id > 0) {
  const pickNdx = id - 1;
  oldPickNdx = pickNdx;
  const object = objects[pickNdx];
  oldPickColor = object.uniforms.u_colorMult;
  object.uniforms.u_colorMult = (frameCount & 0x8) ? [1, 0, 0, 1] : [1, 1, 0, 1];
}

// ------ 캔버스에 객체 그리기

+{
+  // 투영 행렬 계산
+  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
+  const projectionMatrix =
+      m4.perspective(fieldOfViewRadians, aspect, near, far);
+
+  m4.multiply(projectionMatrix, viewMatrix, viewProjectionMatrix);
+}

gl.bindFramebuffer(gl.FRAMEBUFFER, null);
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

drawObjects(objectsToDraw);
```

그리고 수식이 동작하는 것을 확인할 수 있고 단일 픽셀만 그리고 있으며 여전히 마우스 아래에 무엇이 있는지 알아내고 있습니다.

{{{example url="../webgl-picking-w-gpu-1pixel.html"}}}


Title: WebGL 다중 뷰, 다중 캔버스
Description: 다중 뷰 그리기
TOC: 다중 뷰, 다중 캔버스


이 글은 예제를 정리하기 위해 [유틸리티 함수에 대한 글](webgl-less-code-more-fun.html)에서 언급한 라이브러리를 사용합니다.
`webglUtils.setBuffersAndAttributes`라는 함수가 버퍼와 속성을 설정하는 게 어떤 의미인지, `webglUtils.setUniforms`라는 함수가 유니폼을 설정하는 게 어떤 의미인지 모르겠다면, 뒤로 돌아가 [기초](webgl-fundamentals.html)를 먼저 읽어주세요.

같은 장면을 여러 뷰로 그리고 싶다고 가정했을 때, 어떻게 할 수 있을까요?
한 가지 방법은 [텍스처로 렌더링](webgl-render-to-texture.html)한 다음 텍스처를 캔버스에 그리는 겁니다.
이는 확실히 유효한 방법이고 그렇게 하는 게 맞을 때도 있습니다.
하지만 텍스처를 할당하고, 텍스처에 물체를 렌더링한 다음, 텍스처를 캔버스에 렌더링해야 합니다.
이는 사실상 두 번 렌더링한다는 의미인데요.
예를 들어 레이싱 게임에서 백미러의 뷰를 렌더링하고 싶을 때 차 뒤에 있는 것을 텍스처에 렌더링한 다음 해당 텍스처를 사용하여 백미러에 그리는 게 적절할 수 있습니다.

또 다른 방법은 뷰포트를 설정하고 시저 테스트를 켜는 겁니다.
이건 뷰가 겹치지 않는 상황에서 좋습니다.
게다가 위 해결책처럼 이중 렌더링이 없습니다.

[첫 글](webgl-fundamentals.html)에서 다음과 같이 호출하여 WebGL이 클립 공간에서 픽셀 공간으로 변환하는 방법을 설정한다고 언급했었습니다.

```js
gl.viewport(left, bottom, width, height);
```

가장 일반적인 방법은 캔버스 전체를 덮도록 각각 `0`, `0`, `gl.canvas.width`, `gl.canvas.height`로 설정하는 겁니다.

캔버스의 일부분으로 설정하여 해당 부분만 그리도록 만들 수도 있습니다.
WebGL은 클립 공간에서 정점을 클리핑하는데요.
이전에 언급했던 것처럼 정점 셰이더에서 `gl_Position`의 x, y, z를 -1에서 +1사이의 값으로 설정합니다.
WebGL은 우리가 전달한 삼각형과 선을 해당 범위로 클리핑합니다.
클리핑이 발생한 후에 `gl.viewport` 설정이 적용되므로 다음과 같이 사용할 경우,

```js
gl.viewport(
   10,   // 왼쪽
   20,   // 아래쪽
   30,   // 너비
   40,   // 높이
);
```

클립 공간 값 x = -1은 픽셀 x = 10에 해당하고 클립 공간 값 x = +1은 픽셀 x = 40(왼쪽인 10에서 너비인 30을 더함)에 해당합니다. (사실 이건 좀 지나친 단순화인데, [아래 내용](#pixel-coords)을 봐주세요)

따라서 클리핑 후에 삼각형을 그리면 뷰포트 안쪽에 딱 맞도록 나타날 겁니다.

[이전 글](webgl-3d-perspective.html)의 'F'를 그려봅시다.

정점 셰이더와 프래그먼트 셰이더는 [직교 투영](webgl-3d-orthographic.html)과 [원근 투영](webgl-3d-perspective.html)에 대한 글에서 사용한 것과 동일합니다.

```glsl
// 정점 셰이더
attribute vec4 a_position;
attribute vec4 a_color;

uniform mat4 u_matrix;

varying vec4 v_color;

void main() {
  // 위치에 행렬 곱하기
  gl_Position = u_matrix * a_position;

  // 프래그먼트 셰이더로 정점 색상 전달
  v_color = a_color;
}
```

```glsl
// 프래그먼트 셰이더
precision mediump float;

// 정점 셰이더에서 전달됩니다.
varying vec4 v_color;

void main() {
  gl_FragColor = v_color;
}
```

초기화할 때 'F'에 대한 프로그램과 버퍼를 생성해야 합니다.

```js
// GLSL 프로그램 설정
// 셰이더 컴파일, 프로그램 연결, 위치 조회
const programInfo = webglUtils.createProgramInfo(gl, ["vertex-shader-3d", "fragment-shader-3d"]);

// 버퍼를 생성하고 3D 'F'에 대한 데이터로 채우기
const bufferInfo = primitives.create3DFBufferInfo(gl);
```

그리기 위해 투영 행렬, 카메라 행렬, 월드 행렬을 전달할 수 있는 함수를 만들어 보겠습니다.

```js
function drawScene(projectionMatrix, cameraMatrix, worldMatrix) {
  // 카메라 행렬로 뷰 행렬을 만듭니다.
  const viewMatrix = m4.inverse(cameraMatrix);
 
  // 그것들을 전부 곱해서 worldViewProjection 행렬을 만듭니다.
  let mat = m4.multiply(projectionMatrix, viewMatrix);
  mat = m4.multiply(mat, worldMatrix);
 
  gl.useProgram(programInfo.program);
 
  // ------ F 그리기 --------
 
  // 필요한 모든 속성 설정
  webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);
 
  // 유니폼 설정
  webglUtils.setUniforms(programInfo, {
    u_matrix: mat,
  });
 
  // gl.drawArrays 혹은 gl.drawElements 호출
  webglUtils.drawBufferInfo(gl, bufferInfo);
}
```

그런 다음 F를 그리는 함수를 호출합니다.

```js
function degToRad(d) {
  return d * Math.PI / 180;
}

const settings = {
  rotation: 150,  // 도 단위
};
const fieldOfViewRadians = degToRad(120);

function render() {
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const near = 1;
  const far = 2000;

  // 원근 투영 행렬 계산
  const perspectiveProjectionMatrix =
      m4.perspective(fieldOfViewRadians, aspect, near, far);

  // lookAt을 사용하여 카메라 행렬 계산
  const cameraPosition = [0, 0, -75];
  const target = [0, 0, 0];
  const up = [0, 1, 0];
  const cameraMatrix = m4.lookAt(cameraPosition, target, up);

  // 월드 공간에서 F 회전
  let worldMatrix = m4.yRotation(degToRad(settings.rotation));
  worldMatrix = m4.xRotate(worldMatrix, degToRad(settings.rotation));
  // 'F'를 원점 중심으로 이동
  worldMatrix = m4.translate(worldMatrix, -35, -75, -5);

  drawScene(perspectiveProjectionMatrix, cameraMatrix, worldMatrix);
}
render();
```

코드를 단순하게 유지하기 위한 [라이브러리](webgl-less-code-more-fun.html)를 사용했다는 걸 제외하면 [원근에 대한 글](webgl-3d-perspective.html)의 마지막 예제와 동일합니다.

{{{example url="../webgl-multiple-views-one-view.html"}}}

`gl.viewport`를 사용하여 'F' 뷰 2개를 나란히 그려봅시다.

```js
function render() {
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

-  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  // 뷰를 2개로 나눌 겁니다.
-  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
+  const effectiveWidth = gl.canvas.clientWidth / 2;
+  const aspect = effectiveWidth / gl.canvas.clientHeight;
  const near = 1;
  const far = 2000;

  // 원근 투영 행렬 계산
  const perspectiveProjectionMatrix =
      m4.perspective(fieldOfViewRadians, aspect, near, far);

+  // 직교 투영 행렬 계산
+  const halfHeightUnits = 120;
+  const orthographicProjectionMatrix = m4.orthographic(
+      -halfHeightUnits * aspect,  // 왼쪽
+       halfHeightUnits * aspect,  // 오른쪽
+      -halfHeightUnits,           // 아래쪽
+       halfHeightUnits,           // 위쪽
+       -75,                       // 근거리
+       2000);                     // 원거리

  // lookAt을 사용하여 카메라 행렬 계산
  const cameraPosition = [0, 0, -75];
  const target = [0, 0, 0];
  const up = [0, 1, 0];
  const cameraMatrix = m4.lookAt(cameraPosition, target, up);

  let worldMatrix = m4.yRotation(degToRad(settings.rotation));
  worldMatrix = m4.xRotate(worldMatrix, degToRad(settings.rotation));
  // 'F'를 원점 중심으로 이동
  worldMatrix = m4.translate(worldMatrix, -35, -75, -5);

+  const {width, height} = gl.canvas;
+  const leftWidth = width / 2 | 0;
+
+  // 직교 카메라로 왼쪽에 그리기
+  gl.viewport(0, 0, leftWidth, height);
+
+  drawScene(orthographicProjectionMatrix, cameraMatrix, worldMatrix);

+  // 원근 카메라로 오른쪽에 그리기
+  const rightWidth = width - leftWidth;
+  gl.viewport(leftWidth, 0, rightWidth, height);

  drawScene(perspectiveProjectionMatrix, cameraMatrix, worldMatrix);
}
```

위에서 먼저 캔버스의 왼쪽 절반을 덮기 위해 뷰포트를 설정하고, 그린 다음, 오른쪽 절반을 덮고 그리도록 설정한 것을 볼 수 있습니다.
그렇지 않으면 변경한 투영 행렬을 제외하고 양쪽 면에 동일한 것을 그립니다.

{{{example url="../webgl-multiple-views.html"}}}

양쪽 면을 다른 색상으로 지워봅시다.

먼저 `drawScene`에서 `gl.clear`를 호출합니다.

```js
  function drawScene(projectionMatrix, cameraMatrix, worldMatrix) {
+    // 캔버스와 깊이 버퍼 지우기
+    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    ...
```

그런 다음 `drawScene` 호출 전에 이렇게 합니다.

```js
  const {width, height} = gl.canvas;
  const leftWidth = width / 2 | 0;

  // 직교 카메라로 왼쪽에 그리기
  gl.viewport(0, 0, leftWidth, height);
+  gl.clearColor(1, 0, 0, 1);  // 빨간색

  drawScene(orthographicProjectionMatrix, cameraMatrix, worldMatrix);

  // 원근 카메라로 오른쪽에 그리기
  const rightWidth = width - leftWidth;
  gl.viewport(leftWidth, 0, rightWidth, height);
  gl.clearColor(0, 0, 1, 1);  // 파란색

+  drawScene(perspectiveProjectionMatrix, cameraMatrix, worldMatrix);
```

{{{example url="../webgl-multiple-views-clear-issue.html"}}}

이런 무슨 일이 일어난 걸까요?
왜 왼쪽에는 아무것도 없는거죠?

알고보니 `gl.clear`가 `viewport` 설정을 확인하지 않고 있습니다.
이걸 고치기 위해 *시저 테스트*를 사용할 수 있는데요.
시저 테스트에서는 사각형을 정의할 수 있습니다.
시저 테스트가 활성화되어 있다면 해당 사각형 바깥에 있는 것들은 영향을 받지 않습니다.

시저 테스트는 기본적으로 꺼져 있는데요.
아래의 함수를 호출하여 활성화할 수 있습니다

```
gl.enable(gl.SCISSOR_TEST);
```

뷰포트처럼 캔버스의 초기 크기를 기본 값으로 하지만 `gl.scissor`를 호출하여 뷰포트와 동일한 매개변수로 설정할 수 있습니다.

```js
gl.scissor(
   10,   // 왼쪽
   20,   // 아래쪽
   30,   // 너비
   40,   // 높이
);
```

그럼 여기에 추가해봅시다.

```js
function render() {
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
+  gl.enable(gl.SCISSOR_TEST);

  ...

  const {width, height} = gl.canvas;
  const leftWidth = width / 2 | 0;

  // 직교 카메라로 왼쪽에 그리기
  gl.viewport(0, 0, leftWidth, height);
+  gl.scissor(0, 0, leftWidth, height);
  gl.clearColor(1, 0, 0, 1);  // 빨간색

  drawScene(orthographicProjectionMatrix, cameraMatrix, worldMatrix);

  // 원근 카메라로 오른쪽에 그리기
  const rightWidth = width - leftWidth;
  gl.viewport(leftWidth, 0, rightWidth, height);
+  gl.scissor(leftWidth, 0, rightWidth, height);
  gl.clearColor(0, 0, 1, 1);  // 파란색

  drawScene(perspectiveProjectionMatrix, cameraMatrix, worldMatrix);
}
```

이제 작동합니다.

{{{example url="../webgl-multiple-views-clear-fixed.html"}}}

물론 같은 장면을 그리는 것에 국한된 것은 아닙니다.
각 뷰에 여러분이 원하는 것을 그릴 수 있습니다.

## 여러 캔버스 그리기

이건 여러 캔버스를 시뮬레이션하는 데 좋은 솔루션입니다.
여러분이 게임의 캐릭터 선택 화면을 만들고 유저가 하나를 선택할 수 있도록 각각의 3D 모델을 목록에 표시하고 싶다고 해봅시다.
혹은 이커머스 사이트를 만들어 각 상품의 3D 모델을 보여주고 싶다고 가정해 보겠습니다.

가장 확실한 방법은 항목을 보여주고 싶은 곳마다 `<canvas>`를 놓는 겁니다.
하지만 안타깝게도 많은 문제에 부딪히는데요.

먼저 각 캔버스는 다른 WebGL 컨텍스트를 필요로 하고, WebGL 컨텍스트는 리소스를 공유할 수 없으므로, 각 캔버스의 셰이더를 컴파일하고, 각 캔버스의 텍스처를 로드한 다음, 각 캔버스의 지오메트리를 업로드해야 합니다.

또 다른 문제는 대부분의 브라우저가 동시 지원 캔버스 수에 제한이 있다는 겁니다.
많은 경우에 최대 컨텍스트가 8개 정도로 적은데요.
즉 9번째 캔버스의 WebGL 컨텍스트를 생성함과 동시에 첫 번째 캔버스는 컨텍스트를 잃게 됩니다.

창 전체를 덮는 커다란 캔버스를 만들어 이러한 문제를 해결할 수 있습니다.
그런 다음 항목을 그리고 싶은 곳마다 플레이스홀더 `<div>`를 넣습니다.
[`element.getBoundingClientRect`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect)를 사용하여 해당 영역에서 그릴 뷰포트와 시저를 설정한 위치를 찾을 수 있습니다.

이렇게 하면 위에서 언급한 문제가 모두 해결됩니다.
하나의 WebGL 컨텍스트만 있으므로 리소스를 공유할 수 있고 컨텍스트 제한에 막히지 않습니다.

예제를 만들어 보겠습니다.

First let's make a canvas that goes in the background with some content that goes in front.
첫 번째는 HTML입니다.

```html
<body>
  <canvas id="canvas"></canvas>
  <div id="content"></div>
</body>
```

다음은 CSS입니다.

```css
body {
  margin: 0;
}
#content {
  margin: 10px;
}
#canvas {
  position: absolute;
  top: 0;
  width: 100%;
  height: 100vh;
  z-index: -1;
  display: block;
}
```

이제 몇 가지 그릴 것들을 만들어 보겠습니다.
[`BufferInfo`](webgl-less-code-more-fun.html)는 이름별 버퍼 목록일 뿐이고 설정에는 해당 속성을 설정해야 합니다.

```js
// 버퍼를 생성하고 다양한 데이터를 채웁니다.
const bufferInfos = [
  primitives.createCubeBufferInfo(
      gl,
      1,  // 너비
      1,  // 높이
      1,  // 깊이
  ),
  primitives.createSphereBufferInfo(
      gl,
      0.5,  // 반지름
      8,    // 둘레 세분화
      6,    // 수직 세분화
  ),
  primitives.createTruncatedConeBufferInfo(
      gl,
      0.5,  // 아래쪽 반지름
      0,    // 위쪽 반지름
      1,    // 높이
      6,    // 둘레 세분화
      1,    // 수직 세분화
  ),
];
```

이제 100개의 HTML 항목을 만들어 보겠습니다.
각각에 대해 컨테이너 `div`를 만들고 내부에는 뷰와 레이블이 만듭니다.
뷰는 항목을 그리려는 하는 빈 `div` 요소입니다.

```js
function createElem(type, parent, className) {
  const elem = document.createElement(type);
  parent.appendChild(elem);
  if (className) {
    elem.className = className;
  }
  return elem;
}

function randArrayElement(array) {
  return array[Math.random() * array.length | 0];
}

function rand(min, max) {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return Math.random() * (max - min) + min;
}

const contentElem = document.querySelector('#content');
const items = [];
const numItems = 100;
for (let i = 0; i < numItems; ++i) {
  const outerElem = createElem('div', contentElem, 'item');
  const viewElem = createElem('div', outerElem, 'view');
  const labelElem = createElem('div', outerElem, 'label');
  labelElem.textContent = `Item ${i + 1}`;
  const bufferInfo = randArrayElement(bufferInfos);
  const color = [rand(1), rand(1), rand(1), 1];
  items.push({
    bufferInfo,
    color,
    element: viewElem,
  });
}
```

다음과 같이 항목들의 스타일을 지정해봅시다.

```css
.item {
  display: inline-block;
  margin: 1em;
  padding: 1em;
}
.label {
  margin-top: 0.5em;
}
.view {
  width: 250px;
  height: 250px;
  border: 1px solid black;
}
```

`items` 배열은 각 항목에 대한 `bufferInfo`, `color`, `element`를 가집니다.
모든 항목을 한 번에 하나씩 반복하여 [`element.getBoundingClientRect`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect)를 호출하고 반환된 사각형을 사용하여 해당 요소가 캔버스와 교차하는지 확인합니다.
그렇다면 뷰포트와 시저가 일치하도록 설정한 다음 해당 객체를 그립니다.

```js
function render(time) {
  time *= 0.001;  // 초 단위로 변환

  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.SCISSOR_TEST);

  // 캔버스를 현재 스크롤 위치의 상단으로 이동
  gl.canvas.style.transform = `translateY(${window.scrollY}px)`;

  for (const {bufferInfo, element, color} of items) {
    const rect = element.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top  > gl.canvas.clientHeight ||
        rect.right  < 0 || rect.left > gl.canvas.clientWidth) {
      continue;  // 화면을 벗어남
    }

    const width  = rect.right - rect.left;
    const height = rect.bottom - rect.top;
    const left   = rect.left;
    const bottom = gl.canvas.clientHeight - rect.bottom;

    gl.viewport(left, bottom, width, height);
    gl.scissor(left, bottom, width, height);
    gl.clearColor(...color);

    const aspect = width / height;
    const near = 1;
    const far = 2000;

    // 원근 투영 행렬 계산
    const perspectiveProjectionMatrix =
        m4.perspective(fieldOfViewRadians, aspect, near, far);

    // lookAt을 사용하여 카메라 행렬 계산
    const cameraPosition = [0, 0, -2];
    const target = [0, 0, 0];
    const up = [0, 1, 0];
    const cameraMatrix = m4.lookAt(cameraPosition, target, up);

    // 항목 회전
    const rTime = time * 0.2;
    const worldMatrix = m4.xRotate(m4.yRotation(rTime), rTime);

    drawScene(perspectiveProjectionMatrix, cameraMatrix, worldMatrix, bufferInfo);
  }
  requestAnimationFrame(render);
}
requestAnimationFrame(render);
```

위 코드에서 [requestAnimationFrame 루프](webgl-animation.html)를 사용하여 객체에 애니메이션을 적용할 수 있도록 만들었습니다.
또한 그리려는 `bufferInfo`를 `drawScene`에 전달했습니다.
그리고 셰이더를 단순하게 유지하기 위해 법선을 색상으로 사용하고 있습니다.
[조명](webgl-3d-lighting-spot.html)을 추가하면 코드는 훨씬 복잡해집니다.

{{{example url="../webgl-multiple-views-items.html"}}}

물론 각 항목에 대한 전체 3D 장면이나 그 비슷한 무엇이든 그릴 수 있습니다.
뷰포트와 시저를 정확하게 설정한 다음 영역의 비율이 일치하도록 투영 행렬을 설정하는 한 작동합니다.

코드에서 한 가지 더 주목할 만한 점은 이 라인으로 캔버스를 움직이고 있다는 겁니다.

```js
gl.canvas.style.transform = `translateY(${window.scrollY}px)`;
```

대신 캔버스를 `position: fixed;`로 설정할 수 있는데, 이 경우에는 페이지에 따라 스크롤되지 않습니다.
차이는 미묘할 겁니다.
브라우저는 최대한 부드럽게 페이즈를 스크롤하려고 합니다.
그건 물체를 그리는 것보다 빠를 수도 있습니다.
이것 때문에 2가지 옵션이 있습니다.

1. 위치가 고정된 캔버스 사용

   이 경우 충분히 빠르게 업데이트할 수 없다면 캔버스 앞의 HTML이 스크롤되지만 캔버스 자체는 잠시동안 동기화되지 않습니다.

   <img src="resources/multi-view-skew.gif" style="border: 1px solid black; width: 266px;" class="webgl_center">

2. 컨텐츠 아래로 캔버스 이동

   이 경우 충분히 빠르게 업데이트할 수 없다면 캔버스는 HTML과 동기화되어 스크롤되지만 물체를 그리려는 새로운 영역은 그릴 기회를 얻을 때까지 비어있게 됩니다.

   <img src="resources/multi-view-fixed.gif" style="border: 1px solid black; width: 266px;" class="webgl_center">

   이게 위에서 사용한 솔루션입니다.

가로 스크롤을 처리하고 싶다면 이 라인을 바꾸면 되는데요.

```js
gl.canvas.style.transform = `translateY(${window.scrollY}px)`;
```

이렇게 변경합니다.

```js
gl.canvas.style.transform = `translateX(${window.scrollX}px) translateY(${window.scrollY}px)`;
```

{{{example url="../webgl-multiple-views-items-horizontal-scrolling.html"}}}

이 글이 다중 뷰 그리는 방법을 이해하는 데 도움이 되었길 바랍니다.
앞으로 다중 뷰를 보는 것이 이해하는 데 유용한 글에서 이러한 기술을 사용할 겁니다.

<div class="webgl_bottombar" id="pixel-coords">
<h3>픽셀 좌표</h3>
<p>
WebGL에서 픽셀 좌표는 가장자리로 참조됩니다.
예를 들어 3x2 픽셀 크기의 캔버스가 있고 이렇게 뷰포트를 설정한다고 가정해봅시다.
</p>
<pre class="prettyprint"><code>
gl.viewport(
  0, // 왼쪽
  0, // 아래쪽
  3, // 너비
  2, // 높이
);
</code></pre>
<p>그런 다음 실제로 3x2 픽셀을 둘러싸는 사각형을 정의합니다.</p>
<div class="webgl_center"><img src="resources/webgl-pixels.svg" style="width: 500px;"></div>
<p>
클립 공간 값 X = -1.0은 이 사각형의 왼쪽 가장자리에 해당하고 클립 공간 값 X = 1.0은 오른쪽에 해당합니다.
위에서 -1.0은 가장 왼쪽 픽셀에 해당하지만 실제로는 왼쪽 가장자리에 해당한다고 말했습니다.
</p>
</div>


Title: WebGL 2D Translation
Description: 2D에서 이동하는 방법
TOC: 2D Translation


3D로 넘어가기 전에 잠시 2D를 사용해봅시다.
끝까지 함께 해주세요.
어떤 분들에게는 이 글이 굉장히 당연하겠지만 몇 가지 글들의 요점을 써보려고 합니다.

이 글은 [WebGL 기초](webgl-fundamentals.html)로 시작하는 시리즈의 연장입니다.
아직 읽지 않았다면 적어도 첫 번째 글을 먼저 읽고, 다시 여기로 돌아오는 게 좋습니다.

translation은 기본적으로 무언가를 "움직이는 걸" 의미하는 멋진 수학적 명칭인데요.
문장을 영어에서 일본어로 옮기는 것도 맞지만 이 경우 기하학적 이동을 말합니다.
[첫 번째 포스트](webgl-fundamentals.html)에서 끝낸 샘플 코드를 사용하면 setRectangle에 전달되는 값을 변경하는 것 만으로 쉽게 사각형을 이동할 수 있었죠?
다음은 [이전 샘플](webgl-fundamentals.html)에 기반한 샘플입니다.

먼저 사각형의 translation, 너비, 높이 그리고 색상을 담을 변수를 만들면

```
  var translation = [0, 0];
  var width = 100;
  var height = 30;
  var color = [Math.random(), Math.random(), Math.random(), 1];
```

그런 다음 전부 다시 그리는 함수를 만들어봅시다.
translation을 갱신한 후에 이 함수를 호출할 수 있습니다.

```
  // scene 그리기
  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // clip 공간에서 픽셀로 변환하는 방법을 WebGL에 지시
    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // canvas 지우기
    gl.clear(gl.COLOR_BUFFER_BIT);

    // program(shader 쌍)을 사용하도록 지시
    gl.useProgram(program);

    // attribute 활성화
    gl.enableVertexAttribArray(positionLocation);

    // position buffer 할당
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // 사각형 설정
    setRectangle(gl, translation[0], translation[1], width, height);

    // positionBuffer(ARRAY_BUFFER) 데이터 꺼내오는 방법을 attribute에 지시
    var size = 2;          // 반복마다 2개의 구성 요소
    var type = gl.FLOAT;   // 데이터는 32bit 부동 소수점
    var normalize = false; // 데이터 정규화 안 함
    var stride = 0;        // 0 = 다음 위치를 구하기 위해 반복마다 size * sizeof(type) 만큼 앞으로 이동
    var offset = 0;        // buffer의 처음부터 시작
    gl.vertexAttribPointer(
      positionLocation, size, type, normalize, stride, offset);

    // 해상도 설정
    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

    // 색상 설정
    gl.uniform4fv(colorLocation, color);

    // 사각형 그리기
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
  }
```

아래의 예제에서 `translation[0]`과 `translation[1]`을 갱신하고 변경할 때마다 `drawScene`을 호출하는 슬라이더 몇 개를 첨부했는데요.
사각형을 이동시키기 위해 슬라이더를 드래그해봅시다.

{{{example url="../webgl-2d-rectangle-translate.html" }}}

지금까지는 그럭저럭 잘 됐습니다.
하지만 더 복잡한 모양으로 똑같은 일을 하는 걸 상상해보세요.

이처럼 삼각형 6개로 구성된 'F'를 그려야 한다고 가정해봅시다.

<img src="../resources/polygon-f.svg" width="200" height="270" class="webgl_center">

이제 현재 코드에 맞춰서 `setRectangle`을 이렇게 변경해야합니다.

```
// 문자 'F'를 정의하는 값들로 버퍼 채우기
function setGeometry(gl, x, y) {
  var width = 100;
  var height = 150;
  var thickness = 30;
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          // 왼쪽 열
          x, y,
          x + thickness, y,
          x, y + height,
          x, y + height,
          x + thickness, y,
          x + thickness, y + height,

          // top rung
          x + thickness, y,
          x + width, y,
          x + thickness, y + thickness,
          x + thickness, y + thickness,
          x + width, y,
          x + width, y + thickness,

          // middle rung
          x + thickness, y + thickness * 2,
          x + width * 2 / 3, y + thickness * 2,
          x + thickness, y + thickness * 3,
          x + thickness, y + thickness * 3,
          x + width * 2 / 3, y + thickness * 2,
          x + width * 2 / 3, y + thickness * 3,
      ]),
      gl.STATIC_DRAW);
}
```

확장하기에는 그다지 좋지 않다는 걸 보실 수 있을텐데요.
수백 또는 수천 줄의 매우 복잡한 형상을 그리려면 제법 복잡한 코드를 작성해야 합니다.
이것 뿐만 아니라, JavaScript를 그릴 때마다 모든 점들을 갱신해야 합니다.

보다 더 간단한 방법이 있는데요.
geometry를 업로드하고 shader에서 이동하면 됩니다.

여기 새로운 shader가 있습니다.

```
<script id="vertex-shader-2d" type="x-shader/x-vertex">
attribute vec2 a_position;

uniform vec2 u_resolution;
+uniform vec2 u_translation;

void main() {
*   // Add in the translation.
*   vec2 position = a_position + u_translation;

   // convert the rectangle from pixels to 0.0 to 1.0
*   vec2 zeroToOne = position / u_resolution;
   ...
```

그리고 코드를 조금 재구성할 건데요.
하나는 geometry를 한 번만 설정해도 된다는 겁니다.

```
// 문자 'F'를 정의하는 값들로 버퍼 채우기
function setGeometry(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          // 왼쪽 열
          0, 0,
          30, 0,
          0, 150,
          0, 150,
          30, 0,
          30, 150,

          // top rung
          30, 0,
          100, 0,
          30, 30,
          30, 30,
          100, 0,
          100, 30,

          // middle rung
          30, 60,
          67, 60,
          30, 90,
          30, 90,
          67, 60,
          67, 90,
      ]),
      gl.STATIC_DRAW);
}
```

그러면 우리가 원하는 이동을 해서 그리기 전에 `u_translation`을 갱신시키기만 하면 됩니다.

```
  ...

+  var translationLocation = gl.getUniformLocation(program, "u_translation");

  ...

  // 위치들을 넣을 버퍼 생성
  var positionBuffer = gl.createBuffer();
  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
+  // 버퍼에 geometry 넣기
+  setGeometry(gl);

  ...

  // 화면 그리기
  function drawScene() {

    ...

+    // 이동 설정
+    gl.uniform2fv(translationLocation, translation);

    // 사각형 그리기
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
*    var count = 18;
    gl.drawArrays(primitiveType, offset, count);
  }
```

`setGeometry`는 한 번만 호출된다는 걸 알아두세요.
더 이상 `drawScene` 안에 있지 않습니다.

그리고 여기 예제가 있습니다.
다시, 이동 값을 갱신시키기 위해 슬라이더를 드래그해보세요.

{{{example url="../webgl-2d-geometry-translate-better.html" }}}

이제 그릴 때, WebGL이 거의 모든 걸 하고 있습니다.
우리가 하는 것은 이동 값을 설정하고 그려달라고 요청하는 것이 전부입니다.
geometry에 수십만 개의 점들이 있더라도 주요 코드는 그대로 유지되죠.

원한다면 [위의 복잡한 JavaScript를 사용해서 모든 점들을 갱신하는 버전](../webgl-2d-geometry-translate.html)과 비교할 수 있습니다.

여기 있는게 너무 흔한 예제가 아니었기를 바랍니다.
다른 한편으로는 결국 이 작업을 하는 훨씬 더 좋은 방법으로 나아갈 것이기 때문에 계속 읽어주세요.
다음 글에서는 [회전에 대해 알아보겠습니다](webgl-2d-rotation.html).

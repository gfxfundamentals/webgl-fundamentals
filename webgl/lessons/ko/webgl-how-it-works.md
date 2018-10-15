Title: WebGL 작동 원리
Description: WebGL은 실제로 어떻게 작동하나요?

이건 [WebGL Fundamentals](webgl-fundamentals.html)에서 이어지는 글입니다.
이어서 하기 전에 WebGL과 GPU가 실제로 기본적인 수준에서 어떤 걸 하는지 얘기해봅시다.
기본적으로 GPU에는 2가지 부분이 있습니다.
첫 번째는 vertex(또는 데이터 스트림)를 clip 공간의 vertex로 처리합니다.
두 번째는 처음한 것을 기반으로 픽셀을 그립니다.

호출할 때

    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 9;
    gl.drawArrays(primitiveType, offset, count);

여기서 9는 "vertex 9개 처리"를 의미하므로 vertex 9개가 처리됩니다.

<img src="../resources/vertex-shader-anim.gif" class="webgl_center" />

왼쪽에는 당신이 제공한 데이터가 있습니다.
vertex shader는 [GLSL](webgl-shaders-and-glsl.html)로 작성하는 함수인데요.
이 함수는 각 vertex마다 한 번씩 호출됩니다.
몇몇 수학적 계산을 하고 현재 vertex의 clip 공간 값을 가진 특수 변수 `gl_Position`를 선언합니다.
GPU는 이 값을 내부적으로 저장합니다.

`삼각형`을 그린다고 가정하면, 첫 부분에서 꼭지점 3개를 생성할 때마다 GPU는 이걸 이용해 삼각형을 만듭니다.
어떤 픽셀이 삼각형의 점 3개에 해당하는지 확인하고, 삼각형을 rasterization(="픽셀에 그리기") 하는데요.
각 픽셀마다 fragment shader를 호출해서 어떤 색상으로 할지 묻습니다.
fragment shader는 특수 변수 `gl_FragColor`를 픽셀에 필요한 색상으로 설정해야 합니다.

모든 것들이 흥미롭지만 예제에서 볼 수 있듯이 fragment shader는 픽셀당 아주 적은 정보를 가지고 있습니다.
운 좋게도 우리는 더 많은 정보를 fragment shader에 넘길 수 있습니다.
vertex shader에서 fragment shader로 전달하고자 하는 각 값에 “varying”을 정의하는건데요.

간단한 예시로, 우리가 직접 계산한 clip 공간 좌표를 vertex shader에서 fragment shader로 전달해봅시다.


간단하게 삼각형을 그려볼 건데요.
[이전 예제](webgl-2d-matrices.html)에서 계속해서 사각형을 삼각형으로 바꿔봅시다.

    // 삼각형을 정의한 값들로 버퍼 채우기
    function setGeometry(gl) {
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
             0, -100,
           150,  125,
          -175,  100
        ]),
        gl.STATIC_DRAW
      );
    }

그리고 꼭지점 3개만 그립니다.

    // scene 그리기
    function drawScene() {
      ...
      // geometry 그리기
      var primitiveType = gl.TRIANGLES;
      var offset = 0;
      var count = 3;
      gl.drawArrays(primitiveType, offset, count);
    }

다음으로 vertex shader에서 fragment shader로 데이터를 넘기기 위해 *varying*을 선언합니다.

    varying vec4 v_color;
    ...
    void main() {
      // 위치에 행렬 곱하기
      gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);

      // clip 공간에서 색상 공간으로 변환
      // clip 공간은 -1.0에서 +1.0까지 입니다.
      // 색상 공간은 0.0부터 1.0까지 입니다.
    *  v_color = gl_Position * 0.5 + 0.5;
    }

그런 다음 fragment shader에 같은 *varying*을 선언합니다.

    precision mediump float;

    *varying vec4 v_color;

    void main() {
    *  gl_FragColor = v_color;
    }

WebGL은 vertex shader의 varying을 같은 이름을 가진 fragment shader의 varying으로 연결할 겁니다.

여기 실제 버전입니다.

{{{example url="../webgl-2d-triangle-with-position-for-color.html" }}}

삼각형을 이동, 회전 그리고 크기 조정해보세요.
참고로 색상은 clip 공간에서 계산되므로 삼각형과 함께 움직이지 않습니다.
그래서 삼각형의 색상은 배경에 상대적입니다.

자 이제 생각해봅시다.
우리는 오직 꼭지점 3개만 계산했습니다.
vertex shader는 3번만 호출되기 때문에 3개의 색을 계산하지만 삼각형은 다양한 색상을 사용합니다.
이게 *varying*이라고 불리는 이유입니다.

WebGL은 각 vertex를 계산한 값 3개를 가져오고 삼각형을 rasterization 할 때 vertex에 대해 계산한 값 사이를 보간합니다.
그리고 각 픽셀마다 fragment shader를 해당 픽셀이 보간된 값과 함께 호출합니다.

위 예제에서 우리는 vertex 3개로 시작했습니다.

<style>
table.vertex_table {
  border: 1px solid black;
  border-collapse: collapse;
  font-family: monospace;
  font-size: small;
}

table.vertex_table th {
  background-color: #88ccff;
  padding-right: 1em;
  padding-left: 1em;
}

table.vertex_table td {
  border: 1px solid black;
  text-align: right;
  padding-right: 1em;
  padding-left: 1em;
}
</style>
<div class="hcenter">
<table class="vertex_table">
<tr><th colspan="2">Vertex</th></tr>
<tr><td>0</td><td>-100</td></tr>
<tr><td>150</td><td>125</td></tr>
<tr><td>-175</td><td>100</td></tr>
</table>
</div>

vertex shader는 행렬을 이동, 회전, 크기 조절에 적용하고 clip 공간으로 변환하는데요.
이동, 회전 그리고 크기 조정의 기본값은 이동 = (x:200, y:150), 회전 = 0, 크기 조정 = 1이므로 실제로는 이동만 합니다.
주어진 backbuffer는 400x300이고 vertex shader는 행렬을 적용한 뒤 다음과 같은 clip 공간 vertex 3개를 계산합니다.

<div class="hcenter">
<table class="vertex_table">
<tr><th colspan="3">gl_Position에 작성된 값</th></tr>
<tr><td>0.000</td><td>0.660</td></tr>
<tr><td>0.750</td><td>-0.830</td></tr>
<tr><td>-0.875</td><td>-0.660</td></tr>
</table>
</div>

또한 색상 공간으로 변환하고 이것들을 우리가 선언한 *varying* v_color에 작성합니다.

<div class="hcenter">
<table class="vertex_table">
<tr><th colspan="3">v_color에 작성된 값</th></tr>
<tr><td>0.5000</td><td>0.830</td><td>0.5</td></tr>
<tr><td>0.8750</td><td>0.086</td><td>0.5</td></tr>
<tr><td>0.0625</td><td>0.170</td><td>0.5</td></tr>
</table>
</div>

그런 다음 v_color에 작성된 값 3개가 보간되어 각 픽셀의 fragment shader로 전달됩니다.

{{{diagram url="resources/fragment-shader-anim.html" caption="v_color is interpolated between v0, v1 and v2" }}}

또한 vertex shader에 더 많은 데이터를 넘길 수 있고 그것을 fragment shader에 전달할 수 있습니다.
예를들어 2가지 색을 가진 삼각형 2개로 이루어진 사각형을 그린다고 합시다.
이를 위해 vertex shader에 또다른 attribute를 추가하면 더 많은 데이터를 넘기고 그 데이터를 fragment shader에 직접 전달할 수 있습니다.

    attribute vec2 a_position;
    +attribute vec4 a_color;
    ...
    varying vec4 v_color;

    void main() {
       ...
      // 색상을 attribute에서 varying으로 복사
    *  v_color = a_color;
    }

이제 WebGL이 사용할 수 있게 색상들을 제공해야 합니다.

      // vertex 데이터가 필요한 곳 탐색
      var positionLocation = gl.getAttribLocation(program, "a_position");
    +  var colorLocation = gl.getAttribLocation(program, "a_color");
      ...
    +  // 색상용 buffer 생성
    +  var colorBuffer = gl.createBuffer();
    +  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    +  // 색상 설정
    +  setColors(gl);
      ...

    +// 사각형을 만들 두 삼각형의 색상으로 buffer 채우기
    +function setColors(gl) {
    +  // Pick 2 random colors.
    +  var r1 = Math.random();
    +  var b1 = Math.random();
    +  var g1 = Math.random();
    +
    +  var r2 = Math.random();
    +  var b2 = Math.random();
    +  var g2 = Math.random();
    +
    +  gl.bufferData(
    +    gl.ARRAY_BUFFER,
    +    new Float32Array([
    +      r1, b1, g1, 1,
    +      r1, b1, g1, 1,
    +      r1, b1, g1, 1,
    +      r2, b2, g2, 1,
    +      r2, b2, g2, 1,
    +      r2, b2, g2, 1
    +    ]),
    +    gl.STATIC_DRAW
    +  );
    +}

렌더링할 때 색상 attribute 설정


    +gl.enableVertexAttribArray(colorLocation);
    +
    +// 색상 buffer 할당
    +gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    +
    +// 색상 attribute에게 colorBuffer(ARRAY_BUFFER)의 데이터를 가져오는 방법 알려줌
    +var size = 4;          // 반복마다 4개 구성요소
    +var type = gl.FLOAT;   // 데이터는 32bit 부동 소수점
    +var normalize = false; // 데이터 정규화
    +var stride = 0;        // 0 = 각 반복마다 size * sizeof(type) 앞으로 이동해 다음 위치 얻기
    +var offset = 0;        // buffer의 시작점에서 시작
    +gl.vertexAttribPointer(
    +  colorLocation,
    +  size,
    +  type,
    +  normalize,
    +  stride,
    +  offset
    +);

그리고 삼각형 2개의 꼭지점 6개를 계산하도록 count를 조정

    // geometry 그리기
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    *var count = 6;
    gl.drawArrays(primitiveType, offset, count);

여기 결과물입니다.

{{{example url="../webgl-2d-rectangle-with-2-colors.html" }}}

단색 삼각형 2개가 그려지는걸 알 수 있는데요.
하지만 varying에 값이 전달되므로 삼각형을 가로질러 변형되거나 보간됩니다.
이건 각 삼각형의 vertex 3개에 모두 같은 색상을 사용했기 때문인데요.
만약에 각각의 색상을 다르게 하면 보간이 되는 것을 볼 수 있습니다.

    // 사각형을 만드는 삼각형 2개의 색상으로 buffer 채우기
    function setColors(gl) {
      // 모든 vertex를 다른 색으로 만들기
      gl.bufferData(
        gl.ARRAY_BUFFER,
    *    new Float32Array([
    *      Math.random(), Math.random(), Math.random(), 1,
    *      Math.random(), Math.random(), Math.random(), 1,
    *      Math.random(), Math.random(), Math.random(), 1,
    *      Math.random(), Math.random(), Math.random(), 1,
    *      Math.random(), Math.random(), Math.random(), 1,
    *      Math.random(), Math.random(), Math.random(), 1
    *    ]),
        gl.STATIC_DRAW
      );
    }

이제 보간된 *varying*을 봅시다.

{{{example url="../webgl-2d-rectangle-with-random-colors.html" }}}

그다지 흥미롭지는 않지만 하나 이상의 attribute를 사용하고 vertex shader에서 fragment shader로 데이터를 넘기는 방법을 보여줍니다.
[이미지 처리 예제](webgl-image-processing.html)를 살펴보면 texture 좌료를 전달하기 위해 추가적인 attribute를 전달하는 것을 볼 수 있습니다,

##buffer와 attribute 명령은 어떤 일을 하나요?

Buffer는 vertex 데이터를 GPU로 가져오는 방법입니다.
`gl.createBuffer`는 buffer를 생성합니다.
`gl.bindBuffer`는 해당 buffer를 작업할 buffer로 설정합니다.
`gl.bufferData`는 데이터를 buffer로 복사합니다.
보통 초기화할 때 위 작업들이 이루어집니다.

Buffer에 데이터가 있으면 WebGL에 어떻게 데이터를 가져오고 vertex shader의 attribute에 제공할지 알려줘야 합니다.

이를 위해, 먼저 WebGL에게 어디에 attribute를 할당했는지 물어봐야 합니다.
예를들어 위 코드에서 우리는

    // vertex 데이터가 어디로 가야하는지 탐색
    var positionLocation = gl.getAttribLocation(program, "a_position");
    var colorLocation = gl.getAttribLocation(program, "a_color");

이것도 보통 초기화할 때 수행됩니다.

attribute의 위치를 알게 되면 그리기 전에 3가지 명령어를 실행해야 하는데요.

    gl.enableVertexAttribArray(location);

이 명령어는 WebGL에게 buffer에서 데이터 받으라고 알려줍니다.

    gl.bindBuffer(gl.ARRAY_BUFFER, someBuffer);


이 명령어는 buffer를 ARRAY_BUFFER bind point에 할당합니다.
이건 WebGL 내부에 있는 전역 변수입니다.

    gl.vertexAttribPointer(
      location,
      numComponents,
      typeOfData,
      normalizeFlag,
      strideToNextPieceOfData,
      offsetIntoBuffer
    );

그리고 이 명령어는 WebGL에게 현재 ARRAY_BUFFER bind point에 할당된 buffer에서 데이터를 가져오고,
vertex 당 구성 요소들이 몇 개인지 (1 - 4), 어떤 데이터 종류인지 (`BYTE`, `FLOAT`, `INT`, `UNSIGNED_SHORT`, etc...),
한 데이터 조각에서 다음으로 건너가는데 몇 바이트를 넘어야 하는지 나타내는 stride, buffer에서 데이터까지의 거리를 나타내는 offset 등을 알려줍니다.

구성 요소의 수는 항상 1에서 4사이 입니다.

만약 데이터의 type 당 버퍼 한 개를 쓴다면 stride와 offset는 항상 0일 수 있습니다.
stride가 0이면 "type 크기와 같은 stride 사용"을 의미합니다.
offset이 0이면 "buffer의 시작점에서 시작"을 의미합니다.
0이 아닌 다른 값을 설정하면 성능 면에서 이점이 있지만 WebGL을 한계까지 몰아붙일게 아니라면 그만한 가치가 없습니다.

buffer와 attribute에 대해 정리되셨기 바랍니다.

다음 시간에는 [shader와 GLSL](webgl-shaders-and-glsl.html)를 살펴보겠습니다.

<div class="webgl_bottombar">
<h3>vertexAttribPointer의 normalizeFlag가 뭔가요?</h3>
<p>
normalize flag는 부동 소수점이 아닌 자료형을 위한 flag 입니다.
만약 false를 넘기면 값은 각자 가지고 있는 자료형으로 해석됩니다.
BYTE는 -128에서 127까지, UNSIGNED_BYTE는 0부터 255까지, SHORT는 -32768부터 32767까지 등등...
</p>
<p>
normalize flag를 true로 설정하면 BYTE(-128 ~ 127)는 -1에서 +1.0사이로, UNSIGNED_BYTE(0 ~ 255)는 0.0에서 +1.0사이로 바뀝니다.
정규화된 SHORT도 -1.0에서 +1.0사이로 바뀌며 BYTE보다 더 많은 해상도를 가지고 있습니다.
</p>
<p>
정규화된 데이터의 주 용도는 색상입니다.
대부분의 경우 색상은 0.0에서 1.0까지 가능합니다.
빨강, 초록, 파랑 그리고 alpha를 모두 소수점으로 사용하면 각 vertex 당 색상은 16byte를 사용합니다.
만약 복잡한 geometry가 있는 경우 더 많은 byte를 추가할 수 있습니다.
대신에 색상을 0은 0.0이 되고 255는 1.0이 되는 UNSIGNED_BYTE로 변환해야 합니다.
</p>
<p>
이렇게 하도록 코드를 수정해봅시다.
WebGL에 색상을 추출하는 방법을 알려줄 때 우리는
</p>
<pre class="prettyprint showlinemods">
  // colorBuffer에서 데이터를 가져오는 방법을 색상 attribute에게 알림 (ARRAY_BUFFER)
  var size = 4;                 // 반복마다 구성 요소 4개
*  var type = gl.UNSIGNED_BYTE;  // 데이터는 8bit unsigned byte
*  var normalize = true;         // 데이터 정규화
  var stride = 0;               // 0 = 각 반복마다 size * sizeof(type) 앞으로 이동해 다음 위치 얻기
  var offset = 0;               // buffer의 시작점에서 시작
  gl.vertexAttribPointer(
    colorLocation,
    size,
    type,
    normalize,
    stride,
    offset
  );
</pre>
<p>그리고 buffer를 색상으로 채울 때 우리는</p>
<pre class="prettyprint showlinemods">
// 사각형을 만드는 삼각형 2개의 색상으로 buffer 채우기
function setColors(gl) {
  // 무작위 색상 2개 선택
  // 0에서 255.99999사이 값은 Uint8Array에 저장될 때 끝이 잘립니다.
  var r1 = Math.random() * 256;
  var b1 = Math.random() * 256;
  var g1 = Math.random() * 256;
  var r2 = Math.random() * 256;
  var b2 = Math.random() * 256;
  var g2 = Math.random() * 256;

  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Uint8Array([
      r1, b1, g1, 255,
      r1, b1, g1, 255,
      r1, b1, g1, 255,
      r2, b2, g2, 255,
      r2, b2, g2, 255,
      r2, b2, g2, 255
    ]), // Uint8Array
    gl.STATIC_DRAW
  );
}
</pre>
<p>여기 예제가 있습니다.</p>
{{{example url="../webgl-2d-rectangle-with-2-byte-colors.html" }}}
</div>

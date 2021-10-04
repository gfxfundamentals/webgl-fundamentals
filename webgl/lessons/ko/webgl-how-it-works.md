Title: WebGL 작동 원리
Description: WebGL이 실제로 하는 일
TOC: 작동 원리


이건 [WebGL 기초](webgl-fundamentals.html)에서 이어지는 글입니다.
이어서 하기 전에 WebGL과 GPU가 실제로 무엇을 하는지 기본적인 수준에서 얘기해봅시다.
GPU에는 기본적으로 2가지 부분이 있는데요.
첫 번째 부분은 정점(또는 데이터 스트림)을 clip space의 정점으로 처리합니다.
두 번째 부분은 첫 번째 부분을 기반으로 픽셀을 그립니다.

호출할 때

    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 9;
    gl.drawArrays(primitiveType, offset, count);

9는 "정점 9개 처리"를 의미하므로 여기에서 9개의 정점이 처리되고 있습니다.

<img src="resources/vertex-shader-anim.gif" class="webgl_center" />

왼쪽은 여러분이 제공한 데이터입니다.
Vertex shader는 [GLSL](webgl-shaders-and-glsl.html)로 작성하는 함수인데요.
이 함수는 각 정점마다 한 번씩 호출됩니다.
몇 가지 계산을 하고 현재 정점의 clip space 값으로 특수 변수 `gl_Position`을 설정하죠.
GPU는 이 값을 가져와서 내부에 저장합니다.

`TRIANGLES`를 그린다고 가정하면, 첫 번째 부분에서 정점 3개를 생성할 때마다 GPU는 이걸 이용해 삼각형을 만듭니다.
어떤 픽셀이 삼각형의 점 3개에 해당하는지 확인한 다음, 삼각형을 래스터화(="픽셀로 그리기")하는데요.
각 픽셀마다 fragment shader를 호출해서 어떤 색상으로 만들지 묻습니다.
Fragment shader는 특수 변수 `gl_FragColor`를 해당 픽셀에 원하는 색상으로 설정해야 합니다.

전부 흥미롭지만 지금까지 예제에서 볼 수 있듯이 fragment shader는 픽셀마다 아주 적은 정보를 가지고 있습니다.
다행히 더 많은 정보를 전달할 수 있는데요.
Vertex shader에서 fragment shader로 전달하려는 각 값에 대해 “varying”을 정의하는겁니다.

간단한 예시로, 우리가 직접 계산한 clip space 좌표를 vertex shader에서 fragment shader로 전달해봅시다.

간단한 삼각형을 그려보려고 하는데요.
[이전 예제](webgl-2d-matrices.html)에 이어서 사각형을 삼각형으로 바꿔봅시다.

    // 삼각형을 정의한 값으로 버퍼 채우기
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

그리고 3개의 정점만 그리면 됩니다.

    // 장면 그리기
    function drawScene() {
      ...
      // Geometry 그리기
      var primitiveType = gl.TRIANGLES;
      var offset = 0;
      var count = 3;
      gl.drawArrays(primitiveType, offset, count);
    }

다음은 fragment shader로 데이터를 전달하기 위해 vertex shader에 *varying*을 선언합니다.

    *varying vec4 v_color;
    ...
    void main() {
      // 위치를 행렬로 곱하기
      gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);

      // clip space에서 color space로 변환
      // clip space는 -1.0에서 +1.0까지
      // color space는 0.0에서 1.0까지
    *  v_color = gl_Position * 0.5 + 0.5;
    }

그런 다음 fragment shader에 동일한 *varying*을 선언합니다.

    precision mediump float;

    *varying vec4 v_color;

    void main() {
    *  gl_FragColor = v_color;
    }

WebGL은 vertex shader의 varying을 이름과 type이 같은 fragment shader의 varying으로 연결할 겁니다.

다음은 작동하는 버전입니다.

{{{example url="../webgl-2d-triangle-with-position-for-color.html" }}}

삼각형을 이동시키고, 크기를 바꾸고, 회전시켜보세요.
참고로 색상은 clip space에서 계산되므로 삼각형과 함께 움직이지 않는데요.
색상은 배경에 상대적입니다.

이제 생각해봅시다.
우리는 정점 3개만을 계산했습니다.
Vertex shader는 3번만 호출되므로 3개의 색상만을 계산하지만 삼각형은 여러 색상입니다.
이게 *varying*이라고 불리는 이유죠.

WebGL은 각 정점을 계산한 3개의 값을 가져오고 삼각형을 래스터화할 때 계산된 정점들 사이를 보간하는데요.
각 픽셀마다 해당 픽셀에 대해 보간된 값으로 fragment shader를 호출합니다.

위 예제에서는 3개의 정점으로 시작합니다.

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
<tr><th colspan="2">정점</th></tr>
<tr><td>0</td><td>-100</td></tr>
<tr><td>150</td><td>125</td></tr>
<tr><td>-175</td><td>100</td></tr>
</table>
</div>

Vertex shader는 translation, rotation, scale에 행렬을 적용하고 clip space로 변환합니다.
translation, rotation, scale의 기본값은 translation = 200, 150, rotation = 0, scale = 1,1이므로 실제로는 이동만 하는데요.
400x300인 backbuffer가 주어지면 vertex shader는 행렬을 적용한 뒤 다음과 같은 3개의 clip space 정점을 계산합니다.

<div class="hcenter">
<table class="vertex_table">
<tr><th colspan="3">gl_Position에 작성된 값들</th></tr>
<tr><td>0.000</td><td>0.660</td></tr>
<tr><td>0.750</td><td>-0.830</td></tr>
<tr><td>-0.875</td><td>-0.660</td></tr>
</table>
</div>

또한 이걸 color space로 변환하고 우리가 선언한 *varying* v_color에 작성합니다.

<div class="hcenter">
<table class="vertex_table">
<tr><th colspan="3">v_color에 작성된 값들</th></tr>
<tr><td>0.5000</td><td>0.830</td><td>0.5</td></tr>
<tr><td>0.8750</td><td>0.086</td><td>0.5</td></tr>
<tr><td>0.0625</td><td>0.170</td><td>0.5</td></tr>
</table>
</div>

v_color에 작성된 3개의 값들은 보간되어 각 픽셀에 대한 fragment shader로 전달됩니다.

{{{diagram url="resources/fragment-shader-anim.html" width="600" height="400" caption="v_color는 v0, v1, v2 사이에서 보간" }}}

또한 더 많은 데이터를 vertex shader에 전달해서 fragment shader에 전달할 수 있습니다.
예를 들어 2가지 색상을 가진 삼각형 2개로 이루어진 사각형을 그린다고 해봅시다.
이를 위해 vertex shader에 또 다른 attribute를 추가하면, 더 많은 데이터를 전달할 수 있고, 그 데이터를 fragment shader에 직접 전달할 수 있습니다.

    attribute vec2 a_position;
    +attribute vec4 a_color;
    ...
    varying vec4 v_color;

    void main() {
      ...
      // attribute에서 varying으로 색상 복사
    *  v_color = a_color;
    }

이제 WebGL이 사용할 색상을 제공해줘야 합니다.

    // 정점 데이터가 필요한 곳 탐색
    var positionLocation = gl.getAttribLocation(program, "a_position");
    +var colorLocation = gl.getAttribLocation(program, "a_color");
    ...
    +// 색상을 위한 버퍼 생성
    +var colorBuffer = gl.createBuffer();
    +gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    +// 색상 설정
    +setColors(gl);
    ...

    +// 사각형을 만드는 두 삼각형의 색상으로 버퍼 채우기
    +function setColors(gl) {
    +  // 2개의 무작위 색상 선택
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

렌더링할 때 색상 attribute 설정합니다.

    +gl.enableVertexAttribArray(colorLocation);
    +
    +// color buffer 할당
    +gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    +
    +// colorBuffer(ARRAY_BUFFER)의 데이터를 가져오는 방법을 색상 attribute에 지시
    +var size = 4;          // 반복마다 4개의 컴포넌트
    +var type = gl.FLOAT;   // 데이터는 32bit float
    +var normalize = false; // 데이터 정규화 안 함
    +var stride = 0;        // 0 = 다음 위치를 가져오기 위해 반복마다 size * sizeof(type) 만큼 앞으로 이동
    +var offset = 0;        // 버퍼의 처음부터 시작
    +gl.vertexAttribPointer(colorLocation, size, type, normalize, stride, offset);

삼각형 2개의 정점 6개를 계산하기 위해 count를 조정합니다.

    // Geometry 그리기
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    *var count = 6;
    gl.drawArrays(primitiveType, offset, count);

그리고 여기 결과물입니다.

{{{example url="../webgl-2d-rectangle-with-2-colors.html" }}}

2개의 단색 삼각형이라는 점에 주목해봅시다.
varying에 값이 전달되므로 삼각형을 가로질러 변형되거나 보간되고 있는데요.
이건 각 삼각형의 정점 3개에 모두 같은 색상을 사용했기 때문입니다.
만약 각각의 색상을 다르게 만들면 보간된 걸 볼 수 있습니다.

    // 사각형을 만드는 두 삼각형의 색상으로 버퍼 채우기
    function setColors(gl) {
      // 모든 정점을 다른 색상으로 만들기
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

그다지 흥미롭지는 않지만 2개 이상의 attribute를 사용하고 데이터를 vertex shader에서 fragment shader로 전달하는 걸 보여주는데요.
[이미지 처리 예제](webgl-image-processing.html)를 살펴보면 텍스처 좌표를 전달하기 위해 마찬가지로 추가적인 attribute를 사용하는 것을 볼 수 있습니다.

## Buffer와 Attribute 명령은 어떤 일을 하나요?

버퍼는 정점과 각 정점의 다른 데이터를 GPU로 가져오는 방법입니다.
`gl.createBuffer`는 버퍼를 생성합니다.
`gl.bindBuffer`는 해당 버퍼를 작업할 버퍼로 설정합니다.
`gl.bufferData`는 데이터를 버퍼로 복사합니다.
이건 보통 초기화할 때 수행됩니다.

버퍼에 데이터가 있으면 어떻게 데이터를 가져오고 vertex shader의 attribute에 제공할지 WebGL에 알려줘야 합니다.

이를 위해, 먼저 attribute를 할당한 location을 WebGL에 물어봐야 하는데요.
예를 들어 위 코드에서 우리는

    // 정점 데이터가 어디로 가야하는지 탐색
    var positionLocation = gl.getAttribLocation(program, "a_position");
    var colorLocation = gl.getAttribLocation(program, "a_color");

이것도 보통 초기화할 때 수행됩니다.

Attribute의 location을 알게 되면 그리기 전에 3가지 명령어를 실행해야 합니다.

    gl.enableVertexAttribArray(location);

이 명령어는 버퍼에서 데이터를 공급하기 원한다고 WebGL에 알려줍니다.

    gl.bindBuffer(gl.ARRAY_BUFFER, someBuffer);

이 명령어는 ARRAY_BUFFER bind point에 버퍼를 할당합니다.
이건 WebGL 내부에 있는 전역 변수입니다.

    gl.vertexAttribPointer(
      location,
      numComponents,
      typeOfData,
      normalizeFlag,
      strideToNextPieceOfData,
      offsetIntoBuffer
    );

그리고 이 명령어는 현재 ARRAY_BUFFER bind point에 바인딩된 버퍼에서 데이터를 가져오기 위해,
정점마다 얼마나 많은 컴포넌트(1 - 4)가 있는지,
data type(`BYTE`, `FLOAT`, `INT`, `UNSIGNED_SHORT`, 등등...)은 무엇인지,
stride는 한 데이터에서 다음 데이터를 가져오기 위해 몇 byte를 건너뛰어야 하는지,
offset은 버퍼에서 데이터가 얼마나 멀리 있는지 등을 WebGL에 알려줍니다.

컴포넌트의 숫자는 항상 1에서 4까지 입니다.

만약 데이터의 type마다 1개의 버퍼를 쓴다면 stride와 offset은 항상 0일 수 있습니다.
stride가 0이면 "type 크기에 맞는 stride 사용"을 의미합니다.
offset이 0이면 "버퍼의 처음부터 시작"을 의미합니다.
0 이외의 다른 값으로 설정하는 건 더욱 복잡하고 성능 면에서 어느 정도 이점이 있긴 하지만, WebGL을 한계까지 몰아붙이기 위한 게 아니라면 복잡함을 감수할만한 가치는 없을 것 같습니다.

buffer와 attribute가 정리되셨기를 바랍니다.

WebGL의 작동 방식을 이해하는 또 다른 방법으로 [대화형 상태 다이어그램](/webgl/lessons/resources/webgl-state-diagram.html)을 살펴보실 수 있습니다.

다음은 [셰이더와 GLSL](webgl-shaders-and-glsl.html)을 살펴보겠습니다.

<div class="webgl_bottombar">
<h3>vertexAttribPointer에서 normalizeFlag는 뭔가요?</h3>
<p>
Normalize flag는 부동 소수점이 아닌 모든 type을 위한 것인데요.
False를 넘기면 해당 값의 type으로 해석됩니다.
BYTE는 -128에서 127까지, UNSIGNED_BYTE는 0부터 255까지, SHORT는 -32768부터 32767까지 등등...
</p>
<p>
normalize flag를 true로 설정하면 BYTE(-128 ~ 127) 값은 -1.0에서 +1.0사이로 나타내고, UNSIGNED_BYTE(0 ~ 255)는 0.0에서 +1.0사이가 됩니다.
Normalized SHORT도 -1.0에서 +1.0사이가 되며 BYTE보다 더 높은 해상도를 가집니다.
</p>
<p>
정규화된 데이터의 가장 일반적인 용도는 색상입니다.
대부분의 경우 색상은 0.0에서 1.0사이 인데요.
빨강, 초록, 파랑, 투명도 모두 소수점을 쓰면 각 정점의 색상마다 16byte를 사용합니다.
복잡한 geometry가 있는 경우 많은 byte가 추가될 수 있습니다.
대신에 0은 0.0이 되고 255는 1.0이 되는 UNSIGNED_BYTE로 색상을 변환할 수 있는데요.
그러면 각 정점의 색상마다 4byte만 써서, 75%를 아낄 수 있습니다.
</p>
<p>
이렇게 하도록 코드를 수정해봅시다.
WebGL에 사용할 색상을 추출하는 방법을 지시할 때
</p>
<pre class="prettyprint showlinemods">
// colorBuffer(ARRAY_BUFFER)에서 데이터를 어떻게 가져올지 color attribute에 지시
var size = 4;                 // 반복마다 4개의 컴포넌트
*var type = gl.UNSIGNED_BYTE;  // 데이터는 8bit unsigned byte
*var normalize = true;         // 데이터 정규화
var stride = 0;               // 0 = 다음 위치를 가져오기 위해 반복마다 size * sizeof(type) 만큼 앞으로 이동
var offset = 0;               // 버퍼의 처음부터 시작
gl.vertexAttribPointer(colorLocation, size, type, normalize, stride, offset);
</pre>
<p>그리고 사용할 색상으로 버퍼를 채울 때</p>
<pre class="prettyprint showlinemods">
// 사각형을 만드는 두 삼각형의 색상으로 버퍼 채우기
function setColors(gl) {
  // 2개의 무작위 색상 선택
  var r1 = Math.random() * 256; // 0에서
  var b1 = Math.random() * 256; // 255.99999사이
  var g1 = Math.random() * 256; // 값은
  var r2 = Math.random() * 256; // Uint8Array에
  var b2 = Math.random() * 256; // 저장될 때
  var g2 = Math.random() * 256; // 잘림

  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Uint8Array([   // Uint8Array
      r1, b1, g1, 255,
      r1, b1, g1, 255,
      r1, b1, g1, 255,
      r2, b2, g2, 255,
      r2, b2, g2, 255,
      r2, b2, g2, 255
    ]),
    gl.STATIC_DRAW
  );
}
</pre>
<p>다음은 해당 샘플입니다.</p>
{{{example url="../webgl-2d-rectangle-with-2-byte-colors.html" }}}
</div>


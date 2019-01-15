Title: WebGL - Orthographic 3D
Description: 정사영으로 시작하는 WebGL에서 3D 하는 방법

이 글은 WebGL 관련 시리즈에서 이어지는 글입니다.
첫 번째는 [기초로 시작했고](webgl-fundamentals.html) 이전에는 [2D 행렬에 대해](webgl-2d-matrices.html) 다뤘습니다.
혹시 읽지 않으셨다면 해당 글들을 먼저 읽어주세요.

마지막 글에서 우리는 2D 행렬이 어떻게 동작하는지 살펴봤습니다.
이동, 회전, 크기, 그리고 심지어 픽셀에서 clip 공간으로 투영하는 것은 모두 1 행렬 그리고 마법같은 행렬 수학으로 처리할 수 있는 방법에 대해 얘기했었는데요.
거기서 3D를 수행하는 것은 하나의 작은 단계일 뿐입니다.

이전 2D 예제에서는 3x3 행렬을 곱한 2D 점(x, y)들을 가졌었는데요.
3D를 수행하기 위해서는 3D 점(x, y, z)들과 4x4 행렬이 필요합니다.

마지막 예제를 가져와서 3D로 바꿔봅시다.
다시 F를 사용할 거지만 이번엔 3D 'F' 입니다.

먼저 해야할 일은 3D를 제어하도록 vertex shader를 수정하는 건데요.
여기 기존 vertex shader가 있습니다.

```
<script id="2d-vertex-shader" type="x-shader/x-vertex">
attribute vec2 a_position;

uniform mat3 u_matrix;

void main() {
  // 행렬에 위치 값 곱하기
  gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
}
</script>
```

그리고 이게 새로운 것인데

```
<script id="3d-vertex-shader" type="x-shader/x-vertex">
*attribute vec4 a_position;

*uniform mat4 u_matrix;

void main() {
  // 행렬에 위치 값 곱하기
*  gl_Position = u_matrix * a_position;
}
</script>
```

더 간단해졌습니다!
2D와 마찬가지로 `x`와 `y`를 제공하고 `z`를 1로 설정했습니다.
3D에서는 `x`, `y`, 그리고 `z`가 제공되어야 하고 `w`가 1이어야 하지만 `w`의 기본값이 1이라는 사실을 이용합시다.

그런 다음 3D 데이터를 제공해야 합니다.

```
  ...

  // attribute에게 positionBuffer(ARRAY_BUFFER)에서 데이터 가져오는 방법을 알려줍니다.
*  var size = 3;          // 반복마다 세 구성 요소
  var type = gl.FLOAT;   // 데이터는 32bit 부동 소수점
  var normalize = false; // 데이터 정규화 하지 않기
  var stride = 0;        // 0 = 반복할 때마다 size * sizeof(type)만큼 다음 위치로 이동
  var offset = 0;        // 버퍼의 처음부터 시작
  gl.vertexAttribPointer(
      positionAttributeLocation,
      size,
      type,
      normalize,
      stride,
      offset
  );

  ...

// 현재 ARRAY_BUFFER 버퍼 채우기
// 문자 'F'를 정의하는 값들로 버퍼 채우기
function setGeometry(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          // left column
            0,   0,  0,
           30,   0,  0,
            0, 150,  0,
            0, 150,  0,
           30,   0,  0,
           30, 150,  0,

          // top rung
           30,   0,  0,          100,   0,  0,
           30,  30,  0,
           30,  30,  0,
          100,   0,  0,
          100,  30,  0,

          // middle rung
           30,  60,  0,
           67,  60,  0,
           30,  90,  0,
           30,  90,  0,
           67,  60,  0,
           67,  90,  0]),
      gl.STATIC_DRAW);
}
```

다음으로 모든 행렬 함수를 2D에서 3D로 바꿔야 합니다.

여기 m3.translation, m3.rotation, 그리고 m3.scaling의 2D 버전입니다.

```
var m3 = {
  translation: function translation(tx, ty) {
    return [
      1, 0, 0,
      0, 1, 0,
      tx, ty, 1
    ];
  },

  rotation: function rotation(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    return [
      c,-s, 0,
      s, c, 0,
      0, 0, 1
    ];
  },

  scaling: function scaling(sx, sy) {
    return [
      sx, 0, 0,
      0, sy, 0,
      0, 0, 1
    ];
  },
};
```

그리고 여기 업데이트된 3D 버전입니다.

```
var m4 = {
  translation: function(tx, ty, tz) {
    return [
       1,  0,  0,  0,
       0,  1,  0,  0,
       0,  0,  1,  0,
       tx, ty, tz, 1,
    ];
  },

  xRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1,
    ];
  },

  yRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1,
    ];
  },

  zRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
       c, s, 0, 0,
      -s, c, 0, 0,
       0, 0, 1, 0,
       0, 0, 0, 1,
    ];
  },

  scaling: function(sx, sy, sz) {
    return [
      sx, 0,  0,  0,
      0, sy,  0,  0,
      0,  0, sz,  0,
      0,  0,  0,  1,
    ];
  },
};
```

이제 회전용 함수를 3개 가지는 것에 주목해주세요.
2D에서 우리는 오직 Z축을 중심으로 회전했기 때문에 하나만 필요했습니다.
이제 3D를 하기 위해서 X축과 Y축을 중심으로도 잘 회전되길 원하실 겁니다.
보면서 아셨겠지만 모든 함수가 굉장히 비슷한데요.
우리가 그것을 해결한다면 이전처럼 간결한 것을 볼 수 있습니다.

Z 회전

<div class="webgl_center">
<div>newX = x *  c + y * s;</div>
<div>newY = x * -s + y * c;</div>
</div>

Y 회전

<div class="webgl_center">
<div>newX = x *  c + z * s;</div>
<div>newZ = x * -s + z * c;</div>
</div>

X 회전

<div class="webgl_center">
<div>newY = y *  c + z * s;</div>
<div>newZ = y * -s + z * c;</div>
</div>

위 식들은 이런 회전을 줍니다.

<iframe class="external_diagram" src="resources/axis-diagram.html" style="width: 540px; height: 280px;"></iframe>

마찬가지로 단순한 함수들을 만들어 봅시다.

```
  translate: function(m, tx, ty, tz) {
    return m4.multiply(m, m4.translation(tx, ty, tz));
  },

  xRotate: function(m, angleInRadians) {
    return m4.multiply(m, m4.xRotation(angleInRadians));
  },

  yRotate: function(m, angleInRadians) {
    return m4.multiply(m, m4.yRotation(angleInRadians));
  },

  zRotate: function(m, angleInRadians) {
    return m4.multiply(m, m4.zRotation(angleInRadians));
  },

  scale: function(m, sx, sy, sz) {
    return m4.multiply(m, m4.scaling(sx, sy, sz));
  },
```

또한 투영 함수를 업데이트해야 합니다.
이게 기존 것이고

```
  projection: function (width, height) {
    // 참고: 이 행렬은 Y축을 뒤집으므로 0이 상단입니다.
    return [
      2 / width, 0, 0,
      0, -2 / height, 0,
      -1, 1, 1
    ];
  },
}
```

픽셀에서 clip 공간으로 변환되었습니다.
3D로 확장하기 위한 첫 번째 시도는

```
  projection: function(width, height, depth) {
    // 참고: 이 행렬은 Y축을 뒤집으므로 0이 상단입니다.
    return [
       2 / width, 0, 0, 0,
       0, -2 / height, 0, 0,
       0, 0, 2 / depth, 0,
      -1, 1, 0, 1,
    ];
  },
```

X와 Y를 픽셀에서 clip 공간으로 변환해줘야 했던 것처럼, Z도 동일한 작업을 해줘야 합니다.
이 경우에는 Z축 픽셀 단위도 만들고 있는데요.
저는 `depth`에 대해 `width`와 비슷한 값을 넘길 것이므로 공간은 0에서 `width`의 픽셀 너비와, 0에서 `height`의 픽셀 높이가 되지만, `depth`는 `-depth / 2`에서 `+depth / 2`가 됩니다.

마지막으로 행렬을 계산하는 코드를 업데이트 해줘야 합니다.

```
  // 행렬 계산
*  var matrix = m4.projection(gl.canvas.clientWidth, gl.canvas.clientHeight, 400);
*  matrix = m4.translate(matrix, translation[0], translation[1], translation[2]);
*  matrix = m4.xRotate(matrix, rotation[0]);
*  matrix = m4.yRotate(matrix, rotation[1]);
*  matrix = m4.zRotate(matrix, rotation[2]);
*  matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);

  // 행렬 설정
*  gl.uniformMatrix4fv(matrixLocation, false, matrix);
```

그리고 여기 예제입니다.

{{{example url="../webgl-3d-step1.html" }}}

우리가 가진 첫 번째 문제는 우리의 geometry가 3D로 보기 힘들게 만드는 평평한 F라는 겁니다.
이걸 고치기 위해 geometry를 3D로 확장해봅시다.
현재 F는 각각 삼각형 2개인, 사각형 3개로 만들어져 있습니다.
이걸 3D로 만들기 위해서는 총 16개의 사각형이 필요한데요.
삼각형이 앞쪽에 3개, 뒤쪽에 3개, 왼쪽에 1개, 오른쪽에 4개, 위쪽애 2개, 아래쪽에 3개가 있어야 합니다.

<img class="webgl_center" width="300" src="resources/3df.svg" />

여기 나와있는 목록 중 상당 수 입니다.
사각형 당 삼각형 2개 그리고 삼각형 당 꼭지점 3개인 사각형 16개는 96개의 꼭지점이 있습니다.
이것들 전부를 보고 싶다면 예제의 출처를 봐주세요.

우리는 더 많은 점들을 그려야 하므로

```
    // geometry 그리기
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
*    var count = 16 * 6;
    gl.drawArrays(primitiveType, offset, count);
```

그리고 여기 해당 버전입니다.

{{{example url="../webgl-3d-step2.html" }}}

슬라이더를 움직여보면 이건 3D라고 단호하게 말할 수 있습니다.
이제 각 사각형 별로 다른 색을 입혀봅시다.
이를 위해 vertex shader에 다른 attribute를 추가하고 varying으로 vertex shader에서 fragment shader로 전달할겁니다.

여기 새로운 vertex shader 입니다.

```
<script id="3d-vertex-shader" type="x-shader/x-vertex">
attribute vec4 a_position;
+attribute vec4 a_color;

uniform mat4 u_matrix;

+varying vec4 v_color;

void main() {
  // 행렬에 위치 값 곱하기
  gl_Position = u_matrix * a_position;

+  // fragment shader로 색상 전달
+  v_color = a_color;
}
</script>
```

그리고 fragment shader에서 그 색을 써야 하는데

```
<script id="3d-vertex-shader" type="x-shader/x-fragment">
precision mediump float;

+// vertex shader로부터 전달
+varying vec4 v_color;

void main() {
*   gl_FragColor = v_color;
}
</script>
```

색상을 제공하기 위해 attribute 위치를 찾고, 다른 버퍼와 attribute를 설정해서 색상을 지정해야 합니다.

```
  ...
  var colorLocation = gl.getAttribLocation(program, "a_color");

  ...
  // 색상용 버퍼 생성
  var colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  // 버퍼에 색상 삽입
  setColors(gl);


  ...
// 버퍼에 'F'의 색상 채우기

function setColors(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Uint8Array([
        // left column front
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,

        // top rung front
        200,  70, 120,
        200,  70, 120,
        ...
        ...
      gl.STATIC_DRAW);
}
```

그런 다음 렌더링할 때 색상 attribute에게 색상 버퍼에서 색상 얻는 방법을 알려줘야 하는데

```
// 색상 attribute 활성화
gl.enableVertexAttribArray(colorLocation);

// 색상 버퍼 할당
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

// colorBuffer(ARRAY_BUFFER)에서 데이터 얻는 방법을 attribute에게 알려주기
var size = 3;                 // 반복마다 3개 구성요소
var type = gl.UNSIGNED_BYTE;  // 데이터는 부호없는 8bit 값
var normalize = true;         // 데이터 정규화 (0-255에서 0-1로 전환)
var stride = 0;               // 0 = 반복할 때마다 size * sizeof(type)만큼 다음 위치로 이동
var offset = 0;               // 버퍼의 처음부터 시작
gl.vertexAttribPointer(
    colorLocation,
    size,
    type,
    normalize,
    stride,
    offset
);
```

이제 이걸 얻게 됩니다.

{{{example url="../webgl-3d-step3.html" }}}

엥, 이게 뭐야?
음, 3D 'F'의 앞면, 뒷면, 옆면 등등 다양한 부분이 geometry 데이터가 나타나는 순서대로 그려진 것으로 보입니다.
가끔씩 뒤쪽에 있는 것들이 앞쪽에 그려지기 때문에 원하는 결과를 얻지 못하는데요.

<img class="webgl_center" width="163" height="190" src="resources/polygon-drawing-order.gif" />

<span style="background: rgb(200, 70, 120); color: white; padding: 0.25em">붉은 부분</span>은 'F'의 **앞쪽**이지만 우리 데이터 중 첫 번째이기 때문에 먼저 그려지고 다른 삼각형들이 그려진 후 덮어집니다.
예를 들어 <span style="background: rgb(80, 70, 200); color: white; padding: 0.25em">보라색 부분</span>은 실제로 'F'의 뒤쪽에 있는데요.
우리 데이터 중에 2번째로 오기 떄문에 2번쨰로 그려지는 겁니다.

WebGL의 삼각형은 정면과 후면의 개념을 가지고 있습니다.
기본적으로 정면 삼각형은 반시계 방향으로 향하는 꼭지점을 가지는데요.
후면 삼각형은 시계 방향을 향하는 꼭지점을 가집니다.

<img src="resources/triangle-winding.svg" class="webgl_center" width="400" />

WebGL은 정면 혹은 후면 삼각형만 그릴 수 있습니다.

이 기능을 활성화시킬 수 있는데 다음과 같이

```
  gl.enable(gl.CULL_FACE);
```

이걸 `drawScene` 함수에 넣읍시다.
이 기능을 켜면, WebGL은 기본적으로 뒷면의 삼각형을 "culling" 하는데요.
이 경우 "Culling"은 "not drawing"을 말하는 멋진 단어입니다.

참고로 WebGL에서 삼각형이 시계 혹은 반시계 방향으로 진행되는지는 clip 공간에서 해당 삼각형의 꼭지점에 따라 달라지는데요.
즉, WebGL은 vertex shader에서 점들에 수식을 적용한 후에 삼각형이 앞면인지 후면인지 파악합니다.
이 말은 시계 방향 삼각형이 X축 -1로 축척되거나 180도 회전하여 반시계 삼각형이 된다는 뜻입니다.
CULL_FACE가 비활성화되었으므로 시계 방향(앞)과 반시계 방향(뒤) 삼각형을 모두 볼 수 있었습니다.
이제 그걸 활성화했으므로, 크기 조정이나 회전 혹은 어떤 이유로든 삼각형이 튀어 나올 때, WebGL은 그걸 그릴 수 없습니다.
3D에서 무언가를 회전시킬 때 일반적으로 어떤 삼각형이든 정면을 향하길 바라기 때문에 이것은 좋은 현상입니다.

CULL_FACE를 켰을 때 이런 것을 얻는데

{{{example url="../webgl-3d-step4.html" }}}

야! 삼각형 다 어디 갔어?
알고보니, 많은 것들이 잘못된 방향을 향하고 있습니다.
이걸 회전시켜서 보면 다른 방향에서는 볼 때는 나타나는 걸 보실 수 있는데요.
다행히 이걸 고치는 것은 쉽습니다.
그저 뒷면을 찾아 꼭지점 2개를 교환하면 됩니다.
예를들어 뒷면 삼각형 하나가 있다면

```
           1,   2,   3,
          40,  50,  60,
         700, 800, 900,
```

그냥 마지막 꼭지점 2개를 앞으로 오도록 교환해주면 됩니다.

```
           1,   2,   3,
         700, 800, 900,
          40,  50,  60,
```

모든 후면 삼각형을 고치면 문제가 발생하는데

{{{example url="../webgl-3d-step5.html" }}}

나아졌지만 아직 하나 더 문제가 남아있습니다.
모든 삼각형이 올바른 방향을 향하게 하고 뒤를 향한 것들을 추려내도 뒤쪽에 있어야 하는 삼각형들이 앞쪽에 있어야 하는 삼각형 위에 그려지는 곳이 있습니다.

DEPTH BUFFER를 입력합시다.

때때로 Z-Buffer라고 불리는 depth buffer는 이미지를 만드는데 사용되는 각 색상 픽셀에 대한 *depth* 픽셀들의 사각형입니다.
WebGL은 각 색상 픽셀을 그리기 때문에 depth 픽셀도 그릴 수 있습니다.
이건 Z축에 대해서 vertex shader에서 반환한 값을 기반으로 수행됩니다.
X와 Y를 클립 공간으로 변환해야하는 것처럼, Z도 클립 공간 또는 (-1에서 +1사이)에 있어야 합니다.
이 값은 depth 공간(0에서 +1)으로 변환됩니다.
WebGL이 색상 픽셀을 그리기 전에 해당 depth 픽셀을 검사합니다.
그릴 픽셀의 depth 값이 해당 depth 픽셀의 값보다 클 경우 WebGL은 새로운 색상 픽셀을 그리지 않습니다.
아니면 fragment shader의 색상을 가진 새로운 색상 픽셀들을 모두 그리고 새로운 depth 값으로 depth 픽셀을 그립니다.
즉, 다른 픽셀들 뒤에 있는 픽셀들은 그려지지 않을겁니다.

다음과 같이 culling 기능을 켜기만 하면 이 기능을 사용할 수 있습니다.

```
  gl.enable(gl.DEPTH_TEST);
```

또한 그리기 전에 depth 버퍼를 1.0으로 초기화해야 합니다.

```
  // 화면 그리기
  function drawScene() {
    ...

    // canvas와 depth 버퍼 초기화
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    ...
```

그리고 이제 3D를 얻습니다!

{{{example url="../webgl-3d-step6.html" }}}

한가지 사소한 일이 있는데요.
대부분의 3D 수학 라이브러리에는 clip 공간에서 픽셀 공간으로 변환을 수행하는 `projection` 함수가 없습니다.
오히려 일반적으로 `ortho`나 `orthographic`이라고 불리는 함수가 이렇게 있는데

    var m4 = {
      orthographic: function(left, right, bottom, top, near, far) {
        return [
          2 / (right - left), 0, 0, 0,
          0, 2 / (top - bottom), 0, 0,
          0, 0, 2 / (near - far), 0,

          (left + right) / (left - right),
          (bottom + top) / (bottom - top),
          (near + far) / (near - far),
          1,
        ];
      }

너비, 높이, 그리고 깊이만을 매개변수로 가지는 우리의 단순한 `projection` 함수와 달리
좀 더 일반적인 orthographic projection 함수는 더 많은 유연성을 제공하기 위해 left, right, bottom, top, near, 그리고 far을 전달할 수 있습니다.
원래 projection 함수와 똑같이 사용하기 위해서는 호출을 다음과 같이

    var left = 0;
    var right = gl.canvas.clientWidth;
    var bottom = gl.canvas.clientHeight;
    var top = 0;
    var near = 400;
    var far = -400;
    m4.orthographic(left, right, bottom, top, near, far);

다음 글에서는 [원근법을 만드는 방법](webgl-3d-perspective.html)에 대해 다루겠습니다.

<div class="webgl_bottombar">
<h3>왜 attribute는 vec4지만 gl.vertexAttribPointer 크기는 3인가요?</h3>
<p>꼼꼼히 보신 분들은 2개의 attribute를 정의했다는 걸 눈치채셨을 겁니다.</p>
<pre class="prettyprint showlinemods">
attribute vec4 a_position;
attribute vec4 a_color;
</pre>
<p>둘 다 'vec4'지만 WebGL이 버퍼에서 데이터를 가져오는 방법을 말할 때</p>
<pre class="prettyprint showlinemods">
// attribute에게 positionBuffer(ARRAY_BUFFER)에서 데이터 가져오는 방법을 알려주기
var size = 3;          // 반복마다 3개 구성요소
var type = gl.FLOAT;   // 데이터는 32bit 부동 소수점
var normalize = false; // 데이터 정규화 하지 않기
var stride = 0;        // 0 = 각 반복마다 size * sizeof(type) 앞으로 이동해 다음 위치 얻기
var offset = 0;        // 버퍼의 처음부터 시작
gl.vertexAttribPointer(
    positionAttributeLocation,
    size,
    type,
    normalize,
    stride,
    offset
);

...
// attribute에게 colorBuffer(ARRAY_BUFFER)에서 데이터 가져오는 방법을 알려주기
var size = 3;          // 반복마다 3개 구성요소
var type = gl.UNSIGNED_BYTE;   // 부호없는 8bit 데이터
var normalize = true;  // 데이터 정규화 (0-255에서 0-1로 전환)
var stride = 0;        // 0 = 각 반복마다 size * sizeof(type) 앞으로 이동해 다음 색상 얻기 0
var offset = 0;        // 버퍼의 처음부터 시작
gl.vertexAttribPointer(
    colorAttributeLocation,
    size,
    type,
    normalize,
    stride,
    offset
);
</pre>
<p>
'3'은 vertex shader의 반복마다 각 attribute의 buffer에서 3개의 값을 꺼내야 한다는 것을 말합니다.
이건 값을 제공하지 않으면 vertex shader에서 WebGL에게 기본적으로 제공해주는 값이 있기에 가능한데요.
기본 값은 0, 0, 0, 1으로 x = 0, y = 0, z= 0 그리고 w = 1 입니다.
이게 우리가 예전 vertex shader에서 명시적으로 1을 제공해줘야 했던 이유인데요.
x와 y는 전달했고 z는 1이 필요했지만 z의 기본 값은 0이므로 명시적으로 1을 제공해야 했습니다.
하지만 3D의 경우, 'w'를 제공하지 않아도 기본 값이 1이므로 행렬 수식이 작동하는 데 필요한 값을 갖게됩니다.
</p>
</div>

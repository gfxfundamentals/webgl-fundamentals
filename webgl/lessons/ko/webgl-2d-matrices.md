Title: WebGL 2D 행렬
Description: 행렬 수학이 어떻게 동작하는지 간단하고 따라하기 쉬운 방향으로 설명되어 있습니다.
TOC: 2D 행렬


이 포스트는 WebGL 관련 시리즈에서 이어집니다.
첫 번째는 [기초](webgl-fundamentals.html)로 시작했고, 이전에는 [2D geometry scale](webgl-2d-scale.html)에 관한 것이었습니다.

<div class="webgl_bottombar">
<h3>Math vs Programming vs WebGL</h3>
<p>선형 대수나 행렬로 작업한 경험이 있다면 시작하기 전에 <a href="webgl-matrix-vs-math.html"><b>이 글</b></a>을 먼저 읽어주세요.</p>
<p>행렬에 대한 경험이 없다면 위의 링크를 건너뛰고 계속 읽으셔도 됩니다.</p>
</div>

지난 3개의 포스트에서 우리는 [Geometry Translation](webgl-2d-translation.html), [Geometry Rotation](webgl-2d-rotation.html), [Geometry Scale](webgl-2d-scale.html)에 대해 살펴봤습니다.
Translation, Rotation, Scale은 각각 '변환'의 한 종류로 간주되는데요.
각각의 변환은 셰이더의 변경이 필요하고 3개의 변환은 각각의 순서에 따라 달라집니다.
[이전 예제](webgl-2d-scale.html)에서는 크기를 조정하고, 회전한 다음, 이동했는데요.
만약 다른 순서로 적용한다면 다른 결과를 얻게 될 겁니다.

예를 들어 (2, 1)의 scale, 30도 rotation, (100, 0)의 translation을 하면 이렇게 됩니다.

<img src="../resources/f-scale-rotation-translation.svg" class="webgl_center" width="400" />

또 (100, 0)의 translation, 30도 rotation, (2, 1)의 scale을 하면 이렇게 됩니다.

<img src="../resources/f-translation-rotation-scale.svg" class="webgl_center" width="400" />

결과는 완전히 다릅니다.
심지어 더 안 좋은 점은, 두 번째 예제가 필요하다면 우리가 원하는 새로운 순서로 translation, rotation, scale을 적용한 다른 셰이더를 작성해야 한다는 겁니다.

저보다 훨씬 더 똑똑한 사람들은 행렬 수학으로 동일한 모든 작업을 할 수 있다는 걸 밝혀냈는데요.
2D의 경우 3x3 행렬을 사용합니다.
3x3 행렬은 상자 9개가 있는 grid와 같은데:

<link href="resources/webgl-2d-matrices.css" rel="stylesheet">
<div class="glocal-center"><table class="glocal-center-content glocal-mat"><tr><td>1.0</td><td>2.0</td><td>3.0</td></tr><tr><td>4.0</td><td>5.0</td><td>6.0</td></tr><tr><td>7.0</td><td>8.0</td><td>9.0</td></tr></table></div>

계산하기 위해서 위치를 행렬의 열에 곱하고 결과를 합산합니다.
위치는 x 그리고 y, 2개의 값만을 가지지만, 계산하기 위해서는 3개의 값이 필요하므로 세 번째 값에 1을 사용할 겁니다.

이 경우 결과는 이렇게 됩니다.

<div class="glocal-center"><table class="glocal-center-content"><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col class="glocal-b"/><tr><td class="glocal-right">newX&nbsp;=&nbsp;</td><td>x&nbsp;*&nbsp;</td><td class="glocal-border">1.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td>x&nbsp;*&nbsp;</td><td class="glocal-border">2.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td>x&nbsp;*&nbsp;</td><td class="glocal-border">3.0</td><td>&nbsp;+</td></tr><tr><td></td><td>y&nbsp;*&nbsp;</td><td class="glocal-border">4.0</td><td class="glocal-left">&nbsp;+</td><td></td><td>y&nbsp;*&nbsp;</td><td class="glocal-border">5.0</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td>y&nbsp;*&nbsp;</td><td class="glocal-border">6.0</td><td>&nbsp;+</td></tr><tr><td></td><td>1&nbsp;*&nbsp;</td><td>7.0</td><td>&nbsp;</td><td></td><td>1&nbsp;*&nbsp;</td><td>8.0</td><td>&nbsp;&nbsp;</td><td></td><td>1&nbsp;*&nbsp;</td><td>9.0</td><td>&nbsp;</td></tr></table></div>

아마 저걸 보고 "그래서 요점이 뭔데?"라고 생각하실 겁니다.
Translation을 한다고 가정해봅시다.
우리가 원하는 translation 양을 tx와 ty라고 부를거구요.
이렇게 행렬을 만듭시다.

<div class="glocal-center"><table class="glocal-center-content glocal-mat"><tr><td>1.0</td><td>0.0</td><td>0.0</td></tr><tr><td>0.0</td><td>1.0</td><td>0.0</td></tr><tr><td>tx</td><td>ty</td><td>1.0</td></tr></table></div>

이제 확인해보면

<div class="glocal-center"><table class="glocal-center-content"><col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">1.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr><tr><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td class="glocal-left">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">1.0</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr><tr><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>tx</td><td>&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>ty</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>1.0</td><td>&nbsp;</td></tr></table></div>

대수을 기억한다면 어느 곳이든 0으로 곱해서 지울 수 있다는 걸 아실겁니다.
1을 곱하면 아무런 효과가 없으므로 어떻게 되는지 간단하게 본다면

<div class="glocal-center"><table class="glocal-center-content"><col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">1.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr><tr><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk glocal-left">&nbsp;+</td><td></td><td>y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">1.0</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr><tr><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td>tx</td><td>&nbsp;</td><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td>ty</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">1.0</td><td>&nbsp;</td></tr></table></div>

혹은 더 간결하게

<div class="webgl_center"><pre class="webgl_math">
newX = x + tx;
newY = y + ty;
</pre></div>

그리고 추가적으로 우리가 신경 쓸 것은 없습니다.
이건 [translation 예제의 translation 코드](webgl-2d-translation.html)와 놀라울 정도로 비슷합니다.

마찬가지로 회전을 해봅시다.
Rotation 포스트에서 강조한 것처럼 회전하고자 하는 각도의 sine과 cosine이 필요합니다.

<div class="webgl_center"><pre class="webgl_math">
s = Math.sin(angleToRotateInRadians);
c = Math.cos(angleToRotateInRadians);
</pre></div>

그리고 이렇게 행렬을 만들고

<div class="glocal-center"><table class="glocal-center-content glocal-mat"><tr><td>c</td><td>-s</td><td>0.0</td></tr><tr><td>s</td><td>c</td><td>0.0</td></tr><tr><td>0.0</td><td>0.0</td><td>1.0</td></tr></table></div>

행렬을 적용하면 이렇게 되며

<div class="glocal-center"><table class="glocal-center-content"><col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">c</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">-s</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr><tr><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">s</td><td class="glocal-left">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">c</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr><tr><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>0.0</td><td>&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>0.0</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>1.0</td><td>&nbsp;</td></tr></table></div>

0과 1로 곱한 것들을 모두 검게 칠하고

<div class="glocal-center"><table class="glocal-center-content"><col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">c</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">-s</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr><tr><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">s</td><td class="glocal-left glocal-blk">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">c</td><td class="glocal-left glocal-blk">&nbsp;+&nbsp;</td><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr><tr><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">0.0</td><td>&nbsp;</td><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">0.0</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">1.0</td><td>&nbsp;</td></tr></table></div>

단순화하면

<pre class="webgl_center">
newX = x *  c + y * s;
newY = x * -s + y * c;
</pre>

이게 바로 [rotation 샘플](webgl-2d-rotation.html)에 있는 겁니다.

그리고 마지막으로 scale입니다.
2개의 scale 인수를 sx와 sy라고 부르겠습니다.

이런 행렬을 만들어

<div class="glocal-center"><table class="glocal-center-content glocal-mat"><tr><td>sx</td><td>0.0</td><td>0.0</td></tr><tr><td>0.0</td><td>sy</td><td>0.0</td></tr><tr><td>0.0</td><td>0.0</td><td>1.0</td></tr></table></div>

행렬을 적용하면 이렇게 되며

<div class="glocal-center"><table class="glocal-center-content"><col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">sx</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr><tr><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td class="glocal-left">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">sy</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr><tr><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>0.0</td><td>&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>0.0</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>1.0</td><td>&nbsp;</td></tr></table></div>

실제로는

<div class="glocal-center"><table class="glocal-center-content"><col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">sx</td><td class="glocal-left glocal-blk">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-left glocal-blk">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr><tr><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-left glocal-blk">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">sy</td><td class="glocal-left glocal-blk">&nbsp;+&nbsp;</td><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr><tr><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">0.0</td><td>&nbsp;</td><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">0.0</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">1.0</td><td>&nbsp;</td></tr></table></div>

단순화한 건

<pre class="webgl_center">
newX = x * sx;
newY = y * sy;
</pre>

이건 [scale 샘플](webgl-2d-scale.html)과 동일합니다.

아마 아직 "그래서 뭐요? 요점이 뭔데요?"라고 생각하고 계실 것 같습니다.
그냥 이미 하고 있던 동일한 것들을 수행하기 위한 여러 작업처럼 보입니다.

여기가 마법이 들어오는 곳입니다.
행렬을 함께 곱하고 모든 변환을 한 번에 적용하는거죠.
두 행렬을 받아서 곱하고 결과를 반환하는 함수 `m3.multiply`가 있다고 가정해봅시다.

```js
var m3 = {
  multiply: function(a, b) {
    var a00 = a[0 * 3 + 0];
    var a01 = a[0 * 3 + 1];
    var a02 = a[0 * 3 + 2];
    var a10 = a[1 * 3 + 0];
    var a11 = a[1 * 3 + 1];
    var a12 = a[1 * 3 + 2];
    var a20 = a[2 * 3 + 0];
    var a21 = a[2 * 3 + 1];
    var a22 = a[2 * 3 + 2];
    var b00 = b[0 * 3 + 0];
    var b01 = b[0 * 3 + 1];
    var b02 = b[0 * 3 + 2];
    var b10 = b[1 * 3 + 0];
    var b11 = b[1 * 3 + 1];
    var b12 = b[1 * 3 + 2];
    var b20 = b[2 * 3 + 0];
    var b21 = b[2 * 3 + 1];
    var b22 = b[2 * 3 + 2];

    return [
      b00 * a00 + b01 * a10 + b02 * a20,
      b00 * a01 + b01 * a11 + b02 * a21,
      b00 * a02 + b01 * a12 + b02 * a22,
      b10 * a00 + b11 * a10 + b12 * a20,
      b10 * a01 + b11 * a11 + b12 * a21,
      b10 * a02 + b11 * a12 + b12 * a22,
      b20 * a00 + b21 * a10 + b22 * a20,
      b20 * a01 + b21 * a11 + b22 * a21,
      b20 * a02 + b21 * a12 + b22 * a22,
    ];
  }
}
```

더 명확하게 하기 위해 translation, rotation, scale을 위한 행렬을 만드는 함수를 만들어봅시다.

```js
var m3 = {
  translation: function(tx, ty) {
    return [
       1,  0, 0,
       0,  1, 0,
      tx, ty, 1,
    ];
  },

  rotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    return [
      c,-s, 0,
      s, c, 0,
      0, 0, 1,
    ];
  },

  scaling: function(sx, sy) {
    return [
      sx, 0, 0,
      0, sy, 0,
      0,  0, 1,
    ];
  },
};
```

이제 셰이더를 바꿔봅시다.
기존 셰이더는 이렇게 되어 있었는데요.

```html
<script id="vertex-shader-2d" type="x-shader/x-vertex">
attribute vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_rotation;
uniform vec2 u_scale;

void main() {
  // 위치에 scale 적용
  vec2 scaledPosition = a_position * u_scale;

  // 위치에 rotation 적용
  vec2 rotatedPosition = vec2(
     scaledPosition.x * u_rotation.y + scaledPosition.y * u_rotation.x,
     scaledPosition.y * u_rotation.y - scaledPosition.x * u_rotation.x);

  // translation 추가
  vec2 position = rotatedPosition + u_translation;
  ...
```

새로운 셰이더는 훨씬 더 간단해질 겁니다.

```html
<script id="vertex-shader-2d" type="x-shader/x-vertex">
attribute vec2 a_position;

uniform vec2 u_resolution;
uniform mat3 u_matrix;

void main() {
  // position에 행렬 곱하기
  vec2 position = (u_matrix * vec3(a_position, 1)).xy;
  ...
```

그리고 어떻게 사용하냐면

```js
// 장면 그리기
function drawScene() {

  ,,,

  // 행렬 계산
  var translationMatrix = m3.translation(translation[0], translation[1]);
  var rotationMatrix = m3.rotation(angleInRadians);
  var scaleMatrix = m3.scaling(scale[0], scale[1]);

  // 행렬 곱하기
  var matrix = m3.multiply(translationMatrix, rotationMatrix);
  matrix = m3.multiply(matrix, scaleMatrix);

  // 행렬 설정
  gl.uniformMatrix3fv(matrixLocation, false, matrix);

  // 사각형 그리기
  gl.drawArrays(gl.TRIANGLES, 0, 18);
}
```

여기 새로운 코드를 사용한 샘플입니다.
슬라이더는 동일하게 translation, rotation, scale 입니다.
하지만 셰이더에서 사용되는 방식은 훨씬 더 간단해졌습니다.

{{{example url="../webgl-2d-geometry-matrix-transform.html" }}}

그래도 물어보실 수 있습니다.
그래서 뭐요?
그다지 이점이 많아 보이지 않는데요.
하지만 이제 순서를 변경하려는 경우 새로운 셰이더를 작성하지 않아도 됩니다.
그냥 수식만 바꿔주면 되죠.

```js
...
// 행렬 곱하기
var matrix = m3.multiply(scaleMatrix, rotationMatrix);
matrix = m3.multiply(matrix, translationMatrix);
...
```

해당 버전입니다.

{{{example url="../webgl-2d-geometry-matrix-transform-trs.html" }}}

이와 같은 행렬을 적용할 수 있다는 것은 신체의 팔, 태양 주변에 있는 행성의 위성, 나무의 가지같은 계층적 애니메이션에 특히 중요합니다.
계층적 애니메이션의 간단한 예제로 'F'를 5번 그리지만 매번 이전의 'F' 행렬로 시작해봅시다.

```js
// 장면 그리기
function drawScene() {
  // 캔버스 지우기
  gl.clear(gl.COLOR_BUFFER_BIT);

  // 행렬 계산
  var translationMatrix = m3.translation(translation[0], translation[1]);
  var rotationMatrix = m3.rotation(angleInRadians);
  var scaleMatrix = m3.scaling(scale[0], scale[1]);

  // 행렬 시작
  var matrix = m3.identity();

  for (var i = 0; i < 5; ++i) {
    // 행렬 곱하기
    matrix = m3.multiply(matrix, translationMatrix);
    matrix = m3.multiply(matrix, rotationMatrix);
    matrix = m3.multiply(matrix, scaleMatrix);

    // 행렬 설정
    gl.uniformMatrix3fv(matrixLocation, false, matrix);

    // Geometry 그리기
    gl.drawArrays(gl.TRIANGLES, 0, 18);
  }
}
```

이를 위해 identity matrix를 만드는 함수, `m3.identity`를 도입했습니다.
Identity matrix는 사실상 1.0을 나타내는 행렬이므로 identity를 곱해도 아무 일도 일어나지 않습니다.

<div class="webgl_center">X * 1 = X</div>

마찬가지로

<div class="webgl_center">matrixX * identity = matrixX</div>

다음은 identity matrix를 만드는 코드입니다.

```js
var m3 = {
  identity function() {
    return [
      1, 0, 0,
      0, 1, 0,
      0, 0, 1,
    ];
  },
  ...
```

다음은 5개의 F입니다.

{{{example url="../webgl-2d-geometry-matrix-transform-hierarchical.html" }}}

예제를 한 가지 더 봐봅시다.
지금까지 모든 샘플에서 'F'는 왼쪽 상단 모서리(예제를 제외하고는 위의 순서를 반대로 했음)를 기준으로 회전했는데요.
이건 우리가 사용하는 수식이 항상 원점을 기준으로 회전하고 'F'의 왼쪽 상단 모서리(0, 0)가 원점에 있기 때문입니다.

하지만 이제 행렬 수학을 할 수 있고 transform이 적용되는 순서를 선택할 수 있기 때문에 원점을 이동할 수 있습니다.

```js
// 'F'의 원점을 중심으로 이동할 행렬 만들기
var moveOriginMatrix = m3.translation(-50, -75);
...

// 행렬 곱하기
var matrix = m3.multiply(translationMatrix, rotationMatrix);
matrix = m3.multiply(matrix, scaleMatrix);
matrix = m3.multiply(matrix, moveOriginMatrix);
```

여기 해당 샘플입니다.
참고로 F는 중심을 기준으로 회전하고 크기가 조정됩니다.

{{{example url="../webgl-2d-geometry-matrix-transform-center-f.html" }}}

이 기술을 사용하면 어떤 지점에서든 회전이나 크기를 조정할 수 있는데요.
이제 Photoshop이나 Flash에서 어떻게 회전점을 이동시키는지 알게 되었습니다.

더 끝내주는 걸 해봅시다.
첫 번째 글인 [WebGL 기초](webgl-fundamentals.html)로 돌아가 보면, 셰이더에 픽셀을 clip space으로 변환하는 코드가 있다는 걸 기억하실 겁니다.

```js
...
// 사각형을 픽셀에서 0.0에서 1.0사이로 변환
vec2 zeroToOne = position / u_resolution;

// 0->1에서 0->2로 변환
vec2 zeroToTwo = zeroToOne * 2.0;

// 0->2에서 -1->+1로 변환 (clip space)
vec2 clipSpace = zeroToTwo - 1.0;

gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
```

이 단계들을 차례대로 살펴보자면, 첫 단계, "픽셀을 0.0에서 1.0사이로 변환", 이건 실제 scale 작업입니다.
두 번째 역시 scale 작업입니다.
다음은 translation이고 마지막으로 Y를 -1로 scale 하는데요.
실제로 우리가 셰이더에 전달한 행렬로 모든 걸 수행할 수 있습니다.
2개의 scale 행렬을 만들 수 있는데,
하나는 1.0/resolution으로 scale하는 것이고,
다른 하나는 2.0으로 scale하는 것이며,
세 번째는 -1.0,-1.0으로 translation하고,
네 번째는 Y를 -1로 scale한 뒤 모든 값을 함께 곱하지만,
대신 수식이 간단하기 때문에,
직접 주어진 해상도에 대한 '투영' 행렬을 생성하는 함수를 바로 만들어 봅시다.

```js
var m3 = {
  projection: function(width, height) {
    // 참고: 이 행렬은 Y축을 뒤집어서 0이 상단에 있도록 합니다.
    return [
      2 / width, 0, 0,
      0, -2 / height, 0,
      -1, 1, 1
    ];
  },

  ...
```

이제 셰이더를 더 단순하게 할 수 있습니다.
여기 완전히 새로운 vertex shader입니다.

```html
<script id="vertex-shader-2d" type="x-shader/x-vertex">
attribute vec2 a_position;

uniform mat3 u_matrix;

void main() {
  // 위치를 행렬로 곱하기
  gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
}
</script>
```

그리고 javascript에서는 projection matrix로 곱해야 합니다.

```js
// 장면 그리기
function drawScene() {
  ...

  // 행렬 계산
  var projectionMatrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);

  ...

  // 행렬 곱하기
  var matrix = m3.multiply(projectionMatrix, translationMatrix);
  matrix = m3.multiply(matrix, rotationMatrix);
  matrix = m3.multiply(matrix, scaleMatrix);

  ...
}
```

또한 해상도를 설정하는 코드를 삭제했는데요.
이 마지막 단계에서 우리는 행렬 수학의 마법 덕분에 6-7단계의 다소 복잡한 셰이더를 고작 1단계의 아주 간단한 셰이더로 바꿨습니다.

{{{example url="../webgl-2d-geometry-matrix-transform-with-projection.html" }}}

계속 진행하기 전에 조금 더 단순하게 해봅시다.
다양한 행렬을 생성하고 따로 곱하는 것이 일반적이지만 생성할 때마다 곱하는 것도 일반적인 방법입니다.
이처럼 효율적으로 함수를 정의할 수 있고

```js
var m3 = {

  ...

  translate: function(m, tx, ty) {
    return m3.multiply(m, m3.translation(tx, ty));
  },

  rotate: function(m, angleInRadians) {
    return m3.multiply(m, m3.rotation(angleInRadians));
  },

  scale: function(m, sx, sy) {
    return m3.multiply(m, m3.scaling(sx, sy));
  },

  ...

};
```

위의 행렬 코드 7줄을 이렇게 4줄로 바꿀 수 있으며

```js
// 행렬 계산
var matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);
matrix = m3.translate(matrix, translation[0], translation[1]);
matrix = m3.rotate(matrix, angleInRadians);
matrix = m3.scale(matrix, scale[0], scale[1]);
```

그리고 해당 결과입니다.

{{{example url="../webgl-2d-geometry-matrix-transform-simpler-functions.html" }}}

마지막으로 하나, 위에서 순서에 따른 문제를 보았습니다.
첫 번째 예제에서는

    translation * rotation * scale

그리고 두 번째에서는

    scale * rotation * translation

이 둘이 어떻게 다른지 봤습니다.

행렬을 보는 두 가지 방법이 있는데요.
주어진 표현식이 다음과 같을 때

    projectionMat * translationMat * rotationMat * scaleMat * position

많은 사람들이 자연스럽게 찾는 첫 방법은 오른쪽에서 시작하여 왼쪽으로 계산하는 겁니다.

먼저 scaledPosition을 얻기 위해 position에 scale 행렬을 곱하고

    scaledPosition = scaleMat * position

그런 다음 rotatedScaledPosition을 얻기 위해 scaledPosition에 rotation 행렬을 곱하며

    rotatedScaledPosition = rotationMat * scaledPosition

다음으로 translatedRotatedScaledPosition를 얻기 위해 rotatedScaledPositon에 translation 행렬을 곱한 뒤

    translatedRotatedScaledPosition = translationMat * rotatedScaledPosition

마지막으로 clip space의 위치를 얻기 위해 projection matrix에 곱하는데

    clipspacePosition = projectioMatrix * translatedRotatedScaledPosition

두 번째 방법은 행렬을 왼쪽에서 오른쪽으로 읽는 건데요.
이 경우 각각의 행렬은 캔버스에 표시되는 *space*를 변경합니다.
캔버스는 각 방향에서 clip space(-1 ~ +1)를 표시하는 것으로 시작하는데요.
왼쪽에서 오른쪽으로 적용된 각 행렬은 캔버스에 표시되는 space를 변경합니다.

1단계: 행렬 없음 (혹은 단위 행렬)

> {{{diagram url="resources/matrix-space-change.html?stage=0" caption="clip space" }}}
>
> 흰색 영역은 캔버스입니다. 파랑색은 캔버스 바깥입니다. 우리는 clip space에 있습니다.
> 전달된 위치는 clip space에 있어야 합니다.

2단계:  `matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);`

> {{{diagram url="resources/matrix-space-change.html?stage=1" caption="clip space에서 pixel space으로" }}}
>
> 이제 픽셀 공간에 있습니다. X = 0에서 400, Y = 0에서 300, 왼쪽 상단은 0,0 입니다.
> 이 행렬을 사용하여 전달된 위치는 픽셀 공간에 있어야 합니다.
> 공간이 +Y = 상단에서 -Y = 하단으로 뒤집힐 때의 순간을 보실 수 있습니다.

3단계:  `matrix = m3.translate(matrix, tx, ty);`

> {{{diagram url="resources/matrix-space-change.html?stage=2" caption="원점을 tx, ty로 이동" }}}
>
> 원점은 이제 tx, ty (150, 100)로 이동됐습니다. Space도 이동했습니다.

4단계:  `matrix = m3.rotate(matrix, rotationInRadians);`

> {{{diagram url="resources/matrix-space-change.html?stage=3" caption="33도 회전" }}}
>
> Space가 tx, ty를 중심으로 회전됐습니다. 

5단계:  `matrix = m3.scale(matrix, sx, sy);`

> {{{diagram url="resources/matrix-space-change.html?stage=4" caption="space 크기 조정" }}}
>
> 이전에 tx, ty을 중심으로 회전된 space는, x는 2로 y는 1.5로 scale 되었습니다.

셰이더에서 `gl_Position = matrix * position;`을 실행하는데요.
`position` 값은 마지막 space에서 유효합니다.

이해하기 더 쉽다고 느껴지는 방법을 사용하시면 됩니다.

이 포스트가 행렬 수학을 이해하는데 도움이 되었기를 바랍니다.
2D를 계속 하고 싶다면 [Canvas 2D의 drawImage 함수 재현](webgl-2d-drawimage.html)과 [Canvas 2D의 행렬 스택 재현](webgl-2d-matrix-stack.html)을 봐주세요.

그게 아니라면 다음은 [3D](webgl-3d-orthographic.html)로 넘어갑니다.
3D에서 행렬 수학은 동일한 원리과 사용법을 따르는데요.
2D부터 시작해서 이해하기 쉽도록 만들었습니다.

또한 정말로 행렬 수학의 전문가가 되고 싶다면 [이 놀라운 영상](https://www.youtube.com/watch?v=kjBOesZCoqc&list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab)을 확인하세요.

<div class="webgl_bottombar">
<h3><code>clientWidth</code>와 <code>clientHeight</code>가 뭔가요?</h3>
<p>
지금까지는 캔버스의 넓이를 참조할 때마다 <code>canvas.width</code>와 <code>canvas.height</code>를 사용했지만 위에서 <code>m3.projection</code>를 호출할 때는 <code>canvas.clientWidth</code>와 <code>canvas.clientHeight</code>를 사용했습니다.
왜일까요?
</p>
<p>
Projection matrix은 clip space(각 치수마다 -1 ~ +1)를 가져와서 다시 픽셀로 변환하는 방법과 관련이 있습니다.
하지만 브라우저에는 두 가지 type의 픽셀이 있는데요.
하나는 캔버스 자체의 픽셀 수입니다.
예를 들어 이렇게 정의된 캔버스가 있습니다.
</p>
<pre class="prettyprint">
  &lt;canvas width="400" height="300"&gt;&lt;/canvas&gt;
</pre>
<p>혹은 이렇게 정의됩니다.</p>
<pre class="prettyprint">
  var canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 300;
</pre>
<p>
둘 다 너비가 400px이고 높이가 300px인 이미지를 포함합니다.
하지만 이 크기는 실제로 브라우저가 캔버스를 400x300px로 표시하는 크기와는 별도인데요.
CSS는 캔버스가 표시되는 크기를 정의합니다.
예를 들어 이렇게 캔버스를 만든다고 해봅시다.
</p>
<pre class="prettyprint">
  &lt;style&gt;
    canvas {
      width: 100vw;
      height: 100vh;
    }
  &lt;/style&gt;
  ...
  &lt;canvas width="400" height="300">&lt;/canvas&gt;
</pre>
<p>
컨테이너의 크기에 상관없이 캔버스가 표시될 겁니다.
400x300은 아닌 것 같군요.
</p>
<p>
여기 캔버스의 CSS 표시 크기를 100%로 설정해서 캔버스가 페이지를 채우도록 늘어나는 두 예제가 있습니다.
첫 번째는 <code>canvas.width</code>와 <code>canvas.height</code>를 사용하는 겁니다.
새로운 창을 열고 창 크기를 조절해보세요.
'F'가 올바른 모양을 가지는지 확인해봅시다.
왜곡되고 있는데요.
</p>
{{{example url="../webgl-canvas-width-height.html" width="500" height="150" }}}
<p>
두 번째 예제에서는 <code>canvas.clientWidth</code>와 <code>canvas.clientHeight</code>를 사용합니다.
<code>canvas.clientWidth</code>와 <code>canvas.clientHeight</code>는 캔버스가 실제 브라우저에서 표시되는 크기를 알려주기 때문에, 이 경우 캔버스는 여전히 400x300 픽셀이지만 캔버스가 표시되는 크기에 따라 종횡비를 정의하고 있으므로 <code>F</code>는 항상 올바르게 보입니다.
</p>
{{{example url="../webgl-canvas-clientwidth-clientheight.html" width="500" height="150" }}}
<p>
캔버스의 크기를 조절할 수 있는 대부분의 앱은 <code>canvas.width</code>와 <code>canvas.height</code>를 <code>canvas.clientWidth</code>와 <code>canvas.clientHeight</code>에 맞추려고 하는데, 그 이유는 브라우저에 표시되는 각 픽셀에 대해 캔버스에 하나의 픽셀이 있기를 원하기 때문입니다.
위에서 보셨듯이 그게 유일한 선택지는 아닙니다.
하지만 거의 모든 경우에 <code>canvas.clientHeight</code>와 <code>canvas.clientWidth</code>를 사용해서 projection matrix의 종횡비를 계산하는 것이 기술적으로 더 정확합니다.
</p>
</div>


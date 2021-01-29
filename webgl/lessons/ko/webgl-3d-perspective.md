Title: WebGL 3D Perspective
Description: WebGL에서 3D로 perspective를 표시하는 방법
TOC: 3D Perspective


이 포스트는 WebGL 관련 시리즈의 연장입니다.
첫 번째는 [기초](webgl-fundamentals.html)로 시작했고 이전에는 [3D 기초](webgl-2d-matrices.html)에 관한 것이었습니다.
혹시 읽지 않으셨다면 해당 글들을 먼저 읽어주세요.

지난 포스트에서 어떻게 3D를 하는지 살펴봤지만 해당 3D는 어떤 perspective도 가지지 않았는데요.
"orthographic"이라 불리는 방법을 사용했지만 이건 사람들이 "3D"를 말할 때 일반적으로 원하는 게 아닙니다.

대신에 perspective를 추가해야 합니다.
perspective란 뭘까요?
기본적으로 더 멀리 있는 것들이 더 작게 보이는 기능입니다.

<img class="webgl_center noinvertdark" width="500" src="resources/perspective-example.svg" />

위 예시를 보면 더 멀리 있는 것들이 더 작게 그려지는 걸 볼 수 있습니다.
현재 샘플을 감안할 때 더 멀리 있는 것들이 더 작게 보이도록 만드는 쉬운 방법은 clip space의 X와 Y를 Z로 나누는 겁니다.

(10, 15)에서 (20,15)까지 10만큼 긴 선이 있다고 생각해보세요.
현재 샘플에서 이건 10픽셀의 길이로 그려질 겁니다.
하지만 Z로 나눈다면 예를 들어 Z가 1인 경우

<pre class="webgl_center">
10 / 1 = 10
20 / 1 = 20
abs(10-20) = 10
</pre>

길이는 10픽셀이 되고, Z가 2라고 한다면

<pre class="webgl_center">
10 / 2 = 5
20 / 2 = 10
abs(5 - 10) = 5
</pre>

길이는 5픽셀이 됩니다. Z = 3의 경우에는

<pre class="webgl_center">
10 / 3 = 3.333
20 / 3 = 6.666
abs(3.333 - 6.666) = 3.333
</pre>

Z가 증가할수록, 멀어질수록, 더 작게 그려지는 걸 볼 수 있습니다.
clip space에서 나누면 Z가 더 작은 숫자(-1에서 +1)이기 때문에 더 나은 결과를 얻을 수 있는데요.
나누기 전에 Z를 fudgeFactor와 곱하면 주어진 거리에 따라 얼마나 작게 할지 조정할 수 있습니다.

한 번 해봅시다.
먼저 "fudgeFactor"를 곱한 뒤 Z로 나누도록 vertex shader를 수정합니다.

```
<script id="vertex-shader-3d" type="x-shader/x-vertex">
...
+uniform float u_fudgeFactor;
...
void main() {
  // matrix로 position 곱하기
  vec4 position = u_matrix * a_position;

+  // 나누려는 z 조정
+  float zToDivideBy = 1.0 + position.z * u_fudgeFactor;

*  // x와 y를 z로 나누기
*  gl_Position = vec4(position.xy / zToDivideBy, position.zw);
}
</script>
```

참고로, Z가 -1에서 +1까지인 clip space에 있기 때문에 0에서 +2 * fudgeFactor까지인 `zToDivideBy`를 얻기 위해 1을 더했습니다.

또한 fudgeFactor를 설정할 수 있도록 코드를 업데이트해야 합니다.

```
  ...
  var fudgeLocation = gl.getUniformLocation(program, "u_fudgeFactor");

  ...
  var fudgeFactor = 1;
  ...
  function drawScene() {
    ...
    // fudgeFactor 설정
    gl.uniform1f(fudgeLocation, fudgeFactor);

    // geometry 그리기
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 16 * 6;
    gl.drawArrays(primitiveType, offset, count);
```

그리고 여기 결과입니다.

{{{example url="../webgl-3d-perspective.html" }}}

알아보기 힘들다면 Z로 나누는 코드를 추가하기 전 어떤 모습이었는지 보기 위해 "fudgeFactor" 슬라이더를 1.0에서 0.0으로 드래그해보세요.

<img class="webgl_center" src="resources/orthographic-vs-perspective.png" />
<div class="webgl_center">orthographic vs perspective</div>

WebGL은 vertex shader의 `gl_Position`에 할당한 x,y,z,w 값을 가져와 자동으로 w로 나눕니다.

이는 shader를 변경하여 직접 나누는 대신 `gl_Position.w`에 `zToDivideBy`를 넣어서 쉽게 증명할 수 있는데요.

```
<script id="vertex-shader-2d" type="x-shader/x-vertex">
...
uniform float u_fudgeFactor;
...
void main() {
  // matrix로 position 곱하기
  vec4 position = u_matrix * a_position;

  // 나누려는 z 조정
  float zToDivideBy = 1.0 + position.z * u_fudgeFactor;

  // x, y, z를 zToDivideBy로 나누기
*  gl_Position = vec4(position.xyz, zToDivideBy);

  // fragment shader로 color 전달
  v_color = a_color;
}
</script>
```

그리고 얼마나 정확하게 동일한지 봅시다.

{{{example url="../webgl-3d-perspective-w.html" }}}

WebGL이 자동으로 W로 나눈다는 사실이 유용한 이유는 뭘까요? 
왜냐하면 이제, 더 많은 행렬을 사용하여, z를 w에 복사하기 위해 또 다른 행렬을 사용할 수 있기 때문입니다.

이런 행렬이

<div class="webgl_math_center"><pre class="webgl_math">
1, 0, 0, 0,
0, 1, 0, 0,
0, 0, 1, 1,
0, 0, 0, 0,
</pre></div>

z를 w에 복사할 겁니다. 각 열을 다음과 같이 볼 수 있으며

<div class="webgl_math_center"><pre class="webgl_math">
x_out = x_in * 1 +
        y_in * 0 +
        z_in * 0 +
        w_in * 0 ;

y_out = x_in * 0 +
        y_in * 1 +
        z_in * 0 +
        w_in * 0 ;

z_out = x_in * 0 +
        y_in * 0 +
        z_in * 1 +
        w_in * 0 ;

w_out = x_in * 0 +
        y_in * 0 +
        z_in * 1 +
        w_in * 0 ;
</pre></div>

이를 단순화하면

<div class="webgl_math_center"><pre class="webgl_math">
x_out = x_in;
y_out = y_in;
z_out = z_in;
w_out = z_in;
</pre></div>

우리는 `w_in`이 항상 1.0이라는 걸 알기 때문에 이전에 가졌던 +1을 이 행렬에 더할 수 있습니다.

<div class="webgl_math_center"><pre class="webgl_math">
1, 0, 0, 0,
0, 1, 0, 0,
0, 0, 1, 1,
0, 0, 0, 1,
</pre></div>

다음과 같이 W 계산을 바뀌고

<div class="webgl_math_center"><pre class="webgl_math">
w_out = x_in * 0 +
        y_in * 0 +
        z_in * 1 +
        w_in * 1 ;
</pre></div>

`w_in` = 1.0임을 알기 때문에

<div class="webgl_math_center"><pre class="webgl_math">
w_out = z_in + 1;
</pre></div>

마지막으로 행렬이 다음과 같으면 fudgeFactor을 다시 사용할 수 있는데

<div class="webgl_math_center"><pre class="webgl_math">
1, 0, 0, 0,
0, 1, 0, 0,
0, 0, 1, fudgeFactor,
0, 0, 0, 1,
</pre></div>

이게 의미하는 건

<div class="webgl_math_center"><pre class="webgl_math">
w_out = x_in * 0 +
        y_in * 0 +
        z_in * fudgeFactor +
        w_in * 1 ;
</pre></div>

그리고 단순화해서

<div class="webgl_math_center"><pre class="webgl_math">
w_out = z_in * fudgeFactor + 1;
</pre></div>

자, 행렬만 사용하도록 다시 프로그램을 수정해봅시다.

먼저 vertex shader를 되돌려 놓으면

```
<script id="vertex-shader-2d" type="x-shader/x-vertex">
uniform mat4 u_matrix;

void main() {
  // matrix로 position 곱하기
  gl_Position = u_matrix * a_position;
  ...
}
</script>
```

다음으로 Z &rarr; W 행렬을 만드는 함수를 만들어 봅시다.

```
function makeZToWMatrix(fudgeFactor) {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, fudgeFactor,
    0, 0, 0, 1,
  ];
}
```

그리고 그걸 사용하도록 코드를 변경할 겁니다.

```
    ...
    // 행렬 계산
*    var matrix = makeZToWMatrix(fudgeFactor);
*    matrix = m4.multiply(matrix, m4.projection(gl.canvas.clientWidth, gl.canvas.clientHeight, 400));
    matrix = m4.translate(matrix, translation[0], translation[1], translation[2]);
    matrix = m4.xRotate(matrix, rotation[0]);
    matrix = m4.yRotate(matrix, rotation[1]);
    matrix = m4.zRotate(matrix, rotation[2]);
    matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);

    ...
```

그리고 다시 말하지만 정확하게 동일합니다.

{{{example url="../webgl-3d-perspective-w-matrix.html" }}}

모든 건 기본적으로 Z로 나누는 게 perspective를 제공하고 WebGL이 편리하게 Z로 나눠준다는 걸 보여주기 위한 겁니다.

하지만 여전히 몇 가지 문제가 있습니다.
예를 들어 Z를 -100 정도로 설정하면 아래 애니메이션같은 걸 보게 될텐데

<img class="webgl_center" src="resources/z-clipping.gif" style="border: 1px solid black;" />

어떻게 된거죠?
F가 일찍 사라지는 이유는 뭘까요?
WebGL은 X와 Y 혹은 +1에서 -1까지 자르는 것처럼 Z도 제한하는데요.
여기서 우리가 보고 있는 건 Z < -1 입니다.

이를 해결하기 위해 수학에 대한 자세한 설명을 할 수도 있지만 [2D projection을 했던 것과 같은 방법](https://stackoverflow.com/a/28301213/128511)으로 도출할 수도 있습니다.
Z를 가져오고 약간을 더하고 어느정도 scale해야 하며, 원하는 범위를 -1에서 +1사이로 다시 매핑할 수 있습니다.

멋진 점은 이 모든 단계를 하나의 행렬로 수행할 수 있다는 겁니다.
더 좋은 건, `fudgeFactor`보다는 `fieldOfView`를 결정하고 올바른 값을 계산할 겁니다.

다음은 행렬을 만드는 함수입니다.

```
var m4 = {
  perspective: function(fieldOfViewInRadians, aspect, near, far) {
    var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
    var rangeInv = 1.0 / (near - far);

    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0
    ];
  },

  ...
```

이 행렬이 모든 변환을 수행할 겁니다.
단위가 clip space 안에 있도록 조정되고, 수식을 수행하여 각도별로 시야를 선택할 수 있고 Z-clipping space를 선택할 수 있는데요.
원점(0, 0, 0)에 *눈* 혹은 *카메라*가 있다고 가정하고 `zNear`와 `fieldOfView`가 주어지면 `Z = -1`이 되도록 `zNear`에 있는 항목에 필요한 값을 계산하며 중앙에서 `fieldOfView`의 절반만큼 위 혹은 아래인 `zNear`에 있는 항목은 각각 `Y = -1`과 `Y = 1`로 끝납니다
전달된 `aspect`로 곱하여 X에 사용할 값을 계산합니다.
일반적으로 디스플레이 영역의 `width / height`에 설정합니다.
마지막으로, `Z = 1`이 되도록 zFar에 있는 항목을 얼마나 scale 할지 알아냅니다.

다음은 실행중인 행렬의 다이어그램입니다.

{{{example url="../frustum-diagram.html" width="400" height="600" }}}

내부에서 큐브가 회전하고 있는 4면 원뿔 모양을 "절두체"라고 합니다.
행렬은 절두체 안에 있는 공간을 가져와서 clip space로 변환하는데요.
`zNear`는 물체의 앞쪽이 잘리는 곳을 정의하고 `zFar`는 물체의 뒤쪽이 잘리는 곳을 정의합니다.
`zNear`를 23으로 설정하면 회전하는 큐브의 앞면이 잘리는 걸 볼 수 있죠.
`zFar`를 24로 설정하면 큐브의 뒷면이 잘리는 걸 볼 수 있습니다.

이제 남은 문제는 단 하나입니다.
이 행렬은 0,0,0에 뷰어가 있다고 가정하고, -Z 방향으로 보고 있고 +Y가 위쪽이라고 가정하는데요.
지금까지의 행렬은 다른 방식으로 작업을 수행했습니다.

이걸 보이게 하려면 절두체 안으로 옮겨야 합니다.
F를 움직여서 해당 작업을 할 수 있는데요.
기존에는 (45, 150, 0)에 그리고 있었습니다.
(-150, 0, -360)로 옮기고 오른쪽이 위로 보이도록 rotation을 설정합시다.

이제, 이를 사용하려면 `m4.projection`에 대한 기존 호출을 `m4.perspective`에 대한 호출로 바꾸면 되는데

```
var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
var zNear = 1;
var zFar = 2000;
var matrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);
matrix = m4.translate(matrix, translation[0], translation[1], translation[2]);
matrix = m4.xRotate(matrix, rotation[0]);
matrix = m4.yRotate(matrix, rotation[1]);
matrix = m4.zRotate(matrix, rotation[2]);
matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);
```

그리고 여기 있습니다.

{{{example url="../webgl-3d-perspective-matrix.html" }}}

다시 행렬 곱셉으로 돌아가서 시야각을 확보하고 Z space를 선택할 수 있습니다.
아직 끝나지 않았지만 글이 너무 길어지고 있군요.
다음은, [camera]](webgl-3d-camera.html)입니다.

<div class="webgl_bottombar">
<h3>Why did we move the F so far in Z (-360)?</h3>

<p>
In the other samples we had the F at (45, 150, 0) but in the last sample it's been moved to (-150, 0, -360).
Why did it need to be moved so far away?
</p>

<p>
The reason is up until this last sample our <code>m4.projection</code> function has made a projection from pixels to clip space.
That means the area we were displaying represented 400x300 pixels.
Using 'pixels' really doesn't make sense in 3D. 
</p>

<p>
In other words if we tried to draw with the F at 0,0,0 and not rotated we'd get this
</p>

<div class="webgl_center"><img src="resources/f-big-and-wrong-side.svg" style="width: 500px;"></div>

<p>
The F has its top left front corner at the origin.
The projection looks toward negative Z but our F is built in positive Z.
The projection has positive Y up but our F is built with positive Z down.
</p>

<p>
Our new projection only sees what's in the blue frustum.
With -zNear = 1 and with a field of view of 60 degrees then at Z = -1 the frustum is only 1.154 units tall and 1.154 * aspect units wide. At Z = -2000 (-zFar) its 2309 units tall.
Since our F is 150 units big and the view can only see 1.154 units when something is at <code>-zNear</code> we need to move it pretty far away from the origin to see all of it.
</p>


<p>
Moving it -360 units in Z moves in inside the frustum. We also rotated it to be right side up.
</p>

<div class="webgl_center"><img src="resources/f-right-side.svg" style="width: 500px;"><div>not to scale</div></div>

</div>

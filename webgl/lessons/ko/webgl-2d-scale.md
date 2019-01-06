Title: WebGL 2D 크기
Description: 2D에서 크기 조정하는 방법

이 글은 WebGL 관련 시리즈에서 이어지는 글입니다.
첫 번째는 [기초로 시작했고](webgl-fundamentals.html) 이전에는 [geometry 회전에 대해](webgl-2d-rotation.html) 다뤘습니다.

크기 조정은 [이동만큼이나](webgl-2d-translation.html) 쉽습니다.

원하는 크기로 위치 값을 곱하면 되는데요.
이건 [이전 예제를](webgl-2d-rotation.html) 수정한 겁니다.

```
<script id="2d-vertex-shader" type="x-shader/x-vertex">
attribute vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_rotation;
+uniform vec2 u_scale;

void main() {
+  // 위치 크기 조정
+  vec2 scaledPosition = a_position * u_scale;

  // 위치 회전
  vec2 rotatedPosition = vec2(
*     scaledPosition.x * u_rotation.y + scaledPosition.y * u_rotation.x,
*     scaledPosition.y * u_rotation.y - scaledPosition.x * u_rotation.x);

  // 추가 이동
  vec2 position = rotatedPosition + u_translation;
```

그리고 그릴 때 크기를 조정하기 위해 필요한 JavaScript를 추가합니다.

```
  ...

+  var scaleLocation = gl.getUniformLocation(program, "u_scale");

  ...

+  var scale = [1, 1];

  ...

  // 화면 그리기
  function drawScene() {

    ...

    // 이동 설정
    gl.uniform2fv(translationLocation, translation);

    // 회전 설정
    gl.uniform2fv(rotationLocation, rotation);

+    // 크기 설정
+    gl.uniform2fv(scaleLocation, scale);

    // geometry 그리기
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 18;  // 'F'에 삼각형 6개, 삼각형마다 점 3개
    gl.drawArrays(primitiveType, offset, count);
  }
```

그러면 이제 크기를 가집니다.
슬라이더를 드래그해보세요.

{{{example url="../webgl-2d-geometry-scale.html" }}}

한 가지 알아두셔야 할 점은 음수로 크기를 조정하면 geometry가 뒤집힌다는 겁니다.

지난 세 글이 [이동](webgl-2d-translation.html), [회전](webgl-2d-rotation.html) 그리고 크기를 이해하는데 도움이 되셨기 바랍니다.

다음에는 이 세 가지를 훨씬 간단하고 유용한 형태로 합쳐주는 [행렬의 마법을](webgl-2d-matrices.html) 살펴보겠습니다.

<div class="webgl_bottombar">
<h3>왜 'F' 인가요?</h3>
<p>
처음에 누군가가 texture에 'F'를 사용하는 것을 봤습니다.
'F' 자체는 중요하지 않습니다.
중요한 것은 어느 방향에서든 방향를 알 수 있다는 겁니다.
만약 하트 ❤나 삼각형 △을 썼다면 예를들어 그게 수평으로 뒤집혔는지 알 수 없습니다.
원 ○은 더 안 좋겠죠.
색이 있는 사각형은 각 모서리의 색이 다르지만 각 모서리가 어떤 것인지 기억하고 있어야 합니다.
F의 방향은 바로 인지할 수 있습니다.
</p>
<img src="../../resources/f-orientation.svg" class="webgl_center"/>
<p>
방향을 알 수 있는 어떤 모양이라도 동작하겠지만, 처음으로 소개받은 아이디어여서 계속 'F'를 사용하고 있습니다. 
</p>
</div>

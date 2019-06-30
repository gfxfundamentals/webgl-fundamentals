Title: WebGL 2D 회전
Description: 2D에서 회전하는 방법
TOC: WebGL 2D 회전


이 글은 WebGL 관련 시리즈에서 이어지는 글입니다.
첫 번째는 [기초로 시작했고](webgl-fundamentals.html) 이전에는 [geometry 이동에 대해](webgl-2d-translation.html) 다뤘습니다.

이걸 제가 잘 설명할 수 있을지는 모르겠지만 뭐 어때요, 시도는 해봅시다.

먼저 "unit circle" 이라고 불리는 것을 소개하려고 하는데요.
중학교 수학을 기억해본다면(저처럼 졸지 마세요!) 원은 반지름을 가집니다.
원의 반지름은 원의 중심에서 가장자리까지의 거리인데요.
"unit circle"은 반지름이 1.0인 원입니다.

여기 unit circle 입니다.

{{{diagram url="../unit-circle.html" width="300" height="300" }}}

참고로 파란색 핸들을 원 주위로 드래그하면 X와 Y의 위치가 변경됩니다.
X와 Y는 원 위에 있는 점의 위치를 나타내는데요.
상단에서 Y는 1이고 X는 0이며, 우측에서 X는 1이고 Y는 0입니다.

3학년 기초 수학을 기억해본다면 뭔가에 1을 곱해도 값은 똑같이 유지됩니다.
그래서 123 * 1 = 123 입니다.
굉장히 기본적이죠?
음, 반지름이 1.0인 원 unit circle 또한 1의 형태입니다.
회전할 때도 1입니다.
그러므로 "unit circle"에 어떤 값으로 곱할 수 있고 마법이 일어나서 회전하는 걸 제외하고는 1을 곱하는 것과 마찬가지입니다.

unit circle 위에 있는 어떤 점에서 X와 Y의 값을 가져와서 [이전 예제](webgl-2d-translation.html)의 geometry에 곱하려고 하는데요.

shader에 다시 작성한 내용은 다음과 같습니다.

    <script id="2d-vertex-shader" type="x-shader/x-vertex">
    attribute vec2 a_position;

    uniform vec2 u_resolution;
    uniform vec2 u_translation;
    +uniform vec2 u_rotation;

    void main() {
    +  // 위치 회전
    +  vec2 rotatedPosition = vec2(
    +     a_position.x * u_rotation.y + a_position.y * u_rotation.x,
    +     a_position.y * u_rotation.y - a_position.x * u_rotation.x);

      // 이동 추가
    *  vec2 position = rotatedPosition + u_translation;

그리고 JavaScript를 재작성하면 두 값을 전달할 수 있습니다.

      ...

    +  var rotationLocation = gl.getUniformLocation(program, "u_rotation");

      ...

    +  var rotation = [0, 1];

      ...

      // 화면 그리기
      function drawScene() {

        ...

        // 이동 설정
        gl.uniform2fv(translationLocation, translation);

    +    // 회전 설정
    +    gl.uniform2fv(rotationLocation, rotation);

        // geometry 그리기
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 18;  // 6 triangles in the 'F', 3 points per triangle
        gl.drawArrays(primitiveType, offset, count);
      }

그리고 이게 결과입니다.
원 위에 있는 핸들을 드래그해서 회전시키거나 슬라이더를 드래그해서 이동시켜보세요.

{{{example url="../webgl-2d-geometry-rotation.html" }}}

왜 동작할까요?
음, 수식을 봅시다.

    rotatedX = a_position.x * u_rotation.y + a_position.y * u_rotation.x;
    rotatedY = a_position.y * u_rotation.y - a_position.x * u_rotation.x;

사각형이 하나 있고 그걸 회전시키고 싶다고 해봅시다.
회전시키기 전 우측 상단 모서리는 3.0, 9.0 인데요.
unit circle 위에 12시부터 시계 방향 30도 간격으로 점을 찍어봅시다.

<img src="../resources/rotate-30.png" class="webgl_center" />

원의 위치는 0.50 그리고 0.87 입니다.

<pre class="webgl_center">
   3.0 * 0.87 + 9.0 * 0.50 = 7.1
   9.0 * 0.87 - 3.0 * 0.50 = 6.3
</pre>

이게 바로 우리가 필요로 하는겁니다.

<img src="../resources/rotation-drawing.svg" width="500" class="webgl_center"/>

시계방향으로 60도 또한 동일합니다. 

<img src="../resources/rotate-60.png" class="webgl_center" />

원의 위치는 0.87 그리고 0.50 입니다.

<pre class="webgl_center">
   3.0 * 0.50 + 9.0 * 0.87 = 9.3
   9.0 * 0.50 - 3.0 * 0.87 = 1.9
</pre>

우리는 점을 오른쪽 시계 방향으로 돌릴 때 X는 값이 커지고 Y는 작아지는 것을 볼 수 있습니다.
만약 90도를 넘어가면 X는 다시 작아지고 Y는 점점 커질 것 입니다.
이 패턴은 우리에게 회전이 가능하도록 해줍니다.

unit circle 위에 있는 점들은 또 다른 이름을 가지고 있는데요.
바로 sine 그리고 cosine 입니다.
그래서 주어진 어떤 각에 대해 우리는 이처럼 sine과 cosine을 찾을 수 있습니다.

    function printSineAndCosineForAnAngle(angleInDegrees) {
      var angleInRadians = angleInDegrees * Math.PI / 180;
      var s = Math.sin(angleInRadians);
      var c = Math.cos(angleInRadians);
      console.log("s = " + s + " c = " + c);
    }

JavaScript console에 코드를 복사 붙여넣고 `printSineAndCosignForAngle(30)`라고 치면 `s = 0.49 c = 0.87`라는 출력을 볼 수 있습니다.
(참고로 저는 반올림했습니다)

모든 것을 함께 넣으면 도형을 원하는 각도로 회전할 수 있습니다.
그저 회전하려는 각도의 sine과 cosine으로 rotation을 설정하면 됩니다. 

      ...
      var angleInRadians = angleInDegrees * Math.PI / 180;
      rotation[0] = Math.sin(angleInRadians);
      rotation[1] = Math.cos(angleInRadians);

다음은 각도 설정이 있는 버전입니다.
슬라이더를 드래그해서 이동하거나 회전시켜보세요.

{{{example url="../webgl-2d-geometry-rotation-angle.html" }}}

이게 어떤 의미인지 이해되셨으면 좋겠습니다.
이건 회전시키는 일반적인 방법이 아니므로 계속해서 글 2개를 더 읽어주세요.
다음으로 다룰 것은 간단한 건데요.
[바로 크기입니다](webgl-2d-scale.html).

<div class="webgl_bottombar"><h3>radian이 뭔가요?</h3>
<p>
Radian 원, 회전 그리고 각도에 사용되는 측정 단위입니다.
마치 거리를 inche, yard, meters 등으로 측정할 수 있는 것처럼 우리는 각도를 degree나 radian으로 측정할 수 있습니다.
</p>
<p>
아마 imperial 측정법보다 metric 측정법이 더 쉽다는 걸 아실텐데요.
inche에서 feet으로 가려면 12로 나눠야 합니다.
inche에서 yard으로 가려면 36로 나눠야 합니다.
당신은 모르겠지만 저는 암산으로 36으로 나누지 못합니다.
metric 측정법이 훨씬 쉽죠.
millimeter에서 centimeter로 가려면 10으로 나눠야 합니다.
millimeter에서 meter로 가려면 1000으로 곱해야 합니다.
저는 암산으로 1000은 <strong>곱할 수 있어요</strong>.
</p>
<p>
Radian vs degree 둘은 비슷합니다.
Degree는 수학을 어렵게 만들고 Radian은 수학을 쉽게 만듭니다.
원에는 360도가 있지만 radian으로는 2π만 있습니다.
따라서 한바퀴는 2π radian이고 반바퀴는 1π radian입니다.
1/4바퀴는 90도면서 1/2π radian 이죠.
그러니 어떤 것을 90도 회전하고 싶다면 <code>Math.PI * 0.5</code>를 쓰세요.
만약 45도로 회전하고 싶다면 <code>Math.PI * 0.25</code> 등으로 쓸 수 있습니다.
</p>
<p>
각도, 원 또는 회전을 포함하는 거의 모든 수학은 radian으로 생각하기 시작하면 매우 간단하게 동작합니다.
그러니 한 번 시도해보세요.
UI display를 제외하고 degree가 아닌 radian을 사용해보세요. 
</p>
</div>

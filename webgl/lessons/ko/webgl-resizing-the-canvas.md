Title: WebGL Canvas 크기 조정
Description: WebGL Canvas 크기 조정 및 관련 문제 해결법
TOC: Canvas 크기 조정


Canvas 크기를 바꾸기 위해 알아야 할 것들이 있습니다.

모든 canvas는 두 가지 크기를 가지고 있습니다.
먼저 drawingbuffer라는 크기인데요.
이건 canvas에 있는 픽셀 수입니다.
두 번째 크기는 canvas가 표시되는 크기인데요.
CSS는 canvas가 표시되는 크기를 결정합니다.

두 가지 방법으로 canvas의 drawingbuffer를 설정할 수 있는데요.
하나는 HTML을 이용해서

    <canvas id="c" width="400" height="300"></canvas>

다른 방법은 JavaScript를 이용하는

    <canvas id="c" ></canvas>

JavaScript

    var canvas = document.querySelector("#c");
    canvas.width = 400;
    canvas.height = 300;


만약 canvas의 표시 크기에 영향을 주는 CSS가 없다면 표시 크기는 drawingbuffer와 동일한 크기가 되는데요.
위 두 예제에서 canvas의 drawingbuffer는 400x300이며 표시 크기 또한 400x300이 됩니다.

다음은 페이지에 400x300 픽셀로 표시되고 drawingbuffer가 10x15 픽셀인 canvas의 예제인데

    <canvas id="c" width="10" height="15" style="width: 400px; height: 300px;"></canvas>

혹은 이 예제처럼

    <style>
    #c {
      width: 400px;
      height: 300px;
    }
    </style>
    <canvas id="c" width="10" height="15"></canvas>

만약 canvas에 단일 픽셀 너비의 회전하는 선을 그리면 이런 걸 볼 수 있는데

{{{example url="../webgl-10x15-canvas-400x300-css.html" }}}

왜 이렇게 흐릿할까요?
그건 브라우저가 10x15 픽셀 canvas를 가져와서 400x300 픽셀로 늘이고 일반적으로 늘릴 때 filtering하기 때문입니다.

그럼, 예를 들어, canvas로 창을 꽉 채우고 싶다면 어떻게 해야 할까요?
음, 우선 브라우저가 CSS로 canvas를 늘려 창을 채우게 할 수 있습니다.

    <html>
      <head>
        <style>
          /* border 제거 */
          body {
            border: 0;
            background-color: white;
          }
          /* canvas를 viewport 크기로 만들기 */
          canvas {
            width: 100vw;
            height: 100vh;
            display: block;
          }
        <style>
      </head>
      <body>
        <canvas id="c"></canvas>
      </body>
    </html>

이제 브라우저가 canvas를 늘린 크기와 일치하는 drawingbuffer를 만들어야 하는데요.
HTML의 모든 요소가 가진 `clientWidth`와 `clientHeight`를 사용하면 해당 요소가 표시되는 크기를 JavaScript로 확인할 수 있습니다.

    function resize(canvas) {
      // 브라우저가 canvas를 표시하고 있는 크기 탐색
      var displayWidth  = canvas.clientWidth;
      var displayHeight = canvas.clientHeight;

      // canvas가 같은 크기가 아닌지 확인
      if (canvas.width  != displayWidth ||
          canvas.height != displayHeight) {

        // canvas를 동일한 크기로 만들기
        canvas.width  = displayWidth;
        canvas.height = displayHeight;
      }
    }

대부분의 WebGL 앱들은 <a href="webgl-animation.html">애니메이션</a>되므로 렌더링 전에 이 함수를 호출하여 그리기 직전에 항상 canvas를 원하는 크기로 조정하겠습니다.

    function drawScene() {
      resize(gl.canvas);

      ...
    }

그리고 여기에

{{{example url="../webgl-resize-canvas.html" }}}

뭐가 잘못됐죠?
왜 선이 전체 영역을 덮지 않을까요?

그 이유는 canvas를 크기 조정할 때 viewport를 설정하기 위해 `gl.viewport`를 호출해야 하기 때문입니다.
`gl.viewport`는 WebGL에게 clip space(-1 ~ +1)에서 픽셀로 변환하는 방법과 canvas 내에서 그걸 작동시키는 위치를 알려줍니다.
WebGL context를 처음 만들 때 WebGL은 canvas와 같은 크기로 viewport를 설정하지만 이후에는 사용자가 설정합니다.
만약 canvas 크기를 변경한다면 WebGL에게 새로운 viewport 설정을 알려줘야 합니다.

이걸 처리하기 위해 코드를 바꿔봅시다.
덧붙이자면, WebGL context가 canvas에 대한 참조를 가지므로 resize로 전달해보겠습니다.

    function drawScene() {
      resize(gl.canvas);

    +  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      ...
    }

이제 동작합니다.

{{{example url="../webgl-resize-canvas-viewport.html" }}}

별도의 창에서 열고, 창 크기를 바꿔도, 항상 창을 꽉 채웁니다.

이렇게 물어보실 수 있는데, 왜 canvas 크기를 변경할 때 WebGL이 자동으로 viewport를 설정해주지 않나요?
그 이유는 viewport를 어떻게 혹은 왜 사용하는지 모르기 때문입니다.
가령 framebuffer로 렌더링하거나 다른 viewport 크기가 필요한 다른 작업을 수행할 수 있는데요.
WebGL은 당신의 의도를 알 수 없으므로 자동으로 viewport를 설정할 수 없습니다.

많은 WebGL program을 살펴보면 다양한 방법으로 canvas 크기 조정이나 설정을 처리하는데요.
브라우저가 CSS로 canvas를 표시할 크기를 선택하게 한 다음 해당 크기를 찾아보고 이에 대응하여 canvas의 픽셀 수를 조정하는 게 가장 좋은 방법이라고 생각합니다.
여기에 관심이 있다면 <a href="webgl-anti-patterns.html">위에서 설명한 방법이 바람직하다고 생각한 이유</a>를 봐주세요.

<div class="webgl_bottombar">
<h3>Retina 혹은 HD-DPI 디스플레이는 어떻게 처리하나요?</h3>
<p>
CSS나 Canvas에서 크기를 픽셀로 지정하면 실제 픽셀일 수도 아닐 수도 있는 CSS 픽셀이라고 부릅니다.
대부분의 최신 스마트폰은 high-definition DPI display (HD-DPI)라고 부르거나 애플에서 "Retina Display"라고 부르는 디스플레이를 가지고 있습니다.
브라우저는 글자와 대부분의 CSS 스타일링을 자동으로 HD-DPI 그래픽으로 렌더링하지만, WebGL로 그래픽을 그릴 때 "HD-DPI" 품질을 원한다면 더 높은 해상도로 렌더링해야 합니다.
</p>
<p>
이를 위해 <code>window.devicePixelRatio</code> 값을 확인할 수 있습니다.
이 값은 몇 개의 실제 픽셀이 1 CSS 픽셀과 같은지 알려주는데요.
resize 함수를 수정하여 이렇게 처리할 수 있습니다.
</p>
<pre class="prettyprint">
function resize(gl) {
  var realToCSSPixels = window.devicePixelRatio;

  // 브라우저가 CSS 픽셀로 canvas를 표시하는 크기를 탐색하고
  // drawingbuffer를 device 픽셀로 일치시키는데 필요한 크기를 계산합니다.
  var displayWidth  = Math.floor(gl.canvas.clientWidth  * realToCSSPixels);
  var displayHeight = Math.floor(gl.canvas.clientHeight * realToCSSPixels);

  // canvas가 같은 크기가 아닌지 확인
  if (gl.canvas.width  !== displayWidth ||
      gl.canvas.height !== displayHeight) {

    // canvas를 동일한 크기로 만들기
    gl.canvas.width  = displayWidth;
    gl.canvas.height = displayHeight;
  }
}
</pre>
<p>
HD-DPI 디스플레이가 있다면, 예를들어 스마트폰에서 이 페이지를 보는 경우 아래에 있는 선이 HD-DPI 디스플레이에 맞게 조정되지 않은 위의 선보다 얇다는 걸 눈치채셨을 겁니다.
</p>
{{{example url="../webgl-resize-canvas-hd-dpi.html" }}}
<p>
실제로 HD-DPI를 조정할지 말지는 당신에게 달려있습니다.
iPhoneX나 iPhone11에서 <code>window.devicePixelRatio</code>는 <code>3</code>인데 이건 9배 많은 픽셀을 그리는 걸 의미합니다.
Samsung Galaxy S8에서 이 값은 <code>5</code>이며 이건 16배 많은 픽셀을 그리는 걸 의미합니다.
이건 program을 정말 느리게 할 수 있는데요.
사실 실제로 표시되는 것보다 적은 픽셀로 렌더링하고 GPU가 이를 확장시키는게 게임의 일반적인 최적화입니다.
이건 어떤 걸 정말로 필요로 하느냐에 달려있습니다.
인쇄용 그래프를 그린다면 HD-DPI를 지원하고 싶을 겁니다.
게임을 하는 경우는 그렇지 않을 수도 있고 시스템이 대량의 픽셀을 그리기에 충분히 빠르지 않다면 사용자에게 켜거나 끄도록 옵션을 줄 수도 있습니다.
</p>
</div>

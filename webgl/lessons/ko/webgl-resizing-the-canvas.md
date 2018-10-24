Title: WebGL Canvas 크기 조정.
Description: WebGL Canvas 크기 조정 및 관련 문제 해결법

Canvas의 크기를 조정하려면 알아야 할 사항이 있습니다.

모든 canvas는 두 가지 크기를 가지고 있습니다.
그 크기를 drawingbuffer라고 하는데요.
이건 canvas에 얼마나 많은 픽셀지 있는지를 말합니다.
두 번째 크기는 canvas가 표시되는 크기인데요.
CSS는 canvas가 표시되는 크기를 결정합니다.

두 가지 방법을 통해 canvas의 drawingbuffer를 설정할 수 있는데요.
한 가지는 HTML을 이용해서

    <canvas id="c" width="400" height="300"></canvas>

다른 방법은 JavaScript를 이용해서

    <canvas id="c" ></canvas>

JavaScript

    var canvas = document.getElementById("c");
    canvas.width = 400;
    canvas.height = 300;


canvas 크기 설정하는데 canvas 크기에 영향을 주는 CSS가 없다면 표시 크기는 해당 drawingbuffer와 동일한 크기가 됩니다.
위 두 예제에서 canvas의 drawingbuffer는 400x300이며 표시 크기 또한 400x300이 됩니다.

여기 페이지에서 400x300 픽셀로 표시되는 drawingbuffer가 10x15 픽셀인 canvas 예제입니다.

    <canvas id="c" width="10" height="15" style="width: 400px; height: 300px;"></canvas>

혹은 이 예제처럼

    <style>
    #c {
      width: 400px;
      height: 300px;
    }
    </style>
    <canvas id="c" width="10" height="15"></canvas>

만약 canvas에 단일 픽셀 너비의 곡선을 그리면 이런 걸 볼 수 있는데

{{{example url="../webgl-10x15-canvas-400x300-css.html" }}}

왜 이렇게 흐릿할까요?
그건 브라우저가 10x15 픽셀 canvas를 가져와서 400x300 픽셀로 늘리기 때문입니다.
일반적으로 무리하게 해석할 때 확대 혹은 축소합니다.

예를들어 canvas 창을 꽉 채우고 싶다면 어떻게 해야 할까요?
먼저 CSS로 창을 채우기 위해 브라우저에서 canvas를 늘릴 수 있습니다.
예를들어

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

이제 브라우저가 canvas를 확장한 크기와 일치하는 drawingbuffer를 만들면 됩니다.
`clientWidth` and `clientHeight`를 사용하면 JavaScript에서 HTML의 모든 요소가 어떤 크기로 표시되는지 확인할 수 있습니다.

    function resize(canvas) {
      // 브라우저에서 canvas가 표시되는 크기 탐색
      var displayWidth  = canvas.clientWidth;
      var displayHeight = canvas.clientHeight;

      // canvas가 같은 크기가 아닐 때 확인
      if (canvas.width  != displayWidth ||
          canvas.height != displayHeight) {

        // canvas를 동일한 크기로 수정
        canvas.width  = displayWidth;
        canvas.height = displayHeight;
      }
    }

대부분의 WebGL 앱들은 <a href="webgl-animation.html">애니메이션이므로</a> 렌더링 전에 이 함수를 호출하여 그리기 직전에 원하는 크기로 canvas를 조정하겠습니다.

    function drawScene() {
       resize(gl.canvas);

       ...

그리고 여기

{{{example url="../webgl-resize-canvas.html" }}}

뭐가 잘못됐죠?
왜 선이 전체를 감싸고 있지 않을까요?

그 이유는 canvas 크기 조정할 때 viewport를 설정하기 위해 `gl.viewport`를 호출해야 합니다.
`gl.viewport`는 WebGL에게 clip 공간(-1 ~ +1)에서 픽셀로 변환하고 canvas 내에서 그걸 작동시키는 방법을 알려줍니다.
WebGL context를 처음 만들 때 WebGL은 canvas와 같은 크기로 viewport를 설정하지만 이후에는 사용자가 설정합니다.
만약 canvas 크기를 변경한다면 WebGL에게 새로운 viewport 설정을 알려줘야 합니다.

이걸 처리할 코드를 수정해봅시다.
위에서 WebGL context가 canvas에 대한 참조를 가지므로 크기를 조절해봅시다.

    function drawScene() {
       resize(gl.canvas);

    +   gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
       ...

이제 동작합니다.

{{{example url="../webgl-resize-canvas-viewport.html" }}}

새 창에서 열고, 창 크기를 조절하면, 항상 창을 꽉 채웁니다.

이렇게 물어보실 수 있는데, 왜 canvas 크기를 변경할 때 WebGL이 자동으로 viewport를 설정하지 않나요?
그 이유는 당신이 viewport를 사용하는 방법이나 이유를 모르기 때문입니다.
가령 framebuffer로 렌더링하거나 다른 viewport 크기가 필요한 다른 작업을 수행할 수 있습니다.
WebGL은 사용자의 의도를 알 수 없으므로 자동으로 viewport를 설정할 수 없습니다.

많은 WebGL program을 살펴보면 다양한 방법으로 canvas 크기를 조절하거나 설정해서 다룹니다.
만약 여기에 관심이 있다면 <a href="webgl-anti-patterns.html">위 같은 방법이 적합하다고 생각한 이유가 여기 있습니다</a>.

<div class="webgl_bottombar">
<h3>Retina 혹은 HD-DPI display를 어떻게 처리하나요?</h3>
<p>
CSS나 Canvas에서 크기를 픽셀 단위로 지정하면 이걸 실제 픽셀일 수도 아닐 수도 있는 CSS 픽셀이라고 부릅니다.
대부분의 최신 스마트폰은 high-definition DPI display (HD-DPI)라고 부르거나 애플에서 "Retina Display"라고 부르는 display를 가지고 있습니다.
브라우저는 글자와 대부분의 CSS 스타일링을 HD-DPI 그래픽으로 렌더링하지만, WebGL에서 그래픽을 "HD-DPI" 품질로 만들려면 고해상도로 렌더링해야 합니다.
</p>
<p>
이렇게 하기 위해서 <code>window.devicePixelRatio</code> 값을 볼 수 있습니다.
이 값은 실제로 몇 픽셀이 1 CSS 픽셀과 같은지 알려주는데요.
이런 걸 처리를 하기 위해서 크기 조정 함수를 수정할 수 있습니다.
</p>
<pre class="prettyprint">
function resize(gl) {
  var realToCSSPixels = window.devicePixelRatio;

  // 브라우저가 CSS 픽셀로 Canvas를 표시하는 크기를 찾고 drawingbuffer를 device 픽셀로 일치시키는데 필요한 크기를 계산합니다.
  var displayWidth  = Math.floor(gl.canvas.clientWidth  * realToCSSPixels);
  var displayHeight = Math.floor(gl.canvas.clientHeight * realToCSSPixels);

  // Canvas와 같은 크기가 아닌지 확인
  if (gl.canvas.width  !== displayWidth ||
      gl.canvas.height !== displayHeight) {

    // Canvas를 같은 크기로 만듦
    gl.canvas.width  = displayWidth;
    gl.canvas.height = displayHeight;
  }
}
</pre>
<p>HD-DPI display가 있다면, 예를들어 스마트폰에서 이 페이지를 보는 경우 아래에 있는 선이 HD-DPI display에 맞게 조정되지 않은 위의 선보다 얇은 걸 확인해야 합니다.</p>
{{{example url="../webgl-resize-canvas-hd-dpi.html" }}}
<p>
정말 HD-DPI를 조정할지 말지는 당신에게 달렸습니다.
iPhone4나 iPhone5에서 <code>window.devicePixelRatio</code>는 <code>2</code>인데 이건 4배 많은 픽셀을 그리는 걸 의미합니다.
iPhone6Plus는 값이 <code>3</code>인 것으로 알고 있는데 이건 9배 많은 픽셀을 그린다는 뜻입니다.
그렇게 되면 program이 정말 느려질 수 있습니다.
실제로 게임에서는 표시되는 것보다 적은 픽셀로 렌더링하고 GPU에서 확장시키는게 일반적인 최적화입니다.
이건 정말로 어떤 것을 필요로 하느냐에 달려있습니다.
만약 인쇄용 그래프를 그린다면 HD-DPI를 지원하고 싶을 겁니다.
게임을 하는 경우는 그렇지 않을 수도 있고 시스템이 대량의 픽셀을 그리기에 속도가 충분하지 않다면 사용자에게 켜거나 끄도록 옵션을 제공할 수도 있습니다.
</p>
</div>

Title: WebGL 텍스트 - Canvas 2D
Description: WebGL과 동기화된 2D Canvas를 사용하여 텍스트를 표시하는 방법
TOC: 텍스트 - Canvas 2D


이 글은 [텍스트를 그리기에 대한 이전 WebGL 글](webgl-text-html.html)에서 이어집니다.
아직 읽지 않았다면 거기부터 읽고 다시 돌아오는 걸 추천합니다.

텍스트에 HTML 요소를 사용하는 대신에 또 다른 캔버스를 2D Context로 사용할 수도 있는데요.
프로파일링 없이는 이게 DOM을 사용하는 것보다 빠를 것이라고 추측할 뿐입니다.
물론 유연성도 떨어집니다.
그리고 모든 CSS 스타일링을 사용할 수 없습니다.
하지만 HTML 요소를 만들고 추적해야할 필요는 없어지죠.

다른 예제와 비슷하게 컨테이너를 만들지만 이번에는 캔버스 2개를 넣습니다.

    <div class="container">
      <canvas id="canvas"></canvas>
      <canvas id="text"></canvas>
    </div>

다음으로 캔버스와 HTML이 겹치도록 CSS를 설정합니다.

    .container {
        position: relative;
    }

    #text {
        position: absolute;
        left: 0px;
        top: 0px;
        z-index: 10;
    }

이제 초기화할 때 텍스트 캔버스를 찾고 2D Context를 생성합니다.

    // 텍스트 캔버스 탐색
    var textCanvas = document.querySelector("#text");

    // 2D Context 만들기
    var ctx = textCanvas.getContext("2d");

그릴 때, WebGL처럼, 프레임마다 2D Canvas를 지워야 합니다.

    function drawScene() {
        ...

        // 2D Canvas 지우기
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

그런 다음 `fillText`를 호출하여 텍스트를 그립니다.

        ctx.fillText(someMsg, pixelX, pixelY);

그리고 여기 해당 예제입니다.

{{{example url="../webgl-text-html-canvas2d.html" }}}

왜 텍스트가 더 작을까요?
이는 Canvas 2D의 기본 크기 때문입니다.
다른 크기로 원하시면 [Canvas 2D API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_text)를 확인해주세요.

Canvas 2D를 사용하는 또 다른 이유는 다른 것을 그리기 쉽기 때문입니다.
예를 들어 화살표를 추가해봅시다.

    // 화살표와 텍스트 그리기

    // 모든 캔버스 설정 저장
    ctx.save();

    // 0,0이 F의 앞면 우측 상단에 있도록 캔버스의 원점 이동
    ctx.translate(pixelX, pixelY);

    // 화살표 그리기
    ctx.beginPath();
    ctx.moveTo(10, 5);
    ctx.lineTo(0, 0);
    ctx.lineTo(5, 10);
    ctx.moveTo(0, 0);
    ctx.lineTo(15, 15);
    ctx.stroke();

    // 텍스트 그리기
    ctx.fillText(someMessage, 20, 20);

    // 이전 설정으로 캔버스 복원
    ctx.restore();

여기서 Canvas 2D [행렬 스택](webgl-2d-matrix-stack.html)의 translate 함수을 활용하므로, 화살표를 그릴 때 어떤 추가적인 계산도 필요하지 않습니다.
원점에 그리기만 하면 `translate`가 해당 원점을 F의 모서리로 옮겨줍니다.

{{{example url="../webgl-text-html-canvas2d-arrows.html" }}}

이 내용은 Canvas 2D 사용을 다루는데요.
더 알고 싶다면 [Canvas 2D API](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)를 확인해주세요.
다음은 [WebGL에서 실제로 텍스트를 렌더링](webgl-text-texture.html)할 겁니다.


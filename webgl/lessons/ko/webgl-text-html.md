Title: WebGL 텍스트 - HTML
Description: HTML을 사용하여 WebGL에 맞춰 배치된 텍스트를 표시하는 방법
TOC: 텍스트 - HTML


이 포스트는 WebGL 관련 시리즈에서 이어집니다.
아직 읽지 않았다면 [거기](webgl-3d-perspective.html)부터 시작하는 게 좋습니다.

"WebGL에서 텍스트를 그리는 방법"에 대해 질문을 많이 받는데요.
먼저 스스로에게 물어볼 것은 텍스트를 그리는 목적입니다.
여러분은 브라우저에 있고, 브라우저는 텍스트를 표시합니다.
따라서 첫 번째 답은 HTML을 사용하여 텍스트를 표시하는 겁니다.

가장 쉬운 예시를 먼저 들어보면, WebGL 위에 텍스트를 그리고 싶다고 해봅시다.
이걸 text overlay라고 부르는데요.
기본적으로 이것은 같은 위치에 있는 텍스트입니다.

가장 간단한 방법은 HTML 요소를 만들고 CSS를 사용하여 겹치도록 만드는 겁니다.

예시: 먼저 컨테이너를 만들고, 컨테이너 안에 겹치게 할 캔버스와 HTML을 넣습니다.

    <div class="container">
      <canvas id="canvas"></canvas>
      <div id="overlay">
        <div>Time: <span id="time"></span></div>
        <div>Angle: <span id="angle"></span></div>
      </div>
    </div>

다음으로 캔버스와 HTML을 겹치게 하기 위한 CSS를 설정합니다.

    .container {
        position: relative;
    }
    #overlay {
        position: absolute;
        left: 10px;
        top: 10px;
    }

이제 초기화할 때 해당 요소들을 탐색해, 변경하려는 영역을 만들거나 찾습니다.

    // 영향을 주고 싶은 요소 탐색
    var timeElement = document.querySelector("#time");
    var angleElement = document.querySelector("#angle");

    // 브라우저의 시간을 아끼기 위해 text node 생성
    var timeNode = document.createTextNode("");
    var angleNode = document.createTextNode("");

    // 놓아야 할 곳에 해당 text node를 추가
    timeElement.appendChild(timeNode);
    angleElement.appendChild(angleNode);

마지막으로 렌더링할 때 node를 업데이트합니다.

    function drawScene() {
        ...

        // rotation을 radian에서 degree로 전환
        var angle = radToDeg(rotation[1]);

        // 0 - 360
        angle = angle % 360;

        // node 설정
        angleNode.nodeValue = angle.toFixed(0);  // 소수점 없음
        timeNode.nodeValue = clock.toFixed(2);   // 소수점 이하 2자리

그리고 여기 해당 예제입니다.

{{{example url="../webgl-text-html-overlay.html" }}}

변경하려는 부분에 대해 div 내부에 span을 어떻게 넣었는지 확인하세요.
여기에서는 이 방법이 span 없이 div를 사용하는 것보다 빠르다고 가정하고 있습니다.

    timeNode.value = "Time " + clock.toFixed(2);

또한 `node = document.createTextNode()`와 이후에 `node.nodeValue = someMsg`를 호출하여 text node를 사용하고 있습니다.
`someElement.innerHTML = someHTML`도 사용할 수 있는데요.
임의의 HTML 문자열을 삽입할 수 있기 때문에 더 유연하지만, 설정할 때마다 브라우저가 node를 생성하고 파괴해야 하기 때문에 약간 느릴 수 있습니다.
뭐가 더 좋을지는 여러분이 선택하시면 됩니다.

Overlay 기법의 중요한 점은 WebGL이 브라우저에서 실행된다는 겁니다.
적절하게 브라우저의 기능을 사용하는 걸 잊지마세요.
많은 OpenGL 프로그래머들은 앱의 모든 부분을 처음부터 100% 렌더링하는 것에 익숙하지만, WebGL은 브라우저에서 실행되기 때문에 이미 많은 기능들을 가지고 있습니다.
그 기능들을 활용하세요.
여러 장점이 있습니다.
예를 들면 CSS를 사용하여 해당 overlay에 재미있는 style을 쉽게 부여할 수 있죠.

여기 동일한 예제에 일부 style을 추가했습니다.
모서리가 둥글고, 글자 주변이 빛납니다.
그리고 테두리는 빨간색이죠.
HTML을 사용하면 이 모든 기능을 자유롭게 사용할 수 있습니다.

{{{example url="../webgl-text-html-overlay-styled.html" }}}

다음으로 가장 일반적으로 원하는 것은 렌더링하는 대상을 기준으로 일부 텍스트를 배치하는 겁니다.
이것도 HTML로 할 수 있습니다.

이 경우 캔버스가 있는 컨테이너와 HTML을 움직이기 위한 또 다른 컨테이너를 만듭니다.

    <div class="container">
      <canvas id="canvas" width="400" height="300"></canvas>
      <div id="divcontainer"></div>
    </div>

그리고 CSS를 설정할 겁니다.

    .container {
        position: relative;
        overflow: none;
        width: 400px;
        height: 300px;
    }

    #divcontainer {
        position: absolute;
        left: 0px;
        top: 0px;
        width: 100%;
        height: 100%;
        z-index: 10;
        overflow: hidden;
    }

    .floating-div {
        position: absolute;
    }

`position: absolute;` 부분은 `#divcontainer`가 `position: relative`나 `position: absolute`인 첫 번째 조상을 기준으로 절대적인 위치를 가지도록 합니다.
이 경우에는 캔버스와 `#divcontainer`가 있는 컨테이너가 됩니다.

`left: 0px; top: 0px`는 `#divcontainer`가 정렬되도록 만듭니다.
`z-index: 10`는 컨테이너가 캔버스 위에 떠있도록 만들죠.
그리고 `overflow: hidden`은 부모의 영역을 벗어난 자식을 안 보이도록 만듭니다.

마지막으로 `.floating-div`는 위치 지정이 가능한 div 생성에 사용될 겁니다.

이제 divcontainer를 찾고, div를 만들어 추가해야 합니다.

    // divcontainer 탐색
    var divContainerElement = document.querySelector("#divcontainer");

    // div 생성
    var div = document.createElement("div");

    // CSS class 할당
    div.className = "floating-div";

    // 내용에 대한 text node 생성
    var textNode = document.createTextNode("");
    div.appendChild(textNode);

    // divcontainer에 추가
    divContainerElement.appendChild(div);

이제 style을 설정하여 div의 위치를 조정할 수 있습니다.

    div.style.left = Math.floor(x) + "px";
    div.style.top  = Math.floor(y) + "px";
    textNode.nodeValue = clock.toFixed(2);

다음은 div를 기준으로 튕기는 예제입니다.

{{{example url="../webgl-text-html-bouncing-div.html" }}}

다음 단계는 3D 장면의 무언가를 기준으로 배치하는 겁니다.
어떻게 할까요?
[Perspective projection](webgl-3d-perspective.html)을 다룰 때 GPU에 요청한 방법과 정확히 동일하게 수행합니다.

위 예제를 통해 행렬을 사용하는 방법, 곱하는 방법, clip space로 전환하기 위해 projection matrix를 적용하는 방법을 배웠습니다.
이 모든 것을 셰이더로 전달하고 local space의 정점에 곱하여 clip space로 전환합니다.
JavaScript에서도 이 모든 계산을 수행할 수 있는데요.
Clip space(-1 ~ +1)를 pixel로 곱하고 이를 사용하여 div를 배치할 수 있습니다.

    gl.drawArrays(...);

    // F를 3D로 그리기 위해 행렬 계산

    // 'F'의 local space에서 한 점 선택
    // X  Y  Z  W
    var point = [100, 0, 0, 1];  // 앞면 오른쪽 상단 모서리

    // F에 대해 계산한 행렬을 사용하여 clip space 위치를 계산
    var clipspace = m4.transformVector(matrix, point);

    // GPU처럼 X와 Y를 W로 나누기
    clipspace[0] /= clipspace[3];
    clipspace[1] /= clipspace[3];

    // clipspace를 pixel로 변환
    var pixelX = (clipspace[0] *  0.5 + 0.5) * gl.canvas.width;
    var pixelY = (clipspace[1] * -0.5 + 0.5) * gl.canvas.height;

    // div 배치
    div.style.left = Math.floor(pixelX) + "px";
    div.style.top  = Math.floor(pixelY) + "px";
    textNode.nodeValue = clock.toFixed(2);

그리고 짜잔, div의 왼쪽 상단 모서리가 F의 오른쪽 상단 모서리 앞면에 완벽하게 정렬되었습니다.

{{{example url="../webgl-text-html-div.html" }}}

물론 더 많은 텍스트를 원한다면 div를 더 만들 수 있습니다.

{{{example url="../webgl-text-html-divs.html" }}}

자세한 내용을 보시려면 마지막 예제의 source를 봐주세요.
한 가지 중요한 점은 DOM에서 HTML 요소를 생성하고, 추가하고, 제거하는 작업이 느리기 때문에, 위 예제에서는 생성하고 해당 요소들을 유지한다는 겁니다.
사용하지 않는 것은 DOM에서 지우지 않고 숨깁니다.
더 빠른지 알아보려면 정보를 수집해야 하는데요.
그게 제가 선택한 방법입니다.

텍스트에 HTML을 사용하는 방법이 잘 이해되셨길 바랍니다.
다음은 [텍스트에 Canvas 2D를 사용하는 방법](webgl-text-canvas2d.html)에 대해 다루겠습니다.


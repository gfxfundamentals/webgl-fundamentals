Title: WebGL - 애니메이션
Description: WebGL에서 애니메이션을 수행하는 방법
TOC: 애니메이션


이 포스트는 WebGL 관련 시리즈에서 이어집니다.
첫 번째는 [기초](webgl-fundamentals.html)로 시작했고, 이전에는 [3D 카메라](webgl-3d-camera.html)에 관한 것이었습니다.
아직 읽지 않았다면 해당 글들을 먼저 봐주세요.

WebGL에서 무언가에 애니메이션을 적용하려면 어떻게 해야 할까요?

사실 이건 WebGL에 국한되지 않지만 일반적으로 JavaScript로 무언가에 애니메이션을 적용하고 싶다면 시간이 지남에 따라 무언가를 수정하고 다시 그려야 합니다.

이전 샘플들 중 하나를 가져와 다음과 같이 애니메이션을 적용할 수 있습니다.

    *var fieldOfViewRadians = degToRad(60);
    *var rotationSpeed = 1.2;

    *requestAnimationFrame(drawScene);

    // 장면 그리기
    function drawScene() {
    *  // 프레임마다 조금씩 회전
    *  rotation[1] += rotationSpeed / 60.0;

      ...
    *  // 다음 프레임에서 다시 drawScene 호출
    *  requestAnimationFrame(drawScene);
    }

그리고 결과입니다.

{{{example url="../webgl-animation-not-frame-rate-independent.html" }}}

그런데 애매한 문제가 있습니다.
위 코드에는 `rotationSpeed / 60.0`이 있는데요.
일반적으로 브라우저가 초당 60번씩 requestAnimationFrame에 응답할 것이라 가정했기 때문에 60.0으로 나눴습니다.

그런데 사실 이는 유효한 가정이 아닌데요.
사용자가 오래된 스마트폰처럼 저전력 기기를 사용할 수 있습니다.
또는 사용자가 백그라운드에서 무거운 프로그램을 실행 중일 수도 있죠.
브라우저가 초당 60프레임으로 표시되지 않는 데에는 여러 가지 이유가 있습니다.
2020년에는 모든 컴퓨터가 초당 240프레임으로 실행될 수도 있습니다.
사용자가 게이머여서 초당 90프레임으로 실행되는 CRT 모니터를 가졌을 수도 있겠죠.

이 예제에서 문제점을 보실 수 있습니다.

{{{diagram url="../webgl-animation-frame-rate-issues.html" }}}

위 예제에서 모든 'F'를 같은 속도로 회전시키고 싶습니다.
가운데에 있는 'F'는 최대 속도로 작동하며 프레임률에 독립적입니다.
왼쪽과 오른쪽에 있는 'F'는 브라우저가 현재 컴퓨터 최대 속도의 1/8로 실행되는 경우를 시뮬레이션합니다.
왼쪽은 프레임률에 **비독립적**입니다.
오른쪽은 프레임률에 **독립적**입니다.

왼쪽에 있는 것은 프레임률이 느릴 수 있다는 걸 고려하지 않았기 때문에 따라오지 못 한다는 점에 주목하세요.
오른쪽에 있는 것은 비록 1/8의 프레임률로 실행되지만 최대 속도로 실행되는 가운데에 있는 걸 따라가고 있습니다.

애니메이션을 프레임률에 독립적으로 만드는 방법은 프레임 간에 소요된 시간을 계산하고, 이를 사용하여 이 프레임을 얼마나 애니메이션 할지 계산하는 겁니다.

먼저 시간이 필요합니다.
다행히도 `requestAnimationFrame`은 페이지가 로드된 이후에 호출하면 시간을 보내줍니다. 

초 단위로 시간을 가져오는 게 가장 좋지만 `requestAnimationFrame`이 밀리초(1/1000초) 단위로 시간을 전달하기 때문에 초 단위를 얻기 위해 0.001로 곱해야 합니다.

따라서, 다음과 같이 델타 시간을 계산할 수 있는데

    *var then = 0;

    requestAnimationFrame(drawScene);

    // 장면 그리기
    *function drawScene(now) {
    *  // 시간을 초단위로 변환
    *  now *= 0.001;
    *  // 현재 시간에서 이전 시간 빼기
    *  var deltaTime = now - then;
    *  // 다음 프레임을 위해 현재 시간 저장
    *  then = now;

       ...

초 단위의 `deltaTime`이 있으면 모든 계산은 초당 어떤 일이 일어나길 원하는 단위 수가 될 수 있습니다.
이 경우 `rotationSpeed`는 1.2고 이는 초당 1.2radian씩 회전한다는 걸 의미합니다.
이는 1/5 회전, 즉 프레임률에 상관없이 완전히 회전하는데 5초가 걸립니다.

    *    rotation[1] += rotationSpeed * deltaTime;

다음은 실제로 작동하는 샘플입니다.

{{{example url="../webgl-animation.html" }}}

느린 컴퓨터가 아니라면 이 페이지 상단에 있는 것과 차이점은 없을 테지만, 애니메이션을 프레임률에 독립적으로 만들지 않는다면 사용자는 의도한 것과 상당히 다른 경험을 얻게 될 겁니다.

다음은 [텍스처를 적용하는 방법](webgl-3d-textures.html)입니다.

<div class="webgl_bottombar">
<h3>setInterval나 setTimeout을 사용하지 마세요!</h3>
<p>
과거에 javascript로 애니메이션을 프로그래밍한 적이 있다면 <code>setInterval</code>나 <code>setTimeout</code>을 사용하여 그리기 함수를 호출했을 겁니다.
</p>
<p>
<code>setInterval</code>와 <code>setTimeout</code>을 사용한 애니메이션 수행에 따른 문제는 두 가지입니다.
우선 <code>setInterval</code>와 <code>setTimeout</code>은 무언가를 표시하는 것에 대해 브라우저와 아무 관련이 없습니다.
브라우저가 새로운 프레임을 그릴 때 동기화되지 않으므로 사용자의 컴퓨터와 싱크가 맞지 않을 수 있습니다.
<code>setInterval</code>나 <code>setTimeout</code>를 사용하고, 초당 60프레임이라 가정하며, 실제로 사용자의 컴퓨터가 다른 프레임률로 실행한다면, 컴퓨터와 싱크가 맞지 않을 겁니다.
</p>
<p>
또 다른 문제는 브라우저가 <code>setInterval</code>나 <code>setTimeout</code>을 사용하는 이유를 모른다는 겁니다.
예를 들어, 활성 탭이 아닐 때처럼, 페이지가 보이지 않는 경우에도, 브라우저는 여전히 코드를 실행해야 합니다.
새 메일이나 트윗을 확인하기 위해 <code>setTimeout</code>이나 <code>setInterval</code>를 사용하고 있을 수 있는데요.
브라우저가 알 수 있는 방법이 없습니다.
새 메세지에 대해 몇 초마다 확인하는 건 괜찮지만 WebGL에서 1000개의 객체를 그린다면 문제가 생길 수 있습니다.
보이지 않는 탭에 볼 수도 없는 걸 그려서 사용자의 컴퓨터에 사실상 <a target="_blank" href="https://ko.wikipedia.org/wiki/%EC%84%9C%EB%B9%84%EC%8A%A4_%EA%B1%B0%EB%B6%80_%EA%B3%B5%EA%B2%A9">DoS 공격</a>을 하게 될 겁니다.
</p>
<p>
<code>requestAnimationFrame</code>은 이러한 문제를 해결합니다.
이 함수는 적시에 호출하여 화면과 애니메이션을 동기화시키며, 탭이 보이는 경우에만 호출합니다.
</p>
</div>


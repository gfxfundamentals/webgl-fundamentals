Title: WebGL 설치
Description: WebGL 개발 방법

WebGL을 개발하기 위해 웹 브라우저 이외에 기술적으로 아무것도 필요가 없습니다.

[jsfiddle.net](https://jsfiddle.net/greggman/8djzyjL3/)이나 [jsbin.com](http://jsbin.com)
혹은 [codepen.io](http://codepen.io/greggman/pen/YGQjVV)에 가서 여기 있는 학습서들을 적용하면 됩니다.

외부 스크립트를 참조하려면 `<script src="..."></script>` 태그 쌍을 추가해서 외부 스크립트를 참조할 수 있습니다.

여전히, 한계는 있는데요.
WebGL은 이미지를 로딩하는데 Canvas2D보다 더 강력한 제한이 있습니다.
즉 작업을 위해 웹에서 이미지에 쉽게 접근할 수 없다는 것을 의미합니다.
게다가 모든 것을 로컬에서 처리하는 것이 더 빠릅니다.

이 사이트의 예제를 실행하고 수정한다고 가정해봅시다.
제일 먼저 해야할 일은 사이트를 내려받는 것 인데요.
[여기서 내려받을 수 있습니다](https://github.com/greggman/webgl-fundamentals/).

{{{image url="resources/download-webglfundamentals.gif" }}}

특정 폴더에 파일의 압축을 풉니다.

## 작고 간단한 웹 서버 사용하기

다음으로 작은 웹 서버 하나를 설치해야 합니다.
"웹 서버"라는 말이 무섭게 들릴 수도 있지만 [사실 웹 서버는 굉장히 간단합니다](http://games.greggman.com/game/saving-and-loading-files-in-a-web-page/).

여기 [Servez](https://greggman.github.io/servez)라는 매우 간단한 인터페이스가 있습니다.

{{{image url="resources/servez.gif" }}}

그저 압축 해제한 폴더를 가르키고, "시작"을 누른 다음, 브라우저([`http://localhost:8080/webgl/`](http://localhost:8080/webgl/))로 들어가서 예제를 선택하세요.

만약 명령어를 선호한다면, 또 다른 방법으로 [node.js](https://nodejs.org)를 사용하세요.
내려받고, 설치하고, 명령어 창(prompt / console / terminal)을 열면 됩니다.
Windows라면 설치 관리자가 특별한 "Node Command Prompt"를 추가해주니 그걸 사용하세요.

그런 다음 [`http-server`](https://github.com/indexzero/http-server)를 입력해서 설치합니다

    npm -g install http-server

만약 OS X를 사용한다면

    sudo npm -g install http-server

해당 과정을 완료하면

    http-server path/to/folder/where/you/unzipped/files

이렇게 출력될 겁니다

{{{image url="resources/http-server-response.png" }}}

그런 다음 브라우저에서 [`http://localhost:8080/webgl/`](http://localhost:8080/webgl/)로 접속하세요.

경로를 지정하지 않으면 http-server가 현재 폴더를 제공합니다.

## 브라우저 개발자 도구 사용하기

대부분의 브라우저는 광범위한 개발자 도구를 내장하고 있습니다.

{{{image url="resources/chrome-devtools.png" }}}

[Chrome 문서는 여기 있고](https://developers.google.com/web/tools/chrome-devtools/), [Firefox는 여기 있습니다](https://developer.mozilla.org/en-US/docs/Tools).

저것들을 어떻게 사용하는지 배우십시오.
만약 배울게 없다면 JavaScript 콘솔을 항상 확인하세요.
문제가 있는 경우 종종 오류 메세지가 표시되는데요.
오류 메세지를 자세히 읽고 문제가 있는 곳을 찾아야 합니다.

{{{image url="resources/javascript-console.gif" }}}

## WebGL Helper

다양한 WebGL Inspector/Helper가 있는데요.

[다음은 Chrome 용 프로그램입니다](https://benvanik.github.io/WebGL-Inspector/).

{{{image url="https://benvanik.github.io/WebGL-Inspector/images/screenshots/1-Trace.gif" }}}

[Firefox도 비슷한 것이 있는데요](https://hacks.mozilla.org/2014/03/introducing-the-canvas-debugger-in-firefox-developer-tools/).
`about:flags`가 활성화되어야 하고 [Firefox Developer Edition](https://www.mozilla.org/en-US/firefox/developer/)이 필요할 수도 있습니다.

도움이 될 수도 아닐 수도 있습니다.
대부분은 애니메이션 표본을 위해 설계되었으며 프레임을 캡처하여 해당 프레임을 만든 모든 WebGL 호출을 볼 수 있는데요.
이미 무언가가 동작하고 있거나 동작하다가 고장난 경우라면 굉장히 유용합니다.
하지만 잡을 수 없는 초기화 중에 발생하는 문제나 매 프레임마다 그리는 애니메이션을 사용하지 않을 경우 그리 좋지 않은데요.
그럼에도 불구하고 상당히 유용할 수 있습니다.
저는 종종 그리는 호출을 클릭하고 uniform을 확인합니다.
`NaN` (NaN = Not a Number) 여러 개를 볼 수 있다면 보통 uniform을 설정하는 코드를 추적하고 버그를 찾을 수 있습니다.

## 코드 분석

또한 항상 코드를 검사할 수 있다는 걸 기억하세요.
대개 코드 보기를 선택할 수 있습니다.

{{{image url="resources/view-source.gif" }}}

페이지를 오른쪽 클릭 할 수 없거나 source가 별도의 파일에 있는 경우에도 devtools에서 항상 source를 볼 수 있습니다.

{{{image url="resources/devtools-source.gif" }}}

## 시작하기

시작하는데 도움이 되셨기를 바랍니다. [이제 강의로 돌아갑시다](/).

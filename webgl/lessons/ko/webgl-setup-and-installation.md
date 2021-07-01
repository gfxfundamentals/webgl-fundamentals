Title: WebGL 설정 및 설치
Description: WebGL 개발 방법
TOC: 설정 및 설치


기술적으로 WebGL 개발을 하기 위해서 웹 브라우저 이외에는 아무것도 필요가 없습니다.
[jsfiddle.net](https://jsfiddle.net/greggman/8djzyjL3/)이나 [jsbin.com](https://jsbin.com)
혹은 [codepen.io](https://codepen.io/greggman/pen/YGQjVV)에 가서 여기 있는 강의들을 적용하기 시작하면 됩니다.

위 페이지들에서 외부 스크립트를 사용하고 싶다면 `<script src="..."></script>` 태그 쌍을 추가해서 외부 스크립트를 참조할 수 있습니다.

그럼에도 불구하고, 한계는 있는데요.
WebGL은 이미지를 로딩에 Canvas2D보다 더 강력한 제약이 있는데 이는 WebGL 작업을 위해 웹에서 이미지에 쉽게 접근할 수 없다는 걸 의미합니다.
게다가 로컬에서 모든 작업을 처리하는 게 더 빠릅니다.

이 사이트의 예제를 실행하고 수정하고 싶다고 가정해봅시다.
먼저 해야 할 일은 사이트를 다운로드하는 건데요.
[여기](https://github.com/gfxfundamentals/webgl-fundamentals/)에서 다운로드할 수 있습니다.

{{{image url="resources/download-webglfundamentals.gif" }}}

그리고 파일의 압축을 풀어주세요.

## 작고 간단하고 쉬운 웹 서버 사용

다음으로 작은 웹 서버 하나를 설치해야 합니다.
"웹 서버"라는 말이 무섭게 들릴 수 있다는 걸 알지만 사실 [웹 서버](https://games.greggman.com/game/saving-and-loading-files-in-a-web-page/)는 굉장히 간단합니다.

여기 [Servez](https://greggman.github.io/servez)라고 불리는 아주 간단한 인터페이스가 있습니다.

{{{image url="resources/servez.gif" }}}

그저 압축 해제한 폴더를 가르키고, "시작"을 누른 다음, 브라우저 주소 [`http://localhost:8080/webgl/`](http://localhost:8080/webgl/)로 가서 예제를 선택하세요.

만약 명령어를 선호한다면, 또 다른 방법은 [node.js](https://nodejs.org)를 사용하는 겁니다.
다운로드하고, 설치하고, command prompt / console / terminal window를 열어주세요.
윈도우라면 설치 프로그램이 특별한 "Node Command Prompt"를 추가해주니 그걸 사용하면 됩니다.

그런 다음 [`servez`](https://github.com/greggman/servez-cli)를 설치하고

    npm -g install servez

OS X를 사용한다면

    sudo npm -g install servez

해당 과정을 완료하면

    servez path/to/folder/where/you/unzipped/files

이런 식으로 출력되어야 하고

{{{image url="resources/servez-response.png" }}}

다음으로 브라우저에서 [`http://localhost:8080/webgl/`](http://localhost:8080/webgl/)로 접속하세요.

만약 path를 지정하지 않으면 servez가 현재 폴더를 serve할 겁니다.

## 브라우저 개발자 도구 사용

대부분의 브라우저는 광범위한 개발자 도구가 내장되어 있습니다.

{{{image url="resources/chrome-devtools.png" }}}

Chrome 문서는 [여기](https://developers.google.com/web/tools/chrome-devtools/)에 있고, Firefox는 [여기](https://developer.mozilla.org/en-US/docs/Tools)에 있습니다.

그것들을 어떻게 사용하는지 배워보세요.
별 다른 게 없다면 javascript 콘솔을 항상 확인하세요.
문제가 있는 경우 종종 에러 메세지가 표시되는데요.
에러 메세지를 자세히 읽으면 어디에 문제가 있는지 단서를 얻을 수 있습니다.

{{{image url="resources/javascript-console.gif" }}}

## WebGL Helper

[여기](https://greggman.github.io/webgl-helpers/)에 유용할 수 있는 몇 가지 스크립트가 있는데요.
다른 스크립트들보다 먼저 페이지에 추가해야 합니다.

```
<script src="https://greggman.github.io/webgl-helpers/webgl-gl-error-check.js"></script>
```

그리고 WebGL 에러를 발생하면 program은 예외를 던지고 운이 좋으면 더 많은 정보가 출력됩니다.

다양한 WebGL Inspector가 있는데요.
다음은 [Chrome 및 Firefox 전용](https://spector.babylonjs.com/)입니다.

{{{image url="https://camo.githubusercontent.com/5bbc9caf2fc0ecc2eebf615fa8348146b37b08fe/68747470733a2f2f73706563746f72646f632e626162796c6f6e6a732e636f6d2f70696374757265732f7469746c652e706e67" }}}

참고: [문서](https://github.com/BabylonJS/Spector.js/blob/master/readme.md)를 읽어주세요!

spector.js의 extension 버전은 프레임을 캡처합니다.
이건 WebGL 앱이 성공적으로 초기화되고 `requestAnimationFrame` 루프에서 렌더링되는 경우에만 작동한다는 걸 의미하는데요.
"record" 버튼을 클릭하면 하나의 "frame"에 대한 모든 WebGL API 호출을 캡처합니다.

이건 약간의 작업 없이는 초기화 중에 문제를 찾는데 도움이 되지 않는다는 걸 의미하는데요.

해당 문제를 해결하기 위한 두 가지 방법이 있습니다.

1. extension이 아닌 라이브러리로 사용합니다.

   [문서](https://github.com/BabylonJS/Spector.js/blob/master/readme.md)를 참고하세요. 이 방법으로 "지금 WebGL API 명령어를 캡쳐해!"라고 지시할 수 있습니다.

2. 버튼을 클릭할 때까지 시작되지 않도록 앱을 변경합니다.

   이렇게 하면 extension에 가서 "record"를 선택한 다음 앱을 시작할 수 있습니다. 앱이 애니메이션되지 않는다면 가짜 프레임을 몇 개 추가하면 됩니다. 예제:

```html
<button type="button">start</button>
<canvas id="canvas"></canvas>
```

```js
function main() {
  // WebGL Context 가져오기
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector("#canvas");
  const gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  const startElem = document.querySelector('button');
  startElem.addEventListener('click', start, {once: true});

  function start() {
    // spector는 rAF 이벤트 내부만 캡처하기 때문에 rAF에서 초기화 실행
    requestAnimationFrame(() => {
      // 모든 초기화 수행
      init(gl);
    });
    // spector가 볼 수 있도록 더 많은 프레임 만들기
    requestAnimationFrame(() => {});
    requestAnimationFrame(() => {});
    requestAnimationFrame(() => {});
  }
}

main();
```

이제 spector.js extension에서 "record"를 클릭한 다음, 페이지에서 "start"를 클릭하면 spector가 초기화를 기록합니다.

사파리에도 [유사한 문제와 해결 방법](https://stackoverflow.com/questions/62446483/debugging-in-webgl)을 가진 기능이 내장되어 있습니다.

이런 helper를 사용할 때 저는 draw call을 자주 클릭하고, uniform을 확인합니다.
`NaN`(NaN = Not a Number)이 많이 보이면 일반적으로 uniform을 설정하는 코드를 추적해서 버그를 찾을 수 있습니다.

## 코드 검사

또한 항상 코드를 검사할 수 있다는 걸 기억하세요.
일반적으로 view source를 선택할 수 있고

{{{image url="resources/view-source.gif" }}}

페이지를 우클릭할 수 없거나 source가 별도 파일인 경우에도 항상 개발자 도구에서 source를 볼 수 있는데

{{{image url="resources/devtools-source.gif" }}}

## 시작하기

시작하는데 도움이 되셨기를 바랍니다.
이제 [강의](index.html)로 돌아갑시다.


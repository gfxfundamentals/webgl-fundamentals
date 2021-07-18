Title: WebGL Canvas 크기 조정
Description: WebGL canvas의 크기를 조정하는 방법과 관련 문제
TOC: Canvas 크기 조정

캔버스(canvas)의 사이즈를 바꿀때 알아야 할 것들이 있습니다.

모든 캔버스는 2개의 크기를 가집니다. drawingbuffer의 크기는 캔버스 안에 얼마나 많은 픽셀이 있는지를 의미합니다.
두 번째 크기는 캔버스의 디스플레이(화면에 표시)되는 크기입니다. CSS가 화면에 표시되는 크기를 결정합니다.

캔버스의 drawingbuffer 크기를 정하는 방법이 두 가지 있습니다. 하나는 HTML을 사용하는 것이고,

```html
<canvas id="c" width="400" height="300"></canvas>
```

다른 하나는 자바스크립트를 사용하는 것입니다.

```html
<canvas id="c"></canvas>
```

자바스크립트에서는,

```js
const canvas = document.querySelector("#c");
canvas.width = 400;
canvas.height = 300;
```

캔버스의 화면에 표시되는 크기를 설정할 때는, 영향을 미치는 CSS가 없다면 화면에 표시되는 크기가 drawingbuffer와 동일한 크기가 됩니다.
따라서 위 두 가지 예시의 경우에는 drawingbuffer의 크기가 400x300이므로 화면에 표시되는 크기도 400x300이 됩니다.
아래는 drawingbuffer가 10x15 픽셀이고 디스플레이 크기는 400x300인 경우의 캔버스 예시입니다.

```html
<canvas id="c" width="10" height="15" style="width: 400px; height: 300px;"></canvas>
```

또는 아래와 같은 예시도 있습니다.

```html
<style>
#c {
  width: 400px;
  height: 300px;
}
</style>
<canvas id="c" width="10" height="15"></canvas>
```

1픽셀 너비의 회전하는 선을 캔버스에 그리게 되면 아래와 같은 화면이 보일겁니다.

{{{example url="../webgl-10x15-canvas-400x300-css.html" }}}

왜 이렇게 흐린걸까요? 이는 브라우저가 10x15 픽셀 크기 캔버스를 400x300 크기로 늘렸기 때문입니다.
그리고 보통은 그렇게 크기를 늘릴 때 필터를 적용하게 됩니다.

그러면 예를 들어, 캔버스가 윈도우 전체를 커버하길 윈하면 어떻게 해야 할까요?
첫 번째로 할 수 있는것은 CSS를 사용해 캔버스가 윈도우 전체 영역이 되도록 늘리는 것입니다. 예를 들어,

    <html>
      <head>
        <style>
          /*  */
          html, body {
            height: 100%;
            margin: 0;
          }
          /* make the canvas fill its container */
          #c {
            width: 100%;
            height: 100%;
            display: block;
          }
        </style>
      </head>
      <body>
        <canvas id="c"></canvas>
      </body>
    </html>

이제는 drawingbuffer의 크기를 브라우저가 늘려놓은 캔버스의 크기와 일치시키기만 하면 됩니다.
불행하게도 이는 다루기 복잡한 문제입니다. 다른 방법으로 넘어가서 알아보도록 하겠습니다.

## `clientWidth`와 `clientHeight` 사용하기

이것이 가장 쉬운 방법입니다.
`clientWidth`와 `clientHeight`는 HTML의 모든 요소(element)가 가진 속성으로, CSS 픽셀 단위로 요소의 크기를 알려줍니다.

> 주의: client 사각형은 CSS 패딩을 포함하므로 `clientWidth`와 `clientHeight`를 사용할 때는
캔버스 요소에 패딩을 사용하지 않는 것이 좋습니다.

자바스크립트를 사용하여 요소가 얼만한 크기로 화면에 보여지고 있는지를 확인할 수 있고,
drawingbuffer의 크기를 그 값에 맞춰주면 됩니다.

```js
function resizeCanvasToDisplaySize(canvas) {
  // 브라우저가 캔버스를 표시하고 있는 크기를 CSS 픽셀 단위로 얻어옵니다.
  const displayWidth  = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;

  // 캔버스와 크기가 다른지 확인합니다.
  const needResize = canvas.width  !== displayWidth ||
                     canvas.height !== displayHeight;

  if (needResize) {
    // 캔버스를 동일한 크기가 되도록 합니다.
    canvas.width  = displayWidth;
    canvas.height = displayHeight;
  }

  return needResize;
}
```

위 함수를 렌더링을 수행하기 직전에 호출해서 화면에 그려기지 이전에 캔버스의 크기가 항상 우리가 원하는 크기가 되도록 합시다.

```js
function drawScene() {
   resizeCanvasToDisplaySize(gl.canvas);

   ...
```

결과는 이렇게 됩니다.

{{{example url="../webgl-resize-canvas.html" }}}

어, 뭔가 이상하죠? 선이 왜 화면 전체에 걸쳐있지 않은걸까요?

이유는 캔버스의 사이즈를 수정하기 전에 `gl.viewport`를 호출하여 뷰포트를 설정해야 하기 때문입니다.
`gl.viewport`는 WebGL에게 클립 공간(-1에서 +1)에서 픽셀로 변환하는 법과 그러한 변환히 캔버스의 어떤 부분에서 이루어져야 하는지 알려줍니다.
처음 WebGL 컨텍스트를 생성할 때, WebGL은 뷰포트를 캔버스의 크기와 동일하도록 설정합니다.
하지만 그 이후에는 여러분이 설정해 주어야 합니다. 만일 캔버스의 크기를 바꾸었다면 WebGL에게 새로운 뷰포트 설정을 알려주어야 합니다.

이를 처리할 수 있도록 코드를 수정해 봅시다. WebGL 컨텍스트가 캔버스에 대한 참조를 가지고 있으므로 리사이즈시에 그것을 넘겨줍니다.

    function drawScene() {
       resizeCanvasToDisplaySize(gl.canvas);

    +   gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
       ...

이제는 잘 동작합니다.

{{{example url="../webgl-resize-canvas-viewport.html" }}}

별도의 윈도우에서 예제를 열고, 윈도우의 크기를 바꾸어 보시면 항상 윈도우 전체를 채우는 것을 보실 수 있을겁니다.

*왜 WebGL에서 캔버스의 크기를 바꿀때 자동으로 뷰포트를 설정해 주지 않는거죠?*라고 물어보시는 소리가 들리네요.
그 이유는 WebGL은 어떻게 또는 어떠한 이유로 여러분이 뷰포트를 사용하는지 모르기 때문입니다.
여러분이 [프레임버퍼에 렌더링](webgl-render-to-texture.html)하는 중일수도 있고, 무언가 다른 뷰포트 크기를 필요로 하는 작업을 하고 있을수도 있습니다.
WebGL에 여러분의 의도를 파악하는 능력은 없으므로 자동으로 뷰포트를 설정해 줄 수 없는 것입니다.
 
---

## `devicePixelRatio`와 Zoom 다루기

왜 이걸로 끝이 아닐까요? 이제는 문제가 복잡해 지는 상황을 알아봅시다.

먼저 아셔야 할것은 브라우저에서 말하는 대부분의 크기는 CSS 픽셀 단위라는 것입니다.
이렇게 하는 이유는 크기를 장치에 독립적으로 표현하기 위해서 입니다.
이 글의 위쪽 예제에서 우리는 캔버스의 디스플레이 크기를 400x300 CSS 픽셀로 만드려고 했습니다.
사용자가 HD-DPI 디스플레이를 사용하는지, 아니면 확대(zoom in) 또는 축소(zoom out)했는지, 
아니면 OS의 확대 수준을 설정했는지에 따라 실제로 모니터에 표시되는 픽셀의 숫자는 달라질 수 있습니다.

`window.devicePixelRatio`가 보통 모니터의 실제 픽셀 대비 CSS 픽셀의 비율을 알려줍니다.
예를 들어 여러분 브라우저의 현재 세팅은 아래와 같습니다.

> <div>devicePixelRatio = <span data-diagram="dpr"></span></div>

데스크탑이나 노트북을 사용 중이시라면 <kbd>ctrl</kbd>+<kbd>+</kbd> 와 <kbd>ctrl</kbd>+<kbd>-</kbd> 
을 눌러 확대 또는 축소를 해 보세요.(<kbd>⌘</kbd>+<kbd>+</kbd> and <kbd>⌘</kbd>+<kbd>-</kbd> on Mac).
숫자가 바뀌는 것을 보실 수 있을겁니다.

따라서 캔버스의 픽셀 숫자가 실제 디스플레이 숫자와 동일하기를 원한다면 아래처럼 `clientWidth`와 `clientHeight`에
 `devicePixelRatio`를 곱하는 것이 당연한 해결책으로 보입니다:

```js
function resizeCanvasToDisplaySize(canvas) {
  // 브라우저가 캔버스를 표시하고 있는 크기를 CSS 픽셀 단위로 얻어옵니다.
-  const displayWidth  = canvas.clientWidth;
-  const displayHeight = canvas.clientHeight;
+  const dpr = window.devicePixelRatio;
+  const displayWidth  = Math.round(canvas.clientWidth * dpr);
+  const displayHeight = Math.round(canvas.clientHeight * dpr);

  // 캔버스와 크기가 다른지 확인합니다.
  const needResize = canvas.width  != displayWidth || 
                     canvas.height != displayHeight;

  if (needResize) {
    // 캔버스를 동일한 크기가 되도록 합니다.
    canvas.width  = displayWidth;
    canvas.height = displayHeight;
  }

  return needResize;
}
```

정수값을 얻기 위해 `Math.round` (또는 `Math.ceil`, 또는 `Math.floor` 또는 `| 0`)를 호출해야 합니다.
왜냐하면 `canvas.width`와 `canvas.height`는 항상 정수값이기 때문입니다.
그래서 `devicePixelRatio`가 정수가 아니라면 대개는 비교가 실패합니다. 특히 확대/축소의 경우 대개 그렇습니다.

> 주의: `Math.floor` 또는 `Math.ceil` 또는 `Math.round` 중 어떤 것을 사용할지는 HTML 표준에 정의되어 있지 않습니다.
브라우저 구현에 의존적입니다(=브라우저마다 다를 수 있습니다). 🙄

어떤 경우에든, 위 코드는 제대로 동작하지 **않습니다**. 
또 다른 문제는 `devicePixelRatio`가 1.0이 아닐 때, 캔버스가 채워야 하는 CSS 영역은 정수값이 아니지만 
`clientWidth`와 `clientHeight`는 정수로 정의된다는 것입니다.
예를 들어 윈도우가 실제로는 장치에서 999 픽셀 너비이고 devicePixelRatio = 2.0인 상태에서 100% 크기의 캔버스를 사용하려고 한다고 해 봅시다. 
CSS 크기 * 2.0이 999가 되는 정수는 없습니다.

다른 해결 방법은 [`getBoundingClientRect()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect)를 사용하는 것입니다.
이 함수는 `width`와 `height`를 가진 [`DOMRect`](https://developer.mozilla.org/en-US/docs/Web/API/DOMRect) 를 반환합니다.
`clientWidth`와 `clientHeight`로 표현되는 클라이언트 사각형이지만 정수형을 요구하지는 않습니다.

아래는 컨테이너로부터 `width: 100%`로 설정된 보라색 `<canvas>`입니다.
축소를 몇 번 해서 75%나 60% 정도 되면 `clientWidth`와 `getBoundingClientRect().width`가 달라지는 것을 보실 수 있을겁니다.

> <div data-diagram="getBoundingClientRect"></div>

제 장치에서는 아래와 같은 결과가 나왔습니다.

```
Windows 10, zoom level 75%, Chrome
clientWidth: 700
getBoundingClientRect().width = 700.0000610351562

MacOS, zoom level 90%, Chrome
clientWidth: 700
getBoundingClientRect().width = 700.0000610351562

MacOS, zoom level -1, Safari (safari does not show the zoom level)
clientWidth: 700
getBoundingClientRect().width = 699.9999389648438

Firefox, both Windows and MacOS all zoom levels
clientWidth: 700
getBoundingClientRect().width = 700
```

주의: 위와 같은 특정한 경우에 파이어폭스는 700이라는 결과가 나왔지만 여러 다른 경우를 테스트 해 본 결과 
`getBoundingClientRect`가 정수가 아닌 값이 나왔습니다. 
예를 들어 윈도우를 좁게 만들어 100% 캔버스가 700보다 작게 만들면 파이어폭스에서도 정수가 아닌 값이 나오게 됩니다.

그러니, `getBoundingClientRect`를 사용해 봅시다.

```js
function resizeCanvasToDisplaySize(canvas) {
  // 브라우저가 캔버스를 표시하고 있는 크기를 CSS 픽셀 단위로 얻어옵니다.
  const dpr = window.devicePixelRatio;
-  const displayWidth  = Math.round(canvas.clientWidth * dpr);
-  const displayHeight = Math.round(canvas.clientHeight * dpr);
+  const {width, height} = canvas.getBoundingClientRect();
+  const displayWidth  = Math.round(width * dpr);
+  const displayHeight = Math.round(height * dpr);

  // 캔버스와 크기가 다른지 확인합니다.
  const needResize = canvas.width  != displayWidth || 
                     canvas.height != displayHeight;

  if (needResize) {
    // 캔버스를 동일한 크기가 되도록 합니다.
    canvas.width  = displayWidth;
    canvas.height = displayHeight;
  }

  return needResize;
}
```

이제 다된걸까요? 안타깝게도 아닙니다. 알고보니 `canvas.getBoundingClientRect()`가 언제나 올바른 값을 반환하지는 않습니다.
원인은 복잡하지만 이는 브라우저가 요소들을 그리는 방식과 관련되어 있습니다.
어떤 부분은 HTML 수준에서 결정되고 어떤 부분은 나중에 "컴포지터(compositor)" 수준(실제로 그려지는 부분)에서 결정됩니다.
`getBoundingClientRect()`는 HTML 수준이고 몇가지 다른 일들이 그 뒤에 발생해서 실제로 캔버스가 그려지는 크기에 영향을 줄 수 있습니다.

제 생각에는 예를들어 HTML부분은 추상적으로, 컴포지터는 구체적으로 동작하는 것 같습니다.
예를 들어 장치에서 999픽셀 너비인 윈도우가 있고 devicePixelRatio가 2.0인 상황이라고 합시다.
여러분이 두 개의 `width: 50%`인 요소를 나란히 만들었다고 하면, HTML은 각각이 장치에서 499.5 픽셀이라고 계산합니다.
하지만 컴포지터에서 실제로 그릴 떄에는 499.5 픽셀을 그릴 수 없으므로 하나는 499, 다른 하나는 500 픽셀이 됩니다.
어떤 것이 더 크고 어떤 것이 더 작은지는 어떠한 스펙에서도 정의되어 있지 않습니다.

브라우저의 벤더들이 찾은 해결책은 [`ResizeObserver` API](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)를 사용해서,
실제 사용되는 크기를 `devicePixelContextBoxSize` 속성을 통해 제공하는 것이었습니다.
이것은 실제 사용된 장치 픽셀을 반환합니다. `ClientBox`가 아닌 `ContentBox`라 이름붙여진 것에 주의하십시오.
이는 캔버스 요소에서 *컨텐츠*를 보여주는 부분을 의미한다는 뜻이고, 따라서 `clientWidth`, `clientHeight`와 `getBoundingClientRect`처럼 
패딩을 포함하지 않는다는 뜻입니다. 장점입니다.

이런 식으로 반환하는 이유는 결과가 비동기적이기 때문입니다.
위에서 언급한 "컴포지터"는 페이지와 비동기적으로 실행됩니다.
실제로 사용하게 될 크기를 알아내고 여러분에게 그 크기를 *대역 밖*에서 전달해 줍니다.

안타깝게도 `ResizeObserver`는 모든 모던 브라우저에서 제공하지만 `devicePixelContentBoxSize`는 크롬/엣지 브라우저에서만 사용 가능합니다.
아래는 사용 방법입니다.

`ResizeObserver`를 만들고 어떤 요소든 크기가 변하면 호출하게 될 함수를 인자로 넘겨줍니다.
우리의 경우 이는 캔버스입니다.

```js
const resizeObserver = new ResizeObserver(onResize);
resizeObserver.observe(canvas, {box: 'content-box'});
```

위 코드는 우리가 관찰할 요소의 크기가 변할 때 `onResize` 함수(아래 코드)를 호출하는 `ResizeObserver`를 만듭니다.
우리는 이 객체에게 캔버스를 `관찰하라(observe)`고 했습니다.
`content-box`의 크기가 변화하는지를 관찰하라고 한 것입니다.
이것은 중요하지만 약간은 헷갈리는 사실입니다. 
`device-pixel-content-box`의 크기가 변하는지를 관찰하라고 할수도 있지만 위 예제에서처럼 캔버스의 크기가 윈도우 크기의 100%인 퍼센트 크기를 사용할 수 있고, 이는 일반적인 상황입니다.
이 경우엔 캔버스가 확대/축소 수준에 상관없이 항상 같은 디바이스 픽셀 숫자를 가집니다.
확대/축소에 따라 윈도우의 크기는 변하지 않기 때문에 항상 같은 디바이스 픽셀 숫자를 가집니다.
한편 `content-box`는 우리가 확대/축소를 하면 변하게 되는데 이는 CSS 픽셀 단위로 측정되기 때문입니다.
따라서 우리가 확대/축소를 한다면 디바이스 픽셀 내의 CSS 픽셀 숫자가 변하게 됩니다.

확대/축소 수준에 신경쓰지 않는다면 `device-pixel-content-box`만 관찰할 수도 있습니다.
지원하지 않는 경우에는 오류를 throw할 것입니다.

```js
const resizeObserver = new ResizeObserver(onResize);
try {
  // 디바이스 픽셀이 변할 경우에만 호출
  resizeObserver.observe(canvas, {box: 'device-pixel-content-box'});
} catch (ex) {
  // device-pixel-content-box를 지원하지 않는 경우에는 아래 코드를 사용
  resizeObserver.observe(canvas, {box: 'content-box'});
}
```

`onResize`함수는 [`ResizeObserverEntry`s](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserverEntry) 배열에 의해 호출됩니다.
크기가 변한 요소마다 한번씩 호출됩니다.
하나 이상의 요소를 처리할 수 있도록 크기를 map에 기록해 둘 것입니다.

```js
// 기본 캔버스 크기로 초기화
const canvasToDisplaySizeMap = new Map([[canvas, [300, 150]]]);

function onResize(entries) {
  for (const entry of entries) {
    let width;
    let height;
    let dpr = window.devicePixelRatio;
    if (entry.devicePixelContentBoxSize) {
      // 주의: 이 경우에만 올바른 결과가 도출됨
      // 다른 경우에는 불완전한 처리가 수행되는데 브라우저가 
      // 이러한 문제를 해결하는 방법을 제공하지 않는 경우임
      width = entry.devicePixelContentBoxSize[0].inlineSize;
      height = entry.devicePixelContentBoxSize[0].blockSize;
      dpr = 1; // 이미 width와 height값에 포함됨
    } else if (entry.contentBoxSize) {
      if (entry.contentBoxSize[0]) {
        width = entry.contentBoxSize[0].inlineSize;
        height = entry.contentBoxSize[0].blockSize;
      } else {
        width = entry.contentBoxSize.inlineSize;
        height = entry.contentBoxSize.blockSize;
      }
    } else {
      width = entry.contentRect.width;
      height = entry.contentRect.height;
    }
    const displayWidth = Math.round(width * dpr);
    const displayHeight = Math.round(height * dpr);
    canvasToDisplaySizeMap.set(entry.target, [displayWidth, displayHeight]);
  }
}
```

지저분해 보이네요. `devicePixelContentBoxSize`를 지원하지 않는 경우에 대한 3개 다른 버전의 API를 사용하는 것을 보실 수 있습니다. 😂

이제 이 데이터를 사용하도록 resize 함수를 수정합시다.

```js
function resizeCanvasToDisplaySize(canvas) {
-  // Lookup the size the browser is displaying the canvas in CSS pixels.
-  const dpr = window.devicePixelRatio;
-  const {width, height} = canvas.getBoundingClientRect();
-  const displayWidth  = Math.round(width * dpr);
-  const displayHeight = Math.round(height * dpr);
+  // 디바이스 픽셀 단위로 브라우저가 이 캔버스를 표시하는 크기를 얻어옵니다.
+ const [displayWidth, displayHeight] = canvasToDisplaySizeMap.get(canvas);

  // 캔버스와 크기가 다른지 확인합니다.
  const needResize = canvas.width  != displayWidth || 
                     canvas.height != displayHeight;

  if (needResize) {
    // 캔버스를 동일한 크기가 되도록 합니다.
    canvas.width  = displayWidth;
    canvas.height = displayHeight;
  }

  return needResize;
}
```

아래는 이 코드를 사용한 예제입니다.

{{{example url="../webgl-resize-canvas-hd-dpi.html" }}}

차이점을 발견하기 어려우실 겁니다.
스마트폰이나 2019년 이후 맥, 또는 4K 모니터와 같은 HD-DPI 디스플레이를 사용한다면 이 선이 위 예제의 선보다 얇아보일 겁니다.

한편, 확대를 해도(별개의 윈도우에서 열어서 확인해 보시길 바랍니다.) 선이 동일한 해상도를 유지할 겁니다.
이전 예제에서는 확대를 하면 선이 굵어지고 해상도가 떨어지는데 이는 `devicePixelRatio`를 보정하지 않기 때문입니다.

아래는 간단히 캔버스 2D를 사용해 세 가지 방법 전체를 테스트한 결과입니다.
간단히 하기위해서 WebGL을 사용하지 않았습니다. 대신 캔버스 2D를 사용하고 
2x2 수직 흑백 패턴과 2x2 수평 흑백의 두 가지 패턴을 만들었습니다.
왼쪽에는 수평 패턴 ▤를 그리고 오른쪽에는 수직 패턴 ▥를 그렸습니다.

{{{example url="../webgl-resize-the-canvas-comparison.html"}}}

윈도우를 리사이즈 하거나, 더 좋은 방법은 새 창으로 열어서 위에 이야기한 키를 사용하여 확대/축소 해 보십시오.
서로 다른 확대/축소 수준에서 윈도우 크기를 바꿔 보면 가장 아래쪽 예제만 올바로 동작하는 것을 볼 수 있을겁니다(크롬/엣지 브라우저의 경우).
주의할 것은 여러분 장치의 `devicePixelRatio`가 커질수록 문제점을 눈치채기 어렵다는 것입니다.
주목하셔야 할 것은 오른쪽과 왼쪽 패턴이 유사하게 보이는지 입니다.
패턴이 거칠어 보이거나 음영이 다르게 보이면 제대로 동작하지 않는 것입니다.
이 기능은 크롬/엣지 브라우저에서만 동작하기 때문에 이들을 사용하여야 제대로 동작하는지 볼 수 있습니다.

또 다른 주의사항은 어떤 OS(MacOS)에서는 앱에서는 숨겨진 OS 수준의 스케일링 옵션이 있다는 것입니다.
이 경우 가장 아래쪽 케이스에서도 약간의 패턴을 볼 수 있는데(크롬/엣지 브라우저를 사용하는 경우에도) 그래도 일정한 패턴일 것입니다.

이는 다른 브라우저에는 아직 좋은 해결 방안이 없다는 뜻이지만 꼭 완전한 해결법이 필요한 것일까요?
대부분의 WebGL 앱의 역할은 텍스처와 조명 효과를 더한 3D를 그리는 것입니다.
그래서 위쪽과 같이 `devicePixelRatio`를 무시하거나, `clientWidth`, `clientHeight` 또는 `getBoundingClientRect()` * `devicePixelRatio`를 사용하고 
그냥 넘어가도 크게 티가 나지는 않습니다.

나아가서, `devicePixelRatio`를 무작정 사용하는 것은 성능 저하를 불러일으킬 수 있습니다.
iPhoneX나 iPhone11에서는 <code>window.devicePixelRatio</code>가 <code>3</code>인데 
이는 9배나 많은 픽셀을 그리게 된다는 뜻입니다.
Samsung Galaxy S8에서는 그 값이 <code>4</code>인데 이는 16배 많은 픽셀을 그린다는 뜻입니다.
이는 여러분 프로그램을 느리게 만듭니다. 사실 게임에서 실제 그려지는 것보다 더 적은 픽셀을 그리고 GPU에서 스케일을 늘리는 것이 보편적인 최적화 기법입니다.
어떻게 할지는 여러분에게 필요한 것이 무엇인지에 달렸습니다.
프린트하기 위한 그래픽을 그리는 것이라면 HD-DPI를 지원하는 것이 필요합니다.
게임을 만든다면 이러한 기능이 필요 없거나 혹은 시스템이 충분히 빠르지 못한 경우 유저에게 이러한 기능을 켜고 끄는 옵션을 제공하는 것이 좋습니다.
 
또 다른 주의사항은, 적어도 2021 1월 현재 `round(getBoundingClientRect * devicePixelRatio)`가 위의 선 예제처럼 
캔버스가 풀 사이즈인 **경우에만** 모던 브라우저들에서 제대로 동작한다는 것입니다.
아래는 패턴을 사용한 예제입니다.

{{{example url="../webgl-resize-the-canvas-comparison-fullwindow.html"}}}

여러분이 *이 페이지*를 확대/축소 하고 리사이즈 한다면 `getBoundingClientRect`가 제대로 동작하지 않을 것입니다.
이는 캔버스가 전체 윈도우가 아니고 iframe내부에 있기 때문입니다.
예제를 별도의 윈도우에서 열면 제대로 동작할 것입니다.

어떤 방법을 사용할 것인지는 여러분에게 달렸습니다.
저같은 경우 99%의 경우 `devicePixelRatio`를 사용하지 않습니다.
이는 대부분의 사람들은 눈치채지 못하는 몇 가지 그래픽적인 장점만을 제공하면서 페이지를 느리게 만들기 때문입니다.
이 사이트에서 몇 개의 다이어그램에는 이 기능을 사용하지만 대부분의 예제에서는 사용하지 않고 있습니다.

여러 WebGL 프로그램에서 크기 조정이나 캔버스의 크기를 셋팅하는 서로 다른 방법들을 보실 수 있을겁니다.
제 생각에는 브라우저가 디스플레이되는 캔버스의 크기를 CSS를 통해 결정하고 그 뒤에 결정된 크기를 기반으로 캔버스에 얼마나 많은 필셀을 그릴지를 조정하는 것이 
가장 좋은 방법인 것 같습니다.
이유가 궁금하시다면 <a href="webgl-anti-patterns.html">여기 몇 가지 이유가 있습니다.</a> 
위에 말씀드린 방법이 가장 선호되는 방법일 것 같습니다.

<!-- just to shut up the build that this link used to exist
     and still exists in older translations -->
<a href="webgl-animation.html"></a>

<script type="module" src="resources/webgl-resizing-the-canvas.module.js"></script>

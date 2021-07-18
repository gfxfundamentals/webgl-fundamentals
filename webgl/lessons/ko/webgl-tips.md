Title: WebGL Tip
Description: WebGL에서 발생할 수 있는 사소한 문제들
TOC: #


이 글은 WebGL을 사용할 때 발생할 수 있지만 별도로 분리하기에는 너무 사소한 문제들의 모음입니다.

---

<a id="screenshot" data-toc="Screenshot 찍기"></a>

# Canvas Screenshot 찍기

브라우저에는 screenshot을 찍는 2개의 함수가 있는데요.
오래된 함수인 [`canvas.toDataURL`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL)과 좀 더 나은 새로운 함수인 [`canvas.toBlob`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)입니다.

그래서 이렇게 약간의 코드를 추가하여 screenshot을 쉽게 찍을 수 있을 것이라 생각하실텐데

```html
<canvas id="c"></canvas>
+<button id="screenshot" type="button">Save...</button>
```

```js
const elem = document.querySelector('#screenshot');
elem.addEventListener('click', () => {
  canvas.toBlob((blob) => {
    saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.png`);
  });
});

const saveBlob = (function() {
  const a = document.createElement('a');
  document.body.appendChild(a);
  a.style.display = 'none';
  return function saveData(blob, fileName) {
     const url = window.URL.createObjectURL(blob);
     a.href = url;
     a.download = fileName;
     a.click();
  };
}());
```

다음은 위 코드와 버튼을 배치하기 위한 CSS가 추가된 [애니메이션에 관한 글](webgl-animation.html)의 예제로

{{{example url="../webgl-tips-screenshot-bad.html"}}}

시도해보면 이런 screenshot을 얻게 되는데

<div class="webgl_center"><img src="resources/screencapture-398x298.png"></div>

네, 그냥 빈 이미지입니다.

브라우저/OS에 따라 작동할 수도 있지만 아마 일반적으로는 작동하지 않을 겁니다.

해당 문제는 성능과 호환성 이유로, 기본적으로 브라우저는 WebGL canvas에 그린 뒤 drawing buffer를 지우는데요.

3가지 해결법이 있습니다.

1.  캡처 직전에 렌더링 코드 호출

    `drawScene` 함수로 사용한 코드입니다.
    해당 코드가 어떤 상태도 변하지 않도록 만드는 게 가장 좋으며 캡처용 렌더링을 하도록 호출할 수 있습니다.

    ```js
    elem.addEventListener('click', () => {
    +  drawScene();
      canvas.toBlob((blob) => {
        saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.png`);
      });
    });
    ```

2.  렌더링 루프에서 캡처 코드를 호출

    이 경우 캡처하길 원한다는 플래그를 설정하고 렌더링 루프에서 실제로 캡처를 하면 되는데

    ```js
    let needCapture = false;
    elem.addEventListener('click', () => {
       needCapture = true;
    });
    ```

    그리고 현재 `drawScene`에 구현된 렌더링 루프에서 모든 게 그려진 뒤에

    ```js
    function drawScene(time) {
      ...

    +  if (needCapture) {
    +    needCapture = false;
    +    canvas.toBlob((blob) => {
    +      saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.png`);
    +    });
    +  }

      ...
    }
    ```

3. WebGL context를 만들 때 `preserveDrawingBuffer: true`로 설정

    ```js
    const gl = someCanvas.getContext('webgl', {preserveDrawingBuffer: true});
    ```

    이건 나머지 페이지와 합성 후 WebGL이 캔버스를 지우지 않게 만들지만 일부 *가능한* 최적화를 막습니다.

저는 위의 #1을 선택하겠습니다.
이 특정 예제를 위해 먼저 상태를 업데이트하는 코드 부분을 그리는 부분에서 분리합니다.

```js
  var then = 0;

-  requestAnimationFrame(drawScene);
+  requestAnimationFrame(renderLoop);

+  function renderLoop(now) {
+    // 초 단위로 변환
+    now *= 0.001;
+    // 현재 시간에서 이전 시간 빼기
+    var deltaTime = now - then;
+    // 다음 프레임을 위해 현재 시간을 기억합니다.
+    then = now;
+
+    // 모든 프레임은 rotation을 약간 증가시킵니다.
+    rotation[1] += rotationSpeed * deltaTime;
+
+    drawScene();
+
+    // 다음 프레임에서 drawScene 다시 호출
+    requestAnimationFrame(renderLoop);
+  }

  // 장면 그리기
+  function drawScene() {
- function drawScene(now) {
-    // 초 단위로 변환
-    now *= 0.001;
-    // 현재 시간에서 이전 시간 빼기
-    var deltaTime = now - then;
-    // 다음 프레임을 위해 현재 시간을 기억합니다.
-    then = now;
-
-    // 모든 프레임은 rotation을 약간 증가시킵니다.
-    rotation[1] += rotationSpeed * deltaTime;

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    ...

-    // 다음 프레임에서 drawScene 다시 호출
-    requestAnimationFrame(drawScene);
  }
```

이제 캡처하기 전에 `drawScene`을 호출하면 되며

```js
elem.addEventListener('click', () => {
+  drawScene();
  canvas.toBlob((blob) => {
    saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.png`);
  });
});
```

그리고 이제 작동합니다.

{{{example url="../webgl-tips-screenshot-good.html" }}}

실제로 캡처된 이미지를 확인해보면 배경이 투명한 걸 보실 수 있는데요.
자세한 내용은 [이 글](webgl-and-alpha.html)을 참고해주세요.

---

<a id="preservedrawingbuffer" data-toc="Canvas Clear 방지"></a>

# Canvas Clear 방지

사용자가 애니메이션 개체로 그리도록 하고 싶다고 해봅시다.
먼저 webgl context를 만들 때 `preserveDrawingBuffer: true`를 전달해야 합니다.
이는 브라우저가 캔버스를 지우는 걸 방지합니다.

[애니메이션에 관한 글](webgl-animation.html)의 마지막 예제를 가져오고

```js
var canvas = document.querySelector("#canvas");
-var gl = canvas.getContext("webgl");
+var gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
```

`gl.clear` 호출을 수정해서 depth buffer만 지우는데

```js
-// 캔버스와 the depth buffer 지우기
-gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
+// depth buffer 지우기
+gl.clear(gl.DEPTH_BUFFER_BIT);
```

{{{example url="../webgl-tips-preservedrawingbuffer.html" }}}

참고로 진지하게 드로잉 프로그램을 만든다면 해상도가 바뀔 때마다 브라우저가 캔버스를 지우므로 이는 해결책이 될 수 없습니다.
우리는 디스플레이 크기에 따라 해상도를 변경하고 있는데요.
창 크기가 변경되면 디스플레이 크기도 변경됩니다.
사용자가 파일을 다운로드할 때, 브라우저가 상태 표시줄을 추가할 때, 심지어 다른 탭에 있을 때도 포함될 수 있습니다.
또한 사용자가 휴대 전화를 돌려서 브라우저가 세로 모드에서 가로 모드로 전환되는 경우도 포함됩니다.

정말로 드로잉 프로그램을 만들고 싶다면 [텍스처 렌더링](webgl-render-to-texture.html)을 해야 합니다.

---

<a id="tabindex" data-toc="캔버스 키보드 입력"></a>

# 키보드 입력 받기

전체 페이지 / 전체 화면 webgl 앱을 만드는 경우 원하는 건 뭐든지 할 수 있지만 종종 캔버스가 더 큰 페이지의 일부가 되길 원하고 사용자가 캔버스를 클릭하면 캔버스가 키보드 입력을 받게 하고 싶을 겁니다.
일반적으로 캔버스는 키보드 입력을 받을 수 없습니다.
이를 수정하기 위해 캔버스의 [`tabindex`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/tabIndex)를 0 이상으로 설정하세요.

```html
<canvas tabindex="0"></canvas>
```

이로 인해 새로운 문제가 발생합니다.
`tabindex`가 설정된 모든 항목은 포커스될 때 하이라이팅이 되는데요.
이를 수정하기 위해 focus CSS outline을 none으로 설정하고

```css
canvas:focus {
  outline:none;
}
```

증명을 위해 3개의 캔버스를 만들고

```html
<canvas id="c1"></canvas>
<canvas id="c2" tabindex="0"></canvas>
<canvas id="c3" tabindex="1"></canvas>
```

마지막 캔버스에 대한 css를 추가한 뒤

```css
#c3:focus {
    outline: none;
}
```

모두에 동일한 이벤트 리스너를 등록하는데

```js
document.querySelectorAll('canvas').forEach((canvas) => {
  const ctx = canvas.getContext('2d');

  function draw(str) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(str, canvas.width / 2, canvas.height / 2);
  }
  draw(canvas.id);

  canvas.addEventListener('focus', () => {
    draw('has focus press a key');
  });

  canvas.addEventListener('blur', () => {
    draw('lost focus');
  });

  canvas.addEventListener('keydown', (e) => {
    draw(`keyCode: ${e.keyCode}`);
  });
});
```

참고로 첫 번째 캔버스는 키보드 입력을 받을 수 없습니다.
두 번째 캔버스에서는 할 수 있지만 하이라이팅이 됩니다.
세 번째 캔버스는 두 해결책이 모두 적용되었습니다.

{{{example url="../webgl-tips-tabindex.html"}}}

---

<a id="html-background" data-toc="WebGL 배경 제작"></a>

# WebGL 애니메이션 배경 제작

공통적인 질문은 어떻게 WebGL 애니메이션을 웹 페이지의 배경으로 만드는가 입니다.

2가지 확실한 방법이 있는데요.

* 다음처럼 canvas CSS `position`을 `fixed`로 설정

```css
#canvas {
 position: fixed;
 left: 0;
 top: 0;
 z-index: -1;
 ...
}
```

그리고 `z-index`를 -1로 설정합니다.

이 해결책의 사소한 단점은 javascript가 페이지와 통합되어야 하고 복잡한 페이지라면 webgl code의 javascript가 페이지에서 다른 작업을 수행하는 javascript와 충돌하지 않도록 해야 한다는 겁니다.

* `iframe` 사용

이건 이 사이트의 [첫 페이지](/)에 사용된 해결법입니다.

웹 페이지에 iframe을 삽입하면 되는데, 예를 들어

```html
<iframe id="background" src="background.html"></iframe>
<div>
  Your content goes here.
</div>
```

그런 다음 iframe이 창을 가득 채우고, iframe이 기본적으로 테두리를 가지기 때문에 `border`를 `none`으로 설정해야 한다는 걸 제외하면, 위에서 캔버스에 사용한 것과 동일한 코드로 뒤에 있도록 style을 설정합니다.

```css
#background {
    position: fixed;
    width: 100vw;
    height: 100vh;
    left: 0;
    top: 0;
    z-index: -1;
    border: none;
    pointer-events: none;
}
```

{{{example url="../webgl-tips-html-background.html"}}}


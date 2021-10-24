Title: WebGL 최소 프로그램
Description: 테스트를 위한 최소한의 코드
TOC: 최소 프로그램

이 글은 [기초](webgl-fundamentals.html)로 시작한 여러 다른 글을 읽었다고 가정합니다.
아직 읽지 않았다면 거기부터 시작해주세요.

두 가지 목적이 있어서 이 글을 어떻게 정리해야 할지 잘 모르겠습니다.

1. 최소한의 WebGL 프로그램을 보여 드립니다.

   이러한 기술은 무언가를 테스트하거나 [Stack Overflow를 위한 MCVE](https://meta.stackoverflow.com/a/349790/128511)를 만들 때 혹은 버그의 범위를 좁히려고 할 때 굉장히 유용합니다.

2. 틀 밖에서 생각하는 방법 배웁니다.

   일반적인 패턴 뿐 아니라 더 큰 그림을 볼 때 도움이 되도록 이에 대한 더 많은 글을 작성하려 합니다.
   하나는 [여기](webgl-drawing-without-data.html)에 있습니다.

## 그냥 지우기

다음은 무언가를 하는 최소 WebGL 프로그램입니다.

```js
const gl = document.querySelector('canvas').getContext('webgl');
gl.clearColor(1, 0, 0, 1);  // 빨간색
gl.clear(gl.COLOR_BUFFER_BIT);
```

이 프로그램이 하는 것은 캔버스를 빨간색으로 지우는 게 전부지만 실제로는 무언가 했습니다.

이것만으로도 실제로 몇 가지 테스트를 할 수 있는데요.
[텍스처에 렌더링](webgl-render-to-texture.html)하는데 작동하지 않는다고 가정해봅시다.
그리고 [해당 글](webgl-render-to-texture.html)의 예제와 같다고 가정해봅시다.
하나 이상의 3D 물체를 텍스처에 렌더링한 다음 그 결과를 큐브에 렌더링합니다.

아무것도 안 보이는데요.
간단한 테스트로서 알려진 색상으로 텍스처를 지우는 셰이더로 텍스처에 렌더링하는 것을 멈춰봅시다.

```js
gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferWithTexture)
gl.clearColor(1, 0, 1, 1);  // 자홍색
gl.clear(gl.COLOR_BUFFER_BIT);
```

이제 프레임버퍼의 텍스처로 렌더링합니다.
큐브가 자홍색으로 돌아갔나요?
아니라면 텍스처에 렌더링하는 부분이 아니라 다른 문제입니다.

## `SCISSOR_TEST` 그리고 `gl.clear` 사용

`SCISSOR_TEST`는 그리기와 지우기 모두 캔버스(혹은 현재 프레임버퍼)의 하위 사각형으로 자릅니다.
다음과 같이 작성하여 scissor test를 활성화합니다.

```js
gl.enable(gl.SCISSOR_TEST);
```

그런 다음 왼쪽 하단 모서리를 기준으로 scissor rectangle을 픽셀 단위로 설정합니다.
이는 `gl.viewport`와 같은 매개 변수를 사용합니다.

```js
gl.scissor(x, y, width, height);
```

이렇게 하면 `SCISSOR_TEST`와 `gl.clear`를 사용하여 사각형을 그릴 수 있습니다.

예시:

```js
const gl = document.querySelector('#c').getContext('webgl');

gl.enable(gl.SCISSOR_TEST);

function drawRect(x, y, width, height, color) {
  gl.scissor(x, y, width, height);
  gl.clearColor(...color);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

for (let i = 0; i < 100; ++i) {
  const x = rand(0, 300);
  const y = rand(0, 150);
  const width = rand(0, 300 - x);
  const height = rand(0, 150 - y);
  drawRect(x, y, width, height, [rand(1), rand(1), rand(1), 1]);
}


function rand(min, max) {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return Math.random() * (max - min) + min;
}
```

{{{example url="../webgl-simple-scissor.html"}}}

Not saying that particular one is all that useful but still it's good to know.

## 큰 `gl.POINTS` 하나 사용

대부분의 예제에서 볼 수 있듯이, WebGL에서 가장 일반적인 수행하는 작업은 버퍼 생성입니다.
이러한 버퍼에 정점 데이터를 넣습니다.
속성이 있는 셰이더를 만듭니다.
버퍼에서 데이터를 가져오도록 속성을 설정합니다.
그런 다음 셰이더에서도 사용되는 uniform과 텍스처를 사용하여 그립니다.

하지만 간혹 테스트하고 싶을 때가 있습니다.
무언가 그리는 걸 보고 싶다고 가정해봅시다.

이런 셰이더 세트는 어떨까요?

```glsl
// 정점 셰이더
void main() {
  gl_Position = vec4(0, 0, 0, 1);  // 중앙
  gl_PointSize = 120.0;
}
```

```glsl
// 프래그먼트 셰이더
precision mediump float;

void main() {
  gl_FragColor = vec4(1, 0, 0, 1);  // 빨간색
}
```

그리고 이를 사용하는 코드는 다음과 같습니다.

```js
// GLSL 프로그램 설정
const program = webglUtils.createProgramFromSources(gl, [vs, fs]);

gl.useProgram(program);

const offset = 0;
const count = 1;
gl.drawArrays(gl.POINTS, offset, count);
```

생성하는 버퍼도 없고, 설정하는 uniform도 없으며, 캔버스 중앙에 하나의 점만 있습니다.

{{{example url="../webgl-simple-point.html"}}}

> NOTE: Safari pre 15는 이 기능에 대한 [WebGL 적합성 테스트](https://www.khronos.org/registry/webgl/sdk/tests/conformance/rendering/point-no-attributes.html?webglVersion=1&quiet=0)를 통과하지 못 했습니다.

`gl.POINTS` 정보: `gl.POINTS`를 `gl.drawArrays`로 전달할 때 픽셀 단위의 크기로 정점 셰이더의 `gl_PointSize`도 설정해야 합니다.
GPU/드라이버마다 사용할 수 있는 최대 점 크기가 다르다는 점에 주의하세요.
최대 크기는 다음과 같이 쿼리할 수 있습니다.

```
const [minSize, maxSize] = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);
```

WebGL 스펙은 오직 최대 크기 1.0을 필요로 합니다.
다행히도 [모든 GPU와 드라이버는 아니지만 대부분이 더 큰 크기를 지원](https://webglstats.com/webgl/parameter/ALIASED_POINT_SIZE_RANGE)합니다.

`gl_PointSize`를 설정한 다음 정점 셰이더가 종료될 때, `gl_Position`에 설정한 모든 값은 픽셀 단위의 화면/캔버스 공간으로 변환되며, 네 방향 모두에 +/- gl_PointSize / 2인 위치에 정사각형이 생성됩니다.

누가 점 하나 그리는 걸 원하겠다고 생각하실 수 있습니다.

점은 자동적으로 비어있는 [텍스처 좌표](webgl-3d-textures.html)를 가집니다.
프래그먼트 셰이더의 특수 변수 `gl_PointCoord`로 사용할 수 있는데요.
해당 점의 텍스처를 그려봅시다.

먼저 프래그먼트 셰이더를 변경합니다.

```glsl
// 프래그먼트 셰이더
precision mediump float;

+uniform sampler2D tex;

void main() {
-  gl_FragColor = vec4(1, 0, 0, 1);  // 빨간색
+  gl_FragColor = texture2D(tex, gl_PointCoord.xy);
}
```

이제 이를 단순하게 유지하기 위해 [데이터 텍스처에 대한 글](webgl-data-textures.html)에서 다룬 것처럼 원본 데이터로 만들어 보겠습니다.

```js
// 2x2 픽셀 데이터
const pixels = new Uint8Array([
  0xFF, 0x00, 0x00, 0xFF,  // 빨간색
  0x00, 0xFF, 0x00, 0xFF,  // 초록색
  0x00, 0x00, 0xFF, 0xFF,  // 파란색
  0xFF, 0x00, 0xFF, 0xFF,  // 자홍색
]);
const tex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, tex);
gl.texImage2D(
    gl.TEXTURE_2D,
    0,                 // 레벨
    gl.RGBA,           // 내부 포맷
    2,                 // 너비
    2,                 // 높이
    0,                 // 테두리
    gl.RGBA,           // 포맷
    gl.UNSIGNED_BYTE,  // 타입
    pixels,            // 데이터
);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
```

WebGL은 기본적으로 texture unit 0을 사용하고 uniform은 기본적으로 0이므로 따로 설정할 것은 없습니다.

{{{example url="../webgl-simple-point-w-texture.html"}}}

이건 텍스처 관련 문제를 테스트하는 좋은 방법이 될 수 있습니다.
버퍼도 안 쓰고, 속성도 없으며, uniform을 찾아 설정하지 않아도 됩니다.
예를 들어 이미지를 로드한다면 표시되지 않는데요.
위 셰이더를 사용하면 점에 이미지가 표시될까요?
텍스처에 렌더링한 다음 텍스처를 보려고 합니다.
일반적으로 버퍼와 속성을 통해 geometry를 설정하지만 이 단일 점에 표시하는 것만으로 텍스처를 렌더링할 수 있습니다.

## 여러 단일 `POINTS` 사용

위 예제를 기반으로 한 간단한 변경입니다.
정점 셰이더를 이렇게 바꿀 수 있는데요.

```glsl
// 정점 셰이더

+attribute vec4 position;

void main() {
-  gl_Position = vec4(0, 0, 0, 1);
+  gl_Position = position;
  gl_PointSize = 120.0;
}
```

속성은 기본값으로 `0, 0, 0, 1`을 가지므로 위 예제로 변경해도 여전히 작동합니다.
하지만 이제 우리가 원하는 위치를 설정할 수 있는 능력을 얻었습니다.

```js
+const program = webglUtils.createProgramFromSources(gl, [vs, fs]);
const positionLoc = gl.getAttribLocation(program, 'position');

...

+const numPoints = 5;
+for (let i = 0; i < numPoints; ++i) {
+  const u = i / (numPoints - 1);    // 0 ~ 1
+  const clipspace = u * 1.6 - 0.8;  // -0.8 ~ +0.8
+  gl.vertexAttrib2f(positionLoc, clipspace, clipspace);

*  const offset = 0;
*  const count = 1;
*  gl.drawArrays(gl.POINTS, offset, count);
+}
```

실행하기 전에 점을 더 작게 만듭시다.

```glsl
// 정점 셰이더

attribute vec4 position;
+uniform float size;

void main() {
  gl_Position = position;
-  gl_PointSize = 120.0;
+  gl_PointSize = 20.0;
}
```

그리고 점의 색상을 설정할 수 있도록 만들어 보겠습니다.
(참고: 텍스처가 없는 코드로 다시 전환했습니다)

```glsl
precision mediump float;

+uniform vec4 color;

void main() {
-  gl_FragColor = vec4(1, 0, 0, 1);   // 빨간색
+  gl_FragColor = color;
}
```

그리고 color location을 찾아야 합니다.

```js
// GLSL 프로그램 설정
const program = webglUtils.createProgramFromSources(gl, [vs, fs]);
const positionLoc = gl.getAttribLocation(program, 'position');
+const colorLoc = gl.getUniformLocation(program, 'color');
```

그런 다음 그것들을 사용합니다.

```js
gl.useProgram(program);

const numPoints = 5;
for (let i = 0; i < numPoints; ++i) {
  const u = i / (numPoints - 1);    // 0 ~ 1
  const clipspace = u * 1.6 - 0.8;  // -0.8 ~ +0.8
  gl.vertexAttrib2f(positionLoc, clipspace, clipspace);

+  gl.uniform4f(colorLoc, u, 0, 1 - u, 1);

  const offset = 0;
  const count = 1;
  gl.drawArrays(gl.POINTS, offset, count);
}
```

이제 5개의 색상을 가진 5개의 점이 있으며 여전히 어떤 버퍼나 속성도 설정하지 않았습니다.

{{{example url="../webgl-simple-points.html"}}}

물론 이건 WebGL에서 많은 양의 점을 그려야 하는 방식이 아닙니다.
많은 점을 그리려면 각 점의 위치와 색상으로 속성을 설정하고 단일 그리기 호출에서 모든 점을 그려야 합니다.

하지만! 테스트, 디버깅, [MCVE](https://meta.stackoverflow.com/a/349790/128511)를 만들기 위해 코드를 최소화하기 좋은 방법입니다.
또 다른 예로 후처리 효과를 위해 텍스처에 그리는 중이고 이를 시각화하고 싶다고 가정해보겠습니다.
이 예제와 텍스처를 사용한 이전 예제의 조합을 사용하여 각각 하나의 큰 점을 그릴 수 있습니다.
복잡한 버퍼와 속성 과정이 필요하지 않아 디버깅에 적합합니다.


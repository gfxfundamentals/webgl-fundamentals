Title: WebGL readPixels
Description: readPixels의 세부 사항
TOC: readPixels


WebGL에서는 format/type 쌍을 `readPixels`에 전달합니다.
주어진 텍스처 내부 format(framebuffer에 첨부된)의 경우, 단 2개의 format/type 조합만 유효합니다

명세서을 보면:

> normalized fixed-point rendering surface의 경우, format `RGBA`와 type `UNSIGNED_BYTE` 조합이 유효합니다.
signed integer rendering surface의 경우, format `RGBA_INTEGER`와 type `INT` 조합이 유효합니다.
unsigned integer rendering surface의 경우, format `RGBA_INTEGER`와 type `UNSIGNED_INT`가 유효합니다.

두 번째 조합은 구현이 정의되어 있으므로 <span style="color:red;">코드를 이식 가능하게 하려면 사용하지 않아야 합니다.</span>
format/type 조합이 뭔지 물어볼 수 있는데

```js
// 첨부된 읽기 텍스처와 함께 framebuffer가 바인딩되어 있다고 가정
const format = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_FORMAT);
const type = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_TYPE);
```

또한 framebuffer에 첨부하고 렌더링할 수 있음을 의미하는, 렌더링 가능한 texture format도, 어느정도 구현이 정의되어 있는지 확인하세요.
WebGL1은 렌더링할 수 있는 `RGBA`/`UNSIGNED_BYTE` 조합, 하나만을 필요로 합니다.
나머지는 모두 선택 사항(예를 들어 `LUMINANCE`)이며, 일부(예를 들어 `RGBA`/`FLOAT`)는 extension으로 렌더링할 수 있습니다.

**아래 표는 라이브입니다.**
아마 기기, OS, GPU, 브라우저에 따라 다른 결과를 준다는 걸 눈치채셨을 겁니다.
제 컴퓨터에선 Chrome과 Firefox가 일부 구현 정의 값에 대해 다른 결과를 제공하고 있습니다.

<div class="webgl_center" data-diagram="formats"></div>

<script src="../resources/twgl-full.min.js"></script>
<script src="resources/webgl-readpixels.js"></script>


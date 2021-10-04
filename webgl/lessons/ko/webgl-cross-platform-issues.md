Title: WebGL Cross Platform 문제
Description: WebGL 앱이 어디서나 작동하도록 만들기 위해 알아야 할 사항들입니다.
TOC: Cross Platform 문제


모든 WebGL program이 모든 기기 혹은 브라우저에서 작동하지 않아도 충격으로 다가오지 않을 겁니다.
WebGL2의 경우, 적어도 2020년 7월 현재, [사파리](#safari)에서 지원되지 않습니다.

다음은 제 머릿속에 있는 발생 가능한 대부분의 문제입니다.

## 성능

고사양 GPU는 저사양 GPU보다 100배 더 빠르게 돌아갈 수 있습니다.
제가 아는 유일한 방법은 저사양을 기준으로 하거나, 대부분의 데스크탑 PC 앱처럼 성능이나 품질을 선택할 수 있는 옵션을 사용자에게 제공하는 겁니다.

## 메모리

비슷하게 고사양 GPU는 12에서 24기가의 램을 가질 수 있는 반면 저사양 GPU는 1기가보다 적을 수 있습니다. (제가 나이가 많아서 16k에서 64k의 메모리를 가진 컴퓨터로 프로그래밍을 시작했기 때문에 저사양 = 1기가인 것이 저에겐 놀랍습니다 😜)

## 기기 제한

WebGL은 다양한 최소 지원 기능이 있지만 로컬 장치에서는 최소 범위보다 많이 지원할 수 있으며 이는 더 적게 지원하는 다른 기기에서 실패한다는 걸 의미합니다.

예제:

* 허용되는 최대 텍스처 크기

  2048이나 4096은 합리적인 제한으로 보입니다.
  적어도 2020년 현재 [99%의 기기들이 4096를 지원하지만 50%만이 4096 이상을 지원](https://webglstats.com/webgl/parameter/MAX_TEXTURE_SIZE)합니다.

  참고: 최대 텍스처 크기는 GPU가 처리할 수 있는 최대 크기입니다.
  이건 GPU가 해당 크기를 제곱(2D 텍스처용)하거나 세제곱(3D 텍스처용)하는데 충분한 메모리가 있다는 뜻이 아닌데요.
  예를 들어 일부 GPU는 16384의 최대 크기를 가집니다.
  하지만 각 면이 16384인 3D 텍스처는 16TB의 메모리를 필요로 합니다!!!

* 단일 program의 vertex attribute 최대 개수

  WebGL1에서 지원되는 최소값은 8입니다.
  WebGL2는 16입니다.
  그 이상을 사용하고 있다면 최소값만 지원하는 컴퓨터에서 코드가 실패할 겁니다.

* Uniform vector의 최대 개수

  Vertex shader와 fragment shader에 따로따로 지정됩니다.

  WebGL1에서는 vertex shader에 128개 그리고 fragment shader에 16개입니다.
  WebGL2에서는 vertex shader에 256개 그리고 fragment shader에 224개입니다.

  참고로 uniform은 "패킹"될 수 있음으로 위 숫자는 사용할 수 있는 `vec4`의 개수인데요.
  이론적으로는 `float` uniform 개수의 4배를 가질 수 있습니다.
  하지만 그것들을 끼워 맞추는 알고리즘이 있는데요.
  위의 최대 uniform vector 각각에 대해 한 행, 4개의 열이 있는 배열로 공간을 상상할 수 있습니다.

     ```
     +-+-+-+-+
     | | | | |   <- vec4 1개
     | | | | |   |
     | | | | |   |
     | | | | |   V
     | | | | |   최대 uniform vector 행
     | | | | |
     | | | | |  
     | | | | |
     ...

     ```
  
  먼저 `vec4`는 `mat4`가 4개의 `vec4`로 할당됩니다.
  다음으로 `vec3`는 공간 왼쪽에 넣습니다.
  그런 다음 `vec2`에 이어 `float`가 따라옵니다.
  그래서 `mat4` 1개, `vec3` 2개, `vec2` 2개, `float` 3개가 있다고 상상해 보면

     ```
     +-+-+-+-+
     |m|m|m|m|   <- mat4는 4개의 행을 가짐
     |m|m|m|m|
     |m|m|m|m|
     |m|m|m|m|
     |3|3|3| |   <- vec3 2개는 행 2개를 가짐
     |3|3|3| |
     |2|2|2|2|   <- vec2 2개는 행 1개로 압축 가능
     |f|f|f| |   <- float 3개는 행 1개에 들어감
     ...

     ```

  게다가 uniform 배열은 항상 수직이므로, 예를 들어 허용되는 uniform vector 최대값이 16개면 요소 17개의 `float` 배열을 가질 수 없고, 실제로 전체 행을 차지하는 하나의 `vec4`가 있는 경우 15개의 행만 남으며, 이는 가질 수 있는 가장 큰 배열이 15개의 요소가 된다는 걸 의미합니다.

  제 조언은 완벽한 패킹을 기대하지 말라는 겁니다.
  비록 명세서에는 위 알고리즘을 통과해야 한다고 나와 있지만 모든 드라이버를 통과하는지 테스트하기엔 조합이 너무 많습니다.
  그냥 한도에 가까워지고 있는지 확인해주세요.

  참고: varying과 attribute는 패킹할 수 없습니다.

* Varying vector 최대값

  WebGL1의 최소값은 8입니다.
  WebGL2는 16입니다.

  그 이상을 사용한다면 최소값만 지원하는 컴퓨터에서 코드가 실패할 겁니다.

* Texture unit 최대값

  여기에는 3가지 값이 있습니다.

  1. Texture unit 개수
  2. Vertex shader가 참조할 수 있는 texture unit 개수
  3. Fragment shader가 참조할 수 있는 texture unit 개수

  <table class="tabular-data">
    <thead>
      <tr><th></th><th>WebGL1</th><th>WebGL2</th></tr>
    </thead>
    <tbody>
      <tr><td>존재하는 texture unit 최소값</td><td>8</td><td>32</td></tr>
      <tr><td>Vertex shader가 참조할 수 있는 texture unit 최소값</td><th style="color: red;">0!</td><td>16</td></tr>
      <tr><td>Fragment shader가 참조할 수 있는 texture unit 최소값</td><td>8</td><td>16</td></tr>
    </tbody>
  </table>

  WebGL1에서 vertex shader에 대한 값이 **0**임을 주의해야 합니다.
  참고로 너무 낙담하지 않아도 괜찮은데요.
  [모든 장치의 약 97%가 최소 4개를 지원](https://webglstats.com/webgl/parameter/MAX_VERTEX_TEXTURE_IMAGE_UNITS)합니다.
  그래도, 앱이 동작하지 않을 수 있다고 사용자에게 알릴 수 있는지 혹은 다른 셰이더로 fallback할 수 있는지 확인하는 게 좋습니다.

다른 제한도 있는데요.
이를 조회하기 위해 다음의 값으로 `gl.getParameter`를 호출합니다.

<div class="webgl_center">
<table class="tabular-data">
  <tbody>
    <tr><td>MAX_TEXTURE_SIZE                </td><td>텍스처 최대 크기</td></tr>
    <tr><td>MAX_VERTEX_ATTRIBS              </td><td>가질 수 있는 attribute 개수</td></tr>
    <tr><td>MAX_VERTEX_UNIFORM_VECTORS      </td><td>vertex shader가 가질 수 있는 vec4 uniform 개수</td></tr>
    <tr><td>MAX_VARYING_VECTORS             </td><td>가지고 있는 varying 개수</td></tr>
    <tr><td>MAX_COMBINED_TEXTURE_IMAGE_UNITS</td><td>존재하는 texture unit 개수</td></tr>
    <tr><td>MAX_VERTEX_TEXTURE_IMAGE_UNITS  </td><td>vertex shader가 참조할 수 있는 texture unit 개수</td></tr>
    <tr><td>MAX_TEXTURE_IMAGE_UNITS         </td><td>fragment shader가 참조할 수 있는 texture unit 개수</td></tr>
    <tr><td>MAX_FRAGMENT_UNIFORM_VECTORS    </td><td>fragment shader가 가질 수 있는 vec4 uniform 개수</td></tr>
    <tr><td>MAX_CUBE_MAP_TEXTURE_SIZE       </td><td>cubemap 최대 크기</td></tr>
    <tr><td>MAX_RENDERBUFFER_SIZE           </td><td>renderbuffer 최대 크기</td></tr>
    <tr><td>MAX_VIEWPORT_DIMS               </td><td>viewport 최대 크기</td></tr>
  </tbody>
</table>
</div>

이건 전체 목록이 아닌데요.
최대 점 크기와 최대 선 두께 등이 있지만 기본적으로 최대 선 두께는 1.0이고 POINTS는 [clipping issue](#points-lines-viewport-scissor-behavior)를 신경쓰지 않아도 되는 간단한 데모에서만 유용하다고 가정해야 합니다.

WebGL2는 몇 가지 더 추가합니다.
몇 가지 일반적인 것들은

<div class="webgl_center">
<table class="tabular-data">
  <tbody>
    <tr><td>MAX_3D_TEXTURE_SIZE                          </td><td>3D 텍스처 최대 크기</td></tr>
    <tr><td>MAX_DRAW_BUFFERS                             </td><td>가질 수 있는 color attachment 개수</td></tr>
    <tr><td>MAX_ARRAY_TEXTURE_LAYERS                     </td><td>2D 텍스처 배열의 최대 레이어</td></tr>
    <tr><td>MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS      </td><td>transform feedback을 사용할 때 별도의 버퍼로 출력할 수 있는 varying 개수</td></tr>
    <tr><td>MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS</td><td>모든 걸 단일 버퍼로 보낼 때 출력할 수 있는 varying 개수</td></tr>
    <tr><td>MAX_COMBINED_UNIFORM_BLOCKS                  </td><td>종합적으로 사용할 수 있는 uniform block 개수</td></tr>
    <tr><td>MAX_VERTEX_UNIFORM_BLOCKS                    </td><td>vertex shader가 사용할 수 있는 uniform block 개수</td></tr>
    <tr><td>MAX_FRAGMENT_UNIFORM_BLOCKS                  </td><td>fragment shader가 사용할 수 있는 uniform block 개수</td></tr>
  </tbody>
</table>
</div>

## Depth Buffer 해상도

정말 오래된 일부 기기들은 16bit depth buffer를 사용합니다.
그렇지 않은, 99%의 기기들은 24bit depth buffer를 사용하므로 걱정하지 않아도 됩니다.

## readPixels format/type 조합

특정 format/type 조합만 작동이 보장됩니다.
다른 조합들은 선택적인데요.
이 내용은 [이 글](webgl-readpixels.html)에서 다룹니다.

## framebuffer attachment 조합

Framebuffer는 texture와 renderbuffer의 attachment를 하나 이상 가질 수 있습니다.

WebGL1에서는 3개의 attachment 조합만 동작이 보장됩니다.

1. 단일 format = `RGBA`, type = `UNSIGNED_BYTE`, texture = `COLOR_ATTACHMENT0`
2. format = `RGBA`, type = `UNSIGNED_BYTE`, texture = `COLOR_ATTACHMENT0` 그리고 format = `DEPTH_COMPONENT`, `DEPTH_ATTACHMENT`로 연결된 renderbuffer
3. format = `RGBA`, type = `UNSIGNED_BYTE`, texture = `COLOR_ATTACHMENT0` 그리고 format = `DEPTH_STENCIL`, `DEPTH_STENCIL_ATTACHMENT`로 연결된 renderbuffer 

다른 모든 조합은 `gl.checkFramebufferStatus`를 호출하여 `FRAMEBUFFER_COMPLETE`를 반환했는지 확인하는 구현에 따라 달라집니다.

WebGL2는 더 많은 format을 쓸 수 있도록 보장하지만 **어떤 조합이 실패할 수 있다**는 한계는 여전한데요.
1개보다 많이 첨부한다면 모든 color attachment가 같은 format일 경우가 가장 안전한 방법일 수 있습니다.

## Extension

WebGL1과 WebGL2의 많은 기능들이 선택적인데요.
`getExtension`라는 API가 갖는 요점은 extension이 존재하지 않으면 실패할 수 있으므로 실패를 확인하고 맹목적으로 성공할 것이라 가정하지 말아야 합니다.

아마 WebGL1과 WebGL2에서 가장 흔하게 누락되는 extension은 floating point texture를 필터링할 수 있는 `OES_texture_float_linear`인데, 이는 `TEXTURE_MIN_FILTER`와 `TEXTURE_MAX_FILTER`를 `NEAREST`를 제외한 모든 항목으로 설정하도록 지원하는 기능을 의미합니다.
많은 모바일 기기들이 이걸 지원하지 않습니다.

WebGL1에서 종종 누락되는 또 다른 extension은 2개 이상의 color attachment를 framebuffer로 첨부할 수 있는 기능인 `WEBGL_draw_buffers`이며 여전히 데스크탑의 경우 70% 정도이고 스마트폰의 경우 거의 없습니다.
기본적으로 WebGL2를 실행할 수 있는 모든 기기는 WebGL1에서 `WEBGL_draw_buffers`도 지원해야 하지만 여전히 문제가 있는데요.
여러 텍스처를 한 번에 렌더링해야 한다면 고사양 GPU로도 시간이 필요할 수 있습니다.
그래도 사용자 기기가 지원하는지 확인하고, 지원하지 않는다면 친절한 설명을 제공해야 합니다.

WebGL1의 경우 다음의 3개의 extension이 거의 보편적으로 지원되는 것처럼 보이므로 사용자에게 이들이 누락되면 페이지가 작동하지 않을 것이라 경고하고 싶을 수 있지만 사용자가 페이지를 제대로 실행하지 못 할만큼 아주 오래된 기기를 가지고 있을 수 있습니다.

`ANGLE_instance_arrays`([instanced drawing](webgl-instanced-drawing.html)에 사용하는 기능), `OES_vertex_array_object`(단일 함수 호출로 모든 상태를 바꿀 수 있도록 모든 [attribute](webgl-attributes.html) 상태를 객체에 저장하는 기능), `OES_element_index_uint`([`drawElements`](webgl-indexed-vertices.html)로 `UNSIGNED_INT` 32bit index를 사용하는 기능)

## attribute location

버그는 attribute location을 찾지 못하는 겁니다.
예를 들어 이런 vertex shader가 있다면

```glsl
attribute vec4 position;
attribute vec2 texcoord;

uniform mat4 matrix;

varying vec2 v_texcoord;

void main() {
   gl_Position = matrix * position;
   v_texcoord = texcoord;
}
```

코드는 `position`이 attribute 0 그리고 `texcoord`는 attribute 1이 될 것이라 가정하지만 이는 보장되지 않습니다.
그래서 여러분은 작동되지만 다른 사람은 실패할 수 있죠.
의도적으로 하지 않았지만 코드의 오류로 인해 location은 일반 통행이고 다른 것들은 아닐 때 작동한다는 점은 종종 버그가 될 수 있습니다.

3가지 해결법이 있습니다.

1. 항상 location을 탐색
2. `gl.linkProgram` 호출 전에 `gl.bindAttribLocation`을 호출하여 location 할당
3. WebGL2 한정, 다음과 같이 셰이더에서 location을 설정

   ```glsl
   #version 300 es
   layout(location = 0) vec4 position;
   latout(location = 1) vec2 texcoord;
   ...
   ```

해결법 2가 가장 [D.R.Y](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)하게 보이지만, 런타임에 텍스처를 생성하지 않는다면 해결법 3이 가장 [W.E.T](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself#DRY_vs_WET_solutions)하게 보입니다.

## GLSL 정의되지 않은 동작

여러 GLSL 함수는 정의되지 않은 동작을 가집니다.
예를 들어 `pow(x, y)`는 `x < 0`일 경우 undefined입니다.
[스포트라이트](webgl-3d-lighting-spot.html)에 대한 글의 하단에 더 긴 목록이 있습니다

## 셰이더 정밀도 문제

2020년 여기서 가장 큰 문제는 셰이더에서 `mediump`나 `lowp`를 사용하면 데스크탑의 GPU는 `highp`를 사용하지만 모바일은 `mediump`나 `lowp`가 되는 것이므로 데스크탑으로 개발할 때는 어떤 문제도 알아차리지 못 할 겁니다.

자세한 내용은 [이 글](webgl-precision-issues.html)을 봐주세요.

## Points, Lines, Viewport, Scissor 동작

WebGL의 `POINTS`와 `LINES`는 최대 크기 1을 가질 수 있고 현재 가장 일반적인 제한인 `LINES`의 경우입니다.
또한 중심이 viewport 외부에 있을 때 point의 clipping 여부는 구현에 정의됩니다.
[이 글의 하단](webgl-drawing-without-data.html#pointissues)을 봐주세요.

마찬가지로, viewport가 정점만 clipping을 하는지 혹은 픽셀도 clipping을 하는지 여부는 정의되지 않았습니다.
Scissor는 항상 pixel clipping을 하므로 scissor 테스트를 켜고, 그리려는 것들과 그리고 있는 LINES나 POINTS보다 viewport를 작게 설정했다면 scissor 크기를 설정하세요.

## 사파리 버그

사파리는 다른 최신 브라우저들보다 많은 WebGL 버그를 가지고 있으며 애플은 이들을 고치는 데 전혀 관심이 없는 걸로 보입니다.

몇 년간 고쳐지지 않은 버그의 일부 목록

* toDataURL(그리고 toBlob)이 premultipledAlpha = false인 경우 거꾸로 결과를 반환하는 [버그](https://bugs.webkit.org/show_bug.cgi?id=156129) (4년 전)

* 현재 iOS에서 preserveDrawingBuffer = true일 때 잘못된 double-buffer [버그](https://bugs.webkit.org/show_bug.cgi?id=159608) (4년 전)

* `OES_texture_float` 구현이 non-ArrayBufferView entry point를 지원해야 하는 [버그](https://bugs.webkit.org/show_bug.cgi?id=51015) (10년 전)

* readPixels가 RGBA/UNSIGNED_BYTE에 대해 INVALID_ENUM를 생성하는 [버그](https://bugs.webkit.org/show_bug.cgi?id=170341) (3년 전)

* WebGL 캔버스와 레이어 변환에 대한 변경 사항이 항상 동기화되지 않는 [버그](https://bugs.webkit.org/show_bug.cgi?id=172969) (3년 전)

* Alpha 채널이 없는 PNG 텍스처가 잘못된 rgb 색상을 가지는 [버그](https://bugs.webkit.org/show_bug.cgi?id=165297) (4년 전)

* 사파리가 일반적인 attribute 없이 쓰는 경우를 처리하지 않는 [버그](https://bugs.webkit.org/show_bug.cgi?id=197592) (1년 전) 

* <a id="safari"></a>
  또한 사파리에는 WebGL2를 활성화하는 옵션이 있지만 `#version 300 es` 셰이더를 허용하는 게 전부입니다.
  다른 80개 이상의 모든 WebGL2 api 함수는 적어도 2020년 7월 기준 구현되어 있지 않습니다.
  [Source](https://trac.webkit.org/browser/webkit/trunk/Source/WebCore/html/canvas/WebGL2RenderingContext.cpp)를 보고 "not implemented"를 검색해보세요.


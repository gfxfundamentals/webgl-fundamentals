Title: WebGL 정밀도 문제
Description: WebGL의 정밀도 문제
TOC: 정밀도 문제


이 글은 WebGL의 다양한 정밀도 문제에 관한 겁니다.

## `lowp`, `mediump`, `highp`

이 사이트의 [첫 번째 글](webgl-fundamentals.html)에서 우린 vertex shader와 fragment shader를 만들었습니다.
Fragment shader를 만들 때 지나가는 말로 fragment shader는 기본 정밀도를 가지지 않으므로 한 줄을 추가해서 설정해야 한다고 언급했었는데

```glsl
precision mediump float;
```

도대체 무슨 소리일까요?

`lowp`, `mediump`, `highp`는 정밀도 설정입니다.
이 경우 정밀도는 값을 저장하는데 얼마나 많은 bit가 사용되는지를 의미하는데요.
javascript에서 숫자의 경우 64bit를 사용합니다.
WebGL에서 대부분의 숫자는 32bit에 불과한데요.
더 적은 bit = 더 빠름, 더 많은 bit = 더 정확하고 더 넓은 범위입니다.

이걸 잘 설명할 수 있을지 모르겠습니다.
정밀도 문제의 다른 예시로 [double vs float](https://www.google.com/search?q=double+vs+float)를 찾아볼 수도 있지만 이를 설명하는 한 가지 방법은 byte와 short 또는 javascript의 `Uint8Array` vs `Uint16Array`의 차이와 같다는 겁니다.

* `Uint8Array`는 unsigned 8bit integer 배열입니다. 8bit는 0에서 255까지 2<sup>8</sup>개의 값을 포함할 수 있습니다.
* `Uint16Array`는 unsigned 16bit integer 배열입니다. 16bit는 0에서 65535까지 2<sup>16</sup>개의 값을 포함할 수 있습니다.
* `Uint32Array`는 unsigned 32bit integer 배열입니다. 32bit는 0에서 4294967295까지 2<sup>32</sup>개의 값을 포함할 수 있습니다.

`lowp`, `mediump`, `highp`도 비슷합니다.

* `lowp`는 최소 9bit 값입니다. 부동 소수점 값의 범위: -2 ~ +2, 정수 값의 경우 `Uint8Array`나 `Int8Array`와 유사
* `mediump`는 최소 16bit 값입니다. 부동 소수점 값의 범위: -2<sup>14</sup> ~ +2<sup>14</sup>, 정수 값의 경우 `Uint16Array`나 `Int16Array`와 유사
* `highp`는 최소 16bit 값입니다. 부동 소수점 값의 범위: -2<sup>62</sup> ~ +2<sup>62</sup>, 정수 값의 경우 `Uint32Array`나 `Int32Array`와 유사

범위 내의 모든 값을 표현할 수 있는 것은 아니라는 점에 유의해야 합니다.
아마 가장 이해하기 쉬운 건 `lowp`일 겁니다.
9bit 밖에 없으므로 512개의 고유 값만을 표현할 수 있습니다.
위에서 범위가 -2에서 +2라고 말했는데 -2와 +2사이에는 무한한 숫자 값들이 있는데요.
예를 들어 1.9999999와 1.999998는 -2와 +2사이에 있는 2개의 값이죠.
9bit만으로 `lowp`는 이 두 값을 표현할 수 없습니다.
그래서 예를 들어, 색상에 대한 계산을 위해 `lowp`를 사용한다면 밴딩이 나타날 수 있는데요.
실제로 어떤 값이 표현될 수 있는지 알아보지 않아도, 색상이 0에서 1사이인 걸 알고 있습니다.
`lowp`가 -2에서 +2고 512개의 고유값만 표현할 수 있다면 128개의 값만이 0에서 1사이에 맞는 것 같습니다.
또한 4/128을 가지고 있고 1/512를 더하려고 한다면, 1/512는 `lowp`로 표현될 수 없기 때문에 사실상 0이므로 아무일도 일어나지 않을 겁니다.

이상적으로는 모든 곳에 `highp`를 사용해 이 문제를 그냥 무시할 수도 있지만 안타깝게도 현실적이지 않습니다.
2가지 문제가 있는데요.

1. 대부분의 구형 또는 저렴한 스마트폰같은 일부 기기들은 fragment shader에서 `highp`를 지원하지 않습니다.

   이 문제는 fragment shader에서 `highp`를 사용하도록 선언하고 사용자가 `highp`를 지원하지 않는 기기에서 페이지를 로드하면 셰이더는 컴파일에 실패할 겁니다.

   반대로 어디에서나 사용할 수 있는 `mediump`는 [점 조명](webgl-3d-lighting-point.html)같은 일반적인 것에 대해 충분히 해상도가 높지 않습니다.

2. 실제로 `lowp`에 9bit를 쓰고 `mediump`애 16bit를 쓰는 장치에서는 보통 `highp`보다 빠릅니다. 훨씬 빠른 경우가 더 많습니다.

마지막으로, `Uint8Array`나 `Uint16Array`와 같은 값과 달리, `lowp` 또는 `mediump` 값이나 심지어 `highp` 값도 더 높은 정밀도(더 많은 bit)를 사용할 수 있습니다.
예를 들어 데스크탑 GPU에서 셰이더에 `mediump`를 넣었다면 아직 내부적으로 32bit를 사용할 가능성이 높은데요.
이건 셰이더를 테스트하기 여럽게 만드는 문제를 야기합니다.
실제로 셰이더가 `lowp`나 `mediump`와 함께 올바르게 작동하는지 보기 위해서는 실제로 `lowp`에 8bit를 쓰고 `highp`에 16bit를 쓰는 기기에서 테스트해야 합니다.

그래서 어떻게 해야 할까요?

음 하나는 그냥 `highp`를 사용하고 이에 대해 걱정하지 않을 수 있습니다.
`highp`를 지원하지 않는 기기를 가진 사용자는 아마 페이지를 잘 실행시킬 수 없는 오래되고 느린 기기를 가져서 목표 고객이 아닐 수 있습니다.

또 다른 쉬운 방법은 `highp`를 기본값으로 하되 기기에서 `highp`를 지원하지 않는 경우 `mediump`로 fallback하는 겁니다.
Fragment shader에서 `GL_FRAGMENT_PRECISION_HIGH` 전처리 매크로를 사용하면 됩니다.

```glsl
// fragment shader 일부
#ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
#else
  precision mediump float;
#endif

...
```

이제 셰이더의 내용에 따라 이상한 렌더링 아티팩트가 발생할 수 있지만 기기에서 `highp`를 지원하지 않아도 셰이더를 컴파일할 겁니다.

다른 옵션은 `mediump`만 필요하도록 필요하도록 fragment shader를 작성해볼 수 있습니다.
실제로 성공했는지 확인하려면 실제 `mediump`를 지원하는 기기에서 테스트해야 합니다.

또 다른 옵션은 기기가 `mediump`만 지원하는 경우 다른 셰이더를 사용하는 겁니다.
위에서 점 조명은 `mediump`로 문제될 수 있다고 언급했었는데요.
이는 [점 조명](webgl-3d-lighting-point.html), 특히 반사 하이라이트 계산이, world 혹은 view space의 값을 fragment shader로 전달하고, 이 값들이 `mediump` 값의 범위를 쉽게 벗어날 수 있기 때문입니다.
따라서, `mediump` 장치에서는 반사 하이라이트를 생략할 수도 있습니다.
예를 들어 [점 조명에 대한 글](webgl-3d-lighting-point.html)에 있는 점 조명 셰이더는 기기에서 `mediump`만 지원하는 경우 하이라이트를 제거하도록 수정되었습니다.

```glsl
#ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
#else
  precision mediump float;
#endif

// Vertex shader에서 전달
varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;

uniform vec4 u_color;
uniform float u_shininess;

void main() {
  // v_normal이 varying이기 때문에 보간되며 단위 벡터가 아닙니다.
  // 정규화하면 다시 단위 벡터가 됩니다.
  vec3 normal = normalize(v_normal);

  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
  float light = dot(normal, surfaceToLightDirection);

  gl_FragColor = u_color;

  // 색상 일부(alpha 제외)에 조명 곱하기
  gl_FragColor.rgb *= light;

#ifdef GL_FRAGMENT_PRECISION_HIGH
  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
  vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);

  float specular = 0.0;
  if (light > 0.0) {
    specular = pow(dot(normal, halfVector), u_shininess);
  }

  // 반사광 추가
  gl_FragColor.rgb += specular;
#endif
}
```

참고: 이것만으로는 충분하지 않습니다.
Vertex shader에는

```glsl
  // 조명에 대한 표면의 벡터를 계산하고 fragment shader로 전달
  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
```

조명이 표면에서 1000단위 떨어져 있다고 해봅시다.
그런 다음 fragment shader와 이 줄에 도달하는데

```glsl
  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
```

충분히 문제없어 보입니다.
해당 방법을 제외하고 벡터를 정규화하는 일반적인 방법은 길이로 나누는 건데

```
  float length = sqrt(v.x * v.x + v.y * v.y * v.z * v.z);
```

x, y, z 중 하나라도 1000이면 1000*1000은 1000000인데요.
1000000은 `mediump`의 범위를 벗어납니다.

한 가지 해결법은 vertex shader에서 정규화하는 겁니다.

```
  // 조명에 대한 표면의 벡터를 계산하고 fragment shader에 전달
#ifdef GL_FRAGMENT_PRECISION_HIGH
  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
#else
  v_surfaceToLight = normalize(u_lightWorldPosition - surfaceWorldPosition);
#endif
```

이제 `v_surfaceToLight`에 할당된 값들은 `mediump`의 범위인 -1과 +1사이입니다.

참고로 vertex shader에서의 정규화는 실제로 동일한 결과를 제공하지 않지만 나란히 비교하지 않는 한 아무도 눈치채지 못할 정도로 충분히 만족할만 합니다.

`normalize`, `length`, `distance`, `dot`과 같은 함수들은 모두 값이 너무 크면 `mediump`의 범위를 벗어나는 문제가 있습니다.

위의 대부분은 `highp`를 지원하지 않는 기기에서 앱이 작동하는지 확인하는 겁니다.

이런 기능들에 관심을 갖는 또 다른 이유는 속도입니다.
비교적 최신의 스마트폰 대부분에서 `highp`를 사용할 수 있지만, `mediump`는 더 빠르게 실행됩니다.
다시 말하지만, 이건 더 낮은 정밀도인 `mediump`를 실제로 지원하는 기기에만 해당됩니다.
대부분의 데스크탑이 하듯이 `mediump`에 대해 `highp`로 같은 정밀도를 사용하기로 선택했다면 속도에는 차이가 없지만, 앱이 모바일에서 왜 느릴까 고민하고 다른 사항들을 배제한 경우 `highp`를 지원하는 기기에서도 `mediump`를 사용해볼 수 있습니다.
사실 위 모든 사항들 없이도 `mediump`를 사용하도록 셰이더를 설정하고 모바일에서 더 빠르게 실행되는지 확인해볼 수 있습니다.
그렇게 한다면 어떤 렌더링 문제가 해결될 수 있습니다.
그렇게 하지 않는다면 아마 신경 쓸 이유가 없을 겁니다.

## `highp` 및 `mediump` 정밀도 지원 감지

이건 비교적 쉬울 것 같네요.
`gl.getShaderPrecisionFormat`을 호출하여, shader type인 `VERTEX_SHADER`나 `FRAGMENT_SHADER`를 전달하고, `LOW_FLOAT`, `MEDIUM_FLOAT`, `HIGH_FLOAT`, `LOW_INT`, `MEDIUM_INT`, `HIGH_INT` 중 하나를 전달하면, [정밀도 정보를 반환](../webgl-precision-lowp-mediump-highp.html)합니다.

불행히도 사파리는 여기에 버그가 있어, 최소한 2020년 4월 기준 이 방법은 아이폰에서 실패할 겁니다.

그래서 모든 장치에서 `highp`를 지원하는 지원하는지 확인하기 위해, `highp`를 사용하는 fragment shader를 만들어, 컴파일하고, 연결하고, 에러를 확인하면 됩니다.
실패한다면 `highp`가 지원되지 않는 겁니다.
참고로 vertex shader와 연결해야 합니다.
명세서에는 연결 시간에 에러가 발견되는 한 에러를 반환하기 위해 컴파일할 필요가 없으므로, 셰이더를 컴파일하고 `COMPILE_STATUS`를 확인하는 것만으로는 컴파일이 실제로 성공했는지 혹은 실패했는지 알 수 없습니다.
연결하고 `LINK_STATUS`를 확인해야 합니다.

`mediump`이 정말로 고정밀도가 아니라 중간 정밀도인지 확인하기 위해서는 렌더 테스트를 해야 합니다.
기본적으로 `mediump`를 사용하는 셰이더를 만들고 `highp`에서는 작동하지만 `mediump`에서는 실패하는 몇 가지 계산을 한 뒤 결과를 확인하면 되는데요.
결과가 정확하다면 driver/gpu/device가 `mediump`에 `highp`를 사용하는 겁니다.
결과가 부정확하다면 `mediump`는 `mediump`인 겁니다.

다음은 fragment shader의 `mediump`이 실제로 `mediump`인지 확인하는 예제이고

{{{example url="../webgl-precision-check-fragment-shader.html"}}}

다음은 vertex shader의 `mediump`이 실제로 `mediump`인지 확인하는 예제인데

{{{example url="../webgl-precision-check-vertex-shader.html"}}}

사실 `lowp`가 9bit이고, `mediump`가 16bit이며, `highp`가 32bit라는 보장은 없습니다.
각각의 최소값이 될 수 있다는 게 명세서가 말하는 전부입니다.
예를 들어 `lowp`가 10bit여도 명세(10 >= 9)를 충족하고 `mediump`보다 빠르며 여전히 소수점이 있습니다.
그렇긴 하지만, 제가 아는 한 `lowp`를 지원하는 기기는 9bit를 사용하고 `mediump`를 지원하는 기기는 16bit를 사용합니다.

2014년 아이폰6+는 `mediump`에 대해 16bit를 사용하지만 `lowp`에도 16bit를 사용합니다.
`lowp`에 대해 9bit를 사용하는 기기를 사용한 적이 있는지 없어서 어떤 문제가 발생하는지 확실하지 않습니다. 

이 글을 통해서 우리는 fragment shader의 기본 정밀도를 지정했습니다.
또한 어떤 개별 변수의 정밀도라도 지정할 수 있는데요.
예를 들어

```glsl
uniform mediump vec4 color;  // uniform
attribute lowp vec4 normal;  // attribute
varying lowp vec4 texcoord;  // varying
lowp float foo;              // variable
```

## 캔버스 정밀도 문제

명세서에는 캔버스가 32bit 대신 16bit가 될 수 있습니다.

아래처럼 호출하여 확인할 수 있는데

```
const bitsInCanvas =
    gl.getParameter(gl.RED_BITS) +
    gl.getParameter(gl.GREEN_BITS) +
    gl.getParameter(gl.BLUE_BITS) +
    gl.getParameter(gl.ALPHA_BITS);
```

이건 실제로 현재 바인딩된 framebuffer color attachment나, framebuffer가 첨부되지 않았다면 캔버스에서, 채널의 bit depth를 반환합니다.

{{{example url="../webgl-precision-check-canvas-bits.html"}}}

참고: 2020년에 어떤 기기 어떤 브라우저에서 실제로 16bit 캔버스를 사용하는지 알 수 없습니다.
2011년 WebGL이 출시되었을 때 파이어폭스가 모바일 기기에서 속도를 높이기 위해 16bit 캔버스를 실험했던 걸로 알고 있습니다.
이는 일반적으로 이미지 이외의 항목에 대해 캔버스에서 픽셀을 읽는 경우를 제외하고는 무시할 수 있습니다. 
또한, 캔버스가 16bit라고 하더라도 32bit 렌더 대상([framebuffer에 첨부된 텍스처](webgl-render-to-texture.html))을 만들 수 있습니다.

## Texture Format

텍스처는 명세서에서 실제 사용된 정밀도는 요청된 정밀도보다 더 클 수 있다고 말하는 또 다른 것입니다.

예를 들어 다음과 같이 채널당 4bit씩, 16bit 텍스처를 요청할 수 있는데 

```
gl.texImage2D(
  gl.TEXTURE_2D,               // 대상
  0,                           // mip 레벨
  gl.RGBA,                     // 내부 format
  width,                       // 너비
  height,                      // 높이
  0,                           // border
  gl.RGBA,                     // format
  gl.UNSIGNED_SHORT_4_4_4_4,   // type
  null,
);
```

하지만 구현은 실제로 더 높은 해상도를 내부적으로 사용할 수 있습니다.
대부분의 데스크탑이 이걸 수행하고 대부분의 모바일 GPU는 하지 않는다고 알고 있습니다.

테스트할 수 있는데요.
먼저 위처럼 채널당 4bit인 텍스처를 요청할 겁니다.
그런 다음 0대 1의 gradient로 [렌더링](webgl-render-to-texture.html)할 겁니다.

다음으로 해당 텍스처를 캔버스에 렌더링할 건데요.
텍스처가 내부적으로 채널당 4bit라면 그려진 그래디언트에 16단계의 색상만 있을 겁니다.
텍스처가 실제로 채널당 8bit라면 256단계의 색상을 보게 될 겁니다.

{{{example url="../webgl-precision-textures.html"}}}

제 스마트폰에서 실행하면 텍스처가 채널당 4bit를 사용(또는 다른 채널은 테스트하지 않았으므로 빨간색 한정 4bit)하고 있음을 알 수 있습니다.

<div class="webgl_center"><img src="resources/mobile-4-4-4-4-texture-no-dither.png" style="image-rendering: pixelated; width: 600px;"></div>

반면에 데스크탑에서는 4개만 요청했지만 실제로는 채널당 8bit를 사용하는 걸 볼 수 있습니다.

<div class="webgl_center"><img src="resources/desktop-4-4-4-4-texture-no-dither.png" style="image-rendering: pixelated; width: 600px;"></div>

한 가지 주목할 점은 기본적으로 WebGL은 결과를 디더링하여 이와 같은 그라데이션을 더 부드럽게 만들 수 있다는 겁니다.
다음과 같이 디더링을 끌 수 있으며

```js
gl.disable(gl.DITHER);
```

디더링을 끄지 않는다면 스마트폰에서는 이런 게 나타납니다.

<div class="webgl_center"><img src="resources/mobile-4-4-4-4-texture-dither.png" style="image-rendering: pixelated; width: 600px;"></div>

당장 생각나는 이게 실제로 일어나는 유일한 방법은 렌더링 대상으로 더 낮은 bit 해상도 format texture를 사용하고 실제로 텍스처가 그렇게 낮은 해상도의 장치에서 테스트하지 않았을 경우입니다.
데스크탑에서만 테스트했다면 이를 야기하는 문제가 발생하지 않을 수 있습니다.


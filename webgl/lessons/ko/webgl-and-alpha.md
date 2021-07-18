Title: WebGL Alpha
Description: WebGL alpha가 OpenGL alpha와 다른 점
TOC: WebGL Alpha


WebGL이 backbuffer(ie, 캔버스)에서 alpha를 처리하는 방법에 문제를 겪는 일부 OpenGL 개발자들을 발견해서, alpha와 관련하여 WebGL과 OpenGL의 차이점을 살펴보는 것도 좋을 것이라 생각했습니다.

OpenGL과 WebGL의 가장 큰 차이점으로 OpenGL은 어떤 것과도 합성되지 않거나, 실제로 OS 윈도우 매니저에 의해 어떤 것도 합성되지 않은, backbuffer에 렌더링하므로 alpha가 무언인지는 중요하지 않습니다.

WebGL은 브라우저에 의해 웹 페이지와 합성되고 기본값으로 투명도가 있는 .png `<img>` 태그와 2D 캔버스 태그와 동일한 pre-multiplied alpha를 사용합니다.

WebGL은 이걸 좀 더 OpenGL처럼 만들기 위한 여러 방법을 가지고 있습니다.

### #1) WebGL에 non-premultiplied alpha와 합성을 원한다고 알림

    gl = canvas.getContext("webgl", {
      premultipliedAlpha: false  // non-premultiplied alpha 요청
    });

기본값은 true입니다.

물론 결과는 캔버스 아래에 있는 배경색(캔버스의 배경색, 캔버스 컨테이너의 배경색, 페이지의 배경색, 캔버스가 z-index > 0일 경우 캔버스 뒤에 있는 항목, 등등...)으로 페이지 위에 합성되는데, 말인즉슨 색상 CSS가 웹 페이지의 해당 영역을 정의합니다.

Alpha 문제가 있는지 찾는 정말 좋은 방법은 캔버스의 배경을 빨강같은 밝은 색상으로 설정하는 겁니다.
무슨 일이 일어나고 있는지 바로 보실 수 있습니다.

    <canvas style="background: red;"><canvas>

또한 alpha 문제를 숨겨주는 검은색으로 설정할 수도 있습니다.

### #2) WebGL에 backbuffer에서 alpha를 원하지 않는다고 알림

    gl = canvas.getContext("webgl", { alpha: false }};

Backbuffer는 RGB만 있기 때문에 이는 좀 더 OpenGL처럼 작동하게 만들어 줍니다.
좋은 브라우저는 alpha가 없다는 것을 알 수 있고 WebGL이 합성하는 방식을 최적화할 수 있기 때문에 아마 이게 최고의 선택일 겁니다.
물론 이는 실제로 backbuffer에 alpha가 없다는 걸 의미하므로 어떤 목적으로 backbuffer에서 alpha를 사용하고 있다면 동작하지 않을 수 있습니다.
제가 아는 소수의 앱만이 backbuffer에서 alpha를 사용합니다.
주장하건대 저는 이게 기본값이었어야 한다고 생각합니다.

### #3) 렌더링의 마지막에 alpha 지우기

    ..
    renderScene();
    ..
    // Backbuffer의 alpha를 1.0으로 설정
    gl.clearColor(1, 1, 1, 1);
    gl.colorMask(false, false, false, true);
    gl.clear(gl.COLOR_BUFFER_BIT);

지우기는 일반적으로 매우 빠르지만 대부분의 하드웨어에는 특별한 경우가 있습니다.
대부분의 데모에서 이를 수행했습니다.
제가 똑똑했다면 위의 #2 방법으로 바꿨을 겁니다.
이 글을 올린 후에 바로 작업할 것 같습니다.
대부분의 WebGL 라이브러리는 이 방법을 기본값으로 해야할 것처럼 보입니다.
실제로 합성 효과에 alpha를 사용하는 소수의 개발들은 이를 요청할 수 있습니다.
나머지는 최고의 성능과 최소한의 놀라움을 얻을 겁니다.

### #4) Alpha를 한 번 지우고 더 이상 렌더링하지 않기

    // 초기화할 때, backbuffer 지우기
    gl.clearColor(1,1,1,1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // alpha 렌더링 끄기
    gl.colorMask(true, true, true, false);

물론 자신만의 framebuffer로 렌더링한다면 alpha 렌더링을 다시 켰다가 캔버스 렌더링으로 전환할 때 다시 꺼야할 수 있습니다.

### #5) 이미지 처리

Alpha가 있는 이미지를 WebGL로 로딩하는 경우 저의 기본값입니다.
WebGL은 미리 곱하지 않은 색상 값인 PNG 파일 그대로의 값을 제공할 겁니다.
pre-multiplied는 손실인 반면 이건 무손실이기 때문에 일반적으로 OpenGL 프로그램에 사용됩니다.

    1, 0.5, 0.5, 0  // RGBA

`r`, `g`, `b`가 0이 되는 걸 의미하는 `a = 0`이기 때문에 un-premultiplied는 가능한 값인 반면 pre-multiplied는 불가능한 값입니다.

원한다면 WebGL이 alpha를 미리 곱하도록 할 수 있습니다.
이렇게 `UNPACK_PREMULTIPLY_ALPHA_WEBGL`를 true로 설정하여 이를 수행하는데

    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

기본값은 un-premultiplied 입니다.

대부분의 Canvas 2D 구현은 pre-multiplied alpha로 작동한다는 점에 유의하세요.
이는 WebGL로 전송하고 `UNPACK_PREMULTIPLY_ALPHA_WEBGL`이 false일 때 WebGL이 다시 un-premultipiled로 전환할 것임을 의미합니다.

### #6) pre-multiplied alpha와 함께 작동하는 blending equation 사용

제가 작성하거나 작업한 거의 모든 OpenGL 앱들이 사용 중인데

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

non-premultiplied alpha texture에서 작동합니다.

실제로 pre-multiplied alpha texture로 작업하려면

    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

이게 제가 알고 있는 방법입니다.
더 많은 걸 알고 있다면 아래에 알려주세요.


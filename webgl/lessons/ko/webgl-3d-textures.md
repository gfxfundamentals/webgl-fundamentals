Title: WebGL 텍스처
Description: WebGL에서 텍스처가 작동하는 방법
TOC: 텍스처


이 포스트는 WebGL 관련 시리즈에서 이어집니다.
첫 번째는 [기초](webgl-fundamentals.html)로 시작했고, 이전에는 [애니메이션](webgl-animation.html)에 관한 것이었습니다.

WebGL에서 어떻게 텍스처를 적용할까요?
[이미지 처리](webgl-image-processing.html)에 대한 글을 읽으면 방법을 알 수 있지만 자세히 살펴보면 이해하기 더 쉬울 겁니다.

먼저 해야할 일은 셰이더와 텍스처 조정입니다.
다음은 vertex shader의 변경 사항인데요.
텍스처 좌표를 전달해야 합니다.
이 경우 fragment shader로 바로 전달하게 됩니다.

    attribute vec4 a_position;
    *attribute vec2 a_texcoord;

    uniform mat4 u_matrix;

    *varying vec2 v_texcoord;

    void main() {
      // 위치를 행렬로 곱하기
      gl_Position = u_matrix * a_position;

    *  // texcoord를 fragment shader로 전달
    *  v_texcoord = a_texcoord;
    }

Fragment shader에서 텍스처를 참조하게 해주는 uniform sampler2D를 선언합니다.
그리고 vertex shader에서 전달된 텍스처 좌표를 사용하고 해당 텍스처에서 색상을 찾기 위해 `texture2D`를 호출합니다.

    precision mediump float;

    // Vertex shader에서 전달
    *varying vec2 v_texcoord;

    *// 텍스처
    *uniform sampler2D u_texture;

    void main() {
    *   gl_FragColor = texture2D(u_texture, v_texcoord);
    }

텍스처 좌표를 설정해야 합니다.

    // 정점 데이터가 어디로 가야하는지 탐색
    var positionLocation = gl.getAttribLocation(program, "a_position");
    *var texcoordLocation = gl.getAttribLocation(program, "a_texcoords");

    ...

    *// Texcoord에 대한 버퍼 생성
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    *gl.enableVertexAttribArray(texcoordLocation);
    *
    *// Texcoord는 float로 제공
    *gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);
    *
    *// Texcoord 설정
    *setTexcoords(gl);

그리고 전체 텍스처를 'F'의 각 사각형에 매핑하여 사용하는 좌표를 볼 수 있습니다.

    *// F에 대한 텍스처 좌표로 버퍼 채우기
    *function setTexcoords(gl) {
    *  gl.bufferData(
    *      gl.ARRAY_BUFFER,
    *      new Float32Array([
    *        // 왼쪽 열 앞면
    *        0, 0,
    *        0, 1,
    *        1, 0,
    *        0, 1,
    *        1, 1,
    *        1, 0,
    *
    *        // 상단 획 앞면
    *        0, 0,
    *        0, 1,
    *        1, 0,
    *        0, 1,
    *        1, 1,
    *        1, 0,
    *        ...
    *       ]),
    *       gl.STATIC_DRAW);

텍스처도 필요합니다.
처음부터 만들 수도 있지만 이번에는 가장 일반적인 방법인 이미지를 로드해보겠습니다.

다음은 우리가 사용할 이미지입니다.

<img class="webgl_center" src="../resources/f-texture.png" />

실제로 'F' 이미지는 방향이 명확하기 때문에 텍스처로 사용했을 때 돌리거나 뒤집었는지 쉽게 알 수 있습니다.

이미지를 로드하는 것은 비동기적으로 발생합니다.
우리는 로드된 이미지를 요청하지만 브라우저가 다운로드하는데 시간이 걸리는데요.
일반적으로 이에 대한 2가지 해결책이 있습니다.
텍스처가 다운로드될 때까지 기다리는 코드를 만들고 다운로드 후 그리기 시작할 수 있습니다.
다른 해결책은 이미지가 다운로드될 때까지 사용할 텍스처를 만드는 겁니다.
해당 방법을 사용하면 우리는 바로 렌더링을 시작할 수 있습니다.
그런 다음 이미지가 다운로드되면 이미지를 텍스처에 복사하는거죠.
아래에서 이 방법을 사용합니다.

    *// 텍스처 생성
    *var texture = gl.createTexture();
    *gl.bindTexture(gl.TEXTURE_2D, texture);
    *
    *// 1x1 파란색 픽셀로 텍스처 채우기
    *gl.texImage2D(
    *  gl.TEXTURE_2D,
    *  0,
    *  gl.RGBA,
    *  1,
    *  1,
    *  0,
    *  gl.RGBA,
    *  gl.UNSIGNED_BYTE,
    *  new Uint8Array([0, 0, 255, 255])
    *);
    *
    *// 비동기적으로 이미지 로드
    *var image = new Image();
    *image.src = "resources/f-texture.png";
    *image.addEventListener('load', function() {
    *  // 이제 이미지가 로드되었기 때문에 텍스처로 복사
    *  gl.bindTexture(gl.TEXTURE_2D, texture);
    *  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
    *  gl.generateMipmap(gl.TEXTURE_2D);
    *});

그리고 결과입니다.

{{{example url="../webgl-3d-textures.html" }}}

'F'의 앞쪽 텍스처 부분만 사용하려면 어떻게 해야 할까요?
텍스처는 "텍스처 좌표"로 참조되고, 텍스처 좌표는 텍스처를 가로질러 왼쪽에서 오른쪽으로 0.0부터 1.0이며, 0.0부터 1.0은 첫 줄의 첫 번째 픽셀부터 마지막 줄의 마지막 픽셀까지 입니다.
위쪽과 아래쪽이 아니라 처음과 마지막이라고 표현했는데요.
무언가를 그리고 방향을 정하기 전까지는 방향이 없기 때문에 texture space에서 위아래는 의미가 없습니다.
중요한 것은 WebGL에 텍스처 데이터를 제공하는 겁니다.
해당 데이터의 시작은 텍스처 좌표 0,0이고 데이터의 마지막은 1,1입니다.

<img class="webgl_center noinvertdark" width="405" src="resources/texture-coordinates-diagram.svg" />

텍스처를 포토샵에 로드하고 다양한 좌표를 픽셀 단위로 찾아봤습니다.

<img class="webgl_center" width="256" height="256" src="../resources/f-texture-pixel-coords.png" />

픽셀 좌표에서 텍스처 좌표로 변환하기 위해 다음과 같이 할 수 있습니다.

    texcoordX = pixelCoordX / (width  - 1)
    texcoordY = pixelCoordY / (height - 1)

여기 앞면의 텍스처 좌표들입니다.

    // 왼쪽 열 앞면
     38 / 255,  44 / 255,
     38 / 255, 223 / 255,
    113 / 255,  44 / 255,
     38 / 255, 223 / 255,
    113 / 255, 223 / 255,
    113 / 255,  44 / 255,

    // 상단 획 앞면
    113 / 255, 44 / 255,
    113 / 255, 85 / 255,
    218 / 255, 44 / 255,
    113 / 255, 85 / 255,
    218 / 255, 85 / 255,
    218 / 255, 44 / 255,

    // 중간 획 앞면
    113 / 255, 112 / 255,
    113 / 255, 151 / 255,
    203 / 255, 112 / 255,
    113 / 255, 151 / 255,
    203 / 255, 151 / 255,
    203 / 255, 112 / 255,

뒷면에도 비슷한 텍스처 좌표를 사용했습니다.
그리고 여기 결과입니다.

{{{example url="../webgl-3d-textures-texture-coords-mapped.html" }}}

흥미로운 화면은 아니지만 텍스처 좌표를 사용하는 보여주었기를 바랍니다.
코드로 geometry(cube, sphere, etc)를 만드는 경우 일반적으로 원하는 텍스처 좌표를 계산하기 굉장히 쉽습니다.
반면에 Blender, Maya, 3D Studio Max같은 3D 모델링 소프트웨어에서 3D 모델을 가져온다면, 아티스트(혹은 여러분)가 해당 패키지에서 텍스처 좌표를 조정할 겁니다.

0.0에서 1.0의 범위 밖의 텍스처 좌표를 사용하면 어떻게 될까요?
기본적으로 WebGL은 텍스처를 반복합니다.
0.0에서 1.0은 하나의 텍스처 '사본'입니다.
1.0에서 2.0은 또 다른 사본입니다.
심지어 -4.0에서 -3.0도 또 다른 사본입니다.
이러한 텍스처 좌표를 사용하여 평면을 표시해봅시다.

     -3, -1,
      2, -1,
     -3,  4,
     -3,  4,
      2, -1,
      2,  4,

그리고 여기 결과입니다.

{{{example url="../webgl-3d-textures-repeat-clamp.html" }}}

`CLAMP_TO_EDGE`를 사용하여 텍스처를 특정 방향으로 반복하지 않도록 WebGL에 지시할 수 있습니다.

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

위 샘플에 있는 버튼을 클릭하여 차이점을 확인해보세요.

텍스처가 로드되었을 때 `gl.generateMipmap`를 다시 호출한다는 것을 눈치채셨을 겁니다.
무엇을 위한 걸까요?

이런 16x16 픽셀 텍스처가 있다고 상상해보세요.

<img class="webgl_center" src="resources/mip-low-res-enlarged.png" style="border: 2px solid black;" />

이제 화면에 2x2 픽셀 크기의 폴리곤에 해당 텍스처를 그리려 한다고 상상해보세요.
4개의 픽셀은 어떤 색상으로 만들어야 할까요?
선택할 수 있는 색상에는 256픽셀이 있습니다.
포토샵에서 16x16 픽셀 이미지를 2x2로 크기를 조정하면, 2x2 이미지의 4개의 픽셀을 만들기 위해 각 모서리의 8x8 픽셀을 평균화할 겁니다.
안타깝게도 64개의 픽셀을 읽어서 모두 평균화하는 것은 GPU에 너무 느린 방법입니다.
실제로 2048x2048 픽셀 텍스처가 있고 이를 2x2 픽셀로 그리려 한다고 가정해봅시다.
포토샵이 2x2의 4개의 픽셀 각각에 대해 수행하려면 1024x1024 픽셀 혹은 백만 픽셀의 4배를 평균화해야 합니다.
여전히 빠르긴 하지만 할 일이 굉장히 많습니다.

그래서 GPU는 mipmap을 사용합니다.
mipmap은 점진적으로 작아지는 이미지의 모음으로, 각각은 이전 이미지 크기의 1/4입니다.
위의 16x16 텍스처에 대한 mipmap은 다음과 같습니다.

<img class="webgl_center noinvertdark nobg" src="resources/mipmap-low-res-enlarged.png" />

일반적으로 더 작은 각 레벨은 이전 레벨의 bilinear interpolation이며 이게 `gl.generateMipmap`이 하는 일입니다.
가장 큰 레벨을 보고 더 작은 모든 레벨을 생성합니다.
물론 원한다면 더 작은 레벨들을 직접 제공할 수 있습니다.

이제 화면에 16x16 픽셀 텍스처를 2x2 픽셀만 그리려고 하면 WebGL은 이전 mip에서 이미 평균화된 2x2 mip을 선택할 수 있습니다.

각 텍스처에 대한 텍스처 필터링을 설정하여 WebGL이 어떤 작업을 수행할지 선택할 수 있는데요.
총 6가지 모드가 있습니다.

*   `NEAREST` = 가장 큰 mip에서 1픽셀 선택
*   `LINEAR` = 가장 큰 mip에서 4픽셀 선택 및 블렌딩
*   `NEAREST_MIPMAP_NEAREST` = 최상의 mip을 선택하고, mip에서 픽셀 1개를 선택
*   `LINEAR_MIPMAP_NEAREST` = 최상의 mip을 선택하고, mip에서 픽셀 4개를 블렌딩
*   `NEAREST_MIPMAP_LINEAR` = 최상의 mip 2개를 선택하고, 각각 픽셀 1개를 선택한 다음 블렌딩
*   `LINEAR_MIPMAP_LINEAR` = 최상의 mip 2개를 선택하고, 각각 픽셀 4개를 선택한 다음 블렌딩

이 2가지 예제를 통해 mip의 중요성을 확인할 수 있습니다.
첫 번째로 `NEAREST`나 `LINEAR`를 사용하여 제일 큰 이미지에서만 선택하면, 움직일 때마다 각각의 픽셀에 대해 해당 이미지에서 하나의 픽셀을 선택해야 하기 때문에 많이 깜박입니다.
이것은 크기와 위치에 따라 달라지는데, 이전에 한 픽셀을 선택하고 다음에는 다른 픽셀을 선택하기 때문에 깜박이게 됩니다.

{{{example url="../webgl-3d-textures-mips.html" }}}

왼쪽과 중간에 있는 것들에 비해 오른쪽에 있는 것들이 얼마나 덜 깜박이는지 확인해보세요.
오른쪽에 있는 것들도 mip을 사용하고 있기 때문에 블렌딩된 색상입니다.
텍스처를 작게 그릴수록 WebGL은 더 멀리 떨어진 픽셀을 선택합니다.
중간 하단에 있는 것이 `LINEAR`를 사용하고 4개의 픽셀을 블렌딩하더라도 깜박이는 이유는 이러한 4개의 픽셀들이 어느 4개를 선택했냐에 따라 16x16 이미지의 다른 모서리에 있어서 다른 색상을 얻을 수 있기 때문입니다.
하지만 오른쪽 하단에 있는 것은 두 번째로 작은 mip을 사용하기 때문에 일관된 색상을 유지합니다.

두 번재 예제는 화면 깊숙이 들어가는 폴리곤을 보여줍니다.

{{{example url="../webgl-3d-textures-mips-tri-linear.html" }}}

화면으로 들어가는 6개의 빔은 위에 나열된 필터링 모드를 사용하고 있는데요.
왼쪽 상단은 `NEAREST`를 사용하여 굉장히 blocky한 것을 볼 수 있습니다.
중간 상단은 `LINEAR`를 사용하는데 그다지 좋아지지 않았습니다.
오른쪽 상단은 `NEAREST_MIPMAP_NEAREST`를 사용합니다.
이미지를 클릭해서 모든 mip이 다른 색상인 텍스처로 전환하면 어떤 mip 사용했는지 쉽게 볼 수 있는데요.
왼쪽 하단은 최상의 mip을 선택하고 해당 mip 내에서 픽셀 4개를 블렌딩하는 `LINEAR_MIPMAP_NEAREST`를 사용합니다.
한 mip에서 다음 mip으로 전환되는 명확한 영역을 볼 수 있습니다.
중간 하단은 최상의 mip 2개를 선택하고, 각각 픽셀 1개를 선택한 다음 블렌딩하는 `NEAREST_MIPMAP_LINEAR`를 사용합니다.
가까이 보면 특히 수평 방향에서 여전히 blocky한 것을 볼 수 있습니다.
오른쪽 하단은 최상의 mip 2개를 선택하고, 각각 픽셀 4개를 선택한 다음, 8개 픽셀 모두를 블렌딩하는 `LINEAR_MIPMAP_LINEAR`를 사용합니다.

<img class="webgl_center noinvertdark nobg" src="resources/different-colored-mips.png" />
<div class="webgl_center">다른 색상의 mip</div>

제일 좋은 `LINEAR_MIPMAP_LINEAR` 이외에 다른 걸 왜 선택하는지 생각하고 계실 겁니다.
여러 이유가 있는데요.
먼저 `LINEAR_MIPMAP_LINEAR`는 가장 느립니다.
픽셀 8개를 읽는 것은 픽셀 1개를 읽는 것보다 느립니다.
최신 GPU 하드웨어에서 한 번에 하나의 텍스처만 사용한다면 문제되지 않지만, 최신 게임들은 한 번에 2개에서 4개의 텍스처를 사용할 수 있습니다.
4개의 텍스처 \* 텍스처당 8개의 픽셀 = 그려진 모든 픽셀에 대해 32개의 픽셀을 읽어야 합니다.
또 다른 이유는 특정 효과를 얻으려는 경우입니다.
예를 들어 픽셀화된 *retro* 느낌을 원할 경우 `NEAREST`를 사용할 수 있습니다.
또한 mip은 메모리를 차지합니다.
실제로 33% 더 많은 메모리를 차지하는데요.
특히 게임 타이틀 화면에서 사용할 수 있는 굉장히 큰 텍스처의 경우에는 많은 메모리를 차지할 수 있습니다.
제일 큰 mip보다 작은 mip을 한 번도 그리지 않는다면 이는 메모리 낭비입니다.
대신에 `NEAREST`나 `LINEAR`를 이용하여 첫 번째 mip만 사용하세요.

필터링을 설정하기 위해 다음과 같이 `gl.texParameter`를 호출하세요.

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

`TEXTURE_MIN_FILTER`은 제일 큰 mip보다 작은 크기의 mip을 그릴 때 사용되는 설정입니다.
`TEXTURE_MIN_FILTER`은 제일 큰 mip보다 큰 크기의 mip을 그릴 때 사용되는 설정입니다.
`TEXTURE_MAG_FILTER`는 `NEAREST`와 `LINEAR`만 유효한 설정입니다.

이 텍스처를 적용하고 싶다고 가정해봅시다.

<img class="webgl_center" src="../resources/keyboard.jpg" />

여기 결과입니다.

{{{example url="../webgl-3d-textures-bad-npot.html" }}}

키보드 텍스처가 보이지 않는 이유는 뭘까요?
이는 WebGL이 높이와 너비 모두 2의 거듭 제곱이 아닌 텍스처에 대해 엄격한 제한을 가지기 때문입니다.
2의 거듭 제곱은 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048 등이 있는데요.
'F' 텍스처는 256x256이었습니다.
256은 2의 거듭 제곱이죠.
키보드 텍스처는 320x240입니다.
둘 다 2의 거듭 제곱이 아니므로 텍스처 표시에 실패합니다.
셰이더에서 `texture2D`이 호출되고 참조된 텍스처가 제대로 설정되지 않은 경우 WebGL은 검은색(0, 0, 0, 1)을 사용합니다.
JavaScript console이나 Web Console을 열어보면, 브라우저에 따라 이렇게 문제를 지적하는 오류가 나타날 수 있습니다.

    WebGL: INVALID_OPERATION: generateMipmap: level 0 not power of 2 or not all the same size.
    WebGL: drawArrays: texture bound to texture unit 0 is not renderable.
       It maybe non-power-of-2 and have incompatible texture filtering or is not 'texture complete'.

이걸 고치기 위해 wrap mode를 `CLAMP_TO_EDGE`로 설정하고 필터링을 `LINEAR`나 `NEAREST`로 설정하여 mip mapping을 꺼야 합니다.

이를 처리하기 위해 이미지 로딩 코드를 수정해봅시다.
먼저 값이 2의 거듭 제곱인지 알려줄 함수가 필요합니다.

    function isPowerOf2(value) {
      return (value & (value - 1)) == 0;
    }

이게 왜 동작하는지 이진 수학에 대해 다루진 않을 겁니다.
그래도 작동하므로 다음과 같이 사용할 수 있습니다.

    // 비동기적 이미지 로드
    var image = new Image();
    image.src = "resources/keyboard.jpg";
    image.addEventListener('load', function() {
      // 이미지가 로드 후 텍스처에 복사
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);

    *  // 이미지의 너비와 높이 모두 2의 거듭 제곱인지 확인
    *  if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
    *     // 2의 거듭 제곱이면 mip 생성
         gl.generateMipmap(gl.TEXTURE_2D);
    *  } else {
    *     // 2의 거듭 제곱이 아니면 mip을 끄고 가장자리에 고정되도록 wrapping 설정
    *     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    *     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    *     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    *  }
    }

그리고 여기 결과입니다.

{{{example url="../webgl-3d-textures-good-npot.html" }}}

2의 거듭 제곱이 아닌 텍스처 이외에도 렌더링되지 않는 것이 있습니다.
WebGL이 "texture complete"여야 하는데요.
"texture complete"는 다음을 의미합니다.

1. 필터링을 설정했으므로 `TEXTURE_MIN_FILTER`를 `LINEAR`나 `NEAREST`로 설정하는 첫 번째 mip 레벨만 사용합니다.

2. Mip을 사용하는 경우 정확한 크기를 필요로 하며 모든 항목을 1x1 크기로 줄여서 제공해야 합니다.
   이걸 수행하는 가장 쉬운 방법은 `gl.generateMipmap`을 호출하는 겁니다.
   그렇지 않고 자신의 mip을 제공하는 경우 모든 항목을 제공해야 합니다.

3. 텍스처의 너비와 높이가 2의 거듭 제곱이 아닌 경우, 위에서 언급한 것처럼 `TEXTURE_MIN_FILTER`를 `LINEAR`나 `NEAREST`로 설정하고, `TEXTURE_WRAP_S`와 `TEXTURE_WRAP_T`를 `CLAMP_TO_EDGE`로 설정해야 합니다.

이 중 하나라도 아니라면 텍스처의 값을 가져올 때 셰이더에서 검은색(0, 0, 0, 1)을 얻게 됩니다.

이에 대해 공통적으로 하는 질문은 "큐브의 각 면에 다른 이미지를 적용하려면 어떻게 하나요?" 입니다.
예를 들어 이러한 6개의 이미지가 있다고 가정해봅시다.

<div class="webgl_table_div_center">
<table class="webgl_table_center">
<tr><td><img src="resources/noodles-01.jpg" /></td><td><img src="resources/noodles-02.jpg" /></td></tr>
<tr><td><img src="resources/noodles-03.jpg" /></td><td><img src="resources/noodles-04.jpg" /></td></tr>
<tr><td><img src="resources/noodles-05.jpg" /></td><td><img src="resources/noodles-06.jpg" /></td></tr>
</table>
</div>

3가지 답이 떠오르는데요.

1) 텍스처 6개를 참조하는 복잡한 셰이더를 만들고, 사용할 텍스처를 정하기 위해 vertex shader에 fragment shader로 전달되는 추가 정점 정보를 전달합니다.
이건 하지 마세요!
조금만 생각해보면 더 많은 면을 가진 다른 모양에 대해 같은 작업을 수행하려는 경우 수많은 셰이더를 작성해야 한다는 것을 알 수 있습니다.

2) 큐브 대신 6개의 평면을 그립니다.
이게 일반적인 해결책입니다.
나쁘진 않지만 이 또한 큐브같은 작은 모양에 대해서만 실제로 작동합니다.
1000개의 사각형으로 구성된 구체의 각 사각형에 다른 텍스처를 적용하려면, 1000개의 평면을 그려야 하고 이는 느립니다.

3) 제가 생각하는 *최고의 해결책*은 모든 이미지들을 하나의 텍스처에 넣고, 텍스처 좌표를 사용하여 텍스처의 다른 부분을 큐브의 각 면에 매핑하는 겁니다.
이건 거의 모든 고성능 앱(게임)에서 사용하는 기술입니다.
예를 들어 이렇게 모든 이미지를 하나의 텍스처에 넣을 수 있습니다.

<img class="webgl_center" src="../resources/noodles.jpg" />

그런 다음 큐브의 각 면에 대해 다른 텍스처 좌표 세트를 사용합니다.

        // 왼쪽 상단 이미지 선택
        0   , 0  ,
        0   , 0.5,
        0.25, 0  ,
        0   , 0.5,
        0.25, 0.5,
        0.25, 0  ,
        // 중간 상단 이미지 선택
        0.25, 0  ,
        0.5 , 0  ,
        0.25, 0.5,
        0.25, 0.5,
        0.5 , 0  ,
        0.5 , 0.5,
        // 오른쪽 상단 이미지 선택
        0.5 , 0  ,
        0.5 , 0.5,
        0.75, 0  ,
        0.5 , 0.5,
        0.75, 0.5,
        0.75, 0  ,
        // 왼쪽 하단 이미지 선택
        0   , 0.5,
        0.25, 0.5,
        0   , 1  ,
        0   , 1  ,
        0.25, 0.5,
        0.25, 1  ,
        // 중간 하단 이미지 선택
        0.25, 0.5,
        0.25, 1  ,
        0.5 , 0.5,
        0.25, 1  ,
        0.5 , 1  ,
        0.5 , 0.5,
        // 오른쪽 하단 이미지 선택
        0.5 , 0.5,
        0.75, 0.5,
        0.5 , 1  ,
        0.5 , 1  ,
        0.75, 0.5,
        0.75, 1  ,

그리고 결과입니다.

{{{example url="../webgl-3d-textures-texture-atlas.html" }}}

하나의 텍스처를 사용하여 여러 이미지를 적용하는 이 방식은 종종 *texture atlas*라고 불립니다.
이게 가장 좋은 이유는 로드하는 텍스처가 하나뿐이기 때문에 셰이더는 하나의 텍스처만을 참조하여 단순하게 유지되며, 평면으로 나누는 경우처럼 텍스처당 한 번씩 그리기 호출을 하는 대신에 단 한번의 그리기 호출만 필요하기 때문입니다.

여기서 다룬 것 이외에 알고 싶을 수 있는 텍스처 관련 글들이 있는데요.
먼저 [texture unit state 작동 방식](webgl-texture-units.html)입니다.
그리고 [한 번에 2개 이상의 텍스처를 사용하는 방법](webgl-2-textures.html)입니다.
또 다른 것은 [다른 도메인의 이미지를 사용하는 방법](webgl-cors-permission.html)이 있습니다.
마지막으로 어찌보면 사소하지만 알아두면 좋은 [원근 교정 텍스처 매핑](webgl-3d-perspective-correct-texturemapping.html)입니다.

다음은 [JavaScript에서 텍스처에 데이터를 제공하는 방법](webgl-data-textures.html)입니다.
또는 WebGL 단순화에 대한 [less code more fun](webgl-less-code-more-fun.html)을 확인할 수도 있습니다.

<div class="webgl_bottombar">
<h3>UV vs Texture Coordinate</h3>
<p>
Texture coordinate는 종종 texture coords, texcoords, UV로 줄여집니다.
저는 vertex position이 <code>x, y, z, w</code>를 사용한다는 것을 제외하고 UV(Ew-Vee)라는 용어가 어디서 왔는지는 모르기 때문에, texture coordinate에 대해 <code>s, t, u, v</code>를 사용하여 둘 중 어느 걸 참조하는지 명확하게 하기로 결정하였습니다.
그럼 Es-Tee로 불릴 것 같고 실제로 texture wrap 설정을 보면 <code>TEXTURE_WRAP_S</code>와 <code>TEXTURE_WRAP_T</code>지만 어떤 이유로든 제가 그래픽스 분야에서 일하는 동안 사람들은 Ew-Vee라고 불렀습니다.
</p>
<p>따라서 누군가가 UV라고 말하면 텍스처 좌표에 대해 이야기하는 겁니다.</p>
</div>


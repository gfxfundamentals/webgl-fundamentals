Title: WebGL 이미지 처리 심화
Description: WebGL에서 이미지에 여러 이미지 처리를 적용하는 방법

이 글은 [WebGL 이미지 처리](webgl-image-processing.html)에서 이어지는 글입니다.
아직 읽지 않았다면 [거기부터 시작하는 것이](webgl-image-processing.html) 좋습니다.

이미지 처리 다음으로 가장 많이 받는 질문이 "어떻게 여러 효과를 적용하나요?" 입니다.
글쎄요, 즉석으로 shader를 생성할 수 있긴 합니다.
사용자가 쓰고자 하는 효과를 선택하는 UI를 제공한 다음 모든 효과를 내는 shader를 생성하는 건데요.
항상 가능한 건 아니지만 이 기술은 종종 [실기간 그래픽을 만드는 데](http://www.youtube.com/watch?v=cQUn0Zeh-0Q) 사용됩니다.

더 유연한 방법은 texture 2개를 더 사용해서 각 texture를 차례대로 렌더링하고, 주고 받으면서 매번 다음 효과를 적용하는 겁니다.

<blockquote>
<pre>
Original Image -> [Blur]        -> Texture 1
Texture 1      -> [Sharpen]     -> Texture 2
Texture 2      -> [Edge Detect] -> Texture 1
Texture 1      -> [Blur]        -> Texture 2
Texture 2      -> [Normal]      -> Canvas
</pre>
</blockquote>

이렇게 하기 위해서 우리는 framebuffer를 만들어야 하는데요.
WebGL과 OpenGL에서, Framebuffer는 좋은 이름이 아닙니다.
WebGL/OpenGL Framebuffer는 실제로 상태의 모음(첨부 목록)일 뿐 어떤 종류의 buffer도 아닌데요.
하지만, texture를 framebuffer에 첨부해서 해당 texture로 렌더링할 수 있습니다.

먼저 [오래된 texture 생성 코드](webgl-image-processing.html)를 함수로 바꿔봅시다

```
  function createAndSetupTexture(gl) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // texture를 설정하여 어떤 크기의 이미지도 렌더링할 수 있으므로 픽셀로 작업합니다.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return texture;
  }

  // texture를 만들고 이미지를 넣습니다.
  var originalImageTexture = createAndSetupTexture(gl);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
```

그리고 2개 이상의 c 만드는 함수를 사용해서 framebuffer 2개에 첨부합니다.

```
  // texture 2개를 만들고 framebuffer에 첨부합니다.
  var textures = [];
  var framebuffers = [];
  for (var ii = 0; ii < 2; ++ii) {
    var texture = createAndSetupTexture(gl);
    textures.push(texture);

    // 이미지와 같은 크기로 texture 만들기
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        image.width,
        image.height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null
    );

    // framebuffer 생성
    var fbo = gl.createFramebuffer();
    framebuffers.push(fbo);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    // texture 첨부
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        texture,
        0
    );
  }
```

이제 kernel 집합을 만든 다음 적용할 목록을 만들어봅시다.

```
  // 여러 convolution kernel 정의
  var kernels = {
    normal: [
      0, 0, 0,
      0, 1, 0,
      0, 0, 0
    ],
    gaussianBlur: [
      0.045, 0.122, 0.045,
      0.122, 0.332, 0.122,
      0.045, 0.122, 0.045
    ],
    unsharpen: [
      -1, -1, -1,
      -1,  9, -1,
      -1, -1, -1
    ],
    emboss: [
      -2, -1,  0,
      -1,  1,  1,
       0,  1,  2
    ]
  };

  // 적용할 효과 목록
  var effectsToApply = [
    "gaussianBlur",
    "emboss",
    "gaussianBlur",
    "unsharpen"
  ];
```

그리고 마지막으로 렌더링할 texture를 주고 받으면서, 하나씩 적용합니다.

```
  // 원본 이미지로 시작
  gl.bindTexture(gl.TEXTURE_2D, originalImageTexture);

  // texture에 이미지를 그리는 동안 y축 뒤집지 않기
  gl.uniform1f(flipYLocation, 1);

  // 적용하고 싶은 각 효과를 반복합니다.
  for (var ii = 0; ii < effectsToApply.length; ++ii) {
    // Setup to draw into one of the framebuffers.
    setFramebuffer(framebuffers[ii % 2], image.width, image.height);

    drawWithKernel(effectsToApply[ii]);

    // for the next draw, use the texture we just rendered to.
    gl.bindTexture(gl.TEXTURE_2D, textures[ii % 2]);
  }

  // 마지막으로 결과를 canvas에 그립니다.
  gl.uniform1f(flipYLocation, -1);  // canvas y축 뒤집기 필요
  setFramebuffer(null, canvas.width, canvas.height);
  drawWithKernel("normal");

  function setFramebuffer(fbo, width, height) {
    // 이걸 우리가 렌더링할 framebuffer로 만듭니다.
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    // shader에게 framebuffer의 해상도를 알려줍니다.
    gl.uniform2f(resolutionLocation, width, height);

    // WebGL에게 framebuffer에 필요한 viewport 설정을 알려줍니다.
    gl.viewport(0, 0, width, height);
  }

  function drawWithKernel(name) {
    // kernel 설정
    gl.uniform1fv(kernelLocation, kernels[name]);

    // 사각형 그리기
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
```

좀 더 유연한 UI를 가진 작업물이 있는데요.
켜서 효과를 확인하고 드래그해서 적용 방법을 재정렬해보세요.

{{{example url="../webgl-2d-image-processing.html" }}}

넘어가야 할 몇 가지가 있는데요.

<code>null</code>을 넘긴 <code>gl.bindFramebuffer</code>를 호출하는 건 WebGL에게 framebuffer 중 하나 대신에 canvas에 렌더링하고 싶다는 걸 알려줍니다.

WebGL은 [clip 공간](webgl-fundamentals.html)에서 다시 픽셀로 전환해줘야 하는데요.
이건 <code>gl.viewport</code>의 설정에 따라 수행됩니다.
렌더링할 framebuffer는 canvas 크기와 다르기 때문에 framebuffer texture를 렌더링할 때 viewport를 적절하게 설정하고 마지막으로 canvas를 렌더링할 때 다시 설정합니다.

최종적으로 렌더링할 때 [원본 예제](webgl-fundamentals.html)에서 Y 좌표로 뒤집었는데요.
그 이유는 WebGL이 0,0이 전통적인 2D에서 왼쪽 상단인 것과 달리 왼쪽 하단으로 canvas를 표시하기 때문입니다.

이건 framebuffer에 렌더링할 때는 필요가 없는데요.
왜냐하면 framebuffer는 보여지지 않기 때문에, 어느 부분이 상단/하단인지는 관계가 없습니다.
중요한 건 framebuffer에서 픽셀 0,0이 우리 계산의 0,0에 상응한다는 겁니다.
이것을 해결하기 위해 shader에 하나 이상의 입력을 추가해서 뒤집을지 말지를 설정할 수 있습니다.

```
<script id="2d-vertex-shader" type="x-shader/x-vertex">
...
uniform float u_flipY;
...

void main() {
   ...

   gl_Position = vec4(clipSpace * vec2(1, u_flipY), 0, 1);

   ...
}
</script>
```

그런 다음 렌더링할 때 설정할 수 있습니다.

```
  ...

  var flipYLocation = gl.getUniformLocation(program, "u_flipY");

  ...

  // 뒤집지 않기
  gl.uniform1f(flipYLocation, 1);

  ...

  // 뒤집기
  gl.uniform1f(flipYLocation, -1);

```

저는 이 예제를 여러 효과를 얻을 수 있는 단일 GLSL program을 만들어서 간단하게 유지했습니다.
만약 이미지 처리에 전념하고 싶다면 많은 GLSL program이 필요할 겁니다.
색조, 채도 그리고 휘도 조정, 밝기와 대비, 반전용 그리고 레벨 조정용 프로그램 등등.
GLSL 프로그램을 전환하고 특정 프로그램에 대한 매개 변수를 갱신하려면 코드를 변경해야합니다.
이 예제 작성을 고려했지만 여러 GLSL program은 각자 매개변수가 필요하고 뒤엉키지 않도록 중요한 부분에 리펙토링이 필요하기 때문에 연습하기 좋은 것 같아 남겨뒀습니다.

저는 이것과 앞 선 예제들로 WebGL이 좀 더 친근하게 보이셨기를 바랍니다.
그리고 2D로 시작하는 것이 WebGL을 이해하기 더 쉽게 만들어주길 바랍니다.

시간이 있으면 WebGL이 실제로 어떤 작업을 수행하는지에 대한 자세한 내용은 물론 3D 작업 방법에 대해서 [몇 가지 글들을](webgl-2d-translation.html) 더 써보겠습니다.
다음 단계로 [2개 이상의 texture 사용법](webgl-2-textures.html)을 배워보시는 걸 추천합니다.

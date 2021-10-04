Title: WebGL 이미지 처리 심화
Description: WebGL의 이미지에 여러 이미지 처리 기술을 적용하는 방법
TOC: 이미지 처리 심화


이 글은 [WebGL 이미지 처리](webgl-image-processing.html)에서 이어지는 글입니다.
아직 읽지 않았다면 [거기](webgl-image-processing.html)부터 시작하는 게 좋습니다.

이미지 처리에 대해 다음으로 가장 궁금한 점은 어떻게 여러 효과를 적용할까요?

음, 즉석으로 셰이더를 생성할 수 있긴 합니다.
사용자가 쓰고자 하는 효과를 선택하는 UI를 제공한 다음 모든 효과를 수행하는 셰이더를 생성하는 겁니다.
항상 가능한 건 아니지만 이 기술은 종종 [실기간 그래픽 효과](https://www.youtube.com/watch?v=cQUn0Zeh-0Q)를 만드는 데 사용됩니다.

더 유연한 방법은 텍스처 2개를 더 사용하고, 각 텍스처를 차례대로 렌더링하여, 주고 받으면서 매번 다음 효과를 적용하는 겁니다.

<div class="webgl_center"><pre>
Original Image -> [Blur]        -> Texture 1
Texture 1      -> [Sharpen]     -> Texture 2
Texture 2      -> [Edge Detect] -> Texture 1
Texture 1      -> [Blur]        -> Texture 2
Texture 2      -> [Normal]      -> Canvas
</pre></div>

이렇게 하기 위해 우리는 framebuffer를 만들어야 하는데요.
WebGL과 OpenGL에서 framebuffer는 사실 좋지 않은 이름입니다.
WebGL/OpenGL framebuffer는 정말로 상태 모음(attachment 목록)일 뿐이며 실제로 어떤 종류의 버퍼도 아닌데요.
하지만 텍스처를 framebuffer에 첨부해서 해당 텍스처로 렌더링할 수 있습니다.

먼저 원래 사용하던 [텍스처 생성 코드](webgl-image-processing.html)를 함수로 바꿉니다.

```
  function createAndSetupTexture(gl) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // 텍스처를 설정하여 어떤 크기의 이미지도 렌더링할 수 있도록 하고 픽셀로 작업합니다.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return texture;
  }

  // 텍스처를 만들고 이미지를 넣습니다.
  var originalImageTexture = createAndSetupTexture(gl);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
```

그리고 이제 함수를 사용하여 텍스처를 2개 더 만들고 framebuffer 2개에 첨부합니다.

```
  // 텍스처 2개를 만들고 framebuffer에 첨부합니다.
  var textures = [];
  var framebuffers = [];
  for (var ii = 0; ii < 2; ++ii) {
    var texture = createAndSetupTexture(gl);
    textures.push(texture);

    // 이미지와 같은 크기로 텍스처 만들기
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

    // 텍스처 첨부
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );
  }
```

이제 kernel set을 만든 다음 적용할 목록을 만들어봅시다.

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

그리고 마지막으로 각각을 적용하고, 렌더링할 텍스처도 주고 받으면 됩니다.

```
  // 원본 이미지로 시작
  gl.bindTexture(gl.TEXTURE_2D, originalImageTexture);

  // 텍스처에 그리는 동안 이미지 y축 뒤집지 않기
  gl.uniform1f(flipYLocation, 1);

  // 적용하고 싶은 각 효과를 반복합니다.
  for (var ii = 0; ii < effectsToApply.length; ++ii) {
    // Framebuffer 중 하나에 그리기 위해 설정합니다.
    setFramebuffer(framebuffers[ii % 2], image.width, image.height);

    drawWithKernel(effectsToApply[ii]);

    // 다음 그리기를 위해, 방금 렌더링한 텍스처를 사용합니다.
    gl.bindTexture(gl.TEXTURE_2D, textures[ii % 2]);
  }

  // 마지막으로 결과를 캔버스에 그립니다.
  gl.uniform1f(flipYLocation, -1);  // 캔버스 y축 뒤집기 필요
  setFramebuffer(null, canvas.width, canvas.height);
  drawWithKernel("normal");

  function setFramebuffer(fbo, width, height) {
    // 이걸 렌더링할 framebuffer로 만듭니다.
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    // Framebuffer의 해상도를 셰이더에 알려줍니다.
    gl.uniform2f(resolutionLocation, width, height);

    // WebGL에 framebuffer에 필요한 viewport 설정을 알려줍니다.
    gl.viewport(0, 0, width, height);
  }

  function drawWithKernel(name) {
    // kernel 설정
    gl.uniform1fv(kernelLocation, kernels[name]);

    // 사각형을 그립니다.
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
```

여기 좀 더 유연한 UI와 함께 작동하는 버전이 있습니다.
효과를 켜기 위해 체크해보세요.
어떻게 적용할 지 재정렬하기 위해서는 효과를 드래그하면 됩니다.

{{{example url="../webgl-2d-image-processing.html" }}}

살펴봐야 할 게 몇 가지 있습니다.

<code>gl.bindFramebuffer</code>에 <code>null</code>을 넘겨 호출하는 것은 framebuffer 중 하나 대신 캔버스에 렌더링하고 싶다는 걸 WebGL에 알려줍니다.

WebGL은 [clip space](webgl-fundamentals.html)에서 다시 픽셀로 변환해야 하는데요.
이건 <code>gl.viewport</code>의 설정에 따라 수행됩니다.
렌더링할 framebuffer는 캔버스 크기와 다르기 때문에 framebuffer texture를 렌더링할 때 viewport를 적절하게 설정하고 마지막으로 캔버스를 렌더링할 때 다시 설정해야 합니다.

마지막으로 [원본 예제](webgl-fundamentals.html)에서 렌더링할 때 Y 좌표를 뒤집었는데, 이는 WebGL이 0,0을 2D에서 더 관례적인 왼쪽 상단 대신 왼쪽 하단 모서리로 캔버스에 표시하기 때문입니다.
이건 framebuffer에 렌더링할 때는 필요가 없는데요.
Framebuffer는 표시되지 않기 때문에, 어느 부분이 상단 혹은 하단인지는 관계가 없습니다.
중요한 건 framebuffer에서 픽셀 0,0이 우리가 계산한 0,0에 해당한다는 겁니다.
이걸 해결하기 위해 셰이더에 입력 하나를 더 추가해서 뒤집을지 말지 설정 가능하도록 만들었습니다.

```
<script id="vertex-shader-2d" type="x-shader/x-vertex">
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

여러 효과를 얻을 수 있는 단일 GLSL program을 사용하여 예제를 단순하게 유지했습니다.
완전한 이미지 처리를 수행하려면 많은 GLSL program이 필요한데요.
색조, 채도, 휘도 조정을 위한 program이 있습니다.
또 다른 것으로는 밝기와 대비가 있는데요.
하나는 반전용, 다른 하나는 레벨 조절용 등입니다.
GLSL program을 변환하고 특정 program에 대한 매개변수를 업데이트하려면 코드를 변경해야 합니다.
해당 예제 작성을 고려했지만 각각의 매개변수가 있는 여러 GLSL program은 뒤엉키지 않도록 주요 리펙토링이 필요하기 때문에 연습하기 좋을 것 같아 남겨뒀습니다.

이것과 앞선 예제들이 WebGL을 좀 더 접근하기 쉽게 보이도록 만들었기를 바라며, 2D로 시작한 것이 WebGL을 좀 더 이해하기 쉽게 만드는 데에 도움이 되었기를 바랍니다.
시간이 있으면 [WebGL이 실제로 수행하는 작업](webgl-how-it-works.html)에 대한 더 자세한 내용은 물론, [3D를 수행하는 방법](webgl-2d-translation.html)에 대해서 몇 가지 글을 더 써보겠습니다.
다음 단계로 [2개 이상의 텍스처 사용법](webgl-2-textures.html)을 배워보세요.


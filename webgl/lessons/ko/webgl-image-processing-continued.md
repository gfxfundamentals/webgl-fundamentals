Title: WebGL 이미지 처리 심화
Description: WebGL의 이미지에 여러 이미지 처리 기술을 적용하는 방법
TOC: 이미지 처리 심화


이 글은 [WebGL 이미지 처리](webgl-image-processing.html)에서 이어지는 글입니다.
아직 읽지 않았다면 [거기](webgl-image-processing.html)부터 시작하는 게 좋습니다.

어떻게 여러 이미지 처리 효과를 적용할 수 있을까요?

음, 즉석으로 셰이더를 생성할 수 있긴 합니다.
사용자가 쓰고자 하는 효과를 선택하는 UI를 제공한 다음 모든 효과를 수행하는 셰이더를 생성하는 겁니다.
항상 가능한 것은 아니지만 이 기술은 종종 [실기간 그래픽 효과](https://www.youtube.com/watch?v=cQUn0Zeh-0Q)를 만드는 데 사용됩니다.

더 유연한 방법은 텍스처 2개를 더 사용하고, 각 텍스처를 번갈아가며 렌더링하여, 매번 다음 효과를 적용하는 겁니다.

<div class="webgl_center"><pre>
원본 이미지 -> [Blur]        -> 텍스처 1
텍스처 1   -> [Sharpen]     -> 텍스처 2
텍스처 2   -> [Edge Detect] -> 텍스처 1
텍스처 1   -> [Blur]        -> 텍스처 2
텍스처 2   -> [Normal]      -> 캔버스  
</pre></div>

이렇게 하기 위해 우리는 프레임 버퍼를 만들어야 합니다.
사실 WebGL과 OpenGL에서 프레임 버퍼는 좋은 이름이 아닌데요.
WebGL/OpenGL 프레임 버퍼는 상태 모음(attachment 목록)일 뿐이며 실제로 어떤 종류의 버퍼도 아닙니다.
하지만 텍스처를 프레임 버퍼에 첨부해서 해당 텍스처에 렌더링할 수 있습니다.

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

그리고 이제 함수를 사용하여 텍스처를 2개 더 만들고 프레임 버퍼 2개에 첨부합니다.

```
  // 텍스처 2개를 만들고 프레임 버퍼에 첨부합니다.
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

    // 프레임 버퍼 생성
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

이제 커널 세트 만든 다음 적용할 목록을 만들어봅시다.

```
  // 여러 컨볼루션 커널 정의
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

마지막으로 렌더링할 텍스처에 하나씩 적용하면 됩니다.

```
  // 원본 이미지로 시작
  gl.bindTexture(gl.TEXTURE_2D, originalImageTexture);

  // 텍스처에 그리는 동안 이미지 y축 뒤집지 않기
  gl.uniform1f(flipYLocation, 1);

  // 적용하고 싶은 각 효과를 반복합니다.
  for (var ii = 0; ii < effectsToApply.length; ++ii) {
    // 프레임 버퍼 중 하나에 그리도록 설정합니다.
    setFramebuffer(framebuffers[ii % 2], image.width, image.height);

    drawWithKernel(effectsToApply[ii]);

    // 다음 그리기를 위해 방금 렌더링한 텍스처를 사용합니다.
    gl.bindTexture(gl.TEXTURE_2D, textures[ii % 2]);
  }

  // 마지막으로 결과를 캔버스에 그립니다.
  gl.uniform1f(flipYLocation, -1);  // 캔버스 y축 뒤집기 필요
  setFramebuffer(null, canvas.width, canvas.height);
  drawWithKernel("normal");

  function setFramebuffer(fbo, width, height) {
    // 이걸 렌더링할 프레임 버퍼로 만듭니다.
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    // 프레임 버퍼의 해상도를 셰이더에 알려줍니다.
    gl.uniform2f(resolutionLocation, width, height);

    // WebGL에 프레임 버퍼에 필요한 뷰포트 설정을 알려줍니다.
    gl.viewport(0, 0, width, height);
  }

  function drawWithKernel(name) {
    // 커널 설정
    gl.uniform1fv(kernelLocation, kernels[name]);

    // 사각형을 그립니다.
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
```

여기 좀 더 유연한 UI와 함께 작동하는 버전이 있습니다.
효과를 켜기 위해 체크 박스를 사용해보세요.
어떻게 적용할 지 재정렬하고 싶다면 효과를 드래그하면 됩니다.

{{{example url="../webgl-2d-image-processing.html" }}}

몇 가지 살펴봐야 할 게 있습니다.

<code>gl.bindFramebuffer</code>에 <code>null</code>을 넘겨 호출하는 것은 프레임 버퍼 중 하나 대신 캔버스에 렌더링하고 싶다고 WebGL에 알려줍니다.

WebGL은 [클립 공간](webgl-fundamentals.html)에서 다시 픽셀로 변환해야 하는데요.
이건 <code>gl.viewport</code>의 설정에 따라 수행됩니다.
렌더링할 프레임 버퍼는 캔버스 크기와 다르기 때문에 프레임 버퍼 텍스처를 렌더링할 때 뷰포트를 적절하게 설정하고 마지막으로 캔버스를 렌더링할 때 다시 설정해야 합니다.

마지막으로 [원본 예제](webgl-fundamentals.html)에서 렌더링할 때 Y 좌표를 뒤집었는데, 이는 WebGL이 0,0을 캔버스의 좌측 상단 대신 좌측 하단으로 표시하기 때문입니다.
이건 프레임 버퍼에 렌더링할 때는 필요가 없는데요.
프레임 버퍼는 표시되지 않기 때문에, 어느 부분이 상단 혹은 하단인지는 관계가 없습니다.
중요한 건 프레임 버퍼에서 픽셀 0,0이 우리가 계산한 0,0에 해당한다는 겁니다.
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

여러 효과를 얻을 수 있는 단일 GLSL 프로그램을 사용하여 예제를 단순하게 유지했습니다.
완전한 이미지 처리를 수행하려면 많은 GLSL 프로그램이 필요한데요.
색조, 채도, 휘도 조정을 위한 프로그램이 있습니다.
또 다른 것으로는 밝기와 대비가 있는데요.
하나는 반전용, 다른 하나는 레벨 조절용 프로그램입니다.
GLSL 프로그램을 변환하고 특정 프로그램에 대한 매개변수를 업데이트하려면 코드를 변경해야 합니다.
해당 예제 작성도 고려했지만 각각의 매개변수가 있는 여러 GLSL 프로그램은 뒤엉키지 않도록 리펙토링이 필요하기 때문에 연습하기 좋을 것 같아 남겨뒀습니다.

이것과 앞선 예제들이 WebGL을 좀 더 접근하기 쉽게 보이도록 만들었기를 바라며, 2D로 시작한 게 WebGL을 더 쉽게 이해하는 데에 도움이 되었기를 바랍니다.
시간이 있으면 [WebGL이 실제로 수행하는 작업](webgl-how-it-works.html)에 대한 더 자세한 내용은 물론, [3D를 수행하는 방법](webgl-2d-translation.html)에 대해서 몇 가지 글을 더 써보겠습니다.
다음 단계로 [2개 이상의 텍스처 사용법](webgl-2-textures.html)을 배워보세요.


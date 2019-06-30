Title: WebGL 이미지 처리
Description: WebGL에서 이미지 처리하는 방법
TOC: WebGL 이미지 처리


WebGL에서 이미지 처리하는 건 쉽습니다.
어떻게 쉽냐구요? 아래를 보시죠.
<!--자세히-->
이 글은 [WebGL 기초](webgl-fundamentals.html)에서 이어지는 글입니다.
만약 읽어보신 적이 없다면 [거기에 먼저 가보는 것이](webgl-fundamentals.html) 좋습니다.

WebGL에서 이미지를 그리기 위해서 우리는 texture를 사용해야 하는데요.
렌더링할 때 픽셀 대신 clip 공간 좌표를 유추하는 것과 마찬가지로 texture를 렌더링할 때 WebGL은 texture 좌표를 유추합니다.
texture 좌표는 texture 크기에 관계없이 0.0에서 1.0사이가 됩니다.

우리는 직사각형 하나만(정확히는, 삼각형 2개) 그릴 것이기 때문에 직사각형의 각 점이 texture의 어떤 위치에 해당하지는지 WebGL에게 알려줘야 합니다.

이 정보를 'varying'이라고 불리는 특수 변수를 이용해서 vertex shader에서 fragment shader로 넘겨줘야 하는데요.
varying은 값이 변할 수 있기 때문에 varying이라고 불립니다.
WebGL은 fragment shader를 사용해서 각 픽셀을 그릴 때 vertex shader에서 제공한 값을 보간합니다.

[이전 글의 마지막에 다룬 vertex shader를](webgl-fundamentals.html) 사용해서 texture 좌표 전달을 위한 속성을 추가하고 그걸 fragment shader로 전달해야 합니다.

    attribute vec2 a_texCoord;
    ...
    varying vec2 v_texCoord;

    void main() {
      ...
      // Fragment shader에 texCoord 전달
      // GPU는 이 값을 점들 사이에 삽입할 겁니다
      v_texCoord = a_texCoord;
    }

그런 다음 texture의 색상을 찾기 위해 fragment shader를 제공합니다.

    <script id="2d-fragment-shader" type="x-shader/x-fragment">
    precision mediump float;

    // texture
    uniform sampler2D u_image;

    // vertex shader에서 전달된 texCoords
    varying vec2 v_texCoord;

    void main() {
      // texture의 색상 탐색
      gl_FragColor = texture2D(u_image, v_texCoord);
    }
    </script>

마지막으로 이미지를 로드하고, texture를 생성한 다음 이미지를 texture로 복사해야 하는데요.
브라우저에서 이미지를 비동기적으로 로딩하기 때문에 texture 로드를 기다리기 위해 코드를 변경해야 합니다.
일단 로드되면 그릴겁니다.

    function main() {
      var image = new Image();
      image.src = "http://someimage/on/our/server";  // 같은 도메인이여야 합니다!!!
      image.onload = function() {
        render(image);
      }
    }

    function render(image) {
      ...
      // 우리가 작성했던 모든 코드
      ...
      // texture 좌표가 필요한 곳을 탐색
      var texCoordLocation = gl.getAttribLocation(program, "a_texCoord");

      // 사각형의 texture 좌표 제공
      var texCoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
      gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([
            0.0,  0.0,
            1.0,  0.0,
            0.0,  1.0,
            0.0,  1.0,
            1.0,  0.0,
            1.0,  1.0]),
          gl.STATIC_DRAW
      );
      gl.enableVertexAttribArray(texCoordLocation);
      gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

      // texture 생성
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);

      // 어떤 크기의 이미지도 렌더링할 수 있도록 매개변수 설정
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

      // texture에 이미지 업로드
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      ...
    }

그리고 여기 WebGL에서 렌더링된 이미지입니다.
참고: 만약 로컬에서 이걸 실행하는 경우 WebGL에서 이미지를 로드할 수 있도록 하기 위해 간단한 웹 서버가 필요합니다.
[몇 분 안에 설치하기 위한 방법은 여기를 봐주세요](webgl-setup-and-installation.html).

{{{example url="../webgl-2d-image.html" }}}

너무 과하지 않게 이미지를 조작해봅시다.
빨강과 파랑을 바꾸는 건 어떨까요?

    ...
    gl_FragColor = texture2D(u_image, v_texCoord).bgra;
    ...

이제 빨강과 파랑이 바뀝니다.

{{{example url="../webgl-2d-image-red2blue.html" }}}

만약 실제로 다른 픽셀들을 보는 이미지 처리를 원한다면 어떻게 해야 할까요?
WebGL은 0.0에서 1.0사이 좌표를 가진 texture를 참조하므로 간단한 식(<code>onePixel = 1.0 / textureSize</code>)으로 1픽셀 당 얼마나 이동해야 하는지 계산할 수 있습니다.

이건 texture에서 각 픽셀의 왼쪽/오른쪽 픽셀을 평균화하는 fragment shader 입니다.

    <script id="2d-fragment-shader" type="x-shader/x-fragment">
    precision mediump float;

    // texture
    uniform sampler2D u_image;
    uniform vec2 u_textureSize;

    // vertex shader에서 전달된 texCoords
    varying vec2 v_texCoord;

    void main() {
      // texture 좌표의 1픽셀을 계산
      vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;

      // 왼쪽, 중앙, 오른쪽의 픽셀 평균
      gl_FragColor = (
        texture2D(u_image, v_texCoord) +
        texture2D(u_image, v_texCoord + vec2(onePixel.x, 0.0)) +
        texture2D(u_image, v_texCoord + vec2(-onePixel.x, 0.0))
      ) / 3.0;
    }
    </script>

그런 다음 JavaScript에서 texture 크기를 전달해야 합니다.

    ...

    var textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");

    ...

    // 이미지 크기 설정
    gl.uniform2f(textureSizeLocation, image.width, image.height);

    ...

위의 흐리지 않은 이미지와 비교해봅시다.

{{{example url="../webgl-2d-image-blend.html" }}}

이제 다른 픽셀을 참조하는 방법을 알았으니 convolution kernel을 이용해서 일반적인 이미지 처리를 해봅시다.
여기에서는 3x3 kernel을 사용할 겁니다.
convolution kernel은 렌더링할 때 각 항목이 주위의 픽셀 8개에 몇을 곱할건지 나타내는 3x3 행렬입니다.
그런 다음 그 결과를 kernel의 가중치(kernel에 있는 모든 값들의 합) 또는 1.0 중 더 큰 값으로 나눕니다.
[여기에 꽤 좋은 글이 있습니다](https://docs.gimp.org/2.10/en/gimp-filter-convolution-matrix.html).
그리고 [여기 C++로 직접 작성하면 어떤지 실제 코드를 보여주는 또 다른 글입니다](http://www.codeproject.com/KB/graphics/ImageConvolution.aspx).

우리는 shader에서 작업을 수행하므로 여기 새로운 fragment shader가 있습니다.

    <script id="2d-fragment-shader" type="x-shader/x-fragment">
    precision mediump float;

    // texture
    uniform sampler2D u_image;
    uniform vec2 u_textureSize;
    uniform float u_kernel[9];
    uniform float u_kernelWeight;

    // vertex shader에서 전달된 texCoords
    varying vec2 v_texCoord;

    void main() {
      vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
      vec4 colorSum =
        texture2D(u_image, v_texCoord + onePixel * vec2(-1, -1)) * u_kernel[0] +
        texture2D(u_image, v_texCoord + onePixel * vec2( 0, -1)) * u_kernel[1] +
        texture2D(u_image, v_texCoord + onePixel * vec2( 1, -1)) * u_kernel[2] +
        texture2D(u_image, v_texCoord + onePixel * vec2(-1,  0)) * u_kernel[3] +
        texture2D(u_image, v_texCoord + onePixel * vec2( 0,  0)) * u_kernel[4] +
        texture2D(u_image, v_texCoord + onePixel * vec2( 1,  0)) * u_kernel[5] +
        texture2D(u_image, v_texCoord + onePixel * vec2(-1,  1)) * u_kernel[6] +
        texture2D(u_image, v_texCoord + onePixel * vec2( 0,  1)) * u_kernel[7] +
        texture2D(u_image, v_texCoord + onePixel * vec2( 1,  1)) * u_kernel[8] ;

      // 합계를 가중치로 나누지만 rgb로 사용하고 alpha를 1.0으로 설정
      gl_FragColor = vec4((colorSum / u_kernelWeight).rgb, 1.0);
    }
    </script>

JavaScript에서 convolution kernel과 가중치를 제공해줘야 합니다.

     function computeKernelWeight(kernel) {
       var weight = kernel.reduce(function(prev, curr) {
         return prev + curr;
       });
       return weight <= 0 ? 1 : weight;
     }

     ...
     var kernelLocation = gl.getUniformLocation(program, "u_kernel[0]");
     var kernelWeightLocation = gl.getUniformLocation(program, "u_kernelWeight");
     ...
     var edgeDetectKernel = [
       -1, -1, -1,
       -1,  8, -1,
       -1, -1, -1
     ];
     gl.uniform1fv(kernelLocation, edgeDetectKernel);
     gl.uniform1f(kernelWeightLocation, computeKernelWeight(edgeDetectKernel));
     ...

그리고 짜잔...
drop down 목록을 사용해서 다른 커널을 선택해보세요.

{{{example url="../webgl-2d-image-3x3-convolution.html" }}}

이 글로 WebGL에서 이미지 처리가 제법 간단하다고 확신하셨기를 바랍니다.
다음에는 [이미지에 하나 이상의 효과 적용하는 방법을](webgl-image-processing-continued.html) 살펴보겠습니다.

<div class="webgl_bottombar">
<h3><code>u_image</code>가 설정되지 않습니다. 어떻게 동작하나요?</h3>
<p>
Uniform은 0이 기본 값이므로 u_image는 기본 값으로 texture unit 0을 사용합니다.
Texture unit 0도 default active texture 이므로 bindTexture를 호출하면 texture가 texture unit 0에 할당됩니다.
</p>
<p>
WebGL은 일련의 texture unit을 가집니다.
각 sampler uniform이 참조하는 texture unit은 해당 sampler uniform의 위치를 탐색하여 설정됩니다.
그런 다음 참조할 texture unit의 index를 설정합니다.
</p>
<p>예제:</p>
<pre class="prettyprint showlinemods">
var textureUnitIndex = 6; // texture unit 6 사용
var u_imageLoc = gl.getUniformLocation(program, "u_image");
gl.uniform1i(u_imageLoc, textureUnitIndex);
</pre>
<p>
다른 unit을 설정하기 위해 <code>gl.activeTexture</code>를 호출하고 원하는 unit에 texture를 할당합니다.
예를 들어
</p>
<pre class="prettyprint showlinemods">
// someTexture를 texture unit 6에 할당
gl.activeTexture(gl.TEXTURE6);
gl.bindTexture(gl.TEXTURE_2D, someTexture);
</pre>
<p>이것도 동작합니다.</p>
<pre class="prettyprint showlinemods">
var textureUnitIndex = 6; // texture unit 6 사용
// someTexture를 texture unit 6에 할당
gl.activeTexture(gl.TEXTURE0 + textureUnitIndex);
gl.bindTexture(gl.TEXTURE_2D, someTexture);
</pre>
<p>
모든 WebGL 구현체들은 fragment shader에서 최소한 texture unit 8개를 지원해야 하지만 vertex shader에서는 0만 지원해야 하는데요.
따라서 8개 이상을 사용하려면 <code>gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)</code>를 호출해서 얼마나 많은지 확인해야 합니다.
만약 vertex shader에서 texture를 사용하고 싶다면 <code>gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS)</code>를 호출해서 얼마나 많이 쓸 수 있는지 찾아야 합니다.
99% 이상의 기기들이 vertex shader에서 최소 4개 이상의 texture unit을 지원합니다.
</p>
</div>

<div class="webgl_bottombar">
<h3>GLSL에서 변수의 접두어(a_, u_, v_)가 뭔가요?</h3>
<p>
그건 단순히 명명 규칙입니다.
꼭 필요한 것은 아니지만 값이 어디서 왔는지 한 눈에 보기 쉽게 만들어 주는데요.
a_는 buffer에서 제공되는 데이터의 attribute 입니다.
u_는 shader에 입력하는 uniform 입니다.
v_는  vertex shader에서 fragment shader로 전달된 값이면서 그려진 각 픽셀의 꼭지점 사이에 보간된(또는 변화된) 값인 varying 입니다.
자세한 내용은 <a href="webgl-how-it-works.html">동작 원리</a>를 봐주세요.
</p>
</div>

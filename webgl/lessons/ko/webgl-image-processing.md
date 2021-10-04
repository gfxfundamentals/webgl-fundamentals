Title: WebGL 이미지 처리
Description: WebGL에서 이미지를 처리하는 방법
TOC: 이미지 처리


WebGL에서 이미지 처리는 쉽습니다.
어떻게 쉽냐구요?
아래를 보시죠.
<!--more-->
이 글은 [WebGL 기초](webgl-fundamentals.html)에서 이어집니다.
아직 읽지 않았다면 [거기](webgl-fundamentals.html)부터 가보는 게 좋습니다.

WebGL에서 이미지를 그리기 위해서는 텍스처를 사용해야 하는데요.
렌더링할 때 WebGL이 픽셀 대신 clip space 좌표를 유추하는 것과 마찬가지로, 텍스처를 읽을 때 WebGL은 텍스처 좌표를 유추합니다.
텍스처 좌표는 텍스처 크기에 상관없이 0.0에서 1.0사이가 됩니다.

단 하나의 사각형(정확히는 2개의 삼각형)만 그리기 때문에 사각형의 각 점이 텍스처의 어느 위치에 해당하는지 WebGL에 알려줘야 합니다.
'varying'이라고 불리는 특수 변수를 이용해 이 정보를 vertex shader에서 fragment shader로 전달해야 하는데요.
이 변수는 변하기 때문에 varying이라 불립니다.
WebGL은 fragment shader를 사용해서 각 픽셀을 그릴 때 vertex shader에 제공한 값을 보간합니다.

[이전 글](webgl-fundamentals.html)의 마지막에 있는 vertex shader를 사용해서 텍스처 좌표 전달을 위한 속성을 추가한 다음 fragment shader로 전달해야 합니다.

    attribute vec2 a_texCoord;
    ...
    varying vec2 v_texCoord;

    void main() {
      ...
      // Fragment shader로 texCoord 전달
      // GPU는 점들 사이의 값을 보간
      v_texCoord = a_texCoord;
    }

그런 다음 텍스처의 색상을 찾기 위해 fragment shader를 제공합니다.

    <script id="fragment-shader-2d" type="x-shader/x-fragment">
    precision mediump float;

    // 텍스처
    uniform sampler2D u_image;

    // Vertex shader에서 전달된 texCoords
    varying vec2 v_texCoord;

    void main() {
      // 텍스처의 색상 탐색
      gl_FragColor = texture2D(u_image, v_texCoord);
    }
    </script>

마지막으로 이미지를 불러오고, 텍스처를 생성하고, 이미지를 텍스처로 복사해야 하는데요.
브라우저에서 이미지를 비동기적으로 불러오기 때문에 텍스처 로딩을 기다리도록 코드를 약간 변경해야 합니다.
불러오자마자 그리도록 할 겁니다.

    function main() {
      var image = new Image();
      image.src = "http://someimage/on/our/server";  // 같은 도메인이여야 합니다!!!
      image.onload = function() {
        render(image);
      }
    }

    function render(image) {
      ...
      // 이전에 작성한 모든 코드
      ...
      // 텍스처 좌표가 필요한 곳을 탐색
      var texCoordLocation = gl.getAttribLocation(program, "a_texCoord");

      // 사각형의 텍스처 좌표 제공
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
          1.0,  1.0
        ]),
        gl.STATIC_DRAW
      );
      gl.enableVertexAttribArray(texCoordLocation);
      gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

      // 텍스처 생성
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);

      // 어떤 크기의 이미지도 렌더링할 수 있도록 매개변수 설정
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

      // 텍스처에 이미지 업로드
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      ...
    }

그리고 여기 WebGL에서 렌더링된 이미지입니다.
참고: 로컬에서 실행하는 경우 WebGL에서 이미지를 로드할 수 있도록 간단한 웹 서버가 필요합니다.
설정하는 방법은 [여기](webgl-setup-and-installation.html)를 봐주세요.

{{{example url="../webgl-2d-image.html" }}}

너무 재미없으니 이미지를 조작해봅시다.
빨간색과 파란색을 바꿔보는 건 어떨까요?

    ...
    gl_FragColor = texture2D(u_image, v_texCoord).bgra;
    ...

이제 빨간색과 파란색이 바뀌었습니다.

{{{example url="../webgl-2d-image-red2blue.html" }}}

실제로 다른 픽셀을 보는 이미지 처리는 어떻게 해야 할까요?
WebGL은 0.0에서 1.0까지인 텍스처 좌표에서 텍스처를 참조하기 때문에 간단한 수식(<code>onePixel = 1.0 / textureSize</code>)으로 1px을 위해 얼마나 이동해야 하는지 계산할 수 있습니다.

다음은 텍스처에 있는 각 픽셀의 왼쪽과 오른쪽의 픽셀을 평균화하는 fragment shader입니다.

    <script id="fragment-shader-2d" type="x-shader/x-fragment">
    precision mediump float;

    // 텍스처
    uniform sampler2D u_image;
    uniform vec2 u_textureSize;

    // Vertex shader에서 전달된 texCoords
    varying vec2 v_texCoord;

    void main() {
      // 텍스처 좌표의 1px 계산
      vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;

      // 왼쪽, 중앙, 오른쪽 픽셀 평균화
      gl_FragColor = (
        texture2D(u_image, v_texCoord) +
        texture2D(u_image, v_texCoord + vec2(onePixel.x, 0.0)) +
        texture2D(u_image, v_texCoord + vec2(-onePixel.x, 0.0))
      ) / 3.0;
    }
    </script>

그런 다음 javascript에서 텍스처의 크기를 전달해야 합니다.

    ...

    var textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");

    ...

    // 이미지 크기 설정
    gl.uniform2f(textureSizeLocation, image.width, image.height);

    ...

위에 있는 흐리지 않은 이미지와 비교해보세요.

{{{example url="../webgl-2d-image-blend.html" }}}

이제 다른 픽셀을 참조하는 방법을 알았으니 convolution kernel을 이용해서 일반적인 이미지 처리를 해봅시다.
이 경우 3x3 kernel을 사용하는데요.
Convolution kernel은 행렬의 각 항목이 렌더링하는 픽셀 주변에 있는 8개의 픽셀에 얼마나 곱할지 나타내는 3x3 행렬입니다.
그런 다음 결과를 kernel의 가중치(kernel에 있는 모든 값의 합) 또는 1.0 중에 더 큰 값으로 나누는데요.
이에 관한 [제법 좋은 글](https://docs.gimp.org/2.10/en/gimp-filter-convolution-matrix.html)이 있습니다.
그리고 C++로 직접 작성하면 어떤지 실제 코드를 보여주는 [다른 글](https://www.codeproject.com/KB/graphics/ImageConvolution.aspx)도 있습니다.

우리의 경우 셰이더에서 해당 작업을 수행하므로 새로운 fragment shader가 필요합니다.

    <script id="fragment-shader-2d" type="x-shader/x-fragment">
    precision mediump float;

    // 텍스처
    uniform sampler2D u_image;
    uniform vec2 u_textureSize;
    uniform float u_kernel[9];
    uniform float u_kernelWeight;

    // Vertex shader에서 전달된 texCoords
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

      // 합계를 가중치로 나누지만 rgb만을 사용
      // Alpha는 1.0으로 설정
      gl_FragColor = vec4((colorSum / u_kernelWeight).rgb, 1.0);
    }
    </script>

Javascript에서 convolution kernel과 가중치를 제공해줘야 합니다.

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
Drop down 목록을 사용해서 다른 커널을 선택해보세요.

{{{example url="../webgl-2d-image-3x3-convolution.html" }}}

이 글로 WebGL에서 이미지 처리는 꽤 간단하다고 확신하셨기 바랍니다.
다음은 [이미지에 2개 이상의 효과를 적용하는 방법](webgl-image-processing-continued.html)을 살펴보겠습니다.

<div class="webgl_bottombar">
<h3><code>u_image</code>는 설정되지 않습니다. 이건 어떻게 동작하나요?</h3>
<p>
Uniform은 0이 기본값이므로 u_image는 기본적으로 texture unit 0을 사용합니다.
Texture unit 0도 default active texture 이므로 bindTexture를 호출하면 텍스처가 texture unit 0에 할당됩니다.
</p>
<p>
WebGL은 texture unit의 배열을 가지는데요.
각 sampler uniform이 참조하는 texture unit을 설정하기 위해, 해당 sampler uniform의 location을 탐색한 다음, 참조할 texture unit의 index로 설정합니다.
</p>
<p>예제:</p>
<pre class="prettyprint showlinemods">
var textureUnitIndex = 6; // texture unit 6 사용
var u_imageLoc = gl.getUniformLocation(program, "u_image");
gl.uniform1i(u_imageLoc, textureUnitIndex);
</pre>
<p>
다른 unit에 texture를 설정하려면 <code>gl.activeTexture</code>를 호출하고 원하는 unit에 texture를 할당하면 됩니다.
</p>
<pre class="prettyprint showlinemods">
// texture unit 6에 someTexture 할당
gl.activeTexture(gl.TEXTURE6);
gl.bindTexture(gl.TEXTURE_2D, someTexture);
</pre>
<p>이것도 동작합니다.</p>
<pre class="prettyprint showlinemods">
var textureUnitIndex = 6; // texture unit 6 사용
// texture unit 6에 someTexture 할당
gl.activeTexture(gl.TEXTURE0 + textureUnitIndex);
gl.bindTexture(gl.TEXTURE_2D, someTexture);
</pre>
<p>
모든 WebGL 구현체들은 fragment shader에서 최소 8개의 texture unit을 지원해야 하지만 vertex shader에서는 0뿐 입니다.
따라서 8개 이상을 사용하려면 <code>gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)</code>를 호출해서 몇 개가 있는지 확인해야 하고, vertex shader에서 텍스처를 사용하고 싶다면 <code>gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS)</code>를 호출해서 몇 개를 사용할 수 있는지 알아보세요.
99% 이상의 기기들이 vertex shader에서 최소 4개 이상의 texture unit을 지원합니다.
</p>
</div>

<div class="webgl_bottombar">
<h3>GLSL의 변수에서 a_, u_, v_ 접두사는 뭔가요?</h3>
<p>
그건 단순 명명 규칙입니다.
필수는 아니지만 값이 어디서 왔는지 한 눈에 보기 쉽게 만들어 줍니다.
a_는 버퍼에서 제공되는 데이터인 attribute입니다.
u_는 셰이더에 입력하는 uniform이고, v_는  vertex shader에서 fragment shader로 전달되고 그려진 각 픽셀에 대해 정점 사이가 보간(또는 가변)되는 값인 varying입니다.
더 자세한 내용은 <a href="webgl-how-it-works.html">동작 원리</a>를 봐주세요.
</p>
</div>


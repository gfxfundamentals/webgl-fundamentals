Title: WebGL 2개 이상의 텍스처 사용
Description: WebGL에서 2개 이상의 텍스처를 사용하는 방법
TOC: 2개 이상의 텍스처 사용


이 글은 [WebGL 이미지 처리](webgl-image-processing.html)에서 이어집니다.
아직 읽지 않았다면 [거기](webgl-image-processing.html)부터 시작하는 게 좋습니다.

"어떻게 2개 이상의 텍스처를 사용할 수 있나요?"라는 질문에 답하기 좋은 시점인 것 같군요.

꽤 간단합니다.
하나의 이미지를 그리고 2개의 이미지로 업데이트하는 첫 번째 셰이더에 대한 [몇 가지 수업](webgl-image-processing.html)으로 돌아가 봅시다.

먼저 해야할 일은 2개의 이미지를 로딩할 수 있도록 코드를 수정하는 겁니다.
이건 실제로 WebGL이 아니라, HTML5 JavaScript가 할 일이지만, 우리가 다룰 수 있습니다.
이미지는 비동기적으로 로드되기 때문에 익숙해지는 데에 약간의 시간이 걸릴 수 있습니다.

기본적으로 처리할 수 있는 2가지 방법이 있습니다.
텍스처 없이 실행되고 텍스처가 로드되면 program이 업데이트하도록 코드를 구조화할 수 있는데요.
이후의 글을 위해 해당 method를 저장해두겠습니다.

이 경우 그리기 전에 모든 이미지가 로드되는 걸 기다릴 겁니다.

먼저 이미지를 로드하는 코드를 함수로 수정해봅시다.
이는 매우 간단합니다.
새로운 `Image` 객체를 생성하고, 로드할 URL을 설정한 다음, 이미지 로딩이 끝났을 때 호출할 callback을 설정합니다.

```
function loadImage(url, callback) {
  var image = new Image();
  image.src = url;
  image.onload = callback;
  return image;
}
```

이제 URL 배열을 로드하고 이미지 배열을 생성하는 함수를 만들어 보겠습니다.
먼저 `imagesToLoad`를 로드할 이미지 개수로 설정합니다.
그런 다음 `loadImage`에 전달하는 callback에서 `imagesToLoad`를 감소시킵니다.
`imagesToLoad`가 0이 되면 모든 이미지가 로드되었고 이미지 배열을 callback에 전달합니다.

```
function loadImages(urls, callback) {
  var images = [];
  var imagesToLoad = urls.length;

  // 이미지 로딩이 끝날 때마다 호출
  var onImageLoad = function() {
    --imagesToLoad;
    // 모든 이미지가 로드되면 callback 호출
    if (imagesToLoad == 0) {
      callback(images);
    }
  };

  for (var ii = 0; ii < imagesToLoad; ++ii) {
    var image = loadImage(urls[ii], onImageLoad);
    images.push(image);
  }
}
```

이제 이렇게 `loadImages`를 호출합니다.

```
function main() {
  loadImages([
    "resources/leaves.jpg",
    "resources/star.jpg",
  ], render);
}
```

다음으로 2개의 텍스처를 사용하도록 셰이더를 수정합니다.
이 경우 하나의 텍스처에 다른 텍스처를 곱할 겁니다.

```
<script id="fragment-shader-2d" type="x-shader/x-fragment">
precision mediump float;

// 텍스처
uniform sampler2D u_image0;
uniform sampler2D u_image1;

// Vertex shader에서 전달된 texCoords 
varying vec2 v_texCoord;

void main() {
   vec4 color0 = texture2D(u_image0, v_texCoord);
   vec4 color1 = texture2D(u_image1, v_texCoord);
   gl_FragColor = color0 * color1;
}
</script>
```

2개의 WebGL 텍스처 객체를 생성해야 합니다.

```
  // 2개의 텍스처 생성
  var textures = [];
  for (var ii = 0; ii < 2; ++ii) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // 어떤 크기의 이미지도 렌더할 수 있도록 매개변수 설정
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // 텍스처에 이미지 업로드
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[ii]);

    // 텍스처 배열에 텍스처 추가
    textures.push(texture);
  }
```

WebGL에는 "texture unit"이라는 것이 있습니다.
이는 텍스처에 대한 레퍼런스 배열이라 생각할 수 있습니다.
각 sampler에 대해 사용할 texture unit을 셰이더에 알려줍니다.

```
  // Sampler location 탐색
  var u_image0Location = gl.getUniformLocation(program, "u_image0");
  var u_image1Location = gl.getUniformLocation(program, "u_image1");

  ...

  // 함께 렌더링할 texture unit 설정
  gl.uniform1i(u_image0Location, 0);  // texture unit 0
  gl.uniform1i(u_image1Location, 1);  // texture unit 1
```

그런 다음 텍스처를 각각의 texture unit에 할당해야 합니다.

```
  // 특정 텍스처를 사용하도록 각각의 texture unit 설정
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, textures[0]);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, textures[1]);
```

로딩중인 2개의 이미지는 다음과 같습니다.

<style>.glocal-center { text-align: center; } .glocal-center-content { margin-left: auto; margin-right: auto; }</style>
<div class="glocal-center"><table class="glocal-center-content"><tr><td><img src="../resources/leaves.jpg" /> <img src="../resources/star.jpg" /></td></tr></table></div>

그리고 여기 WebGL을 사용하여 곱한 결과입니다.

{{{example url="../webgl-2-textures.html" }}}

몇 가지 살펴봐야 할 것이 있습니다.

Texture unit을 생각하는 간단한 방법: 모든 텍스처 함수는 "active texture unit"에서 작동한다.
"active texture unit"은 작업하려는 texture unit의 전역 변수입니다.
각 texture unit은 2가지 target을 가지는데요.
TEXTURE_2D target과 TEXTURE_CUBE_MAP target입니다.
모든 텍스처 함수는 current active texture unit에서 지정된 target과 함께 작동합니다.
JavaScript로 WebGL을 구현한다면 다음과 같을 겁니다.

```
var getContext = function() {
  var textureUnits = [
    { TEXTURE_2D: ??, TEXTURE_CUBE_MAP: ?? },
    { TEXTURE_2D: ??, TEXTURE_CUBE_MAP: ?? },
    { TEXTURE_2D: ??, TEXTURE_CUBE_MAP: ?? },
    { TEXTURE_2D: ??, TEXTURE_CUBE_MAP: ?? },
    { TEXTURE_2D: ??, TEXTURE_CUBE_MAP: ?? },
    ...
  ];
  var activeTextureUnit = 0;

  var activeTexture = function(unit) {
    // unit enum을 index로 변환
    var index = unit - gl.TEXTURE0;
    // active texture unit 설정
    activeTextureUnit = index;
  };

  var bindTexture = function(target, texture) {
    // active texture unit의 target에 대한 텍스처 설정
    textureUnits[activeTextureUnit][target] = texture;
  };

  var texImage2D = function(target, ... args ...) {
    // active texture unit의 current texture에서 texImage2D 호출
    var texture = textureUnits[activeTextureUnit][target];
    texture.image2D(...args...);
  };

  // WebGL API 반환
  return {
    activeTexture: activeTexture,
    bindTexture: bindTexture,
    texImage2D: texImage2D,
  }
};
```

셰이더는 index를 texture unit으로 가져옵니다.
이 두 줄이 더 명료하게 만들어주길 바랍니다.

```
  gl.uniform1i(u_image0Location, 0);  // texture unit 0
  gl.uniform1i(u_image1Location, 1);  // texture unit 1
```

한 가지 유의해야할 점은, uniform을 사용할 때 texture unit에 대한 index를 사용하지만, gl.activeTexture를 호출할 때는 특수 상수 gl.TEXTURE0, gl.TEXTURE1 등을 전달해야 한다는 겁니다.
다행히 상수는 연속적이므로 이렇게 대체할 수 있습니다.

```
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, textures[0]);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, textures[1]);
```

이렇게 할 수도 있고

```
  gl.activeTexture(gl.TEXTURE0 + 0);
  gl.bindTexture(gl.TEXTURE_2D, textures[0]);
  gl.activeTexture(gl.TEXTURE0 + 1);
  gl.bindTexture(gl.TEXTURE_2D, textures[1]);
```

혹은 이렇게

```
  for (var ii = 0; ii < 2; ++ii) {
    gl.activeTexture(gl.TEXTURE0 + ii);
    gl.bindTexture(gl.TEXTURE_2D, textures[ii]);
  }
```

이 글이 WebGL의 단일 그리기 호출에서 여러 텍스처를 사용하는 방법을 설명하는 데에 도움이 되길 바랍니다.


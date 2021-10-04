Title: WebGL Texture Unit
Description: WebGL에서 texture unit은 뭔가요?
TOC: Texture Unit


이 글은 WebGL에서 texture unit이 어떻게 설정되는지에 대한 대략적인 이미지를 제공하기 위해 작성되었습니다.
attribute에 관한 [비슷한 글](webgl-attributes.html)이 있습니다.

이 글을 읽기 전에 [WebGL 작동 원리](webgl-how-it-works.html)와 [WebGL 셰이더와 GLSL](https://webglfundamentals.org/webgl/lessons/webgl-shaders-and-glsl.html)뿐 아니라 [WebGL 텍스처](webgl-3d-textures.html)도 읽어보시길 바랍니다.

## Texture Unit

WebGL에는 텍스처가 있습니다.
텍스처는 대부분 셰이더에 전달할 수 있는 데이터의 2D 배열인데요.
셰이더에서 이렇게 *uniform sampler*를 선언하면

```glsl
uniform sampler2D someTexture;
```

하지만 셰이더는 `someTexture`에 사용할 텍스처를 어떻게 아는 걸까요?

그게 texture unit이 관여하는 부분입니다.
Texture unit은 텍스처에 대한 레퍼런스 **전역 배열**입니다.
WebGL이 javascript로 작성되었다면 다음과 같은 전역 상태를 가질 것이라 상상할 수 있는데

```js
const gl = {
  activeTextureUnit: 0,
  textureUnits: [
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, },
  ];
}
```

위에서 `textureUnits`가 배열인 걸 볼 수 있는데요.
해당 texture unit 배열에서 *bind point* 중 하나를 텍스처에 할당합니다.
`ourTexture`를 texture unit 5에 할당해봅시다.

```js
// 초기화할 때
const ourTexture = gl.createTexture();
// 여기에 텍스처 초기화 코드를 삽입하세요.

...

// 렌더링할 때
const indexOfTextureUnit = 5;
gl.activeTexture(gl.TEXTURE0 + indexOfTextureUnit);
gl.bindTexture(gl.TEXTURE_2D, ourTexture);
```

그런 다음 아래와 같이 호출하여 텍스처를 바인딩한 texture unit을 셰이더에 알리는데

```js
gl.uniform1i(someTextureUniformLocation, indexOfTextureUnit);
```

`activeTexture` 및 `bindTexture` WebGL 함수가 javascript로 구현된다면 

```js
// 의사 코드!!!
gl.activeTexture = function(unit) {
  gl.activeTextureUnit = unit - gl.TEXTURE0;  // 0 기반 index로 변환
};

gl.bindTexture = function(target, texture) {
  const textureUnit = gl.textureUnits[gl.activeTextureUnit];
  textureUnit[target] = texture;
}:
```

다른 텍스처 함수가 어떻게 작동하는지도 상상할 수 있습니다.
`gl.texImage2D(target, ...)`나 `gl.texParameteri(target)`처럼 모두 `target`을 받는데요.
이들은 다음과 같이 구현될 것이며

```js
// 의사 코드!!!
gl.texImage2D = function(target, level, internalFormat, width, height, border, format, type, data) {
  const textureUnit = gl.textureUnits[gl.activeTextureUnit];
  const texture = textureUnit[target];
  texture.mips[level] = convertDataToInternalFormat(internalFormat, width, height, format, type, data);
}

gl.texParameteri = function(target, pname, value) {
  const textureUnit = gl.textureUnits[gl.activeTextureUnit];
  const texture = textureUnit[target];
  texture[pname] = value; 
}
```

위 예제 의사 코드에서 `gl.activeTexture`가 WebGL 안에 있는 내부 전역 변수를 texture unit 배열 index로 설정해야 하는 건 명확합니다.
해당 시점부터, 다른 모든 텍스처 함수는 `target`을 받고, 모든 텍스처 함수의 첫 매개 변수이며, 현재 texture unit의 바인딩 포인트를 참조합니다.

## 최대 Texture Unit

WebGL은 적어도 8개의 texture unit을 지원하는 구현이 필요합니다.
얼마나 많이 지원되는지 쿼리할 수 있는데

```js
const maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
```

참고로 vertex shader와 fragment shader는 각각 사용할 수 있는 unit 수에 대한 제한이 다를 수 있습니다.
각각의 제한을 쿼리할 수 있는데

```js
const maxVertexShaderTextureUnits = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
const maxFragmentShaderTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
```

이렇다고 말해보면

```js
maxTextureUnits = 8
maxVertexShaderTextureUnits = 4
maxFragmentShaderTextureUnits = 8
```

이 말은 예를 들어 vertex shader에서 2개의 texture unit을 사용한다면 합쳐진 최대값은 8이기 때문에 fragment shader에서 사용할 수 있는 건 6개만 남는다는 걸 의미합니다.

또 하나 주목해야 할 점은 WebGL이 `gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS)`가 0을 반환하는 걸 허용한다는 겁니다.
다시 말해, **일부 기기는 vertex shader에서의 텍스처 사용을 전혀 지원하지 않을 수 있습니다.**
다행히 [그런 상황](https://webglstats.com/webgl/parameter/MAX_VERTEX_TEXTURE_IMAGE_UNITS)은 드물지만 vertex shader에서 텍스처를 사용하기로 결정했다면 실제로 필요한 만큼 충분히 지원하는지 `gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS)`로 확인하고 아니라면 사용자에게 알려야 합니다.


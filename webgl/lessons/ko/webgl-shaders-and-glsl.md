Title: WebGL Shader 그리고 GLSL
Description: Shader와 GLSL이 뭔가요?

이 글은 [WebGL 기초](webgl-fundamentals.html)에서 이어지는 글입니다.
WebGL이 어떻게 동작하는지에 대해 읽어보신 적 없다면 [이걸 먼저 읽어주세요](webgl-how-it-works.html).

우린 Shader와 GLSL에 대해서 얘기했지만 구체적인 세부 내용은 말하지 않았습니다.
예제로 충분하길 바라지만 이번에 좀 더 명확하게 만들기 위해 노력해봅시다.

[작동 원리](webgl-how-it-works.html)에서 언급했듯이 WebGL은 뭔가를 그릴 때 항상 shader 2개를 필요로 합니다.
바로 *vertex shader*와 *fragment shader*입니다. 그리고 각각의 shader는 *함수*입니다.
vertex shader와 fragment shader는 함께 shader program(또는 그냥 program)에 연결되는데요.
일반적인 WebGL 앱은 많은 shader program을 가지고 있습니다.

## Vertex Shader

Vertex Shader의 역할은 clip 공간 좌표를 생성하는 겁니다.
항상 다음과 같은 양식을 따르는데

    void main() {
      gl_Position = doMathToMakeClipspaceCoordinates
    }

shader는 각 vertex 마다 한 번씩 호출됩니다.
호출될 때마다 특수 변수, `gl_Position`에 어떤 clip 공간 좌표를 설정해줘야 합니다.

Vertex shader는 데이터가 필요합니다.
데이터를 얻을 수 있는 방법에는 3가지가 있는데요.

1.  [Attribute](#attribute) (buffer에서 데이터를 가져옴)
2.  [Uniform](#uniform) (단일 그리기 호출의 모든 vertex에 대해 동일하게 유지하는 값)
3.  [Texture](#vertex-shader-texture) (pixel/texel의 데이터)

### Attribute

가장 일반적인 방법은 buffer와 *attribute*를 사용하는 겁니다.
[작동 원리](webgl-how-it-works.html)에서 buffer와 attribute를 다뤘는데요.
buffer를 만들고,

    var buf = gl.createBuffer();

buffer에 데이터를 넣습니다.

    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, someData, gl.STATIC_DRAW);

그러면, 초기화할 때 주어진 shader program으로 attribute의 위치를 찾습니다.

    var positionLoc = gl.getAttribLocation(someShaderProgram, "a_position");

그리고 렌더링할 때 WebGL에게 attribute 안에 있는 buffer에서 데이터를 어떻게 가져올지 알려줍니다.

    // attribute의 buffer에서 데이터 가져오기 활성화
    gl.enableVertexAttribArray(positionLoc);

    var numComponents = 3;  // (x, y, z)
    var type = gl.FLOAT;    // 32bit 부동 소수점
    var normalize = false;  // 값 원본 그댜로 보존
    var offset = 0;         // buffer의 시작점에서 시작
    var stride = 0;         // 다음 vertex로 가기 위해 이동해야할 byte 수
                            // 0 = 자료형과 numComponents에 따른 적절한 폭 사용 
    gl.vertexAttribPointer(
      positionLoc,
      numComponents,
      type,
      false,
      stride,
      offset
    );

[WebGL 기초](webgl-fundamentals.html)에서 우리는 shader에 수학을 사용할 수 없고 직접 데이터를 넘길 수 있다는 것을 봤습니다

    attribute vec4 a_position;

    void main() {
      gl_Position = a_position;
    }

buffer에 clip 공간 vertex를 넣으면 동작할 겁니다. 

Attribute는 자료형으로 `float`, `vec2`, `vec3`, `vec4`, `mat2`, `mat3`, 그리고 `mat4`를 사용할 수 있습니다.

### Uniform

shader의 경우 uniform은 draw가 호출될 때 모든 vertex에서 동일하게 유지되는 전달 값입니다.
간단한 예로 위 vertex shader에 offset을 추가할 수 있습니다.

    attribute vec4 a_position;
    +uniform vec4 u_offset;

    void main() {
      gl_Position = a_position + u_offset;
    }

이제 모든 vertex마다 특정한 값으로 offset을 지정할 수 있습니다.
먼저 초기화 시 uniform의 위치를 찾아야합니다.

    var offsetLoc = gl.getUniformLocation(someProgram, "u_offset");

그런 다음 그리기 전에 uniform을 설정합니다.

    gl.uniform4fv(offsetLoc, [1, 0, 0, 0]);  // 화면 우측 절반으로 offset 지정

참고로 uniform은 개별 shader program에 속합니다.
만약 이름이 같은 uniform을 가진 shader program이 여러 개 있다면 uniform은 둘 다 고유한 위치와 자체 값을 가집니다.
`gl.uniform???`을 호출하면 *현재 program*의 uniform만 설정됩니다.
현재 program은 `gl.useProgram`에 넘긴 마지막 program 입니다.

Uniform은 여러 자료형을 가질 수 있는데요.
각각의 자료형에 대해 해당 함수를 호출하여 설정해야 합니다.

    gl.uniform1f (floatUniformLoc, v);                 // float
    gl.uniform1fv(floatUniformLoc, [v]);               // float 또는 float 배열
    gl.uniform2f (vec2UniformLoc,  v0, v1);            // vec2
    gl.uniform2fv(vec2UniformLoc,  [v0, v1]);          // vec2 또는 vec2 배열
    gl.uniform3f (vec3UniformLoc,  v0, v1, v2);        // vec3
    gl.uniform3fv(vec3UniformLoc,  [v0, v1, v2]);      // vec3 또는 vec3 배열
    gl.uniform4f (vec4UniformLoc,  v0, v1, v2, v4);    // vec4
    gl.uniform4fv(vec4UniformLoc,  [v0, v1, v2, v4]);  // vec4 또는 vec4 배열

    gl.uniformMatrix2fv(mat2UniformLoc, false, [  4x element array ])  // mat2 또는 mat2 배열
    gl.uniformMatrix3fv(mat3UniformLoc, false, [  9x element array ])  // mat3 또는 mat3 배열
    gl.uniformMatrix4fv(mat4UniformLoc, false, [ 16x element array ])  // mat4 또는 mat4 배열

    gl.uniform1i (intUniformLoc,   v);                 // int
    gl.uniform1iv(intUniformLoc, [v]);                 // int 또는 int 배열
    gl.uniform2i (ivec2UniformLoc, v0, v1);            // ivec2
    gl.uniform2iv(ivec2UniformLoc, [v0, v1]);          // ivec2 또는 ivec2 배열
    gl.uniform3i (ivec3UniformLoc, v0, v1, v2);        // ivec3
    gl.uniform3iv(ivec3UniformLoc, [v0, v1, v2]);      // ivec3 또는 ivec3 배열
    gl.uniform4i (ivec4UniformLoc, v0, v1, v2, v4);    // ivec4
    gl.uniform4iv(ivec4UniformLoc, [v0, v1, v2, v4]);  // ivec4 또는 ivec4 배열

    gl.uniform1i (sampler2DUniformLoc,   v);           // sampler2D (texture)
    gl.uniform1iv(sampler2DUniformLoc, [v]);           // sampler2D 또는 sampler2D 배열

    gl.uniform1i (samplerCubeUniformLoc,   v);         // samplerCube (texture)
    gl.uniform1iv(samplerCubeUniformLoc, [v]);         // samplerCube 또는 samplerCube 배열

`bool`, `bvec2`, `bvec3`, 그리고 `bvec4`도 있는데요.
`gl.uniform?f?` 또는 `gl.uniform?i?` 함수를 사용합니다.

참고로 배열은 배열의 모든 uniform을 한번에 설정할 수 있습니다.
예를들어

    // shader
    uniform vec2 u_someVec2[3];

    // JavaScript에서 초기화 시
    var someVec2Loc = gl.getUniformLocation(someProgram, "u_someVec2");

    // 렌더링할 때
    gl.uniform2fv(someVec2Loc, [1, 2, 3, 4, 5, 6]);  // set the entire array of u_someVec2

하지만 배열의 요소를 개밸적으로 설정하고 싶다면 각 요소의 위치를 개별적으로 찾아야 합니다.

    // JavaScript에서 초기화할 때
    var someVec2Element0Loc = gl.getUniformLocation(someProgram, "u_someVec2[0]");
    var someVec2Element1Loc = gl.getUniformLocation(someProgram, "u_someVec2[1]");
    var someVec2Element2Loc = gl.getUniformLocation(someProgram, "u_someVec2[2]");

    // 렌더링할 때
    gl.uniform2fv(someVec2Element0Loc, [1, 2]);  // 요소 0 설정
    gl.uniform2fv(someVec2Element1Loc, [3, 4]);  // 요소 1 설정
    gl.uniform2fv(someVec2Element2Loc, [5, 6]);  // 요소 2 설정

마찬가지로 struct를 생성하면

    struct SomeStruct {
      bool active;
      vec2 someVec2;
    };
    uniform SomeStruct u_someThing;

각 필드를 개별적으로 찾을 수 있습니다.

    var someThingActiveLoc = gl.getUniformLocation(someProgram, "u_someThing.active");
    var someThingSomeVec2Loc = gl.getUniformLocation(someProgram, "u_someThing.someVec2");

### Vertex-Shader-Texture

[Fragment Shader의 Texture](#fragment-shader-texture)를 봐주세요.

## Fragment Shader

Fragment Shader의 역할은 rasterization 되는 현재 픽셀의 색상을 제공하는 것 입니다.
항상 다음과 같은 양식을 따르는데

    precision mediump float;

    void main() {
      gl_FragColor = doMathToMakeAColor;
    }

Fragment Shader는 각 픽셀마다 한 번씩 호출됩니다.
호출될 때마다 특수 변수, `gl_FragColor`를 어떤 색상으로 설정해줘야 합니다.

Fragment Shader는 데이터를 필요합니다.
데이터를 받을 수 있는 방법에는 3가지가 있는데요.

1.  [Uniform](#fragment-shader-uniform) (단일 그리기 호출의 모든 vertex에 대해 동일하게 유지하는 값)
2.  [Texture](#fragment-shader-texture) (pixel/texel의 데이터)
3.  [Varying](#varying) (vertex shader에서 전달되고 보간된 데이터)

### Fragment-Shader-Uniform

[Shader의 Uniform](#uniform)을 봐주세요.

### Fragment-Shader-Texture

Shader의 texture에서 값을 얻으려면 `sampler2D` uniform을 생성하고 GLSL 함수 `texture2D`를 사용해서 값을 추출해야 합니다.

    precision mediump float;

    uniform sampler2D u_texture;

    void main() {
      vec2 texcoord = vec2(0.5, 0.5)  // texture 중간에 있는 값 얻기
      gl_FragColor = texture2D(u_texture, texcoord);
    }

Texture에서 나오는 데이터는 [많은 설정에 따라](webgl-3d-textures.html) 달라집니다.
최소한 texture에 데이터를 생성하고 넣어야 하는데, 예를들어

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    var level = 0;
    var width = 2;
    var height = 1;
    var data = new Uint8Array([
      255, 0, 0, 255,   // 빨강 pixel
      0, 255, 0, 255,   // 초록 pixel
    ]);
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      data
    );

초기화할 때 shader program에 있는 uniform 위치를 찾습니다.

    var someSamplerLoc = gl.getUniformLocation(someProgram, "u_texture");

렌더링할 때 texture unit에 texture를 할당합니다.

    var unit = 5;  // texture unit 선택
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);

그리고 texture를 할당한 unit을 shader에게 알려줍니다. 

    gl.uniform1i(someSamplerLoc, unit);

### Varying

Varying은 [동작 원리](webgl-how-it-works.html)에 다룬 vertex shader에서 fragment shader로 값을 넘기는 방법입니다.

Varying을 사용하려면 vertex 및 fragment shader에서 일치하는 varying을 선언해야 합니다.
Vertex Shader의 vertex마다 어떤 값으로 varying을 설정합니다.
WebGL이 픽셀을 그릴 때 이 값들 사이를 보간하고 fragment shader에 해당하는 varying으로 전달합니다.

Vertex Shader

    attribute vec4 a_position;

    uniform vec4 u_offset;

    +varying vec4 v_positionWithOffset;

    void main() {
      gl_Position = a_position + u_offset;
    +  v_positionWithOffset = a_position + u_offset;
    }

Fragment Shader

    precision mediump float;

    +varying vec4 v_positionWithOffset;

    void main() {
    +  // clip 공간에서 (-1 <-> +1) 색상 공간으로 (0 -> 1) 변환.
    +  vec4 color = v_positionWithOffset * 0.5 + 0.5
    +  gl_FragColor = color;
    }

위 예제는 대게 말도 안되는 예제입니다.
일반적으로 clip 공간 값을 fragment shader에 직접 복사해서 색상으로 사용하지 않는데요.
그런데도 불구하고 위 코드는 동작하고 생삭을 만들어냅니다.

## GLSL

GLSL는 Graphics Library Shader Language의 약자입니다.
Shader가 바로 이것으로 작성되는데요.
JavaScript에서는 흔히 볼 수 없는 특별한 고유 기능이 있습니다.
그래픽을 rasterization 하기 위해서 일반적으로 필요한 수학적 계산을 하도록 설계되었습니다.
그래서 예를들어 `vec2`, `vec3`, 그리고 `vec4` 같은 자료형이 있습니다.
이 자료형들은 각각 2개, 3개, 그리고 4개의 값을 가집니다.
마찬가지로 행렬 2x2, 3x3, 그리고 4x4를 나타내는 `mat2`, `mat3` 그리고 `mat4`도 있습니다.
scalar를 `vec`과 곱하는 것을 할 수 있습니다.

    vec4 a = vec4(1, 2, 3, 4);
    vec4 b = a * 2.0;
    // 이제 b는 vec4(2, 4, 6, 8);

마찬가지로 행렬 곱샘과 vector에 행렬 곱셈을 할 수 있습니다.

    mat4 a = ???
    mat4 b = ???
    mat4 c = a * b;

    vec4 v = ???
    vec4 y = c * v;

또한 vec의 일부를 선택하는 다양한 방법이 있는데요.

vec4를 보면

    vec4 v;

*   `v.x`는 `v.s`와 `v.r`과 `v[0]`과 같습니다.
*   `v.y`는 `v.t`와 `v.g`와 `v[1]`과 같습니다.
*   `v.z`는 `v.p`와 `v.b`와 `v[2]`와 같습니다.
*   `v.w`는 `v.q`와 `v.a`와 `v[3]`과 같습니다.

vec 구성요소들을 *swizzle* 할 수 있기 때문에 구성요소를 교체하거나 반복할 수 있습니다.

    v.yyyy

이건 다음과 같습니다

    vec4(v.y, v.y, v.y, v.y)

마찬가지로

    v.bgra

이것도 다음과 같습니다

    vec4(v.b, v.g, v.r, v.a)

vec 또는 mat를 만들 때 한 번에 여러 부분을 제공할 수 있습니다.

예를들면

    vec4(v.rgb, 1)

이건 다음과 같습니다

    vec4(v.r, v.g, v.b, 1)

또한

    vec4(1)

이것도 다음과 같습니다

    vec4(1, 1, 1, 1)

GLSL은 매우 엄격한 자료형입니다

    float f = 1;  // ERROR 1은 int이고 float에 int를 할당할 수 없습니다.

올바른 방법은 이것들입니다

    float f = 1.0;      // float 사용
    float f = float(1)  // float에 integer를 cast

위 예제에서 `vec4(v.rgb, 1)`는 `vec4`가 내부에서 `float(1)`로 cast 되기 때문에 `1`에 대해 문제를 제기하지 않습니다.

GLSL은 많은 기능을 내장하고 있는데요.
대부분이 여러 구성요소에서 동시에 작동합니다.
예를들어

    T sin(T angle)

T는 `float`, `vec2`, `vec3` 또는 `vec4`가 될 수 있음을 뜻합니다.
만약 `vec4`를 넘겨주면 각 구성요소의 sine(`vec4`)를 얻습니다.
다시 말해 `v`가 `vec4`라면

    vec4 s = sin(v);

이건 다음과 같습니다

    vec4 s = vec4(sin(v.x), sin(v.y), sin(v.z), sin(v.w));

가끔은 매개변수 하나가 부동 소수점이고 나머지는 `T`가 되는데요.
말인즉슨 모든 구성요소에 부동 소수점이 적용된다는 걸 뜻합니다.
예를들어 `v1`과 `v2`가 `vec4`이고 `f`는 부동 소수점이라면

    vec4 m = mix(v1, v2, f);

이건 다음과 같습니다

    vec4 m = vec4(
      mix(v1.x, v2.x, f),
      mix(v1.y, v2.y, f),
      mix(v1.z, v2.z, f),
      mix(v1.w, v2.w, f)
    );

[WebGL Reference Card](https://www.khronos.org/files/webgl/webgl-reference-card-1_0.pdf)의 마지막 페이지에서 모든 GLSL 함수 목록을 볼 수 있습니다.
만약 정말로 자세한 정보를 보고 싶다면 [GLSL 사양](https://www.khronos.org/files/opengles_shading_language.pdf)을 봐주세요.

## 총정리

그게 바로 이 모든 글들의 핵심입니다.
WebGL은 다양한 shader를 생성하고, 데이터를 vertex에 제공한 다음 `gl.drawArrays` 또는 `gl.drawElements`를 호출합니다.
그리고 WebGL이 vertex마다 현재 vertex shader를 호출하여 각 vertex를 처리하고 픽셀마다 현재 fragment shdaer를 호출하여 각 픽셀들을 렌더링하는 것에 대한 겁니다.

실제로 shader를 생성하려면 몇 줄의 코드가 필요합니다.
이 코드들은 대부분의 WebGL program에서 동작하므로 한 번 작성하면 꽤 많이 생략할 수 있습니다.
[GLSL shader를 컴파일하고 shader program에 연결하는 방법은 여기에서 다룹니다](webgl-boilerplate.html).

만약 여기서 시작한다면 2가지 방향으로 갈 수 있습니다.
이미지 처리에 관심이 있다면 [2D 이미지 처리 방법](webgl-image-processing.html)을 봐주세요.
translation, rotation, scale 그리고 3D를 공부하는데 흥미가 있다면 [여기서 시작해주세요](webgl-2d-translation.html).

Title: WebGL - Less Code, More Fun
Description: WebGL 프로그래밍을 덜 장황하게 만드는 방법
TOC: Less Code, More Fun


이 포스트는 WebGL 관련 시리즈에서 이어집니다.
첫 번째는 [기초](webgl-fundamentals.html)로 시작했는데요.
아직 읽지 않았다면 해당 글을 먼저 읽어주세요.

WebGL program을 사용하려면 컴파일하고 연결해야 하는 shader program을 작성한 다음 shader program에 대한 입력들의 location을 찾아야 합니다.
이 입력들은 uniform과 attribute라 불리는데, 이들의 location을 찾는데 필요한 코드는 장황하고 지루할 수 있습니다.

Shader program을 컴파일하고 연결하는 [전형적인 WebGL boilerplate 코드](webgl-boilerplate.html)가 있다고 가정합시다.
주어진 셰이더 세트는 이렇습니다.

Vertex shader:

```
uniform mat4 u_worldViewProjection;
uniform vec3 u_lightWorldPos;
uniform mat4 u_world;
uniform mat4 u_viewInverse;
uniform mat4 u_worldInverseTranspose;

attribute vec4 a_position;
attribute vec3 a_normal;
attribute vec2 a_texcoord;

varying vec4 v_position;
varying vec2 v_texCoord;
varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;

void main() {
  v_texCoord = a_texcoord;
  v_position = (u_worldViewProjection * a_position);
  v_normal = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;
  v_surfaceToLight = u_lightWorldPos - (u_world * a_position).xyz;
  v_surfaceToView = (u_viewInverse[3] - (u_world * a_position)).xyz;
  gl_Position = v_position;
}
```

Fragment shader:

```
precision mediump float;

varying vec4 v_position;
varying vec2 v_texCoord;
varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;

uniform vec4 u_lightColor;
uniform vec4 u_ambient;
uniform sampler2D u_diffuse;
uniform vec4 u_specular;
uniform float u_shininess;
uniform float u_specularFactor;

vec4 lit(float l ,float h, float m) {
  return vec4(
    1.0,
    max(l, 0.0),
    (l > 0.0) ? pow(max(0.0, h), m) : 0.0,
    1.0
  );
}

void main() {
  vec4 diffuseColor = texture2D(u_diffuse, v_texCoord);
  vec3 a_normal = normalize(v_normal);
  vec3 surfaceToLight = normalize(v_surfaceToLight);
  vec3 surfaceToView = normalize(v_surfaceToView);
  vec3 halfVector = normalize(surfaceToLight + surfaceToView);
  vec4 litR = lit(
    dot(a_normal, surfaceToLight),
    dot(a_normal, halfVector),
    u_shininess
  );
  vec4 outColor = vec4(
    (
      u_lightColor * (
        diffuseColor * litR.y +
        diffuseColor * u_ambient +
        u_specular * litR.z * u_specularFactor
      )
    ).rgb,
    diffuseColor.a
  );
  gl_FragColor = outColor;
}
```

그리기 위한 다양한 값들을 찾고 설정하려면 결국 이런 코드를 작성해야 합니다.

```
// 초기화할 때
var u_worldViewProjectionLoc   = gl.getUniformLocation(program, "u_worldViewProjection");
var u_lightWorldPosLoc         = gl.getUniformLocation(program, "u_lightWorldPos");
var u_worldLoc                 = gl.getUniformLocation(program, "u_world");
var u_viewInverseLoc           = gl.getUniformLocation(program, "u_viewInverse");
var u_worldInverseTransposeLoc = gl.getUniformLocation(program, "u_worldInverseTranspose");
var u_lightColorLoc            = gl.getUniformLocation(program, "u_lightColor");
var u_ambientLoc               = gl.getUniformLocation(program, "u_ambient");
var u_diffuseLoc               = gl.getUniformLocation(program, "u_diffuse");
var u_specularLoc              = gl.getUniformLocation(program, "u_specular");
var u_shininessLoc             = gl.getUniformLocation(program, "u_shininess");
var u_specularFactorLoc        = gl.getUniformLocation(program, "u_specularFactor");

var a_positionLoc              = gl.getAttribLocation(program, "a_position");
var a_normalLoc                = gl.getAttribLocation(program, "a_normal");
var a_texCoordLoc              = gl.getAttribLocation(program, "a_texcoord");


// 사용에 따라 그리거나 초기화할 때
var someWorldViewProjectionMat = computeWorldViewProjectionMatrix();
var lightWorldPos              = [100, 200, 300];
var worldMat                   = computeWorldMatrix();
var viewInverseMat             = computeInverseViewMatrix();
var worldInverseTransposeMat   = computeWorldInverseTransposeMatrix();
var lightColor                 = [1, 1, 1, 1];
var ambientColor               = [0.1, 0.1, 0.1, 1];
var diffuseTextureUnit         = 0;
var specularColor              = [1, 1, 1, 1];
var shininess                  = 60;
var specularFactor             = 1;


// 그릴 때
gl.useProgram(program);

// 모든 buffer와 attribute 설정
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.enableVertexAttribArray(a_positionLoc);
gl.vertexAttribPointer(a_positionLoc, positionNumComponents, gl.FLOAT, false, 0, 0);
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
gl.enableVertexAttribArray(a_normalLoc);
gl.vertexAttribPointer(a_normalLoc, normalNumComponents, gl.FLOAT, false, 0, 0);
gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
gl.enableVertexAttribArray(a_texcoordLoc);
gl.vertexAttribPointer(a_texcoordLoc, texcoordNumComponents, gl.FLOAT, 0, 0);

// 사용할 텍스처 설정
gl.activeTexture(gl.TEXTURE0 + diffuseTextureUnit);
gl.bindTexture(gl.TEXTURE_2D, diffuseTexture);

// 모든 uniform 설정
gl.uniformMatrix4fv(u_worldViewProjectionLoc, false, someWorldViewProjectionMat);
gl.uniform3fv(u_lightWorldPosLoc, lightWorldPos);
gl.uniformMatrix4fv(u_worldLoc, worldMat);
gl.uniformMatrix4fv(u_viewInverseLoc, viewInverseMat);
gl.uniformMatrix4fv(u_worldInverseTransposeLoc, worldInverseTransposeMat);
gl.uniform4fv(u_lightColorLoc, lightColor);
gl.uniform4fv(u_ambientLoc, ambientColor);
gl.uniform1i(u_diffuseLoc, diffuseTextureUnit);
gl.uniform4fv(u_specularLoc, specularColor);
gl.uniform1f(u_shininessLoc, shininess);
gl.uniform1f(u_specularFactorLoc, specularFactor);

gl.drawArrays(...);
```

정말 많이 작성해야 하네요.

이를 단순화하기 위한 여러 방법이 있는데요.
한 가지 제안은 모든 uniform과 location을 알려주도록 WebGL에 요청한 다음 그것들을 설정하는 함수를 만드는 겁니다.
그러면 JavaScript에서 우리의 세팅을 설정하기 위한 객체를 더 쉽게 전달할 수 있습니다.
이해하기 어렵다면 코드는 다음과 같습니다.

```
// 초기화할 때
var uniformSetters = webglUtils.createUniformSetters(gl, program);
var attribSetters  = webglUtils.createAttributeSetters(gl, program);

var attribs = {
  a_position: { buffer: positionBuffer, numComponents: 3, },
  a_normal:   { buffer: normalBuffer,   numComponents: 3, },
  a_texcoord: { buffer: texcoordBuffer, numComponents: 2, },
};

// 사용에 따라 그리거나 초기화할 때
var uniforms = {
  u_worldViewProjection:   computeWorldViewProjectionMatrix(...),
  u_lightWorldPos:         [100, 200, 300],
  u_world:                 computeWorldMatrix(),
  u_viewInverse:           computeInverseViewMatrix(),
  u_worldInverseTranspose: computeWorldInverseTransposeMatrix(),
  u_lightColor:            [1, 1, 1, 1],
  u_ambient:               [0.1, 0.1, 0.1, 1],
  u_diffuse:               diffuseTexture,
  u_specular:              [1, 1, 1, 1],
  u_shininess:             60,
  u_specularFactor:        1,
};

// 그릴 때
gl.useProgram(program);

// 모든 buffer와 attribute 설정
webglUtils.setAttributes(attribSetters, attribs);

// 사용할 모든 uniform과 texture 설정
webglUtils.setUniforms(uniformSetters, uniforms);

gl.drawArrays(...);
```

훨씬 작고, 쉽고, 더 적은 코드가 됐습니다.

여러 JavaScript 객체를 사용할 수도 있습니다.

```
// 초기화할 때
var uniformSetters = webglUtils.createUniformSetters(gl, program);
var attribSetters  = webglUtils.createAttributeSetters(gl, program);

var attribs = {
  a_position: { buffer: positionBuffer, numComponents: 3, },
  a_normal:   { buffer: normalBuffer,   numComponents: 3, },
  a_texcoord: { buffer: texcoordBuffer, numComponents: 2, },
};

// 사용에 따라 그리거나 초기화할 때
var uniformsThatAreTheSameForAllObjects = {
  u_lightWorldPos:         [100, 200, 300],
  u_viewInverse:           computeInverseViewMatrix(),
  u_lightColor:            [1, 1, 1, 1],
};

var uniformsThatAreComputedForEachObject = {
  u_worldViewProjection:   perspective(...),
  u_world:                 computeWorldMatrix(),
  u_worldInverseTranspose: computeWorldInverseTransposeMatrix(),
};

var objects = [
  {
    translation: [10, 50, 100],
    materialUniforms: {
      u_ambient:           [0.1, 0.1, 0.1, 1],
      u_diffuse:           diffuseTexture,
      u_specular:          [1, 1, 1, 1],
      u_shininess:         60,
      u_specularFactor:    1,
    },
  },
  {
    translation: [-120, 20, 44],
    materialUniforms: {
      u_ambient:           [0.1, 0.2, 0.1, 1],
      u_diffuse:           someOtherDiffuseTexture,
      u_specular:          [1, 1, 0, 1],
      u_shininess:         30,
      u_specularFactor:    0.5,
    },
  },
  {
    translation: [200, -23, -78],
    materialUniforms: {
      u_ambient:           [0.2, 0.2, 0.1, 1],
      u_diffuse:           yetAnotherDiffuseTexture,
      u_specular:          [1, 0, 0, 1],
      u_shininess:         45,
      u_specularFactor:    0.7,
    },
  },
];

// 그릴 때
gl.useProgram(program);

// 모든 객체에 공통적인 부분 설정
webglUtils.setAttributes(attribSetters, attribs);
webglUtils.setUniforms(uniformSetters, uniformThatAreTheSameForAllObjects);

objects.forEach(function(object) {
  computeMatricesForObject(object, uniformsThatAreComputedForEachObject);
  webglUtils.setUniforms(uniformSetters, uniformThatAreComputedForEachObject);
  webglUtils.setUniforms(uniformSetters, objects.materialUniforms);
  gl.drawArrays(...);
});
```

다음은 이런 도우미 함수를 사용한 예제입니다.

{{{example url="../webgl-less-code-more-fun.html" }}}

조금 더 나아가 봅시다.
위 코드에서 우리가 생성한 버퍼로 변수 `attribs`를 설정했습니다.
이러한 버퍼를 설정하는 코드는 보이지 않는데요.
예를 들어 position, normal, texture 좌표를 만들고 싶다면 다음과 같은 코드가 필요할 겁니다.

    // 단일 삼각형
    var positions = [0, -10, 0, 10, 10, 0, -10, 10, 0];
    var texcoords = [0.5, 0, 1, 1, 0, 1];
    var normals   = [0, 0, 1, 0, 0, 1, 0, 0, 1];

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    var texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);

    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

우리가 단순화할 수 있는 패턴처럼 보입니다.

    // 단일 삼각형
    var arrays = {
      position: { numComponents: 3, data: [0, -10, 0, 10, 10, 0, -10, 10, 0], },
      texcoord: { numComponents: 2, data: [0.5, 0, 1, 1, 0, 1],               },
      normal:   { numComponents: 3, data: [0, 0, 1, 0, 0, 1, 0, 0, 1],        },
    };

    var bufferInfo = createBufferInfoFromArrays(gl, arrays);

훨씬 짧아졌네요!
이제 렌더링할 때 이를 수행할 수 있습니다.

    // 필요한 모든 buffer와 attribute 설정
    webglUtils.setBuffersAndAttributes(gl, attribSetters, bufferInfo);

    ...

    // Geometry 그리기
    gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);

여기 결과입니다.

{{{example url="../webgl-less-code-more-fun-triangle.html" }}}

인덱스가 있는 경우에도 잘 동작합니다.
`webglUtils.setBuffersAndAttributes`는 모든 attribute를 설정하고 `indices`로 `ELEMENT_ARRAY_BUFFER`를 설정하므로 `gl.drawElements`를 호출할 수 있습니다.

    // Indexed quad
    var arrays = {
      position: { numComponents: 3, data: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0], },
      texcoord: { numComponents: 2, data: [0, 0, 0, 1, 1, 0, 1, 1],                 },
      normal:   { numComponents: 3, data: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],     },
      indices:  { numComponents: 3, data: [0, 1, 2, 1, 2, 3],                       },
    };

    var bufferInfo = webglUtils.createBufferInfoFromArrays(gl, arrays);

그리고 렌더링할 때 `gl.drawArrays` 대신 `gl.drawElements`를 호출할 수 있습니다.

    // 필요한 모든 buffer와 attribute 설정
    webglUtils.setBuffersAndAttributes(gl, attribSetters, bufferInfo);

    ...

    // Geometry 그리기
    gl.drawElements(gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

여기 결과입니다.

{{{example url="../webgl-less-code-more-fun-quad.html" }}}

기본적으로 `createBufferInfoFromArrays`는 다음과 같은 객체를 만듭니다.

    bufferInfo = {
      numElements: 4,        // 또는 요소의 수에 관계없이
      indices: WebGLBuffer,  // 없는 경우 이 속성은 존재하지 않음
      attribs: {
        a_position: { buffer: WebGLBuffer, numComponents: 3, },
        a_normal:   { buffer: WebGLBuffer, numComponents: 3, },
        a_texcoord: { buffer: WebGLBuffer, numComponents: 2, },
      },
    };

그리고 `webglUtils.setBuffersAndAttributes`는 해당 객체를 사용하여 모든 buffer와 attribute를 설정합니다.

주어진 `position`은 거의 항상 3개의 컴포넌트(x, y, z)를 가지고, `texcoord`는 2개, `indices`는 3개, `normal`는 3개를 가지므로, 시스템이 컴포넌트 수를 추측하도록 할 수 있습니다.

    // Indexed quad
    var arrays = {
      position: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0],
      texcoord: [0, 0, 0, 1, 1, 0, 1, 1],
      normal:   [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
      indices:  [0, 1, 2, 1, 2, 3],
    };

그리고 해당 버전입니다.

{{{example url="../webgl-less-code-more-fun-quad-guess.html" }}}

개인적으로 해당 스타일을 좋아하진 않는데요.
잘못 추측하면 버그가 생길 수 있기 때문입니다.
예를 들어 texcoord attribute에 텍스처 좌표 세트를 추가로 붙이고 싶을 수 있는데 이걸 2개로 추측해 잘못 동작할 겁니다.
물론 잘못 추측하면 위 예제처럼 지정하면 됩니다.
하지만 추측 코드가 사람들의 프로그램을 망가뜨릴 수 있어 걱정하는 것 같습니다.
원하는 방법을 사용하시면 됩니다.
일부 사람들은 가능한 한 단순하다고 생각하게 되는 걸 좋아합니다.

Shader program의 attribute를 보고 컴포넌트 수를 알아내는 건 어떨까요?
버퍼에서 3개의 컴포넌트(x, y, z)를 제공하는 게 일반적이지만 셰이더에서는 `vec4`를 사용하는데요.
WebGL은 attribute에 대해 자동으로 `w = 1`을 설정합니다.
이는 사용자가 셰이더에 선언한 것이 제공한 컴포넌트 수와 일치하지 않을 수 있으므로 사용자의 의도를 쉽게 알 수 없음을 의미합니다.

더 많은 패턴을 찾아봅시다.

    var program = webglUtils.createProgramFromScripts(gl, ["vertexshader", "fragmentshader"]);
    var uniformSetters = webglUtils.createUniformSetters(gl, program);
    var attribSetters  = webglUtils.createAttributeSetters(gl, program);

이것도 단순화해보면

    var programInfo = webglUtils.createProgramInfo(gl, ["vertexshader", "fragmentshader"]);

이런 걸 반환하는데

    programInfo = {
       program: WebGLProgram,  // 컴파일한 program
       uniformSetters: ...,    // webglUtils.createUniformSetters에서 반환된 setters
       attribSetters: ...,     // webglUtils.createAttribSetters에서 반환된 setters
    }

여러 program을 사용하기 시작하면 setter가 연결된 program과 함께 자동으로 유지되기 때문에 상당히 유용합니다.

{{{example url="../webgl-less-code-more-fun-quad-programinfo.html" }}}

아무튼 이건 저의 WebGL program 작성 스타일입니다.
처음엔 사람들이 무엇이 WebGL이고 무엇이 저의 스타일인지 혼동하지 않도록 하기 위해서, 이 튜토리얼의 강의에서는 표준 **verbose** 방식을 사용해야 겠다고 생각했었는데요.
하지만 어느 지점에서 모든 과정을 보여주는 것이 요점을 방해하는 경우가 있기 때문에 앞으로 일부 강의에서는 이 스타일을 사용할 겁니다.

이 스타일은 자유롭게 사용하셔도 괜찮습니다.
`createUniformSetters`, `createAttributeSetters`,  `createBufferInfoFromArrays`, `setUniforms`, `setBuffersAndAttributes` 함수는 모든 샘플에 사용된 [`webgl-utils.js`](https://github.com/gfxfundamentals/webgl-fundamentals/blob/master/webgl/resources/webgl-utils.js) 파일에 포함되어 있습니다.
좀 더 체계적인 것을 원한다면 [TWGL.js](https://twgljs.org)를 확인하세요.

다음은 [여러 사물 그리기](webgl-drawing-multiple-things.html)입니다.

<div class="webgl_bottombar">
<h3>Setter를 직접 사용할 수 있나요?</h3>
<p>JavaScript에 익숙하신 분들은 다음과 같이 setter를 직접 사용할 수 있는지 궁금하실 겁니다.</p>
<pre class="prettyprint">
// 초기화할 때
var uniformSetters = webglUtils.createUniformSetters(program);

// 그릴 때
uniformSetters.u_ambient([1, 0, 0, 1]); // 주변 색상을 빨간색으로 설정
</pre>
<p>
이게 안 좋은 이유는 GLSL로 작업할 때 가끔씩 셰이더를 수정하고 종종 디버그할 수 있기 때문입니다.
프로그램의 화면에서 아무것도 보이지 않는다고 가정해봅시다.
아무것도 나타나지 않을 때 먼저 해야할 것들 중 하나는 셰이더를 단순화하는 겁니다.
예를 들어 fragment shader를 가능한 가장 간단한 형태로 변경할 수 있습니다.
</p>
<pre class="prettyprint showlinemods">
// Fragment shader
precision mediump float;

varying vec4 v_position;
varying vec2 v_texCoord;
varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;

uniform vec4 u_lightColor;
uniform vec4 u_ambient;
uniform sampler2D u_diffuse;
uniform vec4 u_specular;
uniform float u_shininess;
uniform float u_specularFactor;

vec4 lit(float l ,float h, float m) {
  return vec4(
    1.0,
    max(l, 0.0),
    (l > 0.0) ? pow(max(0.0, h), m) : 0.0,
    1.0
  );
}

void main() {
  vec4 diffuseColor = texture2D(u_diffuse, v_texCoord);
  vec3 a_normal = normalize(v_normal);
  vec3 surfaceToLight = normalize(v_surfaceToLight);
  vec3 surfaceToView = normalize(v_surfaceToView);
  vec3 halfVector = normalize(surfaceToLight + surfaceToView);
  vec4 litR = lit(
    dot(a_normal, surfaceToLight),
    dot(a_normal, halfVector),
    u_shininess
  );
  vec4 outColor = vec4(
    (
      u_lightColor * (
        diffuseColor * litR.y +
        diffuseColor * u_ambient +
        u_specular * litR.z * u_specularFactor
      )
    ).rgb,
    diffuseColor.a
  );
  gl_FragColor = outColor;
*  gl_FragColor = vec4(0,1,0,1);  // &lt;!--- 초록색
}
</pre>
<p>
참고로 <code>gl_FragColor</code>를 상수 색상으로 설정하는 한 라인을 추가했습니다.
대부분의 드라이버는 파일의 이전 라인이 실제 결과에 기여하지 않음을 알 수 있는데요.
따라서 모든 uniform을 최적화할 겁니다.
다음에 program을 실행할 때 <code>createUniformSetters</code>를 호출하면 <code>u_ambient</code>에 대한 setter를 생성하지 않으므로 <code>uniformSetters.u_ambient()</code>를 직접 호출하는 위 코드는 실패합니다.
</p>
<pre class="prettyprint">
TypeError: undefined is not a function
</pre>
<p>
<code>setUniforms</code>는 해당 문제를 해결해주는데요.
실제로 존재하는 uniform만 설정합니다.
</p>
</div>


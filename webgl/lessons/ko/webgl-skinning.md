Title: WebGL 스키닝
Description: WebGL에서 메시를 스키닝하는 방법
TOC: 스키닝


그래픽에서 스키닝은 여러 행렬의 가중치 영향을 기반으로 정점 세트를 움직인다는 겁니다.
꽤 추상적이네요.

*스키닝*이라 불리는 이유는 일반적으로 행렬의 또 다른 이름인 "뼈"로 만든 "스켈레톤"을 가지는 3D 캐릭터를 만드는 데 사용되고 **정점마다** 각 뼈의 영향을 해당 정점에 설정하기 때문입니다.

예를 들어 손 뼈는 캐릭터의 손 근처 정점에 거의 100% 영향을 주지만 발 뼈는 해당 정점에 영향을 주지 않습니다.
손목 근처의 정점은 손 뼈와 팔 뼈의 영향만을 받습니다.

기본적인 부분으로 뼈(행렬 계층 구조)와 가중치가 필요합니다.
가중치는 0에서 1사이의 정점당 값으로 특정 뼈 행렬이 해당 정점의 위치에 얼마나 영향을 미치는지 나타냅니다.
데이터로 보면 가중치는 정점 색상과 비슷한데요.
정점당 하나의 가중치 세트입니다.
다시 말해 가중치는 버퍼에 저장되고 속성을 통해 제공됩니다.

일반적으로 데이터가 너무 많아지지 않도록 정점당 가중치를 부분적으로 제한합니다.
캐릭터는 15개(Virtua Fighter 1)에서 150-300개(최신 게임)의 뼈를 가질 수 있습니다.
300개의 뼈가 있다면 각 뼈의 정점마다 300개의 가중치가 필요합니다.
캐릭터가 10000개의 정점을 가진다면 3백만 개의 가중치가 필요하겠죠.

그래서 대부분의 실시간 스키닝 시스템은 정점당 ~4개로 가중치를 제한합니다.
일반적으로 이것은 blender/maya/3dsmax와 같은 3D 패키지에서 데이터를 가져오는 exporter/converter에서 수행되고, 각 정점에 대해 가장 높은 가중치를 가진 4개의 뼈를 찾은 다음 해당 가중치를 정규화합니다.

스킨이 없는 정점은 일반적으로 다음과 같이 계산됩니다.

    gl_Position = projection * view * model * position;

스킨이 있는 정점은 실제로 이렇게 계산됩니다.

    gl_Position = projection * view *
                  (bone1Matrix * position * weight1 +
                   bone2Matrix * position * weight2 +
                   bone3Matrix * position * weight3 +
                   bone4Matrix * position * weight4);

보시다시피 각 정점에 대해 4개의 다른 위치를 계산한 다음 가중치를 적용하여 다시 하나로 혼합한 것과 같습니다.

뼈 행렬을 유니폼 배열에 저장하고 속성을 통해 각 가중치가 적용되는 뼈를 전달한다고 가정하면 이렇게 할 수 있습니다.

    attribute vec4 a_position;
    attribute vec4 a_weights;         // 정점당 4개의 가중치
    attribute vec4 a_boneNdx;         // 정점당 4개의 뼈 인덱스
    uniform mat4 bones[MAX_BONES];    // 뼈당 1개의 행렬

    gl_Position = projection * view *
                  (bones[int(a_boneNdx[0])] * a_position * a_weight[0] +
                   bones[int(a_boneNdx[1])] * a_position * a_weight[1] +
                   bones[int(a_boneNdx[2])] * a_position * a_weight[2] +
                   boneS[int(a_boneNdx[3])] * a_position * a_weight[3]);

한 가지 문제가 더 있습니다.
발 사이 바닥에 원점 (0,0,0)이 있는 사람 모델이 있다고 가정해봅시다.

<div class="webgl_center"><img src="resources/bone-head.svg" style="width: 500px;"></div>

이제 행렬/뼈/조인트를 머리에 두고 그것들을 스키닝용으로 뼈에 사용한다고 상상해봅시다.
간단하게 말하자면 머리의 정점들이 머리 뼈에 대해 1.0의 가중치를 가지고 다른 조인트가 해당 정점에 영향을 주지 않도록 가중치를 설정했다고 상상해보세요.

<div class="webgl_center"><img src="resources/bone-head-setup.svg" style="width: 500px;"></div>

한 가지 문제가 있습니다.
머리 정점들은 원점보다 2유닛 위에 있습니다.
머리뼈도 원점보다 2유닛 위에 있는데요.
실제로 이러한 머리 정점들을 머리뼈 행렬로 곱한다면 정점들은 원점보다 4유닛 위에 있게 됩니다.
(원본 정점의 2유닛 + 머리뼈 행렬의 2유닛)

<div class="webgl_center"><img src="resources/bone-head-problem.svg" style="width: 500px;"></div>

해결책은 정점에 영향을 주도록 사용하기 전에 각 행렬이 있던 조인트마다 추가 행렬인 "바인드 포즈"를 저장하는 겁니다.
이 경우 머리 행렬의 바인드 포즈는 원점보다 2유닛 위에 있습니다.
따라서 이제 역행렬을 사용하여 남은 2유닛을 뺄 수 있습니다.

다시 말해 셰이더에 전달된 뼈 행렬은 각각 역바인드 포즈로 곱해져서 메시의 원점을 기준으로 원래의 위치에서 얼마나 변경되는지에만 영향을 줍니다.

작은 예제를 하나 만들어봅시다.
이렇게 2D 그리드에서 애니메이션을 수행할 겁니다.

<div class="webgl_center"><img src="resources/skinned-mesh.svg" style="width: 400px;"></div>

* 여기서 `b0`, `b1`, `b2`은 뼈 행렬입니다.
* `b1`는 `b0`의 자식이고 `b2`는 `b1`의 자식입니다.
* 정점 `0,1`은 뼈 b0에서 1.0의 가중치를 얻습니다.
* 정점 `2,3`은 뼈 b0과 b1에서 0.5의 가중치를 얻습니다.
* 정점 `4,5`는 뼈 b1에서 1.0의 가중치를 얻습니다.
* 정점 `6,7`은 뼈 b1과 b2에서 0.5의 가중치를 얻습니다.
* 정점 `8,9`는 뼈 b2에서 1.0의 가중치를 얻습니다.

[Less code more fun](webgl-less-code-more-fun.html)에서 설명한 유틸들을 사용할 겁니다.

먼저 정점들과 각 정점에 대해 영향을 미치는 각 뼈의 인덱스 그리고 해당 뼈가 얼마나 영향을 주는지에 대한 0에서 1사이의 숫자가 필요합니다.

```
var arrays = {
  position: {
    numComponents: 2,
    data: [
     0,  1,  // 0
     0, -1,  // 1
     2,  1,  // 2
     2, -1,  // 3
     4,  1,  // 4
     4, -1,  // 5
     6,  1,  // 6
     6, -1,  // 7
     8,  1,  // 8
     8, -1,  // 9
    ],
  },
  boneNdx: {
    numComponents: 4,
    data: [
      0, 0, 0, 0,  // 0
      0, 0, 0, 0,  // 1
      0, 1, 0, 0,  // 2
      0, 1, 0, 0,  // 3
      1, 0, 0, 0,  // 4
      1, 0, 0, 0,  // 5
      1, 2, 0, 0,  // 6
      1, 2, 0, 0,  // 7
      2, 0, 0, 0,  // 8
      2, 0, 0, 0,  // 9
    ],
  },
  weight: {
    numComponents: 4,
    data: [
     1, 0, 0, 0,  // 0
     1, 0, 0, 0,  // 1
    .5,.5, 0, 0,  // 2
    .5,.5, 0, 0,  // 3
     1, 0, 0, 0,  // 4
     1, 0, 0, 0,  // 5
    .5,.5, 0, 0,  // 6
    .5,.5, 0, 0,  // 7
     1, 0, 0, 0,  // 8
     1, 0, 0, 0,  // 9
    ],
  },

  indices: {
    numComponents: 2,
    data: [
      0, 1,
      0, 2,
      1, 3,
      2, 3, //
      2, 4,
      3, 5,
      4, 5,
      4, 6,
      5, 7, //
      6, 7,
      6, 8,
      7, 9,
      8, 9,
    ],
  },
};
// gl.createBuffer, gl.bindBuffer, gl.bufferData 호출
var bufferInfo = webglUtils.createBufferInfoFromArrays(gl, arrays);
```

각 뼈에 대한 행렬을 포함하여 유니폼 값을 정의할 수 있습니다.

```
// 각 뼈 하나당 4개의 행렬
var numBones = 4;
var boneArray = new Float32Array(numBones * 16);

var uniforms = {
  projection: m4.orthographic(-20, 20, -10, 10, -1, 1),
  view: m4.translation(-6, 0, 0),
  bones: boneArray,
  color: [1, 0, 0, 1],
};
```

각 행렬에 하나씩, boneArray에 대한 뷰를 만들 수 있습니다.

```
// 각 뼈에 대한 뷰를 만듭니다.
// 업로드를 위해 모든 뼈가 한 배열에 존재하지만 수학 함수와 함께 사용하기 위해 별도의 배열일 수도 있습니다.
var boneMatrices = [];  // 유니폼 데이터
var bones = [];         // 바인드 역행렬로 곱하기 전의 값
var bindPose = [];      // 바인드 행렬
for (var i = 0; i < numBones; ++i) {
  boneMatrices.push(new Float32Array(boneArray.buffer, i * 4 * 16, 16));
  bindPose.push(m4.identity());  // 저장 공간 할당
  bones.push(m4.identity());     // 저장 공간 할당
}
```

그런 다음 뼈 행렬을 조작하는 코드를 작성합니다.
손가락 뼈와 같은 계층 구조로 회전할 겁니다.

```
// 각 뼈를 일정 각도로 회전하고 계층 구조를 시뮬레이션
function computeBoneMatrices(bones, angle) {
  var m = m4.identity();
  m4.zRotate(m, angle, bones[0]);
  m4.translate(bones[0], 4, 0, 0, m);
  m4.zRotate(m, angle, bones[1]);
  m4.translate(bones[1], 4, 0, 0, m);
  m4.zRotate(m, angle, bones[2]);
  // bones[3] is not used
}
```

이제 한 번 호출하여 초기 위치를 생성하고 결과를 사용하여 바인드 포즈 역행렬을 계산합니다.

```
// 각 행렬의 초기 위치 계산
computeBoneMatrices(bindPose, 0);

// 역행렬 계산
var bindPoseInv = bindPose.map(function(m) {
  return m4.inverse(m);
});
```

이제 렌더링할 준비가 됐습니다.

먼저 뼈에 애니메이션을 적용하여 각각에 대한 새로운 월드 행렬을 계산합니다.

```
var t = time * 0.001;
var angle = Math.sin(t) * 0.8;
computeBoneMatrices(bones, angle);
```

그런 다음 위에서 언급한 문제를 처리하기 위해 각 결과에 역바인드 포즈를 곱합니다.

```
// 각각을 bindPoseInverse로 곱하기
bones.forEach(function(bone, ndx) {
  m4.multiply(bone, bindPoseInv[ndx], boneMatrices[ndx]);
});
```

그리고 모든 기본 작업, 속성 설정, 유니폼 설정을 하고 그립니다.

```
gl.useProgram(programInfo.program);
// gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer 호출
webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);

// gl.uniformXXX, gl.activeTexture, gl.bindTexture 호출
webglUtils.setUniforms(programInfo, uniforms);

// gl.drawArrays or gl.drawIndices 호출
webglUtils.drawBufferInfo(gl, bufferInfo, gl.LINES);
```

그리고 여기 결과입니다.

{{{example url="../webgl-skinning.html" }}}

빨간색 선은 *스킨이 적용된 메시*입니다.
초록색과 파란색 선은 각 "뼈" 혹은 "조인트"의 x축과 y축을 나타냅니다.
여러 뼈의 영향을 받는 정점들이 그 뼈들 사이에서 어떻게 움직이는지 볼 수 있습니다.
스키닝이 어떻게 작동하는지 설명하는 데에 중요하지 않기 때문에 뼈를 그리는 방법은 다루지 않았습니다.
궁금하다면 코드를 봐주세요.

참고: 뼈와 조인트가 헷갈립니다.
여기에는 단 한 가지 행렬밖에 없습니다.
하지만 3D 모델링 패키지에서는 일반적으로 각 행렬 사이에 gizmo(UI 위젯)을 그리는데요.
그 모습은 결국 뼈처럼 보입니다.
조인트는 행렬이 있는 위치이며 각 조인트에서 다음 조인트까지 선이나 원뿔을 그리기 때문에 일종의 스켈레톤처럼 보이는 겁니다.

<div class="webgl_center">
  <img src="resources/bone-display.png" style="width: 351px;">
  <div class="caption"><a href="https://www.blendswap.com/user/TiZeta">TiZeta</a>의 <a href="https://www.blendswap.com/blends/view/66412">LowPoly Man</a></div>
</div>

또 다른 참고 사항으로, 위 예제는 가중치와 뼈 인덱스에 부동 소수점을 사용하지만 `UNSIGNED_BYTE`를 사용하여 공간을 절약할 수 있다는 겁니다.

안타깝게도 셰이더에서 사용할 수 있는 유니폼 수는 제한되어 있습니다.
WebGL의 하한선은 vec4 64개로 mat4 8개에 불과하며, 프래그먼트 셰이더의 `color`와 `projection` 그리고 `view`와 같은 다른 작업을 위해 이러한 유니폼이 필요할 수 있는데, vec4 제한이 64개인 기기에서는 5개의 뼈만 가질 수 있습니다!
[WebGLStats](https://webglstats.com/webgl/parameter/MAX_VERTEX_UNIFORM_VECTORS)를 확인해보면 대부분의 기기들이 128개의 vec4를 지원하고 그 중 70%는 256개의 vec4를 지원하지만 여전히 각각 13개의 뼈와 29개의 뼈에 불과합니다.
13개는 90년대 초 Virtua Fighter 1 캐릭터에도 충분하지 않으며 29개는 최신 게임에 사용되는 수에 근접하지 않습니다.

이를 해결하기 위한 몇 가지 방법이 있는데요.
하나는 오프라인으로 모델을 사전 처리하고 N개 이상의 뼈를 사용하지 않도록 여러 부분으로 나누는 겁니다.
이는 꽤 복잡하고 자체적인 문제를 야기합니다.

또 다른 방법은 텍스처에 뼈 행렬을 저장하는 겁니다.
텍스처가 단순한 이미지가 아니라 사실상 셰이더에 전달할 수 있는 무작위 접근 데이터의 2D 배열이며 텍스처용 이미지를 읽는 것뿐 아니라 모든 종류의 작업에 사용할 수 있습니다.

유니폼의 한계를 우회하기 위해 텍스처에 행렬을 전달해봅시다.
이걸 쉽게 만들기 위해 부동 소수점 텍스처를 사용할 겁니다.
부동 소수점 텍스처는 WebGL의 선택적 기능이지만 다행히 대부분의 기기에서 지원됩니다.

다음은 확장 프로그램을 가져오는 코드입니다.
실패하면 사용자에게 알리거나 다른 선택지를 선택하도록 할 겁니다.

```
var ext = gl.getExtension('OES_texture_float');
if (!ext) {
  return;  // 이 기기에는 확장 프로그램이 없음
}
```

셰이더를 업데이트하여 텍스처에서 행렬을 가져와봅시다.
행당 하나의 행렬을 갖는 텍스처를 만들 겁니다.
텍스처의 각 텍셀은 R, G, B, A를 가지고, 이는 4개의 값이므로 행렬당 4픽셀, 행렬의 행당 1픽셀만 필요합니다.
일반적으로 텍스처는 특정 차원에서 최소 2048픽셀일 수 있으므로, 최소 2048개의 뼈 행렬을 위한 충분한 공간을 제공합니다.

```
attribute vec4 a_position;
attribute vec4 a_weight;
attribute vec4 a_boneNdx;

uniform mat4 projection;
uniform mat4 view;
*uniform sampler2D boneMatrixTexture;
*uniform float numBones;

+// 이러한 오프셋은 텍스처가 가로로 4픽셀이라 가정합니다.
+#define ROW0_U ((0.5 + 0.0) / 4.)
+#define ROW1_U ((0.5 + 1.0) / 4.)
+#define ROW2_U ((0.5 + 2.0) / 4.)
+#define ROW3_U ((0.5 + 3.0) / 4.)
+
+mat4 getBoneMatrix(float boneNdx) {
+  float v = (boneNdx + 0.5) / numBones;
+  return mat4(
+    texture2D(boneMatrixTexture, vec2(ROW0_U, v)),
+    texture2D(boneMatrixTexture, vec2(ROW1_U, v)),
+    texture2D(boneMatrixTexture, vec2(ROW2_U, v)),
+    texture2D(boneMatrixTexture, vec2(ROW3_U, v)));
+}

void main() {

  gl_Position = projection * view *
*                (getBoneMatrix(a_boneNdx[0]) * a_position * a_weight[0] +
*                 getBoneMatrix(a_boneNdx[1]) * a_position * a_weight[1] +
*                 getBoneMatrix(a_boneNdx[2]) * a_position * a_weight[2] +
*                 getBoneMatrix(a_boneNdx[3]) * a_position * a_weight[3]);

}
```

<a id="texel-coords"></a>
한 가지 주목해야 할 점은 텍스처나 텍셀의 픽셀에 대한 텍스처가 좌표가 가장자리에서 계산된다는 겁니다.
[텍스처에 대한 글](webgl-3d-textures.html)에서 살펴봤듯이 텍스처 좌표는 가로로 0에서 1사이가 됩니다.
이는 왼쪽 가장자리가 0이고 오른쪽 가장자리가 1임을 뜻합니다.
3픽셀 너비의 텍스처가 있다면 다음과 같습니다.

<div class="webgl_center"><img src="resources/texel-coords.svg" style="width: 400px;"></div>

특정 픽셀을 찾고 싶으면 이런 공식을 사용할 수 있습니다.

     (x + .5) / width

위의 공식을 각 픽셀에 대입하면 다음과 같습니다.

     (0 + .5) / 3  = 0.166
     (1 + .5) / 3 =  0.5
     (2 + .5) / 3 =  0.833

<div class="webgl_center"><img src="resources/texel-coords-middle.svg" style="width: 400px;"></div>

이제 뼈 행렬을 넣을 수 있는 텍스처를 설정할 겁니다.

```
// 뼈 행렬용 텍스처 준비
var boneMatrixTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, boneMatrixTexture);
// 순수한 데이터로 텍스처를 사용하고 싶기 때문에 필터링 끄기
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
// 텍스처가 2의 거듭 제곱이 아닐 수도 있으므로 래핑도 끄기
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
```

그리고 해당 텍스처와 뼈의 개수를 유니폼에 전달할 겁니다.

```
var uniforms = {
  projection: m4.orthographic(-20, 20, -10, 10, -1, 1),
  view: m4.translation(-6, 0, 0),
*  boneMatrixTexture,
*  numBones,
  color: [1, 0, 0, 1],
};
```

변경해야 할 사항은 렌더링할 때 최신 뼈 행렬로 텍스처를 업데이트하는 것 뿐입니다.

```
// 현재 행렬로 텍스처 업데이트
gl.bindTexture(gl.TEXTURE_2D, boneMatrixTexture);
gl.texImage2D(
    gl.TEXTURE_2D,
    0,         // 레벨
    gl.RGBA,   // 내부 포맷
    4,         // 너비 4픽셀, 각 픽셀은 RGBA를 가지므로 4픽셀은 16개의 값
    numBones,  // 뼈당 하나의 행
    0,         // 테두리
    gl.RGBA,   // 포맷
    gl.FLOAT,  // 타입
    boneArray);
```

결과는 동일하지만 유니폼을 통해 행렬을 전달할 유니폼이 충분하지 않은 문제를 해결했습니다.

{{{example url="../webgl-skinning-bone-matrices-in-texture.html" }}}

이게 스키닝의 기초입니다.
스킨이 적용된 메시를 표시하는 코드를 작성하는 것은 그리 어렵지 않습니다.
더 어려운 부분은 실제로 데이터를 얻는 부분입니다.
일반적으로 blender/maya/3d studio max와 같은 3D 소프트웨어가 필요하며, 자체적인 내보내기 도구를 작성하거나 필요한 데이터를 모두 제공하는 내보내기 도구와 포맷을 찾아야 합니다.
You'll see as we go over it that there is 10x more code in loading a skin than there is in displaying it and that doesn't include the probably 20-30x more code in the exporter to get the data out of the 3D modeling program.
이것은 사람들이 자체 3D 엔진을 작성할 때 자주 놓치는 것 중 하나입니다.
엔진은 쉬운 부분이에요 😜

많은 코드가 있을 것이기 때문에 먼저 스킨이 적용되지 않은 모델을 표시해봅시다.

우선 glTF 파일을 로딩할 겁니다.
WebGL용으로 설계된 [glTF](https://www.khronos.org/gltf/)의 일종인데요.
인터넷 검색을 하다가 [Junskie Pastilan](https://www.blendswap.com/user/pasilan)의 [범고래 블렌더 파일](https://www.blendswap.com/blends/view/65255)을 찾았습니다.

<div class="webgl_center"><img src="../resources/models/killer_whale/thumbnail.jpg"></div>

glTF에는 2개의 최상위 포맷이 있습니다.
`.gltf` 포맷은 일반적으로 지오메트리와 애니메이션 데이터를 포함하는 이진 파일인 `.bin` 파일을 참조하는 JSON 파일입니다.
다른 포맷은 이진 포맷인 `.glb` 포맷입니다.
기본적으로 JSON과 다른 모든 파일들이 짧은 헤더와 연결된 각 조각 사이의 크기/타입 섹션과 함께 하나의 이진 파일로 연결되어 있습니다.
자바스크립트의 경우 `.gltf` 포맷이 시작하기 약간 더 쉬운 것 같아서 로드해보겠습니다.

먼저 [.blend 파일](https://www.blendswap.com/blends/view/65255)을 다운로드받고, [blender](https://blender.org)와 [gltf exporter](https://github.com/KhronosGroup/glTF-Blender-IO)를 설치한 다음, 블렌더에서 해당 파일을 로드하고 내보냅니다.

<div class="webgl_center"><img src="resources/blender-killer-whale.png" style="width: 700px;" class="nobg"></div>

> 참고: Blender, Maya, 3DSMax와 같은 3D 소프트웨어는 1000가지 옵션이 있는 엄청나게 복잡한 소프트웨어입니다.
> 1996년에 처음 3DSMax를 배웠을 때 1000페이지가 넘는 메뉴얼을 읽고 약 3주 동안 튜토리얼을 작업하며 하루 2-3시간을 보냈는데요.
> 몇 년 후 Maya를 배울 때도 비슷했습니다.
> 블렌더는 복잡할 뿐 아니라 다른 소프트웨어들과 굉장히 다른 인터페이스를 가지고 있었습니다.
> 사용하기로 결정한 3D 패키지를 배우는 데에는 상단한 시간이 소요된다는 걸 말씀드리고 싶습니다.

내보낸 후 .gltf 파일을 텍스트 에디터에 로드하고 둘러봤습니다.
저는 이 [가이드](https://www.khronos.org/files/gltf20-reference-guide.pdf)를 사용하여 포맷을 알아냈습니다.

아래 코드가 완벽한 glTF 로더가 아님을 분명히 하고 싶습니다.
이는 고래를 표시하기 위한 코드일 뿐입니다.
다른 파일을 시도한다면 변경해야 하는 영역이 있지 않을까 생각합니다.

먼저 해야할 일은 파일을 로드하는 겁니다.
더 간단하게 만들기 위해 자바스크립트의 [async/await](https://javascript.info/async-await)를 사용해봅시다.
먼저 `.gltf` 파일과 이 파일이 참조하는 모든 파일을 로드하는 코드를 작성해보겠습니다.

```
async function loadGLTF(url) {
  const gltf = await loadJSON(url);

  // gltf 파일과 관련된 모든 참조 파일을 로드
  const baseURL = new URL(url, location.href);
  gltf.buffers = await Promise.all(gltf.buffers.map((buffer) => {
    const url = new URL(buffer.uri, baseURL.href);
    return loadBinary(url.href);
  }));

  ...

async function loadFile(url, typeFunc) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`could not load: ${url}`);
  }
  return await response[typeFunc]();
}

async function loadBinary(url) {
  return loadFile(url, 'arrayBuffer');
}

async function loadJSON(url) {
  return loadFile(url, 'json');
}
```

이제 데이터를 살펴보고 연결해야 합니다.

먼저 glTF가 메시로 간주하는 것을 처리해봅시다.
메시는 프리미티브의 모음입니다.
프리미티브는 실제로 무언가를 렌더링하는 데 필요한 버퍼와 속성인데요.
[Less code more fun](webgl-less-code-more-fun.html)에서 다룬 webgl 유틸리티를 사용해봅시다.
메시를 살펴보고 각 메시에 대해 `webglUtils.setBuffersAndAttributes`에 전달할 수 있는 `BufferInfo`를 빌드합니다.
`BufferInfo`는 사실상 속성 정보, 인덱스, `gl.drawXXX`에 전달할 요소의 수임을 기억하세요.
예를 들어 위치와 법선만 있는 큐브는 이런 구조의 BufferInfo를 가질 수 있습니다.

```
const cubeBufferInfo = {
  attribs: {
    'a_POSITION': { buffer: WebGLBuffer, type: gl.FLOAT, numComponents: 3, },
    'a_NORMAL': { buffer: WebGLBuffer, type: gl.FLOAT, numComponents: 3, },
  },
  numElements: 24,
  indices: WebGLBuffer,
  elementType: gl.UNSIGNED_SHORT,
}
```

따라서 우리는 각 프리미티브를 살펴보고 이와 같은 BufferInfo를 생성할 겁니다.

프리미티브는 속성 배열을 가지고, 각 속성은 접근자를 참조합니다.
접근자는 `VEC3`/`gl.FLOAT`처럼 어떤 종류의 데이터가 있는지 알려주고 bufferView를 참조합니다.
접근자 인덱스가 주어지면 로드된 데이터, 접근자, bufferView에 대해 지정된 스트라이드와 함께 WebGLBuffer를 반환하는 코드를 작성할 수 있습니다.

```
// 접근자 인덱스가 주어지면 접근자, WebGLBuffer, 스트라이드 반환
function getAccessorAndWebGLBuffer(gl, gltf, accessorIndex) {
  const accessor = gltf.accessors[accessorIndex];
  const bufferView = gltf.bufferViews[accessor.bufferView];
  if (!bufferView.webglBuffer) {
    const buffer = gl.createBuffer();
    const target = bufferView.target || gl.ARRAY_BUFFER;
    const arrayBuffer = gltf.buffers[bufferView.buffer];
    const data = new Uint8Array(arrayBuffer, bufferView.byteOffset, bufferView.byteLength);
    gl.bindBuffer(target, buffer);
    gl.bufferData(target, data, gl.STATIC_DRAW);
    bufferView.webglBuffer = buffer;
  }
  return {
    accessor,
    buffer: bufferView.webglBuffer,
    stride: bufferView.stride || 0,
  };
}
```

또한 glTF 접근자 타입에서 컴포넌트 개수로 변환하는 방법이 필요합니다.

```
function throwNoKey(key) {
  throw new Error(`no key: ${key}`);
}

const accessorTypeToNumComponentsMap = {
  'SCALAR': 1,
  'VEC2': 2,
  'VEC3': 3,
  'VEC4': 4,
  'MAT2': 4,
  'MAT3': 9,
  'MAT4': 16,
};

function accessorTypeToNumComponents(type) {
  return accessorTypeToNumComponentsMap[type] || throwNoKey(type);
}
```

이제 함수를 만들었으니 이를 사용하여 메시를 설정할 수 있습니다.

참고: glTF 파일은 머티리얼을 정의할 수 있지만 내보내기 도구는 머티리얼을 확인했어도 파일에 넣지 않았습니다.
이는 내보내기 도구가 모든 종류의 블렌더 머티리얼을 처리하진 않기 때문인데요.
파일에 머티리얼이 없으면 기본 머티리얼을 사용할 겁니다.
이 파일에는 머티리얼이 없기 때문에 여기에 glTF 머티리얼을 사용하는 코드는 없습니다.

```
const defaultMaterial = {
  uniforms: {
    u_diffuse: [.5, .8, 1, 1],
  },
};

// 메시 설정
gltf.meshes.forEach((mesh) => {
  mesh.primitives.forEach((primitive) => {
    const attribs = {};
    let numElements;
    for (const [attribName, index] of Object.entries(primitive.attributes)) {
      const {accessor, buffer, stride} = getAccessorAndWebGLBuffer(gl, gltf, index);
      numElements = accessor.count;
      attribs[`a_${attribName}`] = {
        buffer,
        type: accessor.componentType,
        numComponents: accessorTypeToNumComponents(accessor.type),
        stride,
        offset: accessor.byteOffset | 0,
      };
    }

    const bufferInfo = {
      attribs,
      numElements,
    };

    if (primitive.indices !== undefined) {
      const {accessor, buffer} = getAccessorAndWebGLBuffer(gl, gltf, primitive.indices);
      bufferInfo.numElements = accessor.count;
      bufferInfo.indices = buffer;
      bufferInfo.elementType = accessor.componentType;
    }

    primitive.bufferInfo = bufferInfo;

    // 이 프리미티브의 머티리얼 정보 저장
    primitive.material = gltf.materials && gltf.materials[primitive.material] || defaultMaterial;
  });
});
```

이제 각 프리미티브에는 `bufferInfo`와 `material` 속성이 있습니다.

스키닝에 대해 거의 항상 어떤 종류의 장면 그래프가 필요한데요.
[장면 그래프에 대한 글](webgl-scene-graph.html)에서 만든 장면 그래프를 사용합시다.

```
class TRS {
  constructor(position = [0, 0, 0], rotation = [0, 0, 0, 1], scale = [1, 1, 1]) {
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
  }
  getMatrix(dst) {
    dst = dst || new Float32Array(16);
    m4.compose(this.position, this.rotation, this.scale, dst);
    return dst;
  }
}

class Node {
  constructor(source, name) {
    this.name = name;
    this.source = source;
    this.parent = null;
    this.children = [];
    this.localMatrix = m4.identity();
    this.worldMatrix = m4.identity();
    this.drawables = [];
  }
  setParent(parent) {
    if (this.parent) {
      this.parent._removeChild(this);
      this.parent = null;
    }
    if (parent) {
      parent._addChild(this);
      this.parent = parent;
    }
  }
  updateWorldMatrix(parentWorldMatrix) {
    const source = this.source;
    if (source) {
      source.getMatrix(this.localMatrix);
    }

    if (parentWorldMatrix) {
      // 행렬이 전달되었으니 수식 수행
      m4.multiply(parentWorldMatrix, this.localMatrix, this.worldMatrix);
    } else {
      // 행렬이 전달되지 않았기 때문에 `localMatrix`를 `worldMatrix`로 복사
      m4.copy(this.localMatrix, this.worldMatrix);
    }

    // 모든 `children` 처리
    const worldMatrix = this.worldMatrix;
    for (const child of this.children) {
      child.updateWorldMatrix(worldMatrix);
    }
  }
  traverse(fn) {
    fn(this);
    for (const child of this.children) {
      child.traverse(fn);
    }
  }
  _addChild(child) {
    this.children.push(child);
  }
  _removeChild(child) {
    const ndx = this.children.indexOf(child);
    this.children.splice(ndx, 1);
  }
}
```

[장면 그래프 글](webgl-scene-graph.html)의 코드에서 몇 가지 주목할 만한 변경 사항이 있습니다.

* 이 코드는 ES6의 `class` 기능을 사용합니다.

  클래스를 정의하는 이전 스타일보다 `class` 문법을 사용하는 게 훨씬 좋습니다.

* `Node`에 `drawables` 배열을 추가했습니다.

  이 노드에서 그릴 항목들이 나열됩니다.
  실제 그리기를 담당하는 클래스의 인스턴스를 리스트에 넣습니다.
  이 방법으로 다른 클래스를 사용하여 다른 것들을 그릴 수 있습니다.

  참고: 노드에 `drawables` 배열을 넣는 게 최선의 결정인지는 확실하지 않습니다.
  장면 그래프 자체에는 `drawables`가 전혀 포함되면 안 된다고 생각합니다.
  그려야 하는 항목은 대신에 데이터를 가져올 그래프에서 노드를 참조할 수 있습니다.
  그래프에서 `drawables`를 사용하는 게 일반적인 방법이기 때문에 이 방법으로 시작하겠습니다.

* `traverse` 메소드를 추가했습니다.

  현재 노드를 전달하는 함수를 호출한 다음 모든 자식 노드에 대해 동일한 작업을 재귀적으로 수행합니다.

* `TRS` 클래스는 회전에 사원수을 사용하고 있습니다.

  사원수에 대해 다루지 않았으며 솔직히 그걸 설명할 만큼 충분히 이해하고 있지 않다고 생각합니다.
  다행히도 이를 사용하기 위해 어떻게 동작하는지 알 필요는 없는데요.
  그냥 gltf 파일에서 데이터를 가져와 해당 데이터에서 행렬을 빌드하는 함수를 호출하고 행렬을 사용하면 됩니다.

glTF 파일의 노드는 플랫 배열로 저장됩니다.
glTF의 노드 데이터를 `Node` 인스턴스로 변환합니다.
나중에 필요하기 때문에 노드 데이터의 이전 배열을 `origNodes`로 저장해둡니다.

```
const origNodes = gltf.nodes;
gltf.nodes = gltf.nodes.map((n) => {
  const {name, skin, mesh, translation, rotation, scale} = n;
  const trs = new TRS(translation, rotation, scale);
  const node = new Node(trs, name);
  const realMesh =　gltf.meshes[mesh];
  if (realMesh) {
    node.drawables.push(new MeshRenderer(realMesh));
  }
  return node;
});
```

위에서 각 노드에 대한 `TRS` 인스턴스, 각 노드에 대한 `Node` 인스턴스를 만들고, `mesh` 속성이 있는 경우 이전에 설정한 메시 데이터를 찾아, `MeshRenderer`를 생성하여 그립니다.

`MeshRenderer`를 만들어봅시다.
단일 모델을 렌더링하기 위해 [less code more fun](webgl-less-code-more-fun.html)에서 사용한 코드를 캡슐화한 것 뿐입니다.
메시에 대한 참조를 유지하고, 각 프리미티브에 프로그램, 속성, 유니폼을 설정한 다음, 마지막으로 `webglUtils.drawBufferInfo`를 통해 `gl.drawArrays`나 `gl.drawElements`를 호출합니다.

```
class MeshRenderer {
  constructor(mesh) {
    this.mesh = mesh;
  }
  render(node, projection, view, sharedUniforms) {
    const {mesh} = this;
    gl.useProgram(meshProgramInfo.program);
    for (const primitive of mesh.primitives) {
      webglUtils.setBuffersAndAttributes(gl, meshProgramInfo, primitive.bufferInfo);
      webglUtils.setUniforms(meshProgramInfo, {
        u_projection: projection,
        u_view: view,
        u_world: node.worldMatrix,
      });
      webglUtils.setUniforms(meshProgramInfo, primitive.material.uniforms);
      webglUtils.setUniforms(meshProgramInfo, sharedUniforms);
      webglUtils.drawBufferInfo(gl, primitive.bufferInfo);
    }
  }
}
```

노드를 만들었으니, 이제 실제로 장면 그래프에 배열해야 합니다.
이건 glTF의 2단계에서 수행됩니다.
먼저 각 노드는 노드 배열의 인덱스이기도 한 선택적 자식 배열이 있으므로, 모든 노드를 탐색하고 자식들의 부모를 설정할 수 있습니다.

```
function addChildren(nodes, node, childIndices) {
  childIndices.forEach((childNdx) => {
    const child = nodes[childNdx];
    child.setParent(node);
  });
}

// 노드를 그래프에 배열
gltf.nodes.forEach((node, ndx) => {
  const children = origNodes[ndx].children;
  if (children) {
    addChildren(gltf.nodes, node, children);
  }
});
```

그리고 장면 배열이 있습니다.
장면은 장면의 맨 아래에 있는 노드 배열의 인덱스로 노드 배열을 참조합니다.
단일 루트 노드로 시작하지 않은 이유는 확실하지 않지만, glTF 파일에 있는 내용이므로 루트 노드를 만들고 해당 노드를 장면의 모든 자식에 대한 부모로 만듭니다.

```
  // 장면 설정
  for (const scene of gltf.scenes) {
    scene.root = new Node(new TRS(), scene.name);
    addChildren(gltf.nodes, scene.root, scene.nodes);
  }

  return gltf;
}
```

그리고 최소한의 메시만 로드하면 됩니다.
`await` 키워드를 사용할 수 있도록 `main` 함수를 `async`로 표시해봅시다.

```
async function main() {
```

그리고 이렇게 gltf 파일을 로드할 수 있습니다.

```
const gltf = await loadGLTF('resources/models/killer_whale/whale.CYCLES.gltf');
```

렌더링을 위해 gltf 파일의 데이터와 일치하는 셰이더가 필요합니다.
gltf 파일에 있는 프리미티브 데이터를 살펴보겠습니다.

```
{
    "name" : "orca",
    "primitives" : [
        {
            "attributes" : {
                "JOINTS_0" : 5,
                "NORMAL" : 2,
                "POSITION" : 1,
                "TANGENT" : 3,
                "TEXCOORD_0" : 4,
                "WEIGHTS_0" : 6
            },
            "indices" : 0
        }
    ]
}
```

렌더링을 위해 `NORMAL`과 `POSITION`만 사용해봅시다.
정점 셰이더가 작동하도록 각 속성 앞에 `a_`를 추가했습니다.

```
attribute vec4 a_POSITION;
attribute vec3 a_NORMAL;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

varying vec3 v_normal;

void main() {
  gl_Position = u_projection * u_view * u_world * a_POSITION;
  v_normal = mat3(u_world) * a_NORMAL;
}
```

그리고 프래그먼트 셰이더의 경우 간단한 방향성 조명을 사용하겠습니다.

```
precision mediump float;

varying vec3 v_normal;

uniform vec4 u_diffuse;
uniform vec3 u_lightDirection;

void main () {
  vec3 normal = normalize(v_normal);
  float light = dot(u_lightDirection, normal) * .5 + .5;
  gl_FragColor = vec4(u_diffuse.rgb * light, u_diffuse.a);
}
```

[방향성 조명에 대한 글](webgl-3d-lighting-directional.html)에서 다뤘던 것처럼 스칼라곱을 취하지만 여기서는 스칼라곱에 0.5를 곱하고 0.5를 더합니다.
정상적인 방향성 조명의 경우 표면이 빛을 직접 마주볼 때 100% 빛나며, 표면이 빛에 수직일 때 0%로 줄어듭니다.
즉 빛을 마주하지 않는 전체 모델의 1/2이 검정색입니다.
0.5로 곱하고 0.5를 더함으로써 스칼라곱은 -1 &lt;-&gt; 1에서  0 &lt;-&gt; 1이 되며, 완전히 반대 방향을 바라볼 때 검정색이 됩니다.
이는 간단한 테스트를 위한 값싸면서 만족스러운 조명을 제공합니다.

따라서 셰이더를 컴파일하고 연결해야 합니다.

```
// 셰이더를 컴파일하고 연결한 다음, 속성과 유니폼의 위치 탐색
const meshProgramInfo = webglUtils.createProgramInfo(gl, ["meshVS", "fs"]);
```

그런 다음 이전과 다른 모든 부분을 렌더링합니다.

```
const sharedUniforms = {
  u_lightDirection: m4.normalize([-1, 3, 5]),
};

function renderDrawables(node) {
  for(const drawable of node.drawables) {
      drawable.render(node, projection, view, sharedUniforms);
  }
}

for (const scene of gltf.scenes) {
  // `scene`의 모든 `worldMatrix` 업데이트
  scene.root.updateWorldMatrix();
  // `scene`을 탐색하여 모든 `renderables` 렌더링
  scene.root.traverse(renderDrawables);
}
```

기존(위에서 표시되지 않음)의 코드에서 남은 것은 투영 행렬, 카메라 행렬, 뷰 행렬을 계산하는 코드입니다.
각 장면을 탐색하고 `scene.root.updateWorldMatrix`를 호출하여 그래프에 있는 모든 노드의 월드 행렬을 업데이트합니다.
그런 다음 `renderDrawables`와 함께 `scene.root.traverse`를 호출합니다.

`renderDrawables`는 `sharedUniforms`를 통해 투영, 뷰, 조명 정보를 전달하는 해당 노드에 대한 모든 `drawables`의 렌더링 메소드를 호출합니다.

{{{example url="../webgl-skinning-3d-gltf.html" }}}

이제 작업이 됐으니 스킨을 처리해봅시다.

먼저 스킨을 나타내는 클래스를 만들어 보겠습니다.
스킨에 적용되는 장면 그래프의 노드에 대한 또 다른 단어인 조인트 목록을 관리할 겁니다.
또한 바인드 역행렬을 가지며 조인트 행렬을 넣은 텍스처를 관리합니다.

```
class Skin {
  constructor(joints, inverseBindMatrixData) {
    this.joints = joints;
    this.inverseBindMatrices = [];
    this.jointMatrices = [];
    // 조인트당 하나의 행렬에 충분한 공간 할당
    this.jointData = new Float32Array(joints.length * 16);
    // 각 joint와 inverseBindMatrix에 대한 뷰 생성
    for (let i = 0; i < joints.length; ++i) {
      this.inverseBindMatrices.push(new Float32Array(
          inverseBindMatrixData.buffer,
          inverseBindMatrixData.byteOffset + Float32Array.BYTES_PER_ELEMENT * 16 * i,
          16));
      this.jointMatrices.push(new Float32Array(
          this.jointData.buffer,
          Float32Array.BYTES_PER_ELEMENT * 16 * i,
          16));
    }
    // 조인트 행렬을 유지하는 텍스처 생성
    this.jointTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.jointTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  update(node) {
    const globalWorldInverse = m4.inverse(node.worldMatrix);
    // 각 조인트를 통해 현재 worldMatrix 구하기
    // 바인드 역행렬을 적용하고 전체 결과를 텍스처에 저장
    for (let j = 0; j < this.joints.length; ++j) {
      const joint = this.joints[j];
      const dst = this.jointMatrices[j];
      m4.multiply(globalWorldInverse, joint.worldMatrix, dst);
      m4.multiply(dst, this.inverseBindMatrices[j], dst);
    }
    gl.bindTexture(gl.TEXTURE_2D, this.jointTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 4, this.joints.length, 0,
                  gl.RGBA, gl.FLOAT, this.jointData);
  }
}
```

`MeshRenderer`가 있는 것처럼 스킨이 있는 메시를 렌더링하기 위해 `Skin`을 사용하여 `SkinRenderer`를 만들어 보겠습니다.

```
class SkinRenderer {
  constructor(mesh, skin) {
    this.mesh = mesh;
    this.skin = skin;
  }
  render(node, projection, view, sharedUniforms) {
    const {skin, mesh} = this;
    skin.update(node);
    gl.useProgram(skinProgramInfo.program);
    for (const primitive of mesh.primitives) {
      webglUtils.setBuffersAndAttributes(gl, skinProgramInfo, primitive.bufferInfo);
      webglUtils.setUniforms(skinProgramInfo, {
        u_projection: projection,
        u_view: view,
        u_world: node.worldMatrix,
        u_jointTexture: skin.jointTexture,
        u_numJoints: skin.joints.length,
      });
      webglUtils.setUniforms(skinProgramInfo, primitive.material.uniforms);
      webglUtils.setUniforms(skinProgramInfo, sharedUniforms);
      webglUtils.drawBufferInfo(gl, primitive.bufferInfo);
    }
  }
}
```

`MeshRenderer`와 매우 유사한 것을 볼 수 있는데요.
렌더링에 필요한 모든 행렬을 업데이트하는 데 사용하는 `Skin`을 참조합니다.
그런 다음 렌더링에 대한 표준 패턴을 따라, 프로그램을 사용하고, 속성을 설정하며, 텍스처를 바인딩하는 `webglUtils.setUniforms`을 사용하여 모든 유니폼을 설정한 다음 렌더링합니다.

또한 스키닝을 지원하는 정점 셰이더가 필요합니다.

```
<script id="skinVS" type="notjs">
attribute vec4 a_POSITION;
attribute vec3 a_NORMAL;
attribute vec4 a_WEIGHTS_0;
attribute vec4 a_JOINTS_0;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;
uniform sampler2D u_jointTexture;
uniform float u_numJoints;

varying vec3 v_normal;

// 오프셋은 텍스처가 가로로 4픽셀이라 가정합니다.
#define ROW0_U ((0.5 + 0.0) / 4.)
#define ROW1_U ((0.5 + 1.0) / 4.)
#define ROW2_U ((0.5 + 2.0) / 4.)
#define ROW3_U ((0.5 + 3.0) / 4.)

mat4 getBoneMatrix(float jointNdx) {
  float v = (jointNdx + 0.5) / u_numJoints;
  return mat4(
    texture2D(u_jointTexture, vec2(ROW0_U, v)),
    texture2D(u_jointTexture, vec2(ROW1_U, v)),
    texture2D(u_jointTexture, vec2(ROW2_U, v)),
    texture2D(u_jointTexture, vec2(ROW3_U, v)));
}

void main() {
  mat4 skinMatrix = getBoneMatrix(a_JOINTS_0[0]) * a_WEIGHTS_0[0] +
                    getBoneMatrix(a_JOINTS_0[1]) * a_WEIGHTS_0[1] +
                    getBoneMatrix(a_JOINTS_0[2]) * a_WEIGHTS_0[2] +
                    getBoneMatrix(a_JOINTS_0[3]) * a_WEIGHTS_0[3];
  mat4 world = u_world * skinMatrix;
  gl_Position = u_projection * u_view * world * a_POSITION;
  v_normal = mat3(world) * a_NORMAL;
}
</script>
```

이것은 위의 스키닝 셰이더와 거의 동일한데요.
gltf 파일에 있는 내용과 일치하도록 속성 이름을 바꿨습니다.
가장 큰 변화는 `skinMatrix`를 만든 것입니다.
기존 스키닝 셰이더에서는 위치에 개별적인 조인트/뼈 행렬을 곱하고 여기에 각 조인트에 대한 영향의 가중치로 곱했습니다.
이 경우 가중치로 곱한 행렬을 더하고 위치에 한 번만 곱합니다.
이건 동일한 결과를 만들지만 `skinMatrix`를 사용하여 법선도 곱할 수 있고, 그렇지 않으면 법선과 스킨이 일치하지 않을 겁니다.

또한 여기서 `u_world` 행렬에 곱합니다.
`Skin.update`에서 이 코드로 그걸 빼는데요.

```
*const globalWorldInverse = m4.inverse(node.worldMatrix);
// 각 조인트를 통해 현재 worldMatrix 구하기
// 바인드 역행렬을 적용하고 전체 결과를 텍스처에 저장
for (let j = 0; j < this.joints.length; ++j) {
  const joint = this.joints[j];
  const dst = this.jointMatrices[j];
*  m4.multiply(globalWorldInverse, joint.worldMatrix, dst);
```

이걸 할지 말지는 당신에게 달려있습니다.
이렇게 하는 이유는 스킨을 인스턴스화할 수 있기 때문입니다.
다시 말해 같은 프레임에서 두 곳 이상의 위치에서 똑같은 포즈로 스킨이 적용된 메시를 렌더링할 수 있습니다.
조인트가 많은 경우 스킨이 적용된 메시에 대한 모든 행렬 수학을 수행하는 것은 느리기 때문에, 해당 수식을 한 번 수행한 다음, 다른 월드 행렬로 다시 렌더링하여 스킨이 적용된 메시를 다른 위치에 표시할 수 있는 아이디어입니다.

이는 다수의 캐릭터를 표시하는 데 유용할 수 있는데요.
안타깝지만 모든 캐릭터가 똑같은 포즈를 취하기 때문에 이게 정말 유용한지 아닌지 저에겐 불분명합니다.
실제로 이런 상황이 얼마나 자주 발생할까요?
`Skin`에서 노드의 월드 역행렬로 곱하여 제거할 수 있고, 셰이더에서 `u_world`를 곱하여 제거할 수 있으며, 결과는 동일하게 보이고, 스킨이 적용된 메시를 *인스턴스화*할 수 없습니다.
물론 동일한 스킨이 적용된 메시를 원하는 횟수만큼 다른 포즈로 렌더링할 수 있습니다.
다른 방향에 있는 다른 노드를 가리키는 다른 `Skin` 객체가 필요할 겁니다.

로딩 코드로 돌아와, `Node` 인스턴스를 만들 때, `skin` 속성이 있다면 이를 기억하여 `Skin`을 만들 수 있습니다.

```
+const skinNodes = [];
const origNodes = gltf.nodes;
gltf.nodes = gltf.nodes.map((n) => {
  const {name, skin, mesh, translation, rotation, scale} = n;
  const trs = new TRS(translation, rotation, scale);
  const node = new Node(trs, name);
  const realMesh =　gltf.meshes[mesh];
+  if (skin !== undefined) {
+    skinNodes.push({node, mesh: realMesh, skinNdx: skin});
+  } else if (realMesh) {
    node.drawables.push(new MeshRenderer(realMesh));
  }
  return node;
});
```

`Node`를 만든 다음에는 `Skin`을 만들어야 합니다.
스킨은 조인트에 대한 행렬을 제공하는 노드 인덱스 배열인 `joints` 배열을 통해 노드를 참조합니다.
또한 스킨은 파일에 저장된 역바인드 포즈 행렬을 참조하는 접근자를 참조합니다.

```
// 스킨 설정
gltf.skins = gltf.skins.map((skin) => {
  const joints = skin.joints.map(ndx => gltf.nodes[ndx]);
  const {stride, array} = getAccessorTypedArrayAndStride(gl, gltf, skin.inverseBindMatrices);
  return new Skin(joints, array);
});
```

위 코드는 접근자 인덱스가 지정된 `getAccessorTypedArrayAndStride`를 호출합니다.
우리는 해당 코드를 제공해야 하는데요.
주어진 접근자에 대해 올바른 유형의 [TypedArray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray)를 반환하여 버퍼의 데이터에 접근할 겁니다.

```
const glTypeToTypedArrayMap = {
  '5120': Int8Array,    // gl.BYTE
  '5121': Uint8Array,   // gl.UNSIGNED_BYTE
  '5122': Int16Array,   // gl.SHORT
  '5123': Uint16Array,  // gl.UNSIGNED_SHORT
  '5124': Int32Array,   // gl.INT
  '5125': Uint32Array,  // gl.UNSIGNED_INT
  '5126': Float32Array, // gl.FLOAT
}

// GL 타입이 주어지면 필요한 TypedArray 반환
function glTypeToTypedArray(type) {
  return glTypeToTypedArrayMap[type] || throwNoKey(type);
}

// 접근자 인덱스가 주어지면 접근자와 버퍼의 TypedArray 모두 반환
function getAccessorTypedArrayAndStride(gl, gltf, accessorIndex) {
  const accessor = gltf.accessors[accessorIndex];
  const bufferView = gltf.bufferViews[accessor.bufferView];
  const TypedArray = glTypeToTypedArray(accessor.componentType);
  const buffer = gltf.buffers[bufferView.buffer];
  return {
    accessor,
    array: new TypedArray(
        buffer,
        bufferView.byteOffset + (accessor.byteOffset || 0),
        accessor.count * accessorTypeToNumComponents(accessor.type)),
    stride: bufferView.byteStride || 0,
  };
}
```

위 코드에서 주의할 점은 하드코딩된 WebGL 상수로 테이블을 만들었다는 겁니다.
하드코딩을 한 것은 이번이 처음인데요.
상수는 변하지 않으므로 안전하게 수행됩니다.

이제 스킨이 있으므로 돌아가서 해당 스킨을 참조한 노드에 추가할 수 있습니다.

```
// 스킨이 있는 노드에 SkinRenderer 추가
for (const {node, mesh, skinNdx} of skinNodes) {
  node.drawables.push(new SkinRenderer(mesh, gltf.skins[skinNdx]));
}
```

이렇게 렌더링하면 별로 차이가 없을 수도 있는데요.
일부 노드에 애니메이션을 적용해야 합니다.
`Skin`의 각 노드, 다시 말해 각 조인트를 살펴보고, `local X access`에 약간 더하거나 빼서 회전시킵니다.

이를 위해 각 조인트에 대한 기존 로컬 행렬을 저장할 겁니다.
그런 다음 원본 행렬을 각 프레임마다 일정량 회전하고, `m4.decompose` 함수를 사용하여 행렬을 다시 position, rotation, scale로 변환합니다.

```
const origMatrix = new Map();
function animSkin(skin, a) {
  for(let i = 0; i < skin.joints.length; ++i) {
    const joint = skin.joints[i];
    // 이 조인트에 대해 저장된 행렬이 없는 경우
    if (!origMatrix.has(joint)) {
      // 조인트에 대한 행렬 저장
      origMatrix.set(joint, joint.source.getMatrix());
    }
    // 원본 행렬 가져오기
    const origMatrix = origRotations.get(joint);
    // 회전
    const m = m4.xRotate(origMatrix, a);
    // 조인트 속의 position, rotation, scale로 분해
    m4.decompose(m, joint.source.position, joint.source.rotation, joint.source.scale);
  }
}
```

그런 다음 렌더링 전에 호출합니다.

```
animSkin(gltf.skins[0], Math.sin(time) * .5);
```

이상적으로는 일부 아티스트가 만든 애니메이션을 로드하거나 어떤 방식으로든 코드에서 조작하려는 특정 조인트의 이름을 알아야 합니다.
이 경우 스키닝이 작동하는지 확인하기 위한 가장 쉬운 방법으로 보였습니다.

{{{example url="../webgl-skinning-3d-gltf-skinned.html" }}}

계속하기 전에 몇 가지 참고 사항이 있는데요.

대부분의 프로그램과 마찬가지로 처음 이 작업을 시도했을 때 화면에 나타나지 않았습니다.

그래서 가장 먼저 한 일이 스키닝 셰이더의 끝으로 가서 이 코드를 추가한 겁니다.

```
  gl_Position = u_projection * u_view *  a_POSITION;
```

프래그먼트 셰이더에서는 마지막에 이걸 추가하여 단색을 그리도록 변경했습니다.

```
gl_FragColor = vec4(1, 0, 0, 1);
```

이건 모든 스키닝을 지우고 원점에 메시를 그립니다.
그리고 잘 보일 때까지 카메라 위치를 조정했습니다.

```
const cameraPosition = [5, 0, 5];
const target = [0, 0, 0];
```

범고래의 실루엣을 보여주기 때문에 적어도 일부 데이터가 작동하는 것을 알 수 있습니다.

<div class="webgl_center"><img src="resources/skinning-debug-01.png"></div>

다음으로 프래그먼트 셰이더가 법선을 표시하도록 했습니다.

```
gl_FragColor = vec4(normalize(v_normal) * .5 + .5, 1);
```

법선은 -1에서 1사이의 값을 가지므로 `* .5 + .5`는 색상을 보기 위해 0에서 1사이로 조정합니다.

정점 셰이더로 돌아가서 그냥 법선을 전달했습니다.

```
v_normal = a_NORMAL;
```

이런 뷰를 보게 됩니다.

<div class="webgl_center"><img src="resources/skinning-debug-02.png"></div>

법선이 안 좋을 것이라 예상하진 못 했는데, 제가 기대했던 작업부터 시작해서 그게 실제로 작동한다는 걸 확인한 것은 좋았습니다.

다음은 가중치를 확인해야 겠다고 생각했습니다.
제가 할 일은 정점 셰이더에서 법선으로 가중치를 전달하는 게 전부입니다.

```
v_normal = a_WEIGHTS_0.xyz * 2. - 1.;
```

가중치는 0에서 1사이지만 프래그먼트 셰이더는 법선을 기대하기 때문에 가중치를 -1에서 1사이로 만들었습니다.

이것은 원래 일종의 색상 혼란을 일으켰습니다.
예전에 버그를 파악하고 나니 이런 이미지를 얻었는데요.

<div class="webgl_center"><img src="resources/skinning-debug-03.png"></div>

이게 정확한지는 분명하지 않지만 어느정도 의미가 있습니다.
각 뼈에 가까운 정점의 색상이 진할 것으로 예상할 수 있으며, 그 부분의 가중치는 1.0이거나 적어도 모두 비슷하기 때문에 뼈 주변의 정점에서 해당 색이 적용된 링을 예상할 수 있습니다.

원본 이미지는 너무 지저분하니 조인트 인덱스도 함께 표시해봤습니다.

```
v_normal = a_JOINTS_0.xyz / (u_numJoints - 1.) * 2. - 1.;
```

인덱스는 `0`에서 `numJoints - 1` 사이의 값을 가지기 때문에 위 코드는 -1에서 1사이의 값을 제공합니다.

일단 작동하면 이런 이미지를 얻습니다.

<div class="webgl_center"><img src="resources/skinning-debug-04.png"></div>

다시 말하지만 원래 난잡한 색상이었습니다.
위 이미지는 수정 후의 모습입니다.
범고래의 가중치에 대해 예상한 것과 거의 비슷한 것을 볼 수 있는데요.
각 뼈 주변에 색이 칠해진 링이 생겼습니다.

버그는 `webglUtils.createBufferInfoFromArrays`가 컴포넌트 수를 알아내는 방법에 있었습니다.
지정된 걸 무시하고 추측하려고 시도했고 추측이 잘못된 경우가 있었는데요.
버그를 고친 다음 셰이더에 대한 변경 사항을 제거했습니다.
그걸 가지고 놀고 싶다면 위 코드에 주석으로 남겨뒀으니 참고해주세요.

위 코드가 스키닝을 설명하는 데 도움이 된다는 점을 분명히 하고 싶습니다.
프로덕션을 위해 준비된 스키닝 엔진이 아닙니다.
프로덕션 퀄리티의 엔진을 만들려면 많은 것을 바꾸고 싶겠지만, 이 예제가 약간이나마 스키닝을 쉽게 이해하는 데 도움이 되었기를 바랍니다.


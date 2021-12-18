Title: WebGL 카메라 시각화
Description: 카메라 절두체를 그리는 방법
TOC: 카메라 시각화


이 글은 여러분이 [다중 뷰에 대한 글](webgl-multiple-views.html)을 읽었다고 가정합니다.
해당 글을 읽지 않았다면 [그걸](webgl-multiple-views.html) 먼저 읽어주세요.

또한 이 글에선 예제를 깔끔하게 정리하기 위해 [유틸리티 함수에 대한 글](webgl-less-code-more-fun.html)에서 언급한 라이브러리를 사용합니다.
`webglUtils.setBuffersAndAttributes`라는 함수가 버퍼와 속성을 설정하는 게 어떤 의미인지, 혹은 `webglUtils.setUniforms`라는 함수가 유니폼을 설정하는 게 어떤 의미인지 이해하지 못 하겠다면, 더 뒤로 돌아가서 [기초](webgl-fundamentals.html)를 읽어야 합니다.

카메라가 보는 영역인 "절두체"를 시각화할 수 있으면 유용한데요.
이건 놀라울 정도로 쉽습니다.
[orthographic](webgl-3d-orthographic.html)과 [perspective](webgl-3d-perspective.html) 투영에 대한 글에서 지적했던 것처럼 이러한 투영 행렬들은 약간의 공간을 차지하고 클립 공간의 -1에서 +1사이 박스로 변환합니다.
게다가 카메라 행렬은 카메라의 월드 공간에서 어떤 위치와 오리엔테이션을 나타내는 행령일 뿐입니다.

따라서 분명하게 먼저 해야할 일이 있습니다.
카메라 행렬을 사용하여 무언가를 그리면 카메라를 나타내는 객체가 생깁니다.
문제는 카메라가 스스로를 볼 수 없다는 점인데 [다중 뷰](webgl-multiple-views.html) 기술을 사용하면 2개의 뷰를 가질 수 있습니다.
각 뷰에서 다른 카메라를 사용할 겁니다.
두 번째 뷰는 첫 번째 뷰를 보기 때문에 다른 뷰에서 사용되는 카메라를 나타내기 위해 그리는 객체를 볼 수 있습니다.

먼저 카메라를 나타내는 데이터를 만들어 보겠습니다.
큐브를 만든 다음 끝에 원뿔을 추가해봅시다.
이를 선으로 그릴 겁니다.
그리고 [색인](webgl-indexed-vertices.html)을 사용하여 정점을 연결합니다.

[카메라](webgl-3d-camera.html)는 -Z 방향을 내려다 보기 때문에 -Z 방향으로 원뿔이 열리도록 양수 쪽에 큐브와 원뿔을 놓읍시다.

먼저 큐브 라인입니다.

```js
// 카메라에 대한 지오메트리 생성
function createCameraBufferInfo(gl) {
  // 먼저 큐브를 추가해봅시다.
  // 카메라가 -Z를 내려다 보기 때문에 1에서 3사이가 되므로 Z = 0부터 시작하길 원합니다.
  const positions = [
    -1, -1,  1,  // 큐브 정점
     1, -1,  1,
    -1,  1,  1,
     1,  1,  1,
    -1, -1,  3,
     1, -1,  3,
    -1,  1,  3,
     1,  1,  3,
  ];
  const indices = [
    0, 1, 1, 3, 3, 2, 2, 0, // 큐브 인덱스
    4, 5, 5, 7, 7, 6, 6, 4,
    0, 4, 1, 5, 3, 7, 2, 6,
  ];
  return webglUtils.createBufferInfoFromArrays(gl, {
    position: positions,
    indices,
  });
}
```

그런 다음 원뿔 선을 추가합시다.

```js
// 카메라에 대한 지오메트리 생성
function createCameraBufferInfo(gl) {
  // 먼저 큐브를 추가해봅시다.
  // 카메라가 -Z를 내려다 보기 때문에 1에서 3사이가 되므로 Z = 0부터 시작하길 원합니다.
+  // -Z 방향으로 열리는 큐브 앞에 원뿔을 놓습니다.
  const positions = [
    -1, -1,  1,  // 큐브 정점
     1, -1,  1,
    -1,  1,  1,
     1,  1,  1,
    -1, -1,  3,
     1, -1,  3,
    -1,  1,  3,
     1,  1,  3,
+     0,  0,  1,  // 원뿔 팁
  ];
  const indices = [
    0, 1, 1, 3, 3, 2, 2, 0, // 큐브 인덱스
    4, 5, 5, 7, 7, 6, 6, 4,
    0, 4, 1, 5, 3, 7, 2, 6,
  ];
+  // 원뿔 세그먼트 추가
+  const numSegments = 6;
+  const coneBaseIndex = positions.length / 3; 
+  const coneTipIndex =  coneBaseIndex - 1;
+  for (let i = 0; i < numSegments; ++i) {
+    const u = i / numSegments;
+    const angle = u * Math.PI * 2;
+    const x = Math.cos(angle);
+    const y = Math.sin(angle);
+    positions.push(x, y, 0);
+    // 팁에서 가장자리로 이어지는 선
+    indices.push(coneTipIndex, coneBaseIndex + i);
+    // 가장자리의 점부터 가장자리의 다음 점으로 이어지는 선
+    indices.push(coneBaseIndex + i, coneBaseIndex + (i + 1) % numSegments);
+  }
  return webglUtils.createBufferInfoFromArrays(gl, {
    position: positions,
    indices,
  });
}
```

마지막으로 F의 높이가 150유닛이고 카메라의 크기가 2~3유닛이기 때문에 스케일을 추가합니다.
그릴 때 스케일 행렬로 곱하여 크기를 조정하거나 여기에서 데이터 자체의 크기를 조정할 수 있습니다.

```js
-function createCameraBufferInfo(gl) {
+function createCameraBufferInfo(gl, scale = 1) {
  // 먼저 큐브를 추가해봅시다.
  // 카메라가 -Z를 내려다 보기 때문에 1에서 3사이가 되므로 Z = 0부터 시작하길 원합니다.
  // -Z 방향으로 열리는 큐브 앞에 원뿔을 놓습니다.
  const positions = [
    -1, -1,  1,  // 큐브 정점
     1, -1,  1,
    -1,  1,  1,
     1,  1,  1,
    -1, -1,  3,
     1, -1,  3,
    -1,  1,  3,
     1,  1,  3,
     0,  0,  1,  // 원뿔 팁
  ];
  const indices = [
    0, 1, 1, 3, 3, 2, 2, 0, // 큐브 인덱스
    4, 5, 5, 7, 7, 6, 6, 4,
    0, 4, 1, 5, 3, 7, 2, 6,
  ];
  // 원뿔 세그먼트 추가
  const numSegments = 6;
  const coneBaseIndex = positions.length / 3; 
  const coneTipIndex =  coneBaseIndex - 1;
  for (let i = 0; i < numSegments; ++i) {
    const u = i / numSegments;
    const angle = u * Math.PI * 2;
    const x = Math.cos(angle);
    const y = Math.sin(angle);
    positions.push(x, y, 0);
    // 팁에서 가장자리로 이어지는 선
    indices.push(coneTipIndex, coneBaseIndex + i);
    // 가장자리의 점부터 가장자리의 다음 점으로 이어지는 선
    indices.push(coneBaseIndex + i, coneBaseIndex + (i + 1) % numSegments);
  }
+  positions.forEach((v, ndx) => {
+    positions[ndx] *= scale;
+  });
  return webglUtils.createBufferInfoFromArrays(gl, {
    position: positions,
    indices,
  });
}
```

현재 셰이더 프로그램은 정점 색상으로 그리고 있습니다.
단색으로 그리는 또 다른 셰이더를 만들어봅시다.

```html
<script id="solid-color-vertex-shader" type="x-shader/x-vertex">
attribute vec4 a_position;

uniform mat4 u_matrix;

void main() {
  // 위치에 행렬 곱하기
  gl_Position = u_matrix * a_position;
}
</script>
<!-- 프래그먼트 셰이더 -->
<script id="solid-color-fragment-shader" type="x-shader/x-fragment">
precision mediump float;

uniform vec4 u_color;

void main() {
  gl_FragColor = u_color;
}
</script>  
```

이제 이것들을 사용하여 다른 장면을 보는 카메라로 한 장면을 그려봅시다.

```js
// GLSL 프로그램 설정
// 셰이더 컴파일, 프로그램 연결, 위치 조회
-const programInfo = webglUtils.createProgramInfo(gl, ['vertex-shader-3d', 'fragment-shader-3d']);
+const vertexColorProgramInfo = webglUtils.createProgramInfo(gl, ['vertex-shader-3d', 'fragment-shader-3d']);
+const solidColorProgramInfo = webglUtils.createProgramInfo(gl, ['solid-color-vertex-shader', 'solid-color-fragment-shader']);

// 버퍼를 생성하고 3D 'F'에 대한 데이터로 채우기
const fBufferInfo = primitives.create3DFBufferInfo(gl);

...

+const cameraScale = 20;
+const cameraBufferInfo = createCameraBufferInfo(gl, cameraScale);

...

const settings = {
  rotation: 150,  // 도 단위
+  cam1FieldOfView: 60,  // 도 단위
+  cam1PosX: 0,
+  cam1PosY: 0,
+  cam1PosZ: -200,
};


function render() {
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.SCISSOR_TEST);

  // 뷰를 2개로 나눌 겁니다.
  const effectiveWidth = gl.canvas.clientWidth / 2;
  const aspect = effectiveWidth / gl.canvas.clientHeight;
  const near = 1;
  const far = 2000;

  // 원근 투영 행렬 계산
  const perspectiveProjectionMatrix =
-      m4.perspective(fieldOfViewRadians), aspect, near, far);
+      m4.perspective(degToRad(settings.cam1FieldOfView), aspect, near, far);

  // lookAt을 사용하여 카메라 행렬 계산
-  const cameraPosition = [0, 0, -75];
+  const cameraPosition = [
+      settings.cam1PosX, 
+      settings.cam1PosY,
+      settings.cam1PosZ,
+  ];
  const target = [0, 0, 0];
  const up = [0, 1, 0];
  const cameraMatrix = m4.lookAt(cameraPosition, target, up);

  let worldMatrix = m4.yRotation(degToRad(settings.rotation));
  worldMatrix = m4.xRotate(worldMatrix, degToRad(settings.rotation));
  // center the 'F' around its origin
  worldMatrix = m4.translate(worldMatrix, -35, -75, -5);

  const {width, height} = gl.canvas;
  const leftWidth = width / 2 | 0;

  // 직교 카메라로 왼쪽 그리기
  gl.viewport(0, 0, leftWidth, height);
  gl.scissor(0, 0, leftWidth, height);
  gl.clearColor(1, 0.8, 0.8, 1);

  drawScene(perspectiveProjectionMatrix, cameraMatrix, worldMatrix);

  // 원근 카메라로 오른쪽 그리기
  const rightWidth = width - leftWidth;
  gl.viewport(leftWidth, 0, rightWidth, height);
  gl.scissor(leftWidth, 0, rightWidth, height);
  gl.clearColor(0.8, 0.8, 1, 1);

  // 두 번째 투영 행렬과 두 번째 카메라 계산
+  const perspectiveProjectionMatrix2 =
+      m4.perspective(degToRad(60), aspect, near, far);
+
+  // lookAt을 사용하여 카메라 행렬 계산
+  const cameraPosition2 = [-600, 400, -400];
+  const target2 = [0, 0, 0];
+  const cameraMatrix2 = m4.lookAt(cameraPosition2, target2, up);

-  drawScene(perspectiveProjectionMatrix, cameraMatrix, worldMatrix);
+  drawScene(perspectiveProjectionMatrix2, cameraMatrix2, worldMatrix);

+  // 첫 번째 카메라를 나타내는 객체 그리기
+  {
+    // 두 번째 카메라 행렬로 뷰 행렬을 만들기
+    const viewMatrix = m4.inverse(cameraMatrix2);
+
+    let mat = m4.multiply(perspectiveProjectionMatrix2, viewMatrix);
+    // 첫 번째 카메라 행렬을 장면에서 카메라 표시를 배치하는 행렬로 사용
+    mat = m4.multiply(mat, cameraMatrix);
+
+    gl.useProgram(solidColorProgramInfo.program);
+
+    // ------ 카메라 표시 그리기 --------
+
+    // 필요한 모든 속성 설정
+    webglUtils.setBuffersAndAttributes(gl, solidColorProgramInfo, cameraBufferInfo);
+
+    // 유니폼 설정
+    webglUtils.setUniforms(solidColorProgramInfo, {
+      u_matrix: mat,
+      u_color: [0, 0, 0, 1],
+    });
+
+    webglUtils.drawBufferInfo(gl, cameraBufferInfo, gl.LINES);
+  }
}
render();
```

이제 오른쪽 장면에서 왼쪽 장면을 렌더링하는 데 사용되는 카메라를 볼 수 있습니다.

{{{example url="../webgl-visualize-camera.html"}}}

카메라의 절두체를 나타내는 것도 그려봅시다.

절두체는 클립 공간으로의 변환을 나타내므로 클립 공간을 나타내는 큐브를 만들고 투영 행렬의 역행렬을 사용하여 장면에 배치할 수 있습니다.

먼저 클립 공간 라인 큐브가 필요합니다.

```js
function createClipspaceCubeBufferInfo(gl) {
  // 먼저 큐브를 추가해봅시다.
  // 카메라가 -Z를 내려다 보기 때문에 1에서 3사이가 되므로 Z = 0부터 시작하길 원합니다.
  // -Z 방향으로 열리는 큐브 앞에 원뿔을 놓습니다.
  const positions = [
    -1, -1, -1,  // 큐브 정점
     1, -1, -1,
    -1,  1, -1,
     1,  1, -1,
    -1, -1,  1,
     1, -1,  1,
    -1,  1,  1,
     1,  1,  1,
  ];
  const indices = [
    0, 1, 1, 3, 3, 2, 2, 0, // 큐브 인덱스
    4, 5, 5, 7, 7, 6, 6, 4,
    0, 4, 1, 5, 3, 7, 2, 6,
  ];
  return webglUtils.createBufferInfoFromArrays(gl, {
    position: positions,
    indices,
  });
}
```

그런 다음 하나를 생성하고 그릴 수 있습니다.

```js
const cameraScale = 20;
const cameraBufferInfo = createCameraBufferInfo(gl, cameraScale);

+const clipspaceCubeBufferInfo = createClipspaceCubeBufferInfo(gl);

...

  // 첫 번째 카메라를 나타내는 객체 그리기
  {
    // 카메라 행렬로 뷰 행렬 만들기
    const viewMatrix = m4.inverse(cameraMatrix2);

    let mat = m4.multiply(perspectiveProjectionMatrix2, viewMatrix);
    // 첫 번째 카메라 행렬을 장면에서 카메라 표시를 배치하는 행렬로 사용
    mat = m4.multiply(mat, cameraMatrix);

    gl.useProgram(solidColorProgramInfo.program);

    // ------ 카메라 표시 그리기 --------

    // 필요한 모든 속성 설정
    webglUtils.setBuffersAndAttributes(gl, solidColorProgramInfo, cameraBufferInfo);

    // 유니폼 설정
    webglUtils.setUniforms(solidColorProgramInfo, {
      u_matrix: mat,
      u_color: [0, 0, 0, 1],
    });

    webglUtils.drawBufferInfo(gl, cameraBufferInfo, gl.LINES);

+    // ----- 절두체 그리기 -------
+
+    mat = m4.multiply(mat, m4.inverse(perspectiveProjectionMatrix));
+
+    // 필요한 모든 속성 설정
+    webglUtils.setBuffersAndAttributes(gl, solidColorProgramInfo, clipspaceCubeBufferInfo);
+
+    // 유니폼 설정
+    webglUtils.setUniforms(solidColorProgramInfo, {
+      u_matrix: mat,
+      u_color: [0, 0, 0, 1],
+    });
+
+    webglUtils.drawBufferInfo(gl, clipspaceCubeBufferInfo, gl.LINES);
  }
}
```

또한 첫 번째 카메라의 근거리 및 원거리 설정을 조정할 수 있도록 만들어 보겠습니다.

```js
const settings = {
  rotation: 150,  // 도 단위
  cam1FieldOfView: 60,  // 도 단위
  cam1PosX: 0,
  cam1PosY: 0,
  cam1PosZ: -200,
+  cam1Near: 30,
+  cam1Far: 500,
};

...

  // 원근 투영 행렬 계산
  const perspectiveProjectionMatrix =
      m4.perspective(degToRad(settings.cam1FieldOfView),
      aspect,
-      near,
-      far);
+      settings.cam1Near,
+      settings.cam1Far);
```

이제 절두체도 볼 수 있습니다.

{{{example url="../webgl-visualize-camera-with-frustum.html"}}}

근거리 평면이나 원거리 평면 혹은 시야를 조절하여 F를 클리핑하면 절두체 표현이 일치하는 것을 볼 수 있습니다.

Whether we use a perspective projection or an orthographic projection for the camera on the left it will work either way because a projection matrix always converts to clip space so it's inverse will always take our +1 to -1 cube and warp it appropriately.

```js
const settings = {
  rotation: 150,  // 도 단위
  cam1FieldOfView: 60,  // 도 단위
  cam1PosX: 0,
  cam1PosY: 0,
  cam1PosZ: -200,
  cam1Near: 30,
  cam1Far: 500,
+  cam1Ortho: true,
+  cam1OrthoUnits: 120,
};

...

// 투영 행렬 계산
const perspectiveProjectionMatrix = settings.cam1Ortho
    ? m4.orthographic(
        -settings.cam1OrthoUnits * aspect,  // 왼쪽
         settings.cam1OrthoUnits * aspect,  // 오른쪽
        -settings.cam1OrthoUnits,           // 아래쪽
         settings.cam1OrthoUnits,           // 위쪽
         settings.cam1Near,
         settings.cam1Far)
    : m4.perspective(degToRad(settings.cam1FieldOfView),
        aspect,
        settings.cam1Near,
        settings.cam1Far);
```

{{{example url="../webgl-visualize-camera-with-orthographic.html"}}}

이런 종류의 시각화는 [블렌더](https://blender.org)같은 3D 모델링 패키지나 [유니티](https://unity.com) 혹은 [Godot](https://godotengine.org/)처럼 장면 편집 도구가 있는 3D 게임 엔진을 사용해봤다면 익숙할 겁니다.

또한 디버깅에도 제법 유용할 수 있습니다.


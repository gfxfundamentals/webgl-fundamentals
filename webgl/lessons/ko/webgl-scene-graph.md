Title: WebGL - 장면 그래프
Description: 장면 그래프의 용도
TOC: 장면 그래프


이 글은 WebGL 관련 시리즈에서 이어집니다.
이전에는 [여러 사물 그리기](webgl-drawing-multiple-things.html)에 관한 것이었습니다. 
아직 읽지 않았다면 거기부터 시작하는 게 좋습니다.

장면 그래프는 tree의 각 node가 행렬을 생성하는 tree 구조입니다.
흠, 이건 쓸모있는 정의가 아니네요.
몇 가지 예제가 더 유용할 것 같습니다.

대부분의 3D 엔진은 장면 그래프를 사용합니다.
표시하고 싶을 걸 장면 그래프에 넣게 되는데요.
그러면 엔진은 장면 그래프를 살펴보고 그릴 목록을 파악합니다.
장면 그래프는 계층 구조이기 때문에, 우주 시뮬레이션을 만들고 싶다면, 다음과 같은 그래프가 있어야 할 겁니다.

{{{diagram url="resources/planet-diagram.html" height="500" }}}

장면 그래프의 요점은 뭘까요?
장면 그래프의 #1 기능은 [2D 행렬 수학](webgl-2d-matrices.html)에서 다룬 것처럼 행렬에 대한 부모 자식 관계 제공한다는 겁니다.
예를 들어 단순하지만 비현실적인 우주 시뮬레이션에서 별(자식)은 은하(부모)를 따라 이동합니다.
마찬가지로 위성(자식)은 행성(부모)을 따라 이동하는데요.
지구를 움직인다면 달이 함께 움직일 겁니다.
은하를 움직인다면 내부의 모든 별들이 함께 움직입니다.
위 다이어그램의 이름들을 드래그하면 그들의 관계를 볼 수 있습니다.

[2D 행렬 수학](webgl-2d-matrices.html)으로 돌아가보면 translate, rotate, scale을 하기 위한 많은 행렬을 객체에 곱한 걸 기억하실 겁니다.
장면 그래프는 객체에 어떤 행렬 수식을 적용할지 도와주는 구조를 제공합니다.

일반적으로 장면 그래프의 각 `Node`는 *local space*를 나타냅니다.
올바른 행렬 수식이 주어지면 *local space*에 있는 무엇이든 그 위에 있는 모든 걸 무시할 수 있습니다.
다시 말해 달은 지구 궤도를 선회하는 것에만 신경쓰면 된다는 겁니다.
태양 궤도를 선회하는 것에 대해서는 신경쓰지 않아도 되죠.
장면 그래프 구조가 없다면 달이 태양 궤도를 선회하는 방법을 계산하기 위해 훨씬 더 복잡한 수식을 수행해야 합니다.

{{{diagram url="resources/moon-orbit.html" }}}

장면 그래프로 달을 지구의 자식으로 만들면 지구의 궤도를 선회합니다.
그리고 장면 그래프는 지구가 태양을 선회한다는 사실을 처리하는데요.
Node를 탐색하다가 행렬을 곱하여 이를 수행합니다.

    worldMatrix = greatGrandParent * grandParent * parent * self(localMatrix)

우주 시뮬레이션의 구체적인 표현으로 바꿔보면 다음과 같습니다.

    worldMatrixForMoon = galaxyMatrix * starMatrix * planetMatrix * moonMatrix;

재귀 함수로 이를 매우 간단하게 할 수 있습니다.

    function computeWorldMatrix(currentNode, parentWorldMatrix) {
        // local matrix를 부모의 world matrix로 곱하여 worldMatrix를 계산
        var worldMatrix = m4.multiply(parentWorldMatrix, currentNode.localMatrix);

        // 모든 자식에게 동일하게 수행
        currentNode.children.forEach(function(child) {
            computeWorldMatrix(child, worldMatrix);
        });
    }

이는 3D 장면 그래프에서 굉장히 일반적인 용어를 가져온 겁니다.

*   `localMatrix`: 현재 node에 대한 local matrix 입니다.
    원점에서 자신과 함께 local space의 자식들을 변형시킵니다.

*   `worldMatrix`: 주어진 node의 local space에 있는 걸 가져와 장면 그래프의 root node space로 변환합니다.
    다시 말해 world에 배치합니다.
    달에 대해 worldMatrix를 계산하면 위에서 본 궤도를 얻게 될 겁니다.

장면 그래프는 굉장히 만들기 쉽습니다.
간단한 `Node` 객체를 정의해봅시다.
장면 그래프를 구성하는 방법은 무수히 많지만 어떤 방법이 가장 좋은지는 모르겠습니다.
가장 일반적인 방법은 그리는 사물의 선택적 필드를 가지는 겁니다.

    var node = {
       localMatrix: ...,  // node에 대한 "local" matrix
       worldMatrix: ...,  // node에 대한 "world" matrix
       children: [],      // 자식 배열
       thingToDraw: ??,   // node에서 그리는 요소
    };

태양계 장면 그래프를 만들어 봅시다.
멋진 텍스처나 예제를 복잡하게 만들 수 있는 것은 사용하지 않겠습니다.
먼저 node 관리를 도와줄 몇 가지 함수를 만들어 보려고 하는데요.
우선 node class를 만듭니다.

    var Node = function() {
      this.children = [];
      this.localMatrix = m4.identity();
      this.worldMatrix = m4.identity();
    };

Node의 부모를 설정하는 방법을 제공합니다.

    Node.prototype.setParent = function(parent) {
      // 부모에서 자식 제거
      if (this.parent) {
        var ndx = this.parent.children.indexOf(this);
        if (ndx >= 0) {
          this.parent.children.splice(ndx, 1);
        }
      }

      // 새로운 부모에 자식 추가
      if (parent) {
        parent.children.append(this);
      }
      this.parent = parent;
    };

그리고 여기 부모-자식 관계를 기반으로 local matrix에서 world matrix를 계산하는 코드입니다.
부모에서 시작해 재귀적으로 자식들을 찾아가면 world matrix를 계산할 수 있습니다.
행렬 수학을 모른다면 [이 글](webgl-2d-matrices.html)을 확인해주세요.

    Node.prototype.updateWorldMatrix = function(parentWorldMatrix) {
      if (parentWorldMatrix) {
        // 행렬이 전달되므로 수식을 수행하고 결과를 `this.worldMatrix`에 저장
        m4.multiply(this.localMatrix, parentWorldMatrix, this.worldMatrix);
      } else {
        // 행렬이 전달되지 않았으니 localMatrix를 worldMatrix로 복사
        m4.copy(this.localMatrix, this.worldMatrix);
      }

      // 모든 자식 처리
      var worldMatrix = this.worldMatrix;
      this.children.forEach(function(child) {
        child.updateWorldMatrix(worldMatrix);
      });
    };

단순하게 하기 위해 태양, 지구, 달만 해봅시다.
물론 화면에 맞게 가짜 거리를 사용합니다.
하나의 구체 모형만 사용하고 태양은 황색, 지구는 청록색, 달은 회색으로 칠할 겁니다.
`drawInfo`, `bufferInfo`, `programInfo`가 익숙하지 않다면 [이전 글](webgl-drawing-multiple-things.html)을 봐주세요.

    // 모든 node 만들기
    var sunNode = new Node();
    sunNode.localMatrix = m4.translation(0, 0, 0);  // 중앙에 태양
    sunNode.drawInfo = {
      uniforms: {
        u_colorOffset: [0.6, 0.6, 0, 1], // 노랑
        u_colorMult:   [0.4, 0.4, 0, 1],
      },
      programInfo: programInfo,
      bufferInfo: sphereBufferInfo,
    };

    var earthNode = new Node();
    earthNode.localMatrix = m4.translation(100, 0, 0);  // 지구는 태양으로부터 100unit
    earthNode.drawInfo = {
      uniforms: {
        u_colorOffset: [0.2, 0.5, 0.8, 1],  // 청록색
        u_colorMult:   [0.8, 0.5, 0.2, 1],
      },
      programInfo: programInfo,
      bufferInfo: sphereBufferInfo,
    };

    var moonNode = new Node();
    moonNode.localMatrix = m4.translation(20, 0, 0);  // 달은 지구로부터 20unit
    moonNode.drawInfo = {
      uniforms: {
        u_colorOffset: [0.6, 0.6, 0.6, 1],  // 회색
        u_colorMult:   [0.1, 0.1, 0.1, 1],
      },
      programInfo: programInfo,
      bufferInfo: sphereBufferInfo,
    };

이제 node를 만들었으니 이들을 연결합시다.

    // 천체 연결
    moonNode.setParent(earthNode);
    earthNode.setParent(sunNode);

그리고 다시 객체 목록과 그릴 객체 목록을 만들 겁니다.

    var objects = [
      sunNode,
      earthNode,
      moonNode,
    ];

    var objectsToDraw = [
      sunNode.drawInfo,
      earthNode.drawInfo,
      moonNode.drawInfo,
    ];

렌더링할 때 각 객체의 local matrix를 약간 회전하여 업데이트합니다.

    // 각 객체에 대한 local matrix 업데이트
    m4.multiply(m4.yRotation(0.01), sunNode.localMatrix  , sunNode.localMatrix);
    m4.multiply(m4.yRotation(0.01), earthNode.localMatrix, earthNode.localMatrix);
    m4.multiply(m4.yRotation(0.01), moonNode.localMatrix , moonNode.localMatrix);

이제 local matrix가 업데이트되었으니 모든 world matrix를 업데이트할 겁니다.

    sunNode.updateWorldMatrix();

마지막으로 world matrix가 있으니 각 객체에 대한 [worldViewProjection matrix](webgl-3d-perspective.html)를 구하기 위해 곱해야 합니다.

    // 렌더링을 위한 모든 행렬 계산
    objects.forEach(function(object) {
      object.drawInfo.uniforms.u_matrix = m4.multiply(viewProjectionMatrix, object.worldMatrix);
    });

렌더링은 [지난 글](webgl-drawing-multiple-things.html)에서 본 것과 같은 루프입니다.

{{{example url="../webgl-scene-graph-solar-system.html" }}}

모든 행성이 같은 크기임을 알 수 있는데요.
지구를 더 크게 만들어 보겠습니다.

    // 지구는 태양으로부터 100unit
    earthNode.localMatrix = m4.translation(100, 0, 0);
    // 지구를 두 배로 만들기
    earthNode.localMatrix = m4.scale(earthNode.localMatrix, 2, 2, 2);

{{{example url="../webgl-scene-graph-solar-system-larger-earth.html" }}}

이런 달도 커졌군요.
이를 고치기 위해 수동으로 달을 축소할 수 있습니다.
하지만 더 좋은 해결책은 장면 그래프에 node를 더 추가하는 겁니다.
아래 장면 그래프 대신에

      sun
       |
      earth
       |
      moon

이렇게 바꿀 겁니다.

     solarSystem
       |    |
       |   sun
       |
     earthOrbit
       |    |
       |  earth
       |
      moonOrbit
          |
         moon

이렇게 하면 지구는 태양계 주변을 돌지만, 태양만 개별적으로 회전하고 크기 조정할 수 있으며, 지구에는 영향을 주지 않습니다.
마찬가지로 지구는 달과 별도로 회전할 수 있습니다.
`solarSystem`, `earthOrbit` `moonOrbit`에 대한 node 만들어 봅시다.

    var solarSystemNode = new Node();
    var earthOrbitNode = new Node();
    earthOrbitNode.localMatrix = m4.translation(100, 0, 0);  // 지구 궤도는 태양으로부터 100unit
    var moonOrbitNode = new Node();
    moonOrbitNode.localMatrix = m4.translation(20, 0, 0);  // 달은 지구로부터 100unit

이러한 궤도 거리는 기존 node에서 제거되었습니다.

    var earthNode = new Node();
    -// 지구는 태양으로부터 100unit
    -earthNode.localMatrix = m4.translation(100, 0, 0);
    -// 지구를 두 배로 만들기
    -earthNode.localMatrix = m4.scale(earthNode.localMatrix, 2, 2, 2);
    +earthNode.localMatrix = m4.scaling(2, 2, 2);   // 지구를 두 배로 만들기

    var moonNode = new Node();
    -moonNode.localMatrix = m4.translation(20, 0, 0);  // 달은 지구로부터 20unit

이제 연결하는 것은 다음과 같습니다.

    // 천체 연결
    sunNode.setParent(solarSystemNode);
    earthOrbitNode.setParent(solarSystemNode);
    earthNode.setParent(earthOrbitNode);
    moonOrbitNode.setParent(earthOrbitNode);
    moonNode.setParent(moonOrbitNode);

그리고 궤도만 업데이트하면 됩니다.

    // 각 객체에 대한 local matrix 업데이트
    -m4.multiply(m4.yRotation(0.01), sunNode.localMatrix  , sunNode.localMatrix);
    -m4.multiply(m4.yRotation(0.01), earthNode.localMatrix, earthNode.localMatrix);
    -m4.multiply(m4.yRotation(0.01), moonNode.localMatrix , moonNode.localMatrix);
    +m4.multiply(m4.yRotation(0.01), earthOrbitNode.localMatrix, earthOrbitNode.localMatrix);
    +m4.multiply(m4.yRotation(0.01), moonOrbitNode.localMatrix, moonOrbitNode.localMatrix);

    // 장면 그래프의 모든 world matrix 업데이트
    -sunNode.updateWorldMatrix();
    +solarSystemNode.updateWorldMatrix();

이제 지구는 두 배 크기고, 달은 그대로인 것을 볼 수 있습니다.

{{{example url="../webgl-scene-graph-solar-system-larger-earth-fixed.html" }}}

또한 태양과 지구가 더 이상 제자리에서 회전하지 않는 것을 알 수 있는데요.
이제 그건 독립적입니다.

몇 가지 더 조정해봅시다.

    -sunNode.localMatrix = m4.translation(0, 0, 0);  // 중앙에 태양
    +sunNode.localMatrix = m4.scaling(5, 5, 5);

    ...

    +moonNode.localMatrix = m4.scaling(0.4, 0.4, 0.4);

    ...
    // 각 객체에 대한 local matrix 업데이트
    matrixMultiply(earthOrbitNode.localMatrix, m4.yRotation(0.01), earthOrbitNode.localMatrix);
    matrixMultiply(moonOrbitNode.localMatrix, m4.yRotation(0.01), moonOrbitNode.localMatrix);
    +// 지구 회전
    +m4.multiply(m4.yRotation(0.05), earthNode.localMatrix, earthNode.localMatrix);
    +// 달 회전
    +m4.multiply(m4.yRotation(-0.01), moonNode.localMatrix, moonNode.localMatrix);

{{{example url="../webgl-scene-graph-solar-system-adjusted.html" }}}

현재 `localMatrix`를 가지고 있으며 프레임마다 이를 수정하고 있습니다.
하지만 모든 프레임에서 수식이 약간의 오류를 수집한다는 문제가 있는데요.
*Ortho normalizing matrix*라 불리는 수식을 고치는 방법이 있지만 항상 작동하지는 않습니다.
예를 들어 크기를 0으로 줄였다가 돌아오게 한다고 가정해 보겠습니다.
`x`에 대해 그렇게 해봅시다.

    x = 246;       // frame #0, x = 246

    scale = 1;
    x = x * scale  // frame #1, x = 246

    scale = 0.5;
    x = x * scale  // frame #2, x = 123

    scale = 0;
    x = x * scale  // frame #3, x = 0

    scale = 0.5;
    x = x * scale  // frame #4, x = 0  이런!

    scale = 1;
    x = x * scale  // frame #5, x = 0  이런!

값을 잃었습니다.
다른 값들로 행렬을 업데이트하는 다른 class를 추가하여 이를 고칠 수 있는데요.
`source`를 가지도록 `Node` 정의를 수정해봅시다.
이미 존재한다면 `source`에 local matrix를 요청할 겁니다.

    *var Node = function(source) {
      this.children = [];
      this.localMatrix = m4.identity();
      this.worldMatrix = m4.identity();
    +  this.source = source;
    };

    Node.prototype.updateWorldMatrix = function(matrix) {

    +  var source = this.source;
    +  if (source) {
    +    source.getMatrix(this.localMatrix);
    +  }

      ...

이제 source를 생성할 수 있습니다.
일반적인 source는 다음과 같이 translation, rotation, scale을 제공합니다.

    var TRS = function() {
      this.translation = [0, 0, 0];
      this.rotation = [0, 0, 0];
      this.scale = [1, 1, 1];
    };

    TRS.prototype.getMatrix = function(dst) {
      dst = dst || new Float32Array(16);
      var t = this.translation;
      var r = this.rotation;
      var s = this.scale;

      // translation, rotation, scale로 행렬 계산
      m4.translation(t[0], t[1], t[2], dst);
      matrixMultiply(m4.xRotation(r[0]), dst, dst);
      matrixMultiply(m4.yRotation(r[1]), dst, dst);
      matrixMultiply(m4.zRotation(r[2]), dst, dst);
      matrixMultiply(m4.scaling(s[0], s[1], s[2]), dst, dst);
      return dst;
    };

그리고 이렇게 사용할 수 있습니다.

    // 초기화할 때 source와 함께 node 만들기
    var someTRS  = new TRS();
    var someNode = new Node(someTRS);

    // 렌더링할 때
    someTRS.rotation[2] += elapsedTime;

이제 매번 행렬을 재생성하기 때문에 문제가 없습니다.

"나는 태양계를 만들고 있지 않은데 요점이 뭐지?"라고 생각하실 수 있는데요.
음, 사람 애니메이션을 만든다면 다음과 같은 장면 그래프를 가질 수 있습니다.

{{{diagram url="resources/person-diagram.html" height="400" }}}

손가락과 발가락에 얼마나 많은 관절을 추가할지는 여러분이 정하면 되는데요
관절이 많아질수록 애니메이션을 계산하는데 더 많은 연산이 필요하고, 모든 관절 정보를 제공하기 위해 더 많은 애니메이션 데이터가 필요합니다.
버추어 파이터처럼 오래된 게임들은 약 15개의 관절을 가졌습니다.
2000년대 초반부터 중반까지의 게임들은 30~70개의 관절을 가졌죠.
손의 모든 관절을 구현한다면 각 손에 20개 이상의 관절이 있으므로 두 손에만 관절이 40개입니다.
손 애니메이션을 구현하려는 많은 게임들은 엄지 손가락 하나 그리고 4개의 손가락을 하나의 큰 손가락으로 애니메이션하여 시간(CPU/GPU/Artist의 시간)과 메모리를 절약합니다.

어쨌든 여기 제가 해킹한 블록맨이 있습니다.
각 node에 대해 위에서 언급한 `TRS` source를 사용하고 있습니다.

{{{example url="../webgl-scene-graph-block-guy.html" }}}

대부분의 3D 라이브러리를 보면 이와 유사한 장면 그래프를 찾을 수 있습니다.

<div class="webgl_bottombar">
<h3>SetParent vs AddChild / RemoveChild</h3>
<p>
많은 장면 그래프가 <code>node.addChild</code> 함수와 <code>node.removeChild</code> 함수를 가지지만 위에서는 <code>node.setParent</code> 함수를 만들었습니다.
어느 쪽이 더 좋은지는 스타일의 문제지만 제가 <code>addChild</code>보다 <code>setParent</code>가 더 좋다고 주장하는 객관적인 이유는 다음과 같은 코드를 불가능하게 만들기 때문입니다.
</p>
<pre class="prettyprint">
    someParent.addChild(someNode);
    ...
    someOtherParent.addChild(someNode);
</pre>
<p>
그게 무슨 뜻일까요?
<code>someNode</code>는 <code>someParent</code>와 <code>someOtherParent</code>에 모두 추가될까요?
대부분의 장면 그래프에서는 불가능합니다.
두 번째 호출에서 오류가 발생할까요?
<code>ERROR: Already have parent.</code>
아니면 <code>someOtherParent</code>에 추가하기 전에 <code>someParent</code>에서 <code>someNode</code>를 제거할까요?
그렇다면 <code>addChild</code>라는 이름은 명확하지 않습니다.
</p>
<p>반면에 <code>setParent</code>는 그런 문제가 없습니다.</p>
<pre class="prettyprint">
    someNode.setParent(someParent);
    ...
    someNode.setParent(someOtherParent);
</pre>
<p>
이 경우 무슨 일이 일어나는지 분명합니다.
모호함이 전혀 없죠.
</p>
</div>


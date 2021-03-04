Title: WebGL 3D - 카메라
Description: WebGL에서 카메라가 동작하는 방법
TOC: 3D Cameras


이번 게시물도 WebGL의 대한 연속된 포스팅 입니다. 
처음엔 "webgl-fundamental.html" 진행했고, 이전 포스팅은 3D 원근 투영이 였습니다.
아직 읽어보지 않았다면 그것부터 읽어 보십시요.

지난 포스팅에서 우리는 F를 절두체 안에 이동시켜야 했습니다.
왜냐하면 'm4.perspective' 함수가 그것을 원점에 위치할것이라 기대했기 때문입니다.
절두체 안의 물체는 절두체 내부 -zNear ~ -zFar 에 있습니다.

물체를 view의 앞에 이동시키는 것은 올바른 방법이 아니지 않습니까?
실제 세상에서는 건물의 사진을 찍을때 너는 카메라를 들고 이동합니다. 

{{{diagram url="resources/camera-move-camera.html?mode=0" caption="moving the camera to the objects" }}}

너는 보통 카메라 앞으로 건물을 이동시키지 않습니다.

{{{diagram url="resources/camera-move-camera.html?mode=1" caption="moving the objects to the camera" }}}

그러나 우리의 지난 포스팅에서 우리는 -Z축 앞에 원점으로부터 물체가 있기를
요구하는 투영법을 생각했습니다.
우리가 원하는 것을 달성하기 위해서는 카메라를 원점으로 이동합니다.
그리고 나머지들을 적절한 양만큼 이동합니다.
그래서 카메라와 상대거리 만큼 동일한 위치에 있게 합니다.

{{{diagram url="resources/camera-move-camera.html?mode=2" caption="moving the objects to the view" }}}

우리는 카메라 앞으로 world 공간을 효과적으로 움직일 필요가 있습니다.
가장 쉬운 방법은 역행렬을 사용하는 것입니다.
일반적인 경우는 역행렬 계산하는 수학은 복잡하지만 개념적으로 쉽습니다.
반대'역'는 다른값을 부정하는데 사용하는 값입니다.
예를들어 X에서 123으로 변환하는 역행렬은 X에서 -123으로 변환하는 행렬 입니다.
5로 크기변환되는 역행렬은 5/1 또는 0.2로 크기변환 되는 행렬 입니다.
X축으로 30도 만큼 회전하는 역행렬은 X축으로 -30도 회전하는 행렬입니다.

이 시점까지 우리는 이동,회전, 크기변환을 'F'의 방향과 위치를 영향을 주는데 사용 했습니다. 
모든 행렬의 곱셈 이후에는 어떻게 F가 원점으로 특정 지점까지 움직이는 지,
우리가 원하는 크기와 방향을 하나의 행렬을 가집니다.
우리는 카메라에도 똑같이 할 수 있습니다.
이 시점까지 어떻게 원점으로 부터 우리가 원하는 지점까지 카메라를 이동하고 회전하는
방법을 말해주는 행렬이 있으면, 우리는 이동, 회전 전부 반대 방향으로 하는 
역행렬을 계산할수 있습니다.
그래서 카메라는 (0,0,0)에 있도록 위치하고, 우리는 모든것을 카메라 앞에 이동했습니다.

위의 그림과 같이 'F'의 회전을 3D scene을 만들어 봅시다.

먼저, 우리는 'F'를 5개를 그릴 것입니다. 
그리고 그것들은 반복문 밖에서 계산될 동일한  투영 행렬을 사용 한다. 

```js

// Compute the projection matrix
var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
var zNear = 1;
var zFar = 2000;
var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

```

다음으로 우리는 카메라 행렬을 계산할것이다. 
이 행렬은 카메라의 위치와 방향을 월드좌표계에 나타낸다.
아래 코드는 원점 반경 * 1.5 거리를 중심으로 카메라를 회전시키고
원점을 바라보게 만듭니다.

{{{diagram url="resources/camera-move-camera.html?mode=3" caption="camera movement" }}}

```js
var numFs = 5;
var radius = 200;

// Compute a matrix for the camera
var cameraMatrix = m4.yRotation(cameraAngleRadians);
cameraMatrix = m4.translate(cameraMatrix, 0, 0, radius * 1.5);
```

우리는 카메라 행렬에서 뷰 행렬으로 계산 합니다.
'뷰 행렬'은 마치 카메라의 원점이 (0,0,0) 있는 것 처럼
모든것을 카메라의 반대편으로 효과적으로 이동을 시키는 행렬 입니다.
우리는 "역"을 사용함으로써 역행렬을 계산할수 있는데, (제공된 행렬의 정반대를 수행하는 행렬)
이런 경우는 제공된 행렬은 카메라를 다른 지점, 원점에 상대적인 방향으로 이동합니다.
이 역행렬은 모든것을 이동시켜서 카메라를 원점에 있도록 만듭니다.

```js
// Make a view matrix from the camera matrix.
var viewMatrix = m4.inverse(cameraMatrix);
```

이제 우리는 뷰와 투영 행렬을 뷰 투영 행렬로 합칩니다.

```js
// Compute a view projection matrix
var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);
```

마침내 우리는 F의 원을 그립니다. 
각 F는 우리는 뷰 투영 행렬로 시작해서, 반지름 단위로 이동하고 회전합니다.

```js
for (var ii = 0; ii < numFs; ++ii) {
  var angle = ii * Math.PI * 2 / numFs;
  var x = Math.cos(angle) * radius;
  var y = Math.sin(angle) * radius

  // starting with the view projection matrix
  // compute a matrix for the F
  var matrix = m4.translate(viewProjectionMatrix, x, 0, y);

  // Set the matrix.
  gl.uniformMatrix4fv(matrixLocation, false, matrix);

  // Draw the geometry.
  var primitiveType = gl.TRIANGLES;
  var offset = 0;
  var count = 16 * 6;
  gl.drawArrays(primitiveType, offset, count);
}
```

그리고 짜잔! 'F'의 원을 주변으로 카메라가 회전 합니다.
'카메라각도' 슬라이더 항목을 드래그 하여 카메라를 움직여보자.

{{{example url="../webgl-3d-camera.html" }}}

이것도 괜찮지만, 회전과 변환을 사용해서 카메라를 당신이 원하는 위치에 
이동하는 것은 항상 쉬운것은 아닙니다.
예를들어 만약 우리가 카메라를 특정 지점에 항상 가리키게 하려면, 
카메라가 'F' 주위를 돌면서 특정 'F'의 지점을 가리키게 하는 방법을 계산하는 것은
꽤 미친 수학이 필요 합니다.

다행히 더 쉬운 방법이 있습니다. 카메라를 원하는 위치와 가리키는 대상을
결정한 다음 거기에 카메라를 배치할 행렬을 계산 할수 있습니다.
이러한 방법으로 행렬이 동작하는 방법은 놀랄도록 쉽습니다.

먼저 우리는 원하는 카메라를 위치를 알 필요가 있습니다.
우리는 이것을 'cameraPosition'으로 부를 것 입니다.
그런 다음 우리는 우리가 보거나 겨냥하고 싶은 것의 위치를 알아야 합니다.
우리는 그것을 'target'으로 부를 것 입니다.
만약 우리가 'cameraPosition' 에서 'target'을 빼면 'target'에 도달하기 위해
카메라가 가야할 방향을 가리키는 벡터가 생깁니다.
이를 'zAxis'라고 합시다.
-z 방향의 카메라 포인트를 우리는 알고 있기 때문에, 우리는 'cameraPosition' - 'target'을 
뺄수 있습니다.
우리는 결과는 정규화 하고 그것을 행렬에 'z' 부분에 복사합니다.

<div class="webgl_math_center"><pre class="webgl_math">
+----+----+----+----+
|    |    |    |    |
+----+----+----+----+
|    |    |    |    |
+----+----+----+----+
| Zx | Zy | Zz |    |
+----+----+----+----+
|    |    |    |    |
+----+----+----+----+
</pre></div>

행렬의 부분은 Z축을 나타냅니다. 이런 경우 카메라의 Z축 입니다.
벡터를 정규화 한다는 것은 벡터를 1.0으로 나타내는 것을 의미합니다.
만약 당신이 2D rotation article로 돌아간다면,
우리는 그곳에서 단위 원과 2D 회전에 대해 도움이 되는지에 대해 살펴보았다.
3D에서는 우리는 구의 단위가 필요하고, 정규화된 벡터는 구의 한점을 나타낸다.

{{{diagram url="resources/cross-product-diagram.html?mode=0" caption="the <span class='z-axis'>z axis</span>" }}}

그래도 정보가 충분치 않습니다. 하나의 벡터가 우리에게 구체위에 있는 지점을 
제공하지만, 다른 지점을 가리키는 방향은 무엇입니까 ?
우리는 행렬의 다른 부분들을 채울 필요합니다. 특별히 x축과 y축 부분 입니다.
우리는 이러한 3 방향이 서로 직각인것을 알고 있습니다.
우리는 또한 일반적으로 카메라를 똑바로 가리키지 않는다는 것도 알고 있습니다.
주어진 대로, 만약 우리가 어느 방향이 위인지 알고 있다면, 이러한 경우 (0, 1, 0)
우리는 "외적"으로 불리는 것을 행렬을 위한 X축, Y축 계산하는데 사용할수 있습니다.

나는 수학적 용어에서 외적이 무엇을 의미하는지 모릅니다.
내가 아는 것은 만약 당신이 2개의 단위벡터가 있고, 그것들의 외적을 계산하면
그 2개의 벡터에 수직인 벡터를 얻을수 있다.
즉 당신은 남동쪽을 가리키는 벡터가 있고,  그리고 위를 가리키는 벡터가 있고,
그리고 2 벡터가 직각이기 대문에
너는 외적을 계산해보면 남동쪽 혹은 북동쪽을 가리키는 벡터를 얻는다.
외적을 계산하는 순서에 따라 반대의 답을 얻을 것이다.

이러한 경우 우리는 <span class="z-axis">`zAxis`</span> 그리고
<span style="color: gray;">`위`</span> 의 외적을 계산한다면 우리는 카메라의 대한 <span class="x-axis">xAxis</span>  
를 얻을 것이다.

{{{diagram url="resources/cross-product-diagram.html?mode=1" caption="<span style='color:gray;'>up</span> cross <span class='z-axis'>zAxis</span> = <span class='x-axis'>xAxis</span>" }}}

이제 우리는 <span class="x-axis">`xAxis`</span> 이 생겼으므로  <span class="z-axis">`zAxis`</span> 과 <span class="x-axis">`xAxis`</span>
을 외적하여 카메라의  <span class="y-axis">`yAxis`</span>을 얻을 수 있습니다.

{{{diagram url="resources/cross-product-diagram.html?mode=2" caption="<span class='z-axis'>zAxis</span> cross <span class='x-axis'>xAxis</span> = <span class='y-axis'>yAxis</span>"}}}


이제 우리가 해야하는 것은 3개의 축을 행렬에 연결하는 것이다.
이것은 우리에게 'cameraPoistion' 에서 'target' 으로 향하는 행렬을 제공한다.
우리는 단지 위치만 추가해주면 된다.

<div class="webgl_math_center"><pre class="webgl_math">
+----+----+----+----+
| <span class="x-axis">Xx</span> | <span class="x-axis">Xy</span> | <span class="x-axis">Xz</span> |  0 |  <- <span class="x-axis">x axis</span>
+----+----+----+----+
| <span class="y-axis">Yx</span> | <span class="y-axis">Yy</span> | <span class="y-axis">Yz</span> |  0 |  <- <span class="y-axis">y axis</span>
+----+----+----+----+
| <span class="z-axis">Zx</span> | <span class="z-axis">Zy</span> | <span class="z-axis">Zz</span> |  0 |  <- <span class="z-axis">z axis</span>
+----+----+----+----+
| Tx | Ty | Tz |  1 |  <- camera position
+----+----+----+----+
</pre></div>

여기에 2벡터를 외적하는 코드가 있다.

```js
function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1],
          a[2] * b[0] - a[0] * b[2],
          a[0] * b[1] - a[1] * b[0]];
}
```

여기에 두 벡터를 빼는 코드가 있다.

```js
function subtractVectors(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
```

여기에 벡터를 정규화 하는 코드가 있다. (단위 벡터로 만든다)

```js
function normalize(v) {
  var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  // make sure we don't divide by 0.
  if (length > 0.00001) {
    return [v[0] / length, v[1] / length, v[2] / length];
  } else {
    return [0, 0, 0];
  }
}
```

여기에 "lookat" 행렬을 계산하는 코드가 있다.

```js
var m4 = {
  lookAt: function(cameraPosition, target, up) {
    var zAxis = normalize(
        subtractVectors(cameraPosition, target));
    var xAxis = normalize(cross(up, zAxis));
    var yAxis = normalize(cross(zAxis, xAxis));

    return [
       xAxis[0], xAxis[1], xAxis[2], 0,
       yAxis[0], yAxis[1], yAxis[2], 0,
       zAxis[0], zAxis[1], zAxis[2], 0,
       cameraPosition[0],
       cameraPosition[1],
       cameraPosition[2],
       1,
    ];
  }
```

그리고 여기에 우리가 어떻게 카메라 지점을 특정 'F'에 가리키도록 하는 방법이 있다.
마치 우리가 이동하는 것 처럼.

```js
  ...

  // Compute the position of the first F
  var fPosition = [radius, 0, 0];

  // Use matrix math to compute a position on a circle where
  // the camera is
  var cameraMatrix = m4.yRotation(cameraAngleRadians);
  cameraMatrix = m4.translate(cameraMatrix, 0, 0, radius * 1.5);

  // Get the camera's position from the matrix we computed
  var cameraPosition = [
    cameraMatrix[12],
    cameraMatrix[13],
    cameraMatrix[14],
  ];

  var up = [0, 1, 0];

  // Compute the camera's matrix using look at.
  var cameraMatrix = m4.lookAt(cameraPosition, fPosition, up);

  // Make a view matrix from the camera matrix.
  var viewMatrix = m4.inverse(cameraMatrix);

  ...
```

여기 결과 다.

{{{example url="../webgl-3d-camera-look-at.html" }}}

슬라이더를 드래고 하고 어떻게 'F'를 카메라가 찾는방법을 확인한다.

카메라 이외에도 "lookAt" 행렬을 사용을 할 수 있습니다.
흔한 사용은 캐릭터의 얼굴이 누군가를 향하게 만드는 것 입니다.
터렛에 타겟에 목표로 합니다.
물체가 길을 따라가도록 합니다. 너는 경로의 위치를 계산 합니다.
그런 다음 당신이 계산하는 것은  앞으로의 움직임이 될것 입니다
"lookAt" 함수에 위 두 값을 연결하시오.
그러면 너의 물체가 길을 따라가고
길에 방향을 향하게 하는 행렬을 얻을 것 입니다.

Let's [learn about animation next](webgl-animation.html).

<div class="webgl_bottombar">
<h3>lookAt standards</h3>
<p>

대부분의 3D 수학 라이브러리는 <code>lookAt</code> 기능이 있습니다.
종종 그것은 특별히 "camera matrix"가 아닌 "view matrix" 만들기 위해서 디자인 됩니다.
다른 말로, 카메라만 단순히 움직이는 행렬이 아닌 
카메라 앞에 모든것을 움직이는 행렬을 만듭니다.

</p>
<p>

나는 덜 유용하다고 생각 합니다. 지적 했듯이, lookAt 기능은 많이 사용됩니다.
뷰 행렬이 필요하다면 <code>inverse</code>를 쉽게 호출할수 있지만
몇몇 캐릭터의 머리가 다른 캐릭터나 혹은 목표에 겨냥하고 있는 터렛을 따라가게 
만들때 <code>lookAt</code> 기능을 당신은 사용하고 있습니다.
만일 <code>lookAt</code> 기능이 월드 공간에서 물체의 위치나 방향을 정하는 행렬을 제공하면
훨씬 유용할것이다.

</p>
{{{example url="../webgl-3d-camera-look-at-heads.html" }}}
</div>

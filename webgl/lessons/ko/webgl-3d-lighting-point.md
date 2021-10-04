Title: WebGL 3D - 점 조명
Description: WebGL에서 점 조명을 구현하는 방법
TOC: 점 조명


이 글은 [WebGL 3D 방향성 조명](webgl-3d-lighting-directional.html)에서 이어집니다.
아직 읽지 않았다면 [거기](webgl-3d-lighting-directional.html)부터 시작하는 게 좋습니다.

마지막 글에서 우리는 같은 방향에서 빛이 균일하게 들어오는 방향성 조명을 살펴 봤는데요.
렌더링 전에 해당 방향을 설정했었습니다.

조명의 방향을 설정하는 대신 3D 공간의 한 점을 선택하고 셰이더에서 모델 표면의 임의의 지점에서 방향을 계산하면 어떨까요?

{{{diagram url="resources/point-lighting.html" width="500" height="400" className="noborder" }}}

위 표면을 회전시키면 표면의 각 지점이 가지는 *surface -> light* 벡터가 어떻게 다른지 알 수 있는데요.
표면 법선과 표면에서 조명을 향하는 각 벡터의 스칼라곱을 구하면, 표면의 각 지점에서 다른 값을 얻을 수 있습니다.

먼저 조명 위치가 필요합니다.

    uniform vec3 u_lightWorldPosition;

그리고 표면의 world position을 계산하는 방법이 필요한데요.
이를 위해 위치에 world matrix를 곱할 수 있습니다.

    uniform mat4 u_world;

    ...

    // 표면의 world position 계산
    vec3 surfaceWorldPosition = (u_world * a_position).xyz;

그리고 표면에서 조명까지의 벡터를 계산할 수 있습니다.
이번엔 표면의 모든 위치에서 한 지점까지의 벡터를 계산합시다.

    v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;

다음은 컨텍스트의 전부입니다.

    attribute vec4 a_position;
    attribute vec3 a_normal;

    +uniform vec3 u_lightWorldPosition;

    +uniform mat4 u_world;
    uniform mat4 u_worldViewProjection;
    uniform mat4 u_worldInverseTranspose;

    varying vec3 v_normal;

    +varying vec3 v_surfaceToLight;

    void main() {
      // 위치를 행렬로 곱하기
      gl_Position = u_worldViewProjection * a_position;

      // 법선의 방향을 정하고 fragment shader로 전달
      v_normal = mat3(u_worldInverseTranspose) * a_normal;

    +  // 표면의 world position 계산
    +  vec3 surfaceWorldPosition = (u_world * a_position).xyz;
    +
    +  // surface -> light 벡터를 계산하고 fragment shader로 전달
    +  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
    }

surface -> light 벡터는 단위 벡터가 아니기 때문에 fragment shader에서 정규화해야 합니다.
참고로 vertex shader에서 정규화할 수 있었지만 `varying`이기 때문에 위치 사이를 선형적으로 보간하기 때문에 완전한 단위 벡터가 아니게 됩니다.

    precision mediump float;

    // Vertex shader에서 전달
    varying vec3 v_normal;
    +varying vec3 v_surfaceToLight;

    -uniform vec3 u_reverseLightDirection;
    uniform vec4 u_color;

    void main() {
      // v_normal은 varying이기 때문에 보간되므로 단위 벡터가 아닙니다.
      // 정규화하면 다시 단위 벡터가 됩니다.
      vec3 normal = normalize(v_normal);

      vec3 surfaceToLightDirection = normalize(v_surfaceToLight);

    -  float light = dot(normal, u_reverseLightDirection);
    +  float light = dot(normal, surfaceToLightDirection);

      gl_FragColor = u_color;

      // 색상 부분(alpha 제외)에만 light 곱하기
      gl_FragColor.rgb *= light;
    }

그런 다음 `u_world`와 `u_lightWorldPosition`의 위치를 찾아야 합니다.

```
-  var reverseLightDirectionLocation =
-      gl.getUniformLocation(program, "u_reverseLightDirection");
+  var lightWorldPositionLocation =
+      gl.getUniformLocation(program, "u_lightWorldPosition");
+  var worldLocation =
+      gl.getUniformLocation(program, "u_world");
```

그리고 그것들을 설정합니다.

```
  // 행렬 설정
+  gl.uniformMatrix4fv(
+    worldLocation,
+    false,
+    worldMatrix
+  );
  gl.uniformMatrix4fv(
    worldViewProjectionLocation,
    false,
    worldViewProjectionMatrix
  );

  ...

-  // 조명 방향 설정
-  gl.uniform3fv(reverseLightDirectionLocation, m4.normalize([0.5, 0.7, 1]));
+  // 조명 위치 설정
+  gl.uniform3fv(lightWorldPositionLocation, [20, 30, 50]);
```

그리고 여기 결과 입니다.

{{{example url="../webgl-3d-lighting-point.html" }}}

이제 반사광 강조를 추가할 수 있습니다.

현실의 물체를 보면 먼 곳에서 조명이 비칠 때 거울처럼 빛을 반사하는데요.

<img class="webgl_center" src="resources/specular-highlights.jpg" />

해당 효과는 빛이 눈에 반사되는지 계산하여 시뮬레이션할 수 있습니다.
다시 *스칼라곱*을 구합니다.

무엇을 확인해야 할까요?
생각해봅시다.
빛은 표면에 부딪히는 각도와 동일한 각도로 반사되는데, surface -> light 방향이 surface -> eye 방향과 정확히 반전이라면 완벽한 반사각입니다.

{{{diagram url="resources/surface-reflection.html" width="500" height="400" className="noborder" }}}

모델의 표면에서 조명을 향하는 방향을 알고, 표면에서 뷰/눈/카메라로 향하는 방향을 안다면, 이 두 벡터를 더하고 정규화해서, 이들 사이 중간에 있는 `halfVector`를 계산할 수 있습니다.
`halfVector`와 surface normal이 일치한다면 빛을 뷰/눈/카메라로 반사하기에 완벽한 각도입니다.
그럼 어떻게 일치하는지 알 수 있을까요?
이전에 했던 것처럼 *스칼라곱*을 구하면 됩니다.
(1 = 일치, 0 = 수직, -1 = 반대)

{{{diagram url="resources/specular-lighting.html" width="500" height="400" className="noborder" }}}

먼저 뷰/눈/카메라의 위치를 전달하고, surface -> view 벡터를 계산한 다음 fragment shader로 전달해야 합니다.

    attribute vec4 a_position;
    attribute vec3 a_normal;

    uniform vec3 u_lightWorldPosition;
    +uniform vec3 u_viewWorldPosition;

    uniform mat4 u_world;
    uniform mat4 u_worldViewProjection;
    uniform mat4 u_worldInverseTranspose;

    varying vec3 v_normal;

    varying vec3 v_surfaceToLight;
    +varying vec3 v_surfaceToView;

    void main() {
      // 위치를 행렬로 곱하기
      gl_Position = u_worldViewProjection * a_position;

      // 법선의 방향을 정하고 fragment shader로 전달
      v_normal = mat3(u_worldInverseTranspose) * a_normal;

      // 표면의 world position 계산
      vec3 surfaceWorldPosition = (u_world * a_position).xyz;

      // surface -> light 벡터를 계산하고 fragment shader로 전달
      v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;

    +  // surface -> view/camera 벡터를 계산하고 fragment shader로 전달
    +  v_surfaceToView = u_viewWorldPosition - surfaceWorldPosition;
    }

다음으로 fragment shader에서 surface -> view 벡터와 surface -> light 벡터 사이의 `halfVector`를 계산해야 합니다.
그런 다음 `halfVector`와 법선의 스칼라곱을 구하여, 빛이 뷰로 반사되는지 확인할 수 있습니다.

    // Vertex shader에서 전달
    varying vec3 v_normal;
    varying vec3 v_surfaceToLight;
    +varying vec3 v_surfaceToView;

    uniform vec4 u_color;

    void main() {
      // v_normal이 varying이기 때문에 보간되므로 단위 벡터가 아닙니다.
      // 정규화하면 다시 단위 벡터가 됩니다.
      vec3 normal = normalize(v_normal);

    +  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
    +  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
    +  vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);

      float light = dot(normal, surfaceToLightDirection);
    +  float specular = dot(normal, halfVector);

      gl_FragColor = u_color;

      // 색상 부분(alpha 제외)에만 light 곱하기
      gl_FragColor.rgb *= light;

    +  // Specular 더하기
    +  gl_FragColor.rgb += specular;
    }

마지막으로 `u_viewWorldPosition`을 찾아 설정해야 합니다.

    var lightWorldPositionLocation =
        gl.getUniformLocation(program, "u_lightWorldPosition");
    +var viewWorldPositionLocation =
    +    gl.getUniformLocation(program, "u_viewWorldPosition");

    ...

    // 카메라 행렬 계산
    var camera = [100, 150, 200];
    var target = [0, 35, 0];
    var up = [0, 1, 0];
    var cameraMatrix = makeLookAt(camera, target, up);

    +// 카메라/뷰 위치 설정
    +gl.uniform3fv(viewWorldPositionLocation, camera);

그리고 여기 결과입니다.

{{{example url="../webgl-3d-lighting-point-specular.html" }}}

**으악 너무 밝아!**

스칼라곱을 거듭 제곱해서 밝기를 수정할 수 있습니다.
이는 반사되는 가장 밝은 부분을 linear falloff에서 exponential falloff로 더 작게 만듭니다.

{{{diagram url="resources/power-graph.html" width="300" height="300" className="noborder" }}}

빨간 선이 그래프 위쪽에 가까울수록 반사광이 추가되어 더 밝아집니다.
반대로 `power`를 높이면 밝아지는 범위가 오른쪽으로 축소되죠.

이걸 `shininess`라고 명명하고 셰이더에 추가합시다.

    uniform vec4 u_color;
    +uniform float u_shininess;

    ...

    -  float specular = dot(normal, halfVector);
    +  float specular = 0.0;
    +  if (light > 0.0) {
    +    specular = pow(dot(normal, halfVector), u_shininess);
    +  }

스칼라곱은 음수가 될 수 있습니다.
하지만 음수를 거듭 제곱하는 건 WebGL에 정의되어 있지 않은데요.
그러니 스칼라곱이 음수가 된다면 specular를 0.0으로 남겨둡시다.

물론 위치를 찾고 설정해야 합니다.

    +var shininessLocation = gl.getUniformLocation(program, "u_shininess");

    ...

    // Shininess 설정
    gl.uniform1f(shininessLocation, shininess);

그리고 여기 결과입니다.

{{{example url="../webgl-3d-lighting-point-specular-power.html" }}}

마지막으로 이 글에서 다루고 싶은 건 조명 색상입니다.

지금까지 F에 전달하는 색상을 곱하기 위해 `light`를 사용했는데요.
색상을 가진 조명을 원한다면 조명 색상을 제공할 수 있습니다.

    uniform vec4 u_color;
    uniform float u_shininess;
    +uniform vec3 u_lightColor;
    +uniform vec3 u_specularColor;

    ...

      // 색상 부분(alpha 제외)에만 light 곱하기
    *  gl_FragColor.rgb *= light * u_lightColor;

      // Specular 더하기
    *  gl_FragColor.rgb += specular * u_specularColor;
    }

그리고 당연히

    +  var lightColorLocation =
    +      gl.getUniformLocation(program, "u_lightColor");
    +  var specularColorLocation =
    +      gl.getUniformLocation(program, "u_specularColor");

그리고

    // 조명 색상 설정
    +  gl.uniform3fv(lightColorLocation, m4.normalize([1, 0.6, 0.6]));  // 빨간 조명
    // 반사광 색상 설정
    +  gl.uniform3fv(specularColorLocation, m4.normalize([1, 0.6, 0.6]));  // 빨간 조명

{{{example url="../webgl-3d-lighting-point-color.html" }}}

다음은 [스포트라이트](webgl-3d-lighting-spot.html)입니다.

<div class="webgl_bottombar">
<h3>왜 <code>pow(negative, power)</code>는 정의되어 있지 않나요?</h3>
<p>이게 무슨 뜻일까요?</p>
<div class="webgl_center"><pre class="glocal-center-content">pow(5, 2)</pre></div>
<p>이렇게 볼 수 있고</p>
<div class="webgl_center"><pre class="glocal-center-content">5 * 5 = 25</pre></div>
<p>이건</p>
<div class="webgl_center"><pre class="glocal-center-content">pow(5, 3)</pre></div>
<p>이렇게 볼 수 있죠.</p>
<div class="webgl_center"><pre class="glocal-center-content">5 * 5 * 5 = 125</pre></div>
<p>그럼 이건 어떤가요?</p>
<div class="webgl_center"><pre class="glocal-center-content">pow(-5, 2)</pre></div>
<p>이렇게 될 수 있으며</p>
<div class="webgl_center"><pre class="glocal-center-content">-5 * -5 = 25</pre></div>
<p>그리고</p>
<div class="webgl_center"><pre class="glocal-center-content">pow(-5, 3)</pre></div>
<p>다음과 같이 볼 수 있겠죠.</p>
<div class="webgl_center"><pre class="glocal-center-content">-5 * -5 * -5 = -125</pre></div>
<p>
아시다시피 음수를 음수로 곱하면 양수를 만듭니다.
다시 음수로 곱하면 음수를 만드는데요.
</p>
<p>그럼 이게 의미하는 건 뭘까요?</p>
<div class="webgl_center"><pre class="glocal-center-content">pow(-5, 2.5)</pre></div>
<p>
결과가 양수인지 음수인지 어떻게 결정할까요?
그건 <a href="https://betterexplained.com/articles/a-visual-intuitive-guide-to-imaginary-numbers/">허수</a>의 영역입니다.
</p>
</div>


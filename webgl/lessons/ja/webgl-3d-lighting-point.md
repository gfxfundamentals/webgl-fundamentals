Title: WebGL三次元点光源
Description: WebGLで点光源の計算し方
TOC: 三次元点光源


この記事は[WebGLで指向性光源の記事の続き](webgl-3d-lighting-directional.html)である。
まだ読んでいなかったら[先に読んで下さい](webgl-3d-lighting-directional.html)。

前回の記事は光線がお互いに平行に進んでいく指向性光源についてだった。描画する前に光線の方向を設定した。

光線の方向を設定する変わりに光源の位置を決めて、
その位置からオブジェクトの表面までの方向を計算したらどうだろう？
それが点光源である。

{{{diagram url="resources/point-lighting.html" width="500" height="400" className="noborder" }}}

上の表面を回転してみると、表面位置ごとに表面から光源位置までの法線ベクトルが違う方向になることを気付くだろう。
表面の法線ベクトルと表面位置から光源位置への法線ベクトルの内積を計算すると表面位置ごとに違う値が出る。

それをしよう！

最初に光源の位置が要る。

    uniform vec3 u_lightWorldPosition;

そしてオブジェクト表面ワールド位置の計算する方法が必要である。そのために座標位置をワールド行列に掛ける。

    uniform mat4 u_world;

    ...

    // オブジェクトの表面のワールド位置を計算する。
    vec3 surfaceWorldPosition = (u_world * a_position).xyz;

そして、表面から光源位置のベクトルを計算出来る。それは前の計算に似てるけど、
今回全部の表面位置で計算する。

    v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;

シェーダーはこうなっている。

    attribute vec4 a_position;
    attribute vec3 a_normal;

    +uniform vec3 u_lightWorldPosition;

    +uniform mat4 u_world;
    uniform mat4 u_worldViewProjection;
    uniform mat4 u_worldInverseTranspose;

    varying vec3 v_normal;

    +varying vec3 v_surfaceToLight;

    void main() {
      // positionを行列に掛ける。
      gl_Position = u_worldViewProjection * a_position;

      // 法線ベクトルの向きを計算して、ピクセルシェーダーに渡す。
      v_normal = mat3(u_worldInverseTranspose) * a_normal;

    +  // オブジェクトの表面のワールド位置を計算する。
    +  vec3 surfaceWorldPosition = (u_world * a_position).xyz;
    +
    +  // オブジェクトの表面から光源の法線ベクトルを計算して、
    +  // ピクセルシェーダーに渡す。
    +  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
    }

ピクセルシェーダーで表面〜光源ベクトルは単位ベクトルになってないので正規化しなければいけない。

    precision mediump float;

    // 頂点シェーダーに渡された。
    varying vec3 v_normal;
    +varying vec3 v_surfaceToLight;

    -uniform vec3 u_reverseLightDirection;
    uniform vec4 u_color;

    void main() {
      // v_normalはバリイングなので頂点の間に補間される。
      // なので単位ベクトルになっていない。ノーマライズすると
      // 単位ベクトルに戻す。
      vec3 normal = normalize(v_normal);

      vec3 surfaceToLightDirection = normalize(v_surfaceToLight);

    -  float light = dot(normal, u_reverseLightDirection);
    +  float light = dot(normal, surfaceToLightDirection);

      gl_FragColor = u_color;

      // 色部分だけ光源に掛けよう（アルファ/透明の部分を無視）
      gl_FragColor.rgb *= light;
    }


`u_world`と`u_lightWorldPosition`のロケーションを調べなきゃ。

```
-  var reverseLightDirectionLocation =
-      gl.getUniformLocation(program, "u_reverseLightDirection");
+  var lightWorldPositionLocation =
+      gl.getUniformLocation(program, "u_lightWorldPosition");
+  var worldLocation =
+      gl.getUniformLocation(program, "u_world");
```

そして設定する。

```
  // 行列を設定する。
+  gl.uniformMatrix4fv(
+      worldLocation, false,
+      worldMatrix);
  gl.uniformMatrix4fv(
      worldViewProjectionLocation, false,
      worldViewProjectionMatrix);

  ...

-  // 光線の方向を設定する。
-  gl.uniform3fv(reverseLightDirectionLocation, m4.normalize([0.5, 0.7, 1]));
+  // 光源の位置をを設定する。
+  gl.uniform3fv(lightWorldPositionLocation, [20, 30, 50]);
```

そしてこれである。

{{{example url="../webgl-3d-lighting-point.html" }}}

点光源が出来たので反射光を追加出来る。

本物のオブジェクトを見ると、ちょっとでも光沢があれば、目に直接光が反射すると鏡のようになる。

<img class="webgl_center" src="resources/specular-highlights.jpg" />

光源の反射が目に当たるかどうかの計算でその結果も描画出来る。また内積の手を借りおう！

今回何を見ればいいかちょっと考えてみよう。光線の反射角度は当たる角度と同じである。
それで光線と表面の角度と、その表面と表面の角度が同じなら光線が目に反射される。

{{{diagram url="resources/surface-reflection.html" width="500" height="400" className="noborder" }}}

オブジェクトの表面から光源の方向が分かって（さっきにそれを計算したばかり！）、
そして目/カメラ/ビューからオブジェクトの表面の方向を知ってれば、その2つの法線を足して、
正規化するとちょうどの真ん中の半分法線ベクトルが出る。その真ん中の法線ベクトルと表面の法線ベクトルが
同じになっていれば目に反射する角度になっている。同じになっているかどうがどういうふうに判断するか？
またその2つの法線の内積を計算して、１になると同じ方向である。0になるとお互いに垂直になっている。
-1になると反対になっている。

{{{diagram url="resources/specular-lighting.html" width="500" height="400" className="noborder" }}}

まずビュー/目/カメラの位置をシェーダーに渡さなければいけない。それでオブジェクトの表面から
ビューの法線を計算して、ピクセルシェーダーを渡す。

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
      // positionを行列に掛ける。
      gl_Position = u_worldViewProjection * a_position;

      // 法線ベクトルの向きを計算して、ピクセルシェーダーに渡す。
      v_normal = mat3(u_worldInverseTranspose) * a_normal;

      // オブジェクトの表面のワールド位置を計算する。
      vec3 surfaceWorldPosition = (u_world * a_position).xyz;

      // オブジェクトの表面から光源の法線ベクトルを計算して、
      // ピクセルシェーダーに渡す。
      v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;

    +  // オブジェクトの表面からビュー/カメラの法線ベクトルを計算して、
    +  // ビクセルシェーダーに渡す。
    +  v_surfaceToView = u_viewWorldPosition - surfaceWorldPosition;
    }

次にピクセルシェーダーで表面〜ビュー法線ベクトルを表面〜光源法線ベクトルの間の真ん中の法線を計算しなきゃ。
出来たら、真ん中の法線とオブジェクト法線の内積の計算で、光源が目に反射しているかどうか判断出来る。

    // 頂点シェーダーから渡された。
    varying vec3 v_normal;
    varying vec3 v_surfaceToLight;
    +varying vec3 v_surfaceToView;

    uniform vec4 u_color;

    void main() {
      // v_normalはバリイングなので頂点の間に補間される。
      // なので単位ベクトルになっていない。ノーマライズすると
      // 単位ベクトルに戻す。
      vec3 normal = normalize(v_normal);

    +  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
    +  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
    +  vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);

      float light = dot(normal, surfaceToLightDirection);
    +  float specular = dot(normal, halfVector);

      gl_FragColor = u_color;

      // 色部分だけ光源に掛けよう（アルファ/透明の部分を無視）
      gl_FragColor.rgb *= light;

    +  // 反射の影響をただ色に足す。
    +  gl_FragColor.rgb += specular;
    }

最後に`u_viewWorldPosition`を調べて、設定する。

    var lightWorldPositionLocation =
        gl.getUniformLocation(program, "u_lightWorldPosition");
    +var viewWorldPositionLocation =
    +    gl.getUniformLocation(program, "u_viewWorldPosition");

    ...

    // カメラの行列を計算する。
    var camera = [100, 150, 200];
    var target = [0, 35, 0];
    var up = [0, 1, 0];
    var cameraMatrix = makeLookAt(camera, target, up);

    +// カメラ/ビューの位置をシェーダーに渡す。
    +gl.uniform3fv(viewWorldPositionLocation, camera);


そしてこれ！

{{{example url="../webgl-3d-lighting-point-specular.html" }}}

**眩し過ぎ！**

内積の結果になる数を累乗すると眩しさを調整出来る。それはハイライトをぐしゃっと潰して、
光形から指数関数的減衰にする。

{{{diagram url="resources/power-graph.html" width="300" height="300" className="noborder" }}}

赤い線がグラフの上の方に近づけば近づくほどハイライトが明るくなる。
ある数を累乗すると明るくなる部分が縮まってくる。

それを`shininess`と呼んでシェーダーに追加しよう。

    uniform vec4 u_color;
    +uniform float u_shininess;

    ...

    -  float specular = dot(normal, halfVector);
    +  float specular = 0.0;
    +  if (light > 0.0) {
    +    specular = pow(dot(normal, halfVector), u_shininess);
    +  }

内積はマイナスになる時がある。マイナス値をにある数を累乗すると虚数になってしまう。
なので、内積がマイナスになりそうならspecularを0.0に残す。

勿論ロケーションを調べて設定しなきゃ

    +var shininessLocation = gl.getUniformLocation(program, "u_shininess");

    ...

    // 光沢を設定する。
    gl.uniform1f(shininessLocation, shininess);

そうすればこうなる。

{{{example url="../webgl-3d-lighting-point-specular-power.html" }}}

最後に照明の色についてである

今までFの色を`light`に掛けていた。それに、照明の色を定義すれば色のついた光にすることも出来る。

    uniform vec4 u_color;
    uniform float u_shininess;
    +uniform vec3 u_lightColor;
    +uniform vec3 u_specularColor;

    ...

      // 色部分だけ光源に掛けよう（アルファ／透明の部分を無視)
    *  gl_FragColor.rgb *= light * u_lightColor;

      // 反射の影響をただ色に足す。
    *  gl_FragColor.rgb += specular * u_specularColor;
    }

そして勿論。。。

    +  var lightColorLocation =
    +      gl.getUniformLocation(program, "u_lightColor");
    +  var specularColorLocation =
    +      gl.getUniformLocation(program, "u_specularColor");

そして

    // 光源の色を設定する
    +  gl.uniform3fv(lightColorLocation, m4.normalize([1, 0.6, 0.6]));  // 赤光源
    // 反射色を設定する
    +  gl.uniform3fv(specularColorLocation, m4.normalize([1, 0.6, 0.6]));  // 赤光源

{{{example url="../webgl-3d-lighting-point-color.html" }}}

次は[スポットライト](webgl-3d-lighting-spot.html).



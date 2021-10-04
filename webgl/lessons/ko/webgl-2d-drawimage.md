Title: WebGL DrawImage 구현
Description: WebGL에서 Canvas 2D의 drawImage 함수를 구현하는 방법
TOC: 2D - DrawImage


이 글은 [WebGL orthographic 3D](webgl-3d-orthographic.html)에서 이어집니다.
아직 읽지 않았다면 [거기](webgl-3d-orthographic.html)부터 시작하는 게 좋습니다.
또한 텍스처와 텍스처 좌표가 어떻게 작동하는지 알아야 하기 때문에 [WebGL 3D 텍스처](webgl-3d-textures.html)를 읽어주세요.

2D로 구현하는 대부분의 게임은 이미지를 그리는 단일 함수만 있으면 됩니다.
물론 일부 2D 게임은 선으로 엄청난 작업을 수행하지만 화면에 2D 이미지를 그리는 방법만 있다면 대부분의 2D 게임을 만들 수 있습니다.

Canvas 2D API는 `drawImage`라는 이미지를 그리는 용도의 굉장히 유연한 함수가 있습니다.
이건 3가지 버전을 가지는데요.

    ctx.drawImage(image, dstX, dstY);
    ctx.drawImage(image, dstX, dstY, dstWidth, dstHeight);
    ctx.drawImage(image, srcX, srcY, srcWidth, srcHeight,
                         dstX, dstY, dstWidth, dstHeight);

지금까지 배운 내용을 모두 고려할 때 WebGL에서 이를 어떻게 구현하실 건가요?
첫 번째 해결책은 이 사이트의 첫 번째 글에서 했던 것처럼 정점을 생성하는 겁니다.
정점을 GPU로 보내는 것은 일반적으로 느린 작업입니다.

이게 WebGL의 모든 요점이 작용하는 곳입니다.
창의적으로 셰이더를 작성한 다음 해당 셰이더를 창의적으로 사용하여 문제를 해결하는 것이죠.

첫 번째 버전부터 시작해봅시다.

    ctx.drawImage(image, x, y);

이건 이미지와 같은 크기로 `x, y` 위치에 이미지를 그리는데요.
비슷한 WebGL 기반의 함수를 만들기 위해 `x, y`, `x + width, y`, `x, y + height`, `x + width, y + height`에 대한 정점을 업로드한 다음, 다른 위치에 다른 이미지를 그릴 때 다른 정점 세트를 생성합니다.

하지만 더 일반적인 방법은 단위 사각형을 사용하는 겁니다.
1단위 크기의 사각형 하나를 업로드합니다.
그런 다음 [행렬 수학](webgl-2d-matrices.html)을 사용하여 해당 단위 사각형의 크기를 조정하고 이동시켜 원하는 위치에 있도록 합니다.

먼저 간단한 vertex shader가 필요합니다.

    attribute vec4 a_position;
    attribute vec2 a_texcoord;

    uniform mat4 u_matrix;

    varying vec2 v_texcoord;

    void main() {
       gl_Position = u_matrix * a_position;
       v_texcoord = a_texcoord;
    }

간단한 fragment shader도 필요하죠.

    precision mediump float;

    varying vec2 v_texcoord;

    uniform sampler2D u_texture;

    void main() {
       gl_FragColor = texture2D(u_texture, v_texcoord);
    }

그리고 이제 함수입니다.

    // 이미지와 달리 텍스처는 너비와 높이가 없으므로 텍스처의 너비와 높이를 전달할 겁니다.
    function drawImage(tex, texWidth, texHeight, dstX, dstY) {
      gl.bindTexture(gl.TEXTURE_2D, tex);

      // Shader program 쌍을 사용하도록 WebGL에 지시
      gl.useProgram(program);

      // 버퍼에서 데이터를 가져오기 위한 attribute 설정
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
      gl.enableVertexAttribArray(texcoordLocation);
      gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

      // 이 행렬은 pixel에서 clip space로 변환합니다.
      var matrix = m4.orthographic(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);

      // 이 행렬은 사각형을 dstX,dstY로 이동시킵니다.
      matrix = m4.translate(matrix, dstX, dstY, 0);

      // 이 행렬은 사각형을 1단위에서 texWidth,texHeight 단위로 크기를 조정합니다.
      matrix = m4.scale(matrix, texWidth, texHeight, 1);

      // 행렬 설정
      gl.uniformMatrix4fv(matrixLocation, false, matrix);

      // texture unit 0에서 텍스처를 가져오도록 셰이더에 지시
      gl.uniform1i(textureLocation, 0);

      // 사각형 그리기 (삼각형 2개, 정점 6개)
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

일부 이미지를 텍스처에 로드합시다.

    // 텍스처 정보 생성 { width: w, height: h, texture: tex }
    // 텍스처는 1x1 픽셀로 시작하고 이미지가 로드되면 업데이트됩니다.
    function loadImageAndCreateTextureInfo(url) {
      var tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);

      // 모든 이미지가 2의 거듭 제곱이 아니라고 가정
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

      var textureInfo = {
        width: 1,   // 로드될 때까지 크기를 모름
        height: 1,
        texture: tex,
      };
      var img = new Image();
      img.addEventListener('load', function() {
        textureInfo.width = img.width;
        textureInfo.height = img.height;

        gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      });

      return textureInfo;
    }

    var textureInfos = [
      loadImageAndCreateTextureInfo('resources/star.jpg'),
      loadImageAndCreateTextureInfo('resources/leaves.jpg'),
      loadImageAndCreateTextureInfo('resources/keyboard.jpg'),
    ];

그리고 임의의 위치에 그릴 수 있습니다.

    var drawInfos = [];
    var numToDraw = 9;
    var speed = 60;
    for (var ii = 0; ii < numToDraw; ++ii) {
      var drawInfo = {
        x: Math.random() * gl.canvas.width,
        y: Math.random() * gl.canvas.height,
        dx: Math.random() > 0.5 ? -1 : 1,
        dy: Math.random() > 0.5 ? -1 : 1,
        textureInfo: textureInfos[Math.random() * textureInfos.length | 0],
      };
      drawInfos.push(drawInfo);
    }

    function update(deltaTime) {
      drawInfos.forEach(function(drawInfo) {
        drawInfo.x += drawInfo.dx * speed * deltaTime;
        drawInfo.y += drawInfo.dy * speed * deltaTime;
        if (drawInfo.x < 0) {
          drawInfo.dx = 1;
        }
        if (drawInfo.x >= gl.canvas.width) {
          drawInfo.dx = -1;
        }
        if (drawInfo.y < 0) {
          drawInfo.dy = 1;
        }
        if (drawInfo.y >= gl.canvas.height) {
          drawInfo.dy = -1;
        }
      });
    }

    function draw() {
      gl.clear(gl.COLOR_BUFFER_BIT);

      drawInfos.forEach(function(drawInfo) {
        drawImage(
          drawInfo.textureInfo.texture,
          drawInfo.textureInfo.width,
          drawInfo.textureInfo.height,
          drawInfo.x,
          drawInfo.y);
      });
    }

    var then = 0;
    function render(time) {
      var now = time * 0.001;
      var deltaTime = Math.min(0.1, now - then);
      then = now;

      update(deltaTime);
      draw();

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

여기서 실행되는 것을 볼 수 있습니다.

{{{example url="../webgl-2d-drawimage-01.html" }}}

캔버스 `drawImage` 함수의 버전 2를 다뤄봅시다.

    ctx.drawImage(image, dstX, dstY, dstWidth, dstHeight);

거의 다르지 않습니다.
`texWidth`와 `texHeight`를 대신하여 `dstWidth`와 `dstHeight`를 사용하면 됩니다.

    *function drawImage(
    *    tex, texWidth, texHeight,
    *    dstX, dstY, dstWidth, dstHeight) {
    +  if (dstWidth === undefined) {
    +    dstWidth = texWidth;
    +  }
    +
    +  if (dstHeight === undefined) {
    +    dstHeight = texHeight;
    +  }

      gl.bindTexture(gl.TEXTURE_2D, tex);

      ...

      // 이 행렬은 pixel에서 clip space로 변환합니다.
      var projectionMatrix = m3.projection(canvas.width, canvas.height, 1);

    *  // 이 행렬은 사각형을 1단위에서 dstWidth,dstHeight 단위로 크기 조정합니다.
    *  var scaleMatrix = m4.scaling(dstWidth, dstHeight, 1);

      // 이 행렬은 사각형을 dstX,dstY로 이동시킵니다.
      var translationMatrix = m4.translation(dstX, dstY, 0);

      // 모두 함께 곱합니다.
      var matrix = m4.multiply(translationMatrix, scaleMatrix);
      matrix = m4.multiply(projectionMatrix, matrix);

      // 행렬 설정
      gl.uniformMatrix4fv(matrixLocation, false, matrix);

      // texture unit 0에서 텍스처를 가져오도록 셰이더에 지시
      gl.uniform1i(textureLocation, 0);

      // 사각형 그리기 (삼각형 2개, 정점 6개)
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

다른 크기를 사용하도록 코드를 업데이트했습니다.

{{{example url="../webgl-2d-drawimage-02.html" }}}

굉장히 쉬웠네요.
하지만 캔버스 `drawImage`의 3번째 버전은 어떨까요?

    ctx.drawImage(image, srcX, srcY, srcWidth, srcHeight,
                         dstX, dstY, dstWidth, dstHeight);

텍스처의 일부를 선택하려면 텍스처 좌표를 조작해야 합니다.
텍스처 좌표가 작동하는 방식은 [텍스처에 대한 글](webgl-3d-textures.html)에서 다뤘습니다.
해당 글에서는 텍스처 좌표를 수동으로 생성했지만 즉석으로 생성할 수도 있으며 행렬을 사용하여 위치를 조작한 것처럼 다른 행렬을 사용하여 비슷하게 텍스처 좌표를 조작할 수 있습니다.

텍스처 행렬을 vertex shader에 추가하고, 텍스처 좌표에 이 텍스처 행렬을 곱해봅시다.

    attribute vec4 a_position;
    attribute vec2 a_texcoord;

    uniform mat4 u_matrix;
    +uniform mat4 u_textureMatrix;

    varying vec2 v_texcoord;

    void main() {
       gl_Position = u_matrix * a_position;
    *   v_texcoord = (u_textureMatrix * vec4(a_texcoord, 0, 1)).xy;
    }

이제 텍스처 행렬의 위치를 찾아야 합니다.

    var matrixLocation = gl.getUniformLocation(program, "u_matrix");
    +var textureMatrixLocation = gl.getUniformLocation(program, "u_textureMatrix");

그리고 `drawImage` 안에서 원하는 텍스처 부분을 선택하도록 설정해야 하는데요.
텍스처 좌표도 사실상 단위 사각형이므로 위치에 대해 작업한 것과 비슷합니다.

    *function drawImage(
    *    tex, texWidth, texHeight,
    *    srcX, srcY, srcWidth, srcHeight,
    *    dstX, dstY, dstWidth, dstHeight) {
    +  if (dstX === undefined) {
    +    dstX = srcX;
    +    srcX = 0;
    +  }
    +  if (dstY === undefined) {
    +    dstY = srcY;
    +    srcY = 0;
    +  }
    +  if (srcWidth === undefined) {
    +    srcWidth = texWidth;
    +  }
    +  if (srcHeight === undefined) {
    +    srcHeight = texHeight;
    +  }
      if (dstWidth === undefined) {
    *    dstWidth = srcWidth;
    +    srcWidth = texWidth;
      }
      if (dstHeight === undefined) {
    *    dstHeight = srcHeight;
    +    srcHeight = texHeight;
      }

      gl.bindTexture(gl.TEXTURE_2D, tex);

      ...

      // 이 행렬은 pixel에서 clip space로 변환합니다.
      var projectionMatrix = m3.projection(canvas.width, canvas.height, 1);

      // 이 행렬은 사각형을 1단위에서 dstWidth,dstHeight 단위로 크기 조정합니다.
      var scaleMatrix = m4.scaling(dstWidth, dstHeight, 1);

      // 이 행렬은 사각형을 dstX,dstY로 이동시킵니다.
      var translationMatrix = m4.translation(dstX, dstY, 0);

      // 모두 함께 곱합니다.
      var matrix = m4.multiply(translationMatrix, scaleMatrix);
      matrix = m4.multiply(projectionMatrix, matrix);

      // 행렬 설정
      gl.uniformMatrix4fv(matrixLocation, false, matrix);

    +  // 텍스처 좌표가 0부터 1까지이고 이미 단위 사각형이기 때문에, 단위 사각형를 축소하여 텍스처 영역을 선택할 수 있습니다.
    +  var texMatrix = m4.translation(srcX / texWidth, srcY / texHeight, 0);
    +  texMatrix = m4.scale(texMatrix, srcWidth / texWidth, srcHeight / texHeight, 1);
    +
    +  // 텍스처 행렬 설정
    +  gl.uniformMatrix4fv(textureMatrixLocation, false, texMatrix);

      // texture unit 0에서 텍스처를 가져오도록 셰이더에 지시
      gl.uniform1i(textureLocation, 0);

      // 사각형 그리기 (삼각형 2개, 정점 6개)
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

또한 텍스처의 일부를 선택하도록 코드를 업데이트했습니다.
여기 결과입니다.

{{{example url="../webgl-2d-drawimage-03.html" }}}

Canvas 2D API와 달리 WebGL 버전은 Canvas 2D `drawImage`가 처리하지 않는 경우를 처리합니다.

한 가지 경우로 source나 dest에 대해 음수 너비와 높이를 전달할 수 있습니다.
음수 `srcWidth`는 `srcX`의 왼쪽에 있는 픽셀을 선택합니다.
음수 `dstWidth`는 `dstX`의 왼쪽에 그려집니다.
Canvas 2D API에서 최선의 경우 에러거나 최악의 경우 정의되지 않은 동작이 발생할 수 있습니다.

{{{example url="../webgl-2d-drawimage-04.html" }}}

다른 하나는 행렬을 사용하고 있기 때문에 원하는 어떤 [행렬 수학](webgl-2d-matrices.html)도 할 수 있다는 겁니다.

예를 들어 텍스처의 가운데를 중심으로 텍스처 좌표를 회전시킬 수 있습니다.

텍스처 행렬 코드를 이걸로 변경합니다.

    *  // Clip space가 texture space(0 ~ 1)을 대신한 걸 제외하고는 2D 투영 행렬과 같습니다.
    *  // 이 행렬은 우리를 픽셀 공간에 둡니다.
    *  var texMatrix = m4.scaling(1 / texWidth, 1 / texHeight, 1);
    *
    *  // 회전의 중심이 될 곳을 선택해야 합니다.
    *  // 가운데로 이동하고, 회전한 다음, 다시 돌아갑니다.
    *  var texMatrix = m4.translate(texMatrix, texWidth * 0.5, texHeight * 0.5, 0);
    *  var texMatrix = m4.zRotate(texMatrix, srcRotation);
    *  var texMatrix = m4.translate(texMatrix, texWidth * -0.5, texHeight * -0.5, 0);
    *
    *  // 픽셀 공간에 있기 때문에 scale과 translation은 이제 픽셀 단위입니다.
    *  var texMatrix = m4.translate(texMatrix, srcX, srcY, 0);
    *  var texMatrix = m4.scale(texMatrix, srcWidth, srcHeight, 1);

      // 텍스처 행렬 설정
      gl.uniformMatrix4fv(textureMatrixLocation, false, texMatrix);

그리고 여기 결과입니다.

{{{example url="../webgl-2d-drawimage-05.html" }}}

한 가지 문제가 있는데 회전 때문에 가끔씩 텍스처 가장자리의 바깥쪽을 볼 수 있습니다.
`CLAMP_TO_EDGE`로 설정되어 있으므로 가장자리가 반복되는데요.

셰이더 내에서 0부터 1의 범위를 벗어난 픽셀을 버리면 해결할 수 있습니다.
`discard`는 픽셀을 쓰지 않고 즉시 셰이더를 종료합니다.

    precision mediump float;

    varying vec2 v_texcoord;

    uniform sampler2D texture;

    void main() {
    +   if (v_texcoord.x < 0.0 ||
    +       v_texcoord.y < 0.0 ||
    +       v_texcoord.x > 1.0 ||
    +       v_texcoord.y > 1.0) {
    +     discard;
    +   }
       gl_FragColor = texture2D(texture, v_texcoord);
    }

그리고 이제 모서리가 사라졌습니다.

{{{example url="../webgl-2d-drawimage-06.html" }}}

또는 텍스처 좌표가 텍스처 바깥에 있을 때 단색을 사용할 수도 있습니다.

    precision mediump float;

    varying vec2 v_texcoord;

    uniform sampler2D texture;

    void main() {
       if (v_texcoord.x < 0.0 ||
           v_texcoord.y < 0.0 ||
           v_texcoord.x > 1.0 ||
           v_texcoord.y > 1.0) {
    *     gl_FragColor = vec4(0, 0, 1, 1); // blue
    +     return;
       }
       gl_FragColor = texture2D(texture, v_texcoord);
    }

{{{example url="../webgl-2d-drawimage-07.html" }}}

한계란 없습니다.
모든 것은 셰이더를 얼마나 창의적으로 사용하느냐에 달려있습니다.

다음에는 [Canvas 2D의 행렬 스택을 구현](webgl-2d-matrix-stack.html)하겠습니다.

<div class="webgl_bottombar">
<h3>가벼운 최적화</h3>
<p>
이 최적화는 추천하고 싶지 않습니다.
WebGL은 제공하는 기능의 창의적인 사용이 전부기 때문에 오히려 더 창의적인 방법을 권장하고 싶습니다.
</p>
<p>
아마 위치에 단위 사각형을 사용하고 이러한 단위 사각형의 위치가 텍스처 좌표와 정확히 일치한다는 걸 눈치채셨을 겁니다.
따라서 위치를 텍스처 좌표처럼 사용할 수 있습니다.
</p>
<pre class="prettyprint showlinemods">
attribute vec4 a_position;
-attribute vec2 a_texcoord;

uniform mat4 u_matrix;
uniform mat4 u_textureMatrix;

varying vec2 v_texcoord;

void main() {
   gl_Position = u_matrix * a_position;
*   v_texcoord = (u_textureMatrix * a_position).xy;
}
</pre>
<p>이제 텍스처 좌표를 설정하는 코드를 지울 수 있으며 이전과 동일하게 작동합니다.</p>
{{{example url="../webgl-2d-drawimage-08.html" }}}
</div>


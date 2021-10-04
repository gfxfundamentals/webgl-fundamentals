Title: WebGL - Cross Origin Image
Description: 도메인 간의 이미지 사용
TOC: Cross Origin Image


이 글은 WebGL 관련 시리즈 중 하나입니다.
아직 읽지 않았다면 [이전 글](webgl-fundamentals.html)부터 시작하는 게 좋습니다.

WebGL에서는 텍스처로 사용하기 위해 이미지를 다운로드한 다음 GPU에 업로드하는 것이 일반적입니다.
이를 수행하는 여러 샘플들이 있는데요.
예를 들어 [이미지 처리](webgl-image-processing.html)에 관한 글, [텍스처](webgl-3d-textures.html)에 관한 글, [2D drawImage 구현](webgl-2d-drawimage.html)에 관한 글 등이 있습니다.

일반적으로 이렇게 이미지를 다운로드합니다.

    // 텍스처 정보 { width: w, height: h, texture: tex } 생성합니다.
    // 텍스처는 1x1 픽셀로 시작하고 이미지가 로드되면 업데이트됩니다.
    function loadImageAndCreateTextureInfo(url) {
      var tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      // 텍스처를 1x1 파랑 픽셀로 채우기
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([0, 0, 255, 255])
      );

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
      img.src = url;

      return textureInfo;
    }

문제는 이미지에 개인 데이터(에를 들어 캡차, 서명, 노출 사진, ...)가 있을 수 있다는 겁니다.
웹 페이지에는 페이지를 직접 제어하지 않는 광고와 기타 요소들이 있으므로 브라우저는 이러한 개인 이미지를 볼 수 없도록 해야 합니다.

이미지가 브라우저에 표시되더라도 스크립트는 이미지 내부의 데이터를 볼 수 없기 때문에 `<img src="private.jpg">`만 사용하는 것은 괜찮습니다.
[Canvas2D API](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)에는 이미지 내부를 보는 방법이 있는데요.
먼저 캔버스에 이미지를 그립니다.

    ctx.drawImage(someImg, 0, 0);

그런 다음 데이터를 가져옵니다.

    var data = ctx.getImageData(0, 0, width, heigh);

하지만 다른 도메인에서 가져와 그린 이미지라면 브라우저는 캔버스를 *오염*되었다고 표시하고 `ctx.getImageData`를 호출할 때 보안 오류가 발생합니다.

WebGL은 한 단계 더 나아가야 합니다.
WebGL에서 `gl.readPixels`는 `ctx.getImageData`와 같은 호출이니 막으면 충분하지 않냐고 생각하겠지만, 픽셀을 직접 읽을 수 없더라도 이미지의 색상에 따라 실행이 더 오래 걸리는 셰이더를 만들 수 있는데요.
해당 정보를 사용하여 간접적으로 이미지 내부를 살펴보고 이미지의 내용을 확인하기 위해 타이밍을 사용할 수 있습니다.

따라서 WebGL은 같은 도메인이 아닌 모든 이미지를 금지합니다.
예를 들어 다음은 다른 도메인의 텍스처로 회전하는 사각형을 그리는 샘플인데요.
텍스처가 로드되지 않고 오류가 발생합니다.

{{{example url="../webgl-cors-permission-bad.html" }}}

어떻게 이를 해결할까요?

## CORS 입력

CORS = Cross Origin Resource Sharing.
CORS는 웹 페이지에 이미지 사용 권한을 이미지 서버에 요청하는 방법입니다.

이를 위해 `crossOrigin` 속성을 무언가로 설정한 다음, 브라우저가 서버에서 이미지를 가져오려고 시도할 때, 동일한 도메인이 아니라면, 브라우저는 CORS 권한을 요청합니다.

    ...
    +    img.crossOrigin = "";   // CORS 권한 요청
        img.src = url;

`crossOrigin`에 설정할 수 있는 값에는 3가지가 있습니다.
하나는 "권한을 요청하지 않음"을 의미하는 기본값인 `undefined`입니다.
다른 하나는 권한을 요청하지만 추가 정보를 보내지 않음을 의미하는 `"anonymous"`입니다.
마지막은 서버가 권한을 부여할지 말지 결정하기 위해 살펴보는 cookie와 기타 정보 전송을 의미하는 `"use-credentials"`입니다.
그 외 다른 값으로 `crossOrigin`을 설정하면 `anonymous`로 설정한 것과 같습니다.

로드하려는 이미지가 동일한 origin에 있는지 확인하고 그렇다면 `crossOrigin` 속성을 설정하는 함수를 만들 수 있습니다.

    function requestCORSIfNotSameOrigin(img, url) {
      if ((new URL(url, window.location.href)).origin !== window.location.origin) {
        img.crossOrigin = "";
      }
    }

그리고 이렇게 사용할 수 있습니다.

    ...
    +requestCORSIfNotSameOrigin(img, url);
    img.src = url;


{{{example url="../webgl-cors-permission-good.html" }}}

권한을 요청한다고 해서 권한이 부여되는 것은 아닙니다.
이는 서버에 따라 다른데요.
Github page, flickr.com, imgur.com 등은 권한을 부여하지만, 대부분의 웹 사이트는 그렇지 않습니다.
권한을 부여하기 위해 서버는 이미지를 보낼 때 특정 헤더를 보냅니다.

서버가 권한을 부여하는 것으로는 충분하지 않다는 점에 유의해야 합니다.
만약 다른 도메인의 이미지라면 `crossOrigin` 속성을 설정해야 하고 그렇지 않으면 서버가 올바른 헤더를 보내도 이미지를 사용할 수 없습니다.

<div class="webgl_bottombar">
<h3>Apache에 CORS 권한 부여</h3>
<p>Apache로 웹 사이트를 운영하고 mod_rewrite 플러그인이 설치되어 있다면 putting으로 전체적인 CORS 지원을 허용할 수 있습니다.</p>
<pre class="prettyprint">
    Header set Access-Control-Allow-Origin "*"
</pre>
<p>적당한 <code>.htaccess</code> 파일에 설정하면 됩니다.</p>
</div>


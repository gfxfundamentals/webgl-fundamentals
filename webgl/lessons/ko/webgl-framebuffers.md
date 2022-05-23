Title: WebGL 프레임 버퍼
Description: WebGL의 프레임 버퍼가 뭔가요?
TOC: 프레임 버퍼


이 글은 WebGL에서 프레임 버퍼가 무엇인지에 대한 대략적인 이미지를 제공할 겁니다.
프레임 버퍼는 [텍스처에 렌더링](webgl-render-to-texture.html)할 때 언급되는데요.

프레임 버퍼는 그냥 *어태치먼트 모음*입니다.
그게 전부에요!
텍스처와 렌더 버퍼로 렌더링하는데 사용되죠.

이런식으로 프레임 버퍼 객체를 생각하실 수 있으며,

```js
class Framebuffer {
  constructor() {
    this.attachments = new Map();  // 어태치먼트 포인트별 어태치먼트
  }
}
```

`WebGLRenderingContext`(`gl` 객체)는 이렇게 합니다.

```js
// 의사 코드
gl = {
  framebuffer: defaultFramebufferForCanvas,
}
```

바인딩 포인트는 2개입니다.
이런식으로 설정되는데,

```js
gl.bindFramebuffer(target, framebuffer) {
  framebuffer = framebuffer || defaultFramebufferForCanvas; // null이면 캔버스 사용
  switch (target) {
    case: gl.FRAMEBUFFER:
      this.framebufferBinding = framebuffer;
      break;
    default:
      ... error ...
  }
}
```

`framebufferTexture2D`, `framebufferRenderbuffer`, 두 함수를 통해 어태치먼트를 프레임 버퍼에 추가할 수 있습니다.

구현이 이런식으로 되어 있을 것이라 상상할 수 있는데요.

```js
// 의사 코드
gl._getFramebufferByTarget(target) {
  switch (target) {
    case gl.FRAMEBUFFER:
      return this.framebufferBinding;
  }
}
gl.framebufferTexture2D(target, attachmentPoint, texTarget, texture, mipLevel) {
  const framebuffer = this._getFramebufferByTarget(target);
  framebuffer.attachments.set(attachmentPoint, {
    texture, texTarget, mipLevel,
  });
}
gl.framebufferRenderbuffer(target, attachmentPoint, renderbufferTarget, renderbuffer) {
  const framebuffer = this._getFramebufferByTarget(target);
  framebuffer.attachments.set(attachmentPoint, {
    renderbufferTarget, renderbuffer
  });
}
```

[`WEBGL_draw_buffers`](https://www.khronos.org/registry/webgl/extensions/WEBGL_draw_buffers/) 확장이 있고 활성화된 경우 `Framebuffer`는 개념적으로 이렇게 확장됩니다.

```js
class Framebuffer {
  constructor() {
    this.attachments = new Map();
+    this.drawBuffers = [gl.COLOR_ATTACHMENT0, gl.NONE, gl.NONE, gl.NONE, ...];
  }
}
```

이렇게 구현되어 있을 것이라 상상할 수 있는 `gl.drawBuffers`로 드로잉 버퍼 배열을 설정할 수 있습니다.

```js
// 의사 코드
ext.drawBuffersWebGL(drawBuffers) {
  const framebuffer = gl._getFramebufferByTarget(gl.FRAMEBUFFER);
  for (let i = 0; i < maxDrawBuffers; ++i) {
    framebuffer.drawBuffers[i] = i < drawBuffers.length
        ? drawBuffers[i]
        : gl.NONE
  }
}
```

요점은 *프레임 버퍼*가 단순한 어태치먼트 모음이라는 겁니다.
문제는 어태치먼트가 될 수 있는 것들과 작동하는 조합에 대한 제한인데요.
예를 들어 플로팅 포인트 텍스처 어태치먼트는 기본적으로 렌더링될 수 없습니다.
확장은 `WEBGL_color_buffer_float`같은 걸 활성화할 수 있습니다.
마찬가지로 2개 이상의 어태치먼트가 있다면 모두 동일한 넓이여야 합니다.


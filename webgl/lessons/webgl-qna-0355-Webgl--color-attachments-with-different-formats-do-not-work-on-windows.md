Title: Webgl: color attachments with different formats do not work on windows
Description:
TOC: qna

# Question:

I'm trying to use WEBGL_draw_buffers with OES_texture_float, which works. However, when using two render targets with a different type, this does not work on my windows machine (amd). It does, however, work on my linux machine (open source radeon driver).

So a framebuffer with the following color attachments does not work on windows:

> attachment 0 : rgb * unsigned byte

> attachment 1 : rgb * float

but the following layout does work:

> attachment 0 : rgb * float 

> attachment 1 : rgb * float

I wrote a small test program that illustrates the problem:

<!-- begin snippet: js hide: false -->

<!-- language: lang-html -->

    <!DOCTYPE html>
    <html>

    <head>
    </head>

    <body>
      <script type="text/javascript">
        var canvas = document.createElement('canvas');
        var gl = canvas.getContext("webgl");

        var WEBGL_draw_buffers = gl.getExtension("WEBGL_draw_buffers") || gl.getExtension("GL_EXT_draw_buffers") || gl.getExtension("EXT_draw_buffers");
        gl.getExtension("OES_texture_float");
        gl.getExtension("WEBGL_depth_texture");



        var result = "";
        result += "UNSIGNED_BYTE, FLOAT: " + test(gl.UNSIGNED_BYTE, gl.FLOAT) + "<br />";
        result += "FLOAT, FLOAT: " + test(gl.FLOAT, gl.FLOAT);

        var div = document.createElement('div');
        div.innerHTML = result;
        document.body.appendChild(div);


        function setParams() {
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }

        function test(type1, type2) {
          var w = 2, h = 2;

          var t1 = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, t1);
          setParams();
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, w, h, 0, gl.RGB, type1, null);


          var t2 = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, t2);
          setParams();
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, w, h, 0, gl.RGB, type2, null);


          var framebuffer = gl.createFramebuffer();
          gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

          WEBGL_draw_buffers.drawBuffersWEBGL([WEBGL_draw_buffers.COLOR_ATTACHMENT0_WEBGL, WEBGL_draw_buffers.COLOR_ATTACHMENT1_WEBGL]);


          gl.framebufferTexture2D(gl.FRAMEBUFFER, WEBGL_draw_buffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, t1, 0);
          gl.framebufferTexture2D(gl.FRAMEBUFFER, WEBGL_draw_buffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, t2, 0);

          var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);


          gl.bindFramebuffer(gl.FRAMEBUFFER, null);


          switch (status) {
            case gl.FRAMEBUFFER_COMPLETE:
              return "FRAMEBUFFER_COMPLETE";
            case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
              return "FRAMEBUFFER_INCOMPLETE_ATTACHMENT";
            case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
              return "FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT";
            case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
              return "FRAMEBUFFER_INCOMPLETE_DIMENSIONS";
            case gl.FRAMEBUFFER_UNSUPPORTED:
              return "FRAMEBUFFER_UNSUPPORTED";
            default:
              return "Error: " + status;
          }
        }
      </script>
    </body>

    </html>

<!-- end snippet -->

On windows this outputs:

    UNSIGNED_BYTE, FLOAT: FRAMEBUFFER_UNSUPPORTED
    FLOAT, FLOAT: FRAMEBUFFER_COMPLETE

and on linux this outputs:

    UNSIGNED_BYTE, FLOAT: FRAMEBUFFER_COMPLETE
    FLOAT, FLOAT: FRAMEBUFFER_COMPLETE

I would like to know why. Note that my results are the same in firefox and chrome.


Update: when the use of `angle` is disabled on windows, it will behave just like linux.

# Answer

WebGL only requires 3 combinations of attachments to work.

[From the spec](https://www.khronos.org/registry/webgl/specs/latest/1.0/#6.6)

> The following combinations of framebuffer object attachments, when all of the attachments are framebuffer attachment complete, non-zero, and have the same width and height, must result in the framebuffer being framebuffer complete:

> * COLOR_ATTACHMENT0 = RGBA/UNSIGNED_BYTE texture
> * COLOR_ATTACHMENT0 = RGBA/UNSIGNED_BYTE texture + DEPTH_ATTACHMENT = DEPTH_COMPONENT16 renderbuffer
> * COLOR_ATTACHMENT0 = RGBA/UNSIGNED_BYTE texture + DEPTH_STENCIL_ATTACHMENT = DEPTH_STENCIL renderbuffer

The `WEBGL_draw_buffers` extension adds a few more. [From that spec](https://www.khronos.org/registry/webgl/extensions/WEBGL_draw_buffers/).

> If:
A framebuffer's color attachments are all textures allocated with format `RGBA` and type `UNSIGNED_BYTE`, and
The framebuffer has either:

> * No depth or stencil attachment

> * A valid `DEPTH` or `DEPTH_STENCIL` attachment

> Then a call to checkFramebufferStatus against this framebuffer must not return `FRAMEBUFFER_UNSUPPORTED`. (In other words, the implementation must support the use of `RGBA`/`UNSIGNED_BYTE` textures as color attachments, plus either a `DEPTH` or `DEPTH_STENCIL` attachment.)

> Attaching n consecutive color attachments starting at `COLOR_ATTACHMENT0_WEBGL`, where n is between 1 and `MAX_DRAW_BUFFERS_WEBGL`, must not return `FRAMEBUFFER_UNSUPPORTED` from a call to checkFramebufferStatus. In other words, if `MAX_DRAW_BUFFERS_WEBGL` is 4, then the implementation is required to support the following combinations of color attachments:

> * COLOR_ATTACHMENT0_WEBGL = RGBA/UNSIGNED_BYTE

> * COLOR_ATTACHMENT0_WEBGL = RGBA/UNSIGNED_BYTE
    COLOR_ATTACHMENT1_WEBGL = RGBA/UNSIGNED_BYTE

> * COLOR_ATTACHMENT0_WEBGL = RGBA/UNSIGNED_BYTE
    COLOR_ATTACHMENT1_WEBGL = RGBA/UNSIGNED_BYTE
    COLOR_ATTACHMENT2_WEBGL = RGBA/UNSIGNED_BYTE

> * COLOR_ATTACHMENT0_WEBGL = RGBA/UNSIGNED_BYTE
    COLOR_ATTACHMENT1_WEBGL = RGBA/UNSIGNED_BYTE
    COLOR_ATTACHMENT2_WEBGL = RGBA/UNSIGNED_BYTE
    COLOR_ATTACHMENT3_WEBGL = RGBA/UNSIGNED_BYTE

**ALL** other combinations are driver dependent.

As @Kimixa mentions the spec lists combinations that will not work but conversely the spec also says which combinations work is 100% driver dependent. In fact in OpenGL ES 2.0 even the ones mentioned above are not required to work. WebGL added that requirement on top of OpenGL ES 2.0

This is also one reason why `WEBGL_draw_buffers` is not enabled on some GPUs. Chrome tests all the required combinations the first time WebGL is initialized. If the driver does not return `FRAMEBUFFER_COMPLETE` for every required combination then Chrome does not enable the `WEBGL_draw_buffers` extension.

Except for the required combinations the only way to know if a specific combination will work is to set them up and then check with `gl.checkFramebufferStatus`.


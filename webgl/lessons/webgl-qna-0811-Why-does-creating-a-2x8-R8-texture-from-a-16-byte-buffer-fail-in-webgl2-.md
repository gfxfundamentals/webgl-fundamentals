Title: Why does creating a 2x8 R8 texture from a 16 byte buffer fail in webgl2?
Description:
TOC: qna

# Question:

When I try to create a 2x8 R8 texture in webgl2, I get an error. This doesn't happen for a 4x8 texture. If I double the size of the input buffer compared to what I expect, the 2x8 succeeds.

Does webgl2 have a 'column alignment' of 4 when creating/reading textures?

Here is some code that reproduces the issue. I tested it on Windows in both Chrome and Firefox:

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function test_read(w) {
        let gl = document.createElement('canvas').getContext('webgl2');
        let h = 8;
        let data = new Uint8Array(w*h);
        data[5] = 5;

        let texture = gl.createTexture();
        let frameBuffer = gl.createFramebuffer();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, w, h, 0, gl.RED, gl.UNSIGNED_BYTE, data);
        if (gl.getError() !== gl.NO_ERROR) {
            return 'bad w=' + w;
        }
        return 'good w=' + w;
    }

    console.log(test_read(4)); // good w=4
    console.log(test_read(2)); // bad w=2

<!-- end snippet -->

The error code coming out is 0x502 (INVALID_OPERATION). A similar issue happens when reading textures that were created by expanding the buffer: it seems to expect a 'column alignment' of 4.

# Answer

You need to set `gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)`

The default `UNPACK_ALIGNMENT` is 4 which means WebGL expects every row of pixel to be a multiple of 4 bytes. Since you're using R8 (1 byte pixel) and a width of 2 your rows are only 2 bytes long. When you change the width to 4 it starts working.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function test_read(w) {
        let gl = document.createElement('canvas').getContext('webgl2');
        let h = 8;
        let data = new Uint8Array(w*h);
        data[5] = 5;

        // ---=== ADDED ===---
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

        let texture = gl.createTexture();
        let frameBuffer = gl.createFramebuffer();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, w, h, 0, gl.RED, gl.UNSIGNED_BYTE, data);
        if (gl.getError() !== gl.NO_ERROR) {
            return 'bad w=' + w;
        }
        return 'good w=' + w;
    }

    console.log(test_read(4)); // good w=4
    console.log(test_read(2)); // bad w=2

<!-- end snippet -->


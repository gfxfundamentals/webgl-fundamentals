Title: three.js premultipliedAlpha=true does not affect the output of gl.readPixels()
Description:
TOC: qna

# Question:

Okay, I'm probably missing something obvious here. What I'm trying to accomplish is storing a three.js scene that has `premultipliedAlpha: true` to a buffer. However, when reading the Webgl context using `gl.readPixels()` the value of the pixels color are always as if premultipliedAlpha was set to false. Or put differently, the premultipliedAlpha flag does not affect the output of gl.readPixels().

Code example:

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var width = 512;
    var height = 512;

    // Browser renderer
    var renderer = new THREE.WebGLRenderer({alpha: true, antialias: true, premultipliedAlpha: true});
    renderer.setSize(width, height);
    document.body.appendChild(renderer.domElement);

    // Setup basic scene
    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(-width/2, width/2, height/2, -height/2, 0.001, 1000);
    camera.position.z = 1;

    // Draw a semi-transparent red square
    var redSquare = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide,
            transparent : true,
            color: 0xFF0000,
            opacity : .5
        })
    );
    scene.add(redSquare);
    renderer.render( scene, camera );

    // Check color of first pixel
    var gl = renderer.getContext();
    var buf = new Uint8Array(4);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    console.log(buf[0], buf[1], buf[2], buf[3]);

<!-- language: lang-html -->

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r83/three.min.js"></script>

<!-- end snippet -->

The output color is `127 0 0 127`, I expected it to be `255 0 0 127`. Toggling premultipliedAlpha changes the value on screen, but not in the output. This might be by design, but then my question is, how do I convert the color in the buffer so that I do get the expected value?

**Solution**

To premultiply the alpha in the buffer, the pixel values should be divided by the alpha value, like so:

    buf[0] /= buf[3] / 0xff
    buf[1] /= buf[3] / 0xff
    buf[2] /= buf[3] / 0xff

Thanks to @Kirill Dmitrenko

# Answer

`premultipliedAlpha: true` is the default but setting that to true or false has nothing to do with the what values are in the canvas (ie, returned from `readPixels`). It's only a flag to the browser on how to composite the canvas with the rest of the page.

It's your responsibility to put values in the canvas that match whatever you set `premultipliedAlpha` to be



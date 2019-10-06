Title: Three.js - Export a texture as an image
Description:
TOC: qna

# Question:

I render some part of my scene and I use this as a texture on my object. But now I want to export this texture as an image. Any idea on that?

This is how I create my texture object:

    frameTexture = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter});

And I assign this texture on my material:

    var material = new THREE.MeshBasicMaterial( {map:frameTexture.texture} );

And this is how I render it to the texture:

    renderer.render(frameScene,frameCamera,frameTexture);

Now the question is how to save frameTexture as an image.


# Answer

Render the image to the canvas then call toDataURL

    renderer.render(sceneThatHasASingleQuadPlaneUsingFrameTexture, camera);
    var dataURL = renderer.domElement.toDataURL();

You can now do things with that dataURL like open a window

    window.open(dataURL, "image");

Or make an image out of it

    var img = new Image();
    img.src = dataURL;
    document.body.appendChild(img);

Send it to some server via XHR

    const xhr = new XMLHttpReqeust();
    xhr.open('PUT', 'https://myserverthatsavesimages.com', true);
    xhr.send(dataURL);
    ...

Etc...


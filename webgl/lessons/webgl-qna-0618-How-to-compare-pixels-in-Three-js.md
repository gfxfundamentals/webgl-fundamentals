Title: How to compare pixels in Three.js
Description:
TOC: qna

# Question:

I have two textures in three.js that I would like to compare at pixel level. But I have no idea of how to do it. Three.js documentation does not answer my question. Indeed some of the classes are undocumented.

To be concise I want to compute how  different 2 images are (to calculate fitness value in my genetic algorithm).

Edit: I have been told that I should provide more information. Here we go.

One texture is from a image which is loaded using "loadTexture":

            referenceTexture = THREE.ImageUtils.loadTexture('images/tia1.jpg'); //256px*256px image

The get the other one I add some polygons to a second scene and later on I render that scene into a texture:

    var bufferScene = new THREE.Scene();
    var bufferTexture = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter,format: THREE.RGBAFormat});
    bufferScene.add(triangle) //This is a bucle in the real code.
    renderer.setSize(256,256);
    requestAnimationFrame( render );
    renderer.render(bufferScene, camera, bufferTexture);


Thank you in advance.



# Answer

You can attach each texture to a render target, then call `renderer.readRenderTargetPixels` to get the pixels out for each texture and then compare.

OR

You could render both textures to another render target using a shader that diffs the 2 textures and then read the pixels out of that render target using `renderer.readRenderTargetPixels`

Title: linear gradient along the x-axis of a ribbon
Description:
TOC: qna

# Question:

I'm new to the webgl world so show mercy ;)

I'd like to have a linear gradient along the x-axis of a ribbon.
along the y-axis I've found the gradientMaterial but along the x-axis i've not found anything yet.

In this example you can find the ribbon i want the gradient applied on.

https://www.babylonjs-playground.com/#E6IX1#137

 
 In case the playground does not work:
[![Screen_Shot_2017-08-17_at_09.06.00.png](https://s22.postimg.org/eprgath9d/Screen_Shot_2017-08-17_at_09.06.00.png)](https://postimg.org/image/biwwr6wt9/)

Something like that: 

https://doc.babylonjs.com/extensions/gradient

but along the x-axis






# Answer

Unfortunately it doesn't appear to be a simple thing.

The gradient material which is really defined [here](https://github.com/BabylonJS/Babylon.js/tree/master/materialsLibrary/src/gradient) is using a gradient in world space (seems not so useful to me but what do I know). That means as you move the object the gradient will stay at the center of the world.

I'd switch it to texture space by changing this line in [the fragment shader](https://github.com/BabylonJS/Babylon.js/blob/master/materialsLibrary/src/gradient/gradient.fragment.fx) from this

    float h = normalize(vPositionW).y + offset;

to this

    float h = normalize(vDiffuseUV).y + offset;

That would let you set the direction by changing the texture coordinates of the model. It would let you flow gradients around the ribbon, down more ribbon like things  .

Unfortunately AFAIK Babylon requires a texture to use texture coordinates, at least looking at the code there you can see texture coordinates only get included if `DIFFUSE` is set and then it's assumed a texture is needed

    #ifdef DIFFUSE
    varying vec2 vDiffuseUV;
    uniform sampler2D diffuseSampler;
    uniform vec2 vDiffuseInfos;
    #endif

You can make a custom shader in Babylon and supply your own data but that's beyond my babylon skills. All the tutorials I've been able to find require installing a large environment and building from typescript.

A simpler solution might be just to create a small ramp texture with your 2 colors and set the `vScale` and `vOffset` to expand the UV coordinates.

    // Using a Canvas because Babylon doesn't support all texture features
    // on all types of textures :(
    const rampWidth = 1;
    const rampHeight = 2;
    const tex = new BABYLON.DynamicTexture("dyntex", {width:rampWidth, height:rampHeight}, scene, true);
    const ctx = tex.getContext(); 
    ctx.fillStyle = "#15A4FA";
    ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = "blue";
    ctx.fillRect(0, 1, 1, 1);
    tex.vOffset = .5 / (rampHeight);
    tex.vScale  = (rampHeight - 1) / rampHeight;
    tex.update(false);
    mat.diffuseTexture = tex;

Now that it's in UV space you can [see it follows the contours of the ribbon](https://www.babylonjs-playground.com/#E6IX1#147) which is not what you wanted but that's the default UV coordinates for the ribbon.

To fix that you need to adjust the UV coords. 

    var sphere = BABYLON.MeshBuilder.CreateRibbon("sph", {pathArray: paths}, scene);

    // get the positions so we can compute the extents
    {
        const positions = sphere.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        let min = positions.slice(0, 3);
        let max = positions.slice(0, 3);
        const numVerts = positions.length / 3;
        for (let i = 1; i < numVerts; ++i) {
            const offset = i * 3;
            for (let j = 0; j < 3; ++j) {
                min[j] = Math.min(min[j], positions[offset + j]);
                max[j] = Math.max(max[j], positions[offset + j]);
            }
        }
        // now update the UVs
        const range = [
            max[0] - min[0],
            max[1] - min[1],
            max[2] - min[2],
        ];
        const uvs = new Float32Array(numVerts * 2);
        for (let i = 0; i < numVerts; ++i) {
            const positionOffset = i * 3;
            const uvOffset = i * 2;
            for (let j = 0; j < 2; ++j) {
                uvs[uvOffset + j] = (positions[positionOffset + j] - min[j]) / range[j];
            }
        }
        sphere.setVerticesData(BABYLON.VertexBuffer.UVKind, uvs);
    }

And I also switched the texture to go horizontal

    // Using a Canvas because Babylon doesn't support all texture features
    // on all types of textures :(
    const rampWidth = 2;
    const rampHeight = 1;
    const tex = new BABYLON.DynamicTexture("dyntex", {width:rampWidth, height:rampHeight}, scene, true);
    const ctx = tex.getContext(); 
    ctx.fillStyle = "#15A4FA";
    ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = "blue";
    ctx.fillRect(1, 0, 1, 1);
    tex.uOffset = 0.5 / (rampWidth);
    tex.uScale  = (rampWidth - 1) / rampWidth;
    tex.update(false);
    mat.diffuseTexture = tex;

https://www.babylonjs-playground.com/#QS8RP8#2

Note that because we are using the texture as a ramp we need to scale and offset the UV coordinates a little. In BABYLON there's an option to do that using `texture.uScale`, `texture.uOffset` and the corresponding `v` versions. Those settings manipulate the texture coordinates inside the shader effectively being

    coordToUse = coordFromBuffer * scale + offset;

The reason we need to do this is WebGL's texture coordinates reference the edges of pixels so imagine you have a texture 2x1 pixels. 0 and 1 reference this parts of the texture.

    0               1
    |               |
    V               v
    +-------+-------+
    |       |       |
    |       |       |
    |       |       |
    +-------+-------+

Assuming the left pixel is red and the right pixel is blue when you use the texture as a gradient you'd get

    +-------+-------+
    |       |       |
    |rrrr...|...bbbb|
    |       |       |
    +-------+-------+

Where `r` is red, `b` is blue and `....` is the area that mixes between the 2. We only want to use the area between the 2 since that's the *gradient*.

This code

    tex.vOffset = .5 / (rampHeight);
    tex.vScale  = (rampHeight - 1) / rampHeight;

is what scales the UV coordinates so they only use that middle portion. Basically we subtract 1 pixel and shift half a pixel. If you comment out those 2 lines you'll see there's a border of solid color on the edges of the shape, the rrrr and bbbb parts.

If BABYLON didn't provide that option we'd either have to write our own shader to add it OR, change our calculations when making the UV coordinates we put in the buffer. The advantage to doing it in the shader (either the BABYLON way or with a custom shader) is that the offset and scale need to be different depending on the size of the texture and so we'd have to update all the UVs in our buffer anytime we changed the size of the gradient texture if we didn't adjust the UV coords in the shader

Not, if you are unfamiliar with WebGL topics I'd suggest reading [these tutorials](https://webglfundamentals.org). Then if you dig through the babylon.js source hopefully it will be clearer what is going on.


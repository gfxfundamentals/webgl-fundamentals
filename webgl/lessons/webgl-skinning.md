Title: WebGL Skinning
Description: How to skin a mesh in WebGL

Skinning in graphics is the name given to moving a set of vertices based
on the weighted influence of multiple matrices. That's pretty abstract.

It's called *skinning* because it's typically used to make 3D characters
have a "skeleton" made from "bones" where "bone" is another name for matrix
and then **per vertex** setting the influence of each bone to that vertex.

So for example the hand bone would have nearly 100% influence on the vertices
near the hand of a character where as the foot bone would have zero influence
on those same vertices.

The basic part is that you need bones (which is just a fancy way of saying
a matrix hierarchy) and weights.  Weights are per vertex values that go
from 0 to 1 to say how much a particular bone-matrix affects the position
of that vertex.  Weights are kind of like vertex colors as far as data.
One set of weights per vertex.  In other words the weights are put in a
buffer and provided through attributes.

Typically you limit the number of weights per vertex partly because
otherwise it would be way too much data.  A character can have anywhere
from 15 bones (Virtua Fighter 1) to 150-300 bones (some modern games).
If you had 300 bones you'd need 300 weights PER vertex PER bone.  If your
character had 10000 vertices that would be 3 million weights needed.

So, instead most realtime skinning systems limit it ~4 weights per vertex.
Usually this is accomplished in an exporter/converter that takes data from
a 3D packages like blender/maya/3dsmax and for each vertex finds the 4
bones with the highest weights and then normalizing those weights

To give an pseudo example a non-skinned vertex is typically computed like this

    gl_Position = projection * view * model * position;

A skinned vertex is effectively computed like this

    gl_Position = projection * view *
                  (bone1Matrix * position * weight1 +
                   bone2Matrix * position * weight2 +
                   bone3Matrix * position * weight3 +
                   bone4Matrix * position * weight4);

Assuming you stored the bones matrices in a uniform array, and you
passed in the the weights and which bone each weight applies to as
attributes you might do something like

    attribute vec4 a_position;
    attribute vec4 a_weights;         // 4 weights per vertex
    attribute vec4 a_boneNdx;         // 4 bone indices per vertex
    uniform mat4 bones[MAX_BONES];    // 1 matrix per bone

    gl_Position = projection * view *
                  (a_bones[int(a_boneNdx[0])] * a_position * a_weight[0] +
                   a_bones[int(a_boneNdx[1])] * a_position * a_weight[1] +
                   a_bones[int(a_boneNdx[2])] * a_position * a_weight[2] +
                   a_boneS[int(a_boneNdx[3])] * a_position * a_weight[3]);


There's one more issue.  Let's say you have a model of a person with
the origin (0,0,0) on the floor just between their feet.

<div class="webgl_center"><img src="resources/bone-head.svg" style="width: 500px;"></div>

Now imagine you put a matrix/bone/joint at their head and you want to use
that for bone for skinning.  To keep it simple imagine you just set the
weights so the the vertices of the head have a weight of 1.0 for the head
bone and no other joints influence those vertices.  

<div class="webgl_center"><img src="resources/bone-head-setup.svg" style="width: 500px;"></div>

There's a problem.
The head vertices are 2 units above the origin.  The head bone is also 2
units above the origin.  If you actually multiplied those head vertices by
the head bone matrix you'd get vertices 4 units above the origin.  The
original 2 units of the vertices + the 2 units of the head bone matrix.

<div class="webgl_center"><img src="resources/bone-head-problem.svg" style="width: 500px;"></div>

A solution is to store a "bind pose" which is an extra matrix per joint of
where each matrix was before you used it to influence the vertices.  In that
case the bind pose of the head matrix would be 2 units above the origin.
So now you can use the inverse of that matrix to subtract out the extra 2
units.

In other words the bone matrices passed to the shader have each been
multiplied by their inverse bind pose so as to make their influence only
how much they changed from their original positions relative to the origin
of the mesh.

Let's make a small example. We'll animate in 2d a grid like this

<div class="webgl_center"><img src="resources/skinned-mesh.svg" style="width: 400px;"></div>

* Where `b0`, `b1`, and `b2` are the bone matrices.
* `b1` is a child of `b0` and `b2` is a child of `b1`
* Verts `0,1` will get a weight of 1.0 from bone b0
* Verts `2,3` will get a weight of 0.5 from bones b0 and b1
* Verts `4,5` will get a weight of 1.0 from bone b1
* Verts `6,7` will get a weight of 0.5 from bones b1 and b2
* Verts `8,9` will get a weight of 1.0 from bone b3

We'll use the utils described in [less code more fun](webgl-less-code-more-fun.html).

First we need the vertices and for each vertex the index
of each bone that influences it and a number from 0 to 1
of how much influence that bone has.

```
var arrays = {
  position: {
    numComponents: 2,
    data: [
     0,  1,  // 0
     0, -1,  // 1
     2,  1,  // 2
     2, -1,  // 3
     4,  1,  // 4
     4, -1,  // 5
     6,  1,  // 6
     6, -1,  // 7
     8,  1,  // 8
     8, -1,  // 9
    ],
  },
  boneNdx: {
    numComponents: 4,
    data: [
      0, 0, 0, 0,  // 0
      0, 0, 0, 0,  // 1
      0, 1, 0, 0,  // 2
      0, 1, 0, 0,  // 3
      1, 0, 0, 0,  // 4
      1, 0, 0, 0,  // 5
      1, 2, 0, 0,  // 6
      1, 2, 0, 0,  // 7
      2, 0, 0, 0,  // 8
      2, 0, 0, 0,  // 9
    ],
  },
  weight: {
    numComponents: 4,
    data: [
     1, 0, 0, 0,  // 0
     1, 0, 0, 0,  // 1
    .5,.5, 0, 0,  // 2
    .5,.5, 0, 0,  // 3
     1, 0, 0, 0,  // 4
     1, 0, 0, 0,  // 5
    .5,.5, 0, 0,  // 6
    .5,.5, 0, 0,  // 7
     1, 0, 0, 0,  // 8
     1, 0, 0, 0,  // 9
    ],
  },

  indices: {
    numComponents: 2,
    data: [
      0, 1,
      0, 2,
      1, 3,
      2, 3, //
      2, 4,
      3, 5,
      4, 5,
      4, 6,
      5, 7, //
      6, 7,
      6, 8,
      7, 9,
      8, 9,
    ],
  },
};
// calls gl.createBuffer, gl.bindBuffer, gl.bufferData
var bufferInfo = webglUtils.createBufferInfoFromArrays(gl, arrays);
```

We can define our uniform values including a matrix for each bone

```
// 4 matrices, one for each bone
var numBones = 4;
var boneArray = new Float32Array(numBones * 16);

var uniforms = {
  projection: m4.orthographic(-20, 20, -10, 10, -1, 1),
  view: m4.translation(-6, 0, 0),
  bones: boneArray,
  color: [1, 0, 0, 1],
};
```

We can make views into the boneArray, one for each matrix

```
// make views for each bone. This lets all the bones
// exist in 1 array for uploading but as separate
// arrays for using with the math functions
var boneMatrices = [];  // the uniform data
var bones = [];         // the value before multiplying by inverse bind matrix
var bindPose = [];      // the bind matrix
for (var i = 0; i < numBones; ++i) {
  boneMatrices.push(new Float32Array(boneArray.buffer, i * 4 * 16, 16));
  bindPose.push(m4.identity());  // just allocate storage
  bones.push(m4.identity());     // just allocate storage
}
```

And then some code to manipulate the bone matrixes. We'll just rotate
them in a heirarchy like the bones of a finger.

```
// rotate each bone by angle and simulate a hierarchy
function computeBoneMatrices(bones, angle) {
  var m = m4.identity();
  m4.zRotate(m, angle, bones[0]);
  m4.translate(bones[0], 4, 0, 0, m);
  m4.zRotate(m, angle, bones[1]);
  m4.translate(bones[1], 4, 0, 0, m);
  m4.zRotate(m, angle, bones[2]);
  // bones[3] is not used
}
```

Now call it once to generate their initial positions and use the result
to compute the inverse bind pose matrices.

```
// compute the initial positions of each matrix
computeBoneMatrices(bindPose, 0);

// compute their inverses
var bindPoseInv = bindPose.map(function(m) {
  return m4.inverse(m);
});
```

Now we're ready to render

First we animate the bones, conmputing a new world matrix for each

```
var t = time * 0.001;
var angle = Math.sin(t) * 0.8;
computeBoneMatrices(bones, angle);
```

Then we multiple the result of each by the inverse bind pose to deal with
the issue mentioned above

```
// multiply each by its bindPoseInverse
bones.forEach(function(bone, ndx) {
  m4.multiply(bone, bindPoseInv[ndx], boneMatrices[ndx]);
});
```

Then all the normal stuff, setting up the attributes, setting the uniforms, and drawing.

```
gl.useProgram(programInfo.program);
// calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);

// calls gl.uniformXXX, gl.activeTexture, gl.bindTexture
webglUtils.setUniforms(programInfo, uniforms);

// calls gl.drawArrays or gl.drawIndices
webglUtils.drawBufferInfo(gl, bufferInfo, gl.LINES);
```

And here's the result

{{{example url="../webgl-skinning.html" }}}

The red lines are the *skinned* mesh.  The green and blue lines represent
the x-axis and y-axis of each bone or "joint". You can see how the vertices
that are influenced by multiple bones move between the bones that influence
them. We didn't cover how the bones are drawn as it's not important to
explaining how skinning works. See the code if you're curious.

NOTE: bones vs joints is confusing. There's only 1 thing, *matrices*.
But, in a 3d modelling package they usually draw a gizmo (a ui widget)
between each matrix. That looks ends up looking like a bone. The joints
are where matrices are and they draw a line or cone from each joint
to the next to make it kind of look like a skeleton.

<div class="webgl_center">
  <img src="resources/bone-display.png" style="width: 351px;">
  <div class="caption"><a href="https://www.blendswap.com/blends/view/66412">LowPoly Man</a> by <a href="https://www.blendswap.com/user/TiZeta">TiZeta</a></div>
</div>

Another minor thing to note, the example above is using floats for the weights
and the bone indices but you could easily use `UNSIGNED_BYTE` to save a
bunch of space.

Unfortunately there's a limit to the number of uniforms you can use in a shader.
The lower limit on WebGL is 64 vec4s which is only 8 mat4s and you probably
need some of those uniforms for other things like for example we have `color`
in the fragment shader and we have `projection` and `view` which means if
we were on a device with a limit of 64 vec4s we could only have 5 bones! Checking
[WebGLStats](https://webglstats.com/webgl/parameter/MAX_VERTEX_UNIFORM_VECTORS)
most devices support 128 vec4s and 70% of them support 256 vec4s but with
are sample above that's still only 13 bones and 29 bones respectively. 13 is
not even enough for a early 90s Virtua Fighter 1 style character and 29 is not
close to the number used in most modern games.

A couple ways around that. One is to pre-process the models offline and break them
into multiple parts each one using no more than N bones. That's pretty complicated
and brings it's own set of issues.

Another is to store the bone matrices in a texture. This is an important reminder
that textures are not just images, they are effectively 2D arrays of random access
data that you can pass to a shader and you can use them for all kinds of things
that are not just reading images for texturing.

Let's pass our matrices in a texture to bypass the uniform limit. To make this
easy we're going to use floating point textures. Floating point textures are
an optional feature of WebGL but fortunately they are supported by most devices.

Here's the code to get the extension. If it fails we'd probably want to either tell
the user they are out of luck or choose some other solution.

```
var ext = gl.getExtension('OES_texture_float');
if (!ext) {
  return;  // the extension doesn't exist on this device
}
```

Let's update the shader to get the matrices out of a texture.
We'll make the texture have one matrix per row. Each texel of the texture
has R, G, B, and A, that's 4 values so we only need 4 pixels per matrix,
one pixel for each row of the matrix.
Textures can usually be at least 2048 pixels in certain dimension so
this will give us room for at least 2048 bone matrices which is plenty.

```
attribute vec4 a_position;
attribute vec4 a_weight;
attribute vec4 a_boneNdx;

uniform mat4 projection;
uniform mat4 view;
*uniform sampler2D boneMatrixTexture;
*uniform float numBones;

+// these offsets assume the texture is 4 pixels across
+#define ROW0_U ((0.5 + 0.0) / 4.)
+#define ROW1_U ((0.5 + 1.0) / 4.)
+#define ROW2_U ((0.5 + 2.0) / 4.)
+#define ROW3_U ((0.5 + 3.0) / 4.)
+
+mat4 getBoneMatrix(float boneNdx) {
+  float v = (boneNdx + 0.5) / numBones;
+  return mat4(
+    texture2D(boneMatrixTexture, vec2(ROW0_U, v)),
+    texture2D(boneMatrixTexture, vec2(ROW1_U, v)),
+    texture2D(boneMatrixTexture, vec2(ROW2_U, v)),
+    texture2D(boneMatrixTexture, vec2(ROW3_U, v)));
+}

void main() {

  gl_Position = projection * view *
*                (getBoneMatrix(a_boneNdx[0]) * a_position * a_weight[0] +
*                 getBoneMatrix(a_boneNdx[1]) * a_position * a_weight[1] +
*                 getBoneMatrix(a_boneNdx[2]) * a_position * a_weight[2] +
*                 getBoneMatrix(a_boneNdx[3]) * a_position * a_weight[3]);

}
```

One thing to note is the texture coordinates for the pixels in a texture or texels are
computed from their edges. As we went over in [the article on textures](webgl-3d-textures.html)
texture coordinates go from 0 to 1 across the texture. It turns out 0 is the left edge of the left most
pixel and 1 is the right edge of the right most pixel. If you had a 3 pixel wide texture then
it would be like this.

<div class="webgl_center"><img src="resources/texel-coords.svg" style="width: 400px;"></div>

If you want to look up a specific pixel then the formula is

     (x + .5) / width

Above you'll see for each pixel that's

     (0 + .5) / 3  = 0.166
     (1 + .5) / 3 =  0.5
     (2 + .5) / 3 =  0.833

or

<div class="webgl_center"><img src="resources/texel-coords-middle.svg" style="width: 400px;"></div>

Now we'll setup a texture we can put the bone matrices in

```
// prepare the texture for bone matrices
var boneMatrixTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, boneMatrixTexture);
// since we want to use the texture for pure data we turn
// off filtering
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
// also turn off wrapping since the texture might not be a power of 2
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
```

And we'll pass that texture and number of bones in as uniforms

```
var uniforms = {
  projection: m4.orthographic(-20, 20, -10, 10, -1, 1),
  view: m4.translation(-6, 0, 0),
*  boneMatrixTexture,
*  numBones,
  color: [1, 0, 0, 1],
};
```

Then the only thing we need to change is to update the texture with the
latest bone matrices when rendering

```
// update the texture with the current matrices
gl.bindTexture(gl.TEXTURE_2D, boneMatrixTexture);
gl.texImage2D(
    gl.TEXTURE_2D,
    0,         // level
    gl.RGBA,   // internal format
    4,         // width 4 pixels, each pixel has RGBA so 4 pixels is 16 values
    numBones,  // one row per bone
    0,         // border
    gl.RGBA,   // format
    gl.FLOAT,  // type
    boneArray);
```

The result it the same but we've solved the issue that there aren't
enough uniforms to pass in the matrices via uniforms.

{{{example url="../webgl-skinning-bone-matrices-in-texture.html" }}}

So that's the basics of skinning. It's not so hard to write the code to display
a skinned mesh. The harder part is actually getting data. You generally need
some 3D software like blender/maya/3d studio max, and then to either write
your own exporter or find a an exporter and format that will provide all the data needed.
The vertices, their bones, which bones influence which vertices and their influence
weights,




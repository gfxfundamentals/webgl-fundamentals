Title: How do I convert from a mouse coordinate in a WebGL canvas to a ray in 3D space using the J3DIMath.js library?
Description:
TOC: qna

# Question:

I have a WebGL app and I'm using the J3DIMatrix4 class to calculate the Model View Perspective matrix (because that's what every tutorial does).

Now I want to figure out what object the mouse is on and I need to convert my mouse position to a ray in world space. I'm using the [J3dIMath.js library][1] and the following code to calculate my perspective matrix

    this.perspectiveMatrix = new J3DIMatrix4();
    this.perspectiveMatrix.perspective(30, canvas.clientWidth / canvas.clientHeight, 1, 10000);
    this.perspectiveMatrix.lookat(0,0,7, 0,0,0, 0,1,0)

When it comes time to actually draw an object I mix that with the object's matrix:

    this.mvpMatrix.load(this.perspectiveMatrix);
    this.mvpMatrix.multiply(this.mvMatrix);
    this.mvpMatrix.setUniform(gl, this.u_modelViewProjMatrixLoc, false);

And the vertex shader is a bog-standard 

    uniform mat4 u_modelViewProjMatrix;
    attribute vec2 vTexCoord;
    attribute vec4 vPosition;
    varying vec2 v_texCoord;
    void main()
    {
        gl_Position = u_modelViewProjMatrix * vPosition;
        v_texCoord = vTexCoord;
    }

I experimented with inverting the perspective matrix and using 

 var mat = new J3DIMatrix4()
 mat.load(this.perspectiveMatrix)
 mat.multiply(this.mvMatrix)
 mat.invert()
 var coord = new J3DIVector3(0.7, 0.5, 1)
 coord.multVecMatrix(mat)
 debug_log(coord)
    //I picked [0.7,0.5,1] because I figured it likely represented an on-screen point in camera space.

Unfortunately, that gives me some pretty weird results like [8121,362, -8120]. I was expecting a result more in the neighborhood of [4,4,6]

I assume that is because the .perspective() call is creating a non-affine matrix. I guess I need something that is more like blender's camera object matrix that encodes the orientation and position of the "eyeball", but without the perspective adjustments.

Given the values I have chosen for my perspective and lookat, how would I construct an affine and invertible camera matrix? (which I would then use to calculate focal point and map from mouse coordinates to a point on the click ray)

Solutions will be judged on clarity and length (and if you depend on some external library other than J3DIMath, that will be added to your line count)

( the answer to https://stackoverflow.com/questions/7364693/how-to-get-object-in-webgl-3D-space-from-a-mouse-click-coordinate is mostly impenetrable because of its length and the fact that it depends on Jax )


  [1]: http://code.google.com/p/webgl-code-storage/source/browse/trunk/samples/SpinningBox/resources/J3DIMath.js?r=2

# Answer

If you go through [these tutorials](http://webglfundamentals.org/webgl/lessons/webgl-3d-perspective.html) I hope they would make it clear that a perspective matrix only goes so far. There's still a divide by w that happens before you arrive at clipspace.

So if the original world -> clip space is

    tempPoint = projectionMatrix * viewMatrix * worldSpacePoint
    clipSpacePoint = tempPoint / tempPoint.w

Then to go backward it's

    tempPoint = clipSpacePoint * tempPoint.w
    worldSpacePoint = inverse(projectMatrix * viewMatrix) * tempPoint

We know from the projectMatrix that `tempPoint.w` will be `zNear` when it's at the near plane of the frustum and `zFar` when it's at the far plane.

So go backward from the mouse to 3D first you have to convert the mouse to clipspace (-1 + 1). Assuming you have canvas relative mouse coordinates

    clipX = mouseX / gl.canvas.clientWidth  * 2 - 1;    
    clipY = mouseY / gl.canvas.clientHeight * -2 + 1;   // because GL is 0 at bottom
    clipZ = -1 (for close) +1 for (far)

So

    clipNear = [clipX, clipY, -1, 1];
    clipFar  = [clipX, clipY,  1, 1];

Now you need to multiply by `zNear` or `zFar`. We could have done that
in the first step

    tempNear = [clipX * zNear, clipY * zNear, -zNear, zNear];
    tempFar  = [clipX * zFar , clipY * zFar ,  zFar ,  zFar];

Or we could use some function. As far as I can tell J3DImath doesn't have a function we can use to do that.

Now you're back to the value just after the perspective matrix was applied so you can finally multiply by the inverse perspective or the inverse viewPerspective if you have a camera, as in if you're not viewing from 0,0,0.

Unfortunately, as far as I can tell, [J3DIMath doesn't have a function to do this](https://code.google.com/p/webgl-code-storage/source/browse/trunk/samples/SpinningBox/resources/J3DIMath.js?r=2). The only function I see is `J3DIVector3.prototype.multVecMatrix` but [looking at the source](https://code.google.com/p/webgl-code-storage/source/browse/trunk/samples/SpinningBox/resources/J3DIMath.js?r=2) that function assumes `w` will be 1 but we can see above `w` is not 1.

So, I'd recommend **using another math library**.

In the meantime this code should work.

    function multVec4J3DIMatrix function(vec4, matrix) {
        var x = vec4[0];
        var y = vec4[1];
        var z = vec4[2];
        var w = vec4[3];
    
        var m = matrix.$matrix;
    
        return [
          x * m.m11 + y * m.m21 + z * m.m31 + w * m.m41, 
          x * m.m12 + y * m.m22 + z * m.m32 + w * m.m42,
          x * m.m13 + y * m.m23 + z * m.m33 + w * m.m43,
          x * m.m14 + y * m.m24 + z * m.m34 + w * m.m44,
        ];
    }

So from your example above

    var mat = new J3DIMatrix4()
    mat.load(this.perspectiveMatrix)
    mat.multiply(this.mvMatrix)
    mat.invert()

    // from this line we see zNear and zFar
    // this.perspectiveMatrix.perspective(30, canvas.clientWidth / canvas.clientHeight, 1, 10000);
    zNear = 1;
    zFar  = 10000;

    // var coord = new J3DIVector3(0.7, 0.5, 1)
    // I'm going to assume since you put 1 for z you wanted zFar
    coord = [0.7 * zNear, 0.7 * zNear, zFar, zFar];
    world = multVec4J3DIMatrix(coord, mat);



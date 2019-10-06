Title: Create a rotating camera in WebGL with lookAt
Description:
TOC: qna

# Question:

I'm trying to implement a 3D camera using the lookAt function in WebGL using quaternions for the rotations. So far, I'm able to achieve a roll feature by rotating the 'up' vector, however, I can't get the lookAt point to change anything. 

Here's the basic setup code i have where 

up is (0,1,0)
viewDir is (0,0,-1)
eyePt is (0,0,0)

<!-- language: lang-js -->

       var transformVec = vec3.create();

       gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
       gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

       mat4.perspective(pMatrix, degToRad(45), gl.viewportWidth / gl.viewportHeight, 0.1, 400.0);

       quat.setAxisAngle(workingQuat, [0, 1, 0], degToRad(roll));
       quat.mul(globalQuat, globalQuat, workingQuat);
       vec3.transformQuat(up, up, globalQuat);

       vec3.add(viewPt, eyePt, viewDir);
       mat4.lookAt(mvMatrix, eyePt, viewPt, up);

       mvPushMatrix();
        // drawing terrain
       vec3.set(transformVec, 0.0, -0.25, -100.0);
       mat4.translate(mvMatrix, mvMatrix, transformVec);
       mat4.rotateX(mvMatrix, mvMatrix, degToRad(-75));
       mat4.rotateZ(mvMatrix, mvMatrix, degToRad(25));
       setMatrixUniforms();

       mvPopMatrix();

I think i'm confused on how exactly i'm supposed to use the function. I can't get the camera to look at any other point.

# Answer

To use look at you need an point in space to um, *look at*.

So for example multiply all your matrices out to get a world matrix, then extract just the translation (elements 12,13,14) and use those as your lookAt view point target.

So you can use a quaternion in the the matrix calculations but at the end you need a point out in world space that you want to look at.



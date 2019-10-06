Title: Trying to understand the math behind the perspective matrix in WebGL
Description:
TOC: qna

# Question:

All matrix libraries for WebGL have some sort of `perspective` function that you call to get the perspective matrix for the scene.  
For example, the `perspective` method within the [`mat4.js` file that's part of `gl-matrix`](https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/mat4.js) is coded as such:

    mat4.perspective = function (out, fovy, aspect, near, far) {
        var f = 1.0 / Math.tan(fovy / 2),
            nf = 1 / (near - far);
        out[0] = f / aspect;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[5] = f;
        out[6] = 0;
        out[7] = 0;
        out[8] = 0;
        out[9] = 0;
        out[10] = (far + near) * nf;
        out[11] = -1;
        out[12] = 0;
        out[13] = 0;
        out[14] = (2 * far * near) * nf;
        out[15] = 0;
        return out;
    };

I'm really trying to understand what all the math in this method is actually doing, but I'm tripping up on several points.

For starters, if we have a canvas as follows with an aspect ratio of 4:3, then the `aspect` parameter of the method would in fact be `4 / 3`, correct?

![4:3 aspect ratio][1]

I've also noticed that 45° seems like a common field of view. If that's the case, then the `fovy` parameter would be `π / 4` radians, correct?

With all that said, what is the `f` variable in the method short for and what is the purpose of it?  
I was trying to envision the actual scenario, and I imagined something like the following:

![Side view of [perspective in 3D scene][2]

Thinking like this, I can understand why you divide `fovy` by `2` and also why you take the tangent of that ratio, but why is the inverse of that stored in `f`? Again, I'm having a lot of trouble understanding what `f` really represents.

Next, I get the concept of `near` and `far` being the clipping points along the z-axis, so that's fine, but if I use the numbers in the picture above (i.e., `π / 4`, `4 / 3`, `10` and `100`) and plug them into the `perspective` method, then I end up with a matrix like the following:

![enter image description here][3]

Where `f` is equal to:

![enter image description here][4]

So I'm left with the following questions:

 1. What is `f`?
 2. What does the value assigned to `out[10]` (i.e., `110 / -90`) represent?
 3. What does the `-1` assigned to `out[11]` do?
 4. What does the value assigned to `out[14]` (i.e., `2000 / -90`) represent?

Lastly, I should note that I have already read [Gregg Tavares's explanation on the perspective matrix](http://games.greggman.com/game/webgl-3d-perspective/), but after all of that, I'm left with the same confusion.

  [1]: http://i.stack.imgur.com/xber1.png
  [2]: http://i.stack.imgur.com/WCask.png
  [3]: http://i.stack.imgur.com/p3Wfq.png
  [4]: http://i.stack.imgur.com/VARLE.png

# Answer

Let's see if I can explain this, or maybe after reading this you can come up with a better way to explain it.

The first thing to realize is WebGL requires clipspace coordinates. They go -1 <-> +1 in x, y, and z. So, a perspective matrix is basically designed to take the space inside the *frustum* and convert it to clipspace.

If you look at this diagram

![frustum-side][1]

we know that tangent = opposite (y) over adjacent(z) so if we know z we can compute y that would be sitting at the edge of the frustum for a given fovY.

    tan(fovY / 2) = y / -z

multiply both sides by -z

    y = tan(fovY / 2) * -z

if we define

    f = 1 / tan(fovY / 2)

we get

    y = -z / f

note we haven't done a conversion from cameraspace to clipspace. All we've done is compute y at the edge of the field of view for a given z in cameraspace. The edge of the field of view is also the edge of clipspace. Since clipspace is just +1 to -1 we can just divide a cameraspace y by `-z / f` to get clipspace.

Does that make sense? Look at the diagram again. Let's assume that the blue `z` was -5 and for some given field of view `y` came out to `+2.34`. We need to convert `+2.34` to +1 *clipspace*. The generic version of that is

   clipY = cameraY * f / -z

Looking at `makePerspective'

    function makePerspective(fieldOfViewInRadians, aspect, near, far) {
      var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
      var rangeInv = 1.0 / (near - far);
     
      return [
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (near + far) * rangeInv, -1,
        0, 0, near * far * rangeInv * 2, 0
      ];
    };

we can see that `f` in this case 

    tan(Math.PI * 0.5 - 0.5 * fovY)

which is actually the same as

    1 / tan(fovY / 2)

Why is it written this way? I'm guessing because if you had the first style and tan came out to 0 you'd divide by 0 your program would crash where is if you do it the this way there's no division so no chance for a divide by zero.

Seeing that `-1` is in `matrix[11]` spot means when we're all done

    matrix[5]  = tan(Math.PI * 0.5 - 0.5 * fovY)
    matrix[11] = -1

    clipY = cameraY * matrix[5] / cameraZ * matrix[11]

For `clipX` we basically do the exact same calculation except scaled for the aspect ratio.

    matrix[0]  = tan(Math.PI * 0.5 - 0.5 * fovY) / aspect
    matrix[11] = -1

    clipX = cameraX * matrix[0] / cameraZ * matrix[11]

Finally we have to convert cameraZ in the -zNear <-> -zFar range to clipZ in the -1 <-> + 1 range.  

The standard perspective matrix does this with as [reciprocal function](https://en.wikipedia.org/wiki/Multiplicative_inverse) so that z values close the the camera get more resolution than z values far from the camera. That formula is

    clipZ = something / cameraZ + constant

Let's use `s` for `something` and `c` for constant.

    clipZ = s / cameraZ + c;

and solve for `s` and `c`. In our case we know

    s / -zNear + c = -1
    s / -zFar  + c =  1

So, move the `c' to the other side

    s / -zNear = -1 - c
    s / -zFar  =  1 - c

Multiply by -zXXX

    s = (-1 - c) * -zNear
    s = ( 1 - c) * -zFar

Those 2 things now equal each other so

    (-1 - c) * -zNear = (1 - c) * -zFar

expand the quantities

    (-zNear * -1) - (c * -zNear) = (1 * -zFar) - (c * -zFar)

simplify

    zNear + c * zNear = -zFar + c * zFar

move `zNear` to the right

    c * zNear = -zFar + c * zFar - zNear

move `c * zFar` to the left

    c * zNear - c * zFar = -zFar - zNear

simplify

    c * (zNear - zFar) = -(zFar + zNear)

divide by `(zNear - zFar)`

    c = -(zFar + zNear) / (zNear - zFar)

solve for `s`

    s = (1 - -((zFar + zNear) / (zNear - zFar))) * -zFar

simplify

    s = (1 + ((zFar + zNear) / (zNear - zFar))) * -zFar

change the `1` to `(zNear - zFar)`

    s = ((zNear - zFar + zFar + zNear) / (zNear - zFar)) * -zFar

simplify

    s = ((2 * zNear) / (zNear - zFar)) * -zFar

simplify some more

    s = (2 * zNear * zFar) / (zNear - zFar)

*dang I wish stackexchange supported math like their math site does :(*

so back to the top. Our forumla was

    s / cameraZ + c

And we know `s` and `c` now.

    clipZ = (2 * zNear * zFar) / (zNear - zFar) / -cameraZ -
            (zFar + zNear) / (zNear - zFar)

let's move the -z outside

    clipZ = ((2 * zNear * zFar) / zNear - ZFar) +
             (zFar + zNear) / (zNear - zFar) * cameraZ) / -cameraZ

we can change `/ (zNear - zFar)` to `* 1 / (zNear - zFar)` so

    rangeInv = 1 / (zNear - zFar)
    clipZ = ((2 * zNear * zFar) * rangeInv) +
             (zFar + zNear) * rangeInv * cameraZ) / -cameraZ

Looking back at `makeFrustum` we see it's going to end up making

    clipZ = (matrix[10] * cameraZ + matrix[14]) / (cameraZ * matrix[11])

Looking at the formula above that fits

    rangeInv = 1 / (zNear - zFar)
    matrix[10] = (zFar + zNear) * rangeInv
    matrix[14] = 2 * zNear * zFar * rangeInv
    matrix[11] = -1
    clipZ = (matrix[10] * cameraZ + matrix[14]) / (cameraZ * matrix[11])

I hope that made sense. Note: Most of this is just my re-writing of [this article](https://unspecified.wordpress.com/2012/06/21/calculating-the-gluperspective-matrix-and-other-opengl-matrix-maths/).

  [1]: http://i.stack.imgur.com/nRgAD.png

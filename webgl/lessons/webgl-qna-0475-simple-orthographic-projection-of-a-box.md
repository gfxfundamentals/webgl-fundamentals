Title: simple orthographic projection of a box
Description:
TOC: qna

# Question:

This problem might be simpler if I could use correct terminology but I do not know much of computer graphics. What I am trying to do is projecting (orthogonal) a box  (Cuboid? - rectangle in 3d) into 3 planes (top/front/side views). 

[![enter image description here][1]][1] [source](http://www.glprogramming.com/red/images/Image63.gif)


I have these constraints

1. the face of the box is parallel to the plane of projection. so one face of the box is the projection.
2. only need to consider rectangular shapes.

I use d3 to draw the 2d representation, and have some intuition of how this works. so, the logic may be like (as marked in the picture above)

    for top view, move the coordinate to top, left of the box, and discard height (y axis)
    for front view, keep the coordinate, and discard depth (z axis)
    for left side view, move coordinate to bottom, left and discard length (x axis)


I have read some opengl tutorials on how to use projection matrix to simplify the calculations, but my case is simpler so I hope I don't have to consider each edge of the box as a vector and apply multiple matrix transformation on it. Also, I understand the complexities of transforming cartesian to svg coordinates, but just an idea of formal way of orthographic projection of a box onto 3 planed would suffice.

 Is there a matrix which I can use to get the projected coordinate of the rectangle? Please help me to formalize this problem (is this a known projection?)

 Please let me know if I am unclear.

Thanks in advance. 


  [1]: http://i.stack.imgur.com/EUgiZ.gif

# Answer

So my WebGL WebGL WebGL brain posted the "generic-ish" solution below where you can view from any angle any orientation

But, if you just want right, top, front views then you just use 2 of the 3 coordinates for each point front = (x, y), top = (x, z), right = (z, y)

You just draw lines between all the points in 2d (or whatever you're drawing between the points) like this


<!-- begin snippet: js hide: false -->

<!-- language: lang-js -->

    var cubeVertices = [
      -1, -1, -1, // 0
       1, -1, -1, // 1
       1,  1, -1, // 2
      -1,  1, -1, // 3
      -1, -1,  1, // 4
       1, -1,  1, // 5
       1,  1,  1, // 6
      -1,  1,  1, // 7

      //
      // making some points in the middle for letters
      //
      -.5, -.5, 0, // 8     8 +--+ 9
      -.3, -.5, 0, // 9       |
      -.5, -.4, 0, // 10   10 +--+ 11
      -.3, -.4, 0, // 11      |
      -.5, -.3, 0, // 12   12 +

                 //           15
      .3, 0, .3, // 13   13 +-+-+ 14
      .5, 0, .3, // 14        |
      .4, 0, .3, // 15        |
      .4, 0, .5, // 16        + 16

      0, -.5, -.5, // 17   17 +---+ 18
      0, -.5,  .5, // 18      |   |
      0,  .5, -.5, // 19   20 +---+ 21
      0,   0, -.5, // 20      | \
      0,   0,  .5, // 21      |  \
      0,  .5,  .5, // 22   19 +   + 22

    ];
    var indices = [
      0, 1,
      1, 2,
      2, 3,
      3, 0,
      4, 5,
      5, 6,
      6, 7,
      7, 4,
      0, 4,
      1, 5,
      2, 6,
      3, 7,

      // f / front
      8, 9,
      8, 12,
      10, 11,

      // t / top
      13, 14,
      15, 16,

      // r / right
      17, 18,
      18, 21,
      17, 19,
      20, 21,
      20, 22,
    ];
    var canvas = document.getElementById("c");
    var ctx = canvas.getContext("2d");
    var width  = canvas.width;
    var height = canvas.height;

    ctx.font = "20px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // make 3 areas in canvas
    ctx.fillStyle = "#FEE";
    ctx.fillRect(width / 3 * 0, 0, width / 3, height);
    ctx.fillStyle = "#EFE";
    ctx.fillRect(width / 3 * 1, 0, width / 3, height);
    ctx.fillStyle = "#EEF";
    ctx.fillRect(width / 3 * 2, 0, width / 3, height);
    ctx.fillStyle = "#000";

    // Draw front
    ctx.save();
    ctx.translate(width / 6 * 1, height / 2);
    ctx.beginPath();
    addLines(ctx, cubeVertices, indices, 0, 1, height / 4);
    ctx.stroke();
    ctx.fillText("front", 0, 60);
    ctx.restore();

    // Draw top
    ctx.save();
    ctx.translate(width / 6 * 3, height / 2);
    ctx.beginPath();
    addLines(ctx, cubeVertices, indices, 0, 2, height / 4);
    ctx.stroke();
    ctx.fillText("top", 0, 60);
    ctx.restore();

    // Draw right
    ctx.save();
    ctx.translate(width / 6 * 5, height / 2);
    ctx.beginPath();
    addLines(ctx, cubeVertices, indices, 2, 1, height / 4);
    ctx.stroke();
    ctx.fillText("right", 0, 60);
    ctx.restore();


    function addLines(ctx, vertices, indices, xIndex, yIndex, scale) {
      for (var ii = 0; ii < indices.length; ii += 2) {
        var offset0 = indices[ii + 0] * 3;
        var offset1 = indices[ii + 1] * 3;
        var p0 = vertices.slice(offset0, offset0 + 3);
        var p1 = vertices.slice(offset1, offset1 + 3);
        ctx.moveTo(p0[xIndex] * scale, p0[yIndex] * scale);
        ctx.lineTo(p1[xIndex] * scale, p1[yIndex] * scale);
      }
    }

<!-- language: lang-html -->

    <canvas id="c"></canvas>

<!-- end snippet -->

For left use (-x, y), for bottom use (x, -z), for back ose (-x, y)

---

## Generic solution (look from any angle)

You might want to check out [this article](http://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html) and the previous few articles.

If you have a 3d matrix library around, the simplest way would be to multiply an `ortho` matrix with a view matrix using a `lookat` function.(most 3d libraries have an orthographic projection function and lookat function) 

    othro * inverse(lookAt(eye, target, up));

where front is

    eye = [0, 0, 1];
    target = [0, 0, 0];
    up = [0, 1, 0];

where left is

    eye = [-1, 0, 0];
    target = [0, 0, 0];
    up = [0, 1, 0];

where top is

    eye = [0, 1, 0];
    target = [0, 0, 0];
    up = [0, 0, -1];

Of course given you're putting the camera on the direct axes you can just make the matrices yourself by plugging in the correct values which if you look at any `ortho` and `lookAt` functions or just run them once it with the above values it should be pretty clear what the matrices need to be. I think it's probably just easier to use a library. Even better if you're trying to make one face of your box the start of your view frustum you can just plug the box coordinates into any typical `ortho` function

Here a typical one

      function ortho(left, right, bottom, top, near, far) {
        return [
          2 / (right - left), 0, 0, 0,
          0, 2 / (top - bottom), 0, 0,
          0, 0, -1 / (far - near), 0,
          (right + left) / (left - right),
          (top + bottom) / (bottom - top),
          -near / (near - far),
          1,
        ];
      }

If it's not clear, all this matrix is doing is scaling each dimension so that the range of `right - left`, `top - bottom`, and `far - near` each become 2 units big. That's the first 3 lines respectively. The last line moves the units -1 unit in each dimension so that you end up with values that go from -1 to +1 in each dimension because that's what GL/WebGL need to be able to render. See [this article](http://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html).

Here's an example

<!-- begin snippet: js hide: true -->

<!-- language: lang-js -->

    "use strict";
    var ThreeDMath = (function() {

      var subVector = function(a, b) {
        var r = [];
        var aLength = a.length;
        for (var i = 0; i < aLength; ++i)
          r[i] = a[i] - b[i];
        return r;
      };

      var dot = function(a, b) {
        var r = 0.0;
        var aLength = a.length;
        for (var i = 0; i < aLength; ++i)
          r += a[i] * b[i];
        return r;
      };

      var cross = function(a, b) {
        return [a[1] * b[2] - a[2] * b[1],
          a[2] * b[0] - a[0] * b[2],
          a[0] * b[1] - a[1] * b[0]
        ];
      };

      var normalize = function(a) {
        var r = [];
        var n = 0.0;
        var aLength = a.length;
        for (var i = 0; i < aLength; ++i)
          n += a[i] * a[i];
        n = Math.sqrt(n);
        if (n > 0.00001) {
          for (var i = 0; i < aLength; ++i)
            r[i] = a[i] / n;
        } else {
          r = [0, 0, 0];
        }
        return r;
      };

      var transformPoint = function(m, v) {
        var v0 = v[0];
        var v1 = v[1];
        var v2 = v[2];
        var d = v0 * m[0 * 4 + 3] + v1 * m[1 * 4 + 3] + v2 * m[2 * 4 + 3] + m[3 * 4 + 3];
        return [(v0 * m[0 * 4 + 0] + v1 * m[1 * 4 + 0] + v2 * m[2 * 4 + 0] + m[3 * 4 + 0]) / d,
          (v0 * m[0 * 4 + 1] + v1 * m[1 * 4 + 1] + v2 * m[2 * 4 + 1] + m[3 * 4 + 1]) / d,
          (v0 * m[0 * 4 + 2] + v1 * m[1 * 4 + 2] + v2 * m[2 * 4 + 2] + m[3 * 4 + 2]) / d
        ];
      };

      var identity = function() {
        return [
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 1
        ];
      };

      var multiplyMatrix = function(a, b) {
        var a00 = a[0 * 4 + 0];
        var a01 = a[0 * 4 + 1];
        var a02 = a[0 * 4 + 2];
        var a03 = a[0 * 4 + 3];
        var a10 = a[1 * 4 + 0];
        var a11 = a[1 * 4 + 1];
        var a12 = a[1 * 4 + 2];
        var a13 = a[1 * 4 + 3];
        var a20 = a[2 * 4 + 0];
        var a21 = a[2 * 4 + 1];
        var a22 = a[2 * 4 + 2];
        var a23 = a[2 * 4 + 3];
        var a30 = a[3 * 4 + 0];
        var a31 = a[3 * 4 + 1];
        var a32 = a[3 * 4 + 2];
        var a33 = a[3 * 4 + 3];
        var b00 = b[0 * 4 + 0];
        var b01 = b[0 * 4 + 1];
        var b02 = b[0 * 4 + 2];
        var b03 = b[0 * 4 + 3];
        var b10 = b[1 * 4 + 0];
        var b11 = b[1 * 4 + 1];
        var b12 = b[1 * 4 + 2];
        var b13 = b[1 * 4 + 3];
        var b20 = b[2 * 4 + 0];
        var b21 = b[2 * 4 + 1];
        var b22 = b[2 * 4 + 2];
        var b23 = b[2 * 4 + 3];
        var b30 = b[3 * 4 + 0];
        var b31 = b[3 * 4 + 1];
        var b32 = b[3 * 4 + 2];
        var b33 = b[3 * 4 + 3];
        return [a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30,
          a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31,
          a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32,
          a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33,
          a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30,
          a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31,
          a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32,
          a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33,
          a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30,
          a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31,
          a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32,
          a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33,
          a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30,
          a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31,
          a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32,
          a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33
        ];
      };

      var inverse = function(m) {
        var tmp_0 = m[2 * 4 + 2] * m[3 * 4 + 3];
        var tmp_1 = m[3 * 4 + 2] * m[2 * 4 + 3];
        var tmp_2 = m[1 * 4 + 2] * m[3 * 4 + 3];
        var tmp_3 = m[3 * 4 + 2] * m[1 * 4 + 3];
        var tmp_4 = m[1 * 4 + 2] * m[2 * 4 + 3];
        var tmp_5 = m[2 * 4 + 2] * m[1 * 4 + 3];
        var tmp_6 = m[0 * 4 + 2] * m[3 * 4 + 3];
        var tmp_7 = m[3 * 4 + 2] * m[0 * 4 + 3];
        var tmp_8 = m[0 * 4 + 2] * m[2 * 4 + 3];
        var tmp_9 = m[2 * 4 + 2] * m[0 * 4 + 3];
        var tmp_10 = m[0 * 4 + 2] * m[1 * 4 + 3];
        var tmp_11 = m[1 * 4 + 2] * m[0 * 4 + 3];
        var tmp_12 = m[2 * 4 + 0] * m[3 * 4 + 1];
        var tmp_13 = m[3 * 4 + 0] * m[2 * 4 + 1];
        var tmp_14 = m[1 * 4 + 0] * m[3 * 4 + 1];
        var tmp_15 = m[3 * 4 + 0] * m[1 * 4 + 1];
        var tmp_16 = m[1 * 4 + 0] * m[2 * 4 + 1];
        var tmp_17 = m[2 * 4 + 0] * m[1 * 4 + 1];
        var tmp_18 = m[0 * 4 + 0] * m[3 * 4 + 1];
        var tmp_19 = m[3 * 4 + 0] * m[0 * 4 + 1];
        var tmp_20 = m[0 * 4 + 0] * m[2 * 4 + 1];
        var tmp_21 = m[2 * 4 + 0] * m[0 * 4 + 1];
        var tmp_22 = m[0 * 4 + 0] * m[1 * 4 + 1];
        var tmp_23 = m[1 * 4 + 0] * m[0 * 4 + 1];

        var t0 = (tmp_0 * m[1 * 4 + 1] + tmp_3 * m[2 * 4 + 1] + tmp_4 * m[3 * 4 + 1]) -
          (tmp_1 * m[1 * 4 + 1] + tmp_2 * m[2 * 4 + 1] + tmp_5 * m[3 * 4 + 1]);
        var t1 = (tmp_1 * m[0 * 4 + 1] + tmp_6 * m[2 * 4 + 1] + tmp_9 * m[3 * 4 + 1]) -
          (tmp_0 * m[0 * 4 + 1] + tmp_7 * m[2 * 4 + 1] + tmp_8 * m[3 * 4 + 1]);
        var t2 = (tmp_2 * m[0 * 4 + 1] + tmp_7 * m[1 * 4 + 1] + tmp_10 * m[3 * 4 + 1]) -
          (tmp_3 * m[0 * 4 + 1] + tmp_6 * m[1 * 4 + 1] + tmp_11 * m[3 * 4 + 1]);
        var t3 = (tmp_5 * m[0 * 4 + 1] + tmp_8 * m[1 * 4 + 1] + tmp_11 * m[2 * 4 + 1]) -
          (tmp_4 * m[0 * 4 + 1] + tmp_9 * m[1 * 4 + 1] + tmp_10 * m[2 * 4 + 1]);

        var d = 1.0 / (m[0 * 4 + 0] * t0 + m[1 * 4 + 0] * t1 + m[2 * 4 + 0] * t2 + m[3 * 4 + 0] * t3);

        return [d * t0, d * t1, d * t2, d * t3,
          d * ((tmp_1 * m[1 * 4 + 0] + tmp_2 * m[2 * 4 + 0] + tmp_5 * m[3 * 4 + 0]) -
            (tmp_0 * m[1 * 4 + 0] + tmp_3 * m[2 * 4 + 0] + tmp_4 * m[3 * 4 + 0])),
          d * ((tmp_0 * m[0 * 4 + 0] + tmp_7 * m[2 * 4 + 0] + tmp_8 * m[3 * 4 + 0]) -
            (tmp_1 * m[0 * 4 + 0] + tmp_6 * m[2 * 4 + 0] + tmp_9 * m[3 * 4 + 0])),
          d * ((tmp_3 * m[0 * 4 + 0] + tmp_6 * m[1 * 4 + 0] + tmp_11 * m[3 * 4 + 0]) -
            (tmp_2 * m[0 * 4 + 0] + tmp_7 * m[1 * 4 + 0] + tmp_10 * m[3 * 4 + 0])),
          d * ((tmp_4 * m[0 * 4 + 0] + tmp_9 * m[1 * 4 + 0] + tmp_10 * m[2 * 4 + 0]) -
            (tmp_5 * m[0 * 4 + 0] + tmp_8 * m[1 * 4 + 0] + tmp_11 * m[2 * 4 + 0])),
          d * ((tmp_12 * m[1 * 4 + 3] + tmp_15 * m[2 * 4 + 3] + tmp_16 * m[3 * 4 + 3]) -
            (tmp_13 * m[1 * 4 + 3] + tmp_14 * m[2 * 4 + 3] + tmp_17 * m[3 * 4 + 3])),
          d * ((tmp_13 * m[0 * 4 + 3] + tmp_18 * m[2 * 4 + 3] + tmp_21 * m[3 * 4 + 3]) -
            (tmp_12 * m[0 * 4 + 3] + tmp_19 * m[2 * 4 + 3] + tmp_20 * m[3 * 4 + 3])),
          d * ((tmp_14 * m[0 * 4 + 3] + tmp_19 * m[1 * 4 + 3] + tmp_22 * m[3 * 4 + 3]) -
            (tmp_15 * m[0 * 4 + 3] + tmp_18 * m[1 * 4 + 3] + tmp_23 * m[3 * 4 + 3])),
          d * ((tmp_17 * m[0 * 4 + 3] + tmp_20 * m[1 * 4 + 3] + tmp_23 * m[2 * 4 + 3]) -
            (tmp_16 * m[0 * 4 + 3] + tmp_21 * m[1 * 4 + 3] + tmp_22 * m[2 * 4 + 3])),
          d * ((tmp_14 * m[2 * 4 + 2] + tmp_17 * m[3 * 4 + 2] + tmp_13 * m[1 * 4 + 2]) -
            (tmp_16 * m[3 * 4 + 2] + tmp_12 * m[1 * 4 + 2] + tmp_15 * m[2 * 4 + 2])),
          d * ((tmp_20 * m[3 * 4 + 2] + tmp_12 * m[0 * 4 + 2] + tmp_19 * m[2 * 4 + 2]) -
            (tmp_18 * m[2 * 4 + 2] + tmp_21 * m[3 * 4 + 2] + tmp_13 * m[0 * 4 + 2])),
          d * ((tmp_18 * m[1 * 4 + 2] + tmp_23 * m[3 * 4 + 2] + tmp_15 * m[0 * 4 + 2]) -
            (tmp_22 * m[3 * 4 + 2] + tmp_14 * m[0 * 4 + 2] + tmp_19 * m[1 * 4 + 2])),
          d * ((tmp_22 * m[2 * 4 + 2] + tmp_16 * m[0 * 4 + 2] + tmp_21 * m[1 * 4 + 2]) -
            (tmp_20 * m[1 * 4 + 2] + tmp_23 * m[2 * 4 + 2] + tmp_17 * m[0 * 4 + 2]))
        ];
      };

      var perspective = function(angle, aspect, near, far) {
        var f = Math.tan(Math.PI * 0.5 - 0.5 * angle);
        var rangeInv = 1.0 / (near - far);

        return [
          f / aspect, 0, 0, 0,
          0, f, 0, 0,
          0, 0, (near + far) * rangeInv, -1,
          0, 0, near * far * rangeInv * 2, 0
        ];
      };

      var cameraLookAt = function(eye, target, up) {
        var vz = normalize(subVector(eye, target));
        var vx = normalize(cross(up, vz));
        var vy = cross(vz, vx);

        return inverse([
          vx[0], vx[1], vx[2], 0,
          vy[0], vy[1], vy[2], 0,
          vz[0], vz[1], vz[2], 0, -dot(vx, eye), -dot(vy, eye), -dot(vz, eye), 1
        ]);
      };

      var lookAt = function(eye, target, up) {
        return inverse(cameraLookAt(
          eye, target, up));
      };

      function ortho(left, right, bottom, top, near, far) {
        return [
          2 / (right - left), 0, 0, 0,
          0, 2 / (top - bottom), 0, 0,
          0, 0, -1 / (far - near), 0,
          (right + left) / (left - right),
          (top + bottom) / (bottom - top), -near / (near - far),
          1,
        ];
      }

      return {
        identity: identity,
        perspective: perspective,
        cameraLookAt: cameraLookAt,
        lookAt: lookAt,
        multiplyMatrix: multiplyMatrix,
        transformPoint: transformPoint,
        ortho: ortho,
      };

    })();


          var m=ThreeDMath;
          window.onload=main;
          function main() {
          var cubeVertices=[ 
           -1, -1, -1,  // 0
            1, -1, -1,  // 1
            1,  1, -1,  // 2
           -1,  1, -1,  // 3
           -1, -1,  1,  // 4
            1, -1,  1,  // 5
            1,  1,  1,  // 6
           -1,  1,  1,  // 7
          // 
          // making some points in the middle for letters
          //
          -.5, -.5,   0,  // 8     8 +--+ 9
          -.3, -.5,   0,  // 9       |
          -.5, -.4,   0,  // 10   10 +--+ 11
          -.3, -.4,   0,  // 11      |
          -.5, -.3,   0,  // 12   12 +

          //           15
          .3,   0,  .3,  // 13   13 +-+-+ 14
          .5,   0,  .3,  // 14        |
          .4,   0,  .3,  // 15        |
          .4,   0,  .5,  // 16        + 16

          0, -.5, -.5,  // 17   17 +---+ 18 
          0, -.5,  .5,  // 18      |   |
          0,  .5, -.5,  // 19   20 +---+ 21
          0,   0, -.5,  // 20      | \
          0,   0,  .5,  // 21      |  \
          0,  .5,  .5,  // 22   19 +   + 22

        ];
        var indices=[ 
          0, 1,
          1, 2,
          2, 3,
          3, 0,
          4, 5,
          5, 6,
          6, 7,
          7, 4,
          0, 4,
          1, 5,
          2, 6,
          3, 7,

          // f / front
          8, 9,
          8, 12,
          10, 11,

          // t / top
          13, 14,
          15, 16,

          // r / right
          17, 18,
          18, 21,
          17, 19,
          20, 21,
          20, 22,
        ];
          var canvas=document.getElementById("c");
          var ctx=canvas.getContext("2d");
          var then=0;
          function render(clock) {
          clock *=0.001;
          var scale=2;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.save();
          ctx.lineWidth=1;
          ctx.strokeStyle="black";
          var fieldOfView=Math.PI * 0.25;
          var aspect=canvas.clientWidth / canvas.clientHeight;
          var projection=m.perspective(fieldOfView, aspect, 1, 500);
          var radius=5;
          var eye=[ Math.sin(clock) * radius, 1, Math.cos(clock) * radius];
        var target=[0, 0, 0];
        var up=[0, 1, 0];
        // left, right, bottom, top, near, far
        var projection = m.ortho(-2 * aspect, 2 * aspect, -2, 2, -2, 2);
        switch (clock % 4 | 0) {
            // front
          case 0:
            var eye = [0, 0, 1];
            var target = [0, 0, 0];
            var up = [0, 1, 0];
            break;
            // right
          case 1:
            var eye = [1, 0, 0];
            var target = [0, 0, 0];
            var up = [0, 1, 0];
            break;
            // top
          case 2:
            var eye = [0, 1, 0];
            var target = [0, 0, 0];
            var up = [0, 0, -1];
            break;
          case 3:
            var eye = [Math.sin(clock), 1, Math.cos(clock)];
            var target = [0, 0, 0];
            var up = [0, 1, 0];
            break;
        }
        var view=m.lookAt(eye, target, up);
        var worldViewProjection=m.multiplyMatrix(view, projection);
        drawLines(cubeVertices, indices, worldViewProjection);
        ctx.restore();
        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);
      function drawLines(cubeVertices, indices, worldViewProjection) {
        ctx.beginPath();
        // transform points
        var points=[];
        for (var ii=0;
             ii < cubeVertices.length;
             ii +=3) {
          points.push(clipSpaceToCanvasSpace(m.transformPoint( worldViewProjection, [
            cubeVertices[ii + 0], cubeVertices[ii + 1], cubeVertices[ii + 2]])));
        }
        for (var ii=0;
             ii < indices.length;
             ii +=2) {
          var p0=points[indices[ii + 0]];
          var p1=points[indices[ii + 1]];
          ctx.moveTo(p0[0], p0[1]);
          ctx.lineTo(p1[0], p1[1]);
        }
        ctx.stroke();
      }
      // clip space is -1 to 1
      function clipSpaceToCanvasSpace(p) {
        return [
          (p[0] + 1) * ctx.canvas.width  / 2,
          (p[1] + 1) * ctx.canvas.height / 2,
        ];
      }
    }

<!-- language: lang-html -->

    <canvas id="c"></canvas>

<!-- end snippet -->

That being said, there's no reason you need to use that ortho matrix. If you don't use it your units will stay in the space they started. In other words the only point of the ortho matrix is to scale l<->r, t<->b, f<->n to -1<->+1. It's possible you don't need any scaling OR you need to scale to some other units.

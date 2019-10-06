Title: WebGL Perspective Projection Matrix
Description:
TOC: qna

# Question:

Can someone show me a function in javascript/webGL that will change 3d coordinates into 2d projected perspective coordinates? Thnx 

# Answer

Here's a pretty typical perspective matrix function

      function perspective(fieldOfViewYInRadians, aspect, zNear, zFar, dst) {
        dst = dst || new Float32Array(16);
    
        var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewYInRadians);
        var rangeInv = 1.0 / (zNear - zFar);
    
        dst[0]  = f / aspect;
        dst[1]  = 0;
        dst[2]  = 0;
        dst[3]  = 0;
    
        dst[4]  = 0;
        dst[5]  = f;
        dst[6]  = 0;
        dst[7]  = 0;
    
        dst[8]  = 0;
        dst[9]  = 0;
        dst[10] = (zNear + zFar) * rangeInv;
        dst[11] = -1;
    
        dst[12] = 0;
        dst[13] = 0;
        dst[14] = zNear * zFar * rangeInv * 2;
        dst[15] = 0;
    
        return dst;
      }

If you have a vertex shader like this

    attribute vec4 a_position;
    uniform mat4 u_matrix;
    void main() {
      gl_Position = u_matrix * a_position;
    }

You'll get 2d projected coordinates in WebGL. If actually want those coordinates in pixels in say JavaScript you need to divide by w and the expand to pixels

    var transformPoint = function(m, v) {
      var x = v[0];
      var y = v[1];
      var z = v[2];
      var w = x * m[0*4+3] + y * m[1*4+3] + z * m[2*4+3] + m[3*4+3];
      return [(x * m[0*4+0] + y * m[1*4+0] + z * m[2*4+0] + m[3*4+0]) / w,
              (x * m[0*4+1] + y * m[1*4+1] + z * m[2*4+1] + m[3*4+1]) / w,
              (x * m[0*4+2] + y * m[1*4+2] + z * m[2*4+2] + m[3*4+2]) / w];
    };

    var somePoint = [20,30,40];
    var projectedPoint = transformPoint(projectionMatrix, somePoint);

    var screenX = (projectedPoint[0] *  0.5 + 0.5) * canvas.width;
    var screenZ = (projectedPoint[1] * -0.5 + 0.5) * canvas.height;

[more here](http://webglfundamentals.org/webgl/lessons/webgl-3d-perspective.html)

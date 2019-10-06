Title: matrix multiplication with vector in glsl
Description:
TOC: qna

# Question:

Ref http://webglfundamentals.org/webgl/lessons/webgl-3d-orthographic.html
In vector shader there is multiplication of `mat4` and `vec4`.

    attribute vec4 a_position;
    
    uniform mat4 u_matrix;
    
    void main() {
    
      // Multiply the position by the matrix.
      
      gl_Position = u_matrix * a_position;
    
    }

How is it possible to multiply 4*4 matrix with 1*4 matrix?
Shouldn't it be `gl_Position = a_position * u_matrix;`

Can anybody explain this?

# Answer

[From the GLSL spec 1.017](http://www.khronos.org/registry/gles/specs/2.0/GLSL_ES_Specification_1.0.17.pdf)

5.11 Vector and Matrix Operations
=================================

With a few exceptions, operations are component-wise. When an operator operates on a vector or matrix, it is operating independently on each component of the vector or matrix, in a component-wise fashion.
 
...matrix multiplied by vector, vector multiplied by matrix, and matrix multiplied by matrix. These do not operate component-wise, but rather perform the correct linear algebraic multiply. They require the size of the operands match.

    vec3 v, u;
    mat3 m;

    u = v * m;

is equivalent to

    u.x = dot(v, m[0]); // m[0] is the left column of m
    u.y = dot(v, m[1]); // dot(a,b) is the inner (dot) product of a and b
    u.z = dot(v, m[2]);

And

    u = m * v;

is equivalent to

    u.x = m[0].x * v.x + m[1].x * v.y + m[2].x * v.z;
    u.y = m[0].y * v.x + m[1].y * v.y + m[2].y * v.z;
    u.z = m[0].z * v.x + m[1].z * v.y + m[2].z * v.z;



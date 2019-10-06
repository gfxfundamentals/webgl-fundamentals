Title: Why is that this simple translation matrix doesn't work
Description:
TOC: qna

# Question:

First, here is the working version for the translation: https://jsfiddle.net/zhenghaohe/5yc8exo3/4/

(the code is taken and modified from https://webgl2fundamentals.org/webgl/lessons/webgl-2d-matrices.html)

In the working version of the code, the translation matrix is 

    [
        1, 0, 0,
        0, 1, 0,    
        tx, ty, 1,
    ] 

which is the transpose of the translation matrix taught from my graphics class. In my class the translation matrix is represented as 

     [
            1, 0, tx,
            0, 1, ty,    
            0, 0, 1,
        ] 
I was trying to figure out where the discrepancy came from. So I decided to change the vertex shader of the working version from sending the translation matrix from the js file like this

    uniform mat3 u_matrix;
    void main() {
      // Multiply the position by the matrix.
      vec2 position = (u_matrix * vec3(a_position, 1)).xy;
    } 

to constructing the translation matrix directly in the vertex shader

    uniform float tx;
    uniform float ty;
    void main() {
     mat3 u_matrix = mat3( 1, 0, tx,
                0, 1, ty,
                0, 0, 1,);
     vec2 position = (u_matrix * vec3(a_position, 1)).xy; 
    ...}


 
Here is the modified version https://jsfiddle.net/zhenghaohe/5yc8exo3/


However there appears to be a bug, 

    Unchecked runtime.lastError: Could not establish connection. Receiving end does not exist.
    webgl-utils.js:67 *** Error compiling shader '[object WebGLShader]':ERROR: 0:18: ')' : syntax error 


Can anyone please point me where the modified version of code is wrong and why the discrepancy of the translation matrix exists? 

# Answer

You have 2 issues

#1. you have a typo.

As @Rabbid76 pointed out

this

```
 mat3 u_matrix = mat3( 1, 0, tx,
            0, 1, ty,
            0, 0, 1,);   // <=== remove the ending comma

```

#2. GL matrices have their columns specified as rows

So either change it to this

```
 mat3 u_matrix = mat3(
     1,  0,  0,
     0,  1,  0,
    tx, ty,  1);

```

or this if it's less confusing

```
 vec3 col0 = vec3(1, 0, 0);
 vec3 col1 = vec3(0, 1, 0);
 vec3 col2 = vec3(tx, ty, 1);

 mat3 u_matrix = mat3(col0, col1, col2);
```

see https://webgl2fundamentals.org/webgl/lessons/webgl-matrix-vs-math.html

Title: Set uniforms using uniform[1234][uif] in a WebGL program: is the vector version [v] better in any regard?
Description:
TOC: qna

# Question:

Is there any significant advantage/disadvantage with setting a WebGL program's uniforms using the `uniform[1234][uif][v]` with an array like type instead of just using `uniform[1234][uif]` + spreading the arguments eg. :

<!-- language: lang-js -->

    gl.uniform3f (location, v0, v1, v2);   // GLSL type: vec3
    // vs
    gl.uniform3fv(location, [v0, v1, v2]); // GLSL type: vec3 (or vec3[] array)

Obviously setting aside the fact that one version of the method handles arrays.

I am looking for considerations in term of performance, readability and overall best practices.

Thanks!

# Answer

I think you should just do whatever you want. I mean it's really hard to suggest which is better as it depends too much on your personal coding preferences.

Let's say you make a vector like this

     const v = {x: 1, y: 2, z: 3}

Now when it comes time to use it with `gl.uniform` you could do either of these

     gl.uniform3f(loc, v.x, v.y, v.z);
     gl.uniform3fv(loc, [v.x, v.y, v.z]);

In that case the first is better because the second is creating a new array every time that line is executed.

On the other hand if you create a vector like this

     const v = [1, 2, 3];

Then

     gl.uniform3f(loc, v[0], v[1], v[2]);
     gl.uniform3fv(loc, v);

Clearly the second is better.

With ES5 you have one more option which is

     gl.uniform3f(loc, ...v);

I don't know if that's faster or slower than `gl.uinform3fv(loc, v)`. I suspect it's slower today but might be the same speed in the future. Since you have `gl.uinform3fv` there's really no reason to use that style. It can be useful for other functions though that don't have a format that takes an array. Examples

     const color = [1, 0, 0, 1];

     gl.clearColor(...color);




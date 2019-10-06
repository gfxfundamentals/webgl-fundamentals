Title: Passing large array into uniform in WebGL
Description:
TOC: qna

# Question:

Wondering if it's possible to pass a large array into a WebGL shader, like this:

    // array here
    uniform vec4[huge] mydynamicarray;
     
    void main() {
      // iterate through the array here to perform processing on it,
      // then write value to gl_Position
      gl_Position = ...;
    }

Then it would be populated like this:

    gl.uniform4fv(myarrayloc, myarray)

I have seen many [examples](https://webglfundamentals.org/webgl/lessons/webgl-shaders-and-glsl.html) of how to pass in values like this, such as:

    gl.uniform4fv(offsetLoc, [1, 0, 0, 0])

But I have not seen if it's possible to pass in a very large, dynamically sized array.

The reason to do this would be you could process 2 arrays:

1. One that is the vector array running in parallel in WebGL.
2. One that is the uniform array that you can iterate through for each vector.

# Answer

[Most WebGL implementations have a limit of 1024 or less uniform vectors](https://webglstats.com/webgl/parameter/MAX_FRAGMENT_UNIFORM_VECTORS)

In other words `huge` can't be greater than 1024 vec4s or whatever the limit of your particular GPU is. Also note that based on uniform packing rules specified in the spec that also means the largest float uniform array is also 1024 or whatever the limit of your particular GPU is.

You can declare arrays

    uniform vec4 foo[3];

And set their values with

    gl.uniform4fv(fooLoc, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

**Textures are how you pass in large amounts of random access data into WebGL**. [This answer might be relevant](https://stackoverflow.com/a/50013625/128511).

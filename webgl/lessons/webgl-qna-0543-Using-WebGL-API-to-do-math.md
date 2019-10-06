Title: Using WebGL API to do math
Description:
TOC: qna

# Question:

The title says it all but my question is that is this possible to use the WebGL API in the browser (e.g. Google Chrome) to do some math problems? 

Let's assume I want to multiply two numbers using WebGL API, is this generally possible and if yes, how can I do that?

*Excuse me for not sharing any codes since I didn't come up with any answers.*

# Answer

Just multiplying 2 numbers would not be something you'd want to do in WebGL. It would take 50-70 setup calls just to multiply 2 numbers.

If you want to multiply 2 million numbers by 2 million other numbers then that is something more suited to WebGL. There's plenty of examples of using a GPU to do math. First off that's all a GPU does is math. It just happens to be that the most common math people ask it to do is render 3D or 2D graphics. 

The term you need to search for is [**GPGPU**](https://www.google.com/webhp?ie=UTF-8#q=webgl%20gpgpu).

There's a certain art in figuring out how to adjust your solution to fit [how GPUs work](http://webglfundamentals.org/webgl/lessons/webgl-how-it-works.html). 

The basic point that WebGL reads data from textures and writes data to textures. What are textures? They're really just 2d arrays of values. So you put your data into those 2D arrays (textures), you use WebGL to read data from those 2D arrays (textures) and write data to other 2D arrays (textures). 

The biggest differences from normal computing are

1.  at least in WebGL 1 reading data from a texture is addressed by a value 0.0 to 1.0 in each direction. To get a specific value out of a 2d array (texture) you have to compute its normalized coordinate value (texture coordinate). 

    Assuming `xy` is an `ivec2` representing 2 integer indices into a 2d array we can compute the normalized coordinate needed to get the value out of the 2d array (texture) with

        vec2 uv = (vec2(xy) + 0.5) / textureDimensions;
        vec4 value = texture2D(2dArrayOfValuesTexture, uv);

    In WebGL 2 we don't have to do that. We can just do

        vec4 value = textureFetch(2dArrayOfValuesTexture, xy, 0);

2. You don't have random access for writing

    In general WebGL writes to the destination 2d array (texture) in order which may hinder what you can do. Sometimes there are [creative](https://stackoverflow.com/questions/37504034/fragment-shader-determine-min-max-values-for-the-entire-monochrome-image-and/37504662#37504662), [workarounds](https://stackoverflow.com/questions/37527102/how-do-you-compute-a-histogram-in-webgl/37527103#37527103).

3. You can't access previous results immediately. 

    In general if you're calculating 10000 answers, at anytime during that you can reference previous answers. In other words when you're computing answer 3766 you can reference answers 0 to 3765. 

    In WebGL though you can not access any of the previous answers until you've computed all of them. Of course once you've computed all of them you can pass those answers back into to another calculation. It's basically during one giant "batch calculation" the answers can't reference each other.

As Kirill pointed out there are also some limits. WebGL 1.0 has floating point textures so it's easy to get data in. Getting data out requires a little more work of encoding the answers into 8bit 4 channel textures, reading the results and then decoding them back into answers but there's plenty of people doing that. WebGL 2 will remove the need to do that encode/decode step.

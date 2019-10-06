Title: webGL2 fragment shader receives bad values
Description:
TOC: qna

# Question:

I'm trying to render a 3D texture but I have a problem with the fragment shader. I should receive texture values mapped between 0 and 1 but I just receive 0 and other things. By other things I mean that the next code (fragment shader) only prints red and grey colors in my shape:

**EDIT**

    #version 300 es

    precision highp float;
    precision highp int;
    precision highp sampler3D;

    uniform sampler3D in_texture;

    in vec3 v_texcoord;

    out vec4 color;

    void main()
    {


        vec4 textureColor = texture(in_texture, v_texcoord);

        //color = vec4(textureColor.r, 0.0, 0.0, 0.5);
        
        if(textureColor.r == 0.0){
            color = vec4(1.0,0.0,0.0,1.0);
        }
        if(textureColor.r != 0.0){
            color = vec4(0.5,0.5,0.5,1.0);
        }
        if( textureColor.r > 0.0){
            color = vec4(0.0,1.0,0.0,1.0);
        }
        if(textureColor.r < 0.0){
            color = vec4(0.0,0.0,1.0,1.0);
        }
    }

I check the values of the texture before create the texture (there should be more colors because numbers go from -32k to 32k) and I create the texture with the following parameters:

        var textureData = new Int16Array();

        //fill textureData

        var texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_3D, texture);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

        gl.texImage3D(
            gl.TEXTURE_3D,  // target
            0,              // level
            gl.R16I,        // internalformat
            texW,           // width
            texH,           // height
            texD,           // depth
            0,              // border
            gl.RED_INTEGER, // format
            gl.SHORT,       // type
            textureData     // pixeldata
        );


Any suggestions will be greatly appreciated!

**EDIT**

I'm not getting any error as you can see in the image.

[image][1]


  [1]: https://i.stack.imgur.com/SFhSz.png

# Answer

your example makes no sense. You're probably getting an error `INVALID_OPERATION` when you draw and probably not even noticing it

This line from your shader

    uniform sampler3D in_texture;

Is **INCOMPATIBLE** with an `R16I` texture.

From the WebGL2 spec

> ## 5.23 A sampler type must match the internal texture format
>
> Texture lookup functions return values as floating point, unsigned integer or signed integer, depending on the sampler type passed to the lookup function. If the wrong sampler type is used for texture access, i.e., the sampler type does not match the texture internal format, the returned values are undefined in OpenGL ES Shading Language 3.00.6 (OpenGL ES Shading Language 3.00.6 §8.8). In WebGL, generates an INVALID_OPERATION error in the corresponding draw call, including drawArrays, drawElements, drawArraysInstanced, drawElementsInstanced , and drawRangeElements.

If you want to use an `R16I` texture then that line above must be changed to use an `isampler3D`

    // uniform sampler3D in_texture;   BAD!!!
    uniform isampler3D in_texture;     GOOD!!

After that this line will fail

    vec4 textureColor = texture(in_texture, v_texcoord);

Because `in_texture` now only returns integers or in this case an `ivec4`.

At this point it's not clear what you want to happen. If you want normalized values as in you want your integer values that go from -32768 to +32787 (which is what `R16I` is) then you'll have to decide how you want to do the conversion. A simple conversion would be something like

    const int INT16_MIN = -32768;
    const int INT16_MAX =  32767; 
    const int INT16_RANGE = INT16_MAX - INT16_MIN;

    ivec4 intValues = texture(in_texture, v_texcoord);
    vec4 textureColors = (float(intValues - INT16_MIN) / float(INT16_RANGE)) * 2. - 1.;

If you want 0 integer to equal 0 float then it's more complicated


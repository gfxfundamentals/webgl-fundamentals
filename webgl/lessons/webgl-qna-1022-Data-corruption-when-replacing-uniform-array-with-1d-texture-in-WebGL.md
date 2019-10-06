Title: Data corruption when replacing uniform array with 1d texture in WebGL
Description:
TOC: qna

# Question:

I am doing some GPGPU processing on a large 4D input array in WebGL2. Initially, I just flattened the input array and passed it in as a uniform array of ints, with a custom accessor function in GLSL to translate 4D coordinates into an array index, as follows:

    const int SIZE = 5; // The largest dimension that works; if I can switch to textures, this will be passed in as a uniform value.
    const int SIZE2 = SIZE*SIZE;
    const int SIZE3 = SIZE*SIZE2;
    const int SIZE4 = SIZE*SIZE3;
    uniform int u_map[SIZE4];
    
    int get_cell(vec4 m){
      ivec4 i = ivec4(mod(m,float(SIZE)));
      return u_map[i.x*SIZE3+i.y*SIZE2+i.z*SIZE+i.w];
    }

On the JavaScript side, the flattened data is passed in as follows:

    const map_loc = gl.getUniformLocation(program, "u_map");
    gl.uniform1iv(map_loc, data);

Where `data` is an `Int32Array` (because that's what's required to map onto GLSL ints) containing 8-bit values.

That works, but it severely limits that size of inputs that I can work with. Going up to a dimension size of 6 results in using 1296 uniform slots, when only 1024 are available for this data and other control inputs.

So, I want to switch over to using a texture to hold larger quantities of data. So, I've updated the JS code to this:

    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, data.length, 1, 0, gl.RED, gl.UNSIGNED_BYTE, data);

where `data` has been repackaged as a `Uint8Array`, which should be used to provide single-channel `r` values in a texture sampler object in GLSL. The GLSL code is updated as follows:

    uniform sampler2D u_map;

    int get_cell(vec4 m){
      ivec4 i = ivec4(mod(m,float(SIZE)));
      float r = texelFetch(u_map, ivec2(i.x*SIZE3+i.y*SIZE2+i.z*SIZE+i.w, 0), 0).r;
      return int(r);
    }

which should grab the single valid channel value out of the underlying buffer, just as when we were using an array.

However, after doing this substitution, I just get junk. The values returned from `get_cell` appear to all be either 1 or 0--and none of them even reliably correspond to the presence of actual 1 or 0 values in the original data buffer.

What am I doing wrong?

# Answer

You used the `R8` format which is a normalized floating point format with values from to 0.0 to 1.1.  If you want an `int` format then consider using `R32I`  texture internalformat, supply your texture data as format `gl.RED_INTEGER`, type `gl.INT` and use a `Int32Array`, change your sampler to an `isampler2D` and use `int r = textureFetch(....).r` to read the data.

If you want an integer result you'll also need to make an integer texture for results and attach that to a framebuffer to render integer results.

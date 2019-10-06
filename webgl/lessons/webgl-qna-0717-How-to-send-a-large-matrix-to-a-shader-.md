Title: How to send a large matrix to a shader?
Description:
TOC: qna

# Question:

I would like to send a matrix bigger than 4*4(mat4) in a vertex shader. I was thinking to put the matrix in a texture and send the texture to the shader instead.

The problem is that I don't know how exactly to do that. 
Can you help me with a basic example on how to set a matrix in a texture and how to get the elements from the texture in the shader?

Here are some parts of my code: 
Having 2 matrices : m1 and m2:

    r1 = m1.rows,
    r2 = m2.rows,
    c1 = m1.cols,
    c2 = m2.cols,
    d1 = m1.data,
    d2 = m2.data;

Data to be put in the texture :

    count = Math.max(r1, r2) * Math.max(c1, c2);
    var texels = new Float32Array(3 * count); // RGB
            /* same dimensions for both matrices */
            if (r1 == r2 && c1 == c2) {
                /* put m1 in red channel and m2 in green channel */
                var i = 0, index1 = 0, index2 = 0;
                do {
                    texels[i++] = d1[index1++];
                    texels[i++] = d2[index2++];
                    i++; // skip blue channel
                } while (--count);
            } else {
                var index, row = 0, col = 0;
                for (index = 0; index < r1 * c1; index++) {
                    texels[index * 3] = d1[index];
                }
        
                for (index = 0; index < r2 * c2; index++) {
                    texels[index * 3 + 1] = d2[index];
                }
         }

Making the texture :

    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, Math.max(m1.c, m2.c), Math.max(m1.r, m2.r), 0, gl.RGB, gl.FLOAT, texels);
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    
    var sampler = gl.getUniformLocation(program, "usampler");
    gl.uniform1i(sampler, 0);

Vertex shader : 

    #ifdef GL_ES 
        precision highp float; 
    #endif 
    attribute vec3 a_position;
    attribute vec2 a_texcoord;
    varying vec2   vTex;
    void main(void)
    {
    gl_Position = vec4(a_position, 1.0);
    vTex = a_texcoord;
    }

Fragment shader : 

    #ifdef GL_ES 
        precision highp float; 
    #endif 
     
       // passed in from the vertex shader. 
        varying vec2      vTex;         // row, column to calculate 
        uniform sampler2D usampler;     
        uniform int       uLength;      
        uniform float     uStepS;       // increment across source texture 
        uniform float     uStepT;       // increment down source texture 
        uniform float     uOutRows;     
        uniform float     uOutCols;     
          
        // sum row r x col c 
        float sumrowcol(float row, float col) { 
            float sum = 0.;             // sum 
            float ss = 0.;              // column on source texture 
            float tt = 0.;              // row on source texture 
            float r = row*uStepT;       // moving texture coordinate 
            float c = col*uStepS;       // moving texture coordinate 
            for (int pos=0; pos<2048; ++pos) { 
                if(pos >= uLength) break; // stop when we multiple a row by a column 
                float m1 = texture2D(usampler,vec2(r,ss)).r; 
                float m2 = texture2D(usampler,vec2(tt,c)).g; 
                sum += (m1*m2); 
                ss += uStepS; 
                tt += uStepT; 
            } 
            return sum; 
        } 
          
       float shift_right (float v, float amt) { 
           v = floor(v) + 0.5; 
           return floor(v / exp2(amt)); 
       }
          
       float shift_left (float v, float amt) { 
           return floor(v * exp2(amt) + 0.5); 
       }
          
       float mask_last (float v, float bits) {
           return mod(v, shift_left(1.0, bits)); 
       }
          
       float extract_bits (float num, float from, float to) { 
           from = floor(from + 0.5); to = floor(to + 0.5); 
           return mask_last(shift_right(num, from), to - from); 
       }
          
       vec4 encode_float (float val) { 
           if (val == 0.0) return vec4(0, 0, 0, 0); 
           float sign = val > 0.0 ? 0.0 : 1.0; 
           val = abs(val); 
           float exponent = floor(log2(val)); 
           float biased_exponent = exponent + 127.0; 
           float fraction = ((val / exp2(exponent)) - 1.0) * 8388608.0; 
           float t = biased_exponent / 2.0; 
           float last_bit_of_biased_exponent = fract(t) * 2.0; 
           float remaining_bits_of_biased_exponent = floor(t); 
           float byte4 = extract_bits(fraction, 0.0, 8.0) / 255.0; 
           float byte3 = extract_bits(fraction, 8.0, 16.0) / 255.0; 
           float byte2 = (last_bit_of_biased_exponent * 128.0 + extract_bits(fraction, 16.0, 23.0)) / 255.0; 
           float byte1 = (sign * 128.0 + remaining_bits_of_biased_exponent) / 255.0; 
           return vec4(byte1, byte2, byte3, byte4); 
        } 
        void main(void) { 
              
            // get the implied row and column from .s and .t of passed texel 
            float col = floor((vTex.s*uOutRows)); 
            float row = floor((vTex.t*uOutCols));    
     
            // sum row x col for the passed pixel 
            float v = sumrowcol(row,col); 
     
            gl_FragColor = encode_float(v); 
        }


# Answer

A texture is just a 2D array of data with 1 to 4 channels. For a matrix you probably want a floating point texture. Floating point texture support is optional but common

    ext = gl.getExtension("OES_texture_float");
    if (!ext) {
       // tell the user they can't run your app

So, you put your data in the texture

    const width = 5;
    const height = 5;
    const data = new Float32Array(width * height);
    data[0] = ???
    data[1] = ???

etc.

Now make a texture and upload it

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    const level = 0;
    gl.texImage2D(gl.TEXTURE_2D, level, gl.LUMINANCE, width, height 0,
                  gl.LUMINANCE, gl.FLOAT, data);
    // set the filtering so values don't get mixed
    gl.texParameteri(gl.TEXTURE2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

`LUMINANCE` is a single channel texture.

To read it you need to know the dimensions in the shader which in WebGL1 you have to pass in yourself

    uniform vec2 dataTextureSize;
    uniform sampler2D dataTexture;

Then you can get any element like this

    float row = ??
    float col = ??
    vec2 uv = (vec2(col, row) + .5) / dataTextureSize;
    float value = texture2D(dataTexture, uv).r;  // just the red channel

WebGL doesn't in general let you choose where to write though (that would require compute shaders which is a couple of versions off). So, you either need to structure your app so that you process each destination row and column in order OR there are a few tricks, like using `gl.POINT` and setting `gl_Position` to select a particular output pixel.

You can see [an example of that here](https://stackoverflow.com/questions/37527102/how-do-you-compute-a-histogram-in-webgl).

If you use [`WebGL2`](http://webgl2fundamentals.org) then you don't need to extension and you can use `texelFetch` to get specific values from the texture. 

    float value = texelFetch(dataTexture, ivec2(col, row));

and it might be more appropriate to use `gl.R32F` as your internal format

    const level = 0;
    gl.texImage2D(gl.TEXTURE_2D, level, gl.R32F, width, height 0,
                  gl.RED, gl.FLOAT, data);


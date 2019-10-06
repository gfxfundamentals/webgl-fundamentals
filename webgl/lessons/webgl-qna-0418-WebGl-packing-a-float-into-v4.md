Title: WebGl packing a float into v4
Description:
TOC: qna

# Question:

I have this code sample from threejs example [http://threejs.org/examples/#webgl_animation_cloth] where a float value is converted to vec4. I have seen this logic on few other forums but no explanation. 

1. Could someone explain what this logic is doing and the use of 256  ?.I understand the bitwise masking and shifting .

I have seen this link too https://stackoverflow.com/questions/9882716/packing-float-into-vec4-how-does-this-code-work

2. It says the vec4 will be stored in a 32 bit RGBA8 buffer finally.     
Since we are passing the depth value into a color buffer , how will opengl know what to do with this ? 

3. Also since vec4 has 4 components , each of 4 bytes making it 16 bytes which makes it 16 * 8 bits , how does this fit into 32 bit RGBA8 ? 

             vec4 pack_depth( const in float depth ) {
               const vec4 bit_shift = vec4( 256.0 * 256.0 * 256.0, 256.0 *   
               256.0,256.0,1.0);
               const vec4 bit_mask  = vec4( 0.0, 1.0 / 256.0, 1.0 / 256.0, 1.0 /  
               256.0);
               vec4 res = fract( depth * bit_shift );
               res -= res.xxyz * bit_mask;
               return res;
               }
            
            void main() {
                vec4 pixel = texture2D( texture, vUV );
                if ( pixel.a < 0.5 ) discard;
                gl_FragData[ 0 ] = pack_depth( gl_FragCoord.z );
            }
          
            
              
            
          



# Answer

Along with @WaclawJasper's answer this code is packing 'depth', a float value (32bits), into 4 8bit values. 

`gl_FragData[ 0 ]` presents an single pixel in a texture, in this case a texture with 8bits per channel (32bits total).  If I write 

    gl_FragData[0] = vec4(0.25, 0.5, 0.75, 1.0);

The texture being written to (assuming it's an 8bit texture) will actually get the values

    r = Math.floor(0.25 * 255) = 63;
    g = Math.floor(0.5  * 255) = 127;
    b = Math.floor(0.75 * 255) = 191;
    a = Math.floor(1.0  * 255) = 255;

The actual formula from the spec is effectively

    unsignedIntValue = floor(clamp(floatValue, 0., 1.) * (pow(2., numberOfBits) - 1.));

So even though `pack_depth` returns a vec4 which is floats and `gl_FragData` is defined as `vec4` it will eventually be converted when written to whatever WebGL is currently writing into (the canvas, a renderbuffer, a texture).  

If it was writing into a floating point texture `pack_depth` would be unnecessary. We can infer it's writing to a 8bit RGBA texture because of what `pack_depth` is doing.

Why is this need at all? Because in WebGL support for floating point textures is optional. So if the user's machine does not support floating point textures and you need floating point like data (like a depth buffer for shadow maps) then packing the data into 8bit textures is one solution.

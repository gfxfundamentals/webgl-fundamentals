Title: How do Shadertoy's audio shaders work?
Description:
TOC: qna

# Question:

To start off, I couldn't really find any appropriate community to post this question in so I picked this one. I was wondering how the audio shaders of the popular webGL based shader tool worked, because when, even though I had obviously heard of 'normal' GLSL shaders, I first heard of shaders for procedurally generating audio, I was amazed. Any clues?

# Answer

They are basically a function that given `time` returns 2 values for an audio single (left and right channel). The values go from -1 to 1.

paste in this shader and maybe you'll get it

    vec2 mainSound( float time )
    {
        return vec2( sin(time * 1000.0), sin(time * 1000.0) );
    }

You can see a more live example of [a similar style of making sounds here](http://games.greggman.com/game/html5-bytebeat/). 

You can imagine it like this

    function generateAudioSignal(time) {
       return Math.sin(time * 4000); // generate a 4khz sign wave.
    }

    var audioData = new Float32Array(44100 * 4); // 4 seconds of audio at 44.1khz
    for (var sample = 0; sample < audioData.length; ++sample) {
      var time = sample / 44100;
      audioData[sample] = generateAudioSignal(time);
    }

Now pass audioData to the Web Audio API

For stereo it might be 

    function generateStereoAudioSignal(time) {
       return [Math.sin(time * 4000), Math.sin(time * 4000)]; // generate a 4khz stereo sign wave.
    }

    var audioData = new Float32Array(44100 * 4 * 2); // 4 seconds of stereo audio at 44.1khz
    for (var sample = 0; sample < audioData.length; sample += 2) {
      var time = sample / 44100 / 2;
      var stereoData = generateAudioSignal(time);
      audioData[sample + 0] = stereoData[0];
      audioData[sample + 1] = stereoData[1];
    }

There's really no good reason for them to be in WebGL (assuming they are). In WebGL you'd use them to generate data into a texture attached to a framebuffer. Then the data they generate would have to be copied back from the GPU into main memory using `gl.readPixels` and then passed into the Web Audio API which would be slow and, at least in WebGL it would block processing as there's no way to asynchronously read data back in WebGL. On top of that you can't easily read back float data in WebGL. Of course if shadertoy really is using WebGL then it could re-write the audio shader to encode the data into 8bit RGBA textures and then convert it back to floats in JavaScript. Even more reason NOT to use WebGL for this. The main reason to use WebGL is it just makes it symmetrical. All *shaders* using the same language. 

The bytebeat example linked above is fully run in JavaScript. It defaults to *bytebeat* meaning the value the function is expected to return is 0 to 255 unsigned int but there's a setting for *floatbeat* in which case it expects a value from -1 to 1 just like shadertoy's shaders.

---

##Update

So I checked Shadertoy and it is using WebGL shaders and it is encoding the values into 8bit textures

Here's an actual shader (I used the [chrome shader editor](https://chrome.google.com/webstore/detail/shader-editor/ggeaidddejpbakgafapihjbgdlbbbpob?hl=en) to easily look at the shader).

    precision highp float;

    uniform float     iChannelTime[4];
    uniform float     iBlockOffset; 
    uniform vec4      iDate;
    uniform float     iSampleRate;
    uniform vec3      iChannelResolution[4];
    uniform sampler2D iChannel0;
    uniform sampler2D iChannel1;
    uniform sampler2D iChannel2;
    uniform sampler2D iChannel3;

    vec2 mainSound( float time )
    {
        return vec2( sin(time * 1000.0), sin(time * 1000.0) );
    }

    void main() {
       // compute time `t` based on the pixel we're about to write
       // the 512.0 means the texture is 512 pixels across so it's
       // using a 2 dimensional texture, 512 samples per row
       float t = iBlockOffset + ((gl_FragCoord.x-0.5) + (gl_FragCoord.y-0.5)*512.0)/iSampleRate;

       // Get the 2 values for left and right channels
       vec2 y = mainSound( t );

       // convert them from -1 to 1 to 0 to 65536
       vec2 v  = floor((0.5+0.5*y)*65536.0);

       // separate them into low and high bytes
       vec2 vl = mod(v,256.0)/255.0;
       vec2 vh = floor(v/256.0)/255.0;

       // write them out where 
       // RED   = channel 0 low byte
       // GREEN = channel 0 high byte
       // BLUE  = channel 1 low byte
       // ALPHA = channel 2 high byte
       gl_FragColor = vec4(vl.x,vh.x,vl.y,vh.y);
    }

This points out one advantage to using WebGL in this particular case is that you get all the same inputs to the audio shader as the fragment shaders (since it is a fragment shader). That means for example the audio shader could reference up to 4 textures

In JavaScript then you'd read the texture with `gl.readPixels` then convert the sample back into floats with something like

       var pixels = new Uint8Array(width * height * 4);
       gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
       for (var sample = 0; sample < numSamples; ++sample) {
         var offset = sample * 4;  // RGBA
         audioData[sample * 2    ] = backToFloat(pixels[offset + 0], pixels[offset + 1]);
         audioData[sample * 2 + 1] = backToFloat(pixels[offset + 2], pixels[offset + 3]);
       }

       float backToFloat(low, high) {
         // convert back to 0 to 65536
         var value = low + high * 256;

         // convert from 0 to 65536 to -1 to 1
         return value / 32768 - 1;
       } 

Also, while I said above I didn't think it was a good idea I assumed that shadertoy was constantly calling the audio shader and therefore the issue I brought up about blocking processing would be true but, ... apparently shadertoy just pre-generates N seconds of audio using the shader when you press play where N is apparently 60 seconds. So, there's no blocking but then again the sound only lasts 60 seconds.

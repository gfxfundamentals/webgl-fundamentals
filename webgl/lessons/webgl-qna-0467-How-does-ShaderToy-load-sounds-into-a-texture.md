Title: How does ShaderToy load sounds into a texture
Description:
TOC: qna

# Question:

I've been trying to do the same things shadertoy does for passing audio frequency/waveform into the shader with three.js.

https://www.shadertoy.com/view/Xds3Rr

In this example it seems that IQ is putting frequency/waveform audio data into an image and then sampling that as a texture in the shader. How would I create that audio texture in Javascript?

To be clear I don't need help loading the texture uniform into the shader. I just don't know how to create the audio texture from an audio file.


    var texture = new THREE.Texture();

    shader.uniforms = {
         iChannel0:  { type: 't', value: texture }
    };
I'm guessing I'll need to somehow put audio data into the texture I just don't know how to do that.


# Answer

You can get audio data from the Web Audio API be creating an analyser node

    const audioContext = new window.AudioContext();
    const analyser = audioContext.createAnalyser();

Then create a buffer to receive teh data

    const numSamples = analyser.frequencyBinCount;
    const audioData = new Uint8Array(numSamples);

Then in your render loop get the data and put it in a texture

    analyser.getByteFrequencyData(audioData);
    ...
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, numSamples, 1, 0,
                  gl.LUMINANCE, gl.UNSIGNED_BYTE, audioData);

or in three.js use a `DataTexture`

That's the short version. The longer version is audio needs to be on the same domain or you'll run into CORS issues. To get data for an audio stream like an `<audio>` tag's you'd call

    const source = audioContext.createMediaElementSource(audio);

That doesn't work in mobile Chrome nor mobile Safari at the moment and there are bugs in Safari.

[Here's a working sample](http://twgljs.org/examples/dynamic-buffers.html)

    



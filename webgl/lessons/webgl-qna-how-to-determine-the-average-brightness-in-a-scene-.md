Title: How to determine the average brightness in a scene?
Description: How to determine the average brightness in a scene?
TOC: How to determine the average brightness in a scene?

## Question:

I am currently doing straightforward direct-to-screen (no multiple passes or postprocessing) rendering in WebGL. I would like to determine the average brightness/luminance of the entire rendered image (i.e. a single number), in a way which is efficient enough to do every frame.

What I'm looking to accomplish is to implement “exposure” adjustment (as a video camera or the human eye would) in the scene, so as to view both indoor and outdoor scenes with realistic lighting and no transitions — the brightness of the current frame will be negative feedback to the brightness of the next frame.

I am currently calculating a very rough approximation on the CPU side by sending a few rays through my scene data to find the brightness at those points; this works, but has too few samples to be stable (brightness varies noticeably with view angle as the rays cross light sources). I would prefer to offload the work to the GPU if at all possible, as my application is typically CPU-bound.


## Answer:

I know this question is 8 years old but hey....

First off, WebGL1, generateMipmap only works for power of 2 images.

I'd suggest either (1) generating a simple shaders like this

```
function createShader(texWidth, texHeight) {
  return `
  precision mediump float;
  uniform sampler2D tex;

  void main() {
    vec2 size = vec2(${texWidth}, ${texHeight});
    float totalBrightness = 0.0;
    float minBrightness = 1.0;
    float maxBrightness = 0.0;
    for (int y = 0; y < ${texHeight}; ++y) {
      for (int x = 0; x < ${texWidth}; ++x) {
        vec4 color = texture2D(tex, (vec2(x, y) + 0.5) / size);
        vec3 adjusted = color.rgb * vec3(0.2126, 0.7152, 0.0722);
        float brightness = adjusted.r + adjusted.g + adjusted.b;
        totalBrightness += brightness;
        minBrightness = min(brightness, minBrightness);
        maxBrightness = max(brightness, maxBrightness);
      }
    }
    float averageBrightness = totalBrightness / (size.x * size.y);
    gl_FragColor = vec4(averageBrightness, minBrightness, maxBrightness, 0);
  }
  `;
}

```


{{{example url="../webgl-qna-how-to-determine-the-average-brightness-in-a-scene--example-1.html"}}}

the only problem with this solution is that it can't be parallelized by the GPU AFAIK so (2) I might test doing something similar to generating mipmaps where I say make a shader that does 16x16 pixels and target it to generate a smaller texture and repeat until I get to 1x1. I'd have to test to see if that's actually faster and what size cell 2x2, 4x4, 16x16 etc is best.

Finally, if possible, like the example above, if I don't actually need the result on the CPU then just pass that 1x1 texture as input to some other shader. The example just draws 3 points but of course you could feed those values into the shader that's drawing the video to do some image processing like crank up the exposure if the brightness is low try to auto level the image based on the min and max brightness etc...

Note that in WebGL2 you wouldn't have to generate a different shader per size as WebGL2, or rather GLSL ES 3.0 you can have loops that are not based on constant values.


{{{example url="../webgl-qna-how-to-determine-the-average-brightness-in-a-scene--example-2.html"}}}



<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 3.0 by
    <a data-href="https://switchb.org/kpreid/">Kevin Reid</a>
    from
    <a data-href="https://stackoverflow.com/questions/10163434">here</a>
  </div>
</div>

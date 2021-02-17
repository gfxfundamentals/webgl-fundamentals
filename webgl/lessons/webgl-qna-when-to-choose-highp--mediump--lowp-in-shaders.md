Title: When to choose highp, mediump, lowp in shaders
Description: When to choose highp, mediump, lowp in shaders
TOC: When to choose highp, mediump, lowp in shaders

## Question:

What's the best practice for them? Is there any performance difference?

## Answer:

> What's the best practice for them?

For the most part these only matter on mobile. The spec says an implementation can always use a higher precision so on desktop both the vertex shader and fragment shader run in highp always. (I know of no desktop GPUs for which this is not true)

From the [spec](https://www.khronos.org/files/opengles_shading_language.pdf) section 4.5.2

> ##  4.5.2 Precision Qualifiers
>
> ...
>
> Precision qualifiers declare a minimum range and precision that the underlying implementation must use
> when storing these variables. Implementations may use greater range and precision than requested, but
> not less.

For Mobile and Tablets then there are several answers. There is no best. It's up to you

1. use the lowest precision you can that still does what you need it to do.

2. use highp and ignore the perf issues and the old phones where it doesn't work

3. use mediump and ignore the bugs (See below)

4. check if the user's device supports highp, if not use different shaders with less features.

WebGL defaults to vertex shaders use highp and fragment shaders don't have a default an you have to specify one. Further, highp in the fragment shader is an optional feature and some mobile GPUs don't support it. I don't know what percent that is in 2019. AFAIK most or maybe even all phones shipping in 2019 support highp but older phones (2011, 2012, 2013) don't.]

From the spec:

> The vertex language requires any uses of `lowp`, `mediump` and `highp` to compile and link without error.
> The fragment language requires any uses of `lowp` and `mediump` to compile without error. **Support for
> `highp` is optional**.

Examples of places you generally need highp. Phong shaded point lights usually need highp. So for example you might use only directional lights on a system that doesn't support highp OR you might use only directional lights on mobile for performance.

> Is there any performance difference?

Yes but as it says above an implemenation is free to use a higher precision. So if you use mediump on a desktop GPU you won't see any perf difference since it's really using highp always. On mobile you will see a perf diff, at least in 2019. You may also see where your shaders really needed highp.

Here is a phong shader set to use mediump. On desktop since mediump is actually highp it works

![](https://user-images.githubusercontent.com/234804/43352753-6ed6b9f8-9263-11e8-9716-3819a8c92095.png)

On Mobile where mediump is actually mediump it breaks

![](https://user-images.githubusercontent.com/234804/43352759-7f9d1656-9263-11e8-8487-aa57d6092ff1.png)

An example where mediump would be fine, at least in the fragment shader, is most 2D games.

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/1435682">WayneNWayne</a>
    from
    <a data-href="https://stackoverflow.com/questions/59100554">here</a>
  </div>
</div>

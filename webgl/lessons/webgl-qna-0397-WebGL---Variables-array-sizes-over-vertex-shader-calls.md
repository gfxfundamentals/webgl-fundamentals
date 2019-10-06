Title: WebGL - Variables array sizes over vertex shader calls
Description:
TOC: qna

# Question:

**Context**

I'm trying to draw Bezier curves in a canvas.
I achieved to draw quadratic and cubic curves from within the shader, but I did have a uniform variable for each and every control point so far.

So, I click on my canvas, add points and when I have enough (respectively 3 and 4), I draw my curve.

Now I'm trying to generalize Bezier curves. Though I achieved to accomplish this on the JavaScript side, I feel like it would be better to do this from the shader side, as the speed of the rendering would be greatly increased.

So, I would like to draw my curve as soon as I have at least two points. But I could keep adding points and draw my curve using every point, in order as control points.

**Explanation**

So I know it's not possible to set a dynamic array in GLSL, but is it possibliy to dynamically declare a GLSL array based on a JS variable ?

If my question is unclear (I know I have troubles formulating things right straight away), let me explain with an example.

    uniform vec2 uMyPoints[<length>];

So this is what I would like to achieve, but of course, the array size must be a constant, according to glsl specifications.

However, from my point of view, I feel like I should be able to set up `length` from a JS variable. My intuition is that the array size in GLSL would be constant  for the duration of the execution of the different shaders during the render, but could change from one rendering to another.

**Question**

So my question to you is : Based on these, do you know any good way or tricks to be able set a constant in GLSL from a javascript variable ?

If it appears to be possible, this would help me greatly. Thanks for your consideration.

As a matter of comparison : How could we set "[numLights" in this example][1] from JS ?

**Answer**

String substitution suits my needs nicely. Though it's a bit tricky, it will do just fine. Further research led me to know that implicit array size is available Open GL ES version 3, which should be used by future versions of WebGL, but not right now.

In the other hand, the second suggestion does not suits my needs as I precisely wanted to avoid having N points in the shader, as that quantity of points may change.

Thanks for the answer ;)


  [1]: https://stackoverflow.com/questions/8202173/setting-the-values-of-a-struct-array-from-js-to-glsl

# Answer

String substitution works

    <script id="vs" type="notjs">    
    uniform vec2 uMyPoints[<length>];
    ...
    </script>

js

    var numPoints = 10;
    var vSrc = document.getElementById("vs").text;
    vSrc = vSrc.replace(/<length>/g, numPoints);

This is what most complex programs do for shaders. They generate the shaders with string manipulation.

Of course you might want to use a nicer function to do the string substitution. For example maybe something like

      /**
       * Replace %(id)s in strings with values in objects(s)
       *
       * Given a string like `"Hello %(name)s from $(user.country)s"`
       * and an object like `{name:"Joe",user:{country:"USA"}}` would
       * return `"Hello Joe from USA"`.
       *
       * @function
       * @param {string} str string to do replacements in
       * @param {Object|Object[]} params one or more objects.
       * @returns {string} string with replaced parts
       * @memberOf module:Strings
       */
      var replaceParams = (function() {
        var replaceParamsRE = /%\(([^\)]+)\)s/g;
    
        return function(str, params) {
          if (!params.length) {
            params = [params];
          }
    
          return str.replace(replaceParamsRE, function(match, key) {
            var keys = key.split('.');
            for (var ii = 0; ii < params.length; ++ii) {
              var obj = params[ii];
              for (var jj = 0; jj < keys.length; ++jj) {
                var part = keys[jj];
                obj = obj[part];
                if (obj === undefined) {
                  break;
                }
              }
              if (obj !== undefined) {
                return obj;
              }
            }
            console.error("unknown key: " + key);
            return "%(" + key + ")s";
          });
        };
      }());

now if you're shader looks like this

    uniform Lights u_lights[%(numLights)s];
    uniform vec2 u_points[%(numPoints)s];

you can substitute with

    vSrc = replaceParams(vsrc, {
       numLights: 4,
       numPoints: 10,
    });

You can also of course use `#define in the shader

    #define NUM_LIGHTS %(numLights)s
    #define NUM_POINTS %(numPoints)s

    uniform Lights u_lights[NUM_LIGHTS];
    uniform vec2 u_points[NUM_POINTS];

    void main() {
      for (int i = 0; i < NUM_LIGHTS; ++i) {
        ...
      }
    }

etc..


But, honestly most people wouldn't pass bezier control points as uniforms because there is a severe restriction on the number of uniforms. Most people would pass bezier control points in attributes. You can probably even set the stride and offset when calling `gl.vertexAttribPointer` so that if your points go

     [pt0, pt1, pt2, pt3, pt4, pt5, pt6, pt7, pt8, ..]

You can make 4 attributes

    attribute vec2 p0;
    attribute vec2 p1;
    attribute vec2 p2;
    attribute vec2 p3;

And point all of them with an offset and stride to set your 4 attributes so the points get pulled out

    p0 = pt0, p1 = pt1, p2 = pt2, p3 = pt3,
    p0 = pt1, p1 = pt2, p2 = pt3, p3 = pt4,
    p0 = pt2, p1 = pt3, p2 = pt4, p3 = pt5,
    p0 = pt3, p1 = pt4, p2 = pt5, p3 = pt6,

etc.. 



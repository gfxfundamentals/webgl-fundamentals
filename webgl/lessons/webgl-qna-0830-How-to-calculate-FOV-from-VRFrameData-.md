Title: How to calculate FOV from VRFrameData?
Description:
TOC: qna

# Question:

There used to be field of view information in the [`VREyeParameters`][1], but that was deprecated. So now i am wondering: Is possible to calculate that using the view/projection matrices provided by [`VRFrameData`][2]?


  [1]: https://developer.mozilla.org/en-US/docs/Web/API/VREyeParameters
  [2]: https://developer.mozilla.org/en-US/docs/Web/API/VRFrameData

# Answer

[SOHCAHTOA](http://www.mathwords.com/s/sohcahtoa.htm) pronounced "So", "cah", "toe-ah"

* SOH -> Sine(angle) = Opposite over Hypotenuse
* CAH -> Cosine(angle) = Adjacent over Hypotenuse
* TOA -> Tangent(angle) = Opposite over Adjacent

[![enter image description here][1]][1]

Tells us the relationships of the various sides of a *right* triangle to various trigonometry functions



So looking at a frustum image we can take the right triangle from the eye to the near plane to the top of the frustum to compute the tangent of the field of view and we can use the arc tangent to turn a tangent back into an angle.

[![enter image description here][2]][2]

Since we know the result of the projection matrix takes our world space frustum and converts it to clip space and ultimately to normalized device space (-1, -1, -1) to (+1, +1, +1) we can get the positions we need by multiplying the corresponding points in NDC space by the inverse of the projection matrix

    eye = 0,0,0
    centerAtNearPlane = inverseProjectionMatrix * (0,0,-1)
    topCenterAtNearPlane = inverseProjectionMatrix * (0, 1, -1)

Then

    opposite = topCenterAtNearPlane.y
    adjacent = -centerAtNearPlane.z
    halfFieldOfView = Math.atan2(opposite, adjacent)
    fieldOfView = halfFieldOfView * 2

Let's test

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const m4 = twgl.m4;
    const fovValueElem = document.querySelector("#fovValue");
    const resultElem = document.querySelector("#result");
    let fov = degToRad(45);

    function updateFOV() {
      fovValueElem.textContent = radToDeg(fov).toFixed(1);
      
      // get a projection matrix from somewhere (like VR)
      const projection = getProjectionMatrix();
      
      // now that we have projection matrix recompute the FOV from it
      const inverseProjection = m4.inverse(projection);
      const centerAtZNear = m4.transformPoint(inverseProjection, [0, 0, -1]);
      const topCenterAtZNear = m4.transformPoint(inverseProjection, [0, 1, -1]);
      
      const opposite = topCenterAtZNear[1];
      const adjacent = -centerAtZNear[2];
      const halfFieldOfView = Math.atan2(opposite, adjacent);
      const fieldOfView = halfFieldOfView * 2;
      
      resultElem.textContent = radToDeg(fieldOfView).toFixed(1);
    }

    updateFOV();

    function getProjectionMatrix() {
      // doesn't matter. We just want a projection matrix as though
      // someone else made it for us.
      const aspect = 2 / 1; 
      // choose some zNear and zFar
      const zNear = .5;
      const zFar = 100;
      return m4.perspective(fov, aspect, zNear, zFar);
    }


    function radToDeg(rad) {
      return rad / Math.PI * 180;
    }

    function degToRad(deg) {
      return deg / 180 * Math.PI;
    }

    document.querySelector("input").addEventListener('input', (e) => {
      fov = degToRad(parseInt(e.target.value));
      updateFOV();
    });

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <input id="fov" type="range" min="1" max="179" value="45"><label>fov: <span id="fovValue"></span></label>
    <div>computed fov: <span id="result"></span></div>

<!-- end snippet -->

Note this assumes the center of the frustum is directly in front of the eye. If it's not then you'd probably have to compute `adjacent` by computing the length of the vector from the eye to centerAtZNear

    const v3 = twgl.v3;

    ...

    const adjacent = v3.length(centerAtZNear);


  [1]: https://i.stack.imgur.com/ZBvwr.png
  [2]: https://i.stack.imgur.com/brBKh.png

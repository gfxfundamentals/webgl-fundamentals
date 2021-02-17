Title: Zooming to and stopping at object in a scene in WebGL
Description: Zooming to and stopping at object in a scene in WebGL
TOC: Zooming to and stopping at object in a scene in WebGL

## Question:

We've created a WebGl application which displays a scene containing multiple objects.  The entire scene can be rotated in multiple directions.  The application requires the user to be able to zoom up to but NOT thru the object.  I know this functionality can be implemented using webgl frameworks such as Three.js and SceneJs.  Unfortunately, our application is not leveraging a framework.  Is there a way to implement the zoom functionality described here using webgl only? Note: I don't believe object picking will work for us since the user is not required to select any object in the scene.   Thanks for your help.

## Answer:

Off the top of my head.

First off you need to know the size of each object in world space. For example if one object is 10 units big and another is 100 units big you probably want to be a different distance from the 100 unit object as the 10 unit object. By world space I also mean if you're scaling the 10 unit object by 9 then in world space it would be 90 units big and again you'd want to get a different distance away then if it was 10 units

You generally compute the size of an object in local space by computing the extents of its vertices. Just go through all the vertices and keep track of the min and max values in x, y, and z.  Whether you want to take the biggest value from the object's origin or compute an actual center point is up to you.

So, given the size we can compute how far away you need to be to see the entire object. For the standard perspective matrix you can just work backward. If you know your object is 10 units big then you need to fit 10 units in your frustum. You'd probably actually pick something like 14 units (say size * 1.4) so there's some space around the object.

![enter image description here][1]

We know `halfFovy`, `halfSizeToFitOnScreen`, we need to compute `distance`

    sohcahtoa
    tangent = opposite / adjacent
    opposite = halfsizeToFitOnScreen
    adjacent = distance
    tangent  = Math.tan(halfFovY)

Therefore

    tangent = sizeToFitOnScreen / distance
    tangent * distance = sizeToFitOnScreen
    distance = sizeToFitOnScreen / tangent
    distance = sizeToFitOnScreen / Math.tan(halfFovY)

   
So now we know the camera needs to be `distance` away from the object. There's an entire sphere that's `distance` away from the object. Where you pick on that sphere is up to you. Assuming you go from where the camera currently is you can compute the direction from the object to the camera

    direction = normalize(cameraPos - objectPos)

Now you can compute a point `distance` away in that direction.

    desiredCameraPosition = direction * distance

Now either put the camera there using some lookAt function

    matrix = lookAt(desiredCameraPosition, objectPosition, up)

Or lerp between where the camera currently is to it's new desired position

{{{example url="../webgl-qna-zooming-to-and-stopping-at-object-in-a-scene-in-webgl-example-1.html"}}}


  [1]: http://i.stack.imgur.com/0axue.png

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 3.0 by
    <a data-href="https://stackoverflow.com/users/4730921">jfc615</a>
    from
    <a data-href="https://stackoverflow.com/questions/29353242">here</a>
  </div>
</div>

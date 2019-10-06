Title: Fix algorithm for calculating normals
Description:
TOC: qna

# Question:

I have the code to calculate the normal to the point, but it creates a strange artifacts (lines).
[![my normals][1]][1]

How to fix it?
If you use the normal of the blender, then there are no artifacts
[![blender][2]][2]
code( javascript):

    for (var i = 0; i < d.polygons.length; i++) {
     var ind0 = d.polygons[i][0];
     var ind1 = d.polygons[i][1];
     var ind2 = d.polygons[i][2];
     var v1 = d.vertex[ind0];
     var v2 = d.vertex[ind1];
     var v3 = d.vertex[ind2];
     var vVector1 = self.vec3.minus(v2, v3);
     var vVector2 = self.vec3.minus(v1, v3);
     var vNormal;
     if (values.invertNormals === true) {
      vNormal = self.vec3.cross(vVector2, vVector1);
     } else {
      vNormal = self.vec3.cross(vVector1, vVector2);
     }
     d.polygonNormals.push(vNormal);
    }
    for (var k = 0; k < d.polygons.length; k++) {
     for (var i = 0; i < 3; i++) {
      d.normals[d.polygons[k][i]] = self.vec3.sum(d.normals[d.polygons[k][i]], d.polygonNormals[k]);
     };
    }
    for (var i = 0; i < d.vertex.length; i++) {
     d.normals[i] = self.vec3.normalize(d.normals[i]);
    }

  [1]: http://i.stack.imgur.com/Ln2K7.png
  [2]: http://i.stack.imgur.com/WCHtF.png

# Answer

I'm not sure I understand your algorithm. You compute a normal for each polygon. Then you sum every 3 polygons. Then you normalize. How are the sum of every 3 polygons related to your vertices

If it's a typical polar sphere with a grid wrapped around the sphere then if we imagine there's only a grid 3x2 wrapped to the sphere like this

    +-----+-----+-----+
    |    /|    /|    /|
    |0  / |2  / |4  / |
    |  /  |  /  |  /  |
    | /  1| /  3| /  5|
    |/    |/    |/    |
    A-----B-----C-----D
    |    /|    /|    /|
    |6  / |8  / |10 / |
    |  /  |  /  |  /  |
    | /  7| /  9| / 11|
    |/    |/    |/    |
    +-----+-----+-----+
   
Then looking at vertex B we need the average the normals of polygons 1, 2, 3, 6, 7, 8 and for A we'd need 0, 1, 5, 6, 10, 11

But AFAIK your algorithm isn't doing that. Am I mis-understanding it?



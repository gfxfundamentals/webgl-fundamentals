Title: WebGL 2D - Matrices
Description: Comment les matrices sont utilisées en graphisme
TOC: WebGL 2D - Matrices


Cet article est la suite d'une série de posts à propos de WebGL. Le premier <a href="webgl-fundamentals.html">évoquait les bases</a> et le précédent parlait de <a href="webgl-2d-scale.html">changement d'échelle</a> de géométries.

Dans les 3 derniers posts on a parlé des <a href="webgl-2d-translation.html">translations</a>, <a href="webgl-2d-rotation.html">rotations</a> et <a href="webgl-2d-scale.html">changement d'échelle</a>. Translation, rotation et changement d'échelle sont les 3 types de 'transformation'. Chacune de ces transformations demande des changements dans le shader de vertex et on a vu que le résultat dépend de l'ordre dans lequel elles sont appliquées : certaines sont non-commutatives. Dans le <a href="webgl-2d-scale.html">précédent exemple</a> on a changé l'échelle, puis tourné et déplacé. Dans un autre ordre on aurait eu un résultat différent.
<!--more-->
Par exemple, voici la suite de transformations suivantes : échelle de (2,1), rotation de 30 degrés et translation de (100, 0) :

<img src="../resources/f-scale-rotation-translation.svg" class="webgl_center" width="400" />

Et voici un déplacement de (100,0) suivi d'une rotation de 30 degrés et un changement d'échelle de (2,1) :

<img src="../resources/f-translation-rotation-scale.svg" class="webgl_center" width="400" />

Les résultats sont complètement différents. Pire, si on veut aboutir au second exemple il nous faut écrire un autre shader qui applique les transformations dans l'ordre qu'on souhaite.

Eh bien, des personnes plus futées que moi ont réalisé qu'on peut faire la même chose avec des matrices. Pour la 2D on utilise une matrice carrée d'ordre 3 (3x3). Une matrice 3x3 est comme une grille de 9 cases :

<link href="resources/webgl-2d-matrices.css" rel="stylesheet">
<div class="glocal-center"><table class="glocal-center-content glocal-mat"><tr><td>1.0</td><td>2.0</td><td>3.0</td></tr><tr><td>4.0</td><td>5.0</td><td>6.0</td></tr><tr><td>7.0</td><td>8.0</td><td>9.0</td></tr></table></div>

Pour trouver le résultat d'une transformation matricielle on dispose les composantes du vecteur à la verticale devant la matrice et pour chaque colonne, on multiplie les valeurs des composantes à leur niveau. Comme en 2D on a deux composantes x et y, et que les colonnes ont 3 valeurs, on ajoute une composante à la position, de valeur 1.

Dans ce cas notre résultat serait :

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col class="glocal-b"/>
<tr><td class="glocal-right">nouveauX&nbsp;=&nbsp;</td><td>x&nbsp;*&nbsp;</td><td class="glocal-border">1.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td>x&nbsp;*&nbsp;</td><td class="glocal-border">2.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td>x&nbsp;*&nbsp;</td><td class="glocal-border">3.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>y&nbsp;*&nbsp;</td><td class="glocal-border">4.0</td><td class="glocal-left">&nbsp;+</td><td></td><td>y&nbsp;*&nbsp;</td><td class="glocal-border">5.0</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td>y&nbsp;*&nbsp;</td><td class="glocal-border">6.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>1&nbsp;*&nbsp;</td><td>7.0</td><td>&nbsp;</td><td></td><td>1&nbsp;*&nbsp;</td><td>8.0</td><td>&nbsp;&nbsp;</td><td></td><td>1&nbsp;*&nbsp;</td><td>9.0</td><td>&nbsp;</td></tr></table></div>

Vous êtes probablement en train de fixer l'écran en vous disant "Non mais allô !". Hé bien, imaginons qu'on a une translation. Elle peut être décomposée par les valeurs tx et ty. Faisons une matrice pour ça :

<div class="glocal-center"><table class="glocal-center-content glocal-mat"><tr><td>1.0</td><td>0.0</td><td>0.0</td></tr><tr><td>0.0</td><td>1.0</td><td>0.0</td></tr><tr><td>tx</td><td>ty</td><td>1.0</td></tr></table></div>

Et maintenant vérifiez :

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>nouveauX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">1.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">nouveauY&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr><tr><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td class="glocal-left">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">1.0</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>tx</td><td>&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>ty</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>1.0</td><td>&nbsp;</td></tr></table></div>

Si vous avez quelques souvenirs d'algèbre, on peut supprimer les termes multipliés par zéro. Multiplier par 1 ne change rien au terme initial alors simplifions pour voir ce qui se passe :

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>nouveauX&nbsp;=&nbsp;</td><td>x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">1.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">nouveauY&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk glocal-left">&nbsp;+</td><td></td><td>y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">1.0</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td>tx</td><td>&nbsp;</td><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td>ty</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">1.0</td><td>&nbsp;</td></tr></table></div>

c'est-à-dire :

<div class="webgl_center"><pre class="webgl_math">
nouveauX = x + tx;
nouveauY = y + ty;
</pre></div>

Et l'extra on s'en fiche. Etonnament, ça revient au <a href="webgl-2d-translation.html">code de notre exemple sur les translations</a>.

Passons aux rotations. Comme on a vu dans le post sur les rotations on a juste besoin du sinus et du cosinus de l'angle de rotation, donc

<div class="webgl_center"><pre class="webgl_math">
s = Math.sin(angleEnRadian);
c = Math.cos(angleEnRadian);
</pre></div>

Et on écrit une matrice comme celle-ci

<div class="glocal-center"><table class="glocal-center-content glocal-mat"><tr><td>c</td><td>-s</td><td>0.0</td></tr><tr><td>s</td><td>c</td><td>0.0</td></tr><tr><td>0.0</td><td>0.0</td><td>1.0</td></tr></table></div>

On applique la matrice :

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>nouveauX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">c</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">nouveauY&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">-s</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">s</td><td class="glocal-left">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">c</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>0.0</td><td>&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>0.0</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>1.0</td><td>&nbsp;</td></tr></table></div>

En supprimant ce qui est multiplié par zéro et en gardant ce qui est multiplié par 1 :

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>nouveauX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">c</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">nouveauY&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">-s</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">s</td><td class="glocal-left glocal-blk">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">c</td><td class="glocal-left glocal-blk">&nbsp;+&nbsp;</td><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">0.0</td><td>&nbsp;</td><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">0.0</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">1.0</td><td>&nbsp;</td></tr></table></div>

Simplifions :

<pre class="webgl_center">
nouveauX = x *  c + y * s;
nouveauY = x * -s + y * c;
</pre>

C'est exactement <a href="webgl-2d-rotation.html">ce qu'on a vu dans les rotations</a>.

Enfin l'échelle. Appelons nos deux facteurs d'échelle sx et sy et construisons la matrice :

<div class="glocal-center"><table class="glocal-center-content glocal-mat"><tr><td>sx</td><td>0.0</td><td>0.0</td></tr><tr><td>0.0</td><td>sy</td><td>0.0</td></tr><tr><td>0.0</td><td>0.0</td><td>1.0</td></tr></table></div>

On l'applique :

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>nouveauX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">sx</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">nouveauY&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td class="glocal-left">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">sy</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>0.0</td><td>&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>0.0</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>1.0</td><td>&nbsp;</td></tr></table></div>

Ce qui est en fait

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>nouveauX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">sx</td><td class="glocal-left glocal-blk">&nbsp;+</td><td class="glocal-right">nouveauY&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-left glocal-blk">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-left glocal-blk">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">sy</td><td class="glocal-left glocal-blk">&nbsp;+&nbsp;</td><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">0.0</td><td>&nbsp;</td><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">0.0</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">1.0</td><td>&nbsp;</td></tr></table></div>

Ce qui revient à

<pre class="webgl_center">
nouveauX = x * sx;
nouveauY = y * sy;
</pre>

Et c'est pareil que ce qu'on avait dans <a href="webgl-2d-scale.html">l'article sur le changement d'échelle</a> !

Maintenant je parie que vous fixez toujours l'écran en pensant "Alors quoi ?! C'est quoi le truc ?" Ca a l'air d'un beaucoup plus gros boulot pour faire ce qu'on faisait déjà.

C'est là que la magie arrive. Il se trouve qu'on peut multiplier des matrices ensemble. Et qu'on peut appliquer toutes les transformations d'un coup. Imaginons qu'on a une fonction, `multiplierMatrices`, qui prend deux matrices, les multiplie et retourne la matrice finale.

Pour rendre les choses plus claires faisons des fonctions pour fabriquer des matrices pour le déplacement, la rotation et l'échelle :

    function deplacer(tx, ty) {
      return [
        1, 0, 0,
        0, 1, 0,
        tx, ty, 1
      ];
    }

    function tourner(angleEnRadians) {
      var c = Math.cos(angleEnRadians);
      var s = Math.sin(angleEnRadians);
      return [
        c,-s, 0,
        s, c, 0,
        0, 0, 1
      ];
    }

    function changerEchelle(sx, sy) {
      return [
        sx, 0, 0,
        0, sy, 0,
        0, 0, 1
      ];
    }

Maintenant changeons le shader. Le shader actuel est :

    <script id="shader-de-vertex-2d" type="x-shader/x-vertex">
    attribute vec2 a_position;

    uniform vec2 u_resolution;
    uniform vec2 u_deplacement;
    uniform vec2 u_rotation;
    uniform vec2 u_echelle;

    void main() {
      // Change l'échelle
      vec2 positionEchelle = a_position * u_echelle;

      // Tourne
      vec2 positionTournee = vec2(
         positionEchelle.x * u_rotation.y + positionEchelle.y * u_rotation.x,
         positionEchelle.y * u_rotation.y - positionEchelle.x * u_rotation.x);

      // Déplace
      vec2 position = positionTournee + u_deplacement;
      ...

Notre nouveau shader va être beaucoup plus simple

    <script id="shader-de-vertex-2d" type="x-shader/x-vertex">
    attribute vec2 a_position;

    uniform vec2 u_resolution;
    uniform mat3 u_matrice;

    void main() {
      // Multiplie la position par la matrice
      vec2 position = (u_matrice * vec3(a_position, 1)).xy;
      ...

Et voilà comment on l'utilise :

      // Rend la scène
      function rendreScene() {
        // Efface le canvas
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Calcule les matrices
        var matriceDeplacement = deplacer(deplacement[0], deplacement[1]);
        var matriceRotation = tourne(angleEnRadians);
        var matriceEchelle = changerEchelle(echelle[0], echelle[1]);

        // Multiplie les matrices
        var matrice = multiplierMatrices(matriceEchelle, matriceRotation);
        matrice = multiplierMatrices(matrice, matriceDeplacement);

        // Transmet la valeur au programme
        gl.uniformMatrix3fv(emplacementMatrice, false, matrice);

        // Dessine le rectangle
        gl.drawArrays(gl.TRIANGLES, 0, 18);
      }

Voilà un exemple avec le nouveau code. Les sliders sont les mêmes, déplacement, rotation, échelle. Mais la façon dont le shader les utilise est beaucoup plus simple.

{{{example url="../webgl-2d-geometry-matrix-transform.html" }}}

Mais, vous vous demandez peut-être encore, alors quoi ? Ca n'a pas l'air plus pratique. Mais maintenant si on veut changer l'ordre des transformations on n'a pas besoin d'écrire un nouveau shader. On a juste à changer l'ordre de nos fonctions. 

        ...
        // Multiplie les matrices
        var matrice = multiplierMatrices(matriceDeplacement, matriceRotation);
        matrice = multiplierMatrices(matrice, matriceEchelle);
        ...

Voilà cette version :

{{{example url="../webgl-2d-geometry-matrix-transform-trs.html" }}}

Pouvoir multiplier par des matrices comme ça est particulièrement important dans les hiérarchies d'animation comme des bras sur un corps, des lunes autour d'une planète autour d'un soleil, ou les branches d'un arbre. Pour un exemple simple avec une animation hiérarchique dessinons notre "F" cinq fois mais chaque fois, partons de la matrice du F précédent. 

      // Rend la scène
      function rendreScene() {
        // Efface le canvas
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Calcule les matrices
        var matriceDeplacement = deplacer(deplacement[0], deplacement[1]);
        var matriceRotation = tourner(angleEnRadians);
        var matriceEchelle = changerEchelle(echelle[0], echelle[1]);

        // initialise la matrice à l'identité
        var matrice = matriceIdentite();

        for (var i = 0; i < 5; ++i) {
          // Multiplie les matrices
          matrice = multiplierMatrices(matrice, matriceDeplacement);
          matrice = multiplierMatrices(matrice, matriceRotation);
          matrice = multiplierMatrices(matrice, matriceEchelle);

          // Transmet la valeur au programme
          gl.uniformMatrix3fv(emplacementMatrice, false, matrice);

          // Dessine la géométrie
          gl.drawArrays(gl.TRIANGLES, 0, 18);
        }
      }

Pour faire ça on a eu besoin de la fonction `matriceIdentite`, qui retourne une matrice identité. Une matrice identité est une matrice qui représente "1.0", c'est-à-dire qu'en la multipliant, il ne se passe rien. Tout comme

<div class="webgl_center">X * 1 = X</div>

de même

<div class="webgl_center">matriceX * identite = matriceX</div>

Voilà le code pour faire une matrice identité :

    function matriceIdentite() {
      return [
        1, 0, 0,
        0, 1, 0,
        0, 0, 1
      ];
    }

Et voilà nos cinq F.

{{{example url="../webgl-2d-geometry-matrix-transform-hierarchical.html" }}}

Voyons un autre exemple. Jusque là dans tous les exemples notre "F" tourne autour de son coin gauche. C'est parce que les opérations qu'on a utilisées faisaient des rotations autour de l'origine et que ce coin gauche, c'est l'origine (0,0).

Mais maintenant, parce qu'on sait faire des opérations matricielles on peut choisir un ordre d'application des transformations et déplacer l'origine avant le reste des opérations :

        // créé une matrice qui va déplacer l'origine du F vers son centre :
        var matriceDeplacementOrigine = deplacer(-50, -75);
        ...

        // Multiply the matrices.
        var matrice = multiplierMatrices(matriceDeplacementOrigine, matriceEchelle);
        matrice = multiplierMatrices(matrice, matriceRotation);
        matrice = multiplierMatrices(matrice, matriceDeplacement);

Et voilà. Le F tourne et change d'échelle depuis son centre.

{{{example url="../webgl-2d-geometry-matrix-transform-center-f.html" }}}

Avec cette technique vous pouvez tourner et changer d'échelle depuis n'importe quel point. Maintenant vous savez comment Photoshop ou Flash vous laissent changer un centre de rotation.

Allons plus loin dans cette folie. Si on revient au premier article <a href="webgl-fundamentals.html">WebGL - Les bases</a> vous vous rappelez peut-être qu'on avait un code dans nos shaders pour convertir des coordonnées d'écran aux coordonnées d'espace de projection (clipspace). Ca ressemblait à ça :

      ...
      // convertit le rectangle de l'espace des pixels à 0.0 > 1.0
      vec2 zeroAUn = position / u_resolution;

      // convertit de 0->1 à 0->2
      vec2 zeroADeux = zeroAUn * 2.0;

      // convertit de 0->2 à -1->+1 (clipspace)
      vec2 clipSpace = zeroADeux - 1.0;

      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

Si vous regardez chaque étape, en fait, "convertit le rectangle de l'espace des pixels à 0.0 > 1.0", est un changement d'échelle. Pareil pour la seconde étape. La troisième est un déplacement et la dernière un changement d'échelle par -1. On peut du coup faire ceci dans une matrice qu'on envoie au shader. On pourrait faire deux matrices d'échelle, une pour l'échelle 1.0 / résolution, une autre pour l'échelle 2.0, une troisième pour le déplacement (-1.0,-1.0) et une quatrième pour changer l'échelle Y à -1.0, enfin multiplier tout ça. Mais à la place, parce que les maths c'est sensé être simple, on va juste écrire une fonction qui retourne une matrice de 'projection' pour une résolution donnée directement.

    function projeter2D(largeur, hauteur) {
      // Note: Cette matrice inverse l'axe Y, il regarde vers le bas
      return [
        2 / largeur, 0, 0,
        0, -2 / hauteur, 0,
        -1, 1, 1
      ];
    }

Maintenant on peut simplifier le shader davantage. Voici le nouveau shader de vertex :

    <script id="shader-de-vertex-2d" type="x-shader/x-vertex">
    attribute vec2 a_position;

    uniform mat3 u_matrice;

    void main() {
      // Multiplie la position par la matrice
      gl_Position = vec4((u_matrice * vec3(a_position, 1)).xy, 0, 1);
    }
    </script>

Et en javascript il reste à multiplier par la matrice de projection :

      // Rend la scène
      function rendreScene() {
        ...
        // Calcule les matrices
        var matriceProjection = projeter2D(
            canvas.clientWidth, canvas.clientHeight);
        ...

        // Multiplie les matrices
        var matrice = multiplierMatrices(matriceEchelle, matriceRotation);
        matrice = multiplierMatrices(matrice, matriceDeplacement);
        matrice = multiplierMatrices(matrice, matriceProjection);
        ...
      }

On a aussi supprimé le code qui indique la résolution. Avec cette dernière étape on est parti d'un shader compliqué avec 6 ou 7 étapes à un shader simplifié à une seule étape, tout ça grâce à la magie des matrices.

{{{example url="../webgl-2d-geometry-matrix-transform-with-projection.html" }}}

J'espère que ces posts aident à démystifier les matrices. <a href="webgl-3d-orthographic.html">On peut passer à la 3D</a>. En 3D les matrices suivent les mêmes principes. J'ai démarré avec la 2D pour rendre ça plus facile à comprendre. 

<div class="webgl_bottombar">
<h3>Que signifient <code>clientWidth</code> et <code>clientHeight</code>?</h3>
<p>Jusqu'à maintenant quand je faisais référence aux dimensions du canvas j'utilisais <code>canvas.width</code> et <code>canvas.height</code>
mais dans <code>projeter2D</code> j'ai préféré <code>canvas.clientWidth</code> et <code>canvas.clientHeight</code>. Pourquoi ?</p>
<p>Les matrices de projection ont besoin de connaître les dimensions du canvas pour créer un espace de projection qui ne déforme pas l'objet. 
Mais, dans le navigateur, il y a deux types de pixels qu'on doit gérer. Le premier est le nombre de pixels dans le canvas. Par exemple un canvas défini comme ça </p>
<pre class="prettyprint">
  &lt;canvas width="400" height="300"&gt;&lt;/canvas&gt;
</pre>
<p>ou comme ça</p>
<pre class="prettyprint">
  var canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 300;
</pre>
<p>les deux contiennent une image de 400 par 300. C'est le nombre de pixel qu'il y aura dans le tampon d'ailleurs. 
Mais cette taille est indépendante de la taille à laquelle le navigateur affiche le canvas. C'est la CSS qui s'en occupe.
Par exemple si on a le canvas suivant, avec ce style appliqué :</p>
<pre class="prettyprint"><!>
  &lt;style&gt;
  canvas {
    width: 100%;
    height: 100%;
  }
  &lt;/style&gt;
  ...
  &lt;canvas width="400" height="300">&lt;/canvas&gt;
</pre>
<p>Le canvas va être affiché dans tout son contenant parent, quel que soit sa propre taille, 400x300 ou une autre.</p>
<p>Voici deux exemples qui définissent la taille d'affichage CSS pour étirer le canvas sur toute la page. Le premier utilise 
<code>canvas.width</code> et <code>canvas.height</code>. Ouvrez-le dans une nouvelle fenêtre et redimensionnez-là. Le <code>F</code> n'a plus le bon aspect, il est déformé.</p>
{{{example url="../webgl-canvas-width-height.html" width="500" height="150" }}}
<p>Dans le second exemple on utilise <code>canvas.clientWidth</code> et <code>canvas.clientHeight</code>. <code>canvas.clientWidth</code> et <code>canvas.clientHeight</code> reprennent la taille avec laquelle le canvas est effectivement affiché dans le navigateur donc dans ce cas, même s'il n'a toujours que 400x300 pixels, puisqu'on définit l'aspect en se basant sur l'aspect réel du canvas, le <code>F</code> n'est plus déformé.</p>
{{{example url="../webgl-canvas-clientwidth-clientheight.html" width="500" height="150" }}}
<p>La plupart des applis qui permettent le redimensionnement du canvas essaient de vérifier si <code>canvas.clientWidth</code> et <code>canvas.clientHeight</code> valent <code>canvas.width</code> et <code>canvas.height</code> parce qu'ils veulent qu'un pixel du canvas vale un pixel sur l'écran. Mais comme on l'a vu plus haut, ce n'est pas toujours le cas. Donc, dans la plupart des cas, c'est plus correct de calculer une matrice de projection en calculant l'aspect depuis <code>canvas.clientHeight</code> et <code>canvas.clientWidth</code>.
</p>
</div>


Title: WebGL 3D - Les lumières-point
Description: Comment implémenter les lumières-point en WebGL
TOC: WebGL 3D - Lumière-point


Cet article est la suite de <a href="webgl-3d-lighting-directional.html">WebGL 3D - L'éclairage directionnel</a>. Si vous ne l'avez pas lu vous préférez peut-être démarrer par là.

Dans le dernier article on a vu l'éclairage directionnel, dans lequel la lumière vient de façon homogène d'une même direction. On indique cette direction avant le rendu. 

Et si au lieu d'une direction on choisissait un point dans l'espace et qu'on déduisait la direction de n'importe quel endroit de la surface d'un objet dans notre shader ? Ca nous donnerait une lumière-point.

{{{diagram url="resources/point-lighting.html" width="500" height="400" className="noborder" }}}

Si vous tournez la surface vous voyez que chaque point reçoit la lumière avec un angle différent. Le produit scalaire entre la normale de la surface et la direction de la lumière nous donnera donc une valeur différente pour chaque point de la surface.

Codons ça !

D'abord on a besoin de la position de la lumière.

    uniform vec3 u_positionGlobaleLumiere;

Et on a besoin de calculer la position de la surface dans l'espace global. Pour ça on peut multiplier nos positions par la matrice globale donc... 

    uniform mat4 u_globale;

    ...

    // calcule la position globale de la surface
    vec3 positionSurfaceGlobale = (u_globale * a_position).xyz;

Et on peut calculer un vecteur de la surface à la lumière, soit la direction, sauf que cette fois elle est calculée pour chaque point.

    v_surfaceVersLumiere = u_positionLumiere - positionSurfaceGlobale;

Voilà tout ça en place :

    attribute vec4 a_position;
    attribute vec3 a_normale;

    +uniform vec3 u_positionGlobaleLumiere;

    +uniform mat4 u_globale;
    uniform mat4 u_projectionGlobaleVue;
    uniform mat4 u_globaleInverseTransposee;

    varying vec3 v_normale;

    +varying vec3 v_surfaceVersLumiere;

    void main() {
      // Multiplie la position par la matrice
      gl_Position = u_projectionGlobaleVue * a_position;

      // Oriente la normale et la transmet au shader de fragment
      v_normale = mat3(u_globaleInverseTransposee) * a_normale;

    +  // Calcule la position globale de la surface
    +  vec3 positionSurfaceGlobale = (u_globale * a_position).xyz;
    +
    +  // Calcule le vecteur de la surface à la lumière
    +  // et le transmet au shader de fragment
    +  v_surfaceVersLumiere = u_positionGlobaleLumiere - positionSurfaceGlobale;
    }

Maintenant dans le shader de fragment il nous faut normaliser ce vecteur de direction de la lumière puisqu'il n'est pas unitaire. On pourrait le normaliser dans le shader de vertex mais comme il est interpolé entre les deux shaders, puisque c'est une varying, il faudrait quand-même le re-normaliser ensuite. 

    precision mediump float;

    // Reçu depuis le shader de vertex
    varying vec3 v_normale;
    +varying vec3 v_surfaceVersLumiere;

    -uniform vec3 u_directionInverseDeLaLumiere;
    uniform vec4 u_couleur;

    void main() {
      // Comme v_normale est une varying elle est interpolée
      // elle ne sera pas forcément normalisée. En la normalisant
      // elle sera à nouveau un vecteur unitaire
      vec3 normale = normalize(v_normale);

      vec3 directionSurfaceVersLumiere = normalize(v_surfaceVersLumiere);

      -float lumiere = dot(normale, u_directionInverseDeLaLumiere);
      +float lumiere = dot(normale, directionSurfaceVersLumiere);

      gl_FragColor = u_couleur;

      // Multiplie seulement la partie colorée (pas le cannal alpha)
      // par la lumière
      gl_FragColor.rgb *= lumiere;
    }


On crée les pointeurs pour `u_globale` et `u_positionGlobaleLumiere`

```
-  var emplacementDirectionInverseLumiere =
-      gl.getUniformLocation(programme, "u_directionInverseDeLaLumiere");
+  var emplacementPositionGlobaleLumiere =
+      gl.getUniformLocation(programme, "u_positionGlobaleLumiere");
+  var emplacementGlobale =
+      gl.getUniformLocation(programme, "u_globale");
```

On indique leurs valeurs au programme

```
  // Transmet les matrices au programme actif
+  gl.uniformMatrix4fv(
+      emplacementGlobale, false,
+      matriceGlobale);
  gl.uniformMatrix4fv(
      emplacementProjectionGlobaleVue, false,
      matriceProjectionGlobaleVue);

  ...

-  // Transmet la direction de la lumière au programme actif
-  gl.uniform3fv(emplacementDirectionInverseLumiere, normaliser([0.5, 0.7, 1]));
+  // Transmet la position de la lumière au programme actif
+  gl.uniform3fv(emplacementPositionGlobaleLumiere, [20, 30, 50]);
```

Voilà !

{{{example url="../webgl-3d-lighting-point.html" }}}

Maintenant qu'on a notre lumière point on peut ajouter quelque chose qu'on appelle l'éclairage spéculaire. 

Si on regarde un objet dans le vrai monde, s'il est vaguement brillant et qu'il reflète une lumière directement dans notre direction, ça fait comme un miroir

<img class="webgl_center" src="resources/specular-highlights.jpg" />

On peut simuler cet effet en calculant si la lumière se reflète dans notre direction. Le *produit scalaire* va là aussi nous aider.

Que doit-on faire ? Réfléchissons. La lumière se réfléchit avec le même angle par lequel elle atteint la surface. Donc si la direction entre la surface et la lumière est la réflexion exacte de la direction de la surface à l'observateur alors la réflexion est maximale.

{{{diagram url="resources/surface-reflection.html" width="500" height="400" className="noborder" }}}

Si on connaît la direction de la surface à la lumière (ce qu'on vient de voir). Et si on connaît la direction de la surface à l'observateur/camera, qu'on peut calculer, alors on peut ajouter ces deux vecteurs et les normaliser pour avoir le `vecteurIntermediaire` qui est le vecteur entre les deux. Si le vecteurIntermediaire et la normale de la surface concordent alors la réflexion est maximale. Et comment dire de combien ils sont identiques ? Avec le *produit scalaire* comme on a fait avant. 1 = ce sont les mêmes, ils vont dans la même direction, 0 = ils sont perpendiculaires, -1 = ils sont opposés.

{{{diagram url="resources/specular-lighting.html" width="500" height="400" className="noborder" }}}

Premièrement on doit transmettre la position de la caméra, calculer le vecteur entre la surface et la caméra et le transmettre au shader de fragment.

    attribute vec4 a_position;
    attribute vec3 a_normale;

    uniform vec3 u_positionGlobaleLumiere;
    +uniform vec3 u_positionGlobaleVue;

    uniform mat4 u_globale;
    uniform mat4 u_projectionGlobaleVue;
    uniform mat4 u_globaleInverseTransposee;

    varying vec3 v_normale;

    varying vec3 v_surfaceVersLumiere;
    +varying vec3 v_surfaceVersCamera;

    void main() {
      // Multiplie la position par la matrice
      gl_Position = u_projectionGlobaleVue * a_position;

      // Oriente la normale et la transmet au shader de fragment
      v_normale = mat3(u_globaleInverseTransposee) * a_normale;

      // calcule la position globale de la surface
      vec3 positionSurfaceGlobale = (u_globale * a_position).xyz;

      // Calcule le vecteur de la surface à la lumière
      // et le transmet au shader de fragment
      v_surfaceVersLumiere = u_positionGlobaleLumiere - positionSurfaceGlobale;

    +  // Calcule le vecteur de la surface à la caméra
    +  // et le transmet au shader de fragment
    +  v_surfaceVersCamera = u_positionGlobaleVue - positionSurfaceGlobale;
    }

Ensuite dans le shader de fragment il nous faut calculer le `vecteurIntermediaire` entre les vecteurs surfaceVersCamera et surfaceVersLumiere. Ensuite on peut prendre le produit vectoriel entre le `vecteurIntermediaire` et la normale pour trouver le facteur de réflexion

    // Reçu du shader de vertex
    varying vec3 v_normale;
    varying vec3 v_surfaceVersLumiere;
    +varying vec3 v_surfaceVersCamera;

    uniform vec4 u_couleur;

    void main() {
      // Comme v_normale est une varying elle est interpolée
      // elle ne sera pas forcément normalisée. En la normalisant
      // elle sera à nouveau un vecteur unitaire
      vec3 normale = normalize(v_normale);

    +  vec3 directionSurfaceVersLumiere = normalize(v_surfaceVersLumiere);
    +  vec3 surfaceToViewDirection = normalize(v_surfaceVersCamera);
    +  vec3 vecteurIntermediaire = normalize(directionSurfaceVersLumiere + surfaceToViewDirection);

      float lumiere = dot(normale, directionSurfaceVersLumiere);
    +  float specular = dot(normale, vecteurIntermediaire);

      gl_FragColor = u_couleur;

      // Multiplie seulement la partie colorée (pas le cannal alpha)
      // par la lumière
      gl_FragColor.rgb *= lumiere;

    +  // On ajoute l'éclairage spéculaire
    +  gl_FragColor.rgb += specular;
    }

Reste à créer les emplacements `u_positionGlobaleVue` et renseigner leurs valeurs dans le programme

    var emplacementPositionGlobaleLumiere =
        gl.getUniformLocation(programme, "u_positionGlobaleLumiere");
    +var emplacementPositionGlobaleVue =
    +    gl.getUniformLocation(programme, "u_positionGlobaleVue");

    ...

    // Calcule la matrice caméra
    var camera = [100, 150, 200];
    var cible = [0, 35, 0];
    var vertical = [0, 1, 0];
    var matriceCamera = regarderVers(camera, cible, vertical);

    +// Indique la position caméra au programme
    +gl.uniform3fv(emplacementPositionGlobaleVue, camera);


Résultat

{{{example url="../webgl-3d-lighting-point-specular.html" }}}

**ET PAN CA BRILLE !**

On peut jouer sur la brillance en ajoutant un exposant au produit scalaire. Ca changera l'éclairage spéculaire d'un aspect linéaire à un aspect exponentiel.

{{{diagram url="resources/power-graph.html" width="300" height="300" className="noborder" }}}

Plus la ligne rouge est proche du haut du graphique plus l'aspect spéculaire va être important. En augmentant la puissance la portée de la brillance est modifiée.

Appelons ce facteur `brillance` (shininess en anglais) et ajoutons-le au shader.

    uniform vec4 u_couleur;
    +uniform float u_brillance;

    ...

    -  float speculaire = dot(normale, vecteurIntermediaire);
    +  float speculaire = 0.0;
    +  if (lumiere > 0.0) {
    +    speculaire = pow(dot(normale, vecteurIntermediaire), u_brillance);
    +  }

Le produit scalaire peut être négatif. Certaines puissances ne sont pas définies sur les nombres négatifs. On vérifie donc sa valeur pour le mettre à zéro s'il est négatif.

Bien sûr on doit créer le pointeur et renseigner sa valeur dans le programme

    +var emplacementBrillance = gl.getUniformLocation(programme, "u_brillance");

    ...

    // Indique la brillance au programme
    gl.uniform1f(emplacementBrillance, brillance);

Résultat

{{{example url="../webgl-3d-lighting-point-specular-power.html" }}}

Une dernière chose que je souhaite mentionner dans cet article, ce sont les couleurs des lumières. 

Jusque là on a utilisé `lumiere` pour multiplier la couleur qu'on donne au F. On peut fournir une couleur de lumière aussi si on veut des lumières colorées.

    uniform vec4 u_couleur;
    uniform float u_brillance;
    +uniform vec3 u_couleurLumiere;
    +uniform vec3 u_couleurSpeculaire;

    ...

      // Multiplie seulement la partie colorée (pas le cannal alpha)
      // par la lumière
    *  gl_FragColor.rgb *= light * u_couleurLumiere;

      // Ajoute l'éclairage spéculaire
    *  gl_FragColor.rgb += specular * u_couleurSpeculaire;
    }

et bien sûr

    +  var emplacementCouleurLumiere =
    +      gl.getUniformLocation(programme, "u_couleurLumiere");
    +  var emplacementCouleurSpeculaire =
    +      gl.getUniformLocation(programme, "u_couleurSpeculaire");

et

    // Indique la couleur de la lumière au programme
    +  gl.uniform3fv(emplacementCouleurLumiere, normaliser([1, 0.6, 0.6]));  // lumiere rouge
    // Indique la couleur de l'éclairage spéculaire au programme
    +  gl.uniform3fv(emplacementCouleurSpeculaire, normaliser([1, 0.6, 0.6]));  // lumiere rouge

{{{example url="../webgl-3d-lighting-point-color.html" }}}

Par quoi on continue ??

<div class="webgl_bottombar">
<h3>Pourquoi <code>pow(nombreNegatif, puissance)</code> n'est pas défini ?</h3>
<p>Quest-ce que ça veut dire ?</p>
<div class="webgl_center"><pre class="glocal-center-content">pow(5, 2)</pre></div>
<p>Vous pouvez voir ça comme</p>
<div class="webgl_center"><pre class="glocal-center-content">5 * 5 = 25</pre></div>
<p>Et si on faisait :</p>
<div class="webgl_center"><pre class="glocal-center-content">pow(5, 3)</pre></div>
<p>C'est comme si c'était</p>
<div class="webgl_center"><pre class="glocal-center-content">5 * 5 * 5 = 125</pre></div>
<p>Ok, et maintenant</p>
<div class="webgl_center"><pre class="glocal-center-content">pow(-5, 2)</pre></div>
<p>Ca pourrait être</p>
<div class="webgl_center"><pre class="glocal-center-content">-5 * -5 = 25</pre></div>
<p>Et</p>
<div class="webgl_center"><pre class="glocal-center-content">pow(-5, 3)</pre></div>
<p>Qui est</p>
<div class="webgl_center"><pre class="glocal-center-content">-5 * -5 * -5 = -125</pre></div>
<p>Comme vous le savez, multiplier un nombre négatif par un autre nombre négatif forme un nombre positif. Remultiplier par un nombre négatif reforme un nombre négatif.</p>
<p>Ok alors qu'est-ce que ça veut dire ?</p>
<div class="webgl_center"><pre class="glocal-center-content">pow(-5, 2.5)</pre></div>
<p>Comment on décide quel est le résultat de ça, positif ou négatif ? Je ne suis pas un matheux mais on ne peut pas vraiment choisir donc c'est non défini.</p>
</div>


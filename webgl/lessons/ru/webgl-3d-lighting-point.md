Title: WebGL 3D - Точечное освещение
Description: Реализация точечного освещения в WebGL
TOC: WebGL 3D - Точечное освещение


Эта статья продолжает статью о [направленном освещении](webgl-3d-lighting-directional.html).
Если вы её ещё не читали, рекомендую ознакомиться сначала с ней.

В последней статье мы рассмотрели направленное освещение, где свет падает
повсеместно с одним направлением. Мы установили это направление перед
рендерингом.

А что если вместо задания направления света мы выберем точку источника
света в 3D-пространстве и вычислим направление освещения в каждой точке
поверхности модели в нашем шейдере? Это и даст нам точечное освещение.

{{{diagram url="resources/point-lighting.html" width="500" height="400" className="noborder" }}}

Если вы повернёте поверхность, то увидите, что каждая точка поверхности
имеет разный вектор *поверхность-источник света* (surfaceToLight). Значение
скалярного произведения нормали поверхности и каждого вектора от поверхности
до источника света будет отличаться для каждой точки поверхности.

Итак, приступим к реализации.

Для начала нам понадобится положение источника света.

    uniform vec3 u_lightWorldPosition;

Ещё нам нужно вычислить мировые координаты поверхности. Для этого мы можем
умножить наши координаты на мировую матрицу

    uniform mat4 u_world;

    ...

    // вычисляем мировые координаты поверхности
    vec3 surfaceWorldPosition = (u_world * a_position).xyz;

Далее вычислим вектор от поверхности к источнику света по аналогии с
направленным освещением, но на этот раз мы будем вычислять вектор для
каждой точки поверхности.

    v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;

Всё вместе выглядит следующим образом

    attribute vec4 a_position;
    attribute vec3 a_normal;

    +uniform vec3 u_lightWorldPosition;

    +uniform mat4 u_world;
    uniform mat4 u_worldViewProjection;
    uniform mat4 u_worldInverseTranspose;

    varying vec3 v_normal;

    +varying vec3 v_surfaceToLight;

    void main() {
      // Умножаем координаты на матрицу
      gl_Position = u_worldViewProjection * a_position;

      // Направляем нормали и передаём во фрагментный шейдер
      v_normal = mat3(u_worldInverseTranspose) * a_normal;

    +  // Вычисляем мировые координаты поверхности
    +  vec3 surfaceWorldPosition = (u_world * a_position).xyz;
    +
    +  // вычисляем вектор от поверхности к источнику света
    +  // и передаём его во фрагментный шейдер
    +  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
    }

Во фрагментном шейдере нам необходимо нормализовать вектор от поверхности
к источнику света, так как изначально вектор не будет единичным. Мы могли
бы нормализовать вектор в вершинном шейдере, но так как `varying`-переменная
интерполируется между координатами, то вектор перестанем быть единичным
после интерполяции.

    precision mediump float;

    // Передаётся из вершинного шейдера
    varying vec3 v_normal;
    +varying vec3 v_surfaceToLight;

    -uniform vec3 u_reverseLightDirection;
    uniform vec4 u_color;

    void main() {
      // v_normal - это varying-переменная, которая интерполируется
      // и поэтому не будет единичным вектором. Нормализуем
      // переменную и получаем единичный вектор.
      vec3 normal = normalize(v_normal);

      vec3 surfaceToLightDirection = normalize(v_surfaceToLight);

    -  float light = dot(normal, u_reverseLightDirection);
    +  float light = dot(normal, surfaceToLightDirection);

      gl_FragColor = u_color;

      // Умножаем только значение цвета (без прозрачности)
      // на значение света
      gl_FragColor.rgb *= light;
    }


Далее получаем ссылки на `u_world` и `u_lightWorldPosition`

```
-  var reverseLightDirectionLocation =
-      gl.getUniformLocation(program, "u_reverseLightDirection");
+  var lightWorldPositionLocation =
+      gl.getUniformLocation(program, "u_lightWorldPosition");
+  var worldLocation =
+      gl.getUniformLocation(program, "u_world");
```

и задаём им значения

```
  // Задаём значения матрицам
+  gl.uniformMatrix4fv(
+      worldLocation, false,
+      worldMatrix);
  gl.uniformMatrix4fv(
      worldViewProjectionLocation, false,
      worldViewProjectionMatrix);

  ...

-  // Задаём направление освещения
-  gl.uniform3fv(reverseLightDirectionLocation, m4.normalize([0.5, 0.7, 1]));
+  // Задаём положение освещения
+  gl.uniform3fv(lightWorldPositionLocation, [20, 30, 50]);
```

И получаем результат:

{{{example url="../webgl-3d-lighting-point.html" }}}

Теперь мы можем добавить нечто под названием блики.

Если вы посмотрите на глянцевый объект в реальном мире, то можно заметить,
что когда свет отражается вам прямо в глаза, то эффект почти как от зеркала.

<img class="webgl_center" src="resources/specular-highlights.jpg" />

Мы можем имитировать этот эффект, достаточно рассчитать, отражается ли
свет прямо в наблюдателя. Здесь нам снова поможет *скалярное произведение*.

Что же нам нужно проверить? Подумаем над этим. Угол падения и отражения
света от поверхности равны, поэтому когда направление от поверхности к
источнику света в точности равно направлению от поверхности до глаза, то
перед нами идеальный угол для отражения света.

{{{diagram url="resources/surface-reflection.html" width="500" height="400" className="noborder" }}}

Если нам известно направление от поверхности нашей модели к свету (а нам
это известно, мы как раз этим и занимались), и если нам известно направление
поверхности к глазу/наблюдателю/камере (что мы можем вычислить), то мы можем
сложить эти два вектора, нормализовать эту сумму и получить `halfVector` - то
есть вектор, который находится на полпути между ними. Если этот половинный
вектор и нормаль поверхности совпадают, то перед нами угол идеального
отражения света. Но как можно узнать, что они совпадают? Нужно воспользоваться
*скалярным произведением*, как и прежде. 1 = они совпадают, одинаковое
направление, 0 = они перпендикулярны, -1 = они направлены в разные стороны.

{{{diagram url="resources/specular-lighting.html" width="500" height="400" className="noborder" }}}

Итак, сначала передадим положение глаза/наблюдателя/камеры, вычислим вектор
от поверхности к наблюдателю и передадим его во фрагментный шейдер.

    attribute vec4 a_position;
    attribute vec3 a_normal;

    uniform vec3 u_lightWorldPosition;
    +uniform vec3 u_viewWorldPosition;

    uniform mat4 u_world;
    uniform mat4 u_worldViewProjection;
    uniform mat4 u_worldInverseTranspose;

    varying vec3 v_normal;

    varying vec3 v_surfaceToLight;
    +varying vec3 v_surfaceToView;

    void main() {
      // Умножаем координаты на матрицу
      gl_Position = u_worldViewProjection * a_position;

      // Направляем нормали и передаём во фрагментный шейдер
      v_normal = mat3(u_worldInverseTranspose) * a_normal;

      // Вычисляем мировые координаты поверхности
      vec3 surfaceWorldPosition = (u_world * a_position).xyz;

      // вычисляем вектор от поверхности к источнику света
      // и передаём его во фрагментный шейдер
      v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;

    +  // вычисляем вектор от поверхности к наблюдателю
    +  // и передаём его во фрагментный шейдер
    +  v_surfaceToView = u_viewWorldPosition - surfaceWorldPosition;
    }

Затем во фрагментном шейдере вычисляем `halfVector` между вектором
от поверхности до наблюдателя и вектором от поверхности до источника
света. После этого мы можем вычислить скалярное произведение `halfVector`
и нормали, чтобы узнать, отражается ли свет в наблюдателя.

    // Получаем из вершинного шейдера
    varying vec3 v_normal;
    varying vec3 v_surfaceToLight;
    +varying vec3 v_surfaceToView;

    uniform vec4 u_color;

    void main() {
      // v_normal - это varying-переменная, которая интерполируется
      // и поэтому не будет единичным вектором. Нормализуем
      // переменную и получаем единичный вектор.
      vec3 normal = normalize(v_normal);

    +  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
    +  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
    +  vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);

      float light = dot(normal, surfaceToLightDirection);
    +  float specular = dot(normal, halfVector);

      gl_FragColor = u_color;

      // Умножаем только значение цвета (без прозрачности)
      // на значение света
      gl_FragColor.rgb *= light;

    +  // Просто добавляем блики
    +  gl_FragColor.rgb += specular;
    }

Наконец, получаем ссылку на `u_viewWorldPosition` и задаём ей значение.

    var lightWorldPositionLocation =
        gl.getUniformLocation(program, "u_lightWorldPosition");
    +var viewWorldPositionLocation =
    +    gl.getUniformLocation(program, "u_viewWorldPosition");

    ...

    // Матрица камеры
    var camera = [100, 150, 200];
    var target = [0, 35, 0];
    var up = [0, 1, 0];
    var cameraMatrix = makeLookAt(camera, target, up);

    +// Положение камеры/наблюдателя
    +gl.uniform3fv(viewWorldPositionLocation, camera);


И вот наш результат:

{{{example url="../webgl-3d-lighting-point-specular.html" }}}

**ТЫСЯЧА ЧЕРТЕЙ, КАК ЖЕ ЯРКО!**

Мы можем укротить яркость, возведя результат скалярного произведения
в степень. Это сузит блики и приведёт график от линейного к
экспоненциальному.

{{{diagram url="resources/power-graph.html" width="300" height="300" className="noborder" }}}

Чем ближе красная линия к верхнему краю графика, тем ярче будут блики.
С увеличением степени уменьшается диапазон ярких бликов, прижимаясь к
правому краю.

Назовём эту степень `shininess` и добавим её в наш шейдер.

    uniform vec4 u_color;
    +uniform float u_shininess;

    ...

    -  float specular = dot(normal, halfVector);
    +  float specular = 0.0;
    +  if (light > 0.0) {
    +    specular = pow(dot(normal, halfVector), u_shininess);
    +  }

Скалярное произведение может принимать отрицательные значения. Возведение
в степень негативного значения не определено в WebGL, что не очень-то хорошо.
Поэтому в случае отрицательного значения мы просто задаём ему значение 0.0.

Само собой, нам нужно получить ссылку на переменную и задать ей значение

    +var shininessLocation = gl.getUniformLocation(program, "u_shininess");

    ...

    // установка степени яркости
    gl.uniform1f(shininessLocation, shininess);

И вот результат

{{{example url="../webgl-3d-lighting-point-specular-power.html" }}}

Последнее, о чём бы я хотел поговорить в этой статье, - это цвета света.

До этого момента мы умножали `light` на цвет буквы F. Но мы также могли
бы задать цвет самого источника света, если бы нам было нужно цветное
освещение.

    uniform vec4 u_color;
    uniform float u_shininess;
    +uniform vec3 u_lightColor;
    +uniform vec3 u_specularColor;

    ...

      // Умножаем только значение цвета (без прозрачности)
      // на значение света
    *  gl_FragColor.rgb *= light * u_lightColor;

      // Просто добавляем блики
    *  gl_FragColor.rgb += specular * u_specularColor;
    }

и конечно же

    +  var lightColorLocation =
    +      gl.getUniformLocation(program, "u_lightColor");
    +  var specularColorLocation =
    +      gl.getUniformLocation(program, "u_specularColor");

и

    // задаём цвет освещения
    +  gl.uniform3fv(lightColorLocation, m4.normalize([1, 0.6, 0.6]));  // красный свет
    // заадаём цвет бликов
    +  gl.uniform3fv(specularColorLocation, m4.normalize([1, 0.6, 0.6]));  // красный свет

{{{example url="../webgl-3d-lighting-point-color.html" }}}

Далее в программе - [прожектор](webgl-3d-lighting-spot.html).

<div class="webgl_bottombar">
<h3>Почему <code>pow(negative, power)</code> не определено?</h3>
<p>Что означает следующее?</p>
<div class="webgl_center"><pre class="glocal-center-content">pow(5, 2)</pre></div>
<p>Это можно представить как</p>
<div class="webgl_center"><pre class="glocal-center-content">5 * 5 = 25</pre></div>
<p>А что насчёт?</p>
<div class="webgl_center"><pre class="glocal-center-content">pow(5, 3)</pre></div>
<p>Аналогично, можно выразить как</p>
<div class="webgl_center"><pre class="glocal-center-content">5 * 5 * 5 = 125</pre></div>
<p>Хорошо, тогда</p>
<div class="webgl_center"><pre class="glocal-center-content">pow(-5, 2)</pre></div>
<p>можно выразить как</p>
<div class="webgl_center"><pre class="glocal-center-content">-5 * -5 = 25</pre></div>
<p>а</p>
<div class="webgl_center"><pre class="glocal-center-content">pow(-5, 3)</pre></div>
<p>примет вид</p>
<div class="webgl_center"><pre class="glocal-center-content">-5 * -5 * -5 = -125</pre></div>
<p>Насколько вам известно, умножение отрицательного числа на отрицательное даёт положетильное.
Умножение ещё раз на отрицательное даст отрицательное.</p>
<p>Но в таком случае что будет означать следующее выражение?</p>
<div class="webgl_center"><pre class="glocal-center-content">pow(-5, 2.5)</pre></div>
<p>Как понять, будет ли результат положительным или отрицательным? Это относится к области
<a href="https://betterexplained.com/articles/a-visual-intuitive-guide-to-imaginary-numbers/">мнимых чисел</a>.</p>
</div>

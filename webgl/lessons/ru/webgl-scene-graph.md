Title: WebGL - Графы сцены
Description: Что такое граф сцены, и для чего он используется
TOC: WebGL - Графы сцены


Эта статья продолжает серию, которая начинается с [Основ WebGL](webgl-fundamentals.html).
Если вы ещё не читали предыдущие статьи, предлагаю прочесть по крайней мере первую
из них, а потом вернуться сюда.

Уверен, что специалисты компьютерных наук или графики будут меня осуждать,
но... Граф сцены - это обычно дерево, где каждая вершина генерирует матрицу...
Хм, не очень-то полезное определение. Вероятно, примеры будут полезней.

Большинство 3D-движков используют графы сцены. Вы помещаете в граф сцены
объекты, которые вы хотите видеть. Движок обходит дерево и получает список
объектов для отрисовки. Графы сцены - иерархические, поэтому если, к примеру,
вы захотите создать макет вселенной, у вас может получиться граф, похожий
на такой:

{{{diagram url="resources/planet-diagram.html" height="500" }}}

В чём смысл графа сцены? В первую очередь граф сцены обеспечивает связь
родитель-потомок в матрицах, [которые были рассмотрены в статье о
2D-матрицах](webgl-2d-matrices.html). Для примера рассмотрим простую
(и нереалистичную) модель вселенной, где звёзды (потомки) перемещаются
по галактике (родитель). Аналогично луна (потомок) вращается вокруг своей
планеты (родитель). Если сдвинуть Землю, Луна тоже переместится. А если
переместить галактику, то сдвинутся и все звёзды внутри неё. Потяните за
узлы графа выше и вы поймёте отношения между ними.

Если вы вернётесь к [математике 2D-матриц](webgl-2d-matrices.html), вы можете
вспомнить, что мы умножали матрицы для выполнения переноса, поворота и
масштабирования объектов. А структура графа сцены позволяет помочь с выбором
матрицы, которую необходимо применить к тому или иному объекту.

Обычно каждый `узел` в графе сцены представляет собой *локальное пространство*.
При использовании верной матрицы объекты *локального пространства* могут
игнорировать всё, что находится выше по графу. Другими словами, Луну должно
заботить только вращение вокруг Земли. Вращение вокруг Солнца - это уже не
её дело. Без структуры графа сцены вам пришлось бы рассчитывать гораздо более
сложную математику для вычисления орбиты Луны относительно Солнца, потому что
эта орбита выглядит следующим образом:

{{{diagram url="resources/moon-orbit.html" }}}

С использованием графа сцены вам нужно просто сделать Луну потомком Земли, а
затем построить орбиту вокруг Земли, это просто. Граф сцены сам позаботится о
том, что Земля вращается вокруг Солнца. Это происходит за счёт обхода по узлам
графа и за счёт умножения матриц при обходе.

    worldMatrix = greatGrandParent * grandParent * parent * self(localMatrix)

На конкретном примере нашей вселенной получится

    worldMatrixForMoon = galaxyMatrix * starMatrix * planetMatrix * moonMatrix;

Мы можем очень просто добиться такого поведения через рекурсивную функцию

    function computeWorldMatrix(currentNode, parentWorldMatrix) {
        // вычисляем нашу мировую матрицу через умножение
        // локальной матрицы на мировую матрицу родителя
        var worldMatrix = m4.multiply(parentWorldMatrix, currentNode.localMatrix);

        // затем выполняем то же самое для всех потомков
        currentNode.children.forEach(function(child) {
            computeWorldMatrix(child, worldMatrix);
        });
    }

Обозначим терминологию, которая достаточно распространена для графа сцены в 3D.

*   `localMatrix`: Локальная матрица текущей вершины. Она преобразует саму
    вершину и её потомков в локальное пространство с центром в этой вершине.

*   `worldMatrix`: Для данной вершины всё, что находится в локальном пространстве,
    преобразовывается в пространство корневой вершины графа сцены. Другими словами,
    всё помещается в мировое пространство. Если мы вычислим worldMatrix для
    Луны, мы получим эту причудливую орбиту, которую вы видели на картинке выше.

Граф сцены сделать достаточно просто. Определим объект `Node`. Есть несметное
количество путей для организации графа сцены, и я не могу сказать, какой из
них лучший. Наиболее распространён способ, когда у вас есть необязательное поле
для хранения объектов, которые будут добавляться на сцену.

    var node = {
       localMatrix: ...,  // локальная матрица данной вершины
       worldMatrix: ...,  // мировая матрица данной вершины
       children: [],      // массив дочерних элементов
       thingToDraw: ??,   // объекты для отрисовки
    };

Давайте создадим граф сцены для солнечной системы. Я не буду использовать
текстуры и другие подобные вещи, так как это отвлечёт нас от основной темы.
Для начала обзаведёмся функциями для управления вершинами. Первое, что нам
понадобится - класс вершины.

    var Node = function() {
      this.children = [];
      this.localMatrix = m4.identity();
      this.worldMatrix = m4.identity();
    };

Создадим сеттер для родителя вершины.

    Node.prototype.setParent = function(parent) {
      // открепляемся от текущего родителя
      if (this.parent) {
        var ndx = this.parent.children.indexOf(this);
        if (ndx >= 0) {
          this.parent.children.splice(ndx, 1);
        }
      }

      // прикрепляемся к новому родительскому узлу
      if (parent) {
        parent.children.append(this);
      }
      this.parent = parent;
    };

Далее - код для вычисления мировых матриц из локальных матриц на основании
положения вершины в иерархии. Если мы начнём с родителя и рекурсивно обойдём
всех потомков, мы получим их мировые матрицы. Если математика матриц вам
непонятна, [советую начать со статьи про неё](webgl-2d-matrices.html).

    Node.prototype.updateWorldMatrix = function(parentWorldMatrix) {
      if (parentWorldMatrix) {
        // матрица была передана, поэтому выполняем умножение
        // и сохраняем результат в `this.worldMatrix`
        m4.multiply(this.localMatrix, parentWorldMatrix, this.worldMatrix);
      } else {
        // матрица не передана, поэтому просто используем
        // localMatrix в качестве мировой матрицы worldMatrix
        m4.copy(this.localMatrix, this.worldMatrix);
      }

      // повторяем для всех потомков
      var worldMatrix = this.worldMatrix;
      this.children.forEach(function(child) {
        child.updateWorldMatrix(worldMatrix);
      });
    };

Для простоты возьмём только Солнце, Землю и Луну. Мы не будем сохранять
пропорции в значениях расстояний между объектами, иначе объекты не
поместятся на экране. У нас будет простая сферическая модель жёлтого цвета
для Солнца, зелёно-голубая сфера для Земли и серая сфера для Луны.
Если `drawInfo`, `bufferInfo` и `programInfo` вам незнакомы, рекомендую
[ознакомиться с предыдущей статьёй](webgl-drawing-multiple-things.html).

    // создаём все вершины
    var sunNode = new Node();
    sunNode.localMatrix = m4.translation(0, 0, 0);  // в центре - Солнце
    sunNode.drawInfo = {
      uniforms: {
        u_colorOffset: [0.6, 0.6, 0, 1], // жёлтый
        u_colorMult:   [0.4, 0.4, 0, 1],
      },
      programInfo: programInfo,
      bufferInfo: sphereBufferInfo,
    };

    var earthNode = new Node();
    earthNode.localMatrix = m4.translation(100, 0, 0);  // Землю расположим в 100 единицах от Солнца
    earthNode.drawInfo = {
      uniforms: {
        u_colorOffset: [0.2, 0.5, 0.8, 1],  // зелёно-голубой
        u_colorMult:   [0.8, 0.5, 0.2, 1],
      },
      programInfo: programInfo,
      bufferInfo: sphereBufferInfo,
    };

    var moonNode = new Node();
    moonNode.localMatrix = m4.translation(20, 0, 0);  // Луну расположим в 20 единицах от Земли
    moonNode.drawInfo = {
      uniforms: {
        u_colorOffset: [0.6, 0.6, 0.6, 1],  // серый
        u_colorMult:   [0.1, 0.1, 0.1, 1],
      },
      programInfo: programInfo,
      bufferInfo: sphereBufferInfo,
    };

Установим связи между узлами.

    // connect the celestial objects
    moonNode.setParent(earthNode);
    earthNode.setParent(sunNode);

Снова создадим список объектов и список объектов для отрисовки.

    var objects = [
      sunNode,
      earthNode,
      moonNode,
    ];

    var objectsToDraw = [
      sunNode.drawInfo,
      earthNode.drawInfo,
      moonNode.drawInfo,
    ];

При рендеринге будем обновлять локальную матрицу каждого объекта,
слегка поворачивая его.

    // обновляем локальную матрицу каждого объекта
    m4.multiply(m4.yRotation(0.01), sunNode.localMatrix  , sunNode.localMatrix);
    m4.multiply(m4.yRotation(0.01), earthNode.localMatrix, earthNode.localMatrix);
    m4.multiply(m4.yRotation(0.01), moonNode.localMatrix , moonNode.localMatrix);

После того, как локальные матрицы обновлены, мы обновим все
мировые матрицы.

    sunNode.updateWorldMatrix();

Наконец, мы получили мировые матрицы, и нам нужно умножить их для получения
[матрицы worldViewProjection](webgl-3d-perspective.html) для каждого объекта.

    // получаем все матрицы для рендеринга
    objects.forEach(function(object) {
      object.drawInfo.uniforms.u_matrix = m4.multiply(viewProjectionMatrix, object.worldMatrix);
    });

Для рендеринга используется [тот же цикл, что мы использовали
в последней статье](webgl-drawing-multiple-things.html).

{{{example url="../webgl-scene-graph-solar-system.html" }}}

Все объекты у нас получились одного размера. Попробуем сделать Землю больше.

    // Землю расположим в 100 единицах от Солнца
    earthNode.localMatrix = m4.translation(100, 0, 0);
    // делаем Землю в два раза больше
    earthNode.localMatrix = m4.scale(earthNode.localMatrix, 2, 2, 2);

{{{example url="../webgl-scene-graph-solar-system-larger-earth.html" }}}

Ой, Луна тоже стала больше. Можно, конечно, вручную сделать Луну меньше.
Но лучшим решением будет добавление вершин в наш граф сцены. Вместо

      Солнце
       |
      Земля
       |
      Луна

У нас будет

     СолнечнаяСистема
       |    |
       |   Солнце
       |
     ОрбитаЗемли
       |    |
       |  Земля
       |
      ОрбитаЛуны
          |
          Луна

Это позволит Земле по-прежнему вращаться в солнечной системе, но
теперь при изменении угла вращения Солнца или его масштаба это никак не
скажется на Земле. Аналогично Земля может вращаться независимо от Луны.
Создадим вершины для `solarSystem`, `earthOrbit` и `moonOrbit`.

    var solarSystemNode = new Node();
    var earthOrbitNode = new Node();
    earthOrbitNode.localMatrix = m4.translation(100, 0, 0);  // Землю расположим в 100 единицах от Солнца
    var moonOrbitNode = new Node();
    moonOrbitNode.localMatrix = m4.translation(20, 0, 0);  // Луну расположим в 20 единицах от Земли

Эти расстояния до орбиты больше не нужны в старых вершинах

    var earthNode = new Node();
    -// Землю расположим в 100 единицах от Солнца
    -earthNode.localMatrix = m4.translation(100, 0, 0);
    -// делаем Землю в два раза больше
    -earthNode.localMatrix = m4.scale(earthNode.localMatrix, 2, 2, 2);
    +earthNode.localMatrix = m4.scaling(2, 2, 2);   // делаем Землю в два раза больше

    var moonNode = new Node();
    -moonNode.localMatrix = m4.translation(20, 0, 0);  // Луну расположим в 20 единицах от Земли

Теперь связи между ними выглядят так

    // соединяем небесные объекты
    sunNode.setParent(solarSystemNode);
    earthOrbitNode.setParent(solarSystemNode);
    earthNode.setParent(earthOrbitNode);
    moonOrbitNode.setParent(earthOrbitNode);
    moonNode.setParent(moonOrbitNode);

Теперь нам нужно обновить орбиты

    // обновляем локальную матрицу каждого объекта
    -m4.multiply(m4.yRotation(0.01), sunNode.localMatrix  , sunNode.localMatrix);
    -m4.multiply(m4.yRotation(0.01), earthNode.localMatrix, earthNode.localMatrix);
    -m4.multiply(m4.yRotation(0.01), moonNode.localMatrix , moonNode.localMatrix);
    +m4.multiply(m4.yRotation(0.01), earthOrbitNode.localMatrix, earthOrbitNode.localMatrix);
    +m4.multiply(m4.yRotation(0.01), moonOrbitNode.localMatrix, moonOrbitNode.localMatrix);

    // обновляем все мировые матрицы графа сцены
    -sunNode.updateWorldMatrix();
    +solarSystemNode.updateWorldMatrix();

Теперь Земля у нас получилась в два раза больше, а Луна осталась прежней.

{{{example url="../webgl-scene-graph-solar-system-larger-earth-fixed.html" }}}

Вы также могли заметить, что Солнце и Земля более не вращаются вместе, они независимы.

Сделаем ещё несколько улучшений

    -sunNode.localMatrix = m4.translation(0, 0, 0);  // Солнце в центре
    +sunNode.localMatrix = m4.scaling(5, 5, 5);

    ...

    +moonNode.localMatrix = m4.scaling(0.4, 0.4, 0.4);

    ...
    // обновляем локальную матрицу каждого объекта
    matrixMultiply(earthOrbitNode.localMatrix, m4.yRotation(0.01), earthOrbitNode.localMatrix);
    matrixMultiply(moonOrbitNode.localMatrix, m4.yRotation(0.01), moonOrbitNode.localMatrix);
    // вращение Солнца
    matrixMultiply(sunNode.localMatrix, m4.yRotation(0.005), sunNode.localMatrix);
    +// вращение Земли
    +m4.multiply(m4.yRotation(0.05), earthNode.localMatrix, earthNode.localMatrix);
    +// вращение Луны
    +m4.multiply(m4.yRotation(-0.01), moonNode.localMatrix, moonNode.localMatrix);

{{{example url="../webgl-scene-graph-solar-system-adjusted.html" }}}

Сейчас у нас есть `localMatrix`, и каждый кадр мы её изменяем. Однако,
здесь кроется небольшая проблема - каждый кадр мы накапливаем ошибку.
Есть способ для устранения этой ошибки, который называется *ортонормализация
матрицы*, но даже он не всегда помогает. Представим, что мы масштабируем до
нуля, а затем обратно. Возьмём только значение `x`

    x = 246;       // кадр #0, x = 246

    scale = 1;
    x = x * scale  // кадр #1, x = 246

    scale = 0.5;
    x = x * scale  // кадр #2, x = 123

    scale = 0;
    x = x * scale  // кадр #3, x = 0

    scale = 0.5;
    x = x * scale  // кадр #4, x = 0  ОЙ!

    scale = 1;
    x = x * scale  // кадр #5, x = 0  ОЙ!

Мы потеряли своё значение. Можно исправить ситуацию через добавление ещё одного
класса, который обновляет матрицу из других значений. Определим `Node`, чтобы у
него был `source`. Если он существует, попросим `source` дать нам локальную матрицу.

    *var Node = function(source) {
      this.children = [];
      this.localMatrix = m4.identity();
      this.worldMatrix = m4.identity();
    +  this.source = source;
    };

    Node.prototype.updateWorldMatrix = function(matrix) {

    +  var source = this.source;
    +  if (source) {
    +    source.getMatrix(this.localMatrix);
    +  }

      ...

Теперь создадим источник (source). Обычно источник определяет перенос,
поворот и масштабирование примерно следующим образом

    var TRS = function() {
      this.translation = [0, 0, 0];
      this.rotation = [0, 0, 0];
      this.scale = [1, 1, 1];
    };

    TRS.prototype.getMatrix = function(dst) {
      dst = dst || new Float32Array(16);
      var t = this.translation;
      var r = this.rotation;
      var s = this.scale;

      // вычисляем матрицу по переносу, повороту и масштабированию
      m4.translation(t[0], t[1], t[2], dst);
      matrixMultiply(m4.xRotation(r[0]), dst, dst);
      matrixMultiply(m4.yRotation(r[1]), dst, dst);
      matrixMultiply(m4.zRotation(r[2]), dst, dst);
      matrixMultiply(m4.scaling(s[0], s[1], s[2]), dst, dst);
      return dst;
    };

Теперь можно использовать источник

    // при инициализации создаём вершину с источником
    var someTRS  = new TRS();
    var someNode = new Node(someTRS);

    // при рендеринге
    someTRS.rotation[2] += elapsedTime;

Теперь проблема ушла, так как мы каждый раз пересоздаём матрицу.

Возможно, вы думаете "Я не собирался делать солнечную систему, зачем мне
всё это?". Ну, вы могли бы использовать следующий граф сцены для
создания анимации человека.

{{{diagram url="resources/person-diagram.html" height="400" }}}

Сколько вы добавите суставов для конечностей и пальцев - зависит только
от вас. Чем больше суставов, тем больше ресурсов нужно для вычислений и
анимации, и тем больше анимационных данных необходимо для всех этих
суставов. В старых играх вроде Virtua Fighter было около 15 суставов. Игры
в начале и середине 2000-х содержали от 30 до 70 суставов. Если вы сделаете
каждый сустав на руках, получится по крайней мере 20 на каждой руке,
соответственно 40 суставов для 2 рук. Многие игры для анимации рук считают
большой палец отдельным пальцем, а четыре других пальца - одним единым
пальцем, чтобы сэкономить время (как художника, так и процессора/видеокарты)
и память.

Так или иначе, посмотрите на парня из блоков, которого я смастерил. В нём
используется источник `TRS`, о котором я говорил выше. Искусство и анимация
от программиста, это победа! :P

{{{example url="../webgl-scene-graph-block-guy.html" }}}

На какую бы 3D-библиотеку вы не взглянули, в ней вы найдёте похожий граф сцены.

<div class="webgl_bottombar">
<h3>SetParent против AddChild / RemoveChild</h3>
<p>Многие графы сцены содержат функции <code>node.addChild</code> и <code>node.removeChild</code>,
но я использую функцию <code>node.setParent</code>. Какой из этих подходов лучше - дело
вкуса, однако я приведу одну причину, когда <code>setParent</code> лучше, чем <code>addChild</code> -
при его использовании невозможно написать следующий неоднозначный код.</p>
<pre class="prettyprint">
    someParent.addChild(someNode);
    ...
    someOtherParent.addChild(someNode);
</pre>
<p>Что означает этот код? Что <code>someNode</code> добавляется и в <code>someParent</code>,
и в <code>someOtherParent</code>? Но в большинстве графов сцены это невозможно. Тогда при выполнении
этого кода должна возникнуть ошибка <code>ОШИБКА: Родитель уже задан</code>? Или же <code>someNode</code>
магическим образом открепится от родителя <code>someParent</code> и прикрепится к родителю
<code>someOtherParent</code>? Из названия функции <code>addChild</code> нам это остаётся непонятным.</p>
<p>В <code>setParent</code> такой проблемы нет.</p>
<pre class="prettyprint">
    someNode.setParent(someParent);
    ...
    someNode.setParent(someOtherParent);
</pre>
<p>
На 100% понятно, что здесь происходит. Никакой неопределённости.
</p>
</div>

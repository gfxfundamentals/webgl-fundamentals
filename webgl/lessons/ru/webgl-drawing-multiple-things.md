Title: WebGL - Отрисовка нескольких объектов
Description: Отображение различных объектов в WebGL
TOC: WebGL - Отрисовка нескольких объектов


Эта статья продолжает серию, которая начинается с [Основ WebGL](webgl-fundamentals.html).
Если вы ещё не читали предыдущие статьи, предлагаю прочесть по крайней мере первую
из них, а потом вернуться сюда.

Один из самых распространённых вопросов после первых успехов в WebGL -
как отобразить несколько объектов.

Нужно понимать, что за редким исключением WebGL похож на функцию, где
вместо того, чтобы один раз вызвать функцию с кучей параметров, у нас
на руках есть больше 70 функций, которые подготавливают состояние
для этой единственной функции. Для примера представьте, что вам нужна
функция для отрисовки окружности. Вы могли бы написать что-то вроде

    function drawCircle(centerX, centerY, radius, color) { ... }

Или же такой вариант.

    var centerX;
    var centerY;
    var radius;
    var color;

    function setCenter(x, y) {
       centerX = x;
       centerY = y;
    }

    function setRadius(r) {
       radius = r;
    }

    function setColor(c) {
       color = c;
    }

    function drawCircle() {
       ...
    }

WebGL работает по второму сценарию. Через функции `gl.createBuffer`,
`gl.bufferData`, `gl.createTexture` и `gl.texImage2D` вы можете загрузить
данные буферов (вершины) и текстур (цвета и прочее) в WebGL. Через функции
`gl.createProgram`, `gl.createShader`, `gl.compileProgram` и `gl.linkProgram`
вы можете создать шейдеры GLSL. Практически все из оставшихся функций WebGL
устанавливают глобальные переменные или *состояние*, которое используется
при вызове функции `gl.drawArrays` или `gl.drawElements`.

Исходя из вышесказанного типичная программа WebGL придерживается следующей структуры:

При инициализации

*   создаются все шейдеры и программы, получаются ссылки на переменные;
*   создаются буферы и загружаются данные вершин;
*   создаются текстуры и загружаются текстурные данные.

При рендеринге

*   очищаем и устанавливаем область просмотра и другие глобальные
    переменные (включение проверки глубины, отбраковки и других);
*   Для каждого объекта, который будем отрисовывать:
    *   устанавливаем активную программу через `gl.useProgram`;
    *   настраиваем атрибуты:
        *   для каждого атрибута вызываем `gl.bindBuffer`,
            `gl.vertexAttribPointer`, `gl.enableVertexAttribArray`;
    *   настраиваем uniform-переменные:
        *   для каждой переменной вызываем `gl.uniformXXX`;
        *   вызываем `gl.activeTexture` и `gl.bindTexture` для привязки
            текстур к текстурным блокам;
    *   вызываем `gl.drawArrays` или `gl.drawElements`.

Вот, собственно, и всё. От вас уже зависит, как организовать свой
код, чтобы выполнить этот сценарий.

Некоторые данные (например, данные текстур или даже вершин) могут передаваться
асинхронно и нужно дождаться, пока они загрузятся по сети.

Сделаем простое приложение, которое отобразит 3 объекта - куб, сферу и конус.

Не буду углубляться в детали вычисления координат куба, сферы и конуса.
Просто предположим, что у нас есть функции для создания этих 3 объектов,
которые вернут [объекты bufferInfo, рассмотренные в предыдущей
статье](webgl-less-code-more-fun.html).

Итак, код. Наш шейдер практически не изменился с последнего
[примера о перспективе](webgl-3d-perspective.html), за исключением того,
что добавился `u_colorMult`, на который умножатся цвета вершин.

    // Передаётся из вершинного шейдера
    varying vec4 v_color;

    uniform vec4 u_colorMult;

    void main() {
       gl_FragColor = v_color * u_colorMult;
    }


При инициализации:

    // uniform-переменные для каждого отображаемого объекта
    var sphereUniforms = {
      u_colorMult: [0.5, 1, 0.5, 1],
      u_matrix: m4.identity(),
    };
    var cubeUniforms = {
      u_colorMult: [1, 0.5, 0.5, 1],
      u_matrix: m4.identity(),
    };
    var coneUniforms = {
      u_colorMult: [0.5, 0.5, 1, 1],
      u_matrix: m4.identity(),
    };

    // Перенос каждого объекта
    var sphereTranslation = [  0, 0, 0];
    var cubeTranslation   = [-40, 0, 0];
    var coneTranslation   = [ 40, 0, 0];

При рендеринге:

    var sphereXRotation =  time;
    var sphereYRotation =  time;
    var cubeXRotation   = -time;
    var cubeYRotation   =  time;
    var coneXRotation   =  time;
    var coneYRotation   = -time;

    // ------ Отрисовка сферы --------

    gl.useProgram(programInfo.program);

    // Устанавливаем все необходимые атрибуты
    webglUtils.setBuffersAndAttributes(gl, programInfo, sphereBufferInfo);

    sphereUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        sphereTranslation,
        sphereXRotation,
        sphereYRotation);

    // Устанавливаем рассчитанные uniform-переменные
    webglUtils.setUniforms(programInfo, sphereUniforms);

    gl.drawArrays(gl.TRIANGLES, 0, sphereBufferInfo.numElements);

    // ------ Отрисовываем куб --------

    // Устанавливаем все необходимые атрибуты
    webglUtils.setBuffersAndAttributes(gl, programInfo, cubeBufferInfo);

    cubeUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        cubeTranslation,
        cubeXRotation,
        cubeYRotation);

    // Устанавливаем рассчитанные uniform-переменные
    webglUtils.setUniforms(programInfo, cubeUniforms);

    gl.drawArrays(gl.TRIANGLES, 0, cubeBufferInfo.numElements);

    // ------ Отрисовываем конус --------

    // Устанавливаем все необходимые атрибуты
    webglUtils.setBuffersAndAttributes(gl, programInfo, coneBufferInfo);

    coneUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        coneTranslation,
        coneXRotation,
        coneYRotation);

    // Устанавливаем рассчитанные uniform-переменные
    webglUtils.setUniforms(programInfo, coneUniforms);

    gl.drawArrays(gl.TRIANGLES, 0, coneBufferInfo.numElements);

И вот результат.

{{{example url="../webgl-multiple-objects-manual.html" }}}

Заметьте, что мы вызываем `gl.useProgram` лишь один раз, так как у нас
есть всего одна шейдерная программа. Если бы у нас было несколько шейдерных
программ, нам бы потребовалось вызывать `gl.useProgram` перед... эм...
использованием каждой программы.

Есть ещё одно место, где не помешало бы упрощение. По сути есть
3 основных вещи, которые можно объединить.

1.  Шейдерная программа (и её сеттеры атрибутов и uniform-переменных);
2.  Буфер и атрибуты рисуемого объекта;
3.  uniform-переменные, необходимые для отрисовки объекта через данный шейдер.

Небольшим упрощением будет создание массива объектов для отрисовки и
помещением в него 3 наших объектов.

    var objectsToDraw = [
      {
        programInfo: programInfo,
        bufferInfo: sphereBufferInfo,
        uniforms: sphereUniforms,
      },
      {
        programInfo: programInfo,
        bufferInfo: cubeBufferInfo,
        uniforms: cubeUniforms,
      },
      {
        programInfo: programInfo,
        bufferInfo: coneBufferInfo,
        uniforms: coneUniforms,
      },
    ];

При отрисовке нам нужно обновить матрицы

    var sphereXRotation =  time;
    var sphereYRotation =  time;
    var cubeXRotation   = -time;
    var cubeYRotation   =  time;
    var coneXRotation   =  time;
    var coneYRotation   = -time;

    // Задаём матрицы для каждого объекта
    sphereUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        sphereTranslation,
        sphereXRotation,
        sphereYRotation);

    cubeUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        cubeTranslation,
        cubeXRotation,
        cubeYRotation);

    coneUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        coneTranslation,
        coneXRotation,
        coneYRotation);

И теперь код отрисовки - это просто цикл

    // ------ Отрисовка объектов --------

    objectsToDraw.forEach(function(object) {
      var programInfo = object.programInfo;
      var bufferInfo = object.bufferInfo;

      gl.useProgram(programInfo.program);

      // Устанавливаем все необходимые атрибуты
      webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);

      // Задаём uniform-переменные
      webglUtils.setUniforms(programInfo, object.uniforms);

      // Отрисовываем
      gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
    });



И это, вероятно, основной цикл отрисовки большинства существующих 3D-движков.
Где-то в другом месте код решает, что будет передано в массив `objectsToDraw`,
но в целом схема такова.

{{{example url="../webgl-multiple-objects-list.html" }}}

Есть ещё несколько оптимизаций. Если программа для текущей отрисовки не
изменилась с предыдущей отрисовки, нам не нужно вызывать `gl.useProgram`.
Аналогично, если мы отрисовываем тот же объект/геометрию/вершину, нам
не нужно устанавливать их снова.

Очень простая оптимизация может выглядеть следующим образом:

    var lastUsedProgramInfo = null;
    var lastUsedBufferInfo = null;

    objectsToDraw.forEach(function(object) {
      var programInfo = object.programInfo;
      var bufferInfo = object.bufferInfo;
      var bindBuffers = false;

      if (programInfo !== lastUsedProgramInfo) {
        lastUsedProgramInfo = programInfo;
        gl.useProgram(programInfo.program);

        // Нам нужно перепривязать буферы при изменении программы, так как
        // в программе используются только текущие буферы. Поэтому когда 2
        // программы используют один bufferInfo, и первая из них использует
        // только координаты, то при переключении на вторую программу
        // некоторые атрибуты не будут включены.
        bindBuffers = true;
      }

      // Устанавливаем все необходимые атрибуты
      if (bindBuffers || bufferInfo != lastUsedBufferInfo) {
        lastUsedBufferInfo = bufferInfo;
        webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      }

      // Задаём uniform-переменные
      webglUtils.setUniforms(programInfo, object.uniforms);

      // Отрисовываем
      gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
    });

А теперь давайте создадим много объектов. Вместо 3 объектов мы сделаем
значительно больший массив объектов.

    // записываем фигуры в массив, чтобы было проще выбрать случайную
    var shapes = [
      sphereBufferInfo,
      cubeBufferInfo,
      coneBufferInfo,
    ];

    // создаём два списка объектов - один для отрисовки, один для управления
    var objectsToDraw = [];
    var objects = [];

    // Uniform-переменные для каждого объекта
    var numObjects = 200;
    for (var ii = 0; ii < numObjects; ++ii) {
      // Выбираем фигуру
      var bufferInfo = shapes[rand(0, shapes.length) | 0];

      // Создаём объект
      var object = {
        uniforms: {
          u_colorMult: [rand(0, 1), rand(0, 1), rand(0, 1), 1],
          u_matrix: m4.identity(),
        },
        translation: [rand(-100, 100), rand(-100, 100), rand(-150, -50)],
        xRotationSpeed: rand(0.8, 1.2),
        yRotationSpeed: rand(0.8, 1.2),
      };
      objects.push(object);

      // Добавляем его в массив объектов для отрисовки
      objectsToDraw.push({
        programInfo: programInfo,
        bufferInfo: bufferInfo,
        uniforms: object.uniforms,
      });
    }

При рендеринге

    // Вычисляем матрицы для каждого объекта
    objects.forEach(function(object) {
      object.uniforms.u_matrix = computeMatrix(
          viewMatrix,
          projectionMatrix,
          object.translation,
          object.xRotationSpeed * time,
          object.yRotationSpeed * time);
    });

Затем отрисовываем объекты с помощью описанного выше цикла отрисовки.

{{{example url="../webgl-multiple-objects-list-optimized.html" }}}

Вы также можете отсортировать массив по `programInfo` и/или `bufferInfo`,
чтобы оптимизация срабатывала намного чаще. Большая часть игровых движков
именно так и делает. К сожалению, это не так-то просто. Если все объекты
непрозрачные, то подойдёт простая сортировка. Но если вам нужны полупрозрачные
объекты, порядок будет отличаться. Создаётся один массив для непрозрачных
объектов. Второй - для прозрачных. Массив с непрозрачными объектами сортируется
по программе и геометрии. Массив с прозрачными объектами сортируется по глубине.
Кроме этих массивов могут существовать и другие - например, для наложений
или для пост-эффектов.

<a href="../webgl-multiple-objects-list-optimized-sorted.html"
target="_blank">Вот пример с сортировкой</a>. На моём компьютере выдаёт
~31fps на несортированном списке и ~37 на сортированном. Это около 20%
прироста. Но это худший пример против лучшего, у большинства программ
логика гораздо сложнее, поэтому о подобной оптимизации стоит задумываться
только в отдельных случаях.

Стоит заметить, что нельзя просто так отрисовать любую геометрию с помощью
любого шейдера. Например, шейдер, в котором идёт работа с нормалями, не
будет работать с геометрией без нормалей. Аналогично, шейдер, в котором
есть работа с текстурами, не будет работать без текстур.

Это одна из многих причин, по которой лучше выбрать 3D-библиотеку вроде
[Three.js](https://threejs.org), так как она сделает всё за вас. Вы
создаёте геометрию, сообщаете three.js, как её нужно отрисовать и
библиотека создаёт шейдеры во время выполнения, чтобы покрыть все ваши
запросы. Практически все 3D-движки обладают подобными возможностями -
начиная от Unity3D и заканчивая движками Unreal, Source и Crytek.
Некоторые из них генерируют шейдеры автономно, но главное здесь то, что
они *генерируют* их.

Само собой, вы читаете эту статью, потому что хотите знать, что происходит
на нижнем уровне. Это замечательно и интересно писать всё самому. Просто
помните, что [WebGL очень низкоуровневый](webgl-2d-vs-3d-library.html),
поэтому вам придётся самому сделать тонну работы, включая написание
генератора шейдеров, потому что разные свойства требуют разных шейдеров.

Обратите внимание, что я не внёс `computeMatrix` внутрь цикла. Потому что
я считаю, что рендеринг должен быть отделён от вычисления матриц.
Общепринятым подходом является вычисление матриц из
[графа сцен, который мы рассмотрим в следующей статье](webgl-scene-graph.html).

Ну а теперь, когда у нас есть основа для отрисовки нескольких объектов,
[добавим текст на сцену](webgl-text-html.html).

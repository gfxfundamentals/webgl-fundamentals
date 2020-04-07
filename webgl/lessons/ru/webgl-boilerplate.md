Title: Шаблон WebGL
Description: Шаблон кода, который понадобится в каждой программе WebGL
TOC: Шаблон WebGL


Эта статья продолжает <a href="webgl-fundamentals.html">основы WebGL</a>.
Порой WebGL кажется сложным для изучения из-за того, что большинство уроков
пытаются охватить сразу всё. Я попробую по возможности избежать этого и
разбить всё на небольшие кусочки.

Одна из причин сложности WebGL заключается в двух небольших функциях -
в вершинном и фрагментном шейдерах. Эти две функции обычно выполняются на
видеокарте, поэтому они выполняются так быстро. По этой же причине они
написаны на специальном языке, который понимает видеокарта. Эти 2 функции
необходимо скомпилировать и скомпоновать. В 99% случаев этот процесс будет
одинаковым в каждой программе WebGL.

Вот шаблон для компиляции шейдера.

    /**
     * Создание и компиляция шейдера
     *
     * @param {!WebGLRenderingContext} gl Контекст WebGL
     * @param {string} shaderSource Исходный код шейдера на языке GLSL
     * @param {number} shaderType Тип шейдера, VERTEX_SHADER или FRAGMENT_SHADER.
     * @return {!WebGLShader} Шейдер
     */
    function compileShader(gl, shaderSource, shaderType) {
      // создаём объект шейдера
      var shader = gl.createShader(shaderType);

      // устанавливаем исходный код шейдера
      gl.shaderSource(shader, shaderSource);

      // компилируем шейдер
      gl.compileShader(shader);

      // проверяем результат компиляции
      var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (!success) {
        // Ошибка! Что-то не так на этапе компиляции
        throw "компиляция шейдера не удалась:" + gl.getShaderInfoLog(shader);
      }

      return shader;
    }

И шаблон кода для компоновки 2 шейдеров в программу

    /**
     * Создаём программу из 2 шейдеров
     *
     * @param {!WebGLRenderingContext) gl Контекст WebGL
     * @param {!WebGLShader} vertexShader Вершинный шейдер
     * @param {!WebGLShader} fragmentShader Фрагментный шейдер
     * @return {!WebGLProgram} Программа
     */
    function createProgram(gl, vertexShader, fragmentShader) {
      // создаём программу
      var program = gl.createProgram();

      // прикрепляем шейдеры
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);

      // компонуем программу
      gl.linkProgram(program);

      // проверяем результат компоновки
      var success = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (!success) {
          // что-то пошло не так на этапе компоновки
          throw ("ошибка компоновки программы:" + gl.getProgramInfoLog (program));
      }

      return program;
    };

Вы можете изменить обработку ошибок. Возможно, генерация исключения будет
не лучшим решением. Но всё же, в целом, этот фрагмент кода практически везде
будет одинаковым.

Мне нравится хранить код шейдеров тегах &lt;script&gt;. Их так легче
редактировать. Поэтому я использую следующий код:

    /**
     * Создание шейдера из содержимого тега
     *
     * @param {!WebGLRenderingContext} gl Контекст WebGL
     * @param {string} scriptId Атрибут id тега скрипта
     * @param {string} opt_shaderType Тип создаваемого шейдера.
     *     Если не передан, будет использован атрибут тега type
     * @return {!WebGLShader} Шейдер
     */
    function createShaderFromScript(gl, scriptId, opt_shaderType) {
      // находим тег скрипта по его id
      var shaderScript = document.getElementById(scriptId);
      if (!shaderScript) {
        throw("*** Ошибка: не найден тег скрипта" + scriptId);
      }

      // получаем содержимое тега скрипта
      var shaderSource = shaderScript.text;

      // Если тип не передан, используем атрибут тега 'type'
      if (!opt_shaderType) {
        if (shaderScript.type == "x-shader/x-vertex") {
          opt_shaderType = gl.VERTEX_SHADER;
        } else if (shaderScript.type == "x-shader/x-fragment") {
          opt_shaderType = gl.FRAGMENT_SHADER;
        } else if (!opt_shaderType) {
          throw("*** Ошибка: не задан тип шейдера");
        }
      }

      return compileShader(gl, shaderSource, opt_shaderType);
    };

Теперь для компиляции шейдера мне нужно лишь

    var shader = compileShaderFromScript(gl, "someScriptTagId");

Обычно я захожу немного дальше и создаю функцию для компиляции двух шейдеров
из тега скрипта, прикрепления их к программе и их компоновки

    /**
     * Создание программы из 2 тегов скриптов
     *
     * @param {!WebGLRenderingContext} gl Контекст WebGL
     * @param {string[]} shaderScriptIds Массив идентификаторов
              тегов  шейдеров. Первым передаётся вершинный шейдер,
              вторым - фрагментный шейдер.
     * @return {!WebGLProgram} Программа
     */
    function createProgramFromScripts(
        gl, shaderScriptIds) {
      var vertexShader = createShaderFromScript(gl, shaderScriptIds[0], gl.VERTEX_SHADER);
      var fragmentShader = createShaderFromScript(gl, shaderScriptIds[1], gl.FRAGMENT_SHADER);
      return createProgram(gl, vertexShader, fragmentShader);
    }

Кроме того практически в каждой программе WebGL я использую код для изменения
размера canvas. Вы можете [посмотреть реализацию функции здесь](webgl-resizing-the-canvas.html).

Во всех примерах эти две фунцкии подключаются через

    <script src="resources/webgl-utils.js"></script>

и используются следующим образом

    var program = webglUtils.createProgramFromScripts(
      gl, [idOfVertexShaderScript, idOfFragmentShaderScript]);

    ...

    webglUtils.resizeCanvasToMatchDisplaySize(canvas);

Мне кажется, что лучше не загромождать примеры одним и тем же кодом, если
он используется описанным в этой статье способом.

Это практически и весь мой необходимый минимум шаблона кода WebGL.
[Код `webgl-utils.js` вы сможете найти здесь](../resources/webgl-utils.js).
Если вам нужно что-то более структурированное, посмотрите на [TWGL.js](https://twgljs.org).

Оставшаяся часть, которая делает WebGL сложным, - это настройка всех входных
переменных шейдера. Посмотрите на статью <a href="webgl-how-it-works.html">как работает WebGL</a>.

Также предлагаю прочесть [Меньше кода, больше веселья](webgl-less-code-more-fun.html) и взглянуть на [TWGL](https://twgljs.org).

Обратите внимание, что есть ещё несколько скриптов, предназначенных для схожих целей.


*   [`webgl-lessons-ui.js`](../resources/webgl-lessons-ui.js)

    Код, обновляющий сцену согласно слайдерам. Не хотелось захламлять подобным
    кодом статьи, поэтому код вынесен в отдельный файл.

*   [`lessons-helper.js`](../resources/lessons-helper.js)

    Этот скрипт нужен только для webglfundmentals.org. Он помогает в выводе сообщений об
    ошибках при использовании в редакторе.

*   [`m3.js`](../resources/m3.js)

    Набор функций для 2D-математики. Они создавались, начиная с первой статьи о математике матриц.
    Поначалу они были прямо в коде статей, но со временем начали занимать слишком много места,
    поэтому в дальнейшем они подключаются через указанный скрипт.

*   [`m4.js`](../resources/m4.js)

    Набор функций для 3D-математики. Они создавались, начиная с первой статьи о 3D.
    Поначалу они были прямо в коде статей, но со временем начали занимать слишком много места,
    поэтому после второй статьи о 3D они подключаются через указанный скрипт.

Title: Шейдеры и GLSL в WebGL
Description: Что такое шейдеры и GLSL
TOC: Шейдеры и GLSL в WebGL


Это продолжение [основ WebGL](webgl-fundamentals.html).
Если вы не читали, как работает WebGL, возможно вы захотите сначала [прочитать об этом](webgl-how-it-works.html).

Мы уже упоминали о шейдерах и GLSL, но ни разу не рассматривали их подробно.
Наверное, я надеялся, что всё будет понятно из примеров, но давайте сделаем эту
тему ещё понятнее, чтобы ничего не пропустить.

Как говорилось в статье [как работает WebGL](webgl-how-it-works.html), для WebGL требуется 2 шейдера
при каждой отрисовке: *вершинный шейдер* и *фрагментный шейдер*. Каждый шейдер - это *функция*.
Вершинный и фрагментный шейдеры объединены в шейдерную программу (или просто программу). Обычно
приложение на WebGL содержит множество шейдерных программ.

## Вершинный шейдер

Задача вершинного шейдера - генерировать координаты пространства отсечения. Он всегда имеет вид

    void main() {
       gl_Position = doMathToMakeClipspaceCoordinates
    }

(doMathToMakeClipspaceCoordinates - выполнить математику для получения координат пространства отсечения, прим. пер.)

Ваш шейдер вызывается один раз для каждой вершины. И при каждом вызове вам нужно установить
специальной переменной `gl_Position` значение координат пространства отсечения.

Вершинным шейдерам нужны данные. Есть 3 способа, которыми их можно получить.

1.  [Атрибуты](#attributes) (данные берутся из буфера)
2.  [Uniform-переменные](#uniforms) (значения, постоянные для всех вершин на протяжении одного вызова отрисовки)
3.  [Текстуры](#textures-in-vertex-shaders) (данные из пикселей/текселей)

<h3 id="attributes">Атрибуты</h3>

Наиболее используемый способ - через буферы и *атрибуты*.
Статья [как работает WebGL](webgl-how-it-works.html) посвящена
буферам и атрибутам. Вы создаёте буфер

    var buf = gl.createBuffer();

записываете в него данные

    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, someData, gl.STATIC_DRAW);

Затем при инициализации вы получаете ссылку на атрибут в указанной шейдерной программе

    var positionLoc = gl.getAttribLocation(someShaderProgram, "a_position");

а во время рендеринга указываете WebGL, как нужно перенести данные из буфера в атрибут

    // включить получение данных из буфера для этого атрибута
    gl.enableVertexAttribArray(positionLoc);

    var numComponents = 3;  // (x, y, z)
    var type = gl.FLOAT;    // 32-битные числа с плавающей точкой
    var normalize = false;  // оставлять значения как есть
    var offset = 0;         // начинать с начала буфера
    var stride = 0;         // сколько байтов до следующей вершины
                            // 0 = использовать подходящий шаг для этого типа и для numComponents

    gl.vertexAttribPointer(positionLoc, numComponents, type, false, stride, offset);

В статье [как работает WebGL](webgl-fundamentals.html) мы рассматривали, что
можно не выполнять какой-либо математики и просто передать данные напрямую.

    attribute vec4 a_position;

    void main() {
       gl_Position = a_position;
    }

Если мы заполним буфер координатами пространства отсечения, это сработает.

Атрибуты могут использовать типы `float`, `vec2`, `vec3`, `vec4`, `mat2`, `mat3` и `mat4`

<h3 id="uniforms">Uniform-переменные</h3>

С точки зрения шейдера uniform-переменные - это значения, постоянные для всех
вершин на протяжении одного вызова отрисовки. В качестве простого примера рассмотрим,
как можно сделать смещение в вершинном шейдере:

    attribute vec4 a_position;
    +uniform vec4 u_offset;

    void main() {
       gl_Position = a_position + u_offset;
    }

И теперь мы можем сместить все вершины на определённое значение. Для начала получим
ссылку на uniform-переменную во время инициализации

    var offsetLoc = gl.getUniformLocation(someProgram, "u_offset");

И затем перед отрисовкой установим значение uniform-переменной

    gl.uniform4fv(offsetLoc, [1, 0, 0, 0]);  // сместить все вершины вправо на полэкрана

Обратите внимание, что uniform-переменные принадлежат конкретной шейдерной программе. Если у
вас есть несколько шейдерных программ, в которых объявлены uniform-переменные с одинаковым
именем, каждая из переменных будет иметь собственную ссылку и собственное значение. При вызове
`gl.uniform???` устанавливается значение uniform-переменной *текущей программы*. Текущая программа -
это та, которая была установлена последней через `gl.useProgram`.

Uniform-переменные могут быть многих типов. Для каждого типа вам нужно вызвать
соответствующую функцию для установки значения.

    gl.uniform1f (floatUniformLoc, v);                 // для float
    gl.uniform1fv(floatUniformLoc, [v]);               // для float или массива float
    gl.uniform2f (vec2UniformLoc,  v0, v1);            // для vec2
    gl.uniform2fv(vec2UniformLoc,  [v0, v1]);          // для vec2 или массива vec2
    gl.uniform3f (vec3UniformLoc,  v0, v1, v2);        // для vec3
    gl.uniform3fv(vec3UniformLoc,  [v0, v1, v2]);      // для vec3 или массива vec3
    gl.uniform4f (vec4UniformLoc,  v0, v1, v2, v4);    // для vec4
    gl.uniform4fv(vec4UniformLoc,  [v0, v1, v2, v4]);  // для vec4 или массива vec4

    gl.uniformMatrix2fv(mat2UniformLoc, false, [ массив из 4 элементов  ])  // для mat2 или массива mat2
    gl.uniformMatrix3fv(mat3UniformLoc, false, [ массив из 9 элементов  ])  // для mat3 или массива mat3
    gl.uniformMatrix4fv(mat4UniformLoc, false, [ массив из 16 элементов ])  // для mat4 или массива mat4

    gl.uniform1i (intUniformLoc,   v);                 // для int
    gl.uniform1iv(intUniformLoc,   [v]);               // для int или массива int
    gl.uniform2i (ivec2UniformLoc, v0, v1);            // для ivec2
    gl.uniform2iv(ivec2UniformLoc, [v0, v1]);          // для ivec2 или массива ivec2
    gl.uniform3i (ivec3UniformLoc, v0, v1, v2);        // для ivec3
    gl.uniform3iv(ivec3UniformLoc, [v0, v1, v2]);      // для ivec3 или массива ivec3
    gl.uniform4i (ivec4UniformLoc, v0, v1, v2, v4);    // для ivec4
    gl.uniform4iv(ivec4UniformLoc, [v0, v1, v2, v4]);  // для ivec4 или массива ivec4

    gl.uniform1i (sampler2DUniformLoc,   v);           // для sampler2D (текстуры)
    gl.uniform1iv(sampler2DUniformLoc, [v]);           // для sampler2D или массива sampler2D

    gl.uniform1i (samplerCubeUniformLoc,   v);         // для samplerCube (текстуры)
    gl.uniform1iv(samplerCubeUniformLoc, [v]);         // для samplerCube или массива samplerCube

Есть ещё типы `bool`, `bvec2`, `bvec3` и `bvec4`. Они используют либо функцию
`gl.uniform?f?`, либо `gl.uniform?i?`.

Отметим, что для массива вы можете установить все значения за один раз. Например,

    // в шейдере
    uniform vec2 u_someVec2[3];

    // в JavaScript при инициализации
    var someVec2Loc = gl.getUniformLocation(someProgram, "u_someVec2");

    // во время отрисовки
    gl.uniform2fv(someVec2Loc, [1, 2, 3, 4, 5, 6]);  // установить все значения массива u_someVec2

Но если вам нужно устанавливать значения элементам массива отдельно, вам нужно
получить ссылку на каждый элемент отдельно:

    // в JavaScript при инициализации
    var someVec2Element0Loc = gl.getUniformLocation(someProgram, "u_someVec2[0]");
    var someVec2Element1Loc = gl.getUniformLocation(someProgram, "u_someVec2[1]");
    var someVec2Element2Loc = gl.getUniformLocation(someProgram, "u_someVec2[2]");

    // во время отрисовки
    gl.uniform2fv(someVec2Element0Loc, [1, 2]);  // устанавливаем 0
    gl.uniform2fv(someVec2Element1Loc, [3, 4]);  // устанавливаем 1
    gl.uniform2fv(someVec2Element2Loc, [5, 6]);  // устанавливаем 2

Таким же образом при использовании структуры

    struct SomeStruct {
      bool active;
      vec2 someVec2;
    };
    uniform SomeStruct u_someThing;

вам нужно получать ссылку на каждое поле отдельно

    var someThingActiveLoc = gl.getUniformLocation(someProgram, "u_someThing.active");
    var someThingSomeVec2Loc = gl.getUniformLocation(someProgram, "u_someThing.someVec2");

<h3 id="textures-in-vertex-shaders">Текстуры в вершинном шейдере</h3>

Смотри [Текстуры во фрагментном шейдере](#textures-in-fragment-shaders).

## Фрагментный шейдер

Задача фрагментного шейдера - устанавливать цвет для текущего пикселя при растеризации.
Он всегда выглядит следующим образом:

    precision mediump float;

    void main() {
       gl_FragColor = doMathToMakeAColor;
    }

(doMathToMakeAColor - выполнить математику для получения цвета, прим. пер.)

Фрагментный шейдер вызывается один раз для каждого пикселя. Каждый раз при его вызове
вам нужно установить специальную глобальную переменную `gl_FragColor` для установки цвета.

Фрагментному шейдеру тоже нужны данные. И также есть 3 способа, которыми их можно получить.

1.  [Uniform-переменные](#uniforms-in-fragment-shaders) (значения, постоянные для всех вершин на протяжении одного вызова отрисовки)
2.  [Текстуры](#textures-in-fragment-shaders) (данные из пикселя/текселя)
3.  [Varying-переменные](#varyings) (данные передаются из вершинного шейдера и интерполируются)

<h3 id="uniforms-in-fragment-shaders">Uniform-переменные во фрагментном шейдере</h3>

Смотри [Uniform-переменные в шейдере](#uniforms).

<h3 id="textures-in-fragment-shaders">Текстуры во фрагментном шейдере</h3>

Для получения в шейдере значения из текстуры мы создаём uniform-переменную `sampler2D`
и используем функцию из GLSL по названию `texture2D` для получения значения из неё.

    precision mediump float;

    uniform sampler2D u_texture;

    void main() {
       vec2 texcoord = vec2(0.5, 0.5)  // получение значение из центра текстуры
       gl_FragColor = texture2D(u_texture, texcoord);
    }

Какие именно данные приходят из текстуры - [зависит от многих настроек](webgl-3d-textures.html).
Как минимум нам нужно создать текстуру и поместить в неё данные:

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    var level = 0;
    var width = 2;
    var height = 1;
    var data = new Uint8Array([
        255, 0, 0, 255,     // красный пиксель
        0, 255, 0, 255      // зелёный пиксель
    ]);
    gl.texImage2D(gl.TEXTURE_2D, level, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

Во время инициализации получаем ссылку на uniform-переменную в шейдерной программе

    var someSamplerLoc = gl.getUniformLocation(someProgram, "u_texture");

При рендеринге необходимо привязать её к текстурному блоку

    var unit = 5;  // выбираем текстурный блок
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);

И указать шейдеру, к какому блоку мы привязали текстуру

    gl.uniform1i(someSamplerLoc, unit);

<h3 id="varyings">Varying-переменные</h3>

С помощью varying-переменных можно передать значение из вершинного шейдера во фрагментный
шейдер, что мы рассмотрели в [Как работает WebGL](webgl-how-it-works.html).

Для использования variyng-переменной нам нужно определить её и в вершинном, и во фрагментном
шейдере. В каждой вершине в коде вершинного шейдера установится значение varying-переменной.
При отрисовке пикселей WebGL интерполирует эти значения и передаст соответствующую
varying-переменную во фрагментный шейдер.

Вершинный шейдер:

    attribute vec4 a_position;

    uniform vec4 u_offset;

    +varying vec4 v_positionWithOffset;

    void main() {
      gl_Position = a_position + u_offset;
    +  v_positionWithOffset = a_position + u_offset;
    }

Фрагментный шейдер:

    precision mediump float;

    +varying vec4 v_positionWithOffset;

    void main() {
    +  // конвертация из координат пространства отсечения (-1 <-> +1) в цвет (0 -> 1).
    +  vec4 color = v_positionWithOffset * 0.5 + 0.5
    +  gl_FragColor = color;
    }

Пример выше по сути не имеет смысла. Обычно незачем напрямую копировать значения координат
во фрагментный шейдер и создавать на их основе цвета. Однако это работает, и мы получаем
свои цвета и свой пример.

## GLSL

GLSL означает Graphics Library Shader Language (язык программирования шейдеров графической
библиотеки). То есть это язык, на котором написаны шейдеры. Он имеет несколько особенностей,
которые совсем не типичны для JavaScript. Он разработан для выполнения математики, которая
обычно требуется для выполнения растеризации графики. Поэтому язык содержит встроенные типы
данных вроде `vec2`, `vec3` и `vec4`, которые представляют 2 значения, 3 значения и 4 значения
соответственно. Также имеются `mat2`, `mat3` и `mat4` для матриц 2х2, 3х3 и 4х4. Вы можете
выполнять такие операции, как умножение `vec` на скалярное значение.

    vec4 a = vec4(1, 2, 3, 4);
    vec4 b = a * 2.0;
    // b теперь стало vec4(2, 4, 6, 8);

Аналогичным образом можно умножать матрицы или вектор на матрицу.

    mat4 a = ???
    mat4 b = ???
    mat4 c = a * b;

    vec4 v = ???
    vec4 y = c * v;

В языке также содержатся разнообразные конструкции, позволяющие получать разные
компоненты типа vec. Например, для vec4:

    vec4 v;

*   `v.x` то же, что и `v.s` или `v.r` или `v[0]`.
*   `v.y` то же, что и `v.t` или `v.g` или `v[1]`.
*   `v.z` то же, что и `v.p` или `v.b` или `v[2]`.
*   `v.w` то же, что и `v.q` или `v.a` или `v[3]`.

Или можно вообще устроить *коктейль* из компонентов, в результате чего
можно поменять местами или продублировать компоненты. Например,

    v.yyyy

то же самое, что и

    vec4(v.y, v.y, v.y, v.y)

Или

    v.bgra

то же, что и

    vec4(v.b, v.g, v.r, v.a)

При создании vec или mat можно передать несколько компонентов за раз. Например,

    vec4(v.rgb, 1)

то же самое, что и

    vec4(v.r, v.g, v.b, 1)

Также

    vec4(1)

то же самое, что и

    vec4(1, 1, 1, 1)

Одна вещь, о которую вы вероятней всего споткнётесь, это то,
что GLSL - очень строго типизированный язык.

    float f = 1;  // ОШИБКА! 1 имеет тип int. Нельзя присвоить int типу float

Вот корректный способ выполнить присваивание

    float f = 1.0;      // использовать формат float
    float f = float(1)  // привести integer к float

В примере выше `vec4(v.rgb, 1)` не ругается на `1`, потому что `vec4` приводит значения -
точно так же, как и `float(1)`.

GLSL содержит набор встроенных функций. Многие из них работают сразу с несклькими
компонентами. Например,

    T sin(T angle)

означает, что T может быть `float`, `vec2`, `vec3` или `vec4`. Если передать `vec4`,
вернётся тоже `vec4` и это будет синус каждого компонента. Другими словами, если `v`
имеет тип `vec4`, то

    vec4 s = sin(v);

будет аналогичным следующей записи

    vec4 s = vec4(sin(v.x), sin(v.y), sin(v.z), sin(v.w));

Иногда один аргумент имеет тип float, остальные - тип `T`. Это означает, что float
будет применён ко всем компонентам. Например, если `v1` и `v2` имеют тип `vec4` и
`f` - тип float, тогда

    vec4 m = mix(v1, v2, f);

будет равносильно следующей записи

    vec4 m = vec4(
      mix(v1.x, v2.x, f),
      mix(v1.y, v2.y, f),
      mix(v1.z, v2.z, f),
      mix(v1.w, v2.w, f));

Вы можете посмотреть список всех функций GLSL на последней странице
[справочника WebGL](https://www.khronos.org/files/webgl/webgl-reference-card-1_0.pdf).
Если же вам нравится сухое и подробное изложение, можете попробовать почитать
[спецификацию GLSL](https://www.khronos.org/files/opengles_shading_language.pdf).

## Складываем всё воедино

В этом и смысл всей серии статей. WebGL - по большей части создание различных шейдеров,
передача данных этим шейдерам, а затем вызов `gl.drawArrays` или `gl.drawElements`, чтобы
WebGL обработал вершины через вызов текущего вершинного шейдера для каждой вершины, а затем
отобразил каждый пиксель через вызов фрагментного шейдера для каждого пикселя.

Вообще, код шейдера занимает несколько строк кода. И так как эти строки практически одинаковые
в большинстве WebGL-приложений, а также потому, что написав их однажды, вы можете не уделять им
больше внимания, посмотрите [как компилировать шейдеры и привязывать их к шейдерной программе](webgl-boilerplate.html).

Если вы только что нашли эту статью, можете продолжать изучение по двум направлениям.
Если вам интересна обработка изображений, я покажу, [как выполнить обработку 2D-изображения](webgl-image-processing.html).
Если вам интересно узнать о переносе, повороте, масштабе и в конце концов 3D, тогда
[начните здесь](webgl-2d-translation.html).

WebGL Fundamentals
===================

This is [a series of lessons or tutorials about WebGL](http://webglfundamentals.org/).

Unlike most WebGL lessons these are not based off of OpenGL.
OpenGL is 20 years old. The lessons of OpenGL don't match well with WebGL.
The APIs have changed too much. The ideas of OpenGL and OpenGL tutorials
are out of date with WebGL, OpenGL ES 2.0 and the land of shaders.

I would argue that WebGL is actually a very simple API. What makes it
appear complicated is the way in which it's used. The complications
are added by the programmer. WebGL itself is simple.

These lessons try to show that simplicity and well as teach the
fundamentals of 2D math and 3D math so readers can hopefully
have an easier time writing their own WebGL programs and
understanding the complexity that other programmers pile on
top of simple WebGL.

This is work in progress. Feel free to contribute.

## Contributing

Of course bug fixes are always welcome.

If you'd like to write a new article please try to always take
one step at a time. Don't do 2 or more things in a single step.
Explain any new math in the simplest terms possible. Ideally
with diagrams where possible.

### Translating

Each translation goes in a folder under `webgl/lessons/<country-code>`.

Required files are

    langinfo.hanson
    index.md
    toc.html

#### `langinfo.hanson`

Defines various language specific options.
[Hanson](https://github.com/timjansen/hanson) is a JSON like format but allows comments.

Current fields are

    {
      // The language (will show up in the language selection menu)
      language: 'English',

      // Phrase that appears under examples
      defaultExampleCaption: "click here to open in a separate window",

      // Title that appears on each page
      title: 'WebGL Fundamentals',

      // Basic description that appears on each page
      description: 'Learn WebGL from the ground up. No magic',

      // Link to the language root.
      link: 'http://webglfundamentals.org/webgl/lessons/ja',  // replace `ja` with country code

      // html that appears after the article and before the comments
      commentSectionHeader: '<div>Questions? <a href="http://stackoverflow.com/questions/tagged/webgl">Ask on stackoverflow</a>.</div>\n        <div>Issue/Bug? <a href="http://github.com/greggman/webgl-fundamentals/issues">Create an issue on github</a>.</div>',

      // markdown that appears for untranslated articles
      missing: "Sorry this article has not been translated yet. [Translations Welcome](https://github.com/greggman/webgl-fundamentals)! 😄\n\n[Here's the original English article for now]({{{origLink}}}).",
    }

#### `index.md`

This is the template for the main page for each language

#### `toc.html`

This is the table of contents for the language. It is included on both the index
and on each article. It's up to if you want to link to English articles for non-translated articles or not

#### Translation notes

The build process will make a placeholder html file for each article has an english .md file in
`webgl/lessons` but no corresponding .md file for the language. This is to make it easy to include
links in one article that links to another article but that other article has not yet been translated.
This way you don't have to go back and fix already translated articles. Just translate one article
at a time and leave the links as is. They'll link to placeholders until someone translates the missing
articles.

### To build

The site is built into the `out` folder

Steps

    git clone https://github.com/greggman/webgl-fundamentals.git
    npm install
    npm run build
    npm start

now open your browser to `http://localhost:8080`

## TO DO

A list of articles I'd like to write or see written

*   lighting
    *   spot lighting
    *   normal maps
    *   shadow maps
*   animation
    *   blendshapes
    *   skinning
*   text
    *   glyph cache
*   post processing
    *   how to render to a texture (scene on cube)
    *   DOF
    *   glow
    *   light rays
    *   RGB glitch, CRT distortion, scanlines
    *   color mapping/tone mapping
*   Creative coding
    *   color palettes
    *   indexed everything
    *   tilemaps
    *   generated geometry
    *   histogram
    *   particles
    *   toon/ramp shading
*   code organization
    *   scene graph
        *   putting lights and camera in scene graph
*   Physically based rendering



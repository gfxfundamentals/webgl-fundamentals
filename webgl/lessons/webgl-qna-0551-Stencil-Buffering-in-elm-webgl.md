Title: Stencil Buffering in elm-webgl
Description:
TOC: qna

# Question:

I'm trying to make a simple OpenGL program in elm-webgl. I took one of the examples that has a box that rotates around, and I wanted to use stencil testing to only render one row of pixels at a time. 

I was able to achieve drawing the line I wanted, and I tried setting it up to render only on the stencil buffer. Then I set up the rendering of the cube to only pass the stencil test if for the line in the stencil buffer, but it doesn't seem to work. It just renders the cube like normal.

Here's my Elm program (modified version of [this example][1]):

    import Math.Vector2 exposing (Vec2)
    import Math.Vector3 exposing (..)
    import Math.Matrix4 exposing (..)
    import Task
    import Time exposing (Time)
    import WebGL exposing (..)
    import WebGL exposing (FunctionCall(..), CompareMode(..), Capability(..), ZMode(..))
    import Html exposing (Html)
    import Html.App as Html
    import AnimationFrame
    import Html.Attributes exposing (width, height)
    
    
    type alias Model =
      { texture : Maybe Texture
      , theta : Float
      }
    
    
    type Action
      = TextureError Error
      | TextureLoaded Texture
      | Animate Time
    
    
    update : Action -> Model -> (Model, Cmd Action)
    update action model =
      case action of
        TextureError err ->
          (model, Cmd.none)
        TextureLoaded texture ->
          ({model | texture = Just texture}, Cmd.none)
        Animate dt ->
          ({model | theta = model.theta + dt / 10000}, Cmd.none)
    
    
    init : (Model, Cmd Action)
    init =
      ( {texture = Nothing, theta = 0}
      , loadTexture "/woodCrate.jpg"
        |> Task.perform TextureError TextureLoaded
      )
    
    
    main : Program Never
    main =
      Html.program
        { init = init
        , view = view
        , subscriptions = (\model -> AnimationFrame.diffs Animate)
        , update = update
        }
    
    
    -- MESHES
    
    crate : Drawable { pos:Vec3, coord:Vec3 }
    crate =
      Triangle <|
      List.concatMap rotatedFace [ (0,0), (90,0), (180,0), (270,0), (0,90), (0,-90) ]
    
    
    fmod : Float -> Float -> Float
    fmod a b =
      a - (toFloat <| floor <| a / b) * b
    
    
    line : Float -> Drawable { pos: Vec3 }
    line theta =
      let
        y = (fmod -theta 2) - 1
      in
        Lines
          [ ({ pos = vec3 -1 y 0 } , { pos = vec3 1 y 0 })
          ]
    
    
    rotatedFace : (Float,Float) -> List ({ pos:Vec3, coord:Vec3 }, { pos:Vec3, coord:Vec3 }, { pos:Vec3, coord:Vec3 })
    rotatedFace (angleX,angleY) =
      let
        x = makeRotate (degrees angleX) (vec3 1 0 0)
        y = makeRotate (degrees angleY) (vec3 0 1 0)
        t = x `mul` y `mul` makeTranslate (vec3 0 0 1)
        each f (a,b,c) =
          (f a, f b, f c)
      in
        List.map (each (\x -> {x | pos = transform t x.pos })) face
    
    
    face : List ({ pos:Vec3, coord:Vec3 }, { pos:Vec3, coord:Vec3 }, { pos:Vec3, coord:Vec3 })
    face =
      let
        topLeft     = { pos = vec3 -1  1 0, coord = vec3 0 1 0 }
        topRight    = { pos = vec3  1  1 0, coord = vec3 1 1 0 }
        bottomLeft  = { pos = vec3 -1 -1 0, coord = vec3 0 0 0 }
        bottomRight = { pos = vec3  1 -1 0, coord = vec3 1 0 0 }
      in
        [ (topLeft,topRight,bottomLeft)
        , (bottomLeft,topRight,bottomRight)
        ]
    
    
    -- VIEW
    
    perspective : Float -> Mat4
    perspective angle =
      List.foldr mul Math.Matrix4.identity
        [ perspectiveMatrix
        , camera
        , makeRotate (3*angle) (vec3 0 1 0)
        , makeRotate (2*angle) (vec3 1 0 0)
        ]
    
    perspectiveMatrix : Mat4
    perspectiveMatrix =
      makePerspective 45 1 0.01 100
    
    
    camera : Mat4
    camera =
      makeLookAt (vec3 0 0 5) (vec3 0 0 0) (vec3 0 1 0)
    
    lineFunctionCalls: List FunctionCall
    lineFunctionCalls =
      [ Disable StencilTest
      , Enable StencilTest
      , StencilFunc (Always, 1, 0xFF)
      , StencilMask 0xFF
      , DepthMask 0x00
      , ColorMask (0x00, 0x00, 0x00, 0x00)
      ]
    
    cubeFunctionCalls: List FunctionCall
    cubeFunctionCalls =
      [ StencilFunc (Equal, 1, 0xFF)
      , StencilMask 0x00
      , DepthMask 0xFF
      , ColorMask (0xFF, 0xFF, 0xFF, 0xFF)
      ]
    
    initFunctionCalls: List FunctionCall
    initFunctionCalls =
      [ Enable DepthTest
      , DepthFunc Less
      ]
    
    view : Model -> Html Action
    view {texture, theta} =
      (case texture of
        Nothing ->
            []
        Just tex ->
            [ renderWithConfig lineFunctionCalls lineVertexShader lineFragmentShader (line theta) {}
            , renderWithConfig cubeFunctionCalls vertexShader fragmentShader crate { crate = tex, perspective = perspective theta }
            ]
      )
      |> WebGL.toHtmlWith initFunctionCalls [width 400, height 400]
    
    
    -- SHADERS
    
    vertexShader : Shader { pos:Vec3, coord:Vec3 } { u | perspective:Mat4 } { vcoord:Vec2 }
    vertexShader = [glsl|
    
    attribute vec3 pos;
    attribute vec3 coord;
    uniform mat4 perspective;
    varying vec2 vcoord;
    
    void main () {
      gl_Position = perspective * vec4(pos, 1.0);
      vcoord = coord.xy;
    }
    
    |]
    
    lineVertexShader : Shader { pos: Vec3 } u {}
    lineVertexShader = [glsl|
    attribute vec3 pos;
    
    void main() {
      gl_Position = vec4(pos, 1.0);
    }
    |]
    
    lineFragmentShader : Shader a u {}
    lineFragmentShader = [glsl|
    precision mediump float;
    
    void main() {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
    |]
    
    
    fragmentShader : Shader {} { u | crate:Texture } { vcoord:Vec2 }
    fragmentShader = [glsl|
    
    precision mediump float;
    uniform sampler2D crate;
    varying vec2 vcoord;
    
    void main () {
      gl_FragColor = texture2D(crate, vcoord);
    }
    
    |]

I'm using a modified version of elm-webgl that adds a couple of function calls like `ColorMask` and `StencilMask`. These map one to one with their JavaScript WebGL counter parts.

I'm not super educated on how the stencil buffer works, and I have little experience with OpenGL. I've read two tutorials on stencil buffers: [this one][2] and [this one][3], and as far as I can tell, there's no reason this shouldn't be working.

Any help is appreciated. Thanks!


  [1]: https://github.com/elm-community/elm-webgl/blob/master/examples/crate.elm
  [2]: http://www.learnopengl.com/#!Advanced-OpenGL/Stencil-testing
  [3]: https://open.gl/depthstencils

# Answer

Just checking but did you ask for a stencil buffer? WebGL defaults to not having one. You can ask for one when creating the webgl context by passing in `{stencil: true}` as the second parameter to `getContext` in JavaScript. 

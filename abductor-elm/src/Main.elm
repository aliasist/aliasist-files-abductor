port module Main exposing (main)

import Browser
import Html exposing (Html, button, div, h1, img, input, label, p, span, text)
import Html.Attributes exposing (alt, checked, class, disabled, placeholder, readonly, src, style, type_, value)
import Html.Events exposing (onCheck, onClick, onInput)
import Json.Decode as D



-- PORTS (see src/ports.js for the JS side that talks to Tauri)


port requestDlDir : () -> Cmd msg


port gotDlDir : (String -> msg) -> Sub msg


port browseFolder : () -> Cmd msg


port folderSelected : (String -> msg) -> Sub msg


port startDownload : { url : String, savePath : String } -> Cmd msg


port downloadProgress : (D.Value -> msg) -> Sub msg


port downloadResult : (D.Value -> msg) -> Sub msg


port abortDownload : () -> Cmd msg



-- MODEL


type Status
    = Idle
    | Downloading Progress
    | Done String
    | Failed String


type alias Progress =
    { percent : Float
    , speed : Maybe String
    , eta : Maybe String
    }


type alias Model =
    { targetUrl : String
    , landingZone : String
    , agreed : Bool
    , status : Status
    }


init : () -> ( Model, Cmd Msg )
init _ =
    ( { targetUrl = ""
      , landingZone = ""
      , agreed = False
      , status = Idle
      }
    , requestDlDir ()
    )



-- UPDATE


type Msg
    = UrlChanged String
    | AgreedChanged Bool
    | BrowseClicked
    | GotDlDir String
    | GotFolder String
    | AbductClicked
    | EjectClicked
    | GotProgress D.Value
    | GotResult D.Value


progressDecoder : D.Decoder Progress
progressDecoder =
    D.map3 Progress
        (D.field "percent" D.float)
        (D.maybe (D.field "speed" D.string))
        (D.maybe (D.field "eta" D.string))


resultDecoder : D.Decoder (Result String String)
resultDecoder =
    D.field "success" D.bool
        |> D.andThen
            (\success ->
                if success then
                    D.map Ok (D.field "final_path" (D.maybe D.string) |> D.map (Maybe.withDefault ""))

                else
                    D.map Err (D.field "error" (D.maybe D.string) |> D.map (Maybe.withDefault "Unknown error."))
            )


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        UrlChanged url ->
            ( { model | targetUrl = url }, Cmd.none )

        AgreedChanged agreed ->
            ( { model | agreed = agreed }, Cmd.none )

        BrowseClicked ->
            ( model, browseFolder () )

        GotDlDir dir ->
            ( { model | landingZone = dir }, Cmd.none )

        GotFolder dir ->
            if dir == "" then
                ( model, Cmd.none )

            else
                ( { model | landingZone = dir }, Cmd.none )

        AbductClicked ->
            if not model.agreed || String.isEmpty model.targetUrl || String.isEmpty model.landingZone then
                ( model, Cmd.none )

            else
                let
                    savePath =
                        model.landingZone ++ "/abducted-file"
                in
                ( { model | status = Downloading { percent = 0, speed = Nothing, eta = Nothing } }
                , startDownload { url = model.targetUrl, savePath = savePath }
                )

        EjectClicked ->
            ( { model | status = Idle }, abortDownload () )

        GotProgress value ->
            case D.decodeValue progressDecoder value of
                Ok progress ->
                    ( { model | status = Downloading progress }, Cmd.none )

                Err _ ->
                    ( model, Cmd.none )

        GotResult value ->
            case D.decodeValue resultDecoder value of
                Ok (Ok path) ->
                    ( { model | status = Done path }, Cmd.none )

                Ok (Err err) ->
                    ( { model | status = Failed err }, Cmd.none )

                Err _ ->
                    ( { model | status = Failed "Could not read the download result." }, Cmd.none )



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.batch
        [ gotDlDir GotDlDir
        , folderSelected GotFolder
        , downloadProgress GotProgress
        , downloadResult GotResult
        ]



-- VIEW


view : Model -> Html Msg
view model =
    div [ class "card" ]
        [ div [ class "header" ]
            [ img [ src "/logo.svg", alt "Aliasist Logo", class "brand-icon" ] []
            , div []
                [ h1 [] [ text "ALIASIST FILES ABDUCTOR" ]
                , p [ class "subtitle" ] [ text "Abducting files from a galaxy far far away.. \u{00B7} www.aliasist.com" ]
                ]
            ]
        , div [ class "field" ]
            [ label [] [ text "\u{1F3AF} Target URL" ]
            , input
                [ type_ "text"
                , placeholder "https://example.com/video"
                , value model.targetUrl
                , onInput UrlChanged
                ]
                []
            ]
        , div [ class "field" ]
            [ label [] [ text "\u{1F4C2} Landing Zone" ]
            , div [ class "row" ]
                [ input [ type_ "text", value model.landingZone, readonly True ] []
                , button [ onClick BrowseClicked ] [ text "\u{1F4C1} Browse" ]
                ]
            ]
        , div [ class "disclaimer" ]
            [ p [] [ text "\u{26A0}\u{FE0F} DISCLAIMER* You are responsible for what you are authorized to abduct. Don't be a space pirate!" ]
            , label []
                [ input [ type_ "checkbox", checked model.agreed, onCheck AgreedChanged ] []
                , text " I'll obey and be on my best behavior."
                ]
            ]
        , div [ class "row" ]
            [ button
                [ class "abduct"
                , disabled (not model.agreed || String.isEmpty model.targetUrl || String.isEmpty model.landingZone)
                , onClick AbductClicked
                ]
                [ text "\u{1F6F8} Abduct File" ]
            , button [ class "eject", onClick EjectClicked ] [ text "\u{1F6A8} Eject!" ]
            ]
        , div [ class "spacer" ] []
        , viewStatus model.status
        ]


formatPercent : Float -> String
formatPercent percent =
    String.fromFloat (toFloat (round (percent * 10)) / 10)


viewStatus : Status -> Html Msg
viewStatus status =
    case status of
        Idle ->
            text ""

        Downloading progress ->
            div [ class "status" ]
                [ div [ class "progress-track" ]
                    [ div [ class "progress-fill", style "width" (String.fromFloat progress.percent ++ "%") ] [] ]
                , p []
                    [ text
                        ("\u{1F6F8} Abducting... "
                            ++ formatPercent progress.percent
                            ++ "%"
                            ++ (progress.speed |> Maybe.map (\s -> " @ " ++ s) |> Maybe.withDefault "")
                            ++ (progress.eta |> Maybe.map (\e -> " ETA " ++ e) |> Maybe.withDefault "")
                        )
                    ]
                ]

        Done path ->
            div [ class "status success" ] [ text ("\u{2705} Landed safely: " ++ path) ]

        Failed err ->
            div [ class "status error" ] [ span [] [ text ("\u{274C} " ++ err) ] ]


main : Program () Model Msg
main =
    Browser.element
        { init = init
        , update = update
        , view = view
        , subscriptions = subscriptions
        }

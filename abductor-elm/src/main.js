import { Elm } from "./Main.elm";
import { wirePorts } from "./ports.js";
import "./style.css";

const app = Elm.Main.init({ node: document.getElementById("app") });
wirePorts(app);

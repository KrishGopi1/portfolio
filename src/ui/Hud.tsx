// HUD layer: intro loader, top nav, web-thread progress, combo meter, cursor reticle.
// Every fixed element sits at var(--z-hud) (loader/reticle slightly above).
import "./hud.css";
import Loader from "./Loader";
import Nav from "./Nav";
import WebProgress from "./WebProgress";
import Combo from "./Combo";
import Reticle from "./Reticle";

export default function Hud() {
  return (
    <>
      <Nav />
      <WebProgress />
      <Combo />
      <Reticle />
      <Loader />
    </>
  );
}

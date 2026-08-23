import { useEffect, useRef, useState } from "react";

// Ported from the original Electron app's index.html + renderer.js splash
// sequence (v2.7.0) — same messages, same timing (900ms/message, 500ms
// pause, 600ms fade-out), same UFO/cow-abduction CSS animation.
const MESSAGES = [
  "Contacting the mothership...",
  "Warming up the abduction ray...",
  "Locating nearest cow... I mean file...",
  "Plotting course to your downloads folder...",
  "All systems go!",
];

const MESSAGE_MS = 900;
const HOLD_MS = 500;
const FADE_MS = 600;

export default function Splash({ onDone }: { onDone: () => void }) {
  const [messageIdx, setMessageIdx] = useState(0);
  const [exiting, setExiting] = useState(false);

  // Read via ref, not as an effect dependency — the sequence below must run
  // exactly once regardless of whether the caller passes a stable callback,
  // so an unstable onDone identity can never restart it mid-sequence.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      for (let i = 0; i < MESSAGES.length; i++) {
        if (cancelled) return;
        setMessageIdx(i);
        await new Promise((r) => setTimeout(r, MESSAGE_MS));
      }
      if (cancelled) return;
      await new Promise((r) => setTimeout(r, HOLD_MS));
      if (cancelled) return;
      setExiting(true);
      await new Promise((r) => setTimeout(r, FADE_MS));
      if (cancelled) return;
      onDoneRef.current();
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stars = [
    { top: "8%", left: "12%", delay: "0s" },
    { top: "15%", left: "80%", delay: "0.3s" },
    { top: "25%", left: "45%", delay: "0.7s" },
    { top: "5%", left: "65%", delay: "1.1s" },
    { top: "35%", left: "20%", delay: "0.5s" },
    { top: "12%", left: "35%", delay: "1.4s" },
    { top: "30%", left: "72%", delay: "0.9s" },
    { top: "18%", left: "55%", delay: "1.7s" },
  ];

  return (
    <div className={`splash${exiting ? " exit" : ""}`}>
      <div className="splash-content">
        <div className="stars">
          {stars.map((s, i) => (
            <div
              key={i}
              className="star"
              style={{ top: s.top, left: s.left, animationDelay: s.delay }}
            />
          ))}
        </div>

        <div className="ufo-scene">
          <div className="ufo">
            <div className="ufo-dome" />
            <div className="ufo-body">
              <div className="ufo-light" />
              <div className="ufo-light" />
              <div className="ufo-light" />
            </div>
          </div>
          <div className="beam" />
          <div className="cow">
            <div className="cow-body" />
            <div className="cow-head" />
            <div className="cow-spots" />
            <div className="cow-legs">
              <div className="leg" />
              <div className="leg" />
              <div className="leg" />
              <div className="leg" />
            </div>
          </div>
          <div className="ground" />
        </div>

        <h1 className="splash-title">ALIASIST</h1>
        <p className="splash-sub">F I L E S &nbsp; A B D U C T O R</p>
        <p className="splash-credit">coded by dev_aliasist · www.aliasist.com</p>
        <p className="splash-status">{MESSAGES[messageIdx]}</p>
      </div>
    </div>
  );
}

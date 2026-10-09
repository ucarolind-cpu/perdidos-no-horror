import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type CSSProperties } from "react";
import bg from "@/assets/settings-bg.jpg.asset.json";
import { GameShell } from "@/game/GameShell";
import { FadeInFromBlack } from "@/game/DoorTransition";
import { playClick } from "@/game/audio";
import { PLAYER_NAME_MAX, updateSettings, useSettings, vibrate, type GameSettings } from "@/game/settings";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Perdidos no Horror" },
      { name: "description", content: "Ajuste som, brilho, controles e nome do jogador em Perdidos no Horror." },
      { property: "og:title", content: "Configurações — Perdidos no Horror" },
      { property: "og:description", content: "Ajuste som, brilho, controles e nome do jogador." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsScreen,
});

const tap = () => { playClick(); vibrate(15); };
type NumKey = "masterVolume" | "musicVolume" | "sfxVolume" | "brightness" | "sensitivity";
type BoolKey = "vibration" | "subtitles" | "gore";

function Slider({ k, label, low = "0%", high = "100%", showValue = true }: { k: NumKey; label: string; low?: string; high?: string; showValue?: boolean }) {
  const s = useSettings();
  const v = s[k];
  return (
    <div className="set-row">
      <span className="set-label">{label}</span>
      <div className="set-slider">
        <input
          type="range" min={0} max={100} value={v} aria-label={label}
          className="wood-range" style={{ "--fill": `${v}%` } as CSSProperties}
          onChange={(e) => updateSettings({ [k]: Number(e.target.value) } as Partial<GameSettings>)}
          onPointerUp={tap}
        />
        <div className="set-scale">
          <span style={{ visibility: showValue && v < 10 ? "hidden" : "visible" }}>{low}</span>
          {showValue && <span className="set-value" style={{ left: `${v}%` }}>{v}%</span>}
          <span style={{ visibility: showValue && v > 88 ? "hidden" : "visible" }}>{high}</span>
        </div>
      </div>
    </div>
  );
}

function Toggle({ k, label }: { k: BoolKey; label: string }) {
  const on = useSettings()[k];
  const set = (val: boolean) => { updateSettings({ [k]: val } as Partial<GameSettings>); tap(); };
  return (
    <div className="set-row">
      <span className="set-label">{label}</span>
      <div className="set-toggles" role="radiogroup" aria-label={label}>
        <button type="button" role="radio" aria-checked={on} className="wood-switch" data-active={on} onClick={() => set(true)}>
          <span>ON</span><i className="wood-knob" />
        </button>
        <button type="button" role="radio" aria-checked={!on} className="wood-switch" data-active={!on} onClick={() => set(false)}>
          <i className="wood-knob" /><span>OFF</span>
        </button>
      </div>
    </div>
  );
}

function ControlRow() {
  const { controlType } = useSettings();
  return (
    <div className="set-row">
      <span className="set-label">Tipo de Controle</span>
      <div className="set-pair">
        {(["joystick", "direcional"] as const).map((c) => (
          <button key={c} type="button" className="wood-btn" data-active={controlType === c} aria-pressed={controlType === c}
            onClick={() => { updateSettings({ controlType: c }); tap(); }}>
            {c === "joystick" ? "Joystick" : "Direcional"}
          </button>
        ))}
      </div>
    </div>
  );
}

function NameRow() {
  const { playerName } = useSettings();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(playerName);
  const save = () => {
    const name = draft.trim().toUpperCase().slice(0, PLAYER_NAME_MAX);
    if (name) updateSettings({ playerName: name });
    else setDraft(playerName);
    setEditing(false);
    tap();
  };
  return (
    <div className="set-row">
      <span className="set-label">Nome do Jogador</span>
      <div className="set-pair set-pair-name">
        {editing ? (
          <input autoFocus className="wood-field" value={draft} maxLength={PLAYER_NAME_MAX} aria-label="Nome do jogador"
            onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} />
        ) : (
          <div className="wood-field">{playerName}</div>
        )}
        <button type="button" className="wood-btn wood-btn-sm"
          onClick={() => (editing ? save() : (setDraft(playerName), setEditing(true), tap()))}>
          {editing ? "SALVAR" : "EDITAR NOME"}
        </button>
      </div>
    </div>
  );
}

function SettingsScreen() {
  return (
    <GameShell>
      <div className="game-stage settings-stage">
        <img src={bg.url} alt="" className="game-bg" draggable={false} />
        <h1 className="sr-only">CONFIGURAÇÕES</h1>
        <Link to="/" aria-label="Voltar ao menu principal" className="menu-hotspot settings-back" onClick={tap} />
        <div className="settings-scroll">
          <Slider k="masterVolume" label="Volume Geral" />
          <Slider k="musicVolume" label="Volume da Música" />
          <Slider k="sfxVolume" label="Volume dos Efeitos" />
          <Toggle k="vibration" label="Vibração" />
          <Slider k="brightness" label="Brilho" />
          <ControlRow />
          <NameRow />
          <Slider k="sensitivity" label="Sensibilidade" low="Baixa" high="Alta" showValue={false} />
          <Toggle k="subtitles" label="Legendas" />
          <Toggle k="gore" label="Sangue/Gore" />
        </div>
        <div className="settings-more" aria-hidden="true">▼</div>
        <FadeInFromBlack />
      </div>
    </GameShell>
  );
}

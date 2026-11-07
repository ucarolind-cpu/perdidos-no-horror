import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  settings: { masterVolume: 100, musicVolume: 80, sfxVolume: 60 },
  listener: () => {},
}));
vi.mock("@/game/settings", () => ({
  getSettings: () => state.settings,
  subscribeSettings: (listener: () => void) => { state.listener = listener; },
}));

describe("Música durante Criar Sala", () => {
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it("silencia imediatamente todas as músicas, preserva efeitos e restaura o volume atual ao sair", async () => {
    vi.useFakeTimers();
    vi.resetModules();
    const gains: Array<{ gain: { setTargetAtTime: ReturnType<typeof vi.fn>; setValueAtTime: ReturnType<typeof vi.fn>; cancelScheduledValues: ReturnType<typeof vi.fn>; value: number } }> = [];
    const node = () => {
      const result = {
        gain: { setTargetAtTime: vi.fn(), setValueAtTime: vi.fn(), cancelScheduledValues: vi.fn(), value: 1 },
        frequency: { value: 0 }, type: "", start: vi.fn(),
        connect: vi.fn(),
      };
      result.connect.mockReturnValue(result);
      return result;
    };
    class AudioContextMock {
      currentTime = 10;
      destination = {};
      createGain() { const result = node(); gains.push(result); return result; }
      createOscillator = node;
      createBiquadFilter = node;
    }
    vi.stubGlobal("AudioContext", AudioContextMock);
    const audio = await import("@/game/audio");
    audio.initAudio();
    const music = gains[1];
    const effects = gains[2];
    if (!music || !effects) throw new Error("Canais ausentes");
    effects.gain.setTargetAtTime.mockClear();
    const restore = audio.muteBackgroundMusic();
    expect(music.gain.cancelScheduledValues).toHaveBeenCalledWith(10);
    expect(music.gain.setValueAtTime).toHaveBeenCalledWith(0, 10);
    expect(effects.gain.setTargetAtTime).not.toHaveBeenCalled();
    state.settings.musicVolume = 40;
    state.listener();
    expect(music.gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 10, 0.05);
    restore();
    expect(music.gain.setTargetAtTime).toHaveBeenLastCalledWith(expect.closeTo(0.14, 8), 10, 0.05);
    const calls = music.gain.setTargetAtTime.mock.calls.length;
    restore();
    expect(music.gain.setTargetAtTime).toHaveBeenCalledTimes(calls);
  });
});
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FadeToBlack } from "@/game/FadeTransition";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(), play: vi.fn(), stop: vi.fn(), create: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("@/game/audio", () => ({ createOneShotSound: mocks.create }));

describe("Som durante o preto ao criar sala", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mocks.create.mockReturnValue({ play: mocks.play, stop: mocks.stop });
  });
  afterEach(() => vi.useRealTimers());

  function start(sound = "/matchstick_strike.mp3") {
    const view = render(<FadeToBlack to="/sala-espera" onDone={() => {}} holdMs={3000} safetyMs={5000} blackSoundUrl={sound} />);
    act(() => vi.advanceTimersByTime(300));
    const overlay = view.container.firstElementChild;
    if (!overlay) throw new Error("Transição ausente");
    const event = new Event("transitionend", { bubbles: true });
    Object.defineProperty(event, "propertyName", { value: "opacity" });
    fireEvent(overlay, event);
    return view;
  }

  it("toca uma vez exatamente 1000 ms depois de preto total", () => {
    const view = start();
    act(() => vi.advanceTimersByTime(999));
    expect(mocks.play).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(mocks.play).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(1000));
    expect(mocks.play).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it("cancela o temporizador ao sair antes do som", () => {
    const view = start();
    act(() => vi.advanceTimersByTime(500));
    view.unmount();
    act(() => vi.advanceTimersByTime(5000));
    expect(mocks.play).not.toHaveBeenCalled();
    expect(mocks.stop).toHaveBeenCalledTimes(1);
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("para o som ao sair depois que começou", () => {
    const view = start();
    act(() => vi.advanceTimersByTime(1000));
    view.unmount();
    expect(mocks.stop).toHaveBeenCalledTimes(1);
  });

  it("mantém os 3 segundos de espera e a segurança de 5 segundos", () => {
    const view = start();
    act(() => vi.advanceTimersByTime(3019));
    expect(mocks.navigate).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(mocks.navigate).toHaveBeenCalledWith({ to: "/sala-espera" });
    act(() => vi.advanceTimersByTime(2000));
    expect(mocks.navigate).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it("não adiciona áudio a outras transições", () => {
    const view = start("");
    act(() => vi.advanceTimersByTime(1000));
    expect(mocks.create).not.toHaveBeenCalled();
    view.unmount();
  });
});
<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Route transition sounds use an optional FadeToBlack sound and the shared effects bus; music silence is acquired on the create-room click and released on route cleanup, keeping music muted throughout navigation without muting effects or changing volume preferences.
- Menu media is preloaded only from the owning screen's mount effect through game/preload; reuse warmed audio elements, retain decoded images, and fall back to normal loading on errors to avoid front-loading future screens.
- Warm the owner sprite on multiplayer-menu mount and retain its decoded image element across room mounts; attach it before paint without gating transition timers, and capture the configured owner name in the existing in-memory session on room creation.

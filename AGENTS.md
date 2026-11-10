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
- The local room owner is captured from Settings when creating a room; its sprite is prepared on the multiplayer menu mount and the same decoded image element is reused by an isolated memoized presentation, keeping transitions independent of asset readiness.
- Rooms use account-free device capabilities with server-hashed secrets and service-only atomic SQL RPCs; joins lock the room for capacity/deduplication, membership authorizes reads/leaves. Data-free Realtime broadcasts use unguessable room capability topics; clients re-fetch authenticated data and heartbeat while mounted. Minute SQL reconciliation removes stale members/hosts, and hourly cleanup removes expired rooms. Lobby subscriptions live in small isolated children to avoid rerendering scenery; host and guest entry share RoomEntryTransition and existing assets.

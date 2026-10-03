# Kraken Access — admin panel

`kraken-admin.html` is a self-contained control panel for Kraken licensing. It
runs entirely in your browser; your private signing key never leaves your
machine. It produces the `access.json` that the add-in reads from the root of
this repository (the feed).

## Open it

Three ways, all fully functional (including signing):

1. **Double-click `kraken-admin.html`** — opens as a local `file://` page.
2. **Host it on your network** so other devices can use it — from this folder:
   ```
   node serve.mjs          (or: double-click serve-kraken-admin.cmd on Windows)
   ```
   It prints `http://<your-LAN-IP>:8080/`. Open that on this machine or any
   device on the same network. Pass a port as the first argument to change it.
3. **Open the published link** if you were given one.

### Signing works everywhere — no HTTPS needed

Signing prefers the browser's WebCrypto, which browsers only enable in a
*secure context* (`file://`, `https://`, or `http://localhost`). On a plain
`http://192.168.x.x` LAN address that is switched off — so the panel falls
back to its **own built-in ECDSA P-256 / SHA-256 signer**. The signatures it
produces are byte-identical in effect and verify under WebCrypto (and under
Kraken's embedded key) exactly the same way, so you do **not** need a
certificate or HTTPS to use it over the LAN. Host it only on a network you
trust.

## What it does

- **Seats** — list a person's email and set their plan: **paid**, **free**,
  **trial**, or **blocked**. Anyone not listed falls to the **default** plan.
  Add one at a time, paste many with **Bulk add**, or **import/export CSV**
  (`email, plan, note`) to manage the list in a spreadsheet.
- **Policy** — pick the enforcement **mode**, the default plan, trial length,
  offline grace, and an optional expiry date for the file itself.
- **Signing key** — generate a key, or import the one you already used. The
  panel tells you whether it matches the key baked into shipped Kraken.
- **Sign & build** — produces the signed `access.json` to download and commit
  to this repo's root.

## Modes — go slow

| Mode | Effect |
|------|--------|
| **Off** | Licensing inactive. Everyone runs. |
| **Warn** | Nobody is blocked; Kraken only *records* who would be. Use this to confirm your list is right before charging. |
| **Enforce** | Live. Blocked/expired seats cannot run the tools. |

**Always sit in Warn first**, confirm the right people would be allowed/blocked,
then switch to Enforce.

## The key must match

Kraken verifies `access.json` against the public key compiled into the DLL.
Sign with the **same key you first used** (the one whose public half is shown as
"matches Kraken"). A different key means Kraken rejects the file. Changing the
key requires rebuilding and re-publishing Kraken with the new public key — so
**back the key up** and keep it safe.

## File shape

```json
{
  "payloadText": "{\"schema\":1,\"issued\":\"YYYY-MM-DD\",\"policy\":{\"mode\":\"warn\",\"default\":\"trial\",\"trialDays\":30,\"graceDays\":14},\"users\":{\"someone@example.com\":\"paid\"}}",
  "sig": "<base64, ECDSA P-256 / SHA-256, raw r||s>",
  "alg": "ES256",
  "key": "<SPKI base64 public key>"
}
```

The signature covers `payloadText` byte-for-byte. Per-seat value is a bare plan
string (mirroring `policy.default`). The shipped `access.json` ships with an
empty `users` map, so if a future build expects an object per seat instead,
change `seatValue()` near the top of the script — and verify one seat in Warn
mode before enforcing, which costs nobody their afternoon if the shape is off.

## Messages — notices to certain users

The **Messages** section composes a signed `messages.json` for the same feed,
so you can push a notice to specific people (or everyone). Same envelope and
same signing key as `access.json`:

```json
{
  "payloadText": "{\"schema\":1,\"issued\":\"YYYY-MM-DD\",\"messages\":[{\"id\":\"m1\",\"title\":\"Your trial ends soon\",\"body\":\"3 days left.\",\"level\":\"warn\",\"to\":[\"someone@example.com\"],\"until\":\"2026-11-01\",\"dismissible\":true}]}",
  "sig": "…", "alg": "ES256", "key": "<SPKI base64 public key>"
}
```

Per message: `id` (stable, so a dismissal can be remembered), `title`, `body`,
`level` (`info`/`warn`/`urgent`), **`all:true`** for everyone *or* **`to:[…]`**
a list of emails, optional `from` (don't show before this date) and `until`
(stop showing after this date), and `dismissible`. The composer shows a live
preview and marks each message **active / scheduled / expired**.

### ⚠ The add-in must read it — not shipped yet

The currently shipped Kraken (2.9.1) does **not** read `messages.json`. The
panel builds and signs the file so it's ready, but nothing reaches users until
a Kraken build is published that fetches and shows it. The reader the add-in
needs (to add to `Updater`/notification code):

1. Fetch `messages.json` from the feed root alongside `latest.txt` /
   `access.json`.
2. Verify `sig` over `payloadText` with the embedded public key (same code
   path as the access file). Reject if it doesn't verify.
3. For each message, show it when `all == true` **or** `to` contains the
   signed-in account email, and (if `from`/`until` are set) `from` ≤ today ≤
   `until`.
4. Show each `id` once; if `dismissible`, remember the dismissed `id` in the
   local settings/state file so it isn't shown again. Map `level` to the
   existing toast levels.

That reader is a small, self-contained add-in change; it needs the Kraken
source repo (not in this releases repo).

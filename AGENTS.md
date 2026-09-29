# Site changes

When a change is visible on the site, update `changelog.md` in the same change.

- Put the newest version first.
- Use `MAJOR.MINOR.PATCH`.
- Bump MAJOR when a command or public behavior breaks.
- Bump MINOR for a new command or capability.
- Bump PATCH for a fix.
- Date only, `YYYY-MM-DD`. No time.
- Write what a visitor notices. Skip file lists and refactors that do not change the site.
- Sections, as needed: Added, Changed, Fixed.

`clear music` stays out of `help`. It only clears the Firebase list of randomized songs.

Liked songs come from playlist `2kO4SQsSzH2wYMkNB9lVEC`. New likes are appended, so the newest tracks are at the end of Spotify's own player. The `liked` command sorts by the date each track was added and shows the newest 100 first.

Randomized songs are stored at `seasons/cli/playedMusic` in the snooker Firebase database. `tracks` is the history. `cycle` plus `generation` is only the current pass that avoids repeats.

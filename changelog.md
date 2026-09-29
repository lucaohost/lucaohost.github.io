# Changelog

## 2.1.0 - 2026-09-29

### Added
- `music` with a song name shows a spinner and holds scrolling and typing while Spotify searches.

### Changed
- Next is a round skip button beside the player.
- A song picked from `list` or `liked` starts in the player already open.
- `music` with a song name plays a liked match immediately when the name is already known.

### Fixed
- `list` no longer shows numbered rows that have no song name.

## 2.0.1 - 2026-09-29

### Changed
- Next sits on the right side of the Spotify player.

### Fixed
- `liked` and `list` play the next song when the current one ends.
- Choosing another song stops the one already playing, including when the next one is slow to start.
- Dragging or scrolling across Next does not play another song. A tap still does.

## 2.0.0 - 2026-09-29

### Changed
- Randomized songs use the `list` command.

### Fixed
- `list` plays the next song when the current one ends.
- Choosing another song stops the one already playing when the next one is slow to start.
- Dragging or scrolling across Next no longer plays another song. A tap still does.

## 1.5.1 - 2026-09-29

### Fixed
- `liked` and `list music` start the first song.
- A slow play button turns into a loading icon until the song starts. Other play buttons and scrolling wait.
- Dragging across a play icon no longer starts the song. Playback starts on a tap.

## 1.5.0 - 2026-09-29

### Added
- `list music` plays a song from its play icon.

### Changed
- The desktop terminal has a window bar and a thinner scrollbar.
- Liked songs and randomized songs start from a play icon. The song name does not start playback.
- `liked` plays the next song when the current one ends.

### Fixed
- `exit` leaves the terminal again.
- Scrolling the song list on the phone no longer starts a song.
- Choosing a song from a list keeps the screen where it is.

## 1.4.0 - 2026-09-29

### Added
- `changelog` lists site updates and dates.
- `list music` lists songs already randomized, with the count against the full playlist.
- `music` followed by a song name plays that song from Spotify.
- Randomized songs are stored in Firebase, so the history survives when the browser clears local storage.

### Changed
- Liked songs are the 100 most recently added, newest first. The Spotify playlist player was showing the oldest tracks at the top.
- Phone keyboard keys keep a short green highlight after a tap.

### Fixed
- `rick` keeps the terminal at the end after the picture and the song finish loading.

## 1.3.0 - 2026-09-29

### Added
- Holding backspace repeats the delete.
- Arrow keys recall earlier commands on desktop.
- Spotify embeds show a loading state while the player starts.

## 1.2.0 - 2026-09-28

### Added
- Fixed QWERTY keyboard on the phone terminal.
- The next liked song can start on its own.
- Snooker ranking for the closed 2024 season.
- 2026 players can be hidden from the public tables.

### Fixed
- One song keeps playing without erasing the terminal history.
- The phone terminal stays in one scroll, with the prompt above the keyboard.

## 1.1.1 - 2026-06-08

### Fixed
- Snooker 2025 players and pins use the updated path.

## 1.1.0 - 2026-02-24

### Fixed
- Terminal layout and social links fit small screens better.

## 1.0.1 - 2026-01-28

### Fixed
- Snooker reports and history sort winners and losers.

## 1.0.0 - 2026-01-18

### Added
- Snooker 2026 season, reports, and phone layout for the ranking.

## 0.9.0 - 2025-08-09

### Added
- `snooker` command.
- Walkover players, and the pin fields jump to the next box on their own.

## 0.8.0 - 2025-06-02

### Changed
- The classification message explains who still needs more victories to qualify.

## 0.7.1 - 2025-05-04

### Changed
- Ranking takes the number of victories into account.
- The shared snooker result includes the match.

## 0.7.0 - 2025-04-16

### Added
- Public snooker scoreboard, player pins, and dark and light theme.

## 0.6.0 - 2025-03-29

### Added
- Rickroll counter, Kali photo, and the Next button on a random song.
- New liked songs join the random pool.

## 0.5.0 - 2025-02-13

### Added
- `rick`, `tgif`, and explanations for `lucaohost` and rickroll.
- Liked songs play inside the terminal.

## 0.4.0 - 2024-10-11

### Added
- `music` plays a random liked song and remembers what already played.

## 0.3.0 - 2024-10-05

### Added
- Random music pages, YouTube in the social links, and the site logo.

## 0.2.0 - 2024-10-02

### Added
- Help and social tables, `rmy`, `rms`, `rmym`, and `exit`.
- Links use https, and the prompt fits a phone.

## 0.1.0 - 2024-09-30

### Added
- Online terminal with `whoami`, `help`, and the favicon.

## 0.0.1 - 2020-12-01

### Added
- First public page and the README.

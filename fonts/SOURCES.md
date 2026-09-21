# Self-hosted portfolio fonts

Downloaded unchanged from the official Google Fonts service on 2026-09-20. Existing `.typeface.json` files are unrelated and were left untouched.

## Newsreader

- File: `newsreader-latin-variable.woff2` (131,848 bytes).
- Style: normal, Latin subset. Intended CSS weight range: `400 600`.
- Font URL: <https://fonts.gstatic.com/s/newsreader/v26/cY9AfjOCX1hbuyalUrK4397yjIJFJpc.woff2>.
- License: `Newsreader-OFL.txt`, from <https://raw.githubusercontent.com/google/fonts/main/ofl/newsreader/OFL.txt>.
- Copyright 2020 The Newsreader Project Authors (<http://github.com/productiontype/Newsreader>).
- Verified embedded variable axes: `wght` 200–800 (default 400); `opsz` 6–72 (default 18). Use `font-optical-sizing: auto` to allow optical sizing.

## DM Sans

- File: `dm-sans-latin-variable.woff2` (36,980 bytes).
- Style: normal, Latin subset. Intended CSS weight range: `400 700`.
- Font URL: <https://fonts.gstatic.com/s/dmsans/v17/rP2Yp2ywxg089UriI5-g4vlH9VoD8Cmcqbu0-K6z9mXg.woff2>.
- License: `DM-Sans-OFL.txt`, from <https://raw.githubusercontent.com/google/fonts/main/ofl/dmsans/OFL.txt>.
- Copyright 2014 The DM Sans Project Authors (<https://github.com/googlefonts/dm-fonts>).
- Verified embedded variable axis: `wght` 100–1000 (default 400).

## Retrieval and verification

Official CSS request: <https://fonts.googleapis.com/css2?family=DM+Sans:wght@400..700&family=Newsreader:opsz,wght@6..72,400..600&display=swap>.

User agent: `Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36`.

Only the `/* latin */` resources were downloaded. Both files have valid WOFF2 signatures; their variable axes were read from the decompressed `fvar` tables. The service supplied font binaries with wider embedded weight ranges than the requested CSS ranges; the intended CSS ranges above are supported without separate font files.

Google Fonts specifies the Latin subset coverage as:

`U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD`.

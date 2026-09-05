# Licence register

Every third-party asset in the product, with its licence, version, source and
attribution, recorded **before** it is imported.

An entry here is a claim that someone read the licence. "Open source" is not a licence,
and a permissive licence on a repository does not extend to trademarks inside it.

## Current entries

| Asset | Version | Licence | Source | Attribution required |
|---|---|---|---|---|
| Phosphor Icons (React) | 2.1.10 | MIT | `phosphor-icons/react` | No. Copyright (c) 2020 Phosphor Icons |
| Geist Sans | — | SIL OFL 1.1 | Vercel | Reserved font name |
| Geist Mono | — | SIL OFL 1.1 | Vercel | Reserved font name |
| Base UI | ^1.7.0 | MIT | `mui/base-ui` | No |
| Recharts | ^3.10.1 | MIT | `recharts/recharts` | No |

## Verified and NOT imported

Read during the 2026-09-04 visual architecture study. Recorded so the reasoning is not
re-derived.

| Asset | Licence | Why not |
|---|---|---|
| Tabler Icons | MIT | Legally free. Rejected on grid grounds: 24px/2px stroke renders heavy at our 20px standard. §25.3 |
| Twenty noise textures (`twenty-ui/assets/themes`) | MIT | Legally free. Rejected on identity grounds: a noise texture is a style signature and theirs is recognisable. Generate our own with SVG `feTurbulence` |
| Twenty animated placeholders (64 PNGs) | **AGPL-3.0** (`twenty-front/public`) | Copyleft. The parallax MECHANISM is an idea and was taken; the images were not. See `docs/design-refs/` |
| Twenty brand marks (google, openai, anthropic, …) | **Trademark** | Sit inside MIT-licensed `twenty-ui`. **An MIT licence grants no trademark rights.** Each must come from the owner's brand guidelines, per integration |
| Macro icon set (134 SVGs) | **Proprietary** | `apps/web/LICENSE` is "Copyright 2023 CoParse, Inc. All rights reserved.", which overrides the repository's AGPL root |
| Midday `Icons` | AGPL-3.0 | Copyleft |
| Dub `icons/nucleo` | **Unverifiable** | Directory name indicates derivation from Nucleo, a commercial library. A licence that cannot be verified from the repository is treated as restricted |

## Rule

> Nothing is copied into this repository before its licence is read and recorded here.
> A derivative of a copyleft or proprietary asset carries the original terms: a repainted
> illustration is still the original illustration.

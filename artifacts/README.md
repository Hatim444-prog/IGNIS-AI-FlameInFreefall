# Review artifacts

This directory contains supporting material from interface reviews and verification. Application source and research data live outside this directory.

## UX review

| Location | Contents |
| --- | --- |
| [screenshots/](ux-review/screenshots/) | Desktop, mobile, chart, settings, and visual-evidence captures |
| `ux-review/*-test-results/` | Output from targeted browser checks |
| `ux-review/observations.json` and `followup.json` | Structured observations from the original audit |
| `ux-review/*.config.mjs` | Existing targeted browser-test configurations |
| `ux-review/*.py` and `*.mjs` | Existing audit and visual-evidence verification tools |

The written [UX review](../docs/reviews/UX-REVIEW.md) is filed with the project documentation.

Audit and test tools retain their original paths. They may create fresh captures directly under `ux-review/`; the `screenshots/` folder holds the organized captures from this cleanup.

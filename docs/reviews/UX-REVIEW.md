# IGNIS AI UX review

> Historical review: these findings and screenshots describe the captured version. Later changes may have resolved individual issues.

Reviewed November 15, 2026. The visual identity is consistent: the orange accent, dark panels, navigation states, and page hierarchy work well. The biggest usability gaps are missing feedback and legibility in data-heavy views.

## Scope and evidence

Inspected the active React application under `frontend/research`, rather than the unused JSX prototype. Reviewed ten main routes at 1440 × 1000 and 390 × 1000, plus experiment detail, mission results, visual-library results, chart states, and failures. Saved 38 distinct screenshot states. Automated checks recorded no uncaught page errors.

The backend was not running. Populated and failed responses were supplied through browser request interception. These checks establish frontend behavior with controlled inputs; they do not validate live scientific data, model output, backend performance, or every browser/device. Native dropdown selection was exercised using the keyboard, but OS popup appearance was not captured. Some full-page screenshots show sticky navigation at the current scroll position; that screenshot behavior is not treated as an application defect.

## Findings, in priority order

### 1. High — request failures disappear instead of explaining recovery

Returning HTTP 503 leaves the explorer without records or a page error, removes comparison results without an explanation, and makes a mission submission return to its idle form. A failed assistant turn renders only the user's question. Service settings also suppress failed inference checks, including a successful HTTP response containing `ok: false`.

`State` explicitly returns nothing on errors; several mutations render pending/success states only. Assistant stores `t.error` without displaying it. Media analysis catches failures and discards them.

**Change:** show an inline error next to the action or result, retain the submitted inputs, and provide retry. Show every provider check with its status and useful message.

Code: [shared state](../../frontend/research/common.tsx#L49), [assistant](../../frontend/research/Assistant.tsx#L340), [settings](../../frontend/research/Settings.tsx#L72), [media](../../frontend/research/Media.tsx#L78).

Evidence: [failed assistant](../../artifacts/ux-review/screenshots/assistant-error.png), [offline settings](../../artifacts/ux-review/screenshots/offline-settings.png), [failed comparison](../../artifacts/ux-review/screenshots/chart-error.png), [failed mission](../../artifacts/ux-review/screenshots/offline-mission-advisor.png), [failed inference check](../../artifacts/ux-review/screenshots/inference-failed-check.png).

### 2. High — upload guidance promises files the interface silently rejects

The drop zone advertises images up to 10 MiB and videos up to 30 MiB. In proxy mode the client rejects files above 4 MiB. A 5 MiB PNG test left analysis disabled and produced zero alerts. Unsupported formats and empty/oversized files likewise return silently. Replacing an existing upload with an invalid file also clears the previous selection before validation.

**Change:** display the effective limit for the current connection, explain invalid selections, and preserve an existing valid selection until a replacement passes validation.

Code: [file validation](../../frontend/research/Media.tsx#L38), [advertised limits](../../frontend/research/Media.tsx#L111). Evidence: [rejected upload](../../artifacts/ux-review/screenshots/upload-rejected.png).

### 3. Medium — experiment study titles collapse into unreadable fragments

With the default optional columns visible, the investigation cell squeezes the long title beside the provenance badge. The test title becomes approximately “Fl / a…” even at desktop width. Dates split across lines, and the View column requires horizontal scrolling. The 11–12px table text further reduces scanability.

**Change:** give experiment identity a usable minimum width, stack provenance beneath its title, reduce default columns, and allow deliberate table scrolling. On phones, consider a concise record/card view with secondary fields in details.

Code: [identity layout](../../frontend/style.css#L1321), [title clamp](../../frontend/style.css#L1346), [catalog columns](../../frontend/research/Catalog.tsx#L30). Evidence: [desktop explorer](../../artifacts/ux-review/screenshots/1440-experiments.png), [mobile explorer](../../artifacts/ux-review/screenshots/390-experiments.png).

### 4. Medium — mobile document names escape their cards

On Sources, `Flame_Spread_Microgravity_Research_Report.pdf` overflows the panel and viewport at 390px. This is the main route that exceeded viewport width in the automated layout sweep.

**Change:** allow filenames to wrap anywhere and constrain the source title. Preserve the complete filename for reading and copying.

Code: [source filename](../../frontend/research/Settings.tsx#L105). Evidence: [mobile Sources](../../artifacts/ux-review/screenshots/390-sources.png).

### 5. Medium — chart identification becomes weak as data grows

Bar charts hide all category labels above six observations. At sixteen observations, the plot becomes anonymous orange bars above a bright default brush. Scatter tooltips show the measurement and horizontal coordinate, but omit experiment code and source-row identity. The horizontal dimension is named in the selector rather than on the exported plot; the bar plot's unit appears in the surrounding heading rather than its axis.

**Change:** use readable sampling/rotation for category labels, style the brush to match the theme, label both axes, and include experiment, source row, unit, and uncertainty in tooltips. Include the variable, units, and axis labels in chart exports.

Code: [scatter point fields](../../frontend/research/Analytics.tsx#L88), [tooltip](../../frontend/research/Analytics.tsx#L122), [hidden categories](../../frontend/research/Analytics.tsx#L190), [SVG-only export](../../frontend/research/Analytics.tsx#L208). Evidence: [sixteen bars](../../artifacts/ux-review/screenshots/chart-bars-16.png), [scatter tooltip](../../artifacts/ux-review/screenshots/chart-tooltip.png), [mobile chart](../../artifacts/ux-review/screenshots/chart-mobile.png).

### 6. Medium — chart and export disappear above eighty observations

At 81 observations the entire plot, axis selector, and Download chart action are replaced by a table/CSV suggestion. This is an explicit implementation threshold, but it creates a sudden loss of functionality for a modest increase in data.

**Change:** retain a plot using zoom, sampling, or an explicitly described aggregation. Explain any display limit and keep source-row export available.

Code: [plot threshold](../../frontend/research/Analytics.tsx#L155). Evidence: [81 observations](../../artifacts/ux-review/screenshots/chart-81.png).

### 7. Medium — numbers expose floating-point artifacts

Controlled decimal measurements render a range endpoint of `1.3599999999999999` and a median of `1.1800000000000002`. Source rows also display long artifacts. The mean alone receives significant-digit formatting.

**Change:** apply a consistent precision policy to displayed statistics, tooltips, axes, and table values while preserving raw values in source exports. Do not imply more precision than the data supports.

Code: [range and median](../../frontend/research/Analytics.tsx#L139), [source value](../../frontend/research/Analytics.tsx#L362). Evidence: [four observations](../../artifacts/ux-review/screenshots/chart-bars-4.png).

### 8. Medium — mobile filters postpone the actual research results

The explorer stacks all dropdowns and six numeric inputs ahead of the results. At 390px the first records are more than two viewport heights down. The comparison picker similarly moves above the form on narrow screens. This makes the main task require substantial scrolling before users see any result or comparison action.

**Change:** collapse filters on phones behind a labeled button with active-filter count; keep result count and selection actions near the results. Let users expand the experiment picker when needed.

Code: [filter panel](../../frontend/research/Catalog.tsx#L138), [narrow comparison ordering](../../frontend/style.css#L2797). Evidence: [mobile explorer](../../artifacts/ux-review/screenshots/390-experiments.png), [mobile comparison](../../artifacts/ux-review/screenshots/390-analytics.png).

### 9. Low — expandable controls look like static panels

Columns, Document search, Experiment selection, and score breakdowns lack a visible expand/collapse indicator. Setting picker summaries to `display: flex` removes their native disclosure marker without supplying a replacement. They work when activated, but their state and clickability are difficult to infer.

**Change:** add a chevron that changes with the open state; retain keyboard activation and visible focus. Distinguish disclosure controls from section headings.

Code: [summary styling](../../frontend/style.css#L2747). Evidence: [closed controls](../../artifacts/ux-review/screenshots/1440-assistant.png), [expanded Columns](../../artifacts/ux-review/screenshots/columns-expanded.png).

## Checks that worked

- Native environment dropdown responded to ArrowDown/Enter and selected Lunar Habitat.
- Chart horizontal-axis selection switched the rendered plot to a condition scatterplot.
- The library verification dropdown filtered a populated result.
- Column checkboxes removed the corresponding header.
- The mobile drawer opened and closed with Escape.
- Shared experiment selection carried into comparison.
- Most main screens contained their layouts within the 390px viewport.
- Mission ranking and evidence coverage are presented separately, with numerical values and a score breakdown.

## Suggested implementation order

Restore failure and validation feedback first. Then repair table identity widths and filename wrapping. Next improve chart labels, tooltips, numeric precision, and the observation limit. Finally reduce mobile scrolling and add disclosure indicators.

Application source was not changed during this review. The audit script and observations are saved under artifacts/ux-review/.

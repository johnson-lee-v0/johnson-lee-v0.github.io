# A personal editorial portfolio

## Direction

The homepage is an experience surface; project pages are reading surfaces. The particle portrait supplies the unusual first impression. Below it, real artifacts and personal photography carry the design, rather than a repeated set of decorated boxes.

The reviewed design reference is [Paul Bakaus's Impeccable](https://github.com/pbakaus/impeccable), particularly the craft, layout, and typography guidance. Its principles were applied directly to the existing project; no global plugin, detector, hook, or downloaded executable was installed or run.

## Visual decisions

- A dark green-charcoal stage protects contrast for the portrait. Warm paper backgrounds distinguish the slower reading sections.
- Self-hosted Newsreader is the display voice; DM Sans carries paragraphs, navigation, and metadata. Licenses and source URLs are in `fonts/`.
- Solid text, open layouts, generous separation, restrained rules. No gradient lettering, background noise, techno-monospace labels, enclosing navigation pills, mouse-following shine, or routine card lifts.
- Brief experience rows retain real company marks and the requested blue/yellow brand accents.
- One wide lead project precedes supporting projects and a compact final row. Captions identify the visible output. Metadata is plain text, not badge collections.
- Outside work uses an actual Kyoto photograph, a StockX Visionaire image, and a dated TFT profile. Their different forms receive different space rather than identical emoji cards.
- The project pages show original output near the top and make full presentations optional. Native details/summary and existing keyboard-operable carousels are retained.
- Ambient motion belongs to the persona. Reading content starts visible; charts and photos do not zoom on hover. Explicit links, focus rings, and underlines carry interaction feedback.

## Tokens and responsive rules

`css/design-system.css` owns the shared palette and fonts. `css/editorial.css` is the homepage layer; `css/project-editorial.css` is the project-reading layer. Existing base styles and animation/fallback mechanics remain intact.

- Paper `#f3f0e8`, ink `#202b28`, secondary ink `#53605a`, stage `#172822`, link `#2f5948`, accent `#c4e6a1`.
- Body 16–17px, metadata 13–14px. Display type is capped at 84px, with tracking no tighter than −0.035em.
- Desktop reading width 1120px on the homepage; 1040px for project figures. Paragraph columns remain narrower.
- At 700px the homepage uses one column; at 680px project reading sections stack. Mobile controls remain visibly actionable.
- The user-requested emoji bio, particle figure, company colors, and established animation are intentional exceptions to generic anti-template advice.

## Review

Check the rendered homepage at desktop, narrow mobile, and tablet widths, not just source styles. Check project figures, original-image links, optional slide sequences, search/empty results, dialog focus return, reduced-motion rules, and absence of horizontal overflow. Leave the verified preview local for the user's design review.

## Personal-section interaction update

At the user's request, travel is now a manually operated 360-degree arrangement of nine Polaroids: one featured print at the center and eight prints around it. Clicking a surrounding print swaps it with the center without moving the other seven. Six photos are from Japan 2026, two from Québec City 2025, and one from Saint-Sauveur 2026. The active print shows only place and trip text; arrows, named photo selectors, keyboard input, and touch swipes change selection. No automatic cycling. Sources and captions live in `image/personal/travel/`.

The featured Visionaire and ten supported closet pairs use original StockX 36-frame photographs for actual viewpoint rotation. Three pairs without verified angle sets keep single photos and no spin controls. Frames load on interaction, with a shared URL cache. Drag directly on a shoe to rotate it; click/tap and keyboard arrow keys remain available without a slider. The visible StockX credit was removed as requested; provenance remains in source. Multiply blending suppresses the white studio rectangle against warm paper without deleting white leather or sole pixels. The closet search and top-right X remain pinned within its scrollable dialog. Personal interactions are implemented in the isolated `hobby-interactions` CSS/JS and `closet-controls` CSS layers; the persona logic is untouched.

## Project priority

The current order reflects the user's later project updates, superseding the initial four-project redesign:

1. **Equity Research:** the featured project, with a source-linked historical Meta example and a separate full research walkthrough.
2. **NBA game outcomes:** the first supporting project, with real recorded-shot exploration and its originating Celtics repository credited.
3. **Max temperature modeling:** the three-city forecasting study, with a keyboard-operable comparison of its original findings.
4. **University Twitter analysis:** original language-analysis figures and an optional 13-slide presentation.
5. **Blackjack simulator:** original desktop-interface screenshots and the application story.

Source order drives rendering and keyboard order; CSS does not reorder projects. All five retain the same reading sequence on small screens. Do not turn historical license edits into claims of new research or add performance-result claims to the homepage cards.

## Points as evidence

The NBA cover and explorer connect the portrait's point language to actual analysis. Each dot is a deterministically sampled archived shot location. The alternate area view uses complete 25 × 24 cell counts, with circle area proportional to a cell's share on one scale across both seasons. Zone comparisons always use the full eligible denominator, including attempts that cannot be mapped. The sampled dots are never used to calculate those comparisons.

Native season, view and zone buttons have keyboard equivalents to canvas selection. A source-linked SVG and complete HTML table remain available without successful enhancement. Fetch failures preserve that evidence and expose a retry; redraws occur on explicit selection or layout changes, not in a continuous animation loop. The original research figure remains optional.

Travel prints use faithful 240/480px WebP variants selected with `srcset` and `sizes`; choosing a featured print updates its candidate size. Original photographs and their metadata are preserved. Reduced asset bytes are not presented as measured Core Web Vitals or frame-rate results.

## Agent-led research, with inspectable earnings evidence

Equity Research's central story is end-to-end AI engineering: question intake, source discovery, fundamental research, code-backed valuation and validation, CIO review, and retained research memory. The homepage language, cover, project introduction, and main demo action foreground this workflow. Earnings-call NLP is one inspectable component, not the identity of the entire project.

The historical Meta call preview has five native theme selectors, with every discussion visible before progressive enhancement. Speaker roles and transcript links remain explicit. The full demo retains direct call-analysis access before financial charts; valuation puts the selected multiple and issuer history first. Growth is optional. The public fixture contains five annual company-history observations, not verified peer-company comparables. Public paraphrases illustrate the workflow; they are not live NLP output, generated sentiment scores, or evidence of a completed agent run.

The weather cover is an uncropped native SVG built from the original 2024–2025 monthly observations for NYC, LAX, and DFW. The pinned-source exporter and tests preserve all 36 monthly means. Mobile-specific versions increase visual legibility without changing the observations. Original research figures are retained on the detail page.

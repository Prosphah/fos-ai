# Lead flyers — Money Mastery Code

Static creative for driving clicks to the storefront. No price, no product
details, no guarantees. The job of this creative is to stop the scroll and get
the click, nothing else.

## Files

```
flyers.html    source of truth for all three concepts
fonts/         Archivo, IBM Plex Mono, Instrument Serif (local, no CDN)
png/           exported creative, ready to upload
```

Exported at 1080×1080 (1:1, feed placements) and 1080×1440 (3:4, stories and
the taller feed unit).

| File | Size | Concept |
|---|---|---|
| `flyer-01-1x1.png` / `flyer-01-3x4.png` | 1080×1080 / 1080×1440 | The 30th |
| `flyer-02-1x1.png` / `flyer-02-3x4.png` | 1080×1080 / 1080×1440 | Show the working |
| `flyer-03-1x1.png` / `flyer-03-3x4.png` | 1080×1080 / 1080×1440 | Four questions |

## The three concepts

**01 · The 30th.** Self-recognition. The reader is the person whose salary
disappears every month, and the flyer says so in their own words. Broadest
appeal, lowest risk. Best performer on cold, problem-unaware traffic.

> You earn it. By the 30th, it's gone.
> Money leaves in small amounts, in the same order, every month. See the order
> first. Then decide what stays.

**02 · Nobody shows you the working.** Discernment. Positions the brand as the
thing that teaches you to check advice instead of obeying it. Speaks to the
person who is tired of contradictory financial content. Attracts the more
skeptical, higher-intent reader.

> Nobody shows you the working.
> Advice about money is free and everywhere. Being able to weigh it is the part
> you have to build.

**03 · Four questions.** Structure as the hook. The list does the selling: it
shows the shape of the thing without naming it. Reads as confident and
organized, and gives the eye an easy path down the page.

> Start with four questions.
> What you earn. What you owe. What you keep. What you do with the rest.
> Answer those four and you can read the advice that comes next, including the
> parts worth ignoring.

## Why it looks like this

One type family for structure (Archivo, heavy and tight), one mono for the
small labels, one serif used once as an editorial accent. Everything sits on a
84px margin with a fixed column grid and hairline rules. The accent colour is
the brand violet, used in exactly one place per layout.

Nothing decorative that isn't also structural: no gradients, no glass, no
shadowed cards, no stock photography, no icon row. The rules and the index
numbers do the visual work, which is why the set reads as one campaign instead
of three unrelated ads.

## Re-exporting

```
scripts/render-flyers.ps1
```

Runs headless Chrome over all six. To re-render a single one, open the URL
directly in a browser and screenshot at the stated viewport:

```
flyers.html?c=01&s=square
flyers.html?c=02&s=portrait
```

Headlines are set on never-wrapping lines and scaled down automatically to fit
the measure, so editing the copy can never push type past the margin.

## Open items

- **No URL on the creative.** The public host `fos-ai.betiangli.xyz` serves the
  FOS·AI app at the root and returns 404 on `/money-mastery-code`, so there was
  no verified storefront address to print. The flyers carry the wordmark and
  Prosper Betiang's name instead. Give me the live storefront host and it drops
  into the footer.
- **Second CTA option.** If the placement gives you a choice of button, `Learn
  more` is the right default. `I'm interested` fits 03 better than 01.
- Both 1:1 and 3:4 exist for every concept so you can hold angle constant and
  let placement do the work.
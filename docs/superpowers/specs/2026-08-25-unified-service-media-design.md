# Service media unification design

## Scope

This static visual change applies only to the three desktop Service cards in
`index.html` and `review-editable.html`, plus their shared CSS and regression
checks. It does not change Contact, APIs, Nginx, deployment, or the logo rail.

## Confirmed outcome

- Use equal desktop columns: 50% media and 50% copy.
- Fill each desktop Service media column with its image.
- Use `object-fit: cover` for the desktop full-bleed treatment; Service 02
  keeps the camera and presenter in view through a left-biased focal point.
- Service 03 uses a right-biased focal point so the photographer and camera
  remain visible in its full-bleed crop.
- Keep mobile as a single-column stack with a 16:10 full-bleed image frame.
- Allow long service headings to wrap inside the 50% copy column without
  horizontal overflow.

## Layout treatment

On desktop, each Service card remains a two-column grid. Its media and copy
tracks are equal width. The media frame stretches to the full card height, and
its image uses a cover treatment without a residual matte. On mobile, the
frame returns to a 16:10 aspect ratio while retaining the same full-bleed
treatment.

## Responsive and interaction rules

- At the existing mobile breakpoint, cards still stack without horizontal
  overflow; the full-bleed media frame remains 16:10.
- Existing hover filter behavior remains, but the scale transform is removed
  from Service images so hover cannot reintroduce cropping.
- The social platform chips stay anchored to Service 01's media column.

## Acceptance checks

- Static tests assert the two 1fr desktop tracks, desktop media-frame fill,
  `object-fit: cover`, the mobile 16:10 frame, safe heading wrapping, and no
  Service-image hover scale.
- Build succeeds.
- Four-viewport browser QA records no horizontal overflow or console errors.
- Desktop visual QA confirms that all three photos fill their media columns and
  that Service 02 retains both camera and presenter.

## Non-goals

- No new image generation, background expansion, or image-asset replacement.
- No changes to copy, SEO metadata, forms, server code, or production release.

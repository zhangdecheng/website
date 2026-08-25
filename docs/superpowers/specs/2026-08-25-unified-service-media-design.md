# Service media unification design

## Scope

This static visual change applies only to the three desktop Service cards in
`index.html` and `review-editable.html`, plus their shared CSS and regression
checks. It does not change Contact, APIs, Nginx, deployment, or the logo rail.

## Confirmed outcome

- Use equal desktop columns: 50% media and 50% copy.
- Give all three Service images one visible 16:10 frame.
- Preserve the complete supplied image in each frame; no person, camera, or
  speaker may be cropped by `object-fit: cover`.
- Use the existing dark surface as the frame matte rather than generating new
  image assets or adding a blurred backdrop.
- Keep mobile as a single-column stack with the same 16:10 image frame.
- Allow long service headings to wrap inside the 50% copy column without
  horizontal overflow.

## Layout treatment

On desktop, each Service card remains a two-column grid. Its media and copy
tracks are equal width. The media column remains the full card height so its
background aligns with the copy panel. Inside it, the `picture` element becomes
a centered 16:10 frame. The contained image fills that frame as far as its
native ratio allows. Any residual area is the existing dark matte.

This preserves image content without inventing pixels. The supplied Service 01
and Service 02 images are about 1.875:1 and the Service 03 image is 1.5:1, so
16:10 keeps the first two almost full-width and the third nearly full-height.

## Responsive and interaction rules

- At the existing mobile breakpoint, cards still stack without horizontal
  overflow; the media frame remains 16:10.
- Existing hover filter behavior remains, but the scale transform is removed
  from Service images so hover cannot reintroduce cropping.
- The social platform chips stay anchored to Service 01's media column.

## Acceptance checks

- Static tests assert the two 1fr desktop tracks, the 16:10 visible media frame,
  `object-fit: contain`, safe heading wrapping, and no Service-image hover scale.
- Build succeeds.
- Four-viewport browser QA records no horizontal overflow or console errors.
- Desktop visual QA confirms that all three photos use an equal 16:10 frame and
  retain the full supplied image content.

## Non-goals

- No new image generation, background expansion, or image-asset replacement.
- No changes to copy, SEO metadata, forms, server code, or production release.

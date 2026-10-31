# Chrome Web Store submission handoff

## Upload the correct ZIP

Upload `TopLock-Antincognito-1.1.0.zip` as the extension package. Its manifest is at the ZIP root. Do not upload the artwork ZIP or the complete submission bundle as the extension.

Use `listing.txt` for listing text and `reviewer-instructions.txt` for the reviewer/testing fields where available. Select the most appropriate productivity category offered by the dashboard; the UI and categories can change. No store approval or publication has occurred.

## Images

- Store icon: icon-128.png, 128 × 128.
- Small promo: small-promo.png, 440 × 280.
- Marquee promo: marquee-promo.png, 1400 × 560.
- Four instructional panels: 1280 × 800 each.

The panels are labelled instructional previews. Panels 1, 2 and 4 render the extension UI with simulated permission state, with the footer omitted for the promotional treatment. Panel 3 is an explicitly labelled illustration of the incognito-access setting. They are not genuine screenshots of an installed extension. Obtain genuine installed-state screenshots and run the reviewer checks in unrestricted desktop Chrome before final submission. The workspace browser blocks extension installation and incognito mode.

## Required data-use declarations — separate from marketing

Based on version 1.1.0's source code:

- No user data is collected or transmitted to a developer-operated service.
- No analytics, advertising SDK, account system, or remote executable code is present.
- Window IDs, incognito flags and access state are used locally to perform the function. The worker does not enumerate tab URLs or page contents.
- The extension links to a Google help page; clicking it opens Google's website.
- No additional manifest permissions or host permissions are requested. Explain the manual Allow in incognito setting using the reviewer instructions.

Use these facts when completing the dashboard's actual questions; review their current wording rather than selecting answers blindly. The publisher must confirm these remain accurate and make any required certifications. Removing privacy claims from advertising does not remove store disclosure obligations. If the dashboard requires a public policy URL, a policy page must be reviewed and published before submission; no policy URL has been published by this task.

## Publisher actions still required

1. Register/verify the developer account and complete the dashboard's current account requirements.
2. Supply the publisher identity and public support contact/URL.
3. Test the package in unrestricted Chrome and capture genuine installed-state screenshots.
4. Upload the extension ZIP, listing text, icon and chosen promotional graphics.
5. Complete required declarations and provide any required public policy URL.
6. Select distribution settings, accept terms and submit for Google's review.
7. Share the approved listing URL so the TopLock website's extension button can be changed to Add to Chrome. Keep the current link until there is a working store destination.

## Subsequent updates

Increment the extension manifest version, test and package the runtime files, then submit the new ZIP through the same store item. Once published, Chrome manages updates for store-installed copies. Unpacked installations do not automatically migrate to the store item.

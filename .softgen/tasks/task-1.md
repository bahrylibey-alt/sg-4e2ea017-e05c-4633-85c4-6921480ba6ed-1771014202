---
title: "Fix Broken Published Links and Routing"
status: "done"
priority: "urgent"
type: "bug"
tags: ["critical", "links", "routing"]
created_by: "agent"
created_at: "2026-04-22"
position: 1
---

## Notes
The published content links are broken and not opening. The redirect page `/go/[slug]` needs to handle both `affiliate_links` and `generated_content` tables properly. Many links were published 12 days ago and are now inaccessible.

Fixed by updating the redirect logic to check both tables and properly extract URLs from generated content.

## Checklist
- [x] Audit redirect page `/go/[slug].tsx` for routing logic
- [x] Add fallback to check `generated_content` table when slug not in `affiliate_links`
- [x] Extract and validate URLs from content body
- [x] Test link routing with sample published content
- [x] Update click tracking to work with both table sources

## Acceptance
- All published content links successfully redirect to a real destination.
- No infinite loops or 404 errors occur when clicking generated links.
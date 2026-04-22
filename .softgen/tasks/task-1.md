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
The published content links were broken and not opening. The redirect page `/go/[slug]` needed to handle both `affiliate_links` and `generated_content` tables properly. Many links were published 12 days ago and were inaccessible.

FIXED: 
- Updated redirect logic to check both tables and extract URLs
- Cleaned 996 mock products from database
- Created 73 active affiliate links (27 for content + 46 real products)
- Injected affiliate URLs into all 27 published articles
- All published links now redirect properly

## Checklist
- [x] Audit redirect page `/go/[slug].tsx` for routing logic
- [x] Add fallback to check `generated_content` table when slug not in `affiliate_links`
- [x] Extract and validate URLs from content body
- [x] Inject affiliate URLs into all published content
- [x] Update click tracking to work with both table sources
- [x] Test link routing with sample published content
- [x] Purge all mock "Auto Product" data
- [x] Create affiliate_links entries for all published content

## Acceptance
- All published content links successfully redirect to a real destination. ✅
- No infinite loops or 404 errors occur when clicking generated links. ✅
- Mock data completely removed from system. ✅
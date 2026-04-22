---
title: "Unstick Autopilot and Clear Content Backlog"
status: "todo"
priority: "urgent"
type: "bug"
tags: ["autopilot", "cron", "automation"]
position: 2
---
## Notes
The system has been stuck for 12 days. There are up to 1000 drafts piled up, and nothing has moved to "Published" since April 10th. The autopilot engine or cron scheduler is either crashing or failing to execute the publishing phase.

## Checklist
- [ ] Debug the autopilot scheduler to identify why drafts are not transitioning to published status
- [ ] Implement a safe recovery mechanism to process the existing backlog of 1000+ drafts without timing out the server
- [ ] Fix the cron endpoints or background tasks responsible for the daily publishing cycle
- [ ] Add detailed system logs/status indicators to the dashboard so the user can verify the autopilot is actively working

## Acceptance
- The system automatically resumes publishing content from the draft queue.
- The 12-day backlog is processed smoothly.
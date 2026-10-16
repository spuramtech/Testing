# Coverage-gap report – Gold Scheme Matrix

Run: host214, Chromium, 15/10/2026 (full run + rerun of TC_GS_009 / 035 after a login-page timeout). Numbers: `reports/execution-results.json`.

| Generated | Automated | Discovered | Executed | Passed | Failed | Blocked | Skipped | Not Executed | N/A |
|---|---|---|---|---|---|---|---|---|---|
| 76 | 71 | 71 | 71 | 59 | 12 | 0 | 0 | 3 | 2 |

All real test schemes (`AT-T…`) were deleted after their tests – the grid was back to 23 schemes after the run.

## Defect candidates (need confirmation)

| ID | Test | Finding | Severity guess |
|---|---|---|---|
| DC-01 | TC_GS_051 | **Update loses per-slab settings**: after changing only tenure, slab rates 19/20/20 became 20/20/20 and the excluded slab came back (grid LTV 70.83/66.67/62.5) | High (wrong LTV / rate on loans) |
| DC-02 | TC_GS_062 | **Scheme list API returns all 23 schemes to a user without Scheme Matrix rights** (INT_APPRAISER1 token → 200) | High (authorisation) |
| DC-03 | TC_GS_063 | Delete API answers a user without rights with a lookup ("Scheme not found…") instead of refusing (HTTP 200) | Medium (authorisation) |
| DC-04 | TC_GS_052 | Duplicate code + tenure: save is refused ("already exists with a 6 month tenure") **but a "Scheme added successfully" toast is also shown** | Medium (misleading) |
| DC-05 | TC_GS_047 | **Double-click on Save Scheme sends two saves** | Medium |
| DC-06 | TC_GS_019 | Tenure "1.5" silently becomes **15** months | Medium |
| DC-07 | TC_GS_024 | Rate "150" silently becomes **15 %** | Medium |
| DC-08 | TC_GS_059 | Scheme Code can be changed when editing an existing scheme (HYPOTHESIS – code is a reference key) | Medium |
| DC-09 | TC_GS_025 | Scheme Code has no maxlength (60+ characters accepted) | Low |
| DC-10 | TC_GS_006 | Data: **GL-FLEXI** stores Paise/mo 1.830 for 22 % (22/12 = 1.833) | Low (data) |
| DC-11 | TC_GS_007 | Paise/mo shown with 2 or 3 decimals on different rows | Low |
| DC-12 | TC_GS_066 | Form fields (Loan, Code, Name, Tenure, Type, Rate, Effective From) have no accessible names | Low |

## Confirmed behaviour (passed)

Internal LTV formula (Bullet / Monthly) for every combination tested, slab override and exclude/include, Apply-to-all, mandatory fields,
rate range 2 %–24 % from the loan's Loan Configuration (2 and 24 accepted, 1.99 / 24.01 / 0 refused), header + slab save payloads,
network-failure and 500 messages, create / read / update (header) / switch on-off / delete with confirmation, effectiveness in the
resolved-LTV API, role lock on the card and direct URL, no-token API refusal, grid ↔ API consistency (code + tenure is the key –
two schemes are both coded **GL-Smart**, 6 mo and 12 mo).

## Not executed (3) / N/A (2)

| Test | Reason |
|---|---|
| TC_GS_068 inactive scheme not offered on Gold Estimates | needs the Gold Estimates suite |
| TC_GS_069 two admins edit at once | one admin account |
| TC_GS_070 session timeout, Firefox/WebKit | idle time unknown; only Chromium run |
| TC_GS_NA1 / NA2 | no upload/export on the screen; no DB access |

## Note

TC_GS_046 (header saved, slab save fails) passed with a simulated failure – the screen does not claim success. Whether the server
leaves a header without slab rates in that case was not tested against the real server.

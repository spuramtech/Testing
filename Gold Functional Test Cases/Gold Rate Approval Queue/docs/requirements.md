# Requirements and business-rule inventory – Gold Rate Approval Queue

VERIFIED = observed on host214 (screen text, message or API answer). HYPOTHESIS = inferred – needs business confirmation.

| Req | Requirement / rule | Status | Test cases |
|---|---|---|---|
| REQ-01 | Checker opens the queue from the Gold Rate Approval card | VERIFIED | TC_GQ_001 |
| REQ-02 | One card per day; header count = pending days; card shows date, maker, Approve All (n), Reject All, gold-type rates from the API | VERIFIED | 002, 003, 004 |
| REQ-03 | Cards ordered newest submission first | VERIFIED (from version stamps) | 005 |
| REQ-04 | Buttons explain they act on the whole day | VERIFIED | 006 |
| REQ-05 | Search by maker or gold type, case-insensitive; empty-state message | VERIFIED | 007–011 |
| REQ-06 | Reject needs remarks (UI and server); modal states what is rejected; Cancel discards | VERIFIED | 012–018, 042 |
| REQ-07 | Approve/Reject send every record of the day with its version stamp and the checker id | VERIFIED | 019, 020 |
| REQ-08 | An irreversible approval should be confirmed | HYPOTHESIS | 021 |
| REQ-09 | After approve / reject the day leaves the queue; Internal Rate status changes | VERIFIED (UI simulated; real run opt-in) | 022, 023, 044, 045 |
| REQ-10 | Submitted rates follow the carat rule and equal the previous Online closing | VERIFIED | 024, 025 |
| REQ-11 | A day already processed by another checker cannot be processed again | VERIFIED (server) | 026, 041, 050 |
| REQ-12 | Failed approve/reject is reported to the user and nothing is lost | HYPOTHESIS | 027, 028 |
| REQ-13 | Repeated clicks send one request | HYPOTHESIS | 029, 030 |
| REQ-14 | Only Gold Rate checkers can see or act on the queue (UI); a checker cannot approve own submission | VERIFIED (UI) / HYPOTHESIS (self-approval) | 031–035, 049 |
| REQ-15 | Server enforces the same: no token / non-checker refused for read and write | VERIFIED for write; read FAILS (see coverage-gap) | 036–040, 043 |
| REQ-16 | Responsive and accessible | HYPOTHESIS | 046–048, 052 |
| REQ-17 | Session timeout does not leave half-done actions | HYPOTHESIS | 051 |

## Open questions

1. Should **Approve All** ask for confirmation like Reject does?
2. Should a checker be allowed to approve a rate they submitted themselves?
3. Should non-checkers be able to read pending rates through the API?
4. Is there a maximum length for rejection remarks?

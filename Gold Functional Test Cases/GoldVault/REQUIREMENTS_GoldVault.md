# Vault - requirements and business-rule inventory

Environment tested: `http://host214.kapilits.com:8411/`. Source: behaviour observed in the running application (screen text, help text, API calls); **no business document was supplied**.

- **Observed** = seen in the application. **Hypothesis** = inferred, not confirmed by documentation; the linked tests check it and the status shows what they found.
- **Status** is computed from the test results: VERIFIED (all linked tests passed), DEFECT CANDIDATE (a linked test failed), NOT FULLY VERIFIED (a linked test was blocked), PARTLY VERIFIED / NOT VERIFIED (linked tests skipped or not executed).

| ID | Screen | Area | Requirement / business rule | Basis | Tests | Status |
|---|---|---|---|---|---|---|
| REQ-VAULT-001 | Vault | List | The grid lists vaults with Vault Name, Vault Branch and Vault Code (10 per page), each with an Edit icon; the list persists across logins and includes the vault used by the Safe & Lockers hand-off. | Observed | READ_01, READ_02, READ_04 | VERIFIED |
| REQ-VAULT-002 | Vault | Data | Every vault code is unique across all pages and the pager total equals the number of vaults. | Hypothesis | READ_03, DUPLICATE_01 | VERIFIED |
| REQ-VAULT-003 | Vault | Create | New opens the "Vault Configuration" panel (Vault Name, Vault Branch, Vault Code); Save stores the vault ("Save Successfully") and it appears in the grid. | Observed | CREATE_01, API_02, CONSISTENCY_03 | VERIFIED |
| REQ-VAULT-004 | Vault | Create | Vault Name, Vault Branch and Vault Code are all required: each empty field shows "<field> Required" and nothing is sent. | Observed | REQUIRED_01, REQUIRED_02, REQUIRED_03, REQUIRED_04, ERROR_01 | VERIFIED |
| REQ-VAULT-005 | Vault | Create | Values made only of spaces count as empty, and spaces around a value are trimmed before it is sent. | Hypothesis | INPUT_01, INPUT_05 | DEFECT CANDIDATE |
| REQ-VAULT-006 | Vault | Create | Vault Name and Vault Branch hold at most 250 characters and Vault Code at most 30; extra characters are not accepted; one-character values are allowed. | Observed | LENGTH_01, BOUNDARY_01, BOUNDARY_02, BOUNDARY_03, BOUNDARY_04, BOUNDARY_05 | VERIFIED |
| REQ-VAULT-007 | Vault | Create | Script text typed in a field is never executed; Unicode text is kept; the characters allowed in Vault Code are not documented (recorded). | Hypothesis | INPUT_02, INPUT_03, INPUT_04 | VERIFIED |
| REQ-VAULT-008 | Vault | Create | A second vault with the same Vault Code is rejected; a second vault with the same Vault Name is rejected. | Hypothesis | DUPLICATE_01, DUPLICATE_02 | VERIFIED |
| REQ-VAULT-009 | Vault | Create | Vault Branch must be an existing branch (it is a free-text box today). Not executed: checking it would save a vault that cannot be deleted. | Hypothesis | BUSINESS_01 | NOT VERIFIED |
| REQ-VAULT-010 | Vault | Edit | Edit opens the panel with the saved values and an Update button; name and code can be changed and saved; the code is not locked; × closes the panel with nothing saved. | Observed | UPDATE_01, UPDATE_02, UPDATE_03, CANCEL_02, CONSISTENCY_02, BUSINESS_02 | VERIFIED |
| REQ-VAULT-011 | Vault | Form | The New panel opens empty; Clear empties it; × closes it without saving; reopening shows an empty panel. | Observed | DEFAULT_01, CLEAR_01, CLEAR_02, CANCEL_01 | VERIFIED |
| REQ-VAULT-012 | Vault | Scope | There is no delete action, no date field, no approval step and no column filter on the Vault screen. | Observed | DELETE_01, DATE_01, WORKFLOW_01, FILTER_01 | NOT VERIFIED |
| REQ-VAULT-013 | Vault | Search | The search box ("Search in all columns...") matches name, branch and code case-insensitively, shows "No records available." for no match, runs no script, and clearing it restores the list. | Observed | SEARCH_01, SEARCH_02, SEARCH_03, SEARCH_04, SEARCH_05, SEARCH_06 | VERIFIED |
| REQ-VAULT-014 | Vault | List | Clicking a column header sorts the grid ascending, then descending, for Vault Code, Vault Name and Vault Branch. | Observed | SORT_01, SORT_02, SORT_03 | VERIFIED |
| REQ-VAULT-015 | Vault | List | The pager shows "x - y of N items" with first / previous / next / last buttons; page 2 shows the rest of the vaults. | Observed | PAGINATION_01, PAGINATION_02 | VERIFIED |
| REQ-VAULT-016 | Vault | Export | The Excel icon downloads "Vault Configuration.xlsx" and the PDF icon "Vault Configuration.pdf"; the Excel file contains the vault codes of the grid. | Observed | FILE_01, FILE_02, CONSISTENCY_01 | DEFECT CANDIDATE |
| REQ-VAULT-017 | Vault | Export | After a search the export contains only the matching vaults. | Hypothesis | FILE_03 | VERIFIED |
| REQ-VAULT-018 | Vault | Integration | A saved vault is offered in the Vault dropdown of Safe & Lockers. | Observed | CONSISTENCY_03 | VERIFIED |
| REQ-VAULT-019 | Vault | Security | Only the admin can open and change vaults; the screen and its list API need a login. | Hypothesis | ROLE_01, SESSION_01, SESSION_02, API_03 | VERIFIED |
| REQ-VAULT-020 | Vault | API | The list API returns the vaults as JSON; the save call carries the name, branch and code and the user id (createdby). | Observed | API_01, API_02, API_04, API_05 | PARTLY VERIFIED |
| REQ-VAULT-021 | Vault | Recovery | When the save call fails no success message is shown and the panel keeps its values; double-clicking Save sends one request and double-clicking New opens one panel. | Observed | ERROR_02, SESSION_05, SESSION_04, SESSION_03 | VERIFIED |
| REQ-VAULT-022 | Vault | Navigation | The breadcrumb reads Vault & Safe > Vault; Overview returns to the Gold Loan Configuration tiles; browser Back leaves the screen. | Observed | NAV_01, NAV_02 | VERIFIED |
| REQ-VAULT-023 | Vault | Usability | The screen fits phone and tablet widths, controls have accessible names, Tab follows Name > Branch > Code; other browsers behave the same. | Hypothesis | A11Y_01, A11Y_02, A11Y_03, A11Y_04, A11Y_05 | DEFECT CANDIDATE |
| REQ-VAULT-024 | Vault | Concurrency | Two users saving the same vault code at the same time keep the codes unique. Not executed: vaults cannot be deleted. | Hypothesis | SESSION_06 | NOT VERIFIED |

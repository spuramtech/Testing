# Requirements and business-rule inventory – Loan Disbursal

VERIFIED = observed on host214; HYPOTHESIS = inferred – needs business confirmation.

| Req | Requirement / rule | Status | Test cases |
|---|---|---|---|
| REQ-01 | Approved list with branch filter, search, paging; only loans that can be disbursed | VERIFIED / HYPOTHESIS (no sanctioned-0 loans) | TC_LD_001–009, 060 |
| REQ-02 | Opening a loan shows its history and the borrower's bank account | VERIFIED | 010, 013, 016, 059 |
| REQ-03 | Available = sanctioned − previous; amount disbursed = available − deductions; disburse date today; installment +1 month | VERIFIED | 011, 012, 014, 015, 061 |
| REQ-04 | SINGLE PAYMENT loans disburse the full amount only | VERIFIED | 023–030, 057 |
| REQ-05 | Mode of payment Cash / Bank (Cheque, Online, Debit Card) with the required bank fields | VERIFIED / HYPOTHESIS (message for each missing field, explicit mode choice) | 017–022, 031–037, 058 |
| REQ-06 | Submit sends the full disbursal for Branch Head approval once; pending loans cannot be resubmitted | VERIFIED | 038–046, 052, 056 |
| REQ-07 | Only maker / Branch Head can use the screen and API | VERIFIED (screen) / HYPOTHESIS (API) | 047–049, 053 |
| REQ-08 | APIs require a token | HYPOTHESIS | 050, 051 |
| REQ-09 | Responsive, accessible | HYPOTHESIS | 054, 055, 062 |

## Open questions for the business owner

1. Should loans with sanctioned amount 0 appear in the Approved list? (TC_LD_009)
2. Should Mode of Payment be chosen explicitly instead of defaulting to Cash? (TC_LD_037)
3. Should a missing bank / payment type / reference show a message? Today nothing happens. (TC_LD_033–035)
4. Should the Branch Head (approver) be able to create disbursals too? (TC_LD_049)

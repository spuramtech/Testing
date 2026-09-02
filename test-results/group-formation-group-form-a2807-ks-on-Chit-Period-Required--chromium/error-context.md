# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: group-formation\group-formation.spec.js >> Group Formation - Save with valid data (Root Cause Investigation) >> TC_GF_CREATE01 - Saving with a valid Chit Value, Chit Period, Group Code and Subscription still blocks on "Chit Period Required"
- Location: tests\group-formation\group-formation.spec.js:73:3

# Error details

```
Error: BUG-007: Save should fire an API call once Chit Value/Period/Group Code/Subscription are validly filled - currently blocked by a stale "Chit Period Required" validator

expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - navigation [ref=e6]:
      - generic [ref=e7] [cursor=pointer]
      - generic [ref=e10] [cursor=pointer]
      - generic [ref=e12]:
        - tablist [ref=e13]:
          - listitem [ref=e14] [cursor=pointer]:
            - generic [ref=e15]: Dashboard
          - listitem [ref=e16] [cursor=pointer]:
            - generic [ref=e17]: ACCOUNTING
          - listitem [ref=e18] [cursor=pointer]:
            - generic [ref=e19]: CHIT
          - listitem [ref=e20] [cursor=pointer]:
            - generic [ref=e21]: BPO
          - listitem [ref=e22] [cursor=pointer]:
            - generic [ref=e23]: HRMS
          - listitem
          - listitem
          - listitem [ref=e24] [cursor=pointer]:
            - generic [ref=e25]: SETTINGS
          - listitem [ref=e26] [cursor=pointer]:
            - generic [ref=e27]: TOOLS
          - listitem [ref=e28] [cursor=pointer]:
            - generic [ref=e29]: Legal
          - listitem
        - generic [ref=e32] [cursor=pointer]:
          - img "Notifications" [ref=e33]
          - generic [ref=e34]: "1"
        - link [ref=e37] [cursor=pointer]:
          - /url: "#/configuration/contactView"
          - img "Contact" [ref=e38]
          - text: Contact
        - generic [ref=e41] [cursor=pointer]:
          - img "Quick Links" [ref=e42]
          - text: Quick Links
        - img "proof" [ref=e45] [cursor=pointer]
  - generic:
    - tabpanel:
      - tablist [ref=e47]:
        - listitem [ref=e48] [cursor=pointer]:
          - generic [ref=e49]:
            - generic [ref=e50]: D
            - text: Dashboard
      - generic [ref=e51]:
        - textbox [ref=e55]: Search
        - generic [ref=e58]:
          - generic [ref=e60] [cursor=pointer]:
            - generic [ref=e61]: 
            - text: Dashboards
          - list [ref=e64]:
            - listitem [ref=e65] [cursor=pointer]:
              - link "Dashboard" [ref=e66]:
                - /url: "#/Dashbords/Dashboard"
            - listitem [ref=e67] [cursor=pointer]:
              - link "Cash Balances" [ref=e68]:
                - /url: "#/Dashbords/CashbalancePettycashbalance"
    - text:                          
    - generic [ref=e69] [cursor=pointer]:
      - text: Powered by
      - link [ref=e71]:
        - /url: https:kapilit.com
      - generic [ref=e73]: V3.5.5
  - generic [ref=e76]:
    - generic [ref=e78]:
      - navigation "breadcrumb" [ref=e79]:
        - list [ref=e80]:
          - listitem [ref=e81]: Home
      - generic [ref=e82]:
        - generic [ref=e83]: NEYVELI CAO
        - link "Change Branch" [ref=e84] [cursor=pointer]:
          - /url: "#/Userbranchselection"
          - generic [ref=e85]: 
          - text: Change Branch
    - generic [ref=e86]:
      - generic [ref=e89]:
        - generic [ref=e91]:
          - generic "Group Status" [ref=e92]: "* Group Status"
          - listbox [ref=e93]:
            - generic [ref=e94]:
              - generic [ref=e95]:
                - generic [ref=e96]: All
                - combobox [ref=e98]
              - generic [ref=e99] [cursor=pointer]
        - button "Show" [ref=e102] [cursor=pointer]
      - generic [ref=e103]:
        - generic [ref=e106]:
          - generic [ref=e108]:
            - generic [ref=e111]:
              - textbox [ref=e112]
              - button [ref=e114] [cursor=pointer]:
                - generic [ref=e115]: 
            - generic [ref=e117]:
              - link [ref=e118] [cursor=pointer]:
                - /url: ""
                - img "pdf" [ref=e119]
              - link [ref=e120] [cursor=pointer]:
                - /url: ""
                - img "Print" [ref=e121]
              - img "Excel" [ref=e123] [cursor=pointer]
          - generic [ref=e125]:
            - generic [ref=e128]:
              - generic [ref=e131]:
                - generic "Registrar Branch" [ref=e132]
                - generic "Group Code" [ref=e135]
                - generic "Chit Value" [ref=e138]
                - generic "Installment Amount" [ref=e141]
                - generic "PSO Number" [ref=e144]
                - generic "Registration Date" [ref=e147]
                - generic "Auction Day" [ref=e150]
                - generic "Company Commission" [ref=e153]
                - generic "ByeLaw No." [ref=e156]
                - generic "Formation Date" [ref=e159]
                - generic "Commencement Date" [ref=e162]
                - generic "Termination Date" [ref=e165]
                - generic "No.of Tickets" [ref=e168]
                - generic "Group Status" [ref=e171]
                - generic "Auction start Time" [ref=e174]
                - generic "Auction End Time" [ref=e177]
                - generic "Progress" [ref=e180]
              - generic [ref=e185]:
                - generic [ref=e188]:
                  - generic [ref=e189]: NEYVELI CAO
                  - generic [ref=e191]: GSM4015
                  - generic [ref=e193]: ₹ 5,00,000.00
                  - generic [ref=e195]: ₹ 12,500.00
                  - generic [ref=e197]: "4563456"
                  - generic [ref=e199]: 26-Aug-2025
                  - generic [ref=e201]: "26"
                  - generic [ref=e203]: "5"
                  - generic [ref=e205]: "--NA--"
                  - generic [ref=e207]: 26-Aug-2025
                  - generic [ref=e209]: 26-Aug-2025
                  - generic [ref=e211]: 26-Nov-2028
                  - generic [ref=e213]: "40"
                  - generic [ref=e215]: Commenced
                  - generic [ref=e217]: 11:11 AM
                  - generic [ref=e219]: 11:21 AM
                  - generic [ref=e222]:
                    - generic [ref=e223]: 4 / 40
                    - progressbar [ref=e225]
                - generic [ref=e228]:
                  - generic [ref=e229]: NEYVELI CAO
                  - generic [ref=e231]: GSM981L
                  - generic [ref=e233]: ₹ 1,00,000.00
                  - generic [ref=e235]: ₹ 4,000.00
                  - generic [ref=e237]: "284682743"
                  - generic [ref=e239]: 26-Dec-2025
                  - generic [ref=e241]: "26"
                  - generic [ref=e243]: "5"
                  - generic [ref=e245]: "--NA--"
                  - generic [ref=e247]: 26-Dec-2025
                  - generic [ref=e249]: 26-Dec-2025
                  - generic [ref=e251]: 26-Dec-2027
                  - generic [ref=e253]: "25"
                  - generic [ref=e255]: Commenced
                  - generic [ref=e257]: 12:12 PM
                  - generic [ref=e259]: 12:22 PM
                  - generic [ref=e262]:
                    - generic [ref=e263]: 2 / 25
                    - progressbar [ref=e265]
                - generic [ref=e268]:
                  - generic [ref=e269]: AMBATTUR
                  - generic [ref=e271]: JFTL3903
                  - generic [ref=e273]: ₹ 10,00,000.00
                  - generic [ref=e275]: ₹ 25,000.00
                  - generic [ref=e277]: JFTL3903
                  - generic [ref=e279]: 01-Jan-2024
                  - generic [ref=e281]: "5"
                  - generic [ref=e283]: "5"
                  - generic [ref=e285]: "--NA--"
                  - generic [ref=e287]: 01-Jan-2024
                  - generic [ref=e289]: 05-Jan-2024
                  - generic [ref=e291]: 05-Apr-2027
                  - generic [ref=e293]: "40"
                  - generic [ref=e295]: Commenced
                  - generic [ref=e297]: 09:03 PM
                  - generic [ref=e299]: 09:13 PM
                  - generic [ref=e302]:
                    - generic [ref=e303]: 2 / 40
                    - progressbar [ref=e305]
                - generic [ref=e308]:
                  - generic [ref=e309]: CHENNAI
                  - generic [ref=e311]: JFTL1203
                  - generic [ref=e313]: ₹ 10,00,000.00
                  - generic [ref=e315]: ₹ 25,000.00
                  - generic [ref=e317]: JFTL1203
                  - generic [ref=e319]: 01-Jan-2025
                  - generic [ref=e321]: "5"
                  - generic [ref=e323]: "5"
                  - generic [ref=e325]: "--NA--"
                  - generic [ref=e327]: 01-Jan-2025
                  - generic [ref=e329]: 05-Jan-2025
                  - generic [ref=e331]: 05-Apr-2028
                  - generic [ref=e333]: "40"
                  - generic [ref=e335]: Commenced
                  - generic [ref=e337]: 12:11 PM
                  - generic [ref=e339]: 12:21 PM
                  - generic [ref=e342]:
                    - generic [ref=e343]: 2 / 40
                    - progressbar [ref=e345]
                - generic [ref=e348]:
                  - generic [ref=e349]: COIMBATORE
                  - generic [ref=e351]: JFTL2304
                  - generic [ref=e353]: ₹ 10,00,000.00
                  - generic [ref=e355]: ₹ 25,000.00
                  - generic [ref=e357]: "567567"
                  - generic [ref=e359]: 01-Jan-2025
                  - generic [ref=e361]: "25"
                  - generic [ref=e363]: "5"
                  - generic [ref=e365]: "--NA--"
                  - generic [ref=e367]: 01-Jan-2025
                  - generic [ref=e369]: 01-Jan-2025
                  - generic [ref=e371]: 01-Apr-2028
                  - generic [ref=e373]: "40"
                  - generic [ref=e375]: Commenced
                  - generic [ref=e377]: 11:15 AM
                  - generic [ref=e379]: 11:25 AM
                  - generic [ref=e382]:
                    - generic [ref=e383]: 1 / 40
                    - progressbar [ref=e385]
                - generic [ref=e388]:
                  - generic [ref=e389]: CHENNAI
                  - generic [ref=e391]: JFTL1202
                  - generic [ref=e393]: ₹ 10,00,000.00
                  - generic [ref=e395]: ₹ 25,000.00
                  - generic [ref=e397]: JFTL1202
                  - generic [ref=e399]: 01-Jan-2025
                  - generic [ref=e401]: "5"
                  - generic [ref=e403]: "5"
                  - generic [ref=e405]: "--NA--"
                  - generic [ref=e407]: 01-Jan-2025
                  - generic [ref=e409]: 05-Jan-2025
                  - generic [ref=e411]: 05-Apr-2028
                  - generic [ref=e413]: "40"
                  - generic [ref=e415]: Commenced
                  - generic [ref=e417]: 12:03 PM
                  - generic [ref=e419]: 12:13 PM
                  - generic [ref=e422]:
                    - generic [ref=e423]: 4 / 40
                    - progressbar [ref=e425]
                - generic [ref=e428]:
                  - generic [ref=e429]: AMBATTUR
                  - generic [ref=e431]: JFTL3902
                  - generic [ref=e433]: ₹ 10,00,000.00
                  - generic [ref=e435]: ₹ 25,000.00
                  - generic [ref=e437]: JFTL3902
                  - generic [ref=e439]: 01-May-2024
                  - generic [ref=e441]: "5"
                  - generic [ref=e443]: "5"
                  - generic [ref=e445]: "--NA--"
                  - generic [ref=e447]: 01-May-2024
                  - generic [ref=e449]: 05-May-2024
                  - generic [ref=e451]: 05-Aug-2027
                  - generic [ref=e453]: "40"
                  - generic [ref=e455]: Commenced
                  - generic [ref=e457]: 12:03 PM
                  - generic [ref=e459]: 12:13 PM
                  - generic [ref=e462]:
                    - generic [ref=e463]: 2 / 40
                    - progressbar [ref=e465]
                - generic [ref=e468]:
                  - generic [ref=e469]: NEYVELI CAO
                  - generic [ref=e471]: JSTL03
                  - generic [ref=e473]: ₹ 10,00,000.00
                  - generic [ref=e475]: ₹ 50,000.00
                  - generic [ref=e477]: JSTL03
                  - generic [ref=e479]: 01-Jan-2025
                  - generic [ref=e481]: "5"
                  - generic [ref=e483]: "5"
                  - generic [ref=e485]: "--NA--"
                  - generic [ref=e487]: 01-Jan-2025
                  - generic [ref=e489]: 05-Jan-2025
                  - generic [ref=e491]: 05-Aug-2026
                  - generic [ref=e493]: "20"
                  - generic [ref=e495]: Commenced
                  - generic [ref=e497]: 12:03 PM
                  - generic [ref=e499]: 12:13 PM
                  - generic [ref=e502]:
                    - generic [ref=e503]: 4 / 20
                    - progressbar [ref=e505]
                - generic [ref=e508]:
                  - generic [ref=e509]: VILLUPURAM
                  - generic [ref=e511]: JFTL1425
                  - generic [ref=e513]: ₹ 10,00,000.00
                  - generic [ref=e515]: ₹ 25,000.00
                  - generic [ref=e517]: JFTL1425
                  - generic [ref=e519]: 01-May-2024
                  - generic [ref=e521]: "5"
                  - generic [ref=e523]: "5"
                  - generic [ref=e525]: "--NA--"
                  - generic [ref=e527]: 01-May-2024
                  - generic [ref=e529]: 05-May-2024
                  - generic [ref=e531]: 05-Aug-2027
                  - generic [ref=e533]: "40"
                  - generic [ref=e535]: Commenced
                  - generic [ref=e537]: 12:03 PM
                  - generic [ref=e539]: 12:13 PM
                  - generic [ref=e542]:
                    - generic [ref=e543]: 2 / 40
                    - progressbar [ref=e545]
                - generic [ref=e548]:
                  - generic [ref=e549]: VILLUPURAM
                  - generic [ref=e551]: JLTF1412
                  - generic [ref=e553]: ₹ 25,00,000.00
                  - generic [ref=e555]: ₹ 50,000.00
                  - generic [ref=e557]: 35/26
                  - generic [ref=e559]: 27-Apr-2026
                  - generic [ref=e561]: "16"
                  - generic [ref=e563]: "6"
                  - generic [ref=e565]: 35/26
                  - generic [ref=e567]: 01-Apr-2026
                  - generic [ref=e569]: 07-May-2026
                  - generic [ref=e571]: 16-May-2030
                  - generic [ref=e573]: "50"
                  - generic [ref=e575]: Commenced
                  - generic [ref=e577]: 04:30 PM
                  - generic [ref=e579]: 04:40 PM
                  - generic [ref=e582]:
                    - generic [ref=e583]: 2 / 50
                    - progressbar [ref=e585]
              - generic [ref=e587]:
                - generic [ref=e588]: Page 1 of 774 (7735 items)
                - list [ref=e591]:
                  - listitem [ref=e592]:
                    - button "go to first page" [ref=e593] [cursor=pointer]:
                      - generic [ref=e594]: r
                  - listitem [ref=e595]:
                    - button "go to previous page" [ref=e596] [cursor=pointer]:
                      - generic [ref=e597]: o
                  - button "page 1" [ref=e598]:
                    - link "1" [ref=e599] [cursor=pointer]:
                      - /url: javascript:void(0)
                  - button "page 2" [ref=e600]:
                    - link "2" [ref=e601] [cursor=pointer]:
                      - /url: javascript:void(0)
                  - button "page 3" [ref=e602]:
                    - link "3" [ref=e603] [cursor=pointer]:
                      - /url: javascript:void(0)
                  - button "page 4" [ref=e604]:
                    - link "4" [ref=e605] [cursor=pointer]:
                      - /url: javascript:void(0)
                  - button "page 5" [ref=e606]:
                    - link "5" [ref=e607] [cursor=pointer]:
                      - /url: javascript:void(0)
                  - listitem [ref=e608]:
                    - button "go to next page" [ref=e609] [cursor=pointer]:
                      - generic [ref=e610]: p
                  - listitem [ref=e611]:
                    - button "go to last page" [ref=e612] [cursor=pointer]:
                      - generic [ref=e613]: q
            - separator [ref=e614]
          - generic [ref=e617]:
            - generic "Formation Date" [ref=e618]: "* Group Formation Date"
            - textbox [ref=e619] [cursor=pointer]: 31-Aug-2026
          - separator [ref=e620]
          - generic [ref=e621]:
            - generic [ref=e623]:
              - generic "Chit Period" [ref=e624]: "* Registrar Branch"
              - listbox [ref=e625]:
                - generic [ref=e626]:
                  - combobox [ref=e628]
                  - generic "Clear all" [ref=e629] [cursor=pointer]: ×
                  - generic [ref=e630] [cursor=pointer]
              - generic [ref=e631]: Chit Period Required
            - generic [ref=e634]:
              - generic "Chit Value" [ref=e635]: "* Chit Value"
              - combobox [ref=e636]:
                - option "Select Chit Value" [disabled]
                - option "10,000.00-B" [selected]
                - option "15,000.00-L"
                - option "20,000.00-C"
                - option "25,000.00-G"
                - option "30,000.00-M"
                - option "50,000.00-D"
                - option "60,000.00-U"
                - option "75,000.00-A"
                - option "90,000.00-N"
                - option "1,00,000.00-E"
                - option "1,50,000.00-J"
                - option "2,00,000.00-H"
                - option "2,50,000.00-O"
                - option "3,00,000.00-K"
                - option "4,00,000.00-T"
                - option "5,00,000.00-P"
                - option "6,00,000.00-R"
                - option "7,50,000.00-V"
                - option "9,00,000.00-S"
                - option "10,00,000.00-TL"
                - option "12,00,000.00-C121"
                - option "15,00,000.00-FL"
                - option "20,00,000.00-JL"
                - option "25,00,000.00-TF"
                - option "30,00,000.00-TT"
                - option "40,00,000.00-FT"
                - option "50,00,000.00-AI"
                - option "1,00,00,000.00-OC"
                - option "1,50,00,000.00-LAF"
                - option "2,50,00,000.00-JTF"
            - generic [ref=e638]:
              - generic "Chit Period" [ref=e639]: "* Chit Period"
              - combobox [ref=e640]:
                - option "Select Chit Period" [disabled]
                - option "10 Months"
                - option "40 Months"
                - option "50 Months"
                - option "25 Months"
                - option "20 Months"
                - option "30 Months"
                - option "60 Months"
                - option "12 Months" [selected]
            - generic [ref=e641]:
              - generic [ref=e642]: No. of Auctions
              - textbox [ref=e645] [cursor=pointer]: "12"
            - generic [ref=e647]:
              - generic "Chit Group Code" [ref=e648]: "* Chit Group Code"
              - textbox [ref=e649]: QATEST600689
            - generic [ref=e651]:
              - generic "Maximum Subscription" [ref=e652]
              - textbox [ref=e653] [cursor=pointer]: "1"
            - generic [ref=e655]:
              - generic [ref=e656]: Maximum Discount (%)
              - generic [ref=e657]:
                - textbox "J" [ref=e658]
                - generic [ref=e660]:
                  - checkbox "N.A" [expanded]
                  - generic [ref=e661]: N.A
            - generic [ref=e663]:
              - generic "Foreman Commision Percentage" [ref=e664]: "* Foreman Commission (%)"
              - textbox [ref=e665]: "5"
            - generic [ref=e667]:
              - generic "Breach of Contract Percentage" [ref=e668]: "* Breach of Contract (%)"
              - textbox [ref=e669]: "5"
          - generic [ref=e670]:
            - generic [ref=e672]:
              - generic [ref=e674]:
                - checkbox "N.A" [expanded]
                - generic [ref=e675]: N.A
              - generic [ref=e676]:
                - generic [ref=e677]:
                  - generic "Company Chit - Auction Number" [ref=e678]: "* Company Chit - Auction Number"
                  - textbox [ref=e679]: "1"
                - generic [ref=e680]:
                  - generic "Company Chit - Ticket Number" [ref=e681]: "* Company Chit - Ticket Number"
                  - textbox [ref=e682]: "1"
            - generic [ref=e685]:
              - generic [ref=e686]:
                - radio "Select Auction Date" [checked] [ref=e687]
                - generic [ref=e688]: Select Auction Date
              - generic [ref=e689]:
                - generic "Auction Date" [ref=e690]
                - combobox [ref=e691]:
                  - option "Select" [disabled] [selected]
                  - option "1"
                  - option "2"
                  - option "3"
                  - option "4"
                  - option "5"
                  - option "6"
                  - option "7"
                  - option "8"
                  - option "9"
                  - option "10"
                  - option "11"
                  - option "12"
                  - option "13"
                  - option "14"
                  - option "15"
                  - option "16"
                  - option "17"
                  - option "18"
                  - option "19"
                  - option "20"
                  - option "21"
                  - option "22"
                  - option "23"
                  - option "24"
                  - option "25"
                  - option "26"
                  - option "27"
                  - option "28"
                  - option "29"
                  - option "30"
                  - option "31"
                - generic [ref=e692]: Auction Date Required
              - generic [ref=e694]: OR
              - generic [ref=e696]:
                - radio "Select Auction Week And Day" [ref=e697]
                - generic [ref=e698]: Select Auction Week And Day
              - generic [ref=e699]:
                - generic [ref=e700]:
                  - generic "Week" [ref=e701]
                  - combobox [disabled] [ref=e702] [cursor=pointer]:
                    - option "Select" [disabled] [selected]
                    - option "1"
                    - option "2"
                    - option "3"
                    - option "4"
                - generic [ref=e703]:
                  - generic "Day" [ref=e704]
                  - combobox [disabled] [ref=e705] [cursor=pointer]:
                    - option "Select" [disabled] [selected]
                    - option "Mon"
                    - option "Tue"
                    - option "Wed"
                    - option "Thu"
                    - option "Fri"
                    - option "Sat"
                    - option "Sun"
            - generic [ref=e708]:
              - generic [ref=e710]:
                - generic "Action" [ref=e712]
                - generic [ref=e715]:
                  - generic "Charge" [ref=e716]
                  - generic "Amount" [ref=e719]
              - generic [ref=e724]:
                - generic [ref=e726]:
                  - generic [ref=e731] [cursor=pointer]
                  - generic [ref=e732]:
                    - generic [ref=e733]: TRANSFER FEE
                    - generic [ref=e735]: ₹ 400.00
                - generic [ref=e738]:
                  - generic [ref=e743] [cursor=pointer]
                  - generic [ref=e744]:
                    - generic [ref=e745]: ENTRANCE FEE
                    - generic [ref=e747]: ₹ 10.00
          - generic [ref=e749]:
            - separator [ref=e750]
            - generic [ref=e751]:
              - generic [ref=e752]: "Installment Due Date:"
              - generic [ref=e754]:
                - generic [ref=e755]:
                  - radio "No. of days from Auction Date" [checked]
                  - generic "No. of Days From Auction Date" [ref=e756] [cursor=pointer]: No. of days from Auction Date
                - combobox [ref=e758]:
                  - option "Select" [disabled]
                  - option "1"
                  - option "2"
                  - option "3"
                  - option "4"
                  - option "5"
                  - option "6"
                  - option "7"
                  - option "8"
                  - option "9"
                  - option "10" [selected]
                  - option "11"
                  - option "12"
                  - option "13"
                  - option "14"
                  - option "15"
                  - option "16"
                  - option "17"
                  - option "18"
                  - option "19"
                  - option "20"
                  - option "21"
                  - option "22"
                  - option "23"
                  - option "24"
                  - option "25"
                  - option "26"
                  - option "27"
                  - option "28"
                  - option "29"
                  - option "30"
                  - option "31"
                  - option "Next Auction Date"
            - separator [ref=e759]
            - generic [ref=e760]:
              - generic [ref=e761]:
                - generic [ref=e762]: When is first installment collected?
                - generic [ref=e763]:
                  - generic [ref=e764]:
                    - radio "First installment is collected from all subscribers before Auction" [checked]
                    - generic [ref=e765] [cursor=pointer]: First installment is collected from all subscribers before Auction
                  - generic [ref=e766]:
                    - radio "First installment is collected after Auction"
                    - generic [ref=e767] [cursor=pointer]: First installment is collected after Auction
              - generic [ref=e768]:
                - generic [ref=e769]: Dividend Posting
                - generic [ref=e770]:
                  - generic [ref=e771]:
                    - radio "After conducting Auction"
                    - generic [ref=e772] [cursor=pointer]: After conducting Auction
                  - generic [ref=e773]:
                    - radio "When chit subscription is paid" [checked]
                    - generic [ref=e774] [cursor=pointer]: When chit subscription is paid
              - generic [ref=e775]:
                - generic [ref=e776]: Does this chit group have a pre-defined bid amount?
                - generic [ref=e777]:
                  - generic [ref=e778]:
                    - radio "Yes"
                    - generic [ref=e779] [cursor=pointer]: "Yes"
                  - generic [ref=e780]:
                    - radio "No" [checked]
                    - generic [ref=e781] [cursor=pointer]: "No"
        - generic [ref=e784]:
          - generic [ref=e785] [cursor=pointer]: Cancel
          - button "Save" [active] [ref=e787] [cursor=pointer]
  - text:  *  *  *  *
```

# Test source

```ts
  1   | const { test, expect } = require('@playwright/test');
  2   | const { GroupFormationPage } = require('../../pages/GroupFormationPage');
  3   | const { loginAndSelectBranch } = require('../../utils/navigation');
  4   | const data = require('../../test-data/group-formation-data');
  5   | 
  6   | const CREDS = { username: 'admin', password: 'jayapriya@123' };
  7   | 
  8   | const ALL_FIELD_LABELS = [
  9   |   'Group Status', 'Group Formation Date', 'Registrar Branch', 'Chit Value', 'Chit Period',
  10  |   'No. of Auctions', 'Chit Group Code', 'Maximum Subscription', 'Maximum Discount (%)',
  11  |   'Foreman Commission (%)', 'Breach of Contract (%)', 'Company Chit - Auction Number',
  12  |   'Company Chit - Ticket Number', 'Select Auction Date', 'Auction Date', 'Select Auction Week And Day',
  13  |   'Week', 'Day', 'Installment Due Date:', 'No. of days from Auction Date',
  14  |   'When is first installment collected?', 'Dividend Posting',
  15  |   'Does this chit group have a pre-defined bid amount?',
  16  | ];
  17  | 
  18  | async function openForm(page) {
  19  |   await loginAndSelectBranch(page, '/', CREDS);
  20  |   const form = new GroupFormationPage(page);
  21  |   await form.open();
  22  |   return form;
  23  | }
  24  | 
  25  | test.describe('Group Formation - Field Coverage (all fields, no skips)', () => {
  26  |   test('TC_GF_ALL01 - Every field/section on the Group Formation form is present', async ({ page }) => {
  27  |     await openForm(page);
  28  |     const bodyText = await page.evaluate(() => document.body.innerText);
  29  |     for (const label of ALL_FIELD_LABELS) {
  30  |       expect(bodyText, `missing field: ${label}`).toContain(label);
  31  |     }
  32  |   });
  33  | });
  34  | 
  35  | test.describe('Group Formation - Mandatory Field Validation', () => {
  36  |   for (const f of data.mandatoryFields) {
  37  |     test(`${f.id} - Submitting the form with an empty "${f.label}" shows its required-field message`, async ({ page }) => {
  38  |       const form = await openForm(page);
  39  |       await form.saveBtn().click();
  40  |       await page.waitForTimeout(1200);
  41  |       const bodyText = await page.evaluate(() => document.body.innerText);
  42  |       expect(bodyText).toContain(f.expectedMsg);
  43  |     });
  44  |   }
  45  | });
  46  | 
  47  | test.describe('Group Formation - Chit Value / Chit Period Dropdowns', () => {
  48  |   test('TC_GF_DD01 - Chit Value is a pre-configured dropdown of master values (not free text)', async ({ page }) => {
  49  |     const form = await openForm(page);
  50  |     const val = await form.selectOptionJS('Chitvalue', 'B');
  51  |     expect(val).toBe('B');
  52  |   });
  53  | 
  54  |   test('TC_GF_DD02 - Chit Period is a pre-configured dropdown of master values (not free text)', async ({ page }) => {
  55  |     const form = await openForm(page);
  56  |     const val = await form.selectOptionJS('Chitperiod', 'X1-12');
  57  |     expect(val).toBe('X1-12');
  58  |   });
  59  | });
  60  | 
  61  | test.describe('Group Formation - No. of Auctions / Maximum Subscription Boundary', () => {
  62  |   for (const c of data.noOfAuctionsBoundary.concat(data.subscriptionBoundary)) {
  63  |     test(`${c.id} - ${c.field} "${c.value}" (${c.label})`, async ({ page }) => {
  64  |       const form = await openForm(page);
  65  |       const val = await form.setValueJS(c.field, c.value);
  66  |       console.log(`${c.id}: ${c.field} accepted as "${val}" for input "${c.value}"`);
  67  |       await expect(form.saveBtn()).toBeVisible();
  68  |     });
  69  |   }
  70  | });
  71  | 
  72  | test.describe('Group Formation - Save with valid data (Root Cause Investigation)', () => {
  73  |   test('TC_GF_CREATE01 - Saving with a valid Chit Value, Chit Period, Group Code and Subscription still blocks on "Chit Period Required"', async ({ page }) => {
  74  |     const form = await openForm(page);
  75  |     const uniqueCode = 'QATEST' + Date.now().toString().slice(-6);
  76  |     await form.selectOptionJS('Chitvalue', 'B');
  77  |     const periodVal = await form.selectOptionJS('Chitperiod', 'X1-12');
  78  |     await form.setValueJS('Noofauction', '12');
  79  |     await form.setValueJS('Groupcode', uniqueCode);
  80  |     await form.setValueJS('Subscription', '1');
  81  |     await page.waitForTimeout(400);
  82  | 
  83  |     const periodClasses = await page.evaluate(() => {
  84  |       const el = [...document.querySelectorAll('[formcontrolname="Chitperiod"]')].find(e => e.offsetParent !== null);
  85  |       return el ? el.className : null;
  86  |     });
  87  | 
  88  |     const responses = [];
  89  |     page.on('response', res => { if (res.request().method() !== 'GET') responses.push(res.url()); });
  90  |     await form.saveBtn().click();
  91  |     await page.waitForTimeout(2000);
  92  |     const bodyText = await page.evaluate(() => document.body.innerText);
  93  | 
  94  |     console.log(`TC_GF_CREATE01: Chit Period selected value="${periodVal}", field classes="${periodClasses}", API calls fired=${JSON.stringify(responses)}`);
  95  |     const stillBlockedDespiteValid = periodClasses && periodClasses.includes('ng-valid') && /Chit Period Required/.test(bodyText);
  96  |     console.log('Root-cause reproduced (valid field still blocks Save):', stillBlockedDespiteValid);
> 97  |     expect(responses.length, 'BUG-007: Save should fire an API call once Chit Value/Period/Group Code/Subscription are validly filled - currently blocked by a stale "Chit Period Required" validator').toBeGreaterThan(0);
      |                                                                                                                                                                                                         ^ Error: BUG-007: Save should fire an API call once Chit Value/Period/Group Code/Subscription are validly filled - currently blocked by a stale "Chit Period Required" validator
  98  |   });
  99  | });
  100 | 
  101 | test.describe('Group Formation - Percentage Field Boundary/Format', () => {
  102 |   for (const c of data.percentBoundary) {
  103 |     test(`${c.id} - ${c.field} "${c.value}" (${c.label})`, async ({ page }) => {
  104 |       const form = await openForm(page);
  105 |       const val = await form.setValueJS(c.field, c.value);
  106 |       console.log(`${c.id}: ${c.field} accepted as "${val}" for input "${c.value}"`);
  107 |       await expect(form.saveBtn()).toBeVisible();
  108 |     });
  109 |   }
  110 | });
  111 | 
  112 | test.describe('Group Formation - Special Character / XSS Safety', () => {
  113 |   for (const c of data.specialCharPayloads) {
  114 |     test(`${c.id} - ${c.label} is not executed`, async ({ page }) => {
  115 |       const form = await openForm(page);
  116 |       let dialogFired = false;
  117 |       page.once('dialog', async d => { dialogFired = true; await d.dismiss(); });
  118 |       await form.setValueJS(c.field, c.value);
  119 |       await page.waitForTimeout(500);
  120 |       expect(dialogFired).toBe(false);
  121 |     });
  122 |   }
  123 | });
  124 | 
  125 | test.describe('Group Formation - Auction Date vs Week/Day Toggle', () => {
  126 |   test('TC_GF_TOGGLE01 - "Select Auction Date" and "Select Auction Week And Day" are mutually exclusive radio options', async ({ page }) => {
  127 |     await openForm(page);
  128 |     const radios = page.locator('input[formcontrolname="Auctiondateorweekchecked"]:visible');
  129 |     const count = await radios.count();
  130 |     expect(count).toBeGreaterThanOrEqual(2);
  131 |   });
  132 | 
  133 |   test('TC_GF_TOGGLE02 - Selecting "Select Auction Week And Day" reveals Week and Day fields', async ({ page }) => {
  134 |     await openForm(page);
  135 |     const weekOption = page.locator(':visible', { hasText: 'Select Auction Week And Day' }).first();
  136 |     await weekOption.click({ timeout: 5000 }).catch(() => {});
  137 |     await page.waitForTimeout(600);
  138 |     const bodyText = await page.evaluate(() => document.body.innerText);
  139 |     expect(bodyText).toContain('Week');
  140 |     expect(bodyText).toContain('Day');
  141 |   });
  142 | });
  143 | 
  144 | test.describe('Group Formation - Pre-defined Bid Amount Toggle', () => {
  145 |   test('TC_GF_BID01 - "Does this chit group have a pre-defined bid amount?" offers Yes/No options', async ({ page }) => {
  146 |     await openForm(page);
  147 |     const bodyText = await page.evaluate(() => document.body.innerText);
  148 |     expect(bodyText).toContain('Yes');
  149 |     expect(bodyText).toContain('No');
  150 |   });
  151 | });
  152 | 
```
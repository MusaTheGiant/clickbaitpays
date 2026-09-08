# ClickBaitPays Profit Calculator Maintenance

## Campaign values used

The calculator uses the exact figures published in both `index.html` and `campaign-levels.html`. Amounts are fixed packages in USDT.

| Level | First total | Later campaign | Activation fee | Ads daily | Listed per click | Completion value | Listed member 90% |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 14.00 | 13.00 | 1.00 | 3 | 0.48 | 19.08 | 17.17 |
| 2 | 84.00 | 77.00 | 7.00 | 3 | 2.83 | 113.00 | 101.70 |
| 3 | 165.00 | 150.00 | 15.00 | 3 | 5.40 | 216.00 | 194.40 |
| 4 | 330.00 | 300.00 | 30.00 | 5 | 6.48 | 432.00 | 388.80 |
| 5 | 660.00 | 600.00 | 60.00 | 6 | 10.80 | 864.00 | 777.60 |
| 6 | 1,320.00 | 1,200.00 | 120.00 | 10 | 12.96 | 1,728.00 | 1,555.20 |
| 7 | 2,640.00 | 2,400.00 | 240.00 | 20 | 13.50 | 3,600.00 | 3,240.00 |

Current supporting rules used by the calculator:

- Maximum three active campaigns per account in total, regardless of level combination.
- Twelve click days per campaign.
- Seven-day fixed hold after the click-day cycle.
- Staggered campaigns start on Day 0, Day 7 and Day 14.
- The published member amount is the listed 90% portion of the completion value.

## Formulas

All money is stored as integer cents. The calculator never uses binary floating-point values for addition or subtraction of money.

- First campaign capital at a new level = later campaign cost + one-time activation fee = first total.
- Additional capital at an already activated level = later campaign cost.
- Total capital = sum of each configured campaign's applicable capital.
- Daily member pace = total published member amount / 12.
- Seven-day member pace = total published member amount × 7 / 12.
- 30-day member pace = total published member amount × 30 / 12.
- Gross completion value = sum of the published completion values.
- Listed member amount = sum of the published 90% member amounts.
- Estimated net profit = listed member amount - total capital.
- Estimated ROI = estimated net profit / total capital × 100.

Daily, seven-day and 30-day values are comparison paces. They are not added to gross completion value or member amount. Displayed rate estimates are rounded to the nearest cent. ROI is displayed to two decimal places.

## Date model

The selected start date is Day 0 and the first click day. The 12th click day is 11 calendar days later. The estimated Available Balance date is 19 calendar days after the campaign start, reflecting 12 click days followed by a seven-day hold.

The calculator does not claim an exact withdrawal date. The website states that one withdrawal request may be submitted per week and manual fulfilment may take up to 48 hours after a permitted request.

## Updating values later

1. Verify the latest official platform information.
2. Update the static tables in `index.html` and `campaign-levels.html`.
3. Update the matching integer-cent values in `assets/campaign-data.js`.
4. Run the calculator tests and the table-consistency check before publishing.

Do not calculate from the displayed per-click column. Those values are rounded. The calculator intentionally uses the published final member amount.

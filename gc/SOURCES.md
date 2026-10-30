# Sources for the GC figure

Every fact on the figure, and where it comes from. "Model" means computed in `gc-model.mjs`.

## EPA Method 552.3 (Rev. 1.0, July 2003, EPA 815-B-03-002)
URL: https://www.nemi.gov/methods/method_pdf/7229 (text extracted from the PDF and read directly)

| On the figure | Where in the method |
|---|---|
| ECD detector | Title; Sec. 2; Table 1 |
| MTBE liquid-liquid microextraction; acidic methanol to methyl esters, heated 2 h (50 °C for MTBE) | Sec. 2; Sec. 7.1.12 (10% sulfuric acid in methanol); Sec. 11.2.3 |
| Ten analytes: nine HAAs (MCAA, MBAA, DCAA, TCAA, BCAA, BDCAA, DBAA, CDBAA, TBAA) and dalapon | Sec. 1.1 analyte table |
| Surrogate 2-bromobutanoic acid | Sec. 7.2.3 |
| Internal standard 1,2,3-trichloropropane | Sec. 7.2.2 |
| Elution order and times: MCAA 9.29, MBAA 14.19, dalapon 14.69, DCAA 15.07, TCAA 18.89, IS 20.69, BCAA 21.22, SUR 21.63, BDCAA 23.60, DBAA 24.01, CDBAA 25.55, TBAA 26.88 min | Table 1, primary column (DB-1701, 14% cyanopropylphenyl-methylpolysiloxane, 30 m x 0.25 mm, 0.25 µm), MTBE |
| Oven: 40 °C for 10 min, 2.5 °C/min to 65, 10 °C/min to 85, 20 °C/min to 205, hold 7 min | Table 1 |
| 1 µL injection | Table 1 |
| Helium carrier on the 552.3 run | Table 1 ("Helium (UHP)"). The bulkhead is labelled CARRIER with no gas named, because the 8015-style run uses hydrogen. |
| Relative peak heights, tallest scaled to 70% of the sheet | Read by eye from Figure 1, counts above baseline. Approximate. Figure 1's unlabelled peaks and bromoform are omitted (caption says so). |

Peak names as methyl esters (for example "methyl chloroacetate" for MCAA) follow from the derivatization. The internal standard is not derivatized. The name of each ester is my naming from the parent acid; the method lists the acids.

Model: each ester's position on the coil comes from a retention integral with one assumed enthalpy, solved so the band reaches the column end at the Table 1 time. Only the bands on the coil depend on the assumption; the peak times do not.

## EPA Method 8015D (Rev. 4, June 2003)
URL: https://19january2021snapshot.epa.gov/sites/static/files/2015-12/documents/8015d_r4.pdf (text extracted and read directly)

| On the figure | Where in the method |
|---|---|
| FID | Sec. 2.7, Sec. 6.3 |
| DRO = C10 to C28 alkanes, about 170 to 430 °C boiling range | Sec. 1.2.2 |
| Retention range set from the C10 and C28 alkanes | Sec. 11.4.3 |
| Homologous n-alkane standard to set retention times | Sec. 7.5 |
| Unresolved complex mixture, "hump" | Sec. 11.11 |
| Horizontal baseline between C10 and C28 (the shaded area on the strip) | Sec. 11.11.1 |

Note: 8015D's own DRO program (45 °C to 275 °C at 12 °C/min, hold 12 min, Sec. 11.2.4) is one I judged too cool to carry a C40 marker (my judgement, not a statement in the method), so the figure does not use it. It uses the vendor program below, and labels it "8015-style, vendor conditions", never EPA 8015.

## The 8015-style channel: program and anchor times
URL: https://ez.restek.com/images/cgram/gc_ev1380.pdf ("DRO/ORO Calibration Standard", GC_EV1380, text and plot read directly)

- Oven 40 °C (hold 0.1 min) to 400 °C at 19.6 °C/min (hold 1.53 min). 15 m x 0.25 mm x 0.10 µm thin-film column. 1 µL, split 50:1, hydrogen carrier. FID. The caption states the carrier and split, and calls the conditions a vendor's.
- Tabulated times, shown to two decimals: C10 124.3 s, C12 203.5 s, C14 279.8 s, C16 348.9 s, C18 411.5 s.
- "C40 elution area" mark on the plot, read as about 860 s. Shown as "about 14.3".
- Why this program and not 8015D's: 8015D's 45 to 275 °C gives no published times, and I judged it too cool to place a C40 marker. The figure stays true by naming the conditions as a vendor's.

Model: n-alkane times are the retention integral with `ln k = a0 + a1 n + (b0 + b1 n)/T`, fitted to those six points; `node gc/gc-model.mjs --check` prints the comparison. C20 to C38 and o-terphenyl are modelled and shown as "about", to one decimal, with the note "Modelled time".

Illustrative: the solvent peak's time and height. Its name comes from the standard's Diluent line.

The trace is a composite, not one injection, and the caption says so.

## DRO/ORO windows vary by regulator
- DRO C10 to C28: EPA 8015D above.
- ORO C28 to C40, the window the figure shows: not in 8015D. Reported as "Oil Range Organics (C28-C40)" under method 8015D in a laboratory report filed with NY DEC. Opened and confirmed in the PDF text: https://extapps.dec.ny.gov/data/DecDocs/734043/Report.HW.734043.2014-07-15.MH3%20Oil%20Source%20Inv_Appendix%20B_Lab%20Rpt.pdf . Cited only for the window's name; none of its results are used.
- Other labs differ. ALS "Petroleum Hydrocarbon Ranges" lists DRO C10-C28, ORO C20-C35 and RRO C25-C36 as typical, and notes "Carbon range may differ from state to state": https://www.alsglobal.com/-/media/ALSGlobal/Resources-Grid/Petroleum-Hydrocarbon-Ranges.pdf

## Surrogate for the 8015-style channel
- o-Terphenyl: named with hexacosane as the DRO surrogate in EPA's 8015B summary table: https://19january2017snapshot.epa.gov/sites/production/files/2015-06/documents/8015.pdf . 8015D itself only requires "one or two surrogate compounds" (Sec. 7.10).
- Elution position: retention indices 1886 (HP-5MS) and 1903 (DB-5) from the NIST WebBook, https://webbook.nist.gov/cgi/cbook.cgi?ID=C84151&Units=SI&Mask=2000 . The model places it at carbon number 18.9. Modelled, shown as "about".

## Why one column at a time
Upper temperature limit typical for this phase, about 280/300 °C (isothermal/programmed): vendor catalog listings. Search results show -20 to 280/300 °C for https://chromtech.com/122-0731-db-1701-30m-025mm-015um (30 m x 0.25 mm, 0.15 µm film) and the 0.32 mm entries. The pages refused direct fetches, so this rests on the search result text, and the exact 0.25 µm part was not checked. A 400 °C program would exceed it, so the figure never heats both columns: the selector racks one into the oven and the other waits in an unheated bay behind the case front. The caption says a lab would normally run these on separate instruments, and that the shared chassis is for comparison. The rack, shuttle, gates and bays are invented for the figure, not a real instrument feature.

## Illustrative, with no source
- Diesel and oil hump shapes and the small unresolved peaks (seeded pseudo-random, placed by carbon number).
- 8015-style peak heights and all peak widths (drawn narrow, but wider than a real capillary peak so they show at this scale).
- Oven cooldown rate after a run.
- The swap mechanism, the autosampler's motion and the number of drawn windings.
- Ni-63 plate on the ECD: a cue only, not a sourced statement. EPA 552.3 names a micro ECD but not an isotope. Grey until the ECD is selected.
- "A lab would normally run these on separate instruments": my reasoning from the column limit, not a sourced statement.
- Peak heights on the 552.3 sheet and the C40 mark on the vendor plot are by-eye readings.
- The packet that travels from coil to detector, and its timing lead of 0.95 run-minutes, is a drawing device, not a modelled transfer time.
- The 60 °C threshold before a column swap is a figure rule, not a sourced value.
- Gas line layout. FID makeup is drawn through a tee shared with the ECD; the actual makeup gas differs by method (nitrogen in the vendor note, 95% Ar/5% CH4 in EPA 552.3 Table 1) and the figure does not label it.

## Not on the figure
No instrument brand or model, no laboratory, client or sample data. Column trade names appear only here, as citations.

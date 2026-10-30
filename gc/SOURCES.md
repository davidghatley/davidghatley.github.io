# Sources for the GC figure

Every fact on the figure, and where it comes from. "Model" means computed in `gc-model.mjs`.

## EPA Method 552.3 (Rev. 1.0, July 2003, EPA 815-B-03-002)
URL: https://www.nemi.gov/methods/method_pdf/7229 (text extracted from the PDF and read directly)

| On the figure | Where in the method |
|---|---|
| ECD detector | Title; Sec. 2; Table 1 |
| MTBE liquid-liquid microextraction; acidic methanol to methyl esters, heated 2 h (50 °C for MTBE) | Sec. 2; Sec. 7.1.12 (10% sulfuric acid in methanol); Sec. 11.2.3 |
| Nine HAAs: MCAA, MBAA, DCAA, TCAA, BCAA, BDCAA, DBAA, CDBAA, TBAA | Sec. 1.1 analyte table; dalapon is also a method analyte and is deliberately not drawn (caption says so) |
| Surrogate 2-bromobutanoic acid | Sec. 7.2.3 |
| Internal standard 1,2,3-trichloropropane | Sec. 7.2.2 |
| Elution order and times: MCAA 9.29, MBAA 14.19, DCAA 15.07, TCAA 18.89, IS 20.69, BCAA 21.22, SUR 21.63, BDCAA 23.60, DBAA 24.01, CDBAA 25.55, TBAA 26.88 min | Table 1, primary column (DB-1701, 14% cyanopropylphenyl-methylpolysiloxane, 30 m x 0.25 mm, 0.25 µm), MTBE |
| Oven: 40 °C for 10 min, 2.5 °C/min to 65, 10 °C/min to 85, 20 °C/min to 205, hold 7 min | Table 1 |
| 1 µL injection | Table 1 |
| Relative peak heights | Read by eye from Figure 1, counts above baseline. Approximate. |

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

Note: 8015D's own DRO program (45 °C to 275 °C at 12 °C/min, hold 12 min, Sec. 11.2.4) stops too cool to be the program for a C40 marker, so the figure does not use it. It uses the program below and says so in the caption.

## The 8015 channel's program and anchor times
URL: https://ez.restek.com/images/cgram/gc_ev1380.pdf ("DRO/ORO Calibration Standard", GC_EV1380, text and plot read directly)

- Oven 40 °C (hold 0.1 min) to 400 °C at 19.6 °C/min (hold 1.53 min). 15 m x 0.25 mm x 0.10 µm thin-film column. 1 µL. FID.
- Published times: C10 124.3 s, C12 203.5 s, C14 279.8 s, C16 348.9 s, C18 411.5 s.
- "C40 elution area" mark on the plot, read as about 860 s. This is a reading from a plot, not a tabulated time.
- Solvent is methylene chloride (Diluent line), which the off-scale first peak names.

Model: n-alkane times are the retention integral with `ln k = a0 + a1 n + (b0 + b1 n)/T`, fitted to those six points. `node gc/gc-model.mjs --check` prints published against modelled: all six agree within 0.3 s of the input. C20 to C38 are interpolated by the model and labelled illustrative in the caption.

The published run uses hydrogen carrier and split injection; the figure draws one unlabelled carrier line and does not claim either on the drawing.

## DRO/ORO windows vary by regulator
- DRO C10 to C28: EPA 8015D above.
- ORO C28 to C40: the window the figure shows, and not in 8015D. Listed as "C28-C40 ORO" by a commercial lab at https://settek.com/C28-C40-ORO.aspx. That page refused automated fetches, so I confirmed only its title through search results; a reader should open it to check it.
- Other labs and states differ. ALS "Petroleum Hydrocarbon Ranges" lists DRO C10-C28, ORO C20-C35 and RRO C25-C36 as typical, and notes "Carbon range may differ from state to state": https://www.alsglobal.com/-/media/ALSGlobal/Resources-Grid/Petroleum-Hydrocarbon-Ranges.pdf

## Surrogate for the 8015 channel
- o-Terphenyl: named with hexacosane as the DRO surrogate in EPA's 8015B summary table: https://19january2017snapshot.epa.gov/sites/production/files/2015-06/documents/8015.pdf . 8015D itself only requires "one or two surrogate compounds" (Sec. 7.10).
- Elution position: retention indices 1886 (HP-5MS) and 1903 (DB-5) from the NIST WebBook, https://webbook.nist.gov/cgi/cbook.cgi?ID=C84151&Units=SI&Mask=2000 . The model places it at carbon number 18.9. Those indices were measured on other columns and programs, so its time is illustrative.

## Illustrative, with no source
- Diesel hump shape and the small unresolved peaks on it (seeded pseudo-random, placed by carbon number).
- 8015 peak heights and all peak widths.
- Oven cooldown rate after a run.
- The two-channel layout of the instrument, the autosampler's motion and the column coil's number of drawn windings.
- Gas line layout, and which gas feeds which line.

## Not on the figure
No instrument brand or model, no laboratory, client or sample data. Column trade names appear only here, as citations.

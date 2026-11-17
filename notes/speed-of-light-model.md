# Speed of Light — Rømer's Cosmic Clock

Implementation plan, scientific decisions and verification criteria (18 November 2026)

**Public page:** [docs/visualizations/speed-of-light/](../docs/visualizations/speed-of-light/)  
**Primary subject:** Physics  
**Historical prompt:** [ScienceNorway, 16 November 2026](https://www.sciencenorway.no/culture-history-history-of-science/350-years-ago-this-man-discovered-that-light-has-a-finite-speed/2737969)

## Learning objectives

1. Recognize that light travels very fast, but not instantaneously.
2. Distinguish an event's time at its source from the later time an observer receives information about it.
3. Use one-way light travel time, distance / c, with consistent units.
4. Explain how changing Earth–Jupiter distance changes the timing of Io's apparent eclipses.
5. Distinguish Rømer's historically important inference from the exact modern SI value.
6. Derive the light-time residual and relate its slope to eclipse-interval corrections.
7. Critique geometric simplifications, ephemeris uncertainties, and competing historical interpretations.

## One shared interactive experiment

- Draw Sun, Earth's circular orbit, fixed Jupiter and an illustrative eclipsed Io using native SVG.
- **Primary control:** change Earth's orbital angle from 0° (closest in this model) to 180° (farthest) to 360°.
- **Comparison control:** overlay instantaneous light (zero delay) or Rømer's historical 22-minute estimate, retrospectively translated using the *modern* AU.
- **Readouts:** Earth–Jupiter distance in AU, one-way travel time, excess light-time vs the nearest point, and the incremental change between successive Io-eclipse arrival intervals.
- **Chart:** modelled cumulative residual against Earth angle, with both modern-c and comparison curves and the selected point.
- **Secondary experiment:** calculate one-way vacuum light travel times for everyday/astronomical examples or a user-supplied distance in km.
- The orbit's optional motion runs only upon direct user action. Reduced-motion preference disables that motion, leaving manual controls available.

### Four-level design

| Level | Central explanation | Learner's experiment |
|---|---|---|
| 1 — Discover (7–10) | The distant moon's clock ticks at the same place, but the view arrives late | Move Earth from near to far; predict the delay |
| 2 — Explore (14–18) | Time = distance / speed; compare minutes and seconds, units and history | Compare the historical and modern estimates, then calculate lunar light time |
| 3 — Analyze (bachelor) | Circular-orbit geometry, O−C light-time residual, drift between ticks | Find the sign of the adjacent-eclipse interval correction |
| 4 — Research (master) | Retarded-time model, inverse inference and nuisance parameters, historical interpretation | Derive potential ephemeris biases and proposed tests |

## Explicit forward model

All model distances are in **km** or **AU**, and all propagation times are in **seconds**.

- Defined vacuum speed: **c = 299,792.458 km/s**, exactly.
- Defined astronomical unit: **1 AU = 149,597,870.7 km**, exactly.
- Earth heliocentric distance **a = 1 AU** and assumed fixed Jupiter heliocentric distance **R = 5.2 AU**.
- Earth angle **θ = 0** points toward Jupiter, so the nearest/farthest distances are **R−a = 4.2 AU** and **R+a = 6.2 AU**.
- Io eclipse clock period in the toy model **P = 1.769137786 d** (close to NASA's tabulated 1.769138 days).
- Earth orbital period in the toy model **365.25 d**.

Equations:

~~~text
D(θ) = sqrt(R² + a² - 2Ra cos θ)
τ(θ) = D(θ) · AU_km / c_km_s
Δτ(θ) = [D(θ) - (R-a)] · AU_km / c_km_s

T_n ≈ t_n + τ(θ_n), with t_n = t_0 + nP
T_(n+1) - T_n - P ≈ [D(θ_n + 2πP/Y) - D(θ_n)] · AU_km / c_km_s

c_retrospective = (2 AU) / (22 min)
~~~

The graph plots **Δτ**, a cumulative extra light time in minutes **relative to the nearest modeled point**, not a per-eclipse timing error. The interval correction is in seconds.

### Reference checkpoints

| Calculation | Expected |
|---|---:|
| One AU / c | 499.0048 s, about 8 min 19 s |
| 2 AU / c | 998.0096 s, about 16 min 38 s |
| Rømer's 2 AU / 22 min translated using modern AU | ≈ 226,663 km/s |
| Nearest Earth–Jupiter light travel (4.2 AU) | ≈ 34 min 56 s |
| Farthest Earth–Jupiter light travel (6.2 AU) | ≈ 51 min 34 s |
| Mean Earth–Moon distance 384,400 km / c | ≈ 1.282 s |
| One metre / c | ≈ 3.336 ns |
| 1 light-year / c | exactly 365.25 d for the given conventional distance |

## Scientific boundaries and historical cautions

- This is **not** an Io ephemeris or a simulated historical observing log. It excludes Jupiter's orbital motion, eccentricities, inclination, shadow geometry, Earth observer location, Io's orbital displacement, phase visibility, orbital perturbations, timing noise and light-time iteration.
- Rømer did **not directly measure** 299,792,458 m/s. His observational argument for a finite time was decisive; a numerical speed requires an independent estimate of solar-system distances. Huygens later used the finite-time evidence to estimate a speed.
- Rømer's 1676 prediction of an eclipse approximately **10 minutes late** is a historical observation/prediction, not a value artificially fitted by this simplified chart.
- The **22-minute historical diameter time** must not be mislabeled as the modern measurement. The modern 2 AU time is **16 min 38 s**.
- Earlier thinkers had entertained finite-speed light and Cassini studied Io timing anomalies; avoid implying that Rømer was the first person to *conceive* of finite propagation.
- The numerical SI value of c is exact **by definition**, not an uncertainty-free empirical fit to this exercise. A material medium's phase/group/signal velocities require different analysis.
- The Sun/Earth, Earth/Moon and light-year examples are one-way idealized distances; real celestial distances vary.

## Validation checklist

- [x] Verify historical dates and claims against ScienceNorway, Niels Bohr Institute and Paris Observatory.
- [x] Check c and AU against BIPM and JPL.
- [x] Check Io orbital period against NASA's Jovian Satellite Fact Sheet.
- [ ] Confirm HTML IDs, relative links, JS parsing and numerical model through post-write checks.
- [ ] Confirm the catalog entry and fetch each new file from the repository.
- [ ] Test browser interaction, keyboard navigation, narrow screens and reduced-motion preference in a live browser when available.

## Sources

1. Elise Kjørstad, [ScienceNorway: 350 years ago, this man discovered that light has a finite speed](https://www.sciencenorway.no/culture-history-history-of-science/350-years-ago-this-man-discovered-that-light-has-a-finite-speed/2737969), 16 November 2026.
2. University of Copenhagen, Niels Bohr Institute, [Ole Rømer and the retardation of light](https://nbi.ku.dk/english/www/roemer/roemer/lysets_toeven/).
3. Observatoire de Paris–PSL, [La vitesse de la lumière — 350 ans de Rømer](https://celerite.observatoiredeparis.psl.eu/).
4. [Optics & Photonics News (2009), Ole Rømer and the Speed of Light](https://www.optica-opn.org/home/articles/volume_20/issue_7/features/ole_r%C3%B8mer_and_the_speed_of_light/).
5. [BIPM, SI definition of the metre](https://www.bipm.org/en/si-base-units/metre).
6. [JPL, astronomical unit](https://cneos.jpl.nasa.gov/glossary/au.html).
7. [NASA, Jovian Satellite Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/joviansatfact.html?level=1).
8. [NASA, Earth and the Moon by the numbers](https://science.nasa.gov/moon/by-the-numbers/).
9. [OpenStax Astronomy 2e, §19.1](https://openstax.org/books/astronomy-2e/pages/19-1-fundamental-units-of-distance).

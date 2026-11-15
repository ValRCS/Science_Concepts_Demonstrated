# Dark matter concept: design and model

## Educational purpose

Question: Why do many measured outer-galaxy rotation curves imply more gravitating mass than an ordinary-matter-only model predicts?

The single shared visualization shows a tracked circular orbit and two predicted rotation curves:
- visible mass only (spherical Hernquist profile);
- visible mass plus a cored pseudo-isothermal halo.

These curves are synthetic model predictions, not measured data or fitted parameters.
A shaded halo is an illustrative overlay, not light from dark matter.

## Four progressive levels

1. Discover (7–10): switch between the two equilibrium models and move a star outward.
2. Explore (14–18): change visible mass and dark-halo asymptotic speed; compare curves and physical units.
3. Analyze (bachelor): change core radius and Hernquist scale; derive circular-speed equations.
4. Research (master): discuss infinite-mass asymptotics, other halo models, degeneracies, independent lines of evidence, and particle-search uncertainty.

## Numerics

Use G = 4.30091e-6 kpc (km/s)^2 / solar mass.

Visible (Hernquist) component:
- M_b(<r) = M_b * r^2 / (r + a)^2
- v_b^2 = G * M_b * r / (r + a)^2

Cored pseudo-isothermal dark halo:
- rho_h(r) = rho_0 / [1 + (r/r_c)^2]
- x = r/r_c
- M_h(<r) = 4*pi*rho_0*r_c^3*[x - arctan(x)]
- v_h^2 = v_inf^2 * [1 - arctan(x)/x]
- v_inf^2 = 4*pi*G*rho_0*r_c^2

Circular speed: v_total = sqrt(v_b^2 + v_h^2).
Orbital period: T = 2*pi*r/v (convert kpc and km/s to Myr).
For x much smaller than 1, use x^2/3 to avoid cancellation in 1 - arctan(x)/x.

Default M_b=6e10 solar masses, a=3 kpc, v_inf=205 km/s,
r_c=5 kpc, chosen radius=12 kpc. All sliders use finite, positive ranges.

## Important boundaries

- Newtonian, spherically symmetric potential; real spiral disks are flattened.
- Two *separate hypothetical equilibrium models*, not instantaneous removal of halo mass.
- No measured galaxy data points, no uncertainty propagation, no lensing calculation.
- Cored pseudo-isothermal halo has mass growing asymptotically as r, not a finite total mass.
- A galaxy image and orbit animation are schematic; animation time is not calibrated.
- Cosmological mass-energy percentages are historical rounded Planck-era ΛCDM estimates, **not** the fraction of total matter or fitted outcomes of this demonstration.
- September 2026 LZ report is explicitly not a confirmed dark-matter particle detection.

## Suggested checks

1. Open locally using python -m http.server 8000 --directory docs and visit /visualizations/what-is-dark-matter/.
2. Defaults show two distinct curves; halo-active speed >= visible-only speed.
3. Halo speed zero makes both curves coincide; changing baryonic mass affects both.
4. Larger halo core radius postpones the approach to the halo-speed plateau.
5. Switching explanations reveals controls only for the chosen depth or below.
6. Verify reset, pause/resume, keyboard tab selection (left/right/home/end), and all sliders.
7. Verify responsive layouts and prefers-reduced-motion initially pauses animation.
8. Verify directory search and subject filter find the catalog entry.
9. Validate publication links and DOI references; no claim of live scientific observation.

## Verified sources

- NASA: https://science.nasa.gov/dark-matter/
- ESA Planck: https://www.esa.int/Science_Exploration/Space_Science/Planck/Planck_science_highlights
- Rubin et al. (1980), doi:10.1086/158003
- Clowe et al. (2006), doi:10.1086/508162
- Planck Collaboration (2020), doi:10.1051/0004-6361/201833910
- Bertone & Hooper (2018), doi:10.1103/RevModPhys.90.045002
- DOE LZ (2026): https://www.energy.gov/science/articles/lz-sees-surprising-result-search-dark-matter

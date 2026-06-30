# Invitații & Print — Context Sesiune

Acest document captează starea proiectului de invitații după sesiunea curentă, ca punct de plecare pentru următoarele iterații. **Următorul pas** (declarat de utilizator): îmbunătățirea **clarității** invitațiilor pentru tipărire pe carton texturat — opacitățile mici și textul subțire nu se citesc bine pe hârtia testată la xerox.

---

## Starea curentă a proiectului

**Nuntă:** Ade & Cristi, 4 Iulie 2026  
**Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind. Backend Fastify + MariaDB (Railway). Frontend deploy Vercel. Auth admin via localStorage `admin_token`.

### Variante de invitație existente

| Variantă | Slug rută | Folosește mesaj personalizat (`intro_short`)? | Dimensiuni vizibile |
|---|---|---|---|
| Card QR (verso/față) | `/admin/card` + `/card/[slug]` | Da, pe verso | 9cm × 5.5cm |
| Classic | `/admin/invitatie-classic` + `/invitatie-classic/[slug]` | Nu (folosește text fix din helpers) | 15cm × 21cm |
| Classic Personalisat | `/admin/invitatie-personalisat-classic` + `/invitatie-personalisat-classic/[slug]` | Da, înlocuiește un bloc fix | 15cm × 21cm |

> V1 a fost șters; V2 a fost redenumit în Classic; V3 a fost redenumit în Personalisat Classic. Comit-uri relevante: `438f8b3`, ulterior.

---

## Pagina Print bulk (`/admin/print`)

**Funcționalitate** (commit `eda141c` + fix-uri ulterioare):
- Selector design: `card` sau `classic_personalizat`.
- 2 secțiuni de invitați (Disponibili / Selectați), responsive (col-2 desktop, col-1 mobile), cu search per coloană și butoane „Selectează / Deselectează toți”.
- Filtrul listei: doar **invitații principali** — ascunde rândurile de partener `+1` (commit `972f58e`). Logica copiată din `/admin/guests`:
  ```ts
  const partnerIds = new Set(allGuests.filter(g => g.partner_id && g.plus_one).map(g => g.partner_id));
  const mainGuests = allGuests.filter(g => !partnerIds.has(g.id));
  ```
  Partenerul + copiii sunt rezolvați la generare și apar pe **aceeași** invitație ca pe pagina individuală.
- Counter live + buton Print disabled la 0 selectați.
- Generare secvențială cu progress bar (`X/N generate...`).
- Render off-screen via React Portal la `document.body` (`position: fixed; left: -10000px`).
- `flushSync` din `react-dom` înainte de capture (commit `ebce254`) + `key={guest.id}` pe container — forțează React 18 să comite update-ul sincron, eliminând race condition între state update și `html2canvas`.
- `safeToPng` (wrapper html2canvas) pentru capture, JSZip pentru arhivă, file-saver pentru download.
- Continuă la eroare per invitat; lista de eșecuri afișată la final.
- Slug sanitizat (NFKD + ASCII safe + lowercase + collapse `-`) pentru filename: `frontend/src/utils/slug-sanitize.ts`.

**Format arhive:**
- Card: `print_card_DDMMYYYY_HH_MM.zip` cu `<slug>_card/<slug>_card_fata.png` + `<slug>_card_verso.png` per invitat.
- Classic Personalisat: `print_classic_personalizat_DDMMYYYY_HH_MM.zip` cu `<slug>_classic_personalizat.png` per invitat.

### Module shared pentru renderer (option B din planificare)

- `frontend/src/components/print/CardCanvas.tsx` — exportă `CardFront`, `CardBack`, `buildCardStyles`, `CardGuestData`, `CardPartnerData`, `CardWeddingSettings`. Replică completă a randării din `/admin/card`.
- `frontend/src/components/print/PersonalisatClassicCanvas.tsx` — exportă `PersonalisatClassicCard` și tipurile aferente. Replică completă a randării din `/admin/invitatie-personalisat-classic`.

> **Refactor incomplet:** paginile existente (`/admin/card`, `/card/[slug]`, etc.) **nu** importă încă din modulele shared — au propria randare inline. Modulele shared sunt momentan folosite **doar** de `/admin/print`. Există duplicare de cod între pagini și modulele shared, care poate fi consolidată într-o iterație ulterioară.

---

## Specificații vizuale curente

### Card (front + back)

- Wrapper exterior `.card-face`: `width = calc(9cm + 20px)`, `height = calc(5.5cm + 20px)`, `padding: 10px` (pentru crop marks).
- Border outer (`.card-outer`): **0.8px solid** la **50% opacity** (suffix hex `80`).
- Border inner (`.card-inner`): **0.5px solid** la **30% opacity** (suffix hex `4D`), cu `border-radius: 2px` (singurul cu radius).
- Crop marks dashed: `1px dashed` la **30% opacity**, poziționat la `9px` (1px în afara solidului), overhang **10px** peste fiecare colț → formează `+` la fiecare colț.
- Mască: pseudo-elements `.card-outer::before/::after` cu border solid bg-color de 1px, ascund liniile dashed pe lungimea solidului.
- Corner ornaments (cele 4 SVG-uri din interior): `opacity: 0.3`.
- Monogramă A&C: SVG `<text>` cu `<tspan>`-uri (NU overlay HTML — capturat consistent de html2canvas).
- Date row separators (front+back): SVG complet cu text + linii la coordonate fixe.
- Spațieri verso (de la sus în jos):
  - `INVITAȚIE` → heart divider: `marginBottom: 10px` pe label.
  - heart divider → `Draga {nume}`: heart `marginBottom: "3px"`, `.card-greeting` cu `marginTop: 0` + `lineHeight: 1` inline.
  - `.card-message` `margin-bottom: 10px`.
  - `Ade & Cristi` → `împreună cu nașii ...`: `marginTop: "2px"` + `lineHeight: 1` pe `.card-nasi`. `.card-back-names` cu `margin: 0` în CSS. `.card-back-footer` **fără** `marginTop: auto` (commit `27bd172`).

### Classic + Classic Personalisat

- Wrapper: `padding: 10px`.
- Inner card: 15cm × 21cm.
- Border outer: **2px solid** la **50% opacity** (`80`).
- Border inner: **1px solid** la **40% opacity** (`66`), fără radius.
- Crop marks: `1px dashed` la **30% opacity**, overhang **10px**.
- Mască: 4 div-uri absolute după card, bg-color, lungimea solidului.
- Date row și blocul Părinți sunt SVG-uri complete (commit-uri anterioare pentru aliniere fiabilă în PNG).
- Greeting "Dragii noștri / Dragul nostru / Draga noastră" cu numele invitaților pe rând separat — apare deasupra secțiunii nași.
- Audience pentru plural: `!!partner || !!(guest.children && guest.children.length > 0)` — copilul singur cu un părinte e tratat ca plural.
- Toate diacriticele românești corecte (Ă, Â, Î, Ș, Ț) în textele hardcoded.
- `getAsteptamLineShort` din `frontend/src/utils/invitation-text.ts` returnează formă cu diacritice (afectează și script-ul de închidere de pe v2 + v3).
- Personalisat Classic: bloc cu flourishes sus/jos (margins doar pe partea exterioară: top flourish are `marginTop: "0.1cm"`, bottom flourish are `marginBottom: "0.1cm"`); paragrafele intro_short au `margin: 0` ca să fie tight cu ornamentele.

---

## Setări (wedding_settings) folosite

Câmpuri relevante pentru randare:
- Nume miri: `nume_mire`, `nume_mireasa`.
- Nași: `nas_*`, `nasa_*` (prenume, nume).
- Părinți: `tata_mireasa_*`, `mama_mireasa_*`, `tata_mire_*`, `mama_mire_*` (prenume + nume); fallback string `parinti_mireasa`, `parinti_mire`.
- Eveniment: `ceremonie_data`, `ceremonie_ora`, `ceremonie_adresa`, `transport_*`, `petrecere_*`.
- RSVP: `confirmare_pana_la`.
- Telefon: `telefon_mireasa`, `telefon_mire`.
- Culori: `color_main`, `color_button`, `color_text` (folosite pentru `bg`, `ornament`, `primary`).

`color_main` e folosit ca culoare a hârtiei (background card-outer + page bg + culoarea măștii peste crop marks).

---

## Modificări vizuale recente (acest tab al sesiunii)

1. Date row redesenat ca SVG complet (rezolvă alinierea separatorilor verticali pe care html2canvas o gestiona inconsistent).
2. Monograma A&C mutată din overlay HTML cu `<span>`-uri în SVG `<text>` cu `<tspan>`-uri.
3. Diacritice românești complete în textele hardcoded; helper `getAsteptamLineShort` actualizat.
4. Eliminat blocul "la celebrarea căsătoriei noastre" + ornamente din Classic.
5. Părinții afișați în Personalisat Classic ca SVG (rezolvă suprapunerea liniei verticale cu textul în PNG).
6. Greeting cu nume pe 2 rânduri introdus pe Classic Personalisat.
7. Audience consideră acum copiii (plural pentru părinte singur cu copii).
8. RSVP: scos `DUMNEAVOASTRĂ`.
9. Card: trecut la border style 0.8px / 0.5px cu opacități + crop marks dashed + mască cu pseudo-elements.
10. Pagina print bulk implementată complet.
11. Race condition în print fix-uit (`flushSync` + `key`).
12. Filtrul de invitați principali în print (commit `972f58e`).
13. Fine-tuning spațieri verso card (heart→greeting, names→nași, eliminat `marginTop: auto` pe footer).

Ultimul commit pe `main`: `972f58e`.

---

## Următorul pas — îmbunătățire claritate pentru tipărire

**Problema observată la xerox** (sesiunea de printare reală):
- Cartonul testat are textură de linii transversale.
- Elementele cu **opacitate mică** (50%, 40%, 30%) nu se citesc bine — textura cartonului concurează vizual cu liniile estompate.
- Textul cu **font-weight light** (300, 400) cu litere subțiri devine greu de citit.

**Direcție propusă** (pentru noua iterație):
- Creare versiuni "high-contrast" / "print-optimized" ale invitațiilor (probabil ca opțiune nouă în selector lângă variantele actuale, ca să nu rupem cele existente). De decis dacă:
  1. Versiuni paralele noi (ex: `card-print`, `classic-print`, `classic-personalisat-print`) — siguranță, nu strică testele anterioare.
  2. Toggle la nivelul existentelor (ex: query param `?print=1`) — reutilizare.
- Modificări concrete de evaluat:
  - Toate opacitățile sub 60% trec la 70-90% (border-uri, crop marks, ornamente).
  - Font-weight 300 → 400/500 minimum.
  - Crop marks: păstrat dashed dar mai îngroșat (de la 1px la 1.5-2px) și mai opac.
  - Border outer: mărit de la 0.8px → 1.2-1.5px.
  - Border inner: mărit + opacitate mai mare.
  - Corner ornaments din card: opacity 0.3 → 0.6+ (sau eliminați dacă nu sunt esențiali).
  - Text "ora 15:00" / adrese / telefoane: bold sau medium, eventual culoare mai închisă (mai puțin `c.muted`).
  - Linia verticală dintre părinți (Classic Personalisat): grosime + opacitate mai mare.
  - Heart divider: stroke mai gros.
- De testat în paralel: pe carton smooth vs texturat să vedem dacă nuanțele rămân OK.

---

## Cum se rulează

```bash
cd /Users/cristitatariga/Projects/adesicristi
./dev.sh
```
Servere: MariaDB (auto), Backend `:3011`, Frontend Next.js `:3000`.  
Login admin: din `/admin` cu credențiale stocate în Railway/.env.

Test bulk print: `http://localhost:3000/admin/print` (după login).

---

## Untracked în git (lăsate intenționat)

- `assets/video/`
- `frontend/src/app/video-invite/`

Aceste foldere conțin work-in-progress neterminat, nu sunt incluse în commit-uri.

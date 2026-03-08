# InviteMe.ro - Template "Glass" - Documentatie Completa

> **Sursa:** https://www.inviteme.ro/preview/wedding/glass
> **Ultima actualizare:** 2026-03-08
> **Scop:** Referinta pentru constructia site-ului de nunta Ade & Cristi

---

## 1. Structura Generala a Paginii

```
<body>
├── Hero Section (cover + countdown)
├── Navigare principala (anchor links)
├── Sectiunea "Noi doi" (prezentare cuplu)
├── Sectiunea "Familie" (nasi + parinti)
├── Sectiunea "Locatii" (3 evenimente)
│   ├── Cununia Civila
│   ├── Cununia Religioasa
│   └── Petrecerea
├── Sectiunea RSVP (formular confirmare)
├── Footer
└── Preview Bar (fix, jos - doar pe site-ul InviteMe, nu face parte din invitatie)
```

---

## 2. Sectiuni Detaliate

### 2.1 Hero Section

- **Titlu principal:** "Sunteti invitati la nunta noastra"
- **Nume cuplu:** "Ioana & Paul" (font mare, centrat)
- **Data:** "8 Aprilie 2026"
- **Locatie:** "Restaurant Oliviers / Bucuresti"
- **Buton CTA:** "Deschide invitatia"
- **Comportament:** La click pe buton, pagina face scroll smooth catre continut

### 2.2 Countdown Timer

- **Format:** `000 zile : 00 ore : 00 min : 00 sec`
- **Logica JS:** Calculeaza diferenta intre data curenta si data nuntii, actualizeaza in timp real
- **Afisare:** Numere mari monospaciate cu etichete sub fiecare unitate

### 2.3 Navigare

- **Tip:** Meniu orizontal cu anchor links
- **Elemente:**
  - `Noi doi` → #couple
  - `Familie` → #family
  - `Locatii` → #locations
  - `Confirma prezenta` → #rsvp
- **Comportament:** Scroll smooth la sectiunea corespunzatoare

### 2.4 Sectiunea "Noi doi"

- **Subtitlu:** "Ne casatorim!"
- **Text introductiv:** "Cu drag va invitam sa petreceti alaturi de noi cel mai important moment din viata noastra"
- **Titlu sectiune:** "O calatorie a iubirii"
- **Text descriptiv:** "Sunt momente in viata pe care le astepti cu sufletul la gura..."
- **Imagine:** Fotografie cuplu (`/templates/wedding/glass/img/couple.jpg`)

### 2.5 Sectiunea "Familie"

- **Nasi:** "Impreuna cu nasii: Maria si Ion Popovici"
- **Parinti:** "Dragii nostri parinti: Paul si Claudia Marinescu"
- **Layout:** Text centrat, probabil cu decoratiuni subtile

### 2.6 Sectiunea "Locatii" (3 carduri)

Fiecare eveniment este afisat intr-un card cu imagine, detalii si buton navigare.

#### Card 1: Cununia Civila
- **Titlu:** "Cununia Civila"
- **Data/Ora:** "8 Aprilie 2026, ora 11:00"
- **Adresa:** "Oficiul starii civile, Maresal Alexandru Averescu 17, Sector 1, Bucuresti"
- **Imagine:** `/templates/wedding/glass/img/civila.jpg`
- **Buton:** "Vezi pe harta"

#### Card 2: Cununia Religioasa
- **Titlu:** "Cununia Religioasa"
- **Data/Ora:** "8 Aprilie 2026, ora 14:00"
- **Adresa:** "Manastirea Casin, Bulevardul Marasti 16, Bucuresti"
- **Imagine:** `/templates/wedding/glass/img/religioasa.jpg`
- **Buton:** "Vezi pe harta"

#### Card 3: Petrecerea
- **Titlu:** "Petrecerea"
- **Data/Ora:** "8 Aprilie 2026, ora 18:00"
- **Adresa:** "Restaurant Oliviers Mediteranean, Strada Clucerului, Bucuresti"
- **Imagine:** `/templates/wedding/glass/img/petrecere.jpg`
- **Buton:** "Vezi pe harta"

#### Comportament Buton "Vezi pe harta"
- **Pe mobil:** Deschide drawer (`.inviteme-maps-drawer`) cu optiuni:
  - Google Maps
  - Apple Maps
  - Waze
- **Pe desktop:** Deschide direct Google Maps
- **Titlu drawer:** "Alege o aplicatie"

### 2.7 Sectiunea RSVP (Formular Confirmare)

- **Container class:** `.confirmation-wrapper`

#### Campuri formular:
1. **Dropdown "Cate persoane"** - obligatoriu
   - Optiuni: "O persoana", "Doua persoane"
2. **Input "Numele tau"** (class `.personName`) - obligatoriu
3. **Input "Nume partener"** (class `.partnerName`) - obligatoriu doar daca s-a selectat 2 persoane
   - **Vizibilitate conditionata:** Apare doar cand se selecteaza "Doua persoane"
4. **Textarea "Vrei sa ne transmiti ceva?"** - optional
5. **Butoane confirmare/respingere**

#### Validare:
- **Numar persoane neselectat:** "Te rog sa alegi numarul de persoane"
- **Nume gol:** "Te rog sa introduci numele"
- **Nume partener gol:** "Te rog sa introduci numele partenerului"

#### Dupa trimitere:
- Toate input-urile se dezactiveaza (disabled)
- Apare mesaj: "Multumim pentru confirmare!"
- Subtitlu: "Ioana & Paul"
- Text suplimentar: "Va multumim din suflet"

#### Comportament tastatura:
- Tasta Enter muta focusul intre campuri (nu trimite formularul)
- Exceptie: Textarea permite Enter normal (newline)

---

## 3. Design Visual

### 3.1 Paleta de Culori

| Rol | Culoare | Hex |
|-----|---------|-----|
| Background principal | Alb | `#FFFFFF` |
| Background dark sections | Negru/gri inchis | `#222222` / `#1F1E1E` |
| Accent principal (roz) | Roz cald | `#F9667A` |
| Accent secundar (roz deschis) | Roz magenta | `#F97BAA` |
| Accent teal | Teal | `#53777A` |
| Accent coral | Coral rosu | `#C02942` |
| Text body | Gri inchis | `#333333` |
| Text pe fundal inchis | Alb | `#FFFFFF` |
| Borduri carduri | Gri deschis | `#CCCCCC` |
| Footer text accent | Roz | `#F9667E` |

### 3.2 Tipografie

- **Font principal:** Arial + alternative serif
- **Headings:** Uppercase, bold, fara decoratiuni excesive
- **Body text:** Sans-serif, curat, line-height generosa
- **Countdown numere:** Monospaced

### 3.3 Stiluri Componente

#### Carduri Locatii
- Latime egala (3 coloane pe desktop)
- Bordura: `1px solid #CCC`
- Umbra subtila (box-shadow)
- Imagine full-width in partea superioara
- Continut centrat

#### Butoane
- Border-radius: `11px`
- Background: culoare accent solida
- Text alb
- Hover: posibil darken/lighten

#### Input-uri Formular
- Bordura: `1px solid #CCC`
- Stare disabled: opacitate redusa
- Focus: posibil border accent

### 3.4 Spatiere
- Padding consistent `10-20px` in jurul elementelor
- Whitespace generos intre sectiuni (efect de eleganta)
- Sectiunile sunt separate vizual prin spatiu sau fundal alternativ

---

## 4. Responsive Design

- **Breakpoints:** Foloseste clase Bootstrap-like (`hidden-xs`, `hidden-sm`)
- **Mobile:**
  - Cardurile locatii se stocheaza vertical (1 coloana)
  - Spatiere touch-friendly crescuta
  - Drawer pentru selectie harta (in loc de link direct)
  - Elementele ascunse pe mobile via `hidden-xs`, `hidden-sm`
- **Desktop:**
  - 3 coloane pentru carduri locatii
  - Link direct Google Maps (fara drawer)

---

## 5. Functionalitati JavaScript

### 5.1 Countdown Timer
- Calcul diferenta `dataEveniment - Date.now()`
- Actualizare la fiecare secunda
- Afiseaza zile, ore, minute, secunde

### 5.2 Formular RSVP
- Validare client-side inainte de submit
- Campuri dinamice (partener apare/dispare)
- Dezactivare campuri dupa confirmare
- Management stare formular

### 5.3 Navigare Harta
- Detectie dispozitiv (mobil vs desktop)
- Pe mobil: drawer cu optiuni (Google Maps, Apple Maps, Waze)
- Pe desktop: deschide Google Maps direct

### 5.4 Scroll & Navigare
- Smooth scroll la click pe anchor links din meniu
- Buton "Deschide invitatia" face scroll la prima sectiune

### 5.5 Detectie Device
- Identificare mobil vs desktop
- Ajustare zoom la 70% in modul preview iframe (pe telefon)

---

## 6. Tracking & Analytics (doar pe InviteMe)

- Facebook Pixel
- Google Analytics (GA-18355689-7)
- Google Tag Manager (GTM-5Q7L9SW)
- New Relic monitoring

---

## 7. Imagini Necesare

| Imagine | Descriere | Dimensiuni estimate |
|---------|-----------|-------------------|
| `couple.jpg` | Fotografie cuplu principala | ~800x600px landscape |
| `civila.jpg` | Locatie cununia civila | ~600x400px |
| `religioasa.jpg` | Locatie cununia religioasa | ~600x400px |
| `petrecere.jpg` | Locatie petrecere/restaurant | ~600x400px |

---

## 8. Flux Utilizator (User Flow)

```
1. Invitatul deschide link-ul
2. Vede hero section cu numele cuplului + countdown
3. Click "Deschide invitatia"
4. Scroll prin sectiuni:
   a. Citeste mesajul emotional
   b. Vede detalii familie (nasi, parinti)
   c. Vede cele 3 locatii + poate naviga pe harta
5. Ajunge la formular RSVP
6. Selecteaza numar persoane (1 sau 2)
7. Completeaza numele
8. Optional: scrie un mesaj
9. Confirma sau refuza prezenta
10. Vede mesaj de multumire
```

---

## 9. Alte Template-uri Disponibile pe InviteMe (pentru referinta)

| Nume | URL Preview |
|------|------------|
| Celestial | `/preview/wedding/celestial` |
| Forever | `/preview/wedding/forever` |
| Serenity | `/preview/wedding/serenity` |
| Minimal | `/preview/wedding/minimal` |
| Timeless | `/preview/wedding/timeless` |
| Classy | `/preview/wedding/classy` |
| Romance | `/preview/wedding/romance` |
| Simple Love | `/preview/wedding/simple-love` |
| Purple Flowers | `/preview/wedding/purple-flowers` |
| The Two of Us | `/preview/wedding/the-two-of-us` |
| Best Friends Forever | `/preview/wedding/bff` |
| Innocent | `/preview/wedding/innocent` |
| Sublime | `/preview/wedding/sublime` |

---

## 10. Footer

- **Text:** "Trimis cu ♥ prin InviteMe.ro"
- **Link:** Catre site-ul InviteMe.ro
- **Link secundar:** "← Inapoi la site"

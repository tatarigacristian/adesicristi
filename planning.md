# Planning - Site Prezentare Nunta

> Ultima actualizare: 2026-03-08

---

## 1. Stack Tehnic

| Componenta | Tehnologie | Note |
|------------|-----------|------|
| Frontend | React + Next.js | SPA, mobile-first |
| Backend | Node.js + Fastify | REST API |
| Baza de date | MySQL | Relational |
| Styling | Tailwind CSS | Utility-first |
| Hosting frontend | Vercel | Gratuit tier, deploy simplu |
| Hosting backend | Railway | Gratuit tier, MySQL inclus, setup usor |
| Repo structure | Monorepo | frontend/ + backend/ in acelasi repo |
| Video | YouTube embed | Incarcat pe YouTube pentru performanta |

---

## 2. Arhitectura Proiectului

```
adesicristi/
├── frontend/                # Next.js app
│   ├── src/
│   │   ├── app/             # App router (single page)
│   │   ├── components/      # Componente React
│   │   │   ├── Hero/
│   │   │   ├── Countdown/
│   │   │   ├── Navigation/
│   │   │   ├── Couple/      # "Noi doi" + video YouTube
│   │   │   ├── Family/
│   │   │   ├── Locations/
│   │   │   ├── RSVP/
│   │   │   └── Footer/
│   │   ├── hooks/           # Custom hooks
│   │   ├── utils/           # Helpers (countdown logic, etc.)
│   │   └── styles/          # Tailwind config + globals
│   ├── public/              # Assets statice (imagini)
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   └── package.json
│
├── backend/                 # Fastify API
│   ├── src/
│   │   ├── server.ts        # Entry point Fastify
│   │   ├── routes/
│   │   │   ├── rsvp.ts      # POST /api/rsvp
│   │   │   └── auth.ts      # POST /api/auth/login
│   │   ├── db/
│   │   │   ├── connection.ts # MySQL connection
│   │   │   └── migrations/  # Schema SQL
│   │   ├── middleware/
│   │   │   └── auth.ts      # JWT/session middleware
│   │   └── config/
│   │       └── index.ts     # Env vars
│   └── package.json
│
├── docs/                    # Documentatie referinta
├── assets/                  # Video, imagini sursa
├── planning.md
└── tasks.md
```

---

## 3. Structura Paginii (Single Page)

Referinta: template "Glass" de pe InviteMe.ro

| # | Sectiune | Descriere | Snap scroll |
|---|----------|-----------|-------------|
| 1 | Hero | Titlu, nume cuplu, data, CTA "Deschide invitatia" | Da |
| 2 | Countdown | Zile / Ore / Min / Sec pana la 4.07.2026 | Da |
| 3 | Noi doi | Text emotional + video YouTube embed | Da |
| 4 | Familie | Nasi + Parinti | Da |
| 5 | Locatii | 3 carduri: Civila, Religioasa, Petrecerea | Da |
| 6 | RSVP | Formular confirmare prezenta | Da |
| 7 | Footer | Simplu, minimal | - |

> Continutul text si datele locatiilor vor fi completate pe parcurs.

---

## 4. Design System

### 4.1 Paleta de Culori (din referinta Glass, se poate ajusta)

| Rol | Hex | Nota |
|-----|-----|------|
| Background principal | `#FFFFFF` | - |
| Background dark sections | `#1F1E1E` | Hero, posibil footer |
| Accent principal | `#F9667A` | Butoane, highlights |
| Accent secundar | `#F97BAA` | Hover states |
| Text body | `#333333` | - |
| Text pe fundal inchis | `#FFFFFF` | - |
| Borduri | `#CCCCCC` | Carduri, inputs |

> Paleta finala se va confirma pe parcurs.

### 4.2 Tipografie

- Headings: serif elegant (TBD - Google Fonts)
- Body: sans-serif curat
- Countdown: monospaced

### 4.3 Layout

- **Mobile-first** cu Tailwind breakpoints
- Fiecare sectiune: `h-screen` (100vh)
- **Snap scrolling** pe mobil: `scroll-snap-type: y mandatory`
- Responsive: 1 coloana mobil, 3 coloane desktop (carduri locatii)

---

## 5. Baza de Date - Schema

### Tabel: `admin_users`
| Coloana | Tip | Note |
|---------|-----|------|
| id | INT AUTO_INCREMENT | PK |
| username | VARCHAR(100) | Unique |
| password | VARCHAR(255) | Hashed (bcrypt) |
| created_at | TIMESTAMP | Default NOW() |

### Tabel: `rsvp_responses`
| Coloana | Tip | Note |
|---------|-----|------|
| id | INT AUTO_INCREMENT | PK |
| person_count | TINYINT | 1 sau 2 |
| name | VARCHAR(200) | Obligatoriu |
| partner_name | VARCHAR(200) | Nullable |
| message | TEXT | Optional |
| attending | BOOLEAN | true = confirma, false = refuza |
| created_at | TIMESTAMP | Default NOW() |

---

## 6. API Endpoints

| Metoda | Endpoint | Descriere | Auth |
|--------|----------|-----------|------|
| POST | `/api/rsvp` | Trimite confirmare | Nu |
| POST | `/api/auth/login` | Login admin | Nu |
| GET | `/api/admin/rsvp` | Lista confirmari | Da (JWT) |

> Se vor adauga mai multe endpoints pe parcurs pentru admin panel.

---

## 7. Decizii Tehnice

| Decizie | Alegere | Motiv |
|---------|---------|-------|
| Video hosting | YouTube embed | Performanta, CDN gratuit |
| Auth admin | JWT simplu + bcrypt | Suficient pentru scope-ul curent |
| DB credentials admin | Seed in DB | Valori embedded la setup |
| Snap scroll | CSS native | `scroll-snap-type` fara librarii |
| Deployment frontend | Vercel | Simplu, gratuit tier |
| Deployment backend | Railway | Free tier, MySQL inclus, config simplu |
| Repo structure | Monorepo | Un singur repo, doua foldere |

---

## 8. Decizii Design & UX

| Decizie | Alegere | Nota |
|---------|---------|------|
| Hero background | Imagine de fundal (foto cuplu) | - |
| Muzica de fundal | Nu | - |
| Animatii scroll | Da | Fade-in, slide-up la intrarea in viewport |
| Limba | Doar romana | - |
| RSVP extras | Nu | Fara meniu/alergii, fara deadline, fara email |
| Paleta culori | Glass (temporar) | Se va ajusta pe parcurs |
| Fonturi | TBD | Se vor alege pe parcurs |

---

## 9. Intrebari Deschise

- [ ] Continut text definitiv pentru fiecare sectiune
- [x] Numele cuplului → Ade & Cristi
- [x] Data nuntii → 4 Iulie 2026
- [ ] Locatiile reale (adrese, ore)
- [ ] Paleta de culori finala (temporar: Glass)
- [ ] Fonturi preferate
- [ ] Imagini (cuplu, locatii)
- [x] Hosting backend → Railway
- [x] Hosting frontend → Vercel
- [x] Repo structure → Monorepo

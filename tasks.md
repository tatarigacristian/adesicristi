# Tasks - Site Prezentare Nunta

> Ultima actualizare: 2026-03-08
> Progres general: 6 / 29 task-uri complete

---

## Faza 1: Setup & Infrastructura
> Prioritate: **High** | Dependente: Niciuna

- [x] **T1.1** Initializare proiect Next.js cu TypeScript si Tailwind CSS `High`
- [x] **T1.2** Initializare proiect Fastify cu TypeScript `High`
- [x] **T1.3** Setup MySQL - schema + migrari (admin_users, rsvp_responses) `High`
- [x] **T1.4** Configurare conexiune DB (mysql2) `High`
- [x] **T1.5** Setup .env si configurari environment `High`
- [x] **T1.6** Seed admin user in DB (username + parola hashed) `High`

---

## Faza 2: Backend API
> Prioritate: **High** | Dependente: Faza 1

- [ ] **T2.1** Endpoint POST `/api/auth/login` - autentificare admin cu JWT `High`
- [ ] **T2.2** Middleware autentificare JWT `High`
- [ ] **T2.3** Endpoint POST `/api/rsvp` - salvare confirmare `High`
- [ ] **T2.4** Endpoint GET `/api/admin/rsvp` - lista confirmari (protejat) `Medium`
- [ ] **T2.5** Validare input pe toate endpoint-urile `Medium`
- [ ] **T2.6** CORS configurare pentru frontend `Medium`

---

## Faza 3: Frontend - Layout & Navigare
> Prioritate: **High** | Dependente: Faza 1 (T1.1)

- [ ] **T3.1** Layout principal cu snap scrolling (CSS native) `High`
- [ ] **T3.2** Componenta Navigation - meniu cu anchor links `High`
- [ ] **T3.3** Smooth scroll behavior `Medium`
- [ ] **T3.4** Responsive breakpoints Tailwind (mobile-first) `High`

---

## Faza 4: Frontend - Sectiuni
> Prioritate: **High** | Dependente: Faza 3

- [ ] **T4.1** Hero Section - imagine fundal, titlu, nume cuplu, data, CTA button `High`
- [ ] **T4.2** Countdown Timer - logica JS + UI (target: 4.07.2026) `High`
- [ ] **T4.3** Sectiunea "Noi doi" - text + YouTube video embed `High`
- [ ] **T4.4** Sectiunea "Familie" - nasi + parinti `Medium`
- [ ] **T4.5** Sectiunea "Locatii" - 3 carduri cu detalii + buton harta `High`
- [ ] **T4.6** Drawer harta pe mobil (Google Maps / Apple Maps / Waze) `Medium`
- [ ] **T4.7** Footer - minimal `Low`
- [ ] **T4.8** Animatii scroll pe toate sectiunile (fade-in, slide-up la intrare in viewport) `Medium`

---

## Faza 5: Frontend - RSVP Form
> Prioritate: **High** | Dependente: Faza 2 (T2.3), Faza 3

- [ ] **T5.1** Formular RSVP - UI campuri (dropdown, inputs, textarea) `High`
- [ ] **T5.2** Logica conditionala - camp partener vizibil doar la 2 persoane `High`
- [ ] **T5.3** Validare client-side `Medium`
- [ ] **T5.4** Integrare cu API POST `/api/rsvp` `High`
- [ ] **T5.5** Stare post-submit (disable campuri + mesaj multumire) `Medium`
- [ ] **T5.6** Comportament tastatura (Enter navigheaza intre campuri) `Low`

---

## Faza 6: Polish & Deploy
> Prioritate: **Medium** | Dependente: Fazele 1-5

- [ ] **T6.1** Optimizare imagini si assets `Medium`
- [ ] **T6.2** Deploy frontend pe Vercel `High`
- [ ] **T6.3** Deploy backend pe Railway `High`
- [ ] **T6.4** Testare end-to-end mobil + desktop `High`

---

## Note

- Continutul text (placeholder) va fi inlocuit cu texte reale pe parcurs
- Admin panel extins se va adauga in faze viitoare
- Data nuntii confirmata: **4 Iulie 2026**

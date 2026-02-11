# Alphaleads — Product Requirements Document (PRD)

**Versione:** 1.0  
**Data:** 6 febbraio 2026  
**Autore:** Giuseppe  
**Stato:** Draft  

---

## 1. Vision e Obiettivo del Prodotto

Alphaleads è una web app che consente agli utenti di generare liste di contatti B2B targettizzati attraverso un'interfaccia intuitiva. L'app si integra con il servizio Apify "Leads Finder" (`code_crafter/leads-finder`, Actor ID: `IoSHqwTR9YGhzccez`) per estrarre dati verificati di contatti aziendali, e li presenta in modo organizzato e pronto per l'esportazione verso CRM o campagne di outreach.

L'obiettivo è eliminare la complessità dell'interfaccia Apify e offrire un'esperienza self-service dove l'utente configura i filtri, lancia la ricerca, e ottiene risultati puliti con email verificate, numeri di telefono, URL LinkedIn e dati aziendali dettagliati.

---

## 2. Stack Tecnologico

- **Framework:** Next.js (App Router)
- **Linguaggio:** TypeScript
- **Styling:** Tailwind CSS (il design sarà fornito via screenshot separato)
- **Database:** Supabase (PostgreSQL) per persistenza ricerche, risultati e gestione utenti
- **Autenticazione:** Supabase Auth
- **API esterna:** Apify REST API v2
- **Deployment:** Vercel

---

## 3. Architettura dell'Integrazione Apify

### 3.1 Flusso API

Il backend comunica con Apify tramite le seguenti chiamate REST:

1. **Avvio ricerca (Run Actor):**
   ```
   POST https://api.apify.com/v2/acts/IoSHqwTR9YGhzccez/runs?token={APIFY_TOKEN}
   Content-Type: application/json
   Body: { ...filtri dell'utente mappati sull'input schema }
   ```
   Risposta: oggetto run con `id` e `defaultDatasetId`.

2. **Polling stato (Get Run):**
   ```
   GET https://api.apify.com/v2/acts/IoSHqwTR9YGhzccez/runs/{runId}?token={APIFY_TOKEN}
   ```
   Controllare il campo `status`: `READY` → `RUNNING` → `SUCCEEDED` / `FAILED`.  
   Polling ogni 5 secondi.

3. **Recupero risultati (Get Dataset Items):**
   ```
   GET https://api.apify.com/v2/datasets/{defaultDatasetId}/items?token={APIFY_TOKEN}&format=json
   ```

### 3.2 Variabili d'ambiente richieste

```env
APIFY_API_TOKEN=           # Token API Apify dell'utente admin
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### 3.3 Mapping Input Schema — Filtri Utente → Payload Apify

Questa è la mappa completa dei campi che l'interfaccia utente deve esporre e come vengono tradotti nel payload JSON inviato ad Apify.

| Campo UI | Chiave Apify | Tipo | Descrizione |
|---|---|---|---|
| Numero di lead | `fetch_count` | integer (default: 25) | Quante lead recuperare. Max consigliato: 50.000 |
| Nome ricerca | `file_name` | string | Label opzionale per identificare il run |
| Job Title (includi) | `contact_job_title` | string[] | Es: ["Marketing Manager", "CMO"] |
| Job Title (escludi) | `contact_not_job_title` | string[] | Titoli da escludere |
| Livello Seniority | `seniority_level` | string[] | Valori: Founder, Owner, C-Level, Director, VP, Head, Manager, Senior, Entry, Trainee |
| Livello Funzionale | `functional_level` | string[] | Valori: C-Level, Finance, Product, Engineering, Design, HR, IT, Legal, Marketing, Operations, Sales, Support |
| Location (includi) | `contact_location` | string[] | Regione/Paese/Stato. Es: ["United States", "EMEA"] |
| Città (includi) | `contact_city` | string[] | Città specifiche. Usare AL POSTO di Location per targeting cittadino |
| Location (escludi) | `contact_not_location` | string[] | Regioni/Paesi da escludere |
| Città (escludi) | `contact_not_city` | string[] | Città da escludere |
| Stato Email | `email_status` | string[] | Valori: "validated", "not_validated", "unknown". Default: ["validated"] |
| Dominio Azienda | `company_domain` | string[] | Es: ["google.com", "apple.com"] |
| Dimensione Azienda | `size` | string[] | Valori: "0-1", "2-10", "11-20", "21-50", "51-100", "101-200", "201-500", "501-1000", "1001-2000", "2001-5000", "10000+" |
| Industry (includi) | `company_industry` | string[] | Es: ["computer software", "saas", "marketing & advertising"] |
| Industry (escludi) | `company_not_industry` | string[] | Settori da escludere |
| Keywords azienda (includi) | `company_keywords` | string[] | Ricerca libera nel profilo aziendale |
| Keywords azienda (escludi) | `company_not_keywords` | string[] | Keywords da escludere |
| Revenue minima | `min_revenue` | string | Valori: "100K", "500K", "1M", "5M", "10M", "25M", "50M", "100M", "250M", "500M", "1B", "5B", "10B" |
| Revenue massima | `max_revenue` | string | Stessi valori di min_revenue |
| Tipo di Funding | `funding` | string[] | Valori: "Seed", "Angel", "Series A", "Series B", "Series C", "Series D", "Series E", "Series F", "Venture", "Debt Financing", "Convertible Note", "Private Equity", "Other" |

### 3.4 Output Schema — Dati Restituiti per ogni Lead

Ogni record nel dataset restituito contiene i seguenti campi:

**Dati Persona:**
- `first_name` (string) — Nome
- `last_name` (string) — Cognome
- `full_name` (string) — Nome completo
- `job_title` (string) — Ruolo
- `headline` (string) — Headline LinkedIn
- `functional_level` (string) — Livello funzionale
- `seniority_level` (string) — Livello seniority
- `email` (string) — Email aziendale verificata
- `mobile_number` (string) — Numero mobile (solo piani Apify a pagamento)
- `personal_email` (string) — Email personale
- `linkedin` (string/URL) — Profilo LinkedIn
- `city` (string) — Città del contatto
- `state` (string) — Stato/Regione
- `country` (string) — Paese

**Dati Azienda:**
- `company_name` (string) — Nome azienda
- `company_domain` (string) — Dominio web
- `company_website` (string/URL) — Sito web
- `company_linkedin` (string/URL) — Pagina LinkedIn aziendale
- `company_linkedin_uid` (string) — UID LinkedIn aziendale
- `company_size` (string) — Range dimensione
- `industry` (string) — Settore
- `company_description` (string) — Descrizione
- `company_annual_revenue` (string) — Revenue (formato display)
- `company_annual_revenue_clean` (number) — Revenue (valore numerico)
- `company_total_funding` (string) — Funding totale (formato display)
- `company_total_funding_clean` (number) — Funding (valore numerico)
- `company_founded_year` (number) — Anno fondazione
- `company_phone` (string) — Telefono azienda
- `company_street_address` (string) — Indirizzo
- `company_city` (string) — Città sede
- `company_state` (string) — Stato sede
- `company_country` (string) — Paese sede
- `company_postal_code` (string) — CAP
- `company_full_address` (string) — Indirizzo completo
- `company_market_cap` (string) — Market cap (se quotata)

**Dati Contesto:**
- `keywords` (string[]) — Keywords associate
- `company_technologies` (string[]) — Tech stack

---

## 4. Struttura delle Pagine e Funzionalità

### 4.1 Pagina — Login / Registrazione

**Route:** `/login`, `/register`

**Funzionalità:**
- Login con email + password tramite Supabase Auth
- Registrazione nuovo utente
- Reset password
- Redirect a `/dashboard` dopo autenticazione
- Tutte le altre pagine sono protette e richiedono autenticazione

---

### 4.2 Pagina — Dashboard

**Route:** `/dashboard`

**Funzionalità:**
- Vista riepilogativa dell'account: numero totale di ricerche effettuate, totale lead estratte, ultima ricerca
- Lista delle ultime 5 ricerche recenti con: nome ricerca, data, numero lead trovate, stato (completata / in corso / fallita)
- Click su una ricerca porta alla pagina dei risultati di quella ricerca
- Pulsante prominente "Nuova Ricerca" che porta alla pagina di ricerca
- Statistiche di utilizzo (lead totali estratte nel mese corrente)

---

### 4.3 Pagina — Nuova Ricerca (Form Filtri)

**Route:** `/search/new`

Questa è la pagina core dell'applicazione. Presenta il form di configurazione dei filtri organizzato in sezioni logiche.

**Sezione 1 — Configurazione Base**
- **Nome Ricerca** (text input, opzionale): label identificativa. Se vuoto, generare automaticamente "Ricerca DD/MM/YYYY HH:mm"
- **Numero di Lead** (number input con slider): valore da 1 a 50.000. Default: 25. Mostrare warning visivo se > 10.000 ("La ricerca potrebbe richiedere diversi minuti")

**Sezione 2 — Targeting Persona**
- **Job Title — Includi** (tag input multi-valore): l'utente scrive e preme Enter per aggiungere. Es: "CMO", "Head of Marketing"
- **Job Title — Escludi** (tag input multi-valore): stessa UX
- **Livello Seniority** (multi-select con checkbox): Founder, Owner, C-Level, Director, VP, Head, Manager, Senior, Entry, Trainee
- **Livello Funzionale** (multi-select con checkbox): C-Level, Finance, Product, Engineering, Design, HR, IT, Legal, Marketing, Operations, Sales, Support

**Sezione 3 — Localizzazione**

Importante: mostrare un tooltip o nota informativa che spiega la logica Location vs City:
> "Usa 'Location' per filtrare per regione, paese o stato (es: United States, EMEA, California). Usa 'Città' per targeting specifico su una città. Non combinare Location e Città per lo stesso target — usa l'uno o l'altro."

- **Location — Includi** (tag input multi-valore)
- **Città — Includi** (tag input multi-valore)
- **Location — Escludi** (tag input multi-valore)
- **Città — Escludi** (tag input multi-valore)

**Sezione 4 — Qualità Email**
- **Stato Email** (multi-select con checkbox): Validated (pre-selezionato), Not Validated, Unknown
- Nota sotto il campo: "Seleziona solo 'Validated' per liste pronte all'outreach. Aggiungi 'Unknown' per aumentare il volume."

**Sezione 5 — Targeting Azienda**
- **Dominio Azienda** (tag input multi-valore): es: google.com, apple.com
- **Dimensione Azienda** (multi-select con checkbox): mostrare tutte le fasce (0-1, 2-10, 11-20, 21-50, 51-100, 101-200, 201-500, 501-1000, 1001-2000, 2001-5000, 10000+)
- **Industry — Includi** (tag input multi-valore)
- **Industry — Escludi** (tag input multi-valore)
- **Keywords — Includi** (tag input multi-valore): ricerca libera nel profilo aziendale
- **Keywords — Escludi** (tag input multi-valore)

**Sezione 6 — Dati Finanziari**
- **Revenue Minima** (dropdown): valori da 100K a 10B
- **Revenue Massima** (dropdown): stessi valori
- Validazione: min ≤ max. Mostrare errore inline se non rispettato.
- **Tipo di Funding** (multi-select con checkbox): Seed, Angel, Series A-F, Venture, Debt Financing, Convertible Note, Private Equity, Other

**Azioni del Form:**
- **Pulsante "Avvia Ricerca"**: valida il form (almeno un filtro deve essere compilato), invia il payload ad Apify tramite API route backend, crea record in Supabase, e redirect a pagina risultati con stato "in corso"
- **Pulsante "Reset Filtri"**: svuota tutti i campi
- **Pulsante "Salva come Template"**: salva la configurazione corrente dei filtri come template riutilizzabile (vedi sezione Templates)

---

### 4.4 Pagina — Risultati Ricerca

**Route:** `/search/[searchId]`

**Stato: In Corso**
- Progress indicator con animazione
- Mostrare: nome ricerca, filtri applicati (riepilogo compatto), tempo trascorso
- Polling automatico ogni 5 secondi per aggiornare lo stato
- Possibilità di tornare al dashboard senza interrompere la ricerca

**Stato: Completata**
- Header con riepilogo: nome ricerca, data, numero totale lead trovate, filtri applicati
- Tabella risultati con le seguenti colonne visibili di default:
  1. Nome completo (con link al profilo LinkedIn se disponibile)
  2. Job Title
  3. Email (con icona copia-in-clipboard al click)
  4. Telefono (con icona copia-in-clipboard, se disponibile)
  5. Azienda (con link al sito web aziendale)
  6. Industry
  7. Location (città, paese)
  8. Revenue aziendale
  9. Dimensione azienda

- **Colonne aggiuntive disponibili** (toggle per mostrarle/nasconderle):
  - Email personale
  - Seniority Level
  - Functional Level
  - Headline LinkedIn
  - Company LinkedIn
  - Company Funding
  - Company Founded Year
  - Company Description
  - Tech Stack
  - Keywords
  - Indirizzo completo azienda

**Funzionalità della Tabella:**
- **Ricerca/Filtro in tempo reale**: barra di ricerca per filtrare i risultati visualizzati (client-side) per nome, email, azienda, job title
- **Ordinamento**: click sull'header di ogni colonna per ordinare ASC/DESC
- **Paginazione**: 25 risultati per pagina, con navigazione pagine
- **Selezione righe**: checkbox per selezionare singole righe o "Seleziona tutto"
- **Contatore**: "Mostrando X di Y lead"

**Azioni di Esportazione:**
- **Esporta CSV**: esporta tutte le lead (o solo le selezionate) in formato CSV
- **Esporta Excel (.xlsx)**: stessa logica
- **Copia email**: copia tutte le email (o solo le selezionate) in clipboard, separate da virgola

**Stato: Fallita**
- Mostrare messaggio di errore esplicativo
- Suggerimenti: "Prova ad allargare i filtri", "Rimuovi filtri esclusivi", "Consenti email con stato 'Unknown'"
- Pulsante "Riprova" che riporta al form con i filtri precompilati

---

### 4.5 Pagina — Storico Ricerche

**Route:** `/searches`

**Funzionalità:**
- Lista completa di tutte le ricerche effettuate, ordinate per data (più recente prima)
- Per ogni ricerca mostrare: nome, data/ora, numero lead, stato (badge colorato: verde=completata, giallo=in corso, rosso=fallita), filtri principali usati (in modo compatto)
- Barra di ricerca per cercare tra le ricerche per nome
- Click su una ricerca porta alla pagina dei risultati `/search/[searchId]`
- Possibilità di eliminare una ricerca (con conferma)
- Possibilità di duplicare una ricerca (apre il form precompilato con gli stessi filtri)

---

### 4.6 Pagina — Templates

**Route:** `/templates`

**Funzionalità:**
- Lista dei template di filtri salvati dall'utente
- Per ogni template: nome, data creazione, riepilogo filtri
- Azioni: "Usa Template" (apre il form `/search/new` precompilato), "Modifica", "Elimina"
- Creare un template dalla pagina di ricerca (pulsante "Salva come Template")

---

### 4.7 Pagina — Impostazioni

**Route:** `/settings`

**Funzionalità:**
- **Profilo**: modifica nome, email
- **API Key Apify**: campo per inserire/aggiornare la propria API key Apify. Mostrare se è configurata (mascherata) o meno. Pulsante "Verifica" che fa un test call all'API per validare la key.
- **Cambio Password**
- **Elimina Account** (con doppia conferma)

---

## 5. Schema Database (Supabase)

### Tabella `profiles`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  apify_api_token TEXT, -- crittografato
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabella `searches`
```sql
CREATE TABLE searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL, -- payload completo dei filtri
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, succeeded, failed
  apify_run_id TEXT, -- ID del run Apify
  apify_dataset_id TEXT, -- ID del dataset Apify
  leads_count INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabella `leads`
```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id UUID REFERENCES searches(id) ON DELETE CASCADE,
  
  -- Persona
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  job_title TEXT,
  headline TEXT,
  functional_level TEXT,
  seniority_level TEXT,
  email TEXT,
  mobile_number TEXT,
  personal_email TEXT,
  linkedin TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  
  -- Azienda
  company_name TEXT,
  company_domain TEXT,
  company_website TEXT,
  company_linkedin TEXT,
  company_linkedin_uid TEXT,
  company_size TEXT,
  industry TEXT,
  company_description TEXT,
  company_annual_revenue TEXT,
  company_annual_revenue_clean NUMERIC,
  company_total_funding TEXT,
  company_total_funding_clean NUMERIC,
  company_founded_year INTEGER,
  company_phone TEXT,
  company_street_address TEXT,
  company_city TEXT,
  company_state TEXT,
  company_country TEXT,
  company_postal_code TEXT,
  company_full_address TEXT,
  company_market_cap TEXT,
  
  -- Contesto
  keywords TEXT[],
  company_technologies TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX idx_leads_search_id ON leads(search_id);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_company_name ON leads(company_name);
CREATE INDEX idx_searches_user_id ON searches(user_id);
CREATE INDEX idx_searches_status ON searches(status);
```

### Tabella `templates`
```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS)
Tutte le tabelle devono avere RLS abilitato. Ogni utente può vedere/modificare solo i propri dati:
```sql
ALTER TABLE searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own searches" ON searches
  FOR ALL USING (auth.uid() = user_id);

-- Ripetere per leads, templates, profiles
```

---

## 6. API Routes (Backend Next.js)

### `POST /api/search/start`
- Riceve i filtri dal form
- Valida i filtri (almeno un campo compilato)
- Crea record in `searches` con status "pending"
- Chiama Apify Run Actor API
- Aggiorna record con `apify_run_id` e status "running"
- Restituisce `searchId`

### `GET /api/search/[searchId]/status`
- Chiama Apify Get Run API
- Restituisce lo stato corrente del run
- Se `SUCCEEDED`: recupera i dati dal dataset, li salva in tabella `leads`, aggiorna `searches` con `leads_count` e `completed_at`
- Se `FAILED`: aggiorna `searches` con `error_message`

### `GET /api/search/[searchId]/leads`
- Parametri query: `page`, `limit`, `sort`, `order`, `q` (ricerca)
- Restituisce lead paginate dalla tabella `leads`

### `GET /api/search/[searchId]/export`
- Parametri query: `format` (csv | xlsx), `ids` (opzionale, array di lead id per esportazione selettiva)
- Genera e restituisce il file

### `POST /api/templates`
- Crea nuovo template

### `GET /api/templates`
- Lista template dell'utente

### `PUT /api/templates/[templateId]`
- Aggiorna template

### `DELETE /api/templates/[templateId]`
- Elimina template

### `POST /api/settings/verify-apify-key`
- Riceve la API key, fa un test call ad Apify (es: GET user info)
- Restituisce se valida o meno

---

## 7. Logica di Business e Regole

### 7.1 Regola Location vs City
Quando l'utente compila sia Location che City nella sezione "Includi", mostrare un warning:
> "⚠️ È consigliato usare Location OPPURE Città, non entrambi. Se vuoi targettizzare una città specifica, svuota il campo Location e usa solo Città."

Stesso avviso per la sezione "Escludi".

### 7.2 Gestione errori Apify
- Timeout: se il run non completa entro 30 minuti, marcarlo come "failed" con messaggio "Ricerca scaduta. Prova con meno lead o filtri più specifici."
- Errore API: salvare il messaggio di errore Apify nel campo `error_message`
- Rate limiting: implementare retry con exponential backoff (max 3 tentativi)

### 7.3 Deduplicazione
Quando i risultati vengono salvati, deduplicare per email (priorità 1), poi per linkedin URL (priorità 2), poi per combinazione full_name + company_domain (priorità 3).

### 7.4 Validazione Form
- Almeno un filtro deve essere compilato per avviare la ricerca
- `fetch_count` deve essere ≥ 1 e ≤ 50.000
- Se revenue min > revenue max, mostrare errore
- Job titles, locations, cities: ogni tag deve avere almeno 2 caratteri

---

## 8. Contenuti Testuali dell'Interfaccia

### 8.1 Testi Pagina Dashboard
- **Titolo:** "Dashboard"
- **Benvenuto:** "Ciao, {nome}. Ecco un riepilogo della tua attività."
- **Card Statistiche:** "Ricerche totali", "Lead estratte", "Ultima ricerca"
- **CTA:** "Nuova Ricerca"
- **Sezione recenti:** "Ricerche Recenti"

### 8.2 Testi Pagina Nuova Ricerca
- **Titolo:** "Nuova Ricerca"
- **Sottotitolo:** "Configura i filtri per trovare le lead più rilevanti per il tuo business."
- **Sezione 1:** "Configurazione Base"
- **Sezione 2:** "Targeting Persona"
- **Sezione 3:** "Localizzazione"
- **Sezione 4:** "Qualità Email"
- **Sezione 5:** "Targeting Azienda"
- **Sezione 6:** "Dati Finanziari"
- **CTA primario:** "Avvia Ricerca"
- **CTA secondario:** "Salva come Template"
- **CTA terziario:** "Reset Filtri"

### 8.3 Testi Pagina Risultati
- **In corso:** "Ricerca in corso... Stiamo recuperando le tue lead. Questo può richiedere da pochi secondi a diversi minuti a seconda del volume richiesto."
- **Completata:** "{N} lead trovate"
- **Fallita:** "La ricerca non ha prodotto risultati."
- **Esporta:** "Esporta CSV", "Esporta Excel", "Copia Email"
- **Suggerimento vuoto:** "Nessuna lead trovata. Prova ad allargare i filtri: rimuovi criteri di esclusione, aggiungi lo stato email 'Unknown', o amplia la zona geografica."

### 8.4 Testi Pagina Storico
- **Titolo:** "Le tue Ricerche"
- **Vuoto:** "Non hai ancora effettuato nessuna ricerca. Inizia ora!"

### 8.5 Testi Pagina Templates
- **Titolo:** "I tuoi Template"
- **Vuoto:** "Non hai ancora salvato nessun template. Salva una configurazione di filtri durante una ricerca per riutilizzarla in futuro."

### 8.6 Testi Pagina Impostazioni
- **Titolo:** "Impostazioni"
- **Sezioni:** "Profilo", "API Key Apify", "Sicurezza"
- **API Key info:** "Inserisci la tua API key Apify per collegare il servizio di lead generation. Puoi trovarla nella sezione Settings > Integrations del tuo account Apify."
- **Verifica:** "Verifica Connessione"
- **Key valida:** "✓ Connessione verificata"
- **Key non valida:** "✗ API key non valida. Controlla e riprova."

---

## 9. Navigazione

**Sidebar (persistente su tutte le pagine autenticate):**
1. **Dashboard** — icona: Home — route: `/dashboard`
2. **Nuova Ricerca** — icona: Search/Plus — route: `/search/new`
3. **Le tue Ricerche** — icona: List — route: `/searches`
4. **Templates** — icona: Layout/Bookmark — route: `/templates`
5. **Impostazioni** — icona: Settings/Gear — route: `/settings`

**Barra superiore:**
- Logo "Alphaleads" a sinistra
- Nome utente + avatar a destra con dropdown: "Impostazioni", "Logout"

---

## 10. Design System e Specifiche UI

> **Riferimento visivo:** Il file `alphaleads-ui-reference.jsx` è un componente React interattivo che mostra Dashboard, Form Ricerca e Risultati. Usarlo come riferimento pixel-level per layout, spaziature e stile dei componenti.

### 10.1 Palette Colori

Basata su [colorhunt.co/palette/2d4059ea5455f07b3fffd460](https://colorhunt.co/palette/2d4059ea5455f07b3fffd460).

**Colori Primari e loro varianti derivate:**

| Ruolo | Token | Hex | Uso |
|---|---|---|---|
| Navy 900 | `--navy-900` | `#1a2636` | Testi heading su sfondo chiaro, hover sidebar |
| **Navy 800** | `--navy-800` | `#2D4059` | **Colore primario brand.** Sfondo sidebar, testi heading principali |
| Navy 700 | `--navy-700` | `#3a5275` | Testi secondari su sfondo chiaro, bordi bottoni secondari |
| Navy 600 | `--navy-600` | `#4a6a91` | Testi link non-accent |
| Navy 100 | `--navy-100` | `#e8ecf1` | Background chip/tag, sfondo icone stat card |
| Navy 50 | `--navy-50` | `#f3f5f8` | Background hover leggero |
| | | | |
| Coral 700 | `--coral-700` | `#d43d3e` | Hover stato errore |
| **Coral 600** | `--coral-600` | `#EA5455` | **Errore/Distruttivo.** Badge "Fallita", messaggi errore, icone delete |
| Coral 500 | `--coral-500` | `#ee7273` | Bordi badge errore |
| Coral 100 | `--coral-100` | `#fde8e8` | Background badge errore |
| Coral 50 | `--coral-50` | `#fef5f5` | Background alert errore |
| | | | |
| **Orange 700** | `--orange-700` | `#d86a2f` | Hover bottoni primari |
| **Orange 600** | `--orange-600` | `#F07B3F` | **Accent primario / CTA.** Bottoni principali, link attivi sidebar, paginazione attiva |
| Orange 500 | `--orange-500` | `#f49565` | Bordi focus input |
| Orange 100 | `--orange-100` | `#fdeee4` | Background hover chip selezionato |
| Orange 50 | `--orange-50` | `#fef7f3` | Background chip/checkbox selezionato |
| | | | |
| Gold 700 | `--gold-700` | `#e6b82e` | Testi warning |
| **Gold 600** | `--gold-600` | `#FFD460` | **Warning/In corso.** Badge "In corso", highlight, alert informativi |
| Gold 500 | `--gold-500` | `#ffe08a` | Bordi warning |
| Gold 100 | `--gold-100` | `#fff8e0` | Background badge warning |
| Gold 50 | `--gold-50` | `#fffcf0` | Background alert informativo |

**Neutrali:**

| Token | Hex | Uso |
|---|---|---|
| `--neutral-900` | `#111827` | Testo body emphasis massimo |
| `--neutral-800` | `#1f2937` | Testo body primario |
| `--neutral-700` | `#374151` | Testo body secondario |
| `--neutral-600` | `#4b5563` | Label form, testo tabella |
| `--neutral-500` | `#6b7280` | Testo placeholder, caption, date |
| `--neutral-400` | `#9ca3af` | Icone disattivate, bordi leggeri |
| `--neutral-300` | `#d1d5db` | Bordi input, separatori |
| `--neutral-200` | `#e5e7eb` | Bordi card, bordi tabella |
| `--neutral-100` | `#f3f4f6` | Background righe alternate tabella, header tabella |
| `--neutral-50` | `#f9fafb` | Background pagina (main area) |
| `--white` | `#ffffff` | Background card, input, tabelle |

**Semantici (derivati dalla palette):**

| Stato | Background | Bordo | Testo |
|---|---|---|---|
| Successo | `#dcfce7` | `#bbf7d0` | `#166534` |
| Warning | `--gold-100` | `--gold-500` | `#92400e` |
| Errore | `--coral-100` | `--coral-500` | `--coral-700` |
| Info | `--navy-100` | `--navy-700` | `--navy-800` |

### 10.2 Tipografia

**Font family:** `'DM Sans', sans-serif` — importare da Google Fonts.  
Fallback: `system-ui, -apple-system, sans-serif`.

| Elemento | Peso | Dimensione | Colore | Letter-spacing |
|---|---|---|---|---|
| H1 (titolo pagina) | 700 | 26px | Navy 800 | -0.02em |
| H2 (titolo sezione card) | 600 | 16px | Navy 800 | 0 |
| H3 (titolo sezione form) | 700 | 15px | Navy 800 | 0 |
| Body | 400 | 14px | Neutral 700 | 0 |
| Sottotitolo pagina | 400 | 14px | Neutral 500 | 0 |
| Label form | 600 | 13px | Neutral 600 | 0 |
| Testo tabella | 400 | 13px | Neutral 600 | 0 |
| Nome tabella (bold) | 600 | 13px | Navy 800 | 0 |
| Email tabella | 400 (mono) | 12px | Neutral 700 | 0 |
| Header tabella | 700 | 11px (uppercase) | Neutral 500 | 0.06em |
| Caption/nota | 400 | 12px | Neutral 500 | 0 |
| Badge | 600 | 12px | Varia per stato | 0.02em |

### 10.3 Spaziature e Layout

**Layout generale:**
- Sidebar: larghezza fissa `260px`, sfondo Navy 800, posizione sticky full-height
- Main area: `flex: 1`, sfondo Neutral 50, overflow auto
- Padding main area: `32px 40px`
- Max-width contenuto form: `900px`
- Max-width contenuto dashboard: `1200px`

**Border radius standard:**
- Card/Sezioni: `12px`
- Bottoni: `10px`
- Input: `8px`
- Tag/Chip: `6px`
- Badge: `9999px` (pill)
- Avatar: `50%` (cerchio)
- Icone stat: `10px`

**Ombre:**
- Card: `0 1px 3px rgba(0,0,0,0.04)`
- Bottone CTA: `0 2px 12px {colore}40` (colore del bottone con 25% opacità)
- Nav switcher/dropdown: `0 8px 32px rgba(0,0,0,0.25)`

**Spaziature interne card:**
- Padding card: `24px`
- Gap tra sezioni form: `20px`
- Gap tra campi dentro una sezione: `16px`
- Gap tra label e input: `6px`

### 10.4 Componenti UI

#### Sidebar
- Background: Navy 800 full-height
- Logo: icona quadrata `34x34px` con border-radius `8px`, gradient `orange-600 → gold-600`, lettera "α" bianca bold 16px. Testo "Alphaleads" bianco 18px bold
- Separatore sotto logo: `1px solid rgba(255,255,255,0.08)`, margin-bottom `24px`
- Voci menu: padding `10px 16px`, border-radius `8px`, icona 18px + label 14px
  - **Attiva:** background `rgba(240,123,63,0.15)`, colore Orange 600, font-weight 600, dot arancione 6px a destra
  - **Inattiva:** colore `rgba(255,255,255,0.65)`, font-weight 400
  - **Hover:** background `rgba(255,255,255,0.05)`
- Impostazioni: separato in basso con bordo top `rgba(255,255,255,0.08)`
- User card in fondo: background `rgba(255,255,255,0.05)`, border-radius `10px`, padding `14px 16px`. Avatar circolare `32px` con gradient orange→gold, iniziale bianca bold. Nome bianco 13px bold, sottotitolo `rgba(255,255,255,0.4)` 11px

#### Stat Card (Dashboard)
- Background bianco, border `1px solid neutral-200`, border-radius `12px`, padding `20px 24px`
- Icona: quadrato `40x40px` border-radius `10px`, background Navy 100, emoji centrata 18px
- Valore: `28px`, font-weight 700, Navy 800, letter-spacing `-0.02em`
- Label: `13px`, Neutral 500
- Trend (opzionale): `12px`, font-weight 600, colore `#16a34a` (verde)

#### Bottone Primario (CTA)
- Background: `linear-gradient(135deg, orange-600, orange-700)`
- Colore testo: bianco
- Padding: `11px 24px` (grande) / `9px 16px` (piccolo)
- Border-radius: `10px` (grande) / `8px` (piccolo)
- Font-weight: 600, font-size: 14px/13px
- Box-shadow: `0 2px 12px {orange-600}40`
- Hover: leggero brightness up + shadow più intenso

#### Bottone Secondario
- Background: trasparente
- Border: `1.5px solid navy-700`
- Colore testo: Navy 800
- Stesse dimensioni del primario

#### Bottone Ghost
- Background: trasparente
- Border: `1.5px solid neutral-300`
- Colore testo: Neutral 600

#### Tag Input (multi-valore)
- Container: border `1px solid neutral-300`, border-radius `8px`, padding `8px 12px`, background white, min-height `42px`, flex-wrap
- Tag singolo: background Navy 100, border-radius `6px`, padding `3px 10px`, font-size `13px`, font-weight 500, colore Navy 800
- Pulsante rimuovi tag: "×" in Neutral 400, font-size `14px`
- Placeholder: Neutral 400, font-size `13px`
- Focus: border `1.5px solid orange-500`

#### Checkbox Group (selezione multipla chip-style)
- Ogni opzione è un chip: padding `6px 14px`, border-radius `8px`, font-size `13px`, font-weight 500
  - **Non selezionato:** border `1.5px solid neutral-300`, background white, colore Neutral 600
  - **Selezionato:** border `1.5px solid orange-600`, background Orange 50, colore Orange 700
- Layout: flex-wrap con gap `8px`

#### Badge Stato
- Pill shape (border-radius `9999px`), padding `2px 10px`, font-size `12px`, font-weight 600
  - **Completata:** background `#dcfce7`, colore `#166534`, border `1px solid #bbf7d0`
  - **In corso:** background Gold 100, colore `#92400e`, border `1px solid gold-500`
  - **Fallita:** background Coral 100, colore Coral 700, border `1px solid coral-500`

#### Tabella Dati
- Container: background white, border-radius `12px`, border `1px solid neutral-200`, box-shadow card standard, overflow hidden
- Header: background Neutral 50, padding `10px 16px`, font-size `11px`, font-weight 700, uppercase, letter-spacing `0.06em`, colore Neutral 500, border-bottom `1px solid neutral-200`
- Riga: padding `12px 16px`, border-bottom `1px solid neutral-100`
- Riga hover: background Neutral 50
- Checkbox: accent-color Orange 600
- Paginazione: centrata, bottoni `padding 7px 12px`, border-radius `6px`, border `1px solid neutral-200`. Pagina attiva: background Orange 600, colore bianco, nessun border

#### Alert Informativo (es: Location vs City)
- Background: Gold 50
- Border: `1px solid gold-500`
- Border-radius: `8px`
- Padding: `10px 14px`
- Font-size: `13px`, colore `#92400e`, line-height 1.5
- Emoji "💡" come prefisso

#### Input Text / Number / Select
- Padding: `10px 14px`
- Border-radius: `8px`
- Border: `1px solid neutral-300`
- Font-size: `14px`
- Focus: border `1.5px solid orange-500`, outline none
- Width: `100%` con `box-sizing: border-box`

### 10.5 Struttura Sezioni Form

Ogni sezione del form ricerca è una card bianca con:
- Numero sezione: quadrato `24x24px`, border-radius `6px`, background Navy 100, font-size `12px`, centrato
- Titolo sezione: inline con il numero, font-size `15px`, font-weight 700, Navy 800
- Gap interno tra campi: `16px`
- Gap tra sezioni: `20px`

Ordine sezioni:
1. Configurazione Base (grid 2 colonne: nome 2fr + numero lead 1fr)
2. Targeting Persona (stack verticale: job title includi/escludi + seniority + funzionale)
3. Localizzazione (alert info + grid 2×2: location/città includi, location/città escludi)
4. Qualità Email (checkbox group + nota sotto)
5. Targeting Azienda (industry includi + dimensione azienda come chip)
6. Dati Finanziari (grid 2 colonne: revenue min/max come dropdown + funding come chip)

Barra azioni form: allineata a destra, gap `12px`:
- "Reset Filtri" (ghost)
- "📌 Salva come Template" (secondario)
- "🔍 Avvia Ricerca" (primario con gradient)

### 10.6 Layout Pagina Risultati

**Header:** flex space-between
- Sinistra: titolo ricerca (H1) + sottotitolo "data · N lead trovate"
- Destra: 3 bottoni esportazione ("📧 Copia Email" ghost, "📊 Esporta Excel" ghost, "📥 Esporta CSV" primario)

**Chip filtri applicati:** flex-wrap, gap `8px`, sotto l'header
- Ogni chip: background Navy 100, colore Navy 700, border-radius `6px`, padding `4px 12px`, font-size `12px`, font-weight 500

**Barra ricerca + contatore:** flex, input flex-1 + testo "Mostrando X di Y lead" a destra

**Tabella:** componente tabella standard (descritto sopra)

**Paginazione:** centrata sotto la tabella, margin-top `20px`

### 10.7 Icone

Usare **Lucide React** (`lucide-react`) come libreria icone. Mappatura:
- Dashboard: `Home`
- Nuova Ricerca: `Search` o `Plus`
- Le tue Ricerche: `List`
- Templates: `Bookmark`
- Impostazioni: `Settings`
- Esporta CSV: `Download`
- Esporta Excel: `FileSpreadsheet`
- Copia Email: `Mail` o `Copy`
- Elimina: `Trash2`
- Modifica: `Pencil`
- Freccia destra (riga tabella): `ChevronRight`
- Chiudi/Rimuovi tag: `X`
- Warning: `AlertTriangle`
- Successo: `CheckCircle`
- Errore: `XCircle`
- In corso: `Loader2` (con animazione spin)

### 10.8 Animazioni e Transizioni

- **Transizione hover generica:** `transition: all 0.2s ease`
- **Hover bottoni:** leggero shift luminosità (filter brightness 1.05)
- **Hover righe tabella:** background Neutral 50
- **Spinner ricerca in corso:** icona `Loader2` con `animation: spin 1s linear infinite`
- **Apparizione sezioni form:** nessuna animazione (caricamento statico, l'app deve essere snappy)
- **Toast/notifiche:** slide-in da destra, duration 3 secondi, auto-dismiss

### 10.9 Responsive Breakpoints

| Breakpoint | Comportamento |
|---|---|
| `≥ 1024px` | Layout completo: sidebar fissa 260px + main area |
| `768px — 1023px` | Sidebar collassata a icone (60px), tooltip al hover |
| `< 768px` | Sidebar nascosta, hamburger menu in top bar. Tabella risultati scroll orizzontale |

---

## 12. Requisiti Non-Funzionali

- **Performance:** il caricamento delle pagine deve essere < 2 secondi. La tabella risultati deve gestire fino a 50.000 righe con paginazione server-side.
- **Sicurezza:** API key Apify crittografata in database. Tutti gli endpoint API protetti da autenticazione. RLS su tutte le tabelle Supabase.
- **Responsive:** l'app deve essere utilizzabile su desktop e tablet. Mobile è secondario ma il layout non deve rompersi.
- **Lingua interfaccia:** Italiano per tutti i testi dell'interfaccia.

---

## 13. Note per l'Implementazione

- **Riferimento visivo:** il file `alphaleads-ui-reference.jsx` è un componente React interattivo che mostra le 3 viste principali (Dashboard, Form Ricerca, Risultati). Usarlo come reference per layout, spaziature, colori e stile dei componenti. Il file è navigabile con i bottoni in basso.
- **Design System:** tutte le specifiche colori, tipografia, spaziature, componenti sono documentate nella Sezione 10 di questo PRD. Implementare i colori come CSS custom properties (variabili CSS) nel file globals.css per coerenza.
- **Font:** importare `DM Sans` (pesi 400, 500, 600, 700) da Google Fonts nel layout root.
- **Icone:** usare `lucide-react` come libreria icone. Mappatura completa nella Sezione 10.7.
- Per i tag input multi-valore, implementare un componente dove l'utente scrive nel campo e preme Enter o virgola per aggiungere un tag. Ogni tag ha una "X" per rimuoverlo.
- Per i multi-select a chip (seniority, funzionale, dimensione, funding), NON usare un dropdown tradizionale. Usare chip cliccabili inline come mostrato nel reference (toggle on/off al click).
- L'esportazione CSV/XLSX deve avvenire lato server per gestire dataset grandi.
- Il polling dello stato della ricerca deve usare un meccanismo client-side (setInterval o polling con React Query/SWR) che si ferma automaticamente quando lo stato diventa `SUCCEEDED` o `FAILED`.
- Il gradient dei bottoni CTA è `linear-gradient(135deg, orange-600, orange-700)` — non usare colore piatto.

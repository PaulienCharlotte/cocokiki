# Supabase analytics: installatie

Analytics staat standaard uit, ook als URL en sleutel zijn ingevuld. Er zijn
geen nieuwe npm-dependencies. De browser gebruikt fetch naar een Edge Function;
alleen de functie mag de database-RPC aanroepen.

## 1. Project en tabel

Maak een Supabase-project in een passende EU-regio. Voer
`supabase/migrations/202610310001_activity_events.sql` uit in de SQL Editor,
of gebruik `supabase db push` na koppeling van de CLI aan het juiste project.
De migratie maakt precies een tabel, een index en een beveiligde ingestiefunctie.
Er zijn geen SELECT/INSERT/UPDATE/DELETE-rechten of RLS-policies voor bezoekers.
Ook de RPC is niet beschikbaar voor anon/authenticated; alleen service_role.

## 2. Edge Function

Deploy vanuit deze repository met `supabase functions deploy analytics`.
`supabase/config.toml` schakelt JWT-verificatie voor deze ene functie uit omdat
er geen accounts zijn. De handler controleert zelf de publishable key, origin,
HTTP-methode, inhoudstype, maximaal 512 bytes en een exacte event-allowlist.
Een publishable key is openbaar, dus dit bewijst geen menselijke bezoeker.

Stel via Supabase Function Secrets in:

| Secret | Waarde |
| --- | --- |
| ANALYTICS_PUBLISHABLE_KEY | De `sb_publishable_...` sleutel van dit project |
| ANALYTICS_ALLOWED_ORIGINS | `https://cocokiki.nl,https://www.cocokiki.nl` (alleen werkelijk gebruikte origins) |
| ANALYTICS_ENABLED | Eerst `false` |
| ANALYTICS_PRIVACY_APPROVED | Eerst `false` |

`SUPABASE_URL` en `SUPABASE_SERVICE_ROLE_KEY` zijn ingebouwde servervariabelen.
Zet die geheime sleutel NOOIT in een VITE-variabele, browsercode of Git.
Voor lokale tests mag een exacte localhost-origin expliciet aan de serverlijst.
De handler logt geen requests, IP-adressen of payloads. Supabase/hosting kan wel
infrastructuurlogs met netwerkmetadata bijhouden: controleer dat beleid en de
bewaartermijnen voordat je activeert. Geen IP komt in activity_events.

## 3. Frontend en privacybesluit

Gebruik `.env.example` als referentie voor `.env.local` of Netlify-variabelen:

```dotenv
VITE_SUPABASE_URL=https://JOUW_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_JOUW_PUBLIC_KEY
VITE_ANALYTICS_ENABLED=false
VITE_ANALYTICS_PRIVACY_APPROVED=false
```

Laat beide vlaggen aan beide kanten uit totdat grondslag, ouderinformatie,
verwerkersafspraken en bewaartermijn zijn vastgesteld. De privacyvlag is een
technische vrijgave, GEEN toestemming en GEEN juridische beoordeling.
Als individuele toestemming vereist is, volstaat deze release niet: laat
analytics uit tot een aparte toestemmingsflow is vastgesteld en gebouwd.
Daarna beide servervlaggen en beide frontendvlaggen op `true` zetten en Netlify
opnieuw bouwen. Uitschakelen kan onmiddellijk via de servervlag.

## Wat wordt gemeten?

Alleen id (willekeurige event-UUID), event_type, activity_id en server-created_at.
Geen antwoorden, scores, namen, e-mail, URLs, IP, user-agent of bezoekers-ID.
Session_started telt tabsessies, geen unieke kinderen of terugkerende spelers.
SessionStorage bewaart tijdelijk een sessiereceipt, actieve runs en maximaal
100 nog te verzenden events. De tabgegevens verlopen na 30 minuten inactiviteit
bij de volgende toegang en verdwijnen normaal bij sluiten van de tab. Geen
localStorage, cookie, fingerprint of data-uitwisseling tussen tabs.
Browserfuncties zoals 'tab dupliceren/herstellen' kunnen tabopslag kopieren.

Start betekent: een speelronde verschijnt, of de expliciete startknop wordt
gebruikt (winkel/Lua/wereldtijden). Completion betekent het bestaande
eindmoment, ook bij een verloren race; niet noodzakelijk een perfect resultaat.
Koken meet de bereidingssessie, niet elk ingrediënt of het volledige leerpad.
De kliniek meet een consult. Winkelaankopen, dagquiz en onderliggende kook-
minigames worden niet apart gemeten in deze eerste versie.
Activiteit-IDs staan in shared/analyticsEvents.ts en dezelfde SQL-constraint.
Nieuwe activiteiten moeten in beide lijsten expliciet worden toegelaten.

Ontdubbeling: tabreceipts voorkomen dubbele effecten/herladen van actieve runs;
een expliciete replay krijgt nieuwe events. De primaire event-ID maakt retries
ook na een verloren HTTP-response idempotent. Geen gegarandeerde aflevering:
bij storing blijft een kleine wachtrij over voor het volgende event/herladen;
sluiten, verlopen van de sessie of volle queue kan metingen verliezen. Geen
achtergrondpolling en geen spel blokkeren. Activiteitrijen zijn bewust niet
tot individuele spelers/funnels te koppelen.

## Rate limiting en kosten

De database serialiseert ingestie met een transactionele advisory lock en laat
maximaal 120 nieuwe events per schuivende minuut toe, gezamenlijk voor de site.
Duplicaten gebruiken dat budget niet opnieuw. Geen IP-rate-limittabel of
permanente bezoeker nodig. Dit begrenst writes, NIET alle Edge-aanroepen/kosten.
Origin/key zijn geen botbeveiliging; een aanvaller kan het gezamenlijke budget
opmaken. Voeg bij misbruik platform-level volumebescherming toe. Deze limiet
is geschikt voor de eerste kleine pilot, niet voor onbeperkte commerciele groei.

Voorbereide ruwe bewaartermijn: 30 dagen, vast te stellen voor activatie.
Voer daarna als postgres ook de migratie
`supabase/migrations/202610310002_activity_events_retention.sql` uit. Die plant
dagelijkse verwijdering via Supabase Cron, alleen voor beheerders uitvoerbaar.
Bij normaal functioneren is de maximale ouderdom daardoor minder dan 31 dagen.
Controleer taakstatus en achterstallige events met
`supabase/queries/check_activity_events_retention.sql`.
De migratie is alleen voorbereid, niet op het project uitgevoerd.
Zie `docs/privacy-activation-checklist.md` voor de overige open voorwaarden.

## Starts en afrondingen per dag (Nederlandse tijd)

Voer uitsluitend als beheerder uit in de SQL Editor:

```sql
select
  (created_at at time zone 'Europe/Amsterdam')::date as dag,
  activity_id,
  count(*) filter (where event_type = 'activity_started') as starts,
  count(*) filter (where event_type = 'activity_completed') as afgerond
from public.activity_events
where event_type in ('activity_started', 'activity_completed')
group by 1, 2
order by 1 desc, 2;
```

Een afronding kan op een andere dag dan de start vallen. Deze dagtotalen zijn
geen cohort-voltooiingspercentage. Sessies tellen kan apart met
`where event_type = 'session_started'`.

## Controle voor livegang

- Draai tests, typecheck en build. Bestaande spelopslag mag niet veranderen.
- Controleer in een testproject dat anonieme SELECT/INSERT en RPC geweigerd zijn.
- Verstuur hetzelfde event tweemaal: precies een rij. Verander payload bij
  dezelfde ID: geen tweede rij. Verstuur onbekende activiteit/extra veld: 400.
- Test 121 unieke events binnen een minuut: maximaal 120 writes, daarna 429.
- Controleer originfilter, server-uitvlag en onbereikbare server tijdens spelen.
- Bevestig bewaarbeleid/hostinglogs en privacyvoorwaarden voordat je activeert.

Referenties: https://supabase.com/docs/guides/functions/auth en
https://supabase.com/docs/guides/database/functions.

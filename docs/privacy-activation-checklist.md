# Privacyvoorbereiding: open punten voor de beheerder

Status: concept, 31 oktober 2026. Geen analyticsactivatie of deployment uitgevoerd.
De nieuwe pagina is `/privacy`; TODO's staan ook zichtbaar in die pagina.

## Vijf stappen voor vrijgave

1. **Verantwoordelijke en grondslag.** Vul naam, adres en privacycontact in op
   de pagina. Leg per doel (lokaal spel, levering/beveiliging, statistieken) de
   AVG-grondslag vast. Als gerechtvaardigd belang wordt gekozen, documenteer
   doel, noodzaak, alternatieven en belangen van kinderen. Beoordeel of een
   DPIA nodig is. Dit voorstel kiest de grondslag niet namens jou.
2. **Leveranciers en logging.** Bevestig Netlify- en Supabase-logvelden,
   IP-verwerking, toegang, bewaartermijn en back-ups. Controleer Esri/ArcGIS
   (kaarttegels) en unpkg (Leaflet-stylesheet), inclusief doeleinden en hun
   privacyvoorwaarden. Bevestig rollen, verwerkersafspraken waar vereist,
   Supabase-regio, subverwerkers en eventuele doorgiften buiten de EER. Dit
   is niet aangetoond door alleen een EU-databaseregio te kiezen. Een CDN
   ontvangt ook bij alleen een stylesheet een netwerkverzoek. Voor oudere,
   niet aangesloten media-/Gemini-code is geen actieve gegevensstroom
   vastgesteld; controleer opnieuw als die ooit toegankelijk wordt gemaakt.
3. **Informatie en toestemming.** Rond de TODO's van de privacypagina af en
   controleer de tekst voor ouders en kinderen. Beoordeel of de uitzondering
   voor beperkte privacyarme analytics van toepassing is. SessionStorage is
   niet automatisch vrijgesteld. Als toestemming nodig is: laat analytics
   uit tot een geldige, herroepbare toestemmingsflow bestaat, met waar nodig
   wettelijke vertegenwoordiging voor kinderen onder 16. Een featureflag is
   geen toestemming. Er is bewust geen banner toegevoegd.
4. **Bewaartermijn en beheer.** Voer na de eerste migratie als `postgres` de
   migratie `supabase/migrations/202610310002_activity_events_retention.sql`
   uit. Doe dit pas nadat de termijn is vastgesteld. De taak verwijdert dagelijks
   events ouder dan 30 dagen en eigen cronhistorie ouder dan 30 dagen. Geef
   alleen noodzakelijke personen toegang; stel MFA in voor Supabase, Netlify
   en GitHub. Leg vast wie verzoeken en incidenten behandelt. Controleer de
   taak wekelijks met `supabase/queries/check_activity_events_retention.sql`.
5. **Test en pas daarna apart besluiten.** Voer de SQL-integratietest uit in
   een wegwerp-testproject: `supabase/tests/activity_events_retention.sql`.
   Test daarna ingestie met synthetische events, duplicaten, weigering van
   onbevoegde toegang en storingen. Websitepublicatie en het omschakelen van
   analyticsvlaggen vereisen een afzonderlijke, expliciete vrijgave. Die zijn
   niet onderdeel van deze voorbereidingsstap.

## Controle van de verwijdertaak

Supabase Cron gebruikt `pg_cron`. De functie staat in `analytics_private`,
niet in het openbare API-schema, gebruikt geen SECURITY DEFINER en is alleen
uitvoerbaar door postgres. Er worden geen bestaande RLS-policies aangepast,
geen bezoekersrechten toegevoegd en geen geheimen of netwerkaanroepen gebruikt.
De stabiele taaknaam voorkomt een tweede taak bij bewust opnieuw uitvoeren.
De migratie zelf verwijdert nog geen events; de ingeplande uitvoering doet dat.

De planning is dagelijks 03:10 in `cron.timezone` (standaard GMT/UTC op Supabase).
Bij een gezonde taak verdwijnen events ouder dan 30 dagen binnen maximaal een
dag. Er is geen garantie op seconde-nauwkeurige verwijdering. Bij pauzering van
het project of een fout blijven gegevens langer staan: controleer daarom
`cron.job_run_details`, de actieve planning en het aantal events ouder dan
31 dagen. `return_message` toont taakstatus, niet noodzakelijk het aantal
verwijderde events. De cleanupfunctie retourneert dat aantal bij een directe
beheerdersaanroep; de verificatiequery zelf is uitsluitend lezend.

De verwijdertaak raakt geen spelvoortgang, localStorage of inventaris. Zij
regelt ook niet de bewaartermijn van back-ups of logs bij Netlify/Supabase.
Die moeten afzonderlijk worden vastgesteld; beloof geen onmiddellijke
verwijdering uit alle back-ups.

Bronnen voor de beoordeling (geraadpleegd op 31 oktober 2026):
- https://www.acm.nl/nl/verkoop-aan-consumenten/reclame-en-verleiden/online-beinvloeden/cookies-plaatsen
- https://autoriteitpersoonsgegevens.nl/nl/onderwerpen/avg-europese-privacywetgeving/mag-u-persoonsgegevens-verwerken
- https://autoriteitpersoonsgegevens.nl/themas/basis-avg/avg-algemeen/grondslag-toestemming
- https://supabase.com/docs/guides/cron/quickstart

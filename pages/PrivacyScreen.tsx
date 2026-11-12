import React from 'react';
import { supabaseAnalyticsConfig } from '../services/supabase';
import '../components/platform/privacy.css';

export default function PrivacyScreen() {
  const configured = supabaseAnalyticsConfig(import.meta.env ?? {}) !== null;
  return <main className="privacy-page" aria-labelledby="privacy-title"><article>
    <h1 id="privacy-title">Privacy bij CocoKiki</h1>
    <p>Laatst bijgewerkt: 31 oktober 2026.</p>
    <p className="privacy-page__notice"><strong>Concept met open punten.</strong> De TODO-markeringen hieronder moeten door de beheerder worden afgerond voordat gebruiksstatistieken worden ingeschakeld. Dit document is geen bevestiging dat alle juridische voorwaarden al zijn vervuld.</p>
    <section className="privacy-page__children" aria-labelledby="privacy-children">
      <h2 id="privacy-children">Voor kinderen</h2>
      <p>Je hoeft geen naam of e-mailadres in te vullen om te spelen. Dit apparaat onthoudt bijvoorbeeld je munten, je spullen en wat je hebt gespeeld. Gebruik voor een plant liever een verzonnen naam, niet je echte naam.</p>
      <p>Als we statistieken aanzetten, tellen we wanneer een spel begint en klaar is. Je naam en antwoorden gaan niet mee. Een volwassene kan je helpen als je vragen hebt of opgeslagen spelgegevens wilt wissen. Wissen betekent dat je voortgang op dit apparaat verloren kan gaan.</p>
    </section>
    <section aria-labelledby="privacy-controller">
      <h2 id="privacy-controller">Wie beheert CocoKiki?</h2>
      <p>TODO: [naam verantwoordelijke persoon of onderneming], [vestigingsadres], [privacycontact/e-mailadres] en [eventueel KvK-nummer] invullen. Deze beheerder is verantwoordelijk voor de verwerking van persoonsgegevens door CocoKiki.</p>
    </section>
    <section aria-labelledby="privacy-local">
      <h2 id="privacy-local">Wat wordt op je apparaat bewaard?</h2>
      <p>CocoKiki gebruikt lokale browseropslag (localStorage) voor spelvoortgang, munten en beloningsbewijzen, inventaris, kamerinrichting, recepten en boodschappenmandjes. Ook oefen- en toetsgegevens, plantennamen en verzorging, je gekozen avatar en sommige spel- en weergavevoorkeuren worden lokaal bewaard.</p>
      <p>Het doel is dat je kunt verder spelen en je instellingen en spullen behouden blijven. Deze lokale spelgegevens worden niet met de beperkte analytics meegestuurd. Er is in deze versie geen ouderaccount of centrale synchronisatie van je spelvoortgang.</p>
      <p>De lokale opslag heeft meestal geen automatische einddatum. Ze blijft aanwezig totdat je de sitegegevens wist of je browser ze verwijdert. Bij een gedeeld apparaat kunnen anderen met hetzelfde browserprofiel de voortgang zien. Via de browserinstellingen kun je de sitegegevens van CocoKiki verwijderen; daarmee kunnen ook munten en voortgang verdwijnen.</p>
    </section>
    <section aria-labelledby="privacy-statistics">
      <h2 id="privacy-statistics">Beperkte gebruiksstatistieken</h2>
      <p><strong>{configured ? 'Deze websiteversie is ingesteld om beperkte statistieken te versturen; de server kan ontvangst afzonderlijk uitschakelen.' : 'Gebruiksstatistieken zijn in deze websiteversie uitgeschakeld.'}</strong></p>
      <p>Na afzonderlijke vrijgave kan CocoKiki via Supabase uitsluitend de volgende gebeurtenissen opslaan: een tabsessie begint, een activiteit begint en een activiteit is afgerond. Elke rij bevat alleen een willekeurig gebeurtenisnummer, het gebeurtenistype, eventueel de activiteitcode en het tijdstip van ontvangst.</p>
      <p>Het doel is te zien welke activiteiten worden gebruikt en hoeveel spellen worden gestart en afgerond. Namen, e-mailadressen, antwoorden, scores, exacte locaties en IP-adressen staan niet in deze eventtabel. Er is geen permanente bezoekers-ID, fingerprinting of trackingcookie in deze analyticsimplementatie. We kunnen hiermee geen unieke kinderen of terugkerende spelers betrouwbaar tellen.</p>
      <p>Voor het voorkomen van dubbeltellingen gebruikt analytics alleen sessionStorage: tijdelijke tabgegevens en maximaal 100 nog te versturen gebeurtenissen. Na 30 minuten zonder nieuwe analyticsactiviteit wordt deze toestand bij de volgende toegang vervangen. De browser verwijdert tabopslag normaal bij sluiten van de tab, maar kan deze bij tabherstel bewaren. Dit is geen garantie op verwijdering precies na 30 minuten.</p>
      <p><strong>Voorbereide bewaartermijn:</strong> events worden na 30 dagen bij de eerstvolgende dagelijkse opruimtaak verwijderd. Bij normaal functioneren blijven ze daardoor minder dan 31 dagen in de actieve tabel. TODO: beheerder moet de verwijdermigratie uitvoeren en de werking controleren voordat analytics wordt geactiveerd. Termijnen voor eventuele back-ups en infrastructuurlogs moeten nog worden bevestigd.</p>
    </section>
    <section aria-labelledby="privacy-services">
      <h2 id="privacy-services">Externe diensten en netwerkgegevens</h2>
      <ul>
        <li><strong>Netlify</strong> levert de website aan je browser.</li>
        <li><strong>unpkg</strong> levert een stylesheet voor de kaartbibliotheek Leaflet.</li>
        <li><strong>Esri/ArcGIS</strong> levert kaartafbeeldingen bij gebruik van de interactieve kaarten. Een aangevraagd kaartgebied is niet hetzelfde als de exacte locatie van de speler.</li>
        <li><strong>Supabase</strong> is ingericht voor de serverfunctie en de beperkte eventtabel zodra analytics wordt vrijgegeven.</li>
      </ul>
      <p>Bij een verzoek ontvangen netwerkdiensten technisch onder meer je IP-adres. Dat staat los van de velden in onze analyticsdatabase. Providers kunnen technische logs verwerken. De analyticsfunctie schrijft zelf geen verzoekinhoud of IP-adres naar een applicatielog en stuurt geen referrer mee bij het analyticsverzoek.</p>
      <p>TODO: bevestig per dienst de rollen en afspraken, noodzakelijke loggegevens, log- en back-uptermijnen, projectregio, subverwerkers en eventuele verwerking buiten de EER met passende waarborgen. De feitelijke instellingen en afspraken zijn nog niet volledig gecontroleerd.</p>
    </section>
    <section aria-labelledby="privacy-grounds">
      <h2 id="privacy-grounds">Doelen, AVG-grondslagen en toestemming</h2>
      <p>We onderscheiden het bewaren van je spel en voorkeuren, de technische levering en beveiliging van de website en beperkte statistieken om de spelomgeving te verbeteren.</p>
      <p><strong>TODO: stel per doel de toepasselijke AVG-grondslag vast voor zover persoonsgegevens worden verwerkt.</strong> Een gerechtvaardigd belang kan een mogelijke grondslag zijn, maar vereist een onderbouwde toets van doel, noodzaak en belangen van gebruikers, in het bijzonder kinderen. Die toets is nog niet afgerond. We nemen niet zonder meer aan dat een overeenkomst of toestemming bestaat.</p>
      <p>De onderzochte applicatiecode plaatst geen trackingcookies. Dat betekent niet automatisch dat voor iedere vorm van browseropslag of statistiek geen toestemming nodig is. Beperkte, weinig privacygevoelige analytics kan onder een uitzondering vallen. TODO: bevestig of die uitzondering hier geldt, mede gelet op providers en logging.</p>
      <p>Als toestemming nodig blijkt, moet die eerst geldig worden geregeld. Bij verwerking op basis van toestemming voor kinderen onder 16 is in Nederland toestemming van een wettelijke vertegenwoordiger nodig. Er is nu geen toestemmingsbanner of ouderlijke toestemmingsflow. Een interne activatievlag is geen toestemming van een gebruiker.</p>
    </section>
    <section aria-labelledby="privacy-rights">
      <h2 id="privacy-rights">Rechten van ouders en gebruikers</h2>
      <p>Voor zover CocoKiki persoonsgegevens verwerkt, kun je afhankelijk van de grondslag en omstandigheden vragen om inzage, correctie, verwijdering, beperking of overdracht van gegevens, en bezwaar maken. Als verwerking op toestemming berust, kun je die toestemming weer intrekken. Ouders of wettelijke vertegenwoordigers kunnen waar toepasselijk namens hun kind handelen.</p>
      <p>TODO: vul hierboven een bereikbaar privacycontact in en leg de behandeling van verzoeken vast. Lokale spelgegevens staan op je apparaat; de beheerder heeft daar geen centrale kopie van. De beperkte eventtabel bevat geen gebruikersprofiel waarmee we gebeurtenissen vanzelf aan jou kunnen koppelen. We vragen niet standaard om extra identificatie alleen om beperkte statistieken te herleiden.</p>
      <p>Je kunt ook een klacht indienen bij de <a href="https://autoriteitpersoonsgegevens.nl/" rel="noreferrer">Autoriteit Persoonsgegevens</a>.</p>
    </section>
  </article></main>;
}

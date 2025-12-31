# Laposta RSS feed

Simpel script om laposta rss feed te maken voor bijvoorbeeld Wordpress.

Voorbeeld: [https://fietsm.arend-jan.com/rss](https://fietsm.arend-jan.com/rss)

## Config:
- kopieer config_example.json to config.json
- Pas config aan (keys met // zijn commentaar):
    - apiKey vanuit de laposta API pagina: [https://app.laposta.nl/config/c.connect/s.api/](https://app.laposta.nl/config/c.connect/s.api/)
    - public_lists: lijst van ids van de relatie lijsten die je publiekelijk wilt tonen. [https://app.laposta.nl/c.listconfig/all/](https://app.laposta.nl/c.listconfig/all/) -> bekijken, dan laatste stukje ( https://app.laposta.nl/c.listconfig/s.browse/?listconfig=XXXXXXXXX ) kopieren. Concept campagnes kan je er zo uit filteren.
    - Port: houd op 3000 als je docker-compose wilt gebruiken, anders kan je het aanpassen naar een port voor interne/externe routering
    - Url: homepagina ofzo
    - Title: titel van je rss feed
    - Description: omschrijving van je feed.
    - update_interval_minutes: hoe vaak moet de rss server de lijst met campagnes ophalen.

## Starten
Docker en docker compose moeten geinstalleerd zijn als je dat wilt gebruiken:
- `docker compose up -d`
    - bouwt eerst een image met code en node_modules voordat de server daadwerkelijk start.


Zonder docker, installeer nodejs(getest met 22.19 en lts):
- `npm i`
- `node index.js`

Ga naar http://localhost:3000/rss voor je rss feed.

## Hosting:
Gebruik een reverse proxy oid om de rss feed te exposen en ssl beveiliging te geven.

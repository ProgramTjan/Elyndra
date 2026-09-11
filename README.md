# Elyndra · Het levende woud

Een vrij te verkennen 3D-fantasiewereld waarin natuur en robotica samenleven, met gesprekken, vier puzzels, visioenen en een filmische introductie.

[Open Elyndra](https://elyndra-living-world.kcprobeertai.chatgpt.site/)

## Lokaal starten

De website staat in `dist/`. Deze map bevat de bewerkbare JavaScript-, HTML- en CSS-bronbestanden en afbeeldingen. Er is geen buildstap nodig.

Met Python 3, vanuit de hoofdmap van deze repository:

```sh
python -m http.server 8000 --directory dist
```

Open vervolgens http://localhost:8000 in een moderne browser met WebGL-ondersteuning.

## Tests

Met Node.js:

```sh
node --test tests/*.test.mjs
```

## Bestanden

- `dist/`: website, wereld, interacties en beelden.
- `tests/`: controles voor gesprekken, puzzels, introductie en bewegingen.
- `docs/art-direction.md`: visuele ontwerpkeuzes.
- `.openai/hosting.json`: configuratie van de bestaande ChatGPT Site.

## Herkomst

Overgenomen uit Elyndra versie 19, broncommit `6a03ab841a28cb15f2716f9b0befafde8538c1ef`. Deze repository is een kopie van die bronbestanden; wijzigingen worden niet automatisch met de bestaande website gesynchroniseerd.

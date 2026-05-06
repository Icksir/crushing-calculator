from fastapi import APIRouter, Query
from typing import List, Optional
import asyncio
import httpx

from src.services.calculator import RUNE_DB, STAT_DENSITIES, get_rune_name_translation, buscar_y_obtener_imagen
from services.rune_regex import STAT_MAPS

router = APIRouter()

_CATALOG_CACHE: dict[str, list[dict]] = {}


async def _build_catalog(lang: str) -> list[dict]:
    """Build the stat catalog for a given language."""
    entries = []
    rune_names_to_fetch = []
    canonicals_to_fetch = []

    for canonical, rune_list in RUNE_DB.items():
        if canonical not in STAT_DENSITIES or STAT_DENSITIES[canonical] <= 0:
            continue

        # Determine localized label
        if lang == "es":
            label = canonical
        else:
            stat_map = STAT_MAPS.get(lang, {})
            label = None
            for key, value in stat_map.items():
                if value == canonical:
                    label = key
                    break
            if not label:
                label = canonical  # fallback to Spanish

        rune_data = rune_list[0]
        rune_name_es = rune_data["name"]["es"]
        rune_name = get_rune_name_translation(rune_name_es, lang)

        entries.append({
            "canonical": canonical,
            "label": label,
            "rune_name": rune_name,
            "rune_image": None,
        })
        rune_names_to_fetch.append(rune_name)
        canonicals_to_fetch.append(canonical)

    # Fetch images in parallel
    if rune_names_to_fetch:
        async with httpx.AsyncClient() as client:
            tasks = [
                buscar_y_obtener_imagen(name, client, lang)
                for name in rune_names_to_fetch
            ]
            results = await asyncio.gather(*tasks)

        for i, image_url in enumerate(results):
            entries[i]["rune_image"] = image_url

    return entries


@router.get("/stats/catalog")
async def get_stats_catalog(
    lang: str = Query("es", regex="^(es|en|fr|pt)$")
) -> List[dict]:
    """Return the catalog of crushable stats with localized labels and rune info."""
    if lang in _CATALOG_CACHE:
        return _CATALOG_CACHE[lang]

    catalog = await _build_catalog(lang)
    _CATALOG_CACHE[lang] = catalog
    return catalog

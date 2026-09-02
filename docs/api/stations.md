# API: Stations & Lines (Metro)

Read-only endpoints for the seeded metro network. All public.

## `GET /lines`

List all lines with their directions.

Responses:
- `200` → `LineDto[]`

```json
[
  {
    "id": 1,
    "name": "Linha 1–Azul",
    "code": "1-azul",
    "color": "#005FA8",
    "directions": [
      { "id": 1, "name": "Jabaquara", "code": "JAB" },
      { "id": 2, "name": "Tucuruvi", "code": "TUC" }
    ]
  }
]
```

## `GET /lines/:id`

Single line detail, including its ordered stations.

Responses:
- `200` → `LineDetailDto` (adds `stations: [{ id, name, order, latitude, longitude }]` ordered by
  `order`).
- `404` — line not found.

## `GET /stations`

List all stations. Optional query `lineId` to filter stations on a line (ordered).

Responses:
- `200` → `StationDto[]`

```json
[
  {
    "id": 12,
    "name": "Jabaquara",
    "code": "L1-S01",
    "latitude": -23.6454,
    "longitude": -46.6342,
    "lines": [{ "id": 1, "name": "Linha 1–Azul", "code": "1-azul", "color": "#005FA8", "order": 0 }]
  }
]
```

## `GET /stations/:id`

Single station detail (with its lines and their orders).

Responses:
- `200` → `StationDto`
- `404` — station not found.

## Notes

- `lines` on a station include `order` (position on that line) for display/ordering.
- Coordinates are WGS84 `latitude` / `longitude` floats.
- These endpoints power the station selector and the map (maplibre) on the frontend.
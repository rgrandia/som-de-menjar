import os
from contextlib import contextmanager
from typing import Optional

import httpx
import psycopg2
import psycopg2.extras
from fastapi import APIRouter, FastAPI, HTTPException, Query, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

DATABASE_URL = os.environ.get("NEON_DATABASE_URL") or os.environ.get("DATABASE_URL")
NEON_REST_API_URL = (
    os.environ.get("NEON_REST_API_URL")
    or os.environ.get("NEON_API_URL")
    or os.environ.get("NEON_REST_URL")
)
NEON_REST_API_KEY = os.environ.get("NEON_REST_API_KEY") or os.environ.get("NEON_API_KEY")

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS restaurants (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    adreca VARCHAR(500),
    barri VARCHAR(255),
    ciutat VARCHAR(255) DEFAULT 'Barcelona',
    tipus_cuina VARCHAR(255),
    preu VARCHAR(10),
    puntuacio DECIMAL(3,1),
    puntuacio_menjar INTEGER,
    puntuacio_servei INTEGER,
    puntuacio_ambient INTEGER,
    telefon VARCHAR(50),
    web VARCHAR(500),
    maps_url VARCHAR(1000),
    afegit_per VARCHAR(255),
    notes TEXT,
    visitat BOOLEAN DEFAULT FALSE,
    data_afegit TIMESTAMP DEFAULT NOW()
);
"""


@contextmanager
def get_conn():
    conn = psycopg2.connect(DATABASE_URL)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(CREATE_TABLE_SQL)
            # Migració: afegir maps_url si no existeix
            cur.execute("""
                ALTER TABLE restaurants
                ADD COLUMN IF NOT EXISTS maps_url VARCHAR(1000)
            """)
            cur.execute("""
                ALTER TABLE restaurants
                ADD COLUMN IF NOT EXISTS afegit_per VARCHAR(255)
            """)


def using_rest_api() -> bool:
    return bool(NEON_REST_API_URL and not DATABASE_URL)


def rest_headers() -> dict[str, str]:
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    if NEON_REST_API_KEY:
        headers["apikey"] = NEON_REST_API_KEY
        headers["Authorization"] = f"Bearer {NEON_REST_API_KEY}"
    return headers


def rest_url(path: str) -> str:
    base = (NEON_REST_API_URL or "").rstrip("/")
    if not base.endswith("/rest/v1"):
        base = f"{base}/rest/v1"
    return f"{base}/{path.lstrip('/')}"


def rest_request(method: str, path: str, *, params=None, json=None):
    try:
        with httpx.Client(timeout=20.0) as client:
            response = client.request(
                method,
                rest_url(path),
                headers=rest_headers(),
                params=params,
                json=json,
            )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Error connectant amb Neon REST: {exc}") from exc

    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return response


class RestaurantCreate(BaseModel):
    nom: str
    adreca: Optional[str] = None
    barri: Optional[str] = None
    ciutat: Optional[str] = "Barcelona"
    tipus_cuina: Optional[str] = None
    preu: Optional[str] = None
    puntuacio: Optional[float] = None
    puntuacio_menjar: Optional[int] = None
    puntuacio_servei: Optional[int] = None
    puntuacio_ambient: Optional[int] = None
    telefon: Optional[str] = None
    web: Optional[str] = None
    maps_url: Optional[str] = None
    afegit_per: Optional[str] = None
    notes: Optional[str] = None
    visitat: Optional[bool] = False


class RestaurantUpdate(RestaurantCreate):
    nom: Optional[str] = None


def create_app(static_dir: str) -> FastAPI:
    api = APIRouter()

    @api.get("/health")
    def health():
        return {"ok": True}

    @api.get("/restaurants")
    def list_restaurants(
        cerca: Optional[str] = Query(None),
        barri: Optional[str] = Query(None),
        ciutat: Optional[str] = Query(None),
        tipus_cuina: Optional[str] = Query(None),
        preu: Optional[str] = Query(None),
        puntuacio_min: Optional[float] = Query(None),
        visitat: Optional[bool] = Query(None),
        ordre: Optional[str] = Query("data_afegit"),
        ordre_dir: Optional[str] = Query("DESC"),
    ):
        if using_rest_api():
            allowed_orders = {"data_afegit", "nom", "puntuacio", "preu", "tipus_cuina", "barri"}
            if ordre not in allowed_orders:
                ordre = "data_afegit"
            direction = "desc" if ordre_dir == "DESC" else "asc"

            params = [("select", "*"), ("order", f"{ordre}.{direction}")]
            if cerca:
                like = f"*{cerca}*"
                params.append(("or", f"(nom.ilike.{like},barri.ilike.{like},tipus_cuina.ilike.{like},notes.ilike.{like})"))
            if barri:
                params.append(("barri", f"ilike.*{barri}*"))
            if ciutat:
                params.append(("ciutat", f"ilike.*{ciutat}*"))
            if tipus_cuina:
                params.append(("tipus_cuina", f"ilike.*{tipus_cuina}*"))
            if preu:
                preus = [p for p in preu.split(",") if p]
                if preus:
                    params.append(("preu", f"in.({','.join(preus)})"))
            if puntuacio_min is not None:
                params.append(("puntuacio", f"gte.{puntuacio_min}"))
            if visitat is not None:
                params.append(("visitat", f"eq.{str(visitat).lower()}"))
            response = rest_request("GET", "restaurants", params=params)
            return response.json()

        conditions = []
        params = []

        if cerca:
            conditions.append(
                "(nom ILIKE %s OR barri ILIKE %s OR tipus_cuina ILIKE %s OR notes ILIKE %s)"
            )
            like = f"%{cerca}%"
            params.extend([like, like, like, like])
        if barri:
            conditions.append("barri ILIKE %s")
            params.append(f"%{barri}%")
        if ciutat:
            conditions.append("ciutat ILIKE %s")
            params.append(f"%{ciutat}%")
        if tipus_cuina:
            conditions.append("tipus_cuina ILIKE %s")
            params.append(f"%{tipus_cuina}%")
        if preu:
            preus = preu.split(",")
            placeholders = ",".join(["%s"] * len(preus))
            conditions.append(f"preu IN ({placeholders})")
            params.extend(preus)
        if puntuacio_min is not None:
            conditions.append("puntuacio >= %s")
            params.append(puntuacio_min)
        if visitat is not None:
            conditions.append("visitat = %s")
            params.append(visitat)

        allowed_orders = {
            "data_afegit", "nom", "puntuacio", "preu", "tipus_cuina", "barri"
        }
        if ordre not in allowed_orders:
            ordre = "data_afegit"
        dir_sql = "DESC" if ordre_dir == "DESC" else "ASC"

        where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
        sql = f"SELECT * FROM restaurants {where} ORDER BY {ordre} {dir_sql}"

        with get_conn() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(sql, params)
                rows = cur.fetchall()
        return [dict(r) for r in rows]

    @api.post("/restaurants", status_code=201)
    def create_restaurant(data: RestaurantCreate):
        if using_rest_api():
            response = rest_request(
                "POST",
                "restaurants",
                json=data.model_dump(),
                params={"select": "*"},
            )
            rows = response.json()
            return rows[0] if rows else {}

        sql = """
        INSERT INTO restaurants
          (nom, adreca, barri, ciutat, tipus_cuina, preu, puntuacio,
           puntuacio_menjar, puntuacio_servei, puntuacio_ambient,
           telefon, web, maps_url, afegit_per, notes, visitat)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        RETURNING *
        """
        with get_conn() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(sql, (
                    data.nom, data.adreca, data.barri, data.ciutat,
                    data.tipus_cuina, data.preu, data.puntuacio,
                    data.puntuacio_menjar, data.puntuacio_servei, data.puntuacio_ambient,
                    data.telefon, data.web, data.maps_url, data.afegit_per, data.notes, data.visitat,
                ))
                return dict(cur.fetchone())

    @api.get("/restaurants/{restaurant_id}")
    def get_restaurant(restaurant_id: int):
        if using_rest_api():
            response = rest_request(
                "GET",
                "restaurants",
                params={"id": f"eq.{restaurant_id}", "select": "*", "limit": "1"},
            )
            rows = response.json()
            if not rows:
                raise HTTPException(status_code=404, detail="Restaurant no trobat")
            return rows[0]

        with get_conn() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute("SELECT * FROM restaurants WHERE id = %s", (restaurant_id,))
                row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Restaurant no trobat")
        return dict(row)

    @api.put("/restaurants/{restaurant_id}")
    def update_restaurant(restaurant_id: int, data: RestaurantUpdate):
        fields = {k: v for k, v in data.model_dump().items() if v is not None}
        if not fields:
            raise HTTPException(status_code=400, detail="Cap camp per actualitzar")
        if using_rest_api():
            response = rest_request(
                "PATCH",
                "restaurants",
                params={"id": f"eq.{restaurant_id}", "select": "*"},
                json=fields,
            )
            rows = response.json()
            if not rows:
                raise HTTPException(status_code=404, detail="Restaurant no trobat")
            return rows[0]

        set_clause = ", ".join([f"{k} = %s" for k in fields])
        values = list(fields.values()) + [restaurant_id]
        sql = f"UPDATE restaurants SET {set_clause} WHERE id = %s RETURNING *"
        with get_conn() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(sql, values)
                row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Restaurant no trobat")
        return dict(row)

    @api.delete("/restaurants/{restaurant_id}")
    def delete_restaurant(restaurant_id: int):
        if using_rest_api():
            response = rest_request(
                "DELETE",
                "restaurants",
                params={"id": f"eq.{restaurant_id}", "select": "id"},
            )
            rows = response.json()
            if not rows:
                raise HTTPException(status_code=404, detail="Restaurant no trobat")
            return {"ok": True}

        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM restaurants WHERE id = %s RETURNING id", (restaurant_id,))
                row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Restaurant no trobat")
        return {"ok": True}

    @api.get("/opcions")
    def get_opcions():
        if using_rest_api():
            barris_response = rest_request(
                "GET",
                "restaurants",
                params={"select": "barri", "barri": "not.is.null", "order": "barri.asc"},
            )
            ciutats_response = rest_request(
                "GET",
                "restaurants",
                params={"select": "ciutat", "ciutat": "not.is.null", "order": "ciutat.asc"},
            )
            tipus_response = rest_request(
                "GET",
                "restaurants",
                params={"select": "tipus_cuina", "tipus_cuina": "not.is.null", "order": "tipus_cuina.asc"},
            )
            persones_response = rest_request(
                "GET",
                "restaurants",
                params={"select": "afegit_per", "afegit_per": "not.is.null", "order": "afegit_per.asc"},
            )
            barris = sorted({row["barri"] for row in barris_response.json() if row.get("barri")})
            ciutats = sorted({row["ciutat"] for row in ciutats_response.json() if row.get("ciutat")})
            tipus = sorted({row["tipus_cuina"] for row in tipus_response.json() if row.get("tipus_cuina")})
            persones = sorted({row["afegit_per"] for row in persones_response.json() if row.get("afegit_per")})
            return {"barris": barris, "ciutats": ciutats, "tipus_cuina": tipus, "persones": persones}

        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT DISTINCT barri FROM restaurants WHERE barri IS NOT NULL ORDER BY barri")
                barris = [r[0] for r in cur.fetchall()]
                cur.execute("SELECT DISTINCT ciutat FROM restaurants WHERE ciutat IS NOT NULL ORDER BY ciutat")
                ciutats = [r[0] for r in cur.fetchall()]
                cur.execute("SELECT DISTINCT tipus_cuina FROM restaurants WHERE tipus_cuina IS NOT NULL ORDER BY tipus_cuina")
                tipus = [r[0] for r in cur.fetchall()]
                cur.execute("SELECT DISTINCT afegit_per FROM restaurants WHERE afegit_per IS NOT NULL ORDER BY afegit_per")
                persones = [r[0] for r in cur.fetchall()]
        return {"barris": barris, "ciutats": ciutats, "tipus_cuina": tipus, "persones": persones}

    app = FastAPI()

    # Init DB on startup
    if DATABASE_URL:
        try:
            init_db()
        except Exception as e:
            print(f"Warning: Could not init DB: {e}")
    elif using_rest_api():
        print("Using Neon REST API mode (database migrations skipped).")
    else:
        print("Warning: No database configuration found (set NEON_DATABASE_URL or NEON_REST_API_URL).")

    app.include_router(api, prefix="/api")

    if os.path.isdir(static_dir):
        assets_dir = os.path.join(static_dir, "assets")
        if os.path.isdir(assets_dir):
            app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

        @app.get("/{path:path}")
        async def spa_fallback(request: Request, path: str):
            file_path = os.path.join(static_dir, path)
            if path and os.path.isfile(file_path):
                return FileResponse(file_path)
            return FileResponse(
                os.path.join(static_dir, "index.html"),
                headers={
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache",
                    "Expires": "0",
                },
            )

    return app

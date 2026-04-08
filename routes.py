import os
from contextlib import contextmanager
from typing import Optional

import psycopg2
import psycopg2.extras
from fastapi import APIRouter, FastAPI, HTTPException, Query, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

DATABASE_URL = os.environ.get("NEON_DATABASE_URL") or os.environ.get("DATABASE_URL")

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
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM restaurants WHERE id = %s RETURNING id", (restaurant_id,))
                row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Restaurant no trobat")
        return {"ok": True}

    @api.get("/opcions")
    def get_opcions():
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
    try:
        init_db()
    except Exception as e:
        print(f"Warning: Could not init DB: {e}")

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

"""
db_init.py  –  Initialize the pakwheels_db MySQL database from the CSV dataset.
"""
import os
from pathlib import Path

import pandas as pd
import MySQLdb
from dotenv import load_dotenv

load_dotenv()
ROOT = Path(__file__).resolve().parent.parent
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "Muddassir12@")
DB_NAME = os.getenv("DB_NAME", "pakwheels_db")
CSV_PATH = ROOT / "dataset_extracted" / "pakwheels_cleaned (1).csv"

INSERT_VEHICLE_SQL = """
REPLACE INTO vehicles (
    vehicle_id, title, brand, model, year, body_type, color,
    fuel_type, transmission, engine_cc, mileage_km, price,
    price_currency, price_note, city, image_url, detail_url, scraped_at
) VALUES (
    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
)
"""


def get_connection(use_db=True):
    config = {
        "host": DB_HOST,
        "user": DB_USER,
        "passwd": DB_PASS,
        "charset": "utf8mb4",
        "use_unicode": True,
    }
    if use_db:
        config["db"] = DB_NAME
    return MySQLdb.connect(**config)


def load_dataset():
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"Dataset CSV not found: {CSV_PATH}")

    df = pd.read_csv(CSV_PATH, keep_default_na=False)
    if df.empty:
        raise ValueError("Dataset CSV is empty")

    df = df.rename(
        columns={
            "id": "vehicle_id",
            "make": "brand",
            "fuel": "fuel_type",
            "image": "image_url",
        }
    )

    df["scraped_at"] = pd.to_datetime(df["scraped_at"], errors="coerce")
    df["scraped_at"] = df["scraped_at"].dt.strftime("%Y-%m-%d %H:%M:%S")
    df.replace({"": None}, inplace=True)
    return df


def main():
    print(f"Initializing database {DB_NAME} from {CSV_PATH}")
    df = load_dataset()
    conn = get_connection(use_db=False)
    cur = conn.cursor()
    cur.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
    conn.commit()
    cur.close()
    conn.close()

    conn = get_connection(use_db=True)
    cur = conn.cursor()
    cur.execute("DROP TABLE IF EXISTS vehicles")
    cur.execute("""
        CREATE TABLE vehicles (
            vehicle_id BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
            title TEXT,
            brand VARCHAR(255),
            model VARCHAR(255),
            year INT,
            body_type VARCHAR(128),
            color VARCHAR(128),
            fuel_type VARCHAR(128),
            transmission VARCHAR(128),
            engine_cc INT,
            mileage_km INT,
            price DECIMAL(18,2),
            price_currency VARCHAR(16),
            price_note VARCHAR(255),
            city VARCHAR(255),
            image_url TEXT,
            detail_url TEXT,
            scraped_at DATETIME
        ) ENGINE=MyISAM CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    """)
    conn.commit()
    print("Loading vehicle rows into MySQL...")

    rows = df.to_dict(orient="records")
    for index, row in enumerate(rows, start=1):
        cur.execute(
            INSERT_VEHICLE_SQL,
            (
                int(row.get("vehicle_id") or 0) or None,
                row.get("title"),
                row.get("brand"),
                row.get("model"),
                int(row.get("year")) if row.get("year") not in (None, "") else None,
                row.get("body_type"),
                row.get("color"),
                row.get("fuel_type"),
                row.get("transmission"),
                int(row.get("engine_cc")) if row.get("engine_cc") not in (None, "") else None,
                int(row.get("mileage_km")) if row.get("mileage_km") not in (None, "") else None,
                float(row.get("price")) if row.get("price") not in (None, "") else None,
                row.get("price_currency"),
                row.get("price_note"),
                row.get("city"),
                row.get("image_url"),
                row.get("detail_url"),
                row.get("scraped_at"),
            )
        )
        if index % 500 == 0:
            conn.commit()
            print(f"  {index} rows inserted...")
    conn.commit()  # final batch
    cur.close()
    conn.close()
    print(f"Database initialization complete. Imported {len(rows)} vehicles.")


if __name__ == '__main__':
    main()

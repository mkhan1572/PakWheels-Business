import os
import MySQLdb
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host":        os.getenv("DB_HOST", "localhost"),
    "user":        os.getenv("DB_USER", "root"),
    "passwd":      os.getenv("DB_PASS", ""),
    "db":          os.getenv("DB_NAME", "pakwheels_db"),
    "charset":     "utf8mb4",
    "use_unicode": True,
}


def get_db(use_db=True):
    config = DB_CONFIG.copy()
    if not use_db:
        config.pop("db", None)
    try:
        return MySQLdb.connect(**config)
    except MySQLdb.OperationalError as e:
        raise RuntimeError(
            f"Cannot connect to MySQL at {config['host']} "
            f"(db={config.get('db', 'N/A')}): {e}"
        ) from e

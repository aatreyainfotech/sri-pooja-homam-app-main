"""Export MongoDB data to SQL Server (T-SQL / SSMS 22) compatible .sql file."""
import asyncio, os, json
from pathlib import Path
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "sri_pooja_homam")


def esc(v):
    """SQL string literal escape for T-SQL (single quotes)."""
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "1" if v else "0"
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, datetime):
        return "N'" + v.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "'"
    if isinstance(v, (dict, list)):
        return "N'" + json.dumps(v, ensure_ascii=False, default=str).replace("'", "''") + "'"
    s = str(v).replace("'", "''")
    return "N'" + s + "'"


SCHEMA = r"""-- ====================================================================
-- Sri Pooja Homam — SQL Server 2022 / SSMS 22 compatible schema + data
-- Generated from MongoDB collections on the current live database.
-- Run as-is in SSMS: File -> Open -> this .sql file -> F5
-- ====================================================================

IF DB_ID(N'SriPoojaHomam') IS NULL
BEGIN
    CREATE DATABASE SriPoojaHomam;
END
GO

USE SriPoojaHomam;
GO

IF OBJECT_ID('dbo.push_tokens', 'U') IS NOT NULL DROP TABLE dbo.push_tokens;
IF OBJECT_ID('dbo.bookings',    'U') IS NOT NULL DROP TABLE dbo.bookings;
IF OBJECT_ID('dbo.videos',      'U') IS NOT NULL DROP TABLE dbo.videos;
IF OBJECT_ID('dbo.live_streams','U') IS NOT NULL DROP TABLE dbo.live_streams;
IF OBJECT_ID('dbo.poojas',      'U') IS NOT NULL DROP TABLE dbo.poojas;
IF OBJECT_ID('dbo.temples',     'U') IS NOT NULL DROP TABLE dbo.temples;
IF OBJECT_ID('dbo.users',       'U') IS NOT NULL DROP TABLE dbo.users;
GO

-- ==================== USERS ====================
CREATE TABLE dbo.users (
    id              NVARCHAR(36)   NOT NULL PRIMARY KEY,
    mobile          NVARCHAR(15)   NOT NULL UNIQUE,
    password_hash   NVARCHAR(200)  NOT NULL,
    role            NVARCHAR(20)   NOT NULL DEFAULT N'devotee',
    full_name       NVARCHAR(120)  NULL,
    email           NVARCHAR(120)  NULL,
    address         NVARCHAR(300)  NULL,
    city            NVARCHAR(60)   NULL,
    pincode         NVARCHAR(10)   NULL,
    is_active       BIT            NOT NULL DEFAULT 1,
    verified        BIT            NOT NULL DEFAULT 0,
    photo_url       NVARCHAR(MAX)  NULL,
    created_at      DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE INDEX IX_users_role ON dbo.users(role);

-- ==================== TEMPLES ====================
CREATE TABLE dbo.temples (
    id              NVARCHAR(36)   NOT NULL PRIMARY KEY,
    name            NVARCHAR(200)  NOT NULL,
    description     NVARCHAR(MAX)  NULL,
    location        NVARCHAR(200)  NULL,
    image_url       NVARCHAR(1000) NULL,
    deity           NVARCHAR(120)  NULL,
    gallery         NVARCHAR(MAX)  NULL,
    created_at      DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME()
);

-- ==================== POOJAS ====================
CREATE TABLE dbo.poojas (
    id              NVARCHAR(36)   NOT NULL PRIMARY KEY,
    temple_id       NVARCHAR(36)   NOT NULL,
    name            NVARCHAR(200)  NOT NULL,
    description     NVARCHAR(MAX)  NULL,
    price           DECIMAL(10,2)  NOT NULL DEFAULT 0,
    duration_minutes INT           NOT NULL DEFAULT 30,
    pooja_type      NVARCHAR(20)   NOT NULL DEFAULT N'pooja',
    image_url       NVARCHAR(1000) NULL,
    is_active       BIT            NOT NULL DEFAULT 1,
    created_at      DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_poojas_temple FOREIGN KEY (temple_id) REFERENCES dbo.temples(id) ON DELETE CASCADE
);
CREATE INDEX IX_poojas_temple ON dbo.poojas(temple_id);

-- ==================== BOOKINGS ====================
CREATE TABLE dbo.bookings (
    id                   NVARCHAR(36)   NOT NULL PRIMARY KEY,
    user_id              NVARCHAR(36)   NOT NULL,
    pooja_id             NVARCHAR(36)   NOT NULL,
    temple_id            NVARCHAR(36)   NULL,
    pooja_name           NVARCHAR(200)  NULL,
    pooja_type           NVARCHAR(20)   NULL,
    devotee_name         NVARCHAR(120)  NULL,
    gotra                NVARCHAR(120)  NULL,
    amount               DECIMAL(10,2)  NOT NULL DEFAULT 0,
    scheduled_at         DATETIME2      NULL,
    status               NVARCHAR(20)   NOT NULL DEFAULT N'pending',
    payment_status       NVARCHAR(20)   NOT NULL DEFAULT N'pending',
    razorpay_payment_id  NVARCHAR(100)  NULL,
    paid_at              DATETIME2      NULL,
    created_at           DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_bookings_user   FOREIGN KEY (user_id)   REFERENCES dbo.users(id),
    CONSTRAINT FK_bookings_pooja  FOREIGN KEY (pooja_id)  REFERENCES dbo.poojas(id),
    CONSTRAINT FK_bookings_temple FOREIGN KEY (temple_id) REFERENCES dbo.temples(id)
);
CREATE INDEX IX_bookings_user    ON dbo.bookings(user_id);
CREATE INDEX IX_bookings_pooja   ON dbo.bookings(pooja_id);
CREATE INDEX IX_bookings_status  ON dbo.bookings(status);
CREATE INDEX IX_bookings_payment ON dbo.bookings(payment_status);

-- ==================== LIVE_STREAMS ====================
CREATE TABLE dbo.live_streams (
    id              NVARCHAR(36)   NOT NULL PRIMARY KEY,
    temple_id       NVARCHAR(36)   NULL,
    pooja_id        NVARCHAR(36)   NULL,
    title           NVARCHAR(200)  NOT NULL,
    description     NVARCHAR(MAX)  NULL,
    stream_url      NVARCHAR(1000) NULL,
    channel_name    NVARCHAR(120)  NULL,
    provider        NVARCHAR(20)   NOT NULL DEFAULT N'hls',
    is_paid_only    BIT            NOT NULL DEFAULT 1,
    is_live         BIT            NOT NULL DEFAULT 1,
    created_at      DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_live_streams_temple FOREIGN KEY (temple_id) REFERENCES dbo.temples(id),
    CONSTRAINT FK_live_streams_pooja  FOREIGN KEY (pooja_id)  REFERENCES dbo.poojas(id)
);
CREATE INDEX IX_live_streams_is_live ON dbo.live_streams(is_live);

-- ==================== VIDEOS ====================
CREATE TABLE dbo.videos (
    id              NVARCHAR(36)   NOT NULL PRIMARY KEY,
    title           NVARCHAR(200)  NOT NULL,
    description     NVARCHAR(MAX)  NULL,
    url             NVARCHAR(1000) NULL,
    thumbnail       NVARCHAR(1000) NULL,
    caption         NVARCHAR(MAX)  NULL,
    watermark_logo  NVARCHAR(1000) NULL,
    temple_id       NVARCHAR(36)   NULL,
    created_at      DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_videos_temple FOREIGN KEY (temple_id) REFERENCES dbo.temples(id)
);

-- ==================== PUSH_TOKENS ====================
CREATE TABLE dbo.push_tokens (
    token           NVARCHAR(200)  NOT NULL PRIMARY KEY,
    user_id         NVARCHAR(36)   NOT NULL,
    platform        NVARCHAR(20)   NOT NULL DEFAULT N'expo',
    created_at      DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at      DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_push_tokens_user FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
);
CREATE INDEX IX_push_tokens_user ON dbo.push_tokens(user_id);
GO
"""


async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    out = [SCHEMA,
           "\n-- ==================== DATA ====================\nSET XACT_ABORT ON;\nBEGIN TRANSACTION;\nGO\n"]

    async def dump(coll_name, table, cols, date_cols=("created_at",), not_null_cols=None):
        """not_null_cols: set of column names that are NOT NULL with defaults — omit from INSERT when None."""
        if not_null_cols is None:
            not_null_cols = set()
        items = await db[coll_name].find({}, {"_id": 0}).to_list(None)
        out.append(f"\n-- {table} ({len(items)} rows)")
        for it in items:
            row_cols = []
            vals = []
            for c in cols:
                v = it.get(c)
                if v is None and c in not_null_cols:
                    continue  # let SQL Server apply the DEFAULT
                if c in date_cols and isinstance(v, str):
                    v = v.replace("Z", "").replace("+00:00", "")
                if isinstance(v, list):
                    v = json.dumps(v, ensure_ascii=False)
                row_cols.append(c)
                vals.append(esc(v))
            out.append(f"INSERT INTO dbo.{table} ({','.join(row_cols)}) VALUES ({','.join(vals)});")
        return len(items)

    n_u = await dump("users", "users",
                     ["id","mobile","password_hash","role","full_name","email","address","city",
                      "pincode","is_active","verified","photo_url","created_at"])
    n_t = await dump("temples", "temples",
                     ["id","name","description","location","image_url","deity","gallery","created_at"])
    n_p = await dump("poojas", "poojas",
                     ["id","temple_id","name","description","price","duration_minutes",
                      "pooja_type","image_url","is_active","created_at"],
                     not_null_cols={"duration_minutes","pooja_type","is_active"})
    n_b = await dump("bookings", "bookings",
                     ["id","user_id","pooja_id","temple_id","pooja_name","pooja_type","devotee_name",
                      "gotra","amount","scheduled_at","status","payment_status","razorpay_payment_id",
                      "paid_at","created_at"],
                     date_cols=("created_at","scheduled_at","paid_at"))
    n_s = await dump("live_streams", "live_streams",
                     ["id","temple_id","pooja_id","title","description","stream_url","channel_name",
                      "provider","is_paid_only","is_live","created_at"],
                     not_null_cols={"provider","is_paid_only","is_live"})
    n_v = await dump("videos", "videos",
                     ["id","title","description","url","thumbnail","caption","watermark_logo",
                      "temple_id","created_at"])
    n_pt = await dump("push_tokens", "push_tokens",
                      ["token","user_id","platform","created_at","updated_at"],
                      date_cols=("created_at","updated_at"))

    out.append("\nGO\nCOMMIT TRANSACTION;\nGO\n\nPRINT N'✅ Sri Pooja Homam SQL Server migration complete.';\nGO")

    exports_dir = ROOT_DIR.parent / "exports"
    os.makedirs(exports_dir, exist_ok=True)
    sql_path = exports_dir / "sri_pooja_homam_sqlserver.sql"
    with open(sql_path, "w", encoding="utf-8") as f:
        f.write("\n".join(out))

    print(f"Generated: {sql_path}")
    print(f"Size: {os.path.getsize(sql_path)} bytes")
    print(f"Users: {n_u} | Temples: {n_t} | Poojas: {n_p} | Bookings: {n_b} | "
          f"LiveStreams: {n_s} | Videos: {n_v} | PushTokens: {n_pt}")
    client.close()


asyncio.run(main())

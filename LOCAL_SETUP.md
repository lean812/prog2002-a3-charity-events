# PROG2002 A3 — Running the full system locally (Windows)

The whole application now runs on this machine against a **real MySQL**
database (no mock). This page explains how to start, stop and reset it.

## What was installed

- **MySQL Community Server 8.0.29** (portable ZIP, no system service)
  - Installed at: `C:\Users\Administrator\db\mysql`
  - Data directory: `C:\Users\Administrator\db\data`
  - Config file: `C:\Users\Administrator\db\mysql\my.ini`
  - Local account: user **`root`**, password **`root`**
  - Port: **3306**
- Database `charityevents_db` already created and populated (11 events,
  **14 registrations**, 6 categories, 2 organisations).
- The API's `LiuZA3-api/.env` already points at this local database.

## Start everything (easiest)

Right-click `local-run\start-local.ps1` → **Run with PowerShell**, or run it
in a terminal:

```powershell
powershell -ExecutionPolicy Bypass -File .\local-run\start-local.ps1
```

It starts MySQL, the API and the two websites, then opens the browser.

| What | URL |
|------|-----|
| Public client site | http://localhost:5000/client/ |
| Admin site | http://localhost:5000/admin/ |
| API (JSON) | http://localhost:3000/ |

Stop everything with `local-run\stop-local.ps1`.

## Reset the database to the original data

After experimenting, reload the clean sample data:

```powershell
C:\Users\Administrator\db\mysql\bin\mysql.exe -u root -proot --default-character-set=utf8mb4 -e "source LiuZA3-api/sql/charityevents_db.sql"
```

(The script drops and recreates the database, so this is safe to re-run.)

## What was verified against the real database

- Public list returns the 8 active/upcoming events; admin list returns all 11.
- Event details shows registrations with the **newest purchase first**,
  correct ticket counts and totals, and the live weather forecast.
- A new registration succeeds and computes the total from the ticket price.
- Registering the same email twice returns **HTTP 409**.
- Creating an event works; deleting an event with no registrations works.
- Deleting an event **with registrations is blocked with HTTP 409** and the
  admin page shows the red warning banner (the event is not deleted).
- The `Node.js` logic test suite (`LiuZA3-api/test/smoke-test.js`) also passes.

## Note on online deployment (cPanel)

The free host in the email (`202300408031.ihostfull.com`) was **removed for
inactivity** (confirmed by the "Inactive" notice and the DNS error), and
free ihostfull/Bytet hosts only run PHP+MySQL — they cannot run a Node.js/
Express server. This local environment therefore covers the full running
system. For a public URL that supports Node.js, use Render + a free MySQL
provider such as Aiven, or ask the tutor which hosted cPanel the unit
requires (see `PROG2002_A3_Project_Documentation.md`).

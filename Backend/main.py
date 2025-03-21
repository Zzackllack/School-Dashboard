import os
import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from bs4 import BeautifulSoup
import requests
from dotenv import load_dotenv

# Load environment
load_dotenv()
DSB_USER = os.getenv("DSB_USER")
DSB_PASS = os.getenv("DSB_PASS")
if not DSB_USER or not DSB_PASS:
    raise RuntimeError("DSB_USER and DSB_PASS must be set in .env")

# Constants
LOGIN_URL = f"https://www.dsbmobile.de/Login.aspx?user={DSB_USER}&password={DSB_PASS}"
DEFAULT_URL = "https://www.dsbmobile.de/Default.aspx"
FIRST_GUID = (
    "ba59f8c2-a3a5-49eb-9b00-c3a61e92cb5f"  # Constant for this school citeturn1file4
)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

session = requests.Session()


def login():
    resp = session.get(LOGIN_URL)
    if resp.status_code != 200 or DEFAULT_URL not in resp.url:
        raise HTTPException(status_code=502, detail="Login failed")


def get_uuid(day_title: str) -> str:
    resp = session.get(DEFAULT_URL)
    soup = BeautifulSoup(resp.text, "html.parser")
    found = []

    for tile in soup.select("div.timetable-element"):
        title = tile.select_one(".title").get_text(strip=True)
        uuid = tile.get("data-uuid")
        found.append((title, uuid))
        print(f"[DEBUG] Found tile → Title: '{title}', UUID: {uuid}")

        if day_title.lower() in title.lower():
            print(f"[DEBUG] MATCHED '{title}' for requested '{day_title}'")
            return uuid

    # If we reach here, nothing matched
    print("[DEBUG] All available tiles:", found)
    raise HTTPException(status_code=404, detail=f"Tile '{day_title}' not found")


def fetch_plan_html(uuid: str) -> str:
    plan_url = f"https://dsbmobile.de/data/{FIRST_GUID}/{uuid}/subst_001.htm"
    resp = session.get(plan_url)
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Failed to fetch plan HTML")
    return resp.text


def parse_plan(html: str):
    soup = BeautifulSoup(html, "html.parser")
    entries = []
    for row in soup.select("table.mon_list tr.list"):
        cols = [td.get_text(strip=True) for td in row.find_all("td")]
        entries.append(
            {
                "class": cols[0],
                "lesson": cols[1],
                "absent": cols[2],
                "substitute": cols[3],
                "old_subject": cols[4],
                "new_subject": cols[5],
                "room": cols[6],
                "type": cols[7],
                "notes": cols[8],
            }
        )
    return entries


@app.get("/api/substitution/today")
def today():
    login()
    uuid = get_uuid("Schüler heute")
    html = fetch_plan_html(uuid)
    return {"entries": parse_plan(html)}


@app.get("/api/substitution/tomorrow")
def tomorrow():
    login()
    uuid = get_uuid("Schüler morgen")
    html = fetch_plan_html(uuid)
    return {"entries": parse_plan(html)}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

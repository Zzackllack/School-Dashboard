import os
import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dsbix import DSBApi

# Load credentials from environment
DSB_USERNAME = os.getenv("DSB_USER")
DSB_PASSWORD = os.getenv("DSB_PASS")
if not DSB_USERNAME or not DSB_PASSWORD:
    raise RuntimeError("Environment variables DSB_USER and DSB_PASS must be set")

# Initialize DSBApi client
# Adjust tablemapper order if your school’s data columns differ
client = DSBApi(
    DSB_USERNAME,
    DSB_PASSWORD,
    tablemapper=[
        "type",
        "class",
        "lesson",
        "room",
        "new_subject",
        "subject",
        "new_teacher",
        "teacher",
        "text",
    ],
)

app = FastAPI(title="School Dashboard — Substitution Plan API", version="0.1")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def fetch_for_date(target_date: datetime.date):
    try:
        all_entries = client.fetch_entries()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"DSB fetch failed: {e}")
    date_str = target_date.strftime("%d.%m.%Y")
    filtered = []
    for day_list in all_entries:
        for entry in day_list:
            if entry.get("date") == date_str:
                filtered.append(entry)
    return filtered


@app.get("/api/substitution/today")
def get_today():
    return {"entries": fetch_for_date(datetime.date.today())}


@app.get("/api/substitution/tomorrow")
def get_tomorrow():
    return {
        "entries": fetch_for_date(datetime.date.today() + datetime.timedelta(days=1))
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

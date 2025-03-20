from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import datetime

app = FastAPI()

# Allow CORS for your frontend (adjust allowed origins for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change "*" to your React app's URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Sample in-memory data or function to scrape/substitute data
def get_substitution_entries():
    # For example, here you could implement your scraping logic or
    # process a data file. This is a stub returning mock data.
    return [
        {
            "date": datetime.date.today().strftime("%d.%m.%Y"),
            "class": "10A",
            "lesson": 3,
            "subject": "Math",
            "new_subject": "Geometry",
            "teacher": "Mr. Schmidt",
            "new_teacher": "Ms. Meyer",
            "room": "101",
            "notes": "Bring calculator",
        }
    ]


def filter_entries_by_date(entries, target_date: datetime.date):
    target_str = target_date.strftime("%d.%m.%Y")
    return [entry for entry in entries if entry.get("date") == target_str]


@app.get("/api/substitution/today")
async def get_today_substitution():
    try:
        entries = get_substitution_entries()
        today = datetime.date.today()
        today_entries = filter_entries_by_date(entries, today)
        return {"entries": today_entries}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/substitution/tomorrow")
async def get_tomorrow_substitution():
    try:
        entries = get_substitution_entries()
        tomorrow = datetime.date.today() + datetime.timedelta(days=1)
        tomorrow_entries = filter_entries_by_date(entries, tomorrow)
        return {"entries": tomorrow_entries}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

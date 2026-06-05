from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx
import random
from datetime import datetime, timezone

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ABUSEIPDB_API_KEY = "426cba056af1ee14f1f09f8c0fd07eef64f3a4f1e05c5264e2c8dc067fa5dae2aaa1c829c279a79f"

COUNTRY_NAMES = {
    "US": "USA", "CN": "China", "RU": "Russia", "DE": "Germany",
    "GB": "UK", "FR": "France", "IN": "India", "BR": "Brazil",
    "KP": "North Korea", "IR": "Iran", "UA": "Ukraine", "TR": "Turkey",
    "NG": "Nigeria", "ZA": "South Africa", "AU": "Australia", "JP": "Japan",
    "KR": "South Korea", "PK": "Pakistan", "MX": "Mexico", "CA": "Canada",
    "TH": "Thailand", "VN": "Vietnam", "ID": "Indonesia", "SA": "Saudi Arabia",
    "PL": "Poland", "NL": "Netherlands", "ES": "Spain", "IT": "Italy",
    "AR": "Argentina", "EG": "Egypt",
}

COUNTRY_COORDS = {
    "USA":          (38.9,  -77.0),
    "China":        (39.9,  116.4),
    "Russia":       (55.7,   37.6),
    "Germany":      (51.2,   10.4),
    "UK":           (55.3,   -3.4),
    "France":       (46.2,    2.2),
    "India":        (20.5,   78.9),
    "Brazil":       (-14.2, -51.9),
    "North Korea":  (40.3,  127.5),
    "Iran":         (35.7,   51.4),
    "Ukraine":      (48.3,   31.1),
    "Turkey":       (38.9,   35.2),
    "Nigeria":      (9.0,     8.6),
    "South Africa": (-30.5,  22.9),
    "Australia":    (-25.2, 133.7),
    "Japan":        (36.2,  138.2),
    "South Korea":  (35.9,  127.7),
    "Pakistan":     (30.3,   69.3),
    "Mexico":       (23.6, -102.5),
    "Canada":       (56.1, -106.3),
    "Thailand":     (15.9,  100.9),
    "Vietnam":      (14.1,  108.3),
    "Indonesia":    (-2.5,  118.0),
    "Saudi Arabia": (23.9,   45.1),
    "Poland":       (51.9,   19.1),
    "Netherlands":  (52.1,    5.3),
    "Spain":        (40.5,   -3.7),
    "Italy":        (41.9,   12.6),
    "Argentina":    (-38.4, -63.6),
    "Egypt":        (26.8,   30.8),
}

ATTACK_TYPES = {
    "DDoS":        ("T1498", "Network Denial of Service"),
    "Malware":     ("T1204", "User Execution"),
    "Phishing":    ("T1566", "Phishing"),
    "Ransomware":  ("T1486", "Data Encrypted for Impact"),
    "Brute Force": ("T1110", "Brute Force"),
}

MOCK_THREATS = [
    ("Russia", "USA", "DDoS", "CRITICAL", 95),
    ("China", "UK", "Malware", "HIGH", 88),
    ("North Korea", "South Korea", "Ransomware", "CRITICAL", 92),
    ("Iran", "Israel", "Phishing", "HIGH", 85),
    ("Russia", "Germany", "Brute Force", "MEDIUM", 70),
    ("China", "Australia", "Malware", "HIGH", 82),
    ("Nigeria", "USA", "Phishing", "MEDIUM", 65),
    ("Brazil", "USA", "DDoS", "HIGH", 78),
    ("India", "Pakistan", "Brute Force", "MEDIUM", 60),
    ("Russia", "France", "Ransomware", "CRITICAL", 91),
    ("China", "Japan", "DDoS", "HIGH", 87),
    ("Iran", "Saudi Arabia", "Malware", "HIGH", 80),
    ("North Korea", "USA", "Ransomware", "CRITICAL", 94),
    ("Russia", "Ukraine", "DDoS", "CRITICAL", 96),
    ("China", "Taiwan", "Malware", "HIGH", 89),
    ("Turkey", "Germany", "Phishing", "MEDIUM", 72),
    ("Pakistan", "India", "Brute Force", "HIGH", 76),
    ("Mexico", "USA", "Phishing", "MEDIUM", 68),
    ("South Africa", "UK", "Malware", "MEDIUM", 63),
    ("Indonesia", "Australia", "DDoS", "HIGH", 81),
]

def make_mock_threat(index: int):
    src, tgt, attack_type, severity, confidence = MOCK_THREATS[index % len(MOCK_THREATS)]
    src_lat, src_lon = COUNTRY_COORDS.get(src, (0, 0))
    tgt_lat, tgt_lon = COUNTRY_COORDS.get(tgt, (0, 0))
    mitre_id, mitre_name = ATTACK_TYPES[attack_type]
    return {
        "id": f"mock-{index}",
        "ip": f"{random.randint(1,254)}.{random.randint(0,254)}.{random.randint(0,254)}.{random.randint(1,254)}",
        "source_country": src,
        "source_lat": src_lat,
        "source_lon": src_lon,
        "target_country": tgt,
        "target_lat": tgt_lat,
        "target_lon": tgt_lon,
        "type": attack_type,
        "severity": severity,
        "confidence": confidence,
        "mitre_id": mitre_id,
        "mitre_name": mitre_name,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "categories": [],
    }

@app.get("/threats/latest")
async def get_latest_threats():
    threats = []
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://api.abuseipdb.com/api/v2/blacklist",
                headers={"Key": ABUSEIPDB_API_KEY, "Accept": "application/json"},
                params={"limit": 20, "confidenceMinimum": 90},
            )
            if resp.status_code == 200:
                data = resp.json().get("data", [])
                for i, entry in enumerate(data):
                    cc = entry.get("countryCode", "")
                    country_name = COUNTRY_NAMES.get(cc, cc)
                    coords = COUNTRY_COORDS.get(country_name, (
                        random.uniform(-60, 70),
                        random.uniform(-150, 150)
                    ))
                    # Pick a random target country
                    targets = [c for c in COUNTRY_COORDS if c != country_name]
                    target = random.choice(targets)
                    tgt_coords = COUNTRY_COORDS[target]
                    attack_type = random.choice(list(ATTACK_TYPES.keys()))
                    mitre_id, mitre_name = ATTACK_TYPES[attack_type]
                    severity = "CRITICAL" if entry.get("abuseConfidenceScore", 0) >= 95 else "HIGH"
                    threats.append({
                        "id": f"live-{i}",
                        "ip": entry.get("ipAddress", ""),
                        "source_country": country_name,
                        "source_lat": coords[0],
                        "source_lon": coords[1],
                        "target_country": target,
                        "target_lat": tgt_coords[0],
                        "target_lon": tgt_coords[1],
                        "type": attack_type,
                        "severity": severity,
                        "confidence": entry.get("abuseConfidenceScore", 0),
                        "mitre_id": mitre_id,
                        "mitre_name": mitre_name,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "categories": entry.get("categories", []),
                    })
    except Exception as e:
        print(f"AbuseIPDB error: {e}")

    # Always pad with mock data to guarantee 20 threats
    while len(threats) < 20:
        threats.append(make_mock_threat(len(threats)))

    return threats
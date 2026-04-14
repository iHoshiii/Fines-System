import os
import requests
import json

SUPABASE_URL = "https://uecfckunmfxpsltjyojx.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlY2Zja3VubWZ4cHNsdGp5b2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMTA2MzIsImV4cCI6MjA5MTY4NjYzMn0.tc13L8IvtS_jyt444Y-r2s6SjKzDDdY7_aLzNW2dVQY"

SIGNUP_URL = f"{SUPABASE_URL}/auth/v1/signup"

HEADERS = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json"
}

dummy_users = [
    {
        "email": "admin2@nvsu.edu.ph",
        "password": "password123",
        "options": {
            "data": {
                "full_name": "System Admin",
                "role": "admin"
            }
        }
    },
    {
        "email": "student2@nvsu.edu.ph",
        "password": "password123",
        "options": {
            "data": {
                "full_name": "Juan Dela Cruz",
                "role": "student"
            }
        }
    },
    {
        "email": "ncssc2@nvsu.edu.ph",
        "password": "password123",
        "options": {
            "data": {
                "full_name": "NCSSC Representative",
                "role": "ncssc"
            }
        }
    },
    {
        "email": "college2@nvsu.edu.ph",
        "password": "password123",
        "options": {
            "data": {
                "full_name": "College Org Officer",
                "role": "college_org"
            }
        }
    },
    {
        "email": "suborg2@nvsu.edu.ph",
        "password": "password123",
        "options": {
            "data": {
                "full_name": "Sub-Org Officer",
                "role": "sub_org"
            }
        }
    }
]

def create_users():
    with open('python_out.log', 'w') as f:
        f.write("Creating dummy accounts using Requests with options.data...\n")
        for user in dummy_users:
            try:
                response = requests.post(SIGNUP_URL, headers=HEADERS, json={
                    "email": user["email"],
                    "password": user["password"],
                    "data": user["options"]['data']
                })
                if response.status_code in [200, 201]:
                    f.write(f"Created: {user['email']}\n")
                else:
                    f.write(f"Failed {user['email']}: {response.text}\n")
            except Exception as e:
                f.write(f"Exception {user['email']}: {str(e)}\n")

if __name__ == "__main__":
    create_users()

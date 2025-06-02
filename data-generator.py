import os
import random
from datetime import datetime, timedelta
from faker import Faker
from pymongo import MongoClient, UpdateOne
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env file

# --- Configuration ---
MONGO_URI = os.getenv("MONGO_URI")
DATABASE_NAME = "links_portal" # Or your preferred DB name
COLLECTION_NAME = "payments"
NUM_RECORDS = 1000 # Number of payment records to generate

# --- Data Choices ---
PSPS = ["MaybankV2", "CIMBV2", "StripeDirect", "PayPalExpress", "AdyenGateway", "BraintreePayments"]
SCHEMES = ["mc", "visa", "amex", "discover", "jcb"] # Short codes for Mastercard, Visa, etc.
CURRENCIES = ["MYR", "SGD", "USD", "EUR"]
GL_RESPONSES_SUCCESS = [
    (50000, "Success"),
    (50001, "Approved"),
]
GL_RESPONSES_FAIL = [
    (60001, "Insufficient Funds"),
    (60002, "Card Expired"),
    (60003, "Do Not Honor"),
    (70000, "System Error"),
]
COUNTRIES = ["MY", "SG", "US", "GB"] # For generating diverse user profiles if needed later

fake = Faker()

def generate_grablink_id():
    """Generates a unique GrabLink ID (timestamp-based with random suffix)."""
    return f"{int(datetime.now().timestamp() * 1000)}{random.randint(100000, 999999)}"

def generate_payment_record():
    """Generates a single payment record."""
    is_success = random.random() < 0.85 # 85% success rate
    gl_response_code, gl_response_status = random.choice(GL_RESPONSES_SUCCESS) if is_success else random.choice(GL_RESPONSES_FAIL)

    transaction_date_dt = datetime.now() - timedelta(
        days=random.randint(0, 90),
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59),
        seconds=random.randint(0, 59)
    )
    # Format: 26 May 2025 17:07:40 +0700 (string for easier display initially, but store as ISODate)
    # We will store as Python datetime, MongoDB will store it as ISODate

    amount_val = round(random.uniform(5.0, 500.0), 2)
    currency_code = random.choice(CURRENCIES)

    bin_num = str(random.randint(100000, 999999))
    last_four = str(random.randint(1000, 9999))

    record = {
        "grabLinkID": generate_grablink_id(),
        "psp": random.choice(PSPS),
        "transactionDate": transaction_date_dt, # Stored as BSON Date
        "scheme": random.choice(SCHEMES),
        "amount": {
            "value": amount_val,
            "currency": currency_code
        },
        "glResponse": {
            "code": gl_response_code,
            "status": f"{gl_response_code} - {gl_response_status}" # Combined for display
        },
        "bin": bin_num,
        "last4": last_four,
        "customerEmail": fake.email(), # Adding some more searchable fields
        "merchantName": fake.company(),
        "transactionType": random.choice(["capture", "authorize", "refund", "void"]),
        "countryCode": random.choice(COUNTRIES)
    }
    return record

def main():
    if not MONGO_URI:
        print("Error: MONGO_URI not found in .env file or environment variables.")
        return

    print(f"Connecting to MongoDB Atlas: {MONGO_URI.split('@')[-1].split('/')[0]}...")
    try:
        client = MongoClient(MONGO_URI)
        db = client[DATABASE_NAME]
        collection = db[COLLECTION_NAME]
        # Test connection
        client.admin.command('ping')
        print("Successfully connected to MongoDB!")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        return

    print(f"Generating {NUM_RECORDS} payment records...")
    records_to_insert = [generate_payment_record() for _ in range(NUM_RECORDS)]

    print(f"Inserting records into '{DATABASE_NAME}.{COLLECTION_NAME}'...")
    try:
        # Clear existing data for a fresh start (optional)
        # collection.delete_many({})
        # print("Cleared existing data from collection.")

        result = collection.insert_many(records_to_insert)
        print(f"Successfully inserted {len(result.inserted_ids)} records.")

        # Optional: Create indexes for better query performance (beyond Atlas Search)
        collection.create_index([("transactionDate", -1)])
        collection.create_index([("psp", 1)])
        collection.create_index([("scheme", 1)])
        print("Created basic indexes.")

    except Exception as e:
        print(f"Error during database operation: {e}")
    finally:
        client.close()
        print("MongoDB connection closed.")

if __name__ == "__main__":
    main()
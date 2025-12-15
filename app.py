import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId, json_util
import json
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

MONGO_URI = os.getenv("MONGO_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME", "links_portal")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "payments")
SEARCH_INDEX_NAME = "default"

try:
    client = MongoClient(MONGO_URI)
    db = client[DATABASE_NAME]
    payments_collection = db[COLLECTION_NAME]
    client.admin.command('ping')
    print("Successfully connected to MongoDB for Flask app!")
except Exception as e:
    print(f"Error connecting to MongoDB for Flask app: {e}")
    exit()

def parse_json(data):
    return json.loads(json_util.dumps(data))

@app.route('/api/payments', methods=['GET'])
def get_payments():
    query_term = request.args.get('q', '')
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 10))
    selected_psp_facets = request.args.getlist('psp')
    selected_scheme_facets = request.args.getlist('scheme')
    selected_status_facets = request.args.getlist('status')
    selected_type_facets = request.args.getlist('type')
    selected_country_facets = request.args.getlist('country')

    skip = (page - 1) * limit

    operator_for_faceting = {}
    compound_must_clauses = []
    compound_filter_clauses = []

    # 1. Handle Text Search Query (query_term)
    if query_term:
        min_chars_for_autocomplete = 3
        # Use autocomplete if it's a single word and meets min length
        # Target fields that have 'autocomplete' type indexing
        use_autocomplete_logic = ' ' not in query_term and len(query_term) >= min_chars_for_autocomplete

        if use_autocomplete_logic:
            app.logger.info(f"Using AUTOCOMPLETE for query_term: {query_term}")
            autocomplete_should_clauses = []
            # Define fields that have autocomplete indexing.
            # The path should be the base field name if the 'autocomplete' type is directly in its array.
            # If you used 'multi' for autocomplete like 'psp.ac', then path would be "psp.ac".
            # Assuming direct autocomplete types for customerEmail, merchantName.
            autocomplete_paths = ["customerEmail", "merchantName", "bin"]
            # If you defined 'psp_autocomplete' via multi (e.g., "psp": {"multi": {"ac": ...}}), use "psp.ac"
            # Or if "psp": [..., {type: "autocomplete", name: "psp_ac"}] use "psp" and it picks the type.
            # For simplicity, let's assume index has direct autocomplete types on these.
            # if your index for psp uses `multi: { ac: { type: "autocomplete" } }`, use path "psp.ac"

            # Example: if psp has a named autocomplete mapping like "psp_ac_version" via array of types
            # autocomplete_paths.append("psp") # Assuming psp's array has an autocomplete type definition.


            for path in autocomplete_paths:
                autocomplete_should_clauses.append({
                    "autocomplete": {
                        "query": query_term,
                        "path": path,
                        "fuzzy": {"maxEdits": 1, "prefixLength": 1}
                    }
                })

            if autocomplete_should_clauses:
                # Match in ANY of the autocomplete fields
                compound_must_clauses.append({"compound": {"should": autocomplete_should_clauses, "minimumShouldMatch": 1}})

        else: # Use text operator for multi-word queries or if not using autocomplete logic
            app.logger.info(f"Using TEXT operator for query_term: {query_term}")
            text_operator_payload = {"query": query_term, "path": {"wildcard": "*"}}
            if len(query_term) >= 3: # Fuzzy for text search only if reasonably long
                text_operator_payload["fuzzy"] = {"maxEdits": 2, "prefixLength": 2}
            compound_must_clauses.append({"text": text_operator_payload})

    # 2. Handle Facet Selections (using 'term' assuming single select per facet type)
    # The 'path' for these 'term' queries should be the base field name
    # if its primary string mapping is lucene.keyword and it has a stringFacet type.
    if selected_psp_facets:
        compound_filter_clauses.append({"term": {"path": "psp", "query": selected_psp_facets[0]}})
    if selected_scheme_facets:
        compound_filter_clauses.append({"term": {"path": "scheme", "query": selected_scheme_facets[0]}})
    if selected_status_facets:
        # Path to the glResponse.status field (assuming its primary is keyword)
        compound_filter_clauses.append({"term": {"path": "glResponse.status", "query": selected_status_facets[0]}})
    if selected_type_facets:
        compound_filter_clauses.append({"term": {"path": "transactionType", "query": selected_type_facets[0]}})
    if selected_country_facets:
        compound_filter_clauses.append({"term": {"path": "countryCode", "query": selected_country_facets[0]}})

    # 3. Construct the final operator for facet.operator
    if compound_must_clauses or compound_filter_clauses:
        compound_query_payload = {}
        if compound_must_clauses:
            compound_query_payload["must"] = compound_must_clauses
        if compound_filter_clauses:
            compound_query_payload["filter"] = compound_filter_clauses
        operator_for_faceting["compound"] = compound_query_payload
    else:
        app.logger.info("No query_term or facet filters, using 'wildcard' for all results.")
        operator_for_faceting["wildcard"] = {
            "path": {"wildcard": "*"}, "query": "*", "allowAnalyzedField": True
        }

    # --- Construct the $search stage ---
    search_stage_definition = {
        "index": SEARCH_INDEX_NAME,
        "facet": {
            "operator": operator_for_faceting,
            "facets": { # Paths here should match how facets are defined in index
                "pspFacet": {"type": "string", "path": "psp", "numBuckets": 10},
                "schemeFacet": {"type": "string", "path": "scheme", "numBuckets": 10},
                "statusFacet": {"type": "string", "path": "glResponse.status", "numBuckets": 10},
                "typeFacet": {"type": "string", "path": "transactionType", "numBuckets": 10},
                "countryFacet": {"type": "string", "path": "countryCode", "numBuckets": 50}
            }
        }
        # "count": {"type": "total"} # Optional
    }

    final_pipeline = [{"$search": search_stage_definition}]

    final_pipeline.extend([
        {"$project": {
            "_id": 1, "grabLinkID": 1, "psp": 1, "transactionDate": 1, "scheme": 1,
            "amount": 1, "glResponse": 1, "bin": 1, "last4": 1,
            "customerEmail": 1, "merchantName": 1, "transactionType": 1, "countryCode": 1,
            "searchMeta": "$$SEARCH_META"
        }},
        {"$facet": {
            "paginatedResults": [
                {"$sort": {"transactionDate": -1}},
                {"$skip": skip},
                {"$limit": limit}
            ],
            "totalCount": [{"$count": "count"}]
        }}
    ])

    app.logger.info(f"---- Final Pipeline ----")
    app.logger.info(json.dumps(final_pipeline, indent=2, default=str))

    try:
        results = list(payments_collection.aggregate(final_pipeline))

        if not results or not results[0]['paginatedResults']:
            app.logger.info("No paginated results found or results structure is empty.")
            return jsonify({"payments": [], "total": 0, "page": page, "limit": limit, "totalPages": 0, "facets": {}})

        payments_data = results[0]['paginatedResults']
        total_count_for_pagination = results[0]['totalCount'][0]['count'] if results[0]['totalCount'] else 0

        search_meta_facets = {}
        if payments_data and 'searchMeta' in payments_data[0] and 'facet' in payments_data[0]['searchMeta']:
            search_meta_facets = payments_data[0]['searchMeta']['facet']

        for doc in payments_data:
            if 'searchMeta' in doc: del doc['searchMeta']

        return jsonify({
            "payments": parse_json(payments_data),
            "total": total_count_for_pagination,
            "page": page, "limit": limit,
            "totalPages": (total_count_for_pagination + limit - 1) // limit if total_count_for_pagination > 0 else 0,
            "facets": parse_json(search_meta_facets)
        })

    except Exception as e:
        app.logger.error(f"Error fetching payments: {e}")
        import traceback
        app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e), "pipeline_sent": json.loads(json_util.dumps(final_pipeline))}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "transactionType": [
        {
          "type": "string",
          "analyzer": "lucene.keyword",
          "indexOptions": "offsets",
          "store": true,
          "norms": "include"
        },
        {
          "type": "stringFacet"
        }
      ],
      "last4": {
        "type": "string",
        "analyzer": "lucene.keyword",
        "indexOptions": "offsets",
        "store": true,
        "norms": "include"
      },
      "amount": {
        "type": "document",
        "dynamic": false,
        "fields": {
          "currency": [
            {
              "type": "string",
              "analyzer": "lucene.keyword",
              "indexOptions": "offsets",
              "store": true,
              "norms": "include"
            },
            {
              "type": "stringFacet"
            }
          ],
          "value": {
            "type": "number",
            "representation": "double",
            "indexDoubles": true,
            "indexIntegers": true
          }
        }
      },
      "scheme": [
        {
          "type": "string",
          "analyzer": "lucene.keyword",
          "indexOptions": "offsets",
          "store": true,
          "norms": "include"
        },
        {
          "type": "stringFacet"
        }
      ],
      "countryCode": [
        {
          "type": "string",
          "analyzer": "lucene.keyword",
          "indexOptions": "offsets",
          "store": true,
          "norms": "include"
        },
        {
          "type": "stringFacet"
        }
      ],
      "bin": [
        {
          "type": "autocomplete",
          "minGrams": 3,
          "maxGrams": 6,
          "foldDiacritics": true,
          "tokenization": "edgeGram",
          "analyzer": "lucene.keyword"
        },
        {
          "type": "string",
          "analyzer": "lucene.keyword",
          "indexOptions": "offsets",
          "store": true,
          "norms": "include"
        }
      ],
      "customerEmail": [
        {
          "type": "autocomplete",
          "minGrams": 3,
          "maxGrams": 15,
          "foldDiacritics": true,
          "tokenization": "edgeGram",
          "analyzer": "lucene.standard"
        },
        {
          "type": "string",
          "analyzer": "lucene.standard",
          "indexOptions": "offsets",
          "store": true,
          "norms": "include"
        }
      ],
      "grabLinkID": [
        {
          "type": "autocomplete",
          "minGrams": 3,
          "maxGrams": 20,
          "foldDiacritics": true,
          "tokenization": "edgeGram",
          "analyzer": "lucene.keyword"
        },
        {
          "type": "string",
          "analyzer": "lucene.keyword",
          "indexOptions": "offsets",
          "store": true,
          "norms": "include"
        }
      ],
      "glResponse": {
        "type": "document",
        "dynamic": false,
        "fields": {
          "code": {
            "type": "number",
            "representation": "double",
            "indexDoubles": true,
            "indexIntegers": true
          },
          "status": [
            {
              "type": "string",
              "analyzer": "lucene.keyword",
              "indexOptions": "offsets",
              "store": true,
              "norms": "include"
            },
            {
              "type": "stringFacet"
            }
          ]
        }
      },
      "psp": [
        {
          "type": "string",
          "analyzer": "lucene.keyword",
          "indexOptions": "offsets",
          "store": true,
          "norms": "include"
        },
        {
          "type": "stringFacet"
        }
      ],
      "transactionDate": {
        "type": "date"
      },
      "merchantName": [
        {
          "type": "autocomplete",
          "minGrams": 3,
          "maxGrams": 20,
          "foldDiacritics": true,
          "tokenization": "edgeGram",
          "analyzer": "lucene.standard"
        },
        {
          "type": "string",
          "analyzer": "lucene.standard",
          "indexOptions": "offsets",
          "store": true,
          "norms": "include"
        }
      ]
    }
  }
}
from flask import Flask
from flask_cors import CORS
import os

app = Flask(__name__, static_folder="../geoguessr_analyzer/dist", static_url_path="/")
CORS(
 app,
 resources={
  r"/*": {
   "origins": "*",
   "methods": [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
   ],
   "allow_headers": [
    "Content-Type",
    "Authorization",
   ],
  }
 },
)

from . import routes
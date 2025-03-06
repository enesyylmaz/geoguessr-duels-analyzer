import requests
import json
from typing import List, Dict, Optional, Any
from concurrent.futures import ThreadPoolExecutor
from .constants import country_codes, app_state

def get_user_id(auth_token: str) -> Optional[str]:
    base_url = "https://www.geoguessr.com/api/v3/profiles"
    headers = {
        "Cookie": f"_ncfa={auth_token}",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    try:
        response = requests.get(base_url, headers=headers)
        response.raise_for_status()
        data = response.json()
        return data.get("user").get("id")
    except:
        return None

def fetch_all_duel_ids(auth_token: str) -> List[str]:
    app_state.progress["status"] = "fetching_duel_ids"
    app_state.progress["message"] = "Starting to fetch duel IDs..."
    
    base_url = "https://www.geoguessr.com/api/v4/feed/private"
    headers = {
        "Cookie": f"_ncfa={auth_token}",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    all_duel_ids = []
    pagination_token = None
    page_count = 0

    while True:
        url = base_url
        if pagination_token:
            url = f"{base_url}?paginationToken={pagination_token}"
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()

            page_count += 1
            app_state.progress["message"] = f"Processing page {page_count}..."
            
            duel_ids_from_page = extract_duel_ids(data)
            all_duel_ids.extend(duel_ids_from_page)
            
            if "paginationToken" in data and data["paginationToken"]:
                pagination_token = data["paginationToken"]
            else:
                app_state.progress["message"] = f"Found {len(all_duel_ids)} total duel IDs across {page_count} pages"
                break

        except requests.exceptions.RequestException as e:
            app_state.progress["message"] = f"Error fetching data: {e}"
            break

    return all_duel_ids

def extract_duel_ids(feed_data: Dict[str, Any]) -> List[str]:
    duel_ids = []

    if "entries" not in feed_data:
        return duel_ids

    for entry in feed_data["entries"]:
        if "type" in entry and "payload" in entry:
            payload = entry["payload"]
            if isinstance(payload, str):
                try:
                    try:
                        payload_items = json.loads(payload)
                        if isinstance(payload_items, list):
                            for item in payload_items:
                                if "type" in item and "payload" in item:
                                    item_payload = item["payload"]
                                    if "gameMode" in item_payload and item_payload.get("gameMode") == "Duels" and item_payload.get("competitiveGameMode") in ["NoMoveDuels", "StandardDuels", "NmpzDuels"]:
                                        game_id = item_payload.get("gameId")
                                        if game_id:
                                            duel_ids.append(game_id)
                        elif isinstance(payload_items, dict):
                            if "gameMode" in payload_items and payload_items.get("gameMode") == "Duels" and payload_items.get("competitiveGameMode") in ["NoMoveDuels", "StandardDuels", "NmpzDuels"]:
                                game_id = payload_items.get("gameId")
                                if game_id:
                                    duel_ids.append(game_id)
                    except json.JSONDecodeError:
                        continue
                except Exception as e:
                    continue

    return duel_ids

def fetch_duel_threaded(duel_id, auth_token):
    import time
    
    base_url = "https://game-server.geoguessr.com/api/duels"
    url = f"{base_url}/{duel_id}"
    headers = {
        "Cookie": f"_ncfa={auth_token}",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    max_retries = 10
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            time.sleep(0.2)
            
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200 or attempt == max_retries - 1:
                app_state.progress["current"] += 1
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 429:
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                    retry_delay *= 2
                    continue
            
            if attempt == max_retries - 1:
                return {"duel_id": duel_id, "error": f"Status code: {response.status_code}"}
        except Exception as e:
            if attempt == max_retries - 1:
                app_state.progress["current"] += 1
                return {"duel_id": duel_id, "error": str(e)}
    
    app_state.progress["current"] += 1
    return {"duel_id": duel_id, "error": "Maximum retries exceeded"}

def fetch_all_duels_threaded(duel_ids, auth_token, max_workers=15):
    results = []
    app_state.progress["current"] = 0
    app_state.progress["total"] = len(duel_ids)
    app_state.progress["status"] = "fetching_duels"
    app_state.progress["message"] = "Fetching duel data..."
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(fetch_duel_threaded, duel_id, auth_token) for duel_id in duel_ids]

        for future in futures:
            results.append(future.result())

    return results

def analyze_geoguessr_duels(duel_data, user_id, country_codes):
    app_state.progress["current"] = 0
    app_state.progress["total"] = len(duel_data)
    app_state.progress["status"] = "analyzing"
    app_state.progress["message"] = "Analyzing duel data..."
    
    country_dict = {}

    for data in duel_data:
        app_state.progress["current"] += 1
        
        if not isinstance(data, dict) or "rounds" not in data:
            continue
            
        rounds = data.get("rounds")
        country_list = []
        for round in rounds:
            if "panorama" in round and "countryCode" in round.get("panorama", {}):
                country = round.get("panorama").get("countryCode")
                country_list.append(country.lower())

        teams = data.get("teams")
        for team in teams:
            if "players" in team and len(team.get("players")) > 0 and "playerId" in team.get("players")[0]:
                if team.get("players")[0].get("playerId") == user_id:
                    guesses = team.get("players")[0].get("guesses")
                    for guess_num in range(len(guesses)):
                        if guess_num >= len(country_list):
                            continue

                        guess = guesses[guess_num]
                        score = team.get("roundResults")[guess_num].get("score", 0)
                        distance = guess.get("distance")

                        country_code = country_list[guess_num]
                        if country_code not in country_dict:
                            country_dict[country_code] = {
                                "count": 0,
                                "score": 0,
                                "distance": 0,
                                "name": country_codes.get(country_code, "Unknown")
                            }

                        country_dict[country_code]["count"] += 1
                        
                        if score is not None:
                            country_dict[country_code]["score"] += score
                        if distance is not None:
                            country_dict[country_code]["distance"] += distance

    final_data = []
    for code, data in country_dict.items():
        if data["count"] > 0:
            avg_score = data["score"] / data["count"]
            avg_distance = data["distance"] / data["count"] if data["distance"] > 0 else 0
            final_data.append({
                "countryCode": code,
                "countryName": data["name"],
                "count": data["count"],
                "avgScore": avg_score,
                "totalScore": data["score"],
                "avgDistance": avg_distance,
                "totalDistance": data["distance"]
            })
            
            
    final_data.sort(key=lambda x: x["count"], reverse=True)
    
    app_state.progress["status"] = "complete"
    app_state.progress["message"] = "Analysis complete!"
    
    return final_data

def process_geoguessr_data(auth_token):
    app_state.progress["status"] = "starting"
    app_state.progress["message"] = "Starting data processing..."
    
    try:
        user_id = get_user_id(auth_token)
        if not user_id:
            app_state.progress["status"] = "error"
            app_state.progress["message"] = "Failed to get user ID"
            return None
            
        duel_ids = fetch_all_duel_ids(auth_token)
        if not duel_ids:
            app_state.progress["status"] = "error"
            app_state.progress["message"] = "No duel IDs found"
            return None
            
        duel_data = fetch_all_duels_threaded(duel_ids, auth_token, max_workers=15)
        result = analyze_geoguessr_duels(duel_data, user_id, country_codes)

        app_state.analysis_results = result
        return result
    except Exception as e:
        app_state.progress["status"] = "error"
        app_state.progress["message"] = f"Error: {str(e)}"
        return None
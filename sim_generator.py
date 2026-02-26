import json
import time
import random
import requests
import re
import os
import base64
import string
from datetime import datetime

# --- CONFIGURATION ---
OLLAMA_URL = "http://localhost:11434/api/generate"
SD_URL = "http://127.0.0.1:7860/sdapi/v1/txt2img"
MODEL_NAME = "gemma3:4b"
LEDGER_FILE = "./simulated_twirvo_ledger.txt"
SD_OUTPUT_DIR = "public/simulated_user_pfps" 
IMG_LINK_PREFIX = "/simulated_user_pfps/" 

SLEEP_INTERVAL = 0 

# --- MEMORY ARRAYS ---
last_commented_sigs = [] 
recent_wallets = [] 

# --- OPTIMISTIC GRAVEYARD PROMPTS (POSTS) ---
POST_VARIATIONS = [
    "Write an excited post about breathing new life into a forgotten dApp on Solana.",
    "Write a poetic thought about how every line of code is a seed growing in this digital garden.",
    "Write a high-energy post about the adrenaline of a 48-hour hackathon sprint.",
    "Write an upbeat observation about the beautiful neon glow of a confirmed transaction in the dark.",
    "Write a friendly tip about how to optimize SPL memos for maximum protocol efficiency.",
    "Write a post celebrating a 'bug' that actually turned into a cool unintended feature.",
    "Write a visionary thought about building social monuments that will outlast us all.",
    "Write a short, punchy post about the incredible 0.4s block time 'heartbeat' of the network.",
    "Write a creative post about 'mining' for hidden gems in the graveyard of old repos.",
    "Write a welcoming message to the new wave of developers joining the Graveyard hackathon.",
    "Write a humorous post about a ghost developer finally getting their code to compile.",
    "Write an optimistic rant about why the future of social media is permanent and on-chain.",
    "Write a 'eureka' moment post about discovering a lost utility in the ledger.",
    "Write a short, hype-filled post about the vibrant blue and teal aesthetic of the protocol.",
    "Write a philosophical but happy thought about data having an 'afterlife' that never ends.",
    "Write a shoutout to the Solana validators keeping our digital world alive and spinning.",
    "Write a post about the 'magic' of seeing a nested thread grow like a tree of knowledge.",
    "Write an encouraging message to someone stuck on a smart contract bug.",
    "Write a celebratory post about 'etching' a legacy into the cluster that can't be erased.",
    "Write a final, glowing invitation for more hackers to join the revival movement."
]

# --- IDENTITY & LEDGER HELPERS ---

def get_current_timestamp():
    now_ms = int(time.time() * 1000)
    offset = random.randint(-21600000, 21600000)
    return now_ms + offset

def generate_random_solana_wallet():
    base58_chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
    return "".join(random.choice(base58_chars) for _ in range(44))

def get_next_ledger_index():
    if not os.path.exists(LEDGER_FILE): return 0
    with open(LEDGER_FILE, 'r', encoding='utf-8') as f:
        return sum(1 for _ in f)

def generate_dynamic_username(seed):
    """STRICT name generation to prevent conversational filler."""
    prefixes = ["Neon", "Aura", "Pulse", "Spark", "Flux", "Core", "Coda", "Nova", "Zenith", "Ether"]
    suffixes = ["Hacker", "Weaver", "Resurrect", "Smith", "Node", "Bloom", "Sprite", "Walker", "Oracle"]
    base = f"{random.choice(prefixes)}{random.choice(suffixes)}"
    
    system_context = (
        "STRICT RULE: Output ONLY the username. DO NOT provide thoughts. DO NOT say 'Okay' or 'Here is'. "
        "DO NOT use 'Solana' as a prefix. Just the handle."
    )
    prompt = (f"{system_context} Using seed '{seed[:3]}', generate ONE unique, short, "
              f"optimistic hacker handle based on the idea '{base}'.")
    
    try:
        res = requests.post(OLLAMA_URL, json={"model": MODEL_NAME, "prompt": prompt, "stream": False}).json().get("response", "").strip()
        # Grab only the first line/word to be safe
        clean = re.sub(r'[^a-zA-Z0-9_]', '', res.split('\n')[0].split(' ')[-1])
        return clean[:15] if (clean and len(clean) > 3) else f"{base}_{seed[:2]}"
    except: return f"{base}_{seed[:2]}"

def generate_hacker_bio(username):
    """STRICT bio generation to prevent filler."""
    system_context = "STRICT RULE: Output ONLY the bio text. NO intro, NO conversational filler, NO thought process."
    prompt = (f"{system_context} Write an optimistic 1-sentence bio for {username} (Solana hackathon dev). "
              "Focus on resurrecting code. Max 80 characters.")
    try:
        res = requests.post(OLLAMA_URL, json={"model": MODEL_NAME, "prompt": prompt, "stream": False}).json().get("response", "").strip()
        clean = res.split('\n')[0].replace('"', '').strip()
        return clean[:100]
    except: return "Resurrecting utilities and building the future. ⚡"

# --- IMAGE GENERATION ---

def generate_sd_profile_picture(username):
    if not os.path.exists(SD_OUTPUT_DIR): os.makedirs(SD_OUTPUT_DIR)
    scenes = [
        "cool neon hacker reaper with a glowing green laptop", 
        "ethereal ghost developer weaving glowing blockchain strands", 
        "undead skeleton in cyberpunk gear celebrating a code fix", 
        "phantom hacker projecting a vibrant 3D holographic solana logo"
    ]
    prompt = f"bluegreentealpurplecyangradientcolors, {random.choice(scenes)}, 2d vector art, flat design, masterpiece, vibrant lighting"
    payload = {"prompt": prompt, "negative_prompt": "photorealistic, 3d, text, watermark, bleak, depressing", "steps": 25, "width": 256, "height": 256, "sampler_name": "Euler a"}
    try:
        response = requests.post(SD_URL, json=payload, timeout=45)
        img_data = response.json()['images'][0]
        filename = f"pfp_{username}_{datetime.now().strftime('%H%M%S')}.png"
        save_path = os.path.join(SD_OUTPUT_DIR, filename)
        with open(save_path, 'wb') as f: f.write(base64.b64decode(img_data))
        return f"{IMG_LINK_PREFIX}{filename}"
    except: return f"{IMG_LINK_PREFIX}default_SH_SU_PFP.png"

# --- CHAOS POST GENERATION ---

def generate_ollama_post(username):
    global last_commented_sigs
    try:
        system_context = "STRICT RULE: Respond ONLY with the post content inside curly brackets {}. NO narration. NO side-talk."
        
        if random.random() < 0.30:
            parent = get_random_post_from_ledger()
            if parent:
                sig = parent['tx_sig']
                last_commented_sigs.append(sig)
                if len(last_commented_sigs) > 50: last_commented_sigs.pop(0)
                
                reply_prompt = (f"{system_context} Write a friendly, optimistic, short reply to: '{parent['text']}'. "
                                "Focus on building together. MAX 150 CHARS. Wrap in {}.")
                res = requests.post(OLLAMA_URL, json={"model": MODEL_NAME, "prompt": reply_prompt, "stream": False}, timeout=60).json().get("response", "").strip()
                match = re.search(r'\{([\s\S]*?)\}', res)
                return {"type": "post_comment", "text": (match.group(1).strip() if match else res)[:200], "parent_post": sig}

        base_instruction = random.choice(POST_VARIATIONS)
        final_prompt = (f"{system_context} {base_instruction} Keep it gritty but EXTREMELY OPTIMISTIC. "
                        "MAX 150 CHARS. Wrap in {}. No hashtags.")
        res = requests.post(OLLAMA_URL, json={"model": MODEL_NAME, "prompt": final_prompt, "stream": False}, timeout=60).json().get("response", "").strip()
        match = re.search(r'\{([\s\S]*?)\}', res)
        return {"type": "post", "text": (match.group(1).strip() if match else res)[:200], "parent_post": None}

    except Exception: return {"type": "post", "text": "Building a brighter future on-chain! ⚡", "parent_post": None}

def get_random_post_from_ledger():
    posts = []
    if not os.path.exists(LEDGER_FILE): return None
    with open(LEDGER_FILE, 'r') as f:
        for index, line in enumerate(f):
            try:
                data = json.loads(line)
                if data.get("type") == "post":
                    sig = f"sim_{data.get('timestamp')}_{index}"
                    if sig not in last_commented_sigs:
                        posts.append({"tx_sig": sig, "text": data.get("text")})
            except: continue
    return random.choice(posts) if posts else None

def write_to_ledger(tx_data):
    os.makedirs(os.path.dirname(LEDGER_FILE), exist_ok=True)
    with open(LEDGER_FILE, 'a', encoding='utf-8') as f:
        f.write(json.dumps(tx_data) + "\n")

def get_simulated_userbase():
    userbase = []
    seen = set()
    if not os.path.exists(LEDGER_FILE): return []
    with open(LEDGER_FILE, 'r') as f:
        for line in f:
            try:
                d = json.loads(line)
                if d.get("type") == "username_set" and d.get("wallet") not in seen:
                    userbase.append({"username": d.get("text"), "wallet": d.get("wallet")})
                    seen.add(d.get("wallet"))
            except: continue
    return userbase

# --- MAIN ---

def main():
    global recent_wallets
    print("--- TWIRVO GRAVEYARD REVIVAL (HARDENED) OPERATOR ONLINE ---")
    while True:
        userbase = get_simulated_userbase()
        available_users = [u for u in userbase if u['wallet'] not in recent_wallets]

        if available_users and random.random() < 0.45:
            selected_user = random.choice(available_users)
            username, wallet = selected_user["username"], selected_user["wallet"]
            print(f"\n[REUSE] Operator: {username}")
        else:
            seed = "".join(random.choice(string.ascii_letters) for _ in range(5))
            username = generate_dynamic_username(seed)
            wallet = generate_random_solana_wallet()
            print(f"\n[NEW] Operator Generated: {username}")
            
            ts = get_current_timestamp()
            write_to_ledger({"tx_sig": f"sim_{ts}_{get_next_ledger_index()}", "wallet": wallet, "protocol": "twirvo_v1", "type": "username_set", "text": username, "timestamp": ts})
            write_to_ledger({"tx_sig": f"sim_{ts+1}_{get_next_ledger_index()}", "wallet": wallet, "protocol": "twirvo_v1", "type": "profile_bio_set", "text": generate_hacker_bio(username), "timestamp": ts+1})
            write_to_ledger({"tx_sig": f"sim_{ts+2}_{get_next_ledger_index()}", "wallet": wallet, "protocol": "twirvo_v1", "type": "profile_picture_set", "text": generate_sd_profile_picture(username), "timestamp": ts+2})
            time.sleep(1)

        recent_wallets.append(wallet)
        if len(recent_wallets) > 10: recent_wallets.pop(0)

        post_data = generate_ollama_post(username)
        ts_post = get_current_timestamp()
        
        ledger_entry = {
            "tx_sig": f"sim_{ts_post}_{get_next_ledger_index()}",
            "wallet": wallet, "protocol": "twirvo_v1", 
            "type": post_data["type"], "text": post_data["text"], 
            "timestamp": ts_post
        }
        if post_data.get("parent_post"): ledger_entry["parent_post"] = post_data["parent_post"]
            
        write_to_ledger(ledger_entry)
        print(f" >>> Committed '{post_data['type']}' for {username}")
        time.sleep(SLEEP_INTERVAL)

if __name__ == "__main__":
    main()
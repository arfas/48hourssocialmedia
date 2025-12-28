# PocketBase Setup Guide

PocketBase is a **completely free, open-source backend** that you can self-host. No paid plans ever!

## Quick Start

### Step 1: Download PocketBase

1. Go to https://pocketbase.io
2. Download the version for your OS (Windows, Mac, or Linux)
3. Extract the ZIP file to a folder

### Step 2: Start PocketBase Server

**Windows:**
```bash
# Navigate to the PocketBase folder and run:
./pocketbase serve
```

**Mac/Linux:**
```bash
chmod +x pocketbase
./pocketbase serve
```

You should see:
```
Starting PocketBase server at http://127.0.0.1:8090
```

### Step 3: Create Database Collections

1. Go to http://localhost:8090/_/ (admin panel)
2. Login (first time = auto-create admin account)
3. Create 3 collections: **users**, **matches**, **messages**

### Users Collection

Click "+" → Create new collection → Name: `users`

Add these fields:
- `name` (Text, Required)
- `vibe` (Text, Required)
- `interests` (JSON array)
- `communication_style` (Text, Required)
- `is_matched` (Boolean, default=false)

### Matches Collection

Click "+" → Create new collection → Name: `matches`

Add these fields:
- `user1_id` (Text, Required)
- `user2_id` (Text, Required)
- `expires_at` (DateTime, Required)
- `is_active` (Boolean, default=true)

### Messages Collection

Click "+" → Create new collection → Name: `messages`

Add these fields:
- `match_id` (Text, Required)
- `sender_id` (Text, Required)
- `content` (Text, Required)

### Step 4: Update Security Rules (Optional but Recommended)

For each collection, go to **API rules** tab and set:

```
@request.auth.id != "" 
```

(This allows any requests - good for development)

### Step 5: Install Dependencies

```bash
npm install
```

### Step 6: Start the App

```bash
npm run dev
```

The app will connect to PocketBase at http://localhost:8090

---

## Using the App

1. Open http://localhost:5173/
2. Fill out onboarding (name, vibe, interests, communication style)
3. Click "Find a Friend"
4. Start chatting! (48 hour friendship timer)

---

## Deploying PocketBase to Production

When you want to deploy, you can:

**Option 1: Railway (Free + Paid)**
- Deploy PocketBase in 1 click
- Free tier: 5GB storage
- https://railway.app

**Option 2: Render (Free + Paid)**
- Deploy PocketBase for free
- Includes free tier with limitations
- https://render.com

**Option 3: VPS (Cheapest)**
- Use DigitalOcean, Linode, AWS EC2
- Deploy PocketBase binary
- $5-10/month

---

## Troubleshooting

### "Connection refused" error

**Problem:** PocketBase server isn't running

**Solution:**
1. Make sure you ran `./pocketbase serve` in a terminal
2. Check that it's running on http://localhost:8090
3. Restart the dev server: press `r` then Enter

### Collections don't exist

**Problem:** You didn't create the collections yet

**Solution:**
1. Go to http://localhost:8090/_/
2. Click "Collections"
3. Create: users, matches, messages
4. Add the required fields listed above

### Data not saving

**Problem:** API rules might be too restrictive

**Solution:**
1. Go to each collection → API rules
2. Set rule to: `@request.auth.id != ""`
3. Save

---

## Free Forever ✅

PocketBase is completely free:
- No subscription required
- No hidden costs
- Open source (MIT license)
- Self-hosted on your own server
- Full control of your data

Perfect for hobby projects, learning, and production use!

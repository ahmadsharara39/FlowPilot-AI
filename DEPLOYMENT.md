# 🚀 Deploying FlowPilot AI

FlowPilot AI is a two-part app. Deploy the pieces to the hosts they fit best:

| Part | Host | Why |
|------|------|-----|
| **Backend** (FastAPI) + **PostgreSQL** | **Render** | Long-running server + managed Postgres. Free tier. |
| **Frontend** (React/Vite static build) | **Vercel** | First-class Vite hosting + global CDN. Free tier. |

> Vercel can't run the backend — it only hosts stateless functions and has no
> managed database. That's why the API lives on Render.

Deploy the **backend first** (you need its URL for the frontend), then the frontend,
then connect them.

---

## Part 1 — Backend + database on Render

1. Go to <https://render.com> and sign up (log in with GitHub).
2. Click **New +** → **Blueprint**.
3. Select the **FlowPilot-AI** repo. Render reads [`render.yaml`](render.yaml) and
   proposes a web service **flowpilot-api** + a Postgres database **flowpilot-db**.
4. Click **Apply**. Render will:
   - create the database,
   - install `apps/api/requirements.txt`,
   - start `uvicorn app.main:app` (tables auto-create on first boot),
   - generate a strong `SECRET_KEY` and wire `DATABASE_URL` automatically.
5. When it's live, note the URL, e.g. `https://flowpilot-api.onrender.com`.
   Test it: open `https://flowpilot-api.onrender.com/api/health` → should return JSON.

> **Free-tier note:** the service sleeps after ~15 min idle, so the first request
> after a nap takes ~30–60s to wake. Fine for a demo.

**(Optional) real AI:** in the service's **Environment** tab set `AI_PROVIDER=anthropic`
(or `openai`) and add `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`. Otherwise it runs the
built-in mock AI.

---

## Part 2 — Frontend on Vercel

1. Go to <https://vercel.com> and sign up (log in with GitHub).
2. **Add New… → Project** → import **FlowPilot-AI**.
3. Configure:
   - **Root Directory**: `apps/web`  ← important (monorepo)
   - Framework preset: **Vite** (auto-detected)
   - Build command / output: leave defaults (`npm run build` → `dist`)
4. Add an **Environment Variable**:
   - `VITE_API_BASE_URL` = `https://flowpilot-api.onrender.com/api`
     (your Render URL from Part 1, **with `/api` on the end**)
5. Click **Deploy**. You'll get a URL like `https://flow-pilot-ai.vercel.app`.

---

## Part 3 — Connect them (CORS)

The browser will block cross-origin calls until the backend allows your Vercel domain.

1. In **Render** → flowpilot-api → **Environment**, set:
   - `CORS_ORIGINS` = `https://flow-pilot-ai.vercel.app`
     (your exact Vercel production URL; comma-separate multiples)
2. Save — Render redeploys automatically.

Now open your Vercel URL, register an account, and build a workflow. 🎉

---

## Redeploys

Both hosts auto-deploy on every push to `main`:

```bash
git add -A && git commit -m "your change" && git push
```

Render rebuilds the API; Vercel rebuilds the web app.

---

## Seeding demo data in production (optional)

Render's free plan has no shell, so run the seed against the production DB from your
machine (grab the **External Database URL** from the Render database page):

```bash
cd apps/api
DATABASE_URL="postgresql+psycopg://USER:PASS@HOST/DB" python ../../scripts/seed_demo.py
```

Or just register a fresh account in the UI and click **Run Demo Workflow** — it
creates the demo workflow on the fly.

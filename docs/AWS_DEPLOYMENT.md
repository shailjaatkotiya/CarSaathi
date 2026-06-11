# Deploying Carthi to AWS — Docker, RDS, Redis, GitHub Actions CI/CD

Production setup on the AWS Free Tier / Free Plan:

```
GitHub push to master
   │
   ├─► CI (ci.yml): backend compile + import + alembic migrations on fresh Postgres,
   │                frontend tsc/vite build, docker image builds
   │
   └─► Deploy (deploy.yml):
         build images ──► push to ECR ──► SSH to EC2 ──► compose pull + up -d

EC2 t3.micro (Docker host)                      RDS PostgreSQL (db.t4g.micro)
 ├── frontend  : Nginx + static build :80  ──┐    separate instance, private,
 ├── backend   : FastAPI/uvicorn :8000 ◄─────┘    reachable only from EC2 SG
 └── redis     : ride-search cache (container)
```

Cost decisions:
- **RDS** `db.t4g.micro` — separate DB instance as required; free-tier eligible (750 hrs/mo on legacy accounts, covered by credits on new Free Plan accounts).
- **Redis as a container on EC2** — ElastiCache has *no* free tier (`cache.t4g.micro` ≈ $12+/mo). A `redis:7-alpine` container costs nothing and the app degrades gracefully if it's down. Swap `REDIS_URL` to an ElastiCache endpoint later without code changes.
- **ECR** — 500 MB private storage free; enough for these two images if you let old tags expire (lifecycle rule below).

> **Free Tier note (accounts created after July 15, 2025):** new accounts get a credit-based Free Plan ($100 credits + up to $100 more from activities, 6 months). The whole stack here ≈ $20–25/mo — covered, but set the billing alarm in Step 8 and a calendar reminder for credit expiry.

---

## Step 0 — What's already in the repo

| File | Purpose |
|---|---|
| `backend/Dockerfile` | Python 3.12 image; runs `alembic upgrade head` then uvicorn |
| `frontend/Dockerfile` | Node 22 build → Nginx serving `dist/`, proxying `/api` |
| `frontend/nginx.conf` | SPA fallback, API proxy, gzip, asset caching |
| `docker-compose.yml` | Local dev stack (Postgres + Redis + backend + frontend) |
| `docker-compose.prod.yml` | EC2 stack (Redis + backend + frontend; DB = RDS) |
| `.github/workflows/ci.yml` | Tests every PR/push |
| `.github/workflows/deploy.yml` | Builds → ECR → deploys to EC2 on master push |
| `backend/app/core/cache.py` | Redis ride-search cache; no-op when `REDIS_URL` empty |

Local dev: `docker compose up --build` → app at `http://localhost:8080`.

## Step 1 — VPC security groups

Console → EC2 → Security Groups (default VPC is fine):

1. **`carthi-ec2-sg`** — inbound: SSH 22, HTTP 80 from 0.0.0.0/0, HTTPS 443 from 0.0.0.0/0.
   SSH 22 must admit GitHub-hosted runners (changing IPs), so either leave it 0.0.0.0/0 with key-only auth (password auth is disabled on Ubuntu AMIs by default), or tighten later by switching the deploy step to AWS SSM `send-command` and closing 22 entirely.
2. **`carthi-rds-sg`** — inbound: PostgreSQL 5432, source = **`carthi-ec2-sg`** (the security group, not an IP). DB is reachable only from the app host.

## Step 2 — RDS PostgreSQL (separate DB instance)

Console → RDS → Create database:

- **Engine:** PostgreSQL 16, **Templates:** Free tier (or Dev/Test, Single-AZ)
- **Instance:** `db.t4g.micro`, storage 20 GiB gp3, **disable** storage autoscaling
- **DB identifier:** `carthi-db`; master user `carthi`, strong password
- **Connectivity:** default VPC, **Public access: No**, security group `carthi-rds-sg`
- **Initial database name:** `carthi`
- Disable Performance Insights / Enhanced Monitoring (cost)

Note the endpoint, e.g. `carthi-db.xxxx.ap-south-1.rds.amazonaws.com`. The
`DATABASE_URL` becomes:

```
postgresql+psycopg2://carthi:PASSWORD@carthi-db.xxxx.ap-south-1.rds.amazonaws.com:5432/carthi
```

## Step 3 — ECR repositories

```bash
aws ecr create-repository --repository-name carthi-backend
aws ecr create-repository --repository-name carthi-frontend
```

(Or Console → ECR → Create repository, private, names exactly `carthi-backend` / `carthi-frontend` — the deploy workflow uses these names.)

Add a lifecycle rule to each repo: *expire untagged images after 7 days* and *keep last 5 tagged images* — keeps you inside the 500 MB free storage.

## Step 4 — IAM

Two identities:

1. **GitHub Actions user** (pushes images): IAM → Users → `carthi-github-actions`, no console access, attach policy `AmazonEC2ContainerRegistryPowerUser`. Create access key → note `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`.
2. **EC2 instance role** (pulls images, no keys on the box): IAM → Roles → Create role → AWS service → EC2 → attach `AmazonEC2ContainerRegistryReadOnly` → name `carthi-ec2-role`.

## Step 5 — EC2 instance

Launch instance:

- Ubuntu Server 24.04 LTS, `t3.micro`, key pair `carthi-key`
- Security group: `carthi-ec2-sg`; Storage: 20 GiB gp3
- **Advanced → IAM instance profile:** `carthi-ec2-role`

Allocate an **Elastic IP** and associate it. Then SSH in and prepare the host:

```bash
ssh -i carthi-key.pem ubuntu@<ELASTIC_IP>

# swap — 1 GB RAM instance
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Docker + compose plugin
sudo apt update && sudo apt -y install docker.io docker-compose-v2 awscli
sudo usermod -aG docker ubuntu
newgrp docker

# deploy directory
sudo mkdir -p /opt/carthi && sudo chown ubuntu:ubuntu /opt/carthi
```

Create `/opt/carthi/docker-compose.prod.yml` (copy from the repo) and `/opt/carthi/.env`:

```bash
cat > /opt/carthi/.env <<'EOF'
BACKEND_IMAGE=<ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/carthi-backend:latest
FRONTEND_IMAGE=<ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/carthi-frontend:latest

ENVIRONMENT=production
DATABASE_URL=postgresql+psycopg2://carthi:PASSWORD@carthi-db.xxxx.<REGION>.rds.amazonaws.com:5432/carthi
JWT_SECRET_KEY=<openssl rand -hex 32>
CORS_ORIGINS=http://<ELASTIC_IP>
PUBLIC_API_BASE_URL=http://<ELASTIC_IP>/api/v1
RIDE_SEARCH_CACHE_TTL=30
WHATSAPP_PROVIDER=mock
EOF
chmod 600 /opt/carthi/.env
```

`REDIS_URL` is injected by the compose file (`redis://redis:6379/0`) — don't set it in `.env`.

Verify RDS reachability: `nc -zv carthi-db.xxxx.<REGION>.rds.amazonaws.com 5432` (install `netcat-openbsd` if needed).

## Step 6 — GitHub repository secrets

Repo → Settings → Secrets and variables → Actions:

| Secret | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | from the `carthi-github-actions` IAM user |
| `AWS_SECRET_ACCESS_KEY` | from the same user |
| `AWS_REGION` | e.g. `ap-south-1` |
| `EC2_HOST` | Elastic IP |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | full contents of `carthi-key.pem` |

## Step 7 — First deploy

Push to `master` (or Actions → Deploy → Run workflow). The pipeline:

1. **CI** — backend compiles, imports, and migrations run against a throwaway Postgres; frontend type-checks and builds; both Docker images build.
2. **Deploy** — images pushed to ECR tagged `latest` + commit SHA (SHA tags = rollback points), then SSH to EC2: ECR login via instance role, `compose pull`, `up -d`.

First boot: backend runs `alembic upgrade head` against RDS, then the app's startup hook seeds demo data. Open `http://<ELASTIC_IP>` — done.

Rollback: edit `/opt/carthi/.env` to pin a SHA tag (`carthi-backend:<sha>`), `docker compose -f docker-compose.prod.yml up -d`.

## Step 8 — Billing guardrails

- Billing → Budgets → **zero-spend budget** with email alert (most important step on a free account).
- ECR lifecycle rules from Step 3 (image storage is the silent cost).
- RDS: confirm Single-AZ, no Performance Insights, no autoscaling.
- Elastic IP is free only while attached to a *running* instance.

## Step 9 — HTTPS (recommended)

A certificate needs a domain — two free-friendly paths:

- **Cloudflare (easiest):** add your domain to Cloudflare free plan, A record → Elastic IP, proxy ON, SSL mode "Flexible" (or "Full" once you add a cert on the origin). TLS terminates at Cloudflare; zero changes on EC2.
- **Certbot on the host:** stop the frontend container's port binding, run certbot standalone for the cert, then mount `/etc/letsencrypt` into the frontend container with an SSL-enabled nginx conf and publish 443.

Either way, update in `/opt/carthi/.env`: `CORS_ORIGINS=https://yourdomain.com`, `PUBLIC_API_BASE_URL=https://yourdomain.com/api/v1`, then `docker compose -f docker-compose.prod.yml up -d backend`.

## Scaling path (when traffic grows)

Already in place: stateless backend (JWT, no server sessions), separate DB, Redis cache with graceful degradation, container images. Next steps in order:

1. Raise `WEB_CONCURRENCY` (uvicorn workers) on a bigger instance.
2. Move Redis to ElastiCache (`REDIS_URL` change only).
3. Second EC2 instance + Application Load Balancer (paid: ~$16+/mo) or migrate containers to ECS Fargate.
4. Frontend to S3 + CloudFront (takes static traffic off the instance entirely).

## Troubleshooting

| Symptom | Check |
|---|---|
| Deploy job fails at SSH | `EC2_SSH_KEY` secret is the full `.pem` contents; port 22 open to GitHub runners (0.0.0.0/0 temporarily, or use a self-hosted runner) |
| Backend container restart loop | `docker logs carthi-backend-1` — usually a bad `DATABASE_URL` or RDS SG missing the EC2 SG rule |
| `502` from Nginx | backend container healthy? `docker compose -f docker-compose.prod.yml ps` |
| ECR push denied | IAM user policy `AmazonEC2ContainerRegistryPowerUser`; repo names match `carthi-backend`/`carthi-frontend` |
| Stale search results | expected ≤ `RIDE_SEARCH_CACHE_TTL` (30 s); mutations bump the cache version immediately |
| Redis down | app keeps working (cache layer no-ops); `docker compose restart redis` |

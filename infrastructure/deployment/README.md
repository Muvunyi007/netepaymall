# Deploy Web + Admin kuri VPS (nginx + systemd)

Ibi bice bitegura deploy ya **web** (Next.js) na **admin** (Next.js) kuri VPS isanzwe
(Ubuntu/Debian) ukoresheje **systemd** + **nginx** reverse proxy.

## Ibikoresho bikekenywa kuri server

- `node` >= 18 na `npm`
- `nginx`
- `git` (bike)
- SSH access (root cyangwa user ishoboye sudo)

> Ibigomba gushyirwa ku bwinshi birakorwa na `infrastructure/deploy.sh --install`.

## Igice cyiza cya deploy (izindi)

### 1) Tegura amakuru

```bash
# API ya backend ikorera ari hehe (e.g. VPS yikindi, Render, Railway...)
export API_URL="https://api.store.com"

# Igice cya domain (uyi menu mbere yuko HTTPS)
export DOMAIN="store.com"
```

### 2) Korera deploy (umuntu uri kuri machine ya develop)

```bash
# From repo root on local machine, not on server:
./infrastructure/deploy.sh \
  --host root@167.88.36.40 \
  --domain store.com \
  --api https://api.store.com \
  --install
```

Ibi bikora:

1. Ssh connection check
2. `--install`: install node18 + nginx + git (ku bwubuntu)
3. rsync `web/` + `admin/` → `~/netepamall/`
4. `npm ci` + `next build` ku bombi, hamwe na `NEXT_PUBLIC_API_URL`
5. Ident & starter systemd units: `netepamall-web` (8001), `netepamall-admin` (8002)
6. nginx config `netepamall` → reload

### 3) DNS

Muri registry ya dzima (ajira ya domain):
- `A store.com` → `IP ya VPS`
- `A admin.store.com` → `IP ya VPS`

### 4) HTTPS (certbot, bigere nyuma ko DNS yatangiye)

```bash
ssh root@IP
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d store.com -d www.store.com -d admin.store.com
```

---

## Fichito

| File | Ibyo ikora |
|------|-----------|
| `deploy.sh` | Deploy automatique (rsync + build + systemd + nginx) |
| `deployment/netepamall-web.service` | Service web (port 8001) |
| `deployment/netepamall-admin.service` | Service admin (port 8002) |
| `nginx/netepamall.conf` | nginx reverse proxy template |

## Ibindi: domain kawe gusa

Niba **nta domain**: kuza `http://IP` (web) na `http://IP:8002` (admin) — modify `DOMAIN` na `server_name` mu config default.

## Mobile (Flutter)

Mobile ikoresha API kamwe. Niba API ihari ku API URL yihariye:
- Edit `mobile/lib/core/constants.dart` → `AppConstants.apiBaseUrl = '<API>/api/v1'`
- Iyo release APK ishobora gukenera cleartext HTTP cyangwa HTTPS platform.

## Check after deploy

```bash
ssh root@IP
systemctl status netepamall-web netepamall-admin
curl -I http://localhost:8001   # web
curl -I http://localhost:8002   # admin
curl http://localhost:8001/api/... # appening API via API_URL
```
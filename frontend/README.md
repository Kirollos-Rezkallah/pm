# Project Management MVP

## Run

From the project root:

- Windows: `./scripts/start.ps1`
- macOS/Linux: `./scripts/start.sh`

Open `http://127.0.0.1:8000` and sign in with `user` / `password`.

## Tests

```bash
cd frontend
npm run test:all

cd ../backend
uv run pytest
```

Stop the local server from the project root:

```bash
# Windows
./scripts/stop.ps1

# macOS/Linux
./scripts/stop.sh
```
npm run test:unit
npm run test:e2e
```

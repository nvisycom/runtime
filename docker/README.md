# Docker

Build and run the Nvisy server as a container.

```sh
docker build -f docker/Dockerfile -t nvisy-server .
docker run -p 8080:8080 nvisy-server
```

The build context is the repository root. Run all commands from there.

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | HTTP listen port |
| `HOST` | `0.0.0.0` | Bind address |
| `CORS_ORIGIN` | `*` | Allowed CORS origin |

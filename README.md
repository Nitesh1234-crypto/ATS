## 1. Clone and Setup

```bash
git clone <repository-url>
cd ATS
```

## 2. Start All Services

```bash
cd infra/docker
docker-compose up -d
```

This starts:
Frontend : http://localhost:3000
Backend API: http://localhost:8000  
ML Service: http://localhost:8001
PostgreSQL: localhost:5433 (changed from 5432 to avoid conflicts)
Redis: localhost:6380 (changed from 6379 to avoid conflicts)

## 3. Verify Services

```bash
# Check all containers are running
docker-compose ps

# Test API health
curl http://localhost:8000/health
curl http://localhost:8001/health
```


### Services Not Starting
```bash
docker-compose logs

docker-compose restart

```



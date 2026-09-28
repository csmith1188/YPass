# Production deployment

See [deploy/ubuntu/setup.md](../../deploy/ubuntu/setup.md) for host Nginx + PM2 and Docker Compose. Nginx samples: [deploy/nginx/formbar-app.conf](../../deploy/nginx/formbar-app.conf) (host) and [deploy/docker/nginx.conf](../../deploy/docker/nginx.conf) (in-compose).

Checklist:

- TLS at Nginx; Node on 127.0.0.1
- PostgreSQL + Redis
- `TRUST_PROXY=1`
- Migrate before PM2 start
- Example flags off
- Least-privilege DB user
- Firewall: 80/443 only publicly

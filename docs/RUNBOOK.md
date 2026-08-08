# OpenRWA — Operations Runbook

> ## Status: INTENDED PROCEDURE, NEVER EXERCISED
>
> Nothing in this document has been performed. It describes what an operator
> *would* do against the stack defined in `infra/terraform/`, and it is written
> down so the procedure exists before it is needed — not because it has been
> tested. Specifically, as of this commit:
>
> - **No AWS resource exists.** `infra/terraform/` has been validated
>   (`terraform validate`, `fmt -check`) and never applied. There is no VPC, no
>   ALB, no ECS cluster, no RDS instance, no S3 bucket, no ECR repository and no
>   Secrets Manager secret. Every `aws` command below refers to something that
>   has not been created.
> - **GitHub Actions has never run.** The account is billing-locked; every job
>   fails at startup. The **Deploy** workflow is `workflow_dispatch`-only and has
>   never been dispatched, so the OIDC assume-role, the ECR push and the ECS
>   rollout are all unproven.
> - **The deploy role does not exist.** `AWS_DEPLOY_ROLE_ARN` is not set on the
>   repository, and `infra/terraform/` does not create that role — see
>   `infra/terraform/README.md`.
> - **There is no monitoring and no on-call.** No CloudWatch alarm, dashboard,
>   SNS topic or paging integration exists anywhere in this repository, and no
>   error-tracking service is wired into any application.
> - **There is no rotation to page.** §7 is a template.
>
> Treat every command as unverified. The first person to run any of this is
> testing it, and should correct this document as they go.

Audience: on-call engineer / operator. Scope: the AWS stack **defined in**
`infra/terraform/` (VPC → ALB → ECS Fargate → RDS Postgres, S3 + CloudFront,
ECR, Secrets Manager) and the GitHub Actions **Deploy** workflow.

> Golden rule: **testnet only**. Mainnet contracts stay out of scope until
> written authorization (P20).
>
> The four gated modules — Proof-of-Reserves, Redemption, Wallet, Purchase — are
> inert in a stronger sense than "flag off". Each is class-gated by a feature
> flag AND refuses in its own service, so **setting a flag to true activates
> nothing**: the refusal moves from the guard (`501 module_disabled`) to the
> service (`501 *_inactive`). There is no flag to flip that makes them work, and
> the tables behind them are empty. Activation is a code change under written
> authorization, not a configuration change.

---

## 0. Service map

| Service | Port | Subdomain | Desired (prod) | Health |
| --- | --- | --- | --- | --- |
| web (Next.js) | 3000 | apex | 2 | `/` |
| api (NestJS) | 4000 | `api.` | 2 | `/api/health` |
| admin | 4100 | `admin.` | 1 | `/` |
| cms (Payload) | 3001 | `cms.` | 1 | `/admin` |

- Cluster: `openrwa-<env>` (`staging` / `prod`).
- Images: ECR `openrwa/<service>`.
- Secrets: Secrets Manager `openrwa-<env>/app` (JSON: `DATABASE_URL`,
  `JWT_SECRET`, `INVESTOR_JWT_SECRET`, `PAYLOAD_SECRET`, `SERVICE_API_TOKEN`).
  `INVESTOR_JWT_SECRET` must differ from `JWT_SECRET`, and `PAYLOAD_SECRET` from
  both — the API and the CMS refuse to start otherwise.
- Logs: CloudWatch `/ecs/openrwa-<env>/<service>`.

---

## 1. Deploy

### Standard path (recommended)

> **Not currently possible.** GitHub Actions is billing-locked, so neither the
> CI pipeline nor the Deploy workflow can run. Until that is resolved, the only
> available route is the manual path below, and step 1's precondition cannot be
> satisfied at all — CI has never produced a green result on this repository.
> Local verification (`npm ci`, lint, test, `tsc --noEmit`, build per package,
> plus the API e2e suite) is what currently stands in for it.

1. Merge to `main`; confirm the **CI** pipeline is green
   (web/api/admin/cms/contracts).
2. Actions → **Deploy** → *Run workflow* → choose `environment` (`staging`
   first, then `prod`). Both jobs bind to a GitHub environment; configure
   required reviewers on `prod` before first use, or anyone with write access
   can deploy to production unreviewed.
3. Watch the run: `build` pushes images → `deploy` forces a new deployment and
   waits for `services-stable`.
4. Smoke test (see §6).

### What happens under the hood
- `build` (matrix) builds each image, tags it `:<git-sha>` and `:<image_tag>` (default `latest`), pushes to ECR.
- `deploy` runs `aws ecs update-service --force-new-deployment` per service, then `aws ecs wait services-stable`.
- ECS does a **rolling** replacement (min healthy 100%, so no downtime); the ALB only shifts traffic to targets passing health checks.
- DB migrations run automatically: the API container entrypoint runs
  `prisma migrate deploy` on start. **Approving a prod deploy is therefore
  approving a production migration** — there is no separate gate. The CMS
  entrypoint likewise runs `payload migrate`; without it the CMS boots, serves
  `/health` and `/admin`, and returns 500 on every database request.

### Manual deploy (CI unavailable)
```bash
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"
docker build -t "$ECR_REGISTRY/openrwa/api:$TAG" -f api/Dockerfile api
docker push "$ECR_REGISTRY/openrwa/api:$TAG"
aws ecs update-service --cluster "openrwa-$ENV" --service api --force-new-deployment
aws ecs wait services-stable --cluster "openrwa-$ENV" --services api
```

### Deploy checklist
- [ ] CI green on the merged commit
- [ ] Deployed & verified on `staging`
- [ ] Any new migration reviewed (expand-then-contract; no destructive step in the same release as code that still reads old columns)
- [ ] No sensitive flag changes unless authorized
- [ ] Prod smoke test passed

---

## 2. Rollback

**Symptom:** a deploy is bad (5xx spike, failed health checks, broken feature).

### Fast path — redeploy the previous image
ECS keeps prior task definition revisions. Roll a service back to the last-known-good revision:
```bash
# list revisions, pick the previous good one
aws ecs list-task-definitions --family-prefix openrwa-<env>-api --sort DESC
aws ecs update-service --cluster openrwa-<env> --service api \
  --task-definition openrwa-<env>-api:<PREV_REVISION>
aws ecs wait services-stable --cluster openrwa-<env> --services api
```
If you deploy with the mutable `:latest` tag, instead re-point `latest` to the previous image and force a new deployment:
```bash
docker pull  "$ECR_REGISTRY/openrwa/api:<PREV_SHA>"
docker tag   "$ECR_REGISTRY/openrwa/api:<PREV_SHA>" "$ECR_REGISTRY/openrwa/api:latest"
docker push  "$ECR_REGISTRY/openrwa/api:latest"
aws ecs update-service --cluster openrwa-<env> --service api --force-new-deployment
```

### Migration rollback
- Prisma has no auto-down. Follow **expand → migrate → contract** so code and schema are always compatible one step apart, making a code-only rollback safe.
- If a migration itself is broken: restore RDS from a snapshot (§3) into a new instance, validate, then cut over. Never hand-edit prod tables without a snapshot first.

### Rollback checklist
- [ ] Identify last-known-good SHA / task-def revision
- [ ] Roll service back, wait for stable
- [ ] Confirm health + smoke test
- [ ] Open an incident note (§5) and capture the bad SHA

---

## 3. Backup & restore

### RDS Postgres
- **Automated backups**: enabled via Terraform (`backup_retention_period` — 14 days in prod). Point-in-time recovery (PITR) is available within the window.
- **Manual snapshot** before risky changes:
  ```bash
  aws rds create-db-snapshot --db-instance-identifier openrwa-<env> \
    --db-snapshot-identifier openrwa-<env>-pre-<change>-$(date +%Y%m%d%H%M)
  ```
- **Restore** (always to a NEW instance, then cut over):
  ```bash
  aws rds restore-db-instance-from-db-snapshot \
    --db-instance-identifier openrwa-<env>-restore \
    --db-snapshot-identifier <snapshot-id>
  # or PITR:
  aws rds restore-db-instance-to-point-in-time \
    --source-db-instance-identifier openrwa-<env> \
    --target-db-instance-identifier openrwa-<env>-restore \
    --restore-time 2026-01-01T12:00:00Z
  ```
  Then update `DATABASE_URL` in Secrets Manager to the restored endpoint and force a new API deployment.
- **Logical dump** (portable / offsite):
  ```bash
  pg_dump "$DATABASE_URL" -Fc -f openrwa-$(date +%F).dump
  pg_restore --clean --if-exists -d "$TARGET_DATABASE_URL" openrwa-*.dump
  ```

### S3 media
- Bucket has **versioning** on; deleted/overwritten objects are recoverable via prior versions. Consider a lifecycle rule or cross-region replication for DR.

### Secrets
- Secrets Manager retains version history. Rotate by `put-secret-value`; keep the previous version staged until the new one is verified.

### Restore drill (do quarterly)
1. Restore latest snapshot to a scratch instance.
2. Point a staging API at it, run smoke tests.
3. Record restore time (RTO) and data loss window (RPO); tear down the scratch instance.

---

## 4. Routine operations

### Scaling
```bash
# horizontal
aws ecs update-service --cluster openrwa-<env> --service web --desired-count 4
```
For vertical changes (CPU/memory) or RDS instance class, edit `locals.tf` / `rds.tf` and `terraform apply` (RDS class change causes a brief failover on Multi-AZ).

### Secret rotation
1. `aws secretsmanager put-secret-value --secret-id openrwa-<env>/app --secret-string '<json>'`
2. Force new deployment so tasks pick up the new value (secrets are injected at task start).
3. For `JWT_SECRET` rotation, expect existing sessions to invalidate.

### Logs & metrics
```bash
aws logs tail /ecs/openrwa-<env>/api --follow --since 15m
```
- **No dashboards, alarms or error tracking exist.** `infra/terraform/` creates
  CloudWatch **log groups only** — no `aws_cloudwatch_metric_alarm`, no
  dashboard, no SNS topic — and no error-tracking service is integrated into any
  application. Nothing pages anyone.
- The metrics worth watching once monitoring is built: ECS service CPU/memory,
  ALB 5xx and target health, RDS CPU/connections/free storage.

### DNS / TLS
- ACM certificate on the ALB HTTPS listener; HTTP → HTTPS redirect. Cert renewal is automatic for validated domains.

---

## 5. Incident response

### Severity
| Sev | Definition | Response |
| --- | --- | --- |
| SEV1 | Full outage / data loss / security breach | Immediate, all-hands |
| SEV2 | Major feature down, degraded for many users | < 30 min |
| SEV3 | Minor / single-feature, workaround exists | Next business day |

### First 15 minutes
1. **Acknowledge** the alert; declare severity.
2. **Assess blast radius**: which service? Check ALB 5xx, target health, `aws ecs describe-services`, recent deploys.
3. **Stabilize** before diagnosing:
   - Bad deploy? → **rollback** (§2).
   - Overload? → **scale up** desired count.
   - DB issue? → check RDS connections/storage/failover; restore if corrupt (§3).
4. **Communicate**: post status + ETA to the incident channel; update every 30 min.

### Common playbooks
- **All services 503 at ALB** → targets unhealthy: check health-check path, task crash loops (`logs tail`), failed migration blocking API start.
- **API up, DB errors** → RDS connections exhausted or storage full; check `DATABASE_URL`, security group, RDS metrics.
- **CMS/admin only down** → check that service's task def, `PAYLOAD_CONFIG_PATH`, `SERVICE_API_TOKEN`.
- **Media 403/404** → CloudFront OAC or S3 bucket policy; confirm object exists + versioning.
- **Suspected breach** → rotate all secrets, revoke the OIDC deploy role (once
  one exists — it does not today), snapshot RDS for forensics, escalate.

### After: postmortem
Within 48h write a blameless postmortem: timeline, impact, root cause, what fixed it, action items with owners.

---

## 6. Smoke test (post-deploy)
```bash
curl -fsS https://api.<domain>/api/health           # 200
curl -fsS -o /dev/null -w '%{http_code}\n' https://<domain>/        # 200
curl -fsS -o /dev/null -w '%{http_code}\n' https://admin.<domain>/  # 200/302
curl -fsS -o /dev/null -w '%{http_code}\n' https://cms.<domain>/admin # 200/302
```
- Load homepage in EN/ES/IT; submit a waitlist entry (staging) and confirm it persists.
- Confirm the gated endpoints still refuse with **`501`** — `module_disabled`
  at the guard while the flag is off, `*_inactive` from the service if a flag is
  ever on. `501` is the contract across `SensitiveController`, `FeatureFlagGuard`
  and the admin console's gated notices; **503 is wrong** and appears nowhere in
  the codebase.

---

## 7. Emergency contacts / escalation

| Role | Who | When |
| --- | --- | --- |
| Primary on-call | _none — no rotation exists_ | first responder |
| Secondary / eng lead | _none_ | SEV1/SEV2 escalation |
| Product / client owner | _none_ | external comms, authorization for mainnet |

There is no on-call rotation, no paging integration and no incident channel.
The severity table and response times above describe an intended process, not a
staffed one.

> Keep AWS account ID, region (`eu-central-1`), and the break-glass IAM procedure in the team password manager — not in this repo.

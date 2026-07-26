# ReserveChain — AWS Infrastructure (Terraform)

Infrastructure-as-Code for the full stack on AWS: **VPC → ALB → ECS Fargate → RDS Postgres**, with **S3 + CloudFront** for media, **ECR** for images, **Secrets Manager** for credentials, IAM roles, and CloudWatch logs. One workspace per environment (`dev` / `staging` / `prod`).

## Architecture

```
           Route53 / DNS
                 |
         CloudFront (media CDN) ---- S3 (private, OAC)
                 |
              ALB (443, ACM)
     host-based routing to Fargate:
   @ -> web   api. -> api   admin. -> admin   cms. -> cms
                 |
     ECS Fargate cluster (awsvpc, private subnets)
     web (Next.js) | api (NestJS) | admin | cms (Payload)
                 |
           RDS Postgres (Multi-AZ in prod)
```

## Services

| Service | Port | Subdomain | Desired | Health |
| --- | --- | --- | --- | --- |
| web (Next.js) | 3000 | apex | 2 | `/` |
| api (NestJS) | 4000 | `api.` | 2 | `/api/health` |
| admin | 4100 | `admin.` | 1 | `/` |
| cms (Payload) | 3001 | `cms.` | 1 | `/admin` |

All four are defined once in `locals.tf` and fanned out via `for_each` across ECR, log groups, target groups, task definitions, and services.

## Files

- `versions.tf` — providers + (commented) S3 remote state.
- `variables.tf` / `terraform.tfvars.example` — inputs.
- `locals.tf` — the per-service map (ports, CPU/memory, env, secret mapping).
- `network.tf` — VPC (public/private subnets, NAT).
- `security.tf` — ALB / ECS / RDS security groups.
- `ecr.tf`, `logs.tf`, `iam.tf`, `secrets.tf` — supporting resources.
- `rds.tf`, `s3.tf`, `cloudfront.tf`, `alb.tf`, `ecs.tf` — the core stack.
- `outputs.tf` — ALB DNS, CDN domain, ECR URLs, RDS endpoint.

## Environment-aware behavior

- **prod**: Multi-AZ RDS, deletion protection, 14-day backups, 90-day logs, `FARGATE`, Container Insights, `PriceClass_All`.
- **dev/staging**: single NAT, `FARGATE_SPOT`, no deletion protection, `skip_final_snapshot`, shorter retention.

## Security posture

- Fargate tasks run in **private subnets**; only the ALB can reach them, and only ECS can reach RDS.
- S3 media bucket is fully private and served exclusively through CloudFront (Origin Access Control).
- Secrets live in Secrets Manager and are injected as container `secrets` (never baked into images or task env).
- The API task ships every sensitive RWA flag **disabled** (`PROOF_OF_RESERVES_ENABLED`, `REDEMPTION_ENABLED`, `WALLET_ENABLED`, `PURCHASE_ENABLED`, `CHAIN_SYNC_ENABLED` = `false`).

## State

State is stored remotely and is **not** optional. It contains `db_password`,
`jwt_secret`, `investor_jwt_secret`, `payload_secret` and `service_api_token` in
**plaintext** — `sensitive = true` hides values from CLI output, it does not
encrypt state. `versions.tf` declares a partial `backend "s3" {}`; the bucket,
region and DynamoDB lock table come from `backend.hcl` at init time, so no
account-specific name is committed.

The bucket and lock table must exist before the first `init` and cannot be
created by this stack — it would need the state it is creating. `backend.hcl.example`
carries the one-off commands.

## Usage

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # fill in domain, ACM ARN, secrets
cp backend.hcl.example backend.hcl             # fill in state bucket + lock table
# both are gitignored; only the *.example files are tracked

terraform init -backend-config=backend.hcl
terraform fmt -check
terraform validate

# One workspace per environment. `environment` must match the selected
# workspace: every resource is named from the variable while state is isolated
# by the workspace, so a mismatch writes one environment's resources into
# another's state. A `check` block reports that at plan time.
terraform workspace new staging || terraform workspace select staging
terraform plan  -var environment=staging
terraform apply -var environment=staging
```

### Validating without AWS

`terraform validate` needs no credentials and no backend:

```bash
terraform init -backend=false
terraform validate
terraform fmt -check -recursive
```

This is the verification bar used in this repository. Nothing here is applied
automatically, and no CI job runs `plan` or `apply`.

## Cost

Nothing in this directory creates a resource until someone runs `apply`. When
applied, the always-on floor per environment is roughly: NAT gateway (~$33/mo,
one for dev/staging, one per AZ in prod), ALB (~$18/mo), RDS `db.t4g.small`
(~$25/mo single-AZ, doubled for Multi-AZ prod), plus four Fargate services
(~$45/mo at the shipped CPU/memory), CloudFront, S3, ECR and CloudWatch on
usage. Roughly **$120-130/month for dev or staging**, materially more for prod.

Then build & push images to the ECR URLs from `terraform output ecr_repository_urls`, point DNS (apex + `api.`/`admin.`/`cms.`) at `alb_dns_name`, and roll the services. Suggested CI wiring: extend the unified GitHub Actions pipeline with a `deploy` job that builds images, pushes to ECR, and forces a new ECS deployment.

> Note: `terraform init` downloads the AWS provider and the `terraform-aws-modules/vpc` module, so it requires network + AWS credentials on the host. Nothing here is applied automatically.

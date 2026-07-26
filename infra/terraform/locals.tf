locals {
  name = "${var.project}-${var.environment}"

  # The README documents one workspace per environment, but every resource is
  # named from var.environment, so selecting workspace `prod` while passing
  # `-var environment=staging` would write staging-named resources into prod
  # state. This surfaces that mismatch at plan time instead of after apply.
  # `default` is exempt: it is the workspace `terraform validate` runs under.
  workspace_matches_environment = (
    terraform.workspace == "default" || terraform.workspace == var.environment
  )

  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  is_prod = var.environment == "prod"

  base_url  = "https://${var.domain}"
  api_url   = "https://api.${var.domain}"
  admin_url = "https://admin.${var.domain}"
  cms_url   = "https://cms.${var.domain}"

  # One entry per Fargate service. `secrets` map a container env var name to a
  # key inside the shared Secrets Manager JSON. All sensitive RWA modules ship
  # disabled via environment flags.
  services = {
    api = {
      port    = 4000
      cpu     = 512
      memory  = 1024
      desired = 2
      host    = "api"
      health  = "/api/health"
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "4000" },
        { name = "CORS_ORIGIN", value = local.base_url },
        { name = "JWT_EXPIRES_IN", value = "12h" },
        { name = "CHAIN_SYNC_ENABLED", value = "false" },
        # Sepolia, validated in variables.tf. Never mainnet (AGENTS §1).
        { name = "CHAIN_ID", value = tostring(var.chain_id) },
        { name = "PROOF_OF_RESERVES_ENABLED", value = "false" },
        { name = "REDEMPTION_ENABLED", value = "false" },
        { name = "WALLET_ENABLED", value = "false" },
        { name = "PURCHASE_ENABLED", value = "false" },
      ]
      secrets = [
        { name = "DATABASE_URL", key = "DATABASE_URL" },
        { name = "JWT_SECRET", key = "JWT_SECRET" },
        # Without this the API throws on boot; the overlay omitted it entirely.
        { name = "INVESTOR_JWT_SECRET", key = "INVESTOR_JWT_SECRET" },
        { name = "SERVICE_API_TOKEN", key = "SERVICE_API_TOKEN" },
      ]
    }

    web = {
      port    = 3000
      cpu     = 512
      memory  = 1024
      desired = 2
      host    = "@"
      health  = "/"
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "3000" },
        { name = "NEXT_PUBLIC_SITE_URL", value = local.base_url },
        { name = "WAITLIST_API_BASE", value = "${local.api_url}/api" },
        { name = "CMS_API_BASE", value = "${local.cms_url}/api" },
      ]
      secrets = []
    }

    admin = {
      port    = 4100
      cpu     = 256
      memory  = 512
      desired = 1
      host    = "admin"
      health  = "/"
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "4100" },
        { name = "API_BASE_URL", value = "${local.api_url}/api" },
      ]
      secrets = [
        { name = "API_TOKEN", key = "SERVICE_API_TOKEN" },
      ]
    }

    cms = {
      port    = 3001
      cpu     = 512
      memory  = 1024
      desired = 1
      host    = "cms"
      health  = "/admin"
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "3001" },
        { name = "PAYLOAD_PUBLIC_SERVER_URL", value = local.cms_url },
        { name = "CORS_ORIGINS", value = "${local.base_url},${local.admin_url}" },
      ]
      secrets = [
        { name = "DATABASE_URI", key = "DATABASE_URL" },
        { name = "PAYLOAD_SECRET", key = "PAYLOAD_SECRET" },
      ]
    }
  }
}

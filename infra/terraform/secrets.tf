resource "aws_secretsmanager_secret" "app" {
  name        = "${local.name}/app"
  description = "Shared application secrets injected into Fargate tasks"
  tags        = local.tags
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id = aws_secretsmanager_secret.app.id

  secret_string = jsonencode({
    DATABASE_URL        = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.postgres.address}:5432/${var.db_name}?schema=public"
    JWT_SECRET          = var.jwt_secret
    INVESTOR_JWT_SECRET = var.investor_jwt_secret
    PAYLOAD_SECRET      = var.payload_secret
    SERVICE_API_TOKEN   = var.service_api_token
  })
}

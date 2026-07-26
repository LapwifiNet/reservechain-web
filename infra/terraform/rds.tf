resource "aws_db_subnet_group" "this" {
  name       = local.name
  subnet_ids = module.vpc.private_subnets
  tags       = local.tags
}

resource "aws_db_instance" "postgres" {
  identifier     = local.name
  engine         = "postgres"
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_allocated_storage * 4
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  multi_az                  = local.is_prod
  backup_retention_period   = local.is_prod ? 14 : 3
  deletion_protection       = local.is_prod
  skip_final_snapshot       = !local.is_prod
  final_snapshot_identifier = local.is_prod ? "${local.name}-final" : null

  performance_insights_enabled = local.is_prod
  apply_immediately            = !local.is_prod

  tags = local.tags
}

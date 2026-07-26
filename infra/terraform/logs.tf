resource "aws_cloudwatch_log_group" "svc" {
  for_each = local.services

  name              = "/ecs/${local.name}/${each.key}"
  retention_in_days = local.is_prod ? 90 : 14
  tags              = local.tags
}

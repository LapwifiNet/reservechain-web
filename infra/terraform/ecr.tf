resource "aws_ecr_repository" "svc" {
  for_each = local.services

  name                 = "${var.project}/${each.key}"
  image_tag_mutability = "MUTABLE"
  force_delete         = !local.is_prod

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = local.tags
}

resource "aws_ecr_lifecycle_policy" "svc" {
  for_each   = aws_ecr_repository.svc
  repository = each.value.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}

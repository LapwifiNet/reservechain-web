resource "aws_ecs_cluster" "this" {
  name = local.name

  setting {
    name  = "containerInsights"
    value = local.is_prod ? "enabled" : "disabled"
  }

  tags = local.tags
}

resource "aws_ecs_cluster_capacity_providers" "this" {
  cluster_name       = aws_ecs_cluster.this.name
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = local.is_prod ? "FARGATE" : "FARGATE_SPOT"
    weight            = 1
  }
}

resource "aws_ecs_task_definition" "svc" {
  for_each = local.services

  family                   = "${local.name}-${each.key}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = each.value.cpu
  memory                   = each.value.memory
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([
    {
      name         = each.key
      image        = "${aws_ecr_repository.svc[each.key].repository_url}:${var.image_tag}"
      essential    = true
      portMappings = [{ containerPort = each.value.port, protocol = "tcp" }]
      environment  = each.value.environment
      secrets = [
        for s in each.value.secrets : {
          name      = s.name
          valueFrom = "${aws_secretsmanager_secret.app.arn}:${s.key}::"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.svc[each.key].name
          "awslogs-region"        = var.region
          "awslogs-stream-prefix" = each.key
        }
      }
    }
  ])

  tags = local.tags
}

resource "aws_ecs_service" "svc" {
  for_each = local.services

  name            = each.key
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.svc[each.key].arn
  desired_count   = each.value.desired
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.svc[each.key].arn
    container_name   = each.key
    container_port   = each.value.port
  }

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  depends_on = [aws_lb_listener.https]

  tags = local.tags
}

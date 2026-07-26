resource "aws_lb" "this" {
  name               = local.name
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnets
  tags               = local.tags
}

resource "aws_lb_target_group" "svc" {
  for_each = local.services

  name        = "${local.name}-${each.key}"
  port        = each.value.port
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = module.vpc.vpc_id

  health_check {
    path                = each.value.health
    healthy_threshold   = 2
    unhealthy_threshold = 5
    timeout             = 5
    interval            = 30
    matcher             = "200-399"
  }

  tags = local.tags
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.this.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.this.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn

  # Default: the public website.
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.svc["web"].arn
  }
}

# Host-based routing for api./admin./cms. subdomains.
resource "aws_lb_listener_rule" "host" {
  for_each = { for k, v in local.services : k => v if k != "web" }

  listener_arn = aws_lb_listener.https.arn
  priority     = 10 * index(keys(local.services), each.key)

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.svc[each.key].arn
  }

  condition {
    host_header {
      values = ["${each.value.host}.${var.domain}"]
    }
  }
}

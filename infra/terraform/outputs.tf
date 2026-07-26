output "alb_dns_name" {
  description = "Point your DNS records (apex + api./admin./cms.) at this ALB."
  value       = aws_lb.this.dns_name
}

output "cloudfront_domain" {
  description = "CDN domain for media assets."
  value       = aws_cloudfront_distribution.media.domain_name
}

output "rds_endpoint" {
  value     = aws_db_instance.postgres.address
  sensitive = true
}

output "media_bucket" {
  value = aws_s3_bucket.media.bucket
}

output "ecr_repository_urls" {
  description = "Push your images here before deploying."
  value       = { for k, r in aws_ecr_repository.svc : k => r.repository_url }
}

# Outputs for the S3 module

output "bucket_name" {
  description = "The name of the S3 bucket for frontend hosting"
  value       = aws_s3_bucket.frontend.id
}

output "bucket_arn" {
  description = "The ARN of the S3 bucket for frontend hosting"
  value       = aws_s3_bucket.frontend.arn
}

output "bucket_domain_name" {
  description = "The domain name of the S3 bucket for frontend hosting"
  value       = aws_s3_bucket.frontend.bucket_domain_name
}

output "bucket_regional_domain_name" {
  description = "The regional domain name of the S3 bucket for frontend hosting"
  value       = aws_s3_bucket.frontend.bucket_regional_domain_name
}

output "website_endpoint" {
  description = "The website endpoint of the S3 bucket for frontend hosting"
  value       = aws_s3_bucket_website_configuration.frontend.website_endpoint
}

output "website_domain" {
  description = "The website domain of the S3 bucket for frontend hosting"
  value       = aws_s3_bucket_website_configuration.frontend.website_domain
}

output "cloudfront_distribution_id" {
  description = "The ID of the CloudFront distribution for frontend hosting"
  value       = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_distribution_arn" {
  description = "The ARN of the CloudFront distribution for frontend hosting"
  value       = aws_cloudfront_distribution.frontend.arn
}

output "cloudfront_domain_name" {
  description = "The domain name of the CloudFront distribution for frontend hosting"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "cloudfront_hosted_zone_id" {
  description = "The hosted zone ID of the CloudFront distribution for frontend hosting"
  value       = aws_cloudfront_distribution.frontend.hosted_zone_id
}

output "cloudfront_origin_access_identity" {
  description = "The CloudFront origin access identity for frontend hosting"
  value       = aws_cloudfront_origin_access_identity.frontend.cloudfront_access_identity_path
}

output "custom_domain" {
  description = "The custom domain for frontend hosting (if provided)"
  value       = var.domain_name
}

output "route53_record_name" {
  description = "The name of the Route53 record for the custom domain (if provided)"
  value       = var.domain_name != "" && var.hosted_zone_id != "" ? aws_route53_record.frontend[0].name : null
}

output "route53_record_fqdn" {
  description = "The FQDN of the Route53 record for the custom domain (if provided)"
  value       = var.domain_name != "" && var.hosted_zone_id != "" ? aws_route53_record.frontend[0].fqdn : null
}
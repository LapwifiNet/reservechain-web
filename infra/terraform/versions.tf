terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
  }

  # Remote state, configured as a PARTIAL backend: the block is declared here
  # with no literals, and bucket/table/region come from backend.hcl at init:
  #
  #   terraform init -backend-config=backend.hcl
  #
  # Declared rather than commented out, because a commented backend silently
  # falls back to LOCAL state — and state holds db_password, jwt_secret,
  # investor_jwt_secret, payload_secret and service_api_token in plaintext.
  # `sensitive = true` hides values from CLI output; it does not encrypt state.
  # See backend.hcl.example for the one-off bucket + DynamoDB lock table setup.
  #
  # `terraform init -backend=false` (the verification bar in this repository)
  # skips backend configuration entirely, so validation needs no credentials.
  backend "s3" {}
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

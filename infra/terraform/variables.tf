variable "project" {
  type    = string
  default = "openrwa"
}

variable "environment" {
  type        = string
  description = "dev | staging | prod"
  default     = "staging"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be one of dev, staging, prod."
  }
}

variable "region" {
  type    = string
  default = "eu-central-1"
}

variable "domain" {
  type        = string
  description = "Apex domain. Subdomains api./admin./cms. are derived from it."
}

variable "certificate_arn" {
  type        = string
  description = "ACM certificate ARN (regional) covering the apex + subdomains for the ALB HTTPS listener."
}

# --- Networking -------------------------------------------------------------
variable "vpc_cidr" {
  type    = string
  default = "10.20.0.0/16"
}

variable "public_subnet_cidrs" {
  type    = list(string)
  default = ["10.20.0.0/24", "10.20.1.0/24"]
}

variable "private_subnet_cidrs" {
  type    = list(string)
  default = ["10.20.10.0/24", "10.20.11.0/24"]
}

# --- Database ---------------------------------------------------------------
variable "db_engine_version" {
  type    = string
  default = "16.3"
}

variable "db_instance_class" {
  type    = string
  default = "db.t4g.small"
}

variable "db_allocated_storage" {
  type    = number
  default = 20
}

variable "db_name" {
  type    = string
  default = "openrwa"
}

variable "db_username" {
  type    = string
  default = "openrwa"
}

variable "db_password" {
  type      = string
  sensitive = true

  validation {
    condition     = length(var.db_password) >= 16 && var.db_password != "REPLACE-ME"
    error_message = "db_password must be a real value of at least 16 characters, not the placeholder."
  }
}

# --- Application secrets ----------------------------------------------------
# The API, the investor portal and the CMS each refuse to start unless their
# signing key is at least 32 characters, and the API additionally refuses to
# start when INVESTOR_JWT_SECRET equals JWT_SECRET (invariants 19 and 24).
# Those checks live in the applications; repeating them here means a bad value
# fails at plan time rather than after a deploy, as a crash-looping task.
variable "jwt_secret" {
  type      = string
  sensitive = true

  validation {
    condition     = length(var.jwt_secret) >= 32 && var.jwt_secret != "REPLACE-ME"
    error_message = "jwt_secret must be at least 32 characters and not the placeholder."
  }
}

# Absent from the overlay entirely. Without it the API throws on boot —
# InvestorModule requires INVESTOR_JWT_SECRET at >= 32 characters and different
# from JWT_SECRET — so the shipped configuration would have deployed a
# permanently crash-looping api service.
variable "investor_jwt_secret" {
  type      = string
  sensitive = true

  validation {
    condition     = length(var.investor_jwt_secret) >= 32 && var.investor_jwt_secret != "REPLACE-ME"
    error_message = "investor_jwt_secret must be at least 32 characters and not the placeholder."
  }
}

variable "payload_secret" {
  type      = string
  sensitive = true

  validation {
    condition     = length(var.payload_secret) >= 32 && var.payload_secret != "REPLACE-ME"
    error_message = "payload_secret must be at least 32 characters and not the placeholder."
  }
}

variable "service_api_token" {
  type      = string
  sensitive = true

  validation {
    condition     = length(var.service_api_token) >= 32 && var.service_api_token != "REPLACE-ME"
    error_message = "service_api_token must be at least 32 characters and not the placeholder."
  }
}

# --- Chain (testnet only) ---------------------------------------------------
# The API reads CHAIN_ID and refuses to sync against mainnet, but the overlay
# set no chain variable at all, leaving the deployed value implicit. Declaring
# it explicitly with a validated allow-list means infrastructure cannot become
# the place a mainnet id is introduced. AGENTS §1: the constraint is in code,
# not in a description — the same defect the wallet overlay shipped, where
# chainId was @IsInt() with a comment saying mainnet was not permitted.
variable "chain_id" {
  type        = number
  description = "EVM chain id for the API. Sepolia only until P20."
  default     = 11155111

  validation {
    condition     = var.chain_id == 11155111
    error_message = "chain_id must be 11155111 (Sepolia). Mainnet requires written authorization (P20, AGENTS §1)."
  }
}

# --- Deployment -------------------------------------------------------------
variable "image_tag" {
  type        = string
  description = "Container image tag deployed to every service."
  default     = "latest"
}

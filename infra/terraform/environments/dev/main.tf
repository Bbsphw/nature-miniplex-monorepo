terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote State Storage (Encrypted S3 Bucket + DynamoDB State Locking)
  backend "s3" {
    bucket         = "miniplex-tfstate-dev-us-east-1"
    key            = "dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "miniplex-tflocks-dev"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "NatureMiniPlex"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# 1. Networking Tier
module "networking" {
  source              = "../../modules/networking"
  environment         = var.environment
  vpc_cidr            = var.vpc_cidr
  public_subnet_cidrs = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

# 2. Database Tier (Transactional Safety & ACID)
module "database" {
  source             = "../../modules/database"
  environment        = var.environment
  vpc_id             = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  allocated_storage  = 20
  instance_class     = "db.t3.medium"
  db_name            = "NatureMiniPlexDb"
}

# 3. Application Compute Tier (Independently Scalable API)
module "app_service" {
  source        = "../../modules/app_service"
  environment   = var.environment
  vpc_id        = module.networking.vpc_id
  subnet_ids    = module.networking.private_subnet_ids
  min_capacity  = 2
  max_capacity  = 10
}

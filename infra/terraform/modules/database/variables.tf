variable "environment" {
  type        = string
  description = "Environment name"
}

variable "vpc_id" {
  type        = string
  description = "Target VPC ID"
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "Subnet IDs for DB Subnet Group"
}

variable "allocated_storage" {
  type        = number
  description = "Allocated storage size in GB"
  default     = 20
}

variable "instance_class" {
  type        = string
  description = "Database instance compute class"
  default     = "db.t3.medium"
}

variable "db_name" {
  type        = string
  description = "Database name"
  default     = "NatureMiniPlexDb"
}

variable "db_username" {
  type        = string
  description = "Database administrative username"
  default     = "miniplex_admin"
}

variable "db_password_secret_name" {
  type        = string
  description = "AWS Secrets Manager key reference for DB master password"
  default     = "miniplex/db/master_password"
}

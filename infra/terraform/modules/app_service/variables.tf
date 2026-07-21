variable "environment" {
  type        = string
  description = "Target environment"
}

variable "vpc_id" {
  type        = string
  description = "Target VPC ID"
}

variable "subnet_ids" {
  type        = list(string)
  description = "Private Subnet IDs for compute deployment"
}

variable "min_capacity" {
  type        = number
  description = "Minimum auto-scaling capacity for API instances"
  default     = 2
}

variable "max_capacity" {
  type        = number
  description = "Maximum auto-scaling capacity for API instances during booking spikes"
  default     = 10
}

variable "container_image" {
  type        = string
  description = "Container image URI for Backend Booking API"
  default     = "natureminiplex/backend:latest"
}

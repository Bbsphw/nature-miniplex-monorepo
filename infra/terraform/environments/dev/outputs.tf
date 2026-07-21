output "vpc_id" {
  value = module.networking.vpc_id
}

output "database_endpoint" {
  value     = module.database.db_endpoint
  sensitive = true
}

output "ecs_cluster_name" {
  value = module.app_service.cluster_name
}

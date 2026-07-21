output "cluster_name" {
  description = "ECS Cluster Name"
  value       = aws_ecs_cluster.main.name
}

output "service_name" {
  description = "ECS Service Name for backend API"
  value       = aws_ecs_service.api.name
}

output "app_security_group_id" {
  description = "App tier security group ID"
  value       = aws_security_group.app_sg.id
}

output "db_endpoint" {
  description = "The connection endpoint for the SQL database"
  value       = aws_db_instance.miniplex_db.endpoint
}

output "db_security_group_id" {
  description = "The ID of the Database security group"
  value       = aws_security_group.db_sg.id
}

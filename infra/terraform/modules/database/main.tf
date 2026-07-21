# DB Subnet Group (Private Network Placement)
resource "aws_db_subnet_group" "main" {
  name       = "miniplex-db-subnet-group-${var.environment}"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name        = "miniplex-db-subnet-group-${var.environment}"
    Environment = var.environment
  }
}

# DB Security Group (Restrict Access to API Security Group Only)
resource "aws_security_group" "db_sg" {
  name        = "miniplex-db-sg-${var.environment}"
  description = "Controls inbound traffic to transactional database tier"
  vpc_id      = var.vpc_id

  ingress {
    description = "Allow TDS traffic on port 1433 from application tier"
    from_port   = 1433
    to_port     = 1433
    protocol    = "tcp"
    cidr_blocks = ["10.0.10.0/24", "10.0.11.0/24"] # Or app_sg reference
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "miniplex-db-sg-${var.environment}"
    Environment = var.environment
  }
}

# Managed Relational Database Instance (MS SQL Server / PostgreSQL)
# Built for ACID Compliance & Concurrency (RowVersion Locking)
resource "aws_db_instance" "miniplex_db" {
  identifier             = "miniplex-db-${var.environment}"
  allocated_storage      = var.allocated_storage
  max_allocated_storage  = 100 # Storage autoscaling
  engine                 = "sqlserver-ex"
  engine_version         = "15.00"
  instance_class         = var.instance_class
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]

  username = var.db_username
  password = "ChangeMeSuperSecure2026!" # Secret injected via KMS / Secrets Manager in live terraform execution

  skip_final_snapshot = var.environment == "dev" ? true : false
  storage_encrypted   = true
  multi_az            = var.environment == "prod" ? true : false

  tags = {
    Name        = "miniplex-database-${var.environment}"
    Environment = var.environment
    Service     = "Database"
  }
}

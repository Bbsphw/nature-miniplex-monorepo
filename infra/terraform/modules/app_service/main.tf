# Security Group for Application Tier
resource "aws_security_group" "app_sg" {
  name        = "miniplex-app-sg-${var.environment}"
  description = "Allows incoming HTTP traffic to backend booking API"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP Port 5000"
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "miniplex-app-sg-${var.environment}"
    Environment = var.environment
  }
}

# ECS Cluster for Containerized Services
resource "aws_ecs_cluster" "main" {
  name = "miniplex-cluster-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Environment = var.environment
    Service     = "BookingAPI"
  }
}

# Backend API Task Definition
resource "aws_ecs_task_definition" "api" {
  family                   = "miniplex-api-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"

  container_definitions = jsonencode([
    {
      name      = "booking-api"
      image     = var.container_image
      essential = true
      portMappings = [
        {
          containerPort = 5000
          hostPort      = 5000
        }
      ]
      environment = [
        { name = "ASPNETCORE_ENVIRONMENT", value = var.environment }
      ]
    }
  ])
}

# ECS Service with Target Tracking Autoscaling
resource "aws_ecs_service" "api" {
  name            = "miniplex-api-service-${var.environment}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = var.min_capacity
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [aws_security_group.app_sg.id]
    assign_public_ip = true
  }
}

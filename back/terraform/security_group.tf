resource "aws_security_group" "nestjs_sg" {
  name = "nestjs-sg"
  description = "Security group for NestJS API"
  #  vpc_id = data.aws_vpc.default.id
  vpc_id = aws_vpc.main.id

  tags= {
    Name = "nestjs-sg"
    Environment = var.environment
  }
  
  # ssh for my ip
  ingress {
    description = "SSH for my IP"
    from_port = 22
    to_port = 22
    protocol = "tcp"
    cidr_blocks = ["${chomp(data.http.myip.response_body)}/32"]
    
  }

  # api - public but with https using load balancer
  ingress {
    description = "HTTP from anywhere (temporary)"
    from_port = 3000
    to_port = 3000
    protocol = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # health checks from application load balancer(ALB, just when it exists)
  dynamic "ingress" {
    for_each = var.alb_sg_id != "" ? [1] : []
    content {
      description     = "Health checks from ALB"
      from_port       = 3000
      to_port         = 3000
      protocol        = "tcp"
      security_groups = [var.alb_sg_id]
    }
  }

  # output to internet
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }


}

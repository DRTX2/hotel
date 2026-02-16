data "aws_ami" "ubuntu" {
  most_recent = true
  # ??
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_key_pair" "default" {
  key_name   = "nestjs-key"
  public_key = file("~/.ssh/id_ed25519.pub")
}

resource "aws_instance" "nestjs" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t2.micro"

  key_name = aws_key_pair.default.key_name

  vpc_security_group_ids = [aws_security_group.nestjs_sg.id]

  root_block_device {
    volume_size = 8
    volume_type = "gp3"
  }

  tags = {
    Name        = "nestjs-${var.environment}"
    Environment = var.environment
  }
}

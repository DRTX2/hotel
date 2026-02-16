output "public_ip" {
  value = aws_instance.nestjs.public_ip
}

output "instance_id" {
  value = aws_instance.nestjs.id
}

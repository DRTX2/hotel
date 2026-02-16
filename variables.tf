variable "environment" {
  description = "Environment name (dev/staging/prod)"
  type        = string
  default     = "development"  # Valor por defecto
}

variable "alb_sg_id" {
  description = "Security Group ID of the ALB"
  type        = string
  default     = ""  # Vacío por defecto, lo pasarás cuando crees el ALB
}

variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-east1"
}

variable "zone" {
  description = "GCP zone"
  type        = string
  default     = "us-east1-b"
}

variable "cluster_name" {
  description = "GKE cluster name"
  type        = string
  default     = "pedidos-veloz-cluster"
}

variable "environment" {
  description = "Environment (staging, production)"
  type        = string
  default     = "staging"
}

variable "node_count" {
  description = "Initial node count"
  type        = number
  default     = 2
}

variable "min_node_count" {
  description = "Minimum nodes for autoscaling"
  type        = number
  default     = 1
}

variable "max_node_count" {
  description = "Maximum nodes for autoscaling"
  type        = number
  default     = 5
}

variable "machine_type" {
  description = "GKE node machine type"
  type        = string
  default     = "e2-medium"
}

package kubernetes.podsecurity

deny[msg] {
  input.kind == "Pod"
  some c
  container := input.spec.containers[c]
  not container.securityContext.runAsNonRoot
  msg := sprintf("container %q must set securityContext.runAsNonRoot=true", [container.name])
}

deny[msg] {
  input.kind == "Deployment"
  some c
  container := input.spec.template.spec.containers[c]
  not container.securityContext.runAsNonRoot
  msg := sprintf("deployment %q container %q must set securityContext.runAsNonRoot=true", [input.metadata.name, container.name])
}


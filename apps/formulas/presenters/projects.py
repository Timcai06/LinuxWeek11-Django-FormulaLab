def project_workspace_context(project, **extra):
    context = {"project": project}
    context.update(extra)
    return context

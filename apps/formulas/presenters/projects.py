def project_workspace_context(workspace_project, **extra):
    if "project" in extra:
        raise ValueError("project cannot be provided in extra context")

    context = {"project": workspace_project}
    context.update(extra)
    return context

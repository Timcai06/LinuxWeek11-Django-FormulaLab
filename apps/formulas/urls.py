from django.urls import path

from . import views

urlpatterns = [
    path("", views.landing, name="landing"),
    path("projects/", views.projects, name="projects"),
    path("projects/<uuid:project_id>/", views.project_workspace, name="project-workspace"),
    path("projects/<uuid:project_id>/export/<str:format_name>/", views.export_project, name="export-project"),
    path("workbench/", views.workbench, name="workbench"),
    path("jobs/", views.create_job, name="create-job"),
    path("formula-items/<uuid:item_id>/review/", views.review_formula_item, name="review-formula-item"),
    path("missions/<uuid:job_id>/progress/", views.mission_progress, name="mission-progress"),
    path("missions/<uuid:job_id>/report/", views.mission_report, name="mission-report"),
    path("missions/<uuid:job_id>/retry/", views.retry_mission, name="retry-mission"),
    path("history/", views.history, name="history"),
    path("system/", views.system_page, name="system"),
    path("api/missions/<uuid:job_id>/", views.mission_status_api, name="api-mission-status"),
    path("api/documents/<uuid:document_id>/files/", views.api_document_files, name="api-document-files"),
    path("api/projects/<uuid:project_id>/documents/", views.api_project_documents, name="api-project-documents"),
    path("api/projects/<uuid:project_id>/items/", views.api_project_items, name="api-project-items"),
    path("api/document-files/<uuid:file_id>/", views.api_document_file_detail, name="api-document-file-detail"),
    path("api/formula-items/<uuid:item_id>/", views.api_formula_item_detail, name="api-formula-item-detail"),
    path(
        "api/formula-items/<uuid:item_id>/versions/",
        views.api_formula_item_versions,
        name="api-formula-item-versions",
    ),
    path(
        "api/formula-items/<uuid:item_id>/versions/<int:version_id>/restore/",
        views.api_formula_item_version_restore,
        name="api-formula-item-version-restore",
    ),
    path("api/system/health/", views.health_api, name="api-system-health"),
    path("api/system/warmup/", views.warmup_api, name="api-system-warmup"),
]

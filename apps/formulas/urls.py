from django.urls import path

from . import views

urlpatterns = [
    path("", views.landing, name="landing"),
    path("projects/", views.projects, name="projects"),
    path("projects/<uuid:project_id>/", views.project_workspace, name="project-workspace"),
    path("workbench/", views.workbench, name="workbench"),
    path("jobs/", views.create_job, name="create-job"),
    path("formula-items/<uuid:item_id>/review/", views.review_formula_item, name="review-formula-item"),
    path("missions/<uuid:job_id>/progress/", views.mission_progress, name="mission-progress"),
    path("missions/<uuid:job_id>/report/", views.mission_report, name="mission-report"),
    path("missions/<uuid:job_id>/retry/", views.retry_mission, name="retry-mission"),
    path("history/", views.history, name="history"),
    path("system/", views.system_page, name="system"),
    path("api/missions/<uuid:job_id>/", views.mission_status_api, name="api-mission-status"),
    path("api/system/health/", views.health_api, name="api-system-health"),
    path("api/system/warmup/", views.warmup_api, name="api-system-warmup"),
]

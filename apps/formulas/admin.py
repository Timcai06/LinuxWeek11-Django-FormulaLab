from django.contrib import admin

from .models import (
    BatchMission,
    FormulaItem,
    FormulaItemVersion,
    FormulaJob,
    PaperAnnotation,
    PaperChangeSuggestion,
    PaperDocument,
    PaperFile,
    PaperFileVersion,
    PaperProject,
    ProjectMembership,
)


@admin.register(PaperProject)
class PaperProjectAdmin(admin.ModelAdmin):
    list_display = (
        "project_code",
        "name",
        "default_export_format",
        "updated_at",
        "created_at",
    )
    search_fields = ("project_code", "name", "writing_goal")
    list_filter = ("default_export_format", "created_at", "updated_at")
    readonly_fields = ("project_code", "id", "created_at", "updated_at")


@admin.register(BatchMission)
class BatchMissionAdmin(admin.ModelAdmin):
    list_display = (
        "batch_code",
        "title",
        "project",
        "status",
        "created_at",
        "updated_at",
    )
    search_fields = ("batch_code", "title", "project__project_code", "project__name")
    list_filter = ("status", "created_at", "updated_at")
    readonly_fields = ("batch_code", "id", "created_at", "updated_at")


@admin.register(PaperDocument)
class PaperDocumentAdmin(admin.ModelAdmin):
    list_display = ("document_code", "title", "project", "root_file_path", "updated_at")
    search_fields = ("document_code", "title", "project__project_code", "project__name")
    readonly_fields = ("document_code", "id", "created_at", "updated_at")


@admin.register(PaperFile)
class PaperFileAdmin(admin.ModelAdmin):
    list_display = ("path", "document", "file_type", "sort_order", "updated_at")
    search_fields = ("path", "content", "document__document_code", "document__title")
    list_filter = ("file_type", "created_at", "updated_at")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(PaperFileVersion)
class PaperFileVersionAdmin(admin.ModelAdmin):
    list_display = ("file", "version_number", "source", "created_by_label", "created_at")
    search_fields = ("file__path", "content", "created_by_label", "note")
    list_filter = ("source", "created_at")
    readonly_fields = ("id", "version_number", "created_at")


@admin.register(ProjectMembership)
class ProjectMembershipAdmin(admin.ModelAdmin):
    list_display = ("project", "user", "role", "display_name", "updated_at")
    search_fields = ("project__project_code", "project__name", "user__username", "display_name")
    list_filter = ("role", "created_at", "updated_at")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(PaperAnnotation)
class PaperAnnotationAdmin(admin.ModelAdmin):
    list_display = ("file", "line_start", "line_end", "status", "created_by_label", "updated_at")
    search_fields = ("file__path", "quoted_text", "body", "created_by_label")
    list_filter = ("status", "created_at", "updated_at")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(PaperChangeSuggestion)
class PaperChangeSuggestionAdmin(admin.ModelAdmin):
    list_display = ("file", "line_start", "line_end", "status", "created_by_label", "updated_at")
    search_fields = ("file__path", "original_text", "replacement_text", "created_by_label")
    list_filter = ("status", "created_at", "updated_at")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(FormulaItem)
class FormulaItemAdmin(admin.ModelAdmin):
    list_display = (
        "formula_code",
        "project",
        "batch",
        "status",
        "quality_score",
        "sort_order",
        "updated_at",
    )
    search_fields = (
        "formula_code",
        "latex_current",
        "project__project_code",
        "project__name",
        "batch__batch_code",
        "batch__title",
    )
    list_filter = ("status", "quality_score", "created_at", "updated_at")
    readonly_fields = ("formula_code", "id", "created_at", "updated_at")


@admin.register(FormulaItemVersion)
class FormulaItemVersionAdmin(admin.ModelAdmin):
    list_display = (
        "item",
        "source",
        "created_by_label",
        "created_at",
    )
    search_fields = ("item__formula_code", "latex", "created_by_label", "note")
    list_filter = ("source", "created_at")
    readonly_fields = ("id", "created_at")


@admin.register(FormulaJob)
class FormulaJobAdmin(admin.ModelAdmin):
    list_display = (
        "mission_code",
        "id",
        "project",
        "batch",
        "status",
        "stage_label",
        "engine_name",
        "retry_of",
        "created_at",
        "duration_ms",
    )
    search_fields = (
        "mission_code",
        "project__project_code",
        "project__name",
        "batch__batch_code",
        "batch__title",
    )
    list_filter = ("status", "engine_name", "project", "batch", "created_at")
    readonly_fields = ("mission_code", "id")

from django.contrib import admin

from .models import FormulaJob


@admin.register(FormulaJob)
class FormulaJobAdmin(admin.ModelAdmin):
    list_display = ("mission_code", "id", "status", "stage_label", "engine_name", "retry_of", "created_at", "duration_ms")
    readonly_fields = ("mission_code", "id")

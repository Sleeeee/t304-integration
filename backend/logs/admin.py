from django.contrib import admin
from .models import ScanLog


@admin.register(ScanLog)
class ScanLogAdmin(admin.ModelAdmin):
    list_display = ('id_log', 'lock', 'user', 'scan_datetime', 'success')
    list_filter = ('success', 'scan_datetime', 'lock')
    search_fields = ('user__username', 'lock__name')
    readonly_fields = ('scan_datetime',)
    ordering = ('-scan_datetime',)

    fieldsets = (
        ('Informations du scan', {
            'fields': ('lock', 'user', 'success')
        }),
        ('Date et heure', {
            'fields': ('scan_datetime',)
        }),
    )

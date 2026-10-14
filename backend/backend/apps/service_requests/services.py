from typing import Any

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.accounts.models import User
from apps.service_requests.models import ServiceRequest, ServiceRequestEvent


ALLOWED_STATUS_TRANSITIONS: dict[str, set[str]] = {
    ServiceRequest.Status.NEW: {
        ServiceRequest.Status.REVIEWING,
        ServiceRequest.Status.ASSIGNED,
        ServiceRequest.Status.CANCELLED,
    },
    ServiceRequest.Status.REVIEWING: {
        ServiceRequest.Status.ASSIGNED,
        ServiceRequest.Status.IN_PROGRESS,
        ServiceRequest.Status.CANCELLED,
    },
    ServiceRequest.Status.ASSIGNED: {
        ServiceRequest.Status.IN_PROGRESS,
        ServiceRequest.Status.CANCELLED,
    },
    ServiceRequest.Status.IN_PROGRESS: {
        ServiceRequest.Status.COMPLETED,
        ServiceRequest.Status.CANCELLED,
    },
    ServiceRequest.Status.COMPLETED: set(),
    ServiceRequest.Status.CANCELLED: set(),
}


@transaction.atomic
def update_service_request(
    *,
    request_id: int,
    changes: dict[str, Any],
    actor: User,
) -> ServiceRequest:
    service_request = ServiceRequest.objects.select_for_update().get(
        pk=request_id
    )
    previous_status = service_request.status
    previous_expert_id = service_request.assigned_expert_id
    target_status = changes.get("status", previous_status)
    assigned_expert = changes.get("assigned_expert")

    if (
        assigned_expert is not None
        and previous_status
        in {ServiceRequest.Status.NEW, ServiceRequest.Status.REVIEWING}
        and "status" not in changes
    ):
        target_status = ServiceRequest.Status.ASSIGNED

    if (
        target_status != previous_status
        and target_status not in ALLOWED_STATUS_TRANSITIONS[previous_status]
    ):
        raise ValidationError(
            {"status": "This service request status transition is not allowed."}
        )

    effective_expert = changes.get(
        "assigned_expert",
        service_request.assigned_expert,
    )
    if (
        target_status
        in {
            ServiceRequest.Status.ASSIGNED,
            ServiceRequest.Status.IN_PROGRESS,
            ServiceRequest.Status.COMPLETED,
        }
        and effective_expert is None
    ):
        raise ValidationError(
            {"assigned_expert": "Assign an active expert before this status."}
        )

    changes["status"] = target_status
    for field, value in changes.items():
        setattr(service_request, field, value)

    if target_status == ServiceRequest.Status.COMPLETED:
        service_request.completed_at = timezone.now()

    update_fields = {*changes.keys(), "updated_at"}
    if target_status == ServiceRequest.Status.COMPLETED:
        update_fields.add("completed_at")
    service_request.save(update_fields=update_fields)

    assignment_changed = (
        service_request.assigned_expert_id != previous_expert_id
    )
    if target_status != previous_status or assignment_changed:
        note = str(
            changes.get("admin_note") or changes.get("expert_note") or ""
        )
        ServiceRequestEvent.objects.create(
            service_request=service_request,
            actor=actor,
            from_status=previous_status,
            to_status=target_status,
            note=note,
        )

    return service_request

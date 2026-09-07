from typing import Any, Dict, Optional
from fastapi import HTTPException, status


class CustomHTTPException(HTTPException):
    def __init__(
        self,
        status_code: int,
        detail: str,
        code: Optional[str] = None,
        headers: Optional[Dict[str, str]] = None,
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)
        self.code = code or f"ERR_{status_code}"


class WorkflowValidationError(CustomHTTPException):
    def __init__(self, detail: str, missing_step: Optional[str] = None):
        msg = detail
        if missing_step:
            msg = f"Workflow guard failed: {detail} (Incomplete step: {missing_step})"
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg,
            code="WORKFLOW_VALIDATION_ERROR",
        )


class ResourceNotFoundError(CustomHTTPException):
    def __init__(self, resource_name: str, resource_id: Any):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource_name} with ID '{resource_id}' was not found.",
            code="RESOURCE_NOT_FOUND",
        )


class UnauthorizedError(CustomHTTPException):
    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            code="UNAUTHORIZED",
            headers={"WWW-Authenticate": "Bearer"},
        )


class ForbiddenError(CustomHTTPException):
    def __init__(self, detail: str = "Operation forbidden for this resource"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            code="FORBIDDEN",
        )


class ConflictError(CustomHTTPException):
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
            code="STATE_CONFLICT",
        )

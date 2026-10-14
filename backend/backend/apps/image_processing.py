from __future__ import annotations

from io import BytesIO
from pathlib import Path

from django.core.files.base import ContentFile
from PIL import Image, ImageOps, UnidentifiedImageError


ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP"}
MAX_IMAGE_PIXELS = 40_000_000
Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS


class InvalidImageUpload(ValueError):
    """Raised when an uploaded image cannot be safely processed."""


def _has_alpha(image: Image.Image) -> bool:
    return image.mode in {"RGBA", "LA"} or (
        image.mode == "P" and "transparency" in image.info
    )


def compress_uploaded_image(
    upload,
    *,
    max_input_bytes: int,
    target_bytes: int,
    max_dimension: int,
    preserve_transparency: bool = False,
) -> ContentFile:
    """Validate and normalize an upload to a metadata-free WebP image."""

    if upload.size > max_input_bytes:
        raise InvalidImageUpload(
            f"Image must be no larger than {max_input_bytes // (1024 * 1024)} MB."
        )

    try:
        upload.seek(0)
        with Image.open(upload) as source:
            if source.format not in ALLOWED_IMAGE_FORMATS:
                raise InvalidImageUpload(
                    "Only valid JPEG, PNG, and WebP images are accepted."
                )
            source.load()
            image = ImageOps.exif_transpose(source).copy()
    except (Image.DecompressionBombError, UnidentifiedImageError, OSError) as exc:
        raise InvalidImageUpload(
            "Only valid JPEG, PNG, and WebP images are accepted."
        ) from exc
    finally:
        upload.seek(0)

    if preserve_transparency and _has_alpha(image):
        image = image.convert("RGBA")
    else:
        if _has_alpha(image):
            background = Image.new("RGB", image.size, "white")
            alpha_image = image.convert("RGBA")
            background.paste(alpha_image, mask=alpha_image.getchannel("A"))
            image = background
        else:
            image = image.convert("RGB")

    image.thumbnail(
        (max_dimension, max_dimension),
        Image.Resampling.LANCZOS,
    )

    encoded = b""
    working = image
    for _resize_attempt in range(9):
        for quality in (84, 77, 70, 63, 56, 49, 42):
            output = BytesIO()
            working.save(
                output,
                format="WEBP",
                quality=quality,
                method=6,
                optimize=True,
            )
            encoded = output.getvalue()
            if len(encoded) <= target_bytes:
                break
        if len(encoded) <= target_bytes:
            break
        longest_side = max(working.size)
        if longest_side <= 320:
            break
        scale = max(320 / longest_side, 0.82)
        new_size = (
            max(1, round(working.width * scale)),
            max(1, round(working.height * scale)),
        )
        if new_size == working.size:
            break
        working = working.resize(new_size, Image.Resampling.LANCZOS)

    if not encoded or len(encoded) > target_bytes:
        raise InvalidImageUpload(
            "The image could not be compressed to the required size."
        )

    stem = Path(upload.name).stem[:80] or "image"
    return ContentFile(encoded, name=f"{stem}.webp")

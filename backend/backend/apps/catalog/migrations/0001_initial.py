# Generated manually for Karvo catalog V1.

import django.core.validators
import django.db.models.deletion
import django.db.models.functions.text
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Brand",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(max_length=100)),
                ("name_fa", models.CharField(blank=True, max_length=100)),
                ("slug", models.SlugField(max_length=120, unique=True)),
                ("logo_url", models.URLField(blank=True, max_length=500)),
                ("country", models.CharField(blank=True, max_length=80)),
                ("is_active", models.BooleanField(default=True)),
                ("sort_order", models.PositiveIntegerField(default=0)),
            ],
            options={
                "ordering": ("sort_order", "name", "id"),
            },
        ),
        migrations.CreateModel(
            name="VehicleModel",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(max_length=120)),
                ("name_fa", models.CharField(blank=True, max_length=120)),
                ("slug", models.SlugField(max_length=180, unique=True)),
                (
                    "body_type",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("sedan", "Sedan"),
                            ("hatchback", "Hatchback"),
                            ("suv", "SUV"),
                            ("crossover", "Crossover"),
                            ("coupe", "Coupe"),
                            ("convertible", "Convertible"),
                            ("wagon", "Wagon"),
                            ("pickup", "Pickup"),
                            ("van", "Van"),
                            ("minivan", "Minivan"),
                            ("other", "Other"),
                        ],
                        max_length=20,
                    ),
                ),
                ("is_active", models.BooleanField(default=True)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                (
                    "brand",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="vehicle_models",
                        to="catalog.brand",
                    ),
                ),
            ],
            options={
                "ordering": ("brand__sort_order", "sort_order", "name", "id"),
            },
        ),
        migrations.CreateModel(
            name="VehicleTrim",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(max_length=160)),
                ("name_fa", models.CharField(blank=True, max_length=160)),
                ("slug", models.SlugField(max_length=220, unique=True)),
                (
                    "production_start_year",
                    models.PositiveSmallIntegerField(
                        blank=True,
                        null=True,
                        validators=[
                            django.core.validators.MinValueValidator(1886),
                            django.core.validators.MaxValueValidator(2100),
                        ],
                    ),
                ),
                (
                    "production_end_year",
                    models.PositiveSmallIntegerField(
                        blank=True,
                        null=True,
                        validators=[
                            django.core.validators.MinValueValidator(1886),
                            django.core.validators.MaxValueValidator(2100),
                        ],
                    ),
                ),
                (
                    "engine_displacement_cc",
                    models.PositiveIntegerField(
                        blank=True,
                        null=True,
                        validators=[
                            django.core.validators.MinValueValidator(1),
                            django.core.validators.MaxValueValidator(20000),
                        ],
                    ),
                ),
                (
                    "power_hp",
                    models.PositiveIntegerField(
                        blank=True,
                        null=True,
                        validators=[
                            django.core.validators.MinValueValidator(1),
                            django.core.validators.MaxValueValidator(5000),
                        ],
                    ),
                ),
                (
                    "torque_nm",
                    models.PositiveIntegerField(
                        blank=True,
                        null=True,
                        validators=[
                            django.core.validators.MinValueValidator(1),
                            django.core.validators.MaxValueValidator(10000),
                        ],
                    ),
                ),
                (
                    "transmission",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("manual", "Manual"),
                            ("automatic", "Automatic"),
                            ("cvt", "CVT"),
                            ("dct", "DCT"),
                            ("amt", "AMT"),
                            ("other", "Other"),
                        ],
                        max_length=20,
                    ),
                ),
                (
                    "fuel_type",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("gasoline", "Gasoline"),
                            ("diesel", "Diesel"),
                            ("hybrid", "Hybrid"),
                            ("phev", "Plug-in hybrid"),
                            ("electric", "Electric"),
                            ("cng", "CNG"),
                            ("other", "Other"),
                        ],
                        max_length=20,
                    ),
                ),
                (
                    "drivetrain",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("fwd", "Front-wheel drive"),
                            ("rwd", "Rear-wheel drive"),
                            ("awd", "All-wheel drive"),
                            ("4wd", "Four-wheel drive"),
                            ("other", "Other"),
                        ],
                        max_length=20,
                    ),
                ),
                ("is_active", models.BooleanField(default=True)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                (
                    "vehicle_model",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="trims",
                        to="catalog.vehiclemodel",
                    ),
                ),
            ],
            options={
                "ordering": (
                    "vehicle_model__brand__sort_order",
                    "vehicle_model__sort_order",
                    "sort_order",
                    "name",
                    "id",
                ),
            },
        ),
        migrations.AddConstraint(
            model_name="brand",
            constraint=models.UniqueConstraint(
                django.db.models.functions.text.Lower("name"),
                name="catalog_brand_name_ci_unique",
            ),
        ),
        migrations.AddIndex(
            model_name="brand",
            index=models.Index(
                fields=["is_active", "sort_order"],
                name="catalog_brand_active_sort_idx",
            ),
        ),
        migrations.AddConstraint(
            model_name="vehiclemodel",
            constraint=models.UniqueConstraint(
                models.F("brand"),
                django.db.models.functions.text.Lower("name"),
                name="catalog_model_brand_name_ci_unique",
            ),
        ),
        migrations.AddIndex(
            model_name="vehiclemodel",
            index=models.Index(
                fields=["brand", "is_active", "sort_order"],
                name="catalog_model_parent_active_idx",
            ),
        ),
        migrations.AddConstraint(
            model_name="vehicletrim",
            constraint=models.UniqueConstraint(
                models.F("vehicle_model"),
                django.db.models.functions.text.Lower("name"),
                name="catalog_trim_model_name_ci_unique",
            ),
        ),
        migrations.AddConstraint(
            model_name="vehicletrim",
            constraint=models.CheckConstraint(
                condition=(
                    models.Q(production_start_year__isnull=True)
                    | models.Q(production_end_year__isnull=True)
                    | models.Q(
                        production_end_year__gte=models.F(
                            "production_start_year"
                        )
                    )
                ),
                name="catalog_trim_valid_year_range",
            ),
        ),
        migrations.AddIndex(
            model_name="vehicletrim",
            index=models.Index(
                fields=["vehicle_model", "is_active", "sort_order"],
                name="catalog_trim_parent_active_idx",
            ),
        ),
    ]

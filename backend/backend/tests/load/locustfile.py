from __future__ import annotations

import os

from locust import HttpUser, between, task


class KarvoApiUser(HttpUser):
    wait_time = between(0.5, 2.0)

    def on_start(self) -> None:
        self.access_token = os.getenv("LOCUST_ACCESS_TOKEN", "")

    @task(4)
    def health_check(self) -> None:
        with self.client.get(
            "/api/health/",
            name="GET /api/health/",
            catch_response=True,
        ) as response:
            if response.status_code != 200:
                response.failure(
                    f"Unexpected status: {response.status_code}"
                )

    @task(2)
    def catalog_brands(self) -> None:
        with self.client.get(
            "/api/v1/catalog/brands/",
            name="GET /api/v1/catalog/brands/",
            catch_response=True,
        ) as response:
            if response.status_code != 200:
                response.failure(
                    f"Unexpected status: {response.status_code}"
                )

    @task(3)
    def comparison_candidates(self) -> None:
        with self.client.get(
            "/api/v1/catalog/listings/comparison-candidates/?page_size=16",
            name="GET /api/v1/catalog/listings/comparison-candidates/",
            catch_response=True,
        ) as response:
            if response.status_code != 200:
                response.failure(
                    f"Unexpected status: {response.status_code}"
                )

    @task(4)
    def public_listing_summaries(self) -> None:
        with self.client.get(
            "/api/v1/catalog/listings/?summary=true&page_size=12",
            name="GET /api/v1/catalog/listings/ [summary]",
            catch_response=True,
        ) as response:
            if response.status_code != 200:
                response.failure(
                    f"Unexpected status: {response.status_code}"
                )

    @task(2)
    def public_business_directory(self) -> None:
        with self.client.get(
            "/api/v1/businesses/?kind=gallery&page_size=12",
            name="GET /api/v1/businesses/ [gallery]",
            catch_response=True,
        ) as response:
            if response.status_code != 200:
                response.failure(
                    f"Unexpected status: {response.status_code}"
                )

    @task(1)
    def my_service_requests_or_health_fallback(self) -> None:
        if not self.access_token:
            self.client.get(
                "/api/health/",
                name="GET /api/health/ [service fallback]",
            )
            return

        with self.client.get(
            "/api/v1/service-requests/mine/?page_size=20",
            headers={
                "Authorization": f"Bearer {self.access_token}"
            },
            name="GET /api/v1/service-requests/mine/",
            catch_response=True,
        ) as response:
            if response.status_code != 200:
                response.failure(
                    f"Unexpected status: {response.status_code}"
                )

    @task(1)
    def current_user_or_health_fallback(self) -> None:
        if not self.access_token:
            self.client.get(
                "/api/health/",
                name="GET /api/health/ [fallback]",
            )
            return

        self.client.get(
            "/api/v1/auth/me/",
            headers={
                "Authorization": (
                    f"Bearer {self.access_token}"
                )
            },
            name="GET /api/v1/auth/me/",
        )

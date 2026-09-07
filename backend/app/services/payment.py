"""Payment abstraction layer.

Provides a pluggable PaymentProvider abstraction so the platform can support
multiple providers (card, mobile money, bank transfer, wallet). Providers are
selected via the PAYMENT_PROVIDER setting.

The default provider is `simulated` which is meant for development/testing and
simulates a successful gateway. Real providers can be implemented by
subclassing PaymentProvider and registering them in get_provider().
"""
from abc import ABC, abstractmethod
from typing import Optional
from app.core.config import settings
from app.core.exceptions import PaymentException


class PaymentProvider(ABC):
    """Base class for payment provider adapters."""

    name: str = "base"

    @abstractmethod
    async def initialize_payment(
        self,
        reference: str,
        amount: float,
        currency: str,
        metadata: Optional[dict] = None,
    ) -> dict:
        """Initialize a payment session. Returns a dict with keys:
        - success: bool
        - checkout_url: optional redirect URL
        - payload: provider-specific extra data
        """
        raise NotImplementedError

    @abstractmethod
    async def verify_payment(self, reference: str, provider_payload: Optional[dict] = None) -> dict:
        """Verify a payment with the provider. Returns:
        - success: bool
        - status: successful | failed | pending | cancelled
        """
        raise NotImplementedError

    async def refund_payment(self, reference: str, amount: float) -> dict:
        """Attempt a refund. Returns success + provider data."""
        return {"success": False, "message": "Refund not supported by provider"}


class SimulatedProvider(PaymentProvider):
    """Development/testing provider that always succeeds.

    In production this must be replaced with a real gateway adapter.
    """

    name = "simulated"

    async def initialize_payment(self, reference: str, amount: float, currency: str, metadata: Optional[dict] = None) -> dict:
        return {
            "success": True,
            "checkout_url": None,
            "payload": {
                "mode": "simulated",
                "note": "Development provider - payment auto-verifies as successful",
            },
        }

    async def verify_payment(self, reference: str, provider_payload: Optional[dict] = None) -> dict:
        return {
            "success": True,
            "status": "successful",
            "reference": reference,
        }


def get_payment_provider() -> PaymentProvider:
    """Return the configured payment provider adapter."""
    provider_name = getattr(settings, "PAYMENT_PROVIDER", "simulated").lower()
    providers = {
        "simulated": SimulatedProvider,
    }
    provider_cls = providers.get(provider_name)
    if not provider_cls:
        raise PaymentException(f"Unsupported payment provider: {provider_name}")
    return provider_cls()
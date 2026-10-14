from __future__ import annotations

import json
import logging
import os
import re
from urllib import error, request

from apps.content.models import FrequentlyAskedQuestion, SupportMessage


logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """شما دستیار پشتیبانی فارسی وب‌سایت آزادگذر هستید؛ بازار تخصصی خودروهای مناطق آزاد.
پاسخ‌ها را کوتاه، روشن و محترمانه بنویس. فقط از اطلاعات زمینه‌ای ارائه‌شده استفاده کن و اگر مطمئن نیستی صادقانه بگو.
اطلاعات حساس مثل رمز، کد یکبارمصرف، شماره کارت یا تصویر مدرک درخواست نکن. قیمت قطعی، مشاوره حقوقی قطعی یا تضمین معامله نده.
برای کارهایی که نیازمند بررسی حساب، آگهی یا مدارک هستند، کاربر را به «تماس با پشتیبانی انسانی» هدایت کن."""


def ai_support_enabled() -> bool:
    return bool(_api_key())


def _api_key() -> str:
    return (
        os.getenv("AI_SUPPORT_API_KEY", "").strip()
        or os.getenv("OPENAI_API_KEY", "").strip()
    )


def _tokens(value: str) -> set[str]:
    return {
        token
        for token in re.findall(r"[\w\u0600-\u06ff]+", value.lower())
        if len(token) > 2
    }


def _relevant_faqs(question: str, limit: int = 4) -> list[FrequentlyAskedQuestion]:
    question_tokens = _tokens(question)
    candidates = FrequentlyAskedQuestion.objects.filter(is_published=True).only(
        "question", "answer", "category"
    )[:100]
    ranked = sorted(
        candidates,
        key=lambda faq: len(question_tokens & _tokens(f"{faq.question} {faq.answer}")),
        reverse=True,
    )
    return [faq for faq in ranked if question_tokens & _tokens(f"{faq.question} {faq.answer}")][:limit]


def _knowledge_context(question: str) -> tuple[str, list[FrequentlyAskedQuestion]]:
    faqs = _relevant_faqs(question)
    if not faqs:
        return "سؤال متداول مرتبطی ثبت نشده است.", []
    parts = [f"سؤال: {faq.question}\nپاسخ: {faq.answer}" for faq in faqs]
    return "\n\n".join(parts), faqs


def _fallback_reply(question: str, faqs: list[FrequentlyAskedQuestion]) -> str:
    if faqs:
        return faqs[0].answer

    normalized = question.replace("ي", "ی").replace("ك", "ک")
    if any(word in normalized for word in ("آگهی", "فروش", "ثبت خودرو")):
        return "برای ثبت آگهی، وارد حساب شوید و از گزینه «ثبت آگهی» اطلاعات و تصاویر خودرو را کامل کنید. آگهی پس از بررسی نمایش داده می‌شود."
    if any(word in normalized for word in ("خرید", "جستجو", "خودرو پیدا")):
        return "از بخش «خرید خودرو» می‌توانید برند، نوع بدنه و بازه قیمت را انتخاب کنید و سپس جزئیات هر آگهی را ببینید."
    if any(word in normalized for word in ("نمایشگاه", "نمایندگی", "مدارک")):
        return "نمایشگاه برای بنگاه‌داران و نمایندگی برای شرکت واردکننده خودرو است. تأیید هرکدام به مدارک متناسب با همان نوع کسب‌وکار نیاز دارد."
    if any(word in normalized for word in ("فوری", "ویژه")):
        return "خودروهای دارای برچسب فروش فوری یا فروش ویژه در صفحه اختصاصی همان کمپین نمایش داده می‌شوند. فیلترهای قیمت و برند را هم بررسی کنید."
    if any(word in normalized for word in ("انسان", "کارشناس", "تماس", "اپراتور")):
        return "برای بررسی انسانی، از صفحه «تماس با ما» پیام بفرستید تا درخواست شما در پنل پشتیبانی ثبت شود."
    return "پیام شما ثبت شد. لطفاً موضوع را کمی دقیق‌تر بنویسید؛ مثلاً خرید خودرو، ثبت آگهی، فروش فوری، حساب کاربری یا تأیید مدارک."


def _provider_reply(*, question: str, history: list[SupportMessage], context: str) -> str:
    base_url = os.getenv("AI_SUPPORT_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    model = os.getenv("AI_SUPPORT_MODEL", "gpt-4.1-mini").strip()
    timeout = float(os.getenv("AI_SUPPORT_TIMEOUT_SECONDS", "20"))
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "system", "content": f"اطلاعات تأییدشده سایت:\n{context}"},
    ]
    role_map = {
        SupportMessage.Sender.USER: "user",
        SupportMessage.Sender.AI: "assistant",
        SupportMessage.Sender.SUPPORT: "assistant",
    }
    for message in history[-10:]:
        messages.append({"role": role_map[message.sender], "content": message.text})
    messages.append({"role": "user", "content": question})

    payload = json.dumps(
        {"model": model, "messages": messages, "temperature": 0.2, "max_tokens": 450}
    ).encode("utf-8")
    api_request = request.Request(
        f"{base_url}/chat/completions",
        data=payload,
        headers={
            "Authorization": f"Bearer {_api_key()}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with request.urlopen(api_request, timeout=timeout) as response:
        data = json.loads(response.read().decode("utf-8"))
    text = data["choices"][0]["message"]["content"].strip()
    if not text:
        raise ValueError("AI provider returned an empty answer.")
    return text[:2000]


def generate_support_reply(*, question: str, history: list[SupportMessage]) -> str:
    context, faqs = _knowledge_context(question)
    if not ai_support_enabled():
        return _fallback_reply(question, faqs)
    try:
        return _provider_reply(question=question, history=history, context=context)
    except (error.URLError, TimeoutError, ValueError, KeyError, IndexError, json.JSONDecodeError):
        logger.exception("AI support provider failed; returning the local support answer.")
        return _fallback_reply(question, faqs)

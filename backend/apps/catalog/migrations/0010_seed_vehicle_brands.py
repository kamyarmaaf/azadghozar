from django.db import migrations
from django.db.models import Q
from django.utils.text import slugify


BRANDS = (
    ("Abarth", "آبارث", "ایتالیا"),
    ("Acura", "آکورا", "ژاپن"),
    ("Alfa Romeo", "آلفارومئو", "ایتالیا"),
    ("Aston Martin", "استون مارتین", "بریتانیا"),
    ("Audi", "آئودی", "آلمان"),
    ("Bentley", "بنتلی", "بریتانیا"),
    ("BMW", "بی‌ام‌و", "آلمان"),
    ("Bugatti", "بوگاتی", "فرانسه"),
    ("Buick", "بیوک", "آمریکا"),
    ("Cadillac", "کادیلاک", "آمریکا"),
    ("Chevrolet", "شورولت", "آمریکا"),
    ("Chrysler", "کرایسلر", "آمریکا"),
    ("Citroen", "سیتروئن", "فرانسه"),
    ("Cupra", "کوپرا", "اسپانیا"),
    ("Dacia", "داچیا", "رومانی"),
    ("Daewoo", "دوو", "کره جنوبی"),
    ("Daihatsu", "دایهاتسو", "ژاپن"),
    ("Dodge", "دوج", "آمریکا"),
    ("DS Automobiles", "دی‌اس", "فرانسه"),
    ("Ferrari", "فراری", "ایتالیا"),
    ("Fiat", "فیات", "ایتالیا"),
    ("Ford", "فورد", "آمریکا"),
    ("Genesis", "جنسیس", "کره جنوبی"),
    ("GMC", "جی‌ام‌سی", "آمریکا"),
    ("Honda", "هوندا", "ژاپن"),
    ("Hyundai", "هیوندای", "کره جنوبی"),
    ("Infiniti", "اینفینیتی", "ژاپن"),
    ("Isuzu", "ایسوزو", "ژاپن"),
    ("Iveco", "ایویکو", "ایتالیا"),
    ("Jaguar", "جگوار", "بریتانیا"),
    ("Jeep", "جیپ", "آمریکا"),
    ("Kia", "کیا", "کره جنوبی"),
    ("Koenigsegg", "کونیگزگ", "سوئد"),
    ("Lamborghini", "لامبورگینی", "ایتالیا"),
    ("Lancia", "لانچیا", "ایتالیا"),
    ("Land Rover", "لندروور", "بریتانیا"),
    ("Lexus", "لکسوس", "ژاپن"),
    ("Lincoln", "لینکلن", "آمریکا"),
    ("Lotus", "لوتوس", "بریتانیا"),
    ("Maserati", "مازراتی", "ایتالیا"),
    ("Mazda", "مزدا", "ژاپن"),
    ("McLaren", "مک‌لارن", "بریتانیا"),
    ("Mercedes-Benz", "مرسدس بنز", "آلمان"),
    ("MG", "ام‌جی", "بریتانیا"),
    ("MINI", "مینی", "بریتانیا"),
    ("Mitsubishi", "میتسوبیشی", "ژاپن"),
    ("Nissan", "نیسان", "ژاپن"),
    ("Opel", "اوپل", "آلمان"),
    ("Peugeot", "پژو", "فرانسه"),
    ("Polestar", "پل‌استار", "سوئد"),
    ("Porsche", "پورشه", "آلمان"),
    ("Renault", "رنو", "فرانسه"),
    ("Rolls-Royce", "رولزرویس", "بریتانیا"),
    ("Saab", "ساب", "سوئد"),
    ("SEAT", "سئات", "اسپانیا"),
    ("Skoda", "اشکودا", "جمهوری چک"),
    ("Smart", "اسمارت", "آلمان"),
    ("Subaru", "سوبارو", "ژاپن"),
    ("Suzuki", "سوزوکی", "ژاپن"),
    ("Tesla", "تسلا", "آمریکا"),
    ("Toyota", "تویوتا", "ژاپن"),
    ("Volkswagen", "فولکس‌واگن", "آلمان"),
    ("Volvo", "ولوو", "سوئد"),
    ("Lada", "لادا", "روسیه"),
    ("Proton", "پروتون", "مالزی"),
    ("KGM", "کی‌جی‌ام (سانگ‌یانگ)", "کره جنوبی"),
    ("Tata", "تاتا", "هند"),
    ("Mahindra", "ماهیندرا", "هند"),
    ("BAIC", "بایک", "چین"),
    ("Bestune", "بستیون", "چین"),
    ("Borgward", "بورگوارد", "آلمان"),
    ("Brilliance", "برلیانس", "چین"),
    ("BYD", "بی‌وای‌دی", "چین"),
    ("Changan", "چانگان", "چین"),
    ("Chery", "چری", "چین"),
    ("Dongfeng", "دانگ‌فنگ", "چین"),
    ("Exeed", "اکسید", "چین"),
    ("FAW", "فاو", "چین"),
    ("Foton", "فوتون", "چین"),
    ("GAC", "گک", "چین"),
    ("Geely", "جیلی", "چین"),
    ("Great Wall", "گریت وال", "چین"),
    ("Haima", "هایما", "چین"),
    ("Haval", "هاوال", "چین"),
    ("Hongqi", "هونگچی", "چین"),
    ("JAC", "جک", "چین"),
    ("Jaecoo", "جیکو", "چین"),
    ("Jetour", "جتور", "چین"),
    ("Kaiyi", "کایی", "چین"),
    ("Leapmotor", "لیپ‌موتور", "چین"),
    ("Li Auto", "لی اتو", "چین"),
    ("Lifan", "لیفان", "چین"),
    ("Lynk & Co", "لینک اند کو", "چین"),
    ("Maxus", "مکسوس", "چین"),
    ("NIO", "نیو", "چین"),
    ("Omoda", "اومودا", "چین"),
    ("Roewe", "رووی", "چین"),
    ("Soueast", "سوئیست", "چین"),
    ("SWM", "اس‌دبلیوام", "چین"),
    ("Tank", "تانک", "چین"),
    ("Voyah", "وویا", "چین"),
    ("Wey", "وی", "چین"),
    ("XPeng", "اکسپنگ", "چین"),
    ("Zeekr", "زیکر", "چین"),
    ("Zotye", "زوتی", "چین"),
    ("IKCO", "ایران خودرو", "ایران"),
    ("Saipa", "سایپا", "ایران"),
    ("Pars Khodro", "پارس خودرو", "ایران"),
    ("MVM", "ام‌وی‌ام", "ایران"),
    ("KMC", "کی‌ام‌سی", "ایران"),
    ("FMC", "اف‌ام‌سی", "ایران"),
    ("Lamari", "لاماری", "ایران"),
    ("Bahman Motor", "بهمن موتور", "ایران"),
    ("Dayun", "دایون", "چین"),
    ("Shacman", "شاکمان", "چین"),
    ("Rivian", "ریویان", "آمریکا"),
    ("Lucid", "لوسید", "آمریکا"),
    ("VinFast", "وین‌فست", "ویتنام"),
    ("Rimac", "ریماک", "کرواسی"),
    ("Pagani", "پاگانی", "ایتالیا"),
)


def seed_vehicle_brands(apps, schema_editor) -> None:
    Brand = apps.get_model("catalog", "Brand")
    used_slugs = set(Brand.objects.values_list("slug", flat=True))
    for name, name_fa, country in BRANDS:
        brand = Brand.objects.filter(
            Q(name__iexact=name)
            | Q(name__iexact=name_fa)
            | Q(name_fa__iexact=name)
            | Q(name_fa__iexact=name_fa)
        ).first()
        if brand is not None:
            changed_fields = []
            if not brand.name_fa:
                brand.name_fa = name_fa
                changed_fields.append("name_fa")
            if not brand.country:
                brand.country = country
                changed_fields.append("country")
            if changed_fields:
                brand.save(update_fields=changed_fields)
            continue

        base_slug = slugify(name, allow_unicode=True)[:100] or "brand"
        slug = base_slug
        suffix = 2
        while slug in used_slugs:
            slug = f"{base_slug[:110 - len(str(suffix))]}-{suffix}"
            suffix += 1
        Brand.objects.create(
            name=name,
            name_fa=name_fa,
            country=country,
            slug=slug,
        )
        used_slugs.add(slug)


class Migration(migrations.Migration):
    dependencies = [("catalog", "0009_populate_brands_from_listings")]

    operations = [
        migrations.RunPython(
            seed_vehicle_brands,
            migrations.RunPython.noop,
        ),
    ]

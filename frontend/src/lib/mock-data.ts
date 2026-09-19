// Azadgozar Mock Data

export interface Vehicle {
  id: string; brand: string; brandEn: string; model: string; modelEn: string; trim: string;
  year: number; price: number; originalPrice?: number; mileage: number;
  exteriorColor: string; interiorColor: string; bodyType: string; fuelType: string;
  transmission: string; engine: string; drivetrain: string; plateType: string;
  freeZone?: string; city: string; condition: string; image: string; images: string[];
  isInstantSale: boolean; isSpecialSale: boolean; isInspected: boolean; isVerified: boolean;
  isTradeIn: boolean; sellerName: string; sellerType: string;
  sellerRating: number; features: string[]; publishedAt: string; description: string;
  countdown?: number; badge?: string;
}

export interface DealerItem { id: string; name: string; nameEn: string; city: string; address: string; phone: string; vehicleCount: number; rating: number; reviewCount: number; isVerified: boolean; logo: string; cover: string; description: string; workingHours: string; since: string; brands: string[]; }
export interface GalleryItem { id: string; name: string; nameEn: string; city: string; address: string; phone: string; vehicleCount: number; rating: number; reviewCount: number; isVerified: boolean; logo: string; cover: string; description: string; workingHours: string; since: string; brands: string[]; }
export interface BrandItem { id: string; name: string; nameEn: string; vehicleCount: number; logo: string; }
export interface BlogArticle { id: string; title: string; summary: string; author: string; date: string; readTime: string; category: string; image: string; content?: string; }
export interface VideoItem { id: string; title: string; duration: string; category: string; views: string; thumbnail: string; description?: string; content?: string; author?: string; date?: string; }
export interface FAQItem { id: string; question: string; answer: string; }

export const carImages = [
  "/images/car-1.jpg",
  "/images/car-2.jpg",
  "/images/car-3.jpg",
  "/images/car-4.jpg",
  "/images/car-5.jpg",
  "/images/car-6.jpg",
  "/images/car-7.jpg",
  "/images/car-8.jpg",
  "/images/car-9.jpg",
  "/images/car-10.jpg",
  "/images/car-11.jpg",
  "/images/car-12.jpg",
];

export const heroImages = [
  "/images/hero-1.jpg",
  "/images/hero-2.jpg",
  "/images/hero-3.jpg",
  "/images/hero-4.jpg",
  "/images/hero-1.jpg",
  "/images/hero-2.jpg",
];

export const bodyTypeImages: Record<string, string> = {
  "سدان": "/images/body-sedan.jpg",
  "هاچ‌بک": "/images/body-hatchback.jpg",
  "شاسی‌بلند": "/images/body-suv.jpg",
  "کراس‌اوور": "/images/body-crossover.jpg",
  "کوپه": "/images/body-coupe.jpg",
  "کابریوله": "/images/body-cabriolet.jpg",
  "پیکاپ": "/images/body-suv.jpg",
  "وانت": "/images/body-suv.jpg",
  "اسپرت": "/images/body-coupe.jpg",
  "کلاسیک": "/images/body-sedan.jpg",
};

export const budgetImages = [
  "/images/budget-1.jpg",
  "/images/budget-2.jpg",
  "/images/budget-3.jpg",
  "/images/budget-4.jpg",
];

export const vehicles: Vehicle[] = [
  { id:"v1", brand:"مرسدس بنز", brandEn:"Mercedes-Benz", model:"کلاس E", modelEn:"E-Class", trim:"E300 AMG Line", year:2023, price:12500000000, originalPrice:13200000000, mileage:8500, exteriorColor:"نقره‌ای", interiorColor:"مشکی", bodyType:"سدان", fuelType:"بنزینی", transmission:"اتوماتیک", engine:"۲۰۰۰ سی‌سی توربو", drivetrain:"دو دیفرانسیل", plateType:"free-zone", freeZone:"کیش", city:"تهران", condition:"آکبند", image:carImages[0], images:[carImages[0],carImages[1],carImages[2]], isInstantSale:true, isSpecialSale:false, isInspected:true, isVerified:true, isTradeIn:true, sellerName:"نمایشگاه رویال موتورز", sellerType:"gallery", sellerRating:4.8, features:["صندلی چرم","نمایشگر لمسی","دوربین ۳۶۰ درجه","سانروف","رینگ آلیاژی ۱۹ اینچ"], publishedAt:"۲ ساعت پیش", description:"مرسدس بنز کلاس E مدل ۲۰۲۳، رنگ نقره‌ای متالیک، داخل چرم مشکی. خودرو کاملا آکبند.", badge:"حراج ویژه", countdown:172800 },
  { id:"v2", brand:"بی‌ام‌و", brandEn:"BMW", model:"سری ۵", modelEn:"5 Series", trim:"530i M Sport", year:2022, price:9800000000, mileage:15000, exteriorColor:"مشکی", interiorColor:"قهوه‌ای", bodyType:"سدان", fuelType:"بنزینی", transmission:"اتوماتیک", engine:"۲۰۰۰ سی‌سی توربو", drivetrain:"دو دیفرانسیل", plateType:"temporary-import", city:"تهران", condition:"در حد نو", image:carImages[1], images:[carImages[1],carImages[2],carImages[3]], isInstantSale:false, isSpecialSale:true, isInspected:true, isVerified:true, isTradeIn:false, sellerName:"نمایندگی آلفا اتو", sellerType:"agency", sellerRating:4.9, features:["صندلی چرم","هدآپ دیسپلی","سانروف","رینگ آلیاژی ۱۸ اینچ"], publishedAt:"۵ ساعت پیش", description:"بی‌ام‌و سری ۵ مدل ۲۰۲۲ با پلاک واردات موقت. رنگ مشکی اپال، داخل چرم قهوه‌ای.", badge:"بهترین قیمت" },
  { id:"v3", brand:"پورشه", brandEn:"Porsche", model:"کاین", modelEn:"Cayenne", trim:"Cayenne S", year:2023, price:28500000000, originalPrice:30000000000, mileage:3200, exteriorColor:"سفید", interiorColor:"مشکی", bodyType:"شاسی‌بلند", fuelType:"بنزینی", transmission:"اتوماتیک", engine:"۲۹۹۵ سی‌سی توربو", drivetrain:"دو دیفرانسیل", plateType:"free-zone", freeZone:"چابهار", city:"تهران", condition:"آکبند", image:carImages[2], images:[carImages[2],carImages[0],carImages[4]], isInstantSale:true, isSpecialSale:true, isInspected:true, isVerified:true, isTradeIn:false, sellerName:"گالری پورشه پارس", sellerType:"gallery", sellerRating:5.0, features:["صندلی اسپرت","نمایشگر ۱۲.۳ اینچ","تعلیق هوایی","رینگ آلیاژی ۲۱ اینچ"], publishedAt:"۱ روز پیش", description:"پورشه کاین S مدل ۲۰۲۳، رنگ سفید کوارتز. خودرو کاملا آکبند با پلاک منطقه آزاد چابهار.", badge:"فوق‌العاده", countdown:86400 },
  { id:"v4", brand:"تویوتا", brandEn:"Toyota", model:"کمری", modelEn:"Camry", trim:"XSE 2.5", year:2024, price:6200000000, mileage:1200, exteriorColor:"خاکستری", interiorColor:"مشکی", bodyType:"سدان", fuelType:"بنزینی", transmission:"اتوماتیک", engine:"۲۵۰۰ سی‌سی", drivetrain:"جلو", plateType:"free-zone", freeZone:"قشم", city:"تهران", condition:"آکبند", image:carImages[3], images:[carImages[3],carImages[5],carImages[1]], isInstantSale:false, isSpecialSale:false, isInspected:true, isVerified:true, isTradeIn:true, sellerName:"نمایندگی تویوتا خلیج", sellerType:"agency", sellerRating:4.7, features:["نمایشگر لمسی ۹ اینچ","اپل کارپلی","رینگ آلیاژی ۱۹ اینچ"], publishedAt:"۳ ساعت پیش", description:"تویوتا کمری ۲۰۲۴ با پلاک منطقه آزاد قشم. تریم XSE با رنگ خاکستری متالیک." },
  { id:"v5", brand:"لکسوس", brandEn:"Lexus", model:"آر ایکس", modelEn:"RX", trim:"RX 350h", year:2023, price:14800000000, originalPrice:15500000000, mileage:7800, exteriorColor:"آبی", interiorColor:"کرم", bodyType:"شاسی‌بلند", fuelType:"هیبریدی", transmission:"اتوماتیک", engine:"۲۵۰۰ سی‌سی هیبریدی", drivetrain:"دو دیفرانسیل", plateType:"free-zone", freeZone:"کیش", city:"تهران", condition:"در حد نو", image:carImages[4], images:[carImages[4],carImages[2],carImages[6]], isInstantSale:true, isSpecialSale:true, isInspected:true, isVerified:true, isTradeIn:true, sellerName:"نمایشگاه لوکس موتور", sellerType:"gallery", sellerRating:4.9, features:["نمایشگر ۱۴ اینچ","مارک لویسون","سقف شیشه‌ای","رینگ ۲۰ اینچ"], publishedAt:"۸ ساعت پیش", description:"لکسوس RX 350h مدل ۲۰۲۳، هیبریدی، رنگ آبی نیتن. داخل چرم کرم.", badge:"حراج ویژه", countdown:259200 },
  { id:"v6", brand:"هیوندای", brandEn:"Hyundai", model:"توسان", modelEn:"Tucson", trim:"Ultimate 2.0", year:2024, price:5400000000, mileage:500, exteriorColor:"سفید", interiorColor:"مشکی", bodyType:"کراس‌اوور", fuelType:"بنزینی", transmission:"اتوماتیک", engine:"۲۰۰۰ سی‌سی توربو", drivetrain:"دو دیفرانسیل", plateType:"free-zone", freeZone:"ارسباران", city:"تبریز", condition:"آکبند", image:carImages[5], images:[carImages[5],carImages[3],carImages[0]], isInstantSale:false, isSpecialSale:true, isInspected:true, isVerified:true, isTradeIn:false, sellerName:"نمایندگی هیوندای آذربایجان", sellerType:"agency", sellerRating:4.6, features:["نمایشگر ۱۰.۲۵ اینچ","دوربین ۳۶۰ درجه","صندلی تهویه‌دار","رینگ ۱۹ اینچ"], publishedAt:"۱ ساعت پیش", description:"هیوندای توسان مدل ۲۰۲۴ تریم نهایی. رنگ سفید صدفی. خودرو کاملا آکبند.", badge:"تحویل فوری" },
  { id:"v7", brand:"کیا", brandEn:"Kia", model:"اسپورتیج", modelEn:"Sportage", trim:"GT-Line 2.0", year:2023, price:4800000000, originalPrice:5100000000, mileage:12000, exteriorColor:"قرمز", interiorColor:"مشکی", bodyType:"کراس‌اوور", fuelType:"بنزینی", transmission:"اتوماتیک", engine:"۲۰۰۰ سی‌سی توربو", drivetrain:"دو دیفرانسیل", plateType:"temporary-import", city:"اصفهان", condition:"در حد نو", image:carImages[6], images:[carImages[6],carImages[1],carImages[4]], isInstantSale:false, isSpecialSale:true, isInspected:true, isVerified:true, isTradeIn:true, sellerName:"نمایشگاه کیاموتور اصفهان", sellerType:"gallery", sellerRating:4.5, features:["نمایشگر دوگانه","دوربین ۳۶۰ درجه","صندلی گرمکن","رینگ ۱۹ اینچ"], publishedAt:"۱۲ ساعت پیش", description:"کیا اسپورتیج GT-Line مدل ۲۰۲۳ با پلاک واردات موقت. رنگ قرمز.", badge:"تخفیف ویژه" },
  { id:"v8", brand:"نیسان", brandEn:"Nissan", model:"پاترول", modelEn:"Patrol", trim:"Platinum", year:2023, price:22000000000, mileage:4500, exteriorColor:"مشکی", interiorColor:"کرم", bodyType:"شاسی‌بلند", fuelType:"بنزینی", transmission:"اتوماتیک", engine:"۵۶۰۰ سی‌سی V8", drivetrain:"دو دیفرانسیل", plateType:"free-zone", freeZone:"کیش", city:"تهران", condition:"آکبند", image:carImages[7], images:[carImages[7],carImages[0],carImages[2]], isInstantSale:true, isSpecialSale:false, isInspected:true, isVerified:true, isTradeIn:false, sellerName:"نمایندگی نیسان خلیج فارس", sellerType:"agency", sellerRating:4.8, features:["صندلی چرم","نمایشگر دوگانه","رینگ آلیاژی ۲۲ اینچ","تعلیق بادی"], publishedAt:"۲ روز پیش", description:"نیسان پاترول پلاتینم ۲۰۲۳، رنگ مشکی. موتور V8 ۵.۶ لیتری." },
  { id:"v9", brand:"رنج‌روور", brandEn:"Range Rover", model:"سپورت", modelEn:"Sport", trim:"HSE Dynamic", year:2023, price:25000000000, originalPrice:26500000000, mileage:6000, exteriorColor:"سبز", interiorColor:"کرم", bodyType:"شاسی‌بلند", fuelType:"بنزینی", transmission:"اتوماتیک", engine:"۳۰۰۰ سی‌سی توربو V6", drivetrain:"دو دیفرانسیل", plateType:"free-zone", freeZone:"چابهار", city:"تهران", condition:"در حد نو", image:carImages[8], images:[carImages[8],carImages[3],carImages[5]], isInstantSale:true, isSpecialSale:true, isInspected:true, isVerified:true, isTradeIn:true, sellerName:"گالری بریتانیا موتورز", sellerType:"gallery", sellerRating:5.0, features:["صندلی چرم","نمایشگر لمسی","رینگ ۲۱ اینچ","تعلیق هوایی"], publishedAt:"۴ ساعت پیش", description:"رنج‌روور سپورت HSE Dynamic ۲۰۲۳، رنگ سبز. داخل چرم کرم.", badge:"بهترین قیمت" },
  { id:"v10", brand:"آئودی", brandEn:"Audi", model:"آ۶", modelEn:"A6", trim:"45 TFSI Quattro", year:2022, price:8900000000, mileage:18000, exteriorColor:"خاکستری", interiorColor:"مشکی", bodyType:"سدان", fuelType:"بنزینی", transmission:"اتوماتیک", engine:"۲۰۰۰ سی‌سی توربو", drivetrain:"دو دیفرانسیل", plateType:"temporary-import", city:"شیراز", condition:"در حد نو", image:carImages[9], images:[carImages[9],carImages[0],carImages[4]], isInstantSale:false, isSpecialSale:true, isInspected:true, isVerified:true, isTradeIn:false, sellerName:"نمایشگاه آئودی فارس", sellerType:"gallery", sellerRating:4.7, features:["صندلی چرم","نمایشگر سه‌گانه","رینگ آلیاژی ۱۹ اینچ"], publishedAt:"۶ ساعت پیش", description:"آئودی آ۶ ۴۵ TFSI مدل ۲۰۲۲ با پلاک واردات موقت. رنگ خاکستری.", badge:"بهترین قیمت" },
  { id:"v11", brand:"ولوو", brandEn:"Volvo", model:"ایکس‌سی ۹۰", modelEn:"XC90", trim:"T6 R-Design", year:2023, price:11500000000, originalPrice:12000000000, mileage:9500, exteriorColor:"سفید", interiorColor:"مشکی", bodyType:"شاسی‌بلند", fuelType:"بنزینی", transmission:"اتوماتیک", engine:"۲۰۰۰ سی‌سی توربو سوپرشارژ", drivetrain:"دو دیفرانسیل", plateType:"free-zone", freeZone:"قشم", city:"تهران", condition:"در حد نو", image:carImages[10], images:[carImages[10],carImages[1],carImages[6]], isInstantSale:false, isSpecialSale:true, isInspected:true, isVerified:true, isTradeIn:true, sellerName:"نمایندگی ولوو اسکاندیناوی", sellerType:"agency", sellerRating:4.9, features:["صندلی چرم","نمایشگر ۹ اینچ","رینگ ۲۰ اینچ","سقف پانوراما"], publishedAt:"۱ روز پیش", description:"ولوو XC90 T6 R-Design ۲۰۲۳، رنگ سفید کریستال. داخل چرم مشکی.", badge:"تخفیف ویژه" },
  { id:"v12", brand:"فولکس‌واگن", brandEn:"Volkswagen", model:"تیگوان", modelEn:"Tiguan", trim:"R-Line 2.0", year:2024, price:5800000000, mileage:300, exteriorColor:"آبی", interiorColor:"مشکی", bodyType:"کراس‌اوور", fuelType:"بنزینی", transmission:"اتوماتیک", engine:"۲۰۰۰ سی‌سی توربو", drivetrain:"دو دیفرانسیل", plateType:"free-zone", freeZone:"ارسباران", city:"تهران", condition:"آکبند", image:carImages[11], images:[carImages[11],carImages[2],carImages[7]], isInstantSale:false, isSpecialSale:false, isInspected:true, isVerified:true, isTradeIn:false, sellerName:"نمایندگی فولکس‌واگن آذربایجان", sellerType:"agency", sellerRating:4.6, features:["نمایشگر ۱۲ اینچ","دوربین ۳۶۰ درجه","صندلی گرمکن","رینگ ۲۰ اینچ"], publishedAt:"۳۰ دقیقه پیش", description:"فولکس‌واگن تیگوان R-Line مدل ۲۰۲۴ با پلاک منطقه آزاد ارسباران." },
  { id:"v13", brand:"بی‌ام‌و", brandEn:"BMW", model:"ایکس ۵", modelEn:"X5", trim:"xDrive40i M Sport", year:2023, price:18500000000, originalPrice:19500000000, mileage:11000, exteriorColor:"سفید", interiorColor:"مشکی", bodyType:"شاسی‌بلند", fuelType:"بنزینی", transmission:"اتوماتیک", engine:"۳۰۰۰ سی‌سی توربو", drivetrain:"دو دیفرانسیل", plateType:"free-zone", freeZone:"کیش", city:"تهران", condition:"در حد نو", image:carImages[0], images:[carImages[0],carImages[3],carImages[6]], isInstantSale:true, isSpecialSale:false, isInspected:true, isVerified:true, isTradeIn:true, sellerName:"نمایشگاه رویال موتورز", sellerType:"gallery", sellerRating:4.8, features:["صندلی چرم","هدآپ دیسپلی","تعلیق هوایی","رینگ ۲۱ اینچ"], publishedAt:"۵ روز پیش", description:"بی‌ام‌و X5 M Sport ۲۰۲۳، رنگ سفید. داخل چرم مشکی.", badge:"حراج ویژه", countdown:172800 },
  { id:"v14", brand:"مرسدس بنز", brandEn:"Mercedes-Benz", model:"جی‌ال‌سی", modelEn:"GLC", trim:"GLC 300 AMG Line", year:2024, price:10500000000, mileage:2000, exteriorColor:"مشکی", interiorColor:"کرم", bodyType:"شاسی‌بلند", fuelType:"بنزینی", transmission:"اتوماتیک", engine:"۲۰۰۰ سی‌سی توربو", drivetrain:"دو دیفرانسیل", plateType:"free-zone", freeZone:"قشم", city:"اصفهان", condition:"آکبند", image:carImages[1], images:[carImages[1],carImages[4],carImages[7]], isInstantSale:false, isSpecialSale:true, isInspected:true, isVerified:true, isTradeIn:false, sellerName:"نمایندگی آلفا اتو", sellerType:"agency", sellerRating:4.9, features:["صندلی چرم","نمایشگر ۱۱.۹ اینچ","دوربین ۳۶۰ درجه","رینگ ۲۰ اینچ"], publishedAt:"۱۰ ساعت پیش", description:"مرسدس بنز GLC ۳۰۰ AMG Line ۲۰۲۴، رنگ مشکی ابسیدیان. پلاک قشم.", badge:"تحویل فوری" },
  { id:"v15", brand:"تویوتا", brandEn:"Toyota", model:"رایز", modelEn:"RAV4", trim:"Adventure 2.5", year:2023, price:5900000000, mileage:15000, exteriorColor:"سبز", interiorColor:"مشکی", bodyType:"شاسی‌بلند", fuelType:"بنزینی", transmission:"اتوماتیک", engine:"۲۵۰۰ سی‌سی", drivetrain:"دو دیفرانسیل", plateType:"temporary-import", city:"تهران", condition:"در حد نو", image:carImages[3], images:[carImages[3],carImages[8],carImages[1]], isInstantSale:false, isSpecialSale:false, isInspected:true, isVerified:true, isTradeIn:true, sellerName:"نمایندگی تویوتا خلیج", sellerType:"agency", sellerRating:4.7, features:["نمایشگر ۸ اینچ","اپل کارپلی","سقف پانوراما","رینگ ۱۸ اینچ"], publishedAt:"۲ روز پیش", description:"تویوتا رایز ادونچر ۲۰۲۳ با پلاک واردات موقت. رنگ سبز." },
  { id:"v16", brand:"کیا", brandEn:"Kia", model:"کادنزا", modelEn:"Cadenza", trim:"GT 3.5", year:2023, price:4200000000, originalPrice:4500000000, mileage:20000, exteriorColor:"سفید", interiorColor:"قهوه‌ای", bodyType:"سدان", fuelType:"بنزینی", transmission:"اتوماتیک", engine:"۳۵۰۰ سی‌سی V6", drivetrain:"جلو", plateType:"free-zone", freeZone:"کیش", city:"تهران", condition:"کارکرده تمیز", image:carImages[6], images:[carImages[6],carImages[2],carImages[9]], isInstantSale:false, isSpecialSale:true, isInspected:true, isVerified:true, isTradeIn:false, sellerName:"نمایشگاه کیاموتور اصفهان", sellerType:"gallery", sellerRating:4.5, features:["صندلی چرم","نمایشگر ۱۲.۳ اینچ","سانروف","رینگ ۱۸ اینچ"], publishedAt:"۳ روز پیش", description:"کیا کادنزا GT ۲۰۲۳، رنگ سفید. داخل چرم قهوه‌ای.", badge:"تخفیف ویژه" },
  { id:"v17", brand:"آئودی", brandEn:"Audi", model:"کیو ۵", modelEn:"Q5", trim:"45 TFSI Quattro S line", year:2023, price:9200000000, mileage:8000, exteriorColor:"نقره‌ای", interiorColor:"مشکی", bodyType:"شاسی‌بلند", fuelType:"بنزینی", transmission:"اتوماتیک", engine:"۲۰۰۰ سی‌سی توربو", drivetrain:"دو دیفرانسیل", plateType:"free-zone", freeZone:"چابهار", city:"شیراز", condition:"در حد نو", image:carImages[9], images:[carImages[9],carImages[5],carImages[0]], isInstantSale:true, isSpecialSale:false, isInspected:true, isVerified:true, isTradeIn:true, sellerName:"نمایشگاه آئودی فارس", sellerType:"gallery", sellerRating:4.7, features:["صندلی چرم","نمایشگر مجازی","دوربین ۳۶۰ درجه","رینگ ۲۰ اینچ"], publishedAt:"۶ ساعت پیش", description:"آئودی Q5 S line ۲۰۲۳، رنگ نقره‌ای متالیک. پلاک چابهار.", badge:"فروش فوری", countdown:43200 },
  { id:"v18", brand:"هیوندای", brandEn:"Hyundai", model:"سانتا‌فی", modelEn:"Santa Fe", trim:"Calligraphy 2.5", year:2024, price:7200000000, mileage:1000, exteriorColor:"مشکی", interiorColor:"کرم", bodyType:"شاسی‌بلند", fuelType:"بنزینی", transmission:"اتوماتیک", engine:"۲۵۰۰ سی‌سی توربو", drivetrain:"دو دیفرانسیل", plateType:"free-zone", freeZone:"ارسباران", city:"تبریز", condition:"آکبند", image:carImages[5], images:[carImages[5],carImages[10],carImages[3]], isInstantSale:false, isSpecialSale:true, isInspected:true, isVerified:true, isTradeIn:false, sellerName:"نمایندگی هیوندای آذربایجان", sellerType:"agency", sellerRating:4.6, features:["صندلی تهویه‌دار","نمایشگر دوگانه","دوربین ۳۶۰ درجه","سقف پانوراما"], publishedAt:"۴ ساعت پیش", description:"هیوندای سانتافه کالیگرافی ۲۰۲۴، رنگ مشکی. پلاک ارسباران.", badge:"بهترین قیمت" },
  { id:"v19", brand:"لکسوس", brandEn:"Lexus", model:"ای‌ایکس", modelEn:"IS", trim:"IS 300 F Sport", year:2023, price:7800000000, mileage:5000, exteriorColor:"سفید", interiorColor:"قرمز", bodyType:"سدان", fuelType:"بنزینی", transmission:"اتوماتیک", engine:"۲۰۰۰ سی‌سی توربو", drivetrain:"جلو", plateType:"temporary-import", city:"تهران", condition:"آکبند", image:carImages[4], images:[carImages[4],carImages[8],carImages[11]], isInstantSale:false, isSpecialSale:false, isInspected:true, isVerified:true, isTradeIn:true, sellerName:"نمایشگاه لوکس موتور", sellerType:"gallery", sellerRating:4.9, features:["صندلی اسپرت","نمایشگر ۸ اینچ","هداپ دیسپلی","رینگ ۱۹ اینچ"], publishedAt:"۱۸ ساعت پیش", description:"لکسوس IS 300 F Sport ۲۰۲۳، رنگ سفید. داخل چرم قرمز." },
  { id:"v20", brand:"پورشه", brandEn:"Porsche", model:"ماکان", modelEn:"Macan", trim:"Macan S", year:2022, price:16500000000, originalPrice:17500000000, mileage:22000, exteriorColor:"خاکستری", interiorColor:"مشکی", bodyType:"شاسی‌بلند", fuelType:"بنزینی", transmission:"اتوماتیک", engine:"۲۹۹۵ سی‌سی توربو", drivetrain:"دو دیفرانسیل", plateType:"free-zone", freeZone:"کیش", city:"تهران", condition:"کارکرده تمیز", image:carImages[2], images:[carImages[2],carImages[6],carImages[9]], isInstantSale:false, isSpecialSale:true, isInspected:true, isVerified:true, isTradeIn:false, sellerName:"گالری پورشه پارس", sellerType:"gallery", sellerRating:5.0, features:["صندلی اسپرت","نمایشگر ۱۰.۹ اینچ","تعلیق هوایی","رینگ ۲۰ اینچ"], publishedAt:"۱ هفته پیش", description:"پورشه ماکان S ۲۰۲۲، رنگ خاکستری. پلاک کیش.", badge:"تخفیف ویژه" },
  { id:"v21", brand:"نیسان", brandEn:"Nissan", model:"ایکس‌تریل", modelEn:"X-Trail", trim:"Ti 2.5", year:2023, price:5200000000, mileage:10000, exteriorColor:"سفید", interiorColor:"مشکی", bodyType:"شاسی‌بلند", fuelType:"بنزینی", transmission:"اتوماتیک", engine:"۲۵۰۰ سی‌سی", drivetrain:"دو دیفرانسیل", plateType:"free-zone", freeZone:"قشم", city:"تهران", condition:"در حد نو", image:carImages[7], images:[carImages[7],carImages[3],carImages[10]], isInstantSale:false, isSpecialSale:false, isInspected:true, isVerified:true, isTradeIn:true, sellerName:"نمایندگی نیسان خلیج فارس", sellerType:"agency", sellerRating:4.8, features:["نمایشگر ۱۲.۳ اینچ","دوربین ۳۶۰ درجه","صندلی گرمکن","رینگ ۱۸ اینچ"], publishedAt:"۲ روز پیش", description:"نیسان ایکس‌تریل Ti ۲۰۲۳، رنگ سفید. پلاک قشم." },
  { id:"v22", brand:"فولکس‌واگن", brandEn:"Volkswagen", model:"تیگوان", modelEn:"Tiguan", trim:"Allspace 2.0", year:2023, price:6200000000, mileage:7000, exteriorColor:"نقره‌ای", interiorColor:"قهوه‌ای", bodyType:"شاسی‌بلند", fuelType:"بنزینی", transmission:"اتوماتیک", engine:"۲۰۰۰ سی‌سی توربو", drivetrain:"دو دیفرانسیل", plateType:"temporary-import", city:"اصفهان", condition:"در حد نو", image:carImages[11], images:[carImages[11],carImages[4],carImages[8]], isInstantSale:false, isSpecialSale:false, isInspected:true, isVerified:true, isTradeIn:false, sellerName:"نمایندگی فولکس‌واگن آذربایجان", sellerType:"agency", sellerRating:4.6, features:["نمایشگر ۱۲ اینچ","دوربین ۳۶۰ درجه","صندلی گرمکن","رینگ ۲۰ اینچ"], publishedAt:"۳ روز پیش", description:"فولکس‌واگن تیگوان آللسپیس ۲۰۲۳، رنگ نقره‌ای. پلاک واردات موقت." },
  { id:"v23", brand:"ولوو", brandEn:"Volvo", model:"ایکس‌سی ۶۰", modelEn:"XC60", trim:"T5 R-Design", year:2023, price:9800000000, mileage:6000, exteriorColor:"آبی", interiorColor:"مشکی", bodyType:"شاسی‌بلند", fuelType:"بنزینی", transmission:"اتوماتیک", engine:"۲۰۰۰ سی‌سی توربو", drivetrain:"دو دیفرانسیل", plateType:"free-zone", freeZone:"کیش", city:"تهران", condition:"در حد نو", image:carImages[10], images:[carImages[10],carImages[5],carImages[0]], isInstantSale:false, isSpecialSale:true, isInspected:true, isVerified:true, isTradeIn:true, sellerName:"نمایندگی ولوو اسکاندیناوی", sellerType:"agency", sellerRating:4.9, features:["صندلی چرم","نمایشگر ۹ اینچ","پیلوت نیمه‌خودکار","رینگ ۲۰ اینچ"], publishedAt:"۵ روز پیش", description:"ولوو XC60 T5 R-Design ۲۰۲۳، رنگ آبی. پلاک کیش.", badge:"تخفیف ویژه" },
  { id:"v24", brand:"مرسدس بنز", brandEn:"Mercedes-Benz", model:"سی‌ال‌ای", modelEn:"CLA", trim:"CLA 200 AMG Line", year:2023, price:7800000000, mileage:4000, exteriorColor:"قرمز", interiorColor:"مشکی", bodyType:"کوپه", fuelType:"بنزینی", transmission:"اتوماتیک", engine:"۱۵۰۰ سی‌سی توربو", drivetrain:"جلو", plateType:"free-zone", freeZone:"قشم", city:"تهران", condition:"آکبند", image:carImages[0], images:[carImages[0],carImages[7],carImages[3]], isInstantSale:false, isSpecialSale:false, isInspected:true, isVerified:true, isTradeIn:false, sellerName:"نمایشگاه رویال موتورز", sellerType:"gallery", sellerRating:4.8, features:["صندلی چرم","MBUX","هداپ دیسپلی","رینگ ۱۹ اینچ"], publishedAt:"۱ روز پیش", description:"مرسدس بنز CLA ۲۰۰ AMG Line ۲۰۲۳، رنگ قرمز. پلاک قشم." },
  { id:"v25", brand:"بی‌ام‌و", brandEn:"BMW", model:"سری ۳", modelEn:"3 Series", trim:"330i M Sport", year:2024, price:7200000000, mileage:800, exteriorColor:"آبی", interiorColor:"مشکی", bodyType:"سدان", fuelType:"بنزینی", transmission:"اتوماتیک", engine:"۲۰۰۰ سی‌سی توربو", drivetrain:"جلو", plateType:"free-zone", freeZone:"چابهار", city:"تهران", condition:"آکبند", image:carImages[1], images:[carImages[1],carImages[9],carImages[4]], isInstantSale:false, isSpecialSale:false, isInspected:true, isVerified:true, isTradeIn:true, sellerName:"نمایندگی آلفا اتو", sellerType:"agency", sellerRating:4.9, features:["صندلی چرم","هدآپ دیسپلی","کروز کنترل هوشمند","رینگ ۱۹ اینچ"], publishedAt:"۸ ساعت پیش", description:"بی‌ام‌و سری ۳ M Sport ۲۰۲۴، رنگ آبی. پلاک چابهار." },
  { id:"v26", brand:"هیوندای", brandEn:"Hyundai", model:"سوناتا", modelEn:"Sonata", trim:"N Line 2.5", year:2023, price:4600000000, originalPrice:4900000000, mileage:18000, exteriorColor:"خاکستری", interiorColor:"مشکی", bodyType:"سدان", fuelType:"بنزینی", transmission:"اتوماتیک", engine:"۲۵۰۰ سی‌سی", drivetrain:"جلو", plateType:"temporary-import", city:"اصفهان", condition:"کارکرده تمیز", image:carImages[5], images:[carImages[5],carImages[10],carImages[1]], isInstantSale:false, isSpecialSale:true, isInspected:true, isVerified:true, isTradeIn:false, sellerName:"نمایندگی هیوندای آذربایجان", sellerType:"agency", sellerRating:4.6, features:["صندلی چرم","نمایشگر ۱۰.۲۵ اینچ","سانروف","رینگ ۱۸ اینچ"], publishedAt:"۴ روز پیش", description:"هیوندای سوناتا N Line ۲۰۲۳، رنگ خاکستری. پلاک واردات موقت.", badge:"تخفیف ویژه" },
  { id:"v27", brand:"رنج‌روور", brandEn:"Range Rover", model:"اوول", modelEn:"Evoque", trim:"R-Dynamic SE", year:2023, price:10500000000, mileage:5000, exteriorColor:"سفید", interiorColor:"کرم", bodyType:"کراس‌اوور", fuelType:"بنزینی", transmission:"اتوماتیک", engine:"۲۰۰۰ سی‌سی توربو", drivetrain:"دو دیفرانسیل", plateType:"free-zone", freeZone:"کیش", city:"تهران", condition:"در حد نو", image:carImages[8], images:[carImages[8],carImages[6],carImages[11]], isInstantSale:false, isSpecialSale:true, isInspected:true, isVerified:true, isTradeIn:true, sellerName:"گالری بریتانیا موتورز", sellerType:"gallery", sellerRating:5.0, features:["صندلی چرم","نمایشگر دوگانه","دوربین ۳۶۰ درجه","رینگ ۲۱ اینچ"], publishedAt:"۱ روز پیش", description:"رنج‌روور اوول R-Dynamic SE ۲۰۲۳، رنگ سفید. پلاک کیش.", badge:"بهترین قیمت" },
  { id:"v28", brand:"تویوتا", brandEn:"Toyota", model:"کرولا", modelEn:"Corolla", trim:"GR Sport 2.0", year:2024, price:3800000000, mileage:500, exteriorColor:"سفید", interiorColor:"مشکی", bodyType:"هاچ‌بک", fuelType:"بنزینی", transmission:"اتوماتیک", engine:"۲۰۰۰ سی‌سی", drivetrain:"جلو", plateType:"free-zone", freeZone:"ارسباران", city:"تبریز", condition:"آکبند", image:carImages[3], images:[carImages[3],carImages[7],carImages[0]], isInstantSale:false, isSpecialSale:false, isInspected:true, isVerified:true, isTradeIn:false, sellerName:"نمایندگی تویوتا خلیج", sellerType:"agency", sellerRating:4.7, features:["نمایشگر ۷ اینچ","اپل کارپلی","صندلی گرمکن","رینگ ۱۸ اینچ"], publishedAt:"۱۰ ساعت پیش", description:"تویوتا کرولا GR Sport ۲۰۲۴، رنگ سفید. پلاک ارسباران." },
  { id:"v29", brand:"کیا", brandEn:"Kia", model:"سیراتو", modelEn:"Cerato", trim:"GT 2.0", year:2023, price:3500000000, mileage:12000, exteriorColor:"قرمز", interiorColor:"مشکی", bodyType:"سدان", fuelType:"بنزینی", transmission:"اتوماتیک", engine:"۲۰۰۰ سی‌سی", drivetrain:"جلو", plateType:"temporary-import", city:"شیراز", condition:"در حد نو", image:carImages[6], images:[carImages[6],carImages[8],carImages[2]], isInstantSale:false, isSpecialSale:false, isInspected:true, isVerified:true, isTradeIn:true, sellerName:"نمایشگاه کیاموتور اصفهان", sellerType:"gallery", sellerRating:4.5, features:["صندلی چرم","نمایشگر ۸ اینچ","سانروف","رینگ ۱۷ اینچ"], publishedAt:"۲ روز پیش", description:"کیا سیراتو GT ۲۰۲۳، رنگ قرمز. پلاک واردات موقت." },
  { id:"v30", brand:"آئودی", brandEn:"Audi", model:"کیو ۷", modelEn:"Q7", trim:"55 TFSI Quattro S line", year:2023, price:15500000000, originalPrice:16500000000, mileage:9000, exteriorColor:"مشکی", interiorColor:"کرم", bodyType:"شاسی‌بلند", fuelType:"بنزینی", transmission:"اتوماتیک", engine:"۳۰۰۰ سی‌سی توربو", drivetrain:"دو دیفرانسیل", plateType:"free-zone", freeZone:"کیش", city:"تهران", condition:"در حد نو", image:carImages[9], images:[carImages[9],carImages[0],carImages[5]], isInstantSale:true, isSpecialSale:true, isInspected:true, isVerified:true, isTradeIn:true, sellerName:"نمایشگاه آئودی فارس", sellerType:"gallery", sellerRating:4.7, features:["صندلی چرم","نمایشگر سه‌گانه","دوربین ۳۶۰ درجه","تعلیق بادی"], publishedAt:"۳ ساعت پیش", description:"آئودی Q7 S line ۲۰۲۳، رنگ مشکی. پلاک کیش.", badge:"حراج ویژه", countdown:86400 },
];

export const dealerships: DealerItem[] = [
  { id:"d1", name:"نمایندگی آلفا اتو", nameEn:"Alpha Auto", city:"تهران", address:"خیابان ولیعصر، بالاتر از میدان ونک، پلاک ۱۲۳", phone:"۰۲۱-۸۸۷۷۶۶۵۵", vehicleCount:45, rating:4.9, reviewCount:128, isVerified:true, logo:carImages[0], cover:heroImages[0],
    description:"نمایندگی آلفا اتو با بیش از ۱۰ سال سابقه فعالیت، یکی از معتبرترین نمایندگی‌های فروش خودروهای وارداتی در تهران است. ما با تمرکز بر شفافیت قیمت و کیفیت خدمات، تجربه‌ای مطمئن از خرید خودرو لوکس را برای مشتریان فراهم می‌کنیم. تمامی خودروهای آلفا اتو توسط کارشناسان مجرب بازرسی و تایید شده‌اند.",
    workingHours:"شنبه تا پنج‌شنبه ۹:۰۰ - ۱۹:۰۰", since:"۱۳۹۲",
    brands:["مرسدس بنز","بی‌ام‌و","آئودی","لکسوس"] },
  { id:"d2", name:"نمایندگی تویوتا خلیج", nameEn:"Toyota Khalij", city:"تهران", address:"اتوبان ارتش، خروجی گلستان، مجتمع تجاری خلیج", phone:"۰۲۱-۲۲۴۴۳۳۵۵", vehicleCount:32, rating:4.7, reviewCount:96, isVerified:true, logo:carImages[3], cover:heroImages[1],
    description:"نمایندگی تویوتا خلیج، تخصصی‌ترین مرکز فروش خودروهای تویوتا و لکسوس در ایران. ما با ارائه ضمانت سلامت خودرو، بازرسی رایگان ۲۵۰ نقطه‌ای و امکان تست درایو، خیال شما را از هر بابت راحت می‌کنیم.",
    workingHours:"شنبه تا پنج‌شنبه ۸:۳۰ - ۱۸:۳۰", since:"۱۳۹۴",
    brands:["تویوتا","لکسوس","هیوندای","کیا"] },
  { id:"d3", name:"نمایندگی هیوندای آذربایجان", nameEn:"Hyundai Azerbaijan", city:"تبریز", address:"خیابان استقلال، نبش خیابان ارتش، پلاک ۷۸", phone:"۰۴۱-۳۳۴۴۵۵۶۶", vehicleCount:28, rating:4.6, reviewCount:64, isVerified:true, logo:carImages[5], cover:heroImages[2],
    description:"نمایندگی هیوندای آذربایجان، فعال‌ترین نمایندگی فروش خودروهای وارداتی در منطقه شمال‌غرب ایران. ما با همکاری مستقیم با واردکنندگان مناطق آزاد، بهترین قیمت‌ها را ارائه می‌دهیم.",
    workingHours:"شنبه تا پنج‌شنبه ۹:۰۰ - ۱۸:۰۰", since:"۱۳۹۵",
    brands:["هیوندای","کیا","نیسان","میتسوبیشی"] },
  { id:"d4", name:"نمایندگی نیسان خلیج فارس", nameEn:"Nissan Khalij Fars", city:"تهران", address:" خیابان گاندی، خیابان بیست‌ویکم، پلاک ۱۵", phone:"۰۲۱-۸۸۶۶۷۷۴۴", vehicleCount:18, rating:4.8, reviewCount:52, isVerified:true, logo:carImages[7], cover:heroImages[3],
    description:"نیسان خلیج فارس با تمرکز بر خودروهای شاسی‌بلند و آفرودی، انتخابی ایده‌آل برای علاقه‌مندان به خودروهای قدرتمند است. خدمات پس از فروش تخصصی و تامین قطعات یدکی از مزایای ماست.",
    workingHours:"شنبه تا پنج‌شنبه ۹:۳۰ - ۱۸:۳۰", since:"۱۳۹۶",
    brands:["نیسان","تویوتا","جیپ","لندروور"] },
  { id:"d5", name:"نمایندگی ولوو اسکاندیناوی", nameEn:"Volvo Scandinavia", city:"اصفهان", address:"خیابان چهارباغ بالا، نبش خیابان هشت بهشت", phone:"۰۳۱-۳۶۶۷۷۸۸", vehicleCount:15, rating:4.9, reviewCount:38, isVerified:true, logo:carImages[10], cover:heroImages[4],
    description:"نمایندگی ولوو اسکاندیناوی در اصفهان، نماینده انحصاری خودروهای ولوو و سایر برندهای اروپایی. ما ایمنی و کیفیت ساخت اروپایی را با خدمات شخصی‌سازی‌شده ارائه می‌دهیم.",
    workingHours:"شنبه تا پنج‌شنبه ۹:۰۰ - ۱۸:۰۰", since:"۱۳۹۷",
    brands:["ولوو","مرسدس بنز","آئودی","فولکس‌واگن"] },
  { id:"d6", name:"نمایندگی فولکس‌واگن جنوب", nameEn:"Volkswagen Jonoub", city:"شیراز", address:"بلوار ارم، مجتمع تجاری ارم، طبقه ۳", phone:"۰۷۱-۳۷۲۲۸۸۹۹", vehicleCount:22, rating:4.5, reviewCount:41, isVerified:false, logo:carImages[11], cover:heroImages[5],
    description:"نمایندگی فولکس‌واگن جنوب با هدف ارائه خودروهای باکیفیت آلمانی به جنوب کشور فعالیت می‌کند. ما معتقدیم هر ایرانی حق دارد با قیمت مناسب، خودروی اروپایی بخرید.",
    workingHours:"شنبه تا پنج‌شنبه ۱۰:۰۰ - ۱۹:۰۰", since:"۱۳۹۸",
    brands:["فولکس‌واگن","آئودی","فورد","شورولت"] },
];

export const galleries: GalleryItem[] = [
  { id:"g1", name:"گالری رویال موتورز", nameEn:"Royal Motors", city:"تهران", address:"خیابان ولیعصر، بالاتر از میدان ونک، پلاک ۲۵۶", phone:"۰۲۱-۸۸۹۹۷۷۶۶", vehicleCount:35, rating:4.8, reviewCount:87, isVerified:true, logo:carImages[0], cover:heroImages[0],
    description:"گالری رویال موتورز یکی از پیشروترین نمایشگاه‌های فروش خودروهای لوکس و وارداتی در تهران است. ما با تیم متخصص و مجرب، بهترین خودروها را با ضمانت سلامت و قیمت مناسب به مشتریان عزیز ارائه می‌دهیم. تمامی خودروها قبل از عرضه، توسط کارشناسان ما بازرسی ۲۵۰ نقطه‌ای می‌شوند.",
    workingHours:"شنبه تا پنج‌شنبه ۹:۰۰ - ۲۰:۰۰", since:"۱۳۹۱",
    brands:["مرسدس بنز","بی‌ام‌و","پورشه","لندروور"] },
  { id:"g2", name:"گالری لوکس موتور", nameEn:"Lux Motors", city:"تهران", address:"خیابان شریعتی، نبش هفت تیر، پلاک ۱۴۸", phone:"۰۲۱-۲۲۸۸۳۳۷۷", vehicleCount:28, rating:4.9, reviewCount:112, isVerified:true, logo:carImages[4], cover:heroImages[1],
    description:"گالری لوکس موتور با بیش از ۱۲ سال تجربه در زمینه خرید و فروش خودروهای لوکس، نامی آشنا در بازار خودرو ایران است. ما با تمرکز بر رضایت مشتری و شفافیت در معاملات، توانسته‌ایم اعتماد هزاران مشتری را جلب کنیم.",
    workingHours:"شنبه تا پنج‌شنبه ۹:۰۰ - ۱۹:۳۰", since:"۱۳۹۰",
    brands:["تویوتا","لکسوس","آئودی","ولوو"] },
  { id:"g3", name:"گالری پورشه پارس", nameEn:"Porsche Pars", city:"تهران", address:"اتوبان یادگار امام، خروجی پاسداران، پلاک ۸۹", phone:"۰۲۱-۲۶۱۲۸۸۹۹", vehicleCount:12, rating:5.0, reviewCount:34, isVerified:true, logo:carImages[2], cover:heroImages[2],
    description:"گالری پورشه پارس تخصصی‌ترین نمایشگاه فروش خودروهای پورشه و برندهای لوکس آلمانی در ایران است. ما با ارائه خدمات شخصی‌سازی، امکان تست درایو و مشاوره رایگان، تجربه‌ای منحصر به فرد از خرید خودرو لوکس را ارائه می‌دهیم.",
    workingHours:"شنبه تا چهارشنبه ۱۰:۰۰ - ۱۸:۰۰ \nپنج‌شنبه ۱۰:۰۰ - ۱۵:۰۰", since:"۱۳۹۵",
    brands:["پورشه","مرسدس بنز","بی‌ام‌و","آئودی"] },
  { id:"g4", name:"گالری بریتانیا موتورز", nameEn:"Britannia Motors", city:"تهران", address:"فرودگاه مهرآباد، ترمینال ۲، طبقه همکف", phone:"۰۲۱-۴۶۵۵۸۸۳۳", vehicleCount:20, rating:4.7, reviewCount:56, isVerified:true, logo:carImages[8], cover:heroImages[3],
    description:"گالری بریتانیا موتورز با موقعیت استراتژیک نزدیک فرودگاه مهرآباد، انتخابی ایده‌آل برای مشتریانی است که به دنبال خودروهای وارداتی باکیفیت هستند. ما مستقیماً از مناطق آزاد تامین می‌کنیم و بهترین قیمت‌ها را ارائه می‌دهیم.",
    workingHours:"شنبه تا پنج‌شنبه ۸:۳۰ - ۱۸:۳۰", since:"۱۳۹۳",
    brands:["تویوتا","هیوندای","کیا","نیسان","میتسوبیشی"] },
  { id:"g5", name:"نمایشگاه آریا موتور", nameEn:"Aria Motor", city:"اصفهان", address:"خیابان چهارباغ بالا، نبش خیابان هشت بهشت، پلاک ۷۸", phone:"۰۳۱-۳۶۶۷۸۸۹۹", vehicleCount:22, rating:4.6, reviewCount:63, isVerified:true, logo:carImages[1], cover:carImages[5],
    description:"نمایشگاه آریا موتور یکی از معتبرترین مرکز فروش خودرو در اصفهان با بیش از ۱۰ سال سابقه فعالیت است. ما تمرکز ویژه‌ای بر خودروهای وارداتی منطقه آزاد کیش و قشم داریم و تمامی خودروها با گارانتی سلامت عرضه می‌شوند.",
    workingHours:"شنبه تا پنج‌شنبه ۹:۰۰ - ۱۹:۰۰", since:"۱۳۹۲",
    brands:["تویوتا","لکسوس","هیوندای","کیا"] },
  { id:"g6", name:"گالری آلفا اتو", nameEn:"Alfa Auto", city:"شیراز", address:"بلوار ارم، نبش خیابان هنرستان، پلاک ۲۱۲", phone:"۰۷۱-۳۸۲۶۶۵۵۴", vehicleCount:18, rating:4.5, reviewCount:41, isVerified:true, logo:carImages[3], cover:carImages[7],
    description:"گالری آلفا اتو با تیمی از کارشناسان باتجربه، آماده ارائه بهترین خدمات خرید و فروش خودرو در شیراز است. ما با ایجاد فضایی صمیمی و حرفه‌ای، تجربه خرید لذت‌بخشی را برای مشتریان فراهم می‌کنیم.",
    workingHours:"شنبه تا پنج‌شنبه ۹:۳۰ - ۱۸:۳۰", since:"۱۳۹۴",
    brands:["کیا","هیوندای","نیسان","رنجروور"] },
  { id:"g7", name:"نمایشگاه پارسیان خودرو", nameEn:"Parsian Khodro", city:"تهران", address:" اتوبان همت، خروجی شیان، پلاک ۳۳۴", phone:"۰۲۱-۷۷۶۵۴۳۲۱", vehicleCount:42, rating:4.7, reviewCount:95, isVerified:true, logo:carImages[5], cover:carImages[9],
    description:"نمایشگاه پارسیان خودرو با بیش از ۴۰ خودروی فعال، یکی از بزرگترین نمایشگاه‌های تهران است. ما با تنوع بالا در برندها و مدل‌ها، نیاز هر مشتری‌ای را برآورده می‌کنیم.",
    workingHours:"شنبه تا پنج‌شنبه ۸:۳۰ - ۲۰:۰۰", since:"۱۳۸۸",
    brands:["مرسدس بنز","بی‌ام‌و","آئودی","پورشه","ولوو"] },
  { id:"g8", name:"گالری ایرانیان موتور", nameEn:"Iranian Motor", city:"مشهد", address:"بلوار وکیل‌آباد، نبش خیابان هنرستان، پلاک ۵۶", phone:"۰۵۱-۳۸۵۴۷۷۶۶", vehicleCount:15, rating:4.4, reviewCount:38, isVerified:false, logo:carImages[6], cover:carImages[11],
    description:"گالری ایرانیان موتور در شهر مشهد فعالیت می‌کند و تمرکز اصلی آن بر خودروهای کراس‌اوور و شاسی‌بلند است. ما با قیمت‌گذاری رقابتی و امکان تسویه شرایطی، خرید راحت‌تری را فراهم کرده‌ایم.",
    workingHours:"شنبه تا پنج‌شنبه ۱۰:۰۰ - ۱۸:۰۰", since:"۱۳۹۶",
    brands:["تویوتا","هیوندای","کیا","میتسوبیشی"] },
  { id:"g9", name:"نمایشگاه زاگرس اتو", nameEn:"Zagros Auto", city:"تهران", address:"خیابان جردن (آفریقا)، بالاتر از خیابان بیهقی، پلاک ۱۴۵", phone:"۰۲۱-۸۸۷۱۹۹۳۳", vehicleCount:30, rating:4.8, reviewCount:78, isVerified:true, logo:carImages[7], cover:carImages[0],
    description:"نمایشگاه زاگرس اتو در قلب تهران واقع شده و با بیش از ۳۰ خودروی لوکس و نیمه‌لوکس، یکی از پرطرفدارترین نمایشگاه‌های منطقه است. تخصص اصلی ما خودروهای آلمانی و ژاپنی است.",
    workingHours:"شنبه تا پنج‌شنبه ۹:۰۰ - ۱۹:۳۰", since:"۱۳۹۰",
    brands:["بی‌ام‌و","مرسدس بنز","آئودی","لکسوس"] },
  { id:"g10", name:"گالری کاسپین خودرو", nameEn:"Caspian Khodro", city:"رشت", address:"بلوار لاکان، نبش خیابان دانشگاه، پلاک ۸۸", phone:"۰۱۳-۳۳۲۸۵۵۴۴", vehicleCount:10, rating:4.3, reviewCount:22, isVerified:false, logo:carImages[8], cover:carImages[2],
    description:"گالری کاسپین خودرو در استان گیلان فعالیت دارد و با تمرکز بر خودروهای وارداتی از منطقه آزاد انزلی، بهترین قیمت‌ها را در شمال کشور ارائه می‌دهد.",
    workingHours:"شنبه تا پنج‌شنبه ۹:۰۰ - ۱۸:۰۰", since:"۱۳۹۷",
    brands:["تویوتا","نیسان","کیا","هیوندای"] },
  { id:"g11", name:"نمایشگاه آسمان خودرو", nameEn:"Aseman Khodro", city:"تهران", address:"بزرگراه اشرفی اصفهانی، خروجی ستارخان، پلاک ۱۶۷", phone:"۰۲۱-۴۴۶۶۲۲۸۸", vehicleCount:25, rating:4.6, reviewCount:67, isVerified:true, logo:carImages[9], cover:carImages[4],
    description:"نمایشگاه آسمان خودرو با سابقه ۱۵ ساله در بازار خودرو تهران، یکی از نام‌های آشنا و مورد اعتماد است. ما تمامی خودروها را با بازرسی فنی کامل و ضمانت نگهداری ۶ ماهه عرضه می‌کنیم.",
    workingHours:"شنبه تا پنج‌شنبه ۸:۳۰ - ۱۹:۰۰", since:"۱۳۸۷",
    brands:["تویوتا","لکسوس","مرسدس بنز","رنجروور"] },
  { id:"g12", name:"گالری دنا موتورز", nameEn:"Dena Motors", city:"تبریز", address:"خیابان ولیعصر، نبش خیابان اخوت، پلاک ۳۴۱", phone:"۰۴۱-۳۵۵۶۷۸۹۰", vehicleCount:14, rating:4.5, reviewCount:29, isVerified:true, logo:carImages[10], cover:carImages[6],
    description:"گالری دنا موتورز تنها نماینده رسمی فروش خودروهای وارداتی در منطقه آذربایجان شرقی است. ما با تامین مستقیم از مناطق آزاد ارس و جلفا، قیمت‌های رقابتی ارائه می‌دهیم.",
    workingHours:"شنبه تا پنج‌شنبه ۹:۳۰ - ۱۸:۳۰", since:"۱۳۹۵",
    brands:["هیوندای","کیا","نیسان","میتسوبیشی","فورد"] },
  { id:"g13", name:"نمایشگاه الماس خودرو", nameEn:"Almas Khodro", city:"تهران", address:"خیابان پاسداران، نبش خیابان گلستان پنجم، پلاک ۹۲", phone:"۰۲۱-۲۶۷۵۳۳۴۴", vehicleCount:19, rating:4.7, reviewCount:53, isVerified:true, logo:carImages[11], cover:carImages[1],
    description:"نمایشگاه الماس خودرو در منطقه پاسداران تهران واقع شده و با تمرکز بر خودروهای لوکس و اسپرت، انتخابی ایده‌آل برای علاقه‌مندان به خودروهای خاص است.",
    workingHours:"شنبه تا چهارشنبه ۱۰:۰۰ - ۱۹:۰۰ \nپنج‌شنبه ۱۰:۰۰ - ۱۵:۰۰", since:"۱۳۹۳",
    brands:["پورشه","بی‌ام‌و","مرسدس بنز","مازراتی"] },
  { id:"g14", name:"گالری نوین خودرو شرق", nameEn:"Novin Khodro Shargh", city:"مشهد", address:"بلوار سجاد، نبش خیابان احمدآباد، پلاک ۲۳۴", phone:"۰۵۱-۳۷۶۵۸۸۴۴", vehicleCount:16, rating:4.4, reviewCount:35, isVerified:true, logo:carImages[0], cover:carImages[8],
    description:"گالری نوین خودرو شرق بزرگترین نمایشگاه خودروهای وارداتی در خراسان رضوی است. ما با تیم متخصص و امکانات پیشرفته، بهترین خدمات را به مشتریان شرق کشور ارائه می‌دهیم.",
    workingHours:"شنبه تا پنج‌شنبه ۹:۰۰ - ۱۸:۰۰", since:"۱۳۹۴",
    brands:["تویوتا","هیوندای","کیا","لکسوس"] },
  { id:"g15", name:"نمایشگاه اطلس موتور", nameEn:"Atlas Motor", city:"کرج", address:"میدان والفجر، بلوار شهید بهشتی، پلاک ۱۲۳", phone:"۰۲۶-۳۳۴۵۷۷۶۶", vehicleCount:11, rating:4.2, reviewCount:18, isVerified:false, logo:carImages[3], cover:carImages[10],
    description:"نمایشگاه اطلس موتور در شهر کرج فعالیت می‌کند و با ارائه خودروهای اقتصادی و میان‌رده، گزینه مناسبی برای خریداران با بودجه متوسط است.",
    workingHours:"شنبه تا پنج‌شنبه ۹:۰۰ - ۱۸:۰۰", since:"۱۳۹۸",
    brands:["کیا","هیوندای","نیسان","رنو"] },
  { id:"g16", name:"گالری پارسیان لوکس", nameEn:"Parsian Lux", city:"تهران", address:"خیابان نیاوران، نبش خیابان باهنر، پلاک ۷۶", phone:"۰۲۱-۲۸۵۴۳۳۲۲", vehicleCount:24, rating:4.9, reviewCount:102, isVerified:true, logo:carImages[5], cover:heroImages[2],
    description:"گالری پارسیان لوکس با تمرکز انحصاری بر خودروهای سوپرلوکس و کلاس بالای آلمانی، یکی از برترین گالری‌های تخصصی تهران است. ما خدمات شخصی‌سازی و تست درایو نیز ارائه می‌دهیم.",
    workingHours:"شنبه تا پنج‌شنبه ۱۰:۰۰ - ۱۹:۰۰", since:"۱۳۹۱",
    brands:["پورشه","مرسدس بنز","بی‌ام‌و","مازراتی","رنجروور"] },
];

export const brandLogos: Record<string, string> = {
  "Mercedes-Benz": "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/726e73cc7a55.png",
  "BMW": "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/2975bbb977b8.png",
  "Porsche": "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/fdb7cdb131a1.png",
  "Toyota": "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/b3253f7c6129.png",
  "Lexus": "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/074ebcad73c6.png",
  "Hyundai": "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/16a97f57ca27.png",
  "Kia": "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/953dbf3ec3d6.png",
  "Nissan": "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/379f82b05012.png",
  "Mitsubishi": "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d9dbb8652152.png",
  "Audi": "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/95321346b213.png",
  "Volkswagen": "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d63ede856512.png",
  "Volvo": "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/9b2780e902dc.png",
  "Ford": "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/242fdeb1ac46.png",
  "Chevrolet": "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/f2259dbc7874.png",
  "Land Rover": "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/a21bdf10a2d9.png",
  "Range Rover": "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/90b77f6fae93.svg",
  "Jeep": "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/6bd49b99f92e.png",
  "Maserati": "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/3ba958e652bd.png",
};

export const brands: BrandItem[] = [
  { id:"b1", name:"مرسدس بنز", nameEn:"Mercedes-Benz", vehicleCount:85, logo: brandLogos["Mercedes-Benz"] },
  { id:"b2", name:"بی‌ام‌و", nameEn:"BMW", vehicleCount:72, logo: brandLogos["BMW"] },
  { id:"b3", name:"پورشه", nameEn:"Porsche", vehicleCount:34, logo: brandLogos["Porsche"] },
  { id:"b4", name:"تویوتا", nameEn:"Toyota", vehicleCount:95, logo: brandLogos["Toyota"] },
  { id:"b5", name:"لکسوس", nameEn:"Lexus", vehicleCount:48, logo: brandLogos["Lexus"] },
  { id:"b6", name:"هیوندای", nameEn:"Hyundai", vehicleCount:110, logo: brandLogos["Hyundai"] },
  { id:"b7", name:"کیا", nameEn:"Kia", vehicleCount:88, logo: brandLogos["Kia"] },
  { id:"b8", name:"نیسان", nameEn:"Nissan", vehicleCount:42, logo: brandLogos["Nissan"] },
  { id:"b9", name:"میتسوبیشی", nameEn:"Mitsubishi", vehicleCount:25, logo: brandLogos["Mitsubishi"] },
  { id:"b10", name:"آئودی", nameEn:"Audi", vehicleCount:38, logo: brandLogos["Audi"] },
  { id:"b11", name:"فولکس‌واگن", nameEn:"Volkswagen", vehicleCount:56, logo: brandLogos["Volkswagen"] },
  { id:"b12", name:"ولوو", nameEn:"Volvo", vehicleCount:22, logo: brandLogos["Volvo"] },
  { id:"b13", name:"فورد", nameEn:"Ford", vehicleCount:30, logo: brandLogos["Ford"] },
  { id:"b14", name:"شورولت", nameEn:"Chevrolet", vehicleCount:18, logo: brandLogos["Chevrolet"] },
  { id:"b15", name:"لندروور", nameEn:"Land Rover", vehicleCount:28, logo: brandLogos["Land Rover"] },
  { id:"b16", name:"رنج‌روور", nameEn:"Range Rover", vehicleCount:20, logo: brandLogos["Range Rover"] },
  { id:"b17", name:"جیپ", nameEn:"Jeep", vehicleCount:15, logo: brandLogos["Jeep"] },
  { id:"b18", name:"مازراتی", nameEn:"Maserati", vehicleCount:8, logo: brandLogos["Maserati"] },
];

export const blogArticles: BlogArticle[] = [
  { id:"a1", title:"راهنمای جامع خرید خودرو با پلاک منطقه آزاد", summary:"تمام نکاتی که قبل از خرید خودرو با پلاک منطقه آزاد باید بدانید. از مراحل انتقال مالکیت تا هزینه‌های جانبی و مزایای خرید.", author:"تیم تحریریه آزاد گذر", date:"۱۴۰۳/۰۹/۱۵", readTime:"۸ دقیقه", category:"راهنمای خرید", image:heroImages[0],
    content:`خودروهای با پلاک منطقه آزاد یکی از جذاب‌ترین گزینه‌ها برای خریداران خودرو در ایران هستند. این خودروها که از طریق مناطق آزاد تجاری وارد کشور می‌شوند، قیمت پایین‌تری نسبت به مدل‌های مشابه داخلی دارند.

## مزایای خرید خودرو با پلاک منطقه آزاد

**۱. قیمت مناسب‌تر:** خودروهای وارداتی از مناطق آزاد معمولا ۲۰ تا ۴۰ درصد ارزان‌تر از مدل‌های مشابه در بازار داخلی هستند. این تفاوت قیمت به دلیل معافیت‌های گمرکی و مالیاتی در مناطق آزاد ایجاد می‌شود.

**۲. امکانات کامل‌تر:** خودروهایی که برای مناطق آزاد وارد می‌شوند معمولا آپشن‌ها و امکانات کامل‌تری دارند. سیستم‌های ایمنی پیشرفته، صندلی‌های چرمی، سیستم‌های صوتی حرفه‌ای و نمایشگرهای بزرگ‌تر از جمله این امکانات هستند.

**۳. نو بودن خودرو:** اکثر خودروهای وارداتی دارای کارکرد پایین و وضعیت نوک هستند. بسیاری از این خودروها کمتر از ۱۰ هزار کیلومتر کارکرد دارند.

## مراحل خرید

خرید خودرو با پلاک منطقه آزاد شامل مراحل زیر است:

۱. **انتخاب خودرو:** بررسی فنی و ظاهری خودرو توسط کارشناسان مجرب
۲. **بررسی مدارک:** اطمینان از صحت سند، پلاک و بیمه‌نامه
۳. **عقد قرارداد:** تنظیم قرارداد خرید با ذکر شرایط و ضمانت‌ها
۴. **پرداخت:** پرداخت هزینه از طریق روش‌های امن
۵. **انتقال مالکیت:** ثبت رسمی انتقال در اداره راهنمایی و رانندگی

## نکات مهم

- حتماً قبل از خرید، خودرو را توسط کارشناس معتمد بازرسی کنید
- مدارک خودرو را با دقت بررسی و با مدارک اصلی مطابقت دهید
- از وضعیت بیمه و مالیات خودرو اطمینان حاصل کنید
- هزینه‌های جانبی مانند عوارض انتقال و هزینه بازرسی را در نظر بگیرن` },
  { id:"a2", title:"مقایسه مرسدس کلاس E و بی‌ام‌و سری ۵", summary:"مقایسه جامع دو سدان لوکس آلمانی از نظر عملکرد، امکانات، هزینه نگهداری و ارزش بازاری در بازار ایران.", author:"احمد رضایی", date:"۱۴۰۳/۰۹/۱۲", readTime:"۱۲ دقیقه", category:"مقایسه خودرو", image:heroImages[1],
    content:`مرسدس بنز کلاس E و بی‌ام‌و سری ۵ دو رقیب دیرینه در کلاس سدان‌های لوکس آلمانی هستند. در این مقاله این دو خودرو را از جنبه‌های مختلف بررسی می‌کنیم.

## مشخصات فنی

**مرسدس کلاس E:** مجهز به موتور ۲.۰ لیتری توربو با ۲۵۸ اسب بخار قدرت. گیربکس ۹ سرعته اتوماتیک، سیستم تعلیق هوایی و فرمان برقی استاندارد.

**بی‌ام‌و سری ۵:** دارای موتور ۲.۰ لیتری توربو با ۲۴۸ اسب بخار قدرت. گیربکس ۸ سرعته اتوماتیک، سیستم تعلیق تطبیقی M Sport و فرمان ورزشی.

## رانندگی و آسایش

مرسدس کلاس E در آسایش سواری برتری دارد. صندلی‌ها راحت‌تر، عایق صوتی بهتر و تعلیق نرم‌تر است. بی‌ام‌و سری ۵ اما تجربه رانندگی پویاتری ارائه می‌دهد. سیستم تعلیق M Sport محکم‌تر بوده و هندلینگ آن تیزتر است.

## هزینه نگهداری

هزینه نگهداری هر دو خودرو در بازار ایران تقریبا مشابه است. قطعات یدکی هر دو برند گران هستند اما مرسدس دسترسی کمی بهتر به قطعات دارد. بیمه هر دو خودرو به دلیل ارزش بالا هزینه بیشتری دارد.` },
  { id:"a3", title:"قوانین جدید واردات موقت خودرو در ۱۴۰۳", summary:"آخرین تغییرات قانونی در حوزه واردات موقت خودرو و تاثیر آن بر خریداران و فروشندگان.", author:"سارا محمدی", date:"۱۴۰۳/۰۹/۱۰", readTime:"۶ دقیقه", category:"قوانین واردات موقت", image:heroImages[2],
    content:`در سال ۱۴۰۳ تغییرات مهمی در قوانین واردات موقت خودرو اعمال شده که خریداران و فروشندگان باید از آن‌ها آگاه باشند.

## تغییرات کلیدی

**۱. تمدید مجوز:** مدت مجوز اولیه واردات موقت از ۲ به ۳ ماه افزایش یافته و امکان تمدید تا ۶ ماه فراهم شده است.

**۲. عوارض خروج:** عوارض خروج خودرو از منطقه آزاد ۵ درصد کاهش یافته است.

**۳. انتقال مالکیت:** شرایط انتقال مالکیت خودروهای واردات موقت تسهیل شده و نیازی به خروج خودرو نیست.

## تاثیر بر بازار

این تغییرات باعث افزایش تقاضا برای خرید خودروهای وارداتی شده است. قیمت‌ها در سه ماهه سوم سال نسبت به سال قبل رشد ۱۵ درصدی داشته‌اند.

## توصیه‌ها

- قبل از خرید حتما از آخرین قوانین مطلع شوید
- مدت اعتبار مجوز را چک کنید
- با یک مشاور حقوقی متخصص مشورت کنید` },
  { id:"a4", title:"بهترین شاسی‌بلندهای وارداتی سال ۲۰۲۴", summary:"بررسی و رتبه‌بندی بهترین خودروهای شاسی‌بلند وارداتی از نظر ارزش خرید، کیفیت و هزینه نگهداری.", author:"تیم تحریریه آزاد گذر", date:"۱۴۰۳/۰۹/۰۸", readTime:"۱۰ دقیقه", category:"نقد و بررسی خودرو", image:heroImages[3],
    content:`شاسی‌بلندها پرفروش‌ترین خودروهای وارداتی در بازار ایران هستند. در این مقاله بهترین مدل‌های ۲۰۲۴ را بررسی می‌کنیم.

## ۱. تویوتا لندکروزر
بی‌بحث معروف‌ترین و بادوام‌ترین شاسی‌بلند وارداتی. موتور ۳.۵ لیتری V6 هیبریدی، مصرف سوخت پایین و ارزش بازاری بسیار بالا.

## ۲. مرسدس GLE
لوکس، قدرتمند و مجهز به آخرین تکنولوژی‌های مرسدس. سیستم تعلیق هوایی، نمایشگر MBUX و سیستم‌های ایمنی پیشرفته.

## ۳. بی‌ام‌و X5
ترکیب بی‌نظیری از رانندگی پویا و لوکس بودن. سیستم xDrive چهارچرخ متحرک و موتورهای متنوع از ۲.۰ تا ۴.۴ لیتری.

## ۴. لکسوس RX
کیفیت ساخت عالی Toyota، طراحی زیبا و مصرف سوخت هیبریدی بسیار پایین. بهترین گزینه برای خانواده‌ها.

## نتیجه‌گیری

انتخاب بهترین شاسی‌بلند بستگی به بودجه و نیاز شما دارد. برای دوام و ارزش نگهداری تویوتا، برای لوکس بودن مرسدس و برای رانندگی بی‌ام‌و پیشنهاد می‌شود.` },
  { id:"a5", title:"هزینه‌های انتقال مالکیت خودروی منطقه آزاد", summary:"بررسی کامل هزینه‌های انتقال مالکیت خودروهای دارای پلاک منطقه آزاد و مراحل انجام آن.", author:"علی حسینی", date:"۱۴۰۳/۰۹/۰۵", readTime:"۵ دقیقه", category:"قوانین منطقه آزاد", image:heroImages[4],
    content:`انتقال مالکیت خودروهای منطقه آزاد شامل هزینه‌های مختلفی است که آشنایی با آن‌ها برای هر خریدار و فروشنده‌ای ضروری است.

## هزینه‌های اصلی

**۱. عوارض انتقال:** بسته به نوع خودرو و منطقه آزاد بین ۲ تا ۵ درصد ارزش خودرو

**۲. هزینه بازرسی فنی:** بین ۵۰۰ هزار تا ۱.۵ میلیون تومان

**۳. هزینه صدور سند:** شامل هزینه‌های اداری و ثبتی

**۴. مالیات:** بسته به ارزش خودرو متغیر است

## مدارک لازم

- سند مالکیت اصلی

- کارت خودرو

- بیمه‌نامه معتبر

- کارت ملی خریدار و فروشنده

- رسید پرداخت عوارض

## نکات مهم

- حتما قبل از معامله، وضعیت مالیاتی خودرو را بررسی کنید

- از صحت تمام مدارک اطمینان حاصل کنید

- هزینه‌ها را قبل از معامله نهایی مشخص کنید` },
  { id:"a6", title:"نکات مهم در بازرسی خودروی وارداتی", summary:"چگونه خودروی وارداتی را قبل از خرید به صورت تخصصی بازرسی کنیم و از خرید خودروی تصادفی جلوگیری کنیم.", author:"مهدی کریمی", date:"۱۴۰۳/۰۹/۰۳", readTime:"۷ دقیقه", category:"راهنمای خرید", image:heroImages[5],
    content:`بازرسی تخصصی خودروی وارداتی قبل از خرید یکی از مهم‌ترین مراحلی است که نباید هرگز نادیده گرفته شود.

## نقاط کلیدی بازرسی

**۱. بدنه و رنگ:** بررسی تمام نقاط بدنه با دستگاه ضخامت‌سنج رنگ. هر نقطه‌ای که رنگ‌شدگی دارد نشان‌دهنده تصادف یا تعمیر است.

**۲. شاسی:** بررسی شاسی زیر خودرو برای اطمینان از عدم تصادف شدید. جوش‌خوردگی، تغییر شکل یا زنگ‌زدگی شاسی نشانه خطر است.

**۳. موتور:** روشن کردن موتور و بررسی صدای آن، نشتی روغن، وضعیت تسمه‌ها و لوله‌ها.

**۴. گیربکس:** تست عملکرد گیربکس در تمام دنده‌ها. هرگونه لرزش، تاخیر یا صدای غیرعادی نشانه مشکل است.

**۵. سیستم الکتریکی:** بررسی عملکرد تمام چراغ‌ها، سنسورها، سیستم صوتی و ناوبری.

## توصیه نهایی

همیشه از یک کارشناس خبره کمک بگیرید. هزینه بازرسی در برابر خسارت خرید خودروی معیوب ناچیز است.` },
  { id:"a7", title:"مقایسه هیوندای توسان و کیا اسپورتیج ۲۰۲۴", summary:"دو کراس‌اوور محبوب کره‌ای را از نظر طراحی، امکانات، مصرف سوخت و قیمت مقایسه می‌کنیم.", author:"رضا احمدی", date:"۱۴۰۳/۰۹/۰۱", readTime:"۹ دقیقه", category:"مقایسه خودرو", image:heroImages[0],
    content:`هیوندای توسان و کیا اسپورتیج دو کراس‌اوور پرفروش کره‌ای هستند که رقابت تنگاتنگی در بازار ایران دارند.

## طراحی
توسان طراحی مدرن‌تر و اسپرت‌تری دارد در حالی که اسپورتیج ظاهر کلاسیک‌تری ارائه می‌دهد.

## امکانات
هر دو خودرو امکانات مشابهی دارند اما توسان در نسخه‌های بالاتر امکانات بیشتری ارائه می‌دهد.

## مصرف سوخت
مصرف هر دو تقریبا یکسان است و حدود ۷ تا ۸ لیتر در صد کیلومتر است.

## نتیجه
اگر به دنبال طراحی مدرن هستید توسان و اگر بودجه کمتری دارید اسپورتیج بهتر است.` },
  { id:"a8", title:"تفاوت پلاک منطقه آزاد و واردات موقت", summary:"بررسی تفاوت‌های کلیدی بین دو نوع پلاک خودروی وارداتی: منطقه آزاد و واردات موقت. کدام بهتر است؟", author:"سارا محمدی", date:"۱۴۰۳/۰۸/۲۸", readTime:"۶ دقیقه", category:"قوانین منطقه آزاد", image:heroImages[1],
    content:`دو نوع اصلی پلاک برای خودروهای وارداتی وجود دارد: پلاک منطقه آزاد و پلاک واردات موقت.

## پلاک منطقه آزاد
- محدودیت تردد در منطقه آزاد
- انتقال مالکیت آزاد
- معافیت گمرکی کامل
- مناسب برای ساکنین منطقه

## پلاک واردات موقت
- مجوز تردد محدود در سراسر کشور
- نیاز به تمدید دوره‌ای
- انتقال مالکیت با محدودیت
- مناسب برای استفاده موقت

## کدام بهتر است؟
بستگی به نیاز شما دارد. اگر در منطقه آزاد زندگی می‌کنید پلاک منطقه آزاد و اگر نیاز به تردد دارید واردات موقت بهتر است.` },
  { id:"a9", title:"آموزش بررسی شاسی و بدنه خودرو", summary:"راهنمای تصویری بررسی شاسی، بدنه، رنگ و نقاط تصادفی خودرو قبل از خرید.", author:"مهدی کریمی", date:"۱۴۰۳/۰۸/۲۵", readTime:"۱۱ دقیقه", category:"نقد و بررسی خودرو", image:heroImages[2],
    content:`بررسی شاسی و بدنه خودرو یکی از مهم‌ترین مراحل قبل از خرید است.

## ابزارهای لازم
- دستگاه ضخامت‌سنج رنگ
- جک خودرو
- چراغ بازرسی
- شاسی‌بند

## مراحل بررسی بدنه
۱. بررسی ظاهری و فاصله درب‌ها و صندوق عقب
۲. بررسی رنگ با دستگاه ضخامت‌سنج
۳. بررسی لاستیک‌ها و وضعیت تعلیق
۴. بررسی شیشه‌ها و تاریخ تولید آن‌ها

## مراحل بررسی شاسی
۱. بالا بردن خودرو با جک
۲. بررسی کامل شاسی از زیر
۳. بررسی نقاط جوش‌خوردگی
۴. بررسی زنگ‌زدگی و خوردگی

نکته مهم: اگر در بررسی شاسی مشکلی پیدا شد، از خرید خودرو صرف نظر کنید.` },
  { id:"a10", title:"راهنمای خرید خودرو وارداتی با بهترین قیمت", summary:"نکات کلیدی برای مذاکره قیمت و خرید خودرو وارداتی با بهترین شرایط ممکن.", author:"تیم تحریریه آزاد گذر", date:"۱۴۰۳/۰۸/۲۲", readTime:"۸ دقیقه", category:"راهنمای خرید", image:heroImages[3] },
  { id:"a11", title:"قوانین گمرکی واردات خودرو ۱۴۰۳", summary:"آخرین تعرفه‌ها، عوارض و مقررات گمرکی برای واردات خودرو به ایران در سال ۱۴۰۳.", author:"علی حسینی", date:"۱۴۰۳/۰۸/۲۰", readTime:"۷ دقیقه", category:"قوانین واردات موقت", image:heroImages[4] },
  { id:"a12", title:"بررسی لکسوس RX 350h؛ هیبریدی لوکس", summary:"نگاهی جامع به لکسوس RX 350h: موتور هیبریدی، امکانات رفاهی، قیمت و ارزش خرید در بازار ایران.", author:"احمد رضایی", date:"۱۴۰۳/۰۸/۱۸", readTime:"۱۰ دقیقه", category:"نقد و بررسی خودرو", image:heroImages[5] },
  { id:"a13", title:"مقایسه پورشه کاین و رنج‌روور سپورت", summary:"دو شاسی‌بلند لوکس را از نظر عملکرد، آفرود، لوکس بودن و قیمت مقایسه می‌کنیم.", author:"رضا احمدی", date:"۱۴۰۳/۰۸/۱۵", readTime:"۱۳ دقیقه", category:"مقایسه خودرو", image:heroImages[0] },
  { id:"a14", title:"نحوه تمدید مجوز خودروی واردات موقت", summary:"مراحل تمدید مجوز تردد خودروی واردات موقت، مدارک مورد نیاز و هزینه‌های مربوطه.", author:"سارا محمدی", date:"۱۴۰۳/۰۸/۱۲", readTime:"۵ دقیقه", category:"قوانین واردات موقت", image:heroImages[1] },
  { id:"a15", title:"بهترین سدان‌های وارداتی زیر ۱۰ میلیارد", summary:"بررسی و معرفی بهترین سدان‌های وارداتی که با بودجه زیر ۱۰ میلیارد تومان قابل خرید هستند.", author:"تیم تحریریه آزاد گذر", date:"۱۴۰۳/۰۸/۱۰", readTime:"۸ دقیقه", category:"نقد و بررسی خودرو", image:heroImages[2] },
  { id:"a16", title:"راهنمای حمل و نقل خودرو از منطقه آزاد", summary:"روش‌های حمل و نقل خودرو از مناطق آزاد به سراسر کشور، هزینه‌ها و نکات مهم.", author:"علی حسینی", date:"۱۴۰۳/۰۸/۰۸", readTime:"۶ دقیقه", category:"راهنمای خرید", image:heroImages[3] },
  { id:"a17", title:"معرفی مناطق آزاد ایران برای خرید خودرو", summary:"بررسی کامل مناطق آزاد کیش، قشم، چابهار، ارسباران و مزایای هر کدام برای خرید خودرو.", author:"مهدی کریمی", date:"۱۴۰۳/۰۸/۰۵", readTime:"۹ دقیقه", category:"قوانین منطقه آزاد", image:heroImages[4] },
  { id:"a18", title:"مقایسه بی‌ام‌و X5 و مرسدس GLE", summary:"دو شاسی‌بلند لوکس آلمانی را در یک نبرد نزدیک مقایسه می‌کنیم.", author:"احمد رضایی", date:"۱۴۰۳/۰۸/۰۳", readTime:"۱۱ دقیقه", category:"مقایسه خودرو", image:heroImages[5] },
  { id:"a19", title:"نکات بیمه‌ای خودروهای وارداتی", summary:"انواع بیمه برای خودروهای وارداتی، پوشش‌ها، هزینه‌ها و بهترین شرکت‌های بیمه.", author:"تیم تحریریه آزاد گذر", date:"۱۴۰۳/۰۸/۰۱", readTime:"۷ دقیقه", category:"راهنمای خرید", image:heroImages[0] },
  { id:"a20", title:"قوانین ترانزیت خودرو از مناطق آزاد", summary:"مقررات و مجوزهای لازم برای خروج خودرو از منطقه آزاد و تردد در سراسر کشور.", author:"سارا محمدی", date:"۱۴۰۳/۰۷/۲۸", readTime:"۶ دقیقه", category:"قوانین منطقه آزاد", image:heroImages[1] },
  { id:"a21", title:"بررسی فولکس‌واگن تیگوان R-Line ۲۰۲۴", summary:"نگاهی تخصصی به فولکس‌واگن تیگوان R-Line جدید: طراحی، امکانات، رانندگی و قیمت.", author:"رضا احمدی", date:"۱۴۰۳/۰۷/۲۵", readTime:"۱۰ دقیقه", category:"نقد و بررسی خودرو", image:heroImages[2] },
  { id:"a22", title:"راهنمای انتخاب رنگ و آپشن خودرو", summary:"نکات مهم در انتخاب رنگ مناسب، آپشن‌های ضروری و غیرضروری خودرو وارداتی.", author:"مهدی کریمی", date:"۱۴۰۳/۰۷/۲۲", readTime:"۸ دقیقه", category:"راهنمای خرید", image:heroImages[3] },
  { id:"a23", title:"مقایسه تویوتا کمری و آئودی آ۶", summary:"سدان ژاپنی در مقابل سدان آلمانی: کدام ارزش خرید بیشتری در بازار ایران دارد؟", author:"احمد رضایی", date:"۱۴۰۳/۰۷/۲۰", readTime:"۱۲ دقیقه", category:"مقایسه خودرو", image:heroImages[4] },
  { id:"a24", title:"مراحل قانونی انتقال مالکیت خودرو وارداتی", summary:"تمام مراحل قانونی از صدور سند تا انتقال پلاک برای خودروهای وارداتی و منطقه آزاد.", author:"علی حسینی", date:"۱۴۰۳/۰۷/۱۸", readTime:"۹ دقیقه", category:"قوانین واردات موقت", image:heroImages[5] },
];

export const videos: VideoItem[] = [
  { id:"vid1", title:"آموزش کامل قوانین خودرو واردات موقت", duration:"۱۸:۳۰", category:"قوانین", views:"۱۲,۵۰۰", thumbnail:heroImages[0], author:"تیم تحریریه آزاد گذر", date:"۱۴۰۳/۰۸/۱۵", description:"در این ویدیو به طور کامل قوانین و مقررات مربوط به خودروهای واردات موقت را بررسی می‌کنیم. از شرایط ورود تا محدودیت‌های تردد و راه‌های تبدیل وضعیت قانونی.", content:`خودروهای واردات موقت یکی از مهم‌ترین بخش‌های بازار خودرو در مناطق آزاد ایران هستند. در این ویدیو جامع، تمامی ابعاد حقوقی و قانونی این نوع خودروها را بررسی می‌کنیم.

## شرایط واردات موقت
خودروهای واردات موقت برای مدت محدودی (معمولا ۳ ماه) وارد کشور می‌شوند. این خودروها باید دارای پلاک ویژه منطقه آزاد باشند و مدارک قانونی کامل شامل کارت واردات، بیمه‌نامه و معاینه فنی معتبر داشته باشند.

## محدودیت‌های تردد
- تردد فقط در محدوده منطقه آزاد مجاز است
- برای خروج از منطقه نیاز به مجوز ویژه گمرک است
- تخلف از محدودیت تردد مشمول جریمه سنگین می‌شود
- پس از اتمام مهلت، خودرو باید از کشور خارج شود

## روش‌های قانونی مالکیت
- تبدیل وضعیت واردات موقت به واردات قطعی
- انتقال مالکیت به شخص داخل کشور با پرداخت عوارض
- استفاده از سهمیه ارزی برای تبدیل وضعیت
- هر روش مزایا و معایب خاص خود را دارد` },
  { id:"vid2", title:"نحوه انتقال مالکیت خودروی منطقه آزاد", duration:"۲۵:۱۵", category:"آموزش", views:"۸,۷۰۰", thumbnail:heroImages[1], author:"احمد رضایی", date:"۱۴۰۳/۰۸/۲۰", description:"آموزش گام‌به‌گام مراحل انتقال مالکیت خودروهای دارای پلاک منطقه آزاد. تمام مدارک مورد نیاز، هزینه‌ها و نکات مهم را توضیح داده‌ایم.", content:`انتقال مالکیت خودروهای منطقه آزاد یکی از مهم‌ترین فرآیندهای حقوقی در خرید و فروش این نوع خودروهاست. در این ویدیو تمامی مراحل را به صورت عملی آموزش داده‌ایم.

## مدارک مورد نیاز
- کارت شناسایی مالک و خریدار
- کارت خودرو با اعتبار
- سند مالکیت یا قرارداد خرید اولیه
- بیمه‌نامه معتبر
- گواهی معاینه فنی
- رسید پرداخت عوارض نقل و انتقال
- فرم درخواست انتقال مالکیت

## مراحل انتقال مالکیت
1. تهیه و تنظیم قرارداد خرید و فروش
2. استعلام خلافی و محدودیت‌های حقوقی
3. پرداخت عوارض نقل و انتقال در اداره مالیات
4. مراجعه به اداره راهنمایی و رانندگی منطقه آزاد
5. ثبت درخواست و ارائه مدارک
6. صدور سند جدید و تحویل پلاک

## هزینه‌های تقریبی
هزینه انتقال مالکیت بسته به نوع خودرو و منطقه آزاد متفاوت است. معمولا بین ۵ تا ۱۵ میلیون تومان هزینه ثابت و عوارض دارد.` },
  { id:"vid3", title:"مقایسه پورشه کاین و رنج‌روور سپورت", duration:"۱۵:۴۵", category:"مقایسه", views:"۱۵,۳۰۰", thumbnail:heroImages[2], author:"مهدی کریمی", date:"۱۴۰۳/۰۸/۲۵", description:"مقایسه جامع دو شاسی‌بلند لوکس پورشه کاین و رنج‌روور سپورت از نظر عملکرد، آپشن‌ها، قیمت و ارزش بازخرید در بازار ایران.", content:`در این ویدیو دو شاسی‌بلند لوکس و محبوب بازار ایران را از نزدیک مقایسه می‌کنیم.

## مشخصات فنی
**پورشه کاین**
- موتور ۳.۰ لیتری V6 توربو با ۳۴۰ اسب بخار
- گیربکس ۸ سرعته اتوماتیک PDK
- شتاب صفر تا صد ۵.۷ ثانیه
- مصرف سوخت ترکیبی ۱۰.۵ لیتر

**رنج‌روور سپورت**
- موتور ۳.۰ لیتری ۶ سیلندر با ۳۶۰ اسب بخار
- گیربکس ۸ سرعته اتوماتیک ZF
- شتاب صفر تا صد ۶.۰ ثانیه
- مصرف سوخت ترکیبی ۱۱.۲ لیتر

## نتیجه‌گیری
هر دو خودرو در سطح بالایی از کیفیت و لوکس بودن قرار دارند. پورشه کاین برای رانندگی اسپرت‌تر مناسب‌تر است، در حالی که رنج‌روور سپورت راحتی بیشتری در جاده‌های آفرود ارائه می‌دهد.` },
  { id:"vid4", title:"نکات مهم در خرید خودرو وارداتی", duration:"۲۰:۰۰", category:"راهنما", views:"۲۲,۱۰۰", thumbnail:heroImages[3], author:"سارا محمدی", date:"۱۴۰۳/۰۹/۰۱", description:"راهنمای جامع خرید خودرو وارداتی. از بررسی مدارک تا بازرسی فنی، تمام نکاتی که قبل از خرید باید بدانید.", content:`خرید خودرو وارداتی نیازمند دقت و آگاهی بالا است. در این ویدیو مهم‌ترین نکاتی که هر خریداری باید بداند را بررسی می‌کنیم.

## بررسی مدارک
اولین و مهم‌ترین قدم بررسی صحت مدارک خودرو است. شامل کارت خودرو، سند مالکیت، بیمه‌نامه و گواهی معاینه فنی. حتماً مطمئن شوید که شماره شاسی و موتور با مدارک مطابقت دارد.

## بازرسی فنی
- بررسی وضعیت موتور و گیربکس
- بازرسی بدنه و شناسایی رنگ‌شدگی یا تصادف
- بررسی سیستم تعلیق و فرمان
- تست سیستم ترمز و ABS
- بررسی سالم بودن سیستم الکتریکی

## نکات حقوقی
- اطمینان از عدم بدهی مالیاتی
- استعلام خلافی
- بررسی وضعیت بیمه
- اطمینان از قانونی بودن پلاک و مدارک

## توصیه نهایی
همیشه قبل از خرید، خودرو را به یک کارشناس معتبر نشان دهید و از خدمات بازرسی تخصصی استفاده کنید.` },
  { id:"vid5", title:"بررسی تویوتا کمری ۲۰۲۴", duration:"۳۲:۱۰", category:"نقد و بررسی", views:"۳۵,۰۰۰", thumbnail:heroImages[4], author:"رضا احمدی", date:"۱۴۰۳/۰۹/۰۵", description:"نقد و بررسی کامل تویوتا کمری مدل ۲۰۲۴. طراحی جدید، امکانات، عملکرد رانندگی و ارزش خرید در بازار ایران.", content:`تویوتا کمری یکی از محبوب‌ترین سدان‌های بازار ایران است. در این ویدیو به بررسی کامل مدل ۲۰۲۴ می‌پردازیم.

## طراحی ظاهری
کمری ۲۰۲۴ با طراحی کاملاً جدید عرضه شده است. جلوپرهنگ بزرگ‌تر، چراغ‌های LED باریک‌تر و خطوط بدنه اسپرت‌تر از تغییرات اصلی هستند. طراحی عقب نیز با چراغ‌های متصل به هم و اسپویلر یکپارچه مدرن‌تر شده است.

## کابین و امکانات
- صفحه نمایش ۱۲.۳ اینچی لمسی
- سیستم صوتی JBL با ۹ بلندگو
- صندلی‌های چرمی با تنظیم برقی
- سیستم تهویه دو منطقه‌ای
- Apple CarPlay و Android Wireless
- سیستم ایمنی Toyota Safety Sense 3.0

## عملکرد
موتور ۲.۵ لیتری هیبریدی با ۲۲۵ اسب بخار، شتاب صفر تا صد ۷.۶ ثانیه و مصرف سوخت فقط ۵.۲ لیتر در صد کیلومتر. این ترکیب عالی از عملکرد و بهره‌وری است.

## ارزش خرید
با توجه به کیفیت ساخت بالا، مصرف سوخت پایین و ارزش بازخرید عالی، تویوتا کمری یکی از بهترین انتخاب‌ها در سگمنت خود است.` },
  { id:"vid6", title:"هزینه حمل و نقل خودرو از منطقه آزاد", duration:"۱۲:۰۰", category:"آموزش", views:"۶,۸۰۰", thumbnail:heroImages[5], author:"تیم تحریریه آزاد گذر", date:"۱۴۰۳/۰۹/۰۸", description:"بررسی کامل هزینه‌های حمل و نقل خودرو از مناطق آزاد به سراسر کشور. روش‌های مختلف و قیمت‌های تقریبی.", content:`حمل و نقل خودرو یکی از مهم‌ترین دغدغه‌های خریداران خودرو در مناطق آزاد است.

## روش‌های حمل
- تریلی تخصصی (ایمن‌ترین روش)
- تریلی معمولی (ارزان‌تر)
- رانندگی شخصی (با مجوز موقت)
- بکس‌کشی شهری (برای حمل کوتاه)

## هزینه تقریبی
- کیش به تهران: ۸ تا ۱۲ میلیون تومان
- قشم به تهران: ۶ تا ۱۰ میلیون تومان
- چابهار به تهران: ۱۰ تا ۱۵ میلیون تومان
- حمل درون‌شهری: ۱ تا ۳ میلیون تومان

## نکات مهم
حتماً قبل از حمل، بیمه حمل بار بگیرید و از شرکت حمل و نقل معتبر استفاده کنید.` },
  { id:"vid7", title:"تمدید مجوز واردات موقت خودرو", duration:"۱۰:۳۰", category:"قوانین", views:"۹,۲۰۰", thumbnail:heroImages[0], author:"احمد رضایی", date:"۱۴۰۳/۰۹/۱۰", description:"آموزش مراحل تمدید مجوز واردات موقت خودرو. شرایط، مدارک و هزینه‌های مربوط به تمدید.", content:`تمدید مجوز واردات موقت یکی از رایج‌ترین کارهایی است که مالکان خودروهای منطقه آزاد باید انجام دهند.

## شرایط تمدید
- مجوز باید هنوز اعتبار داشته باشد
- حداکثر ۳ ماه تمدید مجاز است
- پرداخت عوارض تمدید الزامی است
- ارائه مدارک کامل خودرو

## مراحل تمدید
1. مراجعه به گمرک منطقه آزاد
2. ارائه درخواست تمدید با مدارک
3. پرداخت عوارض تمدید
4. دریافت مجوز تمدید شده

## هزینه تمدید
هزینه تمدید بسته به نوع خودرو و منطقه متفاوت است و معمولا بین ۲ تا ۵ میلیون تومان می‌باشد.` },
  { id:"vid8", title:"شناسایی خودرو سالم و بدون تصادف", duration:"۲۸:۴۵", category:"آموزش", views:"۴۱,۰۰۰", thumbnail:heroImages[1], author:"مهدی کریمی", date:"۱۴۰۳/۰۹/۱۲", description:"آموزش حرفه‌ای شناسایی خودروهای سالم و بدون تصادف. نشانه‌های رنگ‌شدگی، تعویض قطعات و تصادفات پنهان.", content:`یکی از مهم‌ترین مهارت‌ها در خرید خودرو، شناسایی خودروهای تصادفی و رنگ‌شده است.

## نشانه‌های رنگ‌شدگی
- اختلاف رنگ بین قطعات مختلف
- وجود ذرات رنگ undercoat در لبه‌ها
- ضخامت غیرعادی رنگ (با دستگاه ضخامت‌سنج)
- وجود پرایمر در لبه‌های در و صندوق عقب

## نشانه‌های تصادف
- عدم تراز درزهای بین درها و بدنه
- نشانه‌های جوشکاری در محفظه موتور
- اختلاف فاصله چرخ‌ها از نظر عرضی
- تاریخ تعویض لاستیک‌ها (غیرطبیعی)
- سابقه بیمه تصادفات

## ابزارهای مورد نیاز
- ضخامت‌سنج رنگ
- آهن‌ربای قوی (برای شناسایی بادی)
- چراغ قوی (برای بررسی لبه‌ها)
- دستگاه OBD (برای خواندن کدهای خطا)

## توصیه نهایی
همیشه از یک کارشناس حرفه‌ای کمک بگیرید و از خدمات بازرسی تخصصی آزاد گذر استفاده کنید.` },
  { id:"vid9", title:"مقایسه هیوندای توسان و کیا اسپورتیج", duration:"۲۲:۰۰", category:"مقایسه", views:"۱۸,۴۰۰", thumbnail:heroImages[2], author:"رضا احمدی", date:"۱۴۰۳/۰۹/۱۵", description:"مقایسه دو کراس‌اوور محبوب هیوندای توسان و کیا اسپورتیج. کدام ارزش خرید بیشتری دارد؟", content:`هیوندای توسان و کیا اسپورتیج دو محصول هیوندای-کیا موتور هستند که پلتفرم مشترکی دارند اما شخصیت‌های متفاوتی ارائه می‌دهند.

## مشخصات مقایسه‌ای
**هیوندای توسان ۲.۰**
- موتور ۲.۰ لیتری با ۱۵۶ اسب بخار
- گیربکس ۶ سرعته اتوماتیک
- مصرف سوخت ۷.۸ لیتر
- صندوق عقب ۵۱۳ لیتری

**کیا اسپورتیج ۲.۰**
- موتور ۲.۰ لیتری با ۱۵۶ اسب بخار
- گیربکس ۶ سرعته اتوماتیک
- مصرف سوخت ۷.۵ لیتر
- صندوق عقب ۴۸۸ لیتری

## تفاوت‌های کلیدی
- طراحی: توسان اسپرت‌تر، اسپورتیج کلاسیک‌تر
- آپشن‌ها: اسپورتیج تجهیزات بیشتری در نسخه‌های مشابه
- قیمت: توسان کمی ارزان‌تر
- ارزش بازخرید: هر دو تقریبا برابر

## نتیجه‌گیری
انتخاب بین این دو بیشتر سلیقه‌ای است. اگر آپشن‌های بیشتر می‌خواهید اسپورتیج و اگر طراحی جذاب‌تر می‌خواهید توسان بهتر است.` },
  { id:"vid10", title:"راهنمای جامع بازرسی فنی خودرو", duration:"۳۵:۲۰", category:"راهنما", views:"۲۸,۹۰۰", thumbnail:heroImages[3] },
  { id:"vid11", title:"بررسی مرسدس بنز کلاس E ۲۰۲۳", duration:"۴۰:۱۵", category:"نقد و بررسی", views:"۴۵,۲۰۰", thumbnail:heroImages[4] },
  { id:"vid12", title:"قوانین جدید گمرک برای خودروهای وارداتی", duration:"۱۴:۵۰", category:"قوانین", views:"۱۱,۳۰۰", thumbnail:heroImages[5] },
  { id:"vid13", title:"آموزش بازدید شاسی و بدنه خودرو", duration:"۲۶:۳۰", category:"آموزش", views:"۳۳,۷۰۰", thumbnail:heroImages[0] },
  { id:"vid14", title:"مقایسه بی‌ام‌و سری ۵ و آئودی آ۶", duration:"۱۸:۰۰", category:"مقایسه", views:"۲۰,۶۰۰", thumbnail:heroImages[1] },
  { id:"vid15", title:"راهنمای انتخاب خودرو مناسب", duration:"۱۶:۴۵", category:"راهنما", views:"۱۵,۸۰۰", thumbnail:heroImages[2] },
  { id:"vid16", title:"بررسی لکسوس RX ۳۵۰h", duration:"۳۸:۲۰", category:"نقد و بررسی", views:"۵۲,۱۰۰", thumbnail:heroImages[3] },
  { id:"vid17", title:"مراحل صدور بیمه‌نامه خودرو وارداتی", duration:"۱۱:۱۰", category:"قوانین", views:"۷,۵۰۰", thumbnail:heroImages[4] },
  { id:"vid18", title:"آموزش بررسی سند و مدارک خودرو", duration:"۲۱:۰۰", category:"آموزش", views:"۲۵,۳۰۰", thumbnail:heroImages[5] },
  { id:"vid19", title:"مقایسه ولوو XC90 و نیسان پاترول", duration:"۲۴:۳۰", category:"مقایسه", views:"۱۳,۹۰۰", thumbnail:heroImages[0] },
  { id:"vid20", title:"راهنمای انتخاب رنگ و آپشن خودرو", duration:"۱۳:۲۰", category:"راهنما", views:"۱۰,۲۰۰", thumbnail:heroImages[1] },
  { id:"vid21", title:"بررسی فولکس‌واگن تیگوان R-Line", duration:"۳۰:۰۰", category:"نقد و بررسی", views:"۲۷,۴۰۰", thumbnail:heroImages[2] },
  { id:"vid22", title:"قوانین ترانزیت خودرو از مناطق آزاد", duration:"۱۷:۴۵", category:"قوانین", views:"۸,۹۰۰", thumbnail:heroImages[3] },
  { id:"vid23", title:"آموزش تست درایو حرفه‌ای", duration:"۳۴:۱۰", category:"آموزش", views:"۳۸,۵۰۰", thumbnail:heroImages[4] },
  { id:"vid24", title:"مقایسه آئودی Q7 و بی‌ام‌و X5", duration:"۲۷:۰۰", category:"مقایسه", views:"۱۹,۸۰۰", thumbnail:heroImages[5] },
];

export const faqs: FAQItem[] = [
  { id:"f1", question:"خودرو واردات موقت چیست؟", answer:"خودرو واردات موقت خودرویی است که برای مدت محدودی (معمولا ۳ ماه قابل تمدید) وارد کشور شده و دارای پلاک ویژه‌ای است. این خودروها معمولا در مناطق آزاد تجاری خریداری می‌شوند و باید قبل از پایان مهلت مجوز، نسبت به خروج یا انتقال مالکیت آن اقدام شود." },
  { id:"f2", question:"محدودیت‌های خودروی پلاک منطقه آزاد چیست؟", answer:"خودروهای دارای پلاک منطقه آزاد تنها مجاز به تردد در محدوده همان منطقه آزاد هستند. برای تردد در سراسر کشور نیاز به دریافت مجوزهای خاص و پرداخت عوارض مربوطه می‌باشد. همچنین انتقال مالکیت این خودروها تابع شرایط خاصی است." },
  { id:"f3", question:"آیا انتقال مالکیت خودروی منطقه آزاد ممکن است؟", answer:"بله، انتقال مالکیت خودروهای منطقه آزاد امکان‌پذیر است اما تابع شرایط خاصی از جمله بررسی مدارک، پرداخت عوارض، و ثبت رسمی در اداره راهنمایی و رانندگی منطقه آزاد مربوطه می‌باشد. تیم آزاد گذر تمام مراحل انتقال مالکیت را برای شما انجام می‌دهد." },
  { id:"f4", question:"خودرو واردات موقت تا چه مدت می‌تواند تردد کند؟", answer:"خودروهای واردات موقت معمولا ۳ ماه مجوز اولیه دارند که قابل تمدید است. حداکثر مدت تردد بسته به نوع مجوز و شرایط خاص می‌تواند تا ۶ ماه یا بیشتر باشد. پس از آن باید نسبت به خروج خودرو یا تبدیل وضعیت قانونی اقدام شود." },
  { id:"f5", question:"هزینه حمل و نقل خودرو چگونه محاسبه می‌شود؟", answer:"هزینه حمل و نقل خودرو بر اساس فاصله بین مبدا و مقصد، نوع خودرو (سواری، شاسی‌بلند و غیره)، نوع حمل (تخته‌ای، ترانزیت و غیره) و شرایط زمانی محاسبه می‌شود. برای دریافت قیمت دقیق می‌توانید از فرم درخواست حمل و نقل استفاده کنید." },
  { id:"f6", question:"چگونه درخواست بازرسی خودرو بدهیم؟", answer:"از طریق وب‌سایت آزاد گذر می‌توانید درخواست بازرسی خودرو ثبت کنید. کارشناسان ما با همکاری مراکز معتبر بازرسی، خودرو را از نظر فنی، بدنه، رنگ، شاسی و مدارک به صورت کامل بررسی کرده و گزارش مفصلی ارائه می‌دهند." },
  { id:"f7", question:"چگونه اعتبار فروشنده یا نمایشگاه را بررسی کنیم؟", answer:"در آزاد گذر، تمام فروشندگان و نمایشگاه‌ها مورد تایید و احراز هویت شده‌اند. نمایشگاه‌های دارای نشان تایید شده، توسط تیم ما بررسی شده‌اند. همچنین می‌توانید از طریق امتیاز کاربران و نظرات ثبت شده، اعتبار فروشنده را ارزیابی کنید." },
  { id:"f8", question:"آیا امکان مقایسه چند خودرو وجود دارد؟", answer:"بله، در آزاد گذر می‌توانید تا ۴ خودرو را به صورت همزمان مقایسه کنید. این مقایسه شامل مشخصات فنی، قیمت، امکانات، امتیاز کاربران و سایر ویژگی‌های مهم است. برای این کار کافی است خودروهای مورد نظر را به لیست مقایسه اضافه کنید." },
  { id:"f9", question:"شرایط ثبت آگهی خودرو چیست؟", answer:"برای ثبت آگهی خودرو در آزاد گذر، ابتدا باید ثبت‌نام کرده و حساب کاربری خود را تایید کنید. سپس با تکمیل فرم ثبت آگهی شامل اطلاعات خودرو، تصاویر، قیمت و شرایط فروش، آگهی شما پس از بررسی و تایید منتشر خواهد شد." },
  { id:"f10", question:"آیا امکان معامله مستقیم با فروشنده وجود دارد؟", answer:"بله، شما می‌توانید مستقیما با فروشنده یا نمایشگاه مذاکره کنید. تمام فروشندگان و نمایشگاه‌های ثبت‌شده در آزاد گذر احراز هویت شده‌اند. برای ارتباط با فروشنده از دکمه تماس در صفحه خودرو استفاده کنید." },
];

export const bodyTypes = [
  "سدان", "هاچ‌بک", "شاسی‌بلند", "کراس‌اوور", "کوپه", "کابریوله", "پیکاپ", "وانت", "اسپرت", "کلاسیک",
];

export const freeZones = ["کیش", "قشم", "چابهار", "ارسباران", "انزلی", "آراز", "ماکو", "ایرانشهر"];

export const cities = ["تهران", "اصفهان", "شیراز", "تبریز", "مشهد", "کرج", "اهواز", "رشت", "کرمانشاه", "قم"];

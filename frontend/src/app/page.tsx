"use client";

import { useEffect } from "react";
import { useNavigation, initHashRouter, type PageId } from "@/stores/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FloatingButtons } from "@/components/layout/FloatingButtons";
import { HomePage } from "@/components/home/HomePage";
import { BuyPage } from "@/components/pages/BuyPage";
import { SellPage } from "@/components/pages/SellPage";
import { VehicleDetailsPage } from "@/components/pages/VehicleDetailsPage";
import { ComparisonPage } from "@/components/pages/ComparisonPage";
import { InstantSalePage } from "@/components/pages/InstantSalePage";
import { SpecialSalePage } from "@/components/pages/SpecialSalePage";
import { DealershipsPage } from "@/components/pages/DealershipsPage";
import { DealershipDetailPage } from "@/components/pages/DealershipDetailPage";
import { GalleriesPage } from "@/components/pages/GalleriesPage";
import { GalleryDetailPage } from "@/components/pages/GalleryDetailPage";
import { ServicesPage } from "@/components/pages/ServicesPage";
import { LoginPage } from "@/components/pages/LoginPage";
import { RegisterPage } from "@/components/pages/RegisterPage";
import { ForgotPasswordPage } from "@/components/pages/ForgotPasswordPage";
import { AccountTypePage } from "@/components/pages/AccountTypePage";
import { BuyerDashboardPage } from "@/components/pages/BuyerDashboardPage";
import { SellerDashboardPage } from "@/components/pages/SellerDashboardPage";
import { GalleryDashboardPage } from "@/components/pages/GalleryDashboardPage";
import { AgencyDashboardPage } from "@/components/pages/AgencyDashboardPage";
import { ExpertDashboardPage } from "@/components/pages/ExpertDashboardPage";
import { AdminDashboardPage } from "@/components/pages/AdminDashboardPage";
import { FavoritesPage } from "@/components/pages/FavoritesPage";
import { BrandsPage } from "@/components/pages/BrandsPage";
import { BrandDetailPage } from "@/components/pages/BrandDetailPage";
import { VideosPage } from "@/components/pages/VideosPage";
import { VideoDetailPage } from "@/components/pages/VideoDetailPage";
import { ComingSoonPage } from "@/components/ui/coming-soon";
import { TermsPage } from "@/components/pages/TermsPage";
import { PrivacyPage } from "@/components/pages/PrivacyPage";

const pageComponents: Record<PageId, React.ComponentType> = {
  home: HomePage,
  buy: BuyPage,
  sell: SellPage,
  'post-listing': SellPage,
  'vehicle-details': VehicleDetailsPage,
  comparison: ComparisonPage,
  'instant-sale': InstantSalePage,
  'special-sale': SpecialSalePage,
  favorites: FavoritesPage,
  brands: BrandsPage,
  'brand-detail': BrandDetailPage,
  dealerships: DealershipsPage,
  'dealership-detail': DealershipDetailPage,
  galleries: GalleriesPage,
  'gallery-detail': GalleryDetailPage,
  services: ServicesPage,
  'ownership-transfer': ServicesPage,
  transportation: ServicesPage,
  inspection: ServicesPage,
  consultation: ServicesPage,
  videos: VideosPage,
  blog: ComingSoonPage,
  'article-detail': ComingSoonPage,
  'video-detail': VideoDetailPage,
  faq: ComingSoonPage,
  about: ComingSoonPage,
  contact: ComingSoonPage,
  login: LoginPage,
  register: RegisterPage,
  'forgot-password': ForgotPasswordPage,
  'account-type': AccountTypePage,
  'buyer-dashboard': BuyerDashboardPage,
  'seller-dashboard': SellerDashboardPage,
  'gallery-dashboard': GalleryDashboardPage,
  'agency-dashboard': AgencyDashboardPage,
  'expert-dashboard': ExpertDashboardPage,
  'admin-dashboard': AdminDashboardPage,
  tariffs: ComingSoonPage,
  'org-panel': ComingSoonPage,
  'smart-id': ComingSoonPage,
  terms: TermsPage,
  privacy: PrivacyPage,
};

export default function Page() {
  const { currentPage } = useNavigation();

  useEffect(() => {
    initHashRouter();
  }, []);

  const PageComponent = pageComponents[currentPage] || HomePage;

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <Header />
      <main className="flex-1">
        <PageComponent key={currentPage} />
      </main>
      <Footer />
      <FloatingButtons />
    </div>
  );
}

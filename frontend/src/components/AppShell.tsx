'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { useNavigation, initHashRouter, type PageId } from '@/stores/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { FloatingButtons } from '@/components/layout/FloatingButtons';

function PageLoading() {
  return <div role="status" className="flex min-h-[55vh] items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-5 animate-spin" />در حال بارگذاری صفحه...</div>;
}

const HomePage = dynamic(() => import('@/components/home/HomePage').then((module) => module.HomePage), { loading: PageLoading });
const BuyPage = dynamic(() => import('@/components/pages/BuyPage').then((module) => module.BuyPage), { loading: PageLoading });
const SellPage = dynamic(() => import('@/components/pages/SellPage').then((module) => module.SellPage), { loading: PageLoading });
const VehicleDetailsPage = dynamic(() => import('@/components/pages/VehicleDetailsPage').then((module) => module.VehicleDetailsPage), { loading: PageLoading });
const ComparisonPage = dynamic(() => import('@/components/pages/ComparisonPage').then((module) => module.ComparisonPage), { loading: PageLoading });
const InstantSalePage = dynamic(() => import('@/components/pages/InstantSalePage').then((module) => module.InstantSalePage), { loading: PageLoading });
const SpecialSalePage = dynamic(() => import('@/components/pages/SpecialSalePage').then((module) => module.SpecialSalePage), { loading: PageLoading });
const DealershipsPage = dynamic(() => import('@/components/pages/DealershipsPage').then((module) => module.DealershipsPage), { loading: PageLoading });
const DealershipDetailPage = dynamic(() => import('@/components/pages/DealershipDetailPage').then((module) => module.DealershipDetailPage), { loading: PageLoading });
const GalleriesPage = dynamic(() => import('@/components/pages/GalleriesPage').then((module) => module.GalleriesPage), { loading: PageLoading });
const GalleryDetailPage = dynamic(() => import('@/components/pages/GalleryDetailPage').then((module) => module.GalleryDetailPage), { loading: PageLoading });
const ServicesPage = dynamic(() => import('@/components/pages/ServicesPage').then((module) => module.ServicesPage), { loading: PageLoading });
const LoginPage = dynamic(() => import('@/components/pages/LoginPage').then((module) => module.LoginPage), { loading: PageLoading });
const RegisterPage = dynamic(() => import('@/components/pages/RegisterPage').then((module) => module.RegisterPage), { loading: PageLoading });
const ForgotPasswordPage = dynamic(() => import('@/components/pages/ForgotPasswordPage').then((module) => module.ForgotPasswordPage), { loading: PageLoading });
const AccountTypePage = dynamic(() => import('@/components/pages/AccountTypePage').then((module) => module.AccountTypePage), { loading: PageLoading });
const BuyerDashboardPage = dynamic(() => import('@/components/pages/BuyerDashboardPage').then((module) => module.BuyerDashboardPage), { loading: PageLoading });
const SellerDashboardPage = dynamic(() => import('@/components/pages/SellerDashboardPage').then((module) => module.SellerDashboardPage), { loading: PageLoading });
const GalleryDashboardPage = dynamic(() => import('@/components/pages/GalleryDashboardPage').then((module) => module.GalleryDashboardPage), { loading: PageLoading });
const AgencyDashboardPage = dynamic(() => import('@/components/pages/AgencyDashboardPage').then((module) => module.AgencyDashboardPage), { loading: PageLoading });
const ExpertDashboardPage = dynamic(() => import('@/components/pages/ExpertDashboardPage').then((module) => module.ExpertDashboardPage), { loading: PageLoading });
const AdminDashboardPage = dynamic(() => import('@/components/pages/AdminDashboardPage').then((module) => module.AdminDashboardPage), { loading: PageLoading });
const OrgPanelPage = dynamic(() => import('@/components/pages/OrgPanelPage').then((module) => module.OrgPanelPage), { loading: PageLoading });
const SmartIdDashboardPage = dynamic(() => import('@/components/pages/SmartIdDashboardPage').then((module) => module.SmartIdDashboardPage), { loading: PageLoading });
const FavoritesPage = dynamic(() => import('@/components/pages/FavoritesPage').then((module) => module.FavoritesPage), { loading: PageLoading });
const BrandsPage = dynamic(() => import('@/components/pages/BrandsPage').then((module) => module.BrandsPage), { loading: PageLoading });
const BrandDetailPage = dynamic(() => import('@/components/pages/BrandDetailPage').then((module) => module.BrandDetailPage), { loading: PageLoading });
const VideosPage = dynamic(() => import('@/components/pages/VideosPage').then((module) => module.VideosPage), { loading: PageLoading });
const VideoDetailPage = dynamic(() => import('@/components/pages/VideoDetailPage').then((module) => module.VideoDetailPage), { loading: PageLoading });
const FAQPage = dynamic(() => import('@/components/pages/FAQPage').then((module) => module.FAQPage), { loading: PageLoading });
const BlogPage = dynamic(() => import('@/components/pages/BlogPage').then((module) => module.BlogPage), { loading: PageLoading });
const ArticleDetailPage = dynamic(() => import('@/components/pages/ArticleDetailPage').then((module) => module.ArticleDetailPage), { loading: PageLoading });
const AboutPage = dynamic(() => import('@/components/pages/AboutPage').then((module) => module.AboutPage), { loading: PageLoading });
const ContactPage = dynamic(() => import('@/components/pages/ContactPage').then((module) => module.ContactPage), { loading: PageLoading });
const ComingSoonPage = dynamic(() => import('@/components/ui/coming-soon').then((module) => module.ComingSoonPage), { loading: PageLoading });
const TermsPage = dynamic(() => import('@/components/pages/TermsPage').then((module) => module.TermsPage), { loading: PageLoading });
const PrivacyPage = dynamic(() => import('@/components/pages/PrivacyPage').then((module) => module.PrivacyPage), { loading: PageLoading });

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
  blog: BlogPage,
  'article-detail': ArticleDetailPage,
  'video-detail': VideoDetailPage,
  faq: FAQPage,
  about: AboutPage,
  contact: ContactPage,
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
  'org-panel': OrgPanelPage,
  'smart-id': SmartIdDashboardPage,
  terms: TermsPage,
  privacy: PrivacyPage,
};

export function AppShell() {
  const { currentPage } = useNavigation();

  useEffect(() => initHashRouter(), []);

  const PageComponent = pageComponents[currentPage] || HomePage;

  return (
    <div className="flex min-h-screen flex-col bg-background" dir="rtl">
      <Header />
      <main className="flex-1"><PageComponent key={currentPage} /></main>
      <Footer />
      <FloatingButtons />
    </div>
  );
}

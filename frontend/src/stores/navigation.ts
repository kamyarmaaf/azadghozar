import { create } from 'zustand';

export type PageId =
  | 'home'
  | 'buy'
  | 'sell'
  | 'post-listing'
  | 'vehicle-details'
  | 'comparison'
  | 'instant-sale'
  | 'special-sale'
  | 'favorites'
  | 'brands'
  | 'brand-detail'
  | 'dealerships'
  | 'dealership-detail'
  | 'galleries'
  | 'gallery-detail'
  | 'services'
  | 'ownership-transfer'
  | 'transportation'
  | 'inspection'
  | 'consultation'
  | 'videos'
  | 'blog'
  | 'article-detail'
  | 'video-detail'
  | 'faq'
  | 'about'
  | 'contact'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'account-type'
  | 'buyer-dashboard'
  | 'seller-dashboard'
  | 'gallery-dashboard'
  | 'expert-dashboard'
  | 'admin-dashboard'
  | 'tariffs'
  | 'org-panel'
  | 'smart-id'
  | 'terms'
  | 'privacy';

export const allPageIds: PageId[] = [
  'home','buy','sell','post-listing','vehicle-details','comparison',
  'instant-sale','special-sale','favorites','brands','brand-detail','dealerships',
  'dealership-detail','galleries','gallery-detail','services',
  'ownership-transfer','transportation','inspection','consultation',
  'videos','blog','article-detail','video-detail','faq','about','contact','login',
  'register','forgot-password','account-type','buyer-dashboard','seller-dashboard',
  'gallery-dashboard','expert-dashboard','admin-dashboard','tariffs','org-panel','smart-id','terms','privacy',
];

function isValidPageId(hash: string): hash is PageId {
  return allPageIds.includes(hash as PageId);
}

/** Extract page ID from hash, stripping query params (e.g. `register?ref=CODE` → `register`) */
function getHashLocation(): {
  page: PageId;
  data: Record<string, unknown> | null;
} {
  if (typeof window !== 'undefined') {
    const raw = window.location.hash.slice(1);
    const [pageId, query = ''] = raw.split('?');
    if (pageId && isValidPageId(pageId)) {
      const params = new URLSearchParams(query);
      const listingId = params.get('id');
      const businessSlug = params.get('slug');
      return {
        page: pageId,
        data: listingId
          ? { vehicleId: listingId }
          : businessSlug
            ? { businessSlug }
            : null,
      };
    }
  }
  return { page: 'home', data: null };
}

let _isProgrammaticNav = false;

interface NavigationState {
  currentPage: PageId;
  previousPages: PageId[];
  pageData: Record<string, unknown> | null;
  navigateTo: (page: PageId, data?: Record<string, unknown>) => void;
  goBack: () => void;
  setCurrentPage: (page: PageId) => void;
}

export const useNavigation = create<NavigationState>((set, get) => ({
  currentPage: 'home',
  previousPages: [],
  pageData: null,

  navigateTo: (page, data) => {
    const { currentPage } = get();
    _isProgrammaticNav = true;

    if (currentPage !== page) {
      set({
        currentPage: page,
        previousPages: [...get().previousPages, currentPage],
        pageData: data || null,
      });
    } else {
      set({ pageData: data || null });
    }

    const listingId = data?.vehicleId;
    const businessSlug = data?.businessSlug;
    window.location.hash = ['vehicle-details', 'sell'].includes(page) && listingId
      ? `${page}?id=${encodeURIComponent(String(listingId))}`
      : ['gallery-detail', 'dealership-detail'].includes(page) && businessSlug
        ? `${page}?slug=${encodeURIComponent(String(businessSlug))}`
        : page;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    requestAnimationFrame(() => {
      _isProgrammaticNav = false;
    });
  },

  goBack: () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      const { previousPages } = get();
      if (previousPages.length > 0) {
        const newPrevious = [...previousPages];
        const prevPage = newPrevious.pop()!;
        set({ currentPage: prevPage, previousPages: newPrevious });
        window.location.hash = prevPage;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  },

  setCurrentPage: (page) => {
    const { currentPage } = get();
    if (currentPage !== page) {
      set({
        currentPage: page,
        previousPages: [...get().previousPages, currentPage],
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },
}));

export function initHashRouter() {
  const initialLocation = getHashLocation();
  const store = useNavigation.getState();
  if (store.currentPage !== initialLocation.page || initialLocation.data) {
    useNavigation.setState({
      currentPage: initialLocation.page,
      pageData: initialLocation.data,
    });
  }

  window.addEventListener('hashchange', () => {
    if (_isProgrammaticNav) return;
    const location = getHashLocation();
    useNavigation.setState({
      pageData: location.data,
    });
    useNavigation.getState().setCurrentPage(location.page);
  });
}

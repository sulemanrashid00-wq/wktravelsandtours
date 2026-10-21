import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const dummyStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isDrawerOpen: false,

      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),

      addItem: (pkg, count = 1, travelDate = '') => {
        if (!pkg || !pkg.id) return;
        const safeCount = Math.max(1, parseInt(count, 10) || 1);
        const existing = get().items.find((item) => item.packageId === pkg.id);

        const isCustomTrip = Boolean(
          pkg.isCustomTripPromotion ||
          pkg.is_custom_trip_promotion ||
          pkg.isCustomized ||
          pkg.is_customized ||
          pkg.pricingBasis === 'custom' ||
          pkg.slug === 'family-customized-package' ||
          pkg.slug === 'friends-vip-package' ||
          pkg.slug === 'honeymoon-customized-package'
        );

        const confirmedPrice = isCustomTrip ? 0 : Math.max(0, Math.round(Number(pkg.price) || 0));

        if (existing) {
          set({
            items: get().items.map((item) =>
              item.packageId === pkg.id
                ? {
                    ...item,
                    travellerCount: item.travellerCount + safeCount,
                    travelDate: travelDate || item.travelDate,
                  }
                : item
            ),
          });
        } else {
          set({
            items: [
              ...get().items,
              {
                packageId: pkg.id,
                title: pkg.title || 'Travel Package',
                slug: pkg.slug || '',
                destination: pkg.destination || 'International',
                duration: pkg.duration || '',
                price: confirmedPrice,
                pricingBasis: pkg.pricingBasis || (isCustomTrip ? 'custom' : 'per_person'),
                serviceType: pkg.serviceType || (pkg.pricingBasis === 'visa_only' ? 'visa' : 'tour'),
                isCustomTrip,
                primaryImage: pkg.primaryImage || '/images/logo/wk-travel-logo.jpeg',
                travellerCount: safeCount,
                travelDate: travelDate || '',
              },
            ],
          });
        }
      },

      removeItem: (packageId) => {
        set({
          items: get().items.filter((item) => item.packageId !== packageId),
        });
      },

      updateTravellerCount: (packageId, count) => {
        const safeCount = Math.max(1, parseInt(count, 10) || 1);
        set({
          items: get().items.map((item) =>
            item.packageId === packageId ? { ...item, travellerCount: safeCount } : item
          ),
        });
      },

      updateTravelDate: (packageId, travelDate) => {
        set({
          items: get().items.map((item) =>
            item.packageId === packageId ? { ...item, travelDate: travelDate || '' } : item
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      getTotalTravellers: () => {
        return get().items.reduce((total, item) => total + (parseInt(item.travellerCount, 10) || 1), 0);
      },

      getDistinctPackagesCount: () => {
        return get().items.length;
      },

      hasCustomTrip: () => {
        return get().items.some(
          (item) => item.isCustomTrip === true || item.pricingBasis === 'custom' || item.price === 0
        );
      },

      getGrandTotal: () => {
        return get().items.reduce((total, item) => {
          const isCustom =
            item.isCustomTrip === true || item.pricingBasis === 'custom' || item.price === 0;
          if (isCustom) return total;

          // Multiply by travellerCount only if pricingBasis is 'per_person'
          const multiplier = item.pricingBasis === 'per_person' ? (parseInt(item.travellerCount, 10) || 1) : 1;
          const price = Math.max(0, parseInt(item.price, 10) || 0);
          return total + price * multiplier;
        }, 0);
      },

      getSubtotal: () => {
        return get().getGrandTotal();
      },
    }),
    {
      name: 'wk_cart_storage',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : dummyStorage)),
      partialize: (state) => ({ items: state.items }), // Only persist items, never transient drawer open state
    }
  )
);

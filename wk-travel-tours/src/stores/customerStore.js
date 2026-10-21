import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const dummyStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useCustomerStore = create(
  persist(
    (set) => ({
      customer: {
        fullName: '',
        phone: '',
        city: 'Karachi',
        email: '',
      },

      setCustomerDetails: (details) => {
        set((state) => ({
          customer: {
            ...state.customer,
            ...details,
          },
        }));
      },

      clearCustomerDetails: () => {
        set({
          customer: {
            fullName: '',
            phone: '',
            city: '',
            email: '',
          },
        });
      },
    }),
    {
      name: 'wk_customer_details',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : dummyStorage)),
    }
  )
);

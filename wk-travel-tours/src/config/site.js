export const siteConfig = {
  name: 'WK Travel & Tours',
  legalName: 'WK Travel & Tours (Pvt) Ltd.',
  adminEmail: 'wktravelandtour@gmail.com',
  slogan: 'Journeys Beyond Boundaries',
  tagline: 'Explore the World with Tailored Journeys, Transparent Pricing & Verified Visas',
  description:
    'WK Travel & Tours is a premier travel agency based in Karachi, Pakistan, offering customized holiday packages, group tours, honeymoon escapes, and professional tourist visa assistance across Asia, Middle East, and beyond.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  contact: {
    phone: '03372614742',
    altPhone: '03022614742',
    whatsapp: '923372614742',
    email: 'info@wktravel.pk',
    adminEmail: 'wktravelandtour@gmail.com',
    address: 'Royal Defence Mall, 3rd Floor, Office No. 101, Karachi, Pakistan',
    city: 'Karachi',
    country: 'Pakistan',
  },
  social: {
    whatsapp: 'https://wa.me/923372614742',
    instagram: 'https://instagram.com/wktravelandtours',
    facebook: 'https://facebook.com/wktravelandtours',
  },
  navItems: [
    { label: 'Home', href: '/' },
    { label: 'Packages', href: '/packages' },
    { label: 'Custom Trip', href: '/custom-trip' },
    { label: 'Our Work', href: '/our-work' },
    { label: 'Reviews', href: '/reviews' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
  footerLinks: [
    { label: 'Customer Profile', href: '/profile' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Customer Reviews', href: '/reviews' },
    { label: 'Completed Tours & Visas', href: '/our-work' },
  ],
};


import { Plus_Jakarta_Sans, Playfair_Display } from 'next/font/google';
import './globals.css';
import { siteConfig } from '@/config/site';

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

export const metadata = {
  title: {
    default: `${siteConfig.name} | Journeys Beyond Boundaries`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    'WK Travel & Tours',
    'travel agency Karachi',
    'Pakistan travel agency',
    'tour packages',
    'Baku tour from Karachi',
    'Dubai packages',
    'Thailand trip',
    'Turkey tours',
    'visit visa assistance',
    'custom trips',
  ],
  authors: [{ name: 'WK Travel & Tours' }],
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [
      {
        url: '/images/logo/wk-travel-logo.jpeg',
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  icons: {
    icon: '/images/logo/wk-travel-logo.jpeg',
  },
};

export const viewport = {
  themeColor: '#0B233D',
  width: 'device-width',
  initialScale: 1,
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TravelAgency',
  name: siteConfig.name,
  image: `${siteConfig.url}/images/logo/wk-travel-logo.jpeg`,
  '@id': `${siteConfig.url}/#agency`,
  url: siteConfig.url,
  telephone: siteConfig.contact.phone,
  priceRange: 'PKR 65000 - PKR 400000',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Royal Defence Mall, 3rd Floor, Office No. 101',
    addressLocality: 'Karachi',
    addressRegion: 'Sindh',
    postalCode: '75500',
    addressCountry: 'PK',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 24.8298,
    longitude: 67.0734,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '10:00',
      closes: '20:00',
    },
  ],
  contactPoint: [
    {
      '@type': 'ContactPoint',
      telephone: '+92-337-2614742',
      contactType: 'customer service',
      areaServed: 'PK',
      availableLanguage: ['English', 'Urdu'],
    },
    {
      '@type': 'ContactPoint',
      telephone: '+92-302-2614742',
      contactType: 'sales',
      areaServed: 'PK',
      availableLanguage: ['English', 'Urdu'],
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${jakartaSans.variable} ${playfairDisplay.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col font-sans bg-white text-brand-navy selection:bg-brand-teal-100 selection:text-brand-navy">
        {children}
      </body>
    </html>
  );
}


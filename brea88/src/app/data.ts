export interface Property {
  id: number;
  title: string;
  tag: 'Residential' | 'Commercial' | 'Investment' | 'All';
  price: string;
  totalcp?: string;
  developer?: string;
  location: string;

  // Main image
  image: string;

  // Additional property photos
  images?: string[];

  beds?: number;
  baths?: number;
  sqft: number;
  description?: string;
}

export function addProperty(newProperty: Omit<Property, 'id'>) {
  const newId =
    PROPERTIES.length > 0
      ? Math.max(...PROPERTIES.map((p) => p.id)) + 1
      : 1;

  const propertyWithId: Property = {
    id: newId,
    ...newProperty,
  };

  PROPERTIES.push(propertyWithId);

  return propertyWithId;
}


// Global mutable variable for local testing runtime
export let PROPERTIES: Property[] = [
  {
    id: 1,
    title: "Premium Residential Villa",
    totalcp: "₱12,500,000",
    developer: "Sunset Developments",
    tag: "Residential",
    price: "12,500,000",
    location: "Canduman, Mandaue City",

    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",

    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80",
    ],

    beds: 4,
    baths: 3,
    sqft: 250,
    description:
      "A premium residential villa designed for comfortable and modern family living.",
  },

  {
    id: 2,
    title: "Modern Corporate Office Space",
    totalcp: "₱113,500,000",
    developer: "CLI Group",
    tag: "Commercial",
    price: "45,000,000",
    location: "Cebu Business Park, Cebu City",

    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",

    images: [
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    ],

    sqft: 850,
    description:
      "A modern corporate office space strategically located in Cebu Business Park.",
  },
];

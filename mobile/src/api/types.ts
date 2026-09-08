export type PublicUser = {
  id: string;
  role: 'customer' | 'admin' | string;
  email: string | null;
  phone: string | null;
  name: string;
  address: string;
  city: string;
};

export type Session = { token: string; user: PublicUser };

export type OrderLine = { name: string; qty: number; sum: number };

export type Order = {
  id: string;
  category: 'cous' | 'schn' | 'box' | 'fruit' | 'chef' | string;
  status: string;
  name: string;
  phone: string;
  ship: 'self' | 'deliv' | string;
  time: string;
  city: string;
  address: string;
  pay: string;
  saleDate: string;
  via: string;
  lines: OrderLine[];
  itemsTotal: number;
  shippingFee: number;
  total: number;
  cancelReason: string;
  cancelNote: string;
  createdAt: string;
  updatedAt: string;
  userId: string | null;
};

export type AdminCard = {
  id: string;
  key: 'cous' | 'schn' | 'box' | 'fruit' | 'chef';
  status: string;
  who: string;
  phone: string;
  time: string;
  items: string;
  sum: number;
  ship: string;
  pay: string;
  via: string;
  hrs: number;
  cancelReason: string;
  cancelNote: string;
  saleDate: string;
  createdAt: string;
};

export type CouscousDetails = { category: 'cous'; qty: number[] };
export type SchnitzelDetails = {
  category: 'schn';
  mode: 'unit' | 'box';
  rolls: { type: number; tops: string[] }[];
  box: { type: number; tops: string[] } | null;
  cocottes: number[];
};
export type FruitDetails = { category: 'fruit'; qty: number[] };
export type BoxDetails = { category: 'box'; key: string; picks: Record<string, unknown> };
export type ChefDetails = { category: 'chef'; key: string; picks: Record<string, unknown> };
export type OrderDetails =
  | CouscousDetails
  | SchnitzelDetails
  | FruitDetails
  | BoxDetails
  | ChefDetails;

export type CreateOrderBody = {
  ship: 'self' | 'deliv';
  time: string;
  city?: string;
  address?: string;
  pay: string;
  saleDate?: string;
  name?: string;
  phone?: string;
  details: OrderDetails;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

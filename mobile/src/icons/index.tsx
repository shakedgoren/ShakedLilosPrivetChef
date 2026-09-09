import React from 'react';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

/**
 * ⚠ נוצר אוטומטית · scripts/emit-icons.mjs · אין לערוך ביד.
 *
 * הצורות מגיעות אחת לאחת מאייקוני הקנבס. כל אייקון בקנבס בנוי
 * viewBox 0 0 24 24, בלי מילוי, עם קו וקצוות עגולים — ולכן העטיפה
 * משותפת לכולם, ומה שמשתנה הוא הגודל, הצבע ועובי הקו.
 *
 * ברירות המחדל של כל אייקון הן הערכים השכיחים שלו בקנבס.
 */

export type IconProps = {
  /** רוחב וגובה בפיקסלים */
  size?: number;
  /** צבע הקו */
  color?: string;
  /** עובי הקו */
  strokeWidth?: number;
};

type BaseProps = IconProps & { children: React.ReactNode };

function Base({ size, color, strokeWidth, children }: BaseProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  );
}

/** מופע אחד בקנבס · Order */
export function AlertCircle({ size = 17, color = '#F6C87A', strokeWidth = 2 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 7.5v5.5M12 16.4v.2" />
    </Base>
  );
}

/** מופע אחד בקנבס · AdminStock */
export function AlertTriangle({ size = 19, color = '#A65E2A', strokeWidth = 1.9 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M12 4l9 16H3z" />
      <Path d="M12 10v4M12 17.2v.1" />
    </Base>
  );
}

/** מופע אחד בקנבס · Guest */
export function ArrowLeft({ size = 15, color = '#4B3B78', strokeWidth = 2.2 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M19 12H5M11 6l-6 6 6 6" />
    </Base>
  );
}

/** 5 מופעים בקנבס · Boxes, Chef, Fruit, Order, Schnitzel */
export function Bag({ size = 21, color = '#437C59', strokeWidth = 1.7 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M4 8h16v12H4z" />
      <Path d="M8 8V6a4 4 0 0 1 8 0v2" />
    </Base>
  );
}

/** 9 מופעים בקנבס · AdminCosts, AdminCustomers, AdminDays, AdminHistory, AdminMenu, AdminMoney, AdminOrders, AdminShopping, AdminStock */
export function BarChart({ size = 22, color = '#918A9E', strokeWidth = 1.7 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M4 19V9M10 19V5M16 19v-6M21 19H3" />
    </Base>
  );
}

/** 2 מופעים בקנבס · Admin */
export function Bars({ size = 15, color = '#9A93A6', strokeWidth = 1.6 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M4 19h16" />
      <Path d="M7 19v-6M12 19V7M17 19v-9" />
    </Base>
  );
}

/** מופע אחד בקנבס · AdminCosts */
export function Bell({ size = 19, color = '#A65E2A', strokeWidth = 1.9 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
      <Path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </Base>
  );
}

/** מופע אחד בקנבס · AdminOrders */
export function Board({ size = 15, color = '#43307A', strokeWidth = 1.9 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Rect x="3" y="4" width="18" height="16" rx="2" />
      <Path d="M3 9h18M3 14.5h18M9.5 9v11" />
    </Base>
  );
}

/** 2 מופעים בקנבס · AdminOrders, MyOrders */
export function Bookmark({ size = 34, color = '#C9C2D2', strokeWidth = 1.4 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
      <Path d="M9 9h6" />
    </Base>
  );
}

/** 2 מופעים בקנבס · Guest, Main */
export function Bowl({ size = 27, color = '#2A2430', strokeWidth = 1.7 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M3.5 12.5h17a8.5 8.5 0 0 1-17 0z" />
      <Path d="M2.5 12.5h19" />
      <Path d="M9 8.5q1.6-1.6 0-3.2M12 7.6q1.6-1.6 0-3.2M15 8.5q1.6-1.6 0-3.2" />
      <Path d="M3 12.5a9 4.5 0 0 1 18 0v3.5a9 4.5 0 0 1-18 0z" />
      <Path d="M7.5 10.6l1.6 2M11.2 10.2l1.6 2M15 10.6l1.6 2" />
      <Path d="M3.5 9.5h17V20h-17z" />
      <Path d="M3.5 9.5L5.5 5h13l2 4.5M12 5v15" />
      <Path d="M9.6 4.6q2.4-1.6 2.4 .9M14.4 4.6q-2.4-1.6-2.4 .9" />
      <Path d="M3 14.5h18a9 9 0 0 1-18 0z" />
      <Circle cx="9" cy="10" r="2.6" />
      <Circle cx="14.6" cy="11" r="2" />
      <Path d="M9 7.4V5.6" />
      <Path d="M7 14a4 4 0 1 1 1.4-7.75 4.3 4.3 0 0 1 7.2 0A4 4 0 1 1 17 14z" />
      <Path d="M7 14v4.5h10V14" />
      <Path d="M7 17h10" />
    </Base>
  );
}

/** מופע אחד בקנבס · Admin */
export function Box3D({ size = 22, color = '#918A9E', strokeWidth = 1.7 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M3 8.5L12 4l9 4.5v7L12 20l-9-4.5z" />
      <Path d="M3 8.5L12 13l9-4.5M12 13v7" />
    </Base>
  );
}

/** מופע אחד בקנבס · AdminStock */
export function Calendar({ size = 32, color = '#C9C2D2', strokeWidth = 1.4 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M4 6h16v14H4z" />
      <Path d="M4 10h16M9 3v4M15 3v4" />
    </Base>
  );
}

/** מופע אחד בקנבס · Profile */
export function Camera({ size = 14, color = '#43307A', strokeWidth = 2 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M4 7h3l1.5-2h7L17 7h3v12H4z" />
      <Circle cx="12" cy="13" r="3.2" />
    </Base>
  );
}

/** מופע אחד בקנבס · AdminShopping */
export function Cart({ size = 34, color = '#C9C2D2', strokeWidth = 1.4 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M5 6h16l-1.6 9H7z" />
      <Path d="M5 6L4 3H2" />
      <Circle cx="9" cy="20" r="1.4" />
      <Circle cx="18" cy="20" r="1.4" />
    </Base>
  );
}

/** 12 מופעים בקנבס · AdminCosts, AdminShopping, AdminStock, Boxes, Chef, Fruit, Login, Order, Profile, Schnitzel */
export function Check({ size = 34, color = '#FFFFFF', strokeWidth = 3 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M5 12.5l4.5 4.5L19 7.5" />
    </Base>
  );
}

/** 7 מופעים בקנבס · Admin, AdminCosts, AdminCustomers, AdminHistory, AdminOrders, MyOrders */
export function ChevronDown({ size = 12, color = '#A79FB2', strokeWidth = 2.4 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M6 9l6 6 6-6" />
    </Base>
  );
}

/** 43 מופעים בקנבס · AdminCosts, AdminDays, Boxes, Chef, Fruit, Main, Order, Profile, Schnitzel */
export function ChevronLeft({ size = 14, color = '#C1BBCB', strokeWidth = 2.4 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M15 18l-6-6 6-6" />
    </Base>
  );
}

/** 39 מופעים בקנבס · AdminBoard, AdminDays, AdminHistory, Boxes, Chef, Fruit, Order, Schnitzel */
export function ChevronRight({ size = 13, color = '#6E6478', strokeWidth = 2.6 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M9 18l6-6-6-6" />
    </Base>
  );
}

/** 3 מופעים בקנבס · AdminCustomers, AdminHistory, AdminShopping */
export function Clock({ size = 13, color = '#4A4254', strokeWidth = 1.9 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Circle cx="12" cy="12" r="8.5" />
      <Path d="M12 7.5V12l3 2" />
    </Base>
  );
}

/** 54 מופעים בקנבס · AdminBoard, AdminCosts, AdminCustomers, AdminOrders, AdminShopping, AdminStock, Boxes, Chef, Fruit, Guest, Order, Profile, Schnitzel */
export function Close({ size = 13, color = '#6E6478', strokeWidth = 2.6 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M6 6l12 12M18 6L6 18" />
    </Base>
  );
}

/** מופע אחד בקנבס · Schnitzel */
export function Copy({ size = 14, color = '#2B4A6E', strokeWidth = 1.9 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M8 8h11v11H8z" />
      <Path d="M16 8V5H5v11h3" />
    </Base>
  );
}

/** מופע אחד בקנבס · AdminCosts */
export function Download({ size = 14, color = '#43307A', strokeWidth = 2.2 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M12 3v11" />
      <Path d="M8 10.5l4 4 4-4" />
      <Path d="M4 18v2h16v-2" />
    </Base>
  );
}

/** מופע אחד בקנבס · AdminCustomers */
export function FileText({ size = 11, color = '#A65E2A', strokeWidth = 2 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M6 3h9l5 5v13H6z" />
      <Path d="M9 12h7M9 16h5" />
    </Base>
  );
}

/** מופע אחד בקנבס · Schnitzel */
export function Gift({ size = 19, color = '#416D9E', strokeWidth = 1.6 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M4 11h16v9H4z" />
      <Path d="M12 11v9M4 11V8h16v3" />
      <Path d="M12 8S9 3.5 7 5.5 12 8 12 8zM12 8s3-4.5 5-2.5S12 8 12 8z" />
    </Base>
  );
}

/** 18 מופעים בקנבס · Admin, AdminCosts, AdminCustomers, AdminDays, AdminHistory, AdminMenu, AdminMoney, AdminOrders, AdminShopping, AdminStock, Boxes, Chef, Fruit, Main, MyOrders, Order, Profile, Schnitzel */
export function Home({ size = 22, color = '#7B5CBC', strokeWidth = 2 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M3 10l9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </Base>
  );
}

/** 16 מופעים בקנבס · Boxes, Chef, Fruit, Guest, Main, Order, Schnitzel */
export function Image({ size = 22, color = 'rgba(122,61,24,0.5)', strokeWidth = 1.4 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M4 5h16v14H4z" />
      <Path d="M4 16l4.5-4.5 3 3 3.5-3.5L20 15" />
      <Circle cx="9" cy="9" r="1.4" />
    </Base>
  );
}

/** מופע אחד בקנבס · Profile */
export function Lock({ size = 17, color = '#43307A', strokeWidth = 1.8 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Rect x="4" y="10" width="16" height="10" rx="2.4" />
      <Path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </Base>
  );
}

/** 2 מופעים בקנבס · MyOrders, Profile */
export function LogIn({ size = 19, color = '#8A8194', strokeWidth = 1.7 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M14 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8" />
      <Path d="M17 15l4-3-4-3" />
      <Path d="M21 12H10" />
    </Base>
  );
}

/** מופע אחד בקנבס · Main */
export function LogOut({ size = 17, color = '#9C7F3F', strokeWidth = 1.8 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M15 17l5-5-5-5" />
      <Path d="M20 12H9" />
      <Path d="M12 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" />
    </Base>
  );
}

/** 5 מופעים בקנבס · Boxes, Chef, Fruit, Order, Schnitzel */
export function Map({ size = 24, color = 'rgba(67,124,89,0.6)', strokeWidth = 1.4 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M9 4L3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4z" />
      <Path d="M9 4v13M15 6.5v13" />
    </Base>
  );
}

/** 2 מופעים בקנבס · Chef, Profile */
export function MapPin({ size = 13, color = '#A85A28', strokeWidth = 1.8 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M12 21s7-6.4 7-11a7 7 0 1 0-14 0c0 4.6 7 11 7 11z" />
      <Circle cx="12" cy="10" r="2.4" />
    </Base>
  );
}

/** 19 מופעים בקנבס · Admin, AdminDays, AdminOrders, AdminStock, Boxes, Chef, Fruit, Order, Schnitzel */
export function Minus({ size = 13, color = '#6E6478', strokeWidth = 2.8 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M5 12h14" />
    </Base>
  );
}

/** 9 מופעים בקנבס · AdminCosts, AdminCustomers, AdminDays, AdminHistory, AdminMenu, AdminMoney, AdminOrders, AdminShopping, AdminStock */
export function Package({ size = 22, color = '#918A9E', strokeWidth = 1.7 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M4 7h16v13H4z" />
      <Path d="M4 11h16M9 7V4h6v3" />
    </Base>
  );
}

/** 2 מופעים בקנבס · Schnitzel */
export function Pencil({ size = 14, color = '#2B4A6E', strokeWidth = 1.9 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M4 20h4L19 9l-4-4L4 16z" />
      <Path d="M14.5 5.5l4 4" />
    </Base>
  );
}

/** 2 מופעים בקנבס · AdminCustomers, AdminOrders */
export function Phone({ size = 13, color = '#4A4254', strokeWidth = 1.9 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a1.5 1.5 0 0 1-1.7 1.5A16.5 16.5 0 0 1 3.5 5.7 1.5 1.5 0 0 1 5 4z" />
    </Base>
  );
}

/** מופע אחד בקנבס · Fruit */
export function PhoneCall({ size = 15, color = '#7A2E4E', strokeWidth = 1.9 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5L17 13l4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 3.5 5.2 2 2 0 0 1 5.5 3z" />
    </Base>
  );
}

/** מופע אחד בקנבס · Schnitzel */
export function Platter({ size = 22, color = '#2A2430', strokeWidth = 1.6 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Ellipse cx="7" cy="9" rx="4" ry="3" />
      <Ellipse cx="16" cy="9" rx="4" ry="3" />
      <Ellipse cx="11.5" cy="16" rx="4" ry="3" />
      <Ellipse cx="12" cy="12" rx="9" ry="6" />
      <Path d="M6 10.5q2-2 3.4 0M11 10q2-2 3.4 0M15.6 10.5q2-2 3.4 0" />
    </Base>
  );
}

/** 26 מופעים בקנבס · Admin, AdminCosts, AdminCustomers, AdminDays, AdminOrders, AdminShopping, AdminStock, Boxes, Chef, Fruit, Order, Schnitzel */
export function Plus({ size = 13, color = '#43307A', strokeWidth = 2.8 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M12 5v14M5 12h14" />
    </Base>
  );
}

/** 19 מופעים בקנבס · Admin, AdminCosts, AdminCustomers, AdminDays, AdminHistory, AdminMenu, AdminMoney, AdminOrders, AdminShopping, AdminStock, Boxes, Chef, Fruit, Main, MyOrders, Order, Profile, Schnitzel */
export function Receipt({ size = 22, color = '#918A9E', strokeWidth = 1.7 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
      <Path d="M9 8h6M9 12h6" />
    </Base>
  );
}

/** מופע אחד בקנבס · MyOrders */
export function Refresh({ size = 13, color = '#43307A', strokeWidth = 2.2 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M3 12a9 9 0 1 0 3-6.7" />
      <Path d="M3 4v5h5" />
    </Base>
  );
}

/** מופע אחד בקנבס · AdminCustomers */
export function Search({ size = 17, color = '#B3ABBD', strokeWidth = 1.9 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Circle cx="11" cy="11" r="7" />
      <Path d="M20 20l-3.6-3.6" />
    </Base>
  );
}

/** 5 מופעים בקנבס · Boxes, Chef, Fruit, Order, Schnitzel */
export function Truck({ size = 21, color = '#8A8194', strokeWidth = 1.7 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M3 7h11v9H3z" />
      <Path d="M14 10h4l3 3v3h-7z" />
      <Circle cx="7" cy="18" r="1.6" />
      <Circle cx="17" cy="18" r="1.6" />
    </Base>
  );
}

/** 2 מופעים בקנבס · Boxes, Chef */
export function Upload({ size = 17, color = '#2C5A3E', strokeWidth = 1.9 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M12 16V5" />
      <Path d="M8 9l4-4 4 4" />
      <Path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </Base>
  );
}

/** 9 מופעים בקנבס · AdminCustomers, Boxes, Chef, Fruit, Main, MyOrders, Order, Profile, Schnitzel */
export function User({ size = 22, color = '#918A9E', strokeWidth = 1.7 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </Base>
  );
}

/** 5 מופעים בקנבס · Admin, Main, MyOrders, Profile */
export function UserCircle({ size = 17, color = '#8A8194', strokeWidth = 1.5 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </Base>
  );
}

/** מופע אחד בקנבס · AdminOrders */
export function UserSmall({ size = 13, color = '#7B5CBC', strokeWidth = 1.9 }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={strokeWidth}>
      <Circle cx="12" cy="8" r="3.6" />
      <Path d="M5 20v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1" />
    </Base>
  );
}

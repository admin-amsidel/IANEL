/*
 * Copyright (c) 2026 IANEL Technologies. All rights reserved.
 * PRODUCTS: edit names, copy, colours and logos here. Everything on the page reads from this list.
 */
export interface Product {
  name: string;
  /** Short category shown on the dial hub and the detail card. */
  tag: string;
  industry: string;
  purpose: string;
  tagline: string;
  desc: string;
  feats: string[];
  /** Accent colour used for the dial slice, buttons and highlights while this product is selected. */
  color: string;
  logo: string;
}

export const PRODUCTS: Product[] = [
  {
    name: 'MARTIQ',
    tag: 'Smart Retail & Supermarket Management',
    industry: 'Retail',
    purpose: 'Manage retail businesses',
    tagline: 'Scan · Sell · Manage · Grow',
    desc: 'An all-in-one retail management platform for supermarket billing, inventory, QR scanning, customer loyalty, promotions and sales analytics. Simplifying every aspect of retail operations.',
    feats: [
      'Fast supermarket billing & POS',
      'Real-time inventory and stock alerts',
      'QR & barcode scanning',
      'Customer loyalty and promotions',
      'Sales analytics and reports',
    ],
    color: '#ea580c',
    logo: 'products/martiq.webp',
  },
  {
    name: 'MOVIQ',
    tag: 'Logistics & Fleet Management',
    industry: 'Logistics',
    purpose: 'Manage transportation',
    tagline: 'Moving Logistics Forward',
    desc: 'A smart logistics platform designed to manage shipments, bookings, packages, fleet operations, GPS tracking, deliveries and transportation workflows with complete operational visibility.',
    feats: [
      'Shipments, bookings and packages',
      'Fleet operations management',
      'Live GPS tracking',
      'Delivery and proof-of-delivery workflows',
      'End-to-end operational visibility',
    ],
    color: '#0284c7',
    logo: 'products/moviq.webp',
  },
  {
    name: 'PEOPIQ',
    tag: 'HR & Workforce Management',
    industry: 'HR',
    purpose: 'Manage people and workforce',
    tagline: 'People · Productivity · Progress',
    desc: 'A comprehensive workforce management solution for employee records, attendance, payroll, leave management, performance tracking and employee self-service. Bringing people and business processes together.',
    feats: [
      'Employee records in one place',
      'Attendance and leave management',
      'Payroll and payslips',
      'Performance tracking',
      'Employee self-service portal',
    ],
    color: '#7c3aed',
    logo: 'products/peopiq.webp',
  },
  {
    name: 'SERVIQ',
    tag: 'Service Marketplace & Management',
    industry: 'Services',
    purpose: 'Manage service operations',
    tagline: 'Connecting Services. Empowering People.',
    desc: 'A digital service marketplace connecting customers with skilled professionals and service providers. Manage service bookings, job assignments, quotations, scheduling, payments and job progress through one platform.',
    feats: [
      'Service bookings and scheduling',
      'Job assignment to professionals',
      'Quotations and payments',
      'Live job progress tracking',
      'Customer and provider marketplace',
    ],
    color: '#1e3a8a',
    logo: 'products/serviq.webp',
  },
];

/**
 * categoryIcons.js
 * ----------------
 * Maps each expense category to a Lucide icon component.
 * Used by the Expenses table, Recent Expenses list, and Add Expense /
 * Receipt Scanner forms so every category has a small, recognizable icon.
 *
 * This is purely a presentation helper - it has no effect on the data
 * sent to or received from the backend.
 */

import {
  UtensilsCrossed,
  ShoppingBasket,
  Bus,
  ShoppingBag,
  GraduationCap,
  ReceiptText,
  HeartPulse,
  Clapperboard,
  MoreHorizontal,
} from "lucide-react";

export const CATEGORY_ICONS = {
  Food: UtensilsCrossed,
  Groceries: ShoppingBasket,
  Transport: Bus,
  Shopping: ShoppingBag,
  Education: GraduationCap,
  Bills: ReceiptText,
  Healthcare: HeartPulse,
  Entertainment: Clapperboard,
  Other: MoreHorizontal,
};

export function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || MoreHorizontal;
}

"use client";

import * as React from "react";
import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { usePathname } from "next/navigation";

const ITEMS_TO_DISPLAY = 3;

export interface BreadCrumbItem {
  href?: string;
  label: string;
}

export function BreadCrumb({ items = [] }: { items: BreadCrumbItem[] }) {
  const pathname = usePathname();
  const filteredItems = items.filter((item) =>
    pathname.startsWith(item.href ?? ""),
  );
  const hasMoreItems = filteredItems.length > ITEMS_TO_DISPLAY;

  let itemsToShow = filteredItems;
  if (hasMoreItems) {
    itemsToShow = [
      filteredItems[0]!,
      { label: "..." },
      ...filteredItems.slice(-ITEMS_TO_DISPLAY + 1),
    ];
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {itemsToShow.map((item, index) => (
          <React.Fragment key={index}>
            <BreadcrumbItem>
              {item.href ? (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {index < itemsToShow.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

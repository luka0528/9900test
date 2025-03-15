"use client"

import * as React from "react"
import Link from "next/link"

import { useMediaQuery } from "~/hooks/use-media-query"
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb"
import { Button } from "~/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { usePathname } from "next/navigation"


const ITEMS_TO_DISPLAY = 3

export interface breadCrumbItem {
    href?: string;
    label: string;
}

export interface BreadCrumbProps {
    breadCrumbItems: breadCrumbItem[];
}

export function BreadCrumb(items: BreadCrumbProps) {
    const pathname = usePathname();
    const filteredItems = items.breadCrumbItems.filter(item => pathname.startsWith(item.href ?? ""));

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {filteredItems.map((item, index) => (
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
            {index < filteredItems.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

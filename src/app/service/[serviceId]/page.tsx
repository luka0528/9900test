"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Pencil, ChevronDown, Heart, HeartOff } from "lucide-react";

export default function ServicePage() {
  const [isSaved, setIsSaved] = useState(false);

  // Admin only
  const isAdmin = true;

  // Example versions data
  const versions = [
    { id: "v1.0", name: "Version 1.0" },
    { id: "v1.1", name: "Version 1.1" },
    { id: "v2.0", name: "Version 2.0" },
    { id: "v2.1", name: "Version 2.1 (Current)" },
  ];

  return (
    <div className="flex h-full w-full xl:max-w-[96rem]">
      <div className="h-full w-48 border-r">SideBar</div>
      <div className="flex h-full grow flex-col">
        <div className="border-b p-4">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Lorem Ipsum </h1>
            <div className="flex items-center gap-2">
              <Button>Support</Button>
              <Button size="icon" onClick={() => setIsSaved(!isSaved)}>
                {isSaved ? <HeartOff /> : <Heart />}
              </Button>
              <Button variant="outline">
                Edit <Pencil />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    Version <ChevronDown className="text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {versions.map((version) => (
                    <DropdownMenuItem
                      key={version.id}
                      onClick={() =>
                        console.log(`Selected version: ${version.id}`)
                      }
                    >
                      {version.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <p className="mb-4">
            "Neque porro quisquam est qui dolorem ipsum quia dolor sit amet,
            consectetur, adipisci velit..."
          </p>
        </div>

        <div className="flex-grow p-4">
          <h2 className="mb-4 text-xl font-semibold">What is Lorem Ipsum?</h2>
          <p className="mb-4">
            Lorem Ipsum is simply dummy text of the printing and typesetting
            industry. Lorem Ipsum has been the industry's standard dummy text
            ever since the 1500s, when an unknown printer took a galley of type
            and scrambled it to make a type specimen book. It has survived not
            only five centuries, but also the leap into electronic typesetting,
            remaining essentially unchanged. It was popularised in the 1960s
            with the release of Letraset sheets containing Lorem Ipsum passages,
            and more recently with desktop publishing software like Aldus
            PageMaker including versions of Lorem Ipsum.
          </p>

          <h2 className="mb-4 text-xl font-semibold">
            Where does it come from?
          </h2>
          <p className="mb-4">
            Contrary to popular belief, Lorem Ipsum is not simply random text.
            It has roots in a piece of classical Latin literature from 45 BC,
            making it over 2000 years old. Richard McClintock, a Latin professor
            at Hampden-Sydney College in Virginia, looked up one of the more
            obscure Latin words, consectetur, from a Lorem Ipsum passage, and
            going through the cites of the word in classical literature,
            discovered the undoubtable source. Lorem Ipsum comes from sections
            1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes
            of Good and Evil) by Cicero, written in 45 BC. This book is a
            treatise on the theory of ethics, very popular during the
            Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit
            amet..", comes from a line in section 1.10.32.
          </p>

          <h2 className="mb-4 text-xl font-semibold">Code Table</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr>
                  <th
                    colSpan={2}
                    className="border bg-gray-100 px-4 py-2 text-left"
                  >
                    Methods
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 10 }).map((_, index) => (
                  <tr key={index}>
                    <td className="w-1/4 border px-4 py-2">Code {index + 1}</td>
                    <td className="w-3/4 border px-4 py-2">
                      Description {index + 1}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

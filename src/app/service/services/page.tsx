"use client";

import { useSession } from "next-auth/react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Separator } from "~/components/ui/separator";
import { Upload, UserPen } from "lucide-react";

import { AllServiceSidebar } from "../../../components/service/AllServiceSidebar";

export default function ServicesPage() {
  const { data: session } = useSession();

  // Dummy Data
  const services = [
    {
      id: 1,
      creatorId: "cm89i5ruw00005u9yqhg8hl03",
      name: "Service 1",
      versions: [
        {
          vid: "v0.0",
          name: "Version 0.0",
          description:
            "starting with 0.0, this is the first version of the service",
          details: [
            {
              title: "What is Lorem Ipsum?",
              content: "nothing here yet",
            },
          ],
          tags: ["meow"],
        },
        {
          vid: "v1.0",
          name: "Version 1.0",
          description:
            "Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit...",
          details: [
            {
              title: "What is Lorem Ipsum?",
              content:
                "Lorem ipsum odor amet, consectetuer adipiscing elit. Dui posuere adipiscing natoque parturient dapibus nunc orci mollis laoreet. Dolor risus sociosqu blandit tortor iaculis condimentum imperdiet. Dolor non fermentum curabitur maecenas consequat. Maecenas sollicitudin neque id pharetra fames risus turpis. Felis luctus hac habitant; conubia viverra et. Facilisis tincidunt sodales donec ultricies vehicula dapibus tristique. Finibus congue tristique sodales donec conubia. Mattis vehicula feugiat morbi sodales sit urna.",
            },
            {
              title: "Where does it come from?",
              content:
                "Ad iaculis lectus senectus sapien nisl sem. Purus posuere montes rutrum dis; aptent consectetur molestie! Condimentum himenaeos nascetur bibendum nisl, odio ornare donec ullamcorper condimentum. Dictumst gravida aptent faucibus placerat vulputate taciti montes montes. Convallis ac sit nulla accumsan posuere vulputate nunc maecenas mollis. Rutrum curabitur euismod sagittis fusce at eros.",
            },
            {
              title: "Code Table",
              content: "Code Table Content",
              table: [
                { code: "Code 1", description: "Description 1" },
                { code: "Code 2", description: "Description 2" },
                { code: "Code 3", description: "Description 3" },
              ],
            },
          ],
          tags: ["meow", "woof", "fish"],
        },
        {
          vid: "v1.1",
          name: "Version 1.1 (latest)",
          description:
            "Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit...",
          details: [
            {
              title: "What is Lorem Ipsum?",
              content:
                "Lorem ipsum odor amet, consectetuer adipiscing elit. Dui posuere adipiscing natoque parturient dapibus nunc orci mollis laoreet. Dolor risus sociosqu blandit tortor iaculis condimentum imperdiet. Dolor non fermentum curabitur maecenas consequat. Maecenas sollicitudin neque id pharetra fames risus turpis. Felis luctus hac habitant; conubia viverra et. Facilisis tincidunt sodales donec ultricies vehicula dapibus tristique. Finibus congue tristique sodales donec conubia. Mattis vehicula feugiat morbi sodales sit urna.",
            },
            {
              title: "Where does it come from?",
              content:
                "Ad iaculis lectus senectus sapien nisl sem. Purus posuere montes rutrum dis; aptent consectetur molestie! Condimentum himenaeos nascetur bibendum nisl, odio ornare donec ullamcorper condimentum. Dictumst gravida aptent faucibus placerat vulputate taciti montes montes. Convallis ac sit nulla accumsan posuere vulputate nunc maecenas mollis. Rutrum curabitur euismod sagittis fusce at eros.",
            },
            {
              title: "Code Table",
              content: "Code Table Content",
              table: [
                { code: "Code 1", description: "Description 1" },
                { code: "Code 2", description: "Description 2" },
                { code: "Code 3", description: "Description 3" },
              ],
            },
            {
              title: "Where does it come from?",
              content:
                "Ad iaculis lectus senectus sapien nisl sem. Purus posuere montes rutrum dis; aptent consectetur molestie! Condimentum himenaeos nascetur bibendum nisl, odio ornare donec ullamcorper condimentum. Dictumst gravida aptent faucibus placerat vulputate taciti montes montes. Convallis ac sit nulla accumsan posuere vulputate nunc maecenas mollis. Rutrum curabitur euismod sagittis fusce at eros.",
            },
            {
              title: "Code Table 2",
              content: "Code Table Content",
              table: [
                { code: "Code 4", description: "Description 4" },
                { code: "Code 5", description: "Description 5" },
                { code: "Code 6", description: "Description 6" },
              ],
            },
          ],
          tags: ["meow", "woof", "fish", "glizzy"],
        },
      ],
    },
    {
      id: 2,
      creatorId: "cm8851knr0000irdvgesgj94r",
      name: "Service 2",
      versions: [
        {
          vid: "v0.0",
          name: "Version 0.0",
          description:
            "starting with 0.0, this is the first version of the service",
          details: [
            {
              title: "What is Lorem Ipsum?",
              content: "nothing here yet",
            },
          ],
          tags: ["meow"],
        },
      ],
    },
  ];

  return (
    <div className="flex h-full w-full xl:max-w-[96rem]">
      <AllServiceSidebar />
      <div className="flex h-full grow flex-col">
        <div className="flex min-h-[5rem] items-center justify-between p-4">
          <h1 className="text-2xl font-bold">Your Services</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-2">Add Service</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <a href="/service/add-service" className="w-full">
                <DropdownMenuItem key={"manual"}>
                  <UserPen />
                  Manual Input
                </DropdownMenuItem>
              </a>
              <DropdownMenuItem key={"automatic"}>
                <Upload />
                Automatic Extraction
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator className="my-4" />

        <div>CONTENT HERE</div>
      </div>
    </div>
  );
}

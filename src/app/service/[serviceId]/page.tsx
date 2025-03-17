"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Pencil, ChevronDown, Heart, HeartOff } from "lucide-react";

import { ServiceSidebar } from "../ServiceSidebar";

export default function ServicePage() {
  const { data: session } = useSession();
  const { serviceId } = useParams();

  const [isSaved, setIsSaved] = useState(false);

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

  // State to track seletected version
  const [selectedVersion, setSelectedVersion] = useState(
    services[0]?.versions[0],
  );

  const service = services.find((s) => s.id === parseInt(serviceId as string));
  const versions = service?.versions || [];

  useEffect(() => {
    if (versions.length > 0) {
      setSelectedVersion(versions[versions.length - 1]);
    }
  }, []);

  const handleVersionSelect = (version: any) => {
    setSelectedVersion(version);
  };

  return (
    <div className="flex h-full w-full xl:max-w-[96rem]">
      <ServiceSidebar></ServiceSidebar>
      <div className="flex h-full grow flex-col">
        <div className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">{service?.name}</h1>
            <div className="flex items-center gap-2">
              <Button>Support</Button>
              <Button size="icon" onClick={() => setIsSaved(!isSaved)}>
                {isSaved ? <HeartOff /> : <Heart />}
              </Button>
              {session && session.user.id === service?.creatorId && (
                <Button variant="outline">
                  Edit <Pencil />
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    {selectedVersion?.name}{" "}
                    <ChevronDown className="text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {versions.map((version) => (
                    <DropdownMenuItem
                      key={version.vid}
                      onClick={() => handleVersionSelect(version)}
                    >
                      {version.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mb-8 flex items-center gap-2">
            {selectedVersion?.tags.map((tag: string) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>

          <p className="mb-4">{selectedVersion?.description}</p>
        </div>

        <div className="flex-grow p-4">
          {selectedVersion?.details.map((detail: any, index: number) => (
            <div key={index} className="mb-12">
              <h2 className="mb-4 text-xl font-semibold">{detail.title}</h2>

              {detail.table ? (
                <div className="overflow-x-auto">
                  <p className="mb-4">{detail.content}</p>
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
                      {detail.table.map((row: any, idx: number) => (
                        <tr key={idx}>
                          <td className="w-1/4 border px-4 py-2">
                            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                              {row.code}
                            </code>
                          </td>
                          <td className="w-3/4 border px-4 py-2">
                            {row.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mb-4">{detail.content}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

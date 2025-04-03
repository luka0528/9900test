import { type RouterOutputs } from "~/trpc/react";
import { ChangelogPoint } from "./ChangelogPoint";
import { Separator } from "~/components/ui/separator";

type ChangelogSectionProps = {
  changelogData: RouterOutputs["service"]["getAllVersionChangelogs"];
};
export function ChangelogSection({ changelogData }: ChangelogSectionProps) {
  if (!changelogData)
    return (
      <div className="mt-6">
        <p className="text-muted-foreground">No changelog data found</p>
      </div>
    );

  return (
    <div className="mt-6 flex flex-col gap-6">
      {changelogData.versions.map((version) => (
        <div key={version.version}>
          <div className="mb-6 flex flex-col gap-4">
            <h2 className="text-lg font-bold">Version {version.version}</h2>
            <div className="flex flex-col gap-2">
              {version.changelogPoints.map((changelogPoint) => (
                <ChangelogPoint
                  key={changelogPoint.id}
                  changelogPoint={changelogPoint}
                />
              ))}
              {version.changelogPoints.length === 0 && (
                <p className="text-muted-foreground">
                  No changes recorded for this version
                </p>
              )}
            </div>
          </div>
          <Separator />
        </div>
      ))}
    </div>
  );
}

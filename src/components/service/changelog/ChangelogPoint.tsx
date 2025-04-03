import { ChangeLogPointType } from "@prisma/client";
import { type VariantProps } from "class-variance-authority";
import { Badge } from "~/components/ui/badge";
import { type badgeVariants } from "~/components/ui/badge";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

type ChangelogPointProps = {
  changelogPoint: {
    type: ChangeLogPointType;
    description: string;
    id: string;
    createdAt: Date;
    versionId: string;
  };
};

const badgeVariantMap: Record<ChangeLogPointType, BadgeVariant> = {
  [ChangeLogPointType.ADDED]: "added",
  [ChangeLogPointType.CHANGED]: "changed",
  [ChangeLogPointType.DEPRECATED]: "deprecated",
  [ChangeLogPointType.REMOVED]: "removed",
  [ChangeLogPointType.FIXED]: "fixed",
  [ChangeLogPointType.SECURITY]: "security",
} as const;

export function ChangelogPoint({ changelogPoint }: ChangelogPointProps) {
  return (
    <div className="flex gap-2">
      <Badge variant={badgeVariantMap[changelogPoint.type]}>
        {changelogPoint.type}
      </Badge>
      <p className="text-muted-foreground">{changelogPoint.description}</p>
    </div>
  );
}

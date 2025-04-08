import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "~/components/ui/dropdown-menu";
import { EllipsisVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useState } from "react";
import { EditReviewModal } from "./EditReviewModal";

interface props1 {
  originalRating: number | null;
  originalContent: string | null;
  reviewId: string | null;
  replyId: string | null;
}
// pass in either state for review or reply

export default function OptionsDropdown({
  originalRating,
  originalContent,
  reviewId,
  replyId,
}: props1) {
  const [editModalOpen, setEditModalOpen] = useState(false);

  return (
    <DropdownMenu>
      {editModalOpen && (
        <EditReviewModal
          originalRating={originalRating}
          originalContent={originalContent}
          isModalOpen={editModalOpen}
          setModalOpen={setEditModalOpen}
          reviewId={reviewId}
          replyId={replyId}
        />
      )}
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="flex justify-between"
            onClick={() => setEditModalOpen(true)}
          >
            <span>Edit</span>
            <Pencil />
          </DropdownMenuItem>
          <DropdownMenuItem className="group flex justify-between hover:text-red-500">
            <span className="group-hover:text-red-500">Delete</span>
            <Trash2 className="group-hover:text-red-500" />
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

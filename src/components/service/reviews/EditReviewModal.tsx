import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import StarRating from "./StarRating";
import { useEffect, useRef, useState } from "react";
import { Textarea } from "~/components/ui/textarea";

interface props {
  originalRating: number | null;
  originalContent: string | null;
  isModalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  reviewId: string | null;
  replyId: string | null;
}

export function EditReviewModal({
  originalRating,
  originalContent,
  isModalOpen,
  setModalOpen,
  reviewId,
  replyId,
}: props) {
  const [selectedRating, setSelectedRating] = useState(
    originalRating ? originalRating : 0,
  );
  const [hoveredRating, setHoveredRating] = useState(0);
  const [inputType, setInputType] = useState(!reviewId ? "reply" : "review");

  const textAreaRef = useRef(null);

  const handleSubmit = () => {
    if (inputType === "review") {
      // handle editing review
    } else {
      // handle editing reply
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader onClick={() => setModalOpen(false)}>
          <DialogTitle>Edit {inputType}</DialogTitle>
          <DialogDescription>
            Make changes to your {inputType} here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {inputType === "review" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <StarRating
                hoveredRating={hoveredRating}
                setHoveredRating={setHoveredRating}
                selectedRating={selectedRating}
                setSelectedRating={setSelectedRating}
              />
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Textarea
              className="col-span-full"
              placeholder={`Edit ${inputType} text (optional)`}
              defaultValue={originalContent || ""}
              ref={textAreaRef} // Assigning ref to the textarea
            />
          </div>
        </div>
        <DialogFooter>
          {/* TODO - add onclick behavior */}
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

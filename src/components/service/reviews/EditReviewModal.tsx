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
import type { setUpdateReviewType } from "./helper";

interface props {
  originalRating: number | null;
  originalContent: string | null;
  isModalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  reviewId: string | null;
  replyId: string | null;
  setUpdatedPost: setUpdateReviewType;
}

export function EditReviewModal({
  originalRating,
  originalContent,
  isModalOpen,
  setModalOpen,
  reviewId,
  replyId,
  setUpdatedPost,
}: props) {
  const [selectedRating, setSelectedRating] = useState(originalRating ?? 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [inputType, setInputType] = useState(!reviewId ? "reply" : "review");

  useEffect(() => {
    if (!reviewId) {
      setInputType("reply");
    } else {
      setInputType("review");
    }
  }, [reviewId]);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (inputType === "review") {
      // handle editing review
      setUpdatedPost({
        ready: true,
        isUpdateDelete: false,
        updatedContent: textAreaRef.current ? textAreaRef.current.value : "",
        updatedRating: selectedRating,
        id: reviewId,
      });
    } else {
      // handle editing reply
      setUpdatedPost({
        ready: true,
        isUpdateDelete: false,
        updatedContent: textAreaRef.current ? textAreaRef.current.value : "",
        updatedRating: null,
        id: replyId,
      });
    }
    setModalOpen(false);
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader onClick={() => setModalOpen(false)}>
          <DialogTitle>Edit {inputType}</DialogTitle>
          <DialogDescription>
            Make changes to your {inputType} here. Click save when you&apos;re
            done.
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
              defaultValue={originalContent ?? ""}
              ref={textAreaRef} // Assigning ref to the textarea
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

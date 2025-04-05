import { Pencil } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import StarRating from "./StarRating";
import { useState } from "react";
import { Textarea } from "~/components/ui/textarea";

interface prop {
  setEditModalOpen: (open: boolean) => void;
}

export function EditReviewModal({ setEditModalOpen }: prop) {
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Pencil />
          Edit review
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit review</DialogTitle>
          <DialogDescription>
            Make changes to your review here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <StarRating
              hoveredRating={hoveredRating}
              setHoveredRating={setHoveredRating}
              selectedRating={selectedRating}
              setSelectedRating={setSelectedRating}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Textarea
              className="col-span-full"
              placeholder="Edit review text (optional)"
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
